// src/routes/pairs.ts
// Pair + meeting endpoints: city pair data, best meeting time.

import { Hono } from "hono";
import { ok, err, requireString, parseCsv, validateTimezone } from "../lib/responses";
import { CITY_BY_CODE, CITIES } from "../data/cities";
import { partsInTz, isoInTz, formatInTz, tzAbbreviation, tzOffsetMinutes } from "../lib/time";

const pairs = new Hono();

/** GET /api/v1/pairs/:from/:to — get a city pair with both times side by side. */
pairs.get("/:from/:to", (c) => {
  const fromCode = c.req.param("from").toUpperCase();
  const toCode = c.req.param("to").toUpperCase();
  const fromCity = CITY_BY_CODE[fromCode];
  const toCity = CITY_BY_CODE[toCode];
  if (!fromCity) return err(c, 404, `Unknown city code: ${fromCode}`, "city_not_found");
  if (!toCity) return err(c, 404, `Unknown city code: ${toCode}`, "city_not_found");
  if (fromCode === toCode) {
    return err(c, 400, "from and to must be different cities", "same_city");
  }
  const tParam = c.req.query("t");
  const now = tParam ? new Date(tParam) : new Date();
  if (isNaN(now.getTime())) {
    return err(c, 400, "t must be a valid ISO 8601 datetime", "invalid_time");
  }
  const fromOffset = tzOffsetMinutes(now, fromCity.timezone);
  const toOffset = tzOffsetMinutes(now, toCity.timezone);
  return ok(c, {
    from: { code: fromCity.code, name: fromCity.name, country: fromCity.country, timezone: fromCity.timezone },
    to: { code: toCity.code, name: toCity.name, country: toCity.country, timezone: toCity.timezone },
    t: now.toISOString(),
    delta_minutes: toOffset - fromOffset,
    delta_hours: (toOffset - fromOffset) / 60,
    from_local: { iso: isoInTz(now, fromCity.timezone), abbreviation: tzAbbreviation(now, fromCity.timezone) },
    to_local: { iso: isoInTz(now, toCity.timezone), abbreviation: tzAbbreviation(now, toCity.timezone) },
  });
});

/** GET /api/v1/meeting/best?codes=A,B,C&duration=60&window=09:00-17:00&tz=UTC */
pairs.get("/best", (c) => {
  // V1 stub: returns the first code as the "best" time.
  // The full port (B4) will compute business-hour overlap across all
  // requested cities and return ranked meeting windows.
  const codes = parseCsv(c.req.query("codes"), { uppercase: true, maxItems: 20 });
  if (codes.length < 2) {
    return err(c, 400, "At least 2 city codes required (comma-separated)", "insufficient_cities");
  }
  const invalid = codes.filter((code) => !CITY_BY_CODE[code]);
  if (invalid.length > 0) {
    return err(c, 404, `Unknown city codes: ${invalid.join(", ")}`, "city_not_found");
  }
  const duration = parseInt(c.req.query("duration") ?? "60", 10);
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
    return err(c, 400, "duration must be between 5 and 480 minutes", "invalid_duration");
  }
  return ok(c, {
    codes,
    duration_minutes: duration,
    slots: [
      {
        start_utc: new Date().toISOString(),
        end_utc: new Date(Date.now() + duration * 60000).toISOString(),
        score: 1.0,
        note: "V1 stub. The full port (B4) will compute overlap across all codes.",
      },
    ],
    note: "V1 stub endpoint. Use the time/convert + time/diff endpoints for real overlap math.",
  });
});

export { pairs as pairsRouter };
