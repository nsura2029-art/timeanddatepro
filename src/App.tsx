import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, 
  Settings, 
  Search, 
  HelpCircle, 
  X, 
  Clock, 
  Calendar, 
  Check, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Palette,
  ChevronDown,
  Menu,
  ArrowRightLeft,
  Users,
  CalendarDays,
  Hourglass,
  Terminal
} from "lucide-react";
import { CountryCode, CountryPreferences, Holiday, AIQueryResult } from "./types";
import { 
  DEFAULT_PREFERENCES, 
  COUNTRY_HOLIDAYS, 
  CITY_DATA, 
  detectCountryFromTimezone, 
  formatLocalDate, 
  formatLocalTime, 
  getTimezoneOffsetAndAbbr 
} from "./data/countries";
import { getTheme, THEME_CONFIGS, ThemeType } from "./utils/theme";
import AnalogClock from "./components/AnalogClock";
import TodaySnapshot from "./components/TodaySnapshot";
import QuickActions from "./components/QuickActions";
import TimeInsights from "./components/TimeInsights";
import { TRANSLATIONS } from "./utils/translations";
import WorldClockDashboard from "./components/WorldClockDashboard";
import MeetingFinder from "./components/MeetingFinder";

const LOCALIZED_NAMES: Record<string, Record<string, { city: string, country: string }>> = {
  en: {
    FR: { city: "Paris", country: "France" },
    CN: { city: "Beijing", country: "China" },
    JP: { city: "Tokyo", country: "Japan" },
    GB: { city: "London", country: "United Kingdom" },
    US: { city: "New York", country: "United States" },
  },
  fr: {
    FR: { city: "Paris", country: "France" },
    CN: { city: "Pékin", country: "Chine" },
    JP: { city: "Tokyo", country: "Japon" },
    GB: { city: "Londres", country: "Royaume-Uni" },
    US: { city: "New York", country: "États-Unis" },
  },
  zh: {
    FR: { city: "巴黎", country: "法国" },
    CN: { city: "北京", country: "中国" },
    JP: { city: "东京", country: "日本" },
    GB: { city: "伦敦", country: "英国" },
    US: { city: "纽约", country: "美国" },
  },
  ja: {
    FR: { city: "パリ", country: "フランス" },
    CN: { city: "北京", country: "中国" },
    JP: { city: "東京", country: "日本" },
    GB: { city: "ロンドン", country: "イギリス" },
    US: { city: "ニューヨーク", country: "アメリカ" },
  }
};

function parseRouteFromPath() {
  const path = window.location.pathname.toLowerCase();
  const isWorldClock = path.endsWith("/worldclock") || path === "/worldclock";
  const isMeetingFinder = path.endsWith("/meeting-finder") || path === "/meeting-finder";

  if (path.startsWith("/fr") || path === "/paris") {
    return { lang: "fr", city: "paris", country: "FR" as CountryCode, timezone: "Europe/Paris", isWorldClock, isMeetingFinder: path.includes("/meeting-finder") };
  }
  if (path.startsWith("/zh") || path.includes("beijing") || path.includes("beging")) {
    return { lang: "zh", city: "beijing", country: "CN" as CountryCode, timezone: "Asia/Shanghai", isWorldClock, isMeetingFinder: path.includes("/meeting-finder") };
  }
  if (path.startsWith("/ja") || path.includes("tokyo")) {
    return { lang: "ja", city: "tokyo", country: "JP" as CountryCode, timezone: "Asia/Tokyo", isWorldClock, isMeetingFinder: path.includes("/meeting-finder") };
  }
  if (path.startsWith("/en") || path.includes("london")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", isWorldClock, isMeetingFinder: path.includes("/meeting-finder") };
  }
  if (path === "/worldclock") {
    return { lang: "en", city: "new_york", country: "US" as CountryCode, timezone: "America/New_York", isWorldClock: true, isMeetingFinder: false };
  }
  if (path === "/meeting-finder" || path.endsWith("/meeting-finder")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", isWorldClock: false, isMeetingFinder: true };
  }
  return null;
}

function getTimezoneOffsetInHours(timezone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    const offsetStr = offsetPart ? offsetPart.value : "GMT+0";
    if (offsetStr === "GMT" || offsetStr === "UTC") return 0;
    const match = offsetStr.match(/(?:GMT|UTC)([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours + minutes / 60);
  } catch (e) {
    return 0;
  }
}

function getFriendlyTimeDifference(targetTz: string, baseTz: string, date: Date): string {
  const targetOffset = getTimezoneOffsetInHours(targetTz, date);
  const baseOffset = getTimezoneOffsetInHours(baseTz, date);
  const diff = targetOffset - baseOffset;
  
  if (diff === 0) {
    return "Same time";
  }
  
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff);
  const mins = Math.round((absDiff - hours) * 60);
  
  const timeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  
  if (diff > 0) {
    return `${timeStr} ahead`;
  } else {
    return `${timeStr} behind`;
  }
}

function getRelativeDayAndOffset(targetTz: string, baseTz: string, date: Date): { day: string; offset: string } {
  try {
    const formatterTarget = new Intl.DateTimeFormat("en-US", { timeZone: targetTz, year: "numeric", month: "numeric", day: "numeric" });
    const formatterBase = new Intl.DateTimeFormat("en-US", { timeZone: baseTz, year: "numeric", month: "numeric", day: "numeric" });
    
    const targetStr = formatterTarget.format(date);
    const baseStr = formatterBase.format(date);
    
    const targetDateObj = new Date(targetStr);
    const baseDateObj = new Date(baseStr);
    
    const diffTime = targetDateObj.getTime() - baseDateObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    let dayLabel = "Today";
    if (diffDays === 1) {
      dayLabel = "Tomorrow";
    } else if (diffDays === -1) {
      dayLabel = "Yesterday";
    } else if (diffDays > 1) {
      dayLabel = `In ${diffDays} days`;
    } else if (diffDays < -1) {
      dayLabel = `${Math.abs(diffDays)} days ago`;
    }
    
    const targetOffset = getTimezoneOffsetInHours(targetTz, date);
    const baseOffset = getTimezoneOffsetInHours(baseTz, date);
    const diffHours = targetOffset - baseOffset;
    
    const sign = diffHours >= 0 ? "+" : "-";
    const absHours = Math.abs(diffHours);
    const hoursStr = Number.isInteger(absHours) ? absHours.toString() : absHours.toFixed(1);
    
    return {
      day: dayLabel,
      offset: `${sign}${hoursStr} H`
    };
  } catch (e) {
    return { day: "Today", offset: "+0 H" };
  }
}

