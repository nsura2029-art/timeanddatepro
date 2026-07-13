import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  Search,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  Menu,
  ArrowRightLeft,
  Users,
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
import { CountryCode, CountryPreferences, Holiday } from "./types";
import {
  DEFAULT_PREFERENCES,
  COUNTRY_HOLIDAYS,
  CITY_DATA,
  detectCountryFromTimezone
} from "./data/countries";
import { getTheme } from "./utils/theme";
import { TRANSLATIONS } from "./utils/translations";
import { useClickOutside } from "./utils/useClickOutside";
import HolidayHoursCalculator from "./components/tools/HolidayHoursCalculator";
import MeetingFinder from "./components/MeetingFinder";
import UnixTimestampConverter from "./components/tools/UnixTimestampConverter";
import CountdownTimer from "./components/tools/CountdownTimer";
import ISO8601Formatter from "./components/tools/ISO8601Formatter";
import DateAddSubtract from "./components/tools/DateAddSubtract";
import DateDifference from "./components/tools/DateDifference";
import DateToWords from "./components/tools/DateToWords";
import DateToWordForYear from "./components/tools/dateToWordsProgrammatic/DateToWordForYear";
import DateToWordForDate from "./components/tools/dateToWordsProgrammatic/DateToWordForDate";
import TimeZoneConverter from "./components/tools/TimeZoneConverter";
import TwelveMonthCalendar from "./components/tools/TwelveMonthCalendar";
import SunriseSunset from "./components/tools/SunriseSunset";
import DaylightSaving from "./components/tools/DaylightSaving";
import Stopwatch from "./components/tools/Stopwatch";
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
import { TimezoneMapPage } from "./pages/timezonemap/TimezoneMapPage";
import { PrivacyPolicy } from "./pages/legal/PrivacyPolicy";
import { TermsOfService } from "./pages/legal/TermsOfService";
import { AboutPage } from "./pages/about/AboutPage";
import { FeedbackPage } from "./pages/feedback/FeedbackPage";
import { FeedbackPrompt } from "./components/feedback/FeedbackPrompt";
import { CookieConsent } from "./components/common/CookieConsent";
import { useHomeData } from "./hooks/useHomeData";

