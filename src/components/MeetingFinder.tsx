import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  X, 
  Check, 
  Copy, 
  Share2, 
  Sparkles, 
  Clock, 
  Calendar, 
  Globe, 
  ChevronRight, 
  Info,
  Award,
  Video,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import ToolSdkPanel from "./tools/ToolSdkPanel";
import ApiVerifyChip from "./tools/ApiVerifyChip";
import { meetingFinderVerify } from "../utils/apiToolMap";
import { LocationPicker } from "./common/LocationPicker";
import { CITY_BY_CODE } from "../data/cities";
import { flagFor } from "../data/flags";

// Backwards-compat shim — returns the shape MeetingFinder used inline:
// { name, country, code, timezone, flag }. Search by either city name
// or the 3-letter city code used by CITY_BY_CODE.
function resolveCityLike(input: string): { name: string; country: string; code: string; timezone: string; flag: string } {
  if (!input) return { name: "Singapore", country: "Singapore", code: "SIN", timezone: "Asia/Singapore", flag: "🇸🇬" };
  if (CITY_BY_CODE[input]) {
    const c = CITY_BY_CODE[input];
    return { name: c.name, country: c.country, code: c.code, timezone: c.timezone, flag: flagFor(c.countryCode) };
  }
  // name lookup (case-insensitive)
  for (const c of Object.values(CITY_BY_CODE)) {
    if (c.name.toLowerCase() === input.toLowerCase()) {
      return { name: c.name, country: c.country, code: c.code, timezone: c.timezone, flag: flagFor(c.countryCode) };
    }
  }
  return { name: "Singapore", country: "Singapore", code: "SIN", timezone: "Asia/Singapore", flag: "🇸🇬" };
}

// Default 4 demo cities (timezone code is the storage key now).
const DEFAULT_PARTICIPANT_CODES = ["NYC", "LON", "BOM", "TYO"];

// Convert a code to the legacy inline shape for any callers still using one.
function shapeFromCode(code: string) {
  return resolveCityLike(code);
}

// Pastel color config
const PASTEL_COLORS = [
  { name: "Light Blue", bg: "bg-[#e8eaf6]", text: "text-[#3f51b5]", hover: "hover:bg-[#d0d4f0]", border: "border-[#3f51b5]/20", rawBg: "#e8eaf6", rawText: "#3f51b5" },
  { name: "Light Green", bg: "bg-[#e8f5e9]", text: "text-[#2e7d32]", hover: "hover:bg-[#c8e6c9]", border: "border-[#2e7d32]/20", rawBg: "#e8f5e9", rawText: "#2e7d32" },
  { name: "Light Pink", bg: "bg-[#fce4ec]", text: "text-[#c2185b]", hover: "hover:bg-[#f8bbd0]", border: "border-[#c2185b]/20", rawBg: "#fce4ec", rawText: "#c2185b" },
  { name: "Light Purple", bg: "bg-[#f3e5f5]", text: "text-[#7b1fa2]", hover: "hover:bg-[#e1bee7]", border: "border-[#7b1fa2]/20", rawBg: "#f3e5f5", rawText: "#7b1fa2" },
  { name: "Light Teal", bg: "bg-[#e0f2f1]", text: "text-[#00695c]", hover: "hover:bg-[#b2dfdb]", border: "border-[#00695c]/20", rawBg: "#e0f2f1", rawText: "#00695c" },
  { name: "Light Orange", bg: "bg-[#fff3e0]", text: "text-[#e65100]", hover: "hover:bg-[#ffe0b2]", border: "border-[#e65100]/20", rawBg: "#fff3e0", rawText: "#e65100" },
  { name: "Light Cream", bg: "bg-[#f5f5dc]", text: "text-[#6d4c41]", hover: "hover:bg-[#e5e5cc]", border: "border-[#6d4c41]/20", rawBg: "#f5f5dc", rawText: "#6d4c41" }
];

interface Participant {
  id: string;
  name: string;
  city: string;
  timezone: string;
  colorIndex: number;
}

interface MeetingSlot {
  id: string;
  timestamp: number; // Date time epoch in ms
  dateLabel: string; // "Thu, Jul 9"
  timeLabel: string; // "10:00 AM"
  score: number;
  statuses: {
    participantId: string;
    localHour: number;
    localTimeStr: string;
    status: "working" | "early-late" | "asleep";
  }[];
}

interface MeetingFinderProps {
  lang?: string;
}

