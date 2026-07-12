// src/components/admin/AdminCache.tsx

import * as React from "react";
// Cache inventory + per-endpoint invalidation button.

import { useEffect, useState } from "react";
import { Settings2, ShieldOff, AlertCircle, CheckCircle2, Cloud, Zap } from "lucide-react";

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
  // CDN edge cache purge state
  const [cdnPurging, setCdnPurging] = useState(false);
  const [cdnFlash, setCdnFlash] = useState<{ status: "ok" | "err"; message: string; at: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/authed/endpoints", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.success && setCatalog(j.data));
  }, []);

  async function purgeCdn() {
    if (cdnPurging) return;
    setCdnPurging(true);
    setCdnFlash(null);
    try {
      const r = await fetch("/api/admin/authed/cdn/purge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json();
      setCdnFlash({
        status: j.success ? "ok" : "err",
        message: j.success
          ? "CDN edge cache purged. New deploy is now visible at the edge."
          : (j.error?.message || "Purge failed"),
        at: Date.now(),
      });
    } catch (e) {
      setCdnFlash({ status: "err", message: String(e), at: Date.now() });
    } finally {
      setCdnPurging(false);
      setTimeout(() => setCdnFlash(null), 6000);
    }
  }

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

      {/* CDN edge cache — purges the Cloudflare Pages edge cache so the
          latest deploy is visible immediately (no TTL wait, no hard-refresh
          by users). Same call that scripts/deploy-dev.sh makes automatically. */}
      <div className="admin-card" style={{ marginBottom: 16, borderColor: "rgba(114,87,213,0.35)", background: "linear-gradient(135deg, rgba(114,87,213,0.08) 0%, rgba(114,87,213,0.02) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(114,87,213,0.18)", color: "#cdb6ff", flexShrink: 0 }}>
              <Cloud size={18} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#ece4ff" }}>CDN edge cache</div>
              <div style={{ fontSize: 12.5, color: "#a5a3b8", marginTop: 2 }}>
                Purge the Cloudflare Pages edge cache for <code>timeanddatepro-dev</code> so the latest deploy is visible immediately. Affects <code>develop.timeanddatepro-dev.pages.dev</code> + custom domain.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={purgeCdn}
            disabled={cdnPurging}
            data-testid="admin-purge-cdn"
            style={{ flexShrink: 0 }}
          >
            <Zap size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            {cdnPurging ? "Purging…" : "Purge CDN cache"}
          </button>
        </div>
        {cdnFlash && (
          <div
            className={`admin-banner ${cdnFlash.status === "err" ? "admin-error" : ""}`}
            style={{
              marginTop: 12,
              ...(cdnFlash.status === "err"
                ? { background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)", color: "#fecaca" }
                : { background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)", color: "#bbf7d0" }),
            }}
          >
            {cdnFlash.status === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{cdnFlash.message}</span>
          </div>
        )}
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
