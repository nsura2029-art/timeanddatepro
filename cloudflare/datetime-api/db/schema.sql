-- ============================================================
-- TimeAndDatePro D1 schema — full geographic + timezone dataset
-- ============================================================
-- Tables:
--   regions         — UN M49 hierarchy (continents + subregions)
--   countries       — 194 ISO 3166 countries (mledoze/restcountries)
--   states          — ~3,500 admin1 divisions (GeoNames admin1Codes)
--   timezones       — 312 IANA tz zones
--   cities          — 5,081 GeoNames cities5000
--   country_aliases — US/USA/UK/GB/United States/etc.
--   city_aliases    — NYC/LA/SF/DC/Philly/etc.
--   state_aliases   — TX/Texas/California/CA
--
-- All names stored with original diacritics + ASCII variant for search.
-- All aliases and lookups are case-insensitive (COLLATE NOCASE).
-- ============================================================

-- ── Regions (UN M49) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  m49_code         TEXT PRIMARY KEY,        -- "002" (Africa), "142" (Asia)
  name             TEXT NOT NULL,           -- "Africa", "Asia"
  parent_m49_code  TEXT,                    -- "150" for subregions of Europe
  region_type      TEXT NOT NULL,           -- 'continent' | 'subregion' | 'intermediate'
  FOREIGN KEY (parent_m49_code) REFERENCES regions(m49_code)
);

CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_m49_code);

-- ── Countries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS countries (
  cca2                TEXT PRIMARY KEY,        -- "US" (ISO 3166-1 alpha-2)
  cca3                TEXT UNIQUE NOT NULL,    -- "USA" (ISO 3166-1 alpha-3)
  ccn3                TEXT,                    -- "840" (ISO 3166-1 numeric)
  cioc                TEXT,                    -- "USA" (IOC code)
  name                TEXT NOT NULL,           -- "United States"
  ascii_name          TEXT NOT NULL,           -- "United States"
  official_name       TEXT,                    -- "United States of America"
  capital             TEXT,                    -- "Washington, D.C."
  continent           TEXT,                    -- "NA" | "SA" | "EU" | "AF" | "AS" | "OC" | "AN"
  un_region           TEXT,                    -- "Americas"
  un_subregion        TEXT,                    -- "Northern America"
  un_region_m49       TEXT,                    -- "019" (Americas M49)
  un_subregion_m49    TEXT,                    -- "021" (Northern America M49)
  languages           TEXT,                    -- JSON: [{"iso639_1":"en","name":"English"}]
  currencies          TEXT,                    -- JSON: [{"code":"USD","name":"...","symbol":"$"}]
  phone_code          TEXT,                    -- "+1"
  driving_side        TEXT,                    -- 'right' | 'left'
  flag_emoji          TEXT,                    -- "🇺🇸"
  flag_svg            TEXT,                    -- URL to SVG flag
  flag_png            TEXT,                    -- URL to PNG flag
  latitude            REAL,                    -- 37.09024
  longitude           REAL,                    -- -95.71289
  area_km2            REAL,                    -- 9833520
  population          INTEGER,                 -- 331002651
  un_member           INTEGER DEFAULT 0,       -- 0 | 1
  landlocked          INTEGER DEFAULT 0,       -- 0 | 1
  independent         INTEGER DEFAULT 0,       -- 0 | 1
  start_of_week       TEXT,                    -- "monday"
  canonical_timezones TEXT,                    -- JSON: ["America/New_York", ...]
  borders             TEXT,                    -- JSON: ["CA", "MX"]
  tld                 TEXT,                    -- ".us"
  FOREIGN KEY (un_region_m49) REFERENCES regions(m49_code)
);

CREATE INDEX IF NOT EXISTS idx_countries_cca3 ON countries(cca3);
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_countries_ascii ON countries(ascii_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_countries_un_region ON countries(un_region_m49);
CREATE INDEX IF NOT EXISTS idx_countries_un_subregion ON countries(un_subregion_m49);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);

-- ── States / Provinces / Admin1 divisions ──────────────────
CREATE TABLE IF NOT EXISTS states (
  country_code    TEXT NOT NULL,              -- "US"
  admin1_code     TEXT NOT NULL,              -- GeoNames admin1 code ("TX", "CA", "08")
  name            TEXT NOT NULL,              -- "Texas"
  ascii_name      TEXT NOT NULL,              -- "Texas"
  type            TEXT,                       -- 'state' | 'province' | 'region' | 'oblast' | 'canton' | etc.
  latitude        REAL,
  longitude       REAL,
  FOREIGN KEY (country_code) REFERENCES countries(cca2),
  PRIMARY KEY (country_code, admin1_code)
);

