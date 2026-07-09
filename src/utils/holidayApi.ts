// src/utils/holidayApi.ts
// Holiday lookup by country and date.
// Backed by curated data in src/data/holidays/{country}.ts (Phase 1.4 of the plan).

import type { CountryCode } from "../types";

export interface Holiday {
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;
  /** English name */
  name_en: string;
  /** Local language name (e.g. "建国記念の日" for JP) */
  name_local: string;
  /** Type: public, religious, observance, bank, etc. */
  type: "public" | "religious" | "observance" | "bank" | "school" | "optional";
  /** Whether it's a federal/national holiday (vs regional) */
  federal: boolean;
  /** ISO 3166-2 state code if applicable (e.g. "US-CA" for California) */
  state?: string;
  /** Description / context */
  description?: string;
}

export interface HolidayLookupResult {
  country: CountryCode;
  date: string;            // YYYY-MM-DD
  holiday: Holiday | null;
  nextHoliday: Holiday | null;
  previousHoliday: Holiday | null;
  /** Holidays this month */
  monthHolidays: Holiday[];
}

// === Stub registry ===
// Phase 1.4 will populate src/data/holidays/{country}.ts for 30 countries.
// For now, we ship the US holidays as a working example.

import { US_HOLIDAYS } from "../data/holidays/us";
import { GB_HOLIDAYS } from "../data/holidays/gb";

const HOLIDAYS_BY_COUNTRY: Record<string, Holiday[]> = {
  US: US_HOLIDAYS,
  GB: GB_HOLIDAYS,
  // JP, FR, DE, CN, IN, BR, AU, CA, MX, IT, ES, KR, RU, NL, SE, NO, DK, FI, PL, ZA, AE, SG, HK, TH, ID, PH, MY, TR — Phase 1.4
};

export function getHolidaysForCountry(country: CountryCode): Holiday[] {
  return HOLIDAYS_BY_COUNTRY[country] ?? [];
}

export function getHolidaysForCountryOnDate(country: CountryCode, dateIso: string): Holiday | null {
  const list = getHolidaysForCountry(country);
  return list.find((h) => h.date === dateIso) ?? null;
}

export function lookupHoliday(
  country: CountryCode,
  dateIso: string
): HolidayLookupResult {
  const all = getHolidaysForCountry(country).sort((a, b) => a.date.localeCompare(b.date));
  const idx = all.findIndex((h) => h.date === dateIso);

  const today = idx >= 0 ? all[idx] : null;
  const next = idx >= 0 ? all[idx + 1] ?? null : all.find((h) => h.date > dateIso) ?? null;
  const prev = idx >= 0 ? all[idx - 1] ?? null : all.reverse().find((h) => h.date < dateIso) ?? null;

  const month = dateIso.slice(0, 7); // YYYY-MM
  const monthHolidays = all.filter((h) => h.date.startsWith(month));

  return {
    country,
    date: dateIso,
    holiday: today,
    nextHoliday: next,
    previousHoliday: prev,
    monthHolidays,
  };
}

export function getUpcomingHolidaysForCountry(country: CountryCode, limit = 5): Holiday[] {
  const today = new Date().toISOString().slice(0, 10);
  return getHolidaysForCountry(country)
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}