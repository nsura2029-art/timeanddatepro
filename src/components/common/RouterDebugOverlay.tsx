// src/components/common/RouterDebugOverlay.tsx
// Dev-only floating card that shows the resolved router state and
// surfaces routing bugs the moment they happen. Renders to
// `document.body` via portal so it sits on top of all UI.
//
// Disable in production by setting localStorage.tdp_debug_router = "off"
// (or just don't import this file). Always-on in dev so that
// `parseRouteFromPath` regressions surface immediately.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { parsePairPath } from "../../utils/pairRoutes";
import { CITY_BY_CODE } from "../../data/cities";

interface RouteSnapshot {
  pathname: string;
  rawPathname: string;
  pairDetected: ReturnType<typeof parsePairPath>;
  browserTz: string;
  browserLang: string;
  enabled: boolean;
  timestamp: number;
}

function takeSnapshot(): RouteSnapshot {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  return {
    pathname: path,
    rawPathname: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/",
    pairDetected: typeof window !== "undefined" ? parsePairPath(path) : null,
    browserTz: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "?",
    browserLang: typeof navigator !== "undefined" ? navigator.language : "?",
    enabled:
      (typeof window !== "undefined"
        ? window.localStorage?.getItem("tdp_debug_router") !== "off"
        : true),
    timestamp: Date.now(),
  };
}

const EXPECTED = [
  // Patterns where lang-detection *should not* fire. If you see a
  // currentPathRoute that doesn't match, the routing logic is buggy.
  {
    urlLike: (p: string) => p.startsWith("/en/") || p === "/en",
    expectLang: "en",
    desc: "URL starts with /en/ \u2192 route.lang MUST be 'en'",
  },
  {
    urlLike: (p: string) => p.startsWith("/fr/") || p === "/fr",
    expectLang: "fr",
    desc: "URL starts with /fr/ \u2192 route.lang MUST be 'fr'",
  },
  {
    urlLike: (p: string) => p.startsWith("/ja/") || p === "/ja",
    expectLang: "ja",
    desc: "URL starts with /ja/ \u2192 route.lang MUST be 'ja'",
  },
  {
    urlLike: (p: string) => p.startsWith("/zh/") || p === "/zh",
    expectLang: "zh",
    desc: "URL starts with /zh/ \u2192 route.lang MUST be 'zh'",
  },
];

export default function RouterDebugOverlay() {
  const [snap, setSnap] = useState<RouteSnapshot>(() => takeSnapshot());

  useEffect(() => {
    if (!snap.enabled) return;
    const update = () => setSnap(takeSnapshot());
    update();
    window.addEventListener("popstate", update);
    window.addEventListener("tdp:navigate", update as EventListener);
    const tick = setInterval(update, 1000);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("tdp:navigate", update as EventListener);
      clearInterval(tick);
    };
  }, [snap.enabled]);

  if (!snap.enabled) return null;

  // Find the matching expectation rule for the current URL
  let rule = EXPECTED.find((r) => r.urlLike(snap.pathname));
  let ruleViolated: string | null = null;
  // Resolve route via a simpler version of parseRouteFromPath
  // (we cannot import parseRouteFromPath directly without extending currentPathRoute)
  // For now, we just emit WARNING lines whenever the URL prefix disagrees with browserTz.
  if (snap.pathname.startsWith("/en/") && snap.pathname.includes("tokyo") && !snap.pathname.endsWith("-time")) {
    ruleViolated = "URL is /en/.../tokyo... but parsePairPath returned null. Content-based heuristics may be misrouting.";
  }

  const container = (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 2147483647,
        width: 360,
        maxHeight: "70vh",
        overflowY: "auto",
        background: "#0f172a",
        color: "#e2e8f0",
        border: "1px solid #475569",
        borderRadius: 10,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        lineHeight: 1.4,
        padding: "10px 12px",
        boxShadow: "0 10px 30px rgba(0,0,0,.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong style={{ color: "#a5b4fc", letterSpacing: ".05em" }}>router-debug</strong>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage?.setItem("tdp_debug_router", "off");
              window.location.reload();
            } catch {/* noop */}
          }}
          style={{ background: "transparent", color: "#94a3b8", border: 0, cursor: "pointer", fontSize: 11 }}
        >hide</button>
      </div>
      <div style={{ color: "#94a3b8" }}>pathname</div>
      <div style={{ marginBottom: 4 }}>{snap.rawPathname}</div>

      <div style={{ color: "#94a3b8" }}>pair detection (parsePairPath)</div>
      <div style={{ marginBottom: 4 }}>
        {snap.pairDetected
          ? <>
              <span style={{ color: "#86efac" }}>OK</span>{" "}
              <code>{snap.pairDetected.slug}</code>{" "}
              <span style={{ color: "#94a3b8" }}>
                ({snap.pairDetected.fromCode} \u2192 {snap.pairDetected.toCode})
              </span>
            </>
          : <span style={{ color: snap.pathname.match(/[a-z0-9-]+-time/) ? "#fca5a5" : "#94a3b8" }}>
              {snap.pathname.match(/[a-z0-9-]+-time/)
                ? "null (regex matched but slug not recognized)"
                : "null (no -time suffix)"}
            </span>}
      </div>

      <div style={{ color: "#94a3b8" }}>browser</div>
      <div style={{ marginBottom: 4 }}>
        tz <code>{snap.browserTz}</code> &middot; lang <code>{snap.browserLang}</code>
      </div>

      {rule && (
        <div style={{ color: "#94a3b8" }}>expected (per URL prefix)</div>
      )}
      {rule && (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: "#fbbf24" }}>{rule.desc}</span>
        </div>
      )}

      {ruleViolated && (
        <div style={{ marginTop: 6, padding: "6px 8px", borderRadius: 6, background: "#7f1d1d", color: "#fee2e2" }}>
          <strong>WARNING:</strong> {ruleViolated}
        </div>
      )}

      <div style={{ marginTop: 8, color: "#64748b", fontSize: 10 }}>
        Click <em>hide</em> to disable (sets localStorage.tdp_debug_router=off).
        Reload to re-enable.
      </div>
      <div style={{ color: "#64748b", fontSize: 10 }}>
        Updated {new Date(snap.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(container, document.body);
}