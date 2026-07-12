#!/usr/bin/env tsx
// ============================================================
// D1 seed builder — reads data from src/data/*.ts + downloads
// GeoNames admin1Codes.txt + adds manual aliases.
// Outputs: db/seed.sql (single SQL file with all INSERTs).
// ============================================================

import { writeFileSync, existsSync, mkdirSync, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { CITIES_GEONAMES, type GeonamesCityEntry } from "../../../src/data/cities-geonames.js";
import { COUNTRIES as COUNTRIES_GLOBAL, type CountryEntry } from "../../../src/data/countries-global.js";
import { UN_REGIONS, type UnRegion } from "../../../src/data/regions-un-m49.js";
import { TIMEZONES, type TimezoneEntry } from "../../../src/data/timezones.js";
import { fetchCountryNames } from "./country-translations.js";
import { CITY_ALIASES, COUNTRY_ALIASES, STATE_ALIASES } from "./aliases.js";

// ── Helpers ────────────────────────────────────────────────
const esc = (s: string | null | undefined): string => {
  if (s === null || s === undefined) return "NULL";
  return "'" + s.replace(/'/g, "''") + "'";
};
const escNum = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "NULL";
  return String(n);
};
const escJson = (obj: unknown): string => {
  return esc(JSON.stringify(obj));
};
const bool01 = (b: boolean | null | undefined): number => (b ? 1 : 0);

// Strip diacritics for ASCII variant
const stripDiacritics = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "c");

// ── 1. Build regions table ─────────────────────────────────
const regionRows: string[] = [];
for (const r of UN_REGIONS) {
  regionRows.push(
    `(${esc(r.m49Code)}, ${esc(r.m49Name)}, ${esc(r.parentM49Code)}, ${esc(r.regionType)})`,
  );
}

// ── 2. Build countries table + aliases ─────────────────────
const countryRows: string[] = [];
const countryAliasRows: string[] = [];
const countryNameToM49 = new Map<string, string>();
const countryCodeToM49 = new Map<string, string>();
// Map region names to M49 codes
for (const r of UN_REGIONS) {
  countryNameToM49.set(r.m49Name.toLowerCase(), r.m49Code);
  if (r.regionType === "continent") {
    countryNameToM49.set(r.m49Name.toLowerCase() + "s", r.m49Code);  // Africa → Africas
  }
}
// Map country unRegion/unSubregion to M49 codes
for (const c of COUNTRIES_GLOBAL) {
  if (c.unRegion) countryNameToM49.set(c.unRegion.toLowerCase(), "019"); // Americas (default)
  if (c.unSubregion) countryNameToM49.set(c.unSubregion.toLowerCase(), "021");
}

// Build country M49 lookup more carefully
const regionAliases: Record<string, string> = {
  africa: "002",
  asia: "142",
  europe: "150",
  "latin america and the caribbean": "419",
  americas: "019",
  oceania: "009",
  "northern america": "021",
  "south america": "005",
  "central america": "013",
  "caribbean": "029",
  "northern europe": "154",
  "western europe": "155",
  "southern europe": "039",
  "eastern europe": "151",
  "central asia": "143",
  "eastern asia": "030",
  "south-eastern asia": "035",
  "southern asia": "034",
  "western asia": "145",
  "northern africa": "015",
  "sub-saharan africa": "202",
  "eastern africa": "014",
  "middle africa": "017",
  "southern africa": "018",
  "western africa": "011",
  "melanesia": "054",
  "micronesia": "057",
  "polynesia": "061",
  "australia and new zealand": "053",
  "central asia and southern asia": "138",
  "eastern asia and south-eastern asia": "139",
  "latin america": "419",
};

