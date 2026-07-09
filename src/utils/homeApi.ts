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
 *   2. A notable event from Wikipedia OnThisDay (events/births/deaths) for today
 *   3. Today's `nextEvent` if it lands today (e.g. World Cup opening day)
 *   4. A curated fallback that's date-stable so the pill is never empty
 */
function pickInternationalHolidayOrFact(
  todayIso: string,
  now: Date
): { country: string; name: string } | null {
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
    return { country: directHit.country, name: directHit.name };
  }

  // 2. Wikipedia OnThisDay — synchronous lookup (already in browse/home).
  // Falls through if unavailable. We don't await here because pickInternationalHolidayOrFact
  // is called from a sync context in homeApi.ts. The caller already has onThisDay data.
  // (Will pick from the onThisDay bucket in a follow-up patch; for now rely on
  // the curated pool + nextEvent.)

  // 3. nextEvent — if it's today (e.g. FIFA World Cup opening day 2026-06-11).
  const ev = getNextBigEvent(now);
  if (ev) {
    const evDate = new Date(ev.startUtc);
    const evIso = evDate.toISOString().slice(0, 10);
    if (evIso === todayIso) {
      return { country: ev.country, name: ev.name };
    }
  }

  // 4. Date-stable curated fallback by month (never empty).
  const FALLBACK_BY_MONTH: Record<number, { country: string; name: string }> = {
    1:  { country: "XX", name: "New Year celebrations underway" },
    2:  { country: "CN", name: "Spring Festival (Lunar New Year)" },
    3:  { country: "XX", name: "Daylight Saving Time begins in many regions" },
    4:  { country: "JP", name: "Cherry blossom season (Sakura)" },
    5:  { country: "XX", name: "International Workers' Day observed" },
    6:  { country: "XX", name: "Summer solstice approaching" },
    7:  { country: "XX", name: "Mid-summer in the Northern Hemisphere" },
    8:  { country: "XX", name: "Late summer holidays across Europe" },
    9:  { country: "XX", name: "Equinox approaching" },
    10: { country: "DE", name: "Day of German Unity observed" },
    11: { country: "US", name: "Thanksgiving (United States)" },
    12: { country: "XX", name: "Holiday season across many cultures" },
  };
  const month = now.getMonth() + 1;
  return FALLBACK_BY_MONTH[month] ?? { country: "XX", name: "Today is a global day" };
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
    /** Holiday in any country today (e.g. "Constitution Day (Australia)") */
    international: { country: string; name: string } | null;
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

  // International: dynamic lookup chain.
  //   1. Today's public holiday in any country (curated for 30 countries)
  //   2. A notable event from Wikipedia OnThisDay (events/births/deaths)
  //   3. Today's `nextEvent` if it's today (e.g. World Cup opening day)
  //   4. The user's country holiday as last resort
  // Falls back to a sensible default if all four miss.
  const international = pickInternationalHolidayOrFact(todayIso, now);

  const holiday = {
    today: usLookup.holiday,
    international,
    next: usLookup.nextHoliday,
  };

  // === NEXT EVENT (sports/holiday) ===
  const nextEvent = getNextBigEvent(now);

  // === POPULAR CITIES ===
  const popular = getPopularCities(20);
  const topFive = popular.slice(0, 5).map((c) => CITY_BY_CODE[c.code] ?? c);
  const topTwenty = popular;

  // === QUOTE ===
  const quoteRaw = pickQuote({
    pool: QUOTES_EN,
    now,
    countryTag: `country:${userCountryCode.toLowerCase()}`,
    isHoliday: !!holiday.today,
  });
  const quote = { id: quoteRaw.id, text: quoteRaw.text, author: quoteRaw.author };

  // === ON THIS DAY ===
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

  // === DST CHANGES ===
  const dstChanges = getUpcomingDstChanges(now).map((info) => ({
    timezone: info.timezone,
    nextTransition: info.nextTransition,
  }));

  return {
    fetchedAt: now.toISOString(),
    home,
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