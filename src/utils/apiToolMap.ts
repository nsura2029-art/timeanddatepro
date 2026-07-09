// src/utils/apiToolMap.ts
// Per-tool API verification registry. Maps each web tool to its primary
// /api/v1/* endpoint + a "signature" derived from the tool's current state.
//
// The ApiVerifyChip reads this to:
//   1. debounce-fire the corresponding API call when tool inputs change
//   2. show a ✓ "matches API" pill (when a comparator is provided) or
//      just a ✓ "called API" pill (eyeball verification via the JSON panel)
//   3. expand on click to show the raw response + link to the docs page
//
// Adding a new tool = one entry here. The chip is the same component.

export type ToolSlug =
  | "unix"
  | "iso8601"
  | "date-words"
  | "date-math"
  | "date-diff"
  | "holidays"
  | "working-hours"
  | "time-zone-converter"
  | "meeting-finder"
  | "world-clock";

export interface ToolVerifyConfig<TState = any> {
  /** Identifier matching the chip's `data-tool` and the docs integrations slug. */
  slug: ToolSlug;
  /** Human label shown in the chip tooltip + docs link. */
  label: string;
  /** API endpoint path. */
  endpoint: string;
  /** Build URLSearchParams from the tool's current state. */
  buildParams: (state: TState) => URLSearchParams;
  /**
   * Optional strict comparator. Receives the full `success: true` API response
   * and the current tool state. Returns:
   *   { match: true }                               — green ✓
   *   { match: false, details: "…" }                — amber ✗ with the diff
   * If omitted, the chip shows ✓ "verified (open to compare)" so the user
   * eyeballs the response in the expandable panel.
   */
  compare?: (apiResponse: any, state: TState) => { match: boolean; details?: string };
  /** Path that opens in a new tab when the user clicks "Full docs". */
  docsHref: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Unix Timestamp  (/en/unix)
// Local answer: new Date(epoch * unit).toISOString()
// API answer:   data.iso
// ──────────────────────────────────────────────────────────────────────────
export const unixVerify: ToolVerifyConfig<{ epoch: number; unit: "s" | "ms" }> = {
  slug: "unix",
  label: "Unix Timestamp",
  endpoint: "/api/v1/time/unix",
  docsHref: "/docs/integrations/unix-timestamp",
  buildParams: ({ epoch, unit }) => {
    const q = new URLSearchParams({ value: String(epoch), direction: "to_date" });
    if (unit === "ms") q.set("unit", "ms");
    return q;
  },
  compare: (api, { epoch, unit }) => {
    const expectedMs = unit === "s" ? epoch * 1000 : epoch;
    const localIso = new Date(expectedMs).toISOString();
    return api.data.iso === localIso
      ? { match: true }
      : { match: false, details: `Local ${localIso} vs API ${api.data.iso}` };
  },
};

// ──────────────────────────────────────────────────────────────────────────
// ISO 8601  (/en/iso8601)
// Local answer: locale-formatted ISO/RFC strings built from Intl.DateTimeFormat
// API answer:   data.output
// ──────────────────────────────────────────────────────────────────────────
export const isoVerify: ToolVerifyConfig<{ date: string; format: string; tz?: string }> = {
  slug: "iso8601",
  label: "ISO 8601 Formatter",
  endpoint: "/api/v1/time/iso",
  docsHref: "/docs/integrations/iso8601-formatter",
  buildParams: ({ date, format, tz }) => {
    const q = new URLSearchParams({ date, format });
    if (tz) q.set("tz", tz);
    return q;
  },
  // Local formatter differs (Intl-driven) — leave eyeball verification.
  compare: undefined,
};

// ──────────────────────────────────────────────────────────────────────────
// Date to Words  (/en/date-words)
// Local answer: locale word arrays  API: data.output
// ──────────────────────────────────────────────────────────────────────────
export const dateWordsVerify: ToolVerifyConfig<{ date: string; lang: string }> = {
  slug: "date-words",
  label: "Date to Words",
  endpoint: "/api/v1/time/words",
  docsHref: "/docs/integrations/date-to-words",
  buildParams: ({ date, lang }) => new URLSearchParams({ date, lang }),
  // Eyeball — local en/fr/zh/ja word arrays differ in capitalization.
  compare: undefined,
};

// ──────────────────────────────────────────────────────────────────────────
// Date Math  (/en/date-math)
// Local answer: new Date(date) adjusted by years/months/weeks/days
// API answer:   data.output (YYYY-MM-DD)
// ──────────────────────────────────────────────────────────────────────────
export const dateMathVerify: ToolVerifyConfig<{
  date: string;
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  business?: boolean;
  country?: string;
}> = {
  slug: "date-math",
  label: "Date Math",
  endpoint: "/api/v1/time/add",
  docsHref: "/docs/integrations/date-math",
  buildParams: (s) => {
    const q = new URLSearchParams({ date: s.date });
    if (s.years) q.set("years", String(s.years));
    if (s.months) q.set("months", String(s.months));
    if (s.weeks) q.set("weeks", String(s.weeks));
    if (s.days) q.set("days", String(s.days));
    if (s.business) q.set("business", "true");
    if (s.country) q.set("country", s.country);
    return q;
  },
  // Eyeball — local uses setUTCDate + manual holiday skip; API does the same.
  compare: undefined,
};

// ──────────────────────────────────────────────────────────────────────────
// Date Difference  (/en/date-diff)
// Local: totalDays / businessDays via JS date math
// API:   data.totalDays / data.businessDays
// ──────────────────────────────────────────────────────────────────────────
export const dateDiffVerify: ToolVerifyConfig<{
  from: string;
  to: string;
  mode?: "calendar" | "business";
  country?: string;
}> = {
  slug: "date-diff",
  label: "Date Difference",
  endpoint: "/api/v1/time/diff",
  docsHref: "/docs/integrations/date-difference",
  buildParams: (s) => {
    const q = new URLSearchParams({ from: s.from, to: s.to });
    q.set("mode", s.mode ?? "calendar");
    if (s.country) q.set("country", s.country);
    return q;
  },
  compare: (api, s) => {
    if (s.mode === "business") {
      return api.data.businessDays !== undefined
        ? { match: true }
        : { match: false, details: "API missing businessDays" };
    }
    return api.data.totalDays !== undefined
      ? { match: true }
      : { match: false, details: "API missing totalDays" };
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Holiday Hours  (/en/holidays or /en/working-hours)
// Local: COUNTRY_HOLIDAYS lookup.  API: data.holidays[] / data.totalHours
// ──────────────────────────────────────────────────────────────────────────
export const holidayHoursVerify: ToolVerifyConfig<{
  country: string;
  year: number;
}> = {
  slug: "holidays",
  label: "Holiday & Hours",
  endpoint: "/api/v1/countries",
  docsHref: "/docs/integrations/holiday-hours",
  buildParams: ({ country, year }) =>
    new URLSearchParams({ code: country, year: String(year) }),
  compare: (api) => {
    if (api?.data?.holidays === undefined && api?.data?.workingDays === undefined) {
      return { match: false, details: "API missing holidays/workingDays fields" };
    }
    return { match: true };
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Time Zone Converter  (landing card in App.tsx)
// Local: live Intl + offset math.  API: data.to.time / data.from.time
// ──────────────────────────────────────────────────────────────────────────
export const converterVerify: ToolVerifyConfig<{
  from: string;
  to: string;
  time: string;
  date?: string;
}> = {
  slug: "time-zone-converter",
  label: "Time Zone Converter",
  endpoint: "/api/v1/time/convert",
  docsHref: "/docs/integrations/time-zone-converter",
  buildParams: (s) => {
    const q = new URLSearchParams({ from: s.from, to: s.to });
    if (s.time) q.set("time", s.time);
    if (s.date) q.set("date", s.date);
    return q;
  },
  compare: (api, { to }) =>
    api.data?.to?.time
      ? { match: true }
      : { match: false, details: `API missing data.to.time for ${to}` },
};

// ──────────────────────────────────────────────────────────────────────────
// Meeting Finder  (MeetingFinder.tsx)
// Local: bestScoreHour array.  API: data.topSlots[].utcHour
// ──────────────────────────────────────────────────────────────────────────
export const meetingFinderVerify: ToolVerifyConfig<{
  cities: string[];
  start: number;
  end: number;
}> = {
  slug: "meeting-finder",
  label: "Meeting Finder",
  endpoint: "/api/v1/meeting/best",
  docsHref: "/docs/integrations/meeting-finder",
  buildParams: (s) => {
    const q = new URLSearchParams({
      cities: s.cities.join(","),
      start: String(s.start),
      end: String(s.end),
    });
    return q;
  },
  compare: (api) =>
    Array.isArray(api.data?.topSlots) && api.data.topSlots.length > 0
      ? { match: true }
      : { match: false, details: "API returned no topSlots" },
};

// ──────────────────────────────────────────────────────────────────────────
// World Clock  (WorldClockDashboard.tsx)
// Local: CITY_DATA lookup + offset.  API: data.currentTime.time
// ──────────────────────────────────────────────────────────────────────────
export const worldClockVerify: ToolVerifyConfig<{ code: string }> = {
  slug: "world-clock",
  label: "World Clock",
  endpoint: "/api/v1/cities",
  docsHref: "/docs/integrations/world-clock",
  buildParams: ({ code }) => new URLSearchParams({ slug: code }),
  compare: (api) =>
    api.data?.currentTime?.time
      ? { match: true }
      : { match: false, details: "API missing data.currentTime.time" },
};

// ──────────────────────────────────────────────────────────────────────────
// Master list — used by the dev "Verify all" dashboard
// ──────────────────────────────────────────────────────────────────────────
export const TOOL_VERIFY_REGISTRY: ToolVerifyConfig[] = [
  unixVerify,
  isoVerify,
  dateWordsVerify,
  dateMathVerify,
  dateDiffVerify,
  holidayHoursVerify,
  converterVerify,
  meetingFinderVerify,
  worldClockVerify,
];

/** Default sample state for "Verify all" — each tool gets a smoke-test input. */
export const VERIFY_ALL_SAMPLES: Record<ToolSlug, any> = {
  unix:           { epoch: 1718370000, unit: "s" },
  iso8601:        { date: "2026-07-08", format: "rfc3339", tz: "America/New_York" },
  "date-words":   { date: "2026-07-08", lang: "fr" },
  "date-math":    { date: "2026-07-08", days: 14, business: true, country: "US" },
  "date-diff":    { from: "2026-01-01", to: "2026-12-31", mode: "business", country: "US" },
  holidays:       { country: "US", year: 2026 },
  "working-hours": { country: "US", year: 2026 },
  "time-zone-converter": { from: "NYC", to: "TYO", time: "15:00", date: "2026-07-08" },
  "meeting-finder": { cities: ["NYC", "LDN", "TYO"], start: 9, end: 17 },
  "world-clock":  { code: "TYO" },
};

export function lookupVerifyConfig(slug: ToolSlug): ToolVerifyConfig | undefined {
  return TOOL_VERIFY_REGISTRY.find((c) => c.slug === slug);
}