// src/components/admin/AdminTriggers.tsx
// Trigger registry browser + run buttons + live SSE updates + history log.

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Play, Zap, ChevronRight, CheckCircle2, AlertCircle, Loader2, History as HistoryIcon,
} from "lucide-react";

interface TriggerParam {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  values?: string[];
  desc: string;
}

interface TriggerDef {
  id: string;
  label: string;
  blurb: string;
  category: string;
  params: TriggerParam[];
}

interface Job {
  id: number;
  trigger_name: string;
  params: Record<string, string>;
  status: "queued" | "running" | "ok" | "failed";
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  output_meta: Record<string, unknown> | null;
}

export function AdminTriggers({ onRefresh }: { onRefresh: () => void }) {
  const [grouped, setGrouped] = useState<Record<string, TriggerDef[]>>({});
  const [active, setActive] = useState<TriggerDef | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>("idle");
  const [liveOutput, setLiveOutput] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Job[]>([]);

  useEffect(() => {
    loadTriggers();
    loadHistory();
  }, []);

  async function loadTriggers() {
    const r = await fetch("/api/admin/authed/triggers", { credentials: "include" });
    const j = await r.json();
    if (j.success) setGrouped(j.data.grouped);
  }

  async function loadHistory() {
    const r = await fetch("/api/admin/authed/triggers/history", { credentials: "include" });
    const j = await r.json();
    if (j.success) setHistory(j.data.jobs);
  }

  function pick(t: TriggerDef) {
    setActive(t);
    const defaults: Record<string, string> = {};
    for (const p of t.params) defaults[p.name] = p.default || "";
    setParams(defaults);
    setLiveOutput(null);
    setLiveStatus("idle");
  }

  async function run() {
    if (!active) return;
    setRunning(true);
    setLiveStatus("queued");
    setLiveOutput(null);
    try {
      const r = await fetch("/api/admin/authed/triggers/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerName: active.id, params }),
      });
      const j = await r.json();
      if (!j.success) {
        setLiveStatus("error");
        setLiveOutput({ message: j.error?.message || "Run failed" });
        setRunning(false);
        return;
      }
      setCurrentTaskId(j.data.id);
      // Open SSE
      const es = new EventSource(
        `/api/admin/authed/triggers/stream?taskId=${j.data.id}`,
        { withCredentials: true }
      );
      es.addEventListener("status", (ev: MessageEvent) => {
        const data = JSON.parse(ev.data);
        setLiveStatus(data.status);
        if (data.output) setLiveOutput(data.output);
      });
      es.addEventListener("done", () => {
        es.close();
        setRunning(false);
        loadHistory();
        onRefresh();
      });
      es.onerror = () => {
        es.close();
        setRunning(false);
        loadHistory();
      };
    } catch (e) {
      setLiveStatus("error");
      setLiveOutput({ message: String(e) });
      setRunning(false);
    }
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <h2>Triggers</h2>
          <div className="lede">Manual actions that re-fetch upstream data or regenerate artifacts. Each runs in a queue and streams live status over SSE.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        {/* LEFT: trigger list */}
        <div className="admin-card" style={{ maxHeight: 640, overflowY: "auto" }}>
          <div className="admin-card-label">
            <Zap size={12} className="inline mr-1" /> Triggers ({(Object.values(grouped || {}) as TriggerDef[][]).reduce((s: number, l) => s + l.length, 0)})
          </div>
          {Object.entries(grouped || {}).map(([cat, list]: [string, TriggerDef[]]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div className="admin-cat-chip" style={{ marginBottom: 6 }}>{cat}</div>
              {list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick(t)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: active?.id === t.id ? "rgba(56,189,248,0.1)" : "transparent",
                    border: "1px solid", borderColor: active?.id === t.id ? "var(--adm-accent)" : "transparent",
                    borderRadius: 6, padding: "8px 10px", cursor: "pointer",
                    color: "var(--adm-text)", marginBottom: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</span>
                    <ChevronRight size={12} className="text-[color:var(--adm-text-faint)]" />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                    {t.blurb}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT: run panel */}
        <div className="admin-card">
          <div className="admin-card-label">
            <Play size={12} className="inline mr-1" /> Run
          </div>
          {!active ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-text-faint)", fontSize: 13 }}>
              Pick a trigger from the list to see its params.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{active.label}</div>
              <div style={{ fontSize: 12, color: "var(--adm-text-muted)", marginBottom: 14 }}>{active.blurb}</div>

              {active.params.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {active.params.map((p) => (
                    <div key={p.name} className="admin-field">
                      <label>{p.name}{p.required ? " *" : ""}</label>
                      <input
                        type="text"
                        value={params[p.name] || ""}
                        onChange={(e) => setParams((s) => ({ ...s, [p.name]: e.target.value }))}
                        placeholder={p.default || p.desc}
                        style={{
                          background: "var(--adm-bg)",
                          border: "1px solid var(--adm-border)",
                          borderRadius: 8, padding: "8px 10px",
                          fontSize: 12, color: "var(--adm-text)",
                          fontFamily: "var(--adm-font-mono)", width: "100%",
                        }}
                      />
                      <div style={{ fontSize: 10, color: "var(--adm-text-faint)", marginTop: 2 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="admin-button primary"
                disabled={running}
                onClick={run}
                style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
              >
                {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {running ? "Running…" : `Run ${active.id}`}
              </button>

              <LiveStatus status={liveStatus} output={liveOutput} />
            </>
          )}
        </div>
      </div>

      {/* HISTORY */}
      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-label">
          <HistoryIcon size={12} className="inline mr-1" /> History ({history.length})
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Trigger</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Started</th>
              <th style={{ textAlign: "right" }}>Duration</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {history.map((j) => (
              <tr key={j.id}>
                <td style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-faint)" }}>#{j.id}</td>
                <td className="admin-endpoint-cell">{j.trigger_name}</td>
                <td><JobStatus status={j.status} /></td>
                <td style={{ textAlign: "right", fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>
                  {j.started_at ? new Date(j.started_at).toLocaleTimeString() : "—"}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>
                  {j.started_at && j.finished_at ? `${j.finished_at - j.started_at}ms` : "—"}
                </td>
                <td style={{ fontSize: 11, fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {j.output_meta ? JSON.stringify(j.output_meta) : "—"}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--adm-text-faint)", padding: 24 }}>
                No trigger runs yet. Pick one from the left and hit "Run".
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function JobStatus({ status }: { status: string }) {
  if (status === "ok") return <span className="admin-status-pill ok"><CheckCircle2 size={10} /> ok</span>;
  if (status === "failed") return <span className="admin-status-pill err"><AlertCircle size={10} /> failed</span>;
  if (status === "running") return <span className="admin-status-pill warn"><Loader2 size={10} className="animate-spin" /> running</span>;
  return <span className="admin-status-pill cached">queued</span>;
}

function LiveStatus({ status, output }: { status: string; output: Record<string, unknown> | null }) {
  return (
    <div style={{
      background: "var(--adm-bg)",
      border: "1px solid var(--adm-border-soft)",
      borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "var(--adm-font-mono)",
      color: status === "ok" ? "var(--adm-success)"
           : status === "failed" || status === "error" ? "var(--adm-error)"
           : status === "running" ? "var(--adm-warn)"
           : "var(--adm-text-muted)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: output ? 8 : 0 }}>
        {status === "running" && <Loader2 size={12} className="animate-spin" />}
        {status === "ok" && <CheckCircle2 size={12} />}
        {status === "failed" && <AlertCircle size={12} />}
        <span style={{ fontWeight: 700 }}>{status.toUpperCase()}</span>
      </div>
      {output && (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--adm-text)", fontSize: 11 }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}