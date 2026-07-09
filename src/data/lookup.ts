// src/data/lookup.ts
// Unified search index for the LocationPicker.
// One query returns three kinds of hits:
//   - CITY     : single city (e.g. "Tokyo")
//   - REGION   : state/province (e.g. "Florida" → contains 6 cities)
//   - COUNTRY  : country (e.g. "Japan" → contains 3 cities)
//
// Lookup is built once at module load — pure derived data, no I/O.

import { CITIES, CityEntry, CITY_BY_CODE } from "./cities";
import { REGIONS, RegionEntry, REGION_BY_ID, REGIONS_BY_COUNTRY } from "./regions";
import { COUNTRIES, CountryEntry, COUNTRY_BY_CODE } from "./countries-meta";
import { flagFor } from "./flags";

export type Location =
  | { kind: "city";    id: string;  rank: number; label: string; sublabel: string; flag: string; city: CityEntry }
  | { kind: "region";  id: string;  rank: number; label: string; sublabel: string; flag: string; region: RegionEntry; cities: CityEntry[] }
  | { kind: "country"; id: string;  rank: number; label: string; sublabel: string; flag: string; country: CountryEntry; cities: CityEntry[] };

// ---------- RANK ----------
// Lower rank = higher priority in the dropdown.
// 0-99     : popular hub
// 100-999  : regional city / smaller country / less-popular state
// 1000+    : everything else

function rankCity(c: CityEntry): number {
  // Pull from country popularity list if present
  const country = COUNTRY_BY_CODE[c.countryCode];
  if (country?.popularCityCodes.includes(c.code)) return 50 + (country.popularCityCodes.indexOf(c.code) * 5);
  if (c.population) {
    if (c.population > 5_000_000) return 200;
    if (c.population > 1_000_000) return 400;
    if (c.population > 500_000)   return 700;
    return 900;
  }
  return 1500;
}

function rankCountry(c: CountryEntry): number {
  const popCityCount = c.popularCityCodes.length;
  // Major G20-ish countries first
  if (["US","GB","DE","FR","JP","CN","IN","CA","AU","BR","IT","ES","MX","KR","RU"].includes(c.code)) return 30;
  // Countries with multiple popular cities
  if (popCityCount >= 3) return 60;
  if (popCityCount >= 1) return 90;
  return 200;
}

// ---------- NORMALIZE ----------
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

// ---------- BUILD ALL LOCATIONS ----------
function buildAll(): Location[] {
  const locs: Location[] = [];

  // Cities
  for (const c of CITIES) {
    locs.push({
      kind: "city",
      id: `city:${c.code}`,
      rank: rankCity(c),
      label: c.name,
      sublabel: [c.state, c.country].filter(Boolean).join(", "),
      flag: flagFor(c.countryCode),
      city: c,
    });
  }

  // Regions
  for (const r of REGIONS) {
    const cities = r.cityCodes.map((code) => CITY_BY_CODE[code]).filter(Boolean);
    locs.push({
      kind: "region",
      id: `region:${r.id}`,
      rank: 100 + Math.min(900, 1000 / Math.max(1, r.cityCodes.length * 2)),
      label: r.name,
      sublabel: `${r.country} · ${r.cityCodes.length} cit${r.cityCodes.length === 1 ? "y" : "ies"}`,
      flag: flagFor(r.countryCode),
      region: r,
      cities,
    });
  }

  // Countries
  for (const c of COUNTRIES) {
    const cities = c.popularCityCodes.map((code) => CITY_BY_CODE[code]).filter(Boolean);
    locs.push({
      kind: "country",
      id: `country:${c.code}`,
      rank: rankCountry(c),
      label: c.name,
      sublabel: `${c.capital} · ${c.popularCityCodes.length} popular cit${c.popularCityCodes.length === 1 ? "y" : "ies"}`,
      flag: flagFor(c.code),
      country: c,
      cities,
    });
  }

  return locs;
}

