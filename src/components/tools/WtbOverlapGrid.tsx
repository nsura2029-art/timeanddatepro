// src/components/tools/WtbOverlapGrid.tsx
// WTB-style overlap grid: N cities × 24 hours, with current hour highlighted
// and overlap hours visually distinguished. Click a cell to set it as the
// "focus hour" (cosmetic — affects the highlight in the hero strip).

import React, { useMemo, useState } from "react";

export interface OverlapCity {
  code: string;     // "NYC", "TYO", "LDN"
  name: string;     // "New York"
  country: string;  // "US"
  timezone: string; // "America/New_York"
  flag?: string;
}

export interface WtbOverlapGridProps {
  cities: OverlapCity[];     // 2-6 cities
  /** Hour in the user's local timezone to anchor the grid on (0-23). */
  anchorHour?: number;
  /** Working-hours window for shading (default 9-17). */
  workStart?: number;
  workEnd?: number;
  onCellClick?: (city: OverlapCity, hour: number) => void;
}

function getOffsetMin(tz: string, at: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(at);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "0";
    const asUTC = Date.UTC(
      +get("year"), +get("month") - 1, +get("day"),
      +get("hour") % 24, +get("minute"), +get("second"),
    );
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch { return 0; }
}

function localHour(tzOffsetMin: number, anchorUtcHour: number, cellHour: number): number {
  // cellHour is the grid column hour (0-23) in some reference (e.g. the first city).
  // We compute the local hour at each city for that UTC moment.
  return ((cellHour + Math.round(tzOffsetMin / 60) + 24) % 24);
}

export default function WtbOverlapGrid({
  cities,
  anchorHour,
  workStart = 9,
  workEnd = 17,
  onCellClick,
}: WtbOverlapGridProps) {
  const [focusHour, setFocusHour] = useState<number | undefined>(anchorHour);
  const now = useMemo(() => new Date(), []);

  if (cities.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-[13px] text-slate-500">
        Add at least 2 cities to see the overlap grid.
      </div>
    );
  }

  // Reference timezone: the first city. Each column is 1 hour ahead.
  const refTz = cities[0].timezone;
  const refOffset = getOffsetMin(refTz, now);

  // For each row, compute the local hour in that city for the column "grid hour".
  // Work-hours shading is the union: a cell is "overlap" if it's inside the
  // work window for ALL selected cities.
  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[680px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="sticky left-0 z-10 min-w-[160px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
              City
            </th>
            {hours.map((h) => {
              const isFocus = focusHour === h;
              const isCurrentAnchor = (h === anchorHour);
              return (
                <th
                  key={h}
                  className={
                    "border-b border-slate-100 px-1 py-2 text-center font-mono text-[10px] " +
                    (isFocus ? "bg-indigo-100 text-indigo-700 font-bold" : "text-slate-500")
                  }
                >
                  {h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {cities.map((city, ci) => {
            const offset = getOffsetMin(city.timezone, now);
            const isRef = ci === 0;
            return (
              <tr key={city.code} className={isRef ? "bg-slate-50/40" : ""}>
                <th
                  scope="row"
                  className={
                    "sticky left-0 z-10 min-w-[160px] border-r border-slate-200 px-3 py-2 text-left " +
                    (isRef ? "bg-slate-50/95" : "bg-white")
                  }
                >
                  <div className="flex items-center gap-2">
                    {city.flag && <span className="text-base">{city.flag}</span>}
                    <div>
                      <div className="text-[12px] font-bold text-slate-900">{city.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {city.code} · {offset >= 0 ? "+" : ""}{Math.round(offset / 60)}h
                      </div>
                    </div>
                  </div>
                </th>
                {hours.map((h) => {
                  // The cell represents the hour `h` at the reference city.
                  // The local hour in THIS city for that moment is:
                  const localH = localHour(offset, 0, h);
                  const isWork = localH >= workStart && localH < workEnd;
                  const isAnchor = h === anchorHour;
                  const isFocus = h === focusHour;
                  return (
                    <td
                      key={h}
                      onClick={() => {
                        setFocusHour(h);
                        onCellClick?.(city, h);
                      }}
                      className={
                        "cursor-pointer border-b border-slate-100 px-1 py-2 text-center font-mono text-[10px] transition " +
                        (isWork ? "bg-emerald-50 text-emerald-700" : "text-slate-500") +
                        (isFocus ? " ring-2 ring-inset ring-indigo-400" : "") +
                        (isAnchor ? " font-bold underline decoration-indigo-400 underline-offset-2" : "")
                      }
                      title={`${city.name}: ${localH}:00 (${isWork ? "working hours" : "off hours"})`}
                    >
                      {localH === 0 ? "12a" : localH === 12 ? "12p" : localH < 12 ? `${localH}a` : `${localH - 12}p`}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-emerald-50 ring-1 ring-emerald-200" />
          Working hours (9–17)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm ring-2 ring-inset ring-indigo-400" />
          Selected hour
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-white ring-1 ring-slate-200" />
          Off hours
        </span>
        <span className="ml-auto">Click a cell to highlight the hour across all cities.</span>
      </div>
    </div>
  );
}