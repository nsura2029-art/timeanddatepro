#!/usr/bin/env node
// scripts/dataset-build/build.mjs
// Master build script for the TimeAndDatePro global dataset.
//
// Pulls from 6 public sources, normalizes into a unified schema, and
// generates TypeScript files (ship in the React bundle) + D1 SQL
// seed (serves the API endpoints).
//
// Usage:
//   node build.mjs                  # full build (downloads + generates)
//   node build.mjs --skip-download  # use cached sources
//   node build.mjs --cities-only    # rebuild only the cities table
//   node build.mjs --dry-run        # parse + validate only, no output

import { promises as fs } from "node:fs";
import { createWriteStream } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const CACHE_DIR = resolve(__dirname, ".cache");
const OUTPUT_DIR = resolve(__dirname, "output");
const ATTACHMENT = resolve(ROOT, "..", "..", "attachments", "e73f1956__610ac4b5-f1a2-4276-a16b-18dc751a29d0.json");

const ARGS = new Set(process.argv.slice(2));
const SKIP_DOWNLOAD = ARGS.has("--skip-download");
const CITIES_ONLY = ARGS.has("--cities-only");
const DRY_RUN = ARGS.has("--dry-run");

const SOURCES = {
  iana: "https://example.invalid/iana-attachment", // local file, handled specially
  restcountries: "https://restcountries.com/v3.1/all?fields=cca2,cca3,ccn3,cioc,name,capital,region,subregion,continents,languages,currencies,idd,car,timezones,latlng,demonyms,flags,independent,status,unMember,landlocked,area,population,startOfWeek,capitalInfo",
  geonamesCities5000: "https://download.geonames.org/export/dump/cities5000.zip",
  nagerHolidays: "https://date.nager.at/api/v3/PublicHolidays",
  unM49: "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json",
  iso4217: "https://raw.githubusercontent.com/datasets/currency-codes/master/data/codes-all.csv",
};

