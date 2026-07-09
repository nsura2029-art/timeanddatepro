// src/components/landing/HeroClock.tsx
// DSEG14-Classic-Bold numeric clock with 2-digit sub-second + sync drift +
// accuracy status. Renders HH:MM:SS big + :cc (centiseconds, smaller).
// Pulled from 03-horizon.html hero block; rendered into React while preserving
// the same visual (Inter 800-900 + DSEG14 + emerald glow + steps(2) colon blink).
//
// One component = ONE job: display the current time for a specific timezone
// plus the sync status from the browse/home payload.

import { useEffect, useRef, useState } from "react";
import { Sunrise, Sunset, Clock3 } from "lucide-react";
import type { BrowseHome } from "../../utils/homeApi";

interface HeroClockProps {
  /** Live ticker from parent (same Date instance used by App.tsx liveDate) */
  liveDate: Date;
  /** IANA timezone to format the clock into */
  timezone: string;
  /** Sync payload from browse/home ({ driftMs, accuracyMs }) */
  sync?: BrowseHome["sync"];
  /** City name to show in the "Time in {city}" footer line */
  cityName?: string;
  /** Country name shown after the city in the footer */
  countryName?: string;
  /** Optional sun pills rendered ABOVE the clock */
  sun?: BrowseHome["sun"];
}

function pad(n: number, len = 2) {
  return n.toString().padStart(len, "0");
}

function fmtClock(d: Date, tz: string) {
  // Use Intl so the clock honors DST without any extra work.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    hh: map.hour ?? "00",
    mm: map.minute ?? "00",
    ss: map.second ?? "00",
    // 2-digit sub-second: centiseconds (00-99).
    // Math.floor(ms/10) gives 0-99, padded to 2 digits.
    cs: pad(Math.floor(d.getMilliseconds() / 10), 2),
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

export function HeroClock({
  liveDate,
  timezone,
  sync,
  cityName = "Wesley Chapel",
  countryName = "United States",
  sun,
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

  const clock = fmtClock(liveDate, timezone);
  const driftSec = sync ? (sync.driftMs / 1000).toFixed(1) : "0.0";
  const driftDir = sync && sync.driftMs > 0 ? "behind" : "ahead";
  const driftDisplay = sync ? Math.abs(parseFloat(driftSec)).toFixed(1) : "0.0";
  const accuracyMs = sync ? Math.round(sync.accuracyMs) : 0;
  const accuracySec = (accuracyMs / 1000).toFixed(3);

  // SSR-safe: render placeholder on first paint, real values after mount.
  if (!mounted) {
    return (
      <div className="tdp-hero-clock">
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

  return (
    <div className="tdp-hero-clock">
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

      <div className="tdp-seven" aria-label={`Time ${clock.hh}:${clock.mm}:${clock.ss}.${clock.cs} in ${timezone}`}>
        <span>{clock.hh}</span>
        <span className="tdp-colon">:</span>
        <span>{clock.mm}</span>
        <span className="tdp-colon">:</span>
        <span>{clock.ss}</span>
        <span className="tdp-subsec-sep">:</span>
        <span className="tdp-subsec">{clock.cs}</span>
      </div>
      <div className="tdp-subsec-label">HH : MM : SS : CENTISECONDS</div>

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
              Time in <strong>{cityName}, {countryName}</strong> now.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { fmtSyncLine };
