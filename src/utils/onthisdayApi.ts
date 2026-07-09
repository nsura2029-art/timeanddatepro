// src/utils/onthisdayApi.ts
// "On This Day" historical events, births, deaths.
// Wraps Wikipedia's REST API: https://en.wikipedia.org/api/rest_v1/feed/onthisday/{type}/{MM}/{DD}
//
// Source: Wikipedia REST API (free, no key, attribution required: CC BY-SA).
// Cache-Control: public, max-age=86400 (1 day per date).

import type { OnThisDayEvent, OnThisDayFeed, OnThisDayType } from "../types/onthisday";

const WIKI_BASE = "https://en.wikipedia.org/api/rest_v1/feed/onthisday";

/**
 * Fetch "On This Day" entries from Wikipedia for a given month/day.
 * Returns events + births + deaths combined, sorted by year (most recent first).
 *
 * @param month 1-12
 * @param day 1-31
 * @param limit per-section cap (Wikipedia returns up to ~60 per section)
 *
 * @example
 *   onThisDay(7, 9)  // July 9 — Independence Day stuff, etc.
 */
export async function fetchOnThisDay(month: number, day: number, limit = 20): Promise<OnThisDayFeed> {
  const types: OnThisDayType[] = ["events", "births", "deaths"];
  const feeds = await Promise.all(
    types.map(async (type) => {
      const url = `${WIKI_BASE}/${type}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "TimeAndDatePro/1.0 (https://timeanddatepro.com)",
          "Api-User-Agent": "TimeAndDatePro/1.0 (https://timeanddatepro.com)",
        },
      });
      if (!res.ok) {
        throw new Error(`Wikipedia ${type} API ${res.status}`);
      }
      const data = await res.json();
      const raw = (data[type] as OnThisDayEvent[]) ?? [];
      return { type, events: raw.slice(0, limit) };
    })
  );

  const result: OnThisDayFeed = { events: [], births: [], deaths: [], month, day, attribution: "Wikipedia (CC BY-SA)" };
  for (const { type, events } of feeds) {
    result[type] = events;
  }
  return result;
}

/**
 * Format OnThisDayEvent into a short, presentable string.
 */
export function formatOnThisDay(ev: OnThisDayEvent): string {
  const year = ev.year < 0 ? `${Math.abs(ev.year)} BC` : `${ev.year}`;
  return `${year} — ${ev.text}`;
}

/**
 * Curated "Today in history" headlines for the landing page news section.
 * Picks the most notable 3-5 entries from each category.
 */
export function selectHeadlines(feed: OnThisDayFeed): { events: OnThisDayEvent[]; births: OnThisDayEvent[]; deaths: OnThisDayEvent[] } {
  // Heuristic: prefer events with longer text (more substantive), favor recent years (more relatable)
  const rank = (a: OnThisDayEvent, b: OnThisDayEvent) => {
    const aScore = a.text.length + (a.year > 1900 ? 100 : 0);
    const bScore = b.text.length + (b.year > 1900 ? 100 : 0);
    return bScore - aScore;
  };
  return {
    events: [...feed.events].sort(rank).slice(0, 3),
    births: [...feed.births].sort(rank).slice(0, 2),
    deaths: [...feed.deaths].sort(rank).slice(0, 2),
  };
}