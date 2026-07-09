// src/utils/landingFormatters.ts
// Small helpers shared by HeroClock + HeroDateBlock. Kept here so the
// landing components stay focused on presentation, not Intl semantics.

type Lang = "en" | "fr" | "zh" | "ja";

/**
 * Format a Date as e.g. "Thursday, July 9, 2026" in the given timezone.
 */
export function formatLongDateShared(d: Date, tz: string, lang: Lang = "en"): string {
  return new Intl.DateTimeFormat(
    lang === "en" ? "en-US" : lang === "fr" ? "fr-FR" : lang === "zh" ? "zh-CN" : "ja-JP",
    {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(d);
}

/**
 * Format a Date's UTC offset for the given timezone as e.g. "UTC-04:00".
 */
export function formatOffsetShared(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "UTC";
  const m = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return offsetPart;
  const [, sign, h, mm] = m;
  return `UTC${sign === "-" ? "-" : "+"}${h.padStart(2, "0")}:${(mm || "00").padStart(2, "0")}`;
}
