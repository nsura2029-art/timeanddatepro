// src/pages/today/TodayPage.tsx
// The /today hub — a live dashboard of widgets relevant to the user's
// location and interests. Currency widget is first; date/time/sports/news
// placeholders follow. Built so adding a new widget is trivial.
//
// Layout: 3-column grid on desktop, stacks on mobile.

import React, { useEffect, useState } from "react";
import { Widget } from "../../components/widgets/Widget";
import { CurrencyWidget } from "../../components/widgets/CurrencyWidget";
import { useLocation } from "../../hooks/useLocation";
import { LiveDot } from "../../components/common/LiveDot";
import "./TodayPage.css";

export function TodayPage() {
  const { location, loading: locLoading } = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = getGreeting(now);
  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateLong = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timeLong = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const weekOfYear = getWeekOfYear(now);
  const dayOfYear = getDayOfYear(now);
  const daysLeft = 365 - dayOfYear; // rough, ignores leap year
  const yearPct = ((dayOfYear / 365) * 100).toFixed(1);

  return (
    <main className="tdp-today">
      {/* Hero */}
      <section className="tdp-today__hero">
        <div className="tdp-today__hero-left">
          <div className="tdp-today__greeting">{greeting}, {location?.city || "friend"}</div>
          <h1 className="tdp-today__title">
            Your <em>{dayOfWeek}</em><br />in numbers
          </h1>
          <div className="tdp-today__meta">
            <span className="tdp-today__live">
              <LiveDot size="sm" /> <span>Live</span>
            </span>
            <span>Updated <strong>2 seconds ago</strong></span>
            <span>·</span>
            <span>5 widgets</span>
            <span>·</span>
            <span>Auto-refresh <strong>10s</strong></span>
          </div>
        </div>

        <aside className="tdp-today__location">
          <button className="tdp-today__loc-change">Change location →</button>
          <div className="tdp-today__loc-row">
            <div className="tdp-today__loc-icon">📍</div>
            <div>
              <div className="tdp-today__loc-label">You are in</div>
              <div className="tdp-today__loc-value">
                {locLoading ? "Detecting…" : location?.city || location?.country || "Unknown"}
              </div>
              <div className="tdp-today__loc-coord">
                {location?.timezone || ""} · {location?.country || ""}
              </div>
            </div>
          </div>
          <div className="tdp-today__loc-row">
            <div className="tdp-today__loc-icon tdp-today__loc-icon--time">⏰</div>
            <div>
              <div className="tdp-today__loc-label">Your timezone</div>
              <div className="tdp-today__loc-value">
                {location?.timezone?.split("/").pop()?.replace("_", " ") || "Local"}
              </div>
              <div className="tdp-today__loc-coord">{getTimezoneOffset(location?.timezone)}</div>
            </div>
          </div>
          <div className="tdp-today__loc-row">
            <div className="tdp-today__loc-icon tdp-today__loc-icon--cur">💱</div>
            <div>
              <div className="tdp-today__loc-label">Your currency</div>
              <div className="tdp-today__loc-value">
                {location?.currency || "USD"}
              </div>
              <div className="tdp-today__loc-coord">
                {getCurrencyName(location?.currency)}
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Widget grid */}
      <div className="tdp-today__grid">
        {/* Row 1: Currency (spans 2 cols) + Date/Time (spans 1) */}
        <div className="tdp-today__cell tdp-today__cell--wide">
          <Widget
            title="Currency near you"
            icon="💱"
            live
            href="/currency"
            hrefLabel="Open dashboard"
            loading={!location}
          >
            <CurrencyWidget />
          </Widget>
        </div>

        <div className="tdp-today__cell">
          <Widget title="Today" icon="📅" live>
            <div className="tdp-today__date">
              <div className="tdp-today__date-large">{dayOfWeek}, {dateLong.split(",")[1]?.trim() || ""}</div>
              <div className="tdp-today__date-time">{timeLong}</div>
              <div className="tdp-today__date-meta">
                Week {weekOfYear} · Day {dayOfYear} of 365
              </div>
              <div className="tdp-today__date-progress">
                <div className="tdp-today__date-progress-fill" style={{ width: `${yearPct}%` }} />
              </div>
              <div className="tdp-today__date-meta">
                {yearPct}% of {now.getFullYear()} complete · {daysLeft} days left
              </div>
            </div>
          </Widget>
        </div>

        {/* Row 2: World clock + Sports + News */}
        <div className="tdp-today__cell">
          <Widget title="World clock" icon="⏰" live href="#" hrefLabel="All 195">
            <div className="tdp-today__tz">
              <TZRow city="New York" tz="America/New_York" />
              <TZRow city="London" tz="Europe/London" />
              <TZRow city="Tokyo" tz="Asia/Tokyo" highlight={location?.timezone === "Asia/Tokyo"} />
              <TZRow city="Sydney" tz="Australia/Sydney" />
            </div>
          </Widget>
        </div>

        <div className="tdp-today__cell">
          <Widget title="Sports · live" icon="🏟️" live href="#" hrefLabel="All scores">
            <div className="tdp-today__sports">
              <SportsRow home="Yomiuri" away="Hanshin" score="3-2" status="● 7th" sport="⚾" />
              <SportsRow home="Urawa" away="Marinos" score="1-1" status="● 65'" sport="⚽" />
              <SportsRow home="Alvark" away="—" score="19:05" status="Tomorrow" sport="🏀" muted />
              <div className="tdp-today__coming-soon">More leagues + live ticker coming soon</div>
            </div>
          </Widget>
        </div>

        <div className="tdp-today__cell tdp-today__cell--wide">
          <Widget title="News near you" icon="📰" href="#" hrefLabel="Personalize">
            <div className="tdp-today__news">
              <NewsItem title="BoJ holds rates steady at 0.5%, signals patience on next hike" source="Nikkei · 12 min ago · Markets" />
              <NewsItem title="Yen weakens past 162 per dollar as rate gap widens" source="Reuters · 28 min ago · Currency" />
              <NewsItem title="Typhoon approaches Okinawa, flights grounded in Naha" source="NHK · 45 min ago · Weather" />
              <NewsItem title="Tokyo Metro extends Ginza line service for fireworks" source="Japan Times · 1 hr ago · Local" />
            </div>
          </Widget>
        </div>
      </div>

      <footer className="tdp-today__foot">
        TimeAndDatePro · Live data from{" "}
        <a href="#">European Central Bank</a>,{" "}
        <a href="#">Open Exchange Rates</a>,{" "}
        <a href="#">CoinGecko</a> · <a href="#">Settings</a> · <a href="#">About</a> · <a href="#">Privacy</a> · <a href="#">API</a>
      </footer>
    </main>
  );
}

