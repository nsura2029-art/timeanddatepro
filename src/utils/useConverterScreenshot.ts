// src/utils/useConverterScreenshot.ts
// Hook that owns all the share/calendar/copy-to-clipboard/save-png
// behaviors for both the generic TimeZoneConverter and the dedicated
// PairConverter. Returns handlers + status text + busy flag.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CITY_BY_CODE, CityEntry } from "../data/cities";
import {
  captureElement,
  shareImageWithUrl,
  composeCalendarDescription,
  triggerDownload,
} from "./screenshot";

export interface ConverterScreenshotAPI {
  shareToast: string | null;
  busy: boolean;
  gridRef: React.RefObject<HTMLDivElement | null>;
  handleShare: () => Promise<void>;
  handleAddToCalendar: (provider: "outlook" | "google" | "ics" | "yahoo") => Promise<void>;
  handleCopyToClipboard: () => Promise<void>;
  handleDownloadPng: () => Promise<void>;
  /** Replace the live cities list with whatever the caller passes in. */
  setCities: (codes: string[]) => void;
}

export interface UseConverterScreenshotArgs {
  cities: string[];
  baseDate: Date;
  /** Where the converter is hosted. Used for the share URL. */
  pageUrl: (cityCodes: string[]) => string;
  /** Filename for the PNG/ICS download. */
  filenameBase?: string;
}

export function useConverterScreenshot({
  cities: citiesProp,
  baseDate,
  pageUrl,
  filenameBase = "time-zones",
}: UseConverterScreenshotArgs): ConverterScreenshotAPI {
  const [cities, setCities] = useState<string[]>(citiesProp);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync cities prop into local state so callers can pass a new array
  // and still re-derive the share URL. (Pairs that re-render with
  // different cities get fresh share URLs.)
  const citiesKey = citiesProp.join(",");
  const lastKeyRef = useRef(citiesKey);
  useEffect(() => {
    if (lastKeyRef.current !== citiesKey) {
      lastKeyRef.current = citiesKey;
      setCities(citiesProp);
    }
  }, [citiesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapshot = useCallback(async (): Promise<Blob | null> => {
    if (!gridRef.current) {
      console.error("[snapshot] gridRef is null");
      return null;
    }
    try {
      return await captureElement(gridRef.current, { scale: 2 });
    } catch (e) {
      console.error("[snapshot] failed:", e);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setShareToast(null);
    try {
      const blob = await snapshot();
      const url = pageUrl(cities);
      const cityNames = cities.map((c) => CITY_BY_CODE[c]?.name).filter(Boolean) as string[];
      const text = `Current time across ${cityNames.length} cities \u2014 ${url}`;
      if (blob) {
        const result = await shareImageWithUrl(blob, `${filenameBase}.png`, "Time Zone Converter", text, url);
        const message =
          result === "shared" ? "Shared (image)" :
          result === "shared-url" ? "Shared (link)" :
          result === "copied" ? "Image + link copied to clipboard" :
          result === "downloaded" ? "Image downloaded + link copied" :
          "Link copied";
        setShareToast(message);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareToast("Screenshot failed \u2014 link copied");
      } else {
        setShareToast(url);
      }
    } catch (e) {
      console.error("[share] handleShare error:", e);
      setShareToast(`Share failed: ${(e as Error)?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 2400);
    }
  }, [busy, snapshot, cities, pageUrl, filenameBase]);

  const handleAddToCalendar = useCallback(async (provider: "outlook" | "google" | "ics" | "yahoo") => {
    if (busy) return;
    setBusy(true);
    setShareToast(null);
    try {
      const start = baseDate;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const cityNames = cities.map((c) => CITY_BY_CODE[c]?.name).filter(Boolean) as string[];
      const title = `Time check \u2014 ${cityNames.join(", ")}`;
      const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
      const appUrl = pageUrl(cities);
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
        const escapeIcs = (s: string) =>
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
        triggerDownload(new Blob([ics], { type: "text/calendar" }), `${filenameBase}-cal.ics`);
        const blob = await snapshot();
        if (blob) triggerDownload(blob, `${filenameBase}.png`);
        setShareToast(blob ? "iCal + PNG downloaded" : "iCal downloaded");
      }
    } catch (e) {
      console.error("[share] handleAddToCalendar error:", e);
      setShareToast(`Calendar failed: ${(e as Error)?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 2400);
    }
  }, [busy, cities, baseDate, pageUrl, filenameBase, snapshot]);

  const handleCopyToClipboard = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setShareToast(null);
    try {
      const blob = await snapshot();
      const lines = cities
        .map((code) => {
          const c = CITY_BY_CODE[code];
          if (!c) return null;
          const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: c.timezone, hour: "2-digit", minute: "2-digit", hour12: true,
          });
          return `${c.name}: ${fmt.format(baseDate)}`;
        })
        .filter(Boolean) as string[];

      if (blob && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
              "text/plain": new Blob([lines.join("\n")], { type: "text/plain" }),
            }),
          ]);
          setShareToast("Screenshot + times copied \u2014 paste anywhere");
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
  }, [busy, snapshot, cities, baseDate]);

  const handleDownloadPng = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setShareToast("Rendering PNG...");
    try {
      const blob = await snapshot();
      if (!blob) {
        setShareToast("Screenshot failed - check console");
        return;
      }
      const ok = triggerDownload(blob, `${filenameBase}.png`);
      setShareToast(ok ? "PNG downloaded (check your Downloads folder)" : "PNG download blocked");
    } catch (e) {
      console.error("[png] error:", e);
      setShareToast(`PNG failed: ${(e as Error)?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
      setTimeout(() => setShareToast(null), 3500);
    }
  }, [busy, snapshot, filenameBase]);

  return {
    shareToast,
    busy,
    gridRef,
    handleShare,
    handleAddToCalendar,
    handleCopyToClipboard,
    handleDownloadPng,
    setCities,
  };
}