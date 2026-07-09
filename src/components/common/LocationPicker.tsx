// src/components/common/LocationPicker.tsx
// Reusable location picker used by Time Zone Converter, Meeting Finder,
// and any future tool that needs "pick cities / states / countries".
//
// Behavior:
// - Type "Florida" → dropdown shows "Florida (United States · 6 cities)" + select all
// - Type "Tokyo"   → "Tokyo, Japan" as a single city
// - Type "Japan"   → "Japan (Tokyo · 3 popular cities)" + select all
// - Selected items appear as removable pills above the input
// - Fuzzy token match, keyboard nav (↑ ↓ Enter Esc)

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  searchLocations,
  getPopularCities,
  type Location,
  type SearchOptions,
} from "../../data/lookup";
import { CITY_BY_CODE } from "../../data/cities";
import { useClickOutside } from "../../utils/useClickOutside";
import { flagFor } from "../../data/flags";

export interface LocationPickerProps {
  /** Selected cities (3-letter codes → CityEntry[]). Order matters. */
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  /** Which kinds of results to include in the dropdown. Default = all three. */
  kinds?: SearchOptions["kinds"];
  /** Limit dropdown results. */
  limit?: number;
  /** Optional render override for the input row (e.g. for very compact layouts). */
  renderInput?: (props: InputRowProps) => React.ReactNode;
  /** CSS class for the root container. */
  className?: string;
  /** When true, hides the pills strip (used when the parent renders its own pills). */
  hidePills?: boolean;
}

export interface InputRowProps {
  query: string;
  onQueryChange: (q: string) => void;
  onEnter: () => void;
  onArrow: (direction: "up" | "down") => void;
  placeholder?: string;
}

export function LocationPicker(props: LocationPickerProps) {
  const {
    value,
    onChange,
    placeholder = "Add a city, state, or country…",
    maxSelections = 12,
    kinds = ["city", "region", "country"],
    limit = 8,
    className = "",
    hidePills = false,
  } = props;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false));

  const results = useMemo<Location[]>(
    () => searchLocations({ query, kinds, limit }),
    [query, kinds, limit]
  );

  // Reset highlight when results change
  useEffect(() => setHighlight(0), [results.length, query]);

  const selectedCities = useMemo(
    () => value.map((code) => CITY_BY_CODE[code]).filter(Boolean),
    [value]
  );

  const canAddMore = value.length < maxSelections;

  // ---- Apply a hit ----
  function applyHit(loc: Location) {
    if (!canAddMore && loc.kind === "city") return;
    let codes: string[] = [];
    if (loc.kind === "city") {
      codes = [loc.city.code];
    } else if (loc.kind === "region") {
      codes = loc.region.cityCodes.filter((c) => !value.includes(c));
    } else {
      codes = loc.country.popularCityCodes.filter((c) => !value.includes(c));
    }
    if (codes.length === 0) return;
    // Cap at maxSelections
    const slotsLeft = maxSelections - value.length;
    codes = codes.slice(0, Math.max(slotsLeft, 1));
    onChange([...value, ...codes]);
    setQuery("");
    setHighlight(0);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeCity(code: string) {
    onChange(value.filter((c) => c !== code));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[highlight];
      if (hit) applyHit(hit);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      // Backspace on empty input → remove last pill
      removeCity(value[value.length - 1]);
    }
  }

  // Popular fallback when input is empty
  const popularToShow = useMemo(() => {
    if (query.length > 0) return [];
    return getPopularCities()
      .filter((c) => !value.includes(c.code))
      .slice(0, 8);
  }, [query, value]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* Pills strip */}
      {!hidePills && selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedCities.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => removeCity(c.code)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-sm text-slate-700 transition"
              aria-label={`Remove ${c.name}`}
            >
              <span aria-hidden>{flagFor(c.countryCode)}</span>
              <span>{c.name}</span>
              <span className="text-slate-400">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-24 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          disabled={!canAddMore || results.length === 0}
          onClick={() => { const h = results[highlight] ?? results[0]; if (h) applyHit(h); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition"
        >
          + Add
        </button>
      </div>

      {/* Dropdown */}
      {open && (results.length > 0 || popularToShow.length > 0) && (
        <div className="absolute z-30 left-0 right-0 mt-1 max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          {query.length === 0 && popularToShow.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Popular cities
              </div>
              {popularToShow.map((c, idx) => (
                <button
                  key={`pop-${c.code}`}
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => applyHit({ kind: "city", id: c.code, rank: 0, label: c.name, sublabel: c.country, flag: flagFor(c.countryCode), city: c })}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 ${highlight === idx ? "bg-indigo-50" : ""}`}
                >
                  <span aria-hidden>{flagFor(c.countryCode)}</span>
                  <span className="text-sm text-slate-800">{c.name}</span>
                  <span className="text-xs text-slate-500 ml-auto">{c.country}</span>
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
            </>
          )}

          {results.length > 0 && (
            <>
              {query.length > 0 && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Results
                </div>
              )}
              {results.map((loc, idx) => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => applyHit(loc)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 ${highlight === idx ? "bg-indigo-50" : ""}`}
                >
                  <span aria-hidden className="text-base">{loc.flag}</span>
                  <span className="text-sm text-slate-800">{loc.label}</span>
                  <span className="text-xs text-slate-500 truncate">{loc.sublabel}</span>
                  <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {loc.kind === "city" ? "city" : loc.kind === "region" ? `${loc.cities.length} cit${loc.cities.length === 1 ? "y" : "ies"}` : `${loc.cities.length} popular`}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-1 text-xs text-slate-400 font-mono">
          {value.length} / {maxSelections} selected
        </div>
      )}
    </div>
  );
}