// src/hooks/useTrackedCities.ts
// State + localStorage persistence for the hero city picker.
//
// Manages:
//   - cities: the list of TrackedCity the user is tracking
//   - activeCode: which city is currently driving the hero
//
// Behavior:
//   - First load: returns DEFAULT_CITIES with the home city as active
//   - Subsequent loads: restores from localStorage
//   - setActive(code): switches the active city
//   - addCity(city): appends to the list if not already present
//   - removeCity(code): removes from the list (but not the home city)
//   - reset(): clears localStorage and reverts to defaults
//
// SSR-safe: localStorage is gated behind `typeof window !== "undefined"`.

import { useState, useEffect, useCallback, useRef } from "react";
import { DEFAULT_CITIES, type TrackedCity } from "../data/defaultCities";
import { CITY_BY_CODE } from "../data/cities";

const STORAGE_KEY_CITIES = "tdp_tracked_cities";
const STORAGE_KEY_ACTIVE = "tdp_active_city";

/**
 * Hard cap on the number of cities a user can track. Picked so the
 * overlay can render all of them on a single screen (phone) without
 * scrolling, and so the dataset stays small enough for a one-time
 * fetch. Bumping past 10 requires a deliberate UI affordance (e.g.
 * a separate "favorites" view in a future phase).
 */
export const MAX_FAVORITES = 10;

function loadFromStorage(): { cities: TrackedCity[]; activeCode: string } {
  if (typeof window === "undefined") {
    return { cities: DEFAULT_CITIES, activeCode: DEFAULT_CITIES[0].code };
  }
  try {
    const rawCities = localStorage.getItem(STORAGE_KEY_CITIES);
    const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!rawCities) {
      return { cities: DEFAULT_CITIES, activeCode: DEFAULT_CITIES[0].code };
    }
    const parsed: TrackedCity[] = JSON.parse(rawCities);
    // Filter out cities that no longer exist in the registry (in case the
    // user has stale data from a previous build).
    const validated = parsed
      .map((c) => ({ ...CITY_BY_CODE[c.code], isHome: c.isHome } as TrackedCity))
      .filter((c) => c && c.code);
    if (validated.length === 0) {
      return { cities: DEFAULT_CITIES, activeCode: DEFAULT_CITIES[0].code };
    }
    // Validate the active code too
    const activeCode = validated.find((c) => c.code === rawActive)
      ? rawActive
      : validated[0].code;
    return { cities: validated, activeCode };
  } catch {
    return { cities: DEFAULT_CITIES, activeCode: DEFAULT_CITIES[0].code };
  }
}

export interface UseTrackedCities {
  cities: TrackedCity[];
  activeCity: TrackedCity;
  activeCode: string;
  setActive: (code: string) => void;
  /**
   * Add a city to the tracked list and make it active.
   * Returns `true` if added, `false` if the MAX_FAVORITES cap was hit.
   * Duplicate adds (city already in list) are silently no-ops; the
   * city is just made active in that case.
   */
  addCity: (city: Omit<TrackedCity, "isHome">) => boolean;
  removeCity: (code: string) => void;
  reset: () => void;
  /** True if the user can still add more cities (count < MAX_FAVORITES) */
  canAddMore: boolean;
  /** Current number of tracked cities */
  count: number;
  /** Hard cap (10) — exposed so the UI can render the "X / MAX" counter */
  max: number;
}

export function useTrackedCities(): UseTrackedCities {
  // Initial state is the defaults; on mount we rehydrate from localStorage.
  const [cities, setCities] = useState<TrackedCity[]>(DEFAULT_CITIES);
  const [activeCode, setActiveCode] = useState<string>(DEFAULT_CITIES[0].code);
  const hydrated = useRef(false);
  // Mirror of `cities` so callbacks (addCity) can read the current list
  // synchronously without depending on the `cities` state reference.
  // Without this, addCity would have to read `cities` from the closure
  // (stale) or include it in deps (re-creates the callback every render).
  const citiesRef = useRef<TrackedCity[]>(cities);
  citiesRef.current = cities;

  // Hydrate from localStorage on first client mount only
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const loaded = loadFromStorage();
    setCities(loaded.cities);
    setActiveCode(loaded.activeCode);
  }, []);

  // Persist to localStorage whenever cities or activeCode change
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_CITIES, JSON.stringify(cities));
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeCode);
    } catch {
      // localStorage might be full or disabled (private mode) — silent
    }
  }, [cities, activeCode]);

  const activeCity =
    cities.find((c) => c.code === activeCode) ?? cities[0] ?? DEFAULT_CITIES[0];

  const setActive = useCallback((code: string) => {
    setActiveCode(code);
  }, []);

  const addCity = useCallback(
    (city: Omit<TrackedCity, "isHome">): boolean => {
      // Read the current list synchronously via the ref (not the closure
      // variable, which can be stale, and not the state setter callback,
      // which runs async). This lets us return a correct `added` result
      // to the caller instead of always `false`.
      const current = citiesRef.current;
      // Don't add duplicates; just re-set as active
      if (current.some((c) => c.code === city.code)) {
        setActiveCode(city.code);
        return false;
      }
      // Cap at MAX_FAVORITES — block silently. UI should prevent the
      // call in the first place by reading `canAddMore`.
      if (current.length >= MAX_FAVORITES) {
        return false;
      }
      setCities([...current, { ...city, isHome: false }]);
      setActiveCode(city.code);
      return true;
    },
    []
  );

  const removeCity = useCallback(
    (code: string) => {
      setCities((prev) => {
        // Don't allow removing the home city
        const target = prev.find((c) => c.code === code);
        if (!target || target.isHome) return prev;
        const next = prev.filter((c) => c.code !== code);
        // If we removed the active city, fall back to home
        if (code === activeCode && next.length > 0) {
          const home = next.find((c) => c.isHome) ?? next[0];
          setActiveCode(home.code);
        }
        return next;
      });
    },
    [activeCode]
  );

  const reset = useCallback(() => {
    setCities(DEFAULT_CITIES);
    setActiveCode(DEFAULT_CITIES[0].code);
  }, []);

  return {
    cities,
    activeCity,
    activeCode,
    setActive,
    addCity,
    removeCity,
    reset,
    canAddMore: cities.length < MAX_FAVORITES,
    count: cities.length,
    max: MAX_FAVORITES,
  };
}
