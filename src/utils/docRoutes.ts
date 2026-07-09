// src/utils/docRoutes.ts
// Sidebar navigation + path resolution for /docs/*
// Mirrors cloudconvert.com/docs: hierarchical left nav with collapsible groups,
// auto-breadcrumbs, slug-based content lookup. Adding a new docs page = one entry.

export type DocSectionId =
  | "getting-started"
  | "api-reference"
  | "sdks"
  | "integrations"
  | "resources";

export interface DocPage {
  /** URL slug after /docs/<section>/ — e.g. "introduction", "time/now" */
  slug: string;
  /** Display title in sidebar + page h1 */
  title: string;
  /** Short one-liner shown in sidebar (optional — falls back to title) */
  description?: string;
  /** Badge — "New", "Beta", "Coming soon" */
  badge?: "new" | "beta" | "soon";
}

export interface DocSection {
  id: DocSectionId;
  title: string;
  pages: DocPage[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    pages: [
      { slug: "introduction", title: "Introduction", description: "What the API does and who's it for" },
      { slug: "quickstart", title: "Quickstart", description: "First call in under 2 minutes" },
      { slug: "authentication", title: "Authentication", description: "API keys & rate-limit tiers" },
      { slug: "errors", title: "Errors", description: "Status codes + envelope contract" },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    pages: [
      { slug: "overview", title: "Overview", description: "Envelope shape, versioning, caching" },
      // Time API
      { slug: "time/now", title: "GET /time/now", description: "Current time by timezone or city" },
      { slug: "time/convert", title: "GET /time/convert", description: "Wall-clock conversion between zones" },
      { slug: "time/diff", title: "GET /time/diff", description: "Calendar or business-day difference" },
      { slug: "time/add", title: "GET /time/add", description: "Add/subtract years, months, weeks, days" },
      { slug: "time/unix", title: "GET /time/unix", description: "Epoch ⇄ ISO conversion" },
      { slug: "time/iso", title: "GET /time/iso", description: "ISO 8601, RFC 3339/2822, week, ordinal" },
      { slug: "time/words", title: "GET /time/words", description: "Natural-language dates (en/fr/zh/ja)" },
      // Data-source APIs (Phase 7 of landing page plan)
      { slug: "time/sun", title: "GET /time/sun", description: "Sun position (sunrise/sunset/day-length)" },
      { slug: "time/sync", title: "GET /time/sync", description: "Server time + clock-drift estimate" },
      { slug: "dst", title: "GET /dst", description: "DST transitions for a timezone in a year" },
      { slug: "holidays/today", title: "GET /holidays/today", description: "Holiday lookup per country + date" },
      { slug: "events/upcoming", title: "GET /events/upcoming", description: "World Cup, Olympics, holidays aggregated" },
      { slug: "events/next", title: "GET /events/next", description: "Next big event with countdown" },
      { slug: "onthisday", title: "GET /onthisday", description: "Historical events (Wikipedia wrapper)" },
      { slug: "quotes/random", title: "GET /quotes/random", description: "Context-aware quote picker" },
      { slug: "popular/cities", title: "GET /popular/cities", description: "Top N cities by search volume" },
      { slug: "browse/home", title: "GET /browse/home", description: "Composite hero snapshot" },
      // Cities
      { slug: "cities", title: "GET /cities", description: "Index of supported cities + aliases" },
      { slug: "cities/:slug", title: "GET /cities/:slug", description: "City detail with live clock" },
      // Countries
      { slug: "countries", title: "GET /countries", description: "Index of supported countries" },
      { slug: "countries/:code", title: "GET /countries/:code", description: "Country detail" },
      { slug: "countries/:code/holidays", title: "GET /countries/:code/holidays", description: "Federal + public holidays" },
      { slug: "countries/:code/working-hours", title: "GET /countries/:code/working-hours", description: "Working-day calculator" },
      // Pairs
      { slug: "pairs/:from/:to", title: "GET /pairs/:from/:to", description: "City-pair snapshot (SEO backbone)" },
      // Meeting
      { slug: "meeting/best", title: "GET /meeting/best", description: "Best overlap slots across cities" },
    ],
  },
  {
    id: "sdks",
    title: "SDKs",
    pages: [
      { slug: "nodejs", title: "Node.js", description: "Zero-dep, native fetch, full TypeScript", badge: "new" },
      { slug: "python", title: "Python", description: "requests-based client", badge: "soon" },
      { slug: "curl", title: "cURL", description: "Raw HTTP quick-reference" },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    pages: [
      { slug: "time-zone-converter", title: "Time Zone Converter", description: "Power the web tool" },
      { slug: "meeting-finder", title: "Meeting Finder", description: "Best-overlap engine" },
      { slug: "world-clock", title: "World Clock", description: "Multi-clock dashboard" },
      { slug: "holiday-hours", title: "Holiday & Hours", description: "Holidays + working hours calculator" },
      { slug: "unix-timestamp", title: "Unix Timestamp", description: "Live epoch clock" },
      { slug: "iso8601-formatter", title: "ISO 8601 Formatter", description: "Format any date string" },
      { slug: "date-math", title: "Date Math", description: "Date add/subtract" },
      { slug: "date-difference", title: "Date Difference", description: "How many days between" },
      { slug: "date-to-words", title: "Date to Words", description: "Natural-language dates" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    pages: [
      { slug: "changelog", title: "Changelog", description: "API + SDK release history" },
      { slug: "support", title: "Support", description: "Contact, status, FAQ" },
    ],
  },
];

export interface ParsedDocPath {
  sectionId: DocSectionId;
  pageSlug: string;
  /** Full slug including any sub-segment like "time/now" */
  fullSlug: string;
  section: DocSection;
  page: DocPage;
}

/**
 * Resolve `/docs/<section>/<slug...>` → structured route.
 * Falls back to introduction page when path is empty/unknown.
 */
export function parseDocsPath(pathname: string): ParsedDocPath | null {
  const clean = (pathname || "/").toLowerCase().replace(/^\/docs\/?/, "").replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) {
    return lookup("getting-started", "introduction");
  }
  const sectionId = parts[0] as DocSectionId;
  const section = DOC_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  // /docs/<section>  → show section landing (first page)
  if (parts.length === 1) return { sectionId, section, pageSlug: section.pages[0].slug, fullSlug: section.pages[0].slug, page: section.pages[0] };
  // /docs/<section>/<slug...>
  const slug = parts.slice(1).join("/");
  const page = section.pages.find((p) => p.slug === slug);
  if (!page) return null;
  return { sectionId, section, pageSlug: slug, fullSlug: slug, page };
}

export function lookup(sectionId: DocSectionId, fullSlug: string): ParsedDocPath | null {
  const section = DOC_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  const page = section.pages.find((p) => p.slug === fullSlug);
  if (!page) return null;
  return { sectionId, section, pageSlug: fullSlug, fullSlug, page };
}

/** Build a breadcrumb chain for the page. */
export interface Crumb {
  label: string;
  href: string;
}

export function crumbsFor(route: ParsedDocPath): Crumb[] {
  const out: Crumb[] = [
    { label: "Docs", href: "/docs/getting-started/introduction" },
    { label: route.section.title, href: `/docs/${route.sectionId}` },
    { label: route.page.title, href: `/docs/${route.sectionId}/${route.fullSlug}` },
  ];
  return out;
}
