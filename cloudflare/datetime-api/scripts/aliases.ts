// ============================================================
// Manual alias tables for disambiguation
// ============================================================
// CITY_ALIASES:    "CountryCode:CityName" → { "alias": "type" }
//                  type: "abbreviation" | "common" | "alternate" | "translation"
// COUNTRY_ALIASES: "CountryCode" → { "alias": "type" }
// STATE_ALIASES:   "CountryCode:Admin1Code" → { "alias": "type" }
// ============================================================

export const CITY_ALIASES: Record<string, Record<string, string>> = {
  // ── United States ──────────────────────────────────────
  "US:New York": { "NYC": "abbreviation", "New York City": "common", "Big Apple": "common", "Manhattan": "common" },
  "US:Los Angeles": { "LA": "abbreviation", "L.A.": "abbreviation", "City of Angels": "common" },
  "US:San Francisco": { "SF": "abbreviation", "Frisco": "common", "San Fran": "common" },
  "US:Washington": { "DC": "abbreviation", "D.C.": "abbreviation", "Washington DC": "common", "Washington D.C.": "common" },
  "US:Philadelphia": { "Philly": "abbreviation", "City of Brotherly Love": "common" },
  "US:Chicago": { "Chi-Town": "common", "Windy City": "common" },
  "US:Boston": { "Beantown": "common", "Bean Town": "common" },
  "US:Las Vegas": { "Vegas": "abbreviation", "Sin City": "common" },
  "US:Miami": { "Magic City": "common", "305": "common" },
  "US:Detroit": { "Motor City": "common", "Motown": "common" },
  "US:New Orleans": { "NOLA": "abbreviation", "Big Easy": "common", "The Crescent City": "common" },
  "US:Atlanta": { "ATL": "abbreviation", "Hotlanta": "common" },
  "US:Houston": { "H-Town": "common", "Space City": "common" },
  "US:Dallas": { "Big D": "common", "D-Town": "common" },
  "US:Seattle": { "Emerald City": "common", "Rain City": "common" },
  "US:Portland": { "PDX": "abbreviation", "Stumptown": "common" },
  "US:Denver": { "Mile High City": "common" },
  "US:Phoenix": { "PHX": "abbreviation", "Valley of the Sun": "common" },
  "US:Minneapolis": { "Twin Cities": "common", "Mini-Apple": "common" },
  "US:St. Louis": { "STL": "abbreviation", "Gateway City": "common" },
  "US:Pittsburgh": { "Steel City": "common", "Burgh": "common" },
  "US:Cleveland": { "Forest City": "common" },
  "US:Cincinnati": { "Cincy": "common", "Queen City": "common" },
  "US:Indianapolis": { "Indy": "abbreviation", "Circle City": "common" },
  "US:Kansas City": { "KC": "abbreviation" },
  "US:Nashville": { "Music City": "common", "Nash-Vegas": "common" },
  "US:Memphis": { "Home of the Blues": "common" },
  "US:Charlotte": { "Queen City": "common" },
  "US:Raleigh": { "City of Oaks": "common" },
  "US:San Diego": { "America's Finest City": "common" },
  "US:San Jose": { "Capital of Silicon Valley": "common" },
  "US:Austin": { "ATX": "abbreviation", "Live Music Capital": "common" },
  "US:Jacksonville": { "Jax": "abbreviation" },
  "US:Baltimore": { "Charm City": "common", "B'more": "common" },

  // ── United Kingdom ─────────────────────────────────────
  "GB:London": { "LDN": "abbreviation", "Big Smoke": "common", "The City": "common" },
  "GB:Manchester": { "Manc": "common" },
  "GB:Liverpool": { "Pool": "common" },
  "GB:Birmingham": { "Brum": "common" },
  "GB:Edinburgh": { "Edina": "common" },
  "GB:Glasgow": { "Glasvegas": "common" },
  "GB:Leeds": { "Knightsbridge of the North": "alternate" },
  "GB:Bristol": { "Brizzle": "common" },
  "GB:Cambridge": { "Silicon Fen": "alternate" },
  "GB:Oxford": { "City of Dreaming Spires": "alternate" },

  // ── France ─────────────────────────────────────────────
  "FR:Paris": { "City of Light": "common", "City of Love": "common", "Paname": "common" },
  "FR:Marseille": { "Massalia": "alternate" },
  "FR:Lyon": { "Lyons": "alternate", "City of Lights": "alternate" },
  "FR:Nice": { "Nissa": "alternate" },

  // ── Germany ────────────────────────────────────────────
  "DE:Berlin": { "Hauptstadt": "common", "German Athens": "alternate" },
  "DE:Munich": { "München": "common", "Monaco di Bavaria": "alternate" },
  "DE:Hamburg": { "Tor zur Welt": "alternate", "Gateway to the World": "alternate" },
  "DE:Cologne": { "Köln": "common", "CGN": "abbreviation" },
  "DE:Frankfurt": { "FRA": "abbreviation", "Mainhattan": "common" },

  // ── Italy ──────────────────────────────────────────────
  "IT:Rome": { "Roma": "common", "Eternal City": "common", "Caput Mundi": "alternate" },
  "IT:Milan": { "Milano": "common" },
  "IT:Venice": { "Venezia": "common", "La Serenissima": "alternate" },
  "IT:Naples": { "Napoli": "common" },
  "IT:Turin": { "Torino": "common" },
  "IT:Florence": { "Firenze": "common" },

  // ── Spain ──────────────────────────────────────────────
  "ES:Madrid": { "La Villa": "alternate" },
  "ES:Barcelona": { "BCN": "abbreviation", "Ciudad Condal": "alternate" },
  "ES:Valencia": { "València": "common" },
  "ES:Seville": { "Sevilla": "common" },

  // ── Russia ─────────────────────────────────────────────
  "RU:Moscow": { "Moskva": "common", "MSK": "abbreviation" },
  "RU:Saint Petersburg": { "St Petersburg": "common", "Piter": "common", "SPB": "abbreviation" },

  // ── Japan ──────────────────────────────────────────────
  "JP:Tokyo": { "Edo": "alternate", "TYO": "abbreviation" },
  "JP:Osaka": { "Ōsaka": "common" },
  "JP:Kyoto": { "Kyōto": "common" },
  "JP:Yokohama": { "Yokohama": "common" },

  // ── China ──────────────────────────────────────────────
  "CN:Beijing": { "Peking": "alternate", "BJ": "abbreviation" },
  "CN:Shanghai": { "Hu": "alternate", "SH": "abbreviation" },
  "CN:Guangzhou": { "Canton": "common" },
  "CN:Shenzhen": { "SZ": "abbreviation" },
  "CN:Hong Kong": { "HK": "abbreviation", "香港": "common" },
  "CN:Macau": { "Macao": "alternate" },

  // ── India ──────────────────────────────────────────────
  "IN:Mumbai": { "Bombay": "alternate", "BOM": "abbreviation" },
  "IN:Delhi": { "New Delhi": "common", "DEL": "abbreviation" },
  "IN:Kolkata": { "Calcutta": "alternate", "CCU": "abbreviation" },
  "IN:Chennai": { "Madras": "alternate", "MAA": "abbreviation" },
  "IN:Bengaluru": { "Bangalore": "alternate", "BLR": "abbreviation" },
  "IN:Hyderabad": { "HYD": "abbreviation" },
  "IN:Pune": { "Poona": "alternate" },
  "IN:Ahmedabad": { "Amdavad": "alternate" },
  "IN:Jaipur": { "JPR": "abbreviation", "Pink City": "common" },

  // ── Brazil ─────────────────────────────────────────────
  "BR:São Paulo": { "Sao Paulo": "common", "SP": "abbreviation", "Sampa": "common" },
  "BR:Rio de Janeiro": { "Rio": "common", "Cidade Maravilhosa": "alternate" },
  "BR:Brasília": { "BSB": "abbreviation" },

  // ── Mexico ─────────────────────────────────────────────
  "MX:Mexico City": { "CDMX": "abbreviation", "Ciudad de México": "common", "Distrito Federal": "alternate" },
  "MX:Guadalajara": { "GDL": "abbreviation" },

  // ── Canada ─────────────────────────────────────────────
  "CA:Toronto": { "TO": "abbreviation", "The Six": "common", "T-dot": "common" },
  "CA:Vancouver": { "Van": "common", "Rain City": "common" },
  "CA:Montreal": { "Montréal": "common", "MTL": "abbreviation" },
  "CA:Calgary": { "Cowtown": "common" },
  "CA:Ottawa": { "Bytown": "alternate" },

  // ── Australia ──────────────────────────────────────────
  "AU:Sydney": { "SYD": "abbreviation", "Harbour City": "common" },
  "AU:Melbourne": { "MEL": "abbreviation" },
  "AU:Brisbane": { "BNE": "abbreviation" },
  "AU:Perth": { "PER": "abbreviation" },

  // ── Other ──────────────────────────────────────────────
  "AT:Vienna": { "Wien": "common" },
  "CH:Zürich": { "Zurich": "common" },
  "GR: Athens": { "Αθήνα": "alternate" },
  "TR:Istanbul": { "Konstantinoupolis": "alternate", "Constantinople": "alternate" },
  "EG:Cairo": { "القاهرة": "alternate", "Al-Qahirah": "alternate" },
  "ZA:Johannesburg": { "Joburg": "common", "Jozi": "common", "Egoli": "alternate" },
  "NG:Lagos": { "Eko": "alternate" },
  "KE:Nairobi": { "Green City in the Sun": "common" },
  "AR:Buenos Aires": { "BA": "abbreviation", "Baires": "common" },
  "CL:Santiago": { "Stgo": "abbreviation" },
  "CO:Bogotá": { "Bogota": "common", "BAQ": "abbreviation" },
  "PE:Lima": { "LIM": "abbreviation" },
  "TH:Bangkok": { "Krung Thep": "common", "BKK": "abbreviation" },
  "VN:Hanoi": { "HAN": "abbreviation" },
  "ID:Jakarta": { "JKT": "abbreviation", "Batavia": "alternate" },
  "PH:Manila": { "MNL": "abbreviation" },
  "MY:Kuala Lumpur": { "KL": "abbreviation" },
  "SG:Singapore": { "SG": "abbreviation", "Singapura": "alternate" },
  "AE:Dubai": { "DXB": "abbreviation" },
  "IL:Tel Aviv": { "TLV": "abbreviation" },
  "KR:Seoul": { "서울": "common", "Hanyang": "alternate" },
  "TW:Taipei": { "TPE": "abbreviation" },
  "HK:Hong Kong": { "HK": "abbreviation" },
  "PT:Lisbon": { "Lisboa": "common" },
  "NL:Amsterdam": { "AMS": "abbreviation", "Dam": "common" },
  "BE:Brussels": { "Brussel": "alternate", "Bruxelles": "alternate" },
  "SE:Stockholm": { "STO": "abbreviation" },
  "NO:Oslo": { "Christiania": "alternate" },
  "DK:Copenhagen": { "København": "common", "CPH": "abbreviation" },
  "FI:Helsinki": { "Helsingfors": "alternate" },
  "PL:Warsaw": { "Warszawa": "common", "WAW": "abbreviation" },
  "CZ:Prague": { "Praha": "common", "PRG": "abbreviation" },
  "HU:Budapest": { "BUD": "abbreviation" },
};

