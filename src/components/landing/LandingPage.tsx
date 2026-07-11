// src/components/landing/LandingPage.tsx
// Composes Hero + YourCitiesPanel + ExploreMore + TopPopularCities into
// the full landing page. The tracked-cities state lives here (lifted from
// the hero) so both the hero (for the clock timezone) and the panel
// (for the UI) can share it without prop-drilling through the hero.

import React from "react";
import type { BrowseHome } from "../../utils/homeApi";
import { type CityEntry } from "../../data/cities";
import { LandingHeroHorizon } from "./LandingHeroHorizon";
import { YourCitiesPanel } from "./YourCitiesPanel";
import { ExploreMore } from "./ExploreMore";
import { TopPopularCities } from "./TopPopularCities";
import { QuoteBlock } from "./QuoteBlock";
import { WorldCupTeaser } from "./WorldCupTeaser";
import { useTrackedCities } from "../../hooks/useTrackedCities";

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
  // Tracked cities state — lifted from the hero so the panel can share it.
  const {
    cities: trackedCities,
    activeCity,
    activeCode,
    setActive,
    addCity,
    removeCity,
    canAddMore,
    count: trackedCount,
    max: trackedMax,
  } = useTrackedCities();

  // Compute hero values from the active city (falls back to legacy props).
  // Same logic the hero used to do internally — moved up so the panel
  // can also read the active city state without prop-drilling.
  const heroTimezone = activeCity?.timezone ?? timezone;
  const heroCityName = activeCity?.name ?? cityName;
  const heroCityRegion = activeCity ? activeCity.state : cityRegion;
  const heroCountryName = activeCity?.country ?? countryName;

  // The data the hero needs to render the home-page context
  const topFive: CityEntry[] = homeData?.topFive ?? [];
  const topTwenty: CityEntry[] = homeData?.topTwenty ?? [];
  const quote = homeData?.quote ?? null;

  return (
    <main className="tdp-landing" aria-label="TimeAndDatePro home">
      {/* Hero ---------------------------------------------------- */}
      <LandingHeroHorizon
        liveDate={liveDate}
        timezone={heroTimezone}
        country={activeCity?.countryCode ?? country}
        cityName={heroCityName}
        cityRegion={heroCityRegion}
        countryName={heroCountryName}
        lang={lang}
        testData={homeData}
        trackedCities={trackedCities}
        activeCode={activeCode}
        activeCity={activeCity}
        onPickCity={setActive}
        onAddCity={addCity}
        onRemoveCity={removeCity}
        canAddMore={canAddMore}
        trackedCount={trackedCount}
        trackedMax={trackedMax}
      />

      {/* Home city section — full width below the hero.
          YourCitiesPanel is the persistent widget showing all tracked
          cities with LIVE times + the API-driven add search at the top. */}
      <section className="tdp-home-cities" aria-label="Your tracked cities">
        <YourCitiesPanel
          cities={trackedCities}
          activeCode={activeCode}
          onPick={setActive}
          onRemove={removeCity}
          count={trackedCount}
          max={trackedMax}
          canAddMore={canAddMore}
        />
      </section>

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
