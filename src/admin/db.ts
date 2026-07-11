// src/admin/db.ts
// SQLite-backed admin state using Node's built-in `node:sqlite` (available
// in Node 22.5+ with --experimental-sqlite; stable in Node 24+).
//
// Why built-in vs better-sqlite3:
//   - Zero native compilation → works on Windows / Mac / Linux without
//     VS Build Tools, Python, or node-gyp
//   - Identical API surface for our usage (prepare / run / get / all / exec)
//   - Smaller install (no native binary in node_modules)
//   - Same path forward to Cloudflare D1 — both expose the same SQL semantics
//
// To use this on a deployment that doesn't allow Node's experimental
// flags (e.g. older Node, Cloudflare Workers), replace the body of
// `openDb()` with the D1 client wrapper. Every consumer of this file
// only touches `all`, `get`, `run`, and `db` — those are stable.

import path from "path";
import fs from "fs";
import { DatabaseSync, type DatabaseSync as DatabaseSyncT } from "node:sqlite";

const DB_DIR = process.env.ADMIN_DB_DIR || path.join(process.cwd(), "data");
const DB_PATH = process.env.ADMIN_DB_PATH || path.join(DB_DIR, "tdp.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function openDb(): DatabaseSyncT {
  const db = new DatabaseSync(DB_PATH);
  // node:sqlite has no .pragma() — exec the PRAGMA statements directly.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

const rawDb = openDb();

// ── Migrations ──────────────────────────────────────────────────────────
rawDb.exec(`
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT UNIQUE NOT NULL,
  pass_hash    TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'admin',
  created_at   INTEGER NOT NULL,
  last_login   INTEGER
);

CREATE TABLE IF NOT EXISTS api_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  method        TEXT NOT NULL,
  path          TEXT NOT NULL,
  endpoint      TEXT NOT NULL,
  category      TEXT,
  status        INTEGER NOT NULL,
  latency_ms    INTEGER NOT NULL,
  user_agent    TEXT,
  ip            TEXT,
  request_meta  TEXT,
  response_meta TEXT,
  cached        INTEGER NOT NULL DEFAULT 0,
  sampled       INTEGER NOT NULL DEFAULT 1,
  source        TEXT NOT NULL DEFAULT 'public',
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint   ON api_requests(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_status     ON api_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS api_triggers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger_name  TEXT NOT NULL,
  params        TEXT,
  requested_by  INTEGER REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'queued',
  started_at    INTEGER,
  finished_at   INTEGER,
  output_meta   TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_triggers_status ON api_triggers(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_triggers_name   ON api_triggers(trigger_name, created_at DESC);

CREATE TABLE IF NOT EXISTS cache_invalidation (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key     TEXT NOT NULL,
  triggered_by  INTEGER REFERENCES users(id),
  reason        TEXT,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id),
  action        TEXT NOT NULL,
  target        TEXT,
  meta          TEXT,
  ip            TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit(created_at DESC);
`);

// Mark schema as v1
const v = rawDb.prepare("SELECT version FROM schema_version LIMIT 1").get() as { version: number } | undefined;
if (!v) rawDb.prepare("INSERT INTO schema_version (version) VALUES (1)").run();

// ── v2 migration: feedback / tool suggestions (polish-9 + T6) ────────
// Two tables: one for entries, one for per-device votes. Votes are
// anonymous — we hash the IP + UA into a voter_token, so each device
// gets exactly one vote per entry. The page UI uses localStorage as
// the per-device cache so votes don't feel laggy; the API is the
// source of truth.
rawDb.exec(`
CREATE TABLE IF NOT EXISTS feedback_entries (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('suggestion','bug','idea','general')),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  author      TEXT,
  votes       INTEGER NOT NULL DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','planned','shipped','closed')),
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_votes    ON feedback_entries(votes DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_created  ON feedback_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_type     ON feedback_entries(type, votes DESC);

CREATE TABLE IF NOT EXISTS feedback_votes (
  entry_id     TEXT NOT NULL REFERENCES feedback_entries(id) ON DELETE CASCADE,
  voter_token  TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (entry_id, voter_token)
);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_entry ON feedback_votes(entry_id);
`);

const v2 = rawDb.prepare("SELECT version FROM schema_version WHERE version = 2").get();
if (!v2) rawDb.prepare("INSERT OR IGNORE INTO schema_version (version) VALUES (2)").run();

// Seed the 6 roadmap entries if the table is empty (idempotent).
const seedCount = rawDb.prepare("SELECT COUNT(*) AS c FROM feedback_entries").get() as { c: number };
if (seedCount.c === 0) {
  const seed = [
    { id: "seed-1", type: "suggestion", title: "Embeddable world clock widget for any website", description: "A one-line iframe that any site can drop in to show a live world clock. Would help news and travel sites.", votes: 47, status: "planned", created_at: 1750279200000 },
    { id: "seed-2", type: "suggestion", title: "Public holiday calendar download (ICS / Google Calendar)", description: "One-click import of any country's public holidays into Google Calendar, Outlook, or Apple Calendar.", votes: 38, status: "planned", created_at: 1751313600000 },
    { id: "seed-3", type: "idea",       title: "Meeting time translator in Slack and Teams",       description: "Native integration so you can type /time 3pm in #london and it converts to every team member's local time.", votes: 29, status: "open",    created_at: 1752340800000 },
    { id: "seed-4", type: "suggestion", title: "DST change reminder emails",                       description: "Get an email one week before a country changes its clocks, with a list of meetings that will shift.",          votes: 22, status: "open",    created_at: 1753368000000 },
    { id: "seed-5", type: "bug",        title: "DST transition shows wrong time for one hour",     description: "On the day of a DST change, the live clock shows the new time before the actual change happens.",                votes: 18, status: "open",    created_at: 1754395200000 },
    { id: "seed-6", type: "general",    title: "Add a dark mode",                                  description: "Many users check the time at night. A dark theme would reduce eye strain.",                                       votes: 14, status: "open",    created_at: 1755422400000 },
  ];
  const ins = rawDb.prepare(
    "INSERT INTO feedback_entries (id, type, title, description, votes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const s of seed) {
    ins.run(s.id, s.type, s.title, s.description, s.votes, s.status, s.created_at);
  }
}

export const db = rawDb;
export const DB_FILE = DB_PATH;

// ── Thin helpers matching the better-sqlite3 surface we used ────────────
export const all = <T = unknown>(sql: string, params: unknown[] = []): T[] => {
  // node:sqlite returns objects with [Object: null prototype] — we
  // explicitly spread to a plain {} so consumers get a normal shape.
  const rows = rawDb.prepare(sql).all(...(params as any)) as unknown[];
  return rows.map((r) => (r && typeof r === "object" ? { ...(r as object) } : r)) as T[];
};
export const get = <T = unknown>(sql: string, params: unknown[] = []): T | undefined => {
  const row = rawDb.prepare(sql).get(...(params as any)) as unknown;
  if (!row) return undefined;
  return (typeof row === "object" ? { ...(row as object) } : row) as T;
};
export const run = (sql: string, params: unknown[] = []) => {
  // node:sqlite's run() returns { changes, lastInsertRowid } already,
  // so this is a drop-in for the better-sqlite3 surface.
  return rawDb.prepare(sql).run(...(params as any));
};