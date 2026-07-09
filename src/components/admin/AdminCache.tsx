// src/components/admin/AdminCache.tsx

import * as React from "react";
// Cache inventory + per-endpoint invalidation button.

import { useEffect, useState } from "react";
import { Settings2, ShieldOff, AlertCircle, CheckCircle2 } from "lucide-react";

interface CacheEntry {
  endpoint: string;
  apiPath: string;
  method: string;
  cache: string;
  category: string;
  summary: string;
}

interface GroupedCatalog {
  grouped: Record<string, CacheEntry[]>;
  total: number;
}

export function AdminCache({ onRefresh: _ }: { onRefresh: () => void }) {
  const [catalog, setCatalog] = useState<GroupedCatalog | null>(null);
  const [inflight, setInflight] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ endpoint: string; status: "ok" | "err"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/authed/endpoints", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.success && setCatalog(j.data));
  }, []);

  async function invalidate(key: string) {
    setInflight(key);
    setFlash(null);
    try {
      const r = await fetch("/api/admin/authed/cache/invalidate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cacheKey: key, reason: "manual admin" }),
      });
      const j = await r.json();
      setFlash({
        endpoint: key,
        status: j.success ? "ok" : "err",
        message: j.success ? "Invalidation recorded. Next request will bypass." : j.error?.message || "Failed",
      });
    } catch (e) {
      setFlash({ endpoint: key, status: "err", message: String(e) });
    } finally {
      setInflight(null);
      setTimeout(() => setFlash(null), 4000);
    }
  }

  if (!catalog) return <div className="admin-card">Loading…</div>;

  return (
    <>
      <div className="admin-header">
        <div>
          <h2>Cache</h2>
          <div className="lede">Per-endpoint Cache-Control inventory. Invalidation is recorded in the audit log and applied to the next request.</div>
        </div>
      </div>

      {flash && (
        <div className={`admin-banner ${flash.status === "err" ? "admin-error" : ""}`} style={flash.status === "err" ? { background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)", color: "#fecaca" } : {}}>
          {flash.status === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span><code>{flash.endpoint}</code> · {flash.message}</span>
        </div>
      )}

      {Object.entries(catalog.grouped || {}).map(([category, endpoints]) => (
        <div key={category} className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-card-label">
            <span className="admin-cat-chip">{category}</span> &nbsp; {(endpoints as CacheEntry[]).length} endpoints
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Path</th>
                <th>Cache-Control</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(endpoints as CacheEntry[]).map((e) => (
                <tr key={e.endpoint}>
                  <td className="admin-endpoint-cell">
                    <span className="method">{e.method}</span>
                    {e.endpoint}
                  </td>
                  <td style={{ fontFamily: "var(--adm-font-mono)", fontSize: 11, color: "var(--adm-text-muted)" }}>
                    {e.apiPath}
                  </td>
                  <td>
                    <span className="admin-cat-chip" style={{ background: "rgba(56,189,248,0.12)" }}>{e.cache || "—"}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="admin-button"
                      disabled={inflight === e.endpoint}
                      onClick={() => invalidate(e.endpoint)}
                      style={{ fontSize: 11 }}
                    >
                      <ShieldOff size={11} /> Invalidate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
