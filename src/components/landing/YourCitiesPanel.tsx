// src/components/landing/YourCitiesPanel.tsx
// Right-side panel in the hero (2-col layout). Shows all tracked cities
// with LIVE current times + the API-driven "add another city" search
// at the top. Always-visible on desktop (right of the hero), stacks
// below on mobile.
//
// Features:
//   - Header with title + X/10 counter
//   - API-driven search at the TOP — type a city, dropdown shows
//     results with flag + name + region + timezone, click to add
//   - Per-city row: green LIVE dot, country flag, city + region,
//     LIVE current time, tz abbr
//   - Click row to make that city active
//   - X button to remove (home city not removable)
//   - Live ticker: every city's current time updates every second via
//     a single React state (no per-city timers).

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  Home,
  Plus,
  MapPin,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { TrackedCity } from "../../data/defaultCities";
import type { CityEntry } from "../../data/cities";

interface YourCitiesPanelProps {
  /** All tracked cities (already sorted with home first) */
  cities: TrackedCity[];
  /** Code of the currently active city (highlighted) */
  activeCode: string;
  /** Switch to a tracked city */
  onPick: (code: string) => void;
  /** Remove a tracked city (not the home city) */
  onRemove: (code: string) => void;
  /** Add a new city. Called with the full CityEntry from the search
      endpoint so the parent doesn't need a second lookup. Returns
      true if added, false if the cap was reached. */
  onAdd: (city: CityEntry) => boolean;
  /** Current count + hard cap (for the counter + limit logic) */
  count: number;
  max: number;
  /** Whether the user can add more cities (false at the 10-city cap) */
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
  // ── Live ticker (1 Hz, aligned to the next second boundary) ─────────
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
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

  // ── API-driven "add another city" search at the TOP ───────────────
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<CityEntry[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const addDropdownRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!addOpen) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        addInputRef.current && !addInputRef.current.contains(t) &&
        addDropdownRef.current && !addDropdownRef.current.contains(t)
      ) {
        setAddOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addOpen]);

  // Debounced search call — 200ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    const q = addQuery.trim();
    if (q.length < 2) {
      setAddResults([]);
      setAddLoading(false);
      return;
    }
    setAddLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const exclude = cities.map((c) => c.code).join(",");
        const url = `/api/v1/cities/search?q=${encodeURIComponent(q)}&limit=8&exclude=${encodeURIComponent(exclude)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // API response shape: { success, data, meta }
        // data = { q, count, total, cities: [...] }
        const json = await res.json();
        const list: CityEntry[] = json?.data?.cities ?? [];
        setAddResults(list);
        setAddOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setAddResults([]);
        }
      } finally {
        setAddLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [addQuery, cities]);

  const handleAddPick = useCallback(
    (city: CityEntry) => {
      const ok = onAdd(city);
      if (ok) {
        setAddQuery("");
        setAddResults([]);
        setAddOpen(false);
        addInputRef.current?.focus();
      }
    },
    [onAdd]
  );

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

      {/* Top: API-driven "add another city" search */}
      <div className="tdp-ycp-add">
        <label className="tdp-ycp-add-label" htmlFor="tdp-ycp-add-input">
          <Plus size={12} aria-hidden />
          <span>Add another city</span>
        </label>
        <div className="tdp-ycp-add-search">
          <input
            ref={addInputRef}
            id="tdp-ycp-add-input"
            type="text"
            className="tdp-ycp-add-input"
            placeholder="Search — e.g. Paris, Berlin, Tokyo…"
            value={addQuery}
            onChange={(e) => {
              setAddQuery(e.target.value);
              setAddOpen(true);
            }}
            onFocus={() => addResults.length > 0 && setAddOpen(true)}
            disabled={!canAddMore}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search for a city to add"
            aria-autocomplete="list"
            aria-expanded={addOpen}
            aria-controls="tdp-ycp-add-results"
            data-testid="your-cities-add-input"
          />
          {addLoading && (
            <span className="tdp-ycp-add-spinner" aria-hidden>
              <Loader2 size={14} className="tdp-spin" />
            </span>
          )}
          {addOpen && addResults.length > 0 && (
            <ul
              ref={addDropdownRef}
              id="tdp-ycp-add-results"
              role="listbox"
              className="tdp-ycp-add-dropdown"
              data-testid="your-cities-add-dropdown"
            >
              {addResults.map((city) => (
                <li
                  key={city.code}
                  role="option"
                  aria-selected="false"
                  className="tdp-ycp-add-result"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddPick(city);
                  }}
                  data-testid={`add-result-${city.code}`}
                >
                  <span
                    className="tdp-ycp-add-flag"
                    style={{ backgroundImage: `url(${flagUrl(city.countryCode, 40)})` }}
                    aria-hidden
                  />
                  <span className="tdp-ycp-add-info">
                    <span className="tdp-ycp-add-name">{city.name}</span>
                    <span className="tdp-ycp-add-meta">
                      {city.state ? `${city.state}, ` : ""}
                      {city.country}
                    </span>
                  </span>
                  <span className="tdp-ycp-add-tz">{city.timezone.replace(/_/g, " ")}</span>
                  <span className="tdp-ycp-add-pick" aria-hidden>
                    <Plus size={14} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!canAddMore && (
          <p className="tdp-ycp-add-limit">
            You’ve reached the {max}-city limit — remove one above to add a new city.
          </p>
        )}
      </div>

      {/* Middle: the list — sized to fit 10 cities by default */}
      <ul className="tdp-ycp-list" data-testid="your-cities-list">
        {cities.map((city) => {
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
        {cities.length === 0 && (
          <li className="tdp-ycp-empty">
            <span>No saved cities yet. Add your first city above.</span>
          </li>
        )}
      </ul>

      <footer className="tdp-ycp-footer">
        <span className="tdp-ycp-footer-note">
          <MapPin size={11} aria-hidden /> {canAddMore ? `Up to ${max - count} more can be added` : `${max}-city limit reached`}
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
