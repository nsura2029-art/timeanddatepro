// src/components/tools/TimeZoneGrid.tsx
// World Time Buddy style grid: N city rows × 24 hour columns (or 48/72
// when the user pans left/right). Each cell colored by category:
// Working / EarlyLate / Night / Sleep / Weekend / Holiday.
//
// Hovering a column highlights that hour across every row (the "mouseover
// selects all of them" behavior). Double-click on a column extends the
// time window by 12h in that direction; click sets the time anchor.

import React, { useEffect, useMemo, useState } from "react";
import { CITIES, CityEntry, CITY_BY_CODE } from "../../data/cities";
import { flagFor } from "../../data/flags";
import { getCountryHolidaysForDate } from "../../utils/holidayLookup";

export type CellKind = "working" | "earlyLate" | "night" | "sleep" | "weekend" | "holiday";

export interface TimeZoneGridProps {
  cityCodes: string[];                  // ordered
  baseDate: Date;                       // anchor (centered in viewport)
  /** Hours per column (default 1). 0.5 = 30-min columns. */
  hoursPerColumn?: number;
  /** Total columns rendered. Default 24. */
  columns?: number;
  /** Working-hours window per city (defaults 9-17 Mon-Fri). */
  workingHours?: { start: number; end: number };
  onTimeClick?: (newTime: Date) => void;
  onShare?: () => void;
  onAddToCalendar?: (provider: "outlook" | "google" | "ics" | "yahoo") => void;
  onCopyToClipboard?: () => void;
  /** Optional ref attached to the outer container — used for screenshot capture. */
  innerRef?: React.RefObject<HTMLDivElement | null>;
}

const LEGEND: Array<{ kind: CellKind; label: string; color: string }> = [
  { kind: "working",  label: "Working",  color: "bg-emerald-200/60" },
  { kind: "earlyLate",label: "Early/Late",color: "bg-amber-200/60" },
  { kind: "night",    label: "Night",    color: "bg-indigo-200/60" },
  { kind: "sleep",    label: "Sleep",    color: "bg-fuchsia-200/60" },
  { kind: "weekend",  label: "Weekend",  color: "bg-slate-200/60" },
  { kind: "holiday",  label: "Holiday",  color: "bg-rose-200/60" },
];

// --- time helpers ---
function startOfHour(d: Date): Date {
  const r = new Date(d);
  r.setMinutes(0, 0, 0);
  return r;
}

function addHours(d: Date, h: number): Date {
  const r = new Date(d);
  r.setTime(r.getTime() + h * 3_600_000);
  return r;
}

function isWeekend(d: Date): boolean {
  const wd = d.getDay();
  return wd === 0 || wd === 6;
}

function fmtHour(h: number, ampm = true): string {
  if (!ampm) return `${h.toString().padStart(2, "0")}`;
  if (h === 0) return "12 am";
  if (h < 12) return `${h} am`;
  if (h === 12) return "12 pm";
  return `${h - 12} pm`;
}

function tzAbbr(timezone: string, date: Date): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "short" });
    const parts = fmt.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? timezone.split("/").pop() ?? timezone;
  } catch {
    return timezone.split("/").pop() ?? timezone;
  }
}

function tzOffsetLabel(timezone: string, date: Date): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" });
    const parts = fmt.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    const v = tzPart?.value ?? "UTC";
    // "GMT-5" → "UTC-5"
    return v.replace(/^GMT/, "UTC");
  } catch {
    return "UTC";
  }
}

function hourInTimezone(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
  const parts = fmt.formatToParts(date);
  return parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
}

function dateInTimezone(date: Date, timezone: string): Date {
  // Returns a Date object whose UTC fields represent the wall-clock time
  // in the given timezone. (We use it for "what day is it in NYC right now?")
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return new Date(Date.UTC(
    parseInt(parts.year, 10),
    parseInt(parts.month, 10) - 1,
    parseInt(parts.day, 10),
    parseInt(parts.hour === "24" ? "0" : parts.hour, 10),
    parseInt(parts.minute, 10)
  ));
}

