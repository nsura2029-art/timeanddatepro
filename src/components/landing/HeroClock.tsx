// src/components/landing/HeroClock.tsx
// Bold-sans-serif (Inter 800-900) responsive clock with HH:MM:SS + sub-seconds.
//
// Format: HH:MM:SS.cc (e.g. 05:30:31.17)
// - HH:MM:SS — hours, minutes, seconds — all huge, in the same row
// - .cc       — 2-digit centiseconds — same row, smaller, lower opacity
// - AM/PM     — only in 12h mode — sits ABOVE the time as a small chip,
//               not inline. Toggling 12h ↔ 24h does NOT change the time
//               format — it only appears/disappears the AM/PM chip.
//
// Sub-seconds update at 60Hz via the parent's RAF ticker (liveDate prop),
// so the digits never feel static. SSR-safe — first paint shows "--"
// placeholders, real values come in after mount.

import { useEffect, useRef, useState } from "react";
import { MapPin, Check, Briefcase, Sun } from "lucide-react";
import type { BrowseHome } from "../../utils/homeApi";

interface HeroClockProps {
  /** Live ticker from parent (same Date instance used by App.tsx liveDate) */
  liveDate: Date;
  /** IANA timezone to format the clock into */
  timezone: string;
  /** Sync payload from browse/home ({ driftMs, accuracyMs }) */
  sync?: BrowseHome["sync"];
  /** City name to show in the "Current time in {city}" headline + below the clock */
  cityName?: string;
  /** Region/state name (e.g. "Florida", "England"). Optional. */
  cityRegion?: string;
  /** Country name shown after the city in the headline + footer line */
  countryName?: string;
  /** Optional sun pills rendered ABOVE the clock (legacy — kept for backward compat) */
  sun?: BrowseHome["sun"];
  /** 12-hour vs 24-hour display. Persisted at the App level. */
  hour12?: boolean;
  /** 3 status pills from the API (sync / business / sun) — replaces the legacy sun-above pills */
  statusPills?: BrowseHome["statusPills"];
}

function pad(n: number, len = 2) {
  return n.toString().padStart(len, "0");
}

interface FormattedClock {
  hh: string;
  mm: string;
  ss: string;
  cs: string;
  /** "AM" / "PM" in 12h mode, "" in 24h mode */
  ampm: string;
  /** "12h" / "24h" — used in the sub-second label */
  mode: "12h" | "24h";
}

function fmtClock(d: Date, tz: string, hour12: boolean): FormattedClock {
  // Use Intl so the clock honors DST without any extra work.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    hh: map.hour ?? "00",
    mm: map.minute ?? "00",
    ss: map.second ?? "00",
    cs: pad(Math.floor(d.getMilliseconds() / 10), 2),
    ampm: map.dayPeriod ?? "",
    mode: hour12 ? "12h" : "24h",
  };
}

/**
 * Build "City, Region, Country" handling missing region gracefully.
 * - "Wesley Chapel, Florida, United States"
 * - "London, England, United Kingdom"
 * - "Tokyo, Kantō, Japan"
 * - "Dubai, United Arab Emirates" (no region known)
 */
function formatLocationString(city: string, region?: string, country?: string): string {
  const segs: string[] = [];
  if (city) segs.push(city);
  if (region && region !== city) segs.push(region);
  if (country && country !== region && country !== city) segs.push(country);
  return segs.join(", ");
}

