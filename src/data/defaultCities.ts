// src/data/defaultCities.ts
// The 5 default cities the hero city picker ships with.
// One per major region so a fresh user gets a globally diverse starting list.
// The home city (Wesley Chapel) covers the Americas; the user can swap it later.

import type { CityEntry } from "./cities";

export interface TrackedCity extends CityEntry {
  /** True for the user's home city — always first in the list, not removable. */
  isHome: boolean;
}

/**
 * Curated 5-city default list, covering 5 regions:
 *   - Americas (home)  : Wesley Chapel, US
 *   - Europe           : London, UK
 *   - Middle East      : Dubai, UAE
 *   - East Asia        : Tokyo, Japan
 *   - Oceania          : Sydney, Australia
 * Codes match the registry in cities.ts so the user can search for them
 * and replace them if they prefer a different city from the same region.
 */
export const DEFAULT_CITIES: TrackedCity[] = [
  {
    code: "WLC",
    name: "Wesley Chapel",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    state: "Florida",
    population: 69335,
    isHome: true,
  },
  {
    code: "LON",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London",
    population: 8961989,
    isHome: false,
  },
  {
    code: "DXB",
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    timezone: "Asia/Dubai",
    population: 3331420,
    isHome: false,
  },
  {
    code: "TYO",
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    population: 13929286,
    isHome: false,
  },
  {
    code: "SYD",
    name: "Sydney",
    country: "Australia",
    countryCode: "AU",
    timezone: "Australia/Sydney",
    state: "New South Wales",
    population: 5312163,
    isHome: false,
  },
];
