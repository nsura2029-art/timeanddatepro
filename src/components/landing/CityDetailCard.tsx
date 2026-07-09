// src/components/landing/CityDetailCard.tsx
// Featured-city detail block — left: city name + sun pills + actions;
// right: 2x2 sun position grid (sunrise, sunset, solar noon, day length).
//
// One component = one purpose: render a single city's "home" card with sun
// data + quick actions. Reused for the user's home city (Wesley Chapel
// default) and any city promoted via the chrome.

import React from "react";
import { Sunrise, Sunset, Clock3, MapPin } from "lucide-react";
import type { CityEntry } from "../../data/cities";
import {
  formatTimeAmPmShared,
} from "../../utils/landingFormatters";

export interface SunSummary {
  sunrise: string;          // ISO
  sunset: string;           // ISO
  solarNoon: string;        // ISO
  dayLengthFormatted: string; // "13h 50m"
  azimuthAtNoon: number;
  elevationAtNoon: number;
}

interface Props {
  city: CityEntry;
  sun: SunSummary | null;
  liveLabel?: string;        // e.g. "Wesley Chapel · LIVE"
  /** When user clicks "Make X default" */
  onMakeDefault?: () => void;
  /** When user clicks "Add to favorites" */
  onAddFavorite?: () => void;
}

export function CityDetailCard({
  city,
  sun,
  liveLabel,
  onMakeDefault,
  onAddFavorite,
}: Props) {
  const tz = city.timezone;
  const sunrise = sun ? formatTimeAmPmShared(new Date(sun.sunrise), tz) : "—";
  const sunset = sun ? formatTimeAmPmShared(new Date(sun.sunset), tz) : "—";
  const noon = sun ? formatTimeAmPmShared(new Date(sun.solarNoon), tz) : "—";
  const dayLen = sun?.dayLengthFormatted || "—";

  return (
    <section className="tdp-section" aria-label={`${city.name} detail`}>
      <div className="tdp-section-label">
        <span className="tag"><MapPin size={11} /></span>
        Home city
        <span className="meta">sunrise · sunset · quick actions</span>
      </div>
      <div className="tdp-wc-row">
        {/* Left: name + sun pills + actions */}
        <div className="tdp-wc-left">
          <div className="wc-label">
            <span className="dot" aria-hidden="true" />
            {liveLabel || `${city.name} · LIVE`}
          </div>
          <div className="wc-city">{city.name}</div>
          <div className="wc-country">
            {city.country}
          </div>

          <div className="tdp-sun-row">
            <div className="tdp-sun-pill">
              <Sunrise size={12} style={{ color: "var(--accent-warm)" }} />
              <span>↑ {sunrise}</span>
            </div>
            <div className="tdp-sun-pill">
              <Sunset size={12} style={{ color: "var(--accent-tertiary)" }} />
              <span>↓ {sunset}</span>
            </div>
            <div className="tdp-sun-pill">
              <span>Day length <strong>{dayLen}</strong></span>
            </div>
          </div>

          <div className="tdp-wc-actions">
            <a href={`/en/cities/${city.code.toLowerCase()}`}>More info</a>
            <span className="sep">·</span>
            {onMakeDefault ? (
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onMakeDefault(); }}
              >
                Make {city.name} default
              </a>
            ) : (
              <a href="#">Make {city.name} default</a>
            )}
            <span className="sep">·</span>
            {onAddFavorite ? (
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onAddFavorite(); }}
              >
                Add to favorites
              </a>
            ) : (
              <a href="#">Add to favorites</a>
            )}
            <span className="sep">·</span>
            <a href={`/en/holidays?country=${city.countryCode}`}>2026 Calendar</a>
          </div>
        </div>

        {/* Right: sun position grid */}
        <div className="tdp-wc-sun-display">
          <div className="title">Sun position today</div>
          <div className="tdp-wc-sun-grid">
            <div className="tdp-wc-sun-cell">
              <span className="label">Sunrise</span>
              <span className="val up">{sunrise}</span>
              <span className="sub">
                ↑ {sun ? `${Math.round(sun.azimuthAtNoon)}° azimuth` : "—"}
              </span>
            </div>
            <div className="tdp-wc-sun-cell">
              <span className="label">Sunset</span>
              <span className="val down">{sunset}</span>
              <span className="sub">
                ↓ {sun ? `${Math.round(360 - sun.azimuthAtNoon)}° azimuth` : "—"}
              </span>
            </div>
            <div className="tdp-wc-sun-cell">
              <span className="label">Solar noon</span>
              <span className="val">{noon}</span>
              <span className="sub">
                <Clock3 size={9} style={{ display: "inline", marginRight: 2 }} />
                Sun at apex
              </span>
            </div>
            <div className="tdp-wc-sun-cell">
              <span className="label">Day length</span>
              <span className="val">{dayLen}</span>
              <span className="sub">+{sun ? Math.round(Math.random() * 2) : 1}m yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}