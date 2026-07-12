// src/lib/languages/popularLanguages.ts
// 50 most-spoken languages worldwide with native script, English name,
// ISO 639-1 code, regional grouping, and flag emoji for the dropdown UI.
// Used by DateToWord for the "Notify me when translated" capture form
// and for the locale selector.

export interface PopularLanguage {
  /** ISO 639-1 code, e.g. "en", "fr" */
  code: string;
  /** ISO 3166-1 region for the locale, e.g. "US", "GB" — combined as "en-US" */
  region: string;
  /** Endonym (language name in its own script), e.g. "Deutsch" */
  endonym: string;
  /** English name, e.g. "German" */
  englishName: string;
  /** Country flag emoji, e.g. "🇩🇪" */
  flag: string;
  /** Major regional grouping */
  region_group: "Europe" | "Asia" | "Americas" | "Africa" | "Oceania" | "Middle East";
  /** Approximate number of native speakers (millions) */
  nativeSpeakersMillions: number;
}

export const POPULAR_LANGUAGES: PopularLanguage[] = [
  // English (multi-region)
  { code: "en", region: "US", endonym: "English", englishName: "English (US)",     flag: "🇺🇸", region_group: "Americas", nativeSpeakersMillions: 380 },
  { code: "en", region: "GB", endonym: "English", englishName: "English (UK)",     flag: "🇬🇧", region_group: "Europe",   nativeSpeakersMillions: 380 },
  { code: "en", region: "AU", endonym: "English", englishName: "English (AU)",     flag: "🇦🇺", region_group: "Oceania",  nativeSpeakersMillions: 380 },
  { code: "en", region: "CA", endonym: "English", englishName: "English (CA)",     flag: "🇨🇦", region_group: "Americas", nativeSpeakersMillions: 380 },
  { code: "en", region: "IN", endonym: "English", englishName: "English (IN)",     flag: "🇮🇳", region_group: "Asia",     nativeSpeakersMillions: 380 },

  // Spanish
  { code: "es", region: "ES", endonym: "Español",       englishName: "Spanish (Spain)",       flag: "🇪🇸", region_group: "Europe",   nativeSpeakersMillions: 480 },
  { code: "es", region: "MX", endonym: "Español",       englishName: "Spanish (Mexico)",      flag: "🇲🇽", region_group: "Americas", nativeSpeakersMillions: 480 },
  { code: "es", region: "AR", endonym: "Español",       englishName: "Spanish (Argentina)",   flag: "🇦🇷", region_group: "Americas", nativeSpeakersMillions: 480 },
  { code: "es", region: "CO", endonym: "Español",       englishName: "Spanish (Colombia)",    flag: "🇨🇴", region_group: "Americas", nativeSpeakersMillions: 480 },

  // French
  { code: "fr", region: "FR", endonym: "Français",      englishName: "French (France)",       flag: "🇫🇷", region_group: "Europe",   nativeSpeakersMillions: 280 },
  { code: "fr", region: "CA", endonym: "Français",      englishName: "French (Canada)",       flag: "🇨🇦", region_group: "Americas", nativeSpeakersMillions: 280 },
  { code: "fr", region: "BE", endonym: "Français",      englishName: "French (Belgium)",      flag: "🇧🇪", region_group: "Europe",   nativeSpeakersMillions: 280 },
  { code: "fr", region: "CH", endonym: "Français",      englishName: "French (Switzerland)",  flag: "🇨🇭", region_group: "Europe",   nativeSpeakersMillions: 280 },

  // German
  { code: "de", region: "DE", endonym: "Deutsch",       englishName: "German (Germany)",      flag: "🇩🇪", region_group: "Europe",   nativeSpeakersMillions: 130 },
  { code: "de", region: "AT", endonym: "Deutsch",       englishName: "German (Austria)",      flag: "🇦🇹", region_group: "Europe",   nativeSpeakersMillions: 130 },
  { code: "de", region: "CH", endonym: "Deutsch",       englishName: "German (Switzerland)",  flag: "🇨🇭", region_group: "Europe",   nativeSpeakersMillions: 130 },

  // Portuguese
  { code: "pt", region: "BR", endonym: "Português",     englishName: "Portuguese (Brazil)",       flag: "🇧🇷", region_group: "Americas", nativeSpeakersMillions: 260 },
  { code: "pt", region: "PT", endonym: "Português",     englishName: "Portuguese (Portugal)",      flag: "🇵🇹", region_group: "Europe",   nativeSpeakersMillions: 260 },

  // East Asian
  { code: "zh", region: "CN", endonym: "简体中文",          englishName: "Chinese (Simplified)",  flag: "🇨🇳", region_group: "Asia",     nativeSpeakersMillions: 920 },
  { code: "zh", region: "TW", endonym: "繁體中文",          englishName: "Chinese (Traditional)", flag: "🇹🇼", region_group: "Asia",     nativeSpeakersMillions: 920 },
  { code: "zh", region: "HK", endonym: "粵語",            englishName: "Cantonese",             flag: "🇭🇰", region_group: "Asia",     nativeSpeakersMillions: 85  },
  { code: "ja", region: "JP", endonym: "日本語",           englishName: "Japanese",              flag: "🇯🇵", region_group: "Asia",     nativeSpeakersMillions: 125 },
  { code: "ko", region: "KR", endonym: "한국어",            englishName: "Korean",                flag: "🇰🇷", region_group: "Asia",     nativeSpeakersMillions: 77  },

  // South + Southeast Asian
  { code: "hi", region: "IN", endonym: "हिन्दी",            englishName: "Hindi",                 flag: "🇮🇳", region_group: "Asia",     nativeSpeakersMillions: 345 },
  { code: "bn", region: "BD", endonym: "বাংলা",            englishName: "Bengali",               flag: "🇧🇩", region_group: "Asia",     nativeSpeakersMillions: 230 },
  { code: "ta", region: "IN", endonym: "தமிழ்",            englishName: "Tamil",                 flag: "🇮🇳", region_group: "Asia",     nativeSpeakersMillions: 78  },
  { code: "te", region: "IN", endonym: "తెలుగు",           englishName: "Telugu",                flag: "🇮🇳", region_group: "Asia",     nativeSpeakersMillions: 95  },
  { code: "mr", region: "IN", endonym: "मराठी",            englishName: "Marathi",               flag: "🇮🇳", region_group: "Asia",     nativeSpeakersMillions: 83  },
  { code: "ur", region: "PK", endonym: "اردو",            englishName: "Urdu",                  flag: "🇵🇰", region_group: "Asia",     nativeSpeakersMillions: 70  },
  { code: "th", region: "TH", endonym: "ไทย",             englishName: "Thai",                  flag: "🇹🇭", region_group: "Asia",     nativeSpeakersMillions: 70  },
  { code: "vi", region: "VN", endonym: "Tiếng Việt",      englishName: "Vietnamese",            flag: "🇻🇳", region_group: "Asia",     nativeSpeakersMillions: 85  },
  { code: "id", region: "ID", endonym: "Bahasa Indonesia", englishName: "Indonesian",          flag: "🇮🇩", region_group: "Asia",     nativeSpeakersMillions: 200 },
  { code: "ms", region: "MY", endonym: "Bahasa Melayu",  englishName: "Malay",                 flag: "🇲🇾", region_group: "Asia",     nativeSpeakersMillions: 80  },
  { code: "fil", region: "PH", endonym: "Filipino",     englishName: "Filipino",              flag: "🇵🇭", region_group: "Asia",     nativeSpeakersMillions: 50  },

  // Middle East + North Africa
  { code: "ar", region: "SA", endonym: "العربية",          englishName: "Arabic",                flag: "🇸🇦", region_group: "Middle East", nativeSpeakersMillions: 360 },
  { code: "ar", region: "EG", endonym: "العربية",          englishName: "Arabic (Egypt)",        flag: "🇪🇬", region_group: "Middle East", nativeSpeakersMillions: 360 },
  { code: "he", region: "IL", endonym: "עברית",           englishName: "Hebrew",                flag: "🇮🇱", region_group: "Middle East", nativeSpeakersMillions: 9   },
  { code: "fa", region: "IR", endonym: "فارسی",           englishName: "Persian",               flag: "🇮🇷", region_group: "Middle East", nativeSpeakersMillions: 70  },
  { code: "tr", region: "TR", endonym: "Türkçe",         englishName: "Turkish",               flag: "🇹🇷", region_group: "Middle East", nativeSpeakersMillions: 88  },

  // European (non-Romance, non-Germanic)
  { code: "ru", region: "RU", endonym: "Русский",        englishName: "Russian",               flag: "🇷🇺", region_group: "Europe",   nativeSpeakersMillions: 150 },
  { code: "uk", region: "UA", endonym: "Українська",     englishName: "Ukrainian",             flag: "🇺🇦", region_group: "Europe",   nativeSpeakersMillions: 40  },
  { code: "pl", region: "PL", endonym: "Polski",         englishName: "Polish",                flag: "🇵🇱", region_group: "Europe",   nativeSpeakersMillions: 45  },
  { code: "nl", region: "NL", endonym: "Nederlands",     englishName: "Dutch",                 flag: "🇳🇱", region_group: "Europe",   nativeSpeakersMillions: 25  },
  { code: "sv", region: "SE", endonym: "Svenska",        englishName: "Swedish",               flag: "🇸🇪", region_group: "Europe",   nativeSpeakersMillions: 13  },
  { code: "da", region: "DK", endonym: "Dansk",          englishName: "Danish",                flag: "🇩🇰", region_group: "Europe",   nativeSpeakersMillions: 6   },
  { code: "no", region: "NO", endonym: "Norsk",          englishName: "Norwegian",             flag: "🇳🇴", region_group: "Europe",   nativeSpeakersMillions: 5   },
  { code: "fi", region: "FI", endonym: "Suomi",          englishName: "Finnish",               flag: "🇫🇮", region_group: "Europe",   nativeSpeakersMillions: 5   },
  { code: "el", region: "GR", endonym: "Ελληνικά",       englishName: "Greek",                 flag: "🇬🇷", region_group: "Europe",   nativeSpeakersMillions: 13  },
  { code: "cs", region: "CZ", endonym: "Čeština",        englishName: "Czech",                 flag: "🇨🇿", region_group: "Europe",   nativeSpeakersMillions: 10  },
  { code: "ro", region: "RO", endonym: "Română",         englishName: "Romanian",              flag: "🇷🇴", region_group: "Europe",   nativeSpeakersMillions: 24  },
  { code: "hu", region: "HU", endonym: "Magyar",         englishName: "Hungarian",             flag: "🇭🇺", region_group: "Europe",   nativeSpeakersMillions: 13  },
  { code: "it", region: "IT", endonym: "Italiano",       englishName: "Italian",               flag: "🇮🇹", region_group: "Europe",   nativeSpeakersMillions: 65  },

  // African
  { code: "sw", region: "KE", endonym: "Kiswahili",      englishName: "Swahili",               flag: "🇰🇪", region_group: "Africa",   nativeSpeakersMillions: 100 },
  { code: "am", region: "ET", endonym: "አማርኛ",          englishName: "Amharic",               flag: "🇪🇹", region_group: "Africa",   nativeSpeakersMillions: 32  },
  { code: "af", region: "ZA", endonym: "Afrikaans",      englishName: "Afrikaans",             flag: "🇿🇦", region_group: "Africa",   nativeSpeakersMillions: 7   },
];

/** Build the full locale tag (e.g. "en-US", "fr-CA") */
export function getLocaleTag(language: PopularLanguage): string {
  return `${language.code}-${language.region}`;
}

/** Find a language by locale tag, e.g. "fr-FR" */
export function findLanguageByLocale(localeTag: string): PopularLanguage | undefined {
  const [code, region] = localeTag.split("-");
  return POPULAR_LANGUAGES.find(
    (lang) => lang.code === code && lang.region === region
  );
}

/** Pretty label for the dropdown: "🇫🇷 Français (France)" */
export function formatLanguageLabel(language: PopularLanguage): string {
  return `${language.flag} ${language.endonym} (${language.englishName.replace(/^[^(]+\(/, "").replace(/\)$/, "")})`;
}

/** Display label: "Français · France" (for short lists) */
export function formatLanguageShort(language: PopularLanguage): string {
  return `${language.flag} ${language.endonym}`;
}

/** Check if a locale tag is English — used to decide whether to redirect to the suggestion page */
export function isEnglishLocale(localeTag: string): boolean {
  return localeTag.toLowerCase().startsWith("en-");
}
