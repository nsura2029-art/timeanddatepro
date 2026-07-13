// src/pages/currency/CurrencyPage.tsx
// Port of Design E v2 — the full /currency dashboard.

import React, { useState, useEffect, useRef } from "react";
import {
  useConvert, useRates, useCodes, useBulkConvert,
} from "../../lib/currency/hooks";
import type { BulkItem } from "../../lib/currency/client";
import { LiveDot } from "../../components/common/LiveDot";
import "./CurrencyPage.css";

function HeroConverter({ defaultAmount = 10000 }: { defaultAmount?: number }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const { data: codes } = useCodes();
  const { data, loading, error } = useConvert(from, to, amount);

  // Stale-while-revalidate: keep last successful result visible during refetch
  // so the result field doesn't flicker to "..." or "—" between fetches.
  const lastResultRef = useRef<number | null>(null);
  if (data) lastResultRef.current = data.result;

  // Debounce amount so we don't refetch on every keystroke
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(amount), 250);
    return () => clearTimeout(t);
  }, [amount]);

  // Only refetch when debouncedAmount changes (not raw amount)
  const { data: stableData } = useConvert(from, to, debouncedAmount);
  const displayResult = stableData?.result ?? lastResultRef.current;
  const isStale = loading && lastResultRef.current !== null;

  const fromInfo = codes?.codes.find((c) => c.code === from);
  const toInfo = codes?.codes.find((c) => c.code === to);
  const fromFlag = fromInfo?.flag || "🌍";
  const toFlag = toInfo?.flag || "🌍";

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <section className="tdp-cp-hero">
      <div className="tdp-cp-hero-eyebrow">
        <LiveDot size="sm" />
        Live · European Central Bank
      </div>
      <h2 className="tdp-cp-hero-title">How much would you like to convert?</h2>

      <div className="tdp-cp-conv-box">
        <div className="tdp-cp-conv-side">
          <div className="tdp-cp-conv-label">You send</div>
          <input
            className="tdp-cp-conv-amount"
            type="text"
            value={amount.toLocaleString()}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(/,/g, ""));
              if (!isNaN(v)) setAmount(v);
            }}
          />
          <CurrencySelect
            value={from}
            onChange={setFrom}
            flag={fromFlag}
            name={fromInfo?.name}
            codes={codes?.codes}
          />
        </div>

        <button className="tdp-cp-swap" onClick={swap} title="Swap currencies">⇄</button>

        <div className="tdp-cp-conv-side">
          <div className="tdp-cp-conv-label">You get</div>
          <input
            className={`tdp-cp-conv-amount result ${isStale ? "stale" : ""}`}
            type="text"
            value={
              displayResult != null
                ? displayResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "—"
            }
            readOnly
          />
          <CurrencySelect
            value={to}
            onChange={setTo}
            flag={toFlag}
            name={toInfo?.name}
            codes={codes?.codes}
          />
        </div>
      </div>

      <div className="tdp-cp-hero-meta">
        {stableData && (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <LiveDot size="sm" /><strong>Live</strong> rate
            </span>
            <span className="tdp-cp-meta-sep">·</span>
            <span>1 {from} = <strong>{stableData.rate.toFixed(4)}</strong> {to}</span>
            <span className="tdp-cp-meta-sep">·</span>
            <span>Source: <strong>{stableData.source}</strong></span>
            <span className="tdp-cp-meta-sep">·</span>
            <span>Updated <strong>2 sec ago</strong></span>
          </>
        )}
        {error && <span style={{ color: "var(--red-500)" }}>⚠ {error}</span>}
      </div>
      <div className="tdp-cp-hero-actions">
        <button className="tdp-cp-btn primary">⚡ Convert now</button>
        <button className="tdp-cp-btn">📌 Save preset</button>
        <button className="tdp-cp-btn">🔗 Share</button>
        <button className="tdp-cp-btn">📋 Copy result</button>
        <button className="tdp-cp-btn attention">🔔 Get rate alerts for this pair</button>
      </div>
    </section>
  );
}

