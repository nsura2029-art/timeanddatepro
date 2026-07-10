// src/components/landing/TopPopularCities.tsx
// Top 50+ most-popular cities. One component = one purpose: surface the
// world's most-looked-up timezones so the user can click any of them
// and have the hero reload with that city's local time.
//
// Visual: clean list-of-rows. Each card is a click target with the city
// row, country, ticking HH:MM:SS.cc clock, and short UTC label. No
// colored backgrounds, no star icons, no favorite toggling — purely a
// navigational entry point.
//
// Row dividers: a thin 1px line is inserted between every row of cards
// (via grid background-image + calculated row-gap). Tinted with the
// hero's `--section-rule` token so it inherits whatever theme the user
// is in. No green/emerald — keeps the section visually quiet so the
// FiveCitiesFavorites row above stays the visual anchor.
//
// Click → dispatches `tdp:show-city` with the city code. App.tsx listens
// for this event, updates the home-timezone preferences, and the hero
// re-renders with the new city's local time. Window also scrolls
// smoothly to the top so the user sees the clock update immediately.

import React from "react";
import type { CityEntry } from "../../data/cities";
import {
  formatTimeHHMMSSShared,
  formatSubsecShared,
  formatShortOffsetShared,
} from "../../utils/landingFormatters";

interface Props {
  liveDate: Date;
  cities: CityEntry[];
  /** Codes that are visibly part of the favorites row above. Used so we
   *  can visually mark those (subtle outline) without changing their
   *  click behavior — they're still navigable like any other card. */
  favoriteCodes?: string[];
  /** Codes of the curated defaults (NYC/LDN/TYO/PAR/DXB). Same visual
   *  hint as favoriteCodes, but kept separate so future i18n-aware
   *  features can distinguish user-pick vs curated-default. */
  defaultCodes?: string[];
}

export function TopPopularCities({
  liveDate,
  cities,
  favoriteCodes = [],
  defaultCodes = [],
}: Props) {
  if (!cities || cities.length === 0) return null;

  // Skip the 5 curated defaults here — they're already in the favorites
  // row above (FiveCitiesFavorites). Duplicating them in the
  // click-to-navigate grid is noise; we keep the user's picking list
  // pure. Visual `isFavorite` hint is preserved on whatever user-picks
  // they happen to have favorited via the favorites row.
  const defaultSet = new Set(defaultCodes);
  const navigable = cities.filter((c) => !defaultSet.has(c.code));
  if (navigable.length === 0) return null;

  return (
    <section className="tdp-section tdp-section--popular" aria-label="Top 50+ most popular cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-tertiary)", color: "white" }}>↻</span>
        Top {navigable.length} · most popular
        <span className="meta">click any city to view its local time</span>
      </div>
      <div className="tdp-cities-row tdp-cities-row--popular tdp-cities-row--rows-divider">
        {navigable.slice(0, 60).map((c) => (
          <PopularCityCard
            key={c.code}
            city={c}
            liveDate={liveDate}
            isFavorite={favoriteCodes.includes(c.code)}
          />
        ))}
      </div>
    </section>
  );
}

function PopularCityCard({
  city,
  liveDate,
  isFavorite,
}: {
  city: CityEntry;
  liveDate: Date;
  isFavorite: boolean;
}) {
  const hh = formatTimeHHMMSSShared(liveDate, city.timezone);
  const sub = formatSubsecShared(liveDate);
  const offset = formatShortOffsetShared(liveDate, city.timezone);

  return (
    <button
      type="button"
      className={`tdp-city-card tdp-city-card--popular${isFavorite ? " is-favorite" : ""}`}
      onClick={() => {
        if (typeof window === "undefined") return;
        // Dispatch the show-city event — App.tsx listens, updates prefs,
        // re-renders hero with this timezone, and scrolls the page to
        // top so the user sees the change immediately.
        window.dispatchEvent(
          new CustomEvent("tdp:show-city", {
            detail: {
              code: city.code,
              name: city.name,
              country: city.country,
              countryCode: city.countryCode,
              timezone: city.timezone,
            },
          }),
        );
        // Smooth-scroll to the top of the page so the user sees the
        // hero clock change. The hero is at the very top of the page
        // (above this section in the layout), so we scroll the
        // document to top.
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          window.scrollTo(0, 0);
        }
      }}
      aria-label={`View current time in ${city.name}, ${city.country}`}
      data-city-code={city.code}
      data-testid={`popular-city-${city.code}`}
    >
      <div className="row-top">
        <span className="live-dot" aria-hidden="true" />
        <span>LIVE</span>
        <span className="tz" style={{ marginLeft: "auto" }}>{city.countryCode}</span>
      </div>
      <div className="city">{city.name}</div>
      <div className="country">{city.country}</div>
      <div className="clock">
        {hh}<span className="subsec">.{sub}</span>
      </div>
      <div className="tz">
        {city.timezone.split("/").slice(-1)[0].replace(/_/g, " ")} · UTC{offset}
      </div>
    </button>
  );
}
