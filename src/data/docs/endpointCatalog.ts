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
];

/** Lookup by the doc-page slug (matches docRoutes.ts). */
export function findEndpoint(slug: string): EndpointDoc | undefined {
  return ENDPOINT_CATALOG.find((e) => e.slug === slug);
}
