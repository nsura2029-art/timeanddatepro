// src/routes/status.ts
// Health/status endpoint for all rate sources (for /en/status page).
// Returns per-source freshness + audit summary.

import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { ok } from "../lib/responses";

type Bindings = { DB: D1Database };
const status = new Hono<{ Bindings: Bindings }>();

status.get("/", async (c) => {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 24 * 3600;

  // Per-source freshness
  const sources: Record<string, any> = {};

  // Frankfurter
  const frankfurter = await c.env.DB.prepare(
    `SELECT MAX(fetched_at) as lastFetch, COUNT(DISTINCT base) as bases, COUNT(DISTINCT quote) as quotes
     FROM currency_rates_latest WHERE source = 'frankfurter'`
  ).first<{ lastFetch: number | null; bases: number; quotes: number }>();
  sources.frankfurter = {
    status: frankfurter?.lastFetch ? (now - frankfurter.lastFetch < 86400 ? "ok" : "stale") : "down",
    lastFetch: frankfurter?.lastFetch || null,
    age: frankfurter?.lastFetch ? now - frankfurter.lastFetch : null,
    pairsTracked: frankfurter ? frankfurter.bases * frankfurter.quotes : 0,
  };

  // AllRatesToday
  const art = await c.env.DB.prepare(
    `SELECT MAX(fetched_at) as lastFetch, COUNT(DISTINCT base) as bases, COUNT(DISTINCT quote) as quotes
     FROM currency_rates_latest WHERE source = 'allratestoday'`
  ).first<{ lastFetch: number | null; bases: number; quotes: number }>();
  sources.allratestoday = {
    status: art?.lastFetch ? (now - art.lastFetch < 600 ? "ok" : "degraded") : "down",
    lastFetch: art?.lastFetch || null,
    age: art?.lastFetch ? now - art.lastFetch : null,
    pairsTracked: art ? art.bases * art.quotes : 0,
  };

  // CoinGecko
  const cg = await c.env.DB.prepare(
    `SELECT MAX(fetched_at) as lastFetch, COUNT(*) as assets
     FROM crypto_prices_latest WHERE source = 'coingecko'`
  ).first<{ lastFetch: number | null; assets: number }>();
  sources.coingecko = {
    status: cg?.lastFetch ? (now - cg.lastFetch < 300 ? "ok" : "degraded") : "down",
    lastFetch: cg?.lastFetch || null,
    age: cg?.lastFetch ? now - cg.lastFetch : null,
    assetsTracked: cg?.assets || 0,
  };

  // 24h audit summary
  const audit = await c.env.DB.prepare(
    `SELECT COUNT(*) as checks, AVG(delta_pct) as avgDelta, MAX(delta_pct) as maxDelta,
            SUM(above) as aboveThreshold
     FROM rate_audit WHERE ts >= ?1`
  ).bind(oneDayAgo).first<{ checks: number; avgDelta: number; maxDelta: number; aboveThreshold: number }>();

  return ok(c, {
    timestamp: now,
    sources,
    audit: {
      last24h: audit && audit.checks > 0 ? {
        checks: audit.checks,
        avgDeltaPct: Number((audit.avgDelta || 0).toFixed(4)),
        maxDeltaPct: Number((audit.maxDelta || 0).toFixed(4)),
        aboveThreshold: audit.aboveThreshold || 0,
      } : null,
    },
  });
});

export { status as statusRouter };