function cellKindFor(city: CityEntry, slotDate: Date, workingHours: { start: number; end: number }): CellKind {
  // Check holiday first
  const holidays = getCountryHolidaysForDate(city.countryCode, slotDate);
  if (holidays.length > 0) return "holiday";

  if (isWeekend(slotDate)) return "weekend";

  const localHour = hourInTimezone(slotDate, city.timezone);
  if (localHour < 6) return "sleep";
  if (localHour < workingHours.start) return "earlyLate";
  if (localHour < workingHours.end) return "working";
  if (localHour < 22) return "earlyLate";
  return "night";
}

function cellLabelFor(city: CityEntry, slotDate: Date): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: city.timezone, hour: "numeric", minute: "2-digit", hour12: true,
    });
    return fmt.format(slotDate).toLowerCase().replace(" ", "");
  } catch { return ""; }
}

// --- component ---
export function TimeZoneGrid(props: TimeZoneGridProps) {
  const {
    cityCodes,
    baseDate,
    hoursPerColumn = 1,
    columns = 24,
    workingHours = { start: 9, end: 17 },
    onTimeClick,
    onShare,
    onAddToCalendar,
    onCopyToClipboard,
    innerRef,
  } = props;

  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [paneStartCol, setPaneStartCol] = useState(0); // 0 = centered at now

  // Anchor: top of hour, with offset so the current hour is the visible "now"
  const anchor = useMemo(() => {
    const t = startOfHour(baseDate);
    const totalHours = columns * hoursPerColumn;
    // shift so current hour lands in the middle-ish
    return addHours(t, -Math.floor(totalHours / 2) * hoursPerColumn);
  }, [baseDate, columns, hoursPerColumn]);

  const cities = useMemo(
    () => cityCodes.map((code) => CITY_BY_CODE[code]).filter((c): c is CityEntry => Boolean(c)),
    [cityCodes]
  );

  const totalSlots = columns;
  const slotTimes = useMemo(
    () => Array.from({ length: totalSlots }, (_, i) => addHours(anchor, (i + paneStartCol) * hoursPerColumn)),
    [anchor, totalSlots, paneStartCol, hoursPerColumn]
  );

  // Compute current-hour index per city (anchor to baseDate)
  const currentColIdx = useMemo(() => {
    const hoursFromAnchor = (baseDate.getTime() - anchor.getTime()) / 3_600_000;
    return Math.round(hoursFromAnchor / hoursPerColumn);
  }, [baseDate, anchor, hoursPerColumn]);

  if (cities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        Add a city, state, or country above to start comparing timezones.
      </div>
    );
  }

  // Day separators (when slot date rolls over in the FIRST city = the "reference" city)
  const refCity = cities[0];

  return (
    <div ref={innerRef} className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          aria-label="Pan 12 hours earlier"
          onClick={() => setPaneStartCol((p) => p - 12)}
          className="px-2 py-1 rounded-md hover:bg-slate-200 text-slate-600"
        >
          ←
        </button>
        <div className="px-3 py-1 rounded-md bg-white border border-slate-200 text-sm font-medium text-indigo-700 font-mono">
          {hoursPerColumn} hour{hoursPerColumn === 1 ? "" : "s"}
        </div>
        <button
          type="button"
          aria-label="Pan 12 hours later"
          onClick={() => setPaneStartCol((p) => p + 12)}
          className="px-2 py-1 rounded-md hover:bg-slate-200 text-slate-600"
        >
          →
        </button>

        <div className="flex-1 min-w-[200px] text-sm text-slate-600 truncate">
          {refCity && (
            <>
              <span className="font-semibold text-slate-800">{refCity.name}:</span>{" "}
              {cellLabelFor(refCity, baseDate)} – {cellLabelFor(refCity, addHours(baseDate, hoursPerColumn))}
              <span className="text-slate-400"> · Click to adjust, double-click to extend</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onAddToCalendar?.("outlook")} className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-1.5">
            <span aria-hidden>📅</span> Outlook / iCal
          </button>
          <button type="button" onClick={() => onAddToCalendar?.("google")} className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-1.5">
            <span aria-hidden>📅</span> Google Calendar
          </button>
          <button type="button" onClick={() => onCopyToClipboard?.()} className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-1.5">
            <span aria-hidden>📋</span> Clipboard
          </button>
          <button type="button" onClick={onShare} className="px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium inline-flex items-center gap-1.5">
            <span aria-hidden>🔗</span> Share this view
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-slate-100 bg-white text-xs">
        {LEGEND.map((l) => (
          <span key={l.kind} className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm border border-slate-200 ${l.color}`} />
            <span className="text-slate-600">{l.label}</span>
          </span>
        ))}
      </div>

      {/* Scroll container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          {/* Hour header */}
          <div
            className="grid border-b border-slate-100 bg-white sticky top-0 z-10"
            style={{ gridTemplateColumns: `180px repeat(${totalSlots}, minmax(48px, 1fr))` }}
            onMouseLeave={() => setHoverCol(null)}
          >
            <div className="px-4 py-2 text-xs font-medium text-slate-500">Reference</div>
            {slotTimes.map((t, idx) => {
              const isNow = idx === currentColIdx;
              const h = hourInTimezone(t, refCity?.timezone ?? "UTC");
              const isMidnight = h === 0;
              return (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setHoverCol(idx)}
                  onClick={() => onTimeClick?.(t)}
                  onDoubleClick={() => setPaneStartCol((p) => p + (idx > currentColIdx ? 12 : -12))}
                  className={[
                    "px-1 py-2 text-[10px] font-mono uppercase tracking-wider text-center border-l border-slate-100 transition",
                    isMidnight ? "text-slate-500 font-semibold" : "text-slate-400",
                    isNow ? "bg-emerald-100 text-emerald-700 font-bold" : "",
                    hoverCol === idx ? "bg-indigo-50" : "",
                  ].join(" ")}
                >
                  {fmtHour(h, true)}
                </button>
              );
            })}
          </div>

          {/* City rows */}
          {cities.map((city) => (
            <div
              key={city.code}
              className="grid border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40"
              style={{ gridTemplateColumns: `180px repeat(${totalSlots}, minmax(48px, 1fr))` }}
            >
              {/* City label cell */}
              <div className="px-4 py-3 border-r border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden className="text-base">{flagFor(city.countryCode)}</span>
                  <span className="font-semibold text-slate-800 text-sm">{city.name}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {city.state ? `${city.state}, ` : ""}{city.country}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                  {tzAbbr(city.timezone, baseDate)} · {tzOffsetLabel(city.timezone, baseDate)}
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-1">
                  {cellLabelFor(city, baseDate)} – {cellLabelFor(city, addHours(baseDate, hoursPerColumn))}
                </div>
              </div>

              {/* Hour cells */}
              {slotTimes.map((t, idx) => {
                const kind = cellKindFor(city, t, workingHours);
                const isNow = idx === currentColIdx;
                const localWallDate = dateInTimezone(t, city.timezone);
                const localHour = hourInTimezone(t, city.timezone);
                const isMidnight = localHour === 0;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoverCol(idx)}
                    className={[
                      "relative h-[68px] border-l border-slate-100 text-[10px] font-mono",
                      LEGEND.find((l) => l.kind === kind)?.color ?? "",
                      isMidnight ? "border-l-2 border-l-slate-300" : "",
                      isNow ? "ring-2 ring-emerald-500 ring-inset" : "",
                      hoverCol === idx ? "ring-2 ring-indigo-300 ring-inset" : "",
                    ].join(" ")}
                  >
                    <span className="absolute bottom-1 left-1 right-1 text-center text-slate-500 truncate">
                      {cellLabelFor(city, t)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}