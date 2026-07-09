// src/utils/sitemap.ts
// Dynamic sitemap.xml generator for timeanddatepro
// Add new routes here as you build them — both static tools and programmatic SEO pages.

import { LANG_SLUGS, TOOL_SLUGS, type LangSlug, type ToolSlug } from "./toolRoutes";
import { allKnownPairSlugs } from "./pairTargets";
import { DOC_SECTIONS, type DocSectionId } from "./docRoutes";

export interface SitemapAlternate {
  lang: string;
  path: string;
}

export interface SitemapEntry {
  /** URL path relative to origin. Use "/" for homepage. */
  path: string;
  /** BCP-47 language tag for hreflang. Defaults to "en". */
  lang?: string;
  /** ISO 8601 date string. Defaults to build time. */
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  /** 0.0 - 1.0. Default 0.7. */
  priority?: number;
  /** Other language versions of this exact page (for hreflang). */
  alternates?: SitemapAlternate[];
}

const NOW = new Date().toISOString();

/* --------------------------------------------------------------------------
 * Route registry
 * Each entry represents one URL on the site. Adding a new tool or page?
 * Just append it here and the sitemap picks it up automatically.
 * ------------------------------------------------------------------------ */

// 1. Top-level landing pages (one per language + the bare "/" English default)
const LANG_LANDING: SitemapEntry[] = [
  { path: "/", lang: "en", priority: 1.0, changefreq: "weekly" },
  ...LANG_SLUGS.filter((l) => l !== "en").map(
    (l): SitemapEntry => ({ path: `/${l}`, lang: l, priority: 0.9, changefreq: "weekly" })
  ),
];

// 2. Tool pages — every (lang × tool) combination
const TOOL_PAGES: SitemapEntry[] = LANG_SLUGS.flatMap((lang) =>
  TOOL_SLUGS.map(
    (tool): SitemapEntry => ({
      path: `/${lang}/${tool}`,
      lang,
      priority: 0.8,
      changefreq: "monthly",
    })
  )
);

// 3. Top-level feature pages (English-only for now; localized as we add more)
const FEATURE_PAGES: SitemapEntry[] = [
  { path: "/worldclock", lang: "en", priority: 0.8, changefreq: "weekly" },
  { path: "/meeting-finder", lang: "en", priority: 0.9, changefreq: "weekly" },
];

/* --------------------------------------------------------------------------
 * Documentation site (/docs/*) — English-only docs (UI copy + content are
 * English for now; translated docs can ship as pages are localized). Mirrors
 * DOC_SECTIONS so adding a new docs page = one registry entry.
 * ------------------------------------------------------------------------ */
const DOC_PAGE_ENTRIES: SitemapEntry[] = DOC_SECTIONS.flatMap((section) =>
  section.pages.map((page): SitemapEntry => ({
    path: `/docs/${section.id}/${page.slug}`,
    lang: "en",
    priority: section.id === "getting-started" ? 0.8 : 0.6,
    changefreq: page.badge === "new" ? "weekly" : "monthly",
  }))
);

/* --------------------------------------------------------------------------
 * (Future — empty arrays for now, ready for programmatic SEO)
 * ------------------------------------------------------------------------ */

// 4. City clock pages — fill in once you ship Phase 2.2 ("what time is it in X")
// const CITY_PAGES: SitemapEntry[] = [];

// 5. Country pages — Phase 2.3
// const COUNTRY_PAGES: SitemapEntry[] = [];

// 6. City-pair converter pages — Phase 2.1 (e.g. /est-to-ist)
// const PAIR_PAGES: SitemapEntry[] = [];

// 7. Event countdown pages — Phase 5.2 (e.g. /days-until-christmas)
// const EVENT_PAGES: SitemapEntry[] = [];

/* --------------------------------------------------------------------------
 * 4. Pair pages — /<lang>/<from>-to-<to>-time (Phase 3 / Commit C)
 *    Generates every (lang × known-pair-slug) entry. Currently sourced from
 *    GLOBAL_PAIRS; future commit can extend with algorithmic pairs.
 * ------------------------------------------------------------------------ */
const PAIR_PAGES: SitemapEntry[] = (["en", "fr", "zh", "ja"] as const).flatMap(
  (lang) =>
    allKnownPairSlugs().map(
      (slug): SitemapEntry => ({
        path: `/${lang}/${slug}`,
        lang,
        priority: 0.7,
        changefreq: "monthly",
      })
    )
);

/* --------------------------------------------------------------------------
 * Aggregated registry
 * ------------------------------------------------------------------------ */

export const SITEMAP_ENTRIES: SitemapEntry[] = [
  ...LANG_LANDING,
  ...TOOL_PAGES,
  ...FEATURE_PAGES,
  ...PAIR_PAGES,
  ...DOC_PAGE_ENTRIES,
];

/* --------------------------------------------------------------------------
 * XML emitter
 * ------------------------------------------------------------------------ */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildAlternateTags(entry: SitemapEntry): string {
  if (!entry.alternates || entry.alternates.length === 0) return "";
  return entry.alternates
    .map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.lang)}" href="${escapeXml(alt.path)}" />`
    )
    .join("\n");
}

/**
 * Generate the full sitemap.xml body for the given origin.
 * @param origin Base URL without trailing slash, e.g. "https://timeanddatepro.com"
 */
export function generateSitemapXml(origin: string): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  lines.push('        xmlns:xhtml="http://www.w3.org/1999/xhtml">');

  for (const entry of SITEMAP_ENTRIES) {
    const loc = `${origin}${entry.path}`;
    const lastmod = entry.lastmod ?? NOW;
    const changefreq = entry.changefreq ?? "monthly";
    const priority = (entry.priority ?? 0.7).toFixed(1);
    const alternates = buildAlternateTags(entry);

    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(loc)}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`    <changefreq>${changefreq}</changefreq>`);
    lines.push(`    <priority>${priority}</priority>`);
    if (alternates) {
      lines.push(alternates);
    }
    lines.push("  </url>");
  }

  lines.push("</urlset>");
  return lines.join("\n");
}

/**
 * Convenience: get the count of entries currently registered.
 * Useful for tests/verification.
 */
export function getSitemapEntryCount(): number {
  return SITEMAP_ENTRIES.length;
}