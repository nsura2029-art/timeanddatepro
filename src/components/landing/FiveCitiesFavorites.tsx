// src/components/landing/FiveCitiesFavorites.tsx
// Live ticking city cards — the user's favorites. One component = one purpose.
//
// Two visual groups in one continuous grid:
//   - **Defaults** (row 1): the curated 5 cities from browse/home.topFive.
//     Always shown, never removed. Neutral white cards with dotted outline.
//   - **User-added** (rows 2+): every city the user has clicked in
//     TopPopularCities. Each gets a unique color from the NotebookLM
//     9-color palette based on its add-order index (cycles through the
//     palette so colors don't repeat adjacent). Click to remove.
//
// Layout: a single 5-col grid that wraps naturally. Defaults take row 1
// (and any overflow on smaller screens). User additions fill the next
// row, then the next, etc. — exactly the "next row" UX from user feedback.
//
// Source: defaults come from LandingPage's browse/home.topFive fallback;
// user-added codes come from localStorage tdp_user_cities (resolved via
// browse/home.topTwenty → CITY_BY_CODE in LandingPage).
//
// Each card ticks off the parent's `liveDate` prop (same Date instance as
// the hero clock) so all cities re-render in lockstep with the DSEG14
// hero — no multiplied timers, no drift.

import React from "react";
import type { CityEntry } from "../../data/cities";
import {
  formatTimeHHMMSSShared,
  formatSubsecShared,
  formatShortOffsetShared,
} from "../../utils/landingFormatters";
import "../../styles/notebooklm-palette.css";

interface Props {
  liveDate: Date;
  /** Curated 5 — always shown in row 1, non-interactive. */
  defaults: CityEntry[];
  /** Cities the user has added by clicking TopPopularCities — removable. */
  userAdded: CityEntry[];
}

/** NotebookLM palette order for cycling through user-added city cards.
 * Index 0 → indigo, 1 → emerald, etc. Matches the visual rhythm in the
 * reference screenshot where each card has a distinct color. */
const NLM_PALETTE_ORDER = [
  "indigo", "emerald", "amber", "cyan",
  "purple", "blue", "pink", "lime",
  "red",
] as const;
type NlmPalette = (typeof NLM_PALETTE_ORDER)[number];

function paletteForIndex(idx: number): NlmPalette {
  return NLM_PALETTE_ORDER[idx % NLM_PALETTE_ORDER.length];
}

export function FiveCitiesFavorites({ liveDate, defaults, userAdded }: Props) {
  if (defaults.length === 0 && userAdded.length === 0) return null;

  const totalCount = defaults.length + userAdded.length;
  const addedNote = userAdded.length > 0
    ? ` · click ★ to remove your additions`
    : " · click ★ in Top 20 to add your own";

  return (
    <section className="tdp-section" aria-label="Your favorite cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-coral)", color: "white" }}>★</span>
        Your favorite cities
        <span className="meta">
          {totalCount} LIVE · ticking every second
          <span className="meta-hint">{addedNote}</span>
        </span>
      </div>
      <div className="tdp-cities-row">
        {/* Row 1 — curated defaults. Non-interactive, neutral style. */}
        {defaults.map((c) => (
          <DefaultCityTickerCard key={`d-${c.code}`} city={c} liveDate={liveDate} />
        ))}
        {/* Rows 2+ — user-added. Each gets a unique NotebookLM palette color. */}
        {userAdded.map((c, idx) => (
          <RemovableCityTickerCard
            key={`u-${c.code}`}
            city={c}
            liveDate={liveDate}
            palette={paletteForIndex(idx)}
          />
        ))}
      </div>
    </section>
  );
}

function DefaultCityTickerCard({ city, liveDate }: { city: CityEntry; liveDate: Date }) {
  const hh = formatTimeHHMMSSShared(liveDate, city.timezone);
  const sub = formatSubsecShared(liveDate);
  const offset = formatShortOffsetShared(liveDate, city.timezone);

  // Default card — no click, no star (always-on, can't be removed).
  return (
    <div
      className="tdp-city-card tdp-city-card--default"
      aria-label={`${city.name} — always in your favorites`}
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
    </div>
  );
}

function RemovableCityTickerCard({
  city,
  liveDate,
  palette,
}: {
  city: CityEntry;
  liveDate: Date;
  palette: NlmPalette;
}) {
  const hh = formatTimeHHMMSSShared(liveDate, city.timezone);
  const sub = formatSubsecShared(liveDate);
  const offset = formatShortOffsetShared(liveDate, city.timezone);

  return (
    <button
      type="button"
      className={`tdp-city-card is-favorite nlm-card-${palette}`}
      onClick={() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("tdp:add-city", { detail: { code: city.code } })
        );
      }}
      aria-label={`Remove ${city.name} from your favorites`}
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
      {/* Filled star — click to remove from user-added */}
      <span className="fav-star filled" aria-hidden="true">★</span>
    </button>
  );
}