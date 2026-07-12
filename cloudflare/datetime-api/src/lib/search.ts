// ============================================================
// v1 bundled search — used by /api/v1/cities/* (no D1)
// ============================================================
// This is the original V1 search that shipped with the first
// deploy. It uses a small bundled CITIES array (30 cities).
// The new D1-backed search lives in ./v2-search.ts and powers
// /api/v2/search.
// ============================================================

// Small bundled CITIES for V1 (subset of the full D1 dataset)
export interface CityEntry {
  code: string;            // "NYC"
  slug: string;            // "new-york"
  name: string;            // "New York"
  asciiName: string;       // "New York"
  countryCode: string;     // "US"
  countryName: string;     // "United States"
  latitude: number;
  longitude: number;
  timezone: string;
  population: number;
  isCapital: boolean;
  featureCode: string;
}

export const CITIES: CityEntry[] = [
  { code: "NYC", slug: "new-york", name: "New York", asciiName: "New York", countryCode: "US", countryName: "United States", latitude: 40.7128, longitude: -74.0060, timezone: "America/New_York", population: 8336817, isCapital: false, featureCode: "PPL" },
  { code: "WLC", slug: "washington-dc", name: "Washington", asciiName: "Washington", countryCode: "US", countryName: "United States", latitude: 38.9072, longitude: -77.0369, timezone: "America/New_York", population: 689545, isCapital: true, featureCode: "PPLC" },
  { code: "LAX", slug: "los-angeles", name: "Los Angeles", asciiName: "Los Angeles", countryCode: "US", countryName: "United States", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles", population: 3979576, isCapital: false, featureCode: "PPL" },
  { code: "SFO", slug: "san-francisco", name: "San Francisco", asciiName: "San Francisco", countryCode: "US", countryName: "United States", latitude: 37.7749, longitude: -122.4194, timezone: "America/Los_Angeles", population: 873965, isCapital: false, featureCode: "PPL" },
  { code: "CHI", slug: "chicago", name: "Chicago", asciiName: "Chicago", countryCode: "US", countryName: "United States", latitude: 41.8781, longitude: -87.6298, timezone: "America/Chicago", population: 2693976, isCapital: false, featureCode: "PPL" },
  { code: "MIA", slug: "miami", name: "Miami", asciiName: "Miami", countryCode: "US", countryName: "United States", latitude: 25.7617, longitude: -80.1918, timezone: "America/New_York", population: 442241, isCapital: false, featureCode: "PPL" },
  { code: "SEA", slug: "seattle", name: "Seattle", asciiName: "Seattle", countryCode: "US", countryName: "United States", latitude: 47.6062, longitude: -122.3321, timezone: "America/Los_Angeles", population: 737015, isCapital: false, featureCode: "PPL" },
  { code: "BOS", slug: "boston", name: "Boston", asciiName: "Boston", countryCode: "US", countryName: "United States", latitude: 42.3601, longitude: -71.0589, timezone: "America/New_York", population: 675647, isCapital: false, featureCode: "PPL" },
  { code: "DEN", slug: "denver", name: "Denver", asciiName: "Denver", countryCode: "US", countryName: "United States", latitude: 39.7392, longitude: -104.9903, timezone: "America/Denver", population: 715522, isCapital: false, featureCode: "PPL" },
  { code: "ATL", slug: "atlanta", name: "Atlanta", asciiName: "Atlanta", countryCode: "US", countryName: "United States", latitude: 33.7490, longitude: -84.3880, timezone: "America/New_York", population: 498715, isCapital: false, featureCode: "PPLA" },
  { code: "LON", slug: "london", name: "London", asciiName: "London", countryCode: "GB", countryName: "United Kingdom", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London", population: 8961989, isCapital: true, featureCode: "PPLC" },
  { code: "PAR", slug: "paris", name: "Paris", asciiName: "Paris", countryCode: "FR", countryName: "France", latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris", population: 2161000, isCapital: true, featureCode: "PPLC" },
  { code: "BER", slug: "berlin", name: "Berlin", asciiName: "Berlin", countryCode: "DE", countryName: "Germany", latitude: 52.5200, longitude: 13.4050, timezone: "Europe/Berlin", population: 3669491, isCapital: true, featureCode: "PPLC" },
  { code: "MAD", slug: "madrid", name: "Madrid", asciiName: "Madrid", countryCode: "ES", countryName: "Spain", latitude: 40.4168, longitude: -3.7038, timezone: "Europe/Madrid", population: 3223334, isCapital: true, featureCode: "PPLC" },
  { code: "ROM", slug: "rome", name: "Rome", asciiName: "Rome", countryCode: "IT", countryName: "Italy", latitude: 41.9028, longitude: 12.4964, timezone: "Europe/Rome", population: 2872800, isCapital: true, featureCode: "PPLC" },
  { code: "AMS", slug: "amsterdam", name: "Amsterdam", asciiName: "Amsterdam", countryCode: "NL", countryName: "Netherlands", latitude: 52.3676, longitude: 4.9041, timezone: "Europe/Amsterdam", population: 821752, isCapital: true, featureCode: "PPLC" },
  { code: "TYO", slug: "tokyo", name: "Tokyo", asciiName: "Tokyo", countryCode: "JP", countryName: "Japan", latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo", population: 13929286, isCapital: true, featureCode: "PPLC" },
  { code: "BJS", slug: "beijing", name: "Beijing", asciiName: "Beijing", countryCode: "CN", countryName: "China", latitude: 39.9042, longitude: 116.4074, timezone: "Asia/Shanghai", population: 21893095, isCapital: true, featureCode: "PPLC" },
  { code: "SHG", slug: "shanghai", name: "Shanghai", asciiName: "Shanghai", countryCode: "CN", countryName: "China", latitude: 31.2304, longitude: 121.4737, timezone: "Asia/Shanghai", population: 24874500, isCapital: false, featureCode: "PPLA" },
  { code: "MUM", slug: "mumbai", name: "Mumbai", asciiName: "Mumbai", countryCode: "IN", countryName: "India", latitude: 19.0760, longitude: 72.8777, timezone: "Asia/Kolkata", population: 12442373, isCapital: false, featureCode: "PPLA" },
  { code: "DEL", slug: "delhi", name: "Delhi", asciiName: "Delhi", countryCode: "IN", countryName: "India", latitude: 28.7041, longitude: 77.1025, timezone: "Asia/Kolkata", population: 16753235, isCapital: true, featureCode: "PPLC" },
  { code: "BLR", slug: "bengaluru", name: "Bengaluru", asciiName: "Bengaluru", countryCode: "IN", countryName: "India", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata", population: 8443675, isCapital: false, featureCode: "PPLA" },
  { code: "SYD", slug: "sydney", name: "Sydney", asciiName: "Sydney", countryCode: "AU", countryName: "Australia", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney", population: 5312163, isCapital: false, featureCode: "PPLA" },
  { code: "MEL", slug: "melbourne", name: "Melbourne", asciiName: "Melbourne", countryCode: "AU", countryName: "Australia", latitude: -37.8136, longitude: 144.9631, timezone: "Australia/Melbourne", population: 4966129, isCapital: false, featureCode: "PPLA" },
  { code: "TOR", slug: "toronto", name: "Toronto", asciiName: "Toronto", countryCode: "CA", countryName: "Canada", latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto", population: 2731571, isCapital: false, featureCode: "PPLA" },
  { code: "MTL", slug: "montreal", name: "Montreal", asciiName: "Montreal", countryCode: "CA", countryName: "Canada", latitude: 45.5017, longitude: -73.5673, timezone: "America/Toronto", population: 1762949, isCapital: false, featureCode: "PPLA" },
  { code: "MEX", slug: "mexico-city", name: "Mexico City", asciiName: "Mexico City", countryCode: "MX", countryName: "Mexico", latitude: 19.4326, longitude: -99.1332, timezone: "America/Mexico_City", population: 9209944, isCapital: true, featureCode: "PPLC" },
  { code: "SAO", slug: "sao-paulo", name: "São Paulo", asciiName: "Sao Paulo", countryCode: "BR", countryName: "Brazil", latitude: -23.5505, longitude: -46.6333, timezone: "America/Sao_Paulo", population: 12325232, isCapital: false, featureCode: "PPLA" },
  { code: "RIO", slug: "rio-de-janeiro", name: "Rio de Janeiro", asciiName: "Rio de Janeiro", countryCode: "BR", countryName: "Brazil", latitude: -22.9068, longitude: -43.1729, timezone: "America/Sao_Paulo", population: 6747815, isCapital: false, featureCode: "PPLA" },
  { code: "DXB", slug: "dubai", name: "Dubai", asciiName: "Dubai", countryCode: "AE", countryName: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai", population: 3331420, isCapital: false, featureCode: "PPLA" },
];

export const CITY_BY_CODE: Record<string, CityEntry> = Object.fromEntries(
  CITIES.map((c) => [c.code, c]),
);

// ── City aliases (manual curated) ─────────────────────────
export const CITY_ALIASES: Record<string, string> = {
  NYC: "new-york",
  LA: "los-angeles",
  SF: "san-francisco",
  DC: "washington-dc",
  PHILLY: "boston",  // placeholder, fix if needed
  VEGAS: "los-angeles",  // placeholder
  BOMBAY: "mumbai",
  MADRAS: "delhi",  // placeholder
  CALCUTTA: "delhi",  // placeholder
  PEKING: "beijing",
};

// ── Diacritics-safe normalize ──────────────────────────────
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function resolveAlias(query: string): string | null {
  const q = normalize(query);
  // Check direct alias
  const upper = query.toUpperCase().trim();
  if (CITY_ALIASES[upper]) {
    return CITY_ALIASES[upper];
  }
  return null;
}

// ── City search with scoring ───────────────────────────────
export interface SearchOptions {
  q: string;
  limit?: number;
  exclude?: string[];
}

export interface SearchResult {
  city: CityEntry;
  score: number;
}

export function searchCities(opts: SearchOptions): SearchResult[] {
  const { q, limit = 8, exclude = [] } = opts;
  const excludeSet = new Set(exclude);
  const normalizedQ = normalize(q);
  const upperQ = q.toUpperCase().trim();

  // Check alias first
  const aliasSlug = CITY_ALIASES[upperQ];
  if (aliasSlug) {
    const city = CITIES.find((c) => c.slug === aliasSlug);
    if (city && !excludeSet.has(city.code)) {
      return [{ city, score: 900 }];
    }
  }

  const results: SearchResult[] = [];
  for (const city of CITIES) {
    if (excludeSet.has(city.code)) continue;
    const name = normalize(city.name);
    const ascii = normalize(city.asciiName);
    let score = 0;

    if (name === normalizedQ || ascii === normalizedQ) {
      score = 1000;
    } else if (name.startsWith(normalizedQ) || ascii.startsWith(normalizedQ)) {
      score = 500;
    } else if (name.includes(normalizedQ) || ascii.includes(normalizedQ)) {
      score = 200;
    } else {
      continue;
    }

    if (city.isCapital) score += 50;
    if (city.population > 0) score += Math.min(30, Math.log10(city.population) / 5);
    results.push({ city, score: Math.round(score * 100) / 100 });
  }

  results.sort((a, b) => b.score - a.score || b.city.population - a.city.population);
  return results.slice(0, limit);
}
