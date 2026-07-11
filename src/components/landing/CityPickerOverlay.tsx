// src/components/landing/CityPickerOverlay.tsx
// Right-side drawer overlay for picking/adding cities.
//
// Triggered from the CityPickerTrigger button in the hero.
// Shows: search input + 5 default cities (quick-add) + filtered results.
//
// Behavior:
//   - Backdrop click closes
//   - Esc key closes
//   - X button closes
//   - Clicking a city adds it (if not in list) AND makes it active AND closes
//   - Cmd/Ctrl+K opens (handled by parent)
//
// All animations are CSS-driven for smoothness.

import { useEffect, useRef, useState, useMemo } from "react";
import { Search, X, MapPin, Home, Check, Plus } from "lucide-react";
import { CITIES, type CityEntry } from "../../data/cities";
import type { TrackedCity } from "../../data/defaultCities";

interface CityPickerOverlayProps {
  /** Whether the overlay is open */
  open: boolean;
  /** Close handler (backdrop click, X, Esc, post-pick) */
  onClose: () => void;
  /** Cities the user is currently tracking */
  trackedCities: TrackedCity[];
  /** Code of the currently active city (highlighted) */
  activeCode: string;
  /** Switch to an existing tracked city */
  onPick: (code: string) => void;
  /** Add a new city to the tracked list (also makes it active) */
  onAdd: (city: CityEntry) => void;
  /** Remove a tracked city (not the home city) */
  onRemove: (code: string) => void;
  /** Current number of tracked cities */
  count: number;
  /** Hard cap on tracked cities */
  max: number;
  /** True if more cities can still be added */
  canAddMore: boolean;
}

/**
 * Country code → flag emoji. Falls back to a globe if no flag.
 */
function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

/**
 * Fuzzy-ish search: matches the query against name, country, state, and timezone.
 * Returns the first 30 results, sorted by match strength.
 */
