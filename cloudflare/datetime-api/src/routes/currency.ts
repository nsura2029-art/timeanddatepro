// src/routes/currency.ts
// Currency API endpoints (Phase 6.5) — fiat rates, convert, pair detail,
// timeseries, bulk, codes. Backed by Frankfurter (primary history) +
// AllRatesToday (real-time) with D1 cache fallback.

import { Hono } from "hono";
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { ok, err } from "../lib/responses";
import { fetchFrankfurterLatest, fetchFrankfurterHistory, fetchFiatLatestWithFallback } from "../lib/upstream";
import { fetchOpenERApiLatest } from "../lib/upstream";

type Bindings = { DB: D1Database; CACHE: KVNamespace };
const currency = new Hono<{ Bindings: Bindings }>();

interface CurrencyCode {
  code: string;
  name: string;
  symbol: string;
  flag: string | null;
  decimals: number;
}

interface RatesLatest {
  rates: Record<string, number>;
  source: string;
  stale: boolean;
  timestamp: number;
}

function isValidCode(s: string): boolean {
  return typeof s === "string" && /^[A-Z]{3}$/.test(s);
}

function isValidAmount(n: any): boolean {
  const num = Number(n);
  return Number.isFinite(num) && num >= 0 && num <= 1e15;
}

function isValidDate(s: string): boolean {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

// ── GET /api/v1/currency/codes ──
currency.get("/codes", async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      `SELECT code, name, symbol, flag, decimals FROM currency_codes
       WHERE is_active = 1 ORDER BY sort_order ASC, code ASC`
    ).all<CurrencyCode>();
    const list = (rows.results || []).map((r) => ({
      code: r.code, name: r.name, symbol: r.symbol, flag: r.flag, decimals: r.decimals,
    }));
    return ok(c, { count: list.length, codes: list });
  } catch (e: any) {
    return err(c, 500, `codes_unavailable: ${e?.message || "unknown"}`, "db_error");
  }
});

// ── GET /api/v1/currency/rates?base=USD ──
currency.get("/rates", async (c) => {
  const base = (c.req.query("base") || "USD").toUpperCase();
  if (!isValidCode(base)) return err(c, 400, "base must be a 3-letter currency code", "invalid_base");

  // Try KV cache (5min TTL)
  const kvKey = `rates:${base}`;
  const cached = await c.env.CACHE?.get(kvKey, "json").catch(() => null);
  if (cached) {
    return ok(c, { ...(cached as RatesLatest), stale: false });
  }

  // Try D1
  const d1Rows = await c.env.DB.prepare(
    `SELECT quote, rate, source, fetched_at FROM currency_rates_latest WHERE base = ?1`
  ).bind(base).all<{ quote: string; rate: number; source: string; fetched_at: number }>();

  if (d1Rows.results && d1Rows.results.length > 0) {
    const now = Math.floor(Date.now() / 1000);
    const freshest = Math.max(...d1Rows.results.map((r) => r.fetched_at));
    const age = now - freshest;
    const isStale = age > 24 * 3600; // 24h
    const rates: Record<string, number> = {};
    let source = "d1_cache";
    for (const r of d1Rows.results) rates[r.quote] = r.rate;
    const data: RatesLatest = { rates, source, stale: isStale, timestamp: freshest };
    if (!isStale) await c.env.CACHE?.put(kvKey, JSON.stringify(data), { expirationTtl: 300 });
    return ok(c, data);
  }

  // Fall back to upstream
  const result = await fetchFiatLatestWithFallback(base, c.env.CACHE);
  if (!result.ok) return err(c, 503, `all_sources_unavailable: ${result.error}`, "upstream_down");

  const data: RatesLatest = result.data!;
  // Persist to D1 (best effort)
  const now = Math.floor(Date.now() / 1000);
  const expires = now + 24 * 3600;
  for (const [quote, rate] of Object.entries(data.rates)) {
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO currency_rates_latest (base, quote, rate, source, fetched_at, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    ).bind(base, quote, rate, data.source, now, expires).run().catch(() => {});
  }
  await c.env.CACHE?.put(kvKey, JSON.stringify(data), { expirationTtl: 300 });
  return ok(c, data);
});