export const COUNTRY_ALIASES: Record<string, Record<string, string>> = {
  US: {
    "USA": "short",
    "America": "short",
    "United States of America": "official",
    "US of A": "short",
    "the States": "common",
    "Estados Unidos": "translation",
    "Vereinigte Staaten": "translation",
    "États-Unis": "translation",
  },
  GB: {
    "UK": "short",
    "Great Britain": "short",
    "United Kingdom": "official",
    "Britain": "short",
    "England": "common",
    "Reino Unido": "translation",
    "Vereinigtes Königreich": "translation",
    "Royaume-Uni": "translation",
  },
  CA: {
    "Canada": "official",
    "Can": "short",
  },
  AU: {
    "Australia": "official",
    "Aussie": "common",
    "Oz": "common",
    "Down Under": "common",
  },
  NZ: {
    "New Zealand": "official",
    "NZ": "short",
    "Kiwi": "common",
    "Aotearoa": "alternate",
  },
  DE: {
    "Germany": "official",
    "Deutschland": "common",
    "Allemagne": "translation",
    "Alemania": "translation",
  },
  FR: {
    "France": "official",
    "Frankreich": "translation",
    "Francia": "translation",
  },
  IT: {
    "Italy": "official",
    "Italia": "common",
    "Italie": "translation",
  },
  ES: {
    "Spain": "official",
    "España": "common",
    "Espagne": "translation",
  },
  PT: {
    "Portugal": "official",
  },
  NL: {
    "Netherlands": "official",
    "Holland": "common",
    "The Netherlands": "common",
  },
  BE: {
    "Belgium": "official",
    "Belgique": "translation",
    "België": "translation",
  },
  CH: {
    "Switzerland": "official",
    "Schweiz": "common",
    "Suisse": "translation",
    "Svizzera": "translation",
  },
  AT: {
    "Austria": "official",
    "Österreich": "common",
  },
  SE: {
    "Sweden": "official",
    "Sverige": "common",
  },
  NO: {
    "Norway": "official",
    "Norge": "common",
    "Noreg": "alternate",
  },
  DK: {
    "Denmark": "official",
    "Danmark": "common",
  },
  FI: {
    "Finland": "official",
    "Suomi": "common",
  },
  IS: {
    "Iceland": "official",
    "Ísland": "common",
  },
  IE: {
    "Ireland": "official",
    "Éire": "common",
    "Republic of Ireland": "official",
  },
  PL: {
    "Poland": "official",
    "Polska": "common",
  },
  CZ: {
    "Czechia": "short",
    "Czech Republic": "official",
    "Česko": "common",
  },
  SK: {
    "Slovakia": "official",
    "Slovensko": "common",
  },
  HU: {
    "Hungary": "official",
    "Magyarország": "common",
  },
  RO: {
    "Romania": "official",
  },
  BG: {
    "Bulgaria": "official",
  },
  GR: {
    "Greece": "official",
    "Hellas": "alternate",
    "Ellada": "alternate",
  },
  TR: {
    "Turkey": "official",
    "Türkiye": "official",
    "Turquie": "translation",
  },
  RU: {
    "Russia": "official",
    "Россия": "common",
  },
  UA: {
    "Ukraine": "official",
    "Україна": "common",
  },
  CN: {
    "China": "official",
    "PRC": "abbreviation",
    "People's Republic of China": "official",
    "中国": "common",
    "Zhongguo": "common",
  },
  JP: {
    "Japan": "official",
    "日本": "common",
    "Nippon": "common",
    "Nihon": "common",
  },
  KR: {
    "South Korea": "common",
    "Korea": "common",
    "Republic of Korea": "official",
    "한국": "common",
  },
  KP: {
    "North Korea": "common",
    "DPRK": "abbreviation",
  },
  TW: {
    "Taiwan": "official",
    "Republic of China": "official",
    "ROC": "abbreviation",
  },
  IN: {
    "India": "official",
    "Bharat": "common",
    "Hindustan": "alternate",
  },
  PK: {
    "Pakistan": "official",
  },
  BD: {
    "Bangladesh": "official",
  },
  LK: {
    "Sri Lanka": "official",
    "Ceylon": "alternate",
  },
  NP: {
    "Nepal": "official",
  },
  TH: {
    "Thailand": "official",
    "Siam": "alternate",
    "Prathet Thai": "common",
  },
  VN: {
    "Vietnam": "official",
    "Viet Nam": "official",
  },
  ID: {
    "Indonesia": "official",
  },
  PH: {
    "Philippines": "official",
    "PH": "abbreviation",
  },
  MY: {
    "Malaysia": "official",
  },
  SG: {
    "Singapore": "official",
    "SG": "abbreviation",
    "Singapura": "alternate",
  },
  EG: {
    "Egypt": "official",
    "Misr": "common",
  },
  ZA: {
    "South Africa": "official",
    "SA": "abbreviation",
    "RSA": "abbreviation",
  },
  NG: {
    "Nigeria": "official",
  },
  KE: {
    "Kenya": "official",
  },
  ET: {
    "Ethiopia": "official",
  },
  AR: {
    "Argentina": "official",
  },
  BR: {
    "Brazil": "official",
    "Brasil": "common",
  },
  CL: {
    "Chile": "official",
  },
  CO: {
    "Colombia": "official",
  },
  PE: {
    "Peru": "official",
  },
  MX: {
    "Mexico": "official",
    "Estados Unidos Mexicanos": "official",
  },
  IL: {
    "Israel": "official",
  },
  SA: {
    "Saudi Arabia": "official",
    "KSA": "abbreviation",
    "المملكة العربية السعودية": "official",
  },
  AE: {
    "UAE": "abbreviation",
    "United Arab Emirates": "official",
    "Emirates": "common",
  },
};

