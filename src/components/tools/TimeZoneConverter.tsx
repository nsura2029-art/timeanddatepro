// src/components/tools/TimeZoneConverter.tsx
// Dedicated /time-zone-converter page.
// Architecture: single page = LocationPicker + TimeZoneGrid + PopularPairs + FAQ.
// No From/To hero, no API chip (stuck-loading bug), no orphaned sub-components.

import React, { useEffect, useMemo, useState } from "react";
import { LocationPicker } from "../common/LocationPicker";
import { TimeZoneGrid } from "./TimeZoneGrid";
import PopularPairs from "./PopularPairs";
import TimeZoneFaq from "./TimeZoneFaq";
import ToolSdkPanel from "./ToolSdkPanel";
import { CITY_BY_CODE, CityEntry } from "../../data/cities";
import { getToolI18n } from "../../utils/toolTranslations";
import { detectHomeCity, deserializeSharePayload } from "../../data/lookup";

interface Props { lang?: string; }

const STORAGE_KEY = "tdp_tz_converter_cities_v2";
const DEFAULT_HUBS = ["TYO", "LON", "DXB", "SIN", "SYD", "PAR", "BER", "BOM"];

function detectInitialCodes(): string[] {
  if (typeof window !== "undefined") {
    // Share-link params win over localStorage
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
  const t = getToolI18n(lang);
  const [cityCodes, setCityCodes] = useState<string[]>(() => detectInitialCodes());
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Persist + rehydrate share URL on mount
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cityCodes)); } catch {/* noop */}
  }, [cityCodes]);

  // Live-tick the grid every minute so the "current time" column moves
  useEffect(() => {
    const tick = setInterval(() => setBaseDate(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  function handleShare() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("cities", cityCodes.join(","));
    const shareText = `Current time across ${cityCodes.length} cities — ${url.toString()}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(
        () => { setShareToast("Copied!"); setTimeout(() => setShareToast(null), 1800); },
        () => { setShareToast(url.toString()); setTimeout(() => setShareToast(null), 3000); }
      );
    }
  }

  function handleAddToCalendar(provider: "outlook" | "google" | "ics" | "yahoo") {
    const start = baseDate;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const cities = cityCodes.map((code) => CITY_BY_CODE[code]?.name).filter(Boolean).join(", ");
    const title = `Time check — ${cities}`;
    const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    if (provider === "google") {
      const url = new URL("https://calendar.google.com/calendar/render");
      url.searchParams.set("action", "TEMPLATE");
      url.searchParams.set("text", title);
      url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
      url.searchParams.set("details", `Compare timezones: ${window.location.href}`);
      window.open(url.toString(), "_blank", "noopener");
    } else if (provider === "outlook") {
      const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
      url.searchParams.set("subject", title);
      url.searchParams.set("startdt", start.toISOString());
      url.searchParams.set("enddt", end.toISOString());
      url.searchParams.set("body", `Compare timezones: ${window.location.href}`);
      window.open(url.toString(), "_blank", "noopener");
    } else {
      // .ics download
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TimeAndDatePro//Time Zone Check//EN",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@timeanddatepro.com`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:Compare timezones: ${window.location.href}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "time-zone-check.ics"; a.click();
      URL.revokeObjectURL(url);
    }
  }

  function handleCopyToClipboard() {
    const lines = cityCodes
      .map((code) => {
        const c = CITY_BY_CODE[code];
        if (!c) return null;
        const fmt = new Intl.DateTimeFormat("en-US", {
          timeZone: c.timezone, hour: "2-digit", minute: "2-digit", hour12: true,
        });
        return `${c.name}: ${fmt.format(baseDate)}`;
      })
      .filter(Boolean);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join("\n"));
      setShareToast("Times copied");
      setTimeout(() => setShareToast(null), 1800);
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in text-slate-900 relative">
      {/* Compact header (intentionally small — picker is the headline UI) */}
      <header className="mb-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          TIME ZONE CONVERTER · {lang.toUpperCase()}
        </span>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Time Zone Converter
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Add a city, state, or country — see how the time shifts, find meeting overlaps, share the result.
          Uses your browser timezone for the home clock.
        </p>
      </header>

      {/* LocationPicker (the new headline UI) */}
      <LocationPicker
        value={cityCodes}
        onChange={setCityCodes}
        placeholder="Add a city, state, or country (e.g. Tokyo, Paris, Dubai)…"
        maxSelections={12}
      />

      {/* WTB-style grid */}
      <TimeZoneGrid
        cityCodes={cityCodes}
        baseDate={baseDate}
        onTimeClick={(d) => setBaseDate(d)}
        onShare={handleShare}
        onAddToCalendar={handleAddToCalendar}
        onCopyToClipboard={handleCopyToClipboard}
      />

      {/* Popular conversions (programmatic SEO hub) */}
      <PopularPairs />

      {/* FAQ + FAQPage JSON-LD schema */}
      <TimeZoneFaq lang={lang} />

      {/* SDK panel */}
      <ToolSdkPanel
        title="Power this UI from the API"
        summary="The same converter is available as a single REST call. Drop the snippet into your own app to ship the same experience."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// Convert a wall-clock time from NYC to Tokyo
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

      {/* Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg">
          {shareToast === "Copied!" ? "Link copied to clipboard" : shareToast === "Times copied" ? "Times copied to clipboard" : shareToast}
        </div>
      )}
    </div>
  );
}