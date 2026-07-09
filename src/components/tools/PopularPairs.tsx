// src/components/tools/PopularPairs.tsx
// Two-section pair suggestion hub:
//   1. "From your location" — 5 rows derived from the user's detected country
//   2. "Most popular globally" — 8 hardcoded pair cards (highest search volume)
//
// Each card links to its canonical pair URL (/<lang>/<from>-to-<to>-time).
// Commit A routes pair clicks to the converter via ?cities=...; Commit B
// will route to the dedicated pair page.

import React, { useMemo } from "react";
import { useNavigateToPair } from "../../utils/useNavigateToPair";
import {
  GLOBAL_PAIRS,
  getLocationBasedPairs,
  detectUserCountryCode,
  type PairSuggestion,
} from "../../utils/pairTargets";

interface Props {
  lang?: string;
}

function formatVol(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

const GLOBAL_VOLUMES: Record<string, number> = {
  "new-york-to-tokyo-time": 201_000,
  "los-angeles-to-new-york-time": 165_000,
  "mumbai-to-new-york-time": 135_000,
  "london-to-new-york-time": 90_500,
  "san-francisco-to-tokyo-time": 49_000,
  "new-york-to-london-time": 74_000,
  "dubai-to-mumbai-time": 38_000,
  "paris-to-tokyo-time": 22_000,
};

export default function PopularPairs({ lang = "en" }: Props) {
  const userCountry = useMemo(() => detectUserCountryCode(), []);
  const localPairs = useMemo(() => getLocationBasedPairs(userCountry, 5), [userCountry]);
  const navigateToPair = useNavigateToPair(lang);

  const localSlugs = useMemo(() => new Set(localPairs.map((p) => p.slug)), [localPairs]);
  const globalPairsOnly = useMemo(
    () => GLOBAL_PAIRS.filter((p) => !localSlugs.has(p.slug)),
    [localSlugs]
  );

  const userCountryLabel = useMemo(() => {
    if (userCountry === "OTHER") return "your region";
    return ({
      US: "the United States",
      IN: "India",
      GB: "the United Kingdom",
      DE: "Germany",
      JP: "Japan",
      AE: "the UAE",
      FR: "France",
      CN: "China",
    } as Record<string, string>)[userCountry] ?? "your region";
  }, [userCountry]);

  return (
    <section aria-labelledby="tz-popular-pairs">
      <header className="mb-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Popular conversions</span>
        <h2 id="tz-popular-pairs" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
          Most-searched city pair conversions
        </h2>
        <p className="mt-1 text-[13px] text-slate-600">
          Click any pair to open the live converter pre-seeded with those two cities — full grid, calendar export, share link.
        </p>
      </header>

      {/* Section 1: From your location */}
      <div className="mb-4">
        <header className="mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            From {userCountryLabel} • tailored to you
          </span>
          <h3 className="mt-0.5 text-base font-bold text-slate-800">
            Top outbound city pairs from where you are
          </h3>
        </header>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {localPairs.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => navigateToPair(p)}
              className="group w-full text-left flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                  {p.fromName} → {p.toName}
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  {p.fromCode} → {p.toCode}
                  {p.reason && <span className="text-slate-400"> · {p.reason}</span>}
                </div>
              </div>
              <span className="ml-2 shrink-0 text-slate-300 group-hover:text-indigo-500 transition">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Global popular */}
      {globalPairsOnly.length > 0 && (
        <div>
          <header className="mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Global popular
            </span>
            <h3 className="mt-0.5 text-base font-bold text-slate-800">
              Most-searched timezone pairs worldwide
            </h3>
          </header>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {globalPairsOnly.map((p) => {
              const vol = GLOBAL_VOLUMES[p.slug] ?? 0;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => navigateToPair(p)}
                  className="group w-full text-left flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      {p.fromName} → {p.toName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {p.fromCode} → {p.toCode}
                      {p.reason && <span className="text-slate-400"> · {p.reason}</span>}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0 rounded-md bg-slate-50 px-2 py-0.5 text-right group-hover:bg-indigo-100">
                    <div className="font-mono text-[10px] font-bold text-slate-700 group-hover:text-indigo-700">
                      {formatVol(vol)}/mo
                    </div>
                    <div className="text-[8px] uppercase tracking-wider text-slate-400">est. volume</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}