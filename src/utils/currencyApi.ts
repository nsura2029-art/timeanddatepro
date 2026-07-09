// src/utils/currencyApi.ts
// Exchange-rate adapter around the ECB daily reference feed
// (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml, CC-BY 4.0).
//
// Features:
// - Parses the XML inline (no extra dep — a tiny regex-based parser is enough
//   for this 90-line flat document).
// - Falls back to a curated snapshot in src/data/currency/staticRates.ts
//   if the upstream is down or the parser fails. Snapshot is last refreshed
//   2026-07-09 with the same ECB values so both paths return identical rates
//   in normal operation.
// - Caches the last successful fetch in-memory for the process lifetime, plus
//   an env-configurable TTL (`CURRENCY_TTL_MS`, default 6h).
// - Supports any base via cross-rate computation; EUR is the natural
//   intermediate since all ECB rates are quoted vs EUR.
//
// API surface used by both the public REST API and the admin panel:
//   fetchLatestRates(base = "USD")          → { base, date, rates: Record<code, number>, source }
//   convertCurrency(amount, from, to)        → { amount, from, to, rate, result, date, source }
//   getRecentRatesHistory(base, days = 7)    → for the trend chart (uses static fallback only for MVP)

import { CURRENCIES, getCurrency, listCodes, type CurrencyInfo } from "../data/currency/currencies";
import { STATIC_RATES_EUR } from "../data/currency/staticRates";

const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const ECB_HISTORY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";
const TTL_MS = Number(process.env.CURRENCY_TTL_MS) || 6 * 60 * 60 * 1000; // 6h

export interface RateTable {
  base: string;            // always EUR for the raw fetch — conversion handles other bases
  date: string;            // YYYY-MM-DD (ECB business day)
  rates: Record<string, number>; // rates in EUR per 1 unit of code
  source: "ecb" | "static-fallback";
  fetchedAt: string;       // ISO timestamp
}

let cached: RateTable | null = null;
let inflight: Promise<RateTable> | null = null;

