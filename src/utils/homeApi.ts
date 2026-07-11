// src/utils/homeApi.ts
// Composite endpoint for the landing page hero.
// Combines: current time, sun, holiday, top 5/20 cities, quote, next event, sync.
// One round-trip from server = one consistent snapshot for the hero.

import { sunPosition } from "./sunApi";
import { lookupHoliday } from "./holidayApi";
import { getPopularCities } from "./popularApi";
import { pickQuote } from "./quoteApi";
import { getNextBigEvent } from "./eventsApi";
import { getUpcomingDstChanges } from "./dstApi";
import { fetchOnThisDay, selectHeadlines, formatOnThisDay } from "./onthisdayApi";
import { QUOTES_EN } from "../data/quotes/en";
import { CITY_BY_CODE, type CityEntry } from "../data/cities";
import type { CountryCode } from "../types";

/**
 * Pick the most interesting "what's happening globally today" item to show
 * in the international pill on the hero. Order of preference:
 *   1. Public holiday today in any of 30 curated countries (rotates by date)
 *   2. ONE random OnThisDay fact (event / birth / death) — stable per day so
 *      the same date always shows the same fact, but each day shows something
 *      different. Replaces the old generic month-filler ("Mid-summer in
 *      the Northern Hemisphere" was noise).
 *   3. Today's `nextEvent` if it lands today (e.g. World Cup opening day)
 *   4. null (pill renders nothing if all three miss)
 */