export default function MeetingFinder({ lang = "en" }: MeetingFinderProps) {
  // Initial default participants
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "You", city: "New York", timezone: "America/New_York", colorIndex: 0 },
    { id: "2", name: "Alex Chen", city: "London", timezone: "Europe/London", colorIndex: 1 },
    { id: "3", name: "Priya Sharma", city: "Mumbai", timezone: "Asia/Kolkata", colorIndex: 2 },
    { id: "4", name: "Takashi Sato", city: "Tokyo", timezone: "Asia/Tokyo", colorIndex: 3 }
  ]);

  // Setup form states
  const [duration, setDuration] = useState("1 hour");
  const [within, setWithin] = useState("Next 7 days");
  const [earliest, setEarliest] = useState("08:00 AM");
  const [latest, setLatest] = useState("08:00 PM");

  // Modal State for adding participant
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantCity, setNewParticipantCity] = useState("SIN");

  // Results state
  const [results, setResults] = useState<MeetingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // URL State persistence restore on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pParam = params.get("p");
    const citiesParam = params.get("cities");
    const dParam = params.get("d");
    const wParam = params.get("w");
    const eParam = params.get("e");
    const lParam = params.get("l");

    if (pParam) {
      try {
        const decoded = JSON.parse(pParam);
        if (Array.isArray(decoded) && decoded.length > 0) {
          setParticipants(decoded);
        }
      } catch (err) {
        // Fallback split format
        const split = pParam.split(";");
        const parsed: Participant[] = [];
        split.forEach((item, index) => {
          const parts = item.split(",");
          if (parts.length >= 2) {
            const name = decodeURIComponent(parts[0]);
            const city = decodeURIComponent(parts[1]);
            const cityObj = resolveCityLike(city);
            if (cityObj) {
              parsed.push({
                id: (index + 1).toString(),
                name,
                city: cityObj.name,
                timezone: cityObj.timezone,
                colorIndex: index % PASTEL_COLORS.length
              });
            }
          }
        });
        if (parsed.length > 0) {
          setParticipants(parsed);
        }
      }
    }

    if (dParam) setDuration(dParam);
    if (wParam) setWithin(wParam);
    if (eParam) setEarliest(eParam);
    if (lParam) setLatest(lParam);

    // 1b. ?cities=NYC,LDN,BOM,TYO — pre-fill participants from a converter
    //     share-link (one Teammate slot per city, default names).
    if (citiesParam && !pParam) {
      try {
        const codes = citiesParam.split(",").map((s) => s.trim()).filter(Boolean);
        const seeded: Participant[] = codes.slice(0, 8).map((code, i) => {
          const city = resolveCityLike(code);
          return {
            id: Math.random().toString(36).slice(2, 11),
            name: i === 0 ? "You" : `Teammate ${i + 1}`,
            city: city.name,
            timezone: city.timezone,
            colorIndex: i % PASTEL_COLORS.length,
          };
        });
        if (seeded.length >= 2) setParticipants(seeded);
      } catch {/* noop */}
    }

    // If query contains parameters, auto-calculate
    if (pParam) {
      setTimeout(() => {
        calculateBestSlotsDirectly(pParam, dParam, wParam, eParam, lParam);
      }, 300);
    } else if (citiesParam) {
      // Auto-calculate from the new ?cities= prefill
      setTimeout(() => {
        const draft = [...participants];
        calculateBestSlotsDirectly(JSON.stringify(draft), dParam, wParam, eParam, lParam);
      }, 300);
    }
  }, []);

  // Helper calculation function
  const calculateBestSlotsDirectly = (
    pParamRaw: string,
    dParam?: string,
    wParam?: string,
    eParam?: string,
    lParam?: string
  ) => {
    let activeParticipants = participants;
    try {
      const decoded = JSON.parse(pParamRaw);
      if (Array.isArray(decoded) && decoded.length > 0) {
        activeParticipants = decoded;
      }
    } catch (e) {
      // split format parsing
      const split = pParamRaw.split(";");
      const parsed: Participant[] = [];
      split.forEach((item, index) => {
        const parts = item.split(",");
        if (parts.length >= 2) {
          const name = decodeURIComponent(parts[0]);
          const city = decodeURIComponent(parts[1]);
          const cityObj = resolveCityLike(city);
          if (cityObj) {
            parsed.push({
              id: (index + 1).toString(),
              name,
              city: cityObj.name,
              timezone: cityObj.timezone,
              colorIndex: index % PASTEL_COLORS.length
            });
          }
        }
      });
      if (parsed.length > 0) activeParticipants = parsed;
    }

    const actDuration = dParam || duration;
    const actWithin = wParam || within;
    const actEarliest = eParam || earliest;
    const actLatest = lParam || latest;

    performCalculation(activeParticipants, actDuration, actWithin, actEarliest, actLatest);
  };

  const getHourNumber = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 8;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const isPm = match[3].toUpperCase() === "PM";
    if (isPm && hour !== 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    return hour + minute / 60;
  };

  const performCalculation = (
    currentParts: Participant[],
    dur: string,
    withStr: string,
    earlStr: string,
    latStr: string
  ) => {
    if (currentParts.length === 0) return;

    // Days limit
    let daysCount = 7;
    if (withStr.includes("3")) daysCount = 3;
    if (withStr.includes("Tomorrow") || withStr.includes("1")) daysCount = 2; // Tomorrow includes today/tomorrow

    const startHourLimit = getHourNumber(earlStr); // Host local earliest hour e.g. 8
    const endHourLimit = getHourNumber(latStr); // Host local latest hour e.g. 20

    const hostTz = currentParts[0]?.timezone || "America/New_York";
    const now = new Date();

    const candidateSlots: MeetingSlot[] = [];

    // Generate daily options
    for (let dayOffset = 1; dayOffset <= daysCount; dayOffset++) {
      const targetDay = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      // Calculate start times in host local timezone
      for (let hour = Math.floor(startHourLimit); hour < Math.ceil(endHourLimit); hour++) {
        // Set candidate date in host timezone
        // Since we want standard hour marks
        try {
          const slotDate = new Date(targetDay.toLocaleString("en-US", { timeZone: hostTz }));
          slotDate.setHours(hour);
          slotDate.setMinutes(0);
          slotDate.setSeconds(0);
          slotDate.setMilliseconds(0);

          // Get equivalent absolute timestamp
          // To correctly map, let's format back via relative formatter to verify
          const absoluteMs = getAbsoluteTimeFromTimezoneHour(targetDay, hour, hostTz);
          const evalDate = new Date(absoluteMs);

          // Format labels in host's eyes
          const hostDateLabel = evalDate.toLocaleDateString("en-US", { 
            timeZone: hostTz, 
            weekday: "short", 
            month: "short", 
            day: "numeric" 
          });

          const hostTimeLabel = evalDate.toLocaleTimeString("en-US", {
            timeZone: hostTz,
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });

          // Check and score for each participant
          let totalScore = 0;
          const statuses: MeetingSlot["statuses"] = [];

          currentParts.forEach(p => {
            // Get local hour for this participant at absoluteMs
            const localHourStr = evalDate.toLocaleTimeString("en-US", {
              timeZone: p.timezone,
              hour: "numeric",
              hour12: false
            });
            const localMinStr = evalDate.toLocaleTimeString("en-US", {
              timeZone: p.timezone,
              minute: "2-digit"
            });
            const localAmpm = evalDate.toLocaleTimeString("en-US", {
              timeZone: p.timezone,
              hour12: true
            }).slice(-2);

            const localHour = parseInt(localHourStr, 10);
            const localTimeStr = `${evalDate.toLocaleTimeString("en-US", { timeZone: p.timezone, hour: "numeric", minute: "2-digit", hour12: true })}`;

            // Score check
            // Working (9 AM to 6 PM, i.e., 9:00 to 18:00) -> +3
            // Early/Late (7 AM - 9 AM, 6 PM - 10 PM, i.e. 7-9, 18-22) -> +1
            // Asleep (10 PM - 7 AM) -> -2
            let status: "working" | "early-late" | "asleep" = "asleep";
            let score = -2;

            if (localHour >= 9 && localHour < 18) {
              status = "working";
              score = 3;
            } else if ((localHour >= 7 && localHour < 9) || (localHour >= 18 && localHour < 22)) {
              status = "early-late";
              score = 1;
            } else {
              status = "asleep";
              score = -2;
            }

            totalScore += score;
            statuses.push({
              participantId: p.id,
              localHour,
              localTimeStr,
              status
            });
          });

          candidateSlots.push({
            id: `${dayOffset}-${hour}`,
            timestamp: absoluteMs,
            dateLabel: hostDateLabel,
            timeLabel: hostTimeLabel,
            score: totalScore,
            statuses
          });
        } catch (e) {
          console.error("Error evaluating candidate slot:", e);
        }
      }
    }

    // Sort candidate slots by score descending, then by timestamp ascending
    const sorted = candidateSlots.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timestamp - b.timestamp;
    });

    // Take top 5 slots
    const topSlots = sorted.slice(0, 5);
    setResults(topSlots);
    if (topSlots.length > 0) {
      setSelectedSlot(topSlots[0]);
    }
    setHasCalculated(true);

    // Save and persist URL search params
    updateURLParams(currentParts, dur, withStr, earlStr, latStr);
  };

  const getAbsoluteTimeFromTimezoneHour = (baseDate: Date, targetHour: number, tz: string): number => {
    // Elegant conversion helper
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    
    const parts = formatter.formatToParts(baseDate);
    const year = parts.find(p => p.type === "year")?.value || "";
    const month = parts.find(p => p.type === "month")?.value || "";
    const day = parts.find(p => p.type === "day")?.value || "";

    // Assemble custom target date string
    const targetISO = `${year}-${month}-${day}T${targetHour.toString().padStart(2, "0")}:00:00`;
    
    // We calculate absolute UTC ms by comparing real offsets
    const dateLocal = new Date(targetISO);
    return dateLocal.getTime();
  };

  const handleCalculate = () => {
    performCalculation(participants, duration, within, earliest, latest);
  };

  const updateURLParams = (
    partsList: Participant[],
    dur: string,
    withStr: string,
    earlStr: string,
    latStr: string
  ) => {
    const params = new URLSearchParams();
    
    // Simple format name,city;name,city to avoid giant JSON if possible, or stringified JSON
    params.set("p", JSON.stringify(partsList));
    params.set("d", dur);
    params.set("w", withStr);
    params.set("e", earlStr);
    params.set("l", latStr);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) return;

    const cityObj = resolveCityLike(newParticipantCity);
    const newPart: Participant = {
      id: Math.random().toString(36).substr(2, 9),
      name: newParticipantName.trim(),
      city: cityObj.name,
      timezone: cityObj.timezone,
      colorIndex: participants.length % PASTEL_COLORS.length
    };

    const updated = [...participants, newPart];
    setParticipants(updated);
    setNewParticipantName("");
    setShowAddModal(false);

    // If already calculated, recalculate immediately
    if (hasCalculated) {
      performCalculation(updated, duration, within, earliest, latest);
    }
  };

  const handleRemoveParticipant = (id: string) => {
    const updated = participants.filter(p => p.id !== id);
    // Recolor cycle indices for consistency
    const recolored = updated.map((p, idx) => ({
      ...p,
      colorIndex: idx % PASTEL_COLORS.length
    }));
    setParticipants(recolored);

    if (hasCalculated) {
      performCalculation(recolored, duration, within, earliest, latest);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Meeting Finder timezone schedule",
        text: "Compare our working hours and find the best meeting times instantly!",
        url: window.location.href
      }).catch(err => {
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  // Helper to resolve flag for city name
  const getCityFlag = (cityName: string) => {
    return resolveCityLike(cityName).flag || "🌐";
  };

  // Render timezone text helper
  const getCityTimezoneAbbr = (timezone: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "short"
      });
      const parts = formatter.formatToParts(new Date());
      return parts.find(p => p.type === "timeZoneName")?.value || "UTC";
    } catch (e) {
      return "UTC";
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-fade-in text-[#212121]">
      
      {/* 2. PASTEL HERO SECTION WITH STAT BADGE */}
      <div className="rounded-3xl bg-gradient-to-r from-[#e8eaf6] via-[#e0f2f1] to-[#e8f5e9] p-8 md:p-12 text-center relative overflow-hidden shadow-sm border border-[#e0e0e0]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fce4ec]/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <h1 className="text-3xl md:text-5xl font-sans font-bold tracking-tight text-[#212121] leading-tight">
            Stop doing timezone math.
          </h1>
          <p className="text-[#616161] text-sm md:text-base leading-relaxed">
            We compare everyone's working hours, calendar, and DST shifts to find the perfect meeting time. No more "your 3 PM or mine?"
          </p>
          
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#2e7d32] text-xs font-semibold shadow-sm border border-[#eeeeee]">
              <Sparkles size={13} className="text-[#2e7d32] animate-pulse" />
              {hasCalculated ? (
                <span>Found {results.length} perfect slots for {participants.length} people across multiple continents</span>
              ) : (
                <span>Add your team coordinates to find optimal times across 15 cities</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. WHITE SETUP CARD WITH SHADOW */}
      <div id="setup-card" className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-[#616161] mb-4 flex items-center gap-2">
            <Users size={16} className="text-[#3f51b5]" />
            Who's joining?
          </h2>
          
          {/* Participant Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {participants.map((p, idx) => {
              const color = PASTEL_COLORS[p.colorIndex % PASTEL_COLORS.length];
              const tzAbbr = getCityTimezoneAbbr(p.timezone);
              
              return (
                <div 
                  key={p.id}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${color.bg} ${color.text} ${color.border} hover:shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center font-bold text-xs shadow-inner">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-xs text-[#212121] flex items-center gap-1">
                        <span>{p.name}</span>
                        {p.name === "You" && <span className="text-[10px] bg-white/95 px-1.5 py-0.5 rounded text-[#3f51b5] font-bold">host</span>}
                      </div>
                      <div className="text-[10px] text-[#616161] leading-tight font-medium">
                        {getCityFlag(p.city)} {p.city}, {tzAbbr}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button on hover (or persistent small x) */}
                  {participants.length > 1 && (
                    <button 
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="p-1 rounded-full bg-white/40 hover:bg-red-50 hover:text-red-600 transition-opacity duration-200"
                      title={`Remove ${p.name}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Participant Trigger Dotted Card */}
            {participants.length < 15 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#e0e0e0] hover:border-[#3f51b5] hover:bg-[#fafafa] transition duration-200 text-left min-h-[72px]"
              >
                <Plus size={16} className="text-[#616161]" />
                <span className="text-xs font-semibold text-[#616161] hover:text-[#3f51b5]">
                  + Add participant
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns Configuration & Button */}
        <div className="pt-4 border-t border-[#eeeeee] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          
          {/* Duration */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#616161] mb-1.5">
              Duration
            </label>
            <div className="relative">
              <select 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-xs text-[#212121] font-semibold outline-none focus:border-[#3f51b5] transition appearance-none cursor-pointer"
              >
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] pointer-events-none" />
            </div>
          </div>

          {/* Within */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#616161] mb-1.5">
              Within
            </label>
            <div className="relative">
              <select 
                value={within}
                onChange={(e) => setWithin(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-xs text-[#212121] font-semibold outline-none focus:border-[#3f51b5] transition appearance-none cursor-pointer"
              >
                <option value="Next 3 days">Next 3 days</option>
                <option value="Next 7 days">Next 7 days</option>
                <option value="Tomorrow">Tomorrow</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] pointer-events-none" />
            </div>
          </div>

          {/* Earliest Limit */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#616161] mb-1.5">
              Earliest start time
            </label>
            <div className="relative">
              <select 
                value={earliest}
                onChange={(e) => setEarliest(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-xs text-[#212121] font-semibold outline-none focus:border-[#3f51b5] transition appearance-none cursor-pointer"
              >
                <option value="07:00 AM">7:00 AM</option>
                <option value="08:00 AM">8:00 AM</option>
                <option value="09:00 AM">9:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] pointer-events-none" />
            </div>
          </div>

          {/* Latest Limit */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#616161] mb-1.5">
              Latest end time
            </label>
            <div className="relative">
              <select 
                value={latest}
                onChange={(e) => setLatest(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-xs text-[#212121] font-semibold outline-none focus:border-[#3f51b5] transition appearance-none cursor-pointer"
              >
                <option value="06:00 PM">6:00 PM</option>
                <option value="07:00 PM">7:00 PM</option>
                <option value="08:00 PM">8:00 PM</option>
                <option value="09:00 PM">9:00 PM</option>
                <option value="10:00 PM">10:00 PM</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] pointer-events-none" />
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleCalculate}
            className="w-full py-2.5 rounded-xl bg-[#3f51b5] hover:bg-[#303f9f] text-white text-xs font-bold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            <span>Find best times</span>
          </button>
        </div>
      </div>

      {/* ADD PARTICIPANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e0e0e0] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
              <h3 className="font-bold text-sm text-[#212121] flex items-center gap-2">
                <Users size={16} className="text-[#3f51b5]" />
                Add New Participant
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-[#f5f5f5] text-[#9e9e9e] hover:text-[#212121] transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#616161] mb-1.5">
                  Participant Name
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Takashi Sato"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-xs text-[#212121] outline-none focus:border-[#3f51b5] transition"
                  onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#616161] mb-1.5">
                  Teammate City
                </label>
                <LocationPicker
                  value={newParticipantCity ? [newParticipantCity] : []}
                  onChange={(codes) => setNewParticipantCity(codes[0] ?? "")}
                  placeholder="Pick a city, state, or country…"
                  maxSelections={1}
                  hidePills
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#eeeeee] flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-[#e0e0e0] rounded-lg hover:bg-[#fafafa] font-semibold text-[#616161] transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddParticipant}
                className="px-4 py-2 bg-[#3f51b5] hover:bg-[#303f9f] text-white rounded-lg font-bold transition"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULTS SECTION */}
      {hasCalculated && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Ranked Slots list (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3 mb-2">
              <div>
                <h3 className="text-lg font-bold text-[#212121] flex items-baseline gap-1.5">
                  {results.length} meeting slots found
                </h3>
                <p className="text-xs text-[#616161]">
                  Best overlap combinations ranked by participant convenience
                </p>
              </div>

              {/* Share & Copy URL Action Bar */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleNativeShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e0e0e0] rounded-lg text-xs font-semibold text-[#616161] hover:bg-[#fafafa] transition cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Share view</span>
                </button>
                <button 
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition cursor-pointer ${
                    copyFeedback 
                      ? "bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]" 
                      : "bg-[#3f51b5] border-[#3f51b5] text-white hover:bg-[#303f9f]"
                  }`}
                >
                  {copyFeedback ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copyFeedback ? "Copied" : "Copy link"}</span>
                </button>
              </div>
            </div>

            {/* Slots Cards List */}
            <div className="space-y-4">
              {results.map((slot, index) => {
                const isBest = index === 0;
                const isSelected = selectedSlot?.id === slot.id;
                
                // Working details count
                const workingCount = slot.statuses.filter(s => s.status === "working").length;
                const asleepCount = slot.statuses.filter(s => s.status === "asleep").length;
                
                let convenienceBadge = "✔ All in working hours";
                let badgeColor = "bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]/20";
                
                if (asleepCount > 0) {
                  convenienceBadge = `⚠️ Some asleep (${asleepCount} asleep)`;
                  badgeColor = "bg-[#fce4ec] text-[#c2185b] border-[#c2185b]/20";
                } else if (workingCount < participants.length) {
                  convenienceBadge = "⚡ All awake; early/late but acceptable";
                  badgeColor = "bg-[#fff3e0] text-[#e65100] border-[#e65100]/20";
                }

                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`relative rounded-2xl p-5 md:p-6 border transition-all duration-300 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:translate-x-1.5 hover:shadow-md ${
                      isSelected
                        ? "bg-[#e8eaf6] border-[#3f51b5] shadow-sm"
                        : isBest
                          ? "bg-[#e8f5e9]/50 border-[#2e7d32]/30 hover:border-[#2e7d32]"
                          : "bg-white border-[#e0e0e0] hover:border-[#3f51b5]"
                    }`}
                  >
                    {/* Left: Time and Date Label */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold font-sans tracking-tight text-[#212121]">
                          {slot.timeLabel}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-[#2e7d32] text-white shadow-sm">
                            ★ Best choice
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#616161]">
                        {slot.dateLabel}
                      </div>
                      <div className="text-[10px] text-[#3f51b5] font-semibold uppercase tracking-wide">
                        Your time: {slot.timeLabel} {getCityTimezoneAbbr(participants[0].timezone)}
                      </div>
                    </div>

                    {/* Middle: City Segments timeline */}
                    <div className="flex flex-wrap items-center gap-1.5 py-1">
                      {participants.map(p => {
                        const statusObj = slot.statuses.find(s => s.participantId === p.id);
                        if (!statusObj) return null;
                        
                        let borderClass = "border-[#2e7d32] text-[#2e7d32] bg-[#e8f5e9]/30";
                        if (statusObj.status === "early-late") {
                          borderClass = "border-[#e65100] text-[#e65100] bg-[#fff3e0]/30";
                        } else if (statusObj.status === "asleep") {
                          borderClass = "border-[#c2185b] text-[#c2185b] bg-[#fce4ec]/30";
                        }

                        return (
                          <div 
                            key={p.id}
                            title={`${p.name} in ${p.city} will be ${statusObj.status}`}
                            className={`flex flex-col items-center px-2.5 py-1 rounded-xl border text-[10px] font-bold ${borderClass}`}
                          >
                            <span className="text-[8px] opacity-75 truncate max-w-[50px]">{p.name}</span>
                            <span>{statusObj.localTimeStr.replace(/:\d+\s/, " ")}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right: Score/Status badge and Button */}
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {convenienceBadge}
                      </span>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlot(slot);
                        }}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${
                          isSelected
                            ? "bg-[#3f51b5] text-white border-[#3f51b5]"
                            : "bg-white text-[#3f51b5] border-[#3f51b5] hover:bg-[#e8eaf6]"
                        }`}
                      >
                        {isSelected ? "Selected" : "Schedule this"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Calendar Preview panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-[#e0e0e0] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#eeeeee] pb-3">
                <h4 className="font-bold text-sm text-[#212121] flex items-center gap-1.5">
                  <Calendar size={15} className="text-[#3f51b5]" />
                  Calendar Preview
                </h4>
                <p className="text-[11px] text-[#616161]">
                  Visual hourly grid for standard business day on selected slot
                </p>
              </div>

              {selectedSlot ? (
                <div className="space-y-4">
                  {/* Selected Slot Meta Info */}
                  <div className="p-3 bg-[#e8eaf6]/40 border border-[#3f51b5]/10 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-[#3f51b5]">
                      {selectedSlot.timeLabel} • {selectedSlot.dateLabel}
                    </div>
                    <p className="text-[10px] text-[#616161] leading-relaxed">
                      This calendar grid maps standard 12-hour local blocks (8 AM – 8 PM) for your team members on this date.
                    </p>
                  </div>

                  {/* Hourly preview cells */}
                  <div className="space-y-3">
                    {participants.map(p => {
                      const color = PASTEL_COLORS[p.colorIndex % PASTEL_COLORS.length];
                      
                      // Calculate local hour for this participant
                      const baseDate = new Date(selectedSlot.timestamp);
                      const partStatus = selectedSlot.statuses.find(s => s.participantId === p.id);
                      const localHourAtSlot = partStatus ? partStatus.localHour : 12;

                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-[#212121]">{p.name} ({p.city})</span>
                            <span className="text-[#616161]">Local time: {partStatus?.localTimeStr}</span>
                          </div>

                          {/* Timeblocks strip */}
                          <div className="grid grid-cols-12 gap-1 bg-[#f5f5f5] p-1.5 rounded-xl border border-[#e0e0e0]">
                            {Array.from({ length: 12 }).map((_, hIndex) => {
                              // We display 8 AM to 8 PM
                              const currentHourNum = 8 + hIndex; // 8 to 19
                              
                              // Check participant state at this specific hour
                              let bgBlockColor = "bg-green-500 hover:bg-green-600"; // Free
                              let blockLabel = "Free";
                              
                              if (currentHourNum < 9 || currentHourNum >= 18) {
                                bgBlockColor = "bg-amber-500 hover:bg-amber-600"; // Maybe
                                blockLabel = "Maybe";
                              }
                              if (currentHourNum >= 22 || currentHourNum < 7) {
                                bgBlockColor = "bg-red-500 hover:bg-red-600"; // Busy
                                blockLabel = "Busy";
                              }

                              // Is this current hour the selected slot hour?
                              const isCurrentSelectedHour = Math.floor(localHourAtSlot) === currentHourNum;

                              return (
                                <div 
                                  key={hIndex}
                                  title={`${p.name} local time ${currentHourNum % 12 || 12} ${currentHourNum >= 12 ? "PM" : "AM"}: ${blockLabel}`}
                                  className={`h-6 rounded-md transition-all relative flex items-center justify-center ${bgBlockColor} ${
                                    isCurrentSelectedHour ? "ring-2 ring-[#3f51b5] ring-offset-1 scale-105 z-10" : "opacity-80"
                                  }`}
                                >
                                  {isCurrentSelectedHour && (
                                    <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Strip hour helpers */}
                          <div className="flex justify-between text-[8px] font-mono text-[#9e9e9e] px-1">
                            <span>8 AM</span>
                            <span>12 PM</span>
                            <span>4 PM</span>
                            <span>8 PM</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar legend */}
                  <div className="pt-2 border-t border-[#eeeeee] flex items-center justify-center gap-4 text-[9px] font-semibold text-[#616161]">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-green-500" />
                      <span>Free (Working)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                      <span>Maybe (Early/Late)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-red-500" />
                      <span>Busy (Asleep)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#9e9e9e]">
                  Select a slot from the ranked list to preview team availability.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 5. WHY PANEL: 6 Pastel cards */}
      <div className="pt-8 border-t border-[#eeeeee] space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#212121]">
            Why teams love this
          </h3>
          <p className="text-[#616161] text-xs sm:text-sm">
            No more back-and-forth emails. No more timezone confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Light Blue */}
          <div className="p-6 rounded-2xl bg-[#e8eaf6] border border-[#e8eaf6]/20 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-2xl select-none" role="img" aria-label="brain">🧠</span>
              <h4 className="font-bold text-sm text-[#3f51b5]">Smart overlap detection</h4>
              <p className="text-xs text-[#616161] leading-relaxed">
                Automatically finds windows where everyone is in working hours, not just awake. We rank slots by combined preference.
              </p>
            </div>
          </div>

          {/* Card 2: Light Green */}
          <div className="p-6 rounded-2xl bg-[#e8f5e9] border border-[#e8f5e9]/20 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-2xl select-none" role="img" aria-label="calendar">🗓️</span>
              <h4 className="font-bold text-sm text-[#2e7d32]">Calendar integration</h4>
              <p className="text-xs text-[#616161] leading-relaxed">
                Checks Google/Outlook calendars to avoid double-booking before suggesting slots. Keeps everything synchronized smoothly.
              </p>
            </div>
          </div>

          {/* Card 3: Light Teal */}
          <div className="p-6 rounded-2xl bg-[#e0f2f1] border border-[#e0f2f1]/20 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-2xl select-none" role="img" aria-label="globe">🌏</span>
              <h4 className="font-bold text-sm text-[#00695c]">DST-aware</h4>
              <p className="text-xs text-[#616161] leading-relaxed">
                Knows when clocks change and warns you 7 days before any shift affects your meeting. Never get caught off-guard.
              </p>
            </div>
          </div>

          {/* Card 4: Light Purple */}
          <div className="p-6 rounded-2xl bg-[#f3e5f5] border border-[#f3e5f5]/20 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-2xl select-none" role="img" aria-label="link">🔗</span>
              <h4 className="font-bold text-sm text-[#7b1fa2]">One-click share</h4>
              <p className="text-xs text-[#616161] leading-relaxed">
                Send a link with all times in each person's local timezone. No conversion needed on their end.
              </p>
            </div>
          </div>

          {/* Card 5: Light Pink */}
          <div className="p-6 rounded-2xl bg-[#fce4ec] border border-[#fce4ec]/20 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-2xl select-none" role="img" aria-label="sparkles">✨</span>
              <h4 className="font-bold text-sm text-[#c2185b]">Instant results</h4>
              <p className="text-xs text-[#616161] leading-relaxed">
                Calculates all possible overlaps in under a second. No waiting, no loading spinners, no heavy page latency.
              </p>
            </div>
          </div>

          {/* Card 6: Light Cream */}
          <div className="p-6 rounded-2xl bg-[#f5f5dc] border border-[#f5f5dc]/20 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-2xl select-none" role="img" aria-label="chart">🎯</span>
              <h4 className="font-bold text-sm text-[#6d4c41]">Smart ranking</h4>
              <p className="text-xs text-[#616161] leading-relaxed">
                Scores each slot by overlap quality, business day preference, and your selected timezone limitations.
              </p>
            </div>
          </div>

        </div>
      </div>

      <ToolSdkPanel
        title="Power this UI from the Meeting API"
        summary="Same engine that ranks best meeting slots across multiple cities. Returns top 6 candidate hours scored by working-hour coverage."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// Best overlap slots across 3 cities with custom working hours
const result = await client.meeting.best({
  cities: ["NYC", "LDN", "TYO"],
  start: 9,        // working-hours start (per-city local)
  end: 17,         // working-hours end
  duration: 60,    // slot length in minutes
});

// Render the top 3
result.topSlots.slice(0, 3).forEach((slot) => {
  console.log(\`\${slot.utcHour}:00Z → score \${slot.score.toFixed(2)}\`);
  slot.perCity.forEach((c) => {
    console.log(\`   \${c.city}: \${c.localTime} (\${c.utcOffset})\`);
  });
});`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/meeting/best?cities=NYC,LDN,TYO&start=9&end=17&duration=60"`}
        docsHref="/docs/integrations/meeting-finder"
      />
      <ApiVerifyChip
        config={meetingFinderVerify}
        state={{ cities: participants.slice(0, 5).map((p: any) => p.code || "NYC"), start: 9, end: 17 }}
      />
    </div>
  );
}
