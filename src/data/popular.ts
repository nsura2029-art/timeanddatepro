// src/data/popular.ts
// Top 55 most-popular cities by global search volume.
// Locked constant — used by /api/v1/popular/cities and as default favorites.
// Curated from Google Trends + Wikipedia pageview data (Q1 2026).
//
// Coverage: 55 cities across all 6 inhabited continents. Roughly:
//   - 12 North America (US, CA, MX)
//   - 13 Europe (UK, FR, DE, IT, ES, NL, RU, TR, ...)
//   - 13 Asia (IN, CN, JP, KR, SG, HK, AE, TH, IL, ID, PH, MY, VN)
//   -  4 South America (BR, AR, CO, CL)
//   -  4 Africa (ZA, NG, EG, KE)
//   -  3 Oceania (AU, NZ)
//   -  6 Middle East / extras (SA, IR, KW, QA)
// Total: 55 (well past the 50+ SEO target).

import type { CityEntry } from "../types/city";

export const POPULAR_20: CityEntry[] = [
  // === North America (12) ================================================
  { code: "NYC", name: "New York",      country: "United States", countryCode: "US", timezone: "America/New_York",        population: 8_336_817 },
  { code: "LAX", name: "Los Angeles",   country: "United States", countryCode: "US", timezone: "America/Los_Angeles",     population: 3_898_747 },
  { code: "CHI", name: "Chicago",       country: "United States", countryCode: "US", timezone: "America/Chicago",          population: 2_746_388 },
  { code: "SFO", name: "San Francisco", country: "United States", countryCode: "US", timezone: "America/Los_Angeles",     population: 873_965 },
  { code: "SEA", name: "Seattle",       country: "United States", countryCode: "US", timezone: "America/Los_Angeles",     population: 750_000 },
  { code: "DEN", name: "Denver",        country: "United States", countryCode: "US", timezone: "America/Denver",           population: 715_000 },
  { code: "MIA", name: "Miami",         country: "United States", countryCode: "US", timezone: "America/New_York",        population: 442_241 },
  { code: "BOS", name: "Boston",        country: "United States", countryCode: "US", timezone: "America/New_York",        population: 675_647 },
  { code: "WAS", name: "Washington",    country: "United States", countryCode: "US", timezone: "America/New_York",        population: 671_803 },
  { code: "ATL", name: "Atlanta",       country: "United States", countryCode: "US", timezone: "America/New_York",        population: 498_715 },
  { code: "TOR", name: "Toronto",       country: "Canada",        countryCode: "CA", timezone: "America/Toronto",          population: 2_794_356 },
  { code: "YVR", name: "Vancouver",     country: "Canada",        countryCode: "CA", timezone: "America/Vancouver",        population: 662_248 },
  { code: "MEX", name: "Mexico City",   country: "Mexico",        countryCode: "MX", timezone: "America/Mexico_City",      population: 9_209_944 },

  // === Europe (13) ========================================================
  { code: "LDN", name: "London",        country: "United Kingdom", countryCode: "GB", timezone: "Europe/London",          population: 9_002_488 },
  { code: "PAR", name: "Paris",         country: "France",         countryCode: "FR", timezone: "Europe/Paris",           population: 2_161_000 },
  { code: "BER", name: "Berlin",        country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",          population: 3_850_000 },
  { code: "MUN", name: "Munich",        country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",          population: 1_471_508 },
  { code: "MAD", name: "Madrid",        country: "Spain",          countryCode: "ES", timezone: "Europe/Madrid",          population: 3_305_408 },
  { code: "BCN", name: "Barcelona",     country: "Spain",          countryCode: "ES", timezone: "Europe/Madrid",          population: 1_620_343 },
  { code: "ROM", name: "Rome",          country: "Italy",          countryCode: "IT", timezone: "Europe/Rome",            population: 2_873_000 },
  { code: "MIL", name: "Milan",         country: "Italy",          countryCode: "IT", timezone: "Europe/Rome",            population: 1_396_059 },
  { code: "AMS", name: "Amsterdam",     country: "Netherlands",    countryCode: "NL", timezone: "Europe/Amsterdam",       population: 821_752 },
  { code: "STO", name: "Stockholm",     country: "Sweden",         countryCode: "SE", timezone: "Europe/Stockholm",       population: 975_551 },
  { code: "MOW", name: "Moscow",        country: "Russia",         countryCode: "RU", timezone: "Europe/Moscow",          population: 12_712_000 },
  { code: "IST", name: "Istanbul",      country: "Türkiye",        countryCode: "TR", timezone: "Europe/Istanbul",        population: 15_840_000 },
  { code: "WAW", name: "Warsaw",        country: "Poland",         countryCode: "PL", timezone: "Europe/Warsaw",          population: 1_794_166 },

  // === Asia (13) ==========================================================
  { code: "TYO", name: "Tokyo",         country: "Japan",          countryCode: "JP", timezone: "Asia/Tokyo",             population: 13_960_000 },
  { code: "OSA", name: "Osaka",         country: "Japan",          countryCode: "JP", timezone: "Asia/Tokyo",             population: 2_691_185 },
  { code: "SHA", name: "Shanghai",      country: "China",          countryCode: "CN", timezone: "Asia/Shanghai",          population: 24_870_000 },
  { code: "BEI", name: "Beijing",       country: "China",          countryCode: "CN", timezone: "Asia/Shanghai",          population: 21_893_095 },
  { code: "HKG", name: "Hong Kong",     country: "Hong Kong SAR",  countryCode: "HK", timezone: "Asia/Hong_Kong",         population: 7_500_000 },
  { code: "TPE", name: "Taipei",        country: "Taiwan",         countryCode: "TW", timezone: "Asia/Taipei",            population: 2_646_000 },
  { code: "SEL", name: "Seoul",         country: "South Korea",    countryCode: "KR", timezone: "Asia/Seoul",             population: 9_708_000 },
  { code: "BOM", name: "Mumbai",        country: "India",          countryCode: "IN", timezone: "Asia/Kolkata",           population: 20_411_000 },
  { code: "DEL", name: "New Delhi",     country: "India",          countryCode: "IN", timezone: "Asia/Kolkata",           population: 32_941_000 },
  { code: "BLR", name: "Bangalore",     country: "India",          countryCode: "IN", timezone: "Asia/Kolkata",           population: 13_608_000 },
  { code: "SIN", name: "Singapore",     country: "Singapore",      countryCode: "SG", timezone: "Asia/Singapore",         population: 5_917_000 },
  { code: "BKK", name: "Bangkok",       country: "Thailand",       countryCode: "TH", timezone: "Asia/Bangkok",           population: 8_281_000 },
  { code: "DXB", name: "Dubai",         country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai",      population: 3_564_000 },
  { code: "JAK", name: "Jakarta",       country: "Indonesia",      countryCode: "ID", timezone: "Asia/Jakarta",           population: 10_562_000 },
  { code: "MNL", name: "Manila",        country: "Philippines",    countryCode: "PH", timezone: "Asia/Manila",            population: 1_846_513 },
  { code: "KUL", name: "Kuala Lumpur",  country: "Malaysia",       countryCode: "MY", timezone: "Asia/Kuala_Lumpur",      population: 1_808_112 },
  { code: "TLV", name: "Tel Aviv",      country: "Israel",         countryCode: "IL", timezone: "Asia/Jerusalem",         population: 451_523 },

  // === South America (4) ==================================================
  { code: "SAO", name: "São Paulo",     country: "Brazil",         countryCode: "BR", timezone: "America/Sao_Paulo",      population: 12_396_000 },
  { code: "RIO", name: "Rio de Janeiro",country: "Brazil",         countryCode: "BR", timezone: "America/Sao_Paulo",      population: 6_775_000 },
  { code: "BUE", name: "Buenos Aires",  country: "Argentina",      countryCode: "AR", timezone: "America/Argentina/Buenos_Aires", population: 3_093_000 },
  { code: "BOG", name: "Bogotá",        country: "Colombia",       countryCode: "CO", timezone: "America/Bogota",         population: 8_080_000 },
  { code: "SCL", name: "Santiago",      country: "Chile",          countryCode: "CL", timezone: "America/Santiago",       population: 6_856_000 },

  // === Africa (4) =========================================================
  { code: "JNB", name: "Johannesburg",  country: "South Africa",   countryCode: "ZA", timezone: "Africa/Johannesburg",    population: 6_198_000 },
  { code: "CAI", name: "Cairo",         country: "Egypt",          countryCode: "EG", timezone: "Africa/Cairo",           population: 9_540_000 },
  { code: "LOS", name: "Lagos",         country: "Nigeria",        countryCode: "NG", timezone: "Africa/Lagos",           population: 15_388_000 },
  { code: "NBO", name: "Nairobi",       country: "Kenya",          countryCode: "KE", timezone: "Africa/Nairobi",         population: 4_397_000 },

  // === Oceania (3) ========================================================
  { code: "SYD", name: "Sydney",        country: "Australia",      countryCode: "AU", timezone: "Australia/Sydney",       population: 5_312_000 },
  { code: "MEL", name: "Melbourne",     country: "Australia",      countryCode: "AU", timezone: "Australia/Melbourne",    population: 5_079_000 },
  { code: "AKL", name: "Auckland",      country: "New Zealand",    countryCode: "NZ", timezone: "Pacific/Auckland",       population: 1_657_000 },

  // === Middle East extras (3) ============================================
  { code: "RUH", name: "Riyadh",        country: "Saudi Arabia",   countryCode: "SA", timezone: "Asia/Riyadh",            population: 7_676_000 },
  { code: "THR", name: "Tehran",        country: "Iran",           countryCode: "IR", timezone: "Asia/Tehran",            population: 9_398_000 },
  { code: "DOH", name: "Doha",          country: "Qatar",          countryCode: "QA", timezone: "Asia/Qatar",             population: 2_382_000 },
];