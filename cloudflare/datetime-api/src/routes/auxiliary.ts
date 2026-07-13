import type { D1Database } from "@cloudflare/workers-types";
// src/routes/auxiliary.ts
// Auxiliary endpoints: DST, holidays, events, popular, quotes, onthisday,
// browse, currency. Phase 5: wired up with D1 + curated data.

import { Hono } from "hono";
import { ok, err, safeDate } from "../lib/responses";
import {
  HOLIDAYS, ON_THIS_DAY, QUOTES, CURRENCY_RATES, DEFAULT_POPULAR_CITIES,
  type Holiday, type OnThisDayEvent, type Quote,
} from "../data/static-data";

type Bindings = { DB: D1Database };
const aux = new Hono<{ Bindings: Bindings }>();

// ── DST (computed from IANA timezone + Intl.DateTimeFormat) ──
aux.get("/dst", (c) => {
  const tz = c.req.query("tz");
  if (!tz) return err(c, 400, "tz query param required (IANA timezone)", "missing_tz");
  const dateParam = c.req.query("date");
  const date = dateParam ? safeDate(dateParam) : new Date();
  if (!date) return err(c, 400, "Invalid date", "invalid_date");
  try {
    // Get offset in July (summer in N hemisphere) and January (winter)
    const jul = new Date(date.getFullYear(), 6, 1);
    const jan = new Date(date.getFullYear(), 0, 1);
    const fmt = (d: Date) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, timeZoneName: "shortOffset", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(d);
      const off = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
      return off;
    };
    const julOffset = fmt(jul);
    const janOffset = fmt(jan);
    const isDst = julOffset !== janOffset;
    // Current offset
    const nowParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, timeZoneName: "shortOffset",
    }).formatToParts(date);
    const currentOffset = nowParts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return ok(c, {
      timezone: tz,
      currentOffset,
      januaryOffset: janOffset,
      julyOffset: julOffset,
      observesDst: isDst,
      date: date.toISOString().slice(0, 10),
    });
  } catch (e) {
    return err(c, 400, `Invalid timezone: ${tz}`, "invalid_tz");
  }
});

aux.get("/dst/upcoming", (c) => {
  const tz = c.req.query("tz");
  if (!tz) return err(c, 400, "tz query param required", "missing_tz");
  // Approximate DST transitions in 2026:
  // US: spring forward Mar 8, fall back Nov 1
  // EU: spring forward Mar 29, fall back Oct 25
  // Just return approximate dates — this is a stub-level endpoint
  const year = new Date().getFullYear();
  return ok(c, {
    timezone: tz,
    year,
    spring_forward: { us: `${year}-03-08`, eu: `${year}-03-29` },
    fall_back: { us: `${year}-11-01`, eu: `${year}-10-25` },
    note: "Approximate dates. Exact transitions depend on year + country rules.",
  });
});

// ── Holidays (curated static data) ───────────────────────────
function expandHolidays(holidays: Holiday[], year: number) {
  return holidays.map((h) => {
    if (h.date === "RECURRING") {
      // Compute approximate date for known recurring holidays
      // For full accuracy, would need a holiday library like date-holidays
      return { ...h, year, date: "Varies (computed dynamically)", note: "Easter/Diwali/etc. — exact date varies by year. Use a holiday library for production." };
    }
    return { ...h, year, date: `${year}-${h.date}` };
  });
}

aux.get("/holidays/today", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;
  let list = HOLIDAYS.filter((h) => h.date === today);
  if (country) list = list.filter((h) => h.cca2 === country);
  return ok(c, {
    date: today,
    country: country ?? null,
    count: list.length,
    holidays: expandHolidays(list, now.getFullYear()),
  });
});

aux.get("/holidays/upcoming", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  const days = Math.min(90, Math.max(1, parseInt(c.req.query("days") ?? "30", 10) || 30));
  const now = new Date();
  const results: Array<Holiday & { date: string; daysFromNow: number }> = [];
  let list = country ? HOLIDAYS.filter((h) => h.cca2 === country) : HOLIDAYS;
  for (const h of list) {
    if (h.date === "RECURRING") continue;  // skip dynamic
    const [mm, dd] = h.date.split("-").map(Number);
    const holidayDate = new Date(now.getFullYear(), mm - 1, dd);
    if (holidayDate < now) holidayDate.setFullYear(now.getFullYear() + 1);
    const daysFromNow = Math.ceil((holidayDate.getTime() - now.getTime()) / 86400000);
    if (daysFromNow <= days) {
      results.push({ ...h, date: `${holidayDate.toISOString().slice(0, 10)}`, daysFromNow });
    }
  }
  results.sort((a, b) => a.daysFromNow - b.daysFromNow);
  return ok(c, {
    country: country ?? null,
    days,
    count: results.length,
    holidays: results.slice(0, 20),
  });
});

aux.get("/holidays/year", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  if (!country) return err(c, 400, "country query param required (ISO 3166-1 alpha-2)", "missing_country");
  const yearParam = c.req.query("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > 2200) {
    return err(c, 400, "year must be between 1900 and 2200", "invalid_year");
  }
  const list = HOLIDAYS.filter((h) => h.cca2 === country);
  return ok(c, {
    country,
    year,
    count: list.length,
    holidays: expandHolidays(list, year),
  });
});

