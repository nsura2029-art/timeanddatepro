import React, { useEffect, useRef } from "react";
import { CountryPreferences } from "../types";
import { getTheme } from "../utils/theme";
import { getTimezoneOffsetAndAbbr } from "../data/countries";

interface AnalogClockProps {
  date: Date;
  preferences?: CountryPreferences;
  timezone?: string;
  country?: string;
  countryName?: string;
  theme?: string;
  size?: "sm" | "md" | "lg";
  hideLabel?: boolean;
}

export default function AnalogClock({ 
  date, 
  preferences, 
  timezone, 
  country, 
  countryName, 
  theme, 
  size = "lg",
  hideLabel = false
}: AnalogClockProps) {
  const activeTimezone = timezone || preferences?.timezone || "Europe/London";
  const activeCountry = country || preferences?.country || "GB";
  const activeCountryName = countryName || preferences?.countryName || "United Kingdom";
  const activeTheme = theme || preferences?.theme || "slate";

  const t = getTheme(activeTheme);
  const { abbr, offsetStr } = getTimezoneOffsetAndAbbr(activeTimezone, date);

  // Define themed styling details for the dial (Luxury dark chronometer face)
  const getDialStyle = (themeName: string) => {
    switch (themeName) {
      case "cyber":
        return {
          bg: "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-indigo-500/40",
          text: "text-indigo-200",
          tickColor: "#a855f7", // vibrant purple
          tickMuted: "#4338ca", // dark indigo
          subdialBg: "bg-purple-950/85 border-purple-500/20 text-purple-300",
          hourHand: "bg-slate-50",
          minuteHand: "bg-indigo-200",
          secondHand: "bg-pink-500",
          pinBg: "bg-indigo-400"
        };
      case "emerald":
        return {
          bg: "bg-gradient-to-br from-emerald-950 via-zinc-900 to-emerald-950 border-emerald-500/40",
          text: "text-emerald-100",
          tickColor: "#10b981", // vibrant emerald
          tickMuted: "#064e3b", // dark emerald
          subdialBg: "bg-emerald-950/85 border-emerald-500/20 text-emerald-300",
          hourHand: "bg-white",
          minuteHand: "bg-emerald-100",
          secondHand: "bg-amber-400", // Gold-yellow hand
          pinBg: "bg-amber-400"
        };
      case "amber":
        return {
          bg: "bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-950 border-amber-500/40",
          text: "text-amber-100",
          tickColor: "#f59e0b", // warm amber
          tickMuted: "#78350f", // dark amber
          subdialBg: "bg-amber-950/85 border-amber-500/20 text-amber-300",
          hourHand: "bg-white",
          minuteHand: "bg-amber-200",
          secondHand: "bg-orange-500",
          pinBg: "bg-amber-400"
        };
      case "ocean":
        return {
          bg: "bg-gradient-to-br from-teal-950 via-slate-900 to-sky-950 border-sky-500/40",
          text: "text-sky-100",
          tickColor: "#06b6d4", // bright cyan
          tickMuted: "#164e63", // dark cyan
          subdialBg: "bg-cyan-950/85 border-cyan-500/20 text-cyan-300",
          hourHand: "bg-slate-50",
          minuteHand: "bg-cyan-200",
          secondHand: "bg-rose-400", // Coral hand
          pinBg: "bg-rose-400"
        };
      case "slate":
      default:
        return {
          bg: "bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-950 border-slate-700/40",
          text: "text-slate-100",
          tickColor: "#38bdf8", // Sky-blue ticks
          tickMuted: "#334155", // dark slate
          subdialBg: "bg-slate-900/90 border-slate-700 text-slate-300",
          hourHand: "bg-white",
          minuteHand: "bg-slate-200",
          secondHand: "bg-sky-400", // Electric-blue hand
          pinBg: "bg-sky-400"
        };
    }
  };

  const dial = getDialStyle(activeTheme);

  // Hand Refs for high-performance direct DOM updates
  const hourHandRef = useRef<HTMLDivElement>(null);
  const minuteHandRef = useRef<HTMLDivElement>(null);
  const secondHandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine the active timezone's absolute millisecond offset from UTC
    const getTzOffsetMs = (tz: string): number => {
      try {
        const d = new Date();
        const utcStr = d.toLocaleString("en-US", { timeZone: "UTC" });
        const tzStr = d.toLocaleString("en-US", { timeZone: tz });
        
        const utcTime = new Date(utcStr).getTime();
        const tzTime = new Date(tzStr).getTime();
        
        return tzTime - utcTime;
      } catch (e) {
        return 0;
      }
    };

    const tzOffsetMs = getTzOffsetMs(activeTimezone);
    let animFrameId: number;

    const updateClock = () => {
      const now = Date.now();
      // Translate the real browser timestamp to the target timezone's local equivalent
      const targetTzEpoch = now + tzOffsetMs;
      const d = new Date(targetTzEpoch);

      // Extract components in UTC format because the offset has shifted everything correctly
      const hour = d.getUTCHours();
      const minute = d.getUTCMinutes();
      const second = d.getUTCSeconds();
      const ms = d.getUTCMilliseconds();

      // Continuous, buttery-smooth, sub-second sweeping angle calculations (60 FPS)
      const secondAngle = (second + ms / 1000) * 6; // 6 degrees per second
      const minuteAngle = (minute + second / 60 + ms / 60000) * 6;
      const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * 30;

      // Update positions via direct style properties to avoid React state re-render overhead
      if (secondHandRef.current) {
        secondHandRef.current.style.transform = `rotate(${secondAngle}deg)`;
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `rotate(${minuteAngle}deg)`;
      }
      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `rotate(${hourAngle}deg)`;
      }

      animFrameId = requestAnimationFrame(updateClock);
    };

    updateClock();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [activeTimezone]);

  // Render all 12 hours positions mathematically
  const hourNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const numberRadius = 37; // percentage radius from center for placing numerals inside the dial

  const getSizingClasses = () => {
    switch (size) {
      case "sm":
        return "w-24 h-24 sm:w-28 sm:h-28 border-[3px]";
      case "md":
        return "w-40 h-40 sm:w-44 sm:h-44 border-[4px]";
      case "lg":
      default:
        return "w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 border-[6px]";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2.5 animate-fade-in">
      {/* Outer Chronometer Case (Deep Dark Brushed Premium Dial) */}
      <div 
        id="analog-clock-face"
        className={`relative ${getSizingClasses()} rounded-full ${dial.bg} shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] flex items-center justify-center select-none transition-all duration-300`}
        style={{
          boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.35), inset 0 4px 8px rgba(255, 255, 255, 0.05), inset 0 -4px 12px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(30, 41, 59, 0.1)`
        }}
      >
        {/* Inner glare element to simulate polished glass crystal */}
        <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-10" />

        {/* Dynamic country subtle silhouette watermark overlay inside dial */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-[0.04] pointer-events-none flex items-center justify-center">
          <img 
            src={`https://flagcdn.com/w320/${activeCountry === "OTHER" ? "un" : activeCountry.toLowerCase()}.png`}
            alt=""
            referrerPolicy="no-referrer"
            className="w-1/2 h-auto object-contain invert"
          />
        </div>

        {/* Premium Ticks (60 ticks or 12 ticks for small, with distinct bold hour markers) */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-0">
          {[...Array(size === "sm" ? 12 : 60)].map((_, i) => {
            const isHour = size === "sm" ? true : i % 5 === 0;
            const angle = size === "sm" ? i * 30 : i * 6;
            return (
              <div
                key={i}
                className="absolute inset-0 flex justify-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div 
                  className="rounded-full"
                  style={{
                    height: isHour ? (size === "sm" ? "6px" : "10px") : "4px",
                    width: isHour ? (size === "sm" ? "1.5px" : "2px") : "1.2px",
                    backgroundColor: isHour ? dial.tickColor : dial.tickMuted,
                    opacity: isHour ? 0.9 : 0.4,
                    marginTop: size === "sm" ? "4px" : "8px"
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Mathematical Hour Numerals (1 to 12) - hidden on sm size */}
        {size === "lg" && hourNumbers.map((num) => {
          const angleRad = (num * 30 * Math.PI) / 180;
          const leftPercent = 50 + numberRadius * Math.sin(angleRad);
          const topPercent = 50 - numberRadius * Math.cos(angleRad);
          
          return (
            <span
              key={num}
              className={`absolute font-mono text-sm sm:text-base font-bold ${dial.text} tracking-tight select-none pointer-events-none`}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: "translate(-50%, -50%)",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}
            >
              {num}
            </span>
          );
        })}

        {/* Dynamic subdial showing timezone code and exact Offset - hidden on sm size */}
        {size === "lg" && (
          <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center border px-2.5 py-0.5 rounded shadow-inner pointer-events-none ${dial.subdialBg}`}>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest leading-none mb-0.5">{abbr}</span>
            <span className="text-[8px] font-mono font-semibold opacity-75 leading-none">{offsetStr}</span>
          </div>
        )}

        {/* Hour Hand (Clean metal baton design) */}
        <div
          ref={hourHandRef}
          className={`absolute rounded-full ${dial.hourHand}`}
          style={{
            height: size === "sm" ? "20%" : "23%",
            width: size === "sm" ? "3px" : "6px",
            top: size === "sm" ? "30%" : "27%",
            left: size === "sm" ? "calc(50% - 1.5px)" : "calc(50% - 3px)",
            transformOrigin: "50% 100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
          }}
        />

        {/* Minute Hand (Sleek elongated tapered needle) */}
        <div
          ref={minuteHandRef}
          className={`absolute rounded-full ${dial.minuteHand}`}
          style={{
            height: size === "sm" ? "30%" : "34%",
            width: size === "sm" ? "2px" : "4px",
            top: size === "sm" ? "20%" : "16%",
            left: size === "sm" ? "calc(50% - 1px)" : "calc(50% - 2px)",
            transformOrigin: "50% 100%",
            boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
          }}
        />

        {/* Second Hand (High precision smooth sweep needle) */}
        <div
          ref={secondHandRef}
          className={`absolute ${dial.secondHand}`}
          style={{
            height: size === "sm" ? "34%" : "40%",
            width: "1.2px",
            top: size === "sm" ? "16%" : "10%",
            left: "calc(50% - 0.6px)",
            transformOrigin: "50% 100%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
          }}
        >
          {/* Circular counterweight near the tip representing high-end mechanical movements */}
          <div 
            className={`absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-slate-900/40 flex items-center justify-center shadow-sm ${dial.secondHand}`}
          />
        </div>

        {/* Center Polished Metal Pin Cap */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/50 shadow-md z-10" />
        <div className={`absolute w-1 h-1 rounded-full z-20 ${dial.pinBg}`} />
      </div>

      {/* Dynamic location label standard time tag */}
      {!hideLabel && (
        <div className="text-center font-mono pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeCountryName} Time</span>
        </div>
      )}
    </div>
  );
}
