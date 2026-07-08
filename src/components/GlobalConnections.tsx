import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Plus, 
  Trash2, 
  Sun, 
  Moon, 
  Calendar,
  X,
  PlusCircle,
  Clock
} from "lucide-react";
import { CountryPreferences, CityInfo } from "../types";
import { formatLocalTime, getTimezoneOffsetAndAbbr, COUNTRY_HOLIDAYS, CITY_DATA, ALL_LOCATIONS_LIST } from "../data/countries";
import { getTheme } from "../utils/theme";

interface GlobalConnectionsProps {
  preferences: CountryPreferences;
  onUpdateFavorites: (newFavs: string[]) => void;
  onOpenMeetingPlanner: () => void;
}

export default function GlobalConnections({ preferences, onUpdateFavorites, onOpenMeetingPlanner }: GlobalConnectionsProps) {
  const [currentTime, setCurrentTime] = useState(new Date("2026-07-07T12:00:00")); // Anchor standard
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const t = getTheme(preferences.theme);

  // Update clock every second (using 2026 anchor offset)
  useEffect(() => {
    const startTime = new Date("2026-07-07T12:00:00").getTime();
    const initRealTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - initRealTime;
      setCurrentTime(new Date(startTime + elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const favorites = preferences.favoriteCities;

  // Working Hours Status calculation
  const getWorkingHourStatus = (timezone: string, targetDate: Date) => {
    try {
      // Determine day of week in target timezone
      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short'
      });
      const dayStr = dayFormatter.format(targetDate);
      const isWknd = dayStr === "Sat" || dayStr === "Sun";

      // Hour in target timezone
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false
      });
      const localH = parseInt(hourFormatter.format(targetDate));

      if (isWknd) return { code: "gray", label: "Weekend", class: "bg-slate-500/10 text-slate-400 border border-slate-700/50" };

      if (localH >= 9 && localH < 17) {
        return { code: "green", label: "Working Hours", class: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      } else if ((localH >= 7 && localH < 9) || (localH >= 17 && localH < 22)) {
        return { code: "yellow", label: "Early/Late", class: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      } else {
        return { code: "red", label: "Sleep/Off-hours", class: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
      }
    } catch (e) {
      return { code: "gray", label: "Offline", class: "bg-slate-500/10 text-slate-400 border border-slate-700/50" };
    }
  };

  // Day context comparison (Is it tomorrow or yesterday relative to preferences timezone)
  const getDayLabel = (targetTz: string, baseDate: Date) => {
    try {
      const baseFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: preferences.timezone,
        day: 'numeric'
      });
      const targetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTz,
        day: 'numeric'
      });

      const baseDay = parseInt(baseFormatter.format(baseDate));
      const targetDay = parseInt(targetFormatter.format(baseDate));

      if (targetDay > baseDay) return { text: "Tomorrow", style: "text-blue-400 font-bold" };
      if (targetDay < baseDay) return { text: "Yesterday", style: "text-rose-400" };
      return { text: "Today", style: "text-slate-500" };
    } catch (e) {
      return { text: "Today", style: "text-slate-500" };
    }
  };

  // Time difference in hours
  const getTimeDiffLabel = (targetTz: string, baseDate: Date) => {
    try {
      const baseString = baseDate.toLocaleString("en-US", { timeZone: preferences.timezone });
      const targetString = baseDate.toLocaleString("en-US", { timeZone: targetTz });

      const baseLocal = new Date(baseString);
      const targetLocal = new Date(targetString);

      const diffMs = targetLocal.getTime() - baseLocal.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      if (diffHours === 0) return "Same time";
      return diffHours > 0 ? `+${diffHours} hrs` : `${diffHours} hrs`;
    } catch (e) {
      return "";
    }
  };

  const handleAddCity = (tz: string) => {
    if (!favorites.includes(tz)) {
      onUpdateFavorites([...favorites, tz]);
    }
    setShowAddModal(false);
  };

  const handleRemoveCity = (tz: string) => {
    onUpdateFavorites(favorites.filter(f => f !== tz));
  };

  // Filter list for add modal
  const filteredLocations = ALL_LOCATIONS_LIST.filter(loc => {
    return (
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.timezone.toLowerCase().includes(searchQuery.toLowerCase())
    ) && !favorites.includes(loc.timezone);
  });

  return (
    <div className="scroll-mt-20">
      
      {/* Header section with add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <span className={`text-xs font-mono ${t.accentText} font-semibold uppercase tracking-wider`}>World Clock Hub</span>
          <h2 className={`text-2xl font-sans font-semibold ${t.text} tracking-tight mt-1`}>Your Global Connections</h2>
          <p className="text-xs text-slate-400 mt-1">Smarter coordination cards. Color statuses map directly to their current office hours.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Add Custom City</span>
        </button>
      </div>

      {/* Dashboard City Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {favorites.map((tz) => {
          const city = CITY_DATA[tz] || { name: tz.split("/").pop()?.replace("_", " "), country: "Unknown", timezone: tz, code: "CLK" };
          const offsetInfo = getTimezoneOffsetAndAbbr(tz, currentTime);
          const status = getWorkingHourStatus(tz, currentTime);
          const dayContext = getDayLabel(tz, currentTime);
          const diffLabel = getTimeDiffLabel(tz, currentTime);

          // Approximate sun/moon for simple icon
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hour12: false
          });
          const targetH = parseInt(formatter.format(currentTime));
          const isNight = targetH < 6 || targetH >= 19;

          // Override tomorrow label color dynamically if needed
          const tomorrowStyle = dayContext.text === "Tomorrow" ? `${t.accentText} font-bold` : dayContext.style;

          return (
            <div 
              key={tz}
              className={`group rounded-xl border ${t.border} ${t.cardBg} p-5 shadow-lg relative overflow-hidden flex flex-col justify-between ${t.borderHover} hover:bg-slate-50/40 transition-all`}
            >
              <div>
                {/* Top section: City Details & Remove button */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">{city.country}</span>
                    <h3 className={`text-lg font-semibold ${t.text}`}>{city.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleRemoveCity(tz)}
                      className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove city connection"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Status indicator pill */}
                <div className="flex items-center gap-2 mt-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${status.class}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      status.code === 'green' ? 'bg-emerald-400' :
                      status.code === 'yellow' ? 'bg-amber-400' :
                      status.code === 'red' ? 'bg-rose-400' : 'bg-slate-400'
                    }`}></span>
                    {status.label}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 font-mono font-semibold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                    {diffLabel}
                  </span>
                </div>
              </div>

              {/* Bottom section: Converted live clock */}
              <div className={`border-t ${t.border} mt-5 pt-4 flex justify-between items-end`}>
                <div>
                  <div className={`text-2xl font-sans font-bold ${t.text} leading-none`}>
                    {formatLocalTime(currentTime, preferences.timeFormat, tz)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <span>{offsetInfo.abbr} ({offsetInfo.offsetStr})</span>
                    <span>•</span>
                    <span className={tomorrowStyle}>{dayContext.text}</span>
                  </div>
                </div>

                <div className={`text-slate-500 group-hover:${t.accentText} transition`}>
                  {isNight ? <Moon size={16} /> : <Sun size={16} className="text-amber-500/80" />}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Meet planner direct hook CTA */}
      <div className={`mt-6 p-4 rounded-xl border ${t.border} ${t.cardBg} flex flex-col md:flex-row items-center justify-between gap-4`}>
        <span className="text-xs text-slate-400 text-center md:text-left leading-relaxed">
          Need to align schedules? Visual overlap matrices help avoid midnight disturbance during planning calls.
        </span>
        <button 
          onClick={onOpenMeetingPlanner}
          className={`px-4 py-2 ${t.btnPrimary} font-bold text-xs rounded-lg transition shrink-0 cursor-pointer`}
        >
          Plan a meeting across these locations
        </button>
      </div>

      {/* ADD CITY MODAL OVERLAY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`relative w-full max-w-md rounded-xl border ${t.bg === "bg-white" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-100"} p-6 shadow-2xl flex flex-col`}>
            
            <div className={`flex items-center justify-between pb-4 border-b ${t.border}`}>
              <h3 className={`text-md font-semibold ${t.text} flex items-center gap-2`}><Globe size={18} className="text-blue-500" /> Add City Connection</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:opacity-85 p-1 rounded-full hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4">
              <input 
                type="text"
                placeholder="Search by city name, country, or timezone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-slate-50 ${t.text === "text-slate-900" ? "text-slate-800" : "text-slate-200"} border ${t.border} rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400`}
              />
            </div>

            <div className="overflow-y-auto max-h-[40vh] space-y-1">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <div 
                    key={loc.timezone}
                    onClick={() => handleAddCity(loc.timezone)}
                    className="flex justify-between items-center p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200/50 cursor-pointer transition"
                  >
                    <div>
                      <div className={`text-sm ${t.text === "text-slate-900" ? "text-slate-800" : "text-slate-200"} font-medium`}>{loc.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{loc.country} • {loc.timezone}</div>
                    </div>
                    <span className="text-xs text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded border border-blue-100 font-mono">
                      + Add
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No matches found for your query. Try searching general capital cities.
                </div>
              )}
            </div>

            <div className={`pt-4 border-t ${t.border} flex justify-end mt-4`}>
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition font-semibold"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