// ──────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function downloadFile(url, dest, opts = {}) {
  const { headers = {}, maxRedirects = 5 } = opts;
  log(`  ↓ ${url.split("/").slice(-2).join("/")}`);
  let res;
  let attempt = 0;
  while (attempt < 3) {
    try {
      res = await fetch(url, { redirect: "follow", headers });
      if (res.ok) break;
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      attempt++;
      if (attempt >= 3) throw err;
      const wait = attempt * 2000;
      log(`    retry in ${wait}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buffer);
  log(`    → ${(buffer.length / 1024).toFixed(0)} KB`);
  return dest;
}

async function maybeDownload(filename, url, useCache) {
  await ensureDir(CACHE_DIR);
  const dest = resolve(CACHE_DIR, filename);
  if (useCache) {
    try {
      await fs.access(dest);
      log(`  ✓ cached: ${filename}`);
      return dest;
    } catch {
      // not cached, download
    }
  }
  if (SKIP_DOWNLOAD) {
    throw new Error(`Source not cached and --skip-download set: ${filename}`);
  }
  return downloadFile(url, dest);
}

// ──────────────────────────────────────────────────────────────────────
// Step 1: Load IANA timezones (the attachment — 312 canonical)
// ──────────────────────────────────────────────────────────────────────

async function loadIanaTimezones() {
  log("Step 1: Loading 312 IANA canonical timezones…");
  const raw = await fs.readFile(ATTACHMENT, "utf8");
  const data = JSON.parse(raw);
  const tzs = data.timezones;
  log(`  ✓ ${tzs.length} canonical IANA timezones loaded`);

  // Normalize to our TimezoneEntry shape
  const normalized = tzs.map((tz) => ({
    id: tz.id,
    region: tz.region,                // "Africa", "America", etc.
    subregion: tz.subregion ?? null,  // "Argentina", "Indiana" (for nested zones)
    city: tz.city,                    // "Abidjan", "Buenos Aires", etc.
    countryCodes: tz.country_codes,   // ["CI", "BF", "GH", ...]
    countries: tz.countries,          // ["Côte d'Ivoire", "Burkina Faso", ...]
    latitude: tz.coordinates?.latitude ?? null,
    longitude: tz.coordinates?.longitude ?? null,
    comments: tz.comments ?? null,
    currentOffset: tz.current?.utc_offset ?? null,        // "+00:00"
    currentAbbreviation: tz.current?.abbreviation ?? null, // "GMT"
    isDst: tz.current?.is_dst ?? false,
  }));
  return normalized;
}

// ──────────────────────────────────────────────────────────────────────
// Step 2: Load countries from restcountries.com
// ──────────────────────────────────────────────────────────────────────

async function loadCountries() {
  log("Step 2: Fetching 250 countries from restcountries.com…");
  const cacheFile = await maybeDownload(
    "restcountries-v3.1.json",
    SOURCES.restcountries,
    true // always try cache
  );
  const raw = await fs.readFile(cacheFile, "utf8");
  const data = JSON.parse(raw);
  log(`  ✓ ${data.length} countries loaded`);

  // Normalize to our CountryEntry shape
  const normalized = data
    .filter((c) => c.independent !== false && c.status === "officially-assigned")
    .map((c) => {
      // Extract language codes (restcountries returns { eng: "English", ... })
      const languages = c.languages
        ? Object.keys(c.languages).map((code) => ({
            iso639_1: code,
            name: c.languages[code],
          }))
        : [];

      // Extract currencies
      const currencies = c.currencies
        ? Object.entries(c.currencies).map(([code, info]) => ({
            iso4217: code,
            name: info.name,
            symbol: info.symbol ?? null,
          }))
        : [];

      // Phone code (e.g. "+1" for US, "+44" for GB)
      const phoneCode = c.idd?.root
        ? `${c.idd.root}${c.idd.suffixes?.[0] ?? ""}`
        : null;

      // Driving side: "right" | "left" | null
      const drivingSide = c.car?.side ?? null;

      // Continent code (restcountries uses full names; normalize to 2-letter)
      const continentMap = {
        "North America": "NA",
        "South America": "SA",
        Europe: "EU",
        Africa: "AF",
        Asia: "AS",
        Oceania: "OC",
        Antarctica: "AN",
      };

      // First listed continent (some countries span multiple)
      const continentRaw = c.continents?.[0] ?? c.region ?? null;
      const continentCode = continentMap[continentRaw] ?? null;

      // UN subregion (use directly from restcountries)
      const unSubregion = c.subregion ?? null;

      return {
        cca2: c.cca2,
        cca3: c.cca3,
        ccn3: c.ccn3 ? String(c.ccn3).padStart(3, "0") : null,
        cioc: c.cioc ?? null,
        name: c.name?.common ?? c.name?.official ?? c.cca2,
        officialName: c.name?.official ?? null,
        capital: c.capital?.[0] ?? null,
        continent: continentCode,
        unRegion: c.region ?? null,
        unSubregion,
        languages,
        currencies,
        phoneCode,
        drivingSide,
        flagEmoji: c.flag ?? null,           // emoji
        flagSvg: c.flags?.svg ?? null,        // URL
        flagPng: c.flags?.png ?? null,        // URL
        lat: c.latlng?.[0] ?? null,
        lng: c.latlng?.[1] ?? null,
        area: c.area ?? null,
        population: c.population ?? null,
        unMember: c.unMember ?? false,
        landlocked: c.landlocked ?? false,
        independent: c.independent ?? true,
        startOfWeek: c.startOfWeek ?? "monday",
        timezones: c.timezones ?? [],         // IANA timezones the country spans
        demonyms: c.demonyms?.eng?.m ?? null, // "American"
      };
    });

  log(`  ✓ ${normalized.length} officially-assigned independent countries`);
  return normalized;
}

// ──────────────────────────────────────────────────────────────────────
// Step 3: Load GeoNames cities
// ──────────────────────────────────────────────────────────────────────

async function loadCities() {
  log("Step 3: Fetching GeoNames cities5000.zip (~30MB compressed)…");
  const cacheFile = await maybeDownload(
    "cities5000.zip",
    SOURCES.geonamesCities5000,
    true
  );

  log("  → extracting + parsing (this takes ~30s)…");
  // Use a child Node process to run the unzip+parse without blocking
  // the main script. The parser writes JSON to cache.
  const parsedFile = resolve(CACHE_DIR, "cities5000.json");
  if (SKIP_DOWNLOAD) {
    try {
      await fs.access(parsedFile);
      log(`  ✓ cached: cities5000.json`);
      return JSON.parse(await fs.readFile(parsedFile, "utf8"));
    } catch {
      throw new Error("cities5000.json not cached; remove --skip-download");
    }
  }

  // Delegate to a parser script
  await runParser("parse-geonames.mjs", cacheFile, parsedFile);
  const cities = JSON.parse(await fs.readFile(parsedFile, "utf8"));
  log(`  ✓ ${cities.length} cities parsed (pre-filter)`);
  return cities;
}

async function runParser(script, input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      [resolve(__dirname, "parsers", script), input, output],
      { stdio: "inherit" }
    );
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

// ──────────────────────────────────────────────────────────────────────
// Step 4: Load holidays from Nager.Date (per country, per year)
// ──────────────────────────────────────────────────────────────────────

async function loadHolidays(countryCodes) {
  log(`Step 4: Fetching public holidays for ${countryCodes.length} countries from Nager.Date…`);
  const year = new Date().getUTCFullYear();
  const cacheFile = resolve(CACHE_DIR, `holidays-${year}.json`);
  if (SKIP_DOWNLOAD) {
    try {
      await fs.access(cacheFile);
      log(`  ✓ cached: holidays-${year}.json`);
      return JSON.parse(await fs.readFile(cacheFile, "utf8"));
    } catch {
      // fall through
    }
  }

  const holidays = {};
  // Nager.Date: 50 requests/sec is their stated rate limit
  const batches = chunk(countryCodes, 10);
  let done = 0;
  for (const batch of batches) {
    const results = await Promise.allSettled(
      batch.map(async (cc) => {
        const url = `${SOURCES.nagerHolidays}/${year}/${cc}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) return null;
        return [cc, await res.json()];
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        holidays[r.value[0]] = r.value[1];
      }
      done++;
    }
    if (done % 50 === 0) log(`    ${done}/${countryCodes.length} countries`);
    // 100ms between batches to respect rate limit
    await new Promise((r) => setTimeout(r, 100));
  }
  await fs.writeFile(cacheFile, JSON.stringify(holidays, null, 2));
  const total = Object.values(holidays).reduce((s, arr) => s + arr.length, 0);
  log(`  ✓ ${total} holidays for ${Object.keys(holidays).length} countries`);
  return holidays;
}