function CurrencySelect({ value, onChange, flag, name, codes }: { value: string; onChange: (v: string) => void; flag: string; name?: string; codes?: { code: string; flag: string | null; name?: string }[] }) {
  return (
    <div className="tdp-cp-currency-wrap">
      <span className="tdp-cp-currency-flag">{flag}</span>
      <select
        className="tdp-cp-currency"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select currency"
      >
        {codes?.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag || "🏳️"} {c.code} {c.name ? `— ${c.name}` : ""}
          </option>
        )) || <option value={value}>{flag} {value}</option>}
      </select>
      <span className="tdp-cp-currency-name">{name || value}</span>
    </div>
  );
}

function LiveRateGrid() {
  const [base] = useState("USD");
  const { data, loading, error } = useRates(base);
  const { data: codes } = useCodes();

  if (loading && !data) return <div className="tdp-cp-loading">Loading rates…</div>;
  if (error || !data) return <div className="tdp-cp-error">⚠ Could not load rates: {error}</div>;

  const topPairs = ["EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "CHF"];

  return (
    <div className="tdp-cp-rates">
      <div className="tdp-cp-rates-head">
        <div className="tdp-cp-rates-cell">
          <div className="tdp-cp-rates-pair"><LiveDot size="sm" />Pair</div>
          <div className="tdp-cp-rates-num">Rate</div>
          <div className="tdp-cp-rates-num">24h</div>
          <div className="tdp-cp-rates-num">7d</div>
          <div className="tdp-cp-rates-num">30d</div>
          <div className="tdp-cp-rates-num">Updated</div>
        </div>
      </div>
      {topPairs.map((quote) => {
        const rate = data.rates[quote];
        const codeInfo = codes?.codes.find((c) => c.code === quote);
        const flag = codeInfo?.flag || "🏳️";
        return (
          <div className="tdp-cp-rates-row" key={quote}>
            <div className="tdp-cp-rates-cell">
              <div className="tdp-cp-rates-pair">
                <LiveDot size="sm" />
                <span className="tdp-cp-rates-flag">{flag}</span>
                <span className="tdp-cp-rates-code">{base} / {quote}</span>
              </div>
              <div className="tdp-cp-rates-num tdp-cp-rates-rate">{rate?.toFixed(quote === "JPY" || quote === "CNY" ? 2 : 4)}</div>
              <div className="tdp-cp-rates-num"><span className="tdp-cp-change up">—</span></div>
              <div className="tdp-cp-rates-num"><span className="tdp-cp-change up">—</span></div>
              <div className="tdp-cp-rates-num muted">— A3</div>
              <div className="tdp-cp-rates-num muted">
                <LiveDot size="sm" />2s
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Watchlist() {
  const [pairs, setPairs] = useState(["EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "EUR/GBP"]);
  const [addValue, setAddValue] = useState("");

  function add() {
    if (addValue && /^[A-Z]{3}\/[A-Z]{3}$/.test(addValue.toUpperCase())) {
      setPairs([...pairs, addValue.toUpperCase()]);
      setAddValue("");
    }
  }

  const { data } = useRates("USD");

  function getRate(pair: string): number | null {
    const [base, quote] = pair.split("/");
    if (base === "USD" && data?.rates[quote]) return data.rates[quote];
    if (quote === "USD" && data?.rates[base]) return 1 / data.rates[base];
    return null;
  }

  return (
    <div className="tdp-cp-watch">
      {pairs.map((pair) => {
        const rate = getRate(pair);
        return (
          <div className="tdp-cp-watch-row" key={pair}>
            <div>
              <div className="tdp-cp-watch-pair"><LiveDot size="sm" />{pair}</div>
              <div className="tdp-cp-watch-time">Just now</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="tdp-cp-watch-rate">{rate ? rate.toFixed(4) : "—"}</div>
              <div className="tdp-cp-watch-change up">—</div>
            </div>
          </div>
        );
      })}
      <div className="tdp-cp-watch-add">
        <input
          type="text"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add pair e.g. AUD/CAD"
        />
        <button className="tdp-cp-btn primary" onClick={add}>+</button>
      </div>
    </div>
  );
}

function BulkConvert() {
  const [items, setItems] = useState<BulkItem[]>([
    { amount: 45000, from: "JPY", to: "USD" },
    { amount: 22000, from: "JPY", to: "USD" },
    { amount: 50000, from: "JPY", to: "USD" },
    { amount: 5400, from: "EUR", to: "USD" },
  ]);
  const { loading } = useBulkConvert();

  return (
    <div className="tdp-cp-bulk">
      <div className="tdp-cp-bulk-head">
        <span>Description</span>
        <span>Amount</span>
        <span>From</span>
        <span></span>
        <span>To</span>
        <span>Result</span>
        <span></span>
      </div>
      {items.map((item, i) => (
        <BulkRow
          key={i}
          item={item}
          onUpdate={(updated) => {
            const next = [...items];
            next[i] = updated;
            setItems(next);
          }}
          onRemove={() => setItems(items.filter((_, j) => j !== i))}
        />
      ))}
      <div className="tdp-cp-bulk-add" onClick={() => setItems([...items, { amount: 100, from: "USD", to: "EUR" }])}>
        + Add another row
      </div>
      <div className="tdp-cp-bulk-summary">
        <span style={{ fontSize: 13, color: "var(--indigo)", fontWeight: 600 }}>
          Total · {items.length} items → <strong style={{ color: "var(--gray-900)" }}>USD</strong>
        </span>
        <span className="tdp-cp-bulk-total">
          {loading ? "..." : "calculated live below"}
        </span>
      </div>
    </div>
  );
}

function BulkRow({ item, onUpdate, onRemove }: { item: BulkItem; onUpdate: (i: BulkItem) => void; onRemove: () => void }) {
  const { data, loading } = useConvert(item.from, item.to, item.amount);
  const { data: codes } = useCodes();
  const result = data ? data.result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  const descriptions: Record<string, string> = {
    "JPY>USD": "Hotel — Marriott Tokyo",
    "EUR>USD": "Client invoice #INV-2401",
    "GBP>USD": "London dinner",
  };
  const descKey = `${item.from}>${item.to}`;
  const desc = descriptions[descKey] || `${item.from} → ${item.to}`;
  const icon = item.from === "JPY" ? "🏨" : item.from === "EUR" ? "📄" : "💱";

  return (
    <div className="tdp-cp-bulk-row">
      <div className="tdp-cp-bulk-desc"><div className="tdp-cp-bulk-icon">{icon}</div>{desc}</div>
      <input
        className="tdp-cp-bulk-input"
        value={item.amount.toLocaleString()}
        onChange={(e) => {
          const v = parseFloat(e.target.value.replace(/,/g, ""));
          if (!isNaN(v)) onUpdate({ ...item, amount: v });
        }}
      />
      <select className="tdp-cp-bulk-select" value={item.from} onChange={(e) => onUpdate({ ...item, from: e.target.value })}>
        {codes?.codes.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
      </select>
      <span className="tdp-cp-bulk-arrow">→</span>
      <select className="tdp-cp-bulk-select" value={item.to} onChange={(e) => onUpdate({ ...item, to: e.target.value })}>
        {codes?.codes.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
      </select>
      <span className="tdp-cp-bulk-result">{loading ? "..." : result}</span>
      <span className="tdp-cp-bulk-remove" onClick={onRemove}>×</span>
    </div>
  );
}

function UseCaseCards() {
  const cards = [
    { badge: "A1", icon: "⚡", title: "Quick Convert", desc: "Convert any amount between 33 currencies with live ECB rates.", stat: "$10,000", label: "last" },
    { badge: "A2", icon: "🌍", title: "Compare Currencies", desc: "See the same amount in 5+ currencies side by side with relative bars.", stat: "6", label: "currencies" },
    { badge: "A4", icon: "✈️", title: "Travel Budget", desc: "Add up to 100 trip expenses, see the total in your home currency.", stat: "$1,847", label: "Tokyo total" },
    { badge: "B1", icon: "📄", title: "Invoice Converter", desc: "Convert client invoices from their currency to your home currency.", stat: "€5,400", label: "last invoice" },
    { badge: "B2", icon: "👥", title: "Multi-Client View", desc: "Track rates for every client currency in one glance. Save as preset.", stat: "6", label: "clients" },
    { badge: "C1", icon: "📊", title: "Live Dashboard", desc: "Watch all your business rates in one place. Auto-refreshes every 10s.", stat: "8", label: "pairs" },
  ];
  return (
    <div className="tdp-cp-cards">
      {cards.map((c) => (
        <div className="tdp-cp-use-card" key={c.badge}>
          <span className="tdp-cp-use-badge">{c.badge}</span>
          <div className={`tdp-cp-use-icon tdp-cp-use-icon-${c.badge.charAt(0).toLowerCase()}`}>{c.icon}</div>
          <div className="tdp-cp-use-title">{c.title}</div>
          <div className="tdp-cp-use-desc">{c.desc}</div>
          <div className="tdp-cp-use-stat">
            <span className="tdp-cp-use-stat-value">{c.stat}</span>
            <span className="tdp-cp-use-stat-label">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GapCards() {
  const gaps = [
    { label: "A3 CHART", title: "📈 30-day historical chart", desc: "Pair sparkline is empty · needs D1 seed for 33×32 pairs × 30 days", fixed: true },
    { label: "C3 ALERTS", title: "🔔 Rate alerts & thresholds", desc: "Notify me when EUR/USD crosses 1.15 · needs email cron Worker" },
    { label: "C5 CRYPTO", title: "₿ Crypto + fiat mix", desc: "BTC, ETH, SOL alongside fiat · CoinGecko swapped to CoinPaprika", fixed: true },
  ];
  return (
    <div className="tdp-cp-cards">
      {gaps.map((g) => (
        <div className="tdp-cp-gap-card" key={g.label}>
          <div className="tdp-cp-gap-label">
            {g.fixed ? "✅ SHIPPED" : "GAP"} · {g.label}
          </div>
          <div className="tdp-cp-gap-title">{g.title}</div>
          <div className="tdp-cp-gap-desc">{g.desc}</div>
        </div>
      ))}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread] = useState(3);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="tdp-cp-notif-wrap" ref={ref}>
      <button className="tdp-cp-notif-btn" onClick={() => setOpen(!open)}>
        🔔
        {unread > 0 && <span className="tdp-cp-notif-badge pulse">{unread}</span>}
      </button>
      {open && (
        <div className="tdp-cp-notif-panel">
          <div className="tdp-cp-notif-head">
            <div className="tdp-cp-notif-title"><LiveDot size="sm" />Rate alerts</div>
            <span className="tdp-cp-notif-clear">Mark all read</span>
          </div>
          <div className="tdp-cp-notif-list">
            <div className="tdp-cp-notif-item unread">
              <div className="tdp-cp-notif-icon up">↑</div>
              <div>
                <div className="tdp-cp-notif-msg"><strong>EUR/USD</strong> crossed your alert at <strong>1.1420</strong></div>
                <div className="tdp-cp-notif-time">Just now · Your alert: 1.1400</div>
              </div>
            </div>
            <div className="tdp-cp-notif-item unread">
              <div className="tdp-cp-notif-icon up">↑</div>
              <div>
                <div className="tdp-cp-notif-msg"><strong>USD/JPY</strong> is up <strong>+0.42%</strong> in the last hour</div>
                <div className="tdp-cp-notif-time">5 min ago · Big move</div>
              </div>
            </div>
            <div className="tdp-cp-notif-item unread">
              <div className="tdp-cp-notif-icon alert">★</div>
              <div>
                <div className="tdp-cp-notif-msg">Your <strong>Tokyo budget</strong> total updated: <strong>$1,847</strong></div>
                <div className="tdp-cp-notif-time">1 hour ago · Bulk convert</div>
              </div>
            </div>
          </div>
          <div className="tdp-cp-notif-foot">⚙ Manage alerts & thresholds</div>
        </div>
      )}
    </div>
  );
}

export function CurrencyPage() {
  return (
    <main className="tdp-cp">
      <div className="tdp-cp-greeting">Good afternoon, Natsuki</div>
      <h1 className="tdp-cp-title">Convert currency</h1>
      <p className="tdp-cp-sub">
        33 currencies · live ECB rates · choose a tab above to switch views
      </p>

      <div className="tdp-cp-notif-float">
        <NotificationBell />
      </div>

      <div className="tdp-cp-tabs">
        <div className="tdp-cp-tab active">⚡ Convert</div>
        <div className="tdp-cp-tab">📊 Bulk <span className="tdp-cp-tab-count">4</span></div>
        <div className="tdp-cp-tab">⭐ Watchlist <span className="tdp-cp-tab-count">5</span></div>
        <div className="tdp-cp-tab">🌍 Compare <span className="tdp-cp-tab-count">6</span></div>
        <div className="tdp-cp-tab">📜 History</div>
        <div style={{ flex: 1 }} />
        <div className="tdp-cp-tab-meta">
          <span className="tdp-cp-live-pill"><LiveDot size="sm" />Live</span>
          <span>Auto-refresh <strong>10s</strong></span>
        </div>
      </div>

      <HeroConverter />

      <div className="tdp-cp-pills">
        <div className="tdp-cp-pill">⚡ Quick convert</div>
        <div className="tdp-cp-pill">🌍 Compare 6 currencies</div>
        <div className="tdp-cp-pill">✈️ Travel budget</div>
        <div className="tdp-cp-pill">📄 Invoice converter</div>
        <div className="tdp-cp-pill">📊 Bulk convert</div>
        <div className="tdp-cp-pill">📥 Import CSV</div>
        <div className="tdp-cp-pill">📤 Export</div>
      </div>

      <div className="tdp-cp-two-col">
        <div className="tdp-cp-card">
          <div className="tdp-cp-card-head">
            <div className="tdp-cp-card-title">
              <LiveDot size="sm" />
              📈 Live rate grid
              <span className="tdp-cp-card-pill">C1</span>
            </div>
            <span className="tdp-cp-card-meta">Auto-refresh <strong>10s</strong> · 7 pairs</span>
          </div>
          <div className="tdp-cp-card-body tight">
            <LiveRateGrid />
          </div>
        </div>

        <div className="tdp-cp-card">
          <div className="tdp-cp-card-head">
            <div className="tdp-cp-card-title">
              <LiveDot size="sm" />
              ⭐ Watchlist
              <span className="tdp-cp-card-pill">A5</span>
            </div>
            <span className="tdp-cp-card-meta">5 pairs · client-side</span>
          </div>
          <div className="tdp-cp-card-body tight">
            <Watchlist />
          </div>
        </div>
      </div>

      <div className="tdp-cp-card">
        <div className="tdp-cp-card-head">
          <div className="tdp-cp-card-title">
            <LiveDot size="sm" />
            📊 Bulk convert
            <span className="tdp-cp-card-pill">A4 · B4 · C2</span>
            <span className="tdp-cp-card-meta" style={{ marginLeft: 8 }}>Tokyo trip · 4 items</span>
          </div>
          <div className="tdp-cp-card-actions">
            <button className="tdp-cp-btn">📥 Import CSV</button>
            <button className="tdp-cp-btn">📤 Export</button>
            <button className="tdp-cp-btn primary">+ New row</button>
          </div>
        </div>
        <div className="tdp-cp-card-body tight">
          <BulkConvert />
        </div>
      </div>

      <h2 className="tdp-cp-section-title">Other ways to use Currency</h2>
      <p className="tdp-cp-section-sub">
        Click any card to open in a new tab · covers 15 use cases across A/B/C segments
      </p>
      <UseCaseCards />

      <h2 className="tdp-cp-section-title">Coming soon</h2>
      <p className="tdp-cp-section-sub">
        Features that need additional data or work before they ship
      </p>
      <GapCards />
    </main>
  );
}
