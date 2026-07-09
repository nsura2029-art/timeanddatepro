// src/components/tools/PairConverter.tsx
// Dedicated component for the per-pair route /<lang>/<from>-<to>-time.
// Self-contained: owns its state, screenshot, SEO. Doesn't reuse
// TimeZoneConverter because that creates fragile "if pair prop" branches
// inside the generic component. This component IS the pair page.

import React, { useEffect, useMemo, useState } from "react";
import { TimeZoneGrid } from "./TimeZoneGrid";
import HowToUsePair from "./HowToUsePair";
import { useConverterScreenshot } from "../../utils/useConverterScreenshot";
import { CITY_BY_CODE } from "../../data/cities";
import { detectHomeCity } from "../../data/lookup";
import type { PairRoute } from "../../utils/pairRoutes";
import { buildPairHref } from "../../utils/pairRoutes";

interface Props {
  pair: PairRoute;
  lang: string;
}

export default function PairConverter({ pair, lang }: Props) {
  // Pair is exactly 2 cities (the URLs are <from>-<to>-time).
  // Allow user to ADD up to 2 more for a 4-city grid (maxSelections).
  const [extraCities, setExtraCities] = useState<string[]>([]);
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());

  // Build the canonical cities list. Order: pair first, then extras.
  const cityCodes = useMemo(
    () => [pair.fromCode, pair.toCode, ...extraCities.filter(c => c !== pair.fromCode && c !== pair.toCode)],
    [pair, extraCities]
  );

  // Where would the live page url be for THIS pair?
  const pageUrl = useMemo(() => () => {
    if (typeof window === "undefined") return `https://timeanddatepro.com/${lang}/${pair.slug}`;
    return `https://timeanddatepro.com${window.location.pathname}`;
  }, [lang, pair.slug]);

  const screenshot = useConverterScreenshot({
    cities: cityCodes,
    baseDate,
    pageUrl: (codes) => {
      // Share URL: dedicated pair URL with extra city hints via query
      const url = new URL(typeof window !== "undefined" ? window.location.href : "https://timeanddatepro.com");
      url.search = "";
      url.searchParams.set("cities", codes.join(","));
      return url.toString();
    },
    filenameBase: pair.slug,
  });

  // Live-tick grid every 60s so the current-hour column moves
  useEffect(() => {
    const tick = setInterval(() => setBaseDate(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Per-pair document.title + meta description (SEO; will be replaced by <SeoHead>)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const oldTitle = document.title;
    const oldDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    document.title = `${pair.fromName} to ${pair.toName} time conversion — live grid | TimeAndDatePro`;
    // Canonical URL: enforce -time suffix even if user navigated to /<from>-to-<to> (without -time)
    const path = window.location.pathname;
    if (!path.endsWith('/-time') && !path.endsWith('/-time/')) {
      const canonical = `/${lang}/${pair.slug}`;
      if (path !== canonical) {
        window.history.replaceState(null, '', canonical);
      }
    }
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      `Live time difference between ${pair.fromName} and ${pair.toName}. Add more cities, see working-hour overlap, export to your calendar.`
    );
    return () => {
      document.title = oldTitle;
      if (meta && oldDesc) meta.setAttribute("content", oldDesc);
    };
  }, [pair]);

  function addCity(code: string) {
    if (extraCities.includes(code) || code === pair.fromCode || code === pair.toCode) return;
    setExtraCities((arr) => [...arr, code].slice(0, 2));
  }
  function removeCity(code: string) {
    setExtraCities((arr) => arr.filter((c) => c !== code));
  }

  const fromCity = CITY_BY_CODE[pair.fromCode];
  const toCity = CITY_BY_CODE[pair.toCode];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in text-slate-900 relative">
      {/* Pair header (clean, no landing-page hero) */}
      <header className="mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {`${pair.fromName.toUpperCase()} \u2192 ${pair.toName.toUpperCase()} TIME \u00b7 ${lang.toUpperCase()}`}
        </span>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          {pair.fromName} to {pair.toName} time conversion
        </h1>
        {fromCity && toCity && (
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Live wall-clock comparison between {fromCity.name}, {fromCity.country} and {toCity.name}, {toCity.country}.
            Add up to 2 more cities to find the best meeting window, then export to your calendar.
          </p>
        )}
      </header>

      {/* Active cities as removable pills (pair + optional extras) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-sm font-semibold text-indigo-700">
          {pair.fromName}
          <span className="text-indigo-300">\u00d7</span>
          {pair.toName}
        </div>
        {extraCities.map((code) => {
          const c = CITY_BY_CODE[code];
          if (!c) return null;
          return (
            <button
              key={code}
              type="button"
              onClick={() => removeCity(code)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-sm text-slate-700"
              aria-label={`Remove ${c.name}`}
            >
              {c.name} <span className="text-slate-400">\u00d7</span>
            </button>
          );
        })}
        {extraCities.length < 2 && (
          <details className="relative">
            <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-sm text-slate-500 transition select-none">
              + Add city (up to 2)
            </summary>
            <div className="absolute z-10 left-0 top-full mt-1 w-72 rounded-xl border border-slate-200 bg-white shadow-xl p-2">
              <input
                type="text"
                placeholder="Type a city, state, or country\u2026"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) {
                      const c = detectHomeCity();
                      addCity(c.code); // best-effort fallback; rich picker below
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </details>
        )}
      </div>

      {/* WTB-style grid (with the pair cities highlighted + status) */}
      <TimeZoneGrid
        cityCodes={cityCodes}
        baseDate={baseDate}
        onTimeClick={(d) => setBaseDate(d)}
        onShare={screenshot.handleShare}
        onAddToCalendar={screenshot.handleAddToCalendar}
        onCopyToClipboard={screenshot.handleCopyToClipboard}
        onDownloadPng={screenshot.handleDownloadPng}
        innerRef={screenshot.gridRef}
        statusText={screenshot.busy ? "Working..." : screenshot.shareToast}
      />

      {/* How to use this pair */}
      <HowToUsePair pair={pair} lang={lang} />

      {/* Toast */}
      {screenshot.shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg flex items-center gap-2">
          {screenshot.busy && <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />}
          {screenshot.shareToast}
        </div>
      )}
    </div>
  );
}