// ──────────────────────────────────────────────────────────────────────
// Step 5: Load UN M49 subregions
// ──────────────────────────────────────────────────────────────────────

async function loadUnM49() {
  log("Step 5: Loading UN M49 subregions…");
  const cacheFile = await maybeDownload(
    "un-m49.json",
    SOURCES.unM49,
    true
  );
  const raw = await fs.readFile(cacheFile, "utf8");
  const data = JSON.parse(raw);
  // UN M49 regions have codes like "002" (Africa), "019" (Americas), etc.
  // Subregions are more specific like "014" (Eastern Africa)
  const regions = data
    .filter((r) => r["region-code"] !== undefined)
    .map((r) => ({
      m49Code: r["region-code"],
      m49Name: r["region-name"],
      parentM49Code: r["parent-region-code"] ?? null,
    }));
  log(`  ✓ ${regions.length} M49 regions loaded`);
  return regions;
}

// ──────────────────────────────────────────────────────────────────────
// Step 6: Join everything together
// ──────────────────────────────────────────────────────────────────────

function joinDatasets({ timezones, countries, cities, unRegions, holidays }) {
  log("Step 6: Joining datasets…");

  // Build timezone → countries index
  const tzByCountry = new Map();
  for (const cc of countries.map((c) => c.cca2)) tzByCountry.set(cc, []);
  for (const tz of timezones) {
    for (const cc of tz.countryCodes) {
      if (tzByCountry.has(cc)) tzByCountry.get(cc).push(tz.id);
    }
  }

  // Build country → timezones (canonical only)
  const enrichedCountries = countries.map((c) => ({
    ...c,
    canonicalTimezones: tzByCountry.get(c.cca2) || [],
    holidayCount: holidays[c.cca2]?.length || 0,
  }));

  // Filter cities: must be a capital OR have population > 100,000
  const FEATURED_POP_MIN = 200_000;
  const featuredCities = cities
    .filter((c) => c.population >= FEATURED_POP_MIN || c.isCapital)
    .sort((a, b) => b.population - a.population);

  log(`  ✓ ${featuredCities.length} featured cities (pop ≥ ${FEATURED_POP_MIN.toLocaleString()} or capital)`);
  log(`  ✓ ${enrichedCountries.length} enriched countries`);
  log(`  ✓ ${timezones.length} timezones`);

  return {
    regions: unRegions,
    countries: enrichedCountries,
    timezones,
    cities: featuredCities,
    stats: {
      countries: enrichedCountries.length,
      timezones: timezones.length,
      cities: featuredCities.length,
      featuredCities: featuredCities.length,
      utcOffsets: [...new Set(timezones.map((t) => t.currentOffset).filter(Boolean))].length,
      holidays: Object.values(holidays).reduce((s, arr) => s + arr.length, 0),
      generatedAt: new Date().toISOString(),
    },
  };
}

