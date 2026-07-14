// src/routes/alerts.ts
// Rate alert subscription endpoints (Phase 7).
//
//   POST /api/v1/alerts/subscribe    — create a new rate alert
//   GET  /api/v1/alerts/unsubscribe  — one-click email unsubscribe
//   GET  /api/v1/alerts/stats        — admin: total + by-pair breakdown
//   GET  /api/v1/alerts/active       — admin: list all active alerts

import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { ok, err } from "../lib/responses";

type Bindings = { DB: D1Database; RESEND_API_KEY?: string; ALERT_FROM_EMAIL?: string };
const alerts = new Hono<{ Bindings: Bindings }>();

interface RateAlertRow {
  id: string;
  email: string;
  from_code: string;
  to_code: string;
  direction: "above" | "below";
  threshold: number;
  reference_rate: number | null;
  active: number;
  last_rate: number | null;
  last_checked: number | null;
  last_triggered: number | null;
  trigger_count: number;
  unsubscribe_token: string;
  ip_hash: string | null;
  user_agent: string | null;
  locale: string | null;
  created_at: number;
  updated_at: number;
}

function shapeAlert(r: RateAlertRow) {
  return {
    id: r.id,
    email: r.email,
    pair: `${r.from_code}→${r.to_code}`,
    direction: r.direction,
    threshold: r.threshold,
    referenceRate: r.reference_rate,
    active: r.active === 1,
    lastRate: r.last_rate,
    lastChecked: r.last_checked,
    lastTriggered: r.last_triggered,
    triggerCount: r.trigger_count,
    createdAt: r.created_at,
  };
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function isValidCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── POST /api/v1/alerts/subscribe ──────────────────────────
alerts.post("/subscribe", async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { email, from, to, direction, threshold, locale } = body as {
    email?: string;
    from?: string;
    to?: string;
    direction?: "above" | "below";
    threshold?: number;
    locale?: string;
  };

  if (!email || !isValidEmail(email)) {
    return err(c, "invalid_email", "Please provide a valid email address", 400);
  }
  if (!from || !isValidCode(from.toUpperCase())) {
    return err(c, "invalid_from", "from must be a 3-letter currency code", 400);
  }
  if (!to || !isValidCode(to.toUpperCase())) {
    return err(c, "invalid_to", "to must be a 3-letter currency code", 400);
  }
  if (from.toUpperCase() === to.toUpperCase()) {
    return err(c, "same_currency", "from and to must be different currencies", 400);
  }
  if (direction !== "above" && direction !== "below") {
    return err(c, "invalid_direction", "direction must be 'above' or 'below'", 400);
  }
  if (typeof threshold !== "number" || threshold <= 0 || !isFinite(threshold)) {
    return err(c, "invalid_threshold", "threshold must be a positive number", 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const id = uuid();
  const token = uuid();
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  const ipHash = ip ? await sha256(ip + "rate_alerts_salt_v1") : null;
  const ua = c.req.header("user-agent") || null;

  // Soft dedup: same email + pair + direction + threshold in last 5 min
  const fiveMinAgo = now - 300;
  const existing = await c.env.DB.prepare(
    `SELECT * FROM rate_alerts
     WHERE email = ? AND from_code = ? AND to_code = ?
       AND direction = ? AND ABS(threshold - ?) < 0.0001
       AND created_at > ?
     ORDER BY created_at DESC LIMIT 1`
  ).bind(email.toLowerCase(), fromCode, toCode, direction, threshold, fiveMinAgo).first<RateAlertRow>();

  if (existing) {
    return ok(c, {
      alert: shapeAlert(existing),
      deduped: true,
      message: "You already have an active alert with the same settings.",
    });
  }

  await c.env.DB.prepare(
    `INSERT INTO rate_alerts
     (id, email, from_code, to_code, direction, threshold,
      active, trigger_count, unsubscribe_token, ip_hash, user_agent, locale,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    email.toLowerCase(),
    fromCode,
    toCode,
    direction,
    threshold,
    token,
    ipHash,
    ua,
    locale || null,
    now,
    now
  ).run();

  const row = await c.env.DB.prepare(`SELECT * FROM rate_alerts WHERE id = ?`).bind(id).first<RateAlertRow>();

  return ok(c, {
    alert: shapeAlert(row!),
    deduped: false,
    unsubscribeUrl: `/api/v1/alerts/unsubscribe?token=${token}`,
    message: `You'll get an email when 1 ${fromCode} crosses ${direction === "above" ? "above" : "below"} ${threshold} ${toCode}.`,
  }, 201);
});

// ── GET /api/v1/alerts/unsubscribe ────────────────────────
alerts.get("/unsubscribe", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return err(c, "missing_token", "token query parameter required", 400);
  }

  const row = await c.env.DB.prepare(
    `SELECT * FROM rate_alerts WHERE unsubscribe_token = ?`
  ).bind(token).first<RateAlertRow>();

  if (!row) {
    return err(c, "not_found", "Alert not found or already unsubscribed", 404);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `UPDATE rate_alerts SET active = 0, updated_at = ? WHERE id = ?`
  ).bind(now, row.id).run();

  const accept = c.req.header("accept") || "";
  if (accept.includes("text/html")) {
    return c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Unsubscribed · TimeAndDatePro</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 24px; text-align: center; color: #0d111a; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    p { color: #6e7686; line-height: 1.6; }
    a { color: #7257d5; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <h1>✓ Unsubscribed</h1>
  <p>Your alert for <strong>${row.from_code} → ${row.to_code}</strong> is now off.</p>
  <p style="margin-top: 24px;"><a href="/today">← Back to Today</a> · <a href="/currency">Open full dashboard</a></p>
</body>
</html>`);
  }

  return ok(c, {
    unsubscribed: true,
    pair: `${row.from_code}→${row.to_code}`,
    message: "Your rate alert has been cancelled.",
  });
});

// ── GET /api/v1/alerts/stats ──────────────────────────────
alerts.get("/stats", async (c) => {
  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM rate_alerts`
  ).first<{ c: number }>();

  const active = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM rate_alerts WHERE active = 1`
  ).first<{ c: number }>();

  const triggered = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM rate_alerts WHERE trigger_count > 0`
  ).first<{ c: number }>();

  const byPair = await c.env.DB.prepare(
    `SELECT from_code || '→' || to_code as pair, COUNT(*) as count
     FROM rate_alerts WHERE active = 1
     GROUP BY pair ORDER BY count DESC LIMIT 20`
  ).all<{ pair: string; count: number }>();

  return ok(c, {
    total: total?.c ?? 0,
    active: active?.c ?? 0,
    triggered: triggered?.c ?? 0,
    topPairs: byPair.results ?? [],
  });
});

// ── GET /api/v1/alerts/active ─────────────────────────────
alerts.get("/active", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "100", 10), 500);
  const rows = await c.env.DB.prepare(
    `SELECT * FROM rate_alerts WHERE active = 1
     ORDER BY created_at DESC LIMIT ?`
  ).bind(limit).all<RateAlertRow>();

  return ok(c, {
    count: rows.results?.length ?? 0,
    alerts: (rows.results ?? []).map(shapeAlert),
  });
});

export { alerts as alertsRouter };
