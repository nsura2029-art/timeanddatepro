// src/utils/popularApi.ts
// Top N popular cities for the landing page + pair recommendations.
// Locked constant for MVP — derived from search volume + manual curation.

import { CITY_BY_CODE } from "../data/cities";
import { POPULAR_20 } from "../data/popular";

export interface PopularCity {
  code: string;
  name: string;
  country: string;
  countryCode: string;
  timezone: string;
  population?: number;
  rank: number;
}

/**
 * Return the top N popular cities, ordered by search volume.
 * Source: locked in src/data/popular.ts (curated from public search-volume data).
 */
export function getPopularCities(limit = 20): PopularCity[] {
  return POPULAR_20.slice(0, limit).map((c, i) => ({
    code: c.code,
    name: c.name,
    country: c.country,
    countryCode: c.countryCode,
    timezone: c.timezone,
    population: c.population,
    rank: i + 1,
  }));
}

/**
 * Return the top 5 cities near the user's likely timezone (based on country).
 * Used as default favorites for first-time visitors.
 */
export function getDefaultFavorites(countryCode?: string): PopularCity[] {
  const all = getPopularCities(20);
  if (!countryCode) return all.slice(0, 5);

  // Try to find a city in the user's country first
  const localCity = all.find((c) => c.countryCode === countryCode);
  if (localCity) {
    return [localCity, ...all.filter((c) => c.code !== localCity.code)].slice(0, 5);
  }
  return all.slice(0, 5);
}