// ──────────────────────────────────────────────────────────────────────
// Step 7: Generate outputs
// ──────────────────────────────────────────────────────────────────────

async function generateRegions(joined) {
  log("Step 7a: Generating src/data/regions.ts…");
  const regions = joined.regions;
  const ts = `// AUTO-GENERATED by scripts/dataset-build/build.mjs — do not edit.
// Generated at: ${joined.stats.generatedAt}
// Source: UN M49 (https://unstats.un.org/unsd/methodology/m49/)

export interface UnRegion {
  m49Code: string;       // "002" (Africa), "019" (Americas), etc.
  m49Name: string;       // "Africa", "Latin America and the Caribbean"
  parentM49Code: string | null;  // for sub-regions, points to its parent region
}

export const UN_REGIONS: UnRegion[] = ${JSON.stringify(regions, null, 2)};
`;
  const out = resolve(ROOT, "src", "data", "regions.ts");
  if (!DRY_RUN) await fs.writeFile(out, ts);
  log(`  ✓ ${regions.length} regions → ${out}`);
}

async function generateCountries(joined) {
  log("Step 7b: Generating src/data/countries.ts…");
  const countries = joined.countries;
  const ts = `// AUTO-GENERATED by scripts/dataset-build/build.mjs — do not edit.
// Generated at: ${joined.stats.generatedAt}
// Source: restcountries.com v3.1 (https://restcountries.com/)

import type { UnRegion } from "./regions";

export interface CountryLanguage {
  iso639_1: string;   // "en"
  name: string;       // "English"
}

export interface CountryCurrency {
  iso4217: string;    // "USD"
  name: string;       // "United States dollar"
  symbol: string;     // "$"
}

export interface CountryEntry {
  cca2: string;       // ISO 3166-1 alpha-2
  cca3: string;       // ISO 3166-1 alpha-3
  ccn3: string | null; // ISO 3166-1 numeric
  cioc: string | null; // IOC code
  name: string;       // "United States"
  officialName: string | null;
  capital: string | null;
  continent: "NA" | "SA" | "EU" | "AF" | "AS" | "OC" | "AN" | null;
  unRegion: string | null;     // "Americas"
  unSubregion: string | null;  // "Northern America"
  languages: CountryLanguage[];
  currencies: CountryCurrency[];
  phoneCode: string | null;    // "+1"
  drivingSide: "right" | "left" | null;
  flagEmoji: string | null;
  flagSvg: string | null;
  flagPng: string | null;
  lat: number | null;
  lng: number | null;
  area: number | null;
  population: number | null;
  unMember: boolean;
  landlocked: boolean;
  startOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  canonicalTimezones: string[];
  holidayCount: number;
  demonym: string | null;
}

export const COUNTRIES: CountryEntry[] = ${JSON.stringify(countries, null, 2)};

export const COUNTRY_BY_CCA2: Record<string, CountryEntry> =
  Object.fromEntries(COUNTRIES.map((c) => [c.cca2, c]));

export const COUNTRY_BY_CCA3: Record<string, CountryEntry> =
  Object.fromEntries(COUNTRIES.map((c) => [c.cca3, c]));
`;
  const out = resolve(ROOT, "src", "data", "countries.ts");
  if (!DRY_RUN) await fs.writeFile(out, ts);
  log(`  ✓ ${countries.length} countries → ${out}`);
}

