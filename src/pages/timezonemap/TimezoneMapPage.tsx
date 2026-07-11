// src/pages/timezonemap/TimezoneMapPage.tsx
// Live Global Time Zone Map — full-width interactive world map with
// 6 timezone bands + clickable city dots + search-with-highlight +
// side-by-side comparison + CTA into the existing TimeZoneConverter tool.
//
// Layout:
//   - Hero (compact)
//   - Search (highlights matches on the map in pink)
//   - World map (full-width, 6 bands, ~24 major cities)
//   - Selected location panel (full-width below map)
//     - Left: country/time/offset
//     - Right: comparison vs user city + "Convert in TZC" CTA
//   - Popular timezones shortcuts (grid)

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, Search, ArrowRight } from "lucide-react";
import { FeedbackPrompt } from "../../components/feedback/FeedbackPrompt";
import "./timezone-map.css";
import { formatLocalTime, getTimezoneOffsetAndAbbr } from "../../data/countries";

// =====================================================================
// 6 timezone bands — broad geographic groupings, not granular UTC offsets
// =====================================================================
const TZ_BANDS = [
  {
    key: "americas",
    label: "Americas",
    range: "UTC-10 to UTC-3",
    x: 0,    // 0% to ~30% of width
    color: "rgba(99, 102, 241, 0.18)",
    cities: [
      { code: "LAX",  name: "Los Angeles",  country: "United States", countryCode: "US", flag: "🇺🇸", tz: "America/Los_Angeles", lng: 18, lat: 47 },
      { code: "SFO",  name: "San Francisco",country: "United States", countryCode: "US", flag: "🇺🇸", tz: "America/Los_Angeles", lng: 18, lat: 42 },
      { code: "YVR",  name: "Vancouver",    country: "Canada",        countryCode: "CA", flag: "🇨🇦", tz: "America/Vancouver",   lng: 17, lat: 30 },
      { code: "DEN",  name: "Denver",       country: "United States", countryCode: "US", flag: "🇺🇸", tz: "America/Denver",      lng: 22, lat: 45 },
      { code: "MEX",  name: "Mexico City",  country: "Mexico",        countryCode: "MX", flag: "🇲🇽", tz: "America/Mexico_City", lng: 25, lat: 60 },
      { code: "CHI",  name: "Chicago",      country: "United States", countryCode: "US", flag: "🇺🇸", tz: "America/Chicago",     lng: 27, lat: 40 },
      { code: "TOR",  name: "Toronto",      country: "Canada",        countryCode: "CA", flag: "🇨🇦", tz: "America/Toronto",     lng: 31, lat: 36 },
      { code: "NYC",  name: "New York",     country: "United States", countryCode: "US", flag: "🇺🇸", tz: "America/New_York",    lng: 33, lat: 43 },
      { code: "BOG",  name: "Bogotá",       country: "Colombia",      countryCode: "CO", flag: "🇨🇴", tz: "America/Bogota",       lng: 32, lat: 70 },
      { code: "SAO",  name: "São Paulo",    country: "Brazil",        countryCode: "BR", flag: "🇧🇷", tz: "America/Sao_Paulo",    lng: 37, lat: 80 },
      { code: "BUE",  name: "Buenos Aires", country: "Argentina",     countryCode: "AR", flag: "🇦🇷", tz: "America/Argentina/Buenos_Aires", lng: 35, lat: 90 },
      { code: "SCL",  name: "Santiago",     country: "Chile",         countryCode: "CL", flag: "🇨🇱", tz: "America/Santiago",    lng: 32, lat: 95 },
    ],
  },
  {
    key: "atlantic",
    label: "Atlantic",
    range: "UTC-2 to UTC+0",
    x: 30,
    color: "rgba(56, 189, 248, 0.2)",
    cities: [
      { code: "REK",  name: "Reykjavík",    country: "Iceland",       countryCode: "IS", flag: "🇮🇸", tz: "Atlantic/Reykjavik",  lng: 47, lat: 18 },
      { code: "PDL",  name: "Azores",       country: "Portugal",      countryCode: "PT", flag: "🇵🇹", tz: "Atlantic/Azores",     lng: 48, lat: 50 },
    ],
  },
  {
    key: "europe-africa",
    label: "Europe / Africa",
    range: "UTC+0 to UTC+4",
    x: 40,
    color: "rgba(34, 197, 94, 0.18)",
    cities: [
      { code: "LON",  name: "London",       country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", tz: "Europe/London",        lng: 50, lat: 30 },
      { code: "PAR",  name: "Paris",        country: "France",         countryCode: "FR", flag: "🇫🇷", tz: "Europe/Paris",         lng: 51, lat: 38 },
      { code: "BER",  name: "Berlin",       country: "Germany",        countryCode: "DE", flag: "🇩🇪", tz: "Europe/Berlin",        lng: 53, lat: 32 },
      { code: "MAD",  name: "Madrid",       country: "Spain",          countryCode: "ES", flag: "🇪🇸", tz: "Europe/Madrid",        lng: 49, lat: 50 },
      { code: "ROM",  name: "Rome",         country: "Italy",          countryCode: "IT", flag: "🇮🇹", tz: "Europe/Rome",          lng: 53, lat: 45 },
      { code: "IST",  name: "Istanbul",     country: "Türkiye",        countryCode: "TR", flag: "🇹🇷", tz: "Europe/Istanbul",      lng: 57, lat: 45 },
      { code: "CAI",  name: "Cairo",        country: "Egypt",          countryCode: "EG", flag: "🇪🇬", tz: "Africa/Cairo",         lng: 56, lat: 60 },
      { code: "LOS",  name: "Lagos",        country: "Nigeria",        countryCode: "NG", flag: "🇳🇬", tz: "Africa/Lagos",         lng: 51, lat: 70 },
      { code: "NBO",  name: "Nairobi",      country: "Kenya",          countryCode: "KE", flag: "🇰🇪", tz: "Africa/Nairobi",      lng: 58, lat: 76 },
      { code: "JNB",  name: "Johannesburg", country: "South Africa",   countryCode: "ZA", flag: "🇿🇦", tz: "Africa/Johannesburg", lng: 57, lat: 90 },
    ],
  },
  {
    key: "middle-east",
    label: "Middle East",
    range: "UTC+2 to UTC+4",
    x: 55,
    color: "rgba(234, 179, 8, 0.2)",
    cities: [
      { code: "DXB",  name: "Dubai",        country: "UAE",            countryCode: "AE", flag: "🇦🇪", tz: "Asia/Dubai",           lng: 62, lat: 55 },
      { code: "RUH",  name: "Riyadh",       country: "Saudi Arabia",   countryCode: "SA", flag: "🇸🇦", tz: "Asia/Riyadh",          lng: 60, lat: 56 },
    ],
  },
  {
    key: "asia",
    label: "Asia",
    range: "UTC+5 to UTC+9",
    x: 62,
    color: "rgba(249, 115, 22, 0.2)",
    cities: [
      { code: "DEL",  name: "New Delhi",    country: "India",          countryCode: "IN", flag: "🇮🇳", tz: "Asia/Kolkata",         lng: 70, lat: 54 },
      { code: "BOM",  name: "Mumbai",       country: "India",          countryCode: "IN", flag: "🇮🇳", tz: "Asia/Kolkata",         lng: 68, lat: 60 },
      { code: "BKK",  name: "Bangkok",      country: "Thailand",       countryCode: "TH", flag: "🇹🇭", tz: "Asia/Bangkok",         lng: 76, lat: 65 },
      { code: "SIN",  name: "Singapore",    country: "Singapore",      countryCode: "SG", flag: "🇸🇬", tz: "Asia/Singapore",       lng: 77, lat: 70 },
      { code: "JAK",  name: "Jakarta",      country: "Indonesia",      countryCode: "ID", flag: "🇮🇩", tz: "Asia/Jakarta",         lng: 79, lat: 75 },
      { code: "HKG",  name: "Hong Kong",    country: "Hong Kong SAR",  countryCode: "HK", flag: "🇭🇰", tz: "Asia/Hong_Kong",       lng: 82, lat: 60 },
      { code: "BEI",  name: "Beijing",      country: "China",          countryCode: "CN", flag: "🇨🇳", tz: "Asia/Shanghai",        lng: 80, lat: 44 },
      { code: "SHA",  name: "Shanghai",     country: "China",          countryCode: "CN", flag: "🇨🇳", tz: "Asia/Shanghai",        lng: 81, lat: 50 },
      { code: "SEL",  name: "Seoul",        country: "South Korea",    countryCode: "KR", flag: "🇰🇷", tz: "Asia/Seoul",           lng: 83, lat: 46 },
      { code: "TYO",  name: "Tokyo",        country: "Japan",          countryCode: "JP", flag: "🇯🇵", tz: "Asia/Tokyo",           lng: 85, lat: 50 },
    ],
  },
  {
    key: "pacific",
    label: "Pacific",
    range: "UTC+10 to UTC+14",
    x: 82,
    color: "rgba(168, 85, 247, 0.2)",
    cities: [
      { code: "SYD",  name: "Sydney",       country: "Australia",      countryCode: "AU", flag: "🇦🇺", tz: "Australia/Sydney",     lng: 87, lat: 88 },
      { code: "MEL",  name: "Melbourne",    country: "Australia",      countryCode: "AU", flag: "🇦🇺", tz: "Australia/Melbourne",  lng: 85, lat: 92 },
      { code: "AKL",  name: "Auckland",     country: "New Zealand",    countryCode: "NZ", flag: "🇳🇿", tz: "Pacific/Auckland",     lng: 92, lat: 95 },
    ],
  },
];

// User's "home" city — default to NYC (Americas) since the map view is global.
// The map's own TZ_BANDS array is the single source of truth for city data,
// so we don't need CITY_BY_CODE here.

// Capitals (subset)
const CAPITALS: Record<string, string> = {
  US: "Washington, D.C.", GB: "London", FR: "Paris", DE: "Berlin",
  ES: "Madrid", IT: "Rome", TR: "Ankara", EG: "Cairo",
  JP: "Tokyo", KR: "Seoul", CN: "Beijing", HK: "—",
  IN: "New Delhi", TH: "Bangkok", ID: "Jakarta", SG: "Singapore",
  AE: "Abu Dhabi", SA: "Riyadh", ZA: "Pretoria", NG: "Abuja",
  KE: "Nairobi", CA: "Ottawa", MX: "Mexico City", BR: "Brasília",
  AR: "Buenos Aires", CO: "Bogotá", CL: "Santiago", IS: "Reykjavík",
  PT: "Lisbon", AU: "Canberra", NZ: "Wellington",
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================
export function TimezoneMapPage() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live tick — clocks refresh every second for snappy feel
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Flattened city list (from all bands)
  const ALL_CITIES = useMemo(() => {
    return TZ_BANDS.flatMap((b) => b.cities.map((c) => ({ ...c, band: b.key })));
  }, []);

  // Search matches (highlighted on map)
  const searchMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return new Set<string>();
    const matches = ALL_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase() === q ||
        c.tz.toLowerCase().includes(q),
    );
    return new Set(matches.map((c) => c.code));
  }, [searchQuery, ALL_CITIES]);

  // Dropdown list (top 8 matches)
  const dropdownMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return ALL_CITIES
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.tz.toLowerCase().includes(q) ||
          c.countryCode.toLowerCase() === q,
      )
      .slice(0, 8);
  }, [searchQuery, ALL_CITIES]);

  const selectedCity = useMemo(
    () => (selectedCode ? ALL_CITIES.find((c) => c.code === selectedCode) || null : null),
    [selectedCode, ALL_CITIES],
  );
  // Default user city: find NYC in ALL_CITIES, else first Americas city
  const userCity = useMemo(
    () => ALL_CITIES.find((c) => c.code === "NYC") || ALL_CITIES[0],
    [ALL_CITIES],
  );

  const navigateToRoute = useCallback((path: string) => {
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", path);
    window.dispatchEvent(new Event("tdp:navigate"));
  }, []);

  const selectCity = useCallback((code: string) => {
    setSelectedCode(code);
    setShowDropdown(false);
    setSearchQuery("");
  }, []);

  // ─── SVG path data for continents (rough outline) ─────────────────────
  const continentPaths = [
    "M 8 18 Q 14 10, 22 14 L 28 18 Q 30 24, 26 32 L 24 40 Q 18 46, 14 42 L 12 36 Q 6 30, 8 22 Z",
    "M 30 60 Q 36 58, 40 64 L 40 80 Q 36 92, 32 94 L 28 88 Q 26 76, 30 60 Z",
    "M 46 24 Q 50 18, 56 22 L 60 26 Q 58 32, 52 32 L 48 30 Q 44 28, 46 24 Z",
    "M 50 40 Q 56 36, 62 42 L 62 60 Q 60 78, 56 86 L 50 90 Q 46 84, 48 76 L 46 64 Q 46 50, 50 40 Z",
    "M 60 14 Q 70 8, 80 16 L 90 22 Q 92 36, 88 48 L 84 56 Q 78 60, 70 58 L 64 50 Q 60 38, 60 24 Z",
    "M 78 76 Q 84 74, 90 78 L 94 86 Q 90 92, 84 90 L 80 86 Q 76 80, 78 76 Z",
    "M 85 86 Q 90 84, 94 88 L 96 96 Q 92 98, 86 96 Z",
  ];

  return (
    <div className="tzmp">
      {/* Header */}
      <header className="tzmp-header">
        <a className="tzmp-brand" href="/" onClick={(e) => { e.preventDefault(); navigateToRoute("/"); }}>
          <span className="tzmp-brand-globe">🌐</span>
          <span>TimeAndDatePro</span>
        </a>
        <button
          type="button"
          className="tzmp-back"
          onClick={() => navigateToRoute("/")}
          aria-label="Back to home"
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </button>
      </header>

      {/* Hero */}
      <section className="tzmp-hero">
        <div className="tzmp-eyebrow">
          <span className="tzmp-eyebrow-dot" />
          <span>Live · {ALL_CITIES.length} cities · 6 time zones</span>
        </div>
        <h1 className="tzmp-title">Explore Time Zones Visually</h1>
        <p className="tzmp-sub">
          Click any city on the map, or search by name — see local time,
          timezone offset, and the exact difference from your city. Then
          open the result in the full Time Zone Converter for overlap
          grids and meeting planning.
        </p>
        <div className="tzmp-search-wrap">
          <Search size={18} className="tzmp-search-icon" />
          <input
            type="text"
            className="tzmp-search-input"
            placeholder="Search country, city, or timezone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
            aria-label="Search for a city, country, or timezone"
            data-testid="tzmp-search"
          />
          {showDropdown && dropdownMatches.length > 0 && (
            <div className="tzmp-search-dropdown active">
              {dropdownMatches.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className="tzmp-search-result"
                  onClick={() => selectCity(c.code)}
                >
                  <span className="tzmp-search-result-flag">{c.flag}</span>
                  <span className="tzmp-search-result-info">
                    <span className="tzmp-search-result-city">{c.name}</span>
                    <span className="tzmp-search-result-country">{c.country}</span>
                  </span>
                  <span className="tzmp-search-result-tz">{c.tz}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map (full-width) */}
      <section className="tzmp-map-section">
        <div className="tzmp-map-card">
          <div className="tzmp-map-wrap">
            <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" style={{ minHeight: 380 }}>
              {/* 6 timezone bands (vertical stripes, color-coded) */}
              <g>
                {TZ_BANDS.map((band) => {
                  const widthPct = 18; // each band ~18% wide with slight overlap
                  return (
                    <g key={band.key}>
                      <rect
                        className="tzmp-tz-band"
                        x={band.x}
                        y={0}
                        width={widthPct}
                        height={50}
                        fill={band.color}
                      />
                      <text
                        className="tzmp-tz-band-label"
                        x={band.x + widthPct / 2}
                        y={47}
                      >
                        {band.label}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Continent silhouettes (rough outline) */}
              <g fill="rgba(148, 163, 184, 0.2)" stroke="rgba(100, 116, 139, 0.45)" strokeWidth="0.2">
                {continentPaths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>

              {/* City dots */}
              <g>
                {ALL_CITIES.map((c) => {
                  const isUser = c.code === userCity.code;
                  const isSelected = c.code === selectedCode;
                  const isMatch = searchMatches.has(c.code);
                  const classes = [
                    "tzmp-city-dot",
                    isUser ? "user" : "",
                    isSelected ? "selected" : "",
                    !isSelected && isMatch && searchQuery ? "highlight" : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <g
                      key={c.code}
                      className={classes}
                      data-code={c.code}
                      onClick={() => selectCity(c.code)}
                    >
                      <circle className="pulse" cx={c.lng} cy={c.lat} r={0.5} />
                      <circle className="ring" cx={c.lng} cy={c.lat} r={1.2} />
                      <circle className="dot" cx={c.lng} cy={c.lat} r={0.7} />
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="tzmp-map-legend">
              <span className="tzmp-legend-dot user">Your city</span>
              <span className="tzmp-legend-dot selected">Selected</span>
              {searchQuery && <span className="tzmp-legend-dot highlight">Search match</span>}
            </div>

            <Tooltip mapCities={ALL_CITIES} now={now} />
          </div>
        </div>
      </section>

      {/* Detail panel (full-width below map) */}
      <section className="tzmp-detail-section">
        {selectedCity ? (
          <DetailCard
            city={selectedCity}
            userCity={userCity}
            now={now}
            navigateToRoute={navigateToRoute}
          />
        ) : (
          <div className="tzmp-detail-card">
            <div className="tzmp-detail-empty">
              <div className="tzmp-detail-empty-icon">👆</div>
              <div className="tzmp-detail-empty-title">Pick a city to get started</div>
              <p style={{ maxWidth: 420, margin: "0 auto" }}>
                Click any dot on the map above, or search for a city, country,
                or timezone. We'll show local time, UTC offset, and how it
                compares to your city ({userCity.name}).
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Popular timezones */}
      <section className="tzmp-shortcuts-section">
        <h2 className="tzmp-section-label">Popular timezones</h2>
        <p className="tzmp-section-meta">Quick jump to the world's most-visited cities</p>
        <div className="tzmp-shortcuts-grid">
          {ALL_CITIES.map((c) => {
            const isMatch = searchMatches.has(c.code);
            return (
              <button
                key={c.code}
                type="button"
                className={`tzmp-shortcut-card${isMatch ? " matched" : ""}`}
                onClick={() => selectCity(c.code)}
                data-code={c.code}
              >
                <div className="tzmp-shortcut-flag">{c.flag}</div>
                <div className="tzmp-shortcut-city">{c.name}</div>
                <div className="tzmp-shortcut-country">{c.country}</div>
                <div className="tzmp-shortcut-time">{formatLocalTime(now, "24h", c.tz)}</div>
                <div className="tzmp-shortcut-tz">{c.tz.split("/").slice(-1)[0].replace(/_/g, " ")}</div>
              </button>
            );
          })}
        </div>
      </section>
      <FeedbackPrompt tool="timezone-map" toolLabel="Timezone Map" />
    </div>
  );
}

// =====================================================================
// Tooltip component
// =====================================================================
function Tooltip({ mapCities, now }: { mapCities: any[]; now: Date }) {
  const [active, setActive] = useState<{ code: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const svg = document.querySelector(".tzmp-map-wrap svg");
    if (!svg) return;
    const wrap = svg.parentElement as HTMLElement;

    const onMove = (e: MouseEvent) => {
      const target = (e.target as Element).closest(".tzmp-city-dot");
      if (!target) { setActive(null); return; }
      const code = target.getAttribute("data-code");
      if (!code) return;
      const wrapRect = wrap.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      // Map viewBox is 0 0 100 50; convert mouse coords to viewBox coords
      const ratio = svgRect.width / 100;
      const ratioY = svgRect.height / 50;
      const city = mapCities.find((c) => c.code === code);
      if (!city) return;
      const dotClientX = svgRect.left + city.lng * ratio;
      const dotClientY = svgRect.top + city.lat * ratioY;
      setActive({
        code,
        x: dotClientX - wrapRect.left,
        y: dotClientY - wrapRect.top,
      });
    };
    const onLeave = () => setActive(null);

    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("mouseleave", onLeave);
    return () => {
      svg.removeEventListener("mousemove", onMove);
      svg.removeEventListener("mouseleave", onLeave);
    };
  }, [mapCities]);

  if (!active) return <div className="tzmp-tooltip" />;
  const city = mapCities.find((c) => c.code === active.code);
  if (!city) return <div className="tzmp-tooltip" />;

  const off = getTimezoneOffsetAndAbbr(city.tz, now);

  return (
    <div className="tzmp-tooltip active" style={{ left: active.x, top: active.y }}>
      <div className="tzmp-tt-city">{city.flag} {city.name}</div>
      <div className="tzmp-tt-time">{formatLocalTime(now, "24h", city.tz)}</div>
      <div className="tzmp-tt-meta">{city.country} · {off.offsetStr}</div>
    </div>
  );
}

// =====================================================================
// Detail card — country/time info + comparison + CTA into TimeZoneConverter
// =====================================================================
function DetailCard({
  city,
  userCity,
  now,
  navigateToRoute,
}: {
  city: any;
  userCity: any;
  now: Date;
  navigateToRoute: (path: string) => void;
}) {
  const off = getTimezoneOffsetAndAbbr(city.tz, now);
  const userOff = getTimezoneOffsetAndAbbr(userCity.timezone, now);

  // Offset diff (in hours)
  const offsetDiff = parseOffsetHours(off.offsetStr) - parseOffsetHours(userOff.offsetStr);

  const dstActive = isDstActive(now, city.tz);
  const capital = CAPITALS[city.countryCode] || city.name;

  const diffPhrase = formatDiffPhrase(offsetDiff, city.name, userCity.name);

  // CTA: open TimeZoneConverter with selected city + user city
  const converterHref = `/en/time-zone-converter?cities=${encodeURIComponent(`${city.code},${userCity.code}`)}`;

  return (
    <div className="tzmp-detail-card">
      {/* LEFT — selected location */}
      <div>
        <div className="tzmp-detail-header">
          <div className="tzmp-detail-flag">{city.flag}</div>
          <div>
            <div className="tzmp-detail-country-name">{city.name}</div>
            <div className="tzmp-detail-capital">{capital} · {city.country}</div>
          </div>
        </div>
        <div className="tzmp-detail-time-big">{formatLocalTime(now, "24h", city.tz)}</div>
        <div className="tzmp-detail-date">{formatLongDate(now, city.tz)}</div>

        <div className="tzmp-detail-row">
          <span className="tzmp-detail-label">Timezone</span>
          <span className="tzmp-detail-value mono">{city.tz}</span>
        </div>
        <div className="tzmp-detail-row">
          <span className="tzmp-detail-label">UTC Offset</span>
          <span className="tzmp-detail-value mono">{off.offsetStr}</span>
        </div>
        <div className="tzmp-detail-row">
          <span className="tzmp-detail-label">DST</span>
          <span className={`tzmp-dst-badge ${dstActive ? "tzmp-dst-active" : "tzmp-dst-inactive"}`}>
            {dstActive ? "Active" : "Standard"}
          </span>
        </div>
        <div className="tzmp-detail-row">
          <span className="tzmp-detail-label">Abbr</span>
          <span className="tzmp-detail-value mono">{off.abbr}</span>
        </div>
      </div>

      {/* RIGHT — comparison + CTA */}
      <div className="tzmp-detail-right">
        <div className="tzmp-comparison-block">
          <div className="tzmp-comparison-row">
            <div className="tzmp-comparison-side">
              <span className="tzmp-comparison-flag">{userCity.countryCode ? flagForCode(userCity.countryCode) : "🌍"}</span>
              <div className="tzmp-comparison-info">
                <div className="tzmp-comparison-city">{userCity.name}</div>
                <div className="tzmp-detail-date" style={{ marginBottom: 0 }}>Your city</div>
              </div>
              <div className="tzmp-comparison-time mono">{formatLocalTime(now, "24h", userCity.timezone)}</div>
            </div>
            <div className="tzmp-comparison-side">
              <span className="tzmp-comparison-flag">{city.flag}</span>
              <div className="tzmp-comparison-info">
                <div className="tzmp-comparison-city">{city.name}</div>
                <div className="tzmp-detail-date" style={{ marginBottom: 0 }}>Selected</div>
              </div>
              <div className="tzmp-comparison-time mono">{formatLocalTime(now, "24h", city.tz)}</div>
            </div>
          </div>
          <div className="tzmp-comparison-difference">{diffPhrase}</div>
        </div>

        <a
          className="tzmp-cta"
          href={converterHref}
          onClick={(e) => { e.preventDefault(); navigateToRoute(converterHref); }}
          data-testid="tzmp-open-converter"
        >
          <span>Open in Time Zone Converter</span>
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}

// =====================================================================
// Helpers
// =====================================================================
function parseOffsetHours(offsetStr: string): number {
  // "UTC+5:30" or "UTC-09:00" → number
  const m = offsetStr.match(/UTC([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  let h = parseInt(m[2], 10);
  if (m[3]) h += parseInt(m[3], 10) / 60;
  return m[1] === "-" ? -h : h;
}

function formatDiffPhrase(diff: number, selName: string, userName: string): string {
  if (Math.abs(diff) < 0.01) return `${selName} is in the same timezone as ${userName}`;
  const direction = diff > 0 ? "ahead of" : "behind";
  const abs = Math.abs(diff);
  const whole = Math.floor(abs);
  const mins = Math.round((abs - whole) * 60);
  let phrase: string;
  if (mins === 0) phrase = `${whole} hour${whole === 1 ? "" : "s"}`;
  else if (whole === 0) phrase = `${mins} minutes`;
  else phrase = `${whole}h ${mins}m`;
  return `${selName} is ${phrase} ${direction} ${userName}`;
}

function isDstActive(d: Date, tz: string): boolean {
  try {
    const jan = new Date(d.getFullYear(), 0, 15);
    const jul = new Date(d.getFullYear(), 6, 15);
    const offJan = parseOffsetHours(getTimezoneOffsetAndAbbr(tz, jan).offsetStr);
    const offJul = parseOffsetHours(getTimezoneOffsetAndAbbr(tz, jul).offsetStr);
    return offJan !== offJul;
  } catch {
    return false;
  }
}

function flagForCode(code: string): string {
  // Convert ISO-2 to regional indicator emoji (simplified — works for most)
  if (code.length !== 2) return "🌍";
  const A = 0x1F1E6;
  const base = "A".charCodeAt(0);
  const codeA = code.toUpperCase().charCodeAt(0) - base + A;
  const codeB = code.toUpperCase().charCodeAt(1) - base + A;
  return String.fromCodePoint(codeA, codeB);
}

function formatLongDate(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toDateString();
  }
}

export default TimezoneMapPage;