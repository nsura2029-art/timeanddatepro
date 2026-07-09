// src/data/countries-meta.ts
// Country-level metadata for the location picker. Covers ~70 countries —
// the ones users actually search for. ISO 3166-1 alpha-2 codes match
// what's in flags.ts and the IANA timezones referenced by cities.ts.

export interface CountryEntry {
  code: string;          // ISO alpha-2
  name: string;          // English short name
  capital: string;       // Capital city name
  defaultTimezone: string; // IANA timezone for the capital
  continent: "NA" | "SA" | "EU" | "AF" | "AS" | "OC" | "AN";
  popularCityCodes: string[]; // CityEntry.code values to surface as "popular"
}

export const COUNTRIES: CountryEntry[] = [
  // North America
  { code: "US", name: "United States",       capital: "Washington, D.C.", defaultTimezone: "America/New_York",   continent: "NA", popularCityCodes: ["NYC","LAX","CHI","DEN","SEA","MIA","BOS","SFO"] },
  { code: "CA", name: "Canada",              capital: "Ottawa",           defaultTimezone: "America/Toronto",     continent: "NA", popularCityCodes: ["YYZ","YVR","YUL","YYC"] },
  { code: "MX", name: "Mexico",              capital: "Mexico City",      defaultTimezone: "America/Mexico_City",  continent: "NA", popularCityCodes: ["MEX","GDL","MTY"] },

  // South America
  { code: "BR", name: "Brazil",              capital: "Brasília",         defaultTimezone: "America/Sao_Paulo",    continent: "SA", popularCityCodes: ["GRU","GIG","BSB","EZE"] },
  { code: "AR", name: "Argentina",           capital: "Buenos Aires",     defaultTimezone: "America/Argentina/Buenos_Aires", continent: "SA", popularCityCodes: ["EZE"] },
  { code: "CL", name: "Chile",               capital: "Santiago",         defaultTimezone: "America/Santiago",     continent: "SA", popularCityCodes: ["SCL"] },
  { code: "CO", name: "Colombia",            capital: "Bogotá",           defaultTimezone: "America/Bogota",       continent: "SA", popularCityCodes: ["BOG"] },
  { code: "PE", name: "Peru",                capital: "Lima",             defaultTimezone: "America/Lima",         continent: "SA", popularCityCodes: ["LIM"] },

  // Europe — UK + Ireland
  { code: "GB", name: "United Kingdom",      capital: "London",           defaultTimezone: "Europe/London",        continent: "EU", popularCityCodes: ["LON","MAN","EDI"] },
  { code: "IE", name: "Ireland",             capital: "Dublin",           defaultTimezone: "Europe/Dublin",        continent: "EU", popularCityCodes: ["DUB"] },

  // Europe — Western
  { code: "FR", name: "France",              capital: "Paris",            defaultTimezone: "Europe/Paris",         continent: "EU", popularCityCodes: ["PAR","LYS","MRS","NCE"] },
  { code: "DE", name: "Germany",             capital: "Berlin",           defaultTimezone: "Europe/Berlin",        continent: "EU", popularCityCodes: ["BER","MUC","FRA","HAM"] },
  { code: "ES", name: "Spain",               capital: "Madrid",           defaultTimezone: "Europe/Madrid",        continent: "EU", popularCityCodes: ["MAD","BCN"] },
  { code: "PT", name: "Portugal",            capital: "Lisbon",           defaultTimezone: "Europe/Lisbon",        continent: "EU", popularCityCodes: ["LIS"] },
  { code: "IT", name: "Italy",               capital: "Rome",             defaultTimezone: "Europe/Rome",          continent: "EU", popularCityCodes: ["ROM","MIL","VCE"] },
  { code: "NL", name: "Netherlands",         capital: "Amsterdam",        defaultTimezone: "Europe/Amsterdam",     continent: "EU", popularCityCodes: ["AMS"] },
  { code: "BE", name: "Belgium",             capital: "Brussels",         defaultTimezone: "Europe/Brussels",      continent: "EU", popularCityCodes: ["BRU"] },
  { code: "AT", name: "Austria",             capital: "Vienna",           defaultTimezone: "Europe/Vienna",        continent: "EU", popularCityCodes: ["VIE"] },
  { code: "CH", name: "Switzerland",         capital: "Bern",             defaultTimezone: "Europe/Zurich",        continent: "EU", popularCityCodes: ["ZRH","GVA"] },

  // Europe — Northern
  { code: "SE", name: "Sweden",              capital: "Stockholm",        defaultTimezone: "Europe/Stockholm",     continent: "EU", popularCityCodes: ["ARN"] },
  { code: "NO", name: "Norway",              capital: "Oslo",             defaultTimezone: "Europe/Oslo",          continent: "EU", popularCityCodes: ["OSL"] },
  { code: "DK", name: "Denmark",             capital: "Copenhagen",       defaultTimezone: "Europe/Copenhagen",    continent: "EU", popularCityCodes: ["CPH"] },
  { code: "FI", name: "Finland",             capital: "Helsinki",         defaultTimezone: "Europe/Helsinki",      continent: "EU", popularCityCodes: ["HEL"] },
  { code: "IS", name: "Iceland",             capital: "Reykjavik",        defaultTimezone: "Atlantic/Reykjavik",   continent: "EU", popularCityCodes: ["REK"] },

  // Europe — Eastern
  { code: "PL", name: "Poland",              capital: "Warsaw",           defaultTimezone: "Europe/Warsaw",        continent: "EU", popularCityCodes: ["WAW"] },
  { code: "CZ", name: "Czechia",             capital: "Prague",           defaultTimezone: "Europe/Prague",        continent: "EU", popularCityCodes: ["PRG"] },
  { code: "HU", name: "Hungary",             capital: "Budapest",         defaultTimezone: "Europe/Budapest",      continent: "EU", popularCityCodes: ["BUD"] },
  { code: "RO", name: "Romania",             capital: "Bucharest",        defaultTimezone: "Europe/Bucharest",     continent: "EU", popularCityCodes: ["OTP"] },
  { code: "GR", name: "Greece",              capital: "Athens",           defaultTimezone: "Europe/Athens",        continent: "EU", popularCityCodes: ["ATH"] },
  { code: "RU", name: "Russia",              capital: "Moscow",           defaultTimezone: "Europe/Moscow",        continent: "EU", popularCityCodes: ["MOW","LED"] },
  { code: "UA", name: "Ukraine",             capital: "Kyiv",             defaultTimezone: "Europe/Kyiv",          continent: "EU", popularCityCodes: ["IEV"] },
  { code: "TR", name: "Turkey",              capital: "Ankara",           defaultTimezone: "Europe/Istanbul",      continent: "EU", popularCityCodes: ["IST"] },

  // Middle East
  { code: "AE", name: "United Arab Emirates",capital: "Abu Dhabi",        defaultTimezone: "Asia/Dubai",           continent: "AS", popularCityCodes: ["DXB"] },
  { code: "SA", name: "Saudi Arabia",        capital: "Riyadh",           defaultTimezone: "Asia/Riyadh",          continent: "AS", popularCityCodes: ["RUH","JED"] },
  { code: "IL", name: "Israel",              capital: "Jerusalem",        defaultTimezone: "Asia/Jerusalem",       continent: "AS", popularCityCodes: ["TLV"] },
  { code: "QA", name: "Qatar",               capital: "Doha",             defaultTimezone: "Asia/Qatar",           continent: "AS", popularCityCodes: ["DOH"] },
  { code: "KW", name: "Kuwait",              capital: "Kuwait City",      defaultTimezone: "Asia/Kuwait",          continent: "AS", popularCityCodes: ["KWI"] },
  { code: "BH", name: "Bahrain",             capital: "Manama",           defaultTimezone: "Asia/Bahrain",         continent: "AS", popularCityCodes: ["BAH"] },
  { code: "OM", name: "Oman",                capital: "Muscat",           defaultTimezone: "Asia/Muscat",          continent: "AS", popularCityCodes: ["MCT"] },
  { code: "JO", name: "Jordan",              capital: "Amman",            defaultTimezone: "Asia/Amman",           continent: "AS", popularCityCodes: ["AMM"] },

  // Africa
  { code: "EG", name: "Egypt",               capital: "Cairo",            defaultTimezone: "Africa/Cairo",         continent: "AF", popularCityCodes: ["CAI"] },
  { code: "ZA", name: "South Africa",        capital: "Pretoria",         defaultTimezone: "Africa/Johannesburg",  continent: "AF", popularCityCodes: ["JNB","CPT"] },
  { code: "NG", name: "Nigeria",             capital: "Abuja",            defaultTimezone: "Africa/Lagos",         continent: "AF", popularCityCodes: ["LOS"] },
  { code: "KE", name: "Kenya",               capital: "Nairobi",          defaultTimezone: "Africa/Nairobi",       continent: "AF", popularCityCodes: ["NBO"] },
  { code: "MA", name: "Morocco",             capital: "Rabat",            defaultTimezone: "Africa/Casablanca",    continent: "AF", popularCityCodes: ["CMN"] },
  { code: "ET", name: "Ethiopia",            capital: "Addis Ababa",      defaultTimezone: "Africa/Addis_Ababa",   continent: "AF", popularCityCodes: ["ADD"] },
  { code: "GH", name: "Ghana",               capital: "Accra",            defaultTimezone: "Africa/Accra",         continent: "AF", popularCityCodes: ["ACC"] },
  { code: "TZ", name: "Tanzania",            capital: "Dodoma",           defaultTimezone: "Africa/Dar_es_Salaam", continent: "AF", popularCityCodes: ["DAR"] },

  // South Asia
  { code: "IN", name: "India",               capital: "New Delhi",        defaultTimezone: "Asia/Kolkata",         continent: "AS", popularCityCodes: ["DEL","BOM","BLR","MAA","CCU"] },
  { code: "PK", name: "Pakistan",            capital: "Islamabad",        defaultTimezone: "Asia/Karachi",         continent: "AS", popularCityCodes: ["KHI","LHE"] },
  { code: "BD", name: "Bangladesh",          capital: "Dhaka",            defaultTimezone: "Asia/Dhaka",           continent: "AS", popularCityCodes: ["DAC"] },
  { code: "LK", name: "Sri Lanka",           capital: "Colombo",          defaultTimezone: "Asia/Colombo",         continent: "AS", popularCityCodes: ["CMB"] },
  { code: "NP", name: "Nepal",               capital: "Kathmandu",        defaultTimezone: "Asia/Kathmandu",       continent: "AS", popularCityCodes: ["KTM"] },

  // Southeast Asia
  { code: "SG", name: "Singapore",           capital: "Singapore",        defaultTimezone: "Asia/Singapore",       continent: "AS", popularCityCodes: ["SIN"] },
  { code: "TH", name: "Thailand",            capital: "Bangkok",          defaultTimezone: "Asia/Bangkok",         continent: "AS", popularCityCodes: ["BKK"] },
  { code: "VN", name: "Vietnam",             capital: "Hanoi",            defaultTimezone: "Asia/Ho_Chi_Minh",     continent: "AS", popularCityCodes: ["SGN","HAN"] },
  { code: "PH", name: "Philippines",         capital: "Manila",           defaultTimezone: "Asia/Manila",          continent: "AS", popularCityCodes: ["MNL","CEB"] },
  { code: "ID", name: "Indonesia",           capital: "Jakarta",          defaultTimezone: "Asia/Jakarta",         continent: "AS", popularCityCodes: ["CGK","DPS"] },
  { code: "MY", name: "Malaysia",            capital: "Kuala Lumpur",     defaultTimezone: "Asia/Kuala_Lumpur",    continent: "AS", popularCityCodes: ["KUL"] },

  // East Asia
  { code: "JP", name: "Japan",               capital: "Tokyo",            defaultTimezone: "Asia/Tokyo",           continent: "AS", popularCityCodes: ["TYO","OSA","FUK"] },
  { code: "CN", name: "China",               capital: "Beijing",          defaultTimezone: "Asia/Shanghai",        continent: "AS", popularCityCodes: ["PEK","PVG","CAN","SZX"] },
  { code: "HK", name: "Hong Kong",           capital: "Hong Kong",        defaultTimezone: "Asia/Hong_Kong",       continent: "AS", popularCityCodes: ["HKG"] },
  { code: "TW", name: "Taiwan",              capital: "Taipei",           defaultTimezone: "Asia/Taipei",          continent: "AS", popularCityCodes: ["TPE"] },
  { code: "KR", name: "South Korea",         capital: "Seoul",            defaultTimezone: "Asia/Seoul",           continent: "AS", popularCityCodes: ["ICN","PUS"] },

  // Oceania
  { code: "AU", name: "Australia",           capital: "Canberra",         defaultTimezone: "Australia/Sydney",     continent: "OC", popularCityCodes: ["SYD","MEL","BNE","PER","ADL"] },
  { code: "NZ", name: "New Zealand",         capital: "Wellington",       defaultTimezone: "Pacific/Auckland",     continent: "OC", popularCityCodes: ["AKL","WLG"] },
];

export const COUNTRY_BY_CODE: Record<string, CountryEntry> =
  Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));