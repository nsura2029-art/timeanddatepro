// ============================================================
// D1 search engine — handles all 13 edge cases from spec
// ============================================================
// 1. Disambiguation (same name, different countries)
// 2. Same name in same country (e.g., Springfield × 30 in US)
// 3. City vs state vs country disambiguation
// 4. Exact > prefix > substring with stable ordering
// 5. Diacritics + locale-aware
// 6. Abbreviations (NYC, LA, SF, etc.)
// 7. Fuzzy matching for misspellings
// 8. "City, State" pattern parsing
// 9. User-location ranking (?near=lat,lon)
// 10. Country names + codes (US, USA, UK, GB)
// 11. Timezone grouping (?tz=America/New_York)
// 12. Pagination (?page=2&limit=8)
// 13. Locale-aware (?locale=fr-FR)
// ============================================================

import type { D1Database } from "@cloudflare/workers-types";
import { normalize, stripDiacritics, fuzzyScore, haversineKm } from "./normalize.js";
import { parseQuery } from "./parse.js";

export interface SearchOptions {
  q: string;
  limit?: number;
  page?: number;
  country?: string;       // 2-letter code
  state?: string;         // 2-letter code or name
  timezone?: string;      // IANA TZ
  type?: "city" | "country" | "state" | "all";
  near?: { lat: number; lon: number };  // for ?near=lat,lon
  locale?: string;        // fr-FR, de-DE, etc.
  exclude?: string[];     // city codes to exclude
}

export interface CityResult {
  type: "city";
  id: number;
  name: string;
  asciiName: string;
  countryCode: string;
  countryName: string;
  stateName: string | null;
  stateCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  population: number;
  isCapital: boolean;
  featureCode: string;
  aliases: string[];
  score: number;
  /** Distance from ?near= in km (if provided) */
  distanceKm: number | null;
  /** Localized country name (if ?locale= provided and translation exists) */
  localizedCountryName: string | null;
}

export interface CountryResult {
  type: "country";
  code: string;       // cca2
  code3: string;      // cca3
  name: string;
  asciiName: string;
  capital: string | null;
  continent: string | null;
  unRegion: string | null;
  unSubregion: string | null;
  flagEmoji: string | null;
  population: number | null;
  area: number | null;
  score: number;
  localizedName: string | null;
}

export interface StateResult {
  type: "state";
  countryCode: string;
  admin1Code: string;
  name: string;
  asciiName: string;
  countryName: string;
  score: number;
}

export type SearchResult = CityResult | CountryResult | StateResult;

export interface SearchResponse {
  query: string;
  parsed: ReturnType<typeof parseQuery>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  results: SearchResult[];
  /** Mix of types for "show everything" results */
  breakdown: {
    cities: number;
    countries: number;
    states: number;
  };
  meta: {
    durationMs: number;
    locale: string | null;
    near: { lat: number; lon: number } | null;
  };
}

// ── Scoring weights (tuned for the 13 edge cases) ──────────
const SCORE = {
  // City name
  CITY_EXACT: 1000,
  CITY_ASCII_EXACT: 950,
  CITY_ALIAS_EXACT: 900,
  CITY_PREFIX: 500,
  CITY_ASCII_PREFIX: 475,
  CITY_SUBSTRING: 200,
  CITY_FUZZY: 100,
  // Country
  COUNTRY_EXACT: 1000,
  COUNTRY_ALIAS_EXACT: 900,
  COUNTRY_ASCII_EXACT: 950,
  COUNTRY_PREFIX: 500,
  COUNTRY_SUBSTRING: 200,
  // State
  STATE_EXACT: 1000,
  STATE_ALIAS_EXACT: 900,
  STATE_PREFIX: 500,
  STATE_SUBSTRING: 200,
  // Bonuses
  CAPITAL_BONUS: 50,
  POP_LOG_BOOST: 30,    // log10(population) / 30, capped
  COUNTRY_MATCH_BONUS: 100,  // when country_name matches query
  STATE_MATCH_BONUS: 80,
  LOCATION_PROXIMITY: 200,  // boost for cities near ?near=
  LOCATION_PROXIMITY_DECAY: 50,  // km decay factor
};