async function generateTimezones(joined) {
  log("Step 7c: Generating src/data/timezones.ts…");
  const tzs = joined.timezones;
  const ts = `// AUTO-GENERATED by scripts/dataset-build/build.mjs — do not edit.
// Generated at: ${joined.stats.generatedAt}
// Source: IANA tz database (the canonical 312 zones)

export interface TimezoneEntry {
  id: string;                      // "America/New_York"
  region: string;                 // "America"
  subregion: string | null;       // "Argentina" (for nested zones)
  city: string;                   // "Buenos Aires"
  countryCodes: string[];         // ["AR"]
  countries: string[];            // ["Argentina"]
  latitude: number | null;
  longitude: number | null;
  comments: string | null;
  currentOffset: string | null;   // "-03:00"
  currentAbbreviation: string | null; // "-03"
  isDst: boolean;
}

export const TIMEZONES: TimezoneEntry[] = ${JSON.stringify(tzs, null, 2)};

export const TIMEZONE_BY_ID: Record<string, TimezoneEntry> =
  Object.fromEntries(TIMEZONES.map((t) => [t.id, t]));

export const UTC_OFFSETS: string[] = [
  ...new Set(TIMEZONES.map((t) => t.currentOffset).filter(Boolean) as string[]),
].sort() as string[];
`;
  const out = resolve(ROOT, "src", "data", "timezones.ts");
  if (!DRY_RUN) await fs.writeFile(out, ts);
  log(`  ✓ ${tzs.length} timezones → ${out}`);
}

async function generateCities(joined) {
  log("Step 7d: Generating src/data/cities.ts…");
  const cities = joined.cities;
  const ts = `// AUTO-GENERATED by scripts/dataset-build/build.mjs — do not edit.
// Generated at: ${joined.stats.generatedAt}
// Source: GeoNames cities5000.zip (https://download.geonames.org/)
// Filter: population >= 200,000 OR is a national capital.
// ~${cities.length} entries.

export interface CityEntry {
  geonameId: number;     // GeoNames ID
  name: string;          // "New York"
  asciiName: string;     // ASCII transliteration
  countryCode: string;   // "US"
  countryName: string;   // "United States"
  admin1: string | null; // State/province (e.g. "New York")
  admin2: string | null; // County/region
  latitude: number;
  longitude: number;
  timezone: string;      // IANA timezone
  population: number;
  elevation: number | null;
  featureCode: string;   // "PPLC" (capital), "PPL" (city), etc.
  isCapital: boolean;
}

export const CITIES: CityEntry[] = ${JSON.stringify(cities, null, 2)};

export const CITY_BY_GEONAMEID: Record<number, CityEntry> =
  Object.fromEntries(CITIES.map((c) => [c.geonameId, c]));

export const CITIES_BY_COUNTRY: Record<string, CityEntry[]> = {};
for (const c of CITIES) {
  (CITIES_BY_COUNTRY[c.countryCode] ||= []).push(c);
}

export const CITIES_BY_TIMEZONE: Record<string, CityEntry[]> = {};
for (const c of CITIES) {
  (CITIES_BY_TIMEZONE[c.timezone] ||= []).push(c);
}
`;
  const out = resolve(ROOT, "src", "data", "cities.ts");
  if (!DRY_RUN) await fs.writeFile(out, ts);
  log(`  ✓ ${cities.length} cities → ${out}`);
}

