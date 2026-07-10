// src/components/landing/UserCitiesExploreCards.tsx
// Explore-style NotebookLM cards for user-added cities.
//
// Sits BELOW the live favorites ticker row and shows the same user-added
// cities as NotebookLM-style cards (gradient bg + icon chip + tagline +
// label + arrow). Each card cycles through the 9-color NotebookLM
// palette by add-order index.
//
// One component = one purpose: visual "favorites gallery" using the same
// design language as the tool cards above.
//
// Why a separate component: the live ticker (FiveCitiesFavorites) is
// information-dense (live time, offset, country) and stays compact.
// These cards are flatter — they emphasize the *list* of user-added
// cities with a richer visual treatment, useful for SEO (each card has
// a real anchor + descriptive label) and quick scanning.

import React from "react";
import { MapPin, X } from "lucide-react";
import type { CityEntry } from "../../data/cities";
import {
  formatShortOffsetShared,
} from "../../utils/landingFormatters";
import "../../styles/notebooklm-palette.css";

interface Props {
  /** Cities the user has added — must match those in FiveCitiesFavorites. */
  userAdded: CityEntry[];
}

const NLM_PALETTE_ORDER = [
  "indigo", "emerald", "amber", "cyan",
  "purple", "blue", "pink", "lime",
  "red",
] as const;
type NlmPalette = (typeof NLM_PALETTE_ORDER)[number];

function paletteForIndex(idx: number): NlmPalette {
  return NLM_PALETTE_ORDER[idx % NLM_PALETTE_ORDER.length];
}

/** Build a tagline from country + offset (e.g. "Japan · UTC+9") */
function taglineForCity(city: CityEntry, offset: string): string {
  return `${city.country} · UTC${offset}`;
}

export function UserCitiesExploreCards({ userAdded }: Props) {
  if (userAdded.length === 0) return null;

  return (
    <section className="tdp-section" aria-label="Your added cities">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--nlm-emerald-500, #10b981)", color: "white" }}>★</span>
        Your added cities
        <span className="meta">
          {userAdded.length} favorite{userAdded.length === 1 ? "" : "s"} · click × to remove
        </span>
      </div>
      <div className="tdp-user-cities-explore">
        {userAdded.map((c, idx) => {
          const palette = paletteForIndex(idx);
          // We need the offset at render time, but the formatter takes
          // a Date. Use today's date at noon UTC — offset doesn't change
          // within a day for any city in practice.
          const now = new Date();
          const offset = formatShortOffsetShared(now, c.timezone);
          return (
            <div
              key={c.code}
              className={`tdp-user-city-card nlm-card-${palette}`}
            >
              <div className="tdp-user-city-icon nlm-icon-chip" aria-hidden>
                <MapPin size={16} />
              </div>
              <div className="tdp-user-city-body">
                <div className="tdp-user-city-tagline">{taglineForCity(c, offset)}</div>
                <div className="tdp-user-city-label">{c.name}</div>
                <div className="tdp-user-city-meta">
                  {c.timezone.split("/").slice(-1)[0].replace(/_/g, " ")} · {c.countryCode}
                </div>
              </div>
              <button
                type="button"
                className="tdp-user-city-remove"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  window.dispatchEvent(
                    new CustomEvent("tdp:add-city", { detail: { code: c.code } })
                  );
                }}
                aria-label={`Remove ${c.name} from your favorites`}
                title={`Remove ${c.name}`}
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}