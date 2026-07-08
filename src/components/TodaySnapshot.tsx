import React, { useState } from "react";
import { 
  Sun, 
  Moon, 
  Calendar, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  X,
  Info
} from "lucide-react";
import { CountryPreferences, Holiday } from "../types";
import { getSunriseSunset, getMoonPhase, getTimezoneOffsetAndAbbr } from "../data/countries";
import { getTheme } from "../utils/theme";

interface TodaySnapshotProps {
  preferences: CountryPreferences;
  holidays: Holiday[];
}

export default function TodaySnapshot({ preferences, holidays }: TodaySnapshotProps) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const t = getTheme(preferences.theme);

  // Calculate snapshot data based on July 7, 2026
  const anchorDate = new Date("2026-07-07T12:00:00"); // Standard anchor

  // Public Holiday Status
  const todayStr = "2026-07-07";
  const todayHoliday = holidays.find(h => h.date === todayStr);

  // Next public holiday
  const futureHolidays = holidays
    .filter(h => h.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextHoliday = futureHolidays[0];

  // Days until next holiday
  const getDaysUntil = (targetDateStr: string) => {
    const today = new Date(todayStr + "T00:00:00");
    const target = new Date(targetDateStr + "T00:00:00");
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysToNextHoliday = nextHoliday ? getDaysUntil(nextHoliday.date) : 0;

  // Sunrise / Sunset
  const { sunrise, sunset } = getSunriseSunset(preferences.timezone, anchorDate);

  // Moon Phase
  const { phaseName, phaseIcon } = getMoonPhase(anchorDate);

  // Is Business day
  const dayOfWeek = anchorDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isBusinessDay = !isWeekend && !todayHoliday;

  // DST status
  const offsetInfo = getTimezoneOffsetAndAbbr(preferences.timezone, anchorDate);
  // Simple check: most of Northern hemisphere has DST active in July
  const isDSTActive = preferences.timezone.includes("New_York") || 
                      preferences.timezone.includes("Chicago") || 
                      preferences.timezone.includes("Los_Angeles") ||
                      preferences.timezone.includes("Berlin") || 
                      preferences.timezone.includes("Paris") || 
                      preferences.timezone.includes("London");

  return (
    <div className="scroll-mt-20">
      <div className="mb-6">
        <span className={`text-[10px] font-mono ${t.accentText} font-bold uppercase tracking-wider`}>Dynamic Snapshot</span>
        <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#212121] tracking-tight mt-1">Today in {preferences.countryName}</h2>
        <p className="text-xs text-[#9e9e9e] mt-1.5">Your exact local business context, solar times, and public calendar statuses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Holiday & Business Status */}
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-5 shadow-sm relative overflow-hidden group hover:border-[#3f51b5]/40 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] text-[#212121]">
            <Calendar size={70} />
          </div>
          <div className={`flex items-center gap-2 text-[10px] font-mono ${t.accentText} font-bold uppercase tracking-wider mb-3`}>
            <Briefcase size={14} />
            <span>Workspace Status</span>
          </div>

          <div className="space-y-3 relative">
            <div className="flex justify-between items-center border-b border-[#eeeeee] pb-2">
              <span className="text-sm text-[#616161]">Business Day</span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${isBusinessDay ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                {isBusinessDay ? "Yes" : "No (Weekend/Holiday)"}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-[#eeeeee] pb-2">
              <span className="text-sm text-[#616161]">Today's Holiday</span>
              <span className="text-xs font-semibold text-[#212121] text-right max-w-[60%]">
                {todayHoliday ? `${todayHoliday.name} (${todayHoliday.type})` : "No public holiday today"}
              </span>
            </div>

            <div className="flex justify-between items-center pb-1">
              <span className="text-sm text-[#616161]">Bank Holiday Status</span>
              <span className="text-xs font-medium text-[#212121]">
                {todayHoliday && todayHoliday.type === "bank" ? "Offices Closed" : "Open for business"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Next Holiday Countdown */}
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-5 shadow-sm relative overflow-hidden group hover:border-[#3f51b5]/40 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] text-[#212121]">
            <Clock size={70} />
          </div>
          <div className={`flex items-center gap-2 text-[10px] font-mono ${t.accentText} font-bold uppercase tracking-wider mb-3`}>
            <Calendar size={14} />
            <span>Upcoming Holidays</span>
          </div>

          {nextHoliday ? (
            <div className="relative">
              <div className="text-xs text-[#616161]">Next Public Holiday:</div>
              <div className="text-lg font-sans font-semibold text-[#212121] mt-1 line-clamp-1">{nextHoliday.name}</div>
              <div className={`text-sm ${t.accentText} mt-2 font-mono font-semibold`}>
                {daysToNextHoliday} days away <span className="text-[#9e9e9e] text-xs font-normal">({new Date(nextHoliday.date + "T00:00:00").toLocaleDateString(preferences.locale, {month: 'short', day: 'numeric', year: 'numeric'})})</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#9e9e9e] py-3">No further holidays listed for 2026.</div>
          )}

          <button 
            onClick={() => setShowCalendarModal(true)}
            className={`flex items-center gap-1 text-xs ${t.accentText} font-bold hover:opacity-80 mt-4 transition cursor-pointer`}
          >
            <span>View full country calendar</span>
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 3: Solar & Lunar Astronomical times */}
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-5 shadow-sm relative overflow-hidden group hover:border-[#3f51b5]/40 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] text-[#212121]">
            <Sun size={70} />
          </div>
          <div className={`flex items-center gap-2 text-[10px] font-mono ${t.accentText} font-bold uppercase tracking-wider mb-3`}>
            <Sun size={14} />
            <span>Solar & Lunar Intel</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            <div>
              <div className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">Sunrise / Sunset</div>
              <div className="flex flex-col mt-1.5 gap-1">
                <span className="text-xs font-semibold text-[#212121] flex items-center gap-1.5"><Sun size={12} className="text-amber-500" /> {sunrise}</span>
                <span className="text-xs font-semibold text-[#212121] flex items-center gap-1.5"><Moon size={12} className="text-indigo-400" /> {sunset}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">Moon Phase & DST</div>
              <div className="flex flex-col mt-1.5 gap-1">
                <span className="text-xs font-semibold text-[#212121] flex items-center gap-1.5">
                  <span className="text-base">{phaseIcon}</span> {phaseName}
                </span>
                <span className="text-[10px] text-[#616161] font-mono">
                  DST: {isDSTActive ? "Active (+1h)" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* COUNTRY HOLIDAYS CALENDAR MODAL */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#e0e0e0] text-[#212121] p-6 shadow-2xl max-h-[80vh] flex flex-col">

            <div className="flex items-center justify-between pb-4 border-b border-[#eeeeee]">
              <div>
                <h3 className="text-lg font-sans font-semibold text-[#212121]">{preferences.countryName} Calendar</h3>
                <p className="text-xs text-[#9e9e9e]">Complete public, bank, and federal holidays tracked for 2026.</p>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-[#9e9e9e] hover:text-[#212121] p-1 rounded-full hover:bg-[#f5f5f5] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex-1 space-y-2">
              {holidays.map((h, idx) => {
                const hDate = new Date(h.date + "T00:00:00");
                const isPassed = h.date < todayStr;
                const isCurrent = h.date === todayStr;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isCurrent
                        ? `${t.accentBg} ${t.accentBorder} text-[#212121]`
                        : isPassed
                          ? "bg-[#fafafa] border-[#eeeeee] text-[#9e9e9e]"
                          : "bg-white border-[#e0e0e0] text-[#212121]"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{h.name}</div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9e9e] mt-1 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${h.type === 'federal' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                        {h.type} holiday
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-right">
                      {hDate.toLocaleDateString(preferences.locale, {month: 'short', day: 'numeric', year: 'numeric'})}
                      {isCurrent && <div className={`text-[9px] ${t.accentText} font-bold mt-0.5 font-mono uppercase tracking-widest`}>Today</div>}
                      {isPassed && <div className="text-[9px] text-[#9e9e9e] font-mono mt-0.5">Passed</div>}
                      {!isPassed && !isCurrent && <div className="text-[9px] text-emerald-600 font-mono mt-0.5">{getDaysUntil(h.date)}d left</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#eeeeee] flex justify-end">
              <button
                onClick={() => setShowCalendarModal(false)}
                className={`px-4 py-2 rounded-lg ${t.btnPrimary} font-bold text-xs transition`}
              >
                Close Calendar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