for (const c of COUNTRIES_GLOBAL) {
  const regionM49 = c.unRegion ? regionAliases[c.unRegion.toLowerCase()] ?? null : null;
  const subregionM49 = c.unSubregion ? regionAliases[c.unSubregion.toLowerCase()] ?? null : null;
  if (regionM49) countryCodeToM49.set(c.cca2, regionM49);

  countryRows.push(
    `(${esc(c.cca2)}, ${esc(c.cca3)}, ${esc(c.ccn3)}, ${esc(c.cioc)}, ${esc(c.name)}, ${esc(stripDiacritics(c.name))}, ${esc(c.officialName ?? null)}, ${esc(c.capital)}, ${esc(c.continent)}, ${esc(c.unRegion ?? null)}, ${esc(c.unSubregion ?? null)}, ${esc(regionM49)}, ${esc(subregionM49)}, ${escJson(c.languages ?? [])}, ${escJson(c.currencies ?? [])}, ${esc(c.phoneCode ?? null)}, ${esc(c.drivingSide ?? null)}, ${esc(c.flagEmoji ?? null)}, ${esc(c.flagSvg ?? null)}, ${esc(c.flagPng ?? null)}, ${escNum(c.lat)}, ${escNum(c.lng)}, ${escNum(c.area)}, ${escNum(c.population)}, ${bool01(c.unMember)}, ${bool01(c.landlocked)}, ${bool01(c.independent)}, ${esc(c.startOfWeek ?? null)}, ${escJson(c.canonicalTimezones ?? [])}, ${escJson((c as any).borders ?? [])}, ${esc((c as any).tld?.[0] ?? null)})`,
  );

  // cca3 is already a primary alias
  if (c.cca3 !== c.cca2) {
    countryAliasRows.push(`(${esc(c.cca2)}, ${esc(c.cca3)}, 'cca3', NULL)`);
  }
  // ccn3 (numeric) is also a primary alias
  if (c.ccn3) {
    countryAliasRows.push(`(${esc(c.cca2)}, ${esc(c.ccn3)}, 'short', NULL)`);
  }
  // common native name (if different)
  if ((c as any).demonym) {
    countryAliasRows.push(`(${esc(c.cca2)}, ${esc((c as any).demonym)}, 'common', NULL)`);
  }
}

// Add manual country aliases (US, USA, United States, etc.)
for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
  for (const [alias, type] of Object.entries(aliases)) {
    countryAliasRows.push(`(${esc(code)}, ${esc(alias)}, ${esc(type)}, NULL)`);
  }
}

// ── 3. Build timezones table ───────────────────────────────
const timezoneRows: string[] = [];
for (const t of TIMEZONES) {
  timezoneRows.push(
    `(${esc(t.id)}, ${esc(t.region)}, ${esc(t.subregion)}, ${esc(t.city)}, ${escJson(t.countryCodes)}, ${escJson(t.countries)}, ${escNum(t.latitude)}, ${escNum(t.longitude)}, ${esc(t.comments ?? null)}, ${esc(t.currentOffset ?? null)}, ${esc(t.currentAbbreviation ?? null)}, ${t.isDst ? 1 : 0})`,
  );
}

// ── 4. Build cities table + aliases ────────────────────────
const cityRows: string[] = [];
const cityAliasRows: string[] = [];
const cityGeoIndex = new Map<string, GeonamesCityEntry>();  // for alias lookup
for (const c of CITIES_GEONAMES) {
  cityRows.push(
    `(${c.geonameId}, ${esc(c.name)}, ${esc(c.asciiName)}, ${esc(c.countryCode)}, ${esc(c.countryName)}, ${esc(c.admin1 ?? null)}, ${esc(c.admin2 ?? null)}, ${escNum(c.latitude)}, ${escNum(c.longitude)}, ${esc(c.timezone)}, ${escNum(c.population)}, ${escNum(c.elevation)}, ${esc(c.featureCode ?? null)}, ${c.isCapital ? 1 : 0})`,
  );
  cityGeoIndex.set(`${c.countryCode}:${c.asciiName.toLowerCase()}`, c);
  cityGeoIndex.set(`${c.countryCode}:${c.name.toLowerCase()}`, c);
}