import "./pages/legal/PrivacyPolicy.css";
import "./pages/about/AboutPage.css";
import "./pages/feedback/FeedbackPage.css";
import "./components/feedback/FeedbackPrompt.css";
import "./components/common/CookieConsent.css";

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
  // The /en landing route was removed in polish-5 (project is
  // English-only for MVP — /en used to force GB/London regardless of
  // actual home). The content-suffix override heuristic it guarded
  // (path.includes('tokyo')→JA, 'london'→EN, etc.) is also gone.
  // Sub-routes like /en/<tool> still detect via parseToolPath above
  // and run early. Nothing further to warn about here.
  // Check for /<lang>/<tool> sub-routes first
  const toolRoute = parseToolPath(path);
  if (toolRoute) {
    // Check for programmatic Date to Words sub-paths:
    //   /<lang>/date-words/<year>          → year page
    //   /<lang>/date-words/<YYYY-MM-DD>    → specific date page
    if (toolRoute.tool === "date-words") {
      const stripped = path.replace(/^\/+/, "").replace(/\/+$/, "");
      const parts = stripped.split("/");
      if (parts.length >= 3) {
        const seg = parts[2];
        // Year: 1-9999 (1-4 digits, 1-9999)
        if (/^\d{1,4}$/.test(seg)) {
          const yearNum = parseInt(seg, 10);
          if (yearNum >= 1 && yearNum <= 9999) {
            return {
              lang: toolRoute.lang,
              city: toolRoute.lang === "en" ? "london" : toolRoute.lang === "fr" ? "paris" : toolRoute.lang === "zh" ? "beijing" : "tokyo",
              country: toolRoute.lang === "en" ? "GB" : toolRoute.lang === "fr" ? "FR" : toolRoute.lang === "zh" ? "CN" : "JP",
              timezone: toolRoute.lang === "en" ? "Europe/London" : toolRoute.lang === "fr" ? "Europe/Paris" : toolRoute.lang === "zh" ? "Asia/Shanghai" : "Asia/Tokyo",
              tool: toolRoute.tool,
              dateWordsYear: yearNum,
            };
          }
        }
        // Specific date: YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(seg)) {
          return {
            lang: toolRoute.lang,
            city: toolRoute.lang === "en" ? "london" : toolRoute.lang === "fr" ? "paris" : toolRoute.lang === "zh" ? "beijing" : "tokyo",
            country: toolRoute.lang === "en" ? "GB" : toolRoute.lang === "fr" ? "FR" : toolRoute.lang === "zh" ? "CN" : "JP",
            timezone: toolRoute.lang === "en" ? "Europe/London" : toolRoute.lang === "fr" ? "Europe/Paris" : toolRoute.lang === "zh" ? "Asia/Shanghai" : "Asia/Tokyo",
            tool: toolRoute.tool,
            dateWordsDate: seg,
          };
        }
      }
    }
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
  if (path === "/meeting-finder" || path.endsWith("/meeting-finder")) {
    let lang = "en";
    const m = path.match(/^\/([a-z]{2})\/meeting-finder$/);
    if (m) lang = m[1];
    return { lang, city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isMeetingFinder: true };
  }
  // ---- English landing route REMOVED in polish-5. ----
  // The project is English-only for MVP, and `/en` always forced
  // GB/London regardless of the user's actual home country. Visiting
  // `/en` now falls through to the root landing page (which respects
  // the browser timezone / saved prefs). Sub-routes like `/en/<tool>`
  // and `/en/worldcup` still work via the parseToolPath / explicit
  // worldcup detectors above — those return early with the correct
  // lang segment. (Intentionally no `return { lang: "en", ... }`.)
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
  // /timezone-map and /<lang>/timezone-map dedicated pages
  if (path === "/timezone-map" || path.endsWith("/timezone-map")) {
    let lang = "en";
    const m = path.match(/^\/([a-z]{2})\/timezone-map$/);
    if (m) lang = m[1];
    return { lang, city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isTimezoneMap: true };
  }
  // /privacy + /<lang>/privacy — dedicated Privacy Policy page.
  // Generic English-only MVP: same page for every lang segment.
  if (path === "/privacy" || path.endsWith("/privacy")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isPrivacy: true };
  }
  // /terms + /<lang>/terms — dedicated Terms of Service page.
  if (path === "/terms" || path.endsWith("/terms")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isTerms: true };
  }
  // /about + /<lang>/about — dedicated About page.
  if (path === "/about" || path.endsWith("/about")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isAbout: true };
  }
  // /feedback + /<lang>/feedback — feedback and tool suggestion page.
  if (path === "/feedback" || path.endsWith("/feedback")) {
    return { lang: "en", city: "london", country: "GB" as CountryCode, timezone: "Europe/London", tool: undefined, isFeedback: true };
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

  // T4: home data for the landing (hero + 5 sections). Hooks must be
  // called unconditionally. The hook does an in-flight fetch guard
  // (cancelled ref) so StrictMode double-invocation is safe.
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

  // Ref-mirror of `preferences` so the `tdp:show-city` listener (which
  // is registered once in a []-dep effect) can read the LATEST prefs
  // without re-subscribing on every prefs change. Same pattern used
  // for the in-flight fetch guard in useHomeData.
  const preferencesRef = useRef<CountryPreferences>(preferences);
  preferencesRef.current = preferences;

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
    // Top Popular / similar surfaces dispatch `tdp:show-city` when the
    // user wants the hero to swap to a different timezone (instead of
    // toggling favorites). We update the home-timezone in prefs and
    // let the existing useHomeData hook re-fetch (the hero rerenders
    // because `timezone` is a prop). Scroll-to-top is handled by the
    // dispatching component.
    function handleShowCity(ev: Event) {
      const e = ev as CustomEvent<{
        code: string;
        name?: string;
        country?: string;
        countryCode?: string;
        timezone?: string;
      }>;
      const { timezone, country, countryCode } = e.detail || ({} as any);
      if (!timezone) return;
      const currentPrefs = preferencesRef.current;
      const validCountry: CountryCode =
        countryCode && DEFAULT_PREFERENCES[countryCode as CountryCode]
          ? (countryCode as CountryCode)
          : (country as CountryCode) || currentPrefs.country;
      const defaults = DEFAULT_PREFERENCES[validCountry] || DEFAULT_PREFERENCES.US;
      const next: CountryPreferences = {
        ...defaults,
        country: validCountry,
        countryName: (country as string) || defaults.countryName,
        // Adopt the clicked city's local timezone as the hero's home
        // timezone — this is the key change that the hero reacts to.
        timezone,
      };
      setPreferences(next);
      preferencesRef.current = next;
      try {
        localStorage.setItem("global_time_workspace_prefs", JSON.stringify(next));
      } catch { /* noop */ }
    }
    window.addEventListener("tdp:add-city", handleAddCity as EventListener);
    window.addEventListener("tdp:swap-city", handleSwapCity as EventListener);
    window.addEventListener("tdp:show-city", handleShowCity as EventListener);
    return () => {
      window.removeEventListener("tdp:add-city", handleAddCity as EventListener);
      window.removeEventListener("tdp:swap-city", handleSwapCity as EventListener);
      window.removeEventListener("tdp:show-city", handleShowCity as EventListener);
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
      // Polish-5: project is English-only for MVP. Don't push to /en
      // (the explicit /en route was removed because it always forced
      // GB/London). Stay at "/" so the browser-detected home timezone
      // wins.
      path = "/";
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

  // Meeting Finder — restored in polish-3 from commit 746354c.
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
  // Removed in landing-v2 cutover: the V2 LandingPage composes its own
  // sync line ("Your clock is X seconds behind") via the HeroClock
  // component, fed by the /api/v1/time/sync endpoint. V1's manual
  // ipapi.co fetch was a fallback that no longer has a consumer.

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

  // V1-only functions removed in landing-v2 cutover:
  //   - handleLaunchTool (V1 nav dropdown — V2 has no equivalent; V2 nav
  //     routes directly to /<lang>/<tool>)
  //   - handleTrendingSearchClick (V1 AI bar)
  //   - executeAIQuery + triggerOfflineFallback (V1 AI bar)
  //   - getGreeting (V1 hero "Good Night, New York" — V2 doesn't greet)
  //   - offsetData (V1 hero's "EDT - UTC Offset: -04:00" line; V2 hero
  //     formats its own offset via the LandingHeroHorizon pipeline)
  // Legacy V1 sections (TodaySnapshot + QuickActions) removed —
  // V2's hero OnThisDay + ExploreMore cover the same use cases.

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

  // ---- /timezone-map early return - dedicated page with own chrome ----
  if (currentPathRoute?.isTimezoneMap || browserPath.toLowerCase().endsWith("/timezone-map")) {
    return <TimezoneMapPage />;
  }

  // ---- /privacy /terms /about — legal & about pages, own chrome ----
  // These three are part of the MVP BLOCKER list (required by AdSense
  // program policies + GDPR). They share the .pp class for the legal
  // docs and the .ap class for About — each renders its own header.
  // polish-6: legal pages no longer early-return. They render INSIDE the
  // standard app shell (topnav + main + footer) so the chrome is
  // consistent with the rest of the app. The cloudconvert-style 2-column
  // layout (sticky TOC + content) is implemented inside the page
  // components themselves.

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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${currentPathRoute?.isTimezoneMap ? "bg-[#e8eaf6] text-[#3f51b5] font-bold shadow-sm" : `${t.text} hover:bg-slate-100/50`} flex items-center gap-1 cursor-pointer`}
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
                    onClick={() => { window.history.pushState(null, "", `/${currentPathRoute?.lang || "en"}/timezone-map`); window.dispatchEvent(new Event("tdp:navigate")); setShowToolsDropdown(false); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-cyan-50/60 transition-colors cursor-pointer`}
                  >
                    <Globe size={13} className="text-cyan-500" />
                    <div>
                      <div className="font-semibold">Timezone Map</div>
                      <div className="text-[10px] text-slate-400">Live world map · 6 bands · click any city</div>
                    </div>
                  </button>
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
                    onClick={() => navigateToMeetingFinder(currentPathRoute?.lang || "en")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs ${t.text} hover:bg-emerald-50/60 transition-colors cursor-pointer`}
                  >
                    <Users size={13} className="text-emerald-500" />
                    <div>
                      <div className="font-semibold">Meeting Finder</div>
                      <div className="text-[10px] text-slate-400">Best-overlap across time zones</div>
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
                  onClick={() => navigateToMeetingFinder(currentPathRoute?.lang || "en")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-50 text-xs text-left ${t.text}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Users size={13} className="text-emerald-500" />
                    Meeting Finder
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
      {!currentPathRoute?.isMeetingFinder && !currentPathRoute?.isTimezoneMap && !currentPathRoute?.isPrivacy && !currentPathRoute?.isTerms && !currentPathRoute?.isAbout && !currentPathRoute?.isFeedback && !currentPathRoute?.tool && !currentPathRoute?.pair && (
      <>
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
      </>
      )}

      {/* 5. PERSONALIZED SECTIONS CONTENT GRID */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Legal & About pages (polish-6) — cloudconvert-style 2-column
            layout (sticky TOC sidebar + content) rendered INSIDE the
            standard app shell so the topnav + footer are consistent. */}
        {currentPathRoute?.isPrivacy && <PrivacyPolicy />}
        {currentPathRoute?.isTerms && <TermsOfService />}
        {currentPathRoute?.isAbout && <AboutPage />}
        {currentPathRoute?.isFeedback && <FeedbackPage />}

        {(currentPathRoute?.tool || currentPathRoute?.pair) ? (
          <div className="animate-fade-in">
            {currentPathRoute.tool === "holidays" && <HolidayHoursCalculator lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "working-hours" && <HolidayHoursCalculator lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "unix" && <UnixTimestampConverter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "countdown" && <CountdownTimer lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "iso8601" && <ISO8601Formatter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-math" && <DateAddSubtract lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-diff" && <DateDifference lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-words" && currentPathRoute?.dateWordsYear && <DateToWordForYear year={currentPathRoute.dateWordsYear} lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-words" && currentPathRoute?.dateWordsDate && <DateToWordForDate dateString={currentPathRoute.dateWordsDate} lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "date-words" && !currentPathRoute?.dateWordsYear && !currentPathRoute?.dateWordsDate && <DateToWords lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "time-zone-converter" && <TimeZoneConverter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.tool === "12-month-calendar" && <TwelveMonthCalendar />}
            {currentPathRoute.tool === "sunrise-sunset" && <SunriseSunset />}
            {currentPathRoute.tool === "daylight-saving" && <DaylightSaving />}
            {currentPathRoute.tool === "stopwatch" && <Stopwatch />}
            {currentPathRoute.tool === "currency-converter" && <CurrencyConverter lang={currentPathRoute?.lang || "en"} />}
            {currentPathRoute.pair && <PairConverter pair={currentPathRoute.pair} lang={currentPathRoute.pair.lang} />}
            {!currentPathRoute.pair && currentPathRoute?.tool && (
              <FeedbackPrompt
                tool={currentPathRoute.tool}
                toolLabel={
                  currentPathRoute.tool === "time-zone-converter" ? "Time Zone Converter"
                  : currentPathRoute.tool === "currency-converter" ? "Currency Converter"
                  : currentPathRoute.tool === "holidays" || currentPathRoute.tool === "working-hours" ? "Holiday Hours Calculator"
                  : currentPathRoute.tool === "unix" ? "Unix Timestamp Converter"
                  : currentPathRoute.tool === "iso8601" ? "ISO 8601 Formatter"
                  : currentPathRoute.tool === "date-math" ? "Business Days"
                  : currentPathRoute.tool === "date-diff" ? "Date Difference"
                  : currentPathRoute.tool === "date-words" ? "Date to Words"
                  : undefined
                }
              />
            )}
          </div>
        ) : currentPathRoute?.isMeetingFinder ? (
          <div className="animate-fade-in">
            <MeetingFinder lang={currentPathRoute?.lang || "en"} />
            <FeedbackPrompt tool="meeting-finder" toolLabel="Meeting Finder" />
          </div>
        ) : (
          <>
            {/* Both legacy V1 sections (TodaySnapshot + QuickActions)
                removed per user request. The V2 landing page above
                already provides the equivalent value: the OnThisDay
                pill in the hero for the today-feed, and ExploreMore
                for the tool navigation. */}
          </>
        )}
      </main>

      {/* 6. COHESIVE SYSTEM FOOTER */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs text-slate-500 font-mono">
            &copy; 2026 Global Time & Date Workspace. Designed for modern decentralized distributed teams.
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-slate-400 justify-center">
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
              onClick={() => { window.history.pushState(null, "", "/about"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              About
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { window.history.pushState(null, "", "/feedback"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              Feedback
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { window.history.pushState(null, "", "/privacy"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { window.history.pushState(null, "", "/terms"); window.dispatchEvent(new Event("tdp:navigate")); }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              Terms
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("tdp:open-cookie-settings"));
                }
              }}
              className="hover:text-slate-200 transition cursor-pointer"
            >
              Cookie settings
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

      {/* MVP-BLOCKER: Cookie consent banner. Mounted globally so it
          appears on every page; reads its own localStorage to decide
          whether to show. Also exposes the "tdp:open-cookie-settings"
          event for the footer link above. */}
      <CookieConsent />
    </div>
  );
}
