// src/routes/time.ts
// Time math endpoints: now, convert, diff, add, unix, iso, words, sun.
// All endpoints have strict edge case handling.

import { Hono } from "hono";
import { ok, err, requireString, validateTimezone, safeDate } from "../lib/responses";
import {
  formatInTz,
  partsInTz,
  isoInTz,
  tzAbbreviation,
  tzOffsetMinutes,
  businessDaysBetween,
  calendarDaysBetween,
  ymdBetween,
  daysInMonth,
  isLeapYear,
} from "../lib/time";

const time = new Hono();

/** GET /api/v1/time/now?tz=America/New_York — current time in a tz. */
time.get("/now", (c) => {
  const tz = c.req.query("tz") ?? "UTC";
  const tzErr = validateTimezone(tz);
  if (tzErr) return err(c, 400, tzErr, "invalid_timezone");
  const now = new Date();
  return ok(c, {
    timezone: tz,
    abbreviation: tzAbbreviation(now, tz),
    utc_offset_minutes: tzOffsetMinutes(now, tz),
    iso: now.toISOString(),
    unix: Math.floor(now.getTime() / 1000),
    unix_ms: now.getTime(),
    local: {
      iso: isoInTz(now, tz),
      date: formatInTz(now, tz, { year: "numeric", month: "short", day: "numeric" }),
      time: formatInTz(now, tz, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      weekday: formatInTz(now, tz, { weekday: "long" }),
    },
  });
});

/** GET /api/v1/time/convert?from=UTC&to=America/New_York&time=2026-01-01T12:00:00Z */
time.get("/convert", (c) => {
  const from = c.req.query("from") ?? "UTC";
  const to = c.req.query("to") ?? "UTC";
  const fromErr = validateTimezone(from);
  if (fromErr) return err(c, 400, fromErr.replace("Invalid", "Invalid source"), "invalid_timezone");
  const toErr = validateTimezone(to);
  if (toErr) return err(c, 400, toErr.replace("Invalid", "Invalid target"), "invalid_timezone");
  const tParam = c.req.query("time") ?? c.req.query("date");
  const t = tParam ? safeDate(tParam) : new Date();
  if (tParam && !t) {
    return err(c, 400, "Query parameter 'time' must be a valid ISO 8601 datetime", "invalid_time");
  }
  return ok(c, {
    from: {
      timezone: from,
      iso: t!.toISOString(),
      unix: Math.floor(t!.getTime() / 1000),
      local: { iso: isoInTz(t!, from) },
    },
    to: {
      timezone: to,
      iso: t!.toISOString(),
      unix: Math.floor(t!.getTime() / 1000),
      local: { iso: isoInTz(t!, to) },
    },
    delta_minutes: tzOffsetMinutes(t!, to) - tzOffsetMinutes(t!, from),
  });
});

/**
 * GET /api/v1/time/diff?from=2026-01-01&to=2026-12-31&mode=calendar
 * mode: "calendar" | "business"
 */
time.get("/diff", (c) => {
  const fromStr = c.req.query("from");
  const toStr = c.req.query("to");
  const fromErr = requireString(fromStr, "from");
  if (fromErr) return err(c, 400, fromErr, "missing_from");
  const toErr = requireString(toStr, "to");
  if (toErr) return err(c, 400, toErr, "missing_to");
  const from = safeDate(fromStr!);
  const to = safeDate(toStr!);
  if (!from) return err(c, 400, "from must be a valid ISO 8601 datetime", "invalid_from");
  if (!to) return err(c, 400, "to must be a valid ISO 8601 datetime", "invalid_to");
  const mode = c.req.query("mode") ?? "calendar";
  if (mode !== "calendar" && mode !== "business") {
    return err(c, 400, "mode must be 'calendar' or 'business'", "invalid_mode");
  }
  const totalMs = to.getTime() - from.getTime();
  const totalMinutes = Math.floor(totalMs / 60000);
  const totalHours = Math.floor(totalMs / 3600000);
  const totalDays = Math.abs(calendarDaysBetween(from, to));
  const businessDays = mode === "business" ? Math.abs(businessDaysBetween(from, to)) : undefined;
  const ymd = totalMs >= 0 ? ymdBetween(from, to) : ymdBetween(to, from);
  return ok(c, {
    from: from.toISOString(),
    to: to.toISOString(),
    mode,
    total_ms: totalMs,
    total_seconds: Math.floor(totalMs / 1000),
    total_minutes: totalMinutes,
    total_hours: totalHours,
    total_days: totalDays,
    business_days: businessDays,
    years: ymd.years,
    months: ymd.months,
    days: ymd.days,
    direction: totalMs >= 0 ? "forward" : "backward",
  });
});

/**
 * GET /api/v1/time/add?date=2026-01-01&days=5&business=true&country=US
 */
time.get("/add", (c) => {
  const dateStr = c.req.query("date");
  const dateErr = requireString(dateStr, "date");
  if (dateErr) return err(c, 400, dateErr, "missing_date");
  const date = safeDate(dateStr!);
  if (!date) return err(c, 400, "date must be a valid ISO 8601 datetime", "invalid_date");
  const years = parseInt(c.req.query("years") ?? "0", 10) || 0;
  const months = parseInt(c.req.query("months") ?? "0", 10) || 0;
  const weeks = parseInt(c.req.query("weeks") ?? "0", 10) || 0;
  const days = parseInt(c.req.query("days") ?? "0", 10) || 0;
  const business = c.req.query("business") === "true";

  const result = new Date(date.getTime());
  if (business) {
    // Business days: skip Sat/Sun. Approximate without holiday calendar.
    let remaining = days + weeks * 7;
    let monthsLeft = months;
    let yearsLeft = years;
    while (yearsLeft > 0) { result.setFullYear(result.getFullYear() + 1); yearsLeft--; }
    while (monthsLeft > 0) { result.setMonth(result.getMonth() + 1); monthsLeft--; }
    let dir = remaining >= 0 ? 1 : -1;
    remaining = Math.abs(remaining);
    while (remaining > 0) {
      result.setDate(result.getDate() + dir);
      const dow = result.getDay();
      if (dow !== 0 && dow !== 6) remaining--;
    }
  } else {
    result.setFullYear(result.getFullYear() + years);
    result.setMonth(result.getMonth() + months);
    result.setDate(result.getDate() + weeks * 7 + days);
  }

  return ok(c, {
    input: { date: date.toISOString(), years, months, weeks, days, business },
    result: {
      iso: result.toISOString(),
      unix: Math.floor(result.getTime() / 1000),
      date: result.toISOString().slice(0, 10),
      weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][result.getDay()],
    },
  });
});

