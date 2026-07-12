// src/components/tools/Stopwatch.tsx
// Simple stopwatch + lap timer — pure client-side, no API call.

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
// (i18n not yet implemented for this tool)

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cc = Math.floor((ms % 1000) / 10);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cc).padStart(2, "0")}`;
}

export default function Stopwatch() {
  // (i18n hook removed)
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Array<{ id: number; time: number; split: number }>>([]);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      if (startRef.current !== null) {
        setElapsed(baseRef.current + (performance.now() - startRef.current));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const start = () => {
    startRef.current = performance.now();
    setRunning(true);
  };
  const pause = () => {
    if (startRef.current !== null) {
      baseRef.current += performance.now() - startRef.current;
    }
    startRef.current = null;
    setRunning(false);
  };
  const reset = () => {
    startRef.current = null;
    baseRef.current = 0;
    setElapsed(0);
    setLaps([]);
    setRunning(false);
  };
  const lap = () => {
    const last = laps[0]?.time ?? 0;
    setLaps((prev) => [
      { id: prev.length + 1, time: elapsed, split: elapsed - last },
      ...prev,
    ]);
  };

  return (
    <div className="tdp-tool tdp-tool-stopwatch" data-testid="tool-stopwatch">
      <header className="tdp-tool-header">
        <h2 className="tdp-tool-title">Stopwatch</h2>
        <p className="tdp-tool-sub">High-precision timer with laps — pure client-side, no API call</p>
      </header>

      <div className="tdp-stopwatch-display" data-testid="stopwatch-display">
        {formatTime(elapsed)}
      </div>

      <div className="tdp-stopwatch-controls">
        {!running ? (
          <button className="tdp-stopwatch-btn tdp-stopwatch-btn--start" onClick={start} data-testid="stopwatch-start">
            <Play size={20} /> Start
          </button>
        ) : (
          <button className="tdp-stopwatch-btn tdp-stopwatch-btn--pause" onClick={pause} data-testid="stopwatch-pause">
            <Pause size={20} /> Pause
          </button>
        )}
        <button className="tdp-stopwatch-btn" onClick={lap} disabled={!running} data-testid="stopwatch-lap">
          <Flag size={20} /> Lap
        </button>
        <button className="tdp-stopwatch-btn tdp-stopwatch-btn--reset" onClick={reset} data-testid="stopwatch-reset">
          <RotateCcw size={20} /> Reset
        </button>
      </div>

      {laps.length > 0 && (
        <div className="tdp-stopwatch-laps">
          <h3>Laps ({laps.length})</h3>
          <ol>
            {laps.map((l) => (
              <li key={l.id} data-testid={`stopwatch-lap-${l.id}`}>
                <span className="tdp-stopwatch-lap-num">#{l.id}</span>
                <span className="tdp-stopwatch-lap-time">{formatTime(l.time)}</span>
                <span className="tdp-stopwatch-lap-split">+{formatTime(l.split)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
