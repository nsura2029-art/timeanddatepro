// src/components/landing/HeroDateBlock.tsx
// The eyebrow + headline above the DSEG7 hero clock.
// Shows: live status pill, current date (e.g. "Thursday, July 9, 2026"),
// the user's UTC offset, and any holiday observed today (domestic or international).
// Styling matches the 03-horizon.html hero-eyebrow / hero-date / hero-holiday.

import { useState, useEffect } from "react";
import { CalendarHeart, Sparkles, Trophy } from "lucide-react";

type InternationalHoliday = {
  source: "holiday" | "onthisday" | "event";
  text: string;
  year?: number;
  category?: "event" | "birth" | "death";
  country?: string;
};

interface HeroDateBlockProps {
  /** Live ticker — used for the date string */
  liveDate: Date;
  /** IANA timezone to format the date into */
  timezone: string;
  /** Holiday in user's country today, if any (BrowseHome.holiday.today) */
  todayHoliday?: { name_en: string; country?: string } | null;
  /**
   * "What's happening today" pill — shown below the date.
   * Source can be:
   *   - "holiday"   : CalendarHeart icon, "Good Friday" (or name) + country
   *   - "onthisday" : Sparkles icon, "1957 — Prince Karim..." (raw fact)
   *   - "event"     : Trophy icon, "FIFA World Cup Opening" + country
   * Used as the initial/fallback pick if `internationalPool` is empty.
   */
  internationalHoliday?: InternationalHoliday | null;
  /**
   * Full pool of eligible facts for today. When provided, the component
   * picks one at random on mount and rotates every 8 minutes — the pill
   * shows different holiday / on-this-day / event facts over time instead
   * of the stable-per-day one. Falls back to `internationalHoliday` if empty.
   */
  internationalPool?: InternationalHoliday[];
  /** Optional override for the live pill label */
  liveLabel?: string;
  /** Time-of-day greeting (e.g. "Good morning"). No name — we don't know who the user is. */
  greeting?: string | null;
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
  internationalPool = [],
  liveLabel = "Live",
  greeting,
  lang = "en",
}: HeroDateBlockProps) {
  const dateText = fmtLongDate(liveDate, timezone, lang);
  const offset = fmtOffset(liveDate, timezone);

  // Randomized fact picker — picks ONE fact on mount and re-picks when
  // the active city changes (the internationalPool reference changes
  // because useHomeData re-fires for the new country). No auto-rotation:
  // the same fact stays for the entire page visit. This prevents the
  // sub-second flicker that happened when the effect re-ran on every
  // render because the parent constructed a new internationalHoliday
  // object on every liveDate tick.
  const [randomFact, setRandomFact] = useState<InternationalHoliday | null>(
    internationalHoliday ?? null
  );
  useEffect(() => {
    if (!internationalPool || internationalPool.length === 0) {
      setRandomFact(internationalHoliday ?? null);
      return;
    }
    // Pick ONE random fact from the pool. The pool reference is now
    // stable (memoized in LandingHeroHorizon), so this effect only
    // re-runs when the city actually changes (add/delete a city) or
    // on a hard page refresh.
    const idx = Math.floor(Math.random() * internationalPool.length);
    setRandomFact(internationalPool[idx]);
  }, [internationalPool, internationalHoliday]);

  // Final fact shown: todayHoliday wins (user's country), then the
  // randomized pick, then the stable fallback.
  const observed = todayHoliday || randomFact || internationalHoliday;

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

      {/* Time-of-day greeting (no name). Sits between the eyebrow and the H1. */}
      {greeting && (
        <div className="tdp-hero-greeting" aria-label="Greeting">
          {greeting}
        </div>
      )}

      {/* The H1 itself is part of the hero — keep it sibling so flex layout works */}
      <h1 className="tdp-hero-date">{dateText}</h1>

      {observed && (
        <div
          className={`tdp-hero-holiday tdp-hero-holiday--${(observed as any).source ?? "holiday"}`}
          data-testid="hero-holiday-pill"
        >
          {(observed as any).source === "onthisday" ? (
            <Sparkles size={14} aria-hidden className="tdp-hero-holiday-flag" />
          ) : (observed as any).source === "event" ? (
            <Trophy size={14} aria-hidden className="tdp-hero-holiday-flag" />
          ) : (
            <CalendarHeart size={14} aria-hidden className="tdp-hero-holiday-flag" />
          )}
          <span>
            {/* Holiday: "<name> observed in <country> today" */}
            {(observed as any).source === "onthisday" ? (
              <>
                <strong>On this day{(observed as any).year ? ` in ${(observed as any).year}` : ""}</strong>{" "}
                — {(observed as any).text.replace(/^\d{4}\s*—\s*/, "")}
              </>
            ) : (observed as any).source === "event" ? (
              <>
                <strong>{(observed as any).text}</strong>{" "}
                {(observed as any).country ? <>happening in {(observed as any).country} today</> : <>happening today</>}
              </>
            ) : (
              <>
                <strong>{(observed as any).name_en ?? (observed as any).text ?? (observed as any).name}</strong>{" "}
                observed in {(observed as any).country || "your country"} today
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export { fmtLongDate, fmtOffset };