/** GET /api/v1/time/unix?value=1735689600&direction=to_date&unit=s */
time.get("/unix", (c) => {
  const valueStr = c.req.query("value");
  const valueErr = requireString(valueStr, "value");
  if (valueErr) return err(c, 400, valueErr, "missing_value");
  const direction = c.req.query("direction") ?? "to_date";
  if (direction !== "to_date" && direction !== "to_unix") {
    return err(c, 400, "direction must be 'to_date' or 'to_unix'", "invalid_direction");
  }
  const unit = c.req.query("unit") ?? "s";
  if (unit !== "s" && unit !== "ms") {
    return err(c, 400, "unit must be 's' or 'ms'", "invalid_unit");
  }
  // Smart value parsing: accept either a number (unix) or an ISO 8601 date
  const looksLikeIso = /^\d{4}-\d{2}-\d{2}/.test(valueStr!);
  if (looksLikeIso) {
    const d = new Date(valueStr!);
    if (isNaN(d.getTime())) {
      return err(c, 400, "value must be a valid ISO 8601 datetime or unix timestamp", "invalid_value");
    }
    const ms = d.getTime();
    if (direction === "to_date") {
      return ok(c, { input: valueStr, unit, direction, iso: d.toISOString(), utc: d.toUTCString(), unix: Math.floor(ms / 1000), unix_ms: ms });
    } else {
      const s = unit === "s" ? Math.floor(ms / 1000) : ms;
      return ok(c, { input: valueStr, unit, direction, unix: s, iso: d.toISOString() });
    }
  }
  const value = Number(valueStr);
  if (!Number.isFinite(value)) {
    return err(c, 400, "value must be a finite number or ISO 8601 datetime", "invalid_value");
  }
  if (direction === "to_date") {
    const ms = unit === "s" ? value * 1000 : value;
    if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) {
      return err(c, 400, "Unix timestamp out of range", "out_of_range");
    }
    const d = new Date(ms);
    return ok(c, { input: value, unit, direction, iso: d.toISOString(), utc: d.toUTCString() });
  } else {
    const s = unit === "s" ? Math.floor(value / 1000) : value;
    return ok(c, { input: value, unit, direction, unix: s });
  }
});

