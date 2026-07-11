// src/components/landing/LandingHeroHorizon.tsx
// Composes HeroDateBlock + HeroClock + CityPickerTrigger + CityPickerOverlay,
// fed by useHomeData + the liveDate ticker + useTrackedCities state.
//
// City picker behavior:
//   - The user can switch the active city via the trigger button (top-right
//     of the hero, next to the 12H/24H toggle) or via Cmd/Ctrl+K
//   - The 5 default cities ship pre-loaded (Wesley Chapel, London, Dubai,
//     Tokyo, Sydney). The home city (Wesley Chapel) is always first and not
//     removable. Other cities can be removed via an X button in the overlay.
//   - Switching cities re-fires useHomeData with the new country/homeCode,
//     which cascades through the whole hero: clock timezone, sun data,
//     business hours, greeting, day length, sync drift, onThisDay, etc.

import { useState, useEffect, useCallback } from "react";
import { Clock, Globe } from "lucide-react";
import { HeroClock, HeroStatusPills } from "./HeroClock";
import { HeroDateBlock } from "./HeroDateBlock";
import { useHomeData } from "../../hooks/useHomeData";
import { useTrackedCities } from "../../hooks/useTrackedCities";
import { CityPickerOverlay } from "./CityPickerOverlay";
import { CityPickerWelcome } from "./CityPickerWelcome";
import { DEFAULT_CITIES } from "../../data/defaultCities";
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
  // City picker state (manages tracked cities + active city, persists to localStorage)
  // Declared FIRST because useHomeData below needs activeCity for its params.
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

  // Always call the hook — React rules require hooks in the same order
  // every render. We override the result with testData below.
  // Key the fetch off the ACTIVE CITY (from the picker), not the legacy
  // `country` prop, so switching cities re-fires the API for the new
  // country/code and the hero data cascades (sun, business, greeting,
  // day length, sync drift, onThisDay, etc.).
  const fetchCountry = activeCity?.countryCode ?? country;
  const fetchHomeCode = activeCity?.code ?? "WLC";
  const homeDataResult = useHomeData(fetchCountry, fetchHomeCode);
  const fetched = testData
    ? ({ status: "ok" as const, data: testData, source: "local" as const })
    : homeDataResult;

  // City picker UI state (overlay open/closed)
  const [pickerOpen, setPickerOpen] = useState(false);

  // Cmd/Ctrl+K opens the overlay
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPickerOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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

  // Hero's display values come from the active city (from the picker), so
  // switching the city re-renders the entire hero against the new timezone.
  // We DO NOT fall back to the legacy prop values (cityRegion, etc.) for
  // the region — doing so causes "Paris, Florida, France" when switching
  // from Wesley Chapel (state=Florida) to Paris (no state). The prop
  // values are only used if activeCity is completely missing.
  const heroTimezone = activeCity?.timezone ?? timezone;
  const heroCityName = activeCity?.name ?? cityName;
  const heroCityRegion = activeCity ? activeCity.state : cityRegion;
  const heroCountryName = activeCity?.country ?? countryName;

  const handlePick = useCallback(
    (code: string) => {
      setActive(code);
    },
    [setActive]
  );

  const handleAdd = useCallback(
    (city: import("../../data/cities").CityEntry) => {
      addCity(city);
    },
    [addCity]
  );

  return (
    <section className="tdp-hero" aria-label="Current time and date for your city">
      {/* Centered chrome (eyebrow + greeting + date + status pills + toggles) */}
      <div className="tdp-hero-inner">
        <HeroDateBlock
          liveDate={liveDate}
          timezone={timezone}
          todayHoliday={null}
          internationalHoliday={
            data?.holiday?.international
              ? {
                  source: data.holiday.international.source,
                  text: data.holiday.international.text,
                  year: data.holiday.international.year,
                  category: data.holiday.international.category,
                  country: data.holiday.international.country,
                }
              : null
          }
          greeting={data?.greeting?.message}
          lang={lang}
        />

        {/* 3 colored status pills (sync / business / sun) — sits between
            the date and the clock. Always 3, in fixed order. */}
        <HeroStatusPills pills={data?.statusPills} />

        {/* Top-right action cluster: city picker trigger + 12H/24H toggle */}
        <div className="tdp-hero-actions">
          {/* City picker trigger — opens the overlay */}
          <button
            type="button"
            className="tdp-btn tdp-btn--secondary tdp-btn--sm tdp-city-picker-trigger"
            onClick={() => setPickerOpen(true)}
            aria-label="Change city"
            aria-haspopup="dialog"
            data-testid="hero-city-picker-trigger"
            title={`Current: ${heroCityName} (click to change)`}
          >
            <Globe size={12} aria-hidden style={{ opacity: 0.85 }} />
            <span className="tdp-city-picker-trigger-label">
              {heroCityName}
            </span>
            <kbd className="tdp-city-picker-kbd" aria-hidden>⌘K</kbd>
          </button>

          {/* 12h/24h toggle — sits at the top-right of the hero so it's
              visible without scrolling. */}
          <button
            type="button"
            className="tdp-btn tdp-btn--primary tdp-btn--sm tdp-hour-toggle"
            onClick={() => setHour12((v) => !v)}
            aria-label={hour12 ? "Switch to 24-hour clock" : "Switch to 12-hour clock with AM/PM"}
            aria-pressed={hour12}
            data-testid="hero-hour-toggle"
          >
            <Clock size={12} aria-hidden style={{ color: "rgba(255,255,255,0.95)" }} />
            <span className="tdp-hour-toggle-mode">{hour12 ? "12h" : "24h"}</span>
            <span className="tdp-hour-toggle-label">{hour12 ? "AM/PM" : "military"}</span>
          </button>
        </div>
      </div>

      {/* Full-width clock — lives outside .tdp-hero-inner so it can span
          up to min(1600px, 95vw) on ultrawide displays. Uses the active
          city's timezone (from the picker) for the visible time format. */}
      <HeroClock
        liveDate={liveDate}
        timezone={heroTimezone}
        sync={data?.sync}
        cityName={heroCityName}
        cityRegion={heroCityRegion}
        countryName={heroCountryName}
        sun={data?.sun}
        hour12={hour12}
        statusPills={data?.statusPills}
      />

      {/* City picker overlay — only mounted when open */}
      <CityPickerOverlay
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        trackedCities={trackedCities}
        activeCode={activeCode}
        onPick={handlePick}
        onAdd={handleAdd}
        onRemove={removeCity}
        count={trackedCount}
        max={trackedMax}
        canAddMore={canAddMore}
      />

      {/* First-visit welcome widget — surfaces the city picker to users
          who might miss the small button in the top-right. Only shows
          once per browser (controlled by tdp_cities_welcomed_v1 flag). */}
      <CityPickerWelcome
        activeCity={activeCity}
        defaultCities={DEFAULT_CITIES}
        onOpenPicker={() => setPickerOpen(true)}
        onConfirmActive={() => {
          // User confirmed the active city is correct — no-op beyond dismissal.
          // The active city is already what the hero shows.
        }}
      />
    </section>
  );
}

/* Tiny shared util — keeps Inter font consistent on the H1 in case HeroDateBlock is used outside this shell */
export { formatLongDateShared };
