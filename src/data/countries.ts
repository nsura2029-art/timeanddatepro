import { CountryCode, CountryPreferences, Holiday, CityInfo } from "../types";

export const DEFAULT_PREFERENCES: Record<CountryCode, CountryPreferences> = {
  US: {
    country: "US",
    countryName: "United States",
    language: "English",
    locale: "en-US",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    firstDayOfWeek: "sunday",
    workingHoursStart: 9,
    workingHoursEnd: 17,
    favoriteCities: ["Europe/London", "Asia/Kolkata", "Asia/Singapore", "America/Los_Angeles", "Asia/Tokyo"],
    theme: "slate",
  },
  IN: {
    country: "IN",
    countryName: "India",
    language: "Hindi / English",
    locale: "en-IN",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    firstDayOfWeek: "monday",
    workingHoursStart: 10,
    workingHoursEnd: 18,
    favoriteCities: ["America/New_York", "Europe/London", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"],
    theme: "slate",
  },
  DE: {
    country: "DE",
    countryName: "Germany",
    language: "Deutsch",
    locale: "de-DE",
    timezone: "Europe/Berlin",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "24h",
    firstDayOfWeek: "monday",
    workingHoursStart: 8,
    workingHoursEnd: 17,
    favoriteCities: ["Europe/London", "America/New_York", "Europe/Paris", "Asia/Kolkata", "Asia/Singapore"],
    theme: "slate",
  },
  JP: {
    country: "JP",
    countryName: "Japan",
    language: "日本語",
    locale: "ja-JP",
    timezone: "Asia/Tokyo",
    dateFormat: "YYYY/MM/DD",
    timeFormat: "24h",
    firstDayOfWeek: "sunday",
    workingHoursStart: 9,
    workingHoursEnd: 18,
    favoriteCities: ["America/New_York", "Asia/Singapore", "Australia/Sydney", "Europe/London", "Asia/Kolkata"],
    theme: "slate",
  },
  AE: {
    country: "AE",
    countryName: "United Arab Emirates",
    language: "العربية / English",
    locale: "en-AE",
    timezone: "Asia/Dubai",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    firstDayOfWeek: "monday",
    workingHoursStart: 8,
    workingHoursEnd: 16,
    favoriteCities: ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Riyadh", "Asia/Singapore"],
    theme: "slate",
  },
  GB: {
    country: "GB",
    countryName: "United Kingdom",
    language: "English",
    locale: "en-GB",
    timezone: "Europe/London",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    firstDayOfWeek: "monday",
    workingHoursStart: 9,
    workingHoursEnd: 17,
    favoriteCities: ["America/New_York", "Asia/Kolkata", "Asia/Singapore", "Asia/Dubai", "Australia/Sydney"],
    theme: "slate",
  },
  FR: {
    country: "FR",
    countryName: "France",
    language: "Français",
    locale: "fr-FR",
    timezone: "Europe/Paris",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    firstDayOfWeek: "monday",
    workingHoursStart: 9,
    workingHoursEnd: 18,
    favoriteCities: ["Europe/London", "America/New_York", "Asia/Tokyo", "Asia/Singapore", "Europe/Berlin"],
    theme: "ocean",
  },
  CN: {
    country: "CN",
    countryName: "China",
    language: "简体中文",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    dateFormat: "YYYY/MM/DD",
    timeFormat: "24h",
    firstDayOfWeek: "monday",
    workingHoursStart: 9,
    workingHoursEnd: 18,
    favoriteCities: ["Asia/Tokyo", "Asia/Singapore", "America/New_York", "Europe/London", "Australia/Sydney"],
    theme: "amber",
  },
  OTHER: {
    country: "OTHER",
    countryName: "Global Workspace",
    language: "English",
    locale: "en-US",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "24h",
    firstDayOfWeek: "monday",
    workingHoursStart: 9,
    workingHoursEnd: 17,
    favoriteCities: ["America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo", "Asia/Singapore"],
    theme: "slate",
  },
};

export const COUNTRY_HOLIDAYS: Record<CountryCode, Holiday[]> = {
  US: [
    { name: "New Year's Day", date: "2026-01-01", type: "federal" },
    { name: "Martin Luther King Jr. Day", date: "2026-01-19", type: "federal" },
    { name: "Washington's Birthday", date: "2026-02-16", type: "federal" },
    { name: "Memorial Day", date: "2026-05-25", type: "federal" },
    { name: "Juneteenth National Independence Day", date: "2026-06-19", type: "federal" },
    { name: "Independence Day", date: "2026-07-04", type: "federal" },
    { name: "Labor Day", date: "2026-09-07", type: "federal" },
    { name: "Columbus Day", date: "2026-10-12", type: "federal" },
    { name: "Veterans Day", date: "2026-11-11", type: "federal" },
    { name: "Thanksgiving Day", date: "2026-11-26", type: "federal" },
    { name: "Christmas Day", date: "2026-12-25", type: "federal" },
  ],
  IN: [
    { name: "Republic Day", date: "2026-01-26", type: "public" },
    { name: "Holi", date: "2026-03-04", type: "public" },
    { name: "Good Friday", date: "2026-04-03", type: "public" },
    { name: "Eid al-Fitr", date: "2026-03-20", type: "public" },
    { name: "Mahavir Jayanti", date: "2026-04-12", type: "public" },
    { name: "Independence Day", date: "2026-08-15", type: "public" },
    { name: "Id-ul-Zuha (Bakrid)", date: "2026-05-27", type: "public" },
    { name: "Gandhi Jayanti", date: "2026-10-02", type: "public" },
    { name: "Dussehra", date: "2026-10-20", type: "public" },
    { name: "Diwali (Deepavali)", date: "2026-11-08", type: "public" },
    { name: "Guru Nanak's Birthday", date: "2026-11-24", type: "public" },
    { name: "Christmas Day", date: "2026-12-25", type: "public" },
  ],
  DE: [
    { name: "Neujahr (New Year)", date: "2026-01-01", type: "public" },
    { name: "Karfreitag (Good Friday)", date: "2026-04-03", type: "public" },
    { name: "Ostermontag (Easter Monday)", date: "2026-04-06", type: "public" },
    { name: "Tag der Arbeit (Labor Day)", date: "2026-05-01", type: "public" },
    { name: "Christi Himmelfahrt (Ascension Day)", date: "2026-05-14", type: "public" },
    { name: "Pfingstmontag (Whit Monday)", date: "2026-05-25", type: "public" },
    { name: "Tag der Deutschen Einheit (German Unity Day)", date: "2026-10-03", type: "public" },
    { name: "1. Weihnachtstag (Christmas Day)", date: "2026-12-25", type: "public" },
    { name: "2. Weihnachtstag (Boxing Day)", date: "2026-12-26", type: "public" },
  ],
  JP: [
    { name: "New Year's Day (Gantan)", date: "2026-01-01", type: "public" },
    { name: "Coming of Age Day (Seijin no Hi)", date: "2026-01-12", type: "public" },
    { name: "National Foundation Day (Kenkoku Kinen no Hi)", date: "2026-02-11", type: "public" },
    { name: "Emperor's Birthday (Tenno Tanjobi)", date: "2026-02-23", type: "public" },
    { name: "Vernal Equinox Day (Shunbun no Hi)", date: "2026-03-20", type: "public" },
    { name: "Showa Day (Showa no Hi)", date: "2026-04-29", type: "public" },
    { name: "Constitution Memorial Day (Kenpo Kinenbi)", date: "2026-05-03", type: "public" },
    { name: "Greenery Day (Midori no Hi)", date: "2026-05-04", type: "public" },
    { name: "Children's Day (Kodomo no Hi)", date: "2026-05-05", type: "public" },
    { name: "Marine Day (Umi no Hi)", date: "2026-07-20", type: "public" },
    { name: "Mountain Day (Yama no Hi)", date: "2026-08-11", type: "public" },
    { name: "Respect for the Aged Day (Keiro no Hi)", date: "2026-09-21", type: "public" },
    { name: "Health and Sports Day (Taiiku no Hi)", date: "2026-10-12", type: "public" },
    { name: "Culture Day (Bunka no Hi)", date: "2026-11-03", type: "public" },
    { name: "Labor Thanksgiving Day (Kinro Kansha no Hi)", date: "2026-11-23", type: "public" },
  ],
  AE: [
    { name: "New Year's Day", date: "2026-01-01", type: "public" },
    { name: "Eid al-Fitr (Holiday)", date: "2026-03-20", type: "public" },
    { name: "Arafat Day", date: "2026-05-27", type: "public" },
    { name: "Eid al-Adha", date: "2026-05-28", type: "public" },
    { name: "Islamic New Year", date: "2026-06-17", type: "public" },
    { name: "Prophet Muhammad's Birthday", date: "2026-08-26", type: "public" },
    { name: "Commemoration Day", date: "2026-11-30", type: "public" },
    { name: "National Day", date: "2026-12-02", type: "public" },
  ],
  GB: [
    { name: "New Year's Day", date: "2026-01-01", type: "bank" },
    { name: "Good Friday", date: "2026-04-03", type: "bank" },
    { name: "Easter Monday", date: "2026-04-06", type: "bank" },
    { name: "Early May Bank Holiday", date: "2026-05-04", type: "bank" },
    { name: "Spring Bank Holiday", date: "2026-05-25", type: "bank" },
    { name: "Summer Bank Holiday", date: "2026-08-31", type: "bank" },
    { name: "Christmas Day", date: "2026-12-25", type: "bank" },
    { name: "Boxing Day", date: "2026-12-28", type: "bank" }, // Observed on Monday 28th
  ],
  FR: [
    { name: "Jour de l'An (New Year)", date: "2026-01-01", type: "public" },
    { name: "Lundi de Pâques (Easter Monday)", date: "2026-04-06", type: "public" },
    { name: "Fête du Travail (Labor Day)", date: "2026-05-01", type: "public" },
    { name: "Fête de la Victoire (WWII Victory)", date: "2026-05-08", type: "public" },
    { name: "Ascension (Ascension Day)", date: "2026-05-14", type: "public" },
    { name: "Lundi de Pentecôte (Whit Monday)", date: "2026-05-25", type: "public" },
    { name: "Fête Nationale (Bastille Day)", date: "2026-07-14", type: "public" },
    { name: "Assomption (Assumption)", date: "2026-08-15", type: "public" },
    { name: "Toussaint (All Saints' Day)", date: "2026-11-01", type: "public" },
    { name: "Armistice 1918 (Armistice Day)", date: "2026-11-11", type: "public" },
    { name: "Noël (Christmas Day)", date: "2026-12-25", type: "public" },
  ],
  CN: [
    { name: "New Year's Day", date: "2026-01-01", type: "public" },
    { name: "Chinese New Year (Spring Festival)", date: "2026-02-17", type: "public" },
    { name: "Tomb Sweeping Day (Qingming Festival)", date: "2026-04-05", type: "public" },
    { name: "Labor Day", date: "2026-05-01", type: "public" },
    { name: "Dragon Boat Festival", date: "2026-06-19", type: "public" },
    { name: "Mid-Autumn Festival", date: "2026-09-25", type: "public" },
    { name: "National Day", date: "2026-10-01", type: "public" },
  ],
  OTHER: [
    { name: "International New Year's Day", date: "2026-01-01", type: "public" },
    { name: "International Workers' Day", date: "2026-05-01", type: "public" },
    { name: "Christmas Day", date: "2026-12-25", type: "public" },
  ],
};

export const CITY_DATA: Record<string, CityInfo> = {
  "America/New_York":     { name: "New York",     country: "United States",        timezone: "America/New_York",    code: "NYC", region: "New York" },
  "America/Los_Angeles":  { name: "Los Angeles",  country: "United States",        timezone: "America/Los_Angeles", code: "LAX", region: "California" },
  "America/Chicago":      { name: "Chicago",      country: "United States",        timezone: "America/Chicago",     code: "CHI", region: "Illinois" },
  "America/Denver":       { name: "Denver",       country: "United States",        timezone: "America/Denver",      code: "DEN", region: "Colorado" },
  "America/Phoenix":      { name: "Phoenix",      country: "United States",        timezone: "America/Phoenix",     code: "PHX", region: "Arizona" },
  "America/Los_Angeles__WLC": { name: "Wesley Chapel", country: "United States",   timezone: "America/New_York",    code: "WLC", region: "Florida" },
  "Europe/London":        { name: "London",       country: "United Kingdom",       timezone: "Europe/London",       code: "LON", region: "England" },
  "Europe/Berlin":        { name: "Berlin",       country: "Germany",              timezone: "Europe/Berlin",       code: "BER", region: "Berlin" },
  "Europe/Paris":         { name: "Paris",        country: "France",               timezone: "Europe/Paris",        code: "PAR", region: "\u00cele-de-France" },
  "Europe/Madrid":        { name: "Madrid",       country: "Spain",                timezone: "Europe/Madrid",       code: "MAD", region: "Madrid" },
  "Europe/Rome":          { name: "Rome",         country: "Italy",                timezone: "Europe/Rome",         code: "ROM", region: "Lazio" },
  "Europe/Amsterdam":     { name: "Amsterdam",    country: "Netherlands",          timezone: "Europe/Amsterdam",    code: "AMS", region: "North Holland" },
  "Europe/Stockholm":     { name: "Stockholm",    country: "Sweden",               timezone: "Europe/Stockholm",    code: "ARN", region: "Stockholm" },
  "Europe/Moscow":        { name: "Moscow",       country: "Russia",               timezone: "Europe/Moscow",       code: "MOW", region: "Moscow" },
  "Europe/Istanbul":      { name: "Istanbul",     country: "Türkiye",              timezone: "Europe/Istanbul",     code: "IST", region: "Istanbul" },
  "Asia/Tokyo":           { name: "Tokyo",        country: "Japan",                timezone: "Asia/Tokyo",          code: "TYO", region: "Kantō" },
  "Asia/Shanghai":        { name: "Beijing",      country: "China",                timezone: "Asia/Shanghai",       code: "PEK", region: "Beijing" },
  "Asia/Hong_Kong":       { name: "Hong Kong",    country: "Hong Kong SAR",        timezone: "Asia/Hong_Kong",      code: "HKG", region: "Central & Western" },
  "Asia/Singapore":       { name: "Singapore",    country: "Singapore",            timezone: "Asia/Singapore",      code: "SIN", region: "Central" },
  "Asia/Kolkata":         { name: "New Delhi",    country: "India",                timezone: "Asia/Kolkata",        code: "DEL", region: "Delhi" },
  "Asia/Dubai":           { name: "Dubai",        country: "United Arab Emirates", timezone: "Asia/Dubai",          code: "DXB", region: "Dubai" },
  "Asia/Riyadh":          { name: "Riyadh",       country: "Saudi Arabia",         timezone: "Asia/Riyadh",         code: "RUH", region: "Riyadh Province" },
  "Asia/Seoul":           { name: "Seoul",        country: "South Korea",          timezone: "Asia/Seoul",          code: "ICN", region: "Seoul" },
  "Asia/Bangkok":         { name: "Bangkok",      country: "Thailand",             timezone: "Asia/Bangkok",        code: "BKK", region: "Bangkok" },
  "Australia/Sydney":     { name: "Sydney",       country: "Australia",            timezone: "Australia/Sydney",    code: "SYD", region: "New South Wales" },
  "Pacific/Auckland":     { name: "Auckland",     country: "New Zealand",          timezone: "Pacific/Auckland",    code: "AKL", region: "Auckland" },
  "America/Toronto":      { name: "Toronto",      country: "Canada",               timezone: "America/Toronto",     code: "YYZ", region: "Ontario" },
  "America/Vancouver":    { name: "Vancouver",    country: "Canada",               timezone: "America/Vancouver",   code: "YVR", region: "British Columbia" },
  "America/Sao_Paulo":    { name: "São Paulo",    country: "Brazil",               timezone: "America/Sao_Paulo",   code: "GRU", region: "São Paulo" },
  "America/Mexico_City":  { name: "Mexico City",  country: "Mexico",               timezone: "America/Mexico_City", code: "MEX", region: "CDMX" },
  "Africa/Johannesburg":  { name: "Johannesburg", country: "South Africa",         timezone: "Africa/Johannesburg", code: "JNB", region: "Gauteng" },
};

export const ALL_LOCATIONS_LIST = Object.values(CITY_DATA);

export function detectCountryFromTimezone(tz: string): CountryCode {
  if (!tz) return "OTHER";
  if (tz.includes("America/New_York") || tz.includes("America/Chicago") || tz.includes("America/Los_Angeles") || tz.includes("America/Denver") || tz.startsWith("US/")) {
    return "US";
  }
  if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("Asia/Kolkata")) {
    return "IN";
  }
  if (tz.includes("Berlin") || tz.includes("Europe/Berlin") || tz.includes("Germany")) {
    return "DE";
  }
  if (tz.includes("Tokyo") || tz.includes("Japan") || tz.includes("Asia/Tokyo")) {
    return "JP";
  }
  if (tz.includes("Dubai") || tz.includes("Asia/Dubai") || tz.includes("UAE")) {
    return "AE";
  }
  if (tz.includes("London") || tz.includes("Europe/London") || tz.includes("GB") || tz.includes("United Kingdom")) {
    return "GB";
  }
  if (tz.includes("Paris") || tz.includes("Europe/Paris") || tz.includes("France") || tz.startsWith("Europe/Paris")) {
    return "FR";
  }
  if (tz.includes("Shanghai") || tz.includes("Beijing") || tz.includes("Asia/Shanghai") || tz.includes("China")) {
    return "CN";
  }
  return "OTHER";
}

