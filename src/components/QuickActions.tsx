import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  Minus, 
  RefreshCw, 
  ArrowRightLeft, 
  CalendarDays, 
  Hourglass, 
  Terminal, 
  HelpCircle,
  X,
  Globe
} from "lucide-react";
import { CountryPreferences, Holiday, CountryCode } from "../types";
import { formatLocalTime, getTimezoneOffsetAndAbbr, COUNTRY_HOLIDAYS, CITY_DATA, ALL_LOCATIONS_LIST } from "../data/countries";
import { getTheme } from "../utils/theme";

interface QuickActionsProps {
  preferences: CountryPreferences;
  holidays: Holiday[];
  activeTab?: string;
  onCloseTab?: () => void;
  prefilledParams?: any;
  onSelectTimezone?: (timezone: string, country: CountryCode, countryName: string) => void;
  lang?: string;
}

export default function QuickActions({ 
  preferences, 
  holidays, 
  activeTab, 
  onCloseTab, 
  prefilledParams,
  onSelectTimezone,
  lang = "en"
}: QuickActionsProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const th = getTheme(preferences.theme);

  // Sync with AI search command routing
  useEffect(() => {
    if (activeTab) {
      setSelectedTool(activeTab);
    }
  }, [activeTab]);

  // --- TOOL 1: TIME ZONE CONVERTER ---
  const [convSourceTz, setConvSourceTz] = useState(preferences.timezone);
  const [convTargetTz, setConvTargetTz] = useState("Asia/Singapore");
  const [convHourScrub, setConvHourScrub] = useState(12); // Default to 12 PM (noon)
  const [convDate, setConvDate] = useState("2026-07-07");

  // Sync prefilled parameters from Gemini AI command routing
  useEffect(() => {
    if (prefilledParams && selectedTool === "converter") {
      if (prefilledParams.sourceTimezone) {
        const found = ALL_LOCATIONS_LIST.find(c => 
          c.timezone.toLowerCase() === prefilledParams.sourceTimezone.toLowerCase() ||
          c.name.toLowerCase() === prefilledParams.sourceTimezone.toLowerCase()
        );
        if (found) setConvSourceTz(found.timezone);
      }
      if (prefilledParams.targetTimezone) {
        const found = ALL_LOCATIONS_LIST.find(c => 
          c.timezone.toLowerCase() === prefilledParams.targetTimezone.toLowerCase() ||
          c.name.toLowerCase() === prefilledParams.targetTimezone.toLowerCase()
        );
        if (found) setConvTargetTz(found.timezone);
      }
      if (prefilledParams.sourceTime) {
        const [h] = prefilledParams.sourceTime.split(":");
        if (h) setConvHourScrub(parseInt(h));
      }
      if (prefilledParams.sourceDate) {
        setConvDate(prefilledParams.sourceDate);
      }
    }
  }, [prefilledParams, selectedTool]);

  const getConvertedTime = () => {
    try {
      const baseDate = new Date(convDate + "T00:00:00");
      baseDate.setHours(convHourScrub);
      
      const sourceFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: convSourceTz,
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const targetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: convTargetTz,
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      return {
        sourceText: sourceFormatter.format(baseDate),
        targetText: targetFormatter.format(baseDate)
      };
    } catch (e) {
      return { sourceText: "Error", targetText: "Error" };
    }
  };
  const { sourceText: convSourceText, targetText: convTargetText } = getConvertedTime();


  // --- TOOL 2: AI MEETING PLANNER ---
  const [meetTzs, setMeetTzs] = useState<string[]>([preferences.timezone, "Europe/London", "Asia/Kolkata"]);
  const [newMeetTz, setNewMeetTz] = useState("Asia/Tokyo");

  const addMeetTz = () => {
    if (!meetTzs.includes(newMeetTz)) {
      setMeetTzs([...meetTzs, newMeetTz]);
    }
  };

  const removeMeetTz = (tz: string) => {
    if (meetTzs.length > 1) {
      setMeetTzs(meetTzs.filter(t => t !== tz));
    }
  };

  // Check overlap for an hour index
  const getHourOverlapStatus = (hourIndex: number) => {
    // Determine overlapping green/yellow/red score
    let greenCount = 0;
    let redCount = 0;

    const baseDate = new Date("2026-07-07T00:00:00");
    baseDate.setHours(hourIndex);

    meetTzs.forEach(tz => {
      // Get hour in target timezone
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false
      });
      const localH = parseInt(formatted.format(baseDate));
      
      if (localH >= 9 && localH < 18) {
        greenCount++; // Business hours
      } else if (localH < 7 || localH >= 22) {
        redCount++; // Deep sleep/outside boundary
      }
    });

    if (greenCount === meetTzs.length) return "excellent"; // All in working hours
    if (redCount === 0) return "good"; // Overlap is awake
    return "poor"; // Awkward hours
  };


  // --- TOOL 3: BUSINESS DAYS CALCULATOR ---
  const [bizStart, setBizStart] = useState("2026-07-07");
  const [bizEnd, setBizEnd] = useState("2026-07-20");
  const [bizIncludeHolidays, setBizIncludeHolidays] = useState(true);

  const calculateBusinessDays = () => {
    const s = new Date(bizStart + "T00:00:00");
    const e = new Date(bizEnd + "T00:00:00");
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    
    let count = 0;
    const current = new Date(s);

    while (current <= e) {
      const day = current.getDay();
      const isWeekend = day === 0 || day === 6; // Sunday or Saturday
      
      let isHoliday = false;
      if (bizIncludeHolidays) {
        const formattedDate = current.toISOString().split('T')[0];
        isHoliday = holidays.some(h => h.date === formattedDate);
      }

      if (!isWeekend && !isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };


  // --- TOOL 4: DATE DIFFERENCE CALCULATOR ---
  const [diffStart, setDiffStart] = useState("2026-07-07");
  const [diffEnd, setDiffEnd] = useState("2026-12-31");

  const calculateDateDiff = () => {
    const s = new Date(diffStart + "T00:00:00");
    const e = new Date(diffEnd + "T00:00:00");
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return { days: 0, weeks: 0, months: 0 };

    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;

    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());

    return {
      days: diffDays,
      weeksStr: `${weeks} week${weeks !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`,
      monthsStr: `~${months} month${months !== 1 ? 's' : ''}`
    };
  };
  const diffResult = calculateDateDiff();


  // --- TOOL 5: COUNTDOWN TIMER ---
  const [countdownName, setCountdownName] = useState("Global Launch Event");
  const [countdownTarget, setCountdownTarget] = useState("2026-12-31T23:59:59");
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(countdownTarget);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownTarget]);


  // --- TOOL 6: UNIX TIMESTAMP CONVERTER ---
  const [liveUnix, setLiveUnix] = useState(Math.floor(Date.now() / 1000));
  const [manualUnix, setManualUnix] = useState(Math.floor(Date.now() / 1000).toString());
  const [manualDate, setManualDate] = useState("2026-07-07T12:00");
  const [unixResult, setUnixResult] = useState("");
  const [dateResultUnix, setDateResultUnix] = useState("");

  useEffect(() => {
    const liveTimer = setInterval(() => {
      setLiveUnix(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(liveTimer);
  }, []);

  const handleConvertUnixToDate = () => {
    const u = parseInt(manualUnix);
    if (isNaN(u)) {
      setUnixResult("Invalid Unix timestamp");
      return;
    }
    const d = new Date(u * 1000);
    setUnixResult(d.toLocaleString("en-US", { timeZone: preferences.timezone }) + ` (${getTimezoneOffsetAndAbbr(preferences.timezone).abbr})`);
  };

  const handleConvertDateToUnix = () => {
    const d = new Date(manualDate);
    if (isNaN(d.getTime())) {
      setDateResultUnix("Invalid Date/Time input");
      return;
    }
    setDateResultUnix(Math.floor(d.getTime() / 1000).toString());
  };


  const toolsList = [
    { id: "converter", name: "Time Zone Converter", desc: "Convert any city, timezone, or UTC offset.", icon: ArrowRightLeft, color: "text-blue-500 bg-blue-500/10" },
    { id: "planner", name: "AI Meeting Planner", desc: "Find the best overlap slot across global teams.", icon: Users, color: "text-emerald-500 bg-emerald-500/10" },
    { id: "business", name: "Business Days", desc: "Calculate working days excluding weekends & holidays.", icon: CalendarDays, color: "text-amber-500 bg-amber-500/10" },
    { id: "diff", name: "Date Difference", desc: "Calculate exact days, weeks, and months between dates.", icon: Calendar, color: "text-purple-500 bg-purple-500/10" },
    { id: "countdown", name: "Countdown Timer", desc: "Watch ticking precision down to custom global events.", icon: Hourglass, color: "text-rose-500 bg-rose-500/10" },
    { id: "unix", name: "Unix Converter", desc: "Instantly encode/decode epoch unix timestamps.", icon: Terminal, color: "text-sky-500 bg-sky-500/10" },
  ];

  return (
    <div id="quick-tools-section" className="scroll-mt-20">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <span className={`text-xs font-mono ${th.accentText} font-semibold uppercase tracking-wider`}>Productivity Engine</span>
          <h2 className={`text-3xl font-sans font-semibold tracking-tight ${th.text} mt-1`}>Smart Quick Actions</h2>
          <p className="text-sm text-slate-400 mt-1">SaaS-grade utilities that pre-integrate your local holiday context and timezone preferences.</p>
        </div>
        {selectedTool && (
          <button 
            onClick={() => {
              setSelectedTool(null);
              if (onCloseTab) onCloseTab();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border ${th.border} bg-slate-50 text-slate-600 hover:text-slate-900 transition`}
          >
            <X size={15} />
            <span className="text-xs font-medium font-mono">Close Tool</span>
          </button>
        )}
      </div>

      {/* Grid of Tools Selection */}
      {!selectedTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {toolsList.map((t) => (
            <div 
              key={t.id}
              onClick={() => setSelectedTool(t.id)}
              className={`group p-5 rounded-xl border ${th.border} ${th.cardBg} ${th.borderHover} hover:bg-slate-50/40 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${t.color}`}>
                  <t.icon size={22} />
                </div>
                <h3 className={`text-lg font-medium ${th.text} group-hover:text-blue-500 transition`}>{t.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-3.5 leading-relaxed">{t.desc}</p>
              <div className={`flex items-center gap-1.5 text-xs ${th.accentText} mt-4 font-semibold group-hover:translate-x-1 transition-transform`}>
                <span>Launch Workspace</span>
                <span className="font-mono">→</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-xl border ${th.border} ${th.cardBg} p-6 md:p-8 shadow-2xl relative`}>
          
          {/* Tool Close corner button */}
          <button 
            onClick={() => {
              setSelectedTool(null);
              if (onCloseTab) onCloseTab();
            }}
            className="absolute top-4 right-4 text-slate-400 hover:opacity-80 p-1 rounded-full hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>

          {/* TIME ZONE CONVERTER WORKSPACE */}
          {selectedTool === "converter" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-blue-500 bg-blue-500/10">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Time Zone Converter</h3>
                  <p className="text-xs text-slate-400">Scrub slider to convert instantly across locations without timezone math.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Source Region / Timezone</label>
                  <select 
                    value={convSourceTz}
                    onChange={(e) => setConvSourceTz(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.keys(CITY_DATA).map(tz => (
                      <option key={tz} value={tz}>{CITY_DATA[tz].name} ({CITY_DATA[tz].code}) - {tz}</option>
                    ))}
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Target Region / Timezone</label>
                  <select 
                    value={convTargetTz}
                    onChange={(e) => setConvTargetTz(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.keys(CITY_DATA).map(tz => (
                      <option key={tz} value={tz}>{CITY_DATA[tz].name} ({CITY_DATA[tz].code}) - {tz}</option>
                    ))}
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Date Selected</label>
                <input 
                  type="date"
                  value={convDate}
                  onChange={(e) => setConvDate(e.target.value)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 w-full md:w-64"
                />
              </div>

              {/* Slider scrubbing the hour */}
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 mb-6">
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <span className="text-slate-400">Hour Scrub: {convHourScrub === 0 ? "12 AM" : convHourScrub === 12 ? "12 PM" : convHourScrub > 12 ? `${convHourScrub - 12} PM` : `${convHourScrub} AM`}</span>
                  <span className="text-blue-500">24-hour index: {convHourScrub}:00</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="23"
                  value={convHourScrub}
                  onChange={(e) => setConvHourScrub(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>

              {/* Conversion Results Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-6 rounded-lg border border-slate-800 text-center md:text-left">
                <div className="p-3 border-r border-slate-800/80 md:border-r">
                  <div className="text-xs font-mono text-slate-500 font-semibold uppercase mb-1">Source local time</div>
                  <div className="text-xl font-sans font-semibold text-slate-200">{convSourceText}</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">Offset: {getTimezoneOffsetAndAbbr(convSourceTz).offsetStr}</div>
                </div>
                <div className="p-3">
                  <div className="text-xs font-mono text-slate-500 font-semibold uppercase mb-1">Converted Target Time</div>
                  <div className="text-xl font-sans font-semibold text-blue-400">{convTargetText}</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">Offset: {getTimezoneOffsetAndAbbr(convTargetTz).offsetStr}</div>
                </div>
              </div>
            </div>
          )}

          {/* AI MEETING PLANNER WORKSPACE */}
          {selectedTool === "planner" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-emerald-500 bg-emerald-500/10">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Global Overlap Meeting Planner</h3>
                  <p className="text-xs text-slate-400">Visually align multiple cities to see best overlapping slots inside normal working hours.</p>
                </div>
              </div>

              {/* Attendee selectors list */}
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 mb-6">
                <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-3.5">Attendees / Target Locations</h4>
                
                <div className="flex flex-wrap gap-2.5 mb-4">
                  {meetTzs.map(tz => {
                    const city = CITY_DATA[tz];
                    return (
                      <span key={tz} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium">
                        <span>{city ? `${city.name} (${city.code})` : tz}</span>
                        {meetTzs.length > 1 && (
                          <button onClick={() => removeMeetTz(tz)} className="text-slate-500 hover:text-rose-400 transition ml-1">
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                  <select 
                    value={newMeetTz}
                    onChange={(e) => setNewMeetTz(e.target.value)}
                    className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(CITY_DATA).map(tz => (
                      <option key={tz} value={tz}>{CITY_DATA[tz].name} - {tz}</option>
                    ))}
                  </select>
                  <button 
                    onClick={addMeetTz}
                    className="px-3.5 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition"
                  >
                    Add City
                  </button>
                </div>
              </div>

              {/* Hour Grid visualizer */}
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 overflow-x-auto">
                <div className="flex items-center justify-between mb-4 min-w-[600px]">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-400">Live 24-hour Overlap Dial</h4>
                  <div className="flex gap-4 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Excellent (All Working)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Good (Awake)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/20"></span> Rest hours / Sleep</span>
                  </div>
                </div>

                {/* 24 hour boxes */}
                <div className="grid grid-cols-24 gap-1 min-w-[600px]">
                  {Array.from({ length: 24 }).map((_, hIndex) => {
                    const status = getHourOverlapStatus(hIndex);
                    let color = "bg-rose-500/20 border-rose-500/10 text-slate-500";
                    if (status === "excellent") color = "bg-emerald-500 border-emerald-600 text-emerald-950 font-bold";
                    else if (status === "good") color = "bg-amber-500 border-amber-600 text-slate-950 font-bold";

                    return (
                      <div 
                        key={hIndex}
                        className={`py-2 border rounded text-center text-xs flex flex-col justify-between h-14 ${color}`}
                        title={`Hour Index: ${hIndex}:00`}
                      >
                        <span className="text-[9px] font-mono opacity-80">{hIndex}</span>
                        <Clock size={10} className="mx-auto opacity-60" />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 min-w-[600px]">
                  <span>00:00 (Midnight)</span>
                  <span>06:00 (Morning)</span>
                  <span>12:00 (Noon)</span>
                  <span>18:00 (Evening)</span>
                  <span>23:00 (Late)</span>
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS DAYS CALCULATOR WORKSPACE */}
          {selectedTool === "business" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-amber-500 bg-amber-500/10">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Business Days Calculator</h3>
                  <p className="text-xs text-slate-400">Calculate workdays between two dates automatically excluding weekends and local holidays.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Start Date</label>
                  <input 
                    type="date"
                    value={bizStart}
                    onChange={(e) => setBizStart(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">End Date</label>
                  <input 
                    type="date"
                    value={bizEnd}
                    onChange={(e) => setBizEnd(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <input 
                  type="checkbox"
                  id="includeHols"
                  checked={bizIncludeHolidays}
                  onChange={(e) => setBizIncludeHolidays(e.target.checked)}
                  className="rounded bg-slate-800 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="includeHols" className="text-xs text-slate-300 cursor-pointer">
                  Exclude public holidays from calculations ({preferences.countryName} Calendar: {holidays.length} holidays tracked)
                </label>
              </div>

              {/* Result display */}
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-6 rounded-lg text-center">
                <div className="text-xs font-mono text-amber-500 font-semibold uppercase mb-1">Working Days Count</div>
                <div className="text-4xl font-sans font-bold text-amber-400">{calculateBusinessDays()}</div>
                <p className="text-xs text-slate-400 mt-2">Excludes Saturdays, Sundays, and public holidays inside this range.</p>
              </div>
            </div>
          )}

          {/* DATE DIFFERENCE CALCULATOR WORKSPACE */}
          {selectedTool === "diff" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-purple-500 bg-purple-500/10">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Date Difference Calculator</h3>
                  <p className="text-xs text-slate-400">Calculate exact days, weeks, or calendar months between two given target dates.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">From Date</label>
                  <input 
                    type="date"
                    value={diffStart}
                    onChange={(e) => setDiffStart(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">To Date</label>
                  <input 
                    type="date"
                    value={diffEnd}
                    onChange={(e) => setDiffEnd(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-center">
                  <div className="text-xs font-mono text-slate-500 font-semibold uppercase mb-1">Total Calendar Days</div>
                  <div className="text-3xl font-sans font-bold text-purple-400">{diffResult.days}</div>
                  <span className="text-[10px] text-slate-400 font-mono">days difference</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-center">
                  <div className="text-xs font-mono text-slate-500 font-semibold uppercase mb-1">Weeks Representation</div>
                  <div className="text-lg font-sans font-bold text-purple-400 py-1.5">{diffResult.weeksStr}</div>
                  <span className="text-[10px] text-slate-400 font-mono">weeks structure</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-center">
                  <div className="text-xs font-mono text-slate-500 font-semibold uppercase mb-1">Months representation</div>
                  <div className="text-lg font-sans font-bold text-purple-400 py-1.5">{diffResult.monthsStr}</div>
                  <span className="text-[10px] text-slate-400 font-mono">rough month gap</span>
                </div>
              </div>
            </div>
          )}

          {/* COUNTDOWN TIMER WORKSPACE */}
          {selectedTool === "countdown" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-rose-500 bg-rose-500/10">
                  <Hourglass size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Live Countdown Precision</h3>
                  <p className="text-xs text-slate-400">Track and count down live milliseconds until major corporate events, launches, or travel.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Event Title</label>
                  <input 
                    type="text"
                    value={countdownName}
                    onChange={(e) => setCountdownName(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-rose-500"
                    placeholder="e.g., Q3 Project Deadline"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Target Date & Time</label>
                  <input 
                    type="datetime-local"
                    value={countdownTarget}
                    onChange={(e) => setCountdownTarget(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Ticker displays */}
              <h4 className="text-center text-md text-slate-300 font-semibold font-sans mb-3">{countdownName || "Countdown Target"}</h4>
              <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-lg mx-auto">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-3xl md:text-4xl font-sans font-bold text-rose-400">{timeLeft.d}</div>
                  <div className="text-[9px] font-mono text-slate-500 font-semibold uppercase mt-1">Days</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-3xl md:text-4xl font-sans font-bold text-rose-400">{timeLeft.h.toString().padStart(2, '0')}</div>
                  <div className="text-[9px] font-mono text-slate-500 font-semibold uppercase mt-1">Hours</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-3xl md:text-4xl font-sans font-bold text-rose-400">{timeLeft.m.toString().padStart(2, '0')}</div>
                  <div className="text-[9px] font-mono text-slate-500 font-semibold uppercase mt-1">Mins</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-3xl md:text-4xl font-sans font-bold text-rose-400">{timeLeft.s.toString().padStart(2, '0')}</div>
                  <div className="text-[9px] font-mono text-slate-500 font-semibold uppercase mt-1">Secs</div>
                </div>
              </div>
            </div>
          )}

          {/* UNIX TIMESTAMP CONVERTER WORKSPACE */}
          {selectedTool === "unix" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg text-sky-500 bg-sky-500/10">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Unix Epoch Timestamp Converter</h3>
                  <p className="text-xs text-slate-400">Convert dates to computer epoch seconds, and decode timestamps to readable locale formats.</p>
                </div>
              </div>

              {/* Live counter */}
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-850 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                  <span className="text-xs font-mono text-slate-400">Live Epoch Unix Timestamp:</span>
                </div>
                <span className="text-lg font-mono font-bold text-sky-400">{liveUnix}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Decode Unix */}
                <div className="bg-slate-950/30 p-5 rounded-lg border border-slate-850">
                  <h4 className="text-xs font-mono font-semibold uppercase text-sky-500 mb-3">Decode Epoch to Date</h4>
                  
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text"
                      value={manualUnix}
                      onChange={(e) => setManualUnix(e.target.value)}
                      className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-sky-500"
                      placeholder="e.g. 1783454320"
                    />
                    <button 
                      onClick={handleConvertUnixToDate}
                      className="px-3 py-2 text-xs bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-600 transition"
                    >
                      Decode
                    </button>
                  </div>

                  {unixResult && (
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed mt-2">
                      <span className="text-slate-500">Result:</span> {unixResult}
                    </div>
                  )}
                </div>

                {/* Encode Date */}
                <div className="bg-slate-950/30 p-5 rounded-lg border border-slate-850">
                  <h4 className="text-xs font-mono font-semibold uppercase text-sky-500 mb-3">Encode Date to Epoch</h4>
                  
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="datetime-local"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <button 
                      onClick={handleConvertDateToUnix}
                      className="px-3 py-2 text-xs bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-600 transition"
                    >
                      Encode
                    </button>
                  </div>

                  {dateResultUnix && (
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed mt-2">
                      <span className="text-slate-500">Unix Timestamp:</span> {dateResultUnix}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
