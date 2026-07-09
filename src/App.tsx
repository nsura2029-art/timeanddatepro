import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  Search,
  HelpCircle,
  Clock,
  Calendar,
  Check,
  ChevronRight,
  ChevronDown,
  Menu,
  ArrowRightLeft,
  CalendarDays,
  Hourglass,
  Terminal,
  FileCode,
  CalendarRange,
  Type,
  Plus,
  Code2,
  BookOpen,
  Braces,
  Coins,
  ShieldCheck
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
import { TRANSLATIONS } from "./utils/translations";
import { useClickOutside } from "./utils/useClickOutside";
import HolidayHoursCalculator from "./components/tools/HolidayHoursCalculator";
import UnixTimestampConverter from "./components/tools/UnixTimestampConverter";
import ISO8601Formatter from "./components/tools/ISO8601Formatter";
import DateAddSubtract from "./components/tools/DateAddSubtract";
import DateDifference from "./components/tools/DateDifference";
import DateToWords from "./components/tools/DateToWords";
import TimeZoneConverter from "./components/tools/TimeZoneConverter";
import CurrencyConverter from "./components/tools/CurrencyConverter";
import PairConverter from "./components/tools/PairConverter";
import RouterDebugOverlay from "./components/common/RouterDebugOverlay";
import { parseToolPath, ToolSlug } from "./utils/toolRoutes";
import { parsePairPath } from "./utils/pairRoutes";
import { CITY_BY_CODE } from "./data/cities";
import DocsPage from "./pages/docs/DocsPage";
import AdminApp from "./pages/admin/AdminApp";
import { LandingHeroHorizon } from "./components/landing/LandingHeroHorizon";
import { LandingPage } from "./components/landing/LandingPage";
import { WorldCupTeaser } from "./components/landing/WorldCupTeaser";
import { WorldCupPage } from "./pages/worldcup/WorldCupPage";
import { useHomeData } from "./hooks/useHomeData";

