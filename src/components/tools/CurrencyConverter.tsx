// src/components/tools/CurrencyConverter.tsx
// One component = one purpose: convert an amount between two currencies and
// display all rates against the same base. Live ECB feed with offline fallback.
//
// Same UX family as the other tools:
// - BG card with rounded-3xl + e0e0e0 border
// - Font-mono uppercase labels
// - lucide icons throughout
// - Copy-to-clipboard buttons
// - SDK panel footer

import React, { useEffect, useMemo, useState } from "react";
import {
  Coins, ArrowRightLeft, Copy, Check, RefreshCw, Globe2,
  TrendingUp, AlertCircle, Loader2
} from "lucide-react";
import { CURRENCIES, type CurrencyInfo } from "../../data/currency/currencies";
import { convertCurrency, getAllRatesAgainstBase, TOP_PAIRS } from "../../utils/currencyApi";
import { getToolI18n } from "../../utils/toolTranslations";
import ToolSdkPanel from "./ToolSdkPanel";

interface Props { lang?: string; }

interface ConvertResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
  result: number;
  date: string;
  source: "ecb" | "static-fallback";
  inverse: number;
  formatted: string;
}

interface RateTableResult {
  base: string;
  date: string;
  source: "ecb" | "static-fallback";
  fetchedAt: string;
  rates: { code: string; rate: number; info: CurrencyInfo }[];
}

