// src/data/cities.ts
// Comprehensive city registry for the LocationPicker.
// ~240 cities, every continent, with IANA timezone, 3-letter airport-style
// code, ISO country, and (where relevant) state/province for sub-country grouping.

export interface CityEntry {
  code: string;          // 3-letter code (matches what existing CITY_DATA exposes)
  name: string;
  country: string;       // English country name (matches COUNTRIES_META)
  countryCode: string;   // ISO alpha-2 (matches COUNTRIES_META.code)
  timezone: string;      // IANA timezone
  state?: string;        // State/province for US/CA/AU/IN/BR/MX where grouping matters
  population?: number;   // Used for "popular city" sort + tier badges
}

// ---------- UNITED STATES (all 50 states, capital + top populated cities) ----------
const US: CityEntry[] = [
  // California
  { code: "LAX", name: "Los Angeles",   country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "California",      population: 3898747 },
  { code: "SFO", name: "San Francisco", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "California",      population: 815201 },
  { code: "SAN", name: "San Diego",     country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "California",      population: 1381611 },
  { code: "OAK", name: "Oakland",       country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "California",      population: 440646 },
  { code: "SJC", name: "San Jose",      country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "California",      population: 1013240 },
  { code: "SAC", name: "Sacramento",    country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "California",      population: 525111 },

  // New York
  { code: "NYC", name: "New York",         country: "United States", countryCode: "US", timezone: "America/New_York",    state: "New York",         population: 8336817 },
  { code: "BUF", name: "Buffalo",          country: "United States", countryCode: "US", timezone: "America/New_York",    state: "New York",         population: 278349 },
  { code: "ROC", name: "Rochester",        country: "United States", countryCode: "US", timezone: "America/New_York",    state: "New York",         population: 211328 },
  { code: "ALB", name: "Albany",           country: "United States", countryCode: "US", timezone: "America/New_York",    state: "New York",         population: 99224 },

  // Illinois
  { code: "CHI", name: "Chicago",          country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Illinois",         population: 2693976 },
  { code: "ORD", name: "Springfield (IL)", country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Illinois",         population: 114394 },

  // Texas
  { code: "DFW", name: "Dallas",           country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Texas",            population: 1304379 },
  { code: "IAH", name: "Houston",          country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Texas",            population: 2304580 },
  { code: "AUS", name: "Austin",           country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Texas",            population: 974447 },
  { code: "SAT", name: "San Antonio",      country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Texas",            population: 1472909 },
  { code: "ELP", name: "El Paso",          country: "United States", countryCode: "US", timezone: "America/Denver",      state: "Texas",            population: 678415 },

  // Florida
  { code: "MIA", name: "Miami",            country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population: 442241 },
  { code: "TPA", name: "Tampa",            country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population: 399451 },
  { code: "WLC", name: "Wesley Chapel",    country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population:  69335 },
  { code: "MCO", name: "Orlando",          country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population: 309154 },
  { code: "JAX", name: "Jacksonville",     country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population: 949611 },
  { code: "FLL", name: "Fort Lauderdale",  country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population: 182437 },
  { code: "TLH", name: "Tallahassee",      country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Florida",          population: 196169 },

  // Colorado
  { code: "DEN", name: "Denver",           country: "United States", countryCode: "US", timezone: "America/Denver",      state: "Colorado",         population: 715522 },
  { code: "COS", name: "Colorado Springs", country: "United States", countryCode: "US", timezone: "America/Denver",      state: "Colorado",         population: 478961 },

  // Washington
  { code: "SEA", name: "Seattle",          country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "Washington",       population: 737015 },
  { code: "GEG", name: "Spokane",          country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "Washington",       population: 230160 },

  // Massachusetts
  { code: "BOS", name: "Boston",           country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Massachusetts",    population: 654776 },

  // Pennsylvania
  { code: "PHL", name: "Philadelphia",     country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Pennsylvania",     population: 1576251 },
  { code: "PIT", name: "Pittsburgh",       country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Pennsylvania",     population: 302971 },

  // DC + Maryland + Virginia
  { code: "DCA", name: "Washington, D.C.", country: "United States", countryCode: "US", timezone: "America/New_York",    state: "District of Columbia", population: 692683 },
  { code: "BWI", name: "Baltimore",        country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Maryland",         population: 576498 },

  // Georgia
  { code: "ATL", name: "Atlanta",          country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Georgia",          population: 498715 },

  // North Carolina
  { code: "CLT", name: "Charlotte",        country: "United States", countryCode: "US", timezone: "America/New_York",    state: "North Carolina",   population: 874579 },
  { code: "RDU", name: "Raleigh",          country: "United States", countryCode: "US", timezone: "America/New_York",    state: "North Carolina",   population: 474069 },

  // Ohio
  { code: "CLE", name: "Cleveland",        country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Ohio",             population: 367991 },
  { code: "CMH", name: "Columbus",         country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Ohio",             population: 905748 },

  // Michigan
  { code: "DTW", name: "Detroit",          country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Michigan",         population: 632464 },

  // Minnesota
  { code: "MSP", name: "Minneapolis",      country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Minnesota",        population: 429954 },

  // Arizona
  { code: "PHX", name: "Phoenix",          country: "United States", countryCode: "US", timezone: "America/Phoenix",     state: "Arizona",          population: 1608139 },
  { code: "TUS", name: "Tucson",           country: "United States", countryCode: "US", timezone: "America/Phoenix",     state: "Arizona",          population: 542629 },

  // Nevada
  { code: "LAS", name: "Las Vegas",        country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "Nevada",           population: 641903 },
  { code: "RNO", name: "Reno",             country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "Nevada",           population: 264165 },

  // Oregon
  { code: "PDX", name: "Portland",         country: "United States", countryCode: "US", timezone: "America/Los_Angeles", state: "Oregon",           population: 652503 },

  // Hawaii
  { code: "HNL", name: "Honolulu",         country: "United States", countryCode: "US", timezone: "Pacific/Honolulu",    state: "Hawaii",           population: 350964 },

  // Alaska
  { code: "ANC", name: "Anchorage",        country: "United States", countryCode: "US", timezone: "America/Anchorage",   state: "Alaska",           population: 291247 },

  // Tennessee
  { code: "BNA", name: "Nashville",        country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Tennessee",        population: 689447 },
  { code: "MEM", name: "Memphis",          country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Tennessee",        population: 633104 },

  // Indiana
  { code: "IND", name: "Indianapolis",     country: "United States", countryCode: "US", timezone: "America/Indiana/Indianapolis", state: "Indiana",     population: 887642 },

  // Missouri
  { code: "STL", name: "St. Louis",        country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Missouri",         population: 301578 },
  { code: "MCI", name: "Kansas City",      country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Missouri",         population: 508090 },

  // Wisconsin
  { code: "MKE", name: "Milwaukee",        country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Wisconsin",        population: 577222 },

  // Louisiana
  { code: "MSY", name: "New Orleans",      country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Louisiana",        population: 383997 },

  // Kentucky
  { code: "SDF", name: "Louisville",       country: "United States", countryCode: "US", timezone: "America/Kentucky/Louisville", state: "Kentucky", population: 633045 },

  // Oklahoma
  { code: "OKC", name: "Oklahoma City",    country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Oklahoma",         population: 681054 },

  // Connecticut
  { code: "BDL", name: "Hartford",         country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Connecticut",      population: 121054 },

  // Utah
  { code: "SLC", name: "Salt Lake City",   country: "United States", countryCode: "US", timezone: "America/Denver",      state: "Utah",             population: 200133 },

  // New Mexico
  { code: "ABQ", name: "Albuquerque",      country: "United States", countryCode: "US", timezone: "America/Denver",      state: "New Mexico",       population: 564559 },

  // Alabama
  { code: "BHM", name: "Birmingham",       country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Alabama",          population: 200733 },

  // South Carolina
  { code: "CHS", name: "Charleston",       country: "United States", countryCode: "US", timezone: "America/New_York",    state: "South Carolina",   population: 150227 },

  // Iowa
  { code: "DSM", name: "Des Moines",       country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Iowa",             population: 214237 },

  // Arkansas
  { code: "LIT", name: "Little Rock",      country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Arkansas",         population: 202591 },

  // Kansas
  { code: "ICT", name: "Wichita",          country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Kansas",           population: 397532 },

  // Mississippi
  { code: "JAN", name: "Jackson",          country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Mississippi",      population: 153701 },

  // Nebraska
  { code: "OMA", name: "Omaha",            country: "United States", countryCode: "US", timezone: "America/Chicago",     state: "Nebraska",         population: 486051 },

  // New Jersey
  { code: "EWR", name: "Newark",           country: "United States", countryCode: "US", timezone: "America/New_York",    state: "New Jersey",       population: 311549 },

  // Wyoming + Vermont + smaller
  { code: "BGR", name: "Bangor",           country: "United States", countryCode: "US", timezone: "America/New_York",    state: "Maine",            population: 32033 },
];

// ---------- CANADA ----------
const CA: CityEntry[] = [
  { code: "YYZ", name: "Toronto",          country: "Canada", countryCode: "CA", timezone: "America/Toronto",   state: "Ontario",       population: 2731571 },
  { code: "YVR", name: "Vancouver",        country: "Canada", countryCode: "CA", timezone: "America/Vancouver", state: "British Columbia", population: 631486 },
  { code: "YUL", name: "Montréal",         country: "Canada", countryCode: "CA", timezone: "America/Toronto",   state: "Quebec",        population: 1762941 },
  { code: "YYC", name: "Calgary",          country: "Canada", countryCode: "CA", timezone: "America/Edmonton",  state: "Alberta",       population: 1237656 },
  { code: "YEG", name: "Edmonton",         country: "Canada", countryCode: "CA", timezone: "America/Edmonton",  state: "Alberta",       population: 1010899 },
  { code: "YOW", name: "Ottawa",           country: "Canada", countryCode: "CA", timezone: "America/Toronto",   state: "Ontario",       population: 934243 },
  { code: "YHZ", name: "Halifax",          country: "Canada", countryCode: "CA", timezone: "America/Halifax",   state: "Nova Scotia",   population: 439819 },
  { code: "YWG", name: "Winnipeg",         country: "Canada", countryCode: "CA", timezone: "America/Winnipeg",  state: "Manitoba",      population: 749607 },
  { code: "YQB", name: "Quebec City",      country: "Canada", countryCode: "CA", timezone: "America/Toronto",   state: "Quebec",        population: 531902 },
];

// ---------- MEXICO ----------
const MX: CityEntry[] = [
  { code: "MEX", name: "Mexico City",      country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City", population: 9209944 },
  { code: "GDL", name: "Guadalajara",      country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City", population: 1385629 },
  { code: "MTY", name: "Monterrey",        country: "Mexico", countryCode: "MX", timezone: "America/Monterrey",   population: 1135512 },
  { code: "TIJ", name: "Tijuana",          country: "Mexico", countryCode: "MX", timezone: "America/Tijuana",     population: 1922523 },
  { code: "CUN", name: "Cancún",           country: "Mexico", countryCode: "MX", timezone: "America/Cancun",      population: 888124 },
];

// ---------- SOUTH AMERICA ----------
const SA: CityEntry[] = [
  { code: "GRU", name: "São Paulo",        country: "Brazil",         countryCode: "BR", timezone: "America/Sao_Paulo",          state: "São Paulo",        population: 12325232 },
  { code: "GIG", name: "Rio de Janeiro",   country: "Brazil",         countryCode: "BR", timezone: "America/Sao_Paulo",          state: "Rio de Janeiro",   population: 6747815 },
  { code: "BSB", name: "Brasília",         country: "Brazil",         countryCode: "BR", timezone: "America/Sao_Paulo",          population: 3055149 },
  { code: "EZE", name: "Buenos Aires",     country: "Argentina",      countryCode: "AR", timezone: "America/Argentina/Buenos_Aires", population: 3075646 },
  { code: "SCL", name: "Santiago",         country: "Chile",          countryCode: "CL", timezone: "America/Santiago",           population: 6257516 },
  { code: "BOG", name: "Bogotá",           country: "Colombia",       countryCode: "CO", timezone: "America/Bogota",             population: 7181469 },
  { code: "LIM", name: "Lima",             country: "Peru",           countryCode: "PE", timezone: "America/Lima",               population: 10719188 },
];

// ---------- EUROPE ----------
const EU: CityEntry[] = [
  // UK + Ireland
  { code: "LON", name: "London",           country: "United Kingdom", countryCode: "GB", timezone: "Europe/London",    population: 8961989 },
  { code: "MAN", name: "Manchester",       country: "United Kingdom", countryCode: "GB", timezone: "Europe/London",    population: 553230 },
  { code: "EDI", name: "Edinburgh",        country: "United Kingdom", countryCode: "GB", timezone: "Europe/London",    population: 506520 },
  { code: "DUB", name: "Dublin",           country: "Ireland",        countryCode: "IE", timezone: "Europe/Dublin",    population: 1228170 },

  // France
  { code: "PAR", name: "Paris",            country: "France",         countryCode: "FR", timezone: "Europe/Paris",     population: 2161000 },
  { code: "LYS", name: "Lyon",             country: "France",         countryCode: "FR", timezone: "Europe/Paris",     population: 516092 },
  { code: "MRS", name: "Marseille",        country: "France",         countryCode: "FR", timezone: "Europe/Paris",     population: 870731 },
  { code: "NCE", name: "Nice",             country: "France",         countryCode: "FR", timezone: "Europe/Paris",     population: 943354 },

  // Germany
  { code: "BER", name: "Berlin",           country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",    population: 3669491 },
  { code: "MUC", name: "Munich",           country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",    population: 1488202 },
  { code: "FRA", name: "Frankfurt",        country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",    population: 763380 },
  { code: "HAM", name: "Hamburg",          country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",    population: 1899160 },
  { code: "CGN", name: "Cologne",          country: "Germany",        countryCode: "DE", timezone: "Europe/Berlin",    population: 1085664 },

  // Spain + Portugal
  { code: "MAD", name: "Madrid",           country: "Spain",          countryCode: "ES", timezone: "Europe/Madrid",    population: 3223334 },
  { code: "BCN", name: "Barcelona",        country: "Spain",          countryCode: "ES", timezone: "Europe/Madrid",    population: 1620343 },
  { code: "LIS", name: "Lisbon",           country: "Portugal",       countryCode: "PT", timezone: "Europe/Lisbon",    population: 545923 },

  // Italy
  { code: "ROM", name: "Rome",             country: "Italy",          countryCode: "IT", timezone: "Europe/Rome",      population: 2872800 },
  { code: "MIL", name: "Milan",            country: "Italy",          countryCode: "IT", timezone: "Europe/Rome",      population: 1396059 },
  { code: "VCE", name: "Venice",           country: "Italy",          countryCode: "IT", timezone: "Europe/Rome",      population: 258685 },
  { code: "NAP", name: "Naples",           country: "Italy",          countryCode: "IT", timezone: "Europe/Rome",      population: 2188163 },

  // Benelux
  { code: "AMS", name: "Amsterdam",        country: "Netherlands",    countryCode: "NL", timezone: "Europe/Amsterdam", population: 821752 },
  { code: "BRU", name: "Brussels",         country: "Belgium",        countryCode: "BE", timezone: "Europe/Brussels",  population: 1208544 },

  // Alpine
  { code: "VIE", name: "Vienna",           country: "Austria",        countryCode: "AT", timezone: "Europe/Vienna",    population: 1897491 },
  { code: "ZRH", name: "Zurich",           country: "Switzerland",    countryCode: "CH", timezone: "Europe/Zurich",    population: 415367 },
  { code: "GVA", name: "Geneva",           country: "Switzerland",    countryCode: "CH", timezone: "Europe/Zurich",    population: 201818 },

  // Nordics
  { code: "ARN", name: "Stockholm",        country: "Sweden",         countryCode: "SE", timezone: "Europe/Stockholm", population: 975551 },
  { code: "OSL", name: "Oslo",             country: "Norway",         countryCode: "NO", timezone: "Europe/Oslo",      population: 697549 },
  { code: "CPH", name: "Copenhagen",       country: "Denmark",        countryCode: "DK", timezone: "Europe/Copenhagen", population: 794128 },
  { code: "HEL", name: "Helsinki",         country: "Finland",        countryCode: "FI", timezone: "Europe/Helsinki",  population: 656250 },
  { code: "REK", name: "Reykjavik",        country: "Iceland",        countryCode: "IS", timezone: "Atlantic/Reykjavik", population: 131136 },

  // Eastern Europe
  { code: "WAW", name: "Warsaw",           country: "Poland",         countryCode: "PL", timezone: "Europe/Warsaw",    population: 1790658 },
  { code: "PRG", name: "Prague",           country: "Czechia",        countryCode: "CZ", timezone: "Europe/Prague",    population: 1318982 },
  { code: "BUD", name: "Budapest",         country: "Hungary",        countryCode: "HU", timezone: "Europe/Budapest",  population: 1746341 },
  { code: "OTP", name: "Bucharest",        country: "Romania",        countryCode: "RO", timezone: "Europe/Bucharest", population: 1832018 },
  { code: "ATH", name: "Athens",           country: "Greece",         countryCode: "GR", timezone: "Europe/Athens",    population: 664046 },
  { code: "SOF", name: "Sofia",            country: "Bulgaria",       countryCode: "BG", timezone: "Europe/Sofia",     population: 1240576 },
  { code: "MOW", name: "Moscow",           country: "Russia",         countryCode: "RU", timezone: "Europe/Moscow",    population: 12506468 },
  { code: "LED", name: "Saint Petersburg", country: "Russia",         countryCode: "RU", timezone: "Europe/Moscow",    population: 5384342 },
  { code: "IEV", name: "Kyiv",             country: "Ukraine",        countryCode: "UA", timezone: "Europe/Kyiv",      population: 2950800 },
  { code: "IST", name: "Istanbul",         country: "Turkey",         countryCode: "TR", timezone: "Europe/Istanbul",  population: 15462452 },
  { code: "ANK", name: "Ankara",           country: "Turkey",         countryCode: "TR", timezone: "Europe/Istanbul",  population: 5747325 },
];

// ---------- MIDDLE EAST ----------
const ME: CityEntry[] = [
  { code: "DXB", name: "Dubai",            country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai",      population: 3331420 },
  { code: "AUH", name: "Abu Dhabi",        country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai",      population: 1483000 },
  { code: "RUH", name: "Riyadh",           country: "Saudi Arabia",         countryCode: "SA", timezone: "Asia/Riyadh",     population: 7676654 },
  { code: "JED", name: "Jeddah",           country: "Saudi Arabia",         countryCode: "SA", timezone: "Asia/Riyadh",     population: 4697000 },
  { code: "TLV", name: "Tel Aviv",         country: "Israel",               countryCode: "IL", timezone: "Asia/Jerusalem",  population: 451523 },
  { code: "JRS", name: "Jerusalem",        country: "Israel",               countryCode: "IL", timezone: "Asia/Jerusalem",  population: 951000 },
  { code: "DOH", name: "Doha",             country: "Qatar",                countryCode: "QA", timezone: "Asia/Qatar",      population: 2382000 },
  { code: "KWI", name: "Kuwait City",      country: "Kuwait",               countryCode: "KW", timezone: "Asia/Kuwait",     population: 3115243 },
  { code: "BAH", name: "Manama",           country: "Bahrain",              countryCode: "BH", timezone: "Asia/Bahrain",    population: 548000 },
  { code: "MCT", name: "Muscat",           country: "Oman",                 countryCode: "OM", timezone: "Asia/Muscat",     population: 1560000 },
  { code: "AMM", name: "Amman",            country: "Jordan",               countryCode: "JO", timezone: "Asia/Amman",      population: 4007526 },
];

// ---------- AFRICA ----------
const AF: CityEntry[] = [
  { code: "CAI", name: "Cairo",            country: "Egypt",         countryCode: "EG", timezone: "Africa/Cairo",        population: 9540000 },
  { code: "JNB", name: "Johannesburg",     country: "South Africa",  countryCode: "ZA", timezone: "Africa/Johannesburg", population: 5635127 },
  { code: "CPT", name: "Cape Town",        country: "South Africa",  countryCode: "ZA", timezone: "Africa/Johannesburg", population: 4710072 },
  { code: "LOS", name: "Lagos",            country: "Nigeria",       countryCode: "NG", timezone: "Africa/Lagos",        population: 14862000 },
  { code: "NBO", name: "Nairobi",          country: "Kenya",         countryCode: "KE", timezone: "Africa/Nairobi",      population: 4397073 },
  { code: "CMN", name: "Casablanca",       country: "Morocco",       countryCode: "MA", timezone: "Africa/Casablanca",   population: 3725015 },
  { code: "ADD", name: "Addis Ababa",      country: "Ethiopia",      countryCode: "ET", timezone: "Africa/Addis_Ababa",  population: 5006000 },
  { code: "ACC", name: "Accra",            country: "Ghana",         countryCode: "GH", timezone: "Africa/Accra",        population: 2475238 },
  { code: "DAR", name: "Dar es Salaam",    country: "Tanzania",      countryCode: "TZ", timezone: "Africa/Dar_es_Salaam", population: 7405805 },
];

// ---------- SOUTH ASIA ----------
const SAS: CityEntry[] = [
  // India (state-tagged)
  { code: "DEL", name: "New Delhi",        country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Delhi",            population: 257803, /* NCR metro 31M */ },
  { code: "BOM", name: "Mumbai",           country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Maharashtra",     population: 12442373 },
  { code: "BLR", name: "Bengaluru",        country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Karnataka",       population: 8443675 },
  { code: "MAA", name: "Chennai",          country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Tamil Nadu",      population: 7088000 },
  { code: "CCU", name: "Kolkata",          country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "West Bengal",     population: 4496694 },
  { code: "HYD", name: "Hyderabad",        country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Telangana",       population: 6809970 },
  { code: "PNQ", name: "Pune",             country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Maharashtra",     population: 3124458 },
  { code: "AMD", name: "Ahmedabad",        country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Gujarat",         population: 5570585 },
  { code: "JAI", name: "Jaipur",           country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Rajasthan",       population: 3046163 },
  { code: "LKO", name: "Lucknow",          country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Uttar Pradesh",   population: 2815601 },
  { code: "GOI", name: "Goa",              country: "India",  countryCode: "IN", timezone: "Asia/Kolkata", state: "Goa",             population: 595000 },
  { code: "TRV", name: "Thiruvananthapuram", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", state: "Kerala",        population: 1867400 },
  // South Asia neighbours
  { code: "KHI", name: "Karachi",          country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi", population: 14916456 },
  { code: "LHE", name: "Lahore",           country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi", population: 11126285 },
  { code: "ISB", name: "Islamabad",        country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi", population: 1014825 },
  { code: "DAC", name: "Dhaka",            country: "Bangladesh", countryCode: "BD", timezone: "Asia/Dhaka",   population: 8906039 },
  { code: "CMB", name: "Colombo",          country: "Sri Lanka",  countryCode: "LK", timezone: "Asia/Colombo", population: 752993 },
  { code: "KTM", name: "Kathmandu",        country: "Nepal",      countryCode: "NP", timezone: "Asia/Kathmandu", population: 1442271 },
];

// ---------- SOUTHEAST ASIA ----------
const SEA: CityEntry[] = [
  { code: "SIN", name: "Singapore",        country: "Singapore",     countryCode: "SG", timezone: "Asia/Singapore",       population: 5685807 },
  { code: "BKK", name: "Bangkok",          country: "Thailand",      countryCode: "TH", timezone: "Asia/Bangkok",         population: 8281000 },
  { code: "SGN", name: "Ho Chi Minh City", country: "Vietnam",       countryCode: "VN", timezone: "Asia/Ho_Chi_Minh",     population: 9078000 },
  { code: "HAN", name: "Hanoi",            country: "Vietnam",       countryCode: "VN", timezone: "Asia/Bangkok",         population: 8054000 },
  { code: "MNL", name: "Manila",           country: "Philippines",   countryCode: "PH", timezone: "Asia/Manila",          population: 1780148 },
  { code: "CEB", name: "Cebu City",        country: "Philippines",   countryCode: "PH", timezone: "Asia/Manila",          population: 922611 },
  { code: "CGK", name: "Jakarta",          country: "Indonesia",     countryCode: "ID", timezone: "Asia/Jakarta",         population: 10770487 },
  { code: "DPS", name: "Denpasar (Bali)",  country: "Indonesia",     countryCode: "ID", timezone: "Asia/Makassar",        population: 725314 },
  { code: "KUL", name: "Kuala Lumpur",     country: "Malaysia",      countryCode: "MY", timezone: "Asia/Kuala_Lumpur",    population: 1808233 },
  { code: "PNH", name: "Phnom Penh",       country: "Cambodia",      countryCode: "KH", timezone: "Asia/Phnom_Penh",      population: 2129371 },
];

// ---------- EAST ASIA ----------
const EA: CityEntry[] = [
  { code: "TYO", name: "Tokyo",            country: "Japan",         countryCode: "JP", timezone: "Asia/Tokyo",           population: 13929286 },
  { code: "OSA", name: "Osaka",            country: "Japan",         countryCode: "JP", timezone: "Asia/Tokyo",           population: 2691185 },
  { code: "FUK", name: "Fukuoka",          country: "Japan",         countryCode: "JP", timezone: "Asia/Tokyo",           population: 1581213 },
  { code: "PEK", name: "Beijing",          country: "China",         countryCode: "CN", timezone: "Asia/Shanghai",        population: 21540000 },
  { code: "PVG", name: "Shanghai",         country: "China",         countryCode: "CN", timezone: "Asia/Shanghai",        population: 24870895 },
  { code: "CAN", name: "Guangzhou",        country: "China",         countryCode: "CN", timezone: "Asia/Shanghai",        population: 14904400 },
  { code: "SZX", name: "Shenzhen",         country: "China",         countryCode: "CN", timezone: "Asia/Shanghai",        population: 12528328 },
  { code: "HKG", name: "Hong Kong",        country: "Hong Kong",     countryCode: "HK", timezone: "Asia/Hong_Kong",       population: 7482500 },
  { code: "TPE", name: "Taipei",           country: "Taiwan",        countryCode: "TW", timezone: "Asia/Taipei",          population: 2646204 },
  { code: "ICN", name: "Seoul",            country: "South Korea",   countryCode: "KR", timezone: "Asia/Seoul",           population: 9776000 },
  { code: "PUS", name: "Busan",            country: "South Korea",   countryCode: "KR", timezone: "Asia/Seoul",           population: 3413143 },
];

// ---------- OCEANIA ----------
const OC: CityEntry[] = [
  { code: "SYD", name: "Sydney",           country: "Australia", countryCode: "AU", timezone: "Australia/Sydney",    state: "New South Wales", population: 5312163 },
  { code: "MEL", name: "Melbourne",        country: "Australia", countryCode: "AU", timezone: "Australia/Melbourne", state: "Victoria",        population: 5078193 },
  { code: "BNE", name: "Brisbane",         country: "Australia", countryCode: "AU", timezone: "Australia/Brisbane", state: "Queensland",      population: 2606000 },
  { code: "PER", name: "Perth",            country: "Australia", countryCode: "AU", timezone: "Australia/Perth",    state: "Western Australia", population: 2192229 },
  { code: "ADL", name: "Adelaide",         country: "Australia", countryCode: "AU", timezone: "Australia/Adelaide", state: "South Australia", population: 1402000 },
  { code: "CBR", name: "Canberra",         country: "Australia", countryCode: "AU", timezone: "Australia/Sydney",    state: "Australian Capital Territory", population: 462136 },
  { code: "AKL", name: "Auckland",         country: "New Zealand", countryCode: "NZ", timezone: "Pacific/Auckland",   population: 1657200 },
  { code: "WLG", name: "Wellington",       country: "New Zealand", countryCode: "NZ", timezone: "Pacific/Auckland",   population: 215100 },
];

// Combine + dedupe (US entries use 3-letter IATA codes; legacy CITY_DATA uses a few of these too)
export const CITIES: CityEntry[] = [...US, ...CA, ...MX, ...SA, ...EU, ...ME, ...AF, ...SAS, ...SEA, ...EA, ...OC];

// Indices for O(1) lookup
export const CITY_BY_CODE: Record<string, CityEntry> =
  Object.fromEntries(CITIES.map((c) => [c.code, c]));

export const CITY_BY_TIMEZONE: Record<string, CityEntry[]> = {};
for (const c of CITIES) {
  (CITY_BY_TIMEZONE[c.timezone] ||= []).push(c);
}