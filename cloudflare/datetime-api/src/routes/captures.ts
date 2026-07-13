// src/routes/captures.ts
// Generic user-capture endpoint backed by D1 (Phase 6 — thin API).
//
//   POST /api/v1/captures — record a user action (FAB feedback,
//                          bulk convert request, translate interest,
//                          suggestion, etc.)
//
//   GET  /api/v1/captures/recent — recent captures (admin only).
//
// Used by the Date to Words FAB feedback popover (suggestion/bug/praise),
// the bulk convert form, and the "I'm interested in {language}" capture.
// Previously dumped to localStorage; now persists to D1 so we can
// review and respond.

import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { ok, err } from "../lib/responses";

type Bindings = { DB: D1Database };
const captures = new Hono<{ Bindings: Bindings }>();

interface CaptureRow {
  id: number;
  type: string;
  payload: string | null;
  page: string | null;
  tool: string | null;
  email: string | null;
  country_code: string | null;
  created_at: number;
}

const ALLOWED_TYPES = new Set([
  "feedback",         // FAB feedback popover (suggestion / bug / praise)
  "bulk_convert",     // bulk date conversion request
  "translate",        // "translate this date to {language}" request
  "suggestion",       // feature suggestion
  "praise",           // positive feedback
  "bug",              // bug report
  "interest",         // interest in a future feature (e.g. locale)
  "waitlist",         // waitlist signup
]);

function shapeCapture(r: CaptureRow) {
  return {
    id: r.id,
    type: r.type,
    payload: r.payload ? safeParse(r.payload) : null,
    page: r.page,
    tool: r.tool,
    email: r.email,
    countryCode: r.country_code,
    createdAt: new Date(r.created_at * 1000).toISOString(),
  };
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** POST /api/v1/captures — record a user action. */
captures.post("/", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return err(c, 400, "Invalid JSON body", "invalid_json");
  }
  const type = typeof body?.type === "string" ? body.type : "";
  if (!ALLOWED_TYPES.has(type)) {
    return err(c, 400, `type must be one of: ${[...ALLOWED_TYPES].join(", ")}`, "invalid_type");
  }
  const payload = body?.payload !== undefined ? JSON.stringify(body.payload).slice(0, 8000) : null;
  const page = typeof body?.page === "string" ? body.page.slice(0, 200) : null;
  const tool = typeof body?.tool === "string" ? body.tool.slice(0, 50) : null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : null;
  const countryCode = typeof body?.countryCode === "string" ? body.countryCode.toUpperCase().slice(0, 2) : null;
  if (email && !isValidEmail(email)) {
    return err(c, 400, "Invalid email format", "invalid_email");
  }
  const now = Math.floor(Date.now() / 1000);
  const result = await c.env.DB.prepare(
    `INSERT INTO captures (type, payload, page, tool, email, country_code, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     RETURNING *`,
  ).bind(type, payload, page, tool, email, countryCode, now).first<CaptureRow>();
  if (!result) return err(c, 500, "Failed to insert capture", "insert_failed");
  return ok(c, shapeCapture(result), "/api/v1/captures");
});

/** GET /api/v1/captures/recent — recent captures (admin only). */
captures.get("/recent", async (c) => {
  const type = c.req.query("type");
  const tool = c.req.query("tool");
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  let sql = `SELECT * FROM captures WHERE 1=1`;
  const params: any[] = [];
  if (type) { sql += ` AND type = ?${params.length + 1}`; params.push(type); }
  if (tool) { sql += ` AND tool = ?${params.length + 1}`; params.push(tool); }
  sql += ` ORDER BY created_at DESC LIMIT ?${params.length + 1}`;
  params.push(limit);
  const result = await c.env.DB.prepare(sql).bind(...params).all<CaptureRow>();
  const list = (result.results || []).map(shapeCapture);
  return ok(c, { count: list.length, captures: list });
});

/** GET /api/v1/captures/stats — capture counts by type. */
captures.get("/stats", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT type, COUNT(*) as count FROM captures GROUP BY type ORDER BY count DESC`,
  ).all<{ type: string; count: number }>();
  const stats: Record<string, number> = {};
  for (const row of result.results || []) {
    stats[row.type] = row.count;
  }
  return ok(c, { total: Object.values(stats).reduce((a, b) => a + b, 0), byType: stats });
});

export { captures as capturesRouter };
