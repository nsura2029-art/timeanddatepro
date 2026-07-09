// src/components/tools/ToolSdkPanel.tsx
// Collapsible "Use the Node.js SDK" panel embedded at the bottom of every tool.
// Mirrors the design system: rounded-3xl white card, #3f51b5 accent, monospace
// labels. Tabbed between Node.js (install + copy-paste-ready call) and cURL.

import React, { useState } from "react";
import { Code2, ChevronDown, ChevronRight, Copy, Check, Terminal } from "lucide-react";

export interface ToolSdkPanelProps {
  /** What this tool does — short lead. */
  summary: string;
  /** Install command shown at the top. */
  installCmd?: string;
  /** Node.js code — the SDK invocation that reproduces this tool's API. */
  nodeCode: string;
  /** cURL counterpart. */
  curlCode: string;
  /** Endpoint slug the docs link should hit. */
  docsHref: string;
  /** Optional title override (default = "Use the Node.js SDK"). */
  title?: string;
}

const LANG_HINTS = {
  node: { label: "Node.js", icon: <Code2 size={13} className="text-emerald-500" /> },
  curl: { label: "cURL",    icon: <Terminal size={13} className="text-sky-500" /> },
} as const;

export default function ToolSdkPanel({
  summary,
  installCmd = "npm install @timeanddatepro/sdk",
  nodeCode,
  curlCode,
  docsHref,
  title = "Use the Node.js SDK",
}: ToolSdkPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"node" | "curl">("node");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab === "node" ? nodeCode : curlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* noop */}
  };

  const currentCode = tab === "node" ? nodeCode : curlCode;

  return (
    <section className="rounded-3xl border border-[#e0e0e0] bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-slate-50/60 transition text-left"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
          <Code2 size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-extrabold text-[#212121]">{title}</h3>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-emerald-700 uppercase">
              NEW
            </span>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">{summary}</p>
        </div>
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-[#e0e0e0] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
          {/* Install command + docs link */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] bg-white/70 px-6 py-3">
            <code className="font-mono text-[12px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
              {installCmd}
            </code>
            <a
              href={docsHref}
              className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Full API docs →
            </a>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-[#e0e0e0] px-6 py-2">
            <div className="flex items-center gap-1">
              {(["node", "curl"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  aria-pressed={tab === k}
                  className={
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition " +
                    (tab === k ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600")
                  }
                >
                  {LANG_HINTS[k].icon}
                  {LANG_HINTS[k].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
            >
              {copied ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>

          {/* Code block */}
          <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-slate-800 bg-slate-50/40">
            <code className="block whitespace-pre">{currentCode}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
