// src/components/landing/TopPopularCities.tsx
// Top-20 most-popular cities. One component = one purpose: surface the
// click-to-swap grid so the user can rotate any of the 5 favorites.
//
// Source: BrowseHome.topTwenty from /api/v1/browse/home.
// Each row shows rank + name + country + live clock (off the same ticker).
// Click → dispatch `tdp:swap-city` event with the city code; chrome
// persists + re-renders the favorites row above.

import React from "react";
import type { CityEntry } from "../../data/cities";
import {
  formatTimeHHMMSSShared,
} from "../../utils/landingFormatters";

interface Props {
  liveDate: Date;
  cities: CityEntry[];
  favoriteCodes?: string[]; // visual highlight for current favorites
}

export function TopPopularCities({ liveDate, cities, favoriteCodes = [] }: Props) {
  if (!cities || cities.length === 0) return null;

  return (
    <section className="tdp-section" aria-label="Top 20 most popular cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-tertiary)", color: "white" }}>↻</span>
        Top 20 · most popular
        <span className="meta">click to swap into your 5</span>
      </div>
      <div className="tdp-popular-sub">
        The 20 cities most looked up across the globe. Click any row to swap it into your favorites.
      </div>
      <div className="tdp-pop-grid">
        {cities.slice(0, 20).map((c, i) => {
          const isFav = favoriteCodes.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              className={`tdp-pop-row${isFav ? " is-favorite" : ""}`}
              style={{ all: "unset", cursor: "pointer", display: "flex" }}
              onClick={() => {
                if (typeof window === "undefined") return;
                window.dispatchEvent(
                  new CustomEvent("tdp:swap-city", { detail: { code: c.code } })
                );
              }}
              aria-label={`Swap ${c.name} into favorites`}
            >
              <span className="rank">{String(i + 1).padStart(2, "0")}</span>
              <span className="name">{c.name}</span>
              <span className="country">{c.countryCode}</span>
              <span className="clock">{formatTimeHHMMSSShared(liveDate, c.timezone)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}