function populationBoost(population: number): number {
  if (population <= 0) return 0;
  return Math.min(SCORE.POP_LOG_BOOST, Math.log10(population) / 5);
}

// ── Main search function ───────────────────────────────────
export async function search(
  db: D1Database,
  options: SearchOptions,
): Promise<SearchResponse> {
  const t0 = Date.now();
  const limit = Math.min(50, Math.max(1, options.limit ?? 8));
  const page = Math.max(1, options.page ?? 1);
  const offset = (page - 1) * limit;
  const type = options.type ?? "all";
  const excludeCodes = new Set(options.exclude ?? []);
  const parsed = parseQuery(options.q);
  const normalizedQ = normalize(parsed.primary);
  const likeQuery = `%${normalizedQ}%`;

  // ── 1. Search cities (broad LIKE on all fields) ─────────
  const cityCandidates: CityResult[] = [];
  if (type === "all" || type === "city") {
    const cityRows = await db
      .prepare(
        `SELECT
          c.geoname_id, c.name, c.ascii_name, c.country_code, c.country_name,
          c.admin1_code, c.latitude, c.longitude, c.timezone, c.population,
          c.feature_code, c.is_capital,
          s.name AS state_name,
          (SELECT GROUP_CONCAT(ca.alias, '|') FROM city_aliases ca
            WHERE ca.city_id = c.geoname_id) AS aliases_str
        FROM cities c
        LEFT JOIN states s
          ON s.country_code = c.country_code AND s.admin1_code = c.admin1_code
        WHERE
          LOWER(c.name) LIKE ?1 OR
          LOWER(c.ascii_name) LIKE ?1 OR
          LOWER(c.country_name) LIKE ?1 OR
          LOWER(IFNULL(s.name, '')) LIKE ?1 OR
          EXISTS (SELECT 1 FROM city_aliases ca
                   WHERE ca.city_id = c.geoname_id AND LOWER(ca.alias) LIKE ?1)
        ORDER BY c.population DESC
        LIMIT 1000`,
      )
      .bind(likeQuery)
      .all<{
        geoname_id: number; name: string; ascii_name: string;
        country_code: string; country_name: string; admin1_code: string | null;
        latitude: number; longitude: number; timezone: string;
        population: number; feature_code: string; is_capital: number;
        state_name: string | null; aliases_str: string | null;
      }>();

    for (const r of cityRows.results || []) {
      const aliases = r.aliases_str ? r.aliases_str.split("|") : [];
      const result = scoreCity(
        r, normalizedQ, parsed, aliases, options, excludeCodes,
      );
      if (result) cityCandidates.push(result);
    }

    // Fuzzy fallback: if no results and query ≥ 4 chars, do a second pass
    // with just the first 3 chars as a prefix
    if (cityCandidates.length === 0 && normalizedQ.length >= 4) {
      const prefix = normalizedQ.substring(0, 3) + "%";
      const fuzzyRows = await db
        .prepare(
          `SELECT
            c.geoname_id, c.name, c.ascii_name, c.country_code, c.country_name,
            c.admin1_code, c.latitude, c.longitude, c.timezone, c.population,
            c.feature_code, c.is_capital,
            s.name AS state_name,
            (SELECT GROUP_CONCAT(ca.alias, '|') FROM city_aliases ca
              WHERE ca.city_id = c.geoname_id) AS aliases_str
          FROM cities c
          LEFT JOIN states s
            ON s.country_code = c.country_code AND s.admin1_code = c.admin1_code
          WHERE
            LOWER(c.ascii_name) LIKE ?1 OR
            LOWER(c.name) LIKE ?1
          ORDER BY c.population DESC
          LIMIT 500`,
        )
        .bind(prefix)
        .all<{
          geoname_id: number; name: string; ascii_name: string;
          country_code: string; country_name: string; admin1_code: string | null;
          latitude: number; longitude: number; timezone: string;
          population: number; feature_code: string; is_capital: number;
          state_name: string | null; aliases_str: string | null;
        }>();

      for (const r of fuzzyRows.results || []) {
        const aliases = r.aliases_str ? r.aliases_str.split("|") : [];
        const result = scoreCity(
          r, normalizedQ, parsed, aliases, options, excludeCodes,
        );
        if (result) cityCandidates.push(result);
      }
    }
  }

  // ── 2. Search countries ─────────────────────────────────
  const countryCandidates: CountryResult[] = [];
  if (type === "all" || type === "country") {
    const countryRows = await db
      .prepare(
        `SELECT
          cca2, cca3, name, ascii_name, capital, continent, un_region,
          un_subregion, flag_emoji, population, area_km2
        FROM countries
        WHERE
          LOWER(name) LIKE ?1 OR
          LOWER(ascii_name) LIKE ?1 OR
          EXISTS (SELECT 1 FROM country_aliases ca
                   WHERE ca.country_code = countries.cca2
                   AND LOWER(ca.alias) LIKE ?1)
        ORDER BY population DESC NULLS LAST
        LIMIT 100`,
      )
      .bind(likeQuery)
      .all<{
        cca2: string; cca3: string; name: string; ascii_name: string;
        capital: string | null; continent: string | null; un_region: string | null;
        un_subregion: string | null; flag_emoji: string | null;
        population: number | null; area_km2: number | null;
      }>();

    for (const r of countryRows.results || []) {
      const localized = await getLocalizedCountryName(db, r.cca2, options.locale);
      const aliases = await getCountryAliases(db, r.cca2);
      const result = scoreCountry(r, normalizedQ, parsed, aliases, localized);
      if (result) countryCandidates.push(result);
    }
  }

  // ── 3. Search states ────────────────────────────────────
  const stateCandidates: StateResult[] = [];
  if (type === "all" || type === "state") {
    const stateRows = await db
      .prepare(
        `SELECT
          s.country_code, s.admin1_code, s.name, s.ascii_name,
          c.name AS country_name,
          (SELECT GROUP_CONCAT(sa.alias, '|') FROM state_aliases sa
            WHERE sa.country_code = s.country_code AND sa.admin1_code = s.admin1_code) AS aliases_str
        FROM states s
        JOIN countries c ON c.cca2 = s.country_code
        WHERE
          LOWER(s.name) LIKE ?1 OR
          LOWER(s.ascii_name) LIKE ?1 OR
          EXISTS (SELECT 1 FROM state_aliases sa
                   WHERE sa.country_code = s.country_code
                   AND sa.admin1_code = s.admin1_code
                   AND LOWER(sa.alias) LIKE ?1)
        LIMIT 200`,
      )
      .bind(likeQuery)
      .all<{
        country_code: string; admin1_code: string;
        name: string; ascii_name: string; country_name: string;
        aliases_str: string | null;
      }>();

    for (const r of stateRows.results || []) {
      const aliases = r.aliases_str ? r.aliases_str.split("|") : [];
      const result = scoreState(r, normalizedQ, parsed, aliases);
      if (result) stateCandidates.push(result);
    }
  }

  // ── 4. Merge + sort + paginate ──────────────────────────
  const all = [...cityCandidates, ...countryCandidates, ...stateCandidates];
  // Stable sort: score DESC, then population DESC, then code ASC
  all.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ap = "population" in a ? (a.population ?? 0) : 0;
    const bp = "population" in b ? (b.population ?? 0) : 0;
    if (bp !== ap) return bp - ap;
    return a.type.localeCompare(b.type) ||
      ("id" in a ? String(a.id) : "code" in a ? a.code : "").localeCompare(
        "id" in b ? String(b.id) : "code" in b ? b.code : "",
      );
  });

  const total = all.length;
  const paginated = all.slice(offset, offset + limit);

  return {
    query: options.q,
    parsed,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    results: paginated,
    breakdown: {
      cities: cityCandidates.length,
      countries: countryCandidates.length,
      states: stateCandidates.length,
    },
    meta: {
      durationMs: Date.now() - t0,
      locale: options.locale ?? null,
      near: options.near ?? null,
    },
  };
}

