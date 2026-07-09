// Tool sub-route configuration
export const TOOL_SLUGS = [
  "holidays",
  "working-hours",
  "unix",
  "iso8601",
  "date-math",
  "date-diff",
  "date-words",
  "time-zone-converter"
] as const;

export type ToolSlug = typeof TOOL_SLUGS[number];

export const TOOL_LABELS: Record<ToolSlug, Record<string, string>> = {
  "holidays": { en: "Holiday & Hours", fr: "Jours Feries & Heures", zh: "\u5047\u671f\u4e0e\u5de5\u4f5c\u65f6\u95f4", ja: "\u4f11\u65e5\u3068\u52e4\u52d9" },
  "working-hours": { en: "Working Hours", fr: "Heures de Travail", zh: "\u5de5\u4f5c\u65f6\u95f4", ja: "\u52e4\u52d9\u6642\u9593" },
  "unix": { en: "Unix Timestamp", fr: "Horodatage Unix", zh: "Unix \u65f6\u95f4\u6233", ja: "Unix \u30bf\u30a4\u30e0\u30b9\u30bf\u30f3\u30d7" },
  "iso8601": { en: "ISO 8601 Formatter", fr: "Format ISO 8601", zh: "ISO 8601 \u683c\u5f0f", ja: "ISO 8601 \u30d5\u30a9\u30fc\u30de\u30c3\u30c8" },
  "date-math": { en: "Date Math", fr: "Calcul de Date", zh: "\u65e5\u671f\u8ba1\u7b97", ja: "\u65e5\u4ed8\u8a08\u7b97" },
  "date-diff": { en: "Date Difference", fr: "Difference de Date", zh: "\u65e5\u671f\u5dee", ja: "\u65e5\u4ed8\u5dee" },
  "date-words": { en: "Date to Words", fr: "Date en Mots", zh: "\u65e5\u671f\u8f6c\u6587\u5b57", ja: "\u65e5\u4ed8\u3092\u6587\u5b57\u3067" },
  "time-zone-converter": { en: "Time Zone Converter", fr: "Convertisseur de Fuseaux", zh: "\u65f6\u533a\u8f6c\u6362\u5668", ja: "\u30bf\u30a4\u30e0\u30be\u30fc\u30f3\u5909\u63db" }
};

// Map URL slugs to component import names
export const TOOL_COMPONENT_MAP: Record<ToolSlug, string> = {
  "holidays": "HolidayHoursCalculator",
  "working-hours": "HolidayHoursCalculator",  // alias
  "unix": "UnixTimestampConverter",
  "iso8601": "ISO8601Formatter",
  "date-math": "DateAddSubtract",
  "date-diff": "DateDifference",
  "date-words": "DateToWords",
  "time-zone-converter": "TimeZoneConverter"
};

export const LANG_SLUGS = ["en", "fr", "zh", "ja"] as const;
export type LangSlug = typeof LANG_SLUGS[number];

export function parseToolPath(path: string): { lang: LangSlug; tool: ToolSlug } | null {
  const p = path.toLowerCase().replace(/^\//, "").replace(/\/$/, "");
  // /<lang>/<tool>
  const parts = p.split("/");
  if (parts.length >= 2) {
    const langPart = parts[0];
    const toolPart = parts.slice(1).join("/"); // in case tool slug has hyphens
    const lang = LANG_SLUGS.find(l => l === langPart);
    if (!lang) return null;
    const tool = TOOL_SLUGS.find(t => t === toolPart);
    if (!tool) return null;
    return { lang, tool };
  }
  return null;
}

export function buildToolPath(lang: LangSlug, tool: ToolSlug): string {
  return `/${lang}/${tool}`;
}
