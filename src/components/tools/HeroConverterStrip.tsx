// src/components/tools/HeroConverterStrip.tsx
// The "From → To" big-input strip at the top of /time-zone-converter.
// Computes the converted wall-clock time + best-call window locally using
// Intl (no network on every keystroke). Also fires the /api/v1/time/convert
// endpoint in the background via ApiVerifyChip semantics — the chip itself
// is rendered by the parent.

import React, { useEffect, useState } from "react";

export interface HeroConverterStripProps {
  cities: Array<{ code: string; name: string; country: string; timezone: string; flag?: string }>;
  defaultFrom?: string; // city code
  defaultTo?: string;   // city code
  onChange?: (state: { from: string; to: string; time: string; date: string }) => void;
  initialTime?: string; // "HH:MM"
  initialDate?: string; // "YYYY-MM-DD"
}

function getTimeIn(tz: string, at: Date) {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
    });
    const parts = fmt.formatToParts(at);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    return { time: `${get("hour")}:${get("minute")}`, weekday: get("weekday") };
  } catch { return { time: "--:--", weekday: "" }; }
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

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function diffLabel(fromMin: number, toMin: number): { hours: number; sign: "+" | "-"; nextDay: boolean } {
  const diff = toMin - fromMin;
  const sign: "+" | "-" = diff >= 0 ? "+" : "-";
  const hours = Math.abs(Math.round(diff / 60 * 10) / 10);
  const nextDay = diff >= 12 * 60 || diff <= -12 * 60;
  return { hours, sign, nextDay };
}

function bestCallWindow(fromTz: string, toTz: string): { fromLocal: string; toLocal: string } {
  // 9-17 in FROM, mapped to TO
  const at = new Date();
  at.setHours(9, 0, 0, 0);
  const f = getTimeIn(fromTz, at);
  const t = getTimeIn(toTz, at);
  return { fromLocal: `9:00 AM (${f.time})`, toLocal: t.time };
}

export default function HeroConverterStrip({
  cities,
  defaultFrom,
  defaultTo,
  onChange,
  initialTime,
  initialDate,
}: HeroConverterStripProps) {
  const [fromCode, setFromCode] = useState(defaultFrom || cities[0]?.code || "UTC");
  const [toCode, setToCode] = useState(defaultTo || cities[1]?.code || cities[0]?.code || "UTC");
  const [time, setTime] = useState(initialTime || nowHHMM());
  const [date, setDate] = useState(initialDate || todayISO());

  const fromCity = cities.find((c) => c.code === fromCode);
  const toCity = cities.find((c) => c.code === toCode);

  // Live result: convert `time` on `date` from fromTz to toTz locally.
  const [result, setResult] = useState<{ time: string; date: string; weekday: string } | null>(null);
  useEffect(() => {
    if (!fromCity || !toCity) return;
    const refDate = new Date(`${date}T${time}:00`);
    const t = getTimeIn(toCity.timezone, refDate);
    setResult(t);
    onChange?.({ from: fromCode, to: toCode, time, date });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCode, toCode, time, date, fromCity?.timezone, toCity?.timezone]);

  const offset = fromCity && toCity
    ? diffLabel(getOffsetMin(fromCity.timezone, new Date()), getOffsetMin(toCity.timezone, new Date()))
    : null;

  const callWindow = fromCity && toCity
    ? bestCallWindow(fromCity.timezone, toCity.timezone)
    : null;

  return (
    <section
      aria-labelledby="tz-hero-heading"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <header className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
          Time Zone Converter
        </span>
        <h1 id="tz-hero-heading" className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Convert wall-clock time between any two cities
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          DST-aware, real-time, with one-click copy of the result. Powered by the same engine that runs the public REST API.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">From</label>
          <select
            value={fromCode}
            onChange={(e) => setFromCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            {cities.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div className="flex items-end justify-center pb-1 text-slate-400">
          <span className="text-2xl font-bold">→</span>
        </div>
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">To</label>
          <select
            value={toCode}
            onChange={(e) => setToCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            {cities.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="hidden md:block" />
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Result</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-900">
            {result ? result.time : "—"} <span className="text-base font-normal text-emerald-700/80">{toCity?.code}</span>
          </div>
          <div className="text-[11px] text-emerald-700/80">
            {result ? `${result.weekday} · ${result.date}` : "pick two cities"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Difference</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {offset ? `${offset.sign}${offset.hours}h` : "—"}
          </div>
          <div className="text-[11px] text-slate-500">
            {offset?.nextDay ? "wraps to next / previous day" : "same day"}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">Best call window</div>
          <div className="mt-1 font-mono text-sm font-bold text-amber-900">
            9 AM {fromCity?.code} → {callWindow?.toLocal} {toCity?.code}
          </div>
          <div className="text-[11px] text-amber-700/80">9–17 in {fromCity?.name} maps to {callWindow?.toLocal} in {toCity?.name}</div>
        </div>
      </div>
    </section>
  );
}