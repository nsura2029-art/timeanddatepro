import type { D1Database } from "@cloudflare/workers-types";
// src/routes/feedback.ts
// Feedback CRUD backed by D1 (Phase 5.8).

import { Hono } from "hono";
import { ok, err, requireString } from "../lib/responses";

type Bindings = { DB: D1Database };
const feedback = new Hono<{ Bindings: Bindings }>();

interface FeedbackRow {
  id: number;
  type: string;
  title: string;
  body: string;
  author: string | null;
  country_code: string | null;
  status: string;
  votes: number;
  created_at: number;
  updated_at: number;
}

function shapeFeedback(r: FeedbackRow) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    author: r.author,
    countryCode: r.country_code,
    status: r.status,
    votes: r.votes,
    createdAt: new Date(r.created_at * 1000).toISOString(),
    updatedAt: new Date(r.updated_at * 1000).toISOString(),
  };
}

/** GET /api/v1/feedback — list all feedback (paginated). */
feedback.get("/", async (c) => {
  const type = c.req.query("type");
  const status = c.req.query("status");
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10) || 20));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10) || 0);
  let sql = `SELECT * FROM feedback WHERE 1=1`;
  const params: any[] = [];
  if (type) { sql += ` AND type = ?${params.length + 1}`; params.push(type); }
  if (status) { sql += ` AND status = ?${params.length + 1}`; params.push(status); }
  sql += ` ORDER BY votes DESC, created_at DESC LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`;
  params.push(limit, offset);
  const result = await c.env.DB.prepare(sql).bind(...params).all<FeedbackRow>();
  const list = (result.results || []).map(shapeFeedback);
  return ok(c, { count: list.length, limit, offset, feedback: list });
});

/** GET /api/v1/feedback/top — top-voted feedback. */
feedback.get("/top", async (c) => {
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") ?? "10", 10) || 10));
  const result = await c.env.DB.prepare(
    `SELECT * FROM feedback WHERE status != 'deleted' ORDER BY votes DESC, created_at DESC LIMIT ?1`,
  ).bind(limit).all<FeedbackRow>();
  return ok(c, { count: (result.results || []).length, feedback: (result.results || []).map(shapeFeedback) });
});

/** GET /api/v1/feedback/:id — single feedback. */
feedback.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!Number.isFinite(id)) return err(c, 400, "id must be a number", "invalid_id");
  const r = await c.env.DB.prepare(`SELECT * FROM feedback WHERE id = ?1 LIMIT 1`).bind(id).first<FeedbackRow>();
  if (!r) return err(c, 404, `Feedback not found: ${id}`, "feedback_not_found");
  return ok(c, shapeFeedback(r));
});

/** POST /api/v1/feedback — create new feedback. */
feedback.post("/", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return err(c, 400, "Invalid JSON body", "invalid_json");
  }
  const type = body?.type;
  const title = body?.title;
  const text = body?.body;
  if (!["feature", "bug", "praise", "question"].includes(type)) {
    return err(c, 400, "type must be feature/bug/praise/question", "invalid_type");
  }
  if (typeof title !== "string" || title.length < 3 || title.length > 200) {
    return err(c, 400, "title must be 3-200 chars", "invalid_title");
  }
  if (typeof text !== "string" || text.length < 3 || text.length > 5000) {
    return err(c, 400, "body must be 3-5000 chars", "invalid_body");
  }
  const author = typeof body?.author === "string" ? body.author.slice(0, 100) : null;
  const countryCode = typeof body?.countryCode === "string" ? body.countryCode.toUpperCase().slice(0, 2) : null;
  const now = Math.floor(Date.now() / 1000);
  const result = await c.env.DB.prepare(
    `INSERT INTO feedback (type, title, body, author, country_code, status, votes, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, 'open', 0, ?6, ?6)
     RETURNING *`,
  ).bind(type, title, text, author, countryCode, now).first<FeedbackRow>();
  if (!result) return err(c, 500, "Failed to insert feedback", "insert_failed");
  return ok(c, shapeFeedback(result), "/api/v1/feedback");
});

/** POST /api/v1/feedback/:id/vote — upvote. */
feedback.post("/:id/vote", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!Number.isFinite(id)) return err(c, 400, "id must be a number", "invalid_id");
  const now = Math.floor(Date.now() / 1000);
  const result = await c.env.DB.prepare(
    `UPDATE feedback SET votes = votes + 1, updated_at = ?1 WHERE id = ?2 RETURNING *`,
  ).bind(now, id).first<FeedbackRow>();
  if (!result) return err(c, 404, `Feedback not found: ${id}`, "feedback_not_found");
  return ok(c, shapeFeedback(result));
});

/** DELETE /api/v1/feedback/:id — soft-delete. */
feedback.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!Number.isFinite(id)) return err(c, 400, "id must be a number", "invalid_id");
  const now = Math.floor(Date.now() / 1000);
  const result = await c.env.DB.prepare(
    `UPDATE feedback SET status = 'deleted', updated_at = ?1 WHERE id = ?2 RETURNING *`,
  ).bind(now, id).first<FeedbackRow>();
  if (!result) return err(c, 404, `Feedback not found: ${id}`, "feedback_not_found");
  return ok(c, shapeFeedback(result));
});

export { feedback as feedbackRouter };
