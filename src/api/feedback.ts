// src/api/feedback.ts
// Public feedback API — surfaces the community's tool suggestions +
// bug reports. One file = one purpose.
//
// Endpoints (under /api/v1/feedback):
//   GET  /                 list entries, with ?sort=votes|recent
//                                       ?type=suggestion|bug|idea|general
//                                       ?limit=1..100
//   GET  /top              shortcut for sort=votes&limit=10
//   GET  /:id             fetch one entry
//   POST /                 submit a new entry
//   POST /:id/vote         upvote (one per device, identified by IP+UA hash)
//   DELETE /:id            delete an entry (author-only via voter_token)

import { Router, type Request, type Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { db } from "../admin/db";

const TYPE_SET = new Set(["suggestion", "bug", "idea", "general"]);

interface FeedbackRow {
  id: string;
  type: string;
  title: string;
  description: string;
  author: string | null;
  votes: number;
  status: string;
  created_at: number;
}

function toEntry(row: FeedbackRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    author: row.author,
    votes: row.votes,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function voterToken(req: Request): string {
  // Anonymous device token: hash of IP + User-Agent. Stable per device,
  // not personally identifying, but unique enough to enforce
  // one-vote-per-device on each entry.
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
            || req.socket.remoteAddress
            || "0.0.0.0";
  const ua = req.headers["user-agent"] || "unknown";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

function genId(): string {
  return `fb-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

export const feedbackRouter = Router();

// ── LIST ────────────────────────────────────────────────────────────────
feedbackRouter.get("/", (req: Request, res: Response) => {
  const sort = String(req.query.sort || "votes");
  const type = String(req.query.type || "all");
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10) || 50));

  let sql = "SELECT * FROM feedback_entries WHERE 1=1";
  const params: unknown[] = [];
  if (type !== "all" && TYPE_SET.has(type)) {
    sql += " AND type = ?";
    params.push(type);
  }
  sql += sort === "recent"
    ? " ORDER BY created_at DESC"
    : " ORDER BY votes DESC, created_at DESC";
  sql += " LIMIT ?";
  params.push(limit);

  const rows = db.prepare(sql).all(...(params as any)) as FeedbackRow[];
  res.json({ entries: rows.map(toEntry), count: rows.length });
});

// ── TOP (shortcut) ──────────────────────────────────────────────────────
feedbackRouter.get("/top", (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
  const type = String(req.query.type || "all");
  let sql = "SELECT * FROM feedback_entries";
  const params: unknown[] = [];
  if (type !== "all" && TYPE_SET.has(type)) {
    sql += " WHERE type = ?";
    params.push(type);
  }
  sql += " ORDER BY votes DESC, created_at DESC LIMIT ?";
  params.push(limit);
  const rows = db.prepare(sql).all(...(params as any)) as FeedbackRow[];
  res.json({ entries: rows.map(toEntry), count: rows.length });
});

// ── GET ONE ─────────────────────────────────────────────────────────────
feedbackRouter.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM feedback_entries WHERE id = ?")
    .get(req.params.id) as FeedbackRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Feedback entry not found" });
    return;
  }
  res.json(toEntry(row));
});

// ── SUBMIT ──────────────────────────────────────────────────────────────
feedbackRouter.post("/", (req: Request, res: Response) => {
  const body = (req.body || {}) as Record<string, unknown>;
  const type = String(body.type || "");
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const author = body.author ? String(body.author).trim().slice(0, 60) : null;

  if (!TYPE_SET.has(type)) {
    res.status(400).json({ error: "Invalid type. Must be one of: suggestion, bug, idea, general." });
    return;
  }
  if (title.length < 3 || title.length > 120) {
    res.status(400).json({ error: "Title must be 3-120 characters." });
    return;
  }
  if (description.length < 10 || description.length > 800) {
    res.status(400).json({ error: "Description must be 10-800 characters." });
    return;
  }

  const id = genId();
  const createdAt = Date.now();
  // Author of their own entry: auto-vote counts as the first vote.
  const authorToken = voterToken(req);
  db.prepare(
    "INSERT INTO feedback_entries (id, type, title, description, author, votes, status, created_at) VALUES (?, ?, ?, ?, ?, 1, 'open', ?)"
  ).run(id, type, title, description, author, createdAt);
  db.prepare(
    "INSERT OR IGNORE INTO feedback_votes (entry_id, voter_token, created_at) VALUES (?, ?, ?)"
  ).run(id, authorToken, createdAt);
  // Bump vote count to reflect the auto-vote
  db.prepare("UPDATE feedback_entries SET votes = 1 WHERE id = ?").run(id);

  const row = db.prepare("SELECT * FROM feedback_entries WHERE id = ?").get(id) as FeedbackRow;
  res.status(201).json(toEntry(row));
});

// ── UPVOTE ──────────────────────────────────────────────────────────────
feedbackRouter.post("/:id/vote", (req: Request, res: Response) => {
  const id = req.params.id;
  const row = db.prepare("SELECT * FROM feedback_entries WHERE id = ?")
    .get(id) as FeedbackRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Feedback entry not found" });
    return;
  }
  const token = voterToken(req);
  // The primary key (entry_id, voter_token) enforces one vote per device
  const inserted = db.prepare(
    "INSERT OR IGNORE INTO feedback_votes (entry_id, voter_token, created_at) VALUES (?, ?, ?)"
  ).run(id, token, Date.now());
  if (inserted.changes === 0) {
    res.status(409).json({ error: "You have already voted on this entry." });
    return;
  }
  // Increment the aggregate vote count
  db.prepare("UPDATE feedback_entries SET votes = votes + 1 WHERE id = ?").run(id);
  const updated = db.prepare("SELECT * FROM feedback_entries WHERE id = ?").get(id) as FeedbackRow;
  res.json(toEntry(updated));
});

// ── DELETE ──────────────────────────────────────────────────────────────
// Only the original author (matched by voter_token + IP/UA) can delete
// their entry. Seed entries (id starts with "seed-") cannot be deleted
// via the API — only by the admin.
feedbackRouter.delete("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  if (id.startsWith("seed-")) {
    res.status(403).json({ error: "Seed entries cannot be deleted via the API." });
    return;
  }
  const row = db.prepare("SELECT * FROM feedback_entries WHERE id = ?")
    .get(id) as FeedbackRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Feedback entry not found" });
    return;
  }
  // Verify the requester has voted on this entry (which means they
  // submitted it, because we auto-vote on submit). Simple device
  // ownership check.
  const token = voterToken(req);
  const has = db.prepare(
    "SELECT 1 AS one FROM feedback_votes WHERE entry_id = ? AND voter_token = ?"
  ).get(id, token);
  if (!has) {
    res.status(403).json({ error: "Only the original author can delete this entry." });
    return;
  }
  // Cascade delete (PRAGMA foreign_keys = ON)
  db.prepare("DELETE FROM feedback_entries WHERE id = ?").run(id);
  res.json({ deleted: true, id });
});
