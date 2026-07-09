// src/data/holidays/us.ts
// US federal holidays. Names follow timeanddate.com + Wikipedia conventions.
// Dates are dynamic for floating holidays (Thanksgiving, Memorial Day) — computed at runtime.
//
// Source: timeanddate.com/us/holidays, Wikipedia "Holidays of the United States"

import type { Holiday } from "../../utils/holidayApi";

// Static-date holidays (fixed MM-DD)
const STATIC: Omit<Holiday, "date">[] = [
  { name_en: "New Year's Day",          name_local: "New Year's Day",       type: "public",    federal: true, description: "First day of the year in the Gregorian calendar." },
  { name_en: "Juneteenth",              name_local: "Juneteenth",            type: "public",    federal: true, description: "Commemorates the emancipation of enslaved African Americans." },
  { name_en: "Independence Day",        name_local: "Independence Day",      type: "public",    federal: true, description: "Celebrates the Declaration of Independence (1776)." },
  { name_en: "Veterans Day",            name_local: "Veterans Day",          type: "public",    federal: true, description: "Honors military veterans." },
  { name_en: "Christmas Day",           name_local: "Christmas Day",         type: "public",    federal: true, description: "Annual Christian holiday celebrating the birth of Jesus Christ." },
];

// Floating-date holidays (nth weekday of month)
const FLOATING: Array<{ name: string; month: number; weekday: number; nth: number; type: Holiday["type"]; description: string }> = [
  { name: "Martin Luther King Jr. Day", month: 1,  weekday: 1, nth: 3, type: "public", description: "Honors the birthday of Martin Luther King Jr." },
  { name: "Presidents' Day",            month: 2,  weekday: 1, nth: 3, type: "public", description: "Honors all U.S. presidents." },
  { name: "Memorial Day",               month: 5,  weekday: 1, nth: 5, type: "public", description: "Honors those who died in military service." },
  { name: "Labor Day",                  month: 9,  weekday: 1, nth: 1, type: "public", description: "Celebrates the labor movement." },
  { name: "Columbus Day",               month: 10, weekday: 1, nth: 2, type: "public", description: "Commemorates Columbus's arrival in the Americas." },
  { name: "Thanksgiving Day",           month: 11, weekday: 4, nth: 4, type: "public", description: "Traditional harvest festival." },
];

function nthWeekday(year: number, month: number, weekday: number, nth: number): string {
  // weekday: 0=Sun, 1=Mon, ..., 6=Sat
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay();
  const dayOffset = ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
  const day = 1 + dayOffset;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Build the US holidays list for a given year. Includes static + floating dates.
 * In production we'd cache this per year. For MVP we recompute on each call.
 */
export function buildUsHolidays(year: number = new Date().getFullYear()): Holiday[] {
  const staticForYear: Holiday[] = STATIC.map((h) => ({ ...h, date: `${year}-${h.name_en === "New Year's Day" ? "01-01" : h.name_en === "Juneteenth" ? "06-19" : h.name_en === "Independence Day" ? "07-04" : h.name_en === "Veterans Day" ? "11-11" : "12-25"}` }));
  const floatingForYear: Holiday[] = FLOATING.map((f) => ({
    date: nthWeekday(year, f.month, f.weekday, f.nth),
    name_en: f.name,
    name_local: f.name,
    type: f.type,
    federal: true,
    description: f.description,
  }));
  return [...staticForYear, ...floatingForYear].sort((a, b) => a.date.localeCompare(b.date));
}

// Build for 2024, 2025, 2026, 2027 — covers past + near future
export const US_HOLIDAYS: Holiday[] = [
  ...buildUsHolidays(2024),
  ...buildUsHolidays(2025),
  ...buildUsHolidays(2026),
  ...buildUsHolidays(2027),
];