// src/components/landing/HeroAddCitySearch.tsx
// Compact "add another city" search for the hero's top-right action bar.
// Same API as the YourCitiesPanel's add search (GET /api/v1/cities/search)
// but styled to fit alongside the city picker trigger + 12h/24h toggle.
//
// The dropdown opens below the input and shows up to 8 matching cities
// with their country flag, name, region, timezone, and a + pick button.
// Clicking a result calls onPickCity with the full CityEntry.
//
// Already-tracked cities are auto-excluded server-side via ?exclude=...
// so the user never sees a city they've already added.

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Loader2, X } from "lucide-react";
import type { CityEntry } from "../../data/cities";

interface HeroAddCitySearchProps {
  /** Codes of cities already tracked — passed to the API as ?exclude= */
  excludeCodes: string[];
  /** Called when the user picks a city. Returns true if added, false if cap reached. */
  onAdd: (city: CityEntry) => boolean;
  /** Disable when the user is at the max tracked-cities cap */
  disabled?: boolean;
}

/** Flag CDN — serves 194 country flags. Free, no API key. */
function flagUrl(cca2: string): string {
  if (!cca2 || cca2.length !== 2) return "";
  return `https://flagcdn.com/w40/${cca2.toLowerCase()}.png`;
}

export function HeroAddCitySearch({ excludeCodes, onAdd, disabled }: HeroAddCitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Click-outside to close the dropdown
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        inputRef.current && !inputRef.current.contains(t) &&
        dropdownRef.current && !dropdownRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Debounced search call — 200ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const url = `/api/v1/cities/search?q=${encodeURIComponent(q)}&limit=8&exclude=${encodeURIComponent(excludeCodes.join(","))}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResults(json?.data?.cities ?? []);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, excludeCodes]);

  const handlePick = useCallback(
    (city: CityEntry) => {
      const ok = onAdd(city);
      if (ok) {
        setQuery("");
        setResults([]);
        setOpen(false);
        inputRef.current?.focus();
      }
    },
    [onAdd]
  );

  return (
    <div className="tdp-hero-add-search" data-testid="hero-add-search">
      <div className="tdp-hero-add-input-wrap">
        <Search
          size={14}
          aria-hidden
          className="tdp-hero-add-input-icon"
        />
        <input
          ref={inputRef}
          type="text"
          className="tdp-hero-add-input"
          placeholder="Add city — e.g. Paris, Delhi…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search for a city to add"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="tdp-hero-add-results"
          data-testid="hero-add-search-input"
        />
        {query && (
          <button
            type="button"
            className="tdp-hero-add-input-clear"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <X size={12} aria-hidden />
          </button>
        )}
        {loading && (
          <span className="tdp-hero-add-spinner" aria-hidden>
            <Loader2 size={12} className="tdp-spin" />
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          ref={dropdownRef}
          id="tdp-hero-add-results"
          role="listbox"
          className="tdp-hero-add-dropdown"
          data-testid="hero-add-search-dropdown"
        >
          {results.map((city) => (
            <li
              key={city.code}
              role="option"
              aria-selected="false"
              className="tdp-hero-add-result"
              onMouseDown={(e) => {
                e.preventDefault();
                handlePick(city);
              }}
              data-testid={`hero-add-result-${city.code}`}
            >
              <span
                className="tdp-hero-add-flag"
                style={{ backgroundImage: `url(${flagUrl(city.countryCode)})` }}
                aria-hidden
              />
              <span className="tdp-hero-add-info">
                <span className="tdp-hero-add-name">{city.name}</span>
                <span className="tdp-hero-add-meta">
                  {city.state ? `${city.state}, ` : ""}
                  {city.country}
                </span>
              </span>
              <span className="tdp-hero-add-tz">{city.timezone.replace(/_/g, " ")}</span>
              <span className="tdp-hero-add-pick" aria-hidden>
                <Plus size={14} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
