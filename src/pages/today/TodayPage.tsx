// src/pages/today/TodayPage.tsx
// Interactive currency mini-widget.
// Location-aware, live rates, clickable major currencies that update the converter.

import { useState, useEffect, useRef } from "react";
import { useLocation } from "../../hooks/useLocation";
import {
  useConvert, useRates, useCodes, usePair,
} from "../../lib/currency/hooks";
import { LiveDot } from "../../components/common/LiveDot";
import { RateAlertForm } from "../../components/alerts/RateAlertForm";
import "./TodayPage.css";
import "../../components/alerts/RateAlertForm.css";

const MAJOR_CURRENCIES = [
  { code: "USD", name: "US Dollar", country: "US" },
  { code: "EUR", name: "Euro", country: "EU" },
  { code: "GBP", name: "British Pound", country: "GB" },
  { code: "CNY", name: "Chinese Yuan", country: "CN" },
  { code: "KRW", name: "South Korean Won", country: "KR" },
  { code: "JPY", name: "Japanese Yen", country: "JP" },
  { code: "CAD", name: "Canadian Dollar", country: "CA" },
  { code: "AUD", name: "Australian Dollar", country: "AU" },
  { code: "CHF", name: "Swiss Franc", country: "CH" },
  { code: "SGD", name: "Singapore Dollar", country: "SG" },
];

function TodayPage() {
  const { location, loading: locLoading } = useLocation();
  const baseCurrency = location?.currency || "USD";
  const cityName = location?.city || (locLoading ? "Detecting..." : "Unknown");
  const countryName = location?.country || "";

  const [amount, setAmount] = useState(10000);
  const [from, setFrom] = useState(baseCurrency);
  const [to, setTo] = useState("USD");

  // Sync `from` with detected location currency (only on first detect)
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && baseCurrency) {
      setFrom(baseCurrency);
      // Default `to` to USD if base isn't USD, else EUR
      setTo(baseCurrency === "USD" ? "EUR" : "USD");
      initRef.current = true;
    }
  }, [baseCurrency]);

  const { data: codes } = useCodes();

  // Debounce amount to avoid per-keystroke refetch
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(amount), 250);
    return () => clearTimeout(t);
  }, [amount]);

  // Stale-while-revalidate for the result
  const { data, loading } = useConvert(from, to, debouncedAmount);
  const lastResultRef = useRef<number | null>(null);
  if (data) lastResultRef.current = data.result;
  const displayResult = data?.result ?? lastResultRef.current;
  const isStale = loading && lastResultRef.current !== null;

  const fromInfo = codes?.codes.find((c) => c.code === from);
  const toInfo = codes?.codes.find((c) => c.code === to);
  const fromFlag = fromInfo?.flag || "🌍";
  const toFlag = toInfo?.flag || "🌍";

  // Set of major currencies to show, excluding the base
  const majors = MAJOR_CURRENCIES.filter((m) => m.code !== baseCurrency).slice(0, 5);

  // Clicking a major currency row sets it as the `to` in the converter
  function selectPair(targetCode: string) {
    setTo(targetCode);
    // Scroll converter into view (mobile UX)
    document.getElementById("tdp-today-conv")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function openFullDashboard() {
    window.history.pushState(null, "", "/currency");
    window.dispatchEvent(new Event("tdp:navigate"));
  }

  return (
    <div className="tdp-today">
      {/* ── Location header ──────────────────────────────── */}
      <div className="tdp-today-loc">
        <div className="tdp-today-loc-pin">📍</div>
        <div className="tdp-today-loc-text">
          <div className="tdp-today-loc-eyebrow">YOU ARE IN</div>
          <div className="tdp-today-loc-city">{cityName}{countryName ? `, ${countryName}` : ""}</div>
          <div className="tdp-today-loc-meta">
            {baseCurrency} · {fromInfo?.name || baseCurrency}
          </div>
        </div>
        <div className="tdp-today-loc-live">
          <LiveDot size="sm" />
          <span>LIVE</span>
        </div>
      </div>

      {/* ── Quick convert ────────────────────────────────── */}
      <div className="tdp-today-section-label">QUICK CONVERT</div>
      <div className="tdp-today-conv" id="tdp-today-conv">
        <div className="tdp-today-conv-side">
          <input
            className="tdp-today-conv-amount"
            type="text"
            value={amount.toLocaleString()}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(/,/g, ""));
              if (!isNaN(v)) setAmount(v);
            }}
          />
          <div className="tdp-today-currency">
            <span className="tdp-today-currency-flag">{fromFlag}</span>
            <select
              className="tdp-today-currency-select"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              title={fromInfo?.name || from}
            >
              {codes?.codes.map((c) => (
                <option key={c.code} value={c.code} title={c.name}>
                  {c.code} — {c.name}
                </option>
              )) || <option value={from}>{from}</option>}
            </select>
          </div>
        </div>

        <button className="tdp-today-swap" onClick={swap} title="Swap">⇄</button>

        <div className="tdp-today-conv-side">
          <input
            className={`tdp-today-conv-amount result ${isStale ? "stale" : ""}`}
            type="text"
            value={
              displayResult != null
                ? displayResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "—"
            }
            readOnly
          />
          <div className="tdp-today-currency">
            <span className="tdp-today-currency-flag">{toFlag}</span>
            <select
              className="tdp-today-currency-select"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              title={toInfo?.name || to}
            >
              {codes?.codes.map((c) => (
                <option key={c.code} value={c.code} title={c.name}>
                  {c.code} — {c.name}
                </option>
              )) || <option value={to}>{to}</option>}
            </select>
          </div>
        </div>
      </div>

      {/* ── Major currencies list ─────────────────────────── */}
      <div className="tdp-today-section-label">MAJOR CURRENCIES IN {baseCurrency}</div>
      <div className="tdp-today-majors">
        {majors.map((m) => (
          <MajorRow
            key={m.code}
            code={m.code}
            name={m.name}
            country={m.country}
            base={baseCurrency}
            active={to === m.code}
            onClick={() => selectPair(m.code)}
          />
        ))}
      </div>

      {/* ── Alert banner ──────────────────────────────────── */}
      <div className="tdp-today-alert">
        <span className="tdp-today-alert-icon">⚠️</span>
        <span className="tdp-today-alert-text">
          <strong>EUR/USD</strong> crossed your alert at <strong>1.1420</strong>
        </span>
        <span className="tdp-today-alert-link">· View</span>
      </div>

      {/* ── Rate alert subscription form ─────────────── */}
      <RateAlertForm
        from={from}
        to={to}
        fromFlag={fromFlag}
        toFlag={toFlag}
        fromName={fromInfo?.name}
        toName={toInfo?.name}
        currentRate={data?.rate}
      />

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="tdp-today-footer">
        <button className="tdp-today-dashboard" onClick={openFullDashboard}>
          <span>⚡</span>
          <span>Open full dashboard</span>
          <span>→</span>
        </button>
        <button className="tdp-today-settings" title="Settings">⚙ Settings</button>
      </div>
    </div>
  );
}

