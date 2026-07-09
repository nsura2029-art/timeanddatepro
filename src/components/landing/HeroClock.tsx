// src/components/landing/HeroClock.tsx
// DSEG14-Classic-Bold numeric clock with 2-digit sub-second + sync drift +
// accuracy status. Renders HH:MM:SS big + :cc (centiseconds, smaller).
//
// Above the clock itself, an h1 "Current time in {City}, {Region}, {Country}"
// primes what the user is about to see and updates as they change city.
// Default values are now dynamic — LandingHeroHorizon passes the live city
// info up from CITY_DATA, so "London, England, United Kingdom" renders for
// a London visitor without any code change.

import { useEffect, useRef, useState } from "react";
import { Sunrise, Sunset, Clock3, MapPin } from "lucide-react";
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
  /** Optional sun pills rendered ABOVE the clock */
  sun?: BrowseHome["sun"];
  /** 12-hour vs 24-hour display. Persisted at the App level. */
  hour12?: boolean;
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

function fmtSyncLine(driftMs: number, locale: "en" | "fr" | "zh" | "ja" = "en") {
  const absMs = Math.abs(driftMs);
  const ahead = driftMs > 0;
  const tenths = (absMs / 1000).toFixed(1);
  if (locale === "fr") return `Votre horloge a ${tenths} secondes de ${ahead ? "retard" : "avance"}.`;
  if (locale === "zh") return `您的系统时钟${ahead ? "慢了" : "快了"} ${tenths} 秒。`;
  if (locale === "ja") return `お使いの時計は${tenths}秒${ahead ? "遅れています" : "進んでいます"}。`;
  return `Your clock is ${tenths} seconds ${ahead ? "behind" : "ahead"}.`;
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
  cityName = "Wesley Chapel",
  cityRegion = "Florida",
  countryName = "United States",
  sun,
  hour12 = false,
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

  const locationString = formatLocationString(cityName, cityRegion, countryName);

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
          <span className="tdp-subsec-sep">:</span>
          <span className="tdp-subsec">--</span>
        </div>
        <div className="tdp-subsec-label">HH : MM : SS : CENTISECONDS</div>
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
        <span>Current time in <strong>{cityName}</strong>{cityRegion ? <span>, <span className="tdp-hero-clock-region">{cityRegion}</span></span> : null}{countryName ? <span>, {countryName}</span> : null}</span>
      </h1>

      {/* Sun pills above the clock */}
      {sun && (
        <div className="tdp-sun-above">
          {sun.sunrise && (
            <div className="tdp-sun-pill">
              <Sunrise size={14} aria-hidden />
              <span>↑ {sun.sunrise}</span>
            </div>
          )}
          {sun.sunset && (
            <div className="tdp-sun-pill">
              <Sunset size={14} aria-hidden />
              <span>↓ {sun.sunset}</span>
            </div>
          )}
          <div className="tdp-sun-pill">
            <Clock3 size={14} aria-hidden />
            <span>
              Day length <strong>{sun.dayLength}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="tdp-seven" aria-label={`Time ${timeForAria} in ${timezone}`}>
        <span>{clock.hh}</span>
        <span className="tdp-colon">:</span>
        <span>{clock.mm}</span>
        <span className="tdp-colon">:</span>
        <span>{clock.ss}</span>
        {/* AM/PM chip — only renders in 12h mode */}
        {hour12 && clock.ampm && (
          <span className="tdp-ampm">{clock.ampm}</span>
        )}
        <span className="tdp-subsec-sep">:</span>
        <span className="tdp-subsec">{clock.cs}</span>
      </div>
      <div className="tdp-subsec-label">
        {hour12 ? "HH : MM : SS AM/PM : CENTISECONDS" : "HH : MM : SS : CENTISECONDS"}
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

export { fmtSyncLine, formatLocationString };