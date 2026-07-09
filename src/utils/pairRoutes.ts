// src/utils/pairRoutes.ts
// Routing helper for the dedicated pair URLs (/<lang>/<from>-<to>-time).
// Bidirectional lookup: URL path \u2192 city codes, or city codes \u2192 URL path.

import { CITY_BY_CODE } from "../data/cities";
import { codesFromSlug, citySlug, pairSlug } from "./pairTargets";

export const SUPPORTED_LANGS = ["en", "fr", "zh", "ja"] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

export interface PairRoute {
  lang: SupportedLang;
  slug: string;
  fromCode: string;
  toCode: string;
  fromName: string;
  toName: string;
}

/** Pattern: /<lang>/<slug>-time  \u2014  e.g. /en/new-york-to-tokyo-time */
const PAIR_PATH_RE = /^\/(en|fr|zh|ja)\/([a-z0-9-]+-time)$/;

/**
 * Parse a pathname into a PairRoute. Returns null if the path doesn't
 * match the pair pattern, or if the slug doesn't resolve to known
 * city codes (404 \u2192 caller bounces to converter with ?cities= fallback).
 */
export function parsePairPath(path: string): PairRoute | null {
  // Strip trailing slash, lowercase for matching
  const normalized = path.toLowerCase().replace(/\/+$/, "");
  const m = PAIR_PATH_RE.exec(normalized);
  if (!m) return null;
  const [, lang, slug] = m;
  if (!slug.endsWith("-time")) return null;

  const codes = codesFromSlug(slug);
  if (!codes) return null;
  const [fromCode, toCode] = codes;
  const from = CITY_BY_CODE[fromCode];
  const to = CITY_BY_CODE[toCode];
  if (!from || !to) return null;

  return {
    lang: lang as SupportedLang,
    slug,
    fromCode,
    toCode,
    fromName: from.name,
    toName: to.name,
  };
}

/** Inverse: build a pair URL path from city entries + lang. */
export function buildPairHref(from: { code: string }, to: { code: string }, lang: string): string {
  const fromC = CITY_BY_CODE[from.code];
  const toC = CITY_BY_CODE[to.code];
  if (!fromC || !toC) return `/${lang}/time-zone-converter?cities=${from.code},${to.code}`;
  return `/${lang}/${pairSlug(fromC, toC)}`;
}

/** Build href from the pair route directly. */
export function pairHrefFromRoute(p: PairRoute): string {
  return `/${p.lang}/${p.slug}`;
}

/**
 * Slug auto-resolve (used in routing fallback). Given two city entries
 * that may or may not be in the canonical mapping, return the best slug.
 * If one of the cities has a custom name not in the canonical pair list,
 * still produces a working slug from the city name.
 */
export function buildSlugForAny(fromCode: string, toCode: string): string {
  const from = CITY_BY_CODE[fromCode];
  const to = CITY_BY_CODE[toCode];
  if (!from || !to) return "";
  return `${citySlug(from.name)}-to-${citySlug(to.name)}-time`;
}