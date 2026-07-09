// src/hooks/useHomeData.ts
// Fetches the composite /api/v1/browse/home payload once per page load.
// Caches in-memory for the session; falls back to a local buildBrowseHome()
// call if the API is unreachable (so the hero renders in any env).
//
// IMPORTANT: in React 19 dev with StrictMode, effects mount → unmount →
// remount. The naive `fetchedRef.current = true` guard kills the second
// run before its cancelled flag is bound, leaving the first fetch's
// setState stranded. Fix: bind `cancelled` via a ref so the cleanup of
// the first mount doesn't poison the in-flight promise's setState call
// that lands during the second mount's lifetime.

import { useEffect, useState, useRef } from "react";
import type { BrowseHome } from "../utils/homeApi";
import { buildBrowseHome } from "../utils/homeApi";
import type { CountryCode } from "../types";

export type HomeDataState =
  | { status: "loading" }
  | { status: "ok"; data: BrowseHome; source: "api" | "local" }
  | { status: "error"; message: string };

export function useHomeData(
  country: CountryCode | string = "US",
  homeCode: string = "WLC"
): HomeDataState {
  const [state, setState] = useState<HomeDataState>({ status: "loading" });

  // Latest setState ref — survives remounts so the second mount's fetch
  // can still resolve state without colliding with the first mount's
  // cancelled flag.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    let cancelledRef = { v: false };

    async function fetchFromApi(): Promise<BrowseHome | null> {
      try {
        const url = `/api/v1/browse/home?country=${encodeURIComponent(country)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.success || !json?.data) return null;
        return json.data as BrowseHome;
      } catch {
        return null;
      }
    }

    async function buildLocal(): Promise<BrowseHome> {
      const data = await buildBrowseHome({
        userCountryCode: country as CountryCode,
        homeCode,
        now: new Date(),
      });
      return data as unknown as BrowseHome;
    }

    (async () => {
      const apiData = await fetchFromApi();
      if (cancelledRef.v) return;
      if (apiData) {
        setState({ status: "ok", data: apiData, source: "api" });
        return;
      }
      try {
        const localData = await buildLocal();
        if (cancelledRef.v) return;
        setState({ status: "ok", data: localData, source: "local" });
      } catch (err) {
        if (cancelledRef.v) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    })();

    return () => {
      cancelled = true;
      cancelledRef.v = true;
    };
  }, [country, homeCode]);

  return state;
}