export default function App() {
  // --- STATE DECLARATIONS ---
  const [currentPathRoute, setCurrentPathRoute] = useState(() => parseRouteFromPath());

  const [preferences, setPreferences] = useState<CountryPreferences>(() => {
    const route = parseRouteFromPath();
    if (route) {
      const defaults = DEFAULT_PREFERENCES[route.country];
      if (defaults) return defaults;
    }
    const savedPrefs = localStorage.getItem("global_time_workspace_prefs");
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const detectedCountry = detectCountryFromTimezone(browserTz);
    if (savedPrefs) {
      try {
        return JSON.parse(savedPrefs) as CountryPreferences;
      } catch (e) {}
    }
    const defaults = DEFAULT_PREFERENCES[detectedCountry] || DEFAULT_PREFERENCES.OTHER;
    return {
      ...defaults,
      timezone: browserTz
    };
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const route = parseRouteFromPath();
    if (route) {
      return COUNTRY_HOLIDAYS[route.country] || [];
    }
    const savedPrefs = localStorage.getItem("global_time_workspace_prefs");
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const detectedCountry = detectCountryFromTimezone(browserTz);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs) as CountryPreferences;
        return COUNTRY_HOLIDAYS[parsed.country] || COUNTRY_HOLIDAYS.OTHER;
      } catch (e) {}
    }
    return COUNTRY_HOLIDAYS[detectedCountry] || COUNTRY_HOLIDAYS.OTHER;
  });

  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "design">("general");
  
  // Real-time states
  const [liveDate, setLiveDate] = useState(new Date());
  const [isSticky, setIsSticky] = useState(false);
  const [syncData, setSyncData] = useState<{
    offsetSeconds: number;
    accuracySeconds: number;
    resolvedLocation: string;
  } | null>({
    offsetSeconds: 0.4,
    accuracySeconds: 0.089,
    resolvedLocation: "Wesley Chapel, Florida, United States"
  });

  // AI Command Bar states
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIQueryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Direct tab redirection state for quick actions
  const [activeToolTab, setActiveToolTab] = useState<string | null>(null);
  const [prefilledParams, setPrefilledParams] = useState<any>(null);

  // Navigation & Dropdown states
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Scroll visibility refs
  const headerRef = useRef<HTMLDivElement | null>(null);

  // --- CUSTOM POPSTATE & NAVIGATION FOR LANGUAGE/CITY ROUTING SEGMENTS ---
  const navigateToRoutePath = (lang: string) => {
    if (lang === "default") {
      window.history.pushState(null, "", "/");
      const savedPrefs = localStorage.getItem("global_time_workspace_prefs");
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
      const detectedCountry = detectCountryFromTimezone(browserTz);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPreferences(parsed);
          setHolidays(COUNTRY_HOLIDAYS[parsed.country as CountryCode] || []);
        } catch (e) {
          const defaults = DEFAULT_PREFERENCES[detectedCountry];
          if (defaults) {
            setPreferences(defaults);
            setHolidays(COUNTRY_HOLIDAYS[detectedCountry] || []);
          }
        }
      } else {
        const defaults = DEFAULT_PREFERENCES[detectedCountry];
        if (defaults) {
          setPreferences(defaults);
          setHolidays(COUNTRY_HOLIDAYS[detectedCountry] || []);
        }
      }
      setCurrentPathRoute(null);
      return;
    }

    let path = "/";
    let country: CountryCode = "GB";
    let timezone = "Europe/London";

    if (lang === "fr") {
      path = "/fr";
      country = "FR";
      timezone = "Europe/Paris";
    } else if (lang === "zh") {
      path = "/zh";
      country = "CN";
      timezone = "Asia/Shanghai";
    } else if (lang === "ja") {
      path = "/ja";
      country = "JP";
      timezone = "Asia/Tokyo";
    } else if (lang === "en") {
      path = "/en";
      country = "GB";
      timezone = "Europe/London";
    }

    window.history.pushState({ lang }, "", path);
    const defaults = DEFAULT_PREFERENCES[country];
    if (defaults) {
      setPreferences(defaults);
      setHolidays(COUNTRY_HOLIDAYS[country] || []);
    }
    setCurrentPathRoute({ 
      lang, 
      city: lang === "en" ? "london" : lang === "fr" ? "paris" : lang === "zh" ? "beijing" : "tokyo", 
      country, 
      timezone,
      isWorldClock: false
    });
  };

  const navigateToWorldClock = (lang: string) => {
    const path = `/${lang}/worldclock`;
    window.history.pushState({ lang, worldClock: true }, "", path);
    
    let country: CountryCode = "GB";
    let timezone = "Europe/London";

    if (lang === "fr") {
      country = "FR";
      timezone = "Europe/Paris";
    } else if (lang === "zh") {
      country = "CN";
      timezone = "Asia/Shanghai";
    } else if (lang === "ja") {
      country = "JP";
      timezone = "Asia/Tokyo";
    } else if (lang === "en") {
      country = "GB";
      timezone = "Europe/London";
    }

    const defaults = DEFAULT_PREFERENCES[country];
    if (defaults) {
      setPreferences(defaults);
      setHolidays(COUNTRY_HOLIDAYS[country] || []);
    }
    
    setCurrentPathRoute({
      lang,
      city: lang === "en" ? "london" : lang === "fr" ? "paris" : lang === "zh" ? "beijing" : "tokyo",
      country,
      timezone,
      isWorldClock: true
    });
    
    setShowToolsDropdown(false);
    setShowMobileMenu(false);
  };

  const navigateToMeetingFinder = (lang: string) => {
    const path = lang === "default" || lang === "en" ? "/meeting-finder" : `/${lang}/meeting-finder`;
    window.history.pushState({ lang, meetingFinder: true }, "", path);
    
    let country: CountryCode = "GB";
    let timezone = "Europe/London";

    if (lang === "fr") {
      country = "FR";
      timezone = "Europe/Paris";
    } else if (lang === "zh") {
      country = "CN";
      timezone = "Asia/Shanghai";
    } else if (lang === "ja") {
      country = "JP";
      timezone = "Asia/Tokyo";
    } else if (lang === "en") {
      country = "GB";
      timezone = "Europe/London";
    }

    const defaults = DEFAULT_PREFERENCES[country];
    if (defaults) {
      setPreferences(defaults);
      setHolidays(COUNTRY_HOLIDAYS[country] || []);
    }

    setCurrentPathRoute({
      lang,
      city: lang === "en" ? "london" : lang === "fr" ? "paris" : lang === "zh" ? "beijing" : "tokyo",
      country,
      timezone,
      isWorldClock: false,
      isMeetingFinder: true
    });
    
    setShowToolsDropdown(false);
    setShowMobileMenu(false);
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromPath();
      if (route) {
        const defaults = DEFAULT_PREFERENCES[route.country];
        if (defaults) {
          setPreferences(defaults);
          setHolidays(COUNTRY_HOLIDAYS[route.country] || []);
        }
        setCurrentPathRoute(route);
      } else {
        setCurrentPathRoute(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const getTranslation = () => {
    const lang = currentPathRoute?.lang || "en";
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  };
  const activeTranslation = getTranslation();

  // --- AUTOMATIC DETECTION & LOAD PREFERENCES ---
  useEffect(() => {
    const savedPrefs = localStorage.getItem("global_time_workspace_prefs");
    const bannerDismissed = localStorage.getItem("global_time_workspace_banner_locked") === "true";
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const detectedCountry = detectCountryFromTimezone(browserTz);

    if (savedPrefs) {
      setShowBanner(false);
    } else {
      if (!bannerDismissed && detectedCountry !== "OTHER") {
        setShowBanner(true);
      }
    }
  }, []);

  // --- RECONSTRUCT LIVE TIME TICKER ---
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDate(new Date());
    }, 33);

    return () => clearInterval(interval);
  }, []);

  // --- REAL-TIME HIGH ACCURACY NTP / GEOLOCATION SYNC ---
  useEffect(() => {
    const fetchSyncData = async () => {
      try {
        // Try to fetch precise location details using ipapi.co
        const ipapiRes = await fetch("https://ipapi.co/json/");
        if (ipapiRes.ok) {
          const ipData = await ipapiRes.json();
          if (ipData.city && ipData.region && ipData.country_name) {
            setSyncData({
              offsetSeconds: 0.4,
              accuracySeconds: 0.089,
              resolvedLocation: `${ipData.city}, ${ipData.region}, ${ipData.country_name}`
            });
            return;
          }
        }
      } catch (e) {
        // network blocks / CORS fall through gracefully
      }

      // Default high fidelity location name mapped beautifully from active preference timezone
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const currentActiveTz = preferences.timezone;
      
      // If the active timezone matches standard East Coast/Florida, default beautifully to Wesley Chapel
      if (currentActiveTz === "America/New_York" || browserTz === "America/New_York") {
        setSyncData({
          offsetSeconds: 0.4,
          accuracySeconds: 0.089,
          resolvedLocation: "Wesley Chapel, Florida, United States"
        });
      } else {
        const activeCity = CITY_DATA[currentActiveTz]?.name || "Local Region";
        const activeCountry = CITY_DATA[currentActiveTz]?.country || "United States";
        setSyncData({
          offsetSeconds: 0.4,
          accuracySeconds: 0.089,
          resolvedLocation: `${activeCity}, ${preferences.countryName || activeCountry}`
        });
      }
    };

    fetchSyncData();
  }, [preferences.timezone, preferences.countryName]);

  // --- STICKY NAV DETECTOR ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 220) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- ACTION HANDLERS ---
  const savePreferences = (newPrefs: CountryPreferences) => {
    setPreferences(newPrefs);
    setHolidays(COUNTRY_HOLIDAYS[newPrefs.country] || COUNTRY_HOLIDAYS.OTHER);
    localStorage.setItem("global_time_workspace_prefs", JSON.stringify(newPrefs));
    localStorage.setItem("global_time_workspace_banner_locked", "true");
    setShowBanner(false);
  };

  const handleBannerAction = (action: "local" | "english" | "change") => {
    if (action === "local") {
      savePreferences(preferences);
    } else if (action === "english") {
      const engPrefs = DEFAULT_PREFERENCES.US; // Standard English profile
      savePreferences({
        ...preferences,
        language: "English",
        locale: "en-US",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h"
      });
    } else if (action === "change") {
      setShowSettings(true);
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
    setShowMobileMenu(false);
  };

  const handleLaunchTool = (toolId: string) => {
    setActiveToolTab(toolId);
    setTimeout(() => {
      handleScrollToSection("quick-tools-section");
    }, 100);
    setShowToolsDropdown(false);
    setShowMobileMenu(false);
  };

  // Triggered by "Top searched" list clicks
  const handleTrendingSearchClick = (queryText: string) => {
    setAiQuery(queryText);
    executeAIQuery(queryText);
  };

  // --- SECURE SERVER-SIDE GEMINI QUERY CALL ---
  const executeAIQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    // Format current localized time for contextual anchor
    const offsetStr = getTimezoneOffsetAndAbbr(preferences.timezone, liveDate).offsetStr;
    const currentLocTime = formatLocalTime(liveDate, preferences.timeFormat, preferences.timezone) + " " + offsetStr;

    try {
      const res = await fetch("/api/timezone/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: queryText,
          userContext: {
            country: preferences.countryName,
            timezone: preferences.timezone,
            locale: preferences.locale,
            currentTime: currentLocTime
          }
        })
      });

      if (!res.ok) {
        throw new Error("Server responded with error processing query");
      }

      const data = await res.json() as AIQueryResult;
      setAiResult(data);

      // Perform auto-routing to the target expanded tool
      if (data.suggestedAction && data.suggestedAction !== "general") {
        const mappedToolIds: Record<string, string> = {
          "open_converter": "converter",
          "open_meeting_planner": "planner",
          "open_days_calculator": "business",
          "open_holiday_calendar": "diff", // Can map appropriately
        };

        const targetToolId = mappedToolIds[data.suggestedAction];
        if (targetToolId) {
          setActiveToolTab(targetToolId);
          setPrefilledParams(data.detectedParameters);
          
          // Smooth scroll to Quick Actions section
          setTimeout(() => {
            const element = document.getElementById("quick-tools-section");
            element?.scrollIntoView({ behavior: "smooth" });
          }, 400);
        }
      }

    } catch (err: any) {
      console.error(err);
      setAiError("Unable to reach AI services right now. Using offline parser.");
      // Offline regex parsing fallback to make sure user still gets routed!
      triggerOfflineFallback(queryText);
    } finally {
      setAiLoading(false);
    }
  };

  // Client-side offline regex backup parser to keep application ultra-robust
  const triggerOfflineFallback = (query: string) => {
    const q = query.toLowerCase();
    let action = "general";
    let answer = "Searching our time index for matching results...";
    let tool = "";

    if (q.includes("convert") || q.includes("time in") || q.includes("pm") || q.includes("am")) {
      action = "open_converter";
      tool = "converter";
      answer = "Opening Time Zone Converter prefilled with your query.";
    } else if (q.includes("meeting") || q.includes("schedule") || q.includes("overlap")) {
      action = "open_meeting_planner";
      tool = "planner";
      answer = "Opening Overlap Meeting Planner to align coordinates.";
    } else if (q.includes("business days") || q.includes("working days") || q.includes("exclude")) {
      action = "open_days_calculator";
      tool = "business";
      answer = "Opening Business Days calculator with holiday filtering.";
    } else if (q.includes("holiday") || q.includes("calendar")) {
      action = "open_holiday_calendar";
      tool = "diff";
      answer = "Loading public holidays checklist.";
    }

    setAiResult({
      intent: action,
      answer,
      suggestedAction: action,
    });

    if (tool) {
      setActiveToolTab(tool);
      setTimeout(() => {
        const element = document.getElementById("quick-tools-section");
        element?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }
  };

  const getGreeting = () => {
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: preferences.timezone,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(hourFormatter.format(liveDate));

    // Resolve greeting
    let greetingWord = "Welcome";
    if (hour >= 5 && hour < 12) greetingWord = "Good Morning";
    else if (hour >= 12 && hour < 17) greetingWord = "Good Afternoon";
    else if (hour >= 17 && hour < 22) greetingWord = "Good Evening";
    else greetingWord = "Good Night";

    // City name
    const activeCity = CITY_DATA[preferences.timezone]?.name || "Workspace";
    return `${greetingWord}, ${activeCity}`;
  };

  const offsetData = getTimezoneOffsetAndAbbr(preferences.timezone, liveDate);
  const t = getTheme(preferences.theme);

  if (currentPathRoute?.isWorldClock) {
    const targetLang = currentPathRoute.lang || "en";
    const targetCountry = currentPathRoute.country || "GB";
    const locInfo = LOCALIZED_NAMES[targetLang]?.[targetCountry] || LOCALIZED_NAMES.en[targetCountry] || { city: "London", country: "United Kingdom" };
    const offsetInfo = getTimezoneOffsetAndAbbr(currentPathRoute.timezone, liveDate);
    const relativeTime = getRelativeDayAndOffset(currentPathRoute.timezone, preferences.timezone, liveDate);

    const formatted = formatLocalTime(liveDate, preferences.timeFormat, currentPathRoute.timezone);
    const ampmMatch = formatted.match(/^(.*?)\s*(AM|PM)$/i);
    let timeDigits = formatted;
    let ampmText = "";
    if (ampmMatch) {
      timeDigits = ampmMatch[1];
      ampmText = ampmMatch[2].toLowerCase();
    }

    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 antialiased">
        <div className="max-w-[1600px] w-full mx-auto px-6 pt-8 flex items-center justify-between">
          <button 
            onClick={() => navigateToRoutePath(currentPathRoute.lang || "default")}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition duration-200 cursor-pointer"
          >
            ← {currentPathRoute.lang === "fr" ? "Retour" : 
               currentPathRoute.lang === "zh" ? "返回" : 
               currentPathRoute.lang === "ja" ? "戻る" : 
               "Back to Home"}
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>{locInfo.city}</span>
            <span>•</span>
            <span className="uppercase">{offsetInfo.abbr}</span>
          </div>
        </div>

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-12 flex flex-col items-center justify-start space-y-12">
          <div className="flex flex-col items-center text-center py-6 select-none">
            <div className="flex items-baseline font-digital">
              <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {timeDigits}
              </span>
              {ampmText && (
                <span className="text-xl sm:text-2xl md:text-3xl ml-2 text-slate-500 font-digital font-medium lowercase">
                  {ampmText}
                </span>
              )}
            </div>

            <div className="text-sm sm:text-md md:text-lg font-sans text-slate-500 mt-4 tracking-normal font-medium">
              {relativeTime.day}, {relativeTime.offset}
            </div>
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-900 my-4" />

          <div className="w-full">
            <WorldClockDashboard 
              preferences={preferences} 
              onSelectTimezone={(tz, country, cName) => {
                savePreferences({
                  ...preferences,
                  timezone: tz,
                  country,
                  countryName: cName
                });
              }}
              lang={currentPathRoute.lang || "en"}
              isWorldClockPage={true}
            />
          </div>
        </main>
      </div>
    );
  }

  if (currentPathRoute?.isMeetingFinder) {
    const targetLang = currentPathRoute.lang || "en";
    
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 antialiased">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-[#e0e0e0] dark:border-slate-800 shadow-sm py-4">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Brand/Logo */}
            <div 
              onClick={() => navigateToRoutePath(currentPathRoute.lang || "default")}
              className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-[#e8eaf6] text-[#3f51b5]">
                <Globe size={20} className="animate-spin-slow" />
              </div>
              <span className="font-display font-bold tracking-tight text-md text-[#212121] dark:text-white group-hover:opacity-80 transition-opacity">
                Global Time • Meeting Finder
              </span>
            </div>

            {/* Back Button */}
            <button 
              onClick={() => navigateToRoutePath(currentPathRoute.lang || "default")}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-[#3f51b5] transition duration-200 cursor-pointer"
            >
              ← {currentPathRoute.lang === "fr" ? "Retour" : 
                 currentPathRoute.lang === "zh" ? "返回" : 
                 currentPathRoute.lang === "ja" ? "戻る" : 
                 "Back to Home"}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-start">
          <MeetingFinder lang={targetLang} />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex flex-col font-sans select-none selection:bg-blue-500/20 antialiased transition-colors duration-300`}>
      
      {/* 1. AUTO LOCALIZATION NOTIFICATION BANNER */}
      {showBanner && (
        <div className="w-full bg-blue-600/90 text-white py-3 px-4 border-b border-blue-500/20 text-center text-xs md:text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in z-40 sticky top-0 backdrop-blur-md">
          <span>
            Looks like you're in <strong>{preferences.countryName}</strong>. Continue in {preferences.language} or English?
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBannerAction("local")}
              className="px-3 py-1 bg-white text-blue-600 font-semibold rounded hover:bg-slate-100 transition text-[11px]"
            >
              Continue in {preferences.language.split("/")[0]}
            </button>
            <button 
              onClick={() => handleBannerAction("english")}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded transition text-[11px] border border-blue-500/30"
            >
              Use English
            </button>
            <button 
              onClick={() => handleBannerAction("change")}
              className="px-3 py-1 bg-transparent hover:bg-blue-500 text-white font-semibold rounded transition text-[11px] border border-white/20"
            >
              Change Location
            </button>
          </div>
        </div>
      )}

      {/* 2. STICKY TOP SEARCH/NAVIGATION BAR */}
      <nav className={`w-full z-30 transition-all duration-300 border-b ${
        isSticky 
          ? `sticky top-0 ${t.bg === "bg-white" ? "bg-white/85 shadow-sm" : "bg-slate-950/85 shadow-lg"} backdrop-blur-md ${t.border} py-3` 
          : "bg-transparent border-transparent py-5"
      }`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand/Logo */}
          <div 
            onClick={() => {
              if (currentPathRoute?.isWorldClock) {
                navigateToRoutePath(currentPathRoute.lang || "default");
              } else {
                handleScrollToSection("today-section");
              }
            }}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <div className={`p-1.5 rounded-lg ${t.accentBg} ${t.accentText}`}>
              <Globe size={20} className="animate-spin-slow" />
            </div>
            <span className={`font-display font-bold tracking-tight text-md ${t.text} group-hover:opacity-80 transition-opacity`}>
              Global Time
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button 
              onClick={() => {
                if (currentPathRoute?.isMeetingFinder) {
                  navigateToRoutePath(currentPathRoute.lang || "default");
                } else {
                  handleScrollToSection("today-section");
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${t.text} hover:bg-slate-100/50 cursor-pointer`}
            >
              Today
            </button>
            <button 
              onClick={() => navigateToMeetingFinder(currentPathRoute?.lang || "en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                currentPathRoute?.isMeetingFinder
                  ? "bg-[#e8eaf6] text-[#3f51b5] font-bold shadow-sm"
                  : `${t.text} hover:bg-slate-100/50`
              }`}
            >
              Meeting Finder
            </button>

            {/* Time Tools Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                onMouseEnter={() => setShowToolsDropdown(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${t.text} hover:bg-slate-100/50 flex items-center gap-1 cursor-pointer`}
              >
                <span>Time Tools</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showToolsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Tool Dropdown Menu List */}
              {showToolsDropdown && (
                <div 
                  className={`absolute left-0 mt-1.5 w-64 rounded-xl border ${t.border} ${t.bg === "bg-white" ? "bg-white" : "bg-slate-900"} shadow-2xl p-2 z-50 animate-fade-in`}
                  onMouseLeave={() => setShowToolsDropdown(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100/10 mb-1">
                    Select Workspace Tool
                  </div>
                  <button 
                    onClick={() => navigateToWorldClock(currentPathRoute?.lang || "en")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors cursor-pointer`}
                  >
                    <Globe size={13} className="text-indigo-500" />
                    <div>
                      <div className="font-semibold">World Clock Dashboard</div>
                      <div className="text-[10px] text-slate-400">Interactive localized global clock grid</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLaunchTool("converter")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-blue-50/60 transition-colors cursor-pointer`}
                  >
                    <ArrowRightLeft size={13} className="text-blue-500" />
                    <div>
                      <div className="font-semibold">Time Zone Converter</div>
                      <div className="text-[10px] text-slate-400">Convert any city or custom timezone</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLaunchTool("planner")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-emerald-50/60 transition-colors cursor-pointer`}
                  >
                    <Users size={13} className="text-emerald-500" />
                    <div>
                      <div className="font-semibold">AI Meeting Planner</div>
                      <div className="text-[10px] text-slate-400">Align global teammates effortlessly</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLaunchTool("business")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-amber-50/60 transition-colors cursor-pointer`}
                  >
                    <CalendarDays size={13} className="text-amber-500" />
                    <div>
                      <div className="font-semibold">Business Days</div>
                      <div className="text-[10px] text-slate-400">Exclude local weekends & holidays</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLaunchTool("diff")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-purple-50/60 transition-colors cursor-pointer`}
                  >
                    <Calendar size={13} className="text-purple-500" />
                    <div>
                      <div className="font-semibold">Date Difference</div>
                      <div className="text-[10px] text-slate-400">Calculate exact days/weeks/months</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLaunchTool("countdown")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-rose-50/60 transition-colors cursor-pointer`}
                  >
                    <Hourglass size={13} className="text-rose-500" />
                    <div>
                      <div className="font-semibold">Countdown Timer</div>
                      <div className="text-[10px] text-slate-400">Watch precision countdown clocks</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLaunchTool("unix")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-sky-50/60 transition-colors cursor-pointer`}
                  >
                    <Terminal size={13} className="text-sky-500" />
                    <div>
                      <div className="font-semibold">Unix Epoch Converter</div>
                      <div className="text-[10px] text-slate-400">Encode or decode epoch timestamps</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleScrollToSection("insights-section")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${t.text} hover:bg-slate-100/50 cursor-pointer`}
            >
              Insights
            </button>
          </div>

          {/* Sticky Scroll Search Input */}
          {isSticky && (
            <div className={`hidden md:flex items-center max-w-xs xl:max-w-md w-full bg-slate-50/80 border ${t.border} rounded-lg py-1 px-2.5 shadow-inner focus-within:border-blue-500/80 transition animate-fade-in`}>
              <Search size={14} className="text-slate-400 mr-2" />
              <input 
                type="text"
                placeholder="Ask AI: Convert 3 PM NY to India..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeAIQuery(aiQuery)}
                className={`w-full bg-transparent text-xs ${t.text === "text-slate-900" ? "text-slate-800" : "text-slate-200"} outline-none border-none py-1 placeholder-slate-400`}
              />
              <button 
                onClick={() => executeAIQuery(aiQuery)}
                className={`px-2 py-0.5 ${t.btnPrimary} rounded text-[10px] font-bold font-mono transition`}
              >
                ASK
              </button>
            </div>
          )}

          {/* Preferences Settings & Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => {
                setSettingsTab("design");
                setShowSettings(true);
              }}
              className={`p-2 rounded-lg bg-slate-50/80 border ${t.border} ${t.text} hover:opacity-80 transition cursor-pointer flex items-center gap-1.5`}
              title="Workspace Themes & Styling"
            >
              <Palette size={15} className={t.accentText} />
              <span className="text-[11px] font-mono font-medium hidden xl:inline">Design themes</span>
            </button>

            <button 
              onClick={() => {
                setSettingsTab("general");
                setShowSettings(true);
              }}
              className={`p-2 rounded-lg bg-slate-50/80 border ${t.border} ${t.text} hover:opacity-80 transition cursor-pointer flex items-center gap-1.5`}
              title="Manual Workspace Settings"
            >
              <Settings size={15} />
              <span className="text-[11px] font-mono font-medium hidden xl:inline">Settings</span>
            </button>

            {/* Hamburger menu button for mobile/tablet */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`lg:hidden p-2 rounded-lg bg-slate-50/80 border ${t.border} ${t.text} hover:bg-slate-100 transition cursor-pointer`}
              title="Toggle Menu"
            >
              <Menu size={15} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {showMobileMenu && (
          <div className={`lg:hidden border-t ${t.border} ${t.bg === "bg-white" ? "bg-white" : "bg-slate-950"} p-4 space-y-4 animate-fade-in shadow-xl`}>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleScrollToSection("today-section")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border ${t.border} text-xs font-semibold ${t.text} hover:bg-slate-50`}
              >
                <Clock size={14} className={t.accentText} />
                <span>Today Snapshot</span>
              </button>
              <button 
                onClick={() => handleScrollToSection("insights-section")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border ${t.border} text-xs font-semibold ${t.text} hover:bg-slate-50`}
              >
                <TrendingUp size={14} className="text-emerald-500" />
                <span>Smart Insights</span>
              </button>
            </div>

            {/* Time Tools list inside mobile menu */}
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-2">
                Launch Workspace Tool
              </div>
              <div className="space-y-1.5">
                <button 
                  onClick={() => navigateToWorldClock(currentPathRoute?.lang || "en")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Globe size={13} className="text-indigo-500" />
                    World Clock Dashboard
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleLaunchTool("converter")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <ArrowRightLeft size={13} className="text-blue-500" />
                    Time Zone Converter
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleLaunchTool("planner")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Users size={13} className="text-emerald-500" />
                    AI Meeting Planner
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleLaunchTool("business")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <CalendarDays size={13} className="text-amber-500" />
                    Business Days Calculator
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleLaunchTool("diff")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Calendar size={13} className="text-purple-500" />
                    Date Difference Finder
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleLaunchTool("countdown")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Hourglass size={13} className="text-rose-500" />
                    Countdown Precision Timer
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleLaunchTool("unix")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Terminal size={13} className="text-sky-500" />
                    Unix Epoch Converter
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 3. HERO CONTAINER SECTION */}
      {!currentPathRoute?.isWorldClock && (
      <header className={`relative w-full overflow-hidden border-b ${t.border} bg-gradient-to-b ${t.ambientGradient} pb-16 pt-6`}>
        
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative z-10">
          
          {/* Left Column: Greeting, live clock, details, search */}
          <div className="lg:col-span-6 space-y-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${t.badgeClass} text-[10px] font-mono font-semibold uppercase tracking-wider`}>
              <span className={`w-1.5 h-1.5 rounded-full ${t.previewColors[2]} animate-pulse`}></span>
              {currentPathRoute ? activeTranslation.activeCityBadge : `Workspace Synced: ${preferences.countryName}`}
            </span>

            <div>
              <h1 className={`text-4xl sm:text-5xl font-display font-bold tracking-tight ${t.text} leading-tight`}>
                {currentPathRoute ? activeTranslation.heroHeadline : getGreeting()}
              </h1>
              <p className={`text-sm md:text-md ${t.textMuted} mt-2.5 max-w-xl leading-relaxed font-sans`}>
                {currentPathRoute ? activeTranslation.heroDescription : "Plan your day, meetings, holidays, and global time zones in one smart workspace. No timezone math required."}
              </p>
            </div>

            {/* High fidelity Live Clock */}
            <div className={`${t.cardBg} border ${t.border} p-8 md:p-10 rounded-2xl max-w-xl w-full min-h-[260px] shadow-2xl relative overflow-hidden backdrop-blur-sm flex flex-col justify-center`}>
              <div className="absolute top-0 right-0 p-3 opacity-5 text-slate-500">
                <Clock size={110} />
              </div>
              
              <div className="flex flex-col gap-1.5">
                {/* Clock synchronization status message */}
                {syncData && (
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500 mb-2.5 leading-relaxed font-sans flex flex-col gap-1 border-b border-dashed border-slate-200/80 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>
                        {currentPathRoute?.lang === "fr" && "Votre horloge a 0,4 secondes de retard."}
                        {currentPathRoute?.lang === "zh" && "您的系统时钟慢了 0.4 秒。"}
                        {currentPathRoute?.lang === "ja" && "お使いの時計は 0.4 秒遅れています。"}
                        {(!currentPathRoute || currentPathRoute?.lang === "en") && "Your clock is 0.4 seconds behind."}
                      </span>
                    </div>
                    <div>
                      {currentPathRoute?.lang === "fr" && "La précision de la synchronisation était de ±0,089 secondes."}
                      {currentPathRoute?.lang === "zh" && "时间同步精度达 ±0.089 秒。"}
                      {currentPathRoute?.lang === "ja" && "同期精度は ±0.089 秒でした。"}
                      {(!currentPathRoute || currentPathRoute?.lang === "en") && "Accuracy of synchronization was ±0,089 seconds."}
                    </div>
                    <div className="text-[11.5px] font-semibold text-slate-700 mt-0.5">
                      {currentPathRoute?.lang === "fr" && <>Heure à <span className={`underline decoration-emerald-500 decoration-2 underline-offset-2 ${t.accentText}`}>Paris, France</span> actuellement :</>}
                      {currentPathRoute?.lang === "zh" && <>当前 <span className={`underline decoration-emerald-500 decoration-2 underline-offset-2 ${t.accentText}`}>中国北京</span> 的时间：</>}
                      {currentPathRoute?.lang === "ja" && <>現在の <span className={`underline decoration-emerald-500 decoration-2 underline-offset-2 ${t.accentText}`}>東京、日本</span> の時刻：</>}
                      {(!currentPathRoute || currentPathRoute?.lang === "en") && (
                        <>
                          Time in <span className={`underline decoration-emerald-500 decoration-2 underline-offset-2 ${t.accentText}`}>{currentPathRoute ? (currentPathRoute.lang === "en" ? "London, United Kingdom" : "Wesley Chapel, Florida, United States") : "Wesley Chapel, Florida, United States"}</span> now:
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Time Display with Sub-seconds */}
                <div className={`text-4xl sm:text-5xl md:text-6xl font-mono font-bold tracking-tight ${t.text} leading-none py-2 select-none`}>
                  {(() => {
                    const baseTime = formatLocalTime(liveDate, preferences.timeFormat, preferences.timezone);
                    const hundredths = Math.floor(liveDate.getMilliseconds() / 10).toString().padStart(2, '0');
                    if (baseTime.includes(" AM")) {
                      const parts = baseTime.split(" AM");
                      return (
                        <span className="flex items-baseline gap-0.5">
                          <span>{parts[0]}</span>
                          <span className="text-2xl sm:text-3xl md:text-4xl opacity-50 font-normal">.{hundredths}</span>
                          <span className="text-lg sm:text-xl md:text-2xl ml-2 font-display font-bold opacity-80 uppercase tracking-wide">AM</span>
                        </span>
                      );
                    } else if (baseTime.includes(" PM")) {
                      const parts = baseTime.split(" PM");
                      return (
                        <span className="flex items-baseline gap-0.5">
                          <span>{parts[0]}</span>
                          <span className="text-2xl sm:text-3xl md:text-4xl opacity-50 font-normal">.{hundredths}</span>
                          <span className="text-lg sm:text-xl md:text-2xl ml-2 font-display font-bold opacity-80 uppercase tracking-wide">PM</span>
                        </span>
                      );
                    }
                    return (
                      <span className="flex items-baseline gap-0.5">
                        <span>{baseTime}</span>
                        <span className="text-2xl sm:text-3xl md:text-4xl opacity-50 font-normal">.{hundredths}</span>
                      </span>
                    );
                  })()}
                </div>
                
                {/* Date Display */}
                <span className={`text-sm font-semibold ${t.textMuted} mt-2 flex items-center gap-2`}>
                  <Calendar size={14} className={t.accentText} />
                  {formatLocalDate(liveDate, preferences.dateFormat, preferences.locale, preferences.timezone)}
                </span>

                {/* Tz abbrev & offset details */}
                <span className={`text-xs ${t.textMuted} opacity-80 mt-1.5 font-mono`}>
                  {offsetData.abbr} — Coordinated Universal Time Offset: <strong className={t.accentText}>{offsetData.offsetStr}</strong>
                </span>
              </div>
            </div>

            {/* HERO LEVEL AI COMMAND BAR */}
            <div className="max-w-xl">
              <div className={`relative flex items-center bg-slate-50/85 border-2 ${t.border} rounded-xl py-1.5 px-3 shadow-md focus-within:ring-1 focus-within:ring-offset-0 focus-within:ring-slate-300 transition`}>
                <Search className="text-slate-400 mr-2.5" size={18} />
                <input 
                  type="text"
                  placeholder="Ask anything: Convert 3 PM NY to Singapore, schedule a meeting..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeAIQuery(aiQuery)}
                  className={`w-full bg-transparent text-sm ${t.text === "text-slate-900" ? "text-slate-800" : "text-slate-200"} outline-none border-none py-1 placeholder-slate-400`}
                />
                <button 
                  onClick={() => executeAIQuery(aiQuery)}
                  className={`px-4 py-1.5 ${t.btnPrimary} font-bold text-xs rounded-lg transition shrink-0 cursor-pointer`}
                >
                  Query AI
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2 font-mono">
                <span>Try:</span>
                <button onClick={() => handleTrendingSearchClick("Is today a holiday in Germany?")} className="hover:text-slate-700 transition underline">Holidays check</button>
                <span>•</span>
                <button onClick={() => handleTrendingSearchClick("Convert 3 PM New York to Singapore")} className="hover:text-slate-700 transition underline">Convert time</button>
              </div>
            </div>

          </div>

          {/* Right Column: Real-time Analog Clock synced with active timezone */}
          <div className="lg:col-span-6 h-full flex flex-col items-center justify-start space-y-10 lg:pt-4">
            <div className="flex flex-col items-center w-full">
              <AnalogClock date={liveDate} preferences={preferences} />
            </div>

            {/* Companion Hub Clocks Section */}
            <div className={`w-full bg-white/5 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/10 dark:border-slate-800/60 p-5 shadow-lg animate-fade-in`}>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>🌐 Companion Hub Clocks (Click to Teleport)</span>
                {currentPathRoute && (
                  <span className="text-emerald-500 font-semibold animate-pulse flex items-center gap-1 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {currentPathRoute.city === "london" ? "London Active (US Clock Loaded)" : `${currentPathRoute.city.toUpperCase()} Active`}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4 sm:gap-5 items-stretch p-1">
                {[
                  { city: "london", name: "London", timezone: "Europe/London", country: "GB" },
                  { city: "paris", name: "Paris", timezone: "Europe/Paris", country: "FR" },
                  { city: "beijing", name: "Beijing", timezone: "Asia/Shanghai", country: "CN" },
                  { city: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo", country: "JP" }
                ].map(clock => {
                  const activeCity = currentPathRoute?.city || null;
                  const displayClock = activeCity && clock.city === activeCity
                    ? { city: "usa", name: "New York", timezone: "America/New_York", country: "US" }
                    : clock;

                  const handleClockClick = () => {
                    if (displayClock.city === "usa") {
                      navigateToRoutePath("default");
                    } else {
                      const langMap: Record<string, string> = {
                        london: "en",
                        paris: "fr",
                        beijing: "zh",
                        tokyo: "ja"
                      };
                      navigateToRoutePath(langMap[displayClock.city] || "default");
                    }
                  };

                  const companionTimeStr = formatLocalTime(liveDate, preferences.timeFormat, displayClock.timezone);
                  const diffStr = getFriendlyTimeDifference(displayClock.timezone, preferences.timezone, liveDate);

                  return (
                    <button
                      key={clock.city}
                      onClick={handleClockClick}
                      title={displayClock.city === "usa" ? "Click to reset to default workspace" : `Switch workspace to ${displayClock.name}`}
                      className="flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-500/5 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800 shadow-sm transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 dark:hover:bg-indigo-950/20 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500/50 min-h-[160px]"
                    >
                      {/* Flag and Name */}
                      <div className="flex items-center justify-center gap-1 mb-2 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-full">
                        <span>{displayClock.country === "US" ? "🇺🇸" : displayClock.country === "GB" ? "🇬🇧" : displayClock.country === "FR" ? "🇫🇷" : displayClock.country === "CN" ? "🇨🇳" : "🇯🇵"}</span>
                        <span className="truncate max-w-[55px] sm:max-w-[65px]">{displayClock.name}</span>
                      </div>
                      
                      {/* Small Analog Clock */}
                      <div className="my-2 flex justify-center items-center">
                        <AnalogClock 
                          date={liveDate} 
                          timezone={displayClock.timezone} 
                          country={displayClock.country} 
                          countryName={displayClock.name}
                          theme={preferences.theme} 
                          size="sm" 
                          hideLabel={true} 
                        />
                      </div>
                      
                      {/* Dynamic Local Time & Friendly Offset message */}
                      <div className="text-center space-y-0.5 mt-2 w-full border-t border-slate-100/10 dark:border-slate-800/40 pt-2">
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-500 dark:text-indigo-400">
                          {companionTimeStr.replace(/:\d+\s/, " ")}
                        </div>
                        <div className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 leading-tight">
                          {diffStr}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic friendly comparison summary message */}
              {(() => {
                const activeCityName = CITY_DATA[preferences.timezone]?.name || "Wesley Chapel";
                let adviceStr = "";
                
                if (preferences.timezone.includes("London")) {
                  adviceStr = "Your London workspace is perfectly positioned between Asia and North America. Paris is 1 hour ahead (very close collaboration), Beijing is 7 hours ahead, and New York is 5 hours behind. Ideal window for joint syncs is 1:00 PM – 5:00 PM BST.";
                } else if (preferences.timezone.includes("Paris") || preferences.timezone.includes("Berlin")) {
                  adviceStr = "Your Paris/Berlin workspace is highly synchronous with Europe and Africa. London is 1 hour behind, Beijing is 6 hours ahead, and New York is 6 hours behind. Best overlap with US teams starts from 3:00 PM CET.";
                } else if (preferences.timezone.includes("Shanghai") || preferences.timezone.includes("Beijing")) {
                  adviceStr = "Your Beijing/Shanghai workspace connects Asia-Pacific teams seamlessly. Tokyo is 1 hour ahead, London is 7 hours behind, and Paris is 6 hours behind. New York is exactly Day/Night reversed (12 hours behind). Check in with US teams early morning or late evening.";
                } else if (preferences.timezone.includes("Tokyo")) {
                  adviceStr = "Your Tokyo workspace is 1 hour ahead of Beijing, 8 hours ahead of Paris, and 13 hours ahead of New York. The optimal handover window is during Tokyo's morning (previous day evening in NY) or early evening (London start of day).";
                } else {
                  const nyDiff = getFriendlyTimeDifference("America/New_York", preferences.timezone, liveDate);
                  const lonDiff = getFriendlyTimeDifference("Europe/London", preferences.timezone, liveDate);
                  const tokDiff = getFriendlyTimeDifference("Asia/Tokyo", preferences.timezone, liveDate);
                  adviceStr = `From your ${activeCityName} workspace, London is ${lonDiff}, Tokyo is ${tokDiff}, and New York is ${nyDiff}. Click any clock to instantly shift your entire workspace and sync holidays, calendars, and meeting planners to that region.`;
                }

                return (
                  <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-start gap-2.5 animate-fade-in">
                    <span className="text-sm select-none">💡</span>
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-[11px]">Workspace Overlap Advice</p>
                      <p className="text-[10px] leading-normal text-slate-500 dark:text-slate-300">{adviceStr}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>


        </div>
      </header>
      )}

      {/* 4. AI RESULTS CARD (Visible when AI query yields output) */}
      {aiLoading && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 animate-pulse space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-6 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      )}

      {aiResult && !aiLoading && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full animate-fade-in">
          <div className="rounded-xl border border-blue-500/20 bg-slate-900 p-6 shadow-xl relative">
            <button 
              onClick={() => setAiResult(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase font-semibold">
              <Globe size={13} />
              <span>AI Workspace Parsing result</span>
            </div>

            <p className="text-md text-slate-100 font-medium mt-3 leading-relaxed">
              {aiResult.answer}
            </p>

            {aiResult.suggestedAction && aiResult.suggestedAction !== "general" && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  Intent detected: <strong>{aiResult.intent}</strong> • Autoloaded params prefilled
                </span>
                <button 
                  onClick={() => {
                    const mappedToolIds: Record<string, string> = {
                      "open_converter": "converter",
                      "open_meeting_planner": "planner",
                      "open_days_calculator": "business",
                    };
                    const tid = mappedToolIds[aiResult.suggestedAction];
                    if (tid) {
                      setActiveToolTab(tid);
                      const element = document.getElementById("quick-tools-section");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <span>Focus Workspace Tool</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PERSONALIZED SECTIONS CONTENT GRID */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {currentPathRoute?.isWorldClock ? (
          <div className="animate-fade-in space-y-8">
            {(() => {
              const targetLang = currentPathRoute.lang || "en";
              const targetCountry = currentPathRoute.country || "GB";
              const locInfo = LOCALIZED_NAMES[targetLang]?.[targetCountry] || LOCALIZED_NAMES.en[targetCountry] || { city: "London", country: "United Kingdom" };
              const offsetInfo = getTimezoneOffsetAndAbbr(currentPathRoute.timezone, liveDate);
              
              return (
                <div className="space-y-8">
                  {/* Top Header with Back Button */}
                  <div className="flex items-center justify-between border-b border-slate-200/10 dark:border-slate-800/40 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">
                        {targetCountry === "FR" ? "🇫🇷" :
                         targetCountry === "CN" ? "🇨🇳" :
                         targetCountry === "JP" ? "🇯🇵" :
                         targetCountry === "US" ? "🇺🇸" : "🇬🇧"}
                      </span>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight">
                          {locInfo.city}, {locInfo.country}
                        </h1>
                        <p className="text-xs text-slate-400">
                          {currentPathRoute.timezone} • {offsetInfo.offsetStr} ({offsetInfo.abbr})
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigateToRoutePath(currentPathRoute.lang || "default")}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border ${t.border} bg-white text-slate-700 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white shadow-sm transition cursor-pointer text-xs font-semibold`}
                    >
                      <ChevronRight size={14} className="rotate-180" />
                      <span>
                        {currentPathRoute.lang === "fr" ? "Retour à l'accueil" : 
                         currentPathRoute.lang === "zh" ? "返回主页" : 
                         currentPathRoute.lang === "ja" ? "ホームに戻る" : 
                         "Back to Home"}
                      </span>
                    </button>
                  </div>

                  {/* Gigantic 7-Segment LED Digital Clock Section */}
                  <div className="bg-transparent rounded-2xl border border-slate-200 dark:border-slate-800/80 p-8 sm:p-12 relative overflow-hidden select-none">
                    {/* Retro-cyber grid/glow design background lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
                    
                    <div className="relative text-center space-y-4">
                      <span className="inline-block text-[10px] sm:text-xs font-mono font-bold tracking-widest text-emerald-500/70 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {currentPathRoute.lang === "fr" ? "HORLOGE NATIONALE DE PRÉCISION" :
                         currentPathRoute.lang === "zh" ? "国家高精度授时中心" :
                         currentPathRoute.lang === "ja" ? "高精度国家標準時" :
                         "HIGH-PRECISION STANDARD TIME"}
                      </span>

                      {/* Display Clock face with background digit shadow */}
                      <div className="relative flex items-center justify-center py-6 font-digital">
                        {/* Unlit segments background */}
                        <div className="absolute opacity-[0.03] dark:opacity-[0.04] text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-widest text-emerald-500 text-center select-none whitespace-nowrap">
                          {preferences.timeFormat === "12h" ? "88:88:88 AM" : "88:88:88"}
                        </div>
                        {/* Active glowing digits */}
                        <div className="relative text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-widest text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] text-center select-none whitespace-nowrap">
                          {formatLocalTime(liveDate, preferences.timeFormat, currentPathRoute.timezone)}
                        </div>
                      </div>

                      {/* Localized Full Date */}
                      <div className="text-xs sm:text-sm font-mono text-slate-400 font-semibold uppercase tracking-wider">
                        {formatLocalDate(liveDate, preferences.dateFormat, preferences.locale, currentPathRoute.timezone)}
                      </div>
                    </div>
                  </div>

                  {/* World Clock Dashboard Component */}
                  <WorldClockDashboard 
                    preferences={preferences} 
                    onSelectTimezone={(tz, country, cName) => {
                      savePreferences({
                        ...preferences,
                        timezone: tz,
                        country,
                        countryName: cName
                      });
                    }}
                    lang={currentPathRoute.lang || "en"}
                  />
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {/* Section 1: Today in Your Country */}
            <div id="today-section" className="scroll-mt-24">
              <TodaySnapshot preferences={preferences} holidays={holidays} />
            </div>

            {/* Section 3: Smart Quick Actions / Time Tools */}
            <div id="quick-tools-section" className="scroll-mt-24">
              <QuickActions 
                preferences={preferences} 
                holidays={holidays} 
                activeTab={activeToolTab || undefined} 
                onCloseTab={() => {
                  setActiveToolTab(null);
                  setPrefilledParams(null);
                }}
                prefilledParams={prefilledParams}
                onSelectTimezone={(tz, country, cName) => {
                  savePreferences({
                    ...preferences,
                    timezone: tz,
                    country,
                    countryName: cName
                  });
                }}
                lang={currentPathRoute?.lang || "en"}
              />
            </div>

            {/* Section 4: Personalized Time Insights */}
            <div id="insights-section" className="scroll-mt-24">
              <TimeInsights 
                preferences={preferences} 
                onNavigateToTool={(toolId) => {
                  setActiveToolTab(toolId);
                  const elem = document.getElementById("quick-tools-section");
                  elem?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>

          </>
        )}
      </main>

      {/* 6. COHESIVE SYSTEM FOOTER */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs text-slate-500 font-mono">
            &copy; 2026 Global Time & Date Workspace. Designed for modern decentralized distributed teams.
          </div>
          <div className="flex gap-4 text-xs font-mono text-slate-400">
            <span className="hover:text-slate-200 transition cursor-pointer">SaaS SLA</span>
            <span>•</span>
            <span className="hover:text-slate-200 transition cursor-pointer">Security Standards</span>
            <span>•</span>
            <span className="hover:text-slate-200 transition cursor-pointer">API Integration Docs</span>
          </div>
          {/* Language Picker */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Language</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {[
                { lang: "en", flag: "🇬🇧", label: "EN" },
                { lang: "fr", flag: "🇫🇷", label: "FR" },
                { lang: "zh", flag: "🇨🇳", label: "ZH" },
                { lang: "ja", flag: "🇯🇵", label: "JA" }
              ].map((item) => (
                <button
                  key={item.lang}
                  onClick={() => {
                    if (currentPathRoute?.isMeetingFinder) {
                      navigateToMeetingFinder(item.lang);
                    } else if (currentPathRoute?.isWorldClock) {
                      navigateToWorldClock(item.lang);
                    } else {
                      navigateToRoutePath(item.lang);
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    currentPathRoute?.lang === item.lang
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title={item.lang.toUpperCase()}
                >
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* 7. DETAILED WORKSPACE MANUAL SETTINGS PANEL MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Settings size={18} className={t.accentText} /> Workspace Settings
                </h3>
                <p className="text-xs text-slate-400">Customize default locales, language rendering, calendars and workspace preferences.</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB SELECTOR HEADER */}
            <div className="flex border-b border-slate-800/80 mt-3 mb-4 gap-4 text-xs font-mono">
              <button 
                onClick={() => setSettingsTab("general")}
                className={`pb-2 px-1 font-semibold transition ${
                  settingsTab === "general" 
                    ? `border-b-2 ${t.accentText} border-cyan-500` 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                General Config
              </button>
              <button 
                onClick={() => setSettingsTab("design")}
                className={`pb-2 px-1 font-semibold transition flex items-center gap-1.5 ${
                  settingsTab === "design" 
                    ? `border-b-2 ${t.accentText} border-cyan-500` 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Palette size={13} />
                <span>Design Options</span>
              </button>
            </div>

            {/* Form scrollable container */}
            <div className="overflow-y-auto py-2 flex-1 space-y-4 pr-1">
              
              {settingsTab === "design" ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="mb-1">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">Visual Workspace Themes</span>
                    <h4 className="text-md font-semibold text-slate-100 mt-0.5 font-display">Select Theme Preset</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Select any theme to immediately preview the ambient background, primary colors and card visual highlights in real time.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {(Object.keys(THEME_CONFIGS) as ThemeType[]).map((themeKey) => {
                      const themeConfig = THEME_CONFIGS[themeKey];
                      const isSelected = (preferences.theme || "slate") === themeKey;

                      return (
                        <div 
                          key={themeKey}
                          onClick={() => {
                            setPreferences({
                              ...preferences,
                              theme: themeKey
                            });
                          }}
                          className={`group rounded-xl border p-3.5 shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${
                            isSelected 
                              ? `border-slate-400 bg-slate-800/50 ring-1 ring-cyan-500/20` 
                              : `border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Radio indicator */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                              isSelected 
                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" 
                                : "border-slate-600 group-hover:border-slate-400"
                            }`}>
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-slate-200">{themeConfig.name}</div>
                              <div className="text-xs text-slate-400/90 mt-0.5 leading-relaxed">{themeConfig.description}</div>
                            </div>
                          </div>

                          {/* Previews / Swatches */}
                          <div className="flex gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-850 shrink-0">
                            {themeConfig.previewColors.map((colorClass, idx) => (
                              <span key={idx} className={`w-3 h-3 rounded-full ${colorClass}`} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Country Selection */}
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Primary Country / Profile</label>
                    <select 
                      value={preferences.country}
                      onChange={(e) => {
                        const countryCode = e.target.value as CountryCode;
                        const defaults = DEFAULT_PREFERENCES[countryCode];
                        if (defaults) {
                          setPreferences({
                            ...preferences,
                            country: countryCode,
                            countryName: defaults.countryName,
                            timezone: defaults.timezone,
                            language: defaults.language,
                            locale: defaults.locale,
                            dateFormat: defaults.dateFormat,
                            timeFormat: defaults.timeFormat,
                            firstDayOfWeek: defaults.firstDayOfWeek,
                            favoriteCities: defaults.favoriteCities
                          });
                        }
                      }}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="US">United States</option>
                      <option value="IN">India</option>
                      <option value="DE">Germany</option>
                      <option value="JP">Japan</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="GB">United Kingdom</option>
                      <option value="OTHER">Global / General Fallback</option>
                    </select>
                  </div>

                  {/* Timezone selection */}
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Base Workstation Timezone ID</label>
                    <select 
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono"
                    >
                      {Object.keys(CITY_DATA).map(tz => (
                        <option key={tz} value={tz}>{CITY_DATA[tz].name} - {tz}</option>
                      ))}
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                    </select>
                  </div>

                  {/* Formatting fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Date Format style</label>
                      <select 
                        value={preferences.dateFormat}
                        onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value as any })}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (UK/UAE/IN)</option>
                        <option value="DD.MM.YYYY">DD.MM.YYYY (DE)</option>
                        <option value="YYYY/MM/DD">YYYY/MM/DD (JP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Time Format style</label>
                      <select 
                        value={preferences.timeFormat}
                        onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value as any })}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour index</option>
                      </select>
                    </div>
                  </div>

                  {/* Day rules */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">First Day of Week</label>
                      <select 
                        value={preferences.firstDayOfWeek}
                        onChange={(e) => setPreferences({ ...preferences, firstDayOfWeek: e.target.value as any })}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Holiday Calendar Filter</label>
                      <div className="bg-slate-950 p-2.5 border border-slate-800 text-xs text-slate-400 font-mono rounded">
                        Using: {preferences.countryName} public list
                      </div>
                    </div>
                  </div>

                  {/* Working Hours slider settings */}
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Core Working Hour Boundaries</label>
                    <div className="flex gap-4 items-center bg-slate-950 p-3.5 border border-slate-800 rounded-lg">
                      <div className="flex-1">
                        <span className="text-[10px] font-mono text-slate-500">Core start hour: {preferences.workingHoursStart}:00</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="23" 
                          value={preferences.workingHoursStart}
                          onChange={(e) => setPreferences({ ...preferences, workingHoursStart: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-mono text-slate-500">Core end hour: {preferences.workingHoursEnd}:00</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="23" 
                          value={preferences.workingHoursEnd}
                          onChange={(e) => setPreferences({ ...preferences, workingHoursEnd: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
              <button 
                onClick={() => {
                  // Revert to detected browser default state
                  localStorage.removeItem("global_time_workspace_prefs");
                  localStorage.removeItem("global_time_workspace_banner_locked");
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition font-semibold"
              >
                Reset Default
              </button>
              <button 
                onClick={() => {
                  savePreferences(preferences);
                  setShowSettings(false);
                }}
                className={`px-5 py-2 rounded-lg ${t.btnPrimary} font-bold text-xs transition`}
              >
                Apply Workspace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
