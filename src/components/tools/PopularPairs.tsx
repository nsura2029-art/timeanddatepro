// src/components/tools/PopularPairs.tsx
// Programmatic-SEO hub: a grid of "popular conversions" linking to the
// /<from>-to-<to> URLs (Phase 2.1 of the SEO plan). Search-volume estimates
// come from the keyword opportunity matrix in the SEO plan.

import React from "react";

interface Pair {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  /** Approx. monthly search volume — used as a sort hint, not displayed verbatim. */
  monthly: number;
  /** Optional short reason. */
  reason?: string;
}

const PAIRS: Pair[] = [
  { from: "NYC", to: "TYO", fromName: "New York", toName: "Tokyo",    monthly: 201_000, reason: "finance / consulting" },
  { from: "LAX", to: "NYC", fromName: "Los Angeles", toName: "New York", monthly: 165_000, reason: "tech & media" },
  { from: "UTC", to: "IST", fromName: "UTC",       toName: "Mumbai",   monthly: 135_000, reason: "engineering" },
  { from: "LON", to: "GMT", fromName: "London",    toName: "GMT",      monthly: 90_500 },
  { from: "EST", to: "PST", fromName: "EST",       toName: "Pacific",  monthly: 88_000 },
  { from: "NYC", to: "LDN", fromName: "New York",  toName: "London",   monthly: 74_000, reason: "finance / media" },
  { from: "SFO", to: "TYO", fromName: "San Francisco", toName: "Tokyo", monthly: 49_000, reason: "tech" },
  { from: "PAR", to: "TYO", fromName: "Paris",     toName: "Tokyo",    monthly: 22_000 },
];

function formatVol(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function PopularPairs() {
  return (
    <section aria-labelledby="tz-popular-pairs">
      <header className="mb-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Popular conversions</span>
        <h2 id="tz-popular-pairs" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
          Most-searched city pair conversions
        </h2>
        <p className="mt-1 text-[13px] text-slate-600">
          Click any pair to open a dedicated conversion page with the live time difference and a full breakdown of working-hour overlap.
        </p>
      </header>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {PAIRS.map((p) => (
          <a
            key={`${p.from}-${p.to}`}
            href={`/${p.from.toLowerCase()}-to-${p.to.toLowerCase()}`}
            className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600">
                {p.fromName} → {p.toName}
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                {p.from} → {p.to}
                {p.reason && <span className="text-slate-400"> · {p.reason}</span>}
              </div>
            </div>
            <div className="ml-2 shrink-0 rounded-md bg-slate-50 px-2 py-0.5 text-right">
              <div className="font-mono text-[10px] font-bold text-slate-700">{formatVol(p.monthly)}/mo</div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400">est. volume</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
