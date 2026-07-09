// src/components/landing/TopPopularCities.tsx
// Top-20 most-popular cities. One component = one purpose: surface the
// click-to-add cards so the user can build out their favorites from the
// most-looked-up list.
//
// Visual: same `.tdp-city-card` chip used in FiveCitiesFavorites — LIVE
// dot + city name + country + ticking HH:MM:SS.cc + offset. No rank
// numbers. A hollow/filled star in the top-right indicates favorite state.
//
// Source: BrowseHome.topTwenty from /api/v1/browse/home.
// Click → toggles city in/out of favorites (App-level listener writes to
// localStorage and re-renders the favorites grid above, with the new
// card appearing on the next row of the wraparound grid).

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
  /** Codes that are visibly part of the favorites row above.
   * Includes BOTH the curated defaults (always on) AND the user's
   * localStorage additions. Click toggles user-added only — defaults
   * can't be removed, so this distinction matters for the click handler.
   */
  favoriteCodes?: string[];
  /** Codes of just the curated defaults (so we know what's removable). */
  defaultCodes?: string[];
}

export function TopPopularCities({
  liveDate,
  cities,
  favoriteCodes = [],
  defaultCodes = [],
}: Props) {
  if (!cities || cities.length === 0) return null;

  // Hide the 5 default cities from the Top 20 grid — they're already
  // visible in the favorites row above, so showing them here too is
  // redundant. The user can still see them marked as favorite (if they
  // happen to scroll) by checking the home row.
  const defaultSet = new Set(defaultCodes);
  const nonDefault = cities.filter((c) => !defaultSet.has(c.code));
  if (nonDefault.length === 0) return null;

  return (
    <section className="tdp-section" aria-label="Top 20 most popular cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-tertiary)", color: "white" }}>↻</span>
        Top 20 · most popular
        <span className="meta">click ★ to add to your favorites</span>
      </div>
      <div className="tdp-cities-row tdp-cities-row--popular">
        {nonDefault.slice(0, 20).map((c) => (
          <PopularCityCard
            key={c.code}
            city={c}
            liveDate={liveDate}
            isFavorite={favoriteCodes.includes(c.code)}
            isDefault={defaultCodes.includes(c.code)}
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
  isDefault,
}: {
  city: CityEntry;
  liveDate: Date;
  isFavorite: boolean;
  /** True if this city is one of the curated defaults (not removable). */
  isDefault: boolean;
}) {
  const hh = formatTimeHHMMSSShared(liveDate, city.timezone);
  const sub = formatSubsecShared(liveDate);
  const offset = formatShortOffsetShared(liveDate, city.timezone);

  // For default cities, show the filled star but the card is not
  // interactive (no click to remove). The visual still shows them as
  // "favorite" so the user can spot them at a glance.
  const star = isFavorite ? "★" : "☆";
  const starClass = `fav-star${isFavorite ? " filled" : ""}`;

  return (
    <button
      type="button"
      className={`tdp-city-card${isFavorite ? " is-favorite" : ""}${
        isDefault ? " tdp-city-card--default-mark" : ""
      }`}
      // Default cards still dispatch the event, but the App.tsx handler
      // is no-op for them (it only manages user-added).
      onClick={() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("tdp:add-city", { detail: { code: city.code } })
        );
      }}
      aria-label={
        isDefault
          ? `${city.name} — already in your default favorites`
          : isFavorite
            ? `Remove ${city.name} from favorites`
            : `Add ${city.name} to favorites`
      }
      aria-pressed={isFavorite}
      style={{ all: "unset", cursor: "pointer" }}
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
      <div className="tz">{city.timezone.split("/").slice(-1)[0]} · UTC{offset}</div>
      <span className={starClass} aria-hidden="true">{star}</span>
    </button>
  );
}