// ── GET /api/v1/currency/convert?from=USD&to=EUR&amount=100 ──
currency.get("/convert", async (c) => {
  const from = (c.req.query("from") || "").toUpperCase();
  const to = (c.req.query("to") || "").toUpperCase();
  const amount = c.req.query("amount");
  if (!from) return err(c, 400, "from required", "missing_from");
  if (!to) return err(c, 400, "to required", "missing_to");
  if (amount === undefined) return err(c, 400, "amount required", "missing_amount");
  if (!isValidCode(from)) return err(c, 400, "from must be a 3-letter currency code", "invalid_from");
  if (!isValidCode(to)) return err(c, 400, "to must be a 3-letter currency code", "invalid_to");
  if (!isValidAmount(amount)) return err(c, 400, "amount must be a non-negative number", "invalid_amount");

  // Same currency
  if (from === to) {
    return ok(c, {
      from, to, amount: Number(amount), result: Number(amount), rate: 1,
      timestamp: Math.floor(Date.now() / 1000), source: "identity", stale: false,
    });
  }

  // Try direct rate
  let row = await c.env.DB.prepare(
    `SELECT rate, source, fetched_at FROM currency_rates_latest WHERE base = ?1 AND quote = ?2`
  ).bind(from, to).first<{ rate: number; source: string; fetched_at: number }>();

  // Try inverse
  if (!row) {
    const inv = await c.env.DB.prepare(
      `SELECT rate, source, fetched_at FROM currency_rates_latest WHERE base = ?1 AND quote = ?2`
    ).bind(to, from).first<{ rate: number; source: string; fetched_at: number }>();
    if (inv) row = { rate: 1 / inv.rate, source: inv.source, fetched_at: inv.fetched_at };
  }

  // Fall back to upstream
  if (!row) {
    const fetched = await fetchFiatLatestWithFallback(from, c.env.CACHE);
    if (fetched.ok && fetched.data!.rates[to]) {
      row = { rate: fetched.data!.rates[to], source: fetched.data!.source, fetched_at: fetched.data!.timestamp };
    } else {
      // Try via USD bridge
      const usdFrom = await fetchFiatLatestWithFallback("USD", c.env.CACHE);
      if (usdFrom.ok) {
        const fromUsd = usdFrom.data!.rates[from];
        const toUsd = usdFrom.data!.rates[to];
        if (fromUsd && toUsd) row = { rate: toUsd / fromUsd, source: "usd_bridge", fetched_at: usdFrom.data!.timestamp };
      }
    }
    if (!row) return err(c, 503, `no_rate_available_for_${from}_${to}`, "rate_unavailable");
  }

  const now = Math.floor(Date.now() / 1000);
  const isStale = now - row.fetched_at > 24 * 3600;
  const result = Number((Number(amount) * row.rate).toPrecision(12));
  return ok(c, {
    from, to, amount: Number(amount), result, rate: row.rate,
    timestamp: row.fetched_at, source: row.source, stale: isStale,
  });
});

// ── GET /api/v1/currency/pair?from=USD&to=EUR ──
currency.get("/pair", async (c) => {
  const from = (c.req.query("from") || "").toUpperCase();
  const to = (c.req.query("to") || "").toUpperCase();
  if (!isValidCode(from) || !isValidCode(to)) return err(c, 400, "from and to must be 3-letter codes", "invalid_codes");
  if (from === to) {
    return ok(c, {
      from, to, rate: 1, timestamp: Math.floor(Date.now() / 1000),
      change: { "24h": 0, "24hPct": 0, "7d": 0, "7dPct": 0, "30d": 0, "30dPct": 0 },
      chart: [{ date: new Date().toISOString().slice(0, 10), rate: 1 }],
      source: "identity", stale: false,
    });
  }
  // Get current rate (D1 → upstream, same logic as /convert)
  let rateData: { rate: number; source: string; timestamp: number; stale: boolean } | null = null;
  let row = await c.env.DB.prepare(
    `SELECT rate, source, fetched_at FROM currency_rates_latest WHERE base = ?1 AND quote = ?2`
  ).bind(from, to).first<{ rate: number; source: string; fetched_at: number }>();
  if (!row) {
    const inv = await c.env.DB.prepare(
      `SELECT rate, source, fetched_at FROM currency_rates_latest WHERE base = ?1 AND quote = ?2`
    ).bind(to, from).first<{ rate: number; source: string; fetched_at: number }>();
    if (inv) row = { rate: 1 / inv.rate, source: inv.source, fetched_at: inv.fetched_at };
  }
  if (row) {
    const now = Math.floor(Date.now() / 1000);
    rateData = { rate: row.rate, source: row.source, timestamp: row.fetched_at, stale: now - row.fetched_at > 86400 };
  } else {
    const direct = await fetchFiatLatestWithFallback(from, c.env.CACHE);
    if (direct.ok && direct.data!.rates[to]) {
      rateData = { rate: direct.data!.rates[to], source: direct.data!.source, timestamp: direct.data!.timestamp, stale: false };
    }
  }
  if (!rateData) return err(c, 503, `no_rate_available_for_${from}_${to}`, "rate_unavailable");

  // Get 30-day history (D1 first, upstream fallback) — Refactor #5 (was upstream-only, broke from Worker)
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  let chart: { date: string; rate: number }[] = [];
  const d1Hist = await c.env.DB.prepare(
    `SELECT date, rate FROM currency_rates_history
     WHERE base = ?1 AND quote = ?2 AND date >= ?3 AND date <= ?4
     ORDER BY date ASC`
  ).bind(from, to, start, end).all<{ date: string; rate: number }>();
  if (d1Hist.results && d1Hist.results.length > 0) {
    chart = d1Hist.results;
  } else {
    const hist = await fetchFrankfurterHistory(from, to, start, end);
    chart = (hist.ok && hist.data) ? hist.data : [];
  }
  const currentRate = rateData.rate;
  const change24h = chart.length >= 2 ? currentRate - chart[chart.length - 2].rate : 0;
  const change7d = chart.length >= 8 ? currentRate - chart[chart.length - 8].rate : 0;
  const change30d = chart.length >= 1 ? currentRate - chart[0].rate : 0;
  return ok(c, {
    from, to,
    rate: currentRate,
    timestamp: rateData.timestamp,
    change: {
      "24h": Number(change24h.toFixed(6)),
      "24hPct": chart.length >= 2 ? Number((change24h / chart[chart.length - 2].rate * 100).toFixed(2)) : 0,
      "7d": Number(change7d.toFixed(6)),
      "7dPct": chart.length >= 8 ? Number((change7d / chart[chart.length - 8].rate * 100).toFixed(2)) : 0,
      "30d": Number(change30d.toFixed(6)),
      "30dPct": chart.length >= 1 ? Number((change30d / chart[0].rate * 100).toFixed(2)) : 0,
    },
    chart,
    source: rateData.source,
    stale: rateData.stale || false,
  });
});

