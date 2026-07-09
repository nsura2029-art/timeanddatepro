// src/utils/openapi.ts
// OpenAPI 3.1 specification for the TimeAndDatePro API.
// Surfaced at GET /api-docs (live JSON) and rendered at /docs/api-reference.

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "TimeAndDatePro API",
    version: "1.0.0",
    description:
      "REST API for global time, time zone, calendar, and event data. Free, no auth required for read endpoints. Cached per Cache-Control headers. Attribution required for Wikipedia-derived endpoints.",
    contact: {
      name: "TimeAndDatePro",
      url: "https://timeanddatepro.com",
      email: "api@timeanddatepro.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local dev" },
    { url: "https://timeanddatepro.com", description: "Production" },
  ],
  tags: [
    { name: "time", description: "Time math: now, convert, add, diff, unix, iso, words, sun, sync, dst" },
    { name: "locations", description: "Cities, countries, regions, popular" },
    { name: "converters", description: "Pair conversion + meeting finder" },
    { name: "discovery", description: "Holiday awareness + events + onthisday + quotes" },
    { name: "composite", description: "Pre-composed payloads for UI snapshots" },
  ],
  paths: {
    "/api/v1/time/sun": {
      get: {
        tags: ["time"],
        summary: "Sun position (sunrise, sunset, solar noon, day length, azimuth, elevation)",
        description:
          "Compute sun position for a coordinate at a given date. Uses suncalc (MIT, ~5KB), no external API. Attribution: suncalc.",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number", format: "float" }, example: 40.71 },
          { name: "lng", in: "query", required: true, schema: { type: "number", format: "float" }, example: -74.01 },
          { name: "date", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2026-07-09" },
          { name: "tz", in: "query", required: false, schema: { type: "string" }, example: "America/New_York" },
        ],
        responses: {
          200: { description: "Sun position", content: { "application/json": { schema: { $ref: "#/components/schemas/SunPosition" } } } },
          400: { description: "Missing lat or lng" },
        },
      },
    },
    "/api/v1/time/sync": {
      get: {
        tags: ["time"],
        summary: "Server time + clock-drift estimate",
        description:
          "Returns the server's authoritative time. Clients compare to their local Date.now() to compute drift. No-cache.",
        parameters: [
          { name: "clientTime", in: "query", required: false, schema: { type: "integer" }, description: "Client's local Date.now() in ms" },
        ],
        responses: { 200: { description: "Sync response" } },
      },
    },
    "/api/v1/dst": {
      get: {
        tags: ["time"],
        summary: "DST transitions for a timezone in a year",
        parameters: [
          { name: "tz", in: "query", required: true, schema: { type: "string" }, example: "America/New_York" },
          { name: "year", in: "query", required: false, schema: { type: "integer" }, example: 2026 },
        ],
        responses: { 200: { description: "DST info" } },
      },
    },
    "/api/v1/dst/upcoming": {
      get: {
        tags: ["time"],
        summary: "Upcoming DST changes across popular timezones",
        responses: { 200: { description: "List of upcoming DST changes" } },
      },
    },
    "/api/v1/holidays/today": {
      get: {
        tags: ["discovery"],
        summary: "Holiday lookup for a country on a date",
        parameters: [
          { name: "country", in: "query", required: true, schema: { type: "string" }, example: "US" },
          { name: "date", in: "query", required: false, schema: { type: "string", format: "date" } },
        ],
        responses: { 200: { description: "Holiday lookup result" } },
      },
    },
    "/api/v1/holidays/upcoming": {
      get: {
        tags: ["discovery"],
        summary: "Upcoming holidays for a country",
        parameters: [
          { name: "country", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 5 },
        ],
        responses: { 200: { description: "List of upcoming holidays" } },
      },
    },
    "/api/v1/holidays/year": {
      get: {
        tags: ["discovery"],
        summary: "All holidays for a country for the current + next year",
        parameters: [
          { name: "country", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Year's holidays" } },
      },
    },
    "/api/v1/popular/cities": {
      get: {
        tags: ["locations"],
        summary: "Top N popular cities by global search volume",
        parameters: [
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 20 },
        ],
        responses: { 200: { description: "List of popular cities" } },
      },
    },
    "/api/v1/popular/defaults": {
      get: {
        tags: ["locations"],
        summary: "Default favorites (5 cities near user's country)",
        parameters: [
          { name: "country", in: "query", required: false, schema: { type: "string" }, description: "ISO 3166-1 alpha-2 country code" },
        ],
        responses: { 200: { description: "List of 5 default favorite cities" } },
      },
    },
    "/api/v1/quotes/random": {
      get: {
        tags: ["discovery"],
        summary: "Pick a quote for the current context (time-of-day, day-of-week, country, holiday)",
        parameters: [
          { name: "locale", in: "query", required: false, schema: { type: "string" }, example: "en" },
          { name: "country", in: "query", required: false, schema: { type: "string" } },
          { name: "tag", in: "query", required: false, schema: { type: "string" } },
          { name: "lastQuoteId", in: "query", required: false, schema: { type: "string" }, description: "ID of last-picked quote to avoid" },
          { name: "isHoliday", in: "query", required: false, schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "Selected quote" } },
      },
    },
    "/api/v1/quotes/ranked": {
      get: {
        tags: ["discovery"],
        summary: "Top N quotes ranked for context",
        parameters: [
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 10 },
          { name: "exclude", in: "query", required: false, schema: { type: "string" }, description: "Comma-separated quote IDs to exclude" },
        ],
        responses: { 200: { description: "Ranked quotes" } },
      },
    },
    "/api/v1/events/upcoming": {
      get: {
        tags: ["discovery"],
        summary: "Upcoming events (sports + holidays + observances)",
        description: "Aggregates FIFA World Cup, Olympics, tennis, cricket + public holidays. Used by the landing page 'next big event' countdown + news section.",
        parameters: [
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 10 },
          { name: "source", in: "query", required: false, schema: { enum: ["sports", "holiday", "observance"] } },
          { name: "country", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: { 200: { description: "List of upcoming events" } },
      },
    },
    "/api/v1/events/next": {
      get: {
        tags: ["discovery"],
        summary: "Next single big event (used by hero countdown)",
        responses: { 200: { description: "Next event with countdown" } },
      },
    },
    "/api/v1/onthisday": {
      get: {
        tags: ["discovery"],
        summary: "Historical events, births, deaths on a date (Wikipedia wrapper)",
        description:
          "Wraps Wikipedia REST API. Attribution: Wikipedia (CC BY-SA). Cache-Control: 1 day per date.",
        parameters: [
          { name: "month", in: "query", required: false, schema: { type: "integer" } },
          { name: "day", in: "query", required: false, schema: { type: "integer" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 20 },
        ],
        responses: { 200: { description: "On-this-day feed" } },
      },
    },
    "/api/v1/browse/home": {
      get: {
        tags: ["composite"],
        summary: "Composite snapshot for the landing page hero",
        description:
          "One round-trip returns everything the landing page hero needs: time, sync, sun, holiday, next event, top 5/20 cities, quote, on-this-day, DST changes. Cache-Control: 60s.",
        parameters: [
          { name: "country", in: "query", required: false, schema: { type: "string" }, description: "User's country for quote + holiday picking" },
        ],
        responses: { 200: { description: "Composite home data" } },
      },
    },
  },
  components: {
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
          meta: {
            type: "object",
            properties: {
              request_id: { type: "string", format: "uuid" },
              timestamp: { type: "integer" },
              cached: { type: "boolean" },
              tz: { type: "string" },
              version: { type: "string", enum: ["v1"] },
            },
          },
          errors: { type: "array" },
        },
      },
      SunPosition: {
        type: "object",
        properties: {
          sunrise: { type: "string", nullable: true },
          sunset: { type: "string", nullable: true },
          solarNoon: { type: "string", nullable: true },
          dayLength: { type: "integer", description: "seconds" },
          dayLengthFormatted: { type: "string", example: "13h 50m" },
          azimuthAtNoon: { type: "integer" },
          elevationAtNoon: { type: "integer" },
          twilight: {
            type: "object",
            properties: { nightEnd: { type: "string" }, nightBegin: { type: "string" } },
          },
          attribution: { type: "string", enum: ["suncalc"] },
        },
      },
    },
  },
};

export function openapiSpec() {
  return OPENAPI_SPEC;
}