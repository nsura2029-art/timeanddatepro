// src/components/admin/AdminDashboard.tsx

import * as React from "react";
// Single-purpose: at-a-glance stats (last hour by default) + category breakdown
// + slowest endpoints. Drives the top page of the admin panel.

import { useEffect, useState } from "react";
import { Activity, Clock4, AlertTriangle, Database, TrendingUp } from "lucide-react";

interface DashboardData {
  since: number;
  total: number;
  p50_ms: number;
  p95_ms: number;
  errors: number;
  cache_hits: number;
  byCategory: { category: string; count: number }[];
  byEndpoint: { endpoint: string; count: number; p50_ms: number; errors: number }[];
}

export function AdminDashboard({ tick }: { tick: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/authed/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setErr(j.error?.message || "Failed to load");
          return;
        }
        setData(j.data);
      })
      .catch((e) => setErr(e.message));
  }, [tick]);

  if (err) return <div className="admin-error">{err}</div>;
  if (!data) return <div className="admin-card">Loading…</div>;

  const errorRate = data.total > 0 ? (data.errors / data.total) * 100 : 0;
  const cacheRate = data.total > 0 ? (data.cache_hits / data.total) * 100 : 0;

  return (
    <>
      <div className="admin-header">
        <div>
          <h2>Dashboard</h2>
          <div className="lede">Last 60 minutes · auto-refreshes on navigation. Click API Status for the live request log.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Stat icon={<Activity size={16} />} label="Total requests" value={data.total.toLocaleString()} />
        <Stat icon={<Clock4 size={16} />} label="p50 latency" value={`${data.p50_ms} ms`} />
        <Stat icon={<Clock4 size={16} />} label="p95 latency" value={`${data.p95_ms} ms`} />
        <Stat icon={<AlertTriangle size={16} />} label="Errors" value={data.errors.toLocaleString()} delta={`${errorRate.toFixed(1)}%`} deltaClass={errorRate > 5 ? "down" : ""} />
        <Stat icon={<Database size={16} />} label="Cache hits" value={data.cache_hits.toLocaleString()} delta={`${cacheRate.toFixed(1)}%`} deltaClass={cacheRate > 50 ? "up" : ""} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="admin-card">
          <div className="admin-card-label">
            <TrendingUp size={12} className="inline mr-1" /> By Category
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Requests</th>
                <th style={{ textAlign: "right" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.byCategory.map((c) => (
                <tr key={c.category}>
                  <td><span className="admin-cat-chip">{c.category}</span></td>
                  <td style={{ textAlign: "right" }}>{c.count.toLocaleString()}</td>
                  <td style={{ textAlign: "right", color: "var(--adm-text-muted)" }}>
                    {((c.count / Math.max(1, data.total)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {data.byCategory.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "var(--adm-text-faint)", padding: 24 }}>
                    No traffic in the last hour. Hit any /api/v1/* endpoint and refresh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <div className="admin-card-label">
            <Activity size={12} className="inline mr-1" /> Top Endpoints
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th style={{ textAlign: "right" }}>Calls</th>
                <th style={{ textAlign: "right" }}>p50</th>
                <th style={{ textAlign: "right" }}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {data.byEndpoint.map((e) => (
                <tr key={e.endpoint}>
                  <td className="admin-endpoint-cell">/{e.endpoint}</td>
                  <td style={{ textAlign: "right" }}>{e.count.toLocaleString()}</td>
                  <td style={{ textAlign: "right", color: e.p50_ms > 500 ? "var(--adm-warn)" : "var(--adm-text-muted)" }}>
                    {e.p50_ms} ms
                  </td>
                  <td style={{ textAlign: "right", color: e.errors > 0 ? "var(--adm-error)" : "var(--adm-text-faint)" }}>
                    {e.errors}
                  </td>
                </tr>
              ))}
              {data.byEndpoint.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--adm-text-faint)", padding: 24 }}>
                    No traffic yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value, delta, deltaClass }: { icon: React.ReactNode; label: string; value: string; delta?: string; deltaClass?: string }) {
  return (
    <div className="admin-stat">
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {icon} {label}
      </div>
      <div className="value">{value}</div>
      {delta && <div className={`delta ${deltaClass || ""}`}>{delta}</div>}
    </div>
  );
}
