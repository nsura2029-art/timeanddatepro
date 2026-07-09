// src/pages/docs/content/Changelog.tsx
// /docs/resources/changelog — keep a one-line entry per release.

import React from "react";

interface Release {
  date: string;
  version: string;
  highlights: string[];
  breaking?: boolean;
}

const RELEASES: Release[] = [
  {
    date: "Jul 8, 2026",
    version: "API v1.0.0 · SDK 0.1.0",
    breaking: false,
    highlights: [
      "Public REST API v1 with 15 endpoints shipped.",
      "Node.js SDK (@timeanddatepro/sdk) — zero-dep, full TypeScript.",
      "IATA-style city aliases — TYO, JFK, SFO, DXB, SIN, HKG, ICN, MEX, AMS, ROM, BKK, AKL and ~20 more now resolve without IANA names.",
      "Business-day add/sub hardened to 10,000-iteration cap.",
      "Sitemap XML at /sitemap.xml with 1h cache + 24h SWR.",
    ],
  },
];

export default function Changelog() {
  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">Changelog</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        Releases for the public API and Node.js SDK. Patch versions are not listed here — see GitHub for the full log.
      </p>

      <ol className="mt-10 space-y-6 border-l-2 border-indigo-200 pl-6">
        {RELEASES.map((r) => (
          <li key={r.version} className="relative">
            <span className="absolute -left-[33px] top-2 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-white" />
            <div className="flex items-baseline gap-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">{r.date}</div>
              <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[12px] font-bold text-slate-800">{r.version}</code>
              {r.breaking && (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Breaking
                </span>
              )}
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] text-slate-700">
              {r.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </article>
  );
}
