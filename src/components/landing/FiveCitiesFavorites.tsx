// src/components/landing/FiveCitiesFavorites.tsx
// 5 live ticking city cards. One component = one purpose.
//
// Source: BrowseHome.topFive from /api/v1/browse/home.
// Each card ticks off the parent's `liveDate` prop (same Date instance as
// the hero clock) so all five cities re-render in lockstep with the DSEG7
// hero — no multiplied timers, no drift.
//
// Clicking a card emits a `tdp:add-city` event with the city code; the
// App-level listener handles persistence + re-render of the chrome.

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
        <span className="meta">5 LIVE · ticking every second</span>
      </div>
      <div className="tdp-cities-row">
        {cities.slice(0, 5).map((c) => (
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
      className="tdp-city-card"
      onClick={() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("tdp:add-city", { detail: { code: city.code } })
        );
      }}
      aria-label={`Open ${city.name} detail`}
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
    </button>
  );
}