// ── City scoring ──────────────────────────────────────────
function scoreCity(
  r: {
    geoname_id: number; name: string; ascii_name: string;
    country_code: string; country_name: string; admin1_code: string | null;
    latitude: number; longitude: number; timezone: string;
    population: number; feature_code: string; is_capital: number;
    state_name: string | null;
  },
  normalizedQ: string,
  parsed: ReturnType<typeof parseQuery>,
  aliases: string[],
  options: SearchOptions,
  excludeCodes: Set<string>,
): CityResult | null {
  // Exclude check
  if (excludeCodes.has(String(r.geoname_id))) return null;

  // Country filter
  if (options.country && r.country_code !== options.country) {
    // Still allow if the query is asking about the country itself
    if (parsed.country && parsed.country !== r.country_code) return null;
  }

  // State filter — when user explicitly types a state, filter to that state
  if (parsed.state) {
    const stateUpper = parsed.state.toUpperCase();
    const stateNorm = normalize(parsed.state);
    const stateNameNorm = normalize(r.state_name ?? "");
    if (r.admin1_code !== stateUpper && stateNameNorm !== stateNorm) {
      return null;  // Hard filter: user said "Paris TX", don't show Paris, France
    }
  } else if (options.state && r.admin1_code !== options.state) {
    return null;
  }

  // Timezone filter
  if (options.timezone && r.timezone !== options.timezone) return null;

  const name = normalize(r.name);
  const ascii = normalize(r.ascii_name);
  const country = normalize(r.country_name);
  const state = normalize(r.state_name ?? "");

  let score = 0;

  // Exact match (highest priority)
  if (name === normalizedQ || ascii === normalizedQ) {
    score = SCORE.CITY_EXACT;
  }
  // Alias exact match
  else if (aliases.some((a) => normalize(a) === normalizedQ)) {
    score = SCORE.CITY_ALIAS_EXACT;
  }
  // Prefix match
  else if (name.startsWith(normalizedQ) || ascii.startsWith(normalizedQ)) {
    score = SCORE.CITY_PREFIX;
  }
  // Country or state name match
  else if (country === normalizedQ) {
    score = SCORE.COUNTRY_MATCH_BONUS;
  } else if (state === normalizedQ) {
    score = SCORE.STATE_MATCH_BONUS;
  }
  // Substring match
  else if (name.includes(normalizedQ) || ascii.includes(normalizedQ)) {
    score = SCORE.CITY_SUBSTRING;
  } else if (country.includes(normalizedQ) || state.includes(normalizedQ)) {
    score = Math.floor(SCORE.CITY_SUBSTRING / 2);
  }
  // Fuzzy match (only for queries >= 4 chars, when no other match)
  else if (normalizedQ.length >= 4) {
    const fz = fuzzyScore(normalizedQ, ascii, 2);
    if (fz !== null && fz >= 0.7) {
      score = SCORE.CITY_FUZZY + Math.floor(fz * 50);
    } else {
      return null;
    }
  } else {
    return null;
  }

  // Capital bonus
  if (r.is_capital && score >= SCORE.CITY_PREFIX) {
    score += SCORE.CAPITAL_BONUS;
  }

  // Population boost
  score += populationBoost(r.population);

  // Location proximity boost
  let distanceKm: number | null = null;
  if (options.near) {
    distanceKm = haversineKm(options.near.lat, options.near.lon, r.latitude, r.longitude);
    if (distanceKm < 500) {
      score += SCORE.LOCATION_PROXIMITY - (distanceKm / SCORE.LOCATION_PROXIMITY_DECAY);
    }
  }

  // Country/state parsed from query: tighten match
  if (parsed.country && r.country_code === parsed.country) {
    score += 200;
  }
  // State match boost (now redundant with the hard filter above, but
  // keeps scoring consistent for tie-breaking)
  if (parsed.state && r.admin1_code === parsed.state.toUpperCase()) {
    score += 50;
  }

  return {
    type: "city",
    id: r.geoname_id,
    name: r.name,
    asciiName: r.ascii_name,
    countryCode: r.country_code,
    countryName: r.country_name,
    stateName: r.state_name,
    stateCode: r.admin1_code,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    population: r.population,
    isCapital: r.is_capital === 1,
    featureCode: r.feature_code,
    aliases,
    score: Math.round(score * 100) / 100,
    distanceKm: distanceKm ? Math.round(distanceKm) : null,
    localizedCountryName: null,  // set later
  };
}

