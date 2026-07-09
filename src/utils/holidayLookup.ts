// src/utils/holidayLookup.ts
// Country-code → holidays-on-date lookup. Wraps COUNTRY_HOLIDAYS from
// countries.ts so callers can pass ISO alpha-2 codes (matching CityEntry).

import { COUNTRY_HOLIDAYS } from "../data/countries";
import type { Holiday, CountryCode } from "../types";

// ISO alpha-2 → CountryCode. The two are the same strings for the 9
// countries with full holiday data; everything else maps to "OTHER"
// (which is empty in current COUNTRY_HOLIDAYS).
const ISO_TO_COUNTRY_CODE: Record<string, CountryCode> = {
  US: "US", IN: "IN", DE: "DE", JP: "JP", AE: "AE", GB: "GB", FR: "FR", CN: "CN",
};

function toCountryCode(iso: string): CountryCode {
  return ISO_TO_COUNTRY_CODE[iso] ?? "OTHER";
}

export function getCountryHolidaysForDate(countryIso: string, date: Date): Holiday[] {
  const cc = toCountryCode(countryIso);
  const list = COUNTRY_HOLIDAYS[cc] ?? [];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const ymd = `${y}-${m}-${d}`;
  return list.filter((h) => h.date === ymd);
}