// One row in the major currencies list.
// Fetches its own /pair data so change% is real, not a stub.
function MajorRow({
  code, name, country, base, active, onClick,
}: { code: string; name: string; country: string; base: string; active: boolean; onClick: () => void }) {
  // 1 of `code` in `base` = (1 / rate_code_to_base) of base
  // If user clicks, we show "1 {code} = {X} {base}"
  const { data: pairData } = usePair(code, base);
  const { data: codes } = useCodes();

  const codeInfo = codes?.codes.find((c) => c.code === code);
  const flag = codeInfo?.flag || (countryToFlag(country));

  // Compute: 1 of `code` in `base`
  const rate = pairData?.rate;
  const oneInBase = rate ? (1 / rate) : null;
  const change24hPct = pairData?.change?.["24hPct"];

  return (
    <button className={`tdp-today-major ${active ? "active" : ""}`} onClick={onClick}>
      <div className="tdp-today-major-left">
        <div className="tdp-today-major-flag">{flag}</div>
        <div>
          <div className="tdp-today-major-name">{name}</div>
          <div className="tdp-today-major-code">1 {code}</div>
        </div>
      </div>
      <div className="tdp-today-major-right">
        <div className="tdp-today-major-rate">
          {oneInBase != null
            ? base === "JPY" || base === "KRW"
              ? `¥${oneInBase.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
              : `${base === "USD" ? "$" : base === "EUR" ? "€" : base === "GBP" ? "£" : ""}${oneInBase.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
            : "—"}
        </div>
        <div className={`tdp-today-major-change ${change24hPct != null ? (change24hPct >= 0 ? "up" : "down") : "flat"}`}>
          {change24hPct != null ? (
            <>
              <span>{change24hPct >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(change24hPct).toFixed(2)}%</span>
            </>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
    </button>
  );
}

function countryToFlag(country: string): string {
  const map: Record<string, string> = {
    US: "🇺🇸", EU: "🇪🇺", GB: "🇬🇧", CN: "🇨🇳", KR: "🇰🇷",
    JP: "🇯🇵", CA: "🇨🇦", AU: "🇦🇺", CH: "🇨🇭", SG: "🇸🇬",
  };
  return map[country] || "🏳️";
}

export { TodayPage };
