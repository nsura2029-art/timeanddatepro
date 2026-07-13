// src/lib/currency/formatter.ts
// Intl-based formatters for currency, percent, and large numbers.
// All functions are pure, no React, no async — safe to use anywhere.

import type { CurrencyCode } from "./client";

const FIAT_CODE_SET = new Set([
  "USD","EUR","GBP","JPY","CHF","AUD","CAD","CNY","HKD","NZD",
  "SEK","KRW","SGD","NOK","MXN","INR","BRL","ZAR","TRY","PLN",
  "DKK","THB","IDR","HUF","CZK","ILS","CLP","PHP","AED","COP",
  "SAR","MYR","RON",
]);

/** Is this a fiat code (3 uppercase letters, not crypto)? */
export function isFiat(code: string): boolean {
  return /^[A-Z]{3}$/.test(code) && FIAT_CODE_SET.has(code.toUpperCase());
}

/** Symbol lookup with a sane fallback (the code itself). */
export function symbolFor(code: string, codes?: CurrencyCode[]): string {
  const c = codes?.find((x) => x.code === code.toUpperCase());
  return c?.symbol || code.toUpperCase();
}

/** Decimal precision for a currency (JPY=0, most others=2). */
export function decimalsFor(code: string, codes?: CurrencyCode[]): number {
  const c = codes?.find((x) => x.code === code.toUpperCase());
  return c?.decimals ?? (/^JPY|^KRW|^IDR|^HUF|^CLP|^COP$/.test(code.toUpperCase()) ? 0 : 2);
}

/**
 * Format an amount as a currency string for a given code.
 * Uses Intl.NumberFormat for locale-correct grouping + symbol placement.
 *
 * @example formatAmount(1234.5, "USD", "en-US") → "$1,234.50"
 * @example formatAmount(1234.5, "EUR", "de-DE") → "1.234,50 €"
 */
export function formatAmount(
  amount: number,
  code: string,
  locale: string = "en-US",
  codes?: CurrencyCode[]
): string {
  const sym = symbolFor(code, codes);
  const dec = decimalsFor(code, codes);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code.toUpperCase(),
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(amount);
  } catch {
    // Fallback: use the symbol manually
    return `${sym}${amount.toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  }
}

/**
 * Format a bare number with locale-aware grouping (no symbol).
 * @example formatNumber(1234567.89, "en-US") → "1,234,567.89"
 */
export function formatNumber(
  n: number,
  locale: string = "en-US",
  decimals: number = 2
): string {
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percent change with a sign + color hint.
 * @example formatPercent(1.23) → "+1.23%"
 * @example formatPercent(-0.5) → "-0.50%"
 * @example formatPercent(0) → "0.00%"
 */
export function formatPercent(pct: number, decimals: number = 2): string {
  if (Math.abs(pct) < 0.005) return "0.00%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(decimals)}%`;
}

/** "↑" / "↓" / "→" arrow for a numeric change. */
export function arrowFor(pct: number): "↑" | "↓" | "→" {
  if (Math.abs(pct) < 0.005) return "→";
  return pct > 0 ? "↑" : "↓";
}

/** Compact a large number: 1,234,567 → "1.23M". */
export function formatCompact(n: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

/** "2 hours ago", "Just now", "Yesterday" — human-readable relative time. */
export function formatRelative(unixSeconds: number, now: number = Date.now() / 1000): string {
  const diff = now - unixSeconds;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  // Older: show date
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Convert a unix timestamp to a short date string. */
export function formatDate(unixSeconds: number, locale: string = "en-US"): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}
