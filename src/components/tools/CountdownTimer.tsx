// src/components/tools/CountdownTimer.tsx
// Live countdown to a target date/time. Shows DD:HH:MM:SS plus a
// progress bar (elapsed vs total duration). Quick presets for common
// targets (1h, 1d, 1w, NY, Christmas). Works in any timezone (defaults
// to the user's local timezone, or pick from a list of major IANA zones).

import React, { useState, useEffect, useMemo } from "react";
import { Hourglass, Calendar, Clock, Globe } from "lucide-react";
import { getToolI18n } from "../../utils/toolTranslations";
import ToolSdkPanel from "./ToolSdkPanel";

interface Props { lang?: string; }

const PRESETS: { label: string; getTarget: () => Date }[] = [
  { label: "1 hour", getTarget: () => new Date(Date.now() + 3600_000) },
  { label: "1 day", getTarget: () => new Date(Date.now() + 86400_000) },
  { label: "1 week", getTarget: () => new Date(Date.now() + 7 * 86400_000) },
  { label: "New Year", getTarget: () => {
      const now = new Date();
      return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
    }
  },
  { label: "Christmas", getTarget: () => {
      const now = new Date();
      const year = now.getMonth() >= 11 ? now.getFullYear() + 1 : now.getFullYear();
      return new Date(year, 11, 25, 0, 0, 0);
    }
  },
];

const TIMEZONES = [
  "local", "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
  "Australia/Sydney", "Pacific/Auckland",
];

function pad(n: number) { return n < 10 ? "0" + n : String(n); }

function diff(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { ms, days, hours, minutes, seconds };
}

export default function CountdownTimer({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  // Default: 7 days from now
  const defaultTarget = new Date(Date.now() + 7 * 86400_000);
  const [startStr, setStartStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [targetStr, setTargetStr] = useState(() => defaultTarget.toISOString().slice(0, 16));
  const [tz, setTz] = useState("local");
  const [now, setNow] = useState(() => new Date());

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo(() => {
    // Parse the target as a local datetime, optionally in a specific tz
    const local = new Date(targetStr);
    return local;
  }, [targetStr]);

  const start = useMemo(() => new Date(startStr + "T00:00:00"), [startStr]);

  const remaining = diff(target, now);
  const total = Math.max(1, target.getTime() - start.getTime());
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  const progress = Math.min(100, (elapsed / total) * 100);

  const done = remaining.ms === 0;
  const valid = target.getTime() > start.getTime();

  function applyPreset(p: typeof PRESETS[number]) {
    const tgt = p.getTarget();
    setTargetStr(tgt.toISOString().slice(0, 16));
    setStartStr(new Date().toISOString().slice(0, 10));
  }

  function fmtDate(d: Date) {
    return d.toLocaleString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: tz === "local" ? undefined : tz,
    });
  }

  return (
    <div className="tdp-tool-wrap">
      {/* Hero header */}
      <div className="tdp-tool-hero">
        <div className="tdp-tool-hero-icon">
          <Hourglass size={28} />
        </div>
        <div>
          <h1 className="tdp-tool-title">Countdown Timer</h1>
          <p className="tdp-tool-lede">Live countdown to any date and time. Set quick presets or pick a custom target.</p>
        </div>
      </div>

      {/* Input panel */}
      <div className="tdp-tool-panel">
        <div className="tdp-tool-row">
          <label className="tdp-tool-field">
            <span className="tdp-tool-label"><Calendar size={14} /> Target date & time</span>
            <input
              type="datetime-local"
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              className="tdp-tool-input"
              data-testid="countdown-target"
            />
          </label>
          <label className="tdp-tool-field">
            <span className="tdp-tool-label"><Globe size={14} /> Timezone</span>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="tdp-tool-input"
            >
              {TIMEZONES.map((z) => (
                <option key={z} value={z}>{z === "local" ? "Local time" : z}</option>
              ))}
            </select>
          </label>
          <label className="tdp-tool-field">
            <span className="tdp-tool-label"><Clock size={14} /> Start (for progress)</span>
            <input
              type="date"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
              className="tdp-tool-input"
            />
          </label>
        </div>

        {/* Preset chips */}
        <div className="tdp-tool-presets" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <span className="tdp-tool-label" style={{ alignSelf: "center", marginRight: 4 }}>Quick:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="tdp-tool-chip"
              data-testid={`countdown-preset-${p.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Countdown display */}
      <div className="tdp-tool-panel" style={{ textAlign: "center" }}>
        {done ? (
          <div data-testid="countdown-done" style={{ padding: "24px 0" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink, #202438)" }}>Time's up!</div>
            <div style={{ fontSize: 14, color: "var(--muted, #5b6181)", marginTop: 8 }}>
              The countdown reached zero at {fmtDate(target)}.
            </div>
          </div>
        ) : !valid ? (
          <div style={{ padding: "24px 0", color: "var(--muted, #5b6181)" }}>
            Target must be after the start time.
          </div>
        ) : (
          <>
            <div
              className="tdp-countdown-display"
              data-testid="countdown-display"
              style={{
                fontFamily: "var(--hero-fg-font, Inter, sans-serif)",
                fontWeight: 900,
                fontVariantNumeric: "tabular-nums",
                fontSize: "clamp(40px, 8vw, 80px)",
                letterSpacing: "-0.02em",
                color: "var(--ink, #202438)",
                lineHeight: 1.1,
                margin: "8px 0 16px",
              }}
            >
              <span>{pad(remaining.days)}</span>
              <span style={{ opacity: 0.4, margin: "0 4px" }}>d</span>
              <span>{pad(remaining.hours)}</span>
              <span style={{ opacity: 0.4, margin: "0 4px" }}>h</span>
              <span>{pad(remaining.minutes)}</span>
              <span style={{ opacity: 0.4, margin: "0 4px" }}>m</span>
              <span>{pad(remaining.seconds)}</span>
              <span style={{ opacity: 0.4, margin: "0 4px" }}>s</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted, #5b6181)" }}>
              Until <strong>{fmtDate(target)}</strong>
            </div>
            {/* Progress bar */}
            <div
              style={{
                marginTop: 20,
                height: 8,
                background: "rgba(48,39,82,0.08)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #7257d5 0%, #a78bfa 100%)",
                  borderRadius: 999,
                  transition: "width 1s linear",
                }}
                data-testid="countdown-progress"
              />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted, #5b6181)", marginTop: 6 }}>
              {progress.toFixed(1)}% elapsed ({Math.floor(elapsed / 86400000)}d of {Math.floor(total / 86400000)}d)
            </div>
          </>
        )}
      </div>

      <ToolSdkPanel
        lang={lang}
        toolId="countdown"
        title="Countdown Timer"
        description="Set a target date/time and show a live countdown anywhere on the web."
        endpoint="/api/v1/time/diff"
        exampleParams={{ start: "2026-01-01T00:00:00Z", end: "2026-12-31T23:59:59Z" }}
      />
    </div>
  );
}
