-- Migration 0006: rate_alerts table
-- Phase 7 — Real-time rate alerts.
-- Stores user subscriptions for rate-threshold email notifications.
-- Created by POST /api/v1/alerts/subscribe, consumed by the cron Worker.

CREATE TABLE IF NOT EXISTS rate_alerts (
  id                 TEXT PRIMARY KEY,         -- uuid
  email              TEXT NOT NULL,
  from_code          TEXT NOT NULL,            -- 'USD'
  to_code            TEXT NOT NULL,            -- 'JPY'
  direction          TEXT NOT NULL,            -- 'above' | 'below'
  threshold          REAL NOT NULL,            -- 145.0
  reference_rate     REAL,                     -- rate at subscribe time
  active             INTEGER NOT NULL DEFAULT 1,
  last_rate          REAL,                     -- last checked rate
  last_checked       INTEGER,                  -- unix ts
  last_triggered     INTEGER,                  -- unix ts of last email
  trigger_count      INTEGER NOT NULL DEFAULT 0,
  unsubscribe_token  TEXT NOT NULL,            -- uuid for one-click unsub
  ip_hash            TEXT,                     -- sha256 of subscriber IP
  user_agent         TEXT,
  locale             TEXT,                     -- detected from browser
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_alerts_active
  ON rate_alerts(active, from_code, to_code)
  WHERE active = 1;

CREATE INDEX IF NOT EXISTS idx_rate_alerts_email
  ON rate_alerts(email);

CREATE INDEX IF NOT EXISTS idx_rate_alerts_token
  ON rate_alerts(unsubscribe_token);