CREATE INDEX IF NOT EXISTS idx_states_country ON states(country_code);
CREATE INDEX IF NOT EXISTS idx_states_name ON states(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_states_ascii ON states(ascii_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_states_code ON states(country_code, admin1_code);

-- ── Timezones (IANA tz database) ───────────────────────────
CREATE TABLE IF NOT EXISTS timezones (
  id                    TEXT PRIMARY KEY,      -- "America/New_York"
  region                TEXT,                  -- "America"
  subregion             TEXT,                  -- "Argentina" (for nested zones)
  city                  TEXT,                  -- "New York"
  country_codes         TEXT,                  -- JSON: ["US", "CA"]
  countries             TEXT,                  -- JSON: ["United States", "Canada"]
  latitude              REAL,
  longitude             REAL,
  comments              TEXT,                  -- tzdb comments
  current_offset        TEXT,                  -- "-05:00"
  current_abbreviation  TEXT,                  -- "EST"
  is_dst                INTEGER DEFAULT 0      -- 0 | 1
);

CREATE INDEX IF NOT EXISTS idx_tz_region ON timezones(region);
CREATE INDEX IF NOT EXISTS idx_tz_country_code ON timezones(id) WHERE country_codes LIKE '%"US"%';  -- partial, fast

-- ── Cities (GeoNames cities5000) ───────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  geoname_id      INTEGER PRIMARY KEY,        -- 1796236
  name            TEXT NOT NULL,              -- "São Paulo" (with diacritics)
  ascii_name      TEXT NOT NULL,              -- "Sao Paulo"
  country_code    TEXT NOT NULL,              -- "BR"
  country_name    TEXT NOT NULL,              -- "Brazil"
  admin1_code     TEXT,                       -- "27" (São Paulo state)
  admin2_code     TEXT,                       -- "3550308" (county)
  latitude        REAL NOT NULL,
  longitude       REAL NOT NULL,
  timezone        TEXT NOT NULL,              -- IANA TZ
  population      INTEGER NOT NULL,
  elevation       INTEGER,                    -- meters
  feature_code    TEXT,                       -- "PPLC" | "PPLA" | "PPL"
  is_capital      INTEGER DEFAULT 0,          -- 0 | 1
  FOREIGN KEY (country_code) REFERENCES countries(cca2),
  FOREIGN KEY (timezone) REFERENCES timezones(id)
);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_cities_ascii ON cities(ascii_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population DESC);
CREATE INDEX IF NOT EXISTS idx_cities_timezone ON cities(timezone);
CREATE INDEX IF NOT EXISTS idx_cities_admin1 ON cities(country_code, admin1_code);
CREATE INDEX IF NOT EXISTS idx_cities_capital ON cities(is_capital DESC, population DESC);
CREATE INDEX IF NOT EXISTS idx_cities_geo ON cities(latitude, longitude);  -- for ?near= queries

-- ── Country aliases ────────────────────────────────────────
-- US/USA/United States/America/Estados Unidos → US
CREATE TABLE IF NOT EXISTS country_aliases (
  country_code    TEXT NOT NULL,
  alias           TEXT NOT NULL COLLATE NOCASE,
  type            TEXT NOT NULL,              -- 'cca3' | 'short' | 'alternate' | 'translation'
  locale          TEXT,                       -- NULL for global, 'fr-FR' for translations
  FOREIGN KEY (country_code) REFERENCES countries(cca2),
  PRIMARY KEY (alias, locale)
);

CREATE INDEX IF NOT EXISTS idx_country_aliases_code ON country_aliases(country_code);
CREATE INDEX IF NOT EXISTS idx_country_aliases_alias ON country_aliases(alias COLLATE NOCASE);

-- ── City aliases ───────────────────────────────────────────
-- NYC/New York City/Big Apple → New York (US)
-- LA → Los Angeles
-- SF → San Francisco
-- DC → Washington
-- Philly → Philadelphia
CREATE TABLE IF NOT EXISTS city_aliases (
  city_id         INTEGER NOT NULL,           -- cities.geoname_id
  alias           TEXT NOT NULL COLLATE NOCASE,
  type            TEXT NOT NULL,              -- 'abbreviation' | 'common' | 'alternate' | 'translation'
  locale          TEXT,                       -- NULL for global
  FOREIGN KEY (city_id) REFERENCES cities(geoname_id),
  PRIMARY KEY (alias, city_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_city_aliases_alias ON city_aliases(alias COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_city_aliases_city ON city_aliases(city_id);

-- ── State aliases (TX, Texas, Calif, CA) ───────────────────
CREATE TABLE IF NOT EXISTS state_aliases (
  country_code    TEXT NOT NULL,
  admin1_code     TEXT NOT NULL,
  alias           TEXT NOT NULL COLLATE NOCASE,
  type            TEXT NOT NULL,              -- 'abbreviation' | 'common' | 'alternate'
  FOREIGN KEY (country_code, admin1_code) REFERENCES states(country_code, admin1_code),
  PRIMARY KEY (country_code, alias)
);

CREATE INDEX IF NOT EXISTS idx_state_aliases_alias ON state_aliases(alias COLLATE NOCASE);

-- ── Metadata ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meta (
  key             TEXT PRIMARY KEY,
  value           TEXT,
  updated_at      INTEGER DEFAULT (unixepoch())
);

-- Initial metadata
INSERT OR REPLACE INTO meta (key, value) VALUES
  ('schema_version', '2.0.0'),
  ('cities_source', 'GeoNames cities5000.zip (top 5081 by population + capitals)'),
  ('countries_source', 'mledoze/countries (open restcountries.com v3.1 dataset)'),
  ('regions_source', 'UN M49 (unstats.un.org/unsd/methodology/m49/)'),
  ('timezones_source', 'IANA tz database (canonical 312 zones)'),
  ('states_source', 'GeoNames admin1Codes.txt');

-- ── Feedback (Phase 5.8) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,            -- 'feature' | 'bug' | 'praise' | 'question'
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  author        TEXT,                     -- optional display name
  country_code  TEXT,                     -- optional 2-letter country code
  status        TEXT DEFAULT 'open',      -- 'open' | 'planned' | 'done' | 'deleted'
  votes         INTEGER DEFAULT 0,
  created_at    INTEGER NOT NULL,         -- unixepoch seconds
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_votes ON feedback(votes DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

UPDATE meta SET value = '2.1.0' WHERE key = 'schema_version';
