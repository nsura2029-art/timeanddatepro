// src/components/landing/LandingPage.tsx
// Composes Hero + 5 sections into the full Horizon v4b landing page.
// One component = one purpose: turn the home data + ticker + preferences
// into the rendered tree.

import React from "react";
import type { BrowseHome } from "../../utils/homeApi";
import type { CityEntry } from "../../data/cities";
import { LandingHeroHorizon } from "./LandingHeroHorizon";
import { FiveCitiesFavorites } from "./FiveCitiesFavorites";
import { CityDetailCard, type SunSummary } from "./CityDetailCard";
import { ExploreMore } from "./ExploreMore";
import { TopPopularCities } from "./TopPopularCities";
import { QuoteBlock } from "./QuoteBlock";

interface LandingPageProps {
  /** Same Date instance as App.tsx liveDate — passed down to all tickers */
  liveDate: Date;
  /** IANA timezone the user is currently viewing (drives Hero) */
  timezone: string;
  /** Country code → drives Hero country badge */
  country: string;
  /** City name → Hero "Time in {city}" line */
  cityName: string;
  /** Country name → Hero "Time in {city}, {country}" */
  countryName: string;
  /** Translation locale (Hero only — sections are EN for MVP) */
  lang?: "en" | "fr" | "zh" | "ja";
  /** Optional override — bypasses the network call when set */
  homeData?: BrowseHome | null;
  /** Current favorite city codes for visual highlight in TopPopularCities */
  favoriteCodes?: string[];
}

export function LandingPage({
  liveDate,
  timezone,
  country,
  cityName,
  countryName,
  lang = "en",
  homeData,
  favoriteCodes = [],
}: LandingPageProps) {
  // Normalize data — sections can render with partial data (graceful fallbacks).
  const topFive: CityEntry[] = homeData?.topFive ?? [];
  const topTwenty: CityEntry[] = homeData?.topTwenty ?? [];
  const homeCity: CityEntry | undefined = homeData?.home
    ? {
        code: "WLC",
        name: homeData.home.city,
        country: homeData.home.country,
        countryCode: homeData.home.countryCode,
        timezone: homeData.home.timezone,
      }
    : undefined;
  const sun: SunSummary | null = homeData?.sun
    ? {
        sunrise: homeData.sun.sunrise,
        sunset: homeData.sun.sunset,
        solarNoon: homeData.sun.solarNoon,
        dayLengthFormatted: homeData.sun.dayLength,
        azimuthAtNoon: homeData.sun.azimuthAtNoon,
        elevationAtNoon: homeData.sun.elevationAtNoon,
      }
    : null;
  const quote = homeData?.quote ?? null;

  return (
    <main className="tdp-landing" aria-label="TimeAndDatePro home">
      {/* Hero ---------------------------------------------------- */}
      <LandingHeroHorizon
        liveDate={liveDate}
        timezone={timezone}
        country={country}
        cityName={cityName}
        countryName={countryName}
        lang={lang}
        testData={homeData}
      />

      {/* 5 favorite cities --------------------------------------- */}
      {topFive.length > 0 && (
        <FiveCitiesFavorites liveDate={liveDate} cities={topFive} />
      )}

      {/* Featured city (home) ----------------------------------- */}
      {homeCity && (
        <CityDetailCard city={homeCity} sun={sun} />
      )}

      {/* Explore more (hooks) ----------------------------------- */}
      <ExploreMore />

      {/* Top 20 most popular ------------------------------------ */}
      {topTwenty.length > 0 && (
        <TopPopularCities
          liveDate={liveDate}
          cities={topTwenty}
          favoriteCodes={favoriteCodes}
        />
      )}

      {/* Quote --------------------------------------------------- */}
      <QuoteBlock quote={quote} />
    </main>
  );
}