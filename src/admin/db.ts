// src/admin/db.ts
// SQLite-backed admin state. File-on-disk default at ./data/tdp.db.
// Swap to Cloudflare D1 at deploy time (constraint: workers don't allow
// better-sqlite3 native bindings). The abstraction below keeps that swap
// surface to the `db` export — every consumer only uses prepared statements
// and `.all() / .get() / .run()`.

import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const DB_DIR = process.env.ADMIN_DB_DIR || path.join(process.cwd(), "data");
const DB_PATH = process.env.ADMIN_DB_PATH || path.join(DB_DIR, "tdp.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const rawDb = new Database(DB_PATH);
rawDb.pragma("journal_mode = WAL");
rawDb.pragma("foreign_keys = ON");

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

export const db = rawDb;
export const DB_FILE = DB_PATH;

export const all = <T = unknown>(sql: string, params: unknown[] = []): T[] => {
  return rawDb.prepare(sql).all(...(params as any)) as T[];
};
export const get = <T = unknown>(sql: string, params: unknown[] = []): T | undefined => {
  return rawDb.prepare(sql).get(...(params as any)) as T | undefined;
};
export const run = (sql: string, params: unknown[] = []) => {
  return rawDb.prepare(sql).run(...(params as any));
};
