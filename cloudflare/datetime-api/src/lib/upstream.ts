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

// ── CoinGecko (free, 10-30 req/min, 1000+ crypto, no key) ──
const COINGECKO = "https://api.coingecko.com/api/v3";

export async function fetchCoinGeckoPrices(
  ids: string[],
  vs: string
): Promise<UpstreamResult<Record<string, { price: number; change24h: number; change7d: number; marketCap: number }>>> {
  try {
    const url = `${COINGECKO}/simple/price?ids=${ids.join(",")}&vs_currencies=${vs}&include_24hr_change=true&include_7d_change=true&include_market_cap=true`;
    const r = await fetchWithTimeout(url);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, status: r.status };
    const j: any = await r.json();
    const out: Record<string, any> = {};
    for (const id of ids) {
      const d = j[id];
      if (d) {
        out[id] = {
          price: d[vs.toLowerCase()] || 0,
          change24h: d[`${vs.toLowerCase()}_24h_change`] || 0,
          change7d: d[`${vs.toLowerCase()}_7d_change`] || 0,
          marketCap: d[`${vs.toLowerCase()}_market_cap`] || 0,
        };
      }
    }
    return { ok: true, data: out, source: "coingecko" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

// ── Fallback chain: try primary, fall back to secondary ──
export async function fetchFiatLatestWithFallback(
  base: string,
  kv?: KVNamespace
): Promise<UpstreamResult<{ rates: Record<string, number>; source: string; stale: boolean; timestamp: number }>> {
  // Try real-time first
  let result = await fetchAllRatesTodayLatest(base);
  if (result.ok) {
    return { ok: true, data: { rates: result.data!, source: "allratestoday", stale: false, timestamp: Math.floor(Date.now() / 1000) } };
  }
  // Fall back to daily ECB
  result = await fetchFrankfurterLatest(base);
  if (result.ok) {
    return { ok: true, data: { rates: result.data!, source: "frankfurter", stale: false, timestamp: Math.floor(Date.now() / 1000) } };
  }
  // Both failed
  return { ok: false, error: `allratestoday: ${result.error}; frankfurter: ${result.error}` };
}
