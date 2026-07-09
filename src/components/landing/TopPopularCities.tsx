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
  favoriteCodes?: string[];
}

export function TopPopularCities({ liveDate, cities, favoriteCodes = [] }: Props) {
  if (!cities || cities.length === 0) return null;

  return (
    <section className="tdp-section" aria-label="Top 20 most popular cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-tertiary)", color: "white" }}>↻</span>
        Top 20 · most popular
        <span className="meta">click ★ to add to your favorites</span>
      </div>
      <div className="tdp-cities-row tdp-cities-row--popular">
        {cities.slice(0, 20).map((c) => (
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
      className={`tdp-city-card${isFavorite ? " is-favorite" : ""}`}
      onClick={() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("tdp:add-city", { detail: { code: city.code } })
        );
      }}
      aria-label={
        isFavorite
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
      {/* Star: filled = already a favorite, hollow = click to add */}
      <span
        className={`fav-star${isFavorite ? " filled" : ""}`}
        aria-hidden="true"
      >
        {isFavorite ? "★" : "☆"}
      </span>
    </button>
  );
}