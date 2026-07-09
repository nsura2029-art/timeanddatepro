// src/components/landing/LandingHeroHorizon.tsx
// Composes HeroDateBlock + HeroClock, fed by useHomeData + the liveDate ticker.
// Single source of truth for the hero — replaces the inline hero markup in
// App.tsx (gated by VITE_LANDING_V2 flag, off by default for now).

import { HeroClock } from "./HeroClock";
import { HeroDateBlock } from "./HeroDateBlock";
import { useHomeData } from "../../hooks/useHomeData";
import { formatLongDateShared } from "../../utils/landingFormatters";
import "./landingHorizon.css";

interface LandingHeroHorizonProps {
  /** Reactive ticker from parent so clock sub-second stays smooth */
  liveDate: Date;
  /** IANA timezone the user is currently viewing */
  timezone: string;
  /** Country code → drives the browse/home country parameter + picker */
  country: string;
  /** City name shown in the "Time in {city}" line */
  cityName: string;
  /** Country name shown after the city */
  countryName: string;
  /** Translation locale */
  lang?: "en" | "fr" | "zh" | "ja";
  /** Optional inline test override — bypasses the network call */
  testData?: import("../../utils/homeApi").BrowseHome | null;
}

/**
 * Single-component wrapper around the Horizon hero design.
 * Re-render-friendly: clock sub-second ticks off the parent's RAF ticker
 * so we don't multiply timers.
 */
export function LandingHeroHorizon({
  liveDate,
  timezone,
  country,
  cityName,
  countryName,
  lang = "en",
  testData,
}: LandingHeroHorizonProps) {
  // Hook is called for prop-driven SSR consistency even if testData is set.
  const fetched = testData ? { status: "ok" as const, data: testData, source: "local" as const } : useHomeData(country, "WLC");

  const data =
    fetched.status === "ok"
      ? fetched.data
      : null;

  return (
    <section className="tdp-hero" aria-label="Current time and date for your city">
      <div className="tdp-hero-inner">
        <HeroDateBlock
          liveDate={liveDate}
          timezone={timezone}
          todayHoliday={null} // browse/home.holiday.today shape varies; render via HeroClock sync block for now
          internationalHoliday={
            data?.holiday?.international
              ? { country: data.holiday.international.country, name: data.holiday.international.name }
              : null
          }
          lang={lang}
        />

        <HeroClock
          liveDate={liveDate}
          timezone={timezone}
          sync={data?.sync}
          cityName={cityName}
          countryName={countryName}
          sun={data?.sun}
        />
      </div>
    </section>
  );
}

/* Tiny shared util — keeps Inter font consistent on the H1 in case HeroDateBlock is used outside this shell */
export { formatLongDateShared };
