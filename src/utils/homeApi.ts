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
  // International: pick a fixed-feeling one from any country (manual rotation in MVP)
  const INTERNATIONAL_ROTATION: Array<{ country: string; name: string; date: string }> = [
    { country: "AU", name: "Constitution Day (Australia)", date: "2026-07-09" },
    { country: "JP", name: "Marine Day",                    date: "2026-07-20" },
    { country: "BR", name: "Independence Day (Brazil)",     date: "2026-09-07" },
    { country: "MX", name: "Independence Day (Mexico)",     date: "2026-09-16" },
    { country: "DE", name: "Day of German Unity",           date: "2026-10-03" },
  ];
  const intlMatch = INTERNATIONAL_ROTATION.find((h) => h.date === todayIso);
  const holiday = {
    today: usLookup.holiday,
    international: intlMatch ? { country: intlMatch.country, name: intlMatch.name } : null,
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