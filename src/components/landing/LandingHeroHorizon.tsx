// src/components/landing/LandingHeroHorizon.tsx
// Composes HeroDateBlock + HeroClock, fed by useHomeData + the liveDate ticker.
// Single source of truth for the hero — replaces the inline hero markup in
// App.tsx (gated by VITE_LANDING_V2 flag, off by default for now).
//
// polish-4 layout split:
//   - .tdp-hero-inner (max-width 1120px) wraps the centered chrome:
//     eyebrow row, date block, sun pills, sync footer, and the 12h/24h
//     toggle button. These stay focused and centered.
//   - .tdp-hero-clock (max-width 1600px / 95vw) lives OUTSIDE the inner
//     so the digits can span full viewport width on ultrawide displays.
//     The clock itself is still text-aligned center, but the larger
//     available width lets it scale up to 240px DSEG font on 1920px+.

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
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
  /** City name shown in the "Current time in {city}" headline */
  cityName: string;
  /** Region/state name (e.g. "Florida", "England"). Optional. */
  cityRegion?: string;
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
  cityRegion,
  countryName,
  lang = "en",
  testData,
}: LandingHeroHorizonProps) {
  // Always call the hook — React rules require hooks in the same order
  // every render. We override the result with testData below.
  const homeDataResult = useHomeData(country, "WLC");
  const fetched = testData
    ? ({ status: "ok" as const, data: testData, source: "local" as const })
    : homeDataResult;

  // 12h/24h toggle — App-level concern (persists across page changes),
  // but rendered inside the hero so it lives next to the clock it
  // controls. Persisted to localStorage.
  const [hour12, setHour12] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("tdp_hour12") === "1"; } catch { return false; }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem("tdp_hour12", hour12 ? "1" : "0"); } catch {}
  }, [hour12]);

  const data =
    fetched.status === "ok"
      ? fetched.data
      : null;

  return (
    <section className="tdp-hero" aria-label="Current time and date for your city">
      {/* Centered chrome (eyebrow + date + sun + sync + toggle) capped at 1120px */}
      <div className="tdp-hero-inner">
        <HeroDateBlock
          liveDate={liveDate}
          timezone={timezone}
          todayHoliday={null}
          internationalHoliday={
            data?.holiday?.international
              ? { country: data.holiday.international.country, name: data.holiday.international.name }
              : null
          }
          lang={lang}
        />

        {/* 12h/24h toggle — sits at the top-right of the hero so it's
            visible without scrolling. Toggling re-renders the clock
            immediately because it shares the same liveDate prop. */}
        <button
          type="button"
          className="tdp-hour-toggle"
          onClick={() => setHour12((v) => !v)}
          aria-label={hour12 ? "Switch to 24-hour clock" : "Switch to 12-hour clock with AM/PM"}
          aria-pressed={hour12}
          data-testid="hero-hour-toggle"
        >
          <Clock size={12} aria-hidden />
          <span className="tdp-hour-toggle-mode">{hour12 ? "12h" : "24h"}</span>
          <span className="tdp-hour-toggle-label">{hour12 ? "AM/PM" : "military"}</span>
        </button>
      </div>

      {/* Full-width clock — lives outside .tdp-hero-inner so it can span
          up to min(1600px, 95vw) on ultrawide displays. Still text-align
          center inside its own wrapper so the digits stay centered.
          The sync footer block is rendered internally by HeroClock. */}
      <HeroClock
        liveDate={liveDate}
        timezone={timezone}
        sync={data?.sync}
        cityName={cityName}
        cityRegion={cityRegion}
        countryName={countryName}
        sun={data?.sun}
        hour12={hour12}
      />
    </section>
  );
}

/* Tiny shared util — keeps Inter font consistent on the H1 in case HeroDateBlock is used outside this shell */
export { formatLongDateShared };