import React, { useState, useEffect } from "react";
import { 
  Monitor, 
  MoreVertical, 
  Search, 
  SlidersHorizontal, 
  Settings, 
  Check, 
  Clock, 
  ArrowRightLeft, 
  Globe, 
  RotateCcw,
  Compass,
  Star,
  MapPin,
  Sparkles
} from "lucide-react";
import { CountryPreferences, CountryCode } from "../types";
import { getTheme } from "../utils/theme";
import { getTimezoneOffsetAndAbbr, formatLocalTime } from "../data/countries";
import AnalogClock from "./AnalogClock";

interface WorldClockDashboardProps {
  preferences: CountryPreferences;
  onSelectTimezone: (timezone: string, country: CountryCode, countryName: string) => void;
  lang?: string;
  isWorldClockPage?: boolean;
}

interface WorldClockCity {
  id: string;
  name: string;
  fullName: string; // for card display
  country: string;
  countryCode: CountryCode;
  timezone: string;
  code: string;
  isMostPopular: boolean;
  isPopular: boolean;
  isCapital: boolean;
}

// 21 Cities exactly matching and extending the screenshot's list
const WORLD_CITIES: WorldClockCity[] = [
  { id: "new_york", name: "New York", fullName: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", code: "NYC", isMostPopular: true, isPopular: true, isCapital: false },
  { id: "chicago", name: "Chicago", fullName: "Chicago, Illinois", country: "United States", countryCode: "US", timezone: "America/Chicago", code: "CHI", isMostPopular: false, isPopular: true, isCapital: false },
  { id: "denver", name: "Denver", fullName: "Denver, Colorado", country: "United States", countryCode: "US", timezone: "America/Denver", code: "DEN", isMostPopular: false, isPopular: true, isCapital: false },
  { id: "los_angeles", name: "Los Angeles", fullName: "Los Angeles, California", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", code: "LAX", isMostPopular: true, isPopular: true, isCapital: false },
  { id: "phoenix", name: "Phoenix", fullName: "Phoenix, Arizona", country: "United States", countryCode: "US", timezone: "America/Phoenix", code: "PHX", isMostPopular: false, isPopular: true, isCapital: false },
  { id: "anchorage", name: "Anchorage", fullName: "Anchorage, Alaska", country: "United States", countryCode: "US", timezone: "America/Anchorage", code: "ANC", isMostPopular: false, isPopular: true, isCapital: false },
  { id: "honolulu", name: "Honolulu", fullName: "Honolulu, Hawaii", country: "United States", countryCode: "US", timezone: "America/Adak", code: "HNL", isMostPopular: false, isPopular: true, isCapital: false }, // Using America/Adak or Pacific/Honolulu
  { id: "toronto", name: "Toronto", fullName: "Toronto, Canada", country: "Canada", countryCode: "US", timezone: "America/Toronto", code: "YYZ", isMostPopular: true, isPopular: true, isCapital: false },
  { id: "london", name: "London", fullName: "London, United Kingdom", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", code: "LON", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "sydney", name: "Sydney", fullName: "Sydney, Australia", country: "Australia", countryCode: "OTHER", timezone: "Australia/Sydney", code: "SYD", isMostPopular: true, isPopular: true, isCapital: false },
  { id: "manila", name: "Manila", fullName: "Manila, Philippines", country: "Philippines", countryCode: "OTHER", timezone: "Asia/Manila", code: "MNL", isMostPopular: false, isPopular: true, isCapital: true },
  { id: "singapore", name: "Singapore", fullName: "Singapore, Singapore", country: "Singapore", countryCode: "OTHER", timezone: "Asia/Singapore", code: "SIN", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "paris", name: "Paris", fullName: "Paris, France", country: "France", countryCode: "FR", timezone: "Europe/Paris", code: "CDG", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "berlin", name: "Berlin", fullName: "Berlin, Germany", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", code: "BER", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "tokyo", name: "Tokyo", fullName: "Tokyo, Japan", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", code: "NRT", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "beijing", name: "Beijing", fullName: "Beijing, China", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", code: "PEK", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "new_delhi", name: "New Delhi", fullName: "New Delhi, India", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", code: "DEL", isMostPopular: true, isPopular: true, isCapital: true },
  { id: "dubai", name: "Dubai", fullName: "Dubai, United Arab Emirates", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", code: "DXB", isMostPopular: true, isPopular: true, isCapital: false },
  { id: "riyadh", name: "Riyadh", fullName: "Riyadh, Saudi Arabia", country: "Saudi Arabia", countryCode: "AE", timezone: "Asia/Riyadh", code: "RUH", isMostPopular: false, isPopular: true, isCapital: true },
  { id: "cairo", name: "Cairo", fullName: "Cairo, Egypt", country: "Egypt", countryCode: "OTHER", timezone: "Africa/Cairo", code: "CAI", isMostPopular: false, isPopular: true, isCapital: true },
  { id: "rome", name: "Rome", fullName: "Rome, Italy", country: "Italy", countryCode: "DE", timezone: "Europe/Rome", code: "FCO", isMostPopular: false, isPopular: true, isCapital: true }
];

// Localization Dictionary
const WC_TRANSLATIONS: Record<string, any> = {
  en: {
    worldClockTitle: "World Clock Command Center",
    worldClockSubtitle: "Atomically synchronized digital cards with customizable display views, state sorting, and interactive teleport action.",
    personalClocks: "Personalized Chronometers (5 Custom Analog Slots)",
    customizeSlot: "Customize Slot",
    slotTitle: "Slot {n}",
    searchPlaceholder: "Search global cities, regions, countries...",
    filterLabel: "Filter by status:",
    sortLabel: "Sort by:",
    mostPopular: "Most Popular",
    popular: "Popular",
    capitals: "Capitals",
    all: "All Cities",
    sortByCountry: "Country (A-Z)",
    sortByCity: "City (A-Z)",
    sortByTime: "Time (Offset)",
    teleportTitle: "Teleport Workspace",
    teleportDesc: "Configure this city as your main Command Center",
    currentLocation: "Active Location",
    closeMenu: "Close Options",
    saveSuccess: "Saved selections successfully",
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    selectCity: "Select a city for this slot",
    noResults: "No cities found matching your search query."
  },
  fr: {
    worldClockTitle: "Centre de Commande Horloge Mondiale",
    worldClockSubtitle: "Cartes numériques synchronisées avec affichages personnalisables, tri dynamique et action de téléportation interactive.",
    personalClocks: "Chronomètres Personnalisés (5 Fentes Analogiques)",
    customizeSlot: "Personnaliser la fente",
    slotTitle: "Fente {n}",
    searchPlaceholder: "Rechercher des villes, régions, pays...",
    filterLabel: "Filtrer par statut :",
    sortLabel: "Trier par :",
    mostPopular: "Les plus populaires",
    popular: "Populaires",
    capitals: "Capitales",
    all: "Toutes les villes",
    sortByCountry: "Pays (A-Z)",
    sortByCity: "Ville (A-Z)",
    sortByTime: "Heure (Décalage)",
    teleportTitle: "Téléporter l'espace",
    teleportDesc: "Définir cette ville comme votre Centre de Commande principal",
    currentLocation: "Emplacement Actif",
    closeMenu: "Fermer les options",
    saveSuccess: "Sélections enregistrées avec succès",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    yesterday: "Hier",
    selectCity: "Sélectionnez une ville",
    noResults: "Aucune ville trouvée pour votre recherche."
  },
  zh: {
    worldClockTitle: "全球时区精密时钟中心",
    worldClockSubtitle: "毫米级原子钟同步卡片视图，包含高可玩度智能过滤、时差状态排序、以及极速空间传送指令。",
    personalClocks: "私人订制模拟时钟（5个自主专属盘面）",
    customizeSlot: "自定义此插槽",
    slotTitle: "插槽 {n}",
    searchPlaceholder: "搜索全球城市、区域、国家名...",
    filterLabel: "多维度分类过滤：",
    sortLabel: "高阶排序：",
    mostPopular: "最热门推荐",
    popular: "热门商旅城市",
    capitals: "各国法定首都",
    all: "全部录入城市",
    sortByCountry: "按国家排序 (A-Z)",
    sortByCity: "按城市排序 (A-Z)",
    sortByTime: "按本地时间 (时差)",
    teleportTitle: "传送至此空间",
    teleportDesc: "将此城市一键设为当前主指挥中心",
    currentLocation: "当前主空间",
    closeMenu: "收起选项",
    saveSuccess: "自定义插槽保存成功",
    today: "今天",
    tomorrow: "明天",
    yesterday: "昨天",
    selectCity: "为此插槽挑选一个城市",
    noResults: "未找到匹配的城市。"
  },
  ja: {
    worldClockTitle: "世界時間コマンドセンター",
    worldClockSubtitle: "ミリ秒級で同期されたデジタルタイムカード。多機能フィルター、タイムソート、ワークスペース移動（テレポート）機能を完備。",
    personalClocks: "パーソナライズされたアナログ時計（5つのカスタムスロット）",
    customizeSlot: "スロットを編集",
    slotTitle: "スロット {n}",
    searchPlaceholder: "都市、地域、国を検索...",
    filterLabel: "表示フィルター :",
    sortLabel: "並び替え :",
    mostPopular: "主要都市",
    popular: "人気都市",
    capitals: "首都",
    all: "すべての都市",
    sortByCountry: "国名順 (A-Z)",
    sortByCity: "都市名順 (A-Z)",
    sortByTime: "現在時刻順 (時差)",
    teleportTitle: "ここへテレポート",
    teleportDesc: "この都市を現在のメインワークスペースに設定します",
    currentLocation: "アクティブな場所",
    closeMenu: "オプションを閉じる",
    saveSuccess: "スロットを保存しました",
    today: "本日",
    tomorrow: "明日",
    yesterday: "昨日",
    selectCity: "このスロットの都市を選択",
    noResults: "該当する都市が見つかりません。"
  }
};

export default function WorldClockDashboard({ preferences, onSelectTimezone, lang = "en", isWorldClockPage = false }: WorldClockDashboardProps) {
  const th = getTheme(preferences.theme || "slate");
  const loc = WC_TRANSLATIONS[lang] || WC_TRANSLATIONS.en;

  // Real-time date ticking state
  const [liveDate, setLiveDate] = useState(new Date());

  // Slot customizer states (Persisted to localStorage)
  const [customSlots, setCustomSlots] = useState<string[]>(() => {
    const saved = localStorage.getItem("world_clock_custom_slots");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      } catch (e) {}
    }
    // Fallback standard default slots
    return [
      "Europe/London",
      "America/New_York",
      "Asia/Kolkata",
      "Asia/Tokyo",
      "Europe/Paris"
    ];
  });

  const [activeCustomizeSlot, setActiveCustomizeSlot] = useState<number | null>(null);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "mostPopular" | "popular" | "capitals">("all");
  const [sortBy, setSortBy] = useState<"country" | "city" | "time">("city");

  // Options Menu State for each card
  const [activeMenuCard, setActiveMenuCard] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle saving customized slots
  const handleSelectSlotCity = (slotIndex: number, timezone: string) => {
    const updated = [...customSlots];
    updated[slotIndex] = timezone;
    setCustomSlots(updated);
    localStorage.setItem("world_clock_custom_slots", JSON.stringify(updated));
    setActiveCustomizeSlot(null);
  };

  // Teleport action to set the chosen card as active Command Center
  const handleTeleport = (city: WorldClockCity) => {
    onSelectTimezone(city.timezone, city.countryCode, city.country);
    setActiveMenuCard(null);
  };

  // Function to get offset and day difference compared to user's active timezone
  const getRelativeTimeInfo = (targetTz: string) => {
    try {
      const date = liveDate;
      const baseFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: preferences.timezone,
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric", hour12: false
      });
      const targetFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: targetTz,
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric", hour12: false
      });

      const baseParts = baseFormatter.formatToParts(date);
      const targetParts = targetFormatter.formatToParts(date);

      const baseMap: Record<string, string> = {};
      const targetMap: Record<string, string> = {};

      baseParts.forEach(p => baseMap[p.type] = p.value);
      targetParts.forEach(p => targetMap[p.type] = p.value);

      // Create proper date objects from timezone local outputs
      const baseLocal = new Date(
        parseInt(baseMap.year), parseInt(baseMap.month) - 1, parseInt(baseMap.day),
        parseInt(baseMap.hour), parseInt(baseMap.minute), parseInt(baseMap.second)
      );

      const targetLocal = new Date(
        parseInt(targetMap.year), parseInt(targetMap.month) - 1, parseInt(targetMap.day),
        parseInt(targetMap.hour), parseInt(targetMap.minute), parseInt(targetMap.second)
      );

      // Difference in hours
      const diffMs = targetLocal.getTime() - baseLocal.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      // Day label
      let dayLabel = loc.today;
      const baseDay = baseLocal.getDate();
      const targetDay = targetLocal.getDate();

      // Simple calculation for day shift
      if (diffHours >= 12 && targetDay !== baseDay) {
        dayLabel = loc.tomorrow;
      } else if (diffHours <= -12 && targetDay !== baseDay) {
        dayLabel = loc.yesterday;
      } else if (targetDay > baseDay) {
        dayLabel = loc.tomorrow;
      } else if (targetDay < baseDay) {
        dayLabel = loc.yesterday;
      }

      const sign = diffHours >= 0 ? "+" : "";
      return `${dayLabel}, ${sign}${diffHours} H`;
    } catch (e) {
      return `${loc.today}, +0 H`;
    }
  };

  // Filter and Sort city list
  const filteredCities = WORLD_CITIES.filter(city => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      city.fullName.toLowerCase().includes(query) ||
      city.country.toLowerCase().includes(query) ||
      city.code.toLowerCase().includes(query);

    // 2. Category Filter
    if (!matchesSearch) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "mostPopular") return city.isMostPopular;
    if (activeFilter === "popular") return city.isPopular;
    if (activeFilter === "capitals") return city.isCapital;

    return true;
  });

  // Sort cities
  const sortedCities = [...filteredCities].sort((a, b) => {
    if (sortBy === "country") {
      return a.country.localeCompare(b.country);
    }
    if (sortBy === "city") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "time") {
      // Sort by absolute timezone offset
      try {
        const d = new Date();
        const formatterA = new Intl.DateTimeFormat("en-US", { timeZone: a.timezone, timeZoneName: "longOffset" });
        const formatterB = new Intl.DateTimeFormat("en-US", { timeZone: b.timezone, timeZoneName: "longOffset" });
        const offsetA = formatterA.formatToParts(d).find(p => p.type === "timeZoneName")?.value || "";
        const offsetB = formatterB.formatToParts(d).find(p => p.type === "timeZoneName")?.value || "";
        return offsetA.localeCompare(offsetB);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });

  return (
    <div className={`space-y-12 animate-fade-in ${isWorldClockPage ? "text-slate-800 dark:text-slate-200" : "text-slate-100"}`}>
      
      {/* SECTION HEADER */}
      {!isWorldClockPage && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/40 pb-6">
          <div>
            <span className={`text-xs font-mono ${th.accentText} font-semibold uppercase tracking-wider flex items-center gap-1.5`}>
              <Sparkles size={13} className="animate-pulse" />
              {loc.worldClockTitle}
            </span>
            <h2 className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-white mt-1">
              Command Center Dashboard
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {loc.worldClockSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* 5 PERSONALIZED ANALOG CLOCKS */}
      {!isWorldClockPage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock size={14} className={th.accentText} />
              {loc.personalClocks}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {customSlots.map((tz, index) => {
            const foundCity = WORLD_CITIES.find(c => c.timezone === tz) || {
              name: tz.split("/")[1]?.replace("_", " ") || tz,
              country: "Global",
              code: "UTC",
              timezone: tz
            };
            const isCustomizing = activeCustomizeSlot === index;

            return (
              <div 
                key={index} 
                className={`relative flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800/40 bg-transparent shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-all group`}
              >
                {/* Customizer trigger overlay button */}
                <button 
                  onClick={() => setActiveCustomizeSlot(isCustomizing ? null : index)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100 z-10"
                  title={loc.customizeSlot}
                >
                  <Settings size={13} />
                </button>

                <div className="text-[10px] font-mono text-slate-500 mb-1">
                  {loc.slotTitle.replace("{n}", (index + 1).toString())}
                </div>

                {isCustomizing ? (
                  <div className="w-full py-2 space-y-2">
                    <select 
                      onChange={(e) => handleSelectSlotCity(index, e.target.value)}
                      defaultValue={tz}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-md p-1.5 outline-none text-slate-200"
                    >
                      <option value="" disabled>{loc.selectCity}</option>
                      {WORLD_CITIES.map(c => (
                        <option key={c.id} value={c.timezone}>{c.fullName} ({c.code})</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setActiveCustomizeSlot(null)}
                      className="w-full text-[10px] font-mono py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-24 h-24 mb-3 flex items-center justify-center">
                      <AnalogClock 
                        date={liveDate} 
                        timezone={tz} 
                        theme={preferences.theme} 
                        size="sm" 
                        hideLabel={true} 
                      />
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-100 truncate max-w-[120px]">
                        {foundCity.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono tracking-wide mt-0.5">
                        {foundCity.code} • {getRelativeTimeInfo(tz).split(",")[1]?.trim() || "0 H"}
                      </div>
                      <div className="mt-1.5 py-1 px-2.5 bg-transparent rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-digital text-center relative overflow-hidden select-none">
                        <span className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] text-[10px] font-bold tracking-wider text-emerald-500">
                          {preferences.timeFormat === "12h" ? "88:88:88 AM" : "88:88:88"}
                        </span>
                        <span className="relative text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">
                          {formatLocalTime(liveDate, preferences.timeFormat, tz)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="bg-transparent border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 md:p-6 space-y-4">
        
        {/* Controls Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Filters (All, Most Popular, Capitals) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <SlidersHorizontal size={13} className={th.accentText} />
              {loc.filterLabel}
            </span>
            {[
              { id: "all", label: loc.all },
              { id: "mostPopular", label: loc.mostPopular },
              { id: "popular", label: loc.popular },
              { id: "capitals", label: loc.capitals }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeFilter === f.id
                    ? `${th.btnPrimary} shadow-md scale-[1.02]`
                    : "bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort By Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mr-2">
              {loc.sortLabel}
            </span>
            {[
              { id: "city", label: loc.sortByCity },
              { id: "country", label: loc.sortByCountry },
              { id: "time", label: loc.sortByTime }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  sortBy === s.id
                    ? "bg-sky-500/10 border border-sky-400/30 text-sky-500 dark:text-sky-400 font-semibold"
                    : "bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Field */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder={loc.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border border-slate-200 dark:border-slate-800 focus:border-sky-500/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* GRID VIEW OF WORLD CLOCK CARDS (Matching Screenshot style) */}
      <div className="space-y-4">
        {sortedCities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedCities.map((city) => {
              const isActiveWorkspace = preferences.timezone === city.timezone;
              const isMenuOpen = activeMenuCard === city.id;

              return (
                <div 
                  key={city.id}
                  className={`relative rounded-xl p-5 flex flex-col justify-between transition-all group ${
                    isWorldClockPage
                      ? "border-none bg-transparent"
                      : isActiveWorkspace
                        ? "border border-sky-500/40 bg-transparent"
                        : "border border-slate-200 dark:border-slate-800/40 bg-transparent hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                  }`}
                >
                  
                  {/* Card Header */}
                  <div className={`flex items-center justify-between pb-3 mb-4 ${isWorldClockPage ? "" : "border-b border-slate-100 dark:border-slate-800/40"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isWorldClockPage ? "text-sm text-slate-800 dark:text-slate-100" : "text-xs text-slate-700 dark:text-slate-200"}`}>
                        {city.fullName}
                      </span>
                      {isActiveWorkspace && !isWorldClockPage && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    {!isWorldClockPage && (
                      <div className="flex items-center gap-1">
                        {/* Desktop icon */}
                        <div className="p-1 text-slate-400 dark:text-slate-600 rounded">
                          <Monitor size={14} />
                        </div>
                        
                        {/* More button */}
                        <button 
                          onClick={() => setActiveMenuCard(isMenuOpen ? null : city.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
                          title="Options"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Dropdown Option Overlays */}
                  {!isWorldClockPage && isMenuOpen && (
                    <div className="absolute top-12 right-4 w-52 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl p-2 z-20 animate-fade-in">
                      <div className="px-2.5 py-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold mb-1 border-b border-slate-900">
                        Workspace Actions
                      </div>
                      <button 
                        onClick={() => handleTeleport(city)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-sky-500/10 hover:text-sky-400 transition"
                      >
                        <ArrowRightLeft size={13} />
                        <div>
                          <div className="font-semibold">{loc.teleportTitle}</div>
                          <div className="text-[9px] text-slate-500">{loc.teleportDesc}</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveMenuCard(null)}
                        className="w-full text-center text-[10px] font-mono text-slate-500 hover:text-slate-300 py-1.5 mt-1 border-t border-slate-900"
                      >
                        {loc.closeMenu}
                      </button>
                    </div>
                  )}

                  {/* Large 7-Segment Digital Clock Face */}
                  {isWorldClockPage ? (
                    (() => {
                      const formattedTime = formatLocalTime(liveDate, preferences.timeFormat, city.timezone);
                      const ampmMatch = formattedTime.match(/^(.*?)\s*(AM|PM)$/i);
                      let digits = formattedTime;
                      let ampm = "";
                      if (ampmMatch) {
                        digits = ampmMatch[1];
                        ampm = ampmMatch[2].toLowerCase();
                      }
                      return (
                        <div className="py-2 flex flex-col font-digital select-none">
                          <div className="flex items-baseline">
                            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                              {digits}
                            </span>
                            {ampm && (
                              <span className="text-xs sm:text-sm ml-1 text-slate-500 font-digital font-medium lowercase">
                                {ampm}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-sans mt-1.5 tracking-normal font-medium">
                            {getRelativeTimeInfo(city.timezone)}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-4 px-4 my-3 bg-transparent rounded-xl border border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden font-digital select-none">
                      {/* Unlit background segments mask */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest text-emerald-500 text-center">
                        {preferences.timeFormat === "12h" ? "88:88:88 AM" : "88:88:88"}
                      </div>
                      {/* Active glowing digits */}
                      <div className="relative text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest text-emerald-600 dark:text-emerald-400 text-center drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        {formatLocalTime(liveDate, preferences.timeFormat, city.timezone)}
                      </div>
                    </div>
                  )}

                  {/* Offset & Day Shift Indicator */}
                  {!isWorldClockPage && (
                    <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{city.code} ({getTimezoneOffsetAndAbbr(city.timezone, liveDate).abbr})</span>
                      <span className="font-semibold dark:text-slate-300">{getRelativeTimeInfo(city.timezone)}</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/20 border border-slate-800/50 rounded-2xl">
            <Globe className="mx-auto text-slate-600 mb-3" size={32} />
            <p className="text-slate-400 font-mono text-xs">{loc.noResults}</p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
              className={`mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg ${th.btnPrimary}`}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
