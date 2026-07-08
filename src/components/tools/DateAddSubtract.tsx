import React, { useState } from "react";
import { Plus, Minus, Calendar } from "lucide-react";
import { COUNTRY_HOLIDAYS } from "../../data/countries";
import { getToolI18n } from "../../utils/toolTranslations";

interface Props { lang?: string; }

export default function DateAddSubtract({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const today = new Date();
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [op, setOp] = useState<"add" | "subtract">("add");
  const [value, setValue] = useState(30);
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");
  const [businessOnly, setBusinessOnly] = useState(false);

  const compute = (): Date => {
    const start = new Date(startDate + "T00:00:00");
    let result = new Date(start);
    if (unit === "days") result.setDate(result.getDate() + (op === "add" ? value : -value));
    else if (unit === "weeks") result.setDate(result.getDate() + (op === "add" ? value * 7 : -value * 7));
    else if (unit === "months") result.setMonth(result.getMonth() + (op === "add" ? value : -value));
    else if (unit === "years") result.setFullYear(result.getFullYear() + (op === "add" ? value : -value));
    return result;
  };

  let result = compute();
  let skipped = 0;

  if (businessOnly) {
    let dir = op === "add" ? 1 : -1;
    let count = 0;
    let target = value;
    const holidays = COUNTRY_HOLIDAYS.US || [];
    while (count < target) {
      result.setDate(result.getDate() + dir);
      const dow = result.getDay();
      const iso = result.toISOString().slice(0, 10);
      const isHoliday = holidays.some(h => h.date === iso);
      if (dow !== 0 && dow !== 6 && !isHoliday) count++;
      else skipped++;
    }
  }

  const fmt = (d: Date) => d.toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const dayOfWeek = result.toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US", { weekday: "long" });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      <div className="rounded-3xl bg-gradient-to-r from-[#e8eaf6] via-[#e0f2f1] to-[#e8f5e9] p-8 md:p-12 text-center relative overflow-hidden shadow-sm border border-[#e0e0e0]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fce4ec]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#2e7d32] text-xs font-semibold shadow-sm border border-[#eeeeee]">
            <Calendar size={14} /> DATE ARITHMETIC ENGINE
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#212121]">
            {op === "add" ? t.add : t.subtract} {t.workingDays.toLowerCase()}
          </h1>
          <p className="text-sm md:text-base text-[#616161] font-sans leading-relaxed">
            {t.addDays} / {t.addWeeks} / {t.addMonths} / {t.addYears}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.startDate}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#212121] outline-none focus:border-[#3f51b5]" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.operation}</label>
            <div className="flex gap-2">
              <button onClick={() => setOp("add")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 ${op === "add" ? "bg-[#e8f5e9] border-2 border-[#2e7d32] text-[#2e7d32]" : "bg-[#fafafa] border border-[#e0e0e0] text-[#616161]"}`}>
                <Plus size={14} /> {t.add}
              </button>
              <button onClick={() => setOp("subtract")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 ${op === "subtract" ? "bg-[#fce4ec] border-2 border-[#c2185b] text-[#c2185b]" : "bg-[#fafafa] border border-[#e0e0e0] text-[#616161]"}`}>
                <Minus size={14} /> {t.subtract}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider mb-2">{t.operation === t.operation ? "Value" : "Value"}</label>
            <input type="number" min={1} value={value} onChange={(e) => setValue(parseInt(e.target.value) || 1)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-base font-mono font-bold text-[#3f51b5] outline-none focus:border-[#3f51b5]" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider mb-2">Unit</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["days", "weeks", "months", "years"] as const).map(u => (
                <button key={u} onClick={() => setUnit(u)}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${unit === u ? "bg-[#3f51b5] text-white" : "bg-[#fafafa] border border-[#e0e0e0] text-[#616161]"}`}>
                  {u === "days" ? t.addDays : u === "weeks" ? t.addWeeks : u === "months" ? t.addMonths : t.addYears}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[#fff3e0] rounded-xl border border-[#e65100]/30">
          <input type="checkbox" id="bus" checked={businessOnly} onChange={(e) => setBusinessOnly(e.target.checked)}
            className="w-4 h-4 accent-[#e65100]" />
          <label htmlFor="bus" className="text-xs font-semibold text-[#bf360c] cursor-pointer flex-1">
            {t.businessDaysOnly} ({t.skipWeekends})
          </label>
        </div>

        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#e8eaf6] to-[#e0f2f1] border border-[#3f51b5]/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#3f51b5] mb-2">{t.result}</div>
          <div className="text-2xl md:text-3xl font-bold text-[#1a237e]">{fmt(result)}</div>
          <div className="text-xs text-[#3f51b5] mt-1.5 font-mono">{dayOfWeek}</div>
          {businessOnly && skipped > 0 && (
            <div className="mt-3 text-[10px] font-mono text-[#616161]">
              ({skipped} {t.skipWeekends.toLowerCase()} skipped)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
