// src/utils/newsApi.ts
// RSS-driven news aggregator. Wraps rss-parser (zero-config) with a small
// in-process LRU cache so popular endpoints (e.g. /news/by-country?country=US)
// don't re-fetch on every call.
//
// Sources: curates public RSS feeds in src/data/news/newsFeeds.ts.
// Cache-Control: max-age=900 (15 minutes) — most feeds refresh every
// 5-30 min upstream; we cache for the typical news shelf life of 15 min.

import Parser from "rss-parser";
import { NEWS_FEEDS, feedsForCategory, feedsForCountry } from "../data/news/newsFeeds";
import type { NewsFeed } from "../types/newsFeed";

const parser = new Parser({
  timeout: 8_000,
  headers: {
    "User-Agent": "TimeAndDatePro/1.0 (https://timeanddatepro.com) newsApi/1.0",
  },
});

const TTL_MS = 15 * 60 * 1000; // 15 min

interface Cached {
  fetchedAt: number;
  feed: NewsFeed;
  items: NormalizedItem[];
}

export interface NormalizedItem {
  title: string;
  link: string;
  pubDate: string | null;       // ISO if parseable
  pubDateRaw: string | null;
  description: string;
  source: {
    id: string;
    name: string;
    homepage: string;
    attribution: string;
    country?: string;
    category?: string;
    language?: string;
  };
  guid: string;
}

const cache = new Map<string, Cached>();
const inflight = new Map<string, Promise<Cached>>();

function parseDateSafe(s?: string): string | null {
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function normalize(item: any, feed: NewsFeed): NormalizedItem {
  const title = String(item.title ?? "").trim();
  const link = String(item.link ?? "").trim();
  const pubDateRaw = String(item.pubDate ?? item.isoDate ?? "").trim();
  const description = String(
    item.contentSnippet ?? item.summary ?? item.content ?? ""
  )
    .replace(/<[^>]+>/g, "")
    .slice(0, 400);

  const dedupe = String(item.guid ?? `${link}#${title}`).trim();
  return {
    title,
    link,
    pubDate: parseDateSafe(pubDateRaw),
    pubDateRaw: pubDateRaw || null,
    description,
    source: {
      id: feed.id,
      name: feed.name,
      homepage: feed.homepage,
      attribution: feed.attribution,
      country: feed.country,
      category: feed.category,
      language: feed.language,
    },
    guid: dedupe,
  };
}

/** Fetch and parse a single RSS feed, with caching. */
export async function fetchFeed(feed: NewsFeed): Promise<Cached> {
  const cached = cache.get(feed.id);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;
  const inFlight = inflight.get(feed.id);
  if (inFlight) return inFlight;

  const p = (async () => {
    try {
      const result = await parser.parseURL(feed.url);
      const items = (result.items ?? [])
        .map((it) => normalize(it, feed))
        .filter((it) => it.title && it.link);
      const entry: Cached = {
        fetchedAt: Date.now(),
        feed,
        items,
      };
      cache.set(feed.id, entry);
      return entry;
    } catch (err) {
      // Last-good cache fallback
      if (cached) {
        return cached;
      }
      const empty: Cached = {
        fetchedAt: Date.now(),
        feed,
        items: [],
      };
      cache.set(feed.id, empty);
      return empty;
    } finally {
      inflight.delete(feed.id);
    }
  })();
  inflight.set(feed.id, p);
  return p;
}

/**
 * Aggregate items across multiple feeds, dedupe by guid, sort by date desc.
 */
async function aggregate(feeds: NewsFeed[], limit: number): Promise<{
  fetchedAt: string;
  sources: NewsFeed[];
  items: NormalizedItem[];
  attribution: string[];
}> {
  const results = await Promise.all(feeds.map((f) => fetchFeed(f)));
  const all: NormalizedItem[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    for (const it of r.items) {
      if (seen.has(it.guid)) continue;
      seen.add(it.guid);
      all.push(it);
    }
  }
  all.sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
  return {
    fetchedAt: new Date().toISOString(),
    sources: feeds,
    items: all.slice(0, limit),
    attribution: Array.from(new Set(feeds.map((f) => f.attribution))),
  };
}

/** Public API: GET /api/v1/news/by-country */
export async function newsByCountry(country: string, limit = 12): Promise<Awaited<ReturnType<typeof aggregate>>> {
  const feeds = feedsForCountry(country);
  return aggregate(feeds, limit);
}

/** Public API: GET /api/v1/news/by-category */
export async function newsByCategory(category: string, limit = 12): Promise<Awaited<ReturnType<typeof aggregate>>> {
  const feeds = feedsForCategory(category);
  if (feeds.length === 0) {
    // Empty result is fine — return an empty list with a clear meta
    return {
      fetchedAt: new Date().toISOString(),
      sources: [],
      items: [],
      attribution: [],
    };
  }
  return aggregate(feeds, limit);
}

/** Aggregated global top headlines (all feeds combined). */
export async function newsGlobal(limit = 20): Promise<Awaited<ReturnType<typeof aggregate>>> {
  return aggregate(NEWS_FEEDS, limit);
}

/** Clear the in-memory cache (used by admin triggers in Phase E). */
export function _internalClearNewsCache(): void {
  cache.clear();
}

/** List of feeds available — for admin observability. */
export function listFeeds(): NewsFeed[] {
  return NEWS_FEEDS;
}