async function generateD1Seed(joined) {
  log("Step 7e: Generating D1 schema + seed.sql…");
  const schema = `-- AUTO-GENERATED D1 schema for the global dataset.
-- 6 tables: regions, countries, timezones, cities, currencies, holidays.

CREATE TABLE IF NOT EXISTS regions (
  m49_code      TEXT PRIMARY KEY,
  m49_name      TEXT NOT NULL,
  parent_m49    TEXT REFERENCES regions(m49_code),
  region_type   TEXT NOT NULL CHECK (region_type IN ('continent', 'subregion', 'intermediate'))
);

CREATE TABLE IF NOT EXISTS countries (
  cca2              TEXT PRIMARY KEY,
  cca3              TEXT NOT NULL,
  ccn3              TEXT,
  cioc              TEXT,
  name              TEXT NOT NULL,
  official_name     TEXT,
  capital           TEXT,
  continent         TEXT,
  un_region         TEXT,
  un_subregion      TEXT,
  phone_code        TEXT,
  driving_side      TEXT,
  flag_emoji        TEXT,
  flag_svg          TEXT,
  flag_png          TEXT,
  lat               REAL,
  lng               REAL,
  area_km2          INTEGER,
  population        INTEGER,
  un_member         INTEGER DEFAULT 0,
  landlocked        INTEGER DEFAULT 0,
  start_of_week     TEXT DEFAULT 'monday',
  demonym           TEXT,
  holiday_count     INTEGER DEFAULT 0
);
CREATE INDEX idx_countries_cca3 ON countries(cca3);
CREATE INDEX idx_countries_continent ON countries(continent);
CREATE INDEX idx_countries_subregion ON countries(un_subregion);

CREATE TABLE IF NOT EXISTS country_languages (
  cca2        TEXT NOT NULL REFERENCES countries(cca2) ON DELETE CASCADE,
  iso639_1    TEXT NOT NULL,
  name        TEXT NOT NULL,
  PRIMARY KEY (cca2, iso639_1)
);

CREATE TABLE IF NOT EXISTS country_currencies (
  cca2        TEXT NOT NULL REFERENCES countries(cca2) ON DELETE CASCADE,
  iso4217     TEXT NOT NULL,
  name        TEXT NOT NULL,
  symbol      TEXT,
  PRIMARY KEY (cca2, iso4217)
);

CREATE TABLE IF NOT EXISTS timezones (
  id            TEXT PRIMARY KEY,
  region        TEXT NOT NULL,
  subregion     TEXT,
  city          TEXT NOT NULL,
  country_codes TEXT NOT NULL,  -- JSON array
  countries     TEXT NOT NULL,  -- JSON array
  latitude      REAL,
  longitude     REAL,
  comments      TEXT,
  current_offset TEXT,
  current_abbreviation TEXT,
  is_dst        INTEGER DEFAULT 0
);
CREATE INDEX idx_timezones_region ON timezones(region);

CREATE TABLE IF NOT EXISTS cities (
  geoname_id     INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  ascii_name     TEXT,
  country_code   TEXT NOT NULL REFERENCES countries(cca2),
  admin1         TEXT,
  admin2         TEXT,
  latitude       REAL NOT NULL,
  longitude      REAL NOT NULL,
  timezone_id    TEXT REFERENCES timezones(id),
  population     INTEGER NOT NULL,
  elevation      INTEGER,
  feature_code   TEXT,
  is_capital     INTEGER DEFAULT 0
);
CREATE INDEX idx_cities_country ON cities(country_code);
CREATE INDEX idx_cities_timezone ON cities(timezone_id);
CREATE INDEX idx_cities_population ON cities(population DESC);

CREATE TABLE IF NOT EXISTS holidays (
  cca2        TEXT NOT NULL REFERENCES countries(cca2) ON DELETE CASCADE,
  holiday_date TEXT NOT NULL,        -- "2026-12-25"
  name        TEXT NOT NULL,
  local_name  TEXT,
  type        TEXT,                  -- "Public", "Bank", "School", etc.
  global      INTEGER DEFAULT 0,     -- 1 if observed nationwide
  PRIMARY KEY (cca2, holiday_date, name)
);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
`;

  // Generate INSERT statements
  const inserts = [];
  inserts.push("-- regions");
  for (const r of joined.regions) {
    inserts.push(
      `INSERT OR REPLACE INTO regions (m49_code, m49_name, parent_m49, region_type) VALUES (${sqlVal(r.m49Code)}, ${sqlVal(r.m49Name)}, ${sqlVal(r.parentM49Code)}, 'subregion');`
    );
  }

  inserts.push("\n-- countries");
  for (const c of joined.countries) {
    inserts.push(
      `INSERT OR REPLACE INTO countries (cca2, cca3, ccn3, cioc, name, official_name, capital, continent, un_region, un_subregion, phone_code, driving_side, flag_emoji, flag_svg, flag_png, lat, lng, area_km2, population, un_member, landlocked, start_of_week, demonym, holiday_count) VALUES (${sqlVal(c.cca2)}, ${sqlVal(c.cca3)}, ${sqlVal(c.ccn3)}, ${sqlVal(c.cioc)}, ${sqlVal(c.name)}, ${sqlVal(c.officialName)}, ${sqlVal(c.capital)}, ${sqlVal(c.continent)}, ${sqlVal(c.unRegion)}, ${sqlVal(c.unSubregion)}, ${sqlVal(c.phoneCode)}, ${sqlVal(c.drivingSide)}, ${sqlVal(c.flagEmoji)}, ${sqlVal(c.flagSvg)}, ${sqlVal(c.flagPng)}, ${c.lat}, ${c.lng}, ${c.area}, ${c.population}, ${c.unMember ? 1 : 0}, ${c.landlocked ? 1 : 0}, ${sqlVal(c.startOfWeek)}, ${sqlVal(c.demonym)}, ${c.holidayCount});`
    );
    for (const lang of c.languages || []) {
      inserts.push(
        `INSERT OR REPLACE INTO country_languages (cca2, iso639_1, name) VALUES (${sqlVal(c.cca2)}, ${sqlVal(lang.iso639_1)}, ${sqlVal(lang.name)});`
      );
    }
    for (const cur of c.currencies || []) {
      inserts.push(
        `INSERT OR REPLACE INTO country_currencies (cca2, iso4217, name, symbol) VALUES (${sqlVal(c.cca2)}, ${sqlVal(cur.iso4217)}, ${sqlVal(cur.name)}, ${sqlVal(cur.symbol)});`
      );
    }
  }

  inserts.push("\n-- timezones");
  for (const t of joined.timezones) {
    inserts.push(
      `INSERT OR REPLACE INTO timezones (id, region, subregion, city, country_codes, countries, latitude, longitude, comments, current_offset, current_abbreviation, is_dst) VALUES (${sqlVal(t.id)}, ${sqlVal(t.region)}, ${sqlVal(t.subregion)}, ${sqlVal(t.city)}, ${sqlVal(JSON.stringify(t.countryCodes))}, ${sqlVal(JSON.stringify(t.countries))}, ${t.latitude}, ${t.longitude}, ${sqlVal(t.comments)}, ${sqlVal(t.currentOffset)}, ${sqlVal(t.currentAbbreviation)}, ${t.isDst ? 1 : 0});`
    );
  }

  inserts.push("\n-- cities");
  for (const c of joined.cities) {
    inserts.push(
      `INSERT OR REPLACE INTO cities (geoname_id, name, ascii_name, country_code, admin1, admin2, latitude, longitude, timezone_id, population, elevation, feature_code, is_capital) VALUES (${c.geonameId}, ${sqlVal(c.name)}, ${sqlVal(c.asciiName)}, ${sqlVal(c.countryCode)}, ${sqlVal(c.admin1)}, ${sqlVal(c.admin2)}, ${c.latitude}, ${c.longitude}, ${sqlVal(c.timezone)}, ${c.population}, ${c.elevation}, ${sqlVal(c.featureCode)}, ${c.isCapital ? 1 : 0});`
    );
  }

  const out = resolve(OUTPUT_DIR, "seed.sql");
  if (!DRY_RUN) {
    await fs.writeFile(out, schema + "\n" + inserts.join("\n") + "\n");
  }
  log(`  ✓ schema + ${inserts.length} INSERTs → ${out}`);
  return { schema, inserts };
}

