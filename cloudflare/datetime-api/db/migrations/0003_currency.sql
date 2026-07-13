-- Migration 0003: Currency API tables (Phase 6.5)
-- Powers /api/v1/currency/* and /api/v1/crypto/* endpoints.
--
-- Replaces the static CURRENCY_RATES snapshot with a D1-backed live store.
-- Rates are refreshed by a cron Worker (hourly for fiat, 5min for crypto).
-- Historical rates come from Frankfurter's /v2/YYYY-MM-DD endpoint.

CREATE TABLE IF NOT EXISTS currency_codes (
  code        TEXT PRIMARY KEY,        -- ISO 4217: USD, EUR, GBP
  name        TEXT NOT NULL,            -- "US Dollar", "Euro"
  symbol      TEXT NOT NULL,            -- "$", "€", "£"
  flag        TEXT,                     -- "🇺🇸" (emoji)
  decimals    INTEGER NOT NULL DEFAULT 2, -- display precision
  sort_order  INTEGER NOT NULL DEFAULT 100,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_currency_codes_active ON currency_codes(is_active, sort_order);

CREATE TABLE IF NOT EXISTS currency_rates_latest (
  base         TEXT NOT NULL,            -- "USD"
  quote        TEXT NOT NULL,            -- "EUR"
  rate         REAL NOT NULL,            -- 0.8759
  source       TEXT NOT NULL,            -- "frankfurter" | "allratestoday" | "coingecko"
  fetched_at   INTEGER NOT NULL,         -- unix seconds
  expires_at   INTEGER NOT NULL,         -- unix seconds (fetched_at + ttl)
  PRIMARY KEY (base, quote)
);
CREATE INDEX IF NOT EXISTS idx_currency_rates_latest_expires ON currency_rates_latest(expires_at);
CREATE INDEX IF NOT EXISTS idx_currency_rates_latest_source ON currency_rates_latest(source);

CREATE TABLE IF NOT EXISTS currency_rates_history (
  base         TEXT NOT NULL,
  quote        TEXT NOT NULL,
  date         TEXT NOT NULL,            -- YYYY-MM-DD
  rate         REAL NOT NULL,
  source       TEXT NOT NULL,
  fetched_at   INTEGER NOT NULL,
  PRIMARY KEY (base, quote, date)
);
CREATE INDEX IF NOT EXISTS idx_currency_rates_history_pair ON currency_rates_history(base, quote, date DESC);

CREATE TABLE IF NOT EXISTS crypto_assets (
  id           TEXT PRIMARY KEY,         -- "bitcoin" (CoinGecko slug)
  symbol       TEXT NOT NULL,            -- "BTC"
  name         TEXT NOT NULL,            -- "Bitcoin"
  icon         TEXT,                     -- optional URL
  is_active    INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 100,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_active ON crypto_assets(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_symbol ON crypto_assets(symbol);

CREATE TABLE IF NOT EXISTS crypto_prices_latest (
  asset_id     TEXT NOT NULL,            -- "bitcoin"
  vs_currency  TEXT NOT NULL,            -- "USD"
  price        REAL NOT NULL,
  change_24h   REAL,                     -- percent
  change_7d    REAL,                     -- percent
  market_cap   REAL,
  source       TEXT NOT NULL DEFAULT 'coingecko',
  fetched_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  PRIMARY KEY (asset_id, vs_currency)
);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_latest_expires ON crypto_prices_latest(expires_at);

-- Rate audit (Study #3 — accuracy SLA)
-- Cron Worker logs our_rate vs source_rate per top-20 pair hourly.
CREATE TABLE IF NOT EXISTS rate_audit (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pair          TEXT NOT NULL,            -- "USD/EUR"
  our_rate      REAL NOT NULL,
  source_rate   REAL NOT NULL,
  delta_pct     REAL NOT NULL,
  threshold     REAL NOT NULL DEFAULT 0.5,
  above         INTEGER NOT NULL DEFAULT 0,  -- 0/1 boolean
  source        TEXT NOT NULL,            -- "frankfurter" | "allratestoday" | "coingecko"
  ts            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_audit_pair_ts ON rate_audit(pair, ts DESC);
CREATE INDEX IF NOT EXISTS idx_rate_audit_above ON rate_audit(above, ts DESC);

UPDATE meta SET value = '2.3.0' WHERE key = 'schema_version';
