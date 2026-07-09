import React, { useState } from "react";
import { CalendarRange, ArrowRight, Calendar } from "lucide-react";
import { getToolI18n } from "../../utils/toolTranslations";
import ToolSdkPanel from "./ToolSdkPanel";
import ApiVerifyChip from "./ApiVerifyChip";
import { dateDiffVerify } from "../../utils/apiToolMap";

interface Props { lang?: string; }

export default function DateDifference({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const today = new Date();
  const monthLater = new Date(today.getTime() + 30 * 86400000);

  const [start, setStart] = useState(today.toISOString().slice(0, 10));
  const [end, setEnd] = useState(monthLater.toISOString().slice(0, 10));
  const [inclusive, setInclusive] = useState(true);

  const startD = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  const valid = !isNaN(startD.getTime()) && !isNaN(endD.getTime()) && endD >= startD;

  let days = 0, weeks = 0, months = 0, years = 0, totalMs = 0;
  if (valid) {
    totalMs = endD.getTime() - startD.getTime();
    days = Math.floor(totalMs / 86400000) + (inclusive ? 1 : 0);
    weeks = Math.floor(days / 7);
    months = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth());
    years = endD.getFullYear() - startD.getFullYear();
  }

  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor(totalMs / 60000);

  const fmt = (d: Date) => d.toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const ymd = () => {
    if (!valid) return "—";
    let y = endD.getFullYear() - startD.getFullYear();
    let m = endD.getMonth() - startD.getMonth();
    let d = endD.getDate() - startD.getDate();
    if (d < 0) { m--; d += new Date(endD.getFullYear(), endD.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const parts = [];
    if (y) parts.push(`${y} year${y > 1 ? "s" : ""}`);
    if (m) parts.push(`${m} month${m > 1 ? "s" : ""}`);
    if (d) parts.push(`${d} day${d > 1 ? "s" : ""}`);
    return parts.join(", ") || "Same day";
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <header className="mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
            <CalendarRange size={11} /> DATE DIFFERENCE ENGINE
          </span>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-[#212121]">
            {t.daysBetween} {t.from.toLowerCase()} {t.from} {t.to.toLowerCase()}
          </h1>
          <p className="mt-1 text-sm text-[#616161]">{t.calendarDays} / {t.workingDays} / {t.totalTime}</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.startDate}</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#212121] outline-none focus:border-[#3f51b5]" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.endDate}</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#212121] outline-none focus:border-[#3f51b5]" />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[#f3e5f5] rounded-xl border border-[#7b1fa2]/30">
          <input type="checkbox" id="inc" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)}
            className="w-4 h-4 accent-[#7b1fa2]" />
          <label htmlFor="inc" className="text-xs font-semibold text-[#4a148c] cursor-pointer flex-1">
            {t.includeEndDate} ({inclusive ? t.inclusive : t.exclusive})
          </label>
        </div>

        {valid && (
          <>
            <div className="rounded-2xl p-6 bg-gradient-to-br from-[#e8eaf6] to-[#e0f2f1] border border-[#3f51b5]/20">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#3f51b5] mb-2 text-center">{t.daysBetween}</div>
              <div className="text-5xl md:text-6xl font-bold text-[#1a237e] text-center">{days}</div>
              <div className="text-center text-xs text-[#3f51b5] mt-2 font-mono">{fmt(startD)} <ArrowRight size={11} className="inline" /> {fmt(endD)}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t.weeksBetween, value: weeks },
                { label: t.monthsBetween, value: months },
                { label: t.yearsBetween, value: years },
                { label: t.totalTime, value: `${hours}h ${minutes % 60}m` }
              ].map((s, i) => (
                <div key={i} className="text-center p-4 bg-[#fafafa] rounded-2xl border border-[#e0e0e0]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9e9e]">{s.label}</div>
                  <div className="text-xl font-bold text-[#212121] mt-1.5">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#fff3e0] rounded-2xl border border-[#e65100]/30 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#e65100] mb-1">{t.humanized}</div>
              <div className="text-base font-bold text-[#bf360c]">{ymd()}</div>
            </div>
          </>
        )}
        {!valid && (
          <div className="text-center text-sm text-rose-600 py-4">End date must be after start date.</div>
        )}
      </div>
      <ToolSdkPanel
        summary="Days between two dates — calendar mode returns years/months/days; business mode counts working days per country."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// Calendar mode
const cal = await client.time.diff({
  from: "2026-01-01",
  to: "2026-12-31",
});

// Business mode (US holidays excluded)
const biz = await client.time.diff({
  from: "2026-01-01",
  to: "2026-12-31",
  mode: "business",
  country: "US",
});
console.log(cal.totalDays, biz.businessDays);`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/time/diff?from=2026-01-01&to=2026-12-31&mode=business&country=US"`}
        docsHref="/docs/integrations/date-difference"
      />
      <ApiVerifyChip config={dateDiffVerify} state={{ from: start, to: end, mode: "calendar", country: "US" }} />
    </div>
  );
}