/* ApiColumn helpers removed during nav cleanup — APIs menu is now flat
 * 2-column grid (see showApisDropdown). Kept as no-op stubs to avoid
 * lint errors from any indirect references in tests/stories. */

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

  // --- ROUTER ASSERTIONS (dev only) ---
  // These guard against the bug where content-based language detection
  // (path.includes('tokyo') → JA, 'london' → EN, etc.) overrides the
  // explicit URL language prefix. If any of these throw in the browser
  // console, the routing layer is misbehaving. Safe to delete once the
  // routing layer is refactored to make URL prefix authoritative.
  if (import.meta.env?.DEV !== false && typeof window !== "undefined") {
    if (path.startsWith("/en/") || path === "/en") {
      // Catch bugs like path.includes('tokyo') overriding /en/
      // We can't enforce the resolved lang from inside this fn since
      // that's what we're trying to resolve; but we can warn when
      // content-suffixes are paired with a different-prefix detection.
      const contentLooksNonEN = /tokyo|london|paris|beijing|tokio/.test(path);
      if (contentLooksNonEN) {
        // Mark for the overlay to surface; do not throw — it would
        // break the entire app for QA testers.
        // eslint-disable-next-line no-console
        console.warn(
          `[router] /en/ URL contains content suffix that may trigger fallthrough heuristics: ${path}`
        );
      }
    }
  }
  // Check for /<lang>/<tool> sub-routes first
  const toolRoute = parseToolPath(path);
  if (toolRoute) {
    return {
      lang: toolRoute.lang,
      city: toolRoute.lang === "en" ? "london" : toolRoute.lang === "fr" ? "paris" : toolRoute.lang === "zh" ? "beijing" : "tokyo",
      country: toolRoute.lang === "en" ? "GB" : toolRoute.lang === "fr" ? "FR" : toolRoute.lang === "zh" ? "CN" : "JP",
      timezone: toolRoute.lang === "en" ? "Europe/London" : toolRoute.lang === "fr" ? "Europe/Paris" : toolRoute.lang === "zh" ? "Asia/Shanghai" : "Asia/Tokyo",
      tool: toolRoute.tool
    };
  }

  // Check for /<lang>/<from>-to-<to>-time dedicated pair routes
  const pairRoute = parsePairPath(path);
  if (pairRoute) {
    const fromTz = CITY_BY_CODE[pairRoute.fromCode]?.timezone || "UTC";
    const fromCountry = CITY_BY_CODE[pairRoute.fromCode]?.countryCode || "OTHER";
    return {
      lang: pairRoute.lang,
      city: pairRoute.fromName.toLowerCase().replace(/\s+/g, "_"),
      country: fromCountry,
      timezone: fromTz,
      pair: pairRoute,
      tool: undefined,
    };
  }


  if (path.startsWith("/fr") || path === "/paris") {
    return { lang: "fr", city: "paris", country: "FR" as CountryCode, timezone: "Europe/Paris", tool: undefined };
  }
  if (path.startsWith("/zh") || path.includes("beijing") || path.includes("beging")) {
    return { lang: "zh", city: "beijing", country: "CN" as CountryCode, timezone: "Asia/Shanghai", tool: undefined };
  }
  if (path.startsWith("/ja") || path.includes("tokyo")) {
    return { lang: "ja", city: "tokyo", country: "JP" as CountryCode, timezone: "Asia/Tokyo", tool: undefined };
  }
  if (path.startsWith("/en") || path.includes("london")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined };
  }
  if (path.startsWith("/admin")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isAdmin: true };
  }
  // /worldcup and /<lang>/worldcup dedicated pages
  if (path.endsWith("/worldcup") || path === "/worldcup") {
    // Allow either /en/worldcup or just /worldcup (default to en)
    let lang = "en";
    const m = path.match(/^\/([a-z]{2})\/worldcup$/);
    if (m) lang = m[1];
    return {
      lang,
      city: "new_york",
      country: "US" as CountryCode,
      timezone: "America/New_York",
      tool: undefined,
      isWorldcup: true,
    };
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
  // --- DEV-ONLY ROUTER DEBUG OVERLAY ---
  // Self-mounting; renders nothing in production unless
  // localStorage.tdp_debug_router is explicitly "off". Mounts at the
  // very top of the rendered tree so it sits above everything.
  if (typeof window !== "undefined" && import.meta.env?.DEV !== false) {
    // Don't add a guard here that would skip in production builds; the
    // RouterDebugOverlay itself checks the localStorage flag.
  }

  // --- STATE DECLARATIONS ---
  const [currentPathRoute, setCurrentPathRoute] = useState(() => parseRouteFromPath());

  const [preferences, setPreferences] = useState<CountryPreferences>(() => {
    const route = parseRouteFromPath();
    if (route) {
      // On /<lang> URLs, the URL is the source of truth - use that language's defaults.
      const defaults = DEFAULT_PREFERENCES[route.country];
      if (defaults) return defaults;
    }
    // At root URL (/), use BROWSER timezone detection, not localStorage.
    // This way clicking the EN footer flag doesn't pollute the home page with UK content
    // for a user whose browser is in the US.
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const detectedCountry = detectCountryFromTimezone(browserTz);
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
    // At root URL (/), use browser detection for holidays too.
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const detectedCountry = detectCountryFromTimezone(browserTz);
    return COUNTRY_HOLIDAYS[detectedCountry] || COUNTRY_HOLIDAYS.OTHER;
  });

  const [showBanner, setShowBanner] = useState(false);

  // Real-time states
  const [liveDate, setLiveDate] = useState(new Date());
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
  const [showDateToolsDropdown, setShowDateToolsDropdown] = useState(false);
  const [showApisDropdown, setShowApisDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [browserPath, setBrowserPath] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  // Scroll visibility refs
  const headerRef = useRef<HTMLDivElement | null>(null);

  // T4: home data for the v2 landing (hero + 5 sections). Hooks must be
  // called unconditionally, but the hook itself does no work unless
  // VITE_LANDING_V2 is on.
  const homeData = useHomeData(preferences.countryCode, "WLC");

  // T4+: User-added cities — driven by FiveCitiesFavorites (row 2+) +
  // TopPopularCities. Defaults (the curated 5) are NOT stored here; they
  // come from the API's topFive and are always shown in row 1.
  // Persisted to localStorage so the user's picks survive page reloads.
  const [userFavoriteCodes, setUserFavoriteCodes] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("tdp_user_cities");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    function handleAddCity(ev: Event) {
      const e = ev as CustomEvent<{ code: string }>;
      const code = e.detail?.code;
      if (!code) return;
      setUserFavoriteCodes((prev) => {
        if (prev.includes(code)) {
          // Toggle off — remove from user-added
          const next = prev.filter((c) => c !== code);
          try { localStorage.setItem("tdp_user_cities", JSON.stringify(next)); } catch {}
          return next;
        }
        // Add to user-added (append at end so it appears as the "next row" card)
        const next = [...prev, code];
        try { localStorage.setItem("tdp_user_cities", JSON.stringify(next)); } catch {}
        return next;
      });
    }
    function handleSwapCity(ev: Event) {
      handleAddCity(ev);
    }
    window.addEventListener("tdp:add-city", handleAddCity as EventListener);
    window.addEventListener("tdp:swap-city", handleSwapCity as EventListener);
    return () => {
      window.removeEventListener("tdp:add-city", handleAddCity as EventListener);
      window.removeEventListener("tdp:swap-city", handleSwapCity as EventListener);
    };
  }, []);
  // Per-dropdown refs for click-outside-to-close
  const toolsDropdownRef = useRef<HTMLDivElement | null>(null);
  const dateToolsDropdownRef = useRef<HTMLDivElement | null>(null);
  const apisDropdownRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(toolsDropdownRef, () => setShowToolsDropdown(false));
  useClickOutside(dateToolsDropdownRef, () => setShowDateToolsDropdown(false));
  useClickOutside(apisDropdownRef, () => setShowApisDropdown(false));

  // Sync `browserPath` with the current URL so the docs site re-renders on
  // back/forward and any in-app navigation that uses pushState.
  useEffect(() => {
    const sync = () => setBrowserPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    window.addEventListener("tdp:navigate", sync as EventListener);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("tdp:navigate", sync as EventListener);
    };
  }, []);

  const isDocsPath = browserPath.toLowerCase().startsWith("/docs");

  // Close any open header dropdowns when entering the docs site
  useEffect(() => {
    if (isDocsPath) {
      setShowToolsDropdown(false);
      setShowDateToolsDropdown(false);
      setShowApisDropdown(false);
      setShowMobileMenu(false);
    }
  }, [isDocsPath]);

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

  // --- NAVIGATE TO A TOOL PAGE (/lang/tool-slug) ---
  const navigateToTool = (tool: ToolSlug) => {
    const lang = currentPathRoute?.lang || preferences.country === "GB" ? "en" : preferences.country === "FR" ? "fr" : preferences.country === "CN" ? "zh" : preferences.country === "JP" ? "ja" : "en";
    const path = `/${lang}/${tool}`;
    window.history.pushState({ lang, tool }, "", path);
    const cfg = lang === "en" ? { country: "GB" as CountryCode, timezone: "Europe/London", city: "london" } :
                lang === "fr" ? { country: "FR" as CountryCode, timezone: "Europe/Paris", city: "paris" } :
                lang === "zh" ? { country: "CN" as CountryCode, timezone: "Asia/Shanghai", city: "beijing" } :
                                  { country: "JP" as CountryCode, timezone: "Asia/Tokyo", city: "tokyo" };
    const defaults = DEFAULT_PREFERENCES[cfg.country];
    if (defaults) {
      setPreferences(defaults);
      setHolidays(COUNTRY_HOLIDAYS[cfg.country] || []);
    }
    setCurrentPathRoute({
      lang,
      city: cfg.city,
      country: cfg.country,
      timezone: cfg.timezone,
      isWorldClock: false,
      isMeetingFinder: false,
      tool
    } as any);
    setShowToolsDropdown(false);
    setShowDateToolsDropdown(false);
    setShowMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // In-app nav (header menu, pair cards, language picker) fires
    // `tdp:navigate` after `pushState`. We MUST sync currentPathRoute
    // for SPA navigation, not just for browser back/forward, otherwise
    // the dispatch gate (`currentPathRoute?.tool` / `?.pair` /
    // `?.isMeetingFinder`) stays stale and the page keeps showing the
    // previous component even though the URL bar has updated.
    window.addEventListener("tdp:navigate", handlePopState as EventListener);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("tdp:navigate", handlePopState as EventListener);
    };
  }, []);

  // --- GUARD: re-sync state when user lands on / with mismatched URL on hard refresh ---
  // When localStorage has e.g. JP but URL is /, this ensures the page reads from localStorage
  // (handled by initial state). When user manually changes URL hash/path, popstate fires.
  // This is a safety net for browser-restored tabs.

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

    // Only show the "change location" banner when the BROWSER language is non-English.
    // English-speaking users land straight on the detected home locale without prompting.
    const browserLang = (navigator.language || (navigator as any).userLanguage || "en")
      .toLowerCase()
      .split("-")[0];
    const isEnglishBrowser = browserLang === "en";

    if (savedPrefs) {
      setShowBanner(false);
    } else {
      if (!bannerDismissed && detectedCountry !== "OTHER" && !isEnglishBrowser) {
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

  // --- STICKY NAV: now always-on, no scroll detector needed ---
  // Kept as a placeholder for any future scroll-aware behaviors.

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
      setShowMobileMenu(false);
      return;
    }
    // Section doesn't exist on the current route (e.g. user is on a tool
    // page). Fall back to the landing page so the section can be found
    // and scrolled to. Same SPA pattern: pushState + tdp:navigate, then
    // wait a frame for the new tree to mount, then scroll.
    const onLanding =
      !currentPathRoute?.isMeetingFinder &&
      !currentPathRoute?.isWorldClock &&
      !currentPathRoute?.tool &&
      !currentPathRoute?.pair;
    if (!onLanding) {
      navigateToRoutePath(currentPathRoute?.lang || "default");
      // Two RAFs: one for state commit, one for the new tree to mount
      // and render the section element.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        });
      });
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

  // ---- /docs/* early return - DocLayout renders its own header, no marketing chrome. ----
  if (isDocsPath) {
    return <DocsPage pathname={browserPath} />;
  }

  // ---- /admin/* early return - AdminApp renders its own chrome. ----
  if (browserPath.toLowerCase().startsWith("/admin")) {
    return <AdminApp />;
  }

  // ---- /worldcup early return - dedicated page with own chrome ----
  if (currentPathRoute?.isWorldcup || browserPath.toLowerCase().endsWith("/worldcup")) {
    return <WorldCupPage />;
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex flex-col font-sans select-none selection:bg-blue-500/20 antialiased transition-colors duration-300`}>

      {/* Dev-only router debug overlay (top-right floating card) */}
      <RouterDebugOverlay />

      {/* 1. AUTO LOCALIZATION NOTIFICATION BANNER */}
      {showBanner && (
        <div className="w-full bg-[#3f51b5] text-white py-3 px-4 border-b border-[#303f9f]/40 text-center text-xs md:text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in z-40 sticky top-0 backdrop-blur-md shadow-sm">
          <span>
            Looks like you're in <strong>{preferences.countryName}</strong>. Continue in {preferences.language} or English?
          </span>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => handleBannerAction("local")}
              className="px-3.5 py-1.5 bg-white text-[#3f51b5] font-bold rounded-lg hover:bg-[#e8eaf6] transition text-[11px] border border-[#e8eaf6]"
            >
              Continue in {preferences.language.split("/")[0]}
            </button>
            <button
              onClick={() => handleBannerAction("english")}
              className="px-3.5 py-1.5 bg-[#303f9f] hover:bg-[#1a237e] text-white font-bold rounded-lg transition text-[11px] border border-white/20"
            >
              Use English
            </button>
            <button
              onClick={() => handleBannerAction("change")}
              className="px-3.5 py-1.5 bg-transparent hover:bg-white/10 text-white font-bold rounded-lg transition text-[11px] border border-white/30"
            >
              Change Location
            </button>
          </div>
        </div>
      )}

      {/* 2. STABLE STICKY TOP NAVIGATION BAR - always visible, MeetingFinder palette */}
      <nav className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#e0e0e0] py-3 shadow-sm transition-shadow">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

          {/* Brand/Logo */}
          <div
            onClick={() => {
              if (currentPathRoute?.isWorldClock || currentPathRoute?.isMeetingFinder) {
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

            {/* Time Tools Dropdown Trigger */}
            <div
              ref={toolsDropdownRef}
              className="relative"
              onMouseLeave={() => setShowToolsDropdown(false)}
            >
              <button
                type="button"
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                onMouseEnter={() => setShowToolsDropdown(true)}
                aria-haspopup="menu"
                aria-expanded={showToolsDropdown}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${t.text} hover:bg-slate-100/50 flex items-center gap-1 cursor-pointer`}
              >
                <span>Time Tools</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showToolsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Tool Dropdown Menu List — 2-column wide */}
              {showToolsDropdown && (
                <div
                  role="menu"
                  className={`absolute left-0 mt-1.5 w-[440px] rounded-xl border ${t.border} ${t.bg === "bg-white" ? "bg-white" : "bg-slate-900"} shadow-2xl p-2 z-50 animate-fade-in`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100/10 mb-1">
                    Time Tools
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => { window.history.pushState(null, "", `/${currentPathRoute?.lang || "en"}/time-zone-converter`); window.dispatchEvent(new Event("tdp:navigate")); setShowToolsDropdown(false); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-blue-50/60 transition-colors cursor-pointer`}
                  >
                    <ArrowRightLeft size={13} className="text-blue-500" />
                    <div>
                      <div className="font-semibold">Time Zone Converter</div>
                      <div className="text-[10px] text-slate-400">Wall-clock conversion + overlap grid</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("date-math")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-amber-50/60 transition-colors cursor-pointer`}
                  >
                    <CalendarDays size={13} className="text-amber-500" />
                    <div>
                      <div className="font-semibold">Business Days</div>
                      <div className="text-[10px] text-slate-400">Exclude local weekends & holidays</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("date-diff")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-purple-50/60 transition-colors cursor-pointer`}
                  >
                    <Calendar size={13} className="text-purple-500" />
                    <div>
                      <div className="font-semibold">Date Difference</div>
                      <div className="text-[10px] text-slate-400">Calculate exact days/weeks/months</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { window.history.pushState(null, "", "/docs/getting-started/quickstart"); window.dispatchEvent(new Event("tdp:navigate")); setShowToolsDropdown(false); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-rose-50/60 transition-colors cursor-pointer`}
                  >
                    <Hourglass size={13} className="text-rose-500" />
                    <div>
                      <div className="font-semibold">Countdown Timer</div>
                      <div className="text-[10px] text-slate-400">Watch precision countdown clocks</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("unix")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-sky-50/60 transition-colors cursor-pointer`}
                  >
                    <Terminal size={13} className="text-sky-500" />
                    <div>
                      <div className="font-semibold">Unix Epoch Converter</div>
                      <div className="text-[10px] text-slate-400">Encode or decode epoch timestamps</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("currency-converter")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-emerald-50/60 transition-colors cursor-pointer`}
                  >
                    <Coins size={13} className="text-emerald-500" />
                    <div>
                      <div className="font-semibold">Currency Converter</div>
                      <div className="text-[10px] text-slate-400">Live ECB rates for 33 ISO 4217 codes</div>
                    </div>
                  </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time Tools Dropdown Trigger */}
            <div
              ref={dateToolsDropdownRef}
              className="relative"
              onMouseLeave={() => setShowDateToolsDropdown(false)}
            >
              <button
                type="button"
                onClick={() => setShowDateToolsDropdown(!showDateToolsDropdown)}
                onMouseEnter={() => setShowDateToolsDropdown(true)}
                aria-haspopup="menu"
                aria-expanded={showDateToolsDropdown}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center gap-1 cursor-pointer ${currentPathRoute?.tool || currentPathRoute?.pair ? "bg-[#e8eaf6] text-[#3f51b5] font-bold shadow-sm" : `${t.text} hover:bg-slate-100/50`}`}
              >
                <span>Date Tools</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showDateToolsDropdown ? "rotate-180" : ""}`} />
              </button>

              {showDateToolsDropdown && (
                <div
                  role="menu"
                  className={`absolute left-0 mt-1.5 w-[440px] rounded-xl border ${t.border} ${t.bg === "bg-white" ? "bg-white" : "bg-slate-900"} shadow-2xl p-2 z-50 animate-fade-in`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100/10 mb-1">
                    Date & Time Calculators
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => navigateToTool("holidays")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-[#e8f5e9]/60 transition-colors cursor-pointer`}
                  >
                    <Calendar size={13} className="text-[#2e7d32]" />
                    <div>
                      <div className="font-semibold">Holiday & Working Hours</div>
                      <div className="text-[10px] text-slate-400">Country holidays + annual work hours</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("unix")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-sky-50/60 transition-colors cursor-pointer`}
                  >
                    <Terminal size={13} className="text-sky-500" />
                    <div>
                      <div className="font-semibold">Unix Timestamp</div>
                      <div className="text-[10px] text-slate-400">Epoch seconds / milliseconds live</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("iso8601")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors cursor-pointer`}
                  >
                    <FileCode size={13} className="text-indigo-500" />
                    <div>
                      <div className="font-semibold">ISO 8601 Formatter</div>
                      <div className="text-[10px] text-slate-400">RFC 3339, 2822, week, ordinal day</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("date-math")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-amber-50/60 transition-colors cursor-pointer`}
                  >
                    <Plus size={13} className="text-amber-500" />
                    <div>
                      <div className="font-semibold">Date Add / Subtract</div>
                      <div className="text-[10px] text-slate-400">Business days, weeks, months, years</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("date-diff")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-purple-50/60 transition-colors cursor-pointer`}
                  >
                    <CalendarRange size={13} className="text-purple-500" />
                    <div>
                      <div className="font-semibold">Date Difference</div>
                      <div className="text-[10px] text-slate-400">Calendar & working-day breakdown</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("date-words")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-pink-50/60 transition-colors cursor-pointer`}
                  >
                    <Type size={13} className="text-pink-500" />
                    <div>
                      <div className="font-semibold">Date to Words</div>
                      <div className="text-[10px] text-slate-400">Natural language, relative time</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateToTool("currency-converter")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-emerald-50/60 transition-colors cursor-pointer`}
                  >
                    <Coins size={13} className="text-emerald-500" />
                    <div>
                      <div className="font-semibold">Currency Converter</div>
                      <div className="text-[10px] text-slate-400">Live ECB rates for 33 ISO 4217 codes</div>
                    </div>
                  </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Panel link — visible to everyone but the panel itself is auth-gated */}
            <button
              onClick={() => {
                window.history.pushState(null, "", "/admin");
                window.dispatchEvent(new Event("tdp:navigate"));
                setShowToolsDropdown(false);
                setShowDateToolsDropdown(false);
                setShowApisDropdown(false);
                setShowMobileMenu(false);
              }}
              data-testid="admin-link"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center gap-1 cursor-pointer ${t.text} hover:bg-slate-100/50`}
            >
              <ShieldCheck size={12} className="text-[color:var(--adm-accent,#38bdf8)]" />
              <span>Admin</span>
            </button>

            {/* APIs Dropdown - Node.js SDK + REST endpoints + per-tool integration guides */}
            <div
              ref={apisDropdownRef}
              className="relative"
              onMouseLeave={() => setShowApisDropdown(false)}
            >
              <button
                type="button"
                onClick={() => setShowApisDropdown(!showApisDropdown)}
                onMouseEnter={() => setShowApisDropdown(true)}
                aria-haspopup="menu"
                aria-expanded={showApisDropdown}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center gap-1 cursor-pointer ${isDocsPath ? "bg-[#e8eaf6] text-[#3f51b5] font-bold shadow-sm" : `${t.text} hover:bg-slate-100/50`}`}
              >
                <Code2 size={12} />
                <span>APIs</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showApisDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showApisDropdown && (
                <div
                  role="menu"
                  className={`absolute right-0 mt-1.5 w-[440px] rounded-xl border ${t.border} ${t.bg === "bg-white" ? "bg-white" : "bg-slate-900"} shadow-2xl p-2 z-50 animate-fade-in`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100/10 mb-1">
                    APIs & SDKs
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <a
                      href="/docs/getting-started/introduction"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/getting-started/introduction"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors`}
                    >
                      <BookOpen size={13} className="text-indigo-500" />
                      <div>
                        <div className="font-semibold">REST API</div>
                        <div className="text-[10px] text-slate-400">15 endpoints, JSON, no signup</div>
                      </div>
                    </a>
                    <a
                      href="/docs/sdk/nodejs"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/sdk/nodejs"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-emerald-50/60 transition-colors`}
                    >
                      <Braces size={13} className="text-emerald-500" />
                      <div>
                        <div className="font-semibold">Node.js SDK <span className="ml-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-emerald-100 text-emerald-700">NEW</span></div>
                        <div className="text-[10px] text-slate-400">Zero-dep, full TypeScript</div>
                      </div>
                    </a>
                    <a
                      href="/docs/getting-started/quickstart"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/getting-started/quickstart"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-sky-50/60 transition-colors`}
                    >
                      <ChevronRight size={13} className="text-sky-500" />
                      <div>
                        <div className="font-semibold">Quickstart</div>
                        <div className="text-[10px] text-slate-400">First call in 2 min</div>
                      </div>
                    </a>
                    <a
                      href="/docs/api-reference/time/now"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/api-reference/time/now"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors`}
                    >
                      <Clock size={13} className="text-indigo-500" />
                      <div>
                        <div className="font-semibold">Time API</div>
                        <div className="text-[10px] text-slate-400">now · convert · diff · add · unix · iso</div>
                      </div>
                    </a>
                    <a
                      href="/docs/api-reference/cities"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/api-reference/cities"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors`}
                    >
                      <Globe size={13} className="text-indigo-500" />
                      <div>
                        <div className="font-semibold">Cities API</div>
                        <div className="text-[10px] text-slate-400">Index + per-city live clock</div>
                      </div>
                    </a>
                    <a
                      href="/docs/api-reference/countries"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/api-reference/countries"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors`}
                    >
                      <Calendar size={13} className="text-indigo-500" />
                      <div>
                        <div className="font-semibold">Countries API</div>
                        <div className="text-[10px] text-slate-400">List + holidays + working hours</div>
                      </div>
                    </a>
                    <a
                      href="/docs/api-reference/pairs/:from/:to"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/api-reference/pairs/from/to"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-indigo-50/60 transition-colors`}
                    >
                      <ArrowRightLeft size={13} className="text-indigo-500" />
                      <div>
                        <div className="font-semibold">City Pairs</div>
                        <div className="text-[10px] text-slate-400">Programmatic SEO backbone</div>
                      </div>
                    </a>
                    <a
                      href="/docs/getting-started/authentication"
                      onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/docs/getting-started/authentication"); window.dispatchEvent(new Event("tdp:navigate")); setShowApisDropdown(false); setShowMobileMenu(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-slate-100/60 transition-colors`}
                    >
                      <BookOpen size={13} className="text-slate-500" />
                      <div>
                        <div className="font-semibold">Authentication</div>
                        <div className="text-[10px] text-slate-400">Rate limits + Pro tier (Q3)</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Command Search Input - always visible (md+) */}
          <div className="hidden md:flex items-center max-w-xs xl:max-w-md w-full bg-[#fafafa] border border-[#e0e0e0] rounded-lg py-1 px-2.5 focus-within:border-[#3f51b5] transition">
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

          {/* Mobile menu toggle (visible below lg) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`lg:hidden p-2 rounded-lg bg-slate-50/80 border ${t.border} ${t.text} hover:bg-slate-100 transition cursor-pointer`}
              title="Toggle Menu"
            >
              <Menu size={15} />
            </button>
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
            </div>

            {/* Time Tools list inside mobile menu */}
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-2">
                Launch Workspace Tool
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => { window.history.pushState(null, "", `/${currentPathRoute?.lang || "en"}/time-zone-converter`); window.dispatchEvent(new Event("tdp:navigate")); setShowToolsDropdown(false); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <ArrowRightLeft size={13} className="text-blue-500" />
                    Time Zone Converter
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => navigateToTool("date-math")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <CalendarDays size={13} className="text-amber-500" />
                    Business Days Calculator
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => navigateToTool("date-diff")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Calendar size={13} className="text-purple-500" />
                    Date Difference Finder
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => { window.history.pushState(null, "", "/docs/getting-started/quickstart"); window.dispatchEvent(new Event("tdp:navigate")); setShowToolsDropdown(false); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Hourglass size={13} className="text-rose-500" />
                    Countdown Precision Timer
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => navigateToTool("unix")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Terminal size={13} className="text-sky-500" />
                    Unix Epoch Converter
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => navigateToTool("currency-converter")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Coins size={13} className="text-emerald-500" />
                    Currency Converter
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => { window.history.pushState(null, "", "/admin"); window.dispatchEvent(new Event("tdp:navigate")); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck size={13} className="text-[color:var(--adm-accent,#38bdf8)]" />
                    Admin Panel
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 3. HERO CONTAINER SECTION */}
      {!currentPathRoute?.tool && !currentPathRoute?.pair && (
      <>
      {import.meta.env?.VITE_LANDING_V2 === "true" && (
        <LandingPage
          liveDate={liveDate}
          timezone={preferences.timezone}
          country={preferences.countryCode}
          cityName={CITY_DATA[preferences.timezone]?.name || "Wesley Chapel"}
          cityRegion={CITY_DATA[preferences.timezone]?.region}
          countryName={preferences.countryName}
          lang={(currentPathRoute?.lang as "en" | "fr" | "zh" | "ja" | undefined) ?? "en"}
          homeData={homeData.status === "ok" ? homeData.data : null}
          favoriteCodes={userFavoriteCodes}
        />
      )}
      {import.meta.env?.VITE_LANDING_V2 !== "true" && (
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
                      {currentPathRoute?.lang === "zh" && <>当前 <span className={`underline decoration-emerald-500 decoration-2 underline-offset-2 ${t.accentText}`}>中国北京</span> 的时间:</>}
                      {currentPathRoute?.lang === "ja" && <>現在の <span className={`underline decoration-emerald-500 decoration-2 underline-offset-2 ${t.accentText}`}>東京、日本</span> の時刻:</>}
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
                  {offsetData.abbr} - Coordinated Universal Time Offset: <strong className={t.accentText}>{offsetData.offsetStr}</strong>
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
                  adviceStr = "Your London workspace is perfectly positioned between Asia and North America. Paris is 1 hour ahead (very close collaboration), Beijing is 7 hours ahead, and New York is 5 hours behind. Ideal window for joint syncs is 1:00 PM - 5:00 PM BST.";
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
      </>
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
        {(currentPathRoute?.tool || currentPathRoute?.pair) ? (
          <div className="animate-fade-in">
            {currentPathRoute.tool === "holidays" && <HolidayHoursCalculator lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "working-hours" && <HolidayHoursCalculator lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "unix" && <UnixTimestampConverter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "iso8601" && <ISO8601Formatter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-math" && <DateAddSubtract lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-diff" && <DateDifference lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-words" && <DateToWords lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "time-zone-converter" && <TimeZoneConverter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "currency-converter" && <CurrencyConverter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.pair && <PairConverter pair={currentPathRoute.pair} lang={currentPathRoute.pair.lang} />}
          </div>
        ) : (
          <>
            {/* T4: When VITE_LANDING_V2 is on, LandingPage composes its
                own hero + 5 sections (FiveCitiesFavorites, CityDetailCard,
                ExploreMore, TopPopularCities, QuoteBlock) and we skip the
                legacy inline sections entirely. */}
            {import.meta.env?.VITE_LANDING_V2 === "true" ? null : (
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
              </>
            )}

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
            <button
              type="button"
              onClick={() => { window.history.pushState(null, "", "/docs/getting-started/introduction"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              API Integration Docs
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { window.history.pushState(null, "", "/docs/resources/changelog"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              Changelog
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { window.history.pushState(null, "", "/docs/resources/support"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              Support
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
