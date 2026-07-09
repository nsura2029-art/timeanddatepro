// src/components/docs/CodeTabs.tsx
// Language-tabbed code block. Only ships Node.js + cURL today but the shape
// is multi-lang-ready (pass any number of samples; render the first as default).
//
// Uses <pre> with a tiny tokenizer for line numbers so long snippets stay readable
// and so a high-contrast text/bg is preserved regardless of host theme.

import React, { useState } from "react";
import CopyButton from "./CopyButton";

export interface CodeSample {
  lang: "node" | "curl" | "python";
  label: string;
  code: string;
}

export interface CodeTabsProps {
  samples: CodeSample[];
  /** Optional tab label override, e.g. "SDK" vs "cURL". Falls back to sample.label. */
  defaultLang?: CodeSample["lang"];
  title?: string;
  /** Compact = smaller padding (used inside tool panels). */
  compact?: boolean;
}

const LANG_HINTS: Record<CodeSample["lang"], string> = {
  node: "JavaScript / TypeScript",
  curl: "cURL (shell)",
  python: "Python",
};

function highlight(code: string, lang: CodeSample["lang"]): React.ReactNode {
  if (lang === "curl") {
    // Very small tokenizer: command, flags, urls, strings
    const tokens = code.split(/(\s+|"[^"]*"|'[^']*'|https?:\/\/\S+)/g);
    return tokens.map((t, i) => {
      if (!t) return null;
      if (/^\s+$/.test(t)) return t;
      if (/^["']/.test(t)) return <span key={i} className="text-emerald-700">{t}</span>;
      if (/^https?:/.test(t)) return <span key={i} className="text-sky-600">{t}</span>;
      if (/^curl$/.test(t)) return <span key={i} className="text-fuchsia-700 font-semibold">{t}</span>;
      if (/^-/.test(t)) return <span key={i} className="text-amber-700">{t}</span>;
      return <span key={i} className="text-slate-700">{t}</span>;
    });
  }
  // node / ts — comment, string, keywords, numbers
  const out: React.ReactNode[] = [];
  const lines = code.split("\n");
  lines.forEach((line, lineIdx) => {
    const tokens = line.split(/(\/\/.*$|"[^"]*"|'[^']*'|`[^`]*`|\b(?:import|from|const|let|var|function|return|await|async|new|export|default|if|else|class|interface|type|extends|implements)\b)/g);
    tokens.forEach((t, ti) => {
      if (!t) return;
      if (/^\s+$/.test(t)) out.push(t);
      else if (/^\/\//.test(t)) out.push(<span key={`${lineIdx}-${ti}`} className="text-slate-400 italic">{t}</span>);
      else if (/^["'`].*["'`]$/.test(t)) out.push(<span key={`${lineIdx}-${ti}`} className="text-emerald-700">{t}</span>);
      else if (/^(import|from|const|let|var|function|return|await|async|new|export|default|class|interface|type|extends|implements)$/.test(t))
        out.push(<span key={`${lineIdx}-${ti}`} className="text-fuchsia-700 font-semibold">{t}</span>);
      else if (/^\d+$/.test(t)) out.push(<span key={`${lineIdx}-${ti}`} className="text-amber-700">{t}</span>);
      else out.push(<span key={`${lineIdx}-${ti}`} className="text-slate-800">{t}</span>);
    });
    if (lineIdx < lines.length - 1) out.push("\n");
  });
  return out;
}

export default function CodeTabs({ samples, defaultLang, title, compact = false }: CodeTabsProps) {
  const initial = defaultLang && samples.find((s) => s.lang === defaultLang)
    ? defaultLang
    : samples[0]?.lang ?? "node";
  const [active, setActive] = useState<CodeSample["lang"]>(initial);
  const current = samples.find((s) => s.lang === active) ?? samples[0];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-sm">
      {(title || samples.length > 1) && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-3 py-1.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {samples.map((s) => {
              const isActive = s.lang === active;
              return (
                <button
                  key={s.lang}
                  type="button"
                  onClick={() => setActive(s.lang)}
                  className={
                    "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition " +
                    (isActive
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600")
                  }
                  aria-pressed={isActive}
                  title={LANG_HINTS[s.lang]}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <CopyButton value={current.code} />
        </div>
      )}
      {!samples.length || samples.length === 1 ? (
        <div className="flex justify-end border-b border-slate-200 bg-white/60 px-3 py-1.5">
          <CopyButton value={samples[0]?.code ?? ""} />
        </div>
      ) : null}
      <pre
        className={
          "overflow-x-auto font-mono leading-relaxed text-slate-900 " +
          (compact ? "p-3 text-[12px]" : "p-4 text-[13px]")
        }
      >
        <code>{current && highlight(current.code, current.lang)}</code>
      </pre>
    </div>
  );
}
