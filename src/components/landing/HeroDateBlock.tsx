// src/components/landing/HeroDateBlock.tsx
// The eyebrow + headline above the DSEG7 hero clock.
// Shows: live status pill, current date (e.g. "Thursday, July 9, 2026"),
// the user's UTC offset, and any holiday observed today (domestic or international).
// Styling matches the 03-horizon.html hero-eyebrow / hero-date / hero-holiday.

import { CalendarHeart } from "lucide-react";

interface HeroDateBlockProps {
  /** Live ticker — used for the date string */
  liveDate: Date;
  /** IANA timezone to format the date into */
  timezone: string;
  /** Holiday in user's country today, if any (BrowseHome.holiday.today) */
  todayHoliday?: { name_en: string; country?: string } | null;
  /** Holiday in some other country today, if any (BrowseHome.holiday.international) */
  internationalHoliday?: { country: string; name: string } | null;
  /** Optional override for the live pill label */
  liveLabel?: string;
  /** Translation locale */
  lang?: "en" | "fr" | "zh" | "ja";
}

/**
 * Format a Date as e.g. "Thursday, July 9, 2026" in the given timezone.
 */
function fmtLongDate(d: Date, tz: string, lang: "en" | "fr" | "zh" | "ja" = "en") {
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
 * Format a Date's UTC offset for the given timezone, e.g. "UTC-04:00".
 */
function fmtOffset(d: Date, tz: string) {
  // Get the offset in minutes by formatting same-instant in two timezones.
  const localStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const offsetPart = localStr.find((p) => p.type === "timeZoneName")?.value || "UTC";
  // shortOffset returns "GMT-4" or "GMT+5:30" — normalize to UTC±HH:MM
  const m = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return offsetPart;
  const [, sign, h, mm] = m;
  return `UTC${sign === "-" ? "-" : "+"}${h.padStart(2, "0")}:${(mm || "00").padStart(2, "0")}`;
}

export function HeroDateBlock({
  liveDate,
  timezone,
  todayHoliday,
  internationalHoliday,
  liveLabel = "Live",
  lang = "en",
}: HeroDateBlockProps) {
  const dateText = fmtLongDate(liveDate, timezone, lang);
  const offset = fmtOffset(liveDate, timezone);

  const observed = todayHoliday || internationalHoliday;

  return (
    <div className="tdp-hero-dateblock">
      <div className="tdp-hero-eyebrow">
        <span className="tdp-pill">
          <span className="tdp-dot" />
          {liveLabel}
        </span>
        <span className="tdp-eyebrow-date">{dateText}</span>
        <span className="tdp-tz">· {offset}</span>
      </div>

      {/* The H1 itself is part of the hero — keep it sibling so flex layout works */}
      <h1 className="tdp-hero-date">{dateText}</h1>

      {observed && (
        <div className="tdp-hero-holiday">
          <CalendarHeart size={14} aria-hidden className="tdp-hero-holiday-flag" />
          <span>
            <strong>{(observed as any).name_en ?? (observed as any).name}</strong>{" "}
            observed in {(observed as any).country || "your country"} today
          </span>
        </div>
      )}
    </div>
  );
}

export { fmtLongDate, fmtOffset };
