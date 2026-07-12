// src/lib/time.ts
// Time utility functions for the API. All work in IANA timezones.
// Edge cases: leap years, DST transitions, invalid timezones, overflow.

/** Format a Date as a string in a given IANA timezone, with the given Intl options. */
export function formatInTz(
  date: Date,
  tz: string,
  options: Intl.DateTimeFormatOptions
): string {
  try {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: tz }).format(date);
  } catch {
    // Invalid timezone — fall back to UTC
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
}

/** Get the year/month/day/hour/minute/second parts of a date in a given timezone. */
export function partsInTz(
  date: Date,
  tz: string
): { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  // weekday short: "Sun" -> 0
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: parseInt(map.year ?? "1970", 10),
    month: parseInt(map.month ?? "1", 10),
    day: parseInt(map.day ?? "1", 10),
    hour: parseInt(map.hour ?? "0", 10) % 24,
    minute: parseInt(map.minute ?? "0", 10),
    second: parseInt(map.second ?? "0", 10),
    weekday: weekdayMap[map.weekday ?? "Sun"] ?? 0,
  };
}

/** Get the timezone abbreviation (e.g. "EST", "PST"). */
export function tzAbbreviation(date: Date, tz: string): string {
  return formatInTz(date, tz, { timeZoneName: "short" })
    .split(" ")
    .pop() ?? tz;
}

/** Get the UTC offset in minutes for a given timezone at a given date. */
export function tzOffsetMinutes(date: Date, tz: string): number {
  const local = partsInTz(date, tz);
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Get the ISO-like local time string in a given timezone (no Z suffix). */
export function isoInTz(date: Date, tz: string): string {
  const p = partsInTz(date, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** Days in a given month (1-12) of a given year. Handles leap years. */
export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  return new Date(year, month, 0).getDate();
}

/** Is the year a leap year? (Divisible by 4, not 100 unless 400) */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** Number of business days between two dates (excludes Sat/Sun). */
export function businessDaysBetween(start: Date, end: Date): number {
  if (end < start) return businessDaysBetween(end, start);
  let count = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= endDay) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Calendar days between two dates (inclusive start, exclusive end). */
export function calendarDaysBetween(start: Date, end: Date): number {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay.getTime() - startDay.getTime()) / 86400000);
}

/** Years/months/days between two dates (calendar). */
export function ymdBetween(
  start: Date,
  end: Date
): { years: number; months: number; days: number } {
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0) {
    m--;
    d += daysInMonth(end.getFullYear(), end.getMonth());
  }
  if (m < 0) {
    y--;
    m += 12;
  }
  return { years: y, months: m, days: d };
}