export const STATE_ALIASES: Record<string, Record<string, string>> = {
  // US states
  "US:AL": { "Alabama": "common", "AL": "abbreviation" },
  "US:AK": { "Alaska": "common", "AK": "abbreviation" },
  "US:AZ": { "Arizona": "common", "AZ": "abbreviation" },
  "US:AR": { "Arkansas": "common", "AR": "abbreviation" },
  "US:CA": { "California": "common", "CA": "abbreviation", "Calif": "abbreviation" },
  "US:CO": { "Colorado": "common", "CO": "abbreviation" },
  "US:CT": { "Connecticut": "common", "CT": "abbreviation" },
  "US:DE": { "Delaware": "common", "DE": "abbreviation" },
  "US:FL": { "Florida": "common", "FL": "abbreviation" },
  "US:GA": { "Georgia": "common", "GA": "abbreviation" },
  "US:HI": { "Hawaii": "common", "HI": "abbreviation" },
  "US:ID": { "Idaho": "common", "ID": "abbreviation" },
  "US:IL": { "Illinois": "common", "IL": "abbreviation" },
  "US:IN": { "Indiana": "common", "IN": "abbreviation" },
  "US:IA": { "Iowa": "common", "IA": "abbreviation" },
  "US:KS": { "Kansas": "common", "KS": "abbreviation" },
  "US:KY": { "Kentucky": "common", "KY": "abbreviation" },
  "US:LA": { "Louisiana": "common", "LA": "abbreviation" },
  "US:ME": { "Maine": "common", "ME": "abbreviation" },
  "US:MD": { "Maryland": "common", "MD": "abbreviation" },
  "US:MA": { "Massachusetts": "common", "MA": "abbreviation" },
  "US:MI": { "Michigan": "common", "MI": "abbreviation" },
  "US:MN": { "Minnesota": "common", "MN": "abbreviation" },
  "US:MS": { "Mississippi": "common", "MS": "abbreviation" },
  "US:MO": { "Missouri": "common", "MO": "abbreviation" },
  "US:MT": { "Montana": "common", "MT": "abbreviation" },
  "US:NE": { "Nebraska": "common", "NE": "abbreviation" },
  "US:NV": { "Nevada": "common", "NV": "abbreviation" },
  "US:NH": { "New Hampshire": "common", "NH": "abbreviation" },
  "US:NJ": { "New Jersey": "common", "NJ": "abbreviation" },
  "US:NM": { "New Mexico": "common", "NM": "abbreviation" },
  "US:NY": { "New York": "common", "NY": "abbreviation", "Empire State": "common" },
  "US:NC": { "North Carolina": "common", "NC": "abbreviation" },
  "US:ND": { "North Dakota": "common", "ND": "abbreviation" },
  "US:OH": { "Ohio": "common", "OH": "abbreviation" },
  "US:OK": { "Oklahoma": "common", "OK": "abbreviation" },
  "US:OR": { "Oregon": "common", "OR": "abbreviation" },
  "US:PA": { "Pennsylvania": "common", "PA": "abbreviation" },
  "US:RI": { "Rhode Island": "common", "RI": "abbreviation" },
  "US:SC": { "South Carolina": "common", "SC": "abbreviation" },
  "US:SD": { "South Dakota": "common", "SD": "abbreviation" },
  "US:TN": { "Tennessee": "common", "TN": "abbreviation" },
  "US:TX": { "Texas": "common", "TX": "abbreviation", "Lone Star State": "common" },
  "US:UT": { "Utah": "common", "UT": "abbreviation" },
  "US:VT": { "Vermont": "common", "VT": "abbreviation" },
  "US:VA": { "Virginia": "common", "VA": "abbreviation" },
  "US:WA": { "Washington": "common", "WA": "abbreviation" },
  "US:WV": { "West Virginia": "common", "WV": "abbreviation" },
  "US:WI": { "Wisconsin": "common", "WI": "abbreviation" },
  "US:WY": { "Wyoming": "common", "WY": "abbreviation" },
  "US:DC": { "District of Columbia": "common", "Washington DC": "common", "D.C.": "common" },

  // Canada provinces
  "CA:ON": { "Ontario": "common", "ON": "abbreviation" },
  "CA:QC": { "Quebec": "common", "Québec": "common", "QC": "abbreviation" },
  "CA:BC": { "British Columbia": "common", "BC": "abbreviation" },
  "CA:AB": { "Alberta": "common", "AB": "abbreviation" },
  "CA:MB": { "Manitoba": "common", "MB": "abbreviation" },
  "CA:SK": { "Saskatchewan": "common", "SK": "abbreviation" },
  "CA:NS": { "Nova Scotia": "common", "NS": "abbreviation" },
  "CA:NB": { "New Brunswick": "common", "NB": "abbreviation" },
  "CA:NL": { "Newfoundland and Labrador": "common", "NL": "abbreviation", "Newfoundland": "common" },
  "CA:PE": { "Prince Edward Island": "common", "PEI": "abbreviation" },

  // UK countries
  "GB:ENG": { "England": "common" },
  "GB:SCT": { "Scotland": "common" },
  "GB:WLS": { "Wales": "common", "Cymru": "common" },
  "GB:NIR": { "Northern Ireland": "common" },

  // Australian states
  "AU:NSW": { "New South Wales": "common" },
  "AU:VIC": { "Victoria": "common" },
  "AU:QLD": { "Queensland": "common" },
  "AU:WA": { "Western Australia": "common" },
  "AU:SA": { "South Australia": "common" },
  "AU:TAS": { "Tasmania": "common" },
  "AU:ACT": { "Australian Capital Territory": "common" },
  "AU:NT": { "Northern Territory": "common" },

  // Indian states
  "IN:KA": { "Karnataka": "common" },
  "IN:MH": { "Maharashtra": "common" },
  "IN:DL": { "Delhi": "common" },
  "IN:TN": { "Tamil Nadu": "common" },
  "IN:TS": { "Telangana": "common" },
  "IN:WB": { "West Bengal": "common" },
  "IN:UP": { "Uttar Pradesh": "common" },
  "IN:GJ": { "Gujarat": "common" },
  "IN:RJ": { "Rajasthan": "common" },

  // Brazilian states
  "BR:SP": { "São Paulo": "common", "Sao Paulo": "common" },
  "BR:RJ": { "Rio de Janeiro": "common" },
  "BR:MG": { "Minas Gerais": "common" },
  "BR:BA": { "Bahia": "common" },
};
