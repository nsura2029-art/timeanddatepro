// src/components/tools/DaylightSaving.tsx
// Daylight Saving tracker — checks if a timezone observes DST, shows current offset
// and upcoming transition dates.

import { useEffect, useState } from "react";
import { Sun, Clock, Globe } from "lucide-react";
// (i18n not yet implemented for this tool)

const TIMEZONES = [
  { name: "New York",       tz: "America/New_York",   region: "🇺🇸 North America" },
  { name: "Los Angeles",    tz: "America/Los_Angeles", region: "🇺🇸 North America" },
  { name: "Chicago",        tz: "America/Chicago",     region: "🇺🇸 North America" },
  { name: "Denver",         tz: "America/Denver",      region: "🇺🇸 North America" },
  { name: "London",         tz: "Europe/London",       region: "🇬🇧 Europe" },
  { name: "Paris",          tz: "Europe/Paris",        region: "🇫🇷 Europe" },
  { name: "Berlin",         tz: "Europe/Berlin",       region: "🇩🇪 Europe" },
  { name: "Moscow",         tz: "Europe/Moscow",       region: "🇷🇺 Europe" },
  { name: "Tokyo",          tz: "Asia/Tokyo",          region: "🇯🇵 Asia" },
  { name: "Shanghai",       tz: "Asia/Shanghai",       region: "🇨🇳 Asia" },
  { name: "Singapore",      tz: "Asia/Singapore",      region: "🇸🇬 Asia" },
  { name: "Dubai",          tz: "Asia/Dubai",          region: "🇦🇪 Asia" },
  { name: "Sydney",         tz: "Australia/Sydney",    region: "🇦🇺 Oceania" },
  { name: "Auckland",       tz: "Pacific/Auckland",    region: "🇳🇿 Oceania" },
];

interface DstData {
  timezone: string;
  currentOffset: string;
  januaryOffset: string;
  julyOffset: string;
  observesDst: boolean;
}

interface UpcomingData {
  timezone: string;
  year: number;
  spring_forward: { us: string; eu: string };
  fall_back: { us: string; eu: string };
}

export default function DaylightSaving() {
  // (i18n hook removed)
  const [city, setCity] = useState(TIMEZONES[0]);
  const [dst, setDst] = useState<DstData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`https://dev.api.dateandtime.live/api/v1/dst?tz=${encodeURIComponent(city.tz)}`).then((r) => r.json()),
      fetch(`https://dev.api.dateandtime.live/api/v1/dst/upcoming?tz=${encodeURIComponent(city.tz)}`).then((r) => r.json()),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setDst(a?.data ?? null);
      setUpcoming(b?.data ?? null);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [city.tz]);

  return (
    <div className="tdp-tool tdp-tool-dst" data-testid="tool-daylight-saving">
      <header className="tdp-tool-header">
        <h2 className="tdp-tool-title">Daylight Saving</h2>
        <p className="tdp-tool-sub">DST status + upcoming transition dates — from <code>/api/v1/dst</code></p>
      </header>

      <div className="tdp-tool-controls">
        <div className="tdp-tool-control-group">
          <label>City</label>
          <select value={city.name} onChange={(e) => {
            const c = TIMEZONES.find((x) => x.name === e.target.value);
            if (c) setCity(c);
          }}>
            {TIMEZONES.map((tz) => (
              <option key={tz.tz} value={tz.name}>{tz.region} — {tz.name}</option>
            ))}
          </select>
        </div>
        {loading && <span className="tdp-tool-loading">Loading…</span>}
      </div>

      {dst && (
        <div className="tdp-dst-status" data-testid="dst-status">
          <div className={`tdp-dst-badge ${dst.observesDst ? "tdp-dst-badge--yes" : "tdp-dst-badge--no"}`}>
            {dst.observesDst ? "✓ Observes DST" : "✗ No DST"}
          </div>
          <div className="tdp-dst-grid">
            <div className="tdp-dst-cell">
              <Clock size={18} />
              <span className="tdp-dst-label">Current offset</span>
              <strong>{dst.currentOffset}</strong>
            </div>
            <div className="tdp-dst-cell">
              <Sun size={18} />
              <span className="tdp-dst-label">July (summer)</span>
              <strong>{dst.julyOffset}</strong>
            </div>
            <div className="tdp-dst-cell">
              <Globe size={18} />
              <span className="tdp-dst-label">January (winter)</span>
              <strong>{dst.januaryOffset}</strong>
            </div>
          </div>
        </div>
      )}

      {upcoming && dst?.observesDst && (
        <div className="tdp-dst-upcoming">
          <h3>Upcoming transitions in {upcoming.year}</h3>
          <ul>
            <li><strong>Spring forward (US):</strong> {upcoming.spring_forward.us}</li>
            <li><strong>Spring forward (EU):</strong> {upcoming.spring_forward.eu}</li>
            <li><strong>Fall back (US):</strong> {upcoming.fall_back.us}</li>
            <li><strong>Fall back (EU):</strong> {upcoming.fall_back.eu}</li>
          </ul>
          <p className="tdp-dst-note">⚠ Approximate dates. Exact dates depend on local rules.</p>
        </div>
      )}
    </div>
  );
}
