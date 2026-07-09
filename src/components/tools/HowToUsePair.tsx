// src/components/tools/HowToUsePair.tsx
// Replaces the generic FAQ on dedicated pair pages. Shows a concise
// "how to use this converter" guide that uses the actual pair cities
// so the on-page copy is immediately useful AND SEO-rich with the
// pair's names + computed hour difference + working-hour overlap.

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Video,
  Calendar as CalendarIcon,
  Share2,
  ArrowRight,
} from "lucide-react";
import { CITY_BY_CODE } from "../../data/cities";
import type { PairRoute } from "../../utils/pairRoutes";

interface Props {
  pair: PairRoute;
  lang: string;
}

const STEP_LABELS = [
  { Icon: Clock,   title: "Read the live offset",       desc: "Each row shows the current wall-clock time in that city. Green column = right now, anywhere else moves with your scroll." },
  { Icon: ArrowRight, title: "Compare working hours",    desc: "Cells colored light-green are 9-17 local. Hover any column across all rows to see the same hour in every city." },
  { Icon: Video,    title: "Schedule a meeting",         desc: "Double-click a column to extend ±12 hours around it \u2014 perfect for finding a window where both teams are awake." },
  { Icon: CalendarIcon, title: "Add to your calendar",   desc: "Use the toolbar's 'Add to calendar' dropdown to drop a 1-hour event in Google / Outlook / iCal." },
  { Icon: Share2,   title: "Share the live view",        desc: "Click 'Share' to open the OS share sheet with a PNG + link, or 'Save PNG' to download just the image." },
];

function getHourDiff(fromTz: string, toTz: string, now = new Date()): { hours: number; direction: "ahead" | "behind" } {
  const fmt = (tz: string) => {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false });
    const p = f.formatToParts(now);
    return parseInt(p.find((x) => x.type === "hour")?.value ?? "0", 10);
  };
  // Account for minute-level by sampling both
  const fmtMin = (tz: string) => {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
    const parts = f.formatToParts(now);
    return parseInt(parts.find((x) => x.type === "hour")?.value ?? "0", 10) * 60 +
           parseInt(parts.find((x) => x.type === "minute")?.value ?? "0", 10);
  };
  const from = fmtMin(fromTz);
  const to = fmtMin(toTz);
  const raw = (to - from + 24 * 60) % (24 * 60);
  if (raw === 24 * 60 || raw === 0) return { hours: 0, direction: "ahead" };
  return {
    hours: raw > 12 * 60 ? raw - 24 * 60 : raw,
    direction: raw > 12 * 60 ? "behind" : "ahead",
  };
}

function getCurrentTimesText(fromTz: string, toTz: string, now = new Date()): string {
  const fmt = (tz: string) => {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true });
    return f.format(now);
  };
  return `${fmt(fromTz)} → ${fmt(toTz)}`;
}

export default function HowToUsePair({ pair, lang }: Props) {
  const fromCity = CITY_BY_CODE[pair.fromCode];
  const toCity = CITY_BY_CODE[pair.toCode];

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  const offset = useMemo(() => {
    if (!fromCity || !toCity) return null;
    return getHourDiff(fromCity.timezone, toCity.timezone);
  }, [fromCity, toCity, tick]);

  const currentTimes = useMemo(() => {
    if (!fromCity || !toCity) return "";
    return getCurrentTimesText(fromCity.timezone, toCity.timezone);
  }, [fromCity, toCity, tick]);

  return (
    <section aria-labelledby="how-to-use" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
      <header className="mb-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">How to use this tool</span>
        <h2 id="how-to-use" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
          How to read {pair.fromName} to {pair.toName} time conversion
        </h2>
        <p className="mt-1 text-[13px] text-slate-600">
          {offset && (
            <>
              Right now, {pair.toName} is <span className="font-semibold text-slate-800">{Math.abs(offset.hours)} hour{Math.abs(offset.hours) === 1 ? "" : "s"} {offset.direction}</span> {offset.direction === "ahead" ? "of" : "behind"} {pair.fromName} \u2014
              <span className="font-mono ml-1">{currentTimes}</span>.
            </>
          )}
        </p>
      </header>

      {/* Steps grid */}
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEP_LABELS.map(({ Icon, title, desc }, i) => (
          <li key={title} className="rounded-lg border border-slate-100 bg-slate-50/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-7 w-7 rounded-md bg-indigo-100 text-indigo-700 items-center justify-center">
                <Icon size={14} />
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">STEP {i + 1}</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            <p className="mt-1 text-[12px] text-slate-600 leading-snug">{desc}</p>
          </li>
        ))}
      </ol>

      {/* Quick links */}
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`/${lang || "en"}/time-zone-converter?cities=${pair.fromCode},${pair.toCode},LON&source=pair`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-medium text-slate-700"
        >
          Add London as a third city
        </a>
        <a
          href={`/${lang || "en"}/time-zone-converter?cities=${pair.fromCode},${pair.toCode},BOM&source=pair`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-medium text-slate-700"
        >
          Add Mumbai as a third city
        </a>
        <a
          href={`/${lang || "en"}/meeting-finder?cities=${pair.fromCode},${pair.toCode}&source=pair`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[12px] font-semibold text-indigo-700"
        >
          Find meeting overlap \u2192
        </a>
      </div>
    </section>
  );
}