// src/data/docs/endpointCatalog.ts
// Typed endpoint metadata for the API reference. Used by EndpointRef and CodeTabs
// to render the docs page. Adding a new endpoint = one entry here + one handler
// in server.ts (already wired — see server.ts § Public REST API v1).

export type ParamKind = "string" | "int" | "boolean" | "enum" | "iso-date" | "city-list";

export interface ParamDef {
  name: string;
  type: ParamKind;
  required?: boolean;
  /** Optional enum values for `enum` kind. */
  values?: string[];
  default?: string;
  /** One-line description. */
  desc: string;
}

export interface ResponseField {
  path: string;          // dotted path into the JSON (e.g. "data.from.time")
  type: "string" | "number" | "boolean" | "object" | "array";
  desc: string;
}

export interface EndpointCodeSample {
  /** Language id — only "node" is shipped today. Future: curl, python, etc. */
  lang: "node" | "curl" | "python";
  label: string;
  code: string;
}

export interface EndpointDoc {
  /** Path slug — matches docRoutes.ts under api-reference */
  slug: string;
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Full HTTP path with :params — e.g. /api/v1/cities/:slug */
  apiPath: string;
  /** Short summary shown at top of page + sidebar */
  summary: string;
  /** Long-form prose section shown above params. Markdown-lite (paragraphs). */
  intro: string[];
  /** Example scenarios — title + code */
  examples?: { title: string; code: string; lang?: "node" | "curl" }[];
  query?: ParamDef[];
  path?: ParamDef[];
  /** Example JSON response — used by ResponseBlock */
  responseExample: unknown;
  /** Highlight a couple of fields in the response */
  responseHighlights?: ResponseField[];
  /** tRPC-style ordered code samples, language-first */
  samples: EndpointCodeSample[];
  /** Cache-Control header value */
  cache?: string;
  /** Endpoint is rate-limited (default: yes, free tier) */
  rateLimited?: boolean;
}

