// src/utils/countryHistoryApi.ts
// Country-specific historical event lookup. Today in history for {country}
// on {date}. Filters the same Wikipedia /onthisday/ feed for events where
// the descriptive text mentions the country (or a curated alias list).
//
// Attribution: Wikipedia (CC BY-SA).
// Cache-Control: public, max-age=86400 (1 day per date).

import { fetchOnThisDay } from "./onthisdayApi";
import type { OnThisDayEvent, OnThisDayType } from "../types/onthisday";

/** Map of ISO 3166-1 alpha-2 → array of search aliases for that country.
 *  Curated — covers Wikipedia's variant naming. */
const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ["United States", "U.S.", "American", "America", "United States of America", "US", "USA"],
  GB: ["United Kingdom", "Britain", "British", "England", "English", "Scotland", "Welsh", "Wales", "Northern Ireland", "UK"],
  FR: ["France", "French", "Paris"],
  DE: ["Germany", "German", "Berlin", "Prussian", "Prussia", "Weimar", "Holy Roman Empire"],
  IT: ["Italy", "Italian", "Rome", "Roman", "Vatican", "Venice", "Florence", "Milan"],
  ES: ["Spain", "Spanish", "Madrid"],
  PT: ["Portugal", "Portuguese", "Lisbon"],
  JP: ["Japan", "Japanese", "Tokyo", "Hiroshima", "Nagasaki"],
  CN: ["China", "Chinese", "Beijing", "Peking", "Qing", "Ming", "Communist"],
  KR: ["Korea", "Korean", "Seoul"],
  IN: ["India", "Indian", "Delhi", "Mumbai", "Calcutta", "Gandhi"],
  BR: ["Brazil", "Brazilian", "Rio", "São Paulo", "Sao Paulo"],
  RU: ["Russia", "Russian", "Soviet", "USSR", "Moscow", "Putin", "Stalin", "Tsar"],
  AU: ["Australia", "Australian", "Sydney", "Melbourne"],
  CA: ["Canada", "Canadian", "Quebec", "Toronto", "Vancouver", "Ontario"],
  MX: ["Mexico", "Mexican", "Aztec", "Maya", "Tenochtitlan"],
  NL: ["Netherlands", "Dutch", "Holland", "Amsterdam"],
  SE: ["Sweden", "Swedish", "Stockholm"],
  NO: ["Norway", "Norwegian", "Oslo"],
  DK: ["Denmark", "Danish", "Copenhagen"],
  FI: ["Finland", "Finnish", "Helsinki"],
  PL: ["Poland", "Polish", "Warsaw", "Warsaw"],
  CH: ["Switzerland", "Swiss", "Geneva", "Zurich"],
  AT: ["Austria", "Austrian", "Vienna", "Habsburg"],
  GR: ["Greece", "Greek", "Athens", "Byzantine", "Sparta"],
  EG: ["Egypt", "Egyptian", "Cairo", "Pyramid", "Pharaoh", "Alexandria"],
  AR: ["Argentina", "Argentine", "Buenos Aires"],
  CL: ["Chile", "Chilean", "Santiago"],
  ZA: ["South Africa", "South African", "Cape Town", "Johannesburg", "Mandela", "Apartheid"],
  TR: ["Turkey", "Turkish", "Ottoman", "Istanbul", "Constantinople", "Ankara"],
  IL: ["Israel", "Israeli", "Jerusalem", "Tel Aviv", "Palestine", "Jewish"],
};

export interface CountryHistoryResult {
  country: string;
  countryCode: string;
  month: number;
  day: number;
  events: OnThisDayEvent[];
  births: OnThisDayEvent[];
  deaths: OnThisDayEvent[];
  attribution: "Wikipedia (CC BY-SA)";
}

/**
 * Filter "On This Day" events to those matching the given country.
 * Uses simple substring scan against the curated alias list.
 */
async function filterByCountry(items: OnThisDayEvent[], aliases: string[]): Promise<OnThisDayEvent[]> {
  // Lowercase once for performance
  const lowered = aliases.map((s) => s.toLowerCase());
  return items.filter((ev) => {
    const text = (ev.text ?? "").toLowerCase();
    return lowered.some((alias) => text.includes(alias));
  });
}

/** Public API: GET /api/v1/history/by-country?country=US[&month=7&day=4] */
export async function historyByCountry(opts: {
  country: string;
  month?: number;
  day?: number;
  limit?: number;
}): Promise<CountryHistoryResult> {
  const cc = opts.country.toUpperCase();
  const aliases = COUNTRY_ALIASES[cc] ?? [];
  const month = opts.month ?? new Date().getMonth() + 1;
  const day = opts.day ?? new Date().getDate();
  const limit = Math.max(1, Math.min(opts.limit ?? 12, 50));

  // Fetch the day's full feed once, then slice per type.
  const types: OnThisDayType[] = ["events", "births", "deaths"];
  const feeds: Record<OnThisDayType, OnThisDayEvent[]> = { events: [], births: [], deaths: [] };
  await Promise.all(
    types.map(async (type) => {
      const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/${type}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "TimeAndDatePro/1.0 (https://timeanddatepro.com) countryHistoryApi/1.0",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = (data[type] as OnThisDayEvent[]) ?? [];
        feeds[type] = await filterByCountry(items, aliases);
      } catch {
        // ignore — best-effort
      }
    })
  );

  // Apply limit per type
  (Object.keys(feeds) as OnThisDayType[]).forEach((k) => {
    feeds[k] = feeds[k].slice(0, limit);
  });

  return {
    country: aliases[0] ?? opts.country,
    countryCode: cc,
    month,
    day,
    events: feeds.events,
    births: feeds.births,
    deaths: feeds.deaths,
    attribution: "Wikipedia (CC BY-SA)",
  };
}

export function listSupportedCountries(): string[] {
  return Object.keys(COUNTRY_ALIASES).sort();
}