export function HeroClock({
  liveDate,
  timezone,
  sync,
  cityName,
  cityRegion,
  countryName,
  sun,
  hour12 = false,
  statusPills,
}: HeroClockProps) {
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [, force] = useState(0);

  // Force one re-render per RAF for smooth sub-second on systems that throttle setInterval.
  useEffect(() => {
    setMounted(true);
    function tick() {
      force((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const clock = fmtClock(liveDate, timezone, hour12);
  const driftSec = sync ? (sync.driftMs / 1000).toFixed(1) : "0.0";
  const driftDir = sync && sync.driftMs > 0 ? "behind" : "ahead";
  const driftDisplay = sync ? Math.abs(parseFloat(driftSec)).toFixed(1) : "0.0";
  const accuracyMs = sync ? Math.round(sync.accuracyMs) : 0;
  const accuracySec = (accuracyMs / 1000).toFixed(3);

  // Use the passed-in values directly; do NOT fall back to legacy defaults
  // (Wesley Chapel/Florida/United States) because that caused "Paris, Florida,
  // France" when switching from the home city to Paris. The parent always
  // passes real values (via the city picker), so defaults aren't needed.
  const safeCityName = cityName ?? "Wesley Chapel";
  const safeCityRegion = cityRegion;
  const safeCountryName = countryName ?? "United States";
  const locationString = formatLocationString(safeCityName, safeCityRegion, safeCountryName);

  // SSR-safe: render placeholder on first paint, real values after mount.
  if (!mounted) {
    return (
      <div className="tdp-hero-clock">
        <h1 className="tdp-hero-clock-loc">
          <MapPin size={14} aria-hidden />
          <span>Current time in {locationString}</span>
        </h1>
        <div className="tdp-seven">
          <span>--</span>
          <span className="tdp-colon">:</span>
          <span>--</span>
          <span className="tdp-colon">:</span>
          <span>--</span>
          <span className="tdp-subsec">--</span>
        </div>
      </div>
    );
  }

  // Compose accessible time string for screen readers
  const timeForAria = `${clock.hh}:${clock.mm}:${clock.ss}.${clock.cs}${clock.ampm ? " " + clock.ampm : ""}`;

  return (
    <div className="tdp-hero-clock">
      {/* Headline: "Current time in <City>, <Region>, <Country>" */}
      <h1 className="tdp-hero-clock-loc">
        <MapPin size={15} aria-hidden style={{ verticalAlign: "-2px" }} />
        <span>
          Current time in <strong>{cityName}</strong>
          {/* Skip region if it equals the city (avoids "New York, New York").
              Also skip if it equals the country (e.g. "Monaco, Monaco"). */}
          {cityRegion && cityRegion !== cityName && cityRegion !== countryName ? (
            <span>, <span className="tdp-hero-clock-region">{cityRegion}</span></span>
          ) : null}
          {countryName && countryName !== cityName ? <span>, {countryName}</span> : null}
        </span>
      </h1>

      {/* AM/PM chip — only in 12h mode, positioned ABOVE the time.
          The time format below stays identical in both modes; only
          this chip appears/disappears on toggle. */}
      {hour12 && clock.ampm && (
        <div className="tdp-ampm-above" aria-label={clock.ampm}>
          <span className="tdp-ampm-above-text">{clock.ampm}</span>
        </div>
      )}

      <div className="tdp-seven" aria-label={`Time ${timeForAria} in ${timezone}`}>
        <span>{clock.hh}</span>
        <span className="tdp-colon">:</span>
        <span>{clock.mm}</span>
        <span className="tdp-colon">:</span>
        <span>{clock.ss}</span>
        <span className="tdp-subsec-sep">.</span>
        <span className="tdp-subsec">{clock.cs}</span>
      </div>

      {sync && (
        <div className="tdp-sync">
          <div className="tdp-sync-row">
            <span className="tdp-marker tdp-marker-green" />
            <span>
              <strong>Your clock is {driftDisplay} seconds {driftDir}.</strong>
            </span>
          </div>
          <div className="tdp-sync-row">
            <span className="tdp-marker" />
            <span>
              Accuracy of synchronization was <strong>±{accuracySec.replace(/^0/, "")} seconds</strong>.
            </span>
          </div>
          {/* Day length — derived from the sun payload. Shows the user how
              long the sun is up today (e.g. "13h 48m"), a useful "fun fact"
              for the time page. */}
          {sun?.dayLength && (
            <div className="tdp-sync-row">
              <span className="tdp-marker" />
              <span>
                Day length <strong>{sun.dayLength}</strong>.
              </span>
            </div>
          )}
          <div className="tdp-sync-row">
            <span className="tdp-marker" />
            <span>
              Time in <strong>{locationString}</strong> now.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Render the 3 status pills (sync / business / sun) as colored chips.
 * Lives in HeroClock so the API consumer has a single import path,
 * but the pills themselves are rendered by the parent (LandingHeroHorizon)
 * to control layout. Exported as a separate component below.
 */
export function HeroStatusPills({ pills }: { pills?: BrowseHome["statusPills"] }) {
  if (!pills || pills.length === 0) return null;
  return (
    <div className="tdp-status-pills" role="list" aria-label="Current status">
      {pills.map((pill) => {
        const Icon = pill.icon === "check" ? Check : pill.icon === "briefcase" ? Briefcase : Sun;
        return (
          <div
            key={pill.id}
            role="listitem"
            className={`tdp-status-pill tdp-status-pill--${pill.variant}`}
            data-testid={`status-pill-${pill.id}`}
          >
            <Icon size={14} aria-hidden className="tdp-status-pill-icon" />
            <span className="tdp-status-pill-text">
              <span className="tdp-status-pill-message">{pill.message}</span>
              {pill.subtext && (
                <span className="tdp-status-pill-subtext"> · {pill.subtext}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { formatLocationString };
