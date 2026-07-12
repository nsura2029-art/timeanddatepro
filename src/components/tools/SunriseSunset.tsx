// src/components/tools/SunriseSunset.tsx
// Sunrise & sunset calculator — picks a city, shows today's sun times + day length.

import { useEffect, useState, useMemo } from "react";
import { Sun, Moon } from "lucide-react";
// (i18n not yet implemented for this tool)

const PRESETS: Array<{ name: string; lat: number; lon: number; country: string; emoji: string }> = [
  { name: "New York",     lat: 40.7128,  lon: -74.0060, country: "US", emoji: "🇺🇸" },
  { name: "London",       lat: 51.5074,  lon: -0.1278,  country: "GB", emoji: "🇬🇧" },
  { name: "Tokyo",        lat: 35.6762,  lon: 139.6503, country: "JP", emoji: "🇯🇵" },
  { name: "Sydney",       lat: -33.8688, lon: 151.2093, country: "AU", emoji: "🇦🇺" },
  { name: "Paris",        lat: 48.8566,  lon: 2.3522,   country: "FR", emoji: "🇫🇷" },
  { name: "Dubai",        lat: 25.2048,  lon: 55.2708,  country: "AE", emoji: "🇦🇪" },
  { name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729, country: "BR", emoji: "🇧🇷" },
  { name: "Cape Town",    lat: -33.9249, lon: 18.4241,  country: "ZA", emoji: "🇿🇦" },
];

interface SunData {
  lat: number;
  lon: number;
  date: string;
  sunrise_utc: string;     // "09:34 UTC"
  sunset_utc: string;      // "24:17 UTC"
  daylight_hours: number;  // decimal hours
}

/** Strip trailing " UTC" suffix and normalize 24:00 → 00:00 for display */
function formatUtcTime(utc: string): string {
  return utc.replace(/\s*UTC$/, "").replace(/^24:/, "00:");
}

function formatDurationHours(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default function SunriseSunset() {
  // (i18n hook removed)
  const [city, setCity] = useState(PRESETS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<SunData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetch(`https://dev.api.dateandtime.live/api/v1/time/sun?lat=${city.lat}&lon=${city.lon}&date=${date}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j?.success) {
          setErr(j?.error?.message || "Failed to fetch sun data");
          setData(null);
        } else {
          setData(j.data);
        }
      })
      .catch((e) => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [city.lat, city.lon, date]);

  return (
    <div className="tdp-tool tdp-tool-sun" data-testid="tool-sunrise-sunset">
      <header className="tdp-tool-header">
        <h2 className="tdp-tool-title">Sunrise & Sunset</h2>
        <p className="tdp-tool-sub">Sun times for any city + date — from <code>/api/v1/time/sun</code></p>
      </header>

      <div className="tdp-tool-controls">
        <div className="tdp-tool-control-group">
          <label>City</label>
          <select value={city.name} onChange={(e) => {
            const p = PRESETS.find((x) => x.name === e.target.value);
            if (p) setCity(p);
          }}>
            {PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.emoji} {p.name}</option>
            ))}
          </select>
        </div>
        <div className="tdp-tool-control-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {err && <div className="tdp-tool-error">⚠ {err}</div>}
      {loading && <div className="tdp-tool-loading">Loading sun data…</div>}

      {data && !loading && (
        <div className="tdp-sun-display">
          <div className="tdp-sun-row">
            <Sun size={28} className="tdp-sun-icon-rise" />
            <div>
              <div className="tdp-sun-label">Sunrise (UTC)</div>
              <div className="tdp-sun-time" data-testid="sun-sunrise">{formatUtcTime(data.sunrise_utc)}</div>
            </div>
          </div>
          <div className="tdp-sun-row">
            <Moon size={28} className="tdp-sun-icon-set" />
            <div>
              <div className="tdp-sun-label">Sunset (UTC)</div>
              <div className="tdp-sun-time" data-testid="sun-sunset">{formatUtcTime(data.sunset_utc)}</div>
            </div>
          </div>
          <div className="tdp-sun-daylength">
            <strong>Day length:</strong> {formatDurationHours(data.daylight_hours)}
          </div>
        </div>
      )}
    </div>
  );
}
