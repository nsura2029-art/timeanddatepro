// src/components/docs/CopyButton.tsx
// Copy-to-clipboard with a tiny visual swap. Accessible: aria-live announcement.

import React, { useState, useCallback } from "react";

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ value, label = "Copy", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be blocked — silently ignore.
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className={
        "inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 " +
        className
      }
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
