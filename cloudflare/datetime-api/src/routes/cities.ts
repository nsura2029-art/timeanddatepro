// src/routes/cities.ts
// City endpoints: list, get by slug, live times, search.
// All endpoints have strict edge case handling.

import { Hono } from "hono";
import { CITIES, CITY_BY_CODE, type CityEntry } from "../data/cities";
import { ok, err, requireString, parseCsv, validateTimezone, safeDate } from "../lib/responses";
import { searchCities } from "../lib/search";
import { partsInTz, formatInTz, isoInTz, tzAbbreviation, tzOffsetMinutes } from "../lib/time";

const cities = new Hono();

/** GET /api/v1/cities — list all cities. Optional ?country=US filter. */
cities.get("/", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  const limit = Math.min(parseInt(c.req.query("limit") ?? "500", 10) || 500, 5000);
  let list: CityEntry[] = CITIES;
  if (country) {
    list = list.filter((city) => city.countryCode === country);
    if (list.length === 0) {
      return err(c, 404, `No cities found for country code: ${country}`, "country_not_found");
    }
  }
  const total = list.length;
  list = list.slice(0, limit);
  return ok(c, {
    count: list.length,
    total,
    limit,
    cities: list,
  });
});

/** GET /api/v1/cities/search?q=paris&limit=8&exclude=A,B,C */
cities.get("/search", (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  if (q.length < 2) {
    return err(c, 400, "Query parameter 'q' must be at least 2 characters", "invalid_query");
  }
  const limitRaw = parseInt(c.req.query("limit") ?? "8", 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 50)) : 8;
  const excludeList = parseCsv(c.req.query("exclude"), { uppercase: true, maxItems: 100 });
  const excludeCodes = new Set(excludeList);
  const start = Date.now();
  const results = searchCities(q, CITIES, excludeCodes, limit);
  const elapsed = Date.now() - start;
  return ok(c, {
    q,
    limit,
    count: results.length,
    total: results.length,
    elapsed_ms: elapsed,
    cities: results,
  });
});

/**
 * GET /api/v1/cities/live?codes=WLC,LON,DXB&t=2026-07-11T12:00:00Z
 *
 * Returns the current time in each of the requested cities, computed
 * server-side. If ?t=ISO is provided, uses that time; otherwise uses now.
 * Always returns the same shape per city, even on error (error in city).
 */
cities.get("/live", (c) => {
  const codesParam = c.req.query("codes")?.trim();
  if (!codesParam) {
    return err(c, 400, "Query parameter 'codes' is required (comma-separated)", "missing_codes");
  }
  const codes = parseCsv(codesParam, { uppercase: true, maxItems: 50 });
  if (codes.length === 0) {
    return err(c, 400, "Query parameter 'codes' must contain at least one valid code", "empty_codes");
  }
  const tParam = c.req.query("t");
  const now = tParam ? safeDate(tParam) : new Date();
  if (tParam && !now) {
    return err(c, 400, "Query parameter 't' must be a valid ISO 8601 datetime", "invalid_time");
  }

  const cities = codes.map((code) => {
    const city = CITY_BY_CODE[code];
    if (!city) {
      return { code, error: "city_not_found", message: `Unknown city code: ${code}` };
    }
    try {
      const parts = partsInTz(now!, city.timezone);
      const tz = city.timezone;
      const offset = tzOffsetMinutes(now!, tz);
      const offsetHours = Math.floor(Math.abs(offset) / 60);
      const offsetMinutes = Math.abs(offset) % 60;
      const offsetSign = offset >= 0 ? "+" : "-";
      const offsetStr = `UTC${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
      return {
        code: city.code,
        name: city.name,
        country: city.country,
        timezone: tz,
        abbreviation: tzAbbreviation(now!, tz),
        utc_offset_minutes: offset,
        utc_offset: offsetStr,
        iso: isoInTz(now!, tz),
        unix: Math.floor(now!.getTime() / 1000),
        unix_ms: now!.getTime(),
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
        second: parts.second,
        weekday: parts.weekday,
        date: formatInTz(now!, tz, { year: "numeric", month: "short", day: "numeric" }),
        time: formatInTz(now!, tz, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
        // The unix timestamp the client should "see" for this city — same as unix
        // because we already converted via the parts.
      };
    } catch (e) {
      return { code, error: "compute_failed", message: (e as Error).message };
    }
  });

  return ok(c, {
    requested: codes.length,
    returned: cities.length,
    t: now!.toISOString(),
    cities,
  });
});

/**
 * GET /api/v1/cities/:slug
 *
 * Slug can be either a 3-letter city code (WLC, LON) or a URL-friendly
 * city name (london, new-york). Matches against code first, then slugified name.
 */
cities.get("/:slug", (c) => {
  const slug = c.req.param("slug");
  if (!slug || slug.length < 2) {
    return err(c, 400, "Slug must be at least 2 characters", "invalid_slug");
  }
  // Try code first (case-insensitive)
  const code = slug.toUpperCase();
  let city: CityEntry | undefined = CITY_BY_CODE[code];
  if (!city) {
    // Try slugified name
    const target = slug.toLowerCase().replace(/-/g, " ");
    city = CITIES.find((ct) => ct.name.toLowerCase() === target)
        ?? CITIES.find((ct) => ct.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase());
  }
  if (!city) {
    return err(c, 404, `City not found: ${slug}`, "city_not_found");
  }
  return ok(c, city);
});

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

export { cities as citiesRouter };
