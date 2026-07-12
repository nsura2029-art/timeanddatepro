// src/lib/search.ts
// City search logic with alias resolution and scoring.
// Reused by the /api/v1/cities/search endpoint and (optionally) by
// the /api/v1/cities/live endpoint for normalization.

import type { CityEntry } from "../data/cities";

/**
 * Common city name aliases. Maps legacy/alternative spellings to the
 * canonical name in the bundled CITIES dataset. Lowercase, no diacritics.
 */
export const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  bombay: "mumbai",
  madras: "chennai",
  calcutta: "kolkata",
  peking: "beijing",
  "rio": "rio de janeiro",
  "istambul": "istanbul",
  "constantinople": "istanbul",
  "byzantium": "istanbul",
  "nyc": "new york",
  "la": "los angeles",
  "sf": "san francisco",
  "dc": "washington",
  "vegg": "vega",
};

/** Normalize a string for search: lowercase + strip diacritics. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Resolve an alias if the input matches one. Returns the input unchanged otherwise. */
export function resolveAlias(raw: string): string {
  const n = normalize(raw);
  return CITY_ALIASES[n] ?? n;
}

interface ScoredCity {
  city: CityEntry;
  score: number;
}

/**
 * Search cities by query, excluding already-tracked codes.
 * Scoring: exact > prefix > substring > country prefix > country substring
 * > population tiebreaker.
 */
export function searchCities(
  query: string,
  cities: CityEntry[],
  excludeCodes: Set<string>,
  limit: number
): CityEntry[] {
  const raw = query.trim();
  if (raw.length < 2) return [];
  if (limit < 1) return [];

  const q = resolveAlias(raw);
  if (q.length < 2) return [];

  const scored: ScoredCity[] = [];
  for (const city of cities) {
    if (excludeCodes.has(city.code)) continue;
    const name = normalize(city.name);
    const country = normalize(city.country);
    if (name.length === 0) continue;

    let score = 0;
    if (name === q) {
      score += 1000;
    } else if (name.startsWith(q)) {
      score += 500;
    } else if (name.includes(q)) {
      score += 200;
    }
    if (country.startsWith(q)) {
      score += 100;
    } else if (country.includes(q)) {
      score += 50;
    }
    // Population is a TIEBREAKER, not a primary score. Only apply it
    // when the city already matched by name or country — otherwise
    // high-population cities would surface for any gibberish query.
    if (score > 0 && city.population && city.population > 0) {
      score += Math.min(50, Math.log10(city.population) * 5);
    }
    if (score > 0) scored.push({ city, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.city);
}
