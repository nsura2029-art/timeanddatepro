// src/utils/landingFormatters.ts
// Small helpers shared by HeroClock + HeroDateBlock + T4 sections.
// Kept here so the landing components stay focused on presentation,
// not Intl semantics.

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

/**
 * Format a Date as HH:MM:SS (24h) in the given timezone. Used by city tickers.
 */
export function formatTimeHHMMSSShared(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Get the local 2-digit sub-second (centiseconds) from a Date — used in
 * ticker cards so they tick visibly each render.
 */
export function formatSubsecShared(d: Date): string {
  return Math.floor(d.getMilliseconds() / 10).toString().padStart(2, "0");
}

/**
 * Format e.g. "06:39 AM" — sunrise/sunset readable form.
 */
export function formatTimeAmPmShared(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d).toUpperCase();
}

/**
 * Format shortOffset for "Tokyo +9" badge.
 */
export function formatShortOffsetShared(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "UTC";
  const m = offsetPart.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return offsetPart;
  const [, sign, h, mm] = m;
  return `${sign}${parseInt(h, 10)}${mm && mm !== "00" ? `:${mm}` : ""}`;
}