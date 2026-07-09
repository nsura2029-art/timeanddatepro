// src/utils/useNavigateToPair.ts
// SPA-aware navigation hook for pair clicks. Routes a PairSuggestion to
// /<lang>/<from>-to-<to>-time (the dedicated pair page in Phase 3,
// Commit B). In Commit A (this commit), the route doesn't exist yet \u2014
// we navigate to the converter with ?cities=... as a working seed, so
// the link never lands on a dead URL regardless of when the dedicated
// route is wired up. Commit B swaps the URL target to the dedicated
// route in one place.

import { useCallback } from "react";
import type { PairSuggestion } from "./pairTargets";

export function pairHrefForLang(p: PairSuggestion, lang: string): string {
  return `/${lang}/${p.slug}`;
}

export function converterHrefForLang(fromCode: string, toCode: string, lang: string): string {
  return `/${lang}/time-zone-converter?cities=${fromCode},${toCode}`;
}

export function useNavigateToPair(lang: string) {
  return useCallback(
    (pair: PairSuggestion) => {
      if (typeof window === "undefined") return;
      // Phase 3 Commit B: dedicated pair route is now wired.
      const target = pairHrefForLang(pair, lang);
      window.history.pushState(null, "", target);
      window.dispatchEvent(new Event("tdp:navigate"));
    },
    [lang]
  );
}