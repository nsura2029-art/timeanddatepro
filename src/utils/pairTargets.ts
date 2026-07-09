// src/utils/pairTargets.ts
// "From your location" recommendation engine for the Time Zone Converter
// PopularPairs section. Uses CountRY_META's popularCityCodes + the user's
// detected country (via Intl) to surface 5 high-traffic pair links the
// user is most likely to actually click.

import { CITY_BY_CODE } from "../data/cities";
import { COUNTRY_BY_CODE } from "../data/countries-meta";
import { detectHomeCity } from "../data/lookup";

export interface PairSuggestion {
  /** URL path the link should navigate to (without <lang> prefix). */
  slug: string;
  /** Display label: "New York" */
  fromName: string;
  /** Display label: "Tokyo" */
  toName: string;
  /** Machine code, used as alternate text in the pill. */
  fromCode: string;
  toCode: string;
  /** Optional provenance hint: "finance / media" — gives the row personality. */
  reason?: string;
}

export const GLOBAL_PAIR_REASONS: Record<string, string> = {
  "NYC-TYO": "finance / consulting",
  "LAX-NYC": "tech & media",
  "LON-NYC": "finance / media",
  "SFO-TYO": "tech",
  "NYC-LDN": "finance / media",
  "PAR-TYO": "luxury / fashion",
};

export const GLOBAL_PAIRS: PairSuggestion[] = [
  { slug: "new-york-to-tokyo-time",        fromName: "New York",      toName: "Tokyo",       fromCode: "NYC", toCode: "TYO", reason: "finance / consulting" },
  { slug: "los-angeles-to-new-york-time",  fromName: "Los Angeles",   toName: "New York",    fromCode: "LAX", toCode: "NYC", reason: "tech & media" },
  { slug: "mumbai-to-new-york-time",       fromName: "Mumbai",        toName: "New York",    fromCode: "BOM", toCode: "NYC", reason: "engineering" },
  { slug: "london-to-new-york-time",       fromName: "London",        toName: "New York",    fromCode: "LON", toCode: "NYC", reason: "finance / media" },
  { slug: "san-francisco-to-tokyo-time",   fromName: "San Francisco", toName: "Tokyo",       fromCode: "SFO", toCode: "TYO", reason: "tech" },
  { slug: "new-york-to-london-time",       fromName: "New York",      toName: "London",      fromCode: "NYC", toCode: "LON", reason: "finance / media" },
  { slug: "dubai-to-mumbai-time",          fromName: "Dubai",         toName: "Mumbai",      fromCode: "DXB", toCode: "BOM", reason: "trade / shipping" },
  { slug: "paris-to-tokyo-time",           fromName: "Paris",         toName: "Tokyo",       fromCode: "PAR", toCode: "TYO", reason: "luxury / fashion" },
];

/** URL-safe slug for a single city name. */
export function citySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip diacritics (São → Sao)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build the canonical pair slug from two CityEntry objects. */
export function pairSlug(from: { name: string }, to: { name: string }): string {
  return `${citySlug(from.name)}-to-${citySlug(to.name)}-time`;
}

/**
 * Resolve <from>-<to>-time slugs back to their city codes. Used by App.tsx
 * routing. Returns null if the slug doesn't match a known pair.
 *
 * This walks every pair in our suggestion list AND can generate pairs from
 * the location-target map below for routes that weren't hard-coded.
 */
const SLUG_TO_CODES: Map<string, [string, string]> = (() => {
  const m = new Map<string, [string, string]>();
  // Hard-coded global pairs
  for (const p of GLOBAL_PAIRS) m.set(p.slug, [p.fromCode, p.toCode]);
  return m;
})();

export function codesFromSlug(slug: string): [string, string] | null {
  if (SLUG_TO_CODES.has(slug)) return SLUG_TO_CODES.get(slug)!;
  // Try to derive codes from a "{fromCity}-to-{toCity}-time" pattern by
  // walking city code → name slug lookup. Cost: O(240) per lookup,
  // acceptable because routing happens once per page navigation.
  const match = /^([a-z0-9-]+)-to-([a-z0-9-]+)-time$/.exec(slug);
  if (!match) return null;
  const [, fromPart, toPart] = match;
  // Build name-slug → code lookup once
  for (const code of Object.keys(CITY_BY_CODE)) {
    const c = CITY_BY_CODE[code];
    if (citySlug(c.name) === fromPart) {
      for (const code2 of Object.keys(CITY_BY_CODE)) {
        const c2 = CITY_BY_CODE[code2];
        if (citySlug(c2.name) === toPart) {
          return [code, code2];
        }
      }
    }
  }
  return null;
}

/** All slugs we know about (for the sitemap in Commit C). */
export function allKnownPairSlugs(): string[] {
  return Array.from(SLUG_TO_CODES.keys());
}

/**
 * Location-targeted pair suggestions for the user's country.
 * Picks the country's capital (or first popular city) as the implicit
 * "from" and pairs it with each of the user's country's popular outbound
 * destinations. Each pair links to the canonical pair-slug page.
 *
 * Returns 5 rows by default — falls back to GLOBAL_PAIRS for the OTHER
 * country code.
 */
export function getLocationBasedPairs(countryCode: string, count = 5): PairSuggestion[] {
  const country = COUNTRY_BY_CODE[countryCode];
  if (!country) return GLOBAL_PAIRS.slice(0, count);

  const home = cityClosestToCapitalOrPopular(country);
  if (!home) return GLOBAL_PAIRS.slice(0, count);

  // Pick destinations that aren't the home city AND aren't already paired
  // in GLOBAL_PAIRS to keep the two sections complementary.
  const globalTargets = new Set(GLOBAL_PAIRS.map((p) => p.toCode));
  const candidates = country.popularCityCodes
    .filter((c) => c !== home.code && !globalTargets.has(c))
    .slice(0, count);

  const pairs: PairSuggestion[] = candidates.map((toCode) => {
    const to = CITY_BY_CODE[toCode];
    return {
      slug: pairSlug(home, to),
      fromName: home.name,
      toName: to.name,
      fromCode: home.code,
      toCode: to.code,
      reason: countryCode === "OTHER" ? undefined : `${country.name} outbound`,
    };
  });
  return pairs.length > 0 ? pairs : GLOBAL_PAIRS.slice(0, count);
}

function cityClosestToCapitalOrPopular(country: { capital: string; code: string; defaultTimezone: string; popularCityCodes: string[] }) {
  // Try to find the capital in CITY_BY_CODE by name match
  for (const code of country.popularCityCodes) {
    const c = CITY_BY_CODE[code];
    if (!c) continue;
    if (c.name.toLowerCase() === country.capital.toLowerCase()) return c;
    if (c.timezone === country.defaultTimezone) return c;
  }
  return CITY_BY_CODE[country.popularCityCodes[0]] ?? null;
}

/** Detect the user's country code, preferring Intl timezone → CITY_BY_CODE. */
export function detectUserCountryCode(): string {
  if (typeof Intl === "undefined") return "OTHER";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const c = detectHomeCity();
      if (c) return c.countryCode;
    }
  } catch {/* noop */}
  return "OTHER";
}