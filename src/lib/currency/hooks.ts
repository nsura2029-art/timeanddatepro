// src/lib/currency/hooks.ts
// React hooks wrapping the currency client. All hooks follow the same
// pattern: trigger fetch on input change, debounce 250ms for typing,
// cancel on unmount, expose { data, loading, error, refresh }.

import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchCodes,
  fetchRates,
  fetchConvert,
  fetchPair,
  fetchTimeseries,
  fetchBulkConvert,
  fetchCryptoPrices,
  type CurrencyCode,
  type RatesLatest,
  type ConvertResult,
  type PairResult,
  type TimeseriesResult,
  type BulkResult,
  type BulkItem,
  type CryptoPricesResult,
} from "./client";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useAsync<T>(
  fetcher: (signal: AbortSignal) => Promise<{ ok: true; data: T } | { ok: false; error: string; code: string; status: number }>,
  deps: any[]
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetcher(ctrl.signal)
      .then((r) => {
        if (cancelledRef.current) return;
        if (r.ok) setData(r.data);
        else setError((r as { ok: false; error: string }).error);
      })
      .catch((e) => {
        if (!cancelledRef.current) setError(e?.message || "unknown");
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
    return () => {
      cancelledRef.current = true;
      ctrl.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { data, loading, error, refresh };
}

/** Fetch currency codes once on mount. */
export function useCodes() {
  return useAsync<{ count: number; codes: CurrencyCode[] }>((s) => fetchCodes(s), []);
}

/** Fetch all rates against a base. */
export function useRates(base: string) {
  return useAsync<RatesLatest>((s) => fetchRates(base, s), [base]);
}

/** Convert a specific amount. Returns the result + metadata. */
export function useConvert(from: string, to: string, amount: number) {
  return useAsync<ConvertResult>((s) => fetchConvert(from, to, amount, s), [from, to, amount]);
}

/** Fetch pair detail (rate + change + chart). */
export function usePair(from: string, to: string) {
  return useAsync<PairResult>((s) => fetchPair(from, to, s), [from, to]);
}

/** Fetch historical timeseries. */
export function useTimeseries(from: string, to: string, start: string, end: string) {
  return useAsync<TimeseriesResult>((s) => fetchTimeseries(from, to, start, end, s), [from, to, start, end]);
}

/** Bulk convert — returns the result of the last call. */
export function useBulkConvert() {
  const [state, setState] = useState<{ data: BulkResult | null; loading: boolean; error: string | null }>({
    data: null, loading: false, error: null,
  });
  const run = useCallback(async (items: BulkItem[]) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const r = await fetchBulkConvert(items);
    if (r.ok) setState({ data: r.data, loading: false, error: null });
    else setState({ data: null, loading: false, error: (r as { ok: false; error: string }).error });
    return r;
  }, []);
  return { ...state, run };
}

/** Fetch crypto prices. */
export function useCryptoPrices(ids: string[], vs: string = "usd") {
  return useAsync<CryptoPricesResult>((s) => fetchCryptoPrices(ids, vs, s), [ids.join(","), vs]);
}
