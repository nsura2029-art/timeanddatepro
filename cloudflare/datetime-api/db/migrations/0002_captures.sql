-- Migration 0002: Add waitlist + captures tables (Phase 6 — thin API for
-- user captures: translation waitlist, FAB feedback, bulk convert,
-- translate requests).
--
-- The existing `feedback` table is for PUBLIC feature requests
-- (title + body + votes). The new `captures` table is for PRIVATE
-- ephemeral data (payload blob + type + page + email).
--
-- `waitlist` is a dedicated table for translation waitlist signups
-- with email + locale + language + tool + format + date so we can
-- segment and notify when translations ship.

CREATE TABLE IF NOT EXISTS waitlist (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL,
  locale        TEXT NOT NULL,
  language      TEXT,
  tool          TEXT,
  format        TEXT,
  date          TEXT,
  source        TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_locale ON waitlist(locale);
CREATE INDEX IF NOT EXISTS idx_waitlist_tool ON waitlist(tool);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);

CREATE TABLE IF NOT EXISTS captures (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,
  payload       TEXT,
  page          TEXT,
  tool          TEXT,
  email         TEXT,
  country_code  TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_captures_type ON captures(type);
CREATE INDEX IF NOT EXISTS idx_captures_tool ON captures(tool);
CREATE INDEX IF NOT EXISTS idx_captures_created ON captures(created_at DESC);

UPDATE meta SET value = '2.2.0' WHERE key = 'schema_version';
