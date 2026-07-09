import React, { useState, useMemo } from "react";
import { Calendar, Clock, Sun } from "lucide-react";
import { COUNTRY_HOLIDAYS, CountryCode } from "../../data/countries";
import ToolSdkPanel from "./ToolSdkPanel";
import ApiVerifyChip from "./ApiVerifyChip";
import { holidayHoursVerify } from "../../utils/apiToolMap";
import { getToolI18n } from "../../utils/toolTranslations";

interface Props { lang?: string; }

export default function HolidayHoursCalculator({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const [country, setCountry] = useState<CountryCode>("US");
  const [year, setYear] = useState(new Date().getFullYear());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMin, setBreakMin] = useState(60);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const countries: CountryCode[] = ["US", "GB", "FR", "DE", "IN", "JP", "CN", "AE", "AU", "SG"];
  const years = [year - 1, year, year + 1];

  const holidays = useMemo(() => (COUNTRY_HOLIDAYS[country] || []).filter(h => h.date.startsWith(String(year))), [country, year]);

  const calcDailyHours = () => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const dailyMinutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm) - breakMin);
    return dailyMinutes / 60;
  };
  const dailyHours = calcDailyHours();

  const yearWorkingDays = (() => {
    let count = 0;
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const iso = d.toISOString().slice(0, 10);
      const isHoliday = holidays.some(h => h.date === iso);
      if (workDays.includes(day) && !isHoliday) count++;
    }
    return count;
  })();

  const totalHours = Math.round(yearWorkingDays * dailyHours);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      <div className="rounded-3xl bg-gradient-to-r from-[#e8eaf6] via-[#e0f2f1] to-[#e8f5e9] p-8 md:p-12 text-center relative overflow-hidden shadow-sm border border-[#e0e0e0]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fce4ec]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#2e7d32] text-xs font-semibold shadow-sm border border-[#eeeeee]">
            <Calendar size={14} /> HOLIDAY & HOURS INTELLIGENCE
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#212121]">{t.holidayCalendar}</h1>
          <p className="text-sm md:text-base text-[#616161] font-sans leading-relaxed">
            {t.publicHolidays} + {t.workingHours}
          </p>
        </div>
      </div>

      <div id="setup-card" className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.selectCountry}</label>
            <select value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm text-[#212121] font-semibold outline-none focus:border-[#3f51b5] transition">
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.selectYear}</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm text-[#212121] font-semibold outline-none focus:border-[#3f51b5] transition">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.workingDays}</label>
            <div className="flex gap-1.5 mt-1">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <button key={i} onClick={() => setWorkDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort())}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition ${workDays.includes(i) ? "bg-[#3f51b5] text-white" : "bg-[#fafafa] border border-[#e0e0e0] text-[#616161]"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider border-b border-[#eeeeee] pb-3">
          <Clock size={14} /> {t.workingHours}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider mb-2">{t.startTime}</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm text-[#212121] font-semibold outline-none focus:border-[#3f51b5]" />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider mb-2">{t.endTime}</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm text-[#212121] font-semibold outline-none focus:border-[#3f51b5]" />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider mb-2">{t.breakMinutes}</label>
            <input type="number" min={0} max={300} value={breakMin} onChange={(e) => setBreakMin(parseInt(e.target.value) || 0)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm text-[#212121] font-semibold outline-none focus:border-[#3f51b5]" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#eeeeee]">
          <div className="text-center p-5 bg-[#e8f5e9] rounded-2xl border border-[#2e7d32]/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#2e7d32]">{t.hoursPerDay}</div>
            <div className="text-3xl font-bold text-[#1b5e20] mt-1">{dailyHours.toFixed(1)}</div>
          </div>
          <div className="text-center p-5 bg-[#e3f2fd] rounded-2xl border border-[#1976d2]/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#1976d2]">{t.totalWorkingDays}</div>
            <div className="text-3xl font-bold text-[#0d47a1] mt-1">{yearWorkingDays}</div>
          </div>
          <div className="text-center p-5 bg-[#f3e5f5] rounded-2xl border border-[#7b1fa2]/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#7b1fa2]">{t.totalWorkingHours}</div>
            <div className="text-3xl font-bold text-[#4a148c] mt-1">{totalHours}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider">
            <Sun size={14} /> {t.holidayCalendar} {year}
          </div>
          <span className="text-[10px] font-mono text-[#9e9e9e]">{holidays.length} {t.publicHolidays.toLowerCase()}</span>
        </div>
        <div className="space-y-2">
          {holidays.length === 0 ? (
            <div className="text-sm text-[#9e9e9e] py-3 text-center">No holidays tracked for this period.</div>
          ) : holidays.map((h, idx) => {
            const hDate = new Date(h.date + "T00:00:00");
            const dayLabel = hDate.toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US", { weekday: "short", month: "short", day: "numeric" });
            const colorMap: Record<string, string> = { federal: "bg-[#e8eaf6] border-[#3f51b5] text-[#3f51b5]", bank: "bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]", religious: "bg-[#fce4ec] border-[#c2185b] text-[#c2185b]", public: "bg-[#fff3e0] border-[#e65100] text-[#e65100]" };
            const c = colorMap[h.type] || colorMap.public;
            return (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border ${c} transition hover:shadow-md`}>
                <div className="flex items-center gap-3">
                  <div className="text-center bg-white rounded-xl px-3 py-1.5 border border-current/20">
                    <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">{hDate.toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US", { month: "short" })}</div>
                    <div className="text-xl font-bold leading-none">{hDate.getDate()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{h.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider opacity-70 mt-0.5">{dayLabel} - {h.type}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ToolSdkPanel
        summary="Federal + observance holidays for any year plus working-day count and total annual hours."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// All US holidays for 2026
const { holidays } = await client.countries.holidays("US", 2026);
holidays.forEach((h) => console.log(h.date, h.name, h.type));

// Working hours — 8h/day default; override for EU-style 7.5h
const hours = await client.countries.workingHours("US", {
  year: 2026,
  hoursPerDay: 8,
});
console.log(\`\${hours.workingDays} working days → \${hours.totalHours} hours\`);`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/countries/US/holidays?year=2026"
curl "https://timeanddatepro.com/api/v1/countries/US/working-hours?year=2026"`}
        docsHref="/docs/integrations/holiday-hours"
      />
      <ApiVerifyChip config={holidayHoursVerify} state={{ country: "US", year }} />
    </div>
  );
}
