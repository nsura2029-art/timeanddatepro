// src/routes/waitlist.ts
// Translation waitlist endpoints backed by D1 (Phase 6 — thin API).
//
//   POST /api/v1/waitlist         — add email to translation waitlist
//   GET  /api/v1/waitlist/count   — get total signups (for the "1,247" counter)
//
// Used by the Date to Words tool's "Get notified when {language}
// translations are live" capture form. Previously dumped to
// localStorage; now persists to D1 so the count is real.

import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { ok, err } from "../lib/responses";

type Bindings = { DB: D1Database };
const waitlist = new Hono<{ Bindings: Bindings }>();

interface WaitlistRow {
  id: number;
  email: string;
  locale: string;
  language: string | null;
  tool: string | null;
  format: string | null;
  date: string | null;
  source: string | null;
  created_at: number;
}

function shapeWaitlist(r: WaitlistRow) {
  return {
    id: r.id,
    email: r.email,
    locale: r.locale,
    language: r.language,
    tool: r.tool,
    format: r.format,
    date: r.date,
    source: r.source,
    createdAt: new Date(r.created_at * 1000).toISOString(),
  };
}

function isValidEmail(email: string): boolean {
  // Pragmatic email check — not RFC 5322, but catches obvious typos
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** POST /api/v1/waitlist — add to waitlist. */
waitlist.post("/", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return err(c, 400, "Invalid JSON body", "invalid_json");
  }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const locale = typeof body?.locale === "string" ? body.locale.slice(0, 10) : "";
  const language = typeof body?.language === "string" ? body.language.slice(0, 50) : null;
  const tool = typeof body?.tool === "string" ? body.tool.slice(0, 50) : null;
  const format = typeof body?.format === "string" ? body.format.slice(0, 30) : null;
  const date = typeof body?.date === "string" ? body.date.slice(0, 30) : null;
  const source = typeof body?.source === "string" ? body.source.slice(0, 50) : null;
  if (!isValidEmail(email)) {
    return err(c, 400, "Valid email required", "invalid_email");
  }
  if (!locale) {
    return err(c, 400, "locale required", "invalid_locale");
  }
  const now = Math.floor(Date.now() / 1000);
  // Idempotent insert: if (email, locale, tool, format) already exists,
  // return the existing row. Otherwise insert.
  const existing = await c.env.DB.prepare(
    `SELECT * FROM waitlist WHERE email = ?1 AND locale = ?2 AND IFNULL(tool,'') = IFNULL(?3,'') AND IFNULL(format,'') = IFNULL(?4,'') LIMIT 1`,
  ).bind(email, locale, tool, format).first<WaitlistRow>();
  if (existing) {
    return ok(c, { ...shapeWaitlist(existing), duplicate: true }, "/api/v1/waitlist");
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO waitlist (email, locale, language, tool, format, date, source, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     RETURNING *`,
  ).bind(email, locale, language, tool, format, date, source, now).first<WaitlistRow>();
  if (!result) return err(c, 500, "Failed to insert waitlist signup", "insert_failed");
  return ok(c, { ...shapeWaitlist(result), duplicate: false }, "/api/v1/waitlist");
});

/** GET /api/v1/waitlist/count — total signups. */
waitlist.get("/count", async (c) => {
  const tool = c.req.query("tool");
  const locale = c.req.query("locale");
  let sql = `SELECT COUNT(*) as total FROM waitlist WHERE 1=1`;
  const params: any[] = [];
  if (tool) { sql += ` AND tool = ?${params.length + 1}`; params.push(tool); }
  if (locale) { sql += ` AND locale = ?${params.length + 1}`; params.push(locale); }
  const result = await c.env.DB.prepare(sql).bind(...params).first<{ total: number }>();
  return ok(c, {
    total: result?.total ?? 0,
    tool: tool ?? null,
    locale: locale ?? null,
  });
});

/** GET /api/v1/waitlist/recent — recent signups (admin only, for now no auth). */
waitlist.get("/recent", async (c) => {
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10) || 20));
  const result = await c.env.DB.prepare(
    `SELECT * FROM waitlist ORDER BY created_at DESC LIMIT ?1`,
  ).bind(limit).all<WaitlistRow>();
  const list = (result.results || []).map(shapeWaitlist);
  return ok(c, { count: list.length, signups: list });
});

export { waitlist as waitlistRouter };
