// src/lib/upstream.ts
// Upstream rate providers for the Currency API. Each provider exposes:
//   - fetchLatest(base): Promise<Record<quote, rate>>
//   - fetchHistory(base, quote, start, end): Promise<{date, rate}[]>
//   - fetchCrypto(ids, vs): Promise<Record<id, {price, change24h, ...}>>
//
// Fallback chain:
//   fiat live:  AllRatesToday -> Frankfurter (if ARI is down) -> D1 cache
//   fiat hist:  Frankfurter -> D1 cache
//   crypto:     CoinGecko -> D1 cache
//
// All fetches have a hard 4s timeout via AbortController. On any error,
// the caller should fall through to the next provider.

export interface UpstreamResult<T> {
  ok: boolean;
  data?: T;
  source?: string;
  error?: string;
  status?: number;
}

const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── Frankfurter (free, unlimited, ECB daily, 33 currencies, history 1999+) ──
const FRANKFURTER = "https://api.frankfurter.dev/v2";

export async function fetchFrankfurterLatest(base: string): Promise<UpstreamResult<Record<string, number>>> {
  try {
    const r = await fetchWithTimeout(`${FRANKFURTER}/latest?base=${encodeURIComponent(base)}`);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, status: r.status };
    const j: any = await r.json();
    return { ok: true, data: j.rates || {}, source: "frankfurter" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

export async function fetchFrankfurterHistory(
  base: string,
  quote: string,
  start: string,
  end: string
): Promise<UpstreamResult<{ date: string; rate: number }[]>> {
  try {
    const url = `${FRANKFURTER}/${start}..${end}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`;
    const r = await fetchWithTimeout(url);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, status: r.status };
    const j: any = await r.json();
    const series = Object.entries(j.rates || {}).map(([date, rates]: [string, any]) => ({
      date,
      rate: rates[quote] ?? 0,
    }));
    series.sort((a, b) => a.date.localeCompare(b.date));
    return { ok: true, data: series, source: "frankfurter" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

// ── AllRatesToday (free tier, 60s real-time, 160+ currencies, no key needed) ──
// Endpoint: https://api.allratestoday.com/v1/latest?base=USD (illustrative)
const ALLRATES_TODAY = "https://api.allratestoday.com/v1";

export async function fetchAllRatesTodayLatest(base: string): Promise<UpstreamResult<Record<string, number>>> {
  try {
    const r = await fetchWithTimeout(`${ALLRATES_TODAY}/latest?base=${encodeURIComponent(base)}`);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, status: r.status };
    const j: any = await r.json();
    return { ok: true, data: j.rates || {}, source: "allratestoday" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

// ── CoinPaprika (free, 25k req/day, 1000+ crypto, no key) ──
// Replaces CoinGecko (returns HTTP 403 from CF Worker context).
// CoinPaprika works reliably from Workers and is free without API key.
const COINPAPRIKA = "https://api.coinpaprika.com/v1";

export async function fetchCoinGeckoPrices(
  ids: string[],
  vs: string
): Promise<UpstreamResult<Record<string, { price: number; change24h: number; change7d: number; marketCap: number }>>> {
  try {
    // CoinPaprika uses slug-based IDs. Map common symbols → slugs.
    const SYMBOL_TO_SLUG: Record<string, string> = {
      BTC: "btc-bitcoin", ETH: "eth-ethereum", USDT: "usdt-tether",
      USDC: "usdc-usd-coin", BNB: "bnb-binance-coin", XRP: "xrp-xrp",
      ADA: "ada-cardano", SOL: "sol-solana", DOGE: "doge-dogecoin",
      TRX: "trx-tron", DOT: "dot-polkadot", MATIC: "matic-polygon",
      LTC: "ltc-litecoin", SHIB: "shib-shiba-inu", DAI: "dai-dai",
      AVAX: "avax-avalanche", LINK: "link-chainlink", BCH: "bch-bitcoin-cash",
      UNI: "uni-uniswap", ATOM: "atom-cosmos",
    };
    const slugs = ids.map((s) => SYMBOL_TO_SLUG[s.toUpperCase()] || s.toLowerCase());
    // CoinPaprika tickers endpoint: /v1/tickers?quotes=USD
    // Returns array; we filter by slug. Quote key is uppercase (USD, not usd).
    const vsKey = vs.toUpperCase();
    const url = `${COINPAPRIKA}/tickers?quotes=${vsKey}`;
    const r = await fetchWithTimeout(url);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, status: r.status };
    const arr: any[] = await r.json();
    const out: Record<string, any> = {};
    for (const slug of slugs) {
      const ticker = arr.find((t) => t.id === slug);
      if (!ticker) continue;
      const quote = ticker.quotes?.[vsKey];
      if (!quote) continue;
      // Find the original symbol that mapped to this slug
      const originalSymbol = ids.find((s) => (SYMBOL_TO_SLUG[s.toUpperCase()] || s.toLowerCase()) === slug) || slug;
      out[originalSymbol] = {
        price: quote.price || 0,
        change24h: quote.percent_change_24h || 0,
        change7d: quote.percent_change_7d || 0,
        marketCap: quote.market_cap || 0,
      };
    }
    return { ok: true, data: out, source: "coinpaprika" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

// ── open.er-api.com (free, no key, works from CF Workers, 160+ currencies) ──
// Replaces AllRatesToday as the primary real-time source. Daily updates
// (vs AllRatesToday's 60s), but works reliably from Worker context.
// Refactor #2: this is the fix for the upstream 404 from CF Workers.
const OPEN_ER_API = "https://open.er-api.com/v6";

export async function fetchOpenERApiLatest(base: string): Promise<UpstreamResult<{ rates: Record<string, number>; timestamp: number; source: string }>> {
  try {
    const r = await fetchWithTimeout(`${OPEN_ER_API}/latest/${encodeURIComponent(base)}`);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, status: r.status };
    const j: any = await r.json();
    if (j.result !== "success") return { ok: false, error: j["error-type"] || "api_error" };
    return {
      ok: true,
      data: {
        rates: j.rates || {},
        timestamp: j.time_last_update_unix || Math.floor(Date.now() / 1000),
        source: "open.er-api.com",
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

// ── Fallback chain: try primary, fall back to secondary ──
// Refactor #2: open.er-api.com is the primary real-time source (works from CF Workers).
// AllRatesToday is kept as last resort (returns 404 from Worker context).
// Frankfurter is the history source (returns 404 from Worker, but D1 history is seeded).
export async function fetchFiatLatestWithFallback(
  base: string,
  kv?: KVNamespace
): Promise<UpstreamResult<{ rates: Record<string, number>; source: string; stale: boolean; timestamp: number }>> {
  // Try open.er-api.com (works from CF Workers)
  const openEr = await fetchOpenERApiLatest(base);
  if (openEr.ok) {
    return { ok: true, data: { rates: openEr.data!.rates, source: openEr.data!.source, stale: false, timestamp: openEr.data!.timestamp } };
  }
  // Fall back to daily ECB
  const frankfurter = await fetchFrankfurterLatest(base);
  if (frankfurter.ok) {
    return { ok: true, data: { rates: frankfurter.data!, source: "frankfurter", stale: false, timestamp: Math.floor(Date.now() / 1000) } };
  }
  // Last resort: AllRatesToday (returns 404 from Worker, but works from curl)
  const art = await fetchAllRatesTodayLatest(base);
  if (art.ok) {
    return { ok: true, data: { rates: art.data!, source: "allratestoday", stale: false, timestamp: Math.floor(Date.now() / 1000) } };
  }
  // All failed
  return { ok: false, error: `open.er-api: ${openEr.error}; frankfurter: ${frankfurter.error}; allratestoday: ${art.error}` };
}
