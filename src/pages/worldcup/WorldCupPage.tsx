// src/pages/worldcup/WorldCupPage.tsx
// Dedicated page for the 2026 FIFA World Cup — modeled after
// time.is/FIFA_world_cup_2026_schedule with a cleaner design.
//
// One component = one purpose: full tournament view including:
//   - Header with dates + 16 host cities (large cards with live local time)
//   - Full schedule grouped by stage (Group → R16 → QF → SF → 3rd → Final)
//   - Each match: kickoff in host city local time + UTC, stadium, teams
//
// Time ticker: refreshed every minute (city clocks don't need second
// resolution; full schedule is date-based so no need for second-level
// precision anywhere on this page).

import React, { useEffect, useState } from "react";
import { Trophy, ArrowLeft, MapPin } from "lucide-react";
import {
  HOST_CITIES,
  MATCHES,
  STAGE_ORDER,
  groupByStage,
  type Match,
} from "../../data/sports/worldCup2026";
import {
  formatCityLocalTime,
  formatMatchTimeOnly,
  formatMatchUtc,
  getCityOffset,
  formatMatchDateOnly,
} from "../../utils/worldCupFormatters";

export function WorldCupPage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const grouped = groupByStage(MATCHES);

  return (
    <div className="tdp-wc-page">
      {/* Header ----------------------------------------------------- */}
      <header className="tdp-wc-page-header">
        <a
          href="/en"
          className="tdp-wc-back-link"
          onClick={(e) => {
            if (typeof window === "undefined") return;
            e.preventDefault();
            window.history.pushState(null, "", "/en");
            window.dispatchEvent(new Event("tdp:navigate"));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <ArrowLeft size={13} />
          <span>Back to TimeAndDatePro</span>
        </a>

        <div className="tdp-section-label" style={{ marginTop: 16, marginBottom: 0 }}>
          <span className="tag" style={{ background: "var(--accent-warm)", color: "#1e293b" }}>
            <Trophy size={11} />
          </span>
          FIFA World Cup 2026
          <span className="meta">
            June 11 – July 19, 2026 · 16 cities · 104 matches
          </span>
        </div>

        <h1 className="tdp-wc-page-title">Every match. Every host city. Local time.</h1>
        <p className="tdp-wc-page-sub">
          Three countries. Sixteen time zones. The 2026 FIFA World Cup runs across the
          United States, Canada, and Mexico — kickoff times below are projected into each
          host city's local clock so you never have to do the math yourself.
        </p>
      </header>

      {/* 16 host cities (big cards) ---------------------------------- */}
      <section>
        <h2 className="tdp-wc-stage-header">Host cities · live local time</h2>
        <div className="tdp-wc-page-cities">
          {HOST_CITIES.map((city) => (
            <CityCard key={city.code} city={city} now={now} />
          ))}
        </div>
      </section>

      {/* Schedule ---------------------------------------------------- */}
      <section className="tdp-wc-schedule">
        <h2 className="tdp-wc-stage-header">Schedule</h2>
        {STAGE_ORDER.map((stage) => {
          const matches = grouped[stage] ?? [];
          if (matches.length === 0) return null;
          return (
            <StageBlock key={stage} stage={stage} matches={matches} />
          );
        })}
      </section>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--section-rule)", fontSize: 11, color: "var(--hero-text-muted)", fontFamily: "var(--hero-mono-font)" }}>
        Sources: fifa.com, en.wikipedia.org/wiki/2026_FIFA_World_Cup.
        Team placeholders reflect FIFA's seeding convention — actual teams confirmed
        after the late-2025 draw.
      </footer>
    </div>
  );
}

function CityCard({
  city,
  now,
}: {
  city: typeof HOST_CITIES[number];
  now: Date;
}) {
  const localTime = formatCityLocalTime(now, city);
  const offset = getCityOffset(now, city);

  return (
    <div className="tdp-wc-page-city-card">
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <MapPin size={11} style={{ color: "var(--accent-warm)" }} />
        <span className="tdp-wc-page-city-name">{city.name}</span>
      </div>
      <span className="tdp-wc-page-city-stadium">{city.stadium}</span>
      <span className="tdp-wc-page-city-time">{localTime}</span>
      <span className="tdp-wc-page-city-meta">
        <span className="tdp-wc-match-flag">{flagEmoji(city.countryCode)}</span>
        UTC{offset} · {(city.capacity / 1000).toFixed(0)}k seats
      </span>
    </div>
  );
}

function StageBlock({ stage, matches }: { stage: string; matches: Match[] }) {
  return (
    <div>
      <h3 className="tdp-wc-stage-header">{stageLabel(stage)}</h3>
      <div>
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const hostCity = HOST_CITIES.find((c) => c.code === match.cityCode);
  if (!hostCity) return null;

  const localTime = formatMatchTimeOnly(match, hostCity);
  const utcTime = formatMatchUtc(match);
  const localDate = formatMatchDateOnly(match, hostCity);

  return (
    <div className="tdp-wc-match-row">
      <div className="tdp-wc-match-time">
        <span>{localDate}</span>
        <span style={{ fontWeight: 700, marginLeft: 6 }}>{localTime}</span>
        <span className="utc">{utcTime} · {flagEmoji(hostCity.countryCode)} {hostCity.name}</span>
      </div>
      <div className="tdp-wc-match-teams">
        <span>{match.home}</span>
        <span className="vs">vs</span>
        <span>{match.away}</span>
      </div>
      <div className="tdp-wc-match-venue">
        <span className="stage">{match.stage}{match.group ? ` · Group ${match.group}` : ""}</span>
        {match.stadium} · {hostCity.name}
      </div>
      <div style={{ textAlign: "right", fontFamily: "var(--hero-mono-font)", fontSize: 11, color: "var(--hero-text-muted)" }}>
        M{match.matchNumber}
      </div>
    </div>
  );
}

function stageLabel(stage: string): string {
  if (stage === "Group") return "Group stage";
  if (stage === "R16")   return "Round of 16";
  if (stage === "QF")    return "Quarterfinals";
  if (stage === "SF")    return "Semifinals";
  if (stage === "3rd")   return "Third place";
  if (stage === "Final") return "Final";
  return stage;
}

function flagEmoji(countryCode: string): string {
  if (countryCode === "US") return "🇺🇸";
  if (countryCode === "CA") return "🇨🇦";
  if (countryCode === "MX") return "🇲🇽";
  return "";
}