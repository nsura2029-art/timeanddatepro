// src/components/admin/AdminApiStatus.tsx

import * as React from "react";
// The "primary surface" of the admin panel. Live request log with
// filters by category / endpoint / status / time range. Truncated
// payload on click for inspection.

import { useEffect, useState } from "react";
import { Activity, Filter, Search, RefreshCw, AlertCircle } from "lucide-react";
import { ADMIN_CATEGORIES } from "../../admin/categories";

interface ApiRequest {
  id: number;
  method: string;
  path: string;
  endpoint: string;
  category: string;
  status: number;
  latency_ms: number;
  user_agent: string;
  ip: string;
  request_meta: string;
  response_meta: string;
  cached: number;
  source: string;
  created_at: number;
}

interface ApiStatusProps {
  onRefresh: () => void;
}

export function AdminApiStatus({ onRefresh }: ApiStatusProps) {
  const [rows, setRows] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ApiRequest | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [endpointFilter, setEndpointFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sinceMin, setSinceMin] = useState(60);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (categoryFilter) qs.set("category", categoryFilter);
    if (endpointFilter) qs.set("endpoint", endpointFilter);
    if (statusFilter) qs.set("status", statusFilter);
    qs.set("since", String(Date.now() - sinceMin * 60 * 1000));
    qs.set("limit", "200");

    try {
      const r = await fetch(`/api/admin/authed/api-status?${qs}`, { credentials: "include" });
      const j = await r.json();
      if (j.success) setRows(j.data.rows || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Apply pending category from sidebar click
    const pending = sessionStorage.getItem("tdp_admin_filter_category");
    if (pending) {
      setCategoryFilter(pending);
      sessionStorage.removeItem("tdp_admin_filter_category");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, sinceMin]);

  function statusClass(s: number) {
    if (s >= 500) return "err";
    if (s >= 400) return "warn";
    if (s >= 200 && s < 300) return "ok";
    return "warn";
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <h2>API Status</h2>
          <div className="lede">Live request log · grouped by category on the left · click a row to inspect</div>
        </div>
        <button className="admin-button" onClick={() => { load(); onRefresh(); }} disabled={loading}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div className="admin-field" style={{ margin: 0 }}>
            <label><Filter size={10} className="inline mr-1" /> Category</label>
            <select
              className="admin-field-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All</option>
              {ADMIN_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label><Search size={10} className="inline mr-1" /> Endpoint</label>
            <input
              type="text"
              placeholder="e.g. time/now"
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              onBlur={load}
              style={inputStyle}
            />
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label><AlertCircle size={10} className="inline mr-1" /> Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All</option>
              <option value="200">200 OK</option>
              <option value="errors">Any 4xx/5xx</option>
              <option value="400">400</option>
              <option value="404">404</option>
              <option value="500">500</option>
            </select>
          </div>
          <div className="admin-field" style={{ margin: 0 }}>
            <label><Activity size={10} className="inline mr-1" /> Window</label>
            <select
              value={sinceMin}
              onChange={(e) => setSinceMin(parseInt(e.target.value))}
              style={selectStyle}
            >
              <option value={5}>5 min</option>
              <option value={15}>15 min</option>
              <option value={60}>1 hour</option>
              <option value={360}>6 hours</option>
              <option value={1440}>24 hours</option>
              <option value={10080}>7 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>When</th>
              <th>Endpoint</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Status</th>
              <th style={{ textAlign: "right" }}>Latency</th>
              <th style={{ textAlign: "right" }}>Cache</th>
              <th style={{ width: 100 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
                <td style={{ color: "var(--adm-text-faint)" }}>{formatAgo(r.created_at)}</td>
                <td className="admin-endpoint-cell">
                  <span className="method">{r.method}</span>
                  /{r.endpoint}
                </td>
                <td><span className="admin-cat-chip">{r.category || "—"}</span></td>
                <td style={{ textAlign: "right" }}>
                  <span className={`admin-status-pill ${statusClass(r.status)}`}>{r.status}</span>
                </td>
                <td style={{ textAlign: "right", color: r.latency_ms > 500 ? "var(--adm-warn)" : "var(--adm-text-muted)" }}>
                  {r.latency_ms} ms
                </td>
                <td style={{ textAlign: "right" }}>
                  {r.cached ? <span className="admin-status-pill cached">HIT</span> : <span style={{ color: "var(--adm-text-faint)" }}>—</span>}
                </td>
                <td style={{ color: "var(--adm-text-faint)", fontFamily: "var(--adm-font-mono)" }}>
                  {r.ip?.split(",")[0] || "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--adm-text-faint)", padding: 32 }}>
                  No requests in this window. Hit <code style={{ fontFamily: "var(--adm-font-mono)" }}>/api/v1/currency/rates</code> to seed traffic.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 520,
            background: "var(--adm-bg-soft)", borderLeft: "1px solid var(--adm-border)",
            boxShadow: "-20px 0 60px rgba(0,0,0,0.4)", zIndex: 50,
            padding: 20, overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, margin: 0, fontFamily: "var(--adm-font-mono)" }}>/{selected.endpoint}</h3>
            <button className="admin-button" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <Detail label="Method" value={selected.method} />
            <Detail label="Path" value={selected.path} />
            <Detail label="Status" value={`${selected.status} ${selected.latency_ms}ms`} />
            <Detail label="When" value={new Date(selected.created_at).toISOString()} />
            <Detail label="IP" value={selected.ip || "—"} />
            <Detail label="User-Agent" value={selected.user_agent || "—"} />
            <Detail label="Request (truncated)" value={selected.request_meta || "(empty)"} mono />
            <Detail label="Response (truncated)" value={selected.response_meta || "(empty)"} mono />
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--adm-bg)",
  border: "1px solid var(--adm-border)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  color: "var(--adm-text)",
  fontFamily: "var(--adm-font-mono)",
  width: "100%",
};
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "auto" as any };

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontFamily: "var(--adm-font-mono)", textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--adm-text-faint)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: mono || value.length > 80 ? "var(--adm-font-mono)" : "inherit", wordBreak: "break-all", background: "var(--adm-bg)", padding: 8, borderRadius: 6, border: "1px solid var(--adm-border-soft)" }}>
        {value}
      </div>
    </div>
  );
}

function formatAgo(t: number): string {
  const diff = Date.now() - t;
  if (diff < 1000) return "now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}
