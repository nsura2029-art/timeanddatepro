// src/components/tools/TimeZoneConverter.tsx
// Dedicated /time-zone-converter page (also at /<lang>/time-zone-converter).
// Concept B (Hub + Spoke) + WTB-style overlap grid.
//
// Sections:
//   1. Hero converter strip       (From/To big inputs + result)
//   2. Your live cities           (auto-populated 5 clocks)
//   3. Overlap grid               (WTB-style 5 cities × 24h visualization)
//   4. Popular conversions        (programmatic SEO hub → /<from>-to-<to>)
//   5. FAQ + FAQPage schema       (People Also Ask + long-tail keywords)
//   6. ToolSdkPanel + ApiVerifyChip (consistent with other tools)

import React, { useEffect, useMemo, useState } from "react";
import HeroConverterStrip, { type HeroConverterStripProps } from "./HeroConverterStrip";
import CityClockStrip, { type CityClock } from "./CityClockStrip";
import WtbOverlapGrid, { type OverlapCity } from "./WtbOverlapGrid";
import PopularPairs from "./PopularPairs";
import TimeZoneFaq from "./TimeZoneFaq";
import ToolSdkPanel from "./ToolSdkPanel";
import ApiVerifyChip from "./ApiVerifyChip";
import { converterVerify } from "../../utils/apiToolMap";
import { CITY_DATA, detectCountryFromTimezone } from "../../data/countries";
import { getToolI18n } from "../../utils/toolTranslations";

interface Props { lang?: string; }

const STORAGE_KEY = "tdp_tz_converter_cities_v1";

/** Resolve a city code to a full City object (timezone + flag). */
function resolveCity(code: string): CityClock {
  const upper = code.toUpperCase();
  // CITY_DATA lookup by city code
  for (const [tz, info] of Object.entries(CITY_DATA)) {
    if (info.code.toUpperCase() === upper) {
      return {
        code: info.code,
        name: info.name,
        country: info.country,
        timezone: tz,
      };
    }
  }
  // Fallback — treat code as IANA timezone
  return { code: upper, name: upper, country: upper, timezone: code };
}

const DEFAULT_HUBS = ["TYO", "LDN", "SYD", "PAR"];

function detectInitialCities(): CityClock[] {
  const browserTz = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
    : "America/New_York";
  const detected = detectCountryFromTimezone(browserTz);
  const detectedEntry = Object.entries(CITY_DATA).find(([_, info]) => info.country === detected);
  const userCity = detectedEntry
    ? resolveCity(detectedEntry[1].code)
    : resolveCity("NYC");

  // Persist the user's last selection
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr) && arr.length >= 2 && arr.length <= 6) {
          return arr.map(resolveCity);
        }
      }
    } catch {/* noop */}
  }
  // Default: user city + 4 hubs (deduped)
  const set = new Set<string>([userCity.code, ...DEFAULT_HUBS]);
  return Array.from(set).slice(0, 5).map(resolveCity);
}

export default function TimeZoneConverter({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const [cities, setCities] = useState<CityClock[]>(() => detectInitialCities());
  const [heroState, setHeroState] = useState<{ from: string; to: string; time: string; date: string }>({
    from: cities[0]?.code || "NYC",
    to: cities[1]?.code || "TYO",
    time: "15:00",
    date: new Date().toISOString().slice(0, 10),
  });

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cities.map((c) => c.code))); } catch {/* noop */}
  }, [cities]);

  // Anchor hour = current hour in the user's local timezone
  const browserTz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const [anchorHour, setAnchorHour] = useState(() => new Date().getHours());

  // Re-derive overlap cities from current cities list
  const overlapCities: OverlapCity[] = useMemo(
    () => cities.map((c) => ({ code: c.code, name: c.name, country: c.country, timezone: c.timezone })),
    [cities]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in text-slate-900">
      <ApiVerifyChip
        config={converterVerify}
        state={heroState}
        position="top-right"
      />

      {/* Compact header */}
      <header className="mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          TIME ZONE CONVERTER · {lang.toUpperCase()}
        </span>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          {t.holidayCalendar ? "Convert time zones, plan meetings, share results" : "Time Zone Converter"}
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Convert a wall-clock time between any two cities, see your live clocks tick in real time, find the best overlap
          for a meeting, and jump to popular pair conversions — all in one place, all from the same public API.
        </p>
      </header>

      {/* 1. Hero converter strip */}
      <HeroConverterStrip
        cities={cities}
        defaultFrom={heroState.from}
        defaultTo={heroState.to}
        onChange={setHeroState}
        initialTime={heroState.time}
        initialDate={heroState.date}
      />

      {/* 2. Your live cities (auto-populated) */}
      <CityClockStrip
        cities={cities}
        userTimezone={browserTz}
        onEdit={() => {
          const next = window.prompt(
            "Enter 2–6 city codes (comma-separated):",
            cities.map((c) => c.code).join(",")
          );
          if (!next) return;
          const arr = next.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
          if (arr.length < 2) return;
          setCities(arr.map(resolveCity));
        }}
      />

      {/* 3. WTB-style overlap grid */}
      <section aria-labelledby="tz-overlap-heading">
        <header className="mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Overlap grid</span>
          <h2 id="tz-overlap-heading" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
            Best meeting hours across your selected cities
          </h2>
          <p className="mt-1 text-[13px] text-slate-600">
            Each column is one hour in the first city. Each cell shows the local hour in that city. Green = working hours (9–17). Click a cell to focus that hour.
          </p>
        </header>
        <WtbOverlapGrid
          cities={overlapCities}
          anchorHour={anchorHour}
          onCellClick={(_city, hour) => setAnchorHour(hour)}
        />
      </section>

      {/* 4. Popular conversions (programmatic SEO) */}
      <PopularPairs />

      {/* 5. FAQ + schema */}
      <TimeZoneFaq lang={lang} />

      {/* 6. SDK panel */}
      <ToolSdkPanel
        title="Power this UI from the API"
        summary="The same converter is available as a single REST call. Drop the snippet into your own app to ship the same experience."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// 15:00 NYC → TYO on July 8, 2026
const result = await client.time.convert({
  from: "NYC",
  to: "TYO",
  time: "15:00",
  date: "2026-07-08",
});

console.log(\`\${result.from.time} \${result.from.city} → \${result.to.time} \${result.to.city}\`);
console.log(\`Hour difference: \${result.differenceHours}\`);`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/time/convert?from=NYC&to=TYO&time=15%3A00&date=2026-07-08"`}
        docsHref="/docs/integrations/time-zone-converter"
      />
    </div>
  );
}
