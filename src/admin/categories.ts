// src/admin/categories.ts
// Stable list of API categories used to GROUP endpoints in the admin panel.
// Single source of truth — used by:
//   - server.ts (admin request log "category" field)
//   - AdminSidebar (left nav with category chips)
//   - AdminApiStatus page (filter pills)
//   - endpointCatalog.ts (admin "category" badge)

export interface AdminCategory {
  slug: string;
  label: string;
  /** Lucide icon component name — kept as string to avoid bundle-side deps in shared module. */
  icon: string;
  blurb: string;
  /** Sort order in sidebar */
  order: number;
}

export const ADMIN_CATEGORIES: AdminCategory[] = [
  {
    slug: "time",
    label: "Time",
    icon: "Clock",
    blurb: "Time math, zones, conversion, format",
    order: 1,
  },
  {
    slug: "data-source",
    label: "Data Sources",
    icon: "Database",
    blurb: "Live rates, sun, holidays, news, quotes",
    order: 2,
  },
  {
    slug: "currency",
    label: "Currency",
    icon: "Coins",
    blurb: "ECB exchange rates and conversion",
    order: 3,
  },
  {
    slug: "wikipedia",
    label: "Wikipedia",
    icon: "BookOpen",
    blurb: "Encyclopedic lookups + country history",
    order: 4,
  },
  {
    slug: "places",
    label: "Places",
    icon: "Globe2",
    blurb: "Cities, countries, pairs",
    order: 5,
  },
  {
    slug: "auth",
    label: "Auth",
    icon: "ShieldCheck",
    blurb: "Admin sessions + authorization",
    order: 6,
  },
];

/** Map of endpoint slug → category. Single source of truth for grouping. */
export const ENDPOINT_CATEGORY: Record<string, string> = {
  // Time family
  "time/now": "time",
  "time/convert": "time",
  "time/diff": "time",
  "time/add": "time",
  "time/unix": "time",
  "time/iso": "time",
  "time/words": "time",
  "time/sun": "time",
  "time/sync": "time",
  "dst": "time",
  "dst/upcoming": "time",
  // Data sources
  "holidays/today": "data-source",
  "events/upcoming": "data-source",
  "events/next": "data-source",
  "quotes/random": "data-source",
  "quotes/ranked": "data-source",
  "popular/cities": "data-source",
  "popular/defaults": "data-source",
  "browse/home": "data-source",
  // Currency
  "currency/rates": "currency",
  "currency/convert": "currency",
  "currency/codes": "currency",
  // Wikipedia
  "news/by-country": "wikipedia",
  "news/by-category": "wikipedia",
  "news/global": "wikipedia",
  "news/feeds": "wikipedia",
  "history/by-country": "wikipedia",
  "history/countries": "wikipedia",
  "onthisday": "wikipedia",
  // Places
  "cities": "places",
  "cities/:slug": "places",
  "countries": "places",
  "countries/:code": "places",
  "countries/:code/holidays": "places",
  "countries/:code/working-hours": "places",
  "pairs/:from/:to": "places",
  "meeting/best": "places",
};

export function categoryOf(slug: string): string {
  return ENDPOINT_CATEGORY[slug] || "data-source";
}
