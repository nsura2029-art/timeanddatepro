// src/pages/worldcup/WorldCupPage.tsx
// Dedicated page for the 2026 FIFA World Cup — modeled after
// time.is/FIFA_world_cup_2026_schedule with a cleaner design.
//
// One component = one purpose: full tournament view including:
//   - Header with dates + 16 host cities (large cards with live local time)
//   - Full schedule grouped by stage (Group → R16 → QF → SF → 3rd → Final)
//   - Bracket predictor: pick group stage winners, auto-advance
//   - Subscribe form: kickoff reminders via email
//
// Time ticker: refreshed every minute (city clocks don't need second
// resolution; full schedule is date-based so no need for second-level
// precision anywhere on this page).

import React, { useEffect, useMemo, useState } from "react";
import { Trophy, ArrowLeft, MapPin, Mail, Check, Sparkles } from "lucide-react";
import { FeedbackPrompt } from "../../components/feedback/FeedbackPrompt";
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

const LOCAL_KEY = "tdp_wc_predictor_v1";
const SUBSCRIBER_KEY = "tdp_wc_subscribers";

interface GroupPicks {
  /** Two team labels per group (winners from group stage) */
  winner: string;
  runnerUp: string;
}

/** 12 groups; teams are placeholders matching FIFA's seed labels (A1..A4 etc.).
 * In production we'd swap these for actual teams once FIFA finalizes the draw. */
