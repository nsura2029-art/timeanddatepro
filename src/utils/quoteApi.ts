// src/utils/quoteApi.ts
// Quote selector for the landing page quote section.
// Phase 1.5 will populate src/data/quotes/{lang}.ts with hand-curated 50 quotes per locale.

import type { Quote, QuoteTag } from "../types/quote";

/**
 * Pick a quote matching the current context.
 * Scoring:
 *   +2 for matching time-of-day tag
 *   +1 for matching day-of-week tag
 *   +1 for matching country tag
 *   +3 for matching holiday tag if today is a holiday
 * Fallback: any quote.
 * Avoids repeating the last-picked quote (tracked via lastQuoteId param).
 */
export function pickQuote(opts: {
  pool: Quote[];
  lastQuoteId?: string;
  now?: Date;
  countryTag?: string;
  isHoliday?: boolean;
}): Quote {
  const { pool, lastQuoteId, now = new Date(), countryTag, isHoliday = false } = opts;
  if (pool.length === 0) throw new Error("Empty quote pool");

  const hour = now.getHours();
  const tod: QuoteTag =
    hour < 5  ? "night" :
    hour < 12 ? "morning" :
    hour < 18 ? "afternoon" :
                "evening";
  const dow = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()] as QuoteTag;

  const candidates = pool.filter((q) => q.id !== lastQuoteId);
  const scored = candidates.map((q) => ({
    q,
    score:
      (q.tags.includes(tod) ? 2 : 0) +
      (q.tags.includes(dow) ? 1 : 0) +
      (countryTag && q.tags.includes(countryTag as QuoteTag) ? 1 : 0) +
      (isHoliday && q.tags.includes("holiday") ? 3 : 0),
  })).sort((a, b) => b.score - a.score || a.q.id.localeCompare(b.q.id));

  return scored[0].q;
}

/**
 * Score all quotes for a context, returning ranked candidates.
 * Useful for "give me the next 5 to choose from" UX.
 */
export function rankQuotes(opts: {
  pool: Quote[];
  now?: Date;
  countryTag?: string;
  isHoliday?: boolean;
  excludeIds?: string[];
  limit?: number;
}): Quote[] {
  const { pool, now = new Date(), countryTag, isHoliday = false, excludeIds = [], limit = 10 } = opts;
  const hour = now.getHours();
  const tod: QuoteTag =
    hour < 5  ? "night" :
    hour < 12 ? "morning" :
    hour < 18 ? "afternoon" :
                "evening";
  const dow = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()] as QuoteTag;

  return [...pool]
    .filter((q) => !excludeIds.includes(q.id))
    .map((q) => ({
      q,
      score:
        (q.tags.includes(tod) ? 2 : 0) +
        (q.tags.includes(dow) ? 1 : 0) +
        (countryTag && q.tags.includes(countryTag as QuoteTag) ? 1 : 0) +
        (isHoliday && q.tags.includes("holiday") ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.q.id.localeCompare(b.q.id))
    .slice(0, limit)
    .map((x) => x.q);
}