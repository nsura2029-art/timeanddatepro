// src/components/landing/LandingPage.tsx
// Composes Hero + 5 sections into the full Horizon v4b landing page.
// One component = one purpose: turn the home data + ticker + preferences
// into the rendered tree.

import React from "react";
import type { BrowseHome } from "../../utils/homeApi";
import { CITY_BY_CODE, type CityEntry } from "../../data/cities";
import { LandingHeroHorizon } from "./LandingHeroHorizon";
import { UserCitiesExploreCards } from "./UserCitiesExploreCards";
import { CityDetailCard, type SunSummary } from "./CityDetailCard";
import { ExploreMore } from "./ExploreMore";
import { TopPopularCities } from "./TopPopularCities";
import { QuoteBlock } from "./QuoteBlock";
import { WorldCupTeaser } from "./WorldCupTeaser";

interface LandingPageProps {
  /** Same Date instance as App.tsx liveDate — passed down to all tickers */
  liveDate: Date;
  /** IANA timezone the user is currently viewing (drives Hero) */
  timezone: string;
  /** Country code → drives Hero country badge */
  country: string;
  /** City name → Hero "Current time in {city}" headline */
  cityName: string;
  /** Optional region/state/province (e.g. "Florida", "England", "Kantō") */
  cityRegion?: string;
  /** Country name → Hero "in {city}, {country}" */
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
  cityRegion,
  countryName,
  lang = "en",
  homeData,
  favoriteCodes = [],
}: LandingPageProps) {
  // Normalize data — sections can render with partial data (graceful fallbacks).
  const topFive: CityEntry[] = homeData?.topFive ?? [];
  const topTwenty: CityEntry[] = homeData?.topTwenty ?? [];

  // Resolve user-added favorite codes → CityEntry[].
  // Lookup priority: browse/home topTwenty (has freshest live ticker data)
  // → CITY_BY_CODE (covers everything else).
  const userAdded: CityEntry[] = favoriteCodes
    .map((code) => {
      const from20 = topTwenty.find((c) => c.code === code);
      if (from20) return from20;
      const byCode = CITY_BY_CODE[code];
      return byCode as CityEntry | undefined;
    })
    .filter((c): c is CityEntry => Boolean(c));

  // Defaults (always shown in row 1) + user-added (rows 2+).
  // Filter out any user-added that happen to also be in defaults so we
  // don't render the same card twice.
  const defaultSet = new Set(topFive.map((c) => c.code));
  const userAddedFiltered = userAdded.filter((c) => !defaultSet.has(c.code));
  const allFavorites: CityEntry[] = [...topFive, ...userAddedFiltered];

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
        cityRegion={cityRegion}
        countryName={countryName}
        lang={lang}
        testData={homeData}
      />

      {/* Featured city (home) ----------------------------------- */}
      {homeCity && (
        <CityDetailCard
          city={homeCity}
          sun={sun}
          isFavorite={favoriteCodes.includes(homeCity.code)}
          onAddFavorite={() => {
            if (typeof window === "undefined") return;
            window.dispatchEvent(
              new CustomEvent("tdp:add-city", { detail: { code: homeCity.code } })
            );
          }}
        />
      )}

      {/* User-added Explore-style cards (polish-4): same NotebookLM
          palette as ExploreMore, lets the user scan their favorites
          without the live-ticker density. */}
      {userAddedFiltered.length > 0 && (
        <UserCitiesExploreCards userAdded={userAddedFiltered} />
      )}

      {/* Explore more (hooks) ----------------------------------- */}
      <ExploreMore />

      {/* Top 20 most popular ------------------------------------ */}
      {topTwenty.length > 0 && (
        <TopPopularCities
          liveDate={liveDate}
          cities={topTwenty}
          favoriteCodes={favoriteCodes}
          defaultCodes={topFive.map((c) => c.code)}
        />
      )}

      {/* Quote --------------------------------------------------- */}
      <QuoteBlock quote={quote} />

      {/* FIFA World Cup 2026 teaser ----------------------------- */}
      <WorldCupTeaser liveDate={liveDate} langPrefix={`/${lang}`} />
    </main>
  );
}