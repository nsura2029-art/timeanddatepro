import React, { useState, useEffect } from "react";
import { 
  Globe, 
  TrendingUp, 
  Search, 
  MapPin, 
  Clock,
  ArrowRight
} from "lucide-react";
import { getTimezoneOffsetAndAbbr } from "../data/countries";
import { CountryPreferences } from "../types";
import { getTheme } from "../utils/theme";

interface GlobalSnapshotProps {
  preferences: CountryPreferences;
  onSearchSelect: (queryText: string) => void;
}

export default function GlobalSnapshot({ preferences, onSearchSelect }: GlobalSnapshotProps) {
  const [currentTime, setCurrentTime] = useState(new Date("2026-07-07T12:00:00"));
  const t = getTheme(preferences.theme);

  useEffect(() => {
    const startTime = new Date("2026-07-07T12:00:00").getTime();
    const initRealTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - initRealTime;
      setCurrentTime(new Date(startTime + elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check market status (standard hours: Mon-Fri 9:30 AM to 4:00 PM local)
  const getMarketStatus = (timezone: string) => {
    try {
      // Get day
      const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' });
      const day = dayFormatter.format(currentTime);
      const isWeekend = day === "Sat" || day === "Sun";

      // Get hours and minutes
      const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
      const minFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, minute: 'numeric' });
      const hour = parseInt(hourFormatter.format(currentTime));
      const minutes = parseInt(minFormatter.format(currentTime));

      const timeValue = hour + minutes / 60;
      const isOpen = !isWeekend && timeValue >= 9.5 && timeValue < 16;

      return isOpen;
    } catch (e) {
      return false;
    }
  };

  const markets = [
    { name: "New York (NYSE)", timezone: "America/New_York", code: "US" },
    { name: "London (LSE)", timezone: "Europe/London", code: "GB" },
    { name: "Frankfurt (DAX)", timezone: "Europe/Berlin", code: "DE" },
    { name: "Tokyo (TSE)", timezone: "Asia/Tokyo", code: "JP" },
    { name: "Sydney (ASX)", timezone: "Australia/Sydney", code: "AU" },
    { name: "Hong Kong (HKEX)", timezone: "Asia/Singapore", code: "HK" }, // Close enough timezone
  ];

  const popularSearches = [
    "What time is it in Dubai?",
    "Convert 3 PM New York to Singapore",
    "Schedule a meeting between London, New York, and India",
    "How many business days until December 31?",
    "Is today a holiday in Germany?",
    "When does DST end in the US?",
    "What is the best meeting time between California and Japan?"
  ];

  return (
    <div className="scroll-mt-20">
      <div className="mb-6">
        <span className={`text-xs font-mono ${t.accentText} font-semibold uppercase tracking-wider`}>Macro Observatory</span>
        <h2 className="text-2xl font-sans font-semibold text-slate-100 tracking-tight mt-1">Global Time Snapshot</h2>
        <p className="text-xs text-slate-400 mt-1">Macro time coordinates, active stock exchange sessions, and highly trending timezone queries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Market Statuses Card */}
        <div className={`rounded-xl border ${t.border} ${t.cardBg} p-5 shadow-lg lg:col-span-2`}>
          <div className={`flex items-center gap-2 text-xs font-mono ${t.accentText} uppercase tracking-wider mb-4`}>
            <TrendingUp size={14} />
            <span>Market Trading Hours</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {markets.map((m) => {
              const open = getMarketStatus(m.timezone);
              return (
                <div key={m.name} className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-400 font-medium line-clamp-1">{m.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Offset: {getTimezoneOffsetAndAbbr(m.timezone, currentTime).abbr}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    open 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                  }`}>
                    {open ? "Open" : "Closed"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-[10px] text-slate-500 font-mono text-center sm:text-left leading-relaxed">
            Market hours are estimated based on standard business schedules (9:30 AM to 4:00 PM local time, Monday to Friday) for each exchange.
          </div>
        </div>

        {/* Popular Searches & Instant query trigger */}
        <div className={`rounded-xl border ${t.border} ${t.cardBg} p-5 shadow-lg`}>
          <div className={`flex items-center gap-2 text-xs font-mono ${t.accentText} uppercase tracking-wider mb-4`}>
            <Search size={14} />
            <span>Top Searched Now</span>
          </div>

          <div className="space-y-2">
            {popularSearches.slice(0, 5).map((ps, idx) => (
              <button 
                key={idx}
                onClick={() => onSearchSelect(ps)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-700 text-xs text-slate-300 font-medium transition flex items-center justify-between gap-3 group animate-fade-in"
              >
                <span className="line-clamp-1 font-sans">{ps}</span>
                <ArrowRight size={12} className={`text-slate-500 group-hover:${t.accentText} transition shrink-0 group-hover:translate-x-0.5`} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