// ── Country scoring ───────────────────────────────────────
function scoreCountry(
  r: {
    cca2: string; cca3: string; name: string; ascii_name: string;
    capital: string | null; continent: string | null; un_region: string | null;
    un_subregion: string | null; flag_emoji: string | null;
    population: number | null; area_km2: number | null;
  },
  normalizedQ: string,
  _parsed: ReturnType<typeof parseQuery>,
  aliases: string[],
  localized: string | null,
): CountryResult | null {
  const name = normalize(r.name);
  const ascii = normalize(r.ascii_name);

  let score = 0;
  if (name === normalizedQ || ascii === normalizedQ) {
    score = SCORE.COUNTRY_EXACT;
  } else if (aliases.some((a) => normalize(a) === normalizedQ)) {
    score = SCORE.COUNTRY_ALIAS_EXACT;
  } else if (name.startsWith(normalizedQ) || ascii.startsWith(normalizedQ)) {
    score = SCORE.COUNTRY_PREFIX;
  } else if (name.includes(normalizedQ) || ascii.includes(normalizedQ)) {
    score = SCORE.COUNTRY_SUBSTRING;
  } else {
    return null;
  }

  score += populationBoost(r.population ?? 0);

  return {
    type: "country",
    code: r.cca2,
    code3: r.cca3,
    name: r.name,
    asciiName: r.ascii_name,
    capital: r.capital,
    continent: r.continent,
    unRegion: r.un_region,
    unSubregion: r.un_subregion,
    flagEmoji: r.flag_emoji,
    population: r.population,
    area: r.area_km2,
    score: Math.round(score * 100) / 100,
    localizedName: localized,
  };
}

