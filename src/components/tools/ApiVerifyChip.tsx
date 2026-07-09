// src/components/tools/ApiVerifyChip.tsx
// Floating pill that auto-fires the tool's corresponding /api/v1/* call and
// reports whether the API agrees with the tool's local computation.
//
// Design constraints (per SEO/ads analysis):
//   - Fixed position so it never shifts layout (zero CLS)
//   - Hidden until first verification completes — no visible state on first paint (no LCP hit)
//   - Idle = nothing rendered (the user's eye doesn't see anything extra)
//   - Click expands an inline panel showing the raw API response + a "View docs" link
//   - All fetches are debounced 250ms so typing isn't a network storm

import React, { useEffect, useRef, useState } from "react";
import { Check, X, AlertTriangle, Loader2, Code2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { ToolVerifyConfig } from "../../utils/apiToolMap";

export type ChipState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "match"; apiResponse: any; durationMs: number }
  | { kind: "drift"; apiResponse: any; durationMs: number; details: string }
  | { kind: "error"; status: number; message: string; durationMs: number };

export interface ApiVerifyChipProps {
  config: ToolVerifyConfig;
  state: any;
  /** Optional override of the API base URL (default: same-origin / current host). */
  apiBase?: string;
  /** Where to render the chip — defaults to absolute top-right. */
  position?: "top-right" | "bottom-right" | "inline";
  /** Optional label to show next to the state icon. */
  showLabel?: boolean;
  /** Debounce delay in ms (default 250). */
  debounceMs?: number;
}

const POSITION_CLASSES: Record<NonNullable<ApiVerifyChipProps["position"]>, string> = {
  "top-right":   "fixed top-20 right-4 z-30",
  "bottom-right":"fixed bottom-4 right-4 z-30",
  "inline":      "relative",
};

function defaultBase(): string {
  if (typeof window === "undefined") return "";
  // Same origin — Vite dev / Cloudflare Pages / Node static all serve /api/v1/*
  return "";
}