/** GET /api/v1/time/iso?date=2026-01-01T12:00:00Z&tz=America/New_York&format=date */
time.get("/iso", (c) => {
  const dateStr = c.req.query("date");
  const dateErr = requireString(dateStr, "date");
  if (dateErr) return err(c, 400, dateErr, "missing_date");
  const date = safeDate(dateStr!);
  if (!date) return err(c, 400, "date must be a valid ISO 8601 datetime", "invalid_date");
  const tz = c.req.query("tz") ?? "UTC";
  const tzErr = validateTimezone(tz);
  if (tzErr) return err(c, 400, tzErr, "invalid_timezone");
  const format = c.req.query("format") ?? "iso";
  const validFormats = ["iso", "date", "time", "datetime", "rfc2822", "unix"];
  if (!validFormats.includes(format)) {
    return err(c, 400, `format must be one of: ${validFormats.join(", ")}`, "invalid_format");
  }
  let out = "";
  switch (format) {
    case "iso": out = date.toISOString(); break;
    case "date": out = isoInTz(date, tz).slice(0, 10); break;
    case "time": out = isoInTz(date, tz).slice(11); break;
    case "datetime": out = isoInTz(date, tz); break;
    case "rfc2822": out = date.toUTCString(); break;
    case "unix": out = String(Math.floor(date.getTime() / 1000)); break;
  }
  return ok(c, { input: date.toISOString(), format, tz, output: out });
});

/** GET /api/v1/time/words?date=2026-01-01&lang=en */
time.get("/words", (c) => {
  const dateStr = c.req.query("date");
  const dateErr = requireString(dateStr, "date");
  if (dateErr) return err(c, 400, dateErr, "missing_date");
  const date = safeDate(dateStr!);
  if (!date) return err(c, 400, "date must be a valid ISO 8601 datetime", "invalid_date");
  const lang = c.req.query("lang") ?? "en";
  // Validate language against a known list (Intl silently falls back on unknown)
  const supportedLangs = ["en", "fr", "zh", "ja", "de", "es", "pt", "it", "ru", "ko", "ar", "hi", "nl", "sv", "pl", "tr", "vi", "th", "id", "ms"];
  if (!supportedLangs.includes(lang)) {
    return err(c, 400, `Unsupported language: ${lang}. Supported: ${supportedLangs.join(", ")}`, "invalid_lang");
  }
  let text: string;
  try {
    text = new Intl.DateTimeFormat(lang, {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    }).format(date);
  } catch {
    return err(c, 400, `Unsupported language: ${lang}`, "invalid_lang");
  }
  return ok(c, { input: date.toISOString(), lang, words: text });
});

/** GET /api/v1/time/sun?lat=40.7128&lon=-74.0060&date=2026-01-01 */
time.get("/sun", (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "");
  const lon = parseFloat(c.req.query("lon") ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return err(c, 400, "lat and lon must be valid numbers", "invalid_coords");
  }
  if (lat < -90 || lat > 90) {
    return err(c, 400, "lat must be between -90 and 90", "invalid_lat");
  }
  if (lon < -180 || lon > 180) {
    return err(c, 400, "lon must be between -180 and 180", "invalid_lon");
  }
  // Approximate sunrise/sunset using NOAA simplified algorithm
  // (no astronomical library needed for V1 — use the formula)
  const dateStr = c.req.query("date");
  const date = dateStr ? safeDate(dateStr) : new Date();
  if (dateStr && !date) {
    return err(c, 400, "date must be a valid ISO 8601 datetime", "invalid_date");
  }
  const d = date ?? new Date();
  // Day of year
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  // Solar declination
  const decl = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  // Hour angle at sunrise/sunset
  const latRad = (lat * Math.PI) / 180;
  const declRad = (decl * Math.PI) / 180;
  const cosH = -Math.tan(latRad) * Math.tan(declRad);
  let sunriseUTC: string | null = null;
  let sunsetUTC: string | null = null;
  if (cosH > 1) {
    // Sun never rises (polar night)
  } else if (cosH < -1) {
    // Sun never sets (polar day)
  } else {
    const H = (Math.acos(cosH) * 180) / Math.PI / 15;
    const solarNoonUTC = 12 - lon / 15;
    const sunriseHour = solarNoonUTC - H;
    const sunsetHour = solarNoonUTC + H;
    const toIso = (h: number) => {
      const hh = Math.floor(h);
      const mm = Math.floor((h - hh) * 60);
      return `${pad(hh)}:${pad(mm)} UTC`;
    };
    sunriseUTC = toIso(sunriseHour);
    sunsetUTC = toIso(sunsetHour);
  }
  return ok(c, {
    lat,
    lon,
    date: d.toISOString().slice(0, 10),
    sunrise_utc: sunriseUTC,
    sunset_utc: sunsetUTC,
    daylight_hours: sunriseUTC && sunsetUTC ? 2 * ((Math.acos(cosH) * 180) / Math.PI) / 15 : null,
    note: sunriseUTC === null && sunsetUTC === null ? "polar_day_or_night" : undefined,
  });
});

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

export { time as timeRouter };
