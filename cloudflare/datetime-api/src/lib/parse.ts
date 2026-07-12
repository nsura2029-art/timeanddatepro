// ============================================================
// Query parsing — extract city, state, country from user input
// ============================================================
// Handles: "Paris", "Paris TX", "Paris, Texas", "Paris Texas US",
// "USA", "NYC", "Mumbai", "São Paulo", "Bombay"
// ============================================================

export interface ParsedQuery {
  /** Original query string */
  raw: string;
  /** Primary term (usually the city name) */
  primary: string;
  /** Optional state (abbrev or name) */
  state?: string;
  /** Optional country (2-letter or 3-letter code or name) */
  country?: string;
  /** Detected query type */
  type: "city" | "country" | "state" | "ambiguous";
}

// Common 2-letter country codes (ISO 3166-1 alpha-2) — checked first
// before treating as a state code
const COUNTRY_CODES = new Set([
  "US", "GB", "CA", "AU", "NZ", "DE", "FR", "IT", "ES", "PT", "NL", "BE",
  "CH", "AT", "SE", "NO", "DK", "FI", "IS", "IE", "PL", "CZ", "SK", "HU",
  "RO", "BG", "GR", "TR", "RU", "UA", "CN", "JP", "KR", "KP", "TW", "IN",
  "PK", "BD", "LK", "NP", "TH", "VN", "ID", "PH", "MY", "SG", "EG", "ZA",
  "NG", "KE", "ET", "AR", "BR", "CL", "CO", "PE", "MX", "IL", "SA", "AE",
  "AF", "AL", "DZ", "AD", "AO", "AG", "AM", "AZ", "BS", "BH", "BD", "BB",
  "BY", "BZ", "BJ", "BT", "BO", "BA", "BW", "BN", "BF", "BI", "CV", "KH",
  "CM", "CF", "TD", "KM", "CG", "CD", "CR", "CI", "HR", "CU", "CY", "DJ",
  "DM", "DO", "EC", "SV", "GQ", "ER", "EE", "SZ", "FJ", "GA", "GM", "GE",
  "GH", "GD", "GT", "GN", "GW", "GY", "HT", "HN", "HK", "HU", "IR", "IQ",
  "JM", "JO", "KZ", "KE", "KI", "KW", "KG", "LA", "LV", "LB", "LS", "LR",
  "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MV", "ML", "MT", "MH", "MR",
  "MU", "MM", "MD", "MC", "MN", "ME", "MA", "MZ", "NA", "NR", "NI", "NE",
  "MK", "OM", "PA", "PG", "PY", "PE", "PH", "PL", "QA", "RO", "RW", "KN",
  "LC", "VC", "WS", "SM", "ST", "SN", "RS", "SC", "SL", "SG", "SK", "SI",
  "SB", "SO", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TJ", "TZ",
  "TL", "TG", "TO", "TT", "TN", "TM", "TV", "UG", "UY", "UZ", "VU", "VA",
  "VE", "VN", "YE", "ZM", "ZW",
]);

// US state codes (most common 2-letter state codes)
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
]);

// Canadian province codes
const CA_PROVINCE_CODES = new Set([
  "ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT",
]);

// Australian state codes
const AU_STATE_CODES = new Set([
  "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT",
]);

/**
 * Parse a user query into city, state, country components.
 *
 * Examples:
 *   "Paris" → { primary: "Paris", type: "city" }
 *   "Paris TX" → { primary: "Paris", state: "TX", type: "city" }
 *   "Paris, Texas" → { primary: "Paris", state: "Texas", type: "city" }
 *   "Paris Texas US" → { primary: "Paris", state: "Texas", country: "US", type: "city" }
 *   "USA" → { primary: "USA", country: "US", type: "country" }
 *   "New York" → { primary: "New York", type: "city" }
 *   "São Paulo" → { primary: "São Paulo", type: "city" }
 */
export function parseQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  if (!trimmed) return { raw: "", primary: "", type: "ambiguous" };

  // "City, State, Country" — split on commas first
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      return { raw, primary: parts[0], state: parts[1], type: "city" };
    }
    if (parts.length === 3) {
      return { raw, primary: parts[0], state: parts[1], country: parts[2], type: "city" };
    }
  }

  // Split on whitespace
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) {
    return { raw, primary: tokens[0], type: "city" };
  }

  // "City STATE" or "City COUNTRY" or "City STATE COUNTRY"
  // Walk from the right — country is the most specific (rightmost if 2-letter)
  const result: ParsedQuery = { raw, primary: tokens[0], type: "city" };
  let consumed = 1;

  // Last token: 2-letter code → check if country or state
  const last = tokens[tokens.length - 1].toUpperCase();
  if (tokens.length >= 2 && last.length === 2) {
    if (COUNTRY_CODES.has(last)) {
      result.country = last;
      consumed = tokens.length;  // country is always last
    } else if (US_STATE_CODES.has(last) || CA_PROVINCE_CODES.has(last) ||
               ["ENG", "SCT", "WLS", "NIR"].includes(last) /* UK */) {
      result.state = last;
      consumed = tokens.length;
    }
  }
  // Last token: 3-letter code → AU state
  if (consumed === 1 && last.length === 3 && AU_STATE_CODES.has(last)) {
    result.state = last;
    consumed = tokens.length;
  }

  // If we consumed the last token, middle tokens are part of the city name
  // or the state name
  if (consumed === 1 && tokens.length === 2) {
    // "City State" — the 2nd token is the state (no code, just a word)
    result.state = tokens[1];
  } else if (consumed === 1 && tokens.length === 3) {
    // "City State-Name Country-Code" — handled above
    // "City State-Name Part2" — 2nd and 3rd are the state
    result.state = `${tokens[1]} ${tokens[2]}`;
  } else if (consumed === 1 && tokens.length > 3) {
    // "City State Part1 Part2 ... Country" — middle is state
    result.state = tokens.slice(1, tokens.length - 1).join(" ");
  }

  // Special case: "USA", "UK", etc. as the whole query → country
  if (tokens.length === 1 && last.length <= 3 && COUNTRY_CODES.has(last)) {
    return { raw, primary: last, country: last, type: "country" };
  }

  // Special case: query is just a US state code
  if (tokens.length === 1 && US_STATE_CODES.has(last)) {
    return { raw, primary: last, state: last, type: "state" };
  }

  return result;
}