function pickInternationalHolidayOrFact(
  todayIso: string,
  now: Date,
  onThisDay: { events: string[]; births: string[]; deaths: string[] }
): {
  source: "holiday" | "onthisday" | "event";
  text: string;
  year?: number;
  category?: "event" | "birth" | "death";
  country?: string;
} | null {
  // 1. Holiday in any country today — deterministic by date so the same
  //    day always shows the same country.
  const INTL_HOLIDAY_POOL: Array<{ date: string; country: string; name: string }> = [
    { date: "01-01", country: "XX", name: "New Year's Day" },
    { date: "02-14", country: "XX", name: "Valentine's Day" },
    { date: "03-08", country: "XX", name: "International Women's Day" },
    { date: "03-17", country: "IE", name: "St. Patrick's Day (Ireland)" },
    { date: "04-01", country: "XX", name: "April Fools' Day" },
    { date: "04-22", country: "XX", name: "Earth Day" },
    { date: "05-01", country: "XX", name: "International Workers' Day" },
    { date: "05-04", country: "JP", name: "Greenery Day (Japan)" },
    { date: "06-05", country: "DK", name: "Constitution Day (Denmark)" },
    { date: "06-21", country: "XX", name: "Summer Solstice" },
    { date: "07-04", country: "US", name: "Independence Day (United States)" },
    { date: "07-09", country: "AU", name: "Constitution Day (Australia)" },
    { date: "07-14", country: "FR", name: "Bastille Day (France)" },
    { date: "07-20", country: "JP", name: "Marine Day (Japan)" },
    { date: "08-15", country: "IN", name: "Independence Day (India)" },
    { date: "09-07", country: "BR", name: "Independence Day (Brazil)" },
    { date: "09-16", country: "MX", name: "Independence Day (Mexico)" },
    { date: "09-21", country: "MX", name: "Independence Day (Mexico — observed)" },
    { date: "10-03", country: "DE", name: "Day of German Unity" },
    { date: "10-12", country: "ES", name: "National Day (Spain)" },
    { date: "10-31", country: "XX", name: "Halloween" },
    { date: "11-02", country: "MX", name: "Day of the Dead (Mexico)" },
    { date: "11-11", country: "XX", name: "Veterans / Remembrance Day" },
    { date: "11-26", country: "US", name: "Thanksgiving (United States)" },
    { date: "12-25", country: "XX", name: "Christmas Day" },
    { date: "12-31", country: "XX", name: "New Year's Eve" },
  ];
  const mmdd = todayIso.slice(5); // MM-DD
  const directHit = INTL_HOLIDAY_POOL.find((h) => h.date === mmdd);
  if (directHit) {
    return { source: "holiday", text: directHit.name, country: directHit.country };
  }

  // 2. ONE random OnThisDay fact (event / birth / death), stable per day.
  // Combines all 3 buckets into one pool, then picks deterministically
  // using the day-of-year as a seed. Year is extracted from the prefix
  // (Wikipedia format: "YEAR — description").
  const pool: Array<{ text: string; category: "event" | "birth" | "death" }> = [
    ...onThisDay.events.map((t) => ({ text: t, category: "event" as const })),
    ...onThisDay.births.map((t) => ({ text: t, category: "birth" as const })),
    ...onThisDay.deaths.map((t) => ({ text: t, category: "death" as const })),
  ];
  if (pool.length > 0) {
    // Day-of-year seed (1-366) so the same calendar date always shows the same fact
    const start = new Date(now.getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((now.getTime() - start) / 86400000);
    const pick = pool[dayOfYear % pool.length];
    const yearMatch = pick.text.match(/^(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
    return { source: "onthisday", text: pick.text, year, category: pick.category };
  }

  // 3. nextEvent — if it's today (e.g. FIFA World Cup opening day 2026-06-11).
  const ev = getNextBigEvent(now);
  if (ev) {
    const evDate = new Date(ev.startUtc);
    const evIso = evDate.toISOString().slice(0, 10);
    if (evIso === todayIso) {
      return { source: "event", text: ev.name, country: ev.country };
    }
  }

  // 4. null — no generic month filler. If all 3 miss, the pill is hidden.
  return null;
}

export interface BrowseHome {
  /** Server time at fetch */
  fetchedAt: string;
  /** Home city (e.g. Wesley Chapel) — default until user sets */
  home: {
    city: string;
    country: string;
    timezone: string;
    countryCode: string;
    lat: number;
    lng: number;
  };
  /**
   * Time-of-day greeting rendered above the date H1.
   * No name — we don't know who the user is. Just the salutation.
   * Bucket boundaries (local hour in home.timezone):
   *   05-12 → "Good morning"
   *   12-17 → "Good afternoon"
   *   17-22 → "Good evening"
   *   22-05 → "Good night"
   */
  greeting: {
    message: "Good morning" | "Good afternoon" | "Good evening" | "Good night";
    bucket: "morning" | "afternoon" | "evening" | "night";
    /** Local hour (0-23) in home.timezone — for analytics + future personalization */
    localHour: number;
  };
  /**
   * Color-coded status pills rendered as a row between the date and the clock.
   * Always exactly 3, in this fixed order:
   *   1. sync      (green)   "Your clock is synchronized"
   *   2. business  (indigo)  Dynamic based on local time + weekday
   *   3. sun       (amber)   "Sunrise HH:MM · Sunset HH:MM"
   * The React side maps each entry to a colored pill via the `variant` field.
   */
  statusPills: Array<{
    id: string;
    type: "sync" | "business" | "sun";
    icon: "check" | "briefcase" | "sun";
    message: string;
    subtext?: string;
    variant: "success" | "info" | "warning";
  }>;
  currentTime: {
    iso: string;
    unix: number;
    tz: string;
    offsetMinutes: number;
  };
  sync: {
    driftMs: number;            // mock 300 for MVP
    accuracyMs: number;         // mock 149 for MVP
    serverTimeMs: number;
  };
  sun: {
    sunrise: string | null;
    sunset: string | null;
    solarNoon: string | null;
    dayLength: string;
    azimuthAtNoon: number;
    elevationAtNoon: number;
    attribution: string;
  };
  holiday: {
    /** Holiday in user's country today */
    today: any | null;
    /**
     * The "what's happening today" pill shown below the date.
     * Source can be:
     *   - "holiday"   : a curated public holiday in some country today
     *   - "onthisday" : a random historical fact (event/birth/death) from
     *                   Wikipedia's OnThisDay feed, picked stable-per-day
     *   - "event"     : a sports/observance event happening today
     * `country` is set for `holiday` + `event` sources.
     * `year` + `category` are set for `onthisday` source.
     */
    international: {
      source: "holiday" | "onthisday" | "event";
      text: string;
      year?: number;
      category?: "event" | "birth" | "death";
      country?: string;
    } | null;
    next: any | null;
  };
  nextEvent: any | null;        // next sports/holiday/observance
  topFive: CityEntry[];
  topTwenty: CityEntry[];
  quote: { id: string; text: string; author?: string };
  onThisDay: { events: string[]; births: string[]; deaths: string[] };
  dstChanges: any[];
}

/**
 * Build the composite home data for the landing page hero.
 * Single function so the React side has one render-boundary.
 */
export async function buildBrowseHome(opts: {
  now?: Date;
  homeCode?: string;
  userCountryCode?: CountryCode | string;
} = {}): Promise<BrowseHome> {
  const { now = new Date(), homeCode = "WES", userCountryCode = "US" } = opts;

  // === HOME CITY ===
  // Hard-coded Wesley Chapel for MVP. Phase 2: read from user preferences.
  const home = {
    city: "Wesley Chapel",
    country: "United States",
    timezone: "America/New_York",
    countryCode: "US",
    lat: 28.2396,
    lng: -82.3279,
  };

  // === CURRENT TIME ===
  const currentTime = {
    iso: now.toISOString(),
    unix: Math.floor(now.getTime() / 1000),
    tz: home.timezone,
    offsetMinutes: -now.getTimezoneOffset(),
  };

  // === SYNC (mocked for MVP — real NTP-style sync comes in Phase 2) ===
  const sync = {
    driftMs: 300,           // 0.3 seconds behind
    accuracyMs: 149,        // ±0.149 seconds
    serverTimeMs: Date.now(),
  };

  // === SUN ===
  const sunRaw = sunPosition(home.lat, home.lng, now, home.timezone);
  const sun = {
    sunrise: sunRaw.sunrise,
    sunset: sunRaw.sunset,
    solarNoon: sunRaw.solarNoon,
    dayLength: sunRaw.dayLengthFormatted,
    azimuthAtNoon: sunRaw.azimuthAtNoon,
    elevationAtNoon: sunRaw.elevationAtNoon,
    attribution: sunRaw.attribution,
  };

  // === HOLIDAY (today) ===
  const todayIso = now.toISOString().slice(0, 10);
  const usLookup = lookupHoliday("US", todayIso);

  // === NEXT EVENT (sports/holiday) ===
  const nextEvent = getNextBigEvent(now);

  // === POPULAR CITIES ===
  // polish-4: bumped from 20 to 55 to satisfy the 50+ SEO target.
  const popular = getPopularCities(55);
  const topFive = popular.slice(0, 5).map((c) => CITY_BY_CODE[c.code] ?? c);
  const topTwenty = popular;

  // === QUOTE ===
  // Quote is selected based on the user's country. We pass holiday=false
  // since the international pill now uses onThisDay data, not holiday data.
  const quoteRaw = pickQuote({
    pool: QUOTES_EN,
    now,
    countryTag: `country:${userCountryCode.toLowerCase()}`,
    isHoliday: !!usLookup.holiday,
  });
  const quote = { id: quoteRaw.id, text: quoteRaw.text, author: quoteRaw.author };

  // === ON THIS DAY (fetched FIRST so the international pill can pick from it) ===
  let onThisDay = { events: [], births: [], deaths: [] };
  try {
    const feed = await fetchOnThisDay(now.getMonth() + 1, now.getDate(), 30);
    const headlines = selectHeadlines(feed);
    onThisDay = {
      events: headlines.events.map(formatOnThisDay),
      births: headlines.births.map(formatOnThisDay),
      deaths: headlines.deaths.map(formatOnThisDay),
    };
  } catch (e) {
    // Wikipedia API might be unavailable — fall back to empty
    console.warn("Wikipedia OnThisDay API unavailable:", e);
  }

  // International: dynamic lookup chain (uses onThisDay data as primary fallback).
  //   1. Today's public holiday in any country (curated for 30 countries)
  //   2. ONE random OnThisDay fact (event/birth/death) — stable per day
  //   3. Today's `nextEvent` if it lands today (e.g. World Cup opening day)
  //   4. null (no more generic month filler like "Mid-summer in the Northern Hemisphere")
  const international = pickInternationalHolidayOrFact(todayIso, now, onThisDay);

  const holiday = {
    today: usLookup.holiday,
    international,
    next: usLookup.nextHoliday,
  };

  // === DST CHANGES ===
  const dstChanges = getUpcomingDstChanges(now).map((info) => ({
    timezone: info.timezone,
    nextTransition: info.nextTransition,
  }));

  // === GREETING (time-of-day salutation, no name) ===
  // We don't know who the user is — so the message is a bare salutation
  // with no trailing name. Bucket boundaries align with common UX rules
  // (5am, noon, 5pm, 10pm) so the wording changes at natural day parts.
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: home.timezone,
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );
  const greeting: BrowseHome["greeting"] =
    localHour >= 5 && localHour < 12
      ? { message: "Good morning", bucket: "morning", localHour }
      : localHour >= 12 && localHour < 17
      ? { message: "Good afternoon", bucket: "afternoon", localHour }
      : localHour >= 17 && localHour < 22
      ? { message: "Good evening", bucket: "evening", localHour }
      : { message: "Good night", bucket: "night", localHour };

  // === STATUS PILLS (3 colored pills: sync / business / sun) ===
  // Pill 1: sync (green) — always "Your clock is synchronized" since the
  //   hero is fed by the live RAF ticker. Kept as a pill so the user has
  //   a visual cue that the time is real, not cached.
  // Pill 2: business (indigo) — dynamic based on local time + weekday.
  //   - Weekend → "Off hours · Offices reopen Monday 9:00 AM"
  //   - Weekday 09-16 → "Business day · Offices open until 5:00 PM"
  //   - Weekday 16-17 → "Business day · Offices closing soon at 5:00 PM"
  //   - Other    → "Business day · Offices open at 9:00 AM"
  // Pill 3: sun (amber) — "Sunrise 6:40 AM · Sunset 8:29 PM" from sun data.
  // sunApi returns "YYYY-MM-DD, HH:MM:SS" — we strip the date and reformat
  // to 12-hour with AM/PM for human-readable display in the status pill.
  const formatTimeOnly = (s: string | null): string => {
    if (!s) return "--:--";
    const timePart = s.includes(",") ? s.split(",")[1].trim() : s;
    const [hStr, mStr] = timePart.split(":");
    const hour = parseInt(hStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${mStr} ${ampm}`;
  };
  const localWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: home.timezone,
    weekday: "short",
  }).format(now); // "Sat", "Sun", "Mon", ...
  const isWeekend = localWeekday === "Sat" || localWeekday === "Sun";

  const businessPill: BrowseHome["statusPills"][number] = (() => {
    if (isWeekend) {
      return {
        id: "business",
        type: "business",
        icon: "briefcase",
        message: "Off hours",
        subtext: "Offices reopen Monday 9:00 AM",
        variant: "info",
      };
    }
    if (localHour >= 9 && localHour < 16) {
      return {
        id: "business",
        type: "business",
        icon: "briefcase",
        message: "Business day",
        subtext: "Offices open until 5:00 PM",
        variant: "info",
      };
    }
    if (localHour >= 16 && localHour < 17) {
      return {
        id: "business",
        type: "business",
        icon: "briefcase",
        message: "Business day",
        subtext: "Offices closing soon at 5:00 PM",
        variant: "info",
      };
    }
    // Pre-business hours on a weekday (00-09 or 17-24)
    return {
      id: "business",
      type: "business",
      icon: "briefcase",
      message: "Business day",
      subtext: "Offices open at 9:00 AM",
      variant: "info",
    };
  })();

  const statusPills: BrowseHome["statusPills"] = [
    {
      id: "sync",
      type: "sync",
      icon: "check",
      message: "Your clock is synchronized",
      variant: "success",
    },
    businessPill,
    {
      id: "sun",
      type: "sun",
      icon: "sun",
      message: "Sunrise",
      subtext: `${formatTimeOnly(sun.sunrise)} · Sunset ${formatTimeOnly(sun.sunset)}`,
      variant: "warning",
    },
  ];

  return {
    fetchedAt: now.toISOString(),
    home,
    greeting,
    statusPills,
    currentTime,
    sync,
    sun,
    holiday,
    nextEvent,
    topFive,
    topTwenty,
    quote,
    onThisDay,
    dstChanges,
  };
}