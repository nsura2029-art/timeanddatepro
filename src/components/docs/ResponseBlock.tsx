// src/components/docs/ResponseBlock.tsx
// Pretty-printed JSON viewer for endpoint response examples. Trivial JSON.stringify
// with 2-space indent — clarity over a heavyweight syntax highlighter.

import React from "react";
import CopyButton from "./CopyButton";

export interface ResponseBlockProps {
  data: unknown;
  label?: string;
  /** Optional `success` value override for the envelope (defaults to true). */
  success?: boolean;
}

function highlight(json: string): React.ReactNode {
  // Minimal JSON highlighter: keys (before colon), strings, numbers, booleans, null.
  const out: React.ReactNode[] = [];
  const tokens = json.split(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);
  let key = 0;
  tokens.forEach((t) => {
    if (!t) return;
    if (/^".*"$/.test(t) && !/^"(true|false|null)"$/.test(t)) {
      out.push(<span key={key++} className="text-emerald-700">{t}</span>);
    } else if (/^".*":$/.test(t)) {
      // key
      const m = t.match(/^"(.*)":$/);
      out.push(<span key={key++} className="text-sky-700">{`"${m![1]}":`}</span>);
    } else if (/^(true|false|null)$/.test(t)) {
      out.push(<span key={key++} className="text-fuchsia-700 font-semibold">{t}</span>);
    } else if (/^-?\d/.test(t)) {
      out.push(<span key={key++} className="text-amber-700">{t}</span>);
    } else {
      out.push(t);
    }
  });
  return out;
}

export default function ResponseBlock({ data, label = "Response 200", success = true }: ResponseBlockProps) {
  const sample = { success, data, meta: { endpoint: "/api/v1/...", version: "1.0.0", generatedAt: new Date().toISOString() } };
  const json = JSON.stringify(sample, null, 2);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 border border-emerald-200">
            200 OK
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        </div>
        <CopyButton value={json} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-slate-800">
        <code>{highlight(json)}</code>
      </pre>
    </div>
  );
}