export const ENDPOINT_CATALOG: EndpointDoc[] = [
  // ── Time API ─────────────────────────────────────────────────────────────
  {
    slug: "overview",
    title: "Overview",
    method: "GET",
    apiPath: "/api/v1",
    summary: "Every endpoint, the envelope shape, and the conventions.",
    intro: [
      "The TimeAndDatePro REST API exposes 15 endpoints under `/api/v1/*` for time-zone math, meeting planning, and country-level holiday data.",
      "All responses are JSON. All endpoints return the same envelope: a top-level `success` boolean, a `data` or `error` block, and a `meta` block with endpoint name, API version, and server-side timestamp.",
      "Auth is **optional in v1** — the free tier is fully open with generous rate limits. Pro tier keys will be accepted via `Authorization: Bearer` header (coming soon).",
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// All SDK methods return plain data; the envelope is unwrapped for you.
const now = await client.time.now({ city: "NYC" });
console.log(now.time); // "23:14:09"`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl https://timeanddatepro.com/api/v1/time/now?city=NYC`,
      },
    ],
    query: [],
    responseExample: {
      success: true,
      data: { tz: "America/New_York", iso: "2026-07-08T23:14:09.000Z", date: "2026-07-08", time: "23:14:09", weekday: "Wednesday", utcOffset: "-04:00", abbr: "EDT" },
      meta: { endpoint: "/api/v1/time/now", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" },
    },
  },

  {
    slug: "time/now",
    title: "GET /time/now",
    method: "GET",
    apiPath: "/api/v1/time/now",
    summary: "Current wall-clock time in any timezone or city.",
    intro: [
      "Returns the current time, ISO string, weekday, UTC offset, and timezone abbreviation for the given timezone (IANA string) or city alias. Useful for status bars, banners, and any UI showing the user-visible time.",
      "Provide either `tz` (e.g. `Asia/Tokyo`) or `city` (e.g. `TYO`, `Tokyo`, `New York`). Aliases cover 30+ IATA codes like `JFK`, `SFO`, `DXB`, `SIN`, `HKG`, `ICN`, `MEX`, `AMS`, `ROM`, `BKK`, `AKL` so you don't have to remember full IANA names.",
    ],
    examples: [
      { title: "What's the time in Tokyo right now?", code: `await client.time.now({ city: "TYO" });` },
      { title: "By full IANA timezone", code: `await client.time.now({ tz: "America/Chicago" });` },
    ],
    query: [
      { name: "city", type: "city-list", desc: "City name or IATA-style alias (TYO, NYC, SFO). Mutually exclusive with `tz`." },
      { name: "tz", type: "string", desc: "IANA timezone name. Mutually exclusive with `city`." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const tokyo = await client.time.now({ city: "TYO" });
console.log(tokyo.time);   // "12:14:09"
console.log(tokyo.utcOffset); // "+09:00"`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/now?city=TYO"`,
      },
    ],
    responseExample: {
      success: true,
      data: { tz: "Asia/Tokyo", iso: "2026-07-09T03:14:09.000Z", date: "2026-07-09", time: "12:14:09", weekday: "Thursday", utcOffset: "+09:00", abbr: "JST" },
      meta: { endpoint: "/api/v1/time/now", version: "1.0.0", generatedAt: "2026-07-09T03:14:09.000Z" },
    },
    cache: "no-cache",
    rateLimited: true,
  },

  {
    slug: "time/convert",
    title: "GET /time/convert",
    method: "GET",
    apiPath: "/api/v1/time/convert",
    summary: "Convert a wall-clock time between two timezones.",
    intro: [
      "Given a time-of-day in the source zone (and optional reference date), returns the same instant expressed in the target zone along with the resolved UTC anchor.",
      "Use this for the time-zone converter widget on the landing page. Anchoring on a reference date means conversions respect DST — pass `date=2026-01-15` to get a winter-time result even if today is summer.",
    ],
    query: [
      { name: "from", type: "string", required: true, desc: "Source timezone, IANA name or city alias (NYC, TYO, LDN, etc.)." },
      { name: "to", type: "string", required: true, desc: "Target timezone, IANA name or city alias." },
      { name: "time", type: "string", desc: "Wall-clock time `HH:MM` (24h). Defaults to the current hour in `from` if omitted." },
      { name: "date", type: "iso-date", desc: "Reference date `YYYY-MM-DD`. Defaults to today. Anchors DST behavior." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// 15:00 NYC → TYO
const result = await client.time.convert({
  from: "NYC",
  to: "TYO",
  time: "15:00",
  date: "2026-07-08",
});

console.log(result.to.time);          // "04:00:00"  (next day)
console.log(result.differenceHours);  // 13`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/convert?from=NYC&to=TYO&time=15%3A00&date=2026-07-08"`,
      },
    ],
    responseExample: {
      success: true,
      data: {
        from: { tz: "America/New_York", city: "New York", code: "NYC", time: "15:00:00", utcOffset: "-04:00", abbr: "EDT", requestedTime: "15:00" },
        to:   { tz: "Asia/Tokyo",       city: "Tokyo",     code: "TYO", time: "04:00:00", utcOffset: "+09:00", abbr: "JST" },
        differenceHours: 13,
        sourceUTC: "2026-07-08T19:00:00.000Z",
      },
      meta: { endpoint: "/api/v1/time/convert", version: "1.0.0", generatedAt: "2026-07-08T19:00:00.000Z" },
    },
    cache: "no-cache",
    rateLimited: true,
  },

  {
    slug: "time/diff",
    title: "GET /time/diff",
    method: "GET",
    apiPath: "/api/v1/time/diff",
    summary: "Days between two dates — calendar or business mode.",
    intro: [
      "Two modes: `calendar` returns a pure wall-clock breakdown (years/months/days) — `business` counts Monday–Friday minus country-specific holidays.",
      "Business mode uses our holiday dataset (`COUNTRY_HOLIDAYS`) keyed by ISO country code. Default country is auto-detected from the browser timezone when called from the SDK; pass `country=` to override.",
    ],
    query: [
      { name: "from", type: "iso-date", required: true, desc: "Start date `YYYY-MM-DD`." },
      { name: "to", type: "iso-date", required: true, desc: "End date `YYYY-MM-DD`." },
      { name: "mode", type: "enum", values: ["calendar", "business"], default: "calendar", desc: "Counting mode." },
      { name: "country", type: "string", desc: "ISO country code (US, GB, FR, DE, JP, …). Only used in business mode." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// Calendar mode
const cal = await client.time.diff({
  from: "2026-01-01",
  to: "2026-12-31",
});
console.log(cal.totalDays);  // 364

// Business mode
const biz = await client.time.diff({
  from: "2026-01-01",
  to: "2026-12-31",
  mode: "business",
  country: "US",
});
console.log(biz.businessDays); // 251`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/diff?from=2026-01-01&to=2026-12-31&mode=business&country=US"`,
      },
    ],
    responseExample: {
      success: true,
      data: { from: "2026-01-01", to: "2026-12-31", mode: "calendar", totalDays: 364, weeks: 52, remainingDays: 0, years: 0, months: 11, days: 30 },
      meta: { endpoint: "/api/v1/time/diff", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" },
    },
    cache: "60s",
    rateLimited: true,
  },

  {
    slug: "time/add",
    title: "GET /time/add",
    method: "GET",
    apiPath: "/api/v1/time/add",
    summary: "Add or subtract years, months, weeks, days from a date.",
    intro: [
      "Compute a target date by adding any combination of years, months, weeks, and days. Business mode skips weekends and country holidays.",
    ],
    query: [
      { name: "date", type: "iso-date", required: true, desc: "Base date `YYYY-MM-DD`." },
      { name: "years", type: "int", desc: "Years to add (negative to subtract)." },
      { name: "months", type: "int", desc: "Months to add." },
      { name: "weeks", type: "int", desc: "Weeks to add." },
      { name: "days", type: "int", desc: "Days to add." },
      { name: "business", type: "boolean", default: "false", desc: "If true, skip weekends + country holidays." },
      { name: "country", type: "string", desc: "ISO country code, required when `business=true`." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.add({
  date: "2026-07-08",
  days: 30,
  business: true,
  country: "US",
});
// → { input: "2026-07-08", output: "2026-08-19", business: true }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/add?date=2026-07-08&days=30&business=true&country=US"`,
      },
    ],
    responseExample: { success: true, data: { input: "2026-07-08", output: "2026-08-19", business: true }, meta: { endpoint: "/api/v1/time/add", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "no-cache",
    rateLimited: true,
  },

  {
    slug: "time/unix",
    title: "GET /time/unix",
    method: "GET",
    apiPath: "/api/v1/time/unix",
    summary: "Epoch ⇄ ISO bidirectional conversion.",
    intro: [
      "Convert between Unix timestamps (seconds or milliseconds) and ISO 8601. Auto-detects unit from magnitude for `to_date` direction; pass `unit=` to force.",
    ],
    query: [
      { name: "value", type: "string", required: true, desc: "Number — Unix epoch or human date string." },
      { name: "direction", type: "enum", values: ["to_date", "to_unix"], default: "to_date", desc: "Direction of conversion." },
      { name: "unit", type: "enum", values: ["s", "ms"], desc: "Force seconds or milliseconds. Auto-detected if omitted." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.unix({ value: "1718370000", direction: "to_date" });
// → { input: 1718370000, unit: "s", direction: "to_date",
//     iso: "2024-06-14T09:00:00.000Z", utc: "Fri, 14 Jun 2024 09:00:00 GMT", local: "..." }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/unix?value=1718370000&direction=to_date"`,
      },
    ],
    responseExample: { success: true, data: { input: 1718370000, unit: "s", direction: "to_date", iso: "2024-06-14T09:00:00.000Z", utc: "Fri, 14 Jun 2024 09:00:00 GMT", local: "Fri Jun 14 2024 09:00:00 GMT+0000" }, meta: { endpoint: "/api/v1/time/unix", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "no-cache",
    rateLimited: true,
  },

  {
    slug: "time/iso",
    title: "GET /time/iso",
    method: "GET",
    apiPath: "/api/v1/time/iso",
    summary: "Format a date as ISO 8601, RFC 3339, RFC 2822, ISO Week, ordinal day, or basic.",
    intro: [
      "Six formats supported. Pass `tz=` to format in a specific timezone, otherwise UTC. ISO Week is `YYYY-Www`; ordinal day is `YYYY-DDD`.",
    ],
    query: [
      { name: "date", type: "iso-date", required: true, desc: "Date `YYYY-MM-DD`." },
      { name: "format", type: "enum", values: ["8601", "rfc3339", "rfc2822", "week", "ordinal", "basic"], required: true, desc: "Output format." },
      { name: "tz", type: "string", default: "UTC", desc: "IANA timezone." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.iso({ date: "2026-07-08", format: "rfc3339", tz: "America/New_York" });
// → { input: "2026-07-08", format: "RFC 3339", output: "2026-07-07T20:00:00-04:00" }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/iso?date=2026-07-08&format=rfc3339&tz=America/New_York"`,
      },
    ],
    responseExample: { success: true, data: { input: "2026-07-08", format: "RFC 3339", output: "2026-07-07T20:00:00-04:00" }, meta: { endpoint: "/api/v1/time/iso", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "60s",
    rateLimited: true,
  },

  {
    slug: "time/words",
    title: "GET /time/words",
    method: "GET",
    apiPath: "/api/v1/time/words",
    summary: "Natural-language date string in en/fr/zh/ja.",
    intro: [
      "Returns a human-readable date in the requested language. Useful for emails, calendar integrations, and accessibility.",
    ],
    query: [
      { name: "date", type: "iso-date", required: true, desc: "Date `YYYY-MM-DD`." },
      { name: "lang", type: "enum", values: ["en", "fr", "zh", "ja"], default: "en", desc: "Output language." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.words({ date: "2026-07-08", lang: "fr" });
// → { input: "2026-07-08", lang: "fr", output: "mercredi 8 juillet 2026", iso: "..." }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/time/words?date=2026-07-08&lang=fr"`,
      },
    ],
    responseExample: { success: true, data: { input: "2026-07-08", lang: "fr", output: "mercredi 8 juillet 2026", iso: "2026-07-08T00:00:00.000Z" }, meta: { endpoint: "/api/v1/time/words", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "60s",
    rateLimited: true,
  },

  // ── Cities ──────────────────────────────────────────────────────────────
  {
    slug: "cities",
    title: "GET /cities",
    method: "GET",
    apiPath: "/api/v1/cities",
    summary: "List every supported city with timezone + IATA alias.",
    intro: [
      "Returns the canonical CITY_DATA list merged with all IATA-style aliases from the city pair registry (LDN, JFK, SFO, DXB, SIN, HKG, ICN, MEX, AMS, ROM, BKK, AKL, …).",
      "Use this endpoint to populate a city autocomplete or a world-clock grid.",
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const cities = await client.cities.list();
console.log(cities.length); // ~80`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl https://timeanddatepro.com/api/v1/cities`,
      },
    ],
    responseExample: { success: true, data: [{ timezone: "Asia/Tokyo", name: "Tokyo", country: "JP", code: "TYO" }], meta: { endpoint: "/api/v1/cities", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    query: [],
    cache: "1h",
    rateLimited: true,
  },

  {
    slug: "cities/:slug",
    title: "GET /cities/:slug",
    method: "GET",
    apiPath: "/api/v1/cities/:slug",
    summary: "City detail with current time.",
    intro: [
      "Accepts a city code, IATA alias, or lowercase-hyphenated name. Returns the same shape as `/cities` plus a `currentTime` field.",
    ],
    path: [
      { name: "slug", type: "string", required: true, desc: "City code (TYO), IATA alias (JFK), or hyphenated lowercase name (new-york)." },
    ],
    query: [],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const city = await client.cities.get("TYO");
console.log(city.currentTime.time); // live Tokyo time`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl https://timeanddatepro.com/api/v1/cities/TYO`,
      },
    ],
    responseExample: { success: true, data: { timezone: "Asia/Tokyo", name: "Tokyo", country: "JP", code: "TYO", currentTime: { tz: "Asia/Tokyo", time: "12:14:09", utcOffset: "+09:00", abbr: "JST", iso: "2026-07-09T03:14:09.000Z", date: "2026-07-09", weekday: "Thursday" } }, meta: { endpoint: "/api/v1/cities/:slug", version: "1.0.0", generatedAt: "2026-07-09T03:14:09.000Z" } },
    cache: "1h",
    rateLimited: true,
  },

  // ── Countries ───────────────────────────────────────────────────────────
  {
    slug: "countries",
    title: "GET /countries",
    method: "GET",
    apiPath: "/api/v1/countries",
    summary: "Index of supported countries with default language + timezone.",
    intro: [
      "Each entry corresponds to a holiday dataset and default UI preferences. Used by the country-picker and the Date Calculator's business-day mode.",
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const countries = await client.countries.list();
countries.forEach((c) => console.log(c.code, c.name));`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl https://timeanddatepro.com/api/v1/countries`,
      },
    ],
    responseExample: { success: true, data: [{ code: "US", name: "United States", language: "en", timezone: "America/New_York" }], meta: { endpoint: "/api/v1/countries", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    query: [],
    cache: "1h",
    rateLimited: true,
  },

  {
    slug: "countries/:code",
    title: "GET /countries/:code",
    method: "GET",
    apiPath: "/api/v1/countries/:code",
    summary: "Country detail with holiday count and working hours (current year).",
    intro: [
      "Country detail `code` is the ISO 3166-1 alpha-2 (US, GB, FR, JP, …). Useful as a lightweight, pre-computed summary for country landing pages.",
    ],
    path: [
      { name: "code", type: "string", required: true, desc: "Two-letter ISO country code (case-insensitive)." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.countries.get("US");
// → { code: "US", name: "United States", language: "en", timezone: "America/New_York",
//     holidays: 11, workingHours: 2080 }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl https://timeanddatepro.com/api/v1/countries/US`,
      },
    ],
    responseExample: { success: true, data: { code: "US", name: "United States", language: "en", timezone: "America/New_York", holidays: 11, workingHours: 2080 }, meta: { endpoint: "/api/v1/countries/:code", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    query: [],
    cache: "1h",
    rateLimited: true,
  },

  {
    slug: "countries/:code/holidays",
    title: "GET /countries/:code/holidays",
    method: "GET",
    apiPath: "/api/v1/countries/:code/holidays",
    summary: "Federal, public, bank, and observance holidays for a year.",
    intro: [
      "Returns the curated holiday list for a country in a given year. Defaults to the current year. Each entry has a `type` field: `federal`, `public`, `bank`, or `observance`.",
    ],
    path: [
      { name: "code", type: "string", required: true, desc: "Two-letter ISO country code (case-insensitive)." },
    ],
    query: [
      { name: "year", type: "int", desc: "Calendar year. Defaults to the current year." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const { holidays } = await client.countries.holidays("US", 2026);
holidays.forEach((h) => console.log(h.date, h.name, h.type));`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/countries/US/holidays?year=2026"`,
      },
    ],
    responseExample: { success: true, data: { country: "US", year: 2026, holidays: [{ name: "New Year's Day", date: "2026-01-01", type: "federal" }, { name: "Independence Day", date: "2026-07-04", type: "federal" }] }, meta: { endpoint: "/api/v1/countries/:code/holidays", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "24h",
    rateLimited: true,
  },

  {
    slug: "countries/:code/working-hours",
    title: "GET /countries/:code/working-hours",
    method: "GET",
    apiPath: "/api/v1/countries/:code/working-hours",
    summary: "Working-day count + total hours for a year.",
    intro: [
      "Counts Monday–Friday excluding holidays. `hoursPerDay` lets you scale total hours — set to 7.5 for EU standards.",
    ],
    path: [
      { name: "code", type: "string", required: true, desc: "Two-letter ISO country code." },
    ],
    query: [
      { name: "year", type: "int", desc: "Calendar year. Defaults to current year." },
      { name: "hoursPerDay", type: "int", default: "8", desc: "Daily working hours for the `totalHours` multiplier." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.countries.workingHours("FR", { year: 2026, hoursPerDay: 7.5 });
// → { country: "FR", year: 2026, hoursPerDay: 7.5,
//     workingDays: 253, totalHours: 1897.5, holidays: 11 }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/countries/FR/working-hours?year=2026&hoursPerDay=7.5"`,
      },
    ],
    responseExample: { success: true, data: { country: "FR", year: 2026, hoursPerDay: 7.5, workingDays: 253, totalHours: 1897.5, holidays: 11 }, meta: { endpoint: "/api/v1/countries/:code/working-hours", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "24h",
    rateLimited: true,
  },

  // ── Pairs ───────────────────────────────────────────────────────────────
  {
    slug: "pairs/:from/:to",
    title: "GET /pairs/:from/:to",
    method: "GET",
    apiPath: "/api/v1/pairs/:from/:to",
    summary: "City-pair snapshot (powers programmatic SEO landing pages).",
    intro: [
      "Returns the live time in both cities, the hour difference, and a 'best time to call' suggestion. Designed as the data source for `/<from>-to-<to>` SEO pages.",
    ],
    path: [
      { name: "from", type: "string", required: true, desc: "Source city — code, alias, or IATA." },
      { name: "to",   type: "string", required: true, desc: "Target city — code, alias, or IATA." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.pairs.get("NYC", "TYO");
// → { from: { city: "New York", time: "23:14:09", ... },
//     to:   { city: "Tokyo",    time: "12:14:09", ... },
//     differenceHours: 13,
//     bestTimeToCall: { fromLocal: "9:00 AM", toLocal: "22:00:00" } }`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl https://timeanddatepro.com/api/v1/pairs/NYC/TYO`,
      },
    ],
    responseExample: { success: true, data: { from: { tz: "America/New_York", city: "New York", code: "NYC", time: "23:14:09", utcOffset: "-04:00", abbr: "EDT" }, to: { tz: "Asia/Tokyo", city: "Tokyo", code: "TYO", time: "12:14:09", utcOffset: "+09:00", abbr: "JST" }, differenceHours: 13, bestTimeToCall: { fromLocal: "9:00 AM", toLocal: "22:00:00" } }, meta: { endpoint: "/api/v1/pairs/:from/:to", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "60s",
    rateLimited: true,
  },

  // ── Meeting ─────────────────────────────────────────────────────────────
  {
    slug: "meeting/best",
    title: "GET /meeting/best",
    method: "GET",
    apiPath: "/api/v1/meeting/best",
    summary: "Ranked best-overlap meeting slots across multiple cities.",
    intro: [
      "Returns the top 6 candidate hours ranked by how many cities fall inside working hours. Each slot shows the UTC hour plus the local time at each city.",
      "Anchored on a fixed Wednesday so weekend daylight doesn't bias the score — what you get is a typical-workday distribution that callers can reason about.",
    ],
    query: [
      { name: "cities", type: "city-list", required: true, desc: "Comma-separated cities (NYC,LDN,TYO)." },
      { name: "start", type: "int", default: "9", desc: "Working-hours start hour (0-23), per-city local." },
      { name: "end", type: "int", default: "17", desc: "Working-hours end hour (0-23), per-city local." },
      { name: "duration", type: "int", default: "60", desc: "Slot length in minutes." },
    ],
    samples: [
      {
        lang: "node",
        label: "Node.js",
        code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const result = await client.meeting.best({ cities: ["NYC", "LDN", "TYO"] });
result.topSlots.forEach((slot) => {
  console.log(slot.utcHour + ":00Z", slot.score.toFixed(2));
});`,
      },
      {
        lang: "curl",
        label: "cURL",
        code: `curl "https://timeanddatepro.com/api/v1/meeting/best?cities=NYC,LDN,TYO"`,
      },
    ],
    responseExample: { success: true, data: { cities: ["New York", "London", "Tokyo"], workingHours: { start: 9, end: 17 }, duration: 60, topSlots: [{ utcHour: 13, perCity: [{ city: "New York", tz: "America/New_York", localTime: "09:00:00", utcOffset: "-04:00" }, { city: "London", tz: "Europe/London", localTime: "14:00:00", utcOffset: "+01:00" }, { city: "Tokyo", tz: "Asia/Tokyo", localTime: "22:00:00", utcOffset: "+09:00" }], score: 0.667 }] }, meta: { endpoint: "/api/v1/meeting/best", version: "1.0.0", generatedAt: "2026-07-08T23:14:09.000Z" } },
    cache: "no-cache",
    rateLimited: true,
  },
  // ========== Data-source APIs (Phase 7 of landing page plan) ==========
  // ========== Data-source APIs (Phase 7 of landing page plan) ==========
  {
    slug: "time/sun",
    title: "GET /time/sun",
    method: "GET",
    summary: "Compute sun position (sunrise, sunset, solar noon, day length, azimuth, elevation) for a coordinate. Uses suncalc client-side, no external API call.",
    apiPath: "/api/v1/time/sun",
    intro: ["Compute sun position for a coordinate at a given date. Uses suncalc (MIT, ~5KB), no external API. Attribution: suncalc."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/time/sun?lat=40.71&lng=-74.01&tz=America/New_York"` }],
    query: [
      { name: "lat",  type: "int",     required: true,  desc: "Latitude in decimal degrees" },
      { name: "lng",  type: "int",     required: true,  desc: "Longitude in decimal degrees" },
      { name: "date", type: "iso-date", desc: "Date (default today)" },
      { name: "tz",   type: "string",  desc: "IANA timezone for sunrise/sunset output (default UTC)" },
    ],
    responseExample: { success: true, data: { sunrise: "06:39:25", sunset: "20:29:39", dayLength: "13h 50m", attribution: "suncalc" } },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  {
    slug: "time/sync",
    title: "GET /time/sync",
    method: "GET",
    summary: "Server time + clock-drift estimate. Clients compare to local Date.now() to compute drift.",
    apiPath: "/api/v1/time/sync",
    intro: ["Returns the server authoritative time. No-cache."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/time/sync"` }],
    query: [{ name: "clientTime", type: "int", desc: "Client local Date.now() in ms" }],
    responseExample: { success: true, data: { serverTimeMs: 1733616668504, isoTimestamp: "2026-07-09T17:04:28.504Z", driftMs: 0 } },
    cache: "no-cache",
    rateLimited: true,
  },
  {
    slug: "dst",
    title: "GET /dst",
    method: "GET",
    summary: "DST transitions for a timezone in a year.",
    apiPath: "/api/v1/dst",
    intro: ["Detect spring-forward / fall-back by sampling Intl.DateTimeFormat offsets."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/dst?tz=America/New_York&year=2026"` }],
    query: [
      { name: "tz",   type: "string", required: true, desc: "IANA timezone" },
      { name: "year", type: "int",    desc: "Year (default current)" },
    ],
    responseExample: { success: true, data: { timezone: "America/New_York", year: 2026, observesDst: true, transitions: 2 } },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  {
    slug: "holidays/today",
    title: "GET /holidays/today",
    method: "GET",
    summary: "Holiday lookup for a country on a date.",
    apiPath: "/api/v1/holidays/today",
    intro: ["Public holidays for 30+ countries. timeanddate.com + Wikipedia + manual curation."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/holidays/today?country=US&date=2026-07-04"` }],
    query: [
      { name: "country", type: "string",   required: true, desc: "ISO 3166-1 alpha-2" },
      { name: "date",    type: "iso-date", desc: "Date (default today)" },
    ],
    responseExample: { success: true, data: { country: "US", date: "2026-07-04", holiday: { name_en: "Independence Day", type: "public" } } },
    cache: "public, max-age=3600",
    rateLimited: true,
  },
  {
    slug: "events/upcoming",
    title: "GET /events/upcoming",
    method: "GET",
    summary: "Aggregated upcoming events: FIFA World Cup, Olympics, tennis, cricket, public holidays.",
    apiPath: "/api/v1/events/upcoming",
    intro: ["Powers the landing page news section. SEO boost: each event becomes queryable."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/events/upcoming?limit=5"` }],
    query: [
      { name: "limit",   type: "int",    desc: "Max events (default 10)" },
      { name: "source",  type: "string", desc: "Filter: sports | holiday | observance" },
      { name: "country", type: "string", desc: "Filter by country" },
    ],
    responseExample: { success: true, data: { events: [{ id: "wc2026-quarter-finals", title: "FIFA World Cup 2026 Quarterfinals", countdown: "1 day, 2h" }] } },
    cache: "public, max-age=3600",
    rateLimited: true,
  },
  {
    slug: "events/next",
    title: "GET /events/next",
    method: "GET",
    summary: "Single next big event with countdown. Used by landing page hero.",
    apiPath: "/api/v1/events/next",
    intro: ["Returns the next upcoming event with a human-readable countdown string."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/events/next"` }],
    responseExample: { success: true, data: { event: { id: "wc2026-quarter-finals", title: "FIFA World Cup 2026 Quarterfinals", countdown: "1 day, 2h" } } },
    cache: "public, max-age=3600",
    rateLimited: true,
  },
  {
    slug: "onthisday",
    title: "GET /onthisday",
    method: "GET",
    summary: "Historical events, births, deaths. Wraps Wikipedia REST API. Attribution: Wikipedia (CC BY-SA).",
    apiPath: "/api/v1/onthisday",
    intro: ["Returns 3 events, 2 births, 2 deaths for the date, ranked by recency + substance."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/onthisday?month=7&day=4"` }],
    query: [
      { name: "month", type: "int", desc: "1-12 (default current)" },
      { name: "day",   type: "int", desc: "1-31 (default current)" },
      { name: "limit", type: "int", desc: "Per-section cap (default 20)" },
    ],
    responseExample: { success: true, data: { month: 7, day: 4, headlines: { events: ["1776 - US Declaration of Independence"], births: ["1804 - Nathaniel Hawthorne"], deaths: ["1826 - Thomas Jefferson"] }, attribution: "Wikipedia (CC BY-SA)" } },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  {
    slug: "quotes/random",
    title: "GET /quotes/random",
    method: "GET",
    summary: "Context-aware quote picker. Scores by time-of-day + day-of-week + country + holiday.",
    apiPath: "/api/v1/quotes/random",
    intro: ["Selector: +2 time-of-day, +1 day-of-week, +1 country, +3 holiday. Avoids last-picked."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/quotes/random?country=us"` }],
    query: [
      { name: "locale",      type: "string", desc: "Pool language (default en)" },
      { name: "country",     type: "string", desc: "For country-tag matching" },
      { name: "lastQuoteId", type: "string", desc: "Quote ID to exclude" },
      { name: "isHoliday",   type: "string", desc: "true | false" },
    ],
    responseExample: { success: true, data: { id: "en-q22", text: "In the morning, the world is fresh. So are you.", tags: ["morning"] } },
    cache: "no-cache",
    rateLimited: true,
  },
  {
    slug: "popular/cities",
    title: "GET /popular/cities",
    method: "GET",
    summary: "Top N popular cities by global search volume.",
    apiPath: "/api/v1/popular/cities",
    intro: ["Curated from Google Trends + Wikipedia pageview data. Top 20 by global interest."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/popular/cities?limit=20"` }],
    query: [{ name: "limit", type: "int", desc: "1-100 (default 20)" }],
    responseExample: { success: true, data: { cities: [{ rank: 1, code: "NYC", name: "New York", countryCode: "US" }] } },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  {
    slug: "browse/home",
    title: "GET /browse/home",
    method: "GET",
    summary: "Composite snapshot for the landing page hero.",
    apiPath: "/api/v1/browse/home",
    intro: ["One round-trip: time, sync, sun, holiday, next event, top 5/20, quote, on-this-day, DST."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/browse/home?country=us"` }],
    query: [{ name: "country", type: "string", desc: "User country for quote + holiday picking" }],
    responseExample: { success: true, data: { fetchedAt: "2026-07-09T17:04:28Z", home: "Wesley Chapel, US", topFiveCount: 5, topTwentyCount: 20, quote: "In the morning, the world is fresh. So are you." } },
    cache: "public, max-age=60",
    rateLimited: true,
  },
  // ── Currency ───────────────────────────────────────────────────────────
  {
    slug: "currency/rates",
    title: "GET /currency/rates",
    method: "GET",
    summary: "Live exchange rates against a chosen base. Source: European Central Bank eurofxref daily feed (CC-BY 4.0).",
    apiPath: "/api/v1/currency/rates",
    intro: ["Returns 33 ISO 4217 currencies quoted against the requested base. Falls back to a curated offline snapshot when upstream is unreachable."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/currency/rates?base=USD"` }],
    query: [{ name: "base", type: "string", desc: "ISO 4217 base code (default USD)" }],
    responseExample: { success: true, data: { base: "USD", date: "2026-07-09", source: "ecb", fetchedAt: "2026-07-09T16:00:00Z", rates: [{ code: "EUR", rate: 0.8745, info: { name: "Euro", symbol: "€", flag: "🇪🇺" } }] } },
    cache: "public, max-age=3600",
    rateLimited: true,
  },
  {
    slug: "currency/convert",
    title: "GET /currency/convert",
    method: "GET",
    summary: "Convert an amount between two ISO 4217 currencies.",
    apiPath: "/api/v1/currency/convert",
    intro: ["Cross-rate conversion via EUR. Returns the result, the rate, the inverse rate, the source date, and whether data came from the live ECB feed or the offline fallback."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/currency/convert?amount=100&from=USD&to=EUR"` }],
    query: [
      { name: "amount", type: "int", required: true, desc: "Numeric amount to convert" },
      { name: "from",   type: "string", required: true, desc: "Source currency code" },
      { name: "to",     type: "string", required: true, desc: "Target currency code" },
    ],
    responseExample: { success: true, data: { amount: 100, from: "USD", to: "EUR", rate: 0.8745, result: 87.45, date: "2026-07-09", source: "ecb", inverse: 1.1435, formatted: "87.45" } },
    cache: "public, max-age=300",
    rateLimited: true,
  },
  {
    slug: "currency/codes",
    title: "GET /currency/codes",
    method: "GET",
    summary: "Catalog of supported currencies with display metadata.",
    apiPath: "/api/v1/currency/codes",
    intro: ["Returns the 33 shipped ISO 4217 codes with name, symbol, flag emoji, decimal precision, and primary territories."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/currency/codes"` }],
    responseExample: { success: true, data: [{ code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", decimals: 2, primaryIn: ["US"] }] },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  // ── Wikipedia enrichment ───────────────────────────────────────────
  {
    slug: "news/by-country",
    title: "GET /news/by-country",
    method: "GET",
    summary: "Latest news headlines for a specific country, aggregated from per-country RSS feeds (BBC, NYT, Le Monde, NHK, etc.).",
    apiPath: "/api/v1/news/by-country",
    intro: ["Aggregates the curated country feed list for the given ISO 3166-1 alpha-2 code. Falls back to global feeds if no country-specific feed is configured."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/news/by-country?country=US&limit=10"` }],
    query: [
      { name: "country", type: "string", required: true, desc: "ISO 3166-1 alpha-2 country code" },
      { name: "limit",   type: "int", desc: "1-30 (default 12)" },
    ],
    responseExample: { success: true, data: { fetchedAt: "2026-07-09T18:00:00Z", sources: [{ id: "nyt-us", name: "New York Times — U.S." }], items: [{ title: "...", link: "...", pubDate: "2026-07-09T16:45:00Z", source: { id: "nyt-us" } }], attribution: ["The New York Times"] } },
    cache: "public, max-age=900",
    rateLimited: true,
  },
  {
    slug: "news/by-category",
    title: "GET /news/by-category",
    method: "GET",
    summary: "Top stories tagged with a category (world, science, technology, sports).",
    apiPath: "/api/v1/news/by-category",
    intro: ["Aggregates feeds tagged with the given category. Built for the landing page news rail."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/news/by-category?category=technology&limit=10"` }],
    query: [
      { name: "category", type: "string", required: true, desc: "world | technology | science | sports | business | entertainment" },
      { name: "limit",    type: "int", desc: "1-30 (default 12)" },
    ],
    responseExample: { success: true, data: { fetchedAt: "2026-07-09T18:00:00Z", sources: [], items: [], attribution: [] } },
    cache: "public, max-age=900",
    rateLimited: true,
  },
  {
    slug: "news/global",
    title: "GET /news/global",
    method: "GET",
    summary: "Global top headlines aggregated from every curated source.",
    apiPath: "/api/v1/news/global",
    intro: ["Slower than /news/by-category because it pulls every feed. Useful for admin observability."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/news/global?limit=25"` }],
    query: [{ name: "limit", type: "int", desc: "1-50 (default 20)" }],
    responseExample: { success: true, data: { fetchedAt: "2026-07-09T18:00:00Z", sources: [], items: [], attribution: [] } },
    cache: "public, max-age=900",
    rateLimited: true,
  },
  {
    slug: "news/feeds",
    title: "GET /news/feeds",
    method: "GET",
    summary: "Catalog of curated RSS sources (id, name, URL, category, country, attribution).",
    apiPath: "/api/v1/news/feeds",
    intro: ["Powers the admin panel feed picker and the docs landing. Each source has its own attribution string."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/news/feeds"` }],
    responseExample: { success: true, data: { feeds: [{ id: "nyt-world", name: "New York Times — World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: "world", language: "en", attribution: "The New York Times" }], count: 27 } },
    cache: "public, max-age=3600",
    rateLimited: true,
  },
  {
    slug: "history/by-country",
    title: "GET /history/by-country",
    method: "GET",
    summary: "Wikipedia 'On This Day' events filtered by country. Attribution: Wikipedia (CC BY-SA).",
    apiPath: "/api/v1/history/by-country",
    intro: ["Filters the daily Wikipedia on-this-day feed against a curated alias list per country (e.g. US aliases: 'United States', 'American', 'U.S.', etc.)."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/history/by-country?country=FR&month=7&day=14"` }],
    query: [
      { name: "country", type: "string",  required: true, desc: "ISO 3166-1 alpha-2 code" },
      { name: "month",   type: "int",    desc: "1-12 (default current)" },
      { name: "day",     type: "int",    desc: "1-31 (default current)" },
      { name: "limit",   type: "int",    desc: "1-50 per section (default 12)" },
    ],
    responseExample: { success: true, data: { country: "France", countryCode: "FR", month: 7, day: 14, events: [{ year: 1789, text: "The French Revolution ..." }], births: [], deaths: [], attribution: "Wikipedia (CC BY-SA)" } },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  {
    slug: "history/countries",
    title: "GET /history/countries",
    method: "GET",
    summary: "List of ISO codes with curated country history coverage.",
    apiPath: "/api/v1/history/countries",
    intro: ["Currently 28 countries. Add a country by appending to COUNTRY_ALIASES in src/utils/countryHistoryApi.ts."],
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://timeanddatepro.com/api/v1/history/countries"` }],
    responseExample: { success: true, data: ["AR", "AU", "BR", "CA", "CH", "CL", "CN", "DE", "DK", "EG", "ES", "FI", "FR", "GB", "GR", "IL", "IN", "IT", "JP", "KR", "MX", "NL", "NO", "PL", "PT", "RU", "SE", "TR", "US", "ZA"] },
    cache: "public, max-age=86400",
    rateLimited: true,
  },
  {
    slug: "feedback",
    title: "GET /feedback",
    method: "GET",
    summary: "List community feedback + tool suggestions, sorted by votes by default.",
    apiPath: "/api/v1/feedback",
    intro: [
      "Backs the /feedback page. Query params: ?sort=votes|recent, ?type=suggestion|bug|idea|general, ?limit=1..100.",
      "The 6 seed entries (embeddable widget, ICS download, Slack integration, DST reminders, etc.) ship on first run.",
    ],
    samples: [
      { lang: "curl", label: "cURL — top voted", code: `curl "https://timeanddatepro.com/api/v1/feedback?sort=votes&limit=10"` },
      { lang: "curl", label: "cURL — bug reports only", code: `curl "https://timeanddatepro.com/api/v1/feedback?type=bug"` },
      { lang: "curl", label: "cURL — most recent", code: `curl "https://timeanddatepro.com/api/v1/feedback?sort=recent"` },
    ],
    responseExample: {
      success: true,
      data: {
        entries: [
          { id: "seed-1", type: "suggestion", title: "Embeddable world clock widget for any website", description: "A one-line iframe that any site can drop in to show a live world clock.", author: null, votes: 47, status: "planned", createdAt: "2025-06-18T12:00:00.000Z" },
          { id: "seed-2", type: "suggestion", title: "Public holiday calendar download (ICS / Google Calendar)", description: "One-click import of any country's public holidays.", author: null, votes: 38, status: "planned", createdAt: "2025-07-01T12:00:00.000Z" },
        ],
        count: 2,
      },
    },
    cache: "public, max-age=30",
    rateLimited: true,
  },
  {
    slug: "feedback/top",
    title: "GET /feedback/top",
    method: "GET",
    summary: "Shortcut for sort=votes&limit=10. Optional ?type= filter.",
    apiPath: "/api/v1/feedback/top",
    intro: ["Designed for dashboards, embeddable widgets, and 'most popular suggestions' surfaces."],
    samples: [
      { lang: "curl", label: "cURL — top 10", code: `curl "https://timeanddatepro.com/api/v1/feedback/top"` },
      { lang: "curl", label: "cURL — top 3 ideas", code: `curl "https://timeanddatepro.com/api/v1/feedback/top?type=idea&limit=3"` },
    ],
    responseExample: {
      success: true,
      data: {
        entries: [
          { id: "seed-1", type: "suggestion", title: "Embeddable world clock widget for any website", description: "A one-line iframe that any site can drop in to show a live world clock.", author: null, votes: 47, status: "planned", createdAt: "2025-06-18T12:00:00.000Z" },
        ],
        count: 1,
      },
    },
    cache: "public, max-age=30",
    rateLimited: true,
  },
  {
    slug: "feedback/post",
    title: "POST /feedback",
    method: "POST",
    summary: "Submit a new feedback entry. Auto-votes on creation.",
    apiPath: "/api/v1/feedback",
    intro: [
      "Body: { type, title, description, author? }. type must be one of suggestion|bug|idea|general.",
      "Title 3-120 chars. Description 10-800 chars. Rate-limited per IP.",
    ],
    samples: [
      { lang: "curl", label: "cURL", code: `curl -X POST "https://timeanddatepro.com/api/v1/feedback" -H "Content-Type: application/json" -d '{"type":"suggestion","title":"Light theme option","description":"Add a high-contrast light theme for daytime use."}'` },
    ],
    responseExample: { success: true, data: { id: "fb-l1q2m3-ab12cd", type: "suggestion", title: "Light theme option", description: "Add a high-contrast light theme for daytime use.", author: null, votes: 1, status: "open", createdAt: "2026-07-10T22:00:00.000Z" } },
    cache: "no-store",
    rateLimited: true,
  },
  {
    slug: "feedback/vote",
    title: "POST /feedback/:id/vote",
    method: "POST",
    summary: "Upvote an entry. One vote per device, identified by IP + User-Agent hash.",
    apiPath: "/api/v1/feedback/:id/vote",
    intro: ["Returns 409 if the device has already voted on this entry. The page UI caches the voted set in localStorage for snappy feedback."],
    samples: [
      { lang: "curl", label: "cURL", code: `curl -X POST "https://timeanddatepro.com/api/v1/feedback/seed-1/vote"` },
    ],
    responseExample: { success: true, data: { id: "seed-1", type: "suggestion", title: "Embeddable world clock widget for any website", description: "A one-line iframe that any site can drop in to show a live world clock.", author: null, votes: 48, status: "planned", createdAt: "2025-06-18T12:00:00.000Z" } },
    cache: "no-store",
    rateLimited: true,
  },
  /* placeholder - real entries inserted below */

  // ── v2 Search (D1, 13 edge cases) ─────────────────────
  {
    slug: "v2-search",
    title: "GET /api/v2/search",
    method: "GET",
    summary: "Full-text search with disambiguation, diacritics, fuzzy matching, timezone + location filters, locale-aware country names. Backed by D1 (5,081 cities, 194 countries, 3,865 states, 312 timezones).",
    apiPath: "/api/v2/search",
    intro: [
      "Handles all 13 edge cases from the spec: same-name disambiguation, city/state/country types, exact > prefix > substring, diacritics, abbreviations, fuzzy misspellings, city+state patterns, country codes, location-aware ranking, timezone grouping, pagination, and locale-aware results.",
      "Query param `q` is required. Returns a paginated `results` array where each item has a `type` field (city|country|state).",
    ],
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v2/search?q=Hyderabad&limit=3"` },
      { lang: "curl", label: "With location boost", code: `curl "https://dev.api.dateandtime.live/api/v2/search?q=York&near=40.7128,-74.0060&limit=3"` },
      { lang: "curl", label: "Timezone filter", code: `curl "https://dev.api.dateandtime.live/api/v2/search?q=a&tz=America/New_York&limit=10"` },
    ],
    responseExample: {
      success: true,
      data: {
        query: "Hyderabad",
        parsed: { raw: "Hyderabad", primary: "Hyderabad", type: "city" },
        total: 2, page: 1, limit: 3, hasMore: false,
        results: [
          { type: "city", id: 1269843, name: "Hyderabad", countryCode: "IN", countryName: "India", stateName: "Telangana", timezone: "Asia/Kolkata", population: 6993262, isCapital: false, score: 1001.37 },
          { type: "city", id: 1176734, name: "Hyderabad", countryCode: "PK", countryName: "Pakistan", stateName: "Sindh", timezone: "Asia/Karachi", population: 1386330, isCapital: false, score: 1001.26 },
        ],
        breakdown: { cities: 2, countries: 0, states: 0 },
      },
    },
    cache: "no-store",
  },
  // ── Countries (D1, 194) ────────────────────────────────
  {
    slug: "countries-list",
    title: "GET /api/v1/countries",
    method: "GET",
    summary: "List all 194 countries with full ISO 3166 data. Backed by D1 (mledoze/restcountries dataset).",
    apiPath: "/api/v1/countries",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/countries?limit=5"` },
      { lang: "curl", label: "Filter by region", code: `curl "https://dev.api.dateandtime.live/api/v1/countries?region=Asia&limit=10"` },
    ],
    responseExample: {
      success: true,
      data: { count: 5, countries: [{ code: "JP", code3: "JPN", name: "Japan", capital: "Tokyo", region: "Asia", subregion: "Eastern Asia", languages: [{ iso639_1: "jpn", name: "Japanese" }], currencies: [{ iso4217: "JPY", name: "Japanese yen", symbol: "¥" }], timezones: ["Asia/Tokyo"], population: 125710000 }] },
    },
  },
  {
    slug: "country-get",
    title: "GET /api/v1/countries/:code",
    method: "GET",
    summary: "Get a single country by cca2, cca3, or IOC code.",
    apiPath: "/api/v1/countries/:code",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/countries/JP"` }],
    responseExample: { success: true, data: { code: "JP", code3: "JPN", name: "Japan", capital: "Tokyo", region: "Asia", timezones: ["Asia/Tokyo"], languages: [{ name: "Japanese" }] } },
  },
  {
    slug: "country-cities",
    title: "GET /api/v1/countries/:code/cities",
    method: "GET",
    summary: "List cities in a country, ordered by population. Backed by D1.",
    apiPath: "/api/v1/countries/:code/cities",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/countries/GB/cities?limit=5"` }],
  },
  // ── Popular cities (D1) ────────────────────────────────
  {
    slug: "popular-cities",
    title: "GET /api/v1/popular/cities",
    method: "GET",
    summary: "Top N cities by population. Optional country filter. Backed by D1.",
    apiPath: "/api/v1/popular/cities",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/popular/cities?limit=5"` },
      { lang: "curl", label: "By country", code: `curl "https://dev.api.dateandtime.live/api/v1/popular/cities?country=JP&limit=3"` },
    ],
  },
  {
    slug: "popular-defaults",
    title: "GET /api/v1/popular/defaults",
    method: "GET",
    summary: "20 default city recommendations (highest population worldwide).",
    apiPath: "/api/v1/popular/defaults",
  },
  // ── Holidays (curated) ─────────────────────────────────
  {
    slug: "holidays-today",
    title: "GET /api/v1/holidays/today",
    method: "GET",
    summary: "Public holidays happening today. Optional country filter. 200+ curated holidays.",
    apiPath: "/api/v1/holidays/today",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/today"` },
      { lang: "curl", label: "By country", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/today?country=US"` },
    ],
  },
  {
    slug: "holidays-upcoming",
    title: "GET /api/v1/holidays/upcoming",
    method: "GET",
    summary: "Upcoming public holidays in the next N days (max 90).",
    apiPath: "/api/v1/holidays/upcoming",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/upcoming?country=US&days=30"` }],
  },
  {
    slug: "holidays-year",
    title: "GET /api/v1/holidays/year",
    method: "GET",
    summary: "All holidays for a country in a given year. Year param required.",
    apiPath: "/api/v1/holidays/year",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/year?country=GB&year=2026"` }],
  },
  // ── DST (computed) ─────────────────────────────────────
  {
    slug: "dst",
    title: "GET /api/v1/dst",
    method: "GET",
    summary: "DST status for a timezone. Computes offset in Jan vs Jul using Intl.DateTimeFormat.",
    apiPath: "/api/v1/dst",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/dst?tz=America/New_York"` },
    ],
  },
  {
    slug: "dst-upcoming",
    title: "GET /api/v1/dst/upcoming",
    method: "GET",
    summary: "Approximate DST transition dates for the current year (US + EU).",
    apiPath: "/api/v1/dst/upcoming",
  },
  // ── Quotes (curated) ───────────────────────────────────
  {
    slug: "quotes-random",
    title: "GET /api/v1/quotes/random",
    method: "GET",
    summary: "Random time-related quote. 20 curated quotes from Theophrastus, Einstein, etc.",
    apiPath: "/api/v1/quotes/random",
  },
  {
    slug: "quotes-ranked",
    title: "GET /api/v1/quotes/ranked",
    method: "GET",
    summary: "List of curated time-related quotes.",
    apiPath: "/api/v1/quotes/ranked",
  },
  // ── OnThisDay (curated) ────────────────────────────────
  {
    slug: "onthisday",
    title: "GET /api/v1/onthisday",
    method: "GET",
    summary: "Historical events for a given month/day. ~100 curated events across 12 months.",
    apiPath: "/api/v1/onthisday",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/onthisday"` },
      { lang: "curl", label: "Specific date", code: `curl "https://dev.api.dateandtime.live/api/v1/onthisday?month=7&day=20"` },
    ],
  },
  // ── Currency (static) ──────────────────────────────────
  {
    slug: "currency-rates",
    title: "GET /api/v1/currency/rates",
    method: "GET",
    summary: "Exchange rates for 36 currencies. Static snapshot from open.er-api.com (2024-01-01).",
    apiPath: "/api/v1/currency/rates",
  },
  {
    slug: "currency-convert",
    title: "GET /api/v1/currency/convert",
    method: "GET",
    summary: "Convert amount from one currency to another.",
    apiPath: "/api/v1/currency/convert",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/currency/convert?from=USD&to=EUR&amount=100"` }],
  },
  {
    slug: "currency-codes",
    title: "GET /api/v1/currency/codes",
    method: "GET",
    summary: "List of 36 supported currency codes with names and symbols.",
    apiPath: "/api/v1/currency/codes",
  },
  // ── Browse home (computed) ─────────────────────────────
  {
    slug: "browse-home",
    title: "GET /api/v1/browse/home",
    method: "GET",
    summary: "Home page data: top capital cities, today's holidays, OnThisDay. Powers the landing hero.",
    apiPath: "/api/v1/browse/home",
  },

  // ── v2 Search (D1, 13 edge cases) ─────────────────────
  {
    slug: "v2-search",
    title: "GET /api/v2/search",
    method: "GET",
    summary: "Full-text search with disambiguation, diacritics, fuzzy matching, timezone + location filters, locale-aware country names. Backed by D1 (5,081 cities, 194 countries, 3,865 states, 312 timezones).",
    apiPath: "/api/v2/search",
    intro: [
      "Handles all 13 edge cases from the spec: same-name disambiguation, city/state/country types, exact > prefix > substring, diacritics, abbreviations, fuzzy misspellings, city+state patterns, country codes, location-aware ranking, timezone grouping, pagination, and locale-aware results.",
      "Query param `q` is required. Returns a paginated `results` array where each item has a `type` field (city|country|state).",
    ],
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v2/search?q=Hyderabad&limit=3"` },
      { lang: "curl", label: "With location boost", code: `curl "https://dev.api.dateandtime.live/api/v2/search?q=York&near=40.7128,-74.0060&limit=3"` },
      { lang: "curl", label: "Timezone filter", code: `curl "https://dev.api.dateandtime.live/api/v2/search?q=a&tz=America/New_York&limit=10"` },
    ],
    responseExample: {
      success: true,
      data: {
        query: "Hyderabad",
        parsed: { raw: "Hyderabad", primary: "Hyderabad", type: "city" },
        total: 2, page: 1, limit: 3, hasMore: false,
        results: [
          { type: "city", id: 1269843, name: "Hyderabad", countryCode: "IN", countryName: "India", stateName: "Telangana", timezone: "Asia/Kolkata", population: 6993262, isCapital: false, score: 1001.37 },
          { type: "city", id: 1176734, name: "Hyderabad", countryCode: "PK", countryName: "Pakistan", stateName: "Sindh", timezone: "Asia/Karachi", population: 1386330, isCapital: false, score: 1001.26 },
        ],
        breakdown: { cities: 2, countries: 0, states: 0 },
      },
    },
    cache: "no-store",
  },
  // ── Countries (D1, 194) ────────────────────────────────
  {
    slug: "countries-list",
    title: "GET /api/v1/countries",
    method: "GET",
    summary: "List all 194 countries with full ISO 3166 data. Backed by D1 (mledoze/restcountries dataset).",
    apiPath: "/api/v1/countries",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/countries?limit=5"` },
      { lang: "curl", label: "Filter by region", code: `curl "https://dev.api.dateandtime.live/api/v1/countries?region=Asia&limit=10"` },
    ],
    responseExample: {
      success: true,
      data: { count: 5, countries: [{ code: "JP", code3: "JPN", name: "Japan", capital: "Tokyo", region: "Asia", subregion: "Eastern Asia", languages: [{ iso639_1: "jpn", name: "Japanese" }], currencies: [{ iso4217: "JPY", name: "Japanese yen", symbol: "¥" }], timezones: ["Asia/Tokyo"], population: 125710000 }] },
    },
  },
  {
    slug: "country-get",
    title: "GET /api/v1/countries/:code",
    method: "GET",
    summary: "Get a single country by cca2, cca3, or IOC code.",
    apiPath: "/api/v1/countries/:code",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/countries/JP"` }],
    responseExample: { success: true, data: { code: "JP", code3: "JPN", name: "Japan", capital: "Tokyo", region: "Asia", timezones: ["Asia/Tokyo"], languages: [{ name: "Japanese" }] } },
  },
  {
    slug: "country-cities",
    title: "GET /api/v1/countries/:code/cities",
    method: "GET",
    summary: "List cities in a country, ordered by population. Backed by D1.",
    apiPath: "/api/v1/countries/:code/cities",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/countries/GB/cities?limit=5"` }],
  },
  // ── Popular cities (D1) ────────────────────────────────
  {
    slug: "popular-cities",
    title: "GET /api/v1/popular/cities",
    method: "GET",
    summary: "Top N cities by population. Optional country filter. Backed by D1.",
    apiPath: "/api/v1/popular/cities",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/popular/cities?limit=5"` },
      { lang: "curl", label: "By country", code: `curl "https://dev.api.dateandtime.live/api/v1/popular/cities?country=JP&limit=3"` },
    ],
  },
  {
    slug: "popular-defaults",
    title: "GET /api/v1/popular/defaults",
    method: "GET",
    summary: "20 default city recommendations (highest population worldwide).",
    apiPath: "/api/v1/popular/defaults",
  },
  // ── Holidays (curated) ─────────────────────────────────
  {
    slug: "holidays-today",
    title: "GET /api/v1/holidays/today",
    method: "GET",
    summary: "Public holidays happening today. Optional country filter. 200+ curated holidays.",
    apiPath: "/api/v1/holidays/today",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/today"` },
      { lang: "curl", label: "By country", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/today?country=US"` },
    ],
  },
  {
    slug: "holidays-upcoming",
    title: "GET /api/v1/holidays/upcoming",
    method: "GET",
    summary: "Upcoming public holidays in the next N days (max 90).",
    apiPath: "/api/v1/holidays/upcoming",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/upcoming?country=US&days=30"` }],
  },
  {
    slug: "holidays-year",
    title: "GET /api/v1/holidays/year",
    method: "GET",
    summary: "All holidays for a country in a given year. Year param required.",
    apiPath: "/api/v1/holidays/year",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/holidays/year?country=GB&year=2026"` }],
  },
  // ── DST (computed) ─────────────────────────────────────
  {
    slug: "dst",
    title: "GET /api/v1/dst",
    method: "GET",
    summary: "DST status for a timezone. Computes offset in Jan vs Jul using Intl.DateTimeFormat.",
    apiPath: "/api/v1/dst",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/dst?tz=America/New_York"` },
    ],
  },
  {
    slug: "dst-upcoming",
    title: "GET /api/v1/dst/upcoming",
    method: "GET",
    summary: "Approximate DST transition dates for the current year (US + EU).",
    apiPath: "/api/v1/dst/upcoming",
  },
  // ── Quotes (curated) ───────────────────────────────────
  {
    slug: "quotes-random",
    title: "GET /api/v1/quotes/random",
    method: "GET",
    summary: "Random time-related quote. 20 curated quotes from Theophrastus, Einstein, etc.",
    apiPath: "/api/v1/quotes/random",
  },
  {
    slug: "quotes-ranked",
    title: "GET /api/v1/quotes/ranked",
    method: "GET",
    summary: "List of curated time-related quotes.",
    apiPath: "/api/v1/quotes/ranked",
  },
  // ── OnThisDay (curated) ────────────────────────────────
  {
    slug: "onthisday",
    title: "GET /api/v1/onthisday",
    method: "GET",
    summary: "Historical events for a given month/day. ~100 curated events across 12 months.",
    apiPath: "/api/v1/onthisday",
    samples: [
      { lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/onthisday"` },
      { lang: "curl", label: "Specific date", code: `curl "https://dev.api.dateandtime.live/api/v1/onthisday?month=7&day=20"` },
    ],
  },
  // ── Currency (static) ──────────────────────────────────
  {
    slug: "currency-rates",
    title: "GET /api/v1/currency/rates",
    method: "GET",
    summary: "Exchange rates for 36 currencies. Static snapshot from open.er-api.com (2024-01-01).",
    apiPath: "/api/v1/currency/rates",
  },
  {
    slug: "currency-convert",
    title: "GET /api/v1/currency/convert",
    method: "GET",
    summary: "Convert amount from one currency to another.",
    apiPath: "/api/v1/currency/convert",
    samples: [{ lang: "curl", label: "cURL", code: `curl "https://dev.api.dateandtime.live/api/v1/currency/convert?from=USD&to=EUR&amount=100"` }],
  },
  {
    slug: "currency-codes",
    title: "GET /api/v1/currency/codes",
    method: "GET",
    summary: "List of 36 supported currency codes with names and symbols.",
    apiPath: "/api/v1/currency/codes",
  },
  // ── Browse home (computed) ─────────────────────────────
  {
    slug: "browse-home",
    title: "GET /api/v1/browse/home",
    method: "GET",
    summary: "Home page data: top capital cities, today's holidays, OnThisDay. Powers the landing hero.",
    apiPath: "/api/v1/browse/home",
  },
];
/** Lookup by the doc-page slug (matches docRoutes.ts). */
export function findEndpoint(slug: string): EndpointDoc | undefined {
  return ENDPOINT_CATALOG.find((e) => e.slug === slug);
}
