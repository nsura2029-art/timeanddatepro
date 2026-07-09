// src/components/landing/WorldCupTeaser.tsx
// One-component-one-purpose: teaser for the 2026 FIFA World Cup.
// Shows:
//   - Tournament title + dates + 16 host cities with their local times
//   - Next upcoming match (if any) with host city local kickoff
//   - Link to the dedicated /worldcup page for the full schedule
//
// Style: same `.tdp-section` family as the other landing sections —
// no hard borders, horizontal rules + whitespace separate the elements.

import React, { useEffect, useState } from "react";
import { Trophy, MapPin, ChevronRight } from "lucide-react";
import {
  HOST_CITIES,
  MATCHES,
  getNextMatch,
  getHostCity,
  type Match,
} from "../../data/sports/worldCup2026";
import {
  formatMatchLocal,
  formatMatchUtc,
  timeUntilMatch,
  formatCityLocalTime,
  getCityOffset,
} from "../../utils/worldCupFormatters";

interface Props {
  /** Live ticker so city clocks update with the rest of the page */
  liveDate: Date;
  /** URL prefix for the lang segment (e.g. "/en" or "/fr") */
  langPrefix?: string;
}

export function WorldCupTeaser({ liveDate, langPrefix = "/en" }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Tick once a minute — city clocks don't need second-level resolution.
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nextMatch = getNextMatch(now);
  const nextHostCity = nextMatch ? getHostCity(nextMatch.cityCode) : null;
  const tournamentStart = new Date("2026-06-11T19:00:00-06:00");
  const tournamentEnd = new Date("2026-07-19T16:00:00-04:00");

  return (
    <section className="tdp-section" aria-label="FIFA World Cup 2026 host locations">
      <div className="tdp-section-label">
        <span className="tag" style={{ background: "var(--accent-warm)", color: "#1e293b" }}>
          <Trophy size={11} />
        </span>
        FIFA World Cup 2026
        <span className="meta">
          {formatTournamentDates(tournamentStart, tournamentEnd)} · 16 cities · 104 matches
        </span>
      </div>

      <div className="tdp-wc-intro">
        <p>
          The world's biggest sporting event touches three countries and sixteen time zones.
          Every host city runs on its own clock — here's what's happening right now in each.
        </p>
      </div>

      {/* 16-host-cities grid ------------------------------------- */}
      <div className="tdp-wc-cities-grid">
        {HOST_CITIES.map((city) => (
          <CityClockChip key={city.code} city={city} now={now} />
        ))}
      </div>

      {/* Next match banner ----------------------------------------- */}
      {nextMatch && nextHostCity && (
        <NextMatchBanner match={nextMatch} hostCity={nextHostCity} />
      )}

      {/* CTA to dedicated page ------------------------------------ */}
      <div className="tdp-wc-cta">
        <a
          href={`${langPrefix}/worldcup`}
          className="tdp-wc-cta-link"
          onClick={(e) => {
            if (typeof window === "undefined") return;
            e.preventDefault();
            window.history.pushState(null, "", `${langPrefix}/worldcup`);
            window.dispatchEvent(new Event("tdp:navigate"));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span>View full 2026 schedule — all 104 matches with local times</span>
          <ChevronRight size={14} />
        </a>
      </div>
    </section>
  );
}

function CityClockChip({
  city,
  now,
}: {
  city: typeof HOST_CITIES[number];
  now: Date;
}) {
  const localTime = formatCityLocalTime(now, city);
  const offset = getCityOffset(now, city);

  return (
    <div className="tdp-wc-city-chip">
      <div className="tdp-wc-city-chip-row">
        <MapPin size={10} style={{ color: "var(--accent-warm)", flexShrink: 0 }} />
        <span className="tdp-wc-city-name">{city.name}</span>
      </div>
      <div className="tdp-wc-city-clock">{localTime}</div>
      <div className="tdp-wc-city-meta">
        <span className="tdp-wc-city-flag">{flagEmoji(city.countryCode)}</span>
        <span className="tdp-wc-city-offset">UTC{offset}</span>
      </div>
    </div>
  );
}

function NextMatchBanner({
  match,
  hostCity,
}: {
  match: Match;
  hostCity: typeof HOST_CITIES[number];
}) {
  return (
    <div className="tdp-wc-next-banner">
      <div className="tdp-wc-next-eyebrow">Next match · {timeUntilMatch(match)}</div>
      <div className="tdp-wc-next-main">
        <div className="tdp-wc-next-teams">
          <span className="team">{match.home}</span>
          <span className="vs">vs</span>
          <span className="team">{match.away}</span>
        </div>
        <div className="tdp-wc-next-meta">
          <span className="tdp-wc-next-stage">
            {match.stage}
            {match.group ? ` · Group ${match.group}` : ""}
          </span>
          <span className="tdp-wc-next-venue">{match.stadium}, {hostCity.name}</span>
        </div>
        <div className="tdp-wc-next-time">
          <div className="tdp-wc-next-local">{formatMatchLocal(match, hostCity)}</div>
          <div className="tdp-wc-next-utc">({formatMatchUtc(match)})</div>
        </div>
      </div>
    </div>
  );
}

function formatTournamentDates(start: Date, end: Date): string {
  const startStr = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  }).format(start);
  const endStr = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(end);
  return `${startStr} – ${endStr}`;
}

function flagEmoji(countryCode: string): string {
  if (countryCode === "US") return "🇺🇸";
  if (countryCode === "CA") return "🇨🇦";
  if (countryCode === "MX") return "🇲🇽";
  return "";
}