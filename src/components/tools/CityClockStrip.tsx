// src/components/tools/CityClockStrip.tsx
// 5 live city clocks for the dedicated /time-zone-converter page.
// Auto-populated from browser timezone (component receives the resolved list).
// Editable via an "Edit" button that emits a swap event.

import React, { useEffect, useState } from "react";

export interface CityClock {
  code: string;     // "TYO"
  name: string;     // "Tokyo"
  country: string;  // "JP"
  timezone: string; // "Asia/Tokyo"
  flag?: string;    // 🇯🇵
}

export interface CityClockStripProps {
  cities: CityClock[];
  onEdit?: () => void;
  /** External ref to the user's browser timezone — used to highlight "You are here". */
  userTimezone?: string;
}

function getTimeIn(tz: string, at: Date) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, weekday: "short", timeZoneName: "short",
    });
    const parts = fmt.formatToParts(at);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    return {
      time: `${get("hour")}:${get("minute")}:${get("second")}`,
      weekday: get("weekday"),
      abbr: get("timeZoneName"),
    };
  } catch {
    return { time: "--:--:--", weekday: "", abbr: "" };
  }
}

function getOffsetMin(tz: string, at: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const parts = fmt.formatToParts(at);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "0";
    const asUTC = Date.UTC(+get("year"), +get("month") - 1, +get("day"),
      +get("hour") % 24, +get("minute"), +get("second"));
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch { return 0; }
}

function formatOffset(min: number): string {
  const sign = min >= 0 ? "+" : "-";
  const abs = Math.abs(min);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export default function CityClockStrip({ cities, onEdit, userTimezone }: CityClockStripProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <section aria-labelledby="tz-your-cities">
      <div className="mb-3 flex items-baseline justify-between">
        <header>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Your cities</span>
          <h2 id="tz-your-cities" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
            Live clocks for your selected time zones
          </h2>
        </header>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
          >
            Edit cities
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cities.map((c) => {
          const t = getTimeIn(c.timezone, now);
          const offset = getOffsetMin(c.timezone, now);
          const isYou = userTimezone && c.timezone === userTimezone;
          return (
            <div
              key={c.code}
              className={
                "rounded-xl border bg-white p-3 shadow-sm " +
                (isYou ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200")
              }
            >
              <div className="flex items-center gap-2">
                {c.flag && <span className="text-lg leading-none">{c.flag}</span>}
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-bold text-slate-900">
                    {c.name}
                    {isYou && <span className="ml-1.5 inline-block rounded bg-indigo-50 px-1.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600">You</span>}
                  </div>
                  <div className="truncate font-mono text-[10px] text-slate-500">{c.country} · {c.code}</div>
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {t.time}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>{t.abbr}</span>
                <span className="font-mono">UTC{formatOffset(offset)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}