// ── GET /api/v1/currency/timeseries?from=USD&to=EUR&start=2026-01-01&end=2026-07-12 ──
currency.get("/timeseries", async (c) => {
  const from = (c.req.query("from") || "").toUpperCase();
  const to = (c.req.query("to") || "").toUpperCase();
  const start = c.req.query("start") || "";
  const end = c.req.query("end") || "";
  if (!isValidCode(from) || !isValidCode(to)) return err(c, 400, "from and to must be 3-letter codes", "invalid_codes");
  if (!isValidDate(start) || !isValidDate(end)) return err(c, 400, "start/end must be YYYY-MM-DD", "invalid_date_format");
  if (start > end) return err(c, 400, "start must be <= end", "start_after_end");
  // Limit range to 5 years for performance
  const daysDiff = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (daysDiff > 365 * 5) return err(c, 400, "range cannot exceed 5 years", "range_too_large");

  if (from === to) {
    return ok(c, { from, to, start, end, count: 1, source: "identity", series: [{ date: start, rate: 1 }] });
  }
  // Try D1 history first (fast, no upstream call)
  const d1Hist = await c.env.DB.prepare(
    `SELECT date, rate FROM currency_rates_history
     WHERE base = ?1 AND quote = ?2 AND date >= ?3 AND date <= ?4
     ORDER BY date ASC`
  ).bind(from, to, start, end).all<{ date: string; rate: number }>();
  if (d1Hist.results && d1Hist.results.length > 0) {
    return ok(c, { from, to, start, end, count: d1Hist.results.length, source: "d1_history", series: d1Hist.results });
  }
  // Fall back to upstream
  const result = await fetchFrankfurterHistory(from, to, start, end);
  if (!result.ok) return err(c, 503, `upstream_unavailable: ${result.error}`, "upstream_down");
  return ok(c, {
    from, to, start, end, count: result.data!.length, source: result.source!, series: result.data!,
  });
});

// ── POST /api/v1/currency/bulk ──
currency.post("/bulk", async (c) => {
  let body: any;
  try { body = await c.req.json(); } catch { return err(c, 400, "Invalid JSON body", "invalid_json"); }
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!items) return err(c, 400, "items array required", "missing_items");
  if (items.length === 0) return err(c, 400, "items array must not be empty", "empty_items");
  if (items.length > 100) return err(c, 400, "max 100 items per request", "too_many_items");

  const results: any[] = [];
  for (const item of items) {
    const amount = item?.amount;
    const from = String(item?.from || "").toUpperCase();
    const to = String(item?.to || "").toUpperCase();
    if (!isValidCode(from) || !isValidCode(to)) {
      results.push({ from, to, amount, result: null, error: "invalid_codes" });
      continue;
    }
    if (!isValidAmount(amount)) {
      results.push({ from, to, amount, result: null, error: "invalid_amount" });
      continue;
    }
    if (from === to) {
      results.push({ from, to, amount: Number(amount), result: Number(amount), rate: 1, error: null });
      continue;
    }
    // Fetch rate
    const row = await c.env.DB.prepare(
      `SELECT rate FROM currency_rates_latest WHERE base = ?1 AND quote = ?2`
    ).bind(from, to).first<{ rate: number }>();
    if (!row) {
      const fetched = await fetchFiatLatestWithFallback(from, c.env.CACHE);
      if (fetched.ok && fetched.data!.rates[to]) {
        const r = fetched.data!.rates[to];
        results.push({ from, to, amount: Number(amount), result: Number((Number(amount) * r).toPrecision(12)), rate: r, error: null });
      } else {
        results.push({ from, to, amount: Number(amount), result: null, error: "rate_unavailable" });
      }
    } else {
      results.push({ from, to, amount: Number(amount), result: Number((Number(amount) * row.rate).toPrecision(12)), rate: row.rate, error: null });
    }
  }
  return ok(c, {
    count: results.length,
    successCount: results.filter((r) => !r.error).length,
    results,
  });
});

export { currency as currencyRouter };
