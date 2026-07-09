// src/types/city.ts
// City entry type. The runtime data lives in src/data/cities.ts;
// this type is for any data file that needs to declare its own city-shaped records.

export interface CityEntry {
  /** 3-letter code (e.g. "NYC", "LDN", "TYO") */
  code: string;
  /** Display name in English */
  name: string;
  /** Country full name in English */
  country: string;
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  /** IANA timezone identifier */
  timezone: string;
  /** Optional: city population */
  population?: number;
  /** Optional: latitude for weather / sun */
  lat?: number;
  /** Optional: longitude */
  lng?: number;
}