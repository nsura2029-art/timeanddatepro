// src/data/holidays/gb.ts
// United Kingdom bank holidays (England & Wales).
// Source: gov.uk/bank-holidays

import type { Holiday } from "../../utils/holidayApi";

const STATIC: Omit<Holiday, "date">[] = [
  { name_en: "New Year's Day",          name_local: "New Year's Day",       type: "bank",      federal: true, description: "First day of the year." },
  { name_en: "Christmas Day",           name_local: "Christmas Day",         type: "bank",      federal: true, description: "Christmas Day." },
  { name_en: "Boxing Day",              name_local: "Boxing Day",            type: "bank",      federal: true, description: "Day after Christmas." },
];

const FLOATING: Array<{ name: string; month: number; weekday: number; nth: number; type: Holiday["type"]; description: string }> = [
  { name: "Good Friday",        month: 4, weekday: 5, nth: 0, type: "bank", description: "Friday before Easter Sunday." }, // special — needs Easter calc
  { name: "Easter Monday",      month: 4, weekday: 1, nth: 0, type: "bank", description: "Monday after Easter Sunday." },
  { name: "Early May Bank Holiday", month: 5, weekday: 1, nth: 1, type: "bank", description: "First Monday of May." },
  { name: "Spring Bank Holiday",     month: 5, weekday: 1, nth: 5, type: "bank", description: "Last Monday of May." },
  { name: "Summer Bank Holiday",     month: 8, weekday: 1, nth: 5, type: "bank", description: "Last Monday of August." },
];

// Simplified Easter computation (Anonymous Gregorian algorithm)
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nthWeekday(year: number, month: number, weekday: number, nth: number): string {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay();
  const dayOffset = ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
  const day = 1 + dayOffset;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildGbHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  const fmtIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const fixed: Holiday[] = STATIC.map((h) => ({
    ...h,
    date: h.name_en === "New Year's Day" ? `${year}-01-01`
         : h.name_en === "Christmas Day" ? `${year}-12-25`
         : h.name_en === "Boxing Day"    ? `${year}-12-26`
         : ""
  }));

  const floating: Holiday[] = FLOATING.map((f) => ({
    date: f.name === "Good Friday"   ? fmtIso(goodFriday)
         : f.name === "Easter Monday" ? fmtIso(easterMonday)
         : nthWeekday(year, f.month, f.weekday, f.nth),
    name_en: f.name,
    name_local: f.name,
    type: f.type,
    federal: true,
    description: f.description,
  }));

  return [...fixed, ...floating].sort((a, b) => a.date.localeCompare(b.date));
}

export const GB_HOLIDAYS: Holiday[] = [
  ...buildGbHolidays(2024),
  ...buildGbHolidays(2025),
  ...buildGbHolidays(2026),
  ...buildGbHolidays(2027),
];