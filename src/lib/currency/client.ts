// src/lib/currency/client.ts
// Typed client for the Currency API. Single source of truth for all
// currency + crypto API calls in the React app.
//
// All functions return Result<T> so callers handle success/failure
// uniformly. No throws, no surprise undefined.

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; code: string; status: number };

export interface CurrencyCode {
  code: string;
  name: string;
  symbol: string;
  flag: string | null;
  decimals: number;
}

export interface RatesLatest {
  base: string;
  timestamp: number;
  source: string;
  stale: boolean;
  nextRefreshIn?: number;
  rates: Record<string, number>;
}

export interface ConvertResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
  source: string;
  stale: boolean;
}

export interface PairResult {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  change: { "24h": number; "24hPct": number; "7d": number; "7dPct": number; "30d": number; "30dPct": number };
  chart: { date: string; rate: number }[];
  source: string;
  stale: boolean;
}

export interface TimeseriesResult {
  from: string;
  to: string;
  start: string;
  end: string;
  count: number;
  source: string;
  series: { date: string; rate: number }[];
}

export interface BulkItem {
  amount: number;
  from: string;
  to: string;
}
export interface BulkResult {
  count: number;
  successCount: number;
  results: (BulkItem & { result: number | null; rate: number | null; error: string | null })[];
}

export interface CryptoPrice {
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
}
export interface CryptoPricesResult {
  vs: string;
  timestamp: number;
  source: string;
  stale: boolean;
  prices: Record<string, CryptoPrice>;
  warnings?: { unknownIds: string[] };
}

const TIMEOUT_MS = 8000;

function apiBase(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = ((import.meta as any)?.env ?? {}) as { VITE_API_BASE?: string };
  return env.VITE_API_BASE || "https://dev.api.dateandtime.live";
}

async function get<T>(path: string, signal?: AbortSignal): Promise<Result<T>> {
  const ctrl = signal ? null : new AbortController();
  const s = signal || ctrl!.signal;
  const t = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  try {
    const r = await fetch(`${apiBase()}${path}`, { signal: s });
    if (t) clearTimeout(t);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}`, code: `http_${r.status}`, status: r.status };
    }
    const j = await r.json();
    if (j?.success) return { ok: true, data: j.data as T };
    return { ok: false, error: j?.error?.message || "unknown", code: j?.error?.code || "unknown", status: j?.error?.status || 500 };
  } catch (e: any) {
    if (t) clearTimeout(t);
    return { ok: false, error: e?.message || "network_error", code: "network_error", status: 0 };
  }
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<Result<T>> {
  const ctrl = signal ? null : new AbortController();
  const s = signal || ctrl!.signal;
  const t = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  try {
    const r = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: s,
    });
    if (t) clearTimeout(t);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}`, code: `http_${r.status}`, status: r.status };
    }
    const j = await r.json();
    if (j?.success) return { ok: true, data: j.data as T };
    return { ok: false, error: j?.error?.message || "unknown", code: j?.error?.code || "unknown", status: j?.error?.status || 500 };
  } catch (e: any) {
    if (t) clearTimeout(t);
    return { ok: false, error: e?.message || "network_error", code: "network_error", status: 0 };
  }
}

// ── Public API ─────────────────────────────────────────────

export async function fetchCodes(signal?: AbortSignal): Promise<Result<{ count: number; codes: CurrencyCode[] }>> {
  return get("/api/v1/currency/codes", signal);
}

export async function fetchRates(base: string, signal?: AbortSignal): Promise<Result<RatesLatest>> {
  return get(`/api/v1/currency/rates?base=${encodeURIComponent(base.toUpperCase())}`, signal);
}

export async function fetchConvert(
  from: string,
  to: string,
  amount: number,
  signal?: AbortSignal
): Promise<Result<ConvertResult>> {
  return get(
    `/api/v1/currency/convert?from=${encodeURIComponent(from.toUpperCase())}&to=${encodeURIComponent(to.toUpperCase())}&amount=${amount}`,
    signal
  );
}

export async function fetchPair(from: string, to: string, signal?: AbortSignal): Promise<Result<PairResult>> {
  return get(`/api/v1/currency/pair?from=${encodeURIComponent(from.toUpperCase())}&to=${encodeURIComponent(to.toUpperCase())}`, signal);
}

export async function fetchTimeseries(
  from: string,
  to: string,
  start: string,
  end: string,
  signal?: AbortSignal
): Promise<Result<TimeseriesResult>> {
  return get(
    `/api/v1/currency/timeseries?from=${encodeURIComponent(from.toUpperCase())}&to=${encodeURIComponent(to.toUpperCase())}&start=${start}&end=${end}`,
    signal
  );
}

export async function fetchBulkConvert(items: BulkItem[], signal?: AbortSignal): Promise<Result<BulkResult>> {
  return post("/api/v1/currency/bulk", { items }, signal);
}

export async function fetchCryptoPrices(
  ids: string[],
  vs: string = "usd",
  signal?: AbortSignal
): Promise<Result<CryptoPricesResult>> {
  return get(`/api/v1/crypto/prices?ids=${ids.join(",")}&vs=${vs}`, signal);
}

export async function fetchCryptoConvert(
  from: string,
  to: string,
  amount: number,
  signal?: AbortSignal
): Promise<Result<ConvertResult>> {
  return get(
    `/api/v1/crypto/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`,
    signal
  );
}
