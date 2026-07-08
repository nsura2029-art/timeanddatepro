export type CountryCode = "US" | "IN" | "DE" | "JP" | "AE" | "GB" | "FR" | "CN" | "OTHER";

export interface CountryPreferences {
  country: CountryCode;
  countryName: string;
  language: string;
  locale: string;
  timezone: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "DD.MM.YYYY" | "YYYY/MM/DD";
  timeFormat: "12h" | "24h";
  firstDayOfWeek: "sunday" | "monday";
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
  favoriteCities: string[]; // Timezone IDs
  theme?: "slate" | "cyber" | "emerald" | "amber" | "ocean";
}

export interface Holiday {
  name: string;
  date: string; // YYYY-MM-DD
  type: "federal" | "public" | "bank" | "observance";
}

export interface CityInfo {
  name: string;
  country: string;
  timezone: string;
  code: string;
}

export interface AIQueryResult {
  intent: string;
  answer: string;
  suggestedAction: string;
  detectedParameters?: {
    sourceTime?: string;
    sourceDate?: string;
    sourceTimezone?: string;
    targetTimezone?: string;
    meetingAttendees?: string[];
    targetCountry?: string;
    queryDate?: string;
    targetDate?: string;
  };
}
