// src/hooks/useHomeData.ts
// Fetches the composite /api/v1/browse/home payload once per page load.
// Caches in-memory for the session; falls back to a local buildBrowseHome()
// call if the API is unreachable (so the hero renders in any env).

import { useEffect, useState, useRef } from "react";
import type { BrowseHome } from "../utils/homeApi";
import { buildBrowseHome } from "../utils/homeApi";
import type { CountryCode } from "../types";

export type HomeDataState =
  | { status: "loading" }
  | { status: "ok"; data: BrowseHome; source: "api" | "local" }
  | { status: "error"; message: string };

/**
 * useHomeData — pulls a snapshot for the hero.
 *
 * @param country user country for quote/holiday picker (defaults to "US")
 * @param homeCode home city code for the "user is here" line (defaults to WLC = Wesley Chapel)
 */
export function useHomeData(
  country: CountryCode | string = "US",
  homeCode: string = "WLC"
): HomeDataState {
  const [state, setState] = useState<HomeDataState>({ status: "loading" });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;

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
      // Ensure shape compatibility (buildBrowseHome already returns this shape)
      return data as unknown as BrowseHome;
    }

    (async () => {
      const apiData = await fetchFromApi();
      if (cancelled) return;
      if (apiData) {
        setState({ status: "ok", data: apiData, source: "api" });
      } else {
        try {
          const localData = await buildLocal();
          if (cancelled) return;
          setState({ status: "ok", data: localData, source: "local" });
        } catch (err) {
          if (cancelled) return;
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country, homeCode]);

  return state;
}