export default function CurrencyConverter({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const [amount, setAmount] = useState<number>(100);
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("EUR");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [table, setTable] = useState<RateTableResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePairIdx, setActivePairIdx] = useState(0);

  const fromInfo = useMemo(() => CURRENCIES.find((c) => c.code === from)!, [from]);
  const toInfo = useMemo(() => CURRENCIES.find((c) => c.code === to)!, [to]);

  // Convert whenever inputs change
  useEffect(() => {
    if (!amount || amount <= 0) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    convertCurrency({ amount, from, to })
      .then((r) => {
        if (cancelled) return;
        setResult(r as ConvertResult);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Conversion failed");
        setResult(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [amount, from, to]);

  // Load all rates against `from` for the table view
  useEffect(() => {
    let cancelled = false;
    getAllRatesAgainstBase(from)
      .then((r) => !cancelled && setTable(r as RateTableResult))
      .catch(() => !cancelled && setTable(null));
    return () => {
      cancelled = true;
    };
  }, [from]);

  function swap() {
    setFrom(to);
    setTo(from);
    setActivePairIdx((i) => (i + 1) % TOP_PAIRS.length);
  }

  function copyTo(text: string, key: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function loadPair(pairIdx: number) {
    const p = TOP_PAIRS[pairIdx];
    setFrom(p.from);
    setTo(p.to);
    setActivePairIdx(pairIdx);
  }

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button
      onClick={() => copyTo(text, k)}
      className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#9e9e9e] hover:text-[#3f51b5] transition"
      aria-label="Copy"
    >
      {copiedKey === k ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );

  const CurrencyPicker = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) => {
    const selected = CURRENCIES.find((c) => c.code === value)!;
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider">
          {label}
        </label>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl pl-3 pr-9 py-2.5 text-sm font-semibold text-[#212121] outline-none focus:border-[#3f51b5] cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base">
            {selected.flag}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">
          <span>Symbol: {selected.symbol}</span>
          <span>·</span>
          <span>{selected.decimals === 0 ? "no" : selected.decimals} decimals</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      {/* === MAIN CONVERTER CARD === */}
      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <header className="mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
            <Coins size={11} /> {t.currencyConverter}
          </span>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-[#212121]">
            {amount.toLocaleString()} {fromInfo.flag} {from} → {toInfo.flag} {to}
          </h1>
          <p className="mt-1 text-sm text-[#616161]">{t.currencyConverterSubtitle}</p>
        </header>

        {/* Picker row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr] gap-4 items-end">
          <CurrencyPicker value={from} onChange={setFrom} label={t.convertFrom} />
          <button
            onClick={swap}
            className="md:mb-0 mb-2 md:self-end self-center justify-self-center h-10 w-10 rounded-full border border-[#e0e0e0] bg-[#fafafa] hover:bg-[#3f51b5] hover:text-white hover:border-[#3f51b5] transition flex items-center justify-center"
            aria-label={t.swapCurrencies}
          >
            <ArrowRightLeft size={16} />
          </button>
          <CurrencyPicker value={to} onChange={setTo} label={t.convertTo} />
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider">
              {t.amount}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-2xl font-mono font-bold text-[#3f51b5] outline-none focus:border-[#3f51b5]"
              />
              <span className="text-base text-[#9e9e9e]">{fromInfo.flag}</span>
            </div>
            <div className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">
              {fromInfo.code} · {fromInfo.name}
            </div>
          </div>
        </div>

        {/* === RESULT === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#eeeeee]">
          <div className="md:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">{t.result}</span>
              <CopyBtn text={result?.formatted ?? ""} k="result" />
            </div>
            <div className="flex items-baseline gap-3">
              {loading ? (
                <div className="flex items-center gap-2 text-[#9e9e9e]">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Converting…</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-[#d32f2f]">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              ) : result ? (
                <>
                  <span className="text-4xl md:text-5xl font-mono font-extrabold text-[#3f51b5] tracking-tight">
                    {toInfo.symbol}
                    {result.formatted}
                  </span>
                  <span className="text-sm text-[#616161]">
                    {toInfo.flag} {toInfo.name}
                  </span>
                </>
              ) : (
                <span className="text-sm text-[#9e9e9e]">—</span>
              )}
            </div>
            {result && (
              <div className="text-[11px] font-mono text-[#9e9e9e]">
                1 {result.from} = <strong className="text-[#3f51b5]">{result.rate.toFixed(6)}</strong>{" "}
                {result.to} &nbsp;·&nbsp;
                1 {result.to} = <strong className="text-[#3f51b5]">{result.inverse.toFixed(6)}</strong>{" "}
                {result.from}
              </div>
            )}
          </div>
        </div>

        {/* === RATE BREADCRUMB === */}
        {result && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-[#eeeeee] text-[11px] font-mono text-[#9e9e9e]">
            <span className="inline-flex items-center gap-1">
              <Globe2 size={12} /> {t.lastUpdated}{" "}
              <strong className="text-[#616161]">{result.date}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              {result.source === "ecb" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <strong className="text-emerald-700">{t.liveEcbFeed}</strong>
                </>
              ) : (
                <>
                  <AlertCircle size={12} />
                  <strong className="text-amber-700">{t.fallbackRates}</strong>
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <button
                onClick={() => {
                  // Re-fetch by changing the from state to itself (no-op state)
                  // but in practice just hitting F5 will refetch — or admin can trigger
                  // a refresh via the admin panel. For UI feedback, do a local reload:
                  window.location.reload();
                }}
                className="hover:text-[#3f51b5] underline underline-offset-2"
              >
                <RefreshCw size={11} className="inline mr-1" />
                {t.refreshRates}
              </button>
            </span>
          </div>
        )}
      </div>

      {/* === TRENDING PAIRS === */}
      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider">
            <TrendingUp size={14} /> {t.trendingPairs}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOP_PAIRS.map((p, i) => {
            const active = p.from === from && p.to === to;
            return (
              <button
                key={`${p.from}-${p.to}-${i}`}
                onClick={() => loadPair(i)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono transition ${
                  active
                    ? "bg-[#3f51b5] text-white"
                    : "bg-[#fafafa] border border-[#e0e0e0] text-[#616161] hover:border-[#3f51b5] hover:text-[#3f51b5]"
                }`}
              >
                {p.from} → {p.to}
              </button>
            );
          })}
        </div>
      </div>

      {/* === ALL RATES TABLE === */}
      {table && (
        <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider">
              <Coins size={14} /> {t.ratesTable} {table.base} ({table.base === "USD" ? "🇺🇸" : CURRENCIES.find((c) => c.code === table.base)?.flag})
            </div>
            <span className="text-[10px] font-mono text-[#9e9e9e]">{table.date}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3 text-right">Rate</th>
                  <th className="py-2 text-right">Symbol</th>
                </tr>
              </thead>
              <tbody>
                {table.rates.map((r) => (
                  <tr key={r.code} className="border-t border-[#f5f5f5] hover:bg-[#fafafa]">
                    <td className="py-2 pr-3 font-mono font-bold text-[#212121]">
                      {r.info.flag} {r.code}
                    </td>
                    <td className="py-2 pr-3 text-sm text-[#616161]">{r.info.name}</td>
                    <td className="py-2 pr-3 text-right font-mono font-bold text-[#3f51b5] tabular-nums">
                      {r.rate.toFixed(r.info.decimals === 0 ? 4 : 6)}
                    </td>
                    <td className="py-2 text-right text-sm text-[#9e9e9e]">{r.info.symbol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ToolSdkPanel
        summary="Convert an amount between any two of 33 ISO 4217 currencies. The current rate table quotes live rates from the European Central Bank eurofxref feed (CC-BY 4.0), refreshed daily. Falls back to a curated snapshot if the upstream is unreachable."
        installCmd="npm install @timeanddatepro/sdk"
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// 100 USD → EUR with the live rate
const converted = await client.currency.convert({
  amount: 100,
  from: "USD",
  to: "EUR",
});
console.log(converted.result); // "87.45" (formatted in target currency)
console.log(converted.rate);   // 0.8745... at-the-time-of-fetch

// All 33 rates against USD
const table = await client.currency.rates({ base: "USD" });
console.log(table.rates[0].code); // "USD"
console.log(table.rates[1].rate); // rate vs EUR`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/currency/convert?amount=100&from=USD&to=EUR"
curl "https://timeanddatepro.com/api/v1/currency/rates?base=USD"
`}
        docsHref="/docs/api-reference/currency/convert"
      />
    </div>
  );
}