const ALL_LOCATIONS: Location[] = buildAll();

// ---------- SEARCH ----------
export interface SearchOptions {
  query: string;
  limit?: number;
  kinds?: Array<"city" | "region" | "country">;
}

export function searchLocations(opts: SearchOptions): Location[] {
  const { query, limit = 8, kinds = ["city", "region", "country"] } = opts;
  const q = norm(query);
  if (!q) return ALL_LOCATIONS.filter((l) => kinds.includes(l.kind)).sort((a, b) => a.rank - b.rank).slice(0, limit);

  const scored: Array<{ loc: Location; score: number }> = [];
  for (const loc of ALL_LOCATIONS) {
    if (!kinds.includes(loc.kind)) continue;
    const labelN = norm(loc.label);
    const subN = norm(loc.sublabel);
    let score = 0;
    if (labelN === q) score = 0;                   // exact match wins
    else if (labelN.startsWith(q)) score = 10;    // prefix match strong
    else if (labelN.includes(q)) score = 50;      // substring decent
    else if (subN.includes(q)) score = 100;       // sublabel weak
    else {
      // Token-based fuzzy: every token of query appears somewhere in label/sublabel
      const tokens = q.split(/\s+/).filter(Boolean);
      const allHit = tokens.every((t) => labelN.includes(t) || subN.includes(t));
      if (allHit) score = 200;
      else continue;
    }
    // Boost by rank (popular things appear earlier when scores tie)
    score += loc.rank * 0.001;
    scored.push({ loc, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.loc);
}

// ---------- SUGGESTIONS ----------
// Hardcoded popular cities for the "no query" landing state of the picker.
// Sourced from screenshot + most-frequent TimeAndDatePro usage.

const POPULAR_CITY_CODES = [
  "TYO", "LON", "DXB", "SIN", "SYD", "PAR", "BER", "BOM",
  "NYC", "LAX", "CHI", "MIA", "SFO", "SEA", "DEL", "BKK",
  "HKG", "PEK", "MOW", "MOW",
];

export function getPopularCities(): CityEntry[] {
  const seen = new Set<string>();
  const out: CityEntry[] = [];
  for (const code of POPULAR_CITY_CODES) {
    if (seen.has(code)) continue;
    seen.add(code);
    const c = CITY_BY_CODE[code];
    if (c) out.push(c);
  }
  return out;
}

// ---------- SELECTORS (for callers who want a specific kind) ----------
export function citiesInRegion(regionId: string): CityEntry[] {
  const r = REGION_BY_ID[regionId];
  return r ? r.cityCodes.map((code) => CITY_BY_CODE[code]).filter(Boolean) : [];
}

export function citiesInCountry(countryCode: string): CityEntry[] {
  const country = COUNTRY_BY_CODE[countryCode];
  if (!country) return [];
  return country.popularCityCodes.map((code) => CITY_BY_CODE[code]).filter(Boolean);
}

export function regionsInCountry(countryCode: string): RegionEntry[] {
  return REGIONS_BY_COUNTRY[countryCode] || [];
}

// ---------- URL SERIALIZATION (for share links) ----------
export function serializeSharePayload(cityCodes: string[]): string {
  return cityCodes.join(",");
}

export function deserializeSharePayload(payload: string): CityEntry[] {
  return payload
    .split(",")
    .map((code) => CITY_BY_CODE[code.trim()])
    .filter((c): c is CityEntry => Boolean(c));
}

// Detect user's likely timezone + first matching city from CITIES
export function detectHomeCity(): CityEntry {
  if (typeof Intl !== "undefined") {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && CITY_BY_TIMEZONE[tz]?.length) {
        // Prefer the most populous city in that timezone
        return [...CITY_BY_TIMEZONE[tz]].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
      }
    } catch { /* ignore */ }
  }
  return CITY_BY_CODE["NYC"]!;
}

// re-export a quick tz→city index for the detectHomeCity logic
import { CITY_BY_TIMEZONE } from "./cities";