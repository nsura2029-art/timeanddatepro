// src/components/landing/YourCitiesPanel.tsx
// Right-side panel that lists all tracked cities with LIVE current times.
// The "Your cities" widget — the persistent version of the city picker.
// Always-visible on desktop (right of the hero), stacks below on mobile.
//
// Features:
//   - Header with title + X/10 counter
//   - Search input (filters the tracked list — adds come from the hero trigger)
//   - Per-city row: country flag, city + region, LIVE current time, tz abbr
//   - Click row to make that city active
//   - X button to remove (home city not removable)
//   - Add city input at the bottom
//   - Live ticker: every city's current time updates every second via
//     a single React state (no per-city timers)

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Home, Plus, MapPin, ExternalLink } from "lucide-react";
import type { TrackedCity } from "../../data/defaultCities";

interface YourCitiesPanelProps {
  /** All tracked cities (already sorted with home first) */
  cities: TrackedCity[];
  /** Code of the currently active city (highlighted) */
  activeCode: string;
  /** Switch to a tracked city */
  onPick: (code: string) => void;
  /** Remove a tracked city (not the home city) */
  onRemove: (code: string) => void;
  /** Add a new city by code (called when user submits the add input) */
  onAdd: (cityCode: string) => boolean;
  /** Current count + hard cap (for the counter + limit logic) */
  count: number;
  max: number;
  canAddMore: boolean;
}

/** Flag CDN — serves 194 country flags at multiple sizes. Free, no API key. */
function flagUrl(cca2: string, width: 20 | 40 | 80 = 40): string {
  if (!cca2 || cca2.length !== 2) return "";
  return `https://flagcdn.com/w${width}/${cca2.toLowerCase()}.png`;
}

/** Format the current time in a target timezone. 12-hour with AM/PM, e.g. "07:04:31 AM". */
function formatLiveTime(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "—";
  }
}

/** Extract the timezone abbreviation (e.g. "EDT", "GMT+1") for display in the panel. */
function formatTimezoneAbbr(d: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(d);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

export function YourCitiesPanel({
  cities,
  activeCode,
  onPick,
  onRemove,
  onAdd,
  count,
  max,
  canAddMore,
}: YourCitiesPanelProps) {
  // Single shared ticker — every city row re-renders against this one Date
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    // Align the first tick to the next second boundary so all digits
    // change at the same instant (nicer visually)
    const ms = 1000 - (Date.now() % 1000);
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, ms);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  // Local search filter (filters the visible tracked list)
  const [query, setQuery] = useState("");
  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) =>
      [c.name, c.country, c.state ?? "", c.timezone]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [cities, query]);

  // Add city input state (local; parent receives via onAdd when user clicks Add)
  const [addValue, setAddValue] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addValue.trim() || !canAddMore) return;
    const ok = onAdd(addValue.trim());
    if (ok) setAddValue("");
  }

  return (
    <aside
      className="tdp-your-cities-panel"
      aria-label="Your tracked cities"
      data-testid="your-cities-panel"
    >
      <header className="tdp-ycp-header">
        <h2 className="tdp-ycp-title">Your cities</h2>
        <span
          className="tdp-ycp-counter"
          aria-label={`${count} of ${max} cities tracked`}
        >
          {count}/{max}
        </span>
      </header>
      <p className="tdp-ycp-subtitle">
        Keep up to {max} cities beside your local clock.
      </p>

      <div className="tdp-ycp-search">
        <Search
          size={16}
          aria-hidden
          className="tdp-ycp-search-icon"
        />
        <input
          type="text"
          className="tdp-ycp-search-input"
          placeholder="Search saved cities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search saved cities"
          data-testid="your-cities-search"
        />
      </div>

      <ul className="tdp-ycp-list" data-testid="your-cities-list">
        {filteredCities.map((city) => {
          const isActive = city.code === activeCode;
          const liveTime = formatLiveTime(now, city.timezone);
          const tzAbbr = formatTimezoneAbbr(now, city.timezone);
          return (
            <li
              key={city.code}
              className={`tdp-ycp-row${isActive ? " tdp-ycp-row--active" : ""}`}
              data-testid={`your-cities-row-${city.code}`}
            >
              <button
                type="button"
                className="tdp-ycp-row-btn"
                onClick={() => onPick(city.code)}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className="tdp-ycp-flag"
                  style={{
                    backgroundImage: `url(${flagUrl(city.countryCode, 40)})`,
                  }}
                  role="img"
                  aria-label={`${city.country} flag`}
                  data-cca2={city.countryCode}
                />
                <span className="tdp-ycp-info">
                  <span className="tdp-ycp-name-row">
                    <span className="tdp-ycp-name">{city.name}</span>
                    {city.isHome && (
                      <span className="tdp-ycp-home" aria-label="Home city">
                        <Home size={9} aria-hidden /> HOME
                      </span>
                    )}
                  </span>
                  <span className="tdp-ycp-meta">
                    {city.state ? `${city.state}, ` : ""}
                    {city.country}
                  </span>
                </span>
                <span className="tdp-ycp-time">
                  <span
                    className="tdp-ycp-time-value"
                    data-testid={`live-time-${city.code}`}
                  >
                    {liveTime}
                  </span>
                  <span className="tdp-ycp-time-tz">{tzAbbr}</span>
                </span>
              </button>
              {!city.isHome && (
                <button
                  type="button"
                  className="tdp-ycp-remove"
                  onClick={() => onRemove(city.code)}
                  aria-label={`Remove ${city.name}`}
                  data-testid={`ycp-remove-${city.code}`}
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
        {filteredCities.length === 0 && (
          <li className="tdp-ycp-empty">
            <span>No saved cities match “{query}”.</span>
          </li>
        )}
      </ul>

      <form className="tdp-ycp-add" onSubmit={handleAdd}>
        <input
          ref={addInputRef}
          type="text"
          className="tdp-ycp-add-input"
          placeholder="Add city — e.g. Paris"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          disabled={!canAddMore}
          aria-label="Add a new city"
          data-testid="your-cities-add-input"
        />
        <button
          type="submit"
          className="tdp-btn tdp-btn--primary tdp-btn--sm tdp-ycp-add-btn"
          disabled={!canAddMore || !addValue.trim()}
          data-testid="your-cities-add-btn"
        >
          <Plus size={12} aria-hidden style={{ marginRight: 4 }} />
          Add
        </button>
      </form>

      <footer className="tdp-ycp-footer">
        <span className="tdp-ycp-footer-note">
          <MapPin size={11} aria-hidden /> Uses sample city data
        </span>
        <a
          href="/navigator"
          className="tdp-ycp-footer-link"
          data-testid="your-cities-navigator"
        >
          Open navigator
          <ExternalLink size={11} aria-hidden />
        </a>
      </footer>
    </aside>
  );
}
