// src/data/popular.ts
// Top 20 most popular cities by global search volume.
// Locked constant — used by /api/v1/popular/cities and as default favorites.
// Curated from Google Trends + Wikipedia pageview data (Q1 2026).

import type { CityEntry } from "../types/city";

export const POPULAR_20: CityEntry[] = [
  { code: "NYC", name: "New York",      country: "United States", countryCode: "US", timezone: "America/New_York",        population: 8_336_817 },
  { code: "LDN", name: "London",        country: "United Kingdom", countryCode: "GB", timezone: "Europe/London",           population: 9_002_488 },
  { code: "TYO", name: "Tokyo",         country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo",                       population: 13_960_000 },
  { code: "PAR", name: "Paris",         country: "France", countryCode: "FR", timezone: "Europe/Paris",                   population: 2_161_000 },
  { code: "DXB", name: "Dubai",         country: "UAE", countryCode: "AE", timezone: "Asia/Dubai",                       population: 3_564_000 },
  { code: "SYD", name: "Sydney",        country: "Australia", countryCode: "AU", timezone: "Australia/Sydney",               population: 5_312_000 },
  { code: "HKG", name: "Hong Kong",     country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong",                  population: 7_500_000 },
  { code: "SIN", name: "Singapore",     country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore",                  population: 5_917_000 },
  { code: "LAX", name: "Los Angeles",   country: "United States", countryCode: "US", timezone: "America/Los_Angeles",           population: 3_898_747 },
  { code: "CHI", name: "Chicago",       country: "United States", countryCode: "US", timezone: "America/Chicago",                 population: 2_746_388 },
  { code: "BOM", name: "Mumbai",        country: "India", countryCode: "IN", timezone: "Asia/Kolkata",                     population: 20_411_000 },
  { code: "SHA", name: "Shanghai",      country: "China", countryCode: "CN", timezone: "Asia/Shanghai",                    population: 24_870_000 },
  { code: "BER", name: "Berlin",        country: "Germany", countryCode: "DE", timezone: "Europe/Berlin",                   population: 3_850_000 },
  { code: "MOW", name: "Moscow",        country: "Russia", countryCode: "RU", timezone: "Europe/Moscow",                   population: 12_712_000 },
  { code: "SAO", name: "São Paulo",     country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo",               population: 12_396_000 },
  { code: "TOR", name: "Toronto",       country: "Canada", countryCode: "CA", timezone: "America/Toronto",                 population: 2_794_356 },
  { code: "MEX", name: "Mexico City",   country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City",             population: 9_209_944 },
  { code: "JNB", name: "Johannesburg",  country: "South Africa", countryCode: "ZA", timezone: "Africa/Johannesburg",             population: 6_198_000 },
  { code: "IST", name: "Istanbul",      country: "Turkey", countryCode: "TR", timezone: "Europe/Istanbul",                 population: 15_840_000 },
  { code: "SEL", name: "Seoul",         country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul",                       population: 9_708_000 },
];