const GROUP_LABELS: string[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

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
          href="/"
          className="tdp-wc-back-link"
          onClick={(e) => {
            if (typeof window === "undefined") return;
            e.preventDefault();
            window.history.pushState(null, "", "/");
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

      {/* Bracket predictor ------------------------------------------ */}
      <BracketPredictor />

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

      {/* Subscribe --------------------------------------------------- */}
      <SubscribeForm />

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--section-rule)", fontSize: 11, color: "var(--hero-text-muted)", fontFamily: "var(--hero-mono-font)" }}>
        Sources: fifa.com, en.wikipedia.org/wiki/2026_FIFA_World_Cup.
        Team placeholders reflect FIFA's seeding convention — actual teams confirmed
        after the late-2025 draw.
      </footer>
      <FeedbackPrompt tool="worldcup" toolLabel="World Cup 2026" />
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

/* -----------------------------------------------------------------------
 * Bracket predictor
 * Pick group winners → auto-fill knockout stage placeholders.
 * Stored in localStorage; survives page reload.
 * --------------------------------------------------------------------- */
function BracketPredictor() {
  const [picks, setPicks] = useState<Record<string, GroupPicks>>(() => loadPicks());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function updatePick(group: string, patch: Partial<GroupPicks>) {
    setPicks((prev) => {
      const next = { ...prev, [group]: { ...(prev[group] ?? blankGroup()), ...patch } };
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const filled = useMemo(() => {
    return Object.entries(picks).filter(([, v]) => v.winner && v.runnerUp).length;
  }, [picks]);

  function resetPicks() {
    setPicks({});
    try { localStorage.removeItem(LOCAL_KEY); } catch {}
  }

  function shareUrl() {
    if (typeof window === "undefined") return;
    const encoded = btoa(JSON.stringify(picks));
    const url = `${window.location.origin}/en/worldcup?picks=${encoded}`;
    try {
      navigator.clipboard?.writeText(url);
      window.alert("Bracket URL copied to clipboard!");
    } catch {
      window.prompt("Copy this URL:", url);
    }
  }

  return (
    <section className="tdp-wc-predictor" aria-label="Predict the bracket">
      <h2 className="tdp-wc-stage-header">
        <Sparkles size={14} style={{ marginRight: 6, verticalAlign: "-2px", color: "var(--accent-warm)" }} />
        Predict the bracket
        <span className="tdp-wc-stage-meta">
          {filled} / {GROUP_LABELS.length} groups · saved locally
        </span>
      </h2>
      <p className="tdp-wc-predictor-hint">
        Pick the two teams from each group you think will advance. The knockout
        placeholders below auto-update — winners face off following the official
        bracket. <em>Teams shown are seed labels until FIFA's late-2025 draw.</em>
      </p>

      <div className="tdp-wc-predictor-grid">
        {GROUP_LABELS.map((g) => {
          const sel = picks[g] ?? blankGroup();
          return (
            <div key={g} className="tdp-wc-predictor-card">
              <div className="tdp-wc-predictor-group">Group {g}</div>
              <label className="tdp-wc-predictor-field">
                <span>Winner</span>
                <select
                  value={sel.winner}
                  onChange={(e) => updatePick(g, { winner: e.target.value, runnerUp: e.target.value === sel.runnerUp ? "" : sel.runnerUp })}
                >
                  <option value="">— pick —</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={`${g}${n}`}>{`Team ${g}${n}`}</option>
                  ))}
                </select>
              </label>
              <label className="tdp-wc-predictor-field">
                <span>Runner-up</span>
                <select
                  value={sel.runnerUp}
                  onChange={(e) => updatePick(g, { runnerUp: e.target.value })}
                >
                  <option value="">— pick —</option>
                  {[1, 2, 3, 4].filter((n) => `${g}${n}` !== sel.winner).map((n) => (
                    <option key={n} value={`${g}${n}`}>{`Team ${g}${n}`}</option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
      </div>

      {hydrated && (
        <div className="tdp-wc-predictor-actions">
          <button type="button" className="tdp-wc-btn-secondary" onClick={resetPicks}>
            Clear picks
          </button>
          <button type="button" className="tdp-wc-btn-primary" onClick={shareUrl} disabled={filled === 0}>
            Copy shareable URL
          </button>
        </div>
      )}

      {filled >= 4 && <KnockoutReadout picks={picks} />}
    </section>
  );
}

function blankGroup(): GroupPicks {
  return { winner: "", runnerUp: "" };
}

function loadPicks(): Record<string, GroupPicks> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return {};
}

/* Quick readout: maps the 12 group winners/runners-up to the four R16 matches
 * using FIFA's standard bracket pattern (1A vs 2B · 1C vs 2D · 1E vs 2F · 1G vs 2H).
 * For the expanded 12-group tournament, the formula extends; we keep the visual
 * reference simple so the user sees picks actually flow through. */
function KnockoutReadout({ picks }: { picks: Record<string, GroupPicks> }) {
  const r16Pairs: [string, string][] = [
    ["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"],
  ];
  return (
    <div className="tdp-wc-readout">
      <div className="tdp-wc-readout-title">Knockout preview (auto-filled from your picks)</div>
      <div className="tdp-wc-readout-list">
        {r16Pairs.map(([g1, g2], idx) => {
          const p1 = picks[g1];
          const p2 = picks[g2];
          if (!p1 || !p2) return null;
          return (
            <div key={idx} className="tdp-wc-readout-row">
              <span className="tdp-wc-readout-num">R16 · M{89 + idx}</span>
              <span><strong>{p1.winner || `1${g1}`}</strong> vs <strong>{p2.runnerUp || `2${g2}`}</strong></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * Subscribe form
 * Mock-only (no backend yet): saves email to localStorage so we know
 * which addresses registered. Real backend will hook in Phase T6.
 * --------------------------------------------------------------------- */
function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [tz, setTz] = useState<string>(() => {
    if (typeof Intl === "undefined") return "";
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      const raw = localStorage.getItem(SUBSCRIBER_KEY);
      const list: Array<{ email: string; tz: string; ts: string }> = raw ? JSON.parse(raw) : [];
      list.push({ email, tz, ts: new Date().toISOString() });
      localStorage.setItem(SUBSCRIBER_KEY, JSON.stringify(list));
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Couldn't save your subscription — local storage unavailable.");
    }
  }

  return (
    <section className="tdp-wc-subscribe" aria-label="Subscribe to match updates">
      <div className="tdp-wc-subscribe-inner">
        <div className="tdp-wc-subscribe-text">
          <h2 className="tdp-wc-stage-header" style={{ marginBottom: 6 }}>
            <Mail size={14} style={{ marginRight: 6, verticalAlign: "-2px", color: "var(--accent-warm)" }} />
            Get kickoff reminders
          </h2>
          <p className="tdp-wc-subscribe-blurb">
            Email alerts 1 hour before each match in your timezone — including
            your predicted bracket teams. Free, one-click unsubscribe in every
            message.
          </p>
        </div>

        {submitted ? (
          <div className="tdp-wc-subscribe-success">
            <Check size={16} style={{ verticalAlign: "-3px", color: "var(--accent-primary)" }} />
            <span>You're on the list. Reminders start with the opener.</span>
          </div>
        ) : (
          <form className="tdp-wc-subscribe-form" onSubmit={handleSubmit}>
            <input
              type="email"
              inputMode="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              required
            />
            <span className="tdp-wc-subscribe-tz" title={tz || "local timezone"}>
              {tz ? tz.split("/").slice(-1)[0].replace("_", " ") : "—"}
            </span>
            <button type="submit" className="tdp-wc-btn-primary">Subscribe</button>
          </form>
        )}
        {error && <div className="tdp-wc-subscribe-error">{error}</div>}
      </div>
    </section>
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