// src/components/admin/AdminCache.tsx

import * as React from "react";
// Cache inventory + per-endpoint invalidation button.

import { useEffect, useState } from "react";
import { Settings2, ShieldOff, AlertCircle, CheckCircle2, Cloud, Zap, Database, ExternalLink, Trash2 } from "lucide-react";

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
  const [cdnFlash, setCdnFlash] = useState<{ status: "ok" | "err"; message: string; at: number; dashboardUrl?: string } | null>(null);
  // KV cache state
  const [kvNamespaces, setKvNamespaces] = useState<{ id: string; title: string }[] | null>(null);
  const [kvPurging, setKvPurging] = useState<string | null>(null);
  const [kvFlash, setKvFlash] = useState<{ id: string; status: "ok" | "err"; message: string; at: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/authed/endpoints", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.success && setCatalog(j.data));
    // Load KV namespaces
    fetch("/api/admin/authed/kv/namespaces", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.success && setKvNamespaces(j.data.namespaces));
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
        dashboardUrl: j.data?.dashboardUrl,
      });
    } catch (e) {
      setCdnFlash({ status: "err", message: String(e), at: Date.now() });
    } finally {
      setCdnPurging(false);
      // Don't auto-dismiss the error — let the user click the dashboard link
    }
  }

  async function purgeKv(ns: { id: string; title: string }) {
    if (kvPurging) return;
    if (!confirm(`Purge ALL keys from KV namespace "${ns.title}"? This cannot be undone.`)) return;
    setKvPurging(ns.id);
    setKvFlash(null);
    try {
      const r = await fetch("/api/admin/authed/kv/purge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespaceId: ns.id, confirm: true }),
      });
      const j = await r.json();
      setKvFlash({
        id: ns.id,
        status: j.success ? "ok" : "err",
        message: j.success
          ? `Purged ${j.data.deleted} of ${j.data.totalKeys} keys from "${ns.title}".`
          : (j.error?.message || "Purge failed"),
        at: Date.now(),
      });
    } catch (e) {
      setKvFlash({ id: ns.id, status: "err", message: String(e), at: Date.now() });
    } finally {
      setKvPurging(null);
      setTimeout(() => setKvFlash((f) => (f && f.id === ns.id ? null : f)), 6000);
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
                Purge the Cloudflare Pages edge cache for <code>timeanddatepro</code> so the latest deploy is visible immediately. Affects <code>develop.timeanddatepro.pages.dev</code> + custom domain.
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              ...(cdnFlash.status === "err"
                ? { background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)", color: "#fecaca" }
                : { background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)", color: "#bbf7d0" }),
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              {cdnFlash.status === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span style={{ flex: 1, minWidth: 0 }}>{cdnFlash.message}</span>
            </span>
            {cdnFlash.status === "err" && cdnFlash.dashboardUrl && (
              <a
                href={cdnFlash.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn"
                data-testid="admin-cdn-dashboard-link"
                style={{
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.15)",
                  color: "#fecaca",
                  textDecoration: "none",
                  fontSize: 12.5,
                  padding: "6px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ExternalLink size={12} />
                Open Cloudflare dashboard
              </a>
            )}
            {cdnFlash.status === "ok" && (
              <button
                type="button"
                onClick={() => setCdnFlash(null)}
                style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 0, fontSize: 12 }}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>

      {/* KV namespaces — list + per-namespace purge button. The KV API
          works reliably with the account token (unlike the Pages purge
          API which is blocked in some setups). Use this to clear the
          backend CACHE namespaces. */}
      {kvNamespaces && kvNamespaces.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.15)", color: "#86efac", flexShrink: 0 }}>
              <Database size={16} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>KV namespaces</div>
              <div style={{ fontSize: 12, color: "#a5a3b8", marginTop: 1 }}>
                Purge individual KV caches. Destructive — wipes all keys in the namespace. Requires explicit confirmation.
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {kvNamespaces.map((ns) => (
              <div
                key={ns.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                }}
                data-testid={`admin-kv-ns-${ns.id}`}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#ece4ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ns.title}</div>
                  <code style={{ fontSize: 10.5, color: "#777586", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{ns.id.slice(0, 16)}…</code>
                </div>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => purgeKv(ns)}
                  disabled={kvPurging === ns.id}
                  data-testid={`admin-kv-purge-${ns.id}`}
                  style={{ flexShrink: 0, fontSize: 12, padding: "6px 10px", background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  <Trash2 size={12} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                  {kvPurging === ns.id ? "Purging…" : "Purge"}
                </button>
              </div>
            ))}
          </div>
          {kvFlash && (
            <div
              className={`admin-banner ${kvFlash.status === "err" ? "admin-error" : ""}`}
              style={{
                marginTop: 12,
                ...(kvFlash.status === "err"
                  ? { background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)", color: "#fecaca" }
                  : { background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)", color: "#bbf7d0" }),
              }}
            >
              {kvFlash.status === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{kvFlash.message}</span>
            </div>
          )}
        </div>
      )}

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