// ── Popular cities (D1) ─────────────────────────────────────
aux.get("/popular/cities", async (c) => {
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10) || 20));
  const country = c.req.query("country")?.toUpperCase();
  let sql = `SELECT geoname_id AS id, name, ascii_name AS asciiName, country_code AS countryCode,
                    country_name AS countryName, latitude, longitude, timezone, population,
                    is_capital AS isCapital, feature_code AS featureCode
             FROM cities
             WHERE 1=1`;
  const params: any[] = [];
  if (country) { sql += ` AND country_code = ?${params.length + 1}`; params.push(country); }
  sql += ` ORDER BY population DESC LIMIT ?${params.length + 1}`;
  params.push(limit);
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  return ok(c, {
    count: (result.results || []).length,
    limit,
    cities: result.results || [],
  });
});

aux.get("/popular/defaults", async (c) => {
  // Get the top 20 most populous cities (default recommendations)
  const result = await c.env.DB.prepare(
    `SELECT geoname_id AS id, name, ascii_name AS asciiName, country_code AS countryCode,
            country_name AS countryName, latitude, longitude, timezone, population,
            is_capital AS isCapital
     FROM cities
     ORDER BY population DESC
     LIMIT 20`,
  ).all();
  return ok(c, {
    count: (result.results || []).length,
    cities: result.results || [],
  });
});

// ── Quotes (curated) ─────────────────────────────────────────
aux.get("/quotes/random", (c) => {
  const idx = Math.floor(Math.random() * QUOTES.length);
  return ok(c, QUOTES[idx]);
});

aux.get("/quotes/ranked", (c) => {
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10) || 20));
  return ok(c, { count: limit, quotes: QUOTES.slice(0, limit) });
});

// ── Events (V1 stub) ─────────────────────────────────────────
aux.get("/events/upcoming", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  return ok(c, {
    country: country ?? null,
    events: [],
    note: "Events table not seeded in Phase 5. See holiday endpoints for date-based events.",
  });
});

aux.get("/events/next", (c) => {
  return ok(c, { event: null, note: "Events table not seeded in Phase 5." });
});

// ── OnThisDay (curated) ──────────────────────────────────────
aux.get("/onthisday", (c) => {
  const now = new Date();
  const month = parseInt(c.req.query("month") ?? String(now.getMonth() + 1), 10);
  const day = parseInt(c.req.query("day") ?? String(now.getDate()), 10);
  if (month < 1 || month > 12) return err(c, 400, "month must be 1-12", "invalid_month");
  if (day < 1 || day > 31) return err(c, 400, "day must be 1-31", "invalid_day");
  const events = ON_THIS_DAY.filter((e) => e.month === month && e.day === day);
  return ok(c, {
    month,
    day,
    count: events.length,
    events: events.sort((a, b) => a.year - b.year),
  });
});

// ── Browse home (computed from D1) ───────────────────────────
aux.get("/browse/home", async (c) => {
  // Top 5 cities by population
  const topCities = await c.env.DB.prepare(
    `SELECT geoname_id AS id, name, ascii_name AS asciiName, country_code AS countryCode,
            country_name AS countryName, latitude, longitude, timezone, population
     FROM cities
     WHERE is_capital = 1
     ORDER BY population DESC
     LIMIT 5`,
  ).all();
  // Today's holidays
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayHolidays = HOLIDAYS.filter((h) => h.date === today).map((h) => ({
    cca2: h.cca2,
    name: h.name,
    type: h.type,
  }));
  // OnThisDay for today
  const todayOTD = ON_THIS_DAY.filter((e) => e.month === now.getMonth() + 1 && e.day === now.getDate());
  return ok(c, {
    greeting: "Hello, World!",
    statusPills: ["Local time", "Timezone", "Weather"],
    holiday: todayHolidays[0] ?? null,
    holidays: todayHolidays,
    onThisDay: todayOTD[0] ?? null,
    onThisDayCount: todayOTD.length,
    popularCities: topCities.results || [],
    sun: null,
    sync: null,
  });
});

// Currency endpoints moved to /routes/currency.ts in Phase 6.5. Removed here
// so the new D1-backed endpoints can take over without shadow routing.

// ── News / History (V1 stubs) ────────────────────────────────
aux.get("/news/by-country", (c) => {
  return err(c, 501, "News endpoint not yet implemented. Phase 5.10 placeholder.", "not_implemented");
});
aux.get("/news/by-category", (c) => {
  return err(c, 501, "News endpoint not yet implemented. Phase 5.10 placeholder.", "not_implemented");
});
aux.get("/news/global", (c) => {
  return err(c, 501, "News endpoint not yet implemented. Phase 5.10 placeholder.", "not_implemented");
});
aux.get("/news/feeds", (c) => {
  return err(c, 501, "News endpoint not yet implemented. Phase 5.10 placeholder.", "not_implemented");
});
aux.get("/history/by-country", (c) => {
  return err(c, 501, "History endpoint not yet implemented. Phase 5.10 placeholder.", "not_implemented");
});
aux.get("/history/countries", (c) => {
  return err(c, 501, "History endpoint not yet implemented. Phase 5.10 placeholder.", "not_implemented");
});

export { aux as auxRouter };