function searchCities(query: string, exclude: Set<string>): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const matches: Array<{ city: CityEntry; score: number }> = [];
  for (const city of CITIES) {
    if (exclude.has(city.code)) continue; // already tracked
    const haystack = [
      city.name,
      city.country,
      city.state ?? "",
      city.timezone,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) continue;
    // Score: name match > country match > other
    let score = 0;
    if (city.name.toLowerCase().startsWith(q)) score += 100;
    else if (city.name.toLowerCase().includes(q)) score += 50;
    if (city.country.toLowerCase().includes(q)) score += 20;
    if ((city.state ?? "").toLowerCase().includes(q)) score += 15;
    if (city.timezone.toLowerCase().includes(q)) score += 5;
    matches.push({ city, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 30).map((m) => m.city);
}

export function CityPickerOverlay({
  open,
  onClose,
  trackedCities,
  activeCode,
  onPick,
  onAdd,
  onRemove,
  count,
  max,
  canAddMore,
}: CityPickerOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input (200ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Reset query + focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      // Focus the input after the animation starts
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const trackedCodes = useMemo(
    () => new Set(trackedCities.map((c) => c.code)),
    [trackedCities]
  );
  const searchResults = useMemo(
    () => searchCities(debouncedQuery, trackedCodes),
    [debouncedQuery, trackedCodes]
  );

  if (!open) return null;

  return (
    <div
      className="tdp-city-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pick a city"
    >
      {/* Backdrop */}
      <div
        className="tdp-city-picker-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="tdp-city-picker-drawer">
        <header className="tdp-city-picker-header">
          <h2 className="tdp-city-picker-title">
            <MapPin size={18} aria-hidden />
            Pick a city
            <span className="tdp-city-picker-counter" aria-label={`${count} of ${max} cities tracked`}>
              {count} / {max}
            </span>
          </h2>
          <button
            type="button"
            className="tdp-city-picker-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="tdp-city-picker-search">
          <Search size={16} aria-hidden className="tdp-city-picker-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="tdp-city-picker-search-input"
            placeholder="Search any city, country, or timezone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search cities"
            data-testid="city-picker-search"
          />
        </div>

        <div className="tdp-city-picker-body">
          {/* When no query, show 2 sections: Tracked + Quick add (5 defaults) */}
          {!debouncedQuery.trim() && (
            <>
              <section className="tdp-city-picker-section">
                <h3 className="tdp-city-picker-section-title">Your cities</h3>
                <ul className="tdp-city-picker-list">
                  {trackedCities.map((city) => {
                    const isActive = city.code === activeCode;
                    return (
                      <li
                        key={city.code}
                        className={`tdp-city-picker-row ${
                          isActive ? "tdp-city-picker-row--active" : ""
                        }`}
                        data-testid={`tracked-city-${city.code}`}
                      >
                        <button
                          type="button"
                          className="tdp-city-picker-row-btn"
                          onClick={() => {
                            onPick(city.code);
                            onClose();
                          }}
                        >
                          <span className="tdp-city-picker-flag" aria-hidden>
                            {flagEmoji(city.countryCode)}
                          </span>
                          <span className="tdp-city-picker-row-text">
                            <span className="tdp-city-picker-row-name">
                              {city.name}
                              {city.isHome && (
                                <span className="tdp-city-picker-row-home" aria-label="Home">
                                  <Home size={11} aria-hidden /> Home
                                </span>
                              )}
                            </span>
                            <span className="tdp-city-picker-row-meta">
                              {city.state ? `${city.state}, ` : ""}
                              {city.country}
                            </span>
                          </span>
                          <span className="tdp-city-picker-row-tz">
                            {city.timezone.replace(/_/g, " ")}
                          </span>
                          {isActive && (
                            <Check
                              size={16}
                              aria-label="Active"
                              className="tdp-city-picker-row-check"
                            />
                          )}
                        </button>
                        {!city.isHome && (
                          <button
                            type="button"
                            className="tdp-city-picker-row-remove"
                            onClick={() => onRemove(city.code)}
                            aria-label={`Remove ${city.name}`}
                          >
                            <X size={14} aria-hidden />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* 5 default quick-add chips (only show defaults that aren't tracked) */}
              {/* (we always include them in the TrackedCities on first load, so this is empty by default) */}
            </>
          )}

          {/* When there's a query, show search results */}
          {debouncedQuery.trim() && (
            <section className="tdp-city-picker-section">
              {!canAddMore && (
                <div className="tdp-city-picker-limit-notice" role="status">
                  You&apos;re tracking the maximum {max} cities. Remove one to add a different city.
                </div>
              )}
              <h3 className="tdp-city-picker-section-title">
                {searchResults.length === 0
                  ? "No matches"
                  : `${searchResults.length} result${
                      searchResults.length === 1 ? "" : "s"
                    }`}
              </h3>
              {searchResults.length > 0 && (
                <ul className="tdp-city-picker-list">
                  {searchResults.map((city) => (
                    <li
                      key={city.code}
                      className="tdp-city-picker-row"
                      data-testid={`search-result-${city.code}`}
                    >
                      <button
                        type="button"
                        className="tdp-city-picker-row-btn"
                        onClick={() => {
                          if (!canAddMore) return;
                          onAdd(city);
                          onClose();
                        }}
                        disabled={!canAddMore}
                      >
                        <span className="tdp-city-picker-flag" aria-hidden>
                          {flagEmoji(city.countryCode)}
                        </span>
                        <span className="tdp-city-picker-row-text">
                          <span className="tdp-city-picker-row-name">
                            {city.name}
                          </span>
                          <span className="tdp-city-picker-row-meta">
                            {city.state ? `${city.state}, ` : ""}
                            {city.country}
                          </span>
                        </span>
                        <span className="tdp-city-picker-row-tz">
                          {city.timezone.replace(/_/g, " ")}
                        </span>
                        <Plus
                          size={16}
                          aria-label="Add"
                          className="tdp-city-picker-row-add"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searchResults.length === 0 && (
                <div className="tdp-city-picker-empty">
                  Try a different name, country, or timezone.
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="tdp-city-picker-footer">
          <kbd>Esc</kbd> to close · <kbd>⌘K</kbd> to reopen
        </footer>
      </div>
    </div>
  );
}