// Add manual city aliases
for (const [key, aliases] of Object.entries(CITY_ALIASES)) {
  // key is "CountryCode:CityName" (e.g., "US:New York")
  const [cc, ...nameParts] = key.split(":");
  const name = nameParts.join(":");
  const city = cityGeoIndex.get(`${cc}:${name.toLowerCase()}`);
  if (city) {
    for (const [alias, type] of Object.entries(aliases)) {
      cityAliasRows.push(`(${city.geonameId}, ${esc(alias)}, ${esc(type)}, NULL)`);
    }
  }
}

// ── 5. Build states table from GeoNames admin1Codes.txt ────
console.log("Downloading GeoNames admin1Codes.txt...");
const stateRows: string[] = [];
const stateAliasRows: string[] = [];
try {
  const url = "https://raw.githubusercontent.com/datasets/geonames-all-cities-with-a-population-1000/master/data/admin1-codes.txt";
  // Actually, use the canonical GeoNames source
  const admin1Url = "https://download.geonames.org/export/dump/admin1CodesASCII.txt";
  const response = await fetch(admin1Url);
  if (response.ok) {
    const text = await response.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const [code, name, asciiName, geonameId] = line.split("\t");
      if (!code || !name) continue;
      // code is like "US.CA" — split into country + admin1
      const [countryCode, admin1Code] = code.split(".");
      if (!countryCode || !admin1Code) continue;
      stateRows.push(
        `(${esc(countryCode)}, ${esc(admin1Code)}, ${esc(name)}, ${esc(asciiName ?? stripDiacritics(name))}, ${esc(extractStateType(name))}, NULL, NULL)`,
      );
    }
    console.log(`  Loaded ${stateRows.length} states from GeoNames`);
  } else {
    console.log(`  Failed to download admin1Codes (${response.status}), using fallbacks`);
  }
} catch (e) {
  console.log(`  Error downloading admin1Codes: ${(e as Error).message}`);
}

// Add manual state aliases
for (const [key, aliases] of Object.entries(STATE_ALIASES)) {
  const [cc, code] = key.split(":");
  for (const [alias, type] of Object.entries(aliases)) {
    stateAliasRows.push(`(${esc(cc)}, ${esc(code)}, ${esc(alias)}, ${esc(type)})`);
  }
}

// Helper to extract state type from name
function extractStateType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("state")) return "state";
  if (n.includes("province")) return "province";
  if (n.includes("oblast")) return "oblast";
  if (n.includes("region")) return "region";
  if (n.includes("canton")) return "canton";
  if (n.includes("prefecture")) return "prefecture";
  if (n.includes("county")) return "county";
  if (n.includes("emirate")) return "emirate";
  if (n.includes("governorate")) return "governorate";
  if (n.includes("district")) return "district";
  if (n.includes("territory")) return "territory";
  if (n.includes("republic")) return "republic";
  return "division";
}

// ── 6. Fetch country translations (locale-aware) ──────────
console.log("Fetching country translations (fr-FR, de-DE, es-ES, ja-JP)...");
const translations = await fetchCountryNames();
const translationRows: string[] = [];
for (const [locale, names] of Object.entries(translations)) {
  for (const [cca2, name] of Object.entries(names)) {
    if (name) {
      translationRows.push(`(${esc(cca2)}, ${esc(name)}, 'translation', ${esc(locale)})`);
    }
  }
}
countryAliasRows.push(...translationRows);

// ── 7. Generate SQL ────────────────────────────────────────
mkdirSync("db", { recursive: true });

const parts: string[] = [];
parts.push("-- TimeAndDatePro D1 seed — auto-generated by scripts/build-seed.ts");
parts.push("-- Run with: wrangler d1 execute timeanddatepro-full --file=db/seed.sql --remote");
parts.push("-- Note: D1 doesn't support BEGIN TRANSACTION; each INSERT is atomic.");
parts.push("-- Large tables are chunked into batches of 500 rows to stay under SQLITE_TOOBIG.");
parts.push("-- Foreign keys are temporarily disabled so cities can reference any country/TZ.");
parts.push("");
parts.push("PRAGMA foreign_keys = OFF;");
parts.push("");
parts.push("");