export default function ApiVerifyChip({
  config,
  state,
  apiBase = defaultBase(),
  position = "top-right",
  showLabel = true,
  debounceMs = 250,
}: ApiVerifyChipProps) {
  const [chip, setChip] = useState<ChipState>({ kind: "idle" });
  const [expanded, setExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastSigRef = useRef<string>("");

  // Build the signature (URL) from the current state. Memo so identical state
  // doesn't re-trigger fetches.
  const url = React.useMemo(() => {
    const params = config.buildParams(state);
    const qs = params.toString();
    return `${apiBase}${config.endpoint}${qs ? "?" + qs : ""}`;
  }, [apiBase, config, state]);

  // Run the verification whenever the signature changes.
  useEffect(() => {
    const sig = url;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setChip({ kind: "loading" });
    const timer = setTimeout(async () => {
      const t0 = performance.now();
      try {
        const res = await fetch(sig, { headers: { Accept: "application/json" }, signal: controller.signal });
        const body = await res.json();
        const dt = Math.round(performance.now() - t0);
        if (!res.ok || !body?.success) {
          setChip({
            kind: "error",
            status: res.status,
            message: body?.error?.message ?? res.statusText ?? "Request failed",
            durationMs: dt,
          });
          return;
        }
        const cmp = config.compare ? config.compare(body, state) : { match: true as const };
        if (cmp.match) {
          setChip({ kind: "match", apiResponse: body, durationMs: dt });
        } else {
          setChip({ kind: "drift", apiResponse: body, durationMs: dt, details: cmp.details ?? "Mismatch" });
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setChip({
          kind: "error",
          status: 0,
          message: e?.message ?? "Network error",
          durationMs: Math.round(performance.now() - t0),
        });
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, config, state, debounceMs]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // Render nothing while idle — first paint is uninterrupted.
  if (chip.kind === "idle") return null;

  const stateIcon = (() => {
    switch (chip.kind) {
      case "loading": return <Loader2 size={13} className="animate-spin text-slate-500" />;
      case "match":   return <Check size={13} className="text-emerald-600" />;
      case "drift":   return <AlertTriangle size={13} className="text-amber-600" />;
      case "error":   return <X size={13} className="text-rose-600" />;
    }
  })();

  const stateText = (() => {
    switch (chip.kind) {
      case "loading": return `Calling ${config.endpoint}…`;
      case "match":   return `Verified via ${config.endpoint} · ${chip.durationMs}ms`;
      case "drift":   return `Drift via ${config.endpoint} · ${chip.durationMs}ms`;
      case "error":   return `Error ${chip.status || "—"} via ${config.endpoint}`;
    }
  })();

  const statePill = (() => {
    const base = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur transition cursor-pointer";
    switch (chip.kind) {
      case "loading": return `${base} border-slate-200 bg-white/90 text-slate-700`;
      case "match":   return `${base} border-emerald-200 bg-emerald-50/95 text-emerald-700 hover:bg-emerald-100`;
      case "drift":   return `${base} border-amber-200 bg-amber-50/95 text-amber-700 hover:bg-amber-100`;
      case "error":   return `${base} border-rose-200 bg-rose-50/95 text-rose-700 hover:bg-rose-100`;
    }
  })();

  return (
    <div className={POSITION_CLASSES[position]}>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={statePill}
          aria-expanded={expanded}
          aria-label={`API verification for ${config.label}`}
        >
          {stateIcon}
          {showLabel && <span className="hidden sm:inline">{stateText}</span>}
          {showLabel ? (
            expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />
          ) : null}
        </button>

        {expanded && (
          <div className="w-[360px] max-w-[92vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Code2 size={12} className="text-slate-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {config.label} · {config.endpoint}
                </span>
              </div>
              {chip.kind === "drift" && "details" in chip && (
                <div className="mt-1 text-[11px] text-amber-700">⚠ {chip.details}</div>
              )}
              {chip.kind === "error" && (
                <div className="mt-1 text-[11px] text-rose-700">{chip.message}</div>
              )}
              <div className="mt-1 truncate font-mono text-[10px] text-slate-500" title={url}>
                {url.replace(/^https?:\/\/[^/]+/, "")}
              </div>
            </div>
            <pre className="max-h-72 overflow-auto bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
              {chip.kind === "loading" ? "…" :
               chip.kind === "error"   ? "(error)" :
               JSON.stringify(chip.apiResponse, null, 2)}
            </pre>
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2">
              <span className="text-[10px] text-slate-500">/api/v1 · live</span>
              <a
                href={config.docsHref}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Full docs <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Hook variant for places that want the chip data without rendering it. */
export function useApiVerify<T>(config: ToolVerifyConfig<T>, state: T, apiBase?: string) {
  const [chip, setChip] = useState<ChipState>({ kind: "idle" });
  useEffect(() => {
    let cancelled = false;
    const params = config.buildParams(state);
    const url = `${apiBase ?? ""}${config.endpoint}${params.toString() ? "?" + params : ""}`;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setChip({ kind: "loading" });
      const t0 = performance.now();
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
        const body = await res.json();
        if (cancelled) return;
        const dt = Math.round(performance.now() - t0);
        if (!res.ok || !body?.success) {
          setChip({ kind: "error", status: res.status, message: body?.error?.message ?? res.statusText, durationMs: dt });
        } else {
          const cmp = config.compare ? config.compare(body, state) : { match: true as const };
          setChip(cmp.match
            ? { kind: "match", apiResponse: body, durationMs: dt }
            : { kind: "drift", apiResponse: body, durationMs: dt, details: cmp.details ?? "Mismatch" });
        }
      } catch (e: any) {
        if (cancelled || e?.name === "AbortError") return;
        setChip({ kind: "error", status: 0, message: e?.message ?? "Network error", durationMs: 0 });
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [apiBase, config, state]);
  return chip;
}