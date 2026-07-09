// src/utils/sunApi.ts
// Sun position computation using suncalc (MIT).
// Pure function — easy to test, no external API call, no rate limit.

import * as SunCalc from "suncalc";

export interface SunPosition {
  /** ISO 8601 sunrise time in the location's timezone */
  sunrise: string | null;
  /** ISO 8601 sunset time in the location's timezone */
  sunset: string | null;
  /** ISO 8601 solar noon (when sun is at apex) */
  solarNoon: string | null;
  /** Day length in seconds */
  dayLength: number;
  /** Day length formatted as "13h 50m" */
  dayLengthFormatted: string;
  /** Sun azimuth at solar noon (degrees, 0=N, 90=E, 180=S, 270=W). suncalc returns degrees directly. */
  azimuthAtNoon: number;
  /** Sun elevation at solar noon (degrees above horizon). suncalc returns degrees directly. */
  elevationAtNoon: number;
  /** Astronomical twilight (sun 18° below horizon) begin/end */
  twilight: {
    nightEnd: string | null;       // dawn begins
    nightBegin: string | null;     // dusk ends
  };
  /** Source attribution */
  attribution: "suncalc";
}

/**
 * Compute sun position for a location at a given date.
 * Uses the `suncalc` library (MIT, ~5KB). No external API call.
 *
 * @param lat latitude in decimal degrees
 * @param lng longitude in decimal degrees
 * @param date date to compute for (defaults to now)
 * @param tz IANA timezone (defaults to UTC)
 * @returns SunPosition with sunrise/sunset/noon/day-length/azimuth/elevation
 *
 * @example
 *   sunPosition(40.71, -74.01) // New York today
 */
export function sunPosition(
  lat: number,
  lng: number,
  date: Date = new Date(),
  tz: string = "UTC"
): SunPosition {
  const times = SunCalc.getTimes(date, lat, lng);
  const noonPos = SunCalc.getPosition(times.solarNoon, lat, lng);

  const fmt = (d: Date | null | undefined): string | null =>
    d instanceof Date && !isNaN(d.getTime()) ? new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(d) : null;

  const dayLengthSec = times.sunset.getTime() - times.sunrise.getTime();
  const hours = Math.floor(dayLengthSec / 3_600_000);
  const minutes = Math.floor((dayLengthSec % 3_600_000) / 60_000);

  return {
    sunrise: fmt(times.sunrise),
    sunset: fmt(times.sunset),
    solarNoon: fmt(times.solarNoon),
    dayLength: Math.round(dayLengthSec / 1000),
    dayLengthFormatted: `${hours}h ${String(minutes).padStart(2, "0")}m`,
    azimuthAtNoon: Math.round((noonPos.azimuth + 360) % 360),
    elevationAtNoon: Math.round(noonPos.altitude),
    twilight: {
      nightEnd: fmt(times.nightEnd instanceof Date ? times.nightEnd : null),
      nightBegin: fmt(times.nightBegin instanceof Date ? times.nightBegin : null),
    },
    attribution: "suncalc",
  };
}