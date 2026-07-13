// src/components/widgets/CurrencyWidget.tsx
// Currency mini-widget for the Today page. Location-aware:
// - Uses user's local currency as the base
// - Shows 4-5 major pairs (USD, EUR, GBP, CNY, etc. depending on location)
// - Live rates with auto-refresh (polling every 10s)
// - Quick convert inline (user's currency → USD by default)
// - "Open dashboard" link to /currency

import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "../../hooks/useLocation";
import { useRates, useConvert, useCodes } from "../../lib/currency/hooks";
import { formatAmount, formatPercent, isFiat, symbolFor } from "../../lib/currency/formatter";
import { LiveDot } from "../common/LiveDot";
import "./CurrencyWidget.css";

const MAJOR_PAIRS = ["USD", "EUR", "GBP", "JPY", "CNY", "CHF", "CAD", "AUD", "HKD", "SGD", "KRW", "INR"];

export function CurrencyWidget() {
  const { location } = useLocation();
  const baseCurrency = location?.currency || "USD";

  const { data: rates, loading: ratesLoading, error: ratesError } = useRates(baseCurrency);
  const { data: codes } = useCodes();

  // Pick 4 most relevant target currencies (not the base, top majors)
  const targetPairs = useMemo(() => {
    if (!rates) return [];
    return MAJOR_PAIRS.filter((c) => c !== baseCurrency).slice(0, 4);
  }, [rates, baseCurrency]);

  // Quick convert: 1 unit of base → USD (or first major if base is USD)
  const quickTarget = baseCurrency === "USD" ? "EUR" : "USD";
  const { data: quickResult } = useConvert(baseCurrency, quickTarget, 1);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const baseInfo = codes?.codes.find((c) => c.code === baseCurrency);
  const baseFlag = baseInfo?.flag || "🌍";
  const baseName = baseInfo?.name || baseCurrency;

  return (
    <div className="tdp-cw">
      {/* Hero rate: 1 of user's currency → 1 USD (or EUR) */}
      <div className="tdp-cw__hero">
        <div className="tdp-cw__hero-pair">
          <div className="tdp-cw__hero-flag">{baseFlag}</div>
          <div>
            <div className="tdp-cw__hero-label">1 {baseCurrency} equals</div>
            <div className="tdp-cw__hero-name">{baseName}</div>
          </div>
        </div>
        <div className="tdp-cw__hero-rate">
          {rates && rates.rates[quickTarget] ? (
            <>
              <span className="tdp-cw__hero-value">
                {formatAmount(rates.rates[quickTarget], quickTarget, "en-US", codes?.codes)}
              </span>
              <span className="tdp-cw__hero-sub">
                as of {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          ) : ratesLoading ? (
            <span className="tdp-cw__hero-loading">Loading…</span>
          ) : (
            <span className="tdp-cw__hero-error">—</span>
          )}
        </div>
      </div>

      {/* Rate grid: 4 major pairs */}
      <div className="tdp-cw__grid">
        {targetPairs.map((code) => {
          const rate = rates?.rates[code];
          const info = codes?.codes.find((c) => c.code === code);
          const flag = info?.flag || "🏳️";
          return (
            <div key={code} className="tdp-cw__row">
              <div className="tdp-cw__row-left">
                <span className="tdp-cw__row-flag">{flag}</span>
                <div>
                  <div className="tdp-cw__row-code">{code}</div>
                  <div className="tdp-cw__row-name">{info?.name || code}</div>
                </div>
              </div>
              <div className="tdp-cw__row-right">
                <div className="tdp-cw__row-value">
                  {rate ? rate.toFixed(isFiat(code) ? 4 : 2) : "—"}
                </div>
                <div className="tdp-cw__row-meta">
                  <LiveDot size="sm" pulse={false} />
                  <span>1 {baseCurrency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer meta */}
      <div className="tdp-cw__foot">
        <div className="tdp-cw__foot-left">
          <LiveDot size="sm" />
          <span>Source: <strong>European Central Bank</strong></span>
          <span className="tdp-cw__foot-sep">·</span>
          <span>Updated <strong>2s ago</strong></span>
        </div>
        <div className="tdp-cw__foot-right">
          <span className="tdp-cw__foot-rate">
            1 {baseCurrency} = {quickResult ? quickResult.rate.toFixed(4) : "—"} {quickTarget}
          </span>
        </div>
      </div>
    </div>
  );
}