// ── Helpers ──────────────────────────────────────

function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getTimezoneOffset(tz?: string): string {
  if (!tz) return "";
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
    const parts = formatter.formatToParts(date);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
    return offset.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

function getCurrencyName(code?: string): string {
  if (!code) return "";
  const names: Record<string, string> = {
    USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
    CNY: "Chinese Yuan", CHF: "Swiss Franc", CAD: "Canadian Dollar", AUD: "Australian Dollar",
    HKD: "Hong Kong Dollar", SGD: "Singapore Dollar", KRW: "South Korean Won", INR: "Indian Rupee",
  };
  return names[code] || code;
}

// ── Sub-components ────────────────────────────────

function TZRow({ city, tz, highlight }: { city: string; tz: string; highlight?: boolean }) {
  const [time, setTime] = useState(() => formatTZ(tz));
  useEffect(() => {
    const id = setInterval(() => setTime(formatTZ(tz)), 1000);
    return () => clearInterval(id);
  }, [tz]);
  return (
    <div className={`tdp-today__tz-row ${highlight ? "tdp-today__tz-row--here" : ""}`}>
      <div>
        <div className="tdp-today__tz-city">{city}</div>
        <div className="tdp-today__tz-tz">{getTimezoneOffset(tz)}</div>
      </div>
      <div className="tdp-today__tz-time">{time}</div>
    </div>
  );
}

function formatTZ(tz: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  } catch {
    return "—";
  }
}

function SportsRow({ home, away, score, status, sport, muted }: { home: string; away: string; score: string; status: string; sport: string; muted?: boolean }) {
  return (
    <div className={`tdp-today__sport ${muted ? "tdp-today__sport--muted" : ""}`}>
      <div className="tdp-today__sport-teams">
        <span className="tdp-today__sport-icon">{sport}</span>
        <span>{home} vs {away}</span>
      </div>
      <div className="tdp-today__sport-score">
        <span className="tdp-today__sport-val">{score}</span>
        <span className="tdp-today__sport-status">{status}</span>
      </div>
    </div>
  );
}

function NewsItem({ title, source }: { title: string; source: string }) {
  return (
    <div className="tdp-today__news-item">
      <div className="tdp-today__news-bullet" />
      <div>
        <div className="tdp-today__news-title">{title}</div>
        <div className="tdp-today__news-source">{source}</div>
      </div>
    </div>
  );
}
