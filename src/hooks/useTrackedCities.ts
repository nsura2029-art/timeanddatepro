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
  addCity: (city: Omit<TrackedCity, "isHome">) => void;
  removeCity: (code: string) => void;
  reset: () => void;
}

export function useTrackedCities(): UseTrackedCities {
  // Initial state is the defaults; on mount we rehydrate from localStorage.
  const [cities, setCities] = useState<TrackedCity[]>(DEFAULT_CITIES);
  const [activeCode, setActiveCode] = useState<string>(DEFAULT_CITIES[0].code);
  const hydrated = useRef(false);

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

  const addCity = useCallback((city: Omit<TrackedCity, "isHome">) => {
    setCities((prev) => {
      // Don't add duplicates; just re-set as active
      if (prev.some((c) => c.code === city.code)) {
        setActiveCode(city.code);
        return prev;
      }
      setActiveCode(city.code);
      return [...prev, { ...city, isHome: false }];
    });
  }, []);

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
  };
}
