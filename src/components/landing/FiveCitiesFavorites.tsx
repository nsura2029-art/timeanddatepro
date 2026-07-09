// src/components/landing/FiveCitiesFavorites.tsx
// Live ticking city cards — the user's favorites. One component = one purpose.
//
// Renders every city in the favorites list (no hard 5-cap). The grid wraps
// to the next row when the user adds beyond 5 cities via TopPopularCities,
// so a 6th, 7th... favorite shows up on the next row visually.
//
// Source: list of CityEntry passed in from LandingPage (resolved from
// localStorage tdp_user_cities + the browse/home topFive fallback).
// Each card ticks off the parent's `liveDate` prop (same Date instance as
// the hero clock) so all cities re-render in lockstep with the DSEG14
// hero — no multiplied timers, no drift.
//
// Clicking a card emits a `tdp:add-city` event with the city code; the
// App-level listener toggles it OUT of the favorites list (so a filled
// star becomes a hollow star).

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
}

export function FiveCitiesFavorites({ liveDate, cities }: Props) {
  if (!cities || cities.length === 0) return null;

  return (
    <section className="tdp-section" aria-label="Your favorite cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-coral)", color: "white" }}>★</span>
        Your favorite cities
        <span className="meta">
          {cities.length} LIVE · ticking every second
          <span className="meta-hint"> · click ★ to remove</span>
        </span>
      </div>
      <div className="tdp-cities-row">
        {cities.map((c) => (
          <CityTickerCard key={c.code} city={c} liveDate={liveDate} />
        ))}
      </div>
    </section>
  );
}

function CityTickerCard({ city, liveDate }: { city: CityEntry; liveDate: Date }) {
  const hh = formatTimeHHMMSSShared(liveDate, city.timezone);
  const sub = formatSubsecShared(liveDate);
  const offset = formatShortOffsetShared(liveDate, city.timezone);

  return (
    <button
      type="button"
      className="tdp-city-card is-favorite"
      onClick={() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("tdp:add-city", { detail: { code: city.code } })
        );
      }}
      aria-label={`Remove ${city.name} from favorites`}
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
      {/* Filled star — clicking removes from favorites */}
      <span className="fav-star filled" aria-hidden="true">★</span>
    </button>
  );
}