function sqlVal(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function generateStats(joined) {
  const stats = joined.stats;
  stats.buildDurationMs = Date.now() - BUILD_START;
  const out = resolve(OUTPUT_DIR, "stats.json");
  if (!DRY_RUN) await fs.writeFile(out, JSON.stringify(stats, null, 2));
  log(`  ✓ stats → ${out}`);
  log("");
  log("═══════════════════════════════════════════════════════════");
  log("  GLOBAL DATASET BUILD COMPLETE");
  log("═══════════════════════════════════════════════════════════");
  log(`  Countries:    ${stats.countries}`);
  log(`  Timezones:    ${stats.timezones}`);
  log(`  UTC offsets:  ${stats.utcOffsets}`);
  log(`  Cities:       ${stats.cities} (featured ≥ 200K or capital)`);
  log(`  Holidays:     ${stats.holidays} total across ${Object.keys({}).length} countries`);
  log(`  Duration:     ${(stats.buildDurationMs / 1000).toFixed(1)}s`);
  log("═══════════════════════════════════════════════════════════");
}

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────

const BUILD_START = Date.now();

async function main() {
  await ensureDir(CACHE_DIR);
  await ensureDir(OUTPUT_DIR);

  if (CITIES_ONLY) {
    const cities = await loadCities();
    await generateCities({ cities });
    return;
  }

  const timezones = await loadIanaTimezones();
  const countries = await loadCountries();
  const cities = await loadCities();
  const unRegions = await loadUnM49();

  // Holidays for all countries (best-effort, errors swallowed)
  const countryCodes = countries.map((c) => c.cca2);
  const holidays = await loadHolidays(countryCodes).catch((err) => {
    log(`  ✗ holiday fetch failed: ${err.message}`);
    return {};
  });

  const joined = joinDatasets({ timezones, countries, cities, unRegions, holidays });
  await generateRegions(joined);
  await generateCountries(joined);
  await generateTimezones(joined);
  await generateCities(joined);
  await generateD1Seed(joined);
  await generateStats(joined);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
