// src/components/tools/TimeZoneConverter.tsx
// Dedicated /time-zone-converter page.
// Architecture: single page = LocationPicker + TimeZoneGrid + PopularPairs + FAQ.
// No From/To hero, no API chip (stuck-loading bug), no orphaned sub-components.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LocationPicker } from "../common/LocationPicker";
import { TimeZoneGrid } from "./TimeZoneGrid";
import PopularPairs from "./PopularPairs";
import TimeZoneFaq from "./TimeZoneFaq";
import ToolSdkPanel from "./ToolSdkPanel";
import { CITY_BY_CODE, CityEntry } from "../../data/cities";
import { getToolI18n } from "../../utils/toolTranslations";
import { detectHomeCity, deserializeSharePayload } from "../../data/lookup";
import {
  captureElement,
  shareImageWithUrl,
  composeCalendarDescription,
  triggerDownload,
} from "../../utils/screenshot";

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
  const [busy, setBusy] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Persist + rehydrate share URL on mount
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cityCodes)); } catch {/* noop */}
  }, [cityCodes]);

  // Live-tick the grid every minute so the "current time" column moves
  useEffect(() => {
    const tick = setInterval(() => setBaseDate(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  /** Snapshot the grid for embedding in screenshots / calendar events. */
  async function snapshot(): Promise<Blob | null> {
    if (!gridRef.current) return null;
    try {
      return await captureElement(gridRef.current, { scale: 2 });
    } catch {
      return null;
    }
  }

  /** Compose a clean share URL — points at the tool in this exact state. */
  function composeShareUrl(): string {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "https://timeanddatepro.com/en/time-zone-converter");
    url.search = "";
    url.searchParams.set("cities", cityCodes.join(","));
    url.searchParams.set("source", "converter");
    return url.toString();
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    setShareToast(null);
    try {
      const blob = await snapshot();
      const url = composeShareUrl();
      const cityNames = cityCodes.map((code) => CITY_BY_CODE[code]?.name).filter(Boolean) as string[];
      const text = `Current time across ${cityNames.length} cities - ${url}`;

      if (blob) {
        const result = await shareImageWithUrl(blob, "time-zones.png", "Time Zone Converter", text, url);
        setShareToast(
          result === "shared" ? "Shared (image)" :
          result === "shared-url" ? "Shared (link)" :
          result === "copied" ? "Image + link copied to clipboard" :
          result === "downloaded" ? "Image downloaded + link copied" :
          "Link copied"
        );
      } else {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          setShareToast("Screenshot failed - link copied");
        } else {
          setShareToast(url);
        }
      }
    } catch (e) {
      console.error("[share] handleShare error:", e);
      setShareToast(`Share failed: ${(e as Error)?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 2400);
    }
  }

  async function handleAddToCalendar(provider) {
    if (busy) return;
    setBusy(true);
    setShareToast(null);
    try {
      const start = baseDate;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const cityNames = cityCodes.map((code) => CITY_BY_CODE[code]?.name).filter(Boolean) as string[];
      const title = `Time check - ${cityNames.join(", ")}`;
      const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
      const appUrl = composeShareUrl();
      const description = composeCalendarDescription(cityNames, appUrl);

      if (provider === "google") {
        const url = new URL("https://calendar.google.com/calendar/render");
        url.searchParams.set("action", "TEMPLATE");
        url.searchParams.set("text", title);
        url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
        url.searchParams.set("details", description);
        url.searchParams.set("location", "Online");
        window.open(url.toString(), "_blank", "noopener");
        setShareToast("Google Calendar opened");
      } else if (provider === "outlook") {
        const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
        url.searchParams.set("subject", title);
        url.searchParams.set("startdt", start.toISOString());
        url.searchParams.set("enddt", end.toISOString());
        url.searchParams.set("body", description);
        url.searchParams.set("location", "Online");
        window.open(url.toString(), "_blank", "noopener");
        setShareToast("Outlook Calendar opened");
      } else {
        const escapeIcs = (s) =>
          s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
        const ics = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//TimeAndDatePro//Time Zone Check//EN",
          "BEGIN:VEVENT",
          `UID:${Date.now()}@timeanddatepro.com`,
          `DTSTAMP:${fmt(new Date())}`,
          `DTSTART:${fmt(start)}`,
          `DTEND:${fmt(end)}`,
          `SUMMARY:${escapeIcs(title)}`,
          `LOCATION:Online`,
          `DESCRIPTION:${escapeIcs(description)}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n");
        triggerDownload(new Blob([ics], { type: "text/calendar" }), "time-zone-check.ics");
        const blob = await snapshot();
        if (blob) triggerDownload(blob, "time-zone-check.png");
        setShareToast(blob ? "iCal + PNG downloaded" : "iCal downloaded");
      }
    } catch (e) {
      console.error("[share] handleAddToCalendar error:", e);
      setShareToast(`Calendar failed: ${(e as Error)?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 2400);
    }
  }

  async function handleCopyToClipboard() {
    if (busy) return;
    setBusy(true);
    setShareToast(null);
    try {
      const blob = await snapshot();
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

      if (blob && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
              "text/plain": new Blob([lines.join("\n")], { type: "text/plain" }),
            }),
          ]);
          setShareToast("Screenshot + times copied - paste anywhere");
          return;
        } catch (e) {
          console.warn("[share] clipboard image failed, text only:", e);
        }
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lines.join("\n"));
        setShareToast("Times copied");
      } else {
        setShareToast("Clipboard unavailable on this browser");
      }
    } catch (e) {
      console.error("[share] handleCopyToClipboard error:", e);
      setShareToast(`Copy failed: ${(e as Error)?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 2400);
    }
  }

  /** Explicit PNG download - reliable ultimate fallback. */
  async function handleDownloadPng() {
    if (busy) return;
    setBusy(true);
    setShareToast("Rendering PNG...");
    try {
      const blob = await snapshot();
      if (!blob) {
        setShareToast("Screenshot failed - check console");
        console.error("[png] snapshot returned null - check gridRef in devtools");
        return;
      }
      const ok = triggerDownload(blob, "time-zones.png");
      if (ok) {
        setShareToast("PNG downloaded (check your Downloads folder)");
      } else {
        setShareToast("PNG download blocked by browser");
      }
    } catch (e) {
      setShareToast(`PNG failed: ${(e as Error)?.message ?? "unknown"}`);
      console.error("[png] error:", e);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 3500);
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
        onDownloadPng={handleDownloadPng}
        innerRef={gridRef}
        statusText={busy ? "Working..." : shareToast}
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
    </div>
  );
}