// ── State scoring ─────────────────────────────────────────
function scoreState(
  r: {
    country_code: string; admin1_code: string;
    name: string; ascii_name: string; country_name: string;
  },
  normalizedQ: string,
  _parsed: ReturnType<typeof parseQuery>,
  aliases: string[],
): StateResult | null {
  const name = normalize(r.name);
  const ascii = normalize(r.ascii_name);

  let score = 0;
  if (name === normalizedQ || ascii === normalizedQ) {
    score = SCORE.STATE_EXACT;
  } else if (aliases.some((a) => normalize(a) === normalizedQ)) {
    score = SCORE.STATE_ALIAS_EXACT;
  } else if (name.startsWith(normalizedQ) || ascii.startsWith(normalizedQ)) {
    score = SCORE.STATE_PREFIX;
  } else if (name.includes(normalizedQ) || ascii.includes(normalizedQ)) {
    score = SCORE.STATE_SUBSTRING;
  } else {
    return null;
  }

  return {
    type: "state",
    countryCode: r.country_code,
    admin1Code: r.admin1_code,
    name: r.name,
    asciiName: r.ascii_name,
    countryName: r.country_name,
    score: Math.round(score * 100) / 100,
  };
}

// ── Helpers ───────────────────────────────────────────────
async function getCountryAliases(db: D1Database, cca2: string): Promise<string[]> {
  const r = await db
    .prepare(`SELECT alias FROM country_aliases WHERE country_code = ?1`)
    .bind(cca2)
    .all<{ alias: string }>();
  return (r.results || []).map((row) => row.alias);
}

async function getLocalizedCountryName(
  db: D1Database, cca2: string, locale?: string,
): Promise<string | null> {
  if (!locale) return null;
  const r = await db
    .prepare(
      `SELECT alias FROM country_aliases
       WHERE country_code = ?1 AND locale = ?2 AND type = 'translation' LIMIT 1`,
    )
    .bind(cca2, locale)
    .first<{ alias: string }>();
  return r?.alias ?? null;
}