export function formatLocalDate(date: Date, format: string, locale: string, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(date);
  } catch (e) {
    return date.toLocaleDateString();
  }
}

export function formatLocalTime(date: Date, format: "12h" | "24h", timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: format === "12h"
    });
    return formatter.format(date);
  } catch (e) {
    return date.toLocaleTimeString();
  }
}

export function getTimezoneOffsetAndAbbr(timezone: string, date: Date = new Date()): { offsetStr: string; abbr: string } {
  try {
    // Get Offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    const offsetStr = offsetPart ? offsetPart.value : "GMT+0";

    // Get Abbreviation
    const shortFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const shortParts = shortFormatter.formatToParts(date);
    const abbrPart = shortParts.find(p => p.type === 'timeZoneName');
    const abbr = abbrPart ? abbrPart.value : "GMT";

    return {
      offsetStr: offsetStr.replace("GMT", "UTC"),
      abbr
    };
  } catch (e) {
    return { offsetStr: "UTC+00:00", abbr: "UTC" };
  }
}

// Sunrise/Sunset approximate calculator based on day of year & lat-long of cities
export function getSunriseSunset(timezone: string, date: Date = new Date()): { sunrise: string; sunset: string } {
  // Approximate sunrise/sunset based on typical values for major cities
  // New York: 6:00 AM / 8:00 PM (Summer)
  // New Delhi: 5:40 AM / 7:15 PM
  // Tokyo: 4:50 AM / 6:45 PM
  // Berlin: 5:10 AM / 9:15 PM
  // Dubai: 5:45 AM / 7:10 PM
  // London: 5:00 AM / 9:00 PM
  
  const hourOffset = date.getMonth() >= 3 && date.getMonth() <= 9 ? 1 : 0; // rough summer offset

  if (timezone.includes("New_York")) {
    return { sunrise: `${5 + hourOffset}:38 AM`, sunset: `${7 + hourOffset}:24 PM` };
  } else if (timezone.includes("Kolkata")) {
    return { sunrise: "05:15 AM", sunset: "06:45 PM" };
  } else if (timezone.includes("Berlin")) {
    return { sunrise: `${4 + hourOffset}:55 AM`, sunset: `${8 + hourOffset}:45 PM` };
  } else if (timezone.includes("Tokyo")) {
    return { sunrise: "04:35 AM", sunset: "07:02 PM" };
  } else if (timezone.includes("Dubai")) {
    return { sunrise: "05:32 AM", sunset: "07:12 PM" };
  } else if (timezone.includes("London")) {
    return { sunrise: `${4 + hourOffset}:48 AM`, sunset: `${8 + hourOffset}:18 PM` };
  } else if (timezone.includes("Paris")) {
    return { sunrise: `${4 + hourOffset}:52 AM`, sunset: `${8 + hourOffset}:35 PM` };
  } else if (timezone.includes("Shanghai") || timezone.includes("Beijing")) {
    return { sunrise: "04:55 AM", sunset: "07:10 PM" };
  } else if (timezone.includes("Sydney")) {
    // Southern hemisphere: July is winter, so sunrise is later, sunset earlier
    return { sunrise: "06:58 AM", sunset: "05:04 PM" };
  }
  
  return { sunrise: "06:12 AM", sunset: "06:48 PM" };
}

// Moon Phase Calculator (approximate)
export function getMoonPhase(date: Date = new Date()): { phaseName: string; phaseIcon: string } {
  // Cycle is 29.53 days
  // Known New Moon: Jan 11, 2026
  const refDate = new Date("2026-01-11T00:00:00Z");
  const diffMs = date.getTime() - refDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cycleDay = diffDays % 29.53;
  
  if (cycleDay < 1.84) return { phaseName: "New Moon", phaseIcon: "🌑" };
  if (cycleDay < 5.53) return { phaseName: "Waxing Crescent", phaseIcon: "🌒" };
  if (cycleDay < 9.22) return { phaseName: "First Quarter", phaseIcon: "🌓" };
  if (cycleDay < 12.91) return { phaseName: "Waxing Gibbous", phaseIcon: "🌔" };
  if (cycleDay < 16.60) return { phaseName: "Full Moon", phaseIcon: "🌕" };
  if (cycleDay < 20.29) return { phaseName: "Waning Gibbous", phaseIcon: "🌖" };
  if (cycleDay < 23.98) return { phaseName: "Last Quarter", phaseIcon: "🌗" };
  return { phaseName: "Waning Crescent", phaseIcon: "🌘" };
}