// Chunk helper: break big INSERTs into 500-row batches
const CHUNK = 500;
const chunked = (rows: string[], columns: string, table: string, label: string): string[] => {
  const out: string[] = [`-- ${label} (${rows.length} rows in ${Math.ceil(rows.length / CHUNK)} chunks)`];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    out.push(`INSERT OR REPLACE INTO ${table} (${columns}) VALUES\n${slice.join(",\n")};`);
  }
  return out;
};

parts.push(...chunked(regionRows, "m49_code, name, parent_m49_code, region_type", "regions", "Regions (UN M49)"));
parts.push("");
parts.push(...chunked(countryRows, "cca2, cca3, ccn3, cioc, name, ascii_name, official_name, capital, continent, un_region, un_subregion, un_region_m49, un_subregion_m49, languages, currencies, phone_code, driving_side, flag_emoji, flag_svg, flag_png, latitude, longitude, area_km2, population, un_member, landlocked, independent, start_of_week, canonical_timezones, borders, tld", "countries", "Countries"));
parts.push("");
parts.push(...chunked(timezoneRows, "id, region, subregion, city, country_codes, countries, latitude, longitude, comments, current_offset, current_abbreviation, is_dst", "timezones", "Timezones (IANA)"));
parts.push("");
if (stateRows.length > 0) {
  parts.push(...chunked(stateRows, "country_code, admin1_code, name, ascii_name, type, latitude, longitude", "states", "States/Provinces (GeoNames admin1)"));
} else {
  parts.push("-- (no state data downloaded — GeoNames admin1 source failed)");
}
parts.push("");
parts.push(...chunked(cityRows, "geoname_id, name, ascii_name, country_code, country_name, admin1_code, admin2_code, latitude, longitude, timezone, population, elevation, feature_code, is_capital", "cities", "Cities (GeoNames cities5000)"));
parts.push("");
parts.push(...chunked(countryAliasRows, "country_code, alias, type, locale", "country_aliases", "Country aliases"));
parts.push("");
if (cityAliasRows.length > 0) {
  parts.push(...chunked(cityAliasRows, "city_id, alias, type, locale", "city_aliases", "City aliases"));
} else {
  parts.push("-- (no city aliases)");
}
parts.push("");
if (stateAliasRows.length > 0) {
  parts.push(...chunked(stateAliasRows, "country_code, admin1_code, alias, type", "state_aliases", "State aliases"));
} else {
  parts.push("-- (no state aliases)");
}
parts.push("");

parts.push("");
parts.push("PRAGMA foreign_keys = ON;");
parts.push("");
parts.push("-- Update meta");
parts.push(
  `INSERT OR REPLACE INTO meta (key, value, updated_at) VALUES\n  ('cities_count', ${cityRows.length}, unixepoch()),\n  ('countries_count', ${countryRows.length}, unixepoch()),\n  ('states_count', ${stateRows.length}, unixepoch()),\n  ('timezones_count', ${timezoneRows.length}, unixepoch()),\n  ('country_aliases_count', ${countryAliasRows.length}, unixepoch()),\n  ('city_aliases_count', ${cityAliasRows.length}, unixepoch()),\n  ('state_aliases_count', ${stateAliasRows.length}, unixepoch()),\n  ('seed_built_at', ${esc(new Date().toISOString())}, unixepoch());`,
);
parts.push("");

parts.push("");
parts.push("-- Done. Verify with:");
parts.push("--   wrangler d1 execute timeanddatepro-full --remote --command='SELECT COUNT(*) FROM cities'");
parts.push("");

const sql = parts.join("\n");
writeFileSync("db/seed.sql", sql);
console.log(`\n✅ Wrote db/seed.sql`);
console.log(`   ${(sql.length / 1024).toFixed(0)}KB total`);
console.log(`   ${regionRows.length} regions`);
console.log(`   ${countryRows.length} countries`);
console.log(`   ${timezoneRows.length} timezones`);
console.log(`   ${stateRows.length} states`);
console.log(`   ${cityRows.length} cities`);
console.log(`   ${countryAliasRows.length} country aliases`);
console.log(`   ${cityAliasRows.length} city aliases`);
console.log(`   ${stateAliasRows.length} state aliases`);