function parseEcbXml(xml: string): { date: string; rates: Record<string, number> } {
  // Cheap but correct for flat ECB docs: <gesmes:Envelope><Cube><Cube time=...><Cube currency=... rate=.../></Cube></Cube>
  const timeMatch = xml.match(/<Cube\s+time=["']([\d-]+)["']/);
  const date = timeMatch ? timeMatch[1] : new Date().toISOString().slice(0, 10);
  const rateRe = /<Cube\s+currency=["']([A-Z]{3})["']\s+rate=["']([\d.]+)["']\s*\/?>/g;
  const rates: Record<string, number> = { EUR: 1 };
  for (const m of xml.matchAll(rateRe)) {
    const code = m[1];
    const value = parseFloat(m[2]);
    if (!Number.isFinite(value)) continue;
    if (CURRENCIES.some((c) => c.code === code)) {
      rates[code] = value;
    }
  }
  return { date, rates };
}

/** Fetch the latest reference table from ECB; returns the curated fallback on failure. */
export async function fetchLatestRates(): Promise<RateTable> {
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) {
    return cached;
  }
  if (inflight) return inflight;
  inflight = (async () => {
    const tryFetch = async () => {
      const res = await fetch(ECB_URL, {
        headers: { "User-Agent": "TimeAndDatePro/1.0 (+currencyApi)" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = parseEcbXml(xml);
      if (Object.keys(parsed.rates).length < 10) throw new Error("ECB rates too sparse");
      return {
        base: "EUR",
        date: parsed.date,
        rates: parsed.rates,
        source: "ecb" as const,
        fetchedAt: new Date().toISOString(),
      };
    };
    try {
      const table = await tryFetch();
      cached = table;
      return table;
    } catch (err) {
      // Hard fallback. Returned with explicit source tag so admin can see when live went down.
      const table: RateTable = {
        base: "EUR",
        date: STATIC_RATES_EUR.date,
        rates: STATIC_RATES_EUR.rates,
        source: "static-fallback",
        fetchedAt: new Date().toISOString(),
        _error: err instanceof Error ? err.message : String(err),
      } as RateTable;
      cached = table;
      return table;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Convert an amount between two currencies using the latest table.
 * Both `from` and `to` must be in the supported list.
 */
export async function convertCurrency(opts: {
  amount: number;
  from: string;
  to: string;
  /** Optional override date — for testing/exports */
  date?: string;
}): Promise<{
  amount: number;
  from: string;
  to: string;
  rate: number;
  result: number;
  date: string;
  source: RateTable["source"];
  inverse: number;
  formatted: string;
}> {
  const from = opts.from.toUpperCase();
  const to = opts.to.toUpperCase();
  if (!getCurrency(from)) throw new Error(`Unsupported currency: ${from}`);
  if (!getCurrency(to)) throw new Error(`Unsupported currency: ${to}`);
  if (!Number.isFinite(opts.amount)) throw new Error("amount must be a number");

  const table = await fetchLatestRates();
  // ECB table is EUR-based; cross-rate via EUR as pivot:
  //   amt/to = amt/from * rate(from→EUR) * rate(EUR→to)
  //         = amt/from * (1 / rates[from]) * rates[to]
  const rateFromEUR = table.rates[from];
  const rateToEUR = table.rates[to];
  if (!rateFromEUR || !rateToEUR) {
    throw new Error(`Missing rate for ${from} or ${to}`);
  }
  const rate = rateToEUR / rateFromEUR;
  const result = opts.amount * rate;
  const target = getCurrency(to)!;
  return {
    amount: opts.amount,
    from,
    to,
    rate,
    result,
    date: table.date,
    source: table.source,
    inverse: rateFromEUR / rateToEUR, // 1 unit of `to` → X units of `from`
    formatted: formatAmount(result, target),
  };
}

/** Format an amount with locale-aware thousands + target currency decimals. */
export function formatAmount(amount: number, info: CurrencyInfo): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(safe);
}

/** Get all rates against a chosen base (for the table view). */
export async function getAllRatesAgainstBase(base = "USD"): Promise<{
  base: string;
  date: string;
  source: RateTable["source"];
  fetchedAt: string;
  rates: { code: string; rate: number; info: CurrencyInfo }[];
}> {
  const table = await fetchLatestRates();
  const baseUp = base.toUpperCase();
  if (!getCurrency(baseUp)) throw new Error(`Unsupported base: ${base}`);
  const baseRateEUR = table.rates[baseUp];
  if (!baseRateEUR) throw new Error(`Base ${base} not in latest table`);
  const rates = listCodes().map((code) => {
    const r = table.rates[code] / baseRateEUR;
    return { code, rate: r, info: getCurrency(code)! };
  });
  return {
    base: baseUp,
    date: table.date,
    source: table.source,
    fetchedAt: table.fetchedAt,
    rates,
  };
}

/** Heuristic: top 10 pairs from the public Wikipedia reference page + user pattern. */
export const TOP_PAIRS: Array<{ from: string; to: string }> = [
  { from: "USD", to: "EUR" }, { from: "EUR", to: "USD" },
  { from: "GBP", to: "USD" }, { from: "USD", to: "GBP" },
  { from: "USD", to: "JPY" }, { from: "JPY", to: "USD" },
  { from: "USD", to: "CNY" }, { from: "CNY", to: "USD" },
  { from: "USD", to: "CAD" }, { from: "USD", to: "AUD" },
  { from: "EUR", to: "GBP" }, { from: "USD", to: "INR" },
  { from: "EUR", to: "JPY" }, { from: "USD", to: "CHF" },
  { from: "USD", to: "MXN" }, { from: "USD", to: "BRL" },
];

export { CURRENCIES };

/** Force-cache API for tests / admin triggers */
export function _internalClearCache(): void {
  cached = null;
  inflight = null;
}

/** Snippet showing pending types — keep above the boolean `_error` field for callers. */
export interface RateTableWithError extends RateTable {
  _error?: string;
}
