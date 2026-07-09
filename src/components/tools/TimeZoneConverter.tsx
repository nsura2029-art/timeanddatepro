// src/components/tools/TimeZoneConverter.tsx
// Generic time zone converter. User picks cities freely (no fixed pair).
// Pair URL (/<lang>/<from>-to-<to>-time) is rendered by PairConverter, not
// this one \u2014 keeps each component single-purpose.

import React, { useEffect, useMemo, useState } from "react";
import { LocationPicker } from "../common/LocationPicker";
import { TimeZoneGrid } from "./TimeZoneGrid";
import PopularPairs from "./PopularPairs";
import TimeZoneFaq from "./TimeZoneFaq";
import ToolSdkPanel from "./ToolSdkPanel";
import { useConverterScreenshot } from "../../utils/useConverterScreenshot";
import { detectHomeCity, deserializeSharePayload } from "../../data/lookup";

interface Props { lang?: string; }

const STORAGE_KEY = "tdp_tz_converter_cities_v2";
const DEFAULT_HUBS = ["TYO", "LON", "DXB", "SIN", "SYD", "PAR", "BER", "BOM"];

function detectInitialCodes(): string[] {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get("cities");
      if (shared) {
        const codes = deserializeSharePayload(shared).map((c) => c.code);
        if (codes.length >= 1) return codes.slice(0, 12);
      }
    } catch {/* noop */}
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr) && arr.length >= 1) return arr.slice(0, 12);
      }
    } catch {/* noop */}
  }
  const home = detectHomeCity();
  const set = new Set<string>([home.code, ...DEFAULT_HUBS]);
  return Array.from(set).slice(0, 8);
}

export default function TimeZoneConverter({ lang = "en" }: Props) {
  const [cityCodes, setCityCodes] = useState<string[]>(() => detectInitialCodes());
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());

  const screenshot = useConverterScreenshot({
    cities: cityCodes,
    baseDate,
    pageUrl: () => {
      const url = new URL(typeof window !== "undefined" ? window.location.href : "https://timeanddatepro.com");
      url.search = "";
      url.searchParams.set("cities", cityCodes.join(","));
      return url.toString();
    },
    filenameBase: "time-zones",
  });

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cityCodes)); } catch {/* noop */}
  }, [cityCodes]);

  // Live-tick
  useEffect(() => {
    const tick = setInterval(() => setBaseDate(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in text-slate-900 relative">
      <header className="mb-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          TIME ZONE CONVERTER \u00b7 {lang.toUpperCase()}
        </span>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Time Zone Converter
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Add a city, state, or country \u2014 see how the time shifts, find meeting overlaps, share the result.
          Uses your browser timezone for the home clock.
        </p>
      </header>

      <LocationPicker
        value={cityCodes}
        onChange={setCityCodes}
        placeholder="Add a city, state, or country (e.g. Tokyo, Paris, Dubai)\u2026"
        maxSelections={12}
      />

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

      <PopularPairs lang={lang} />

      <TimeZoneFaq lang={lang} />

      <ToolSdkPanel
        title="Power this UI from the API"
        summary="The same converter is available as a single REST call. Drop the snippet into your own app to ship the same experience."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const result = await client.time.convert({
  from: "NYC",
  to: "TYO",
  time: "15:00",
  date: "2026-07-08",
});

console.log(\`\${result.from.time} \${result.from.city} \u2192 \${result.to.time} \${result.to.city}\`);
console.log(\`Hour difference: \${result.differenceHours}\`);`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/time/convert?from=NYC&to=TYO&time=15%3A00&date=2026-07-08"`}
        docsHref="/docs/integrations/time-zone-converter"
      />

      {screenshot.shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg flex items-center gap-2">
          {screenshot.busy && <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />}
          {screenshot.shareToast}
        </div>
      )}
    </div>
  );
}