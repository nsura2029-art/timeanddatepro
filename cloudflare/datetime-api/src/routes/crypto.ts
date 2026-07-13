// src/routes/crypto.ts
// Crypto API endpoints (Phase 6.5) — prices + convert. Backed by
// CoinGecko (free, 10-30 req/min) with D1 cache fallback.

import { Hono } from "hono";
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { ok, err } from "../lib/responses";
import { fetchCoinGeckoPrices } from "../lib/upstream";

type Bindings = { DB: D1Database; CACHE: KVNamespace };
const crypto = new Hono<{ Bindings: Bindings }>();

// CoinPaprika slugs (replaces CoinGecko — was 403 from CF Worker)
const KNOWN_CRYPTO_IDS = new Set([
  "btc-bitcoin", "eth-ethereum", "usdt-tether", "usdc-usd-coin",
  "bnb-binance-coin", "xrp-xrp", "ada-cardano", "sol-solana",
  "doge-dogecoin", "trx-tron", "dot-polkadot", "matic-polygon",
  "ltc-litecoin", "shib-shiba-inu", "dai-dai", "avax-avalanche",
  "link-chainlink", "bch-bitcoin-cash", "uni-uniswap", "atom-cosmos",
]);

interface CryptoPrice {
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
}

// ── GET /api/v1/crypto/prices?ids=bitcoin,ethereum&vs=usd ──
crypto.get("/prices", async (c) => {
  const idsParam = c.req.query("ids") || "";
  const vs = (c.req.query("vs") || "USD").toLowerCase();
  if (!idsParam) return err(c, 400, "ids required (comma-separated CoinGecko slugs)", "missing_ids");
  const ids = idsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (ids.length === 0) return err(c, 400, "at least one id required", "empty_ids");
  if (ids.length > 50) return err(c, 400, "max 50 ids per request", "too_many_ids");

  // Filter known + warn unknown
  const known = ids.filter((id) => KNOWN_CRYPTO_IDS.has(id));
  const unknown = ids.filter((id) => !KNOWN_CRYPTO_IDS.has(id));
  if (known.length === 0) return err(c, 400, "no known crypto ids in request", "all_unknown");

  // Try CoinPaprika (replaces CoinGecko — was 403 from CF Worker)
  const result = await fetchCoinGeckoPrices(known, vs);
  if (!result.ok) return err(c, 503, `coinpaprika_unavailable: ${result.error}`, "upstream_down");
  return ok(c, {
    vs: vs.toUpperCase(),
    timestamp: Math.floor(Date.now() / 1000),
    source: result.source || "coinpaprika",
    stale: false,
    prices: result.data!,
    warnings: unknown.length > 0 ? { unknownIds: unknown } : undefined,
  });
});

// ── GET /api/v1/crypto/convert?from=BTC&to=USD&amount=1 ──
crypto.get("/convert", async (c) => {
  const from = (c.req.query("from") || "").toLowerCase();
  const to = (c.req.query("to") || "").toLowerCase();
  const amount = c.req.query("amount");
  if (!from) return err(c, 400, "from required (crypto slug or symbol)", "missing_from");
  if (!to) return err(c, 400, "to required (fiat code or crypto slug)", "missing_to");
  if (amount === undefined) return err(c, 400, "amount required", "missing_amount");
  if (!Number.isFinite(Number(amount)) || Number(amount) < 0) return err(c, 400, "amount must be a non-negative number", "invalid_amount");

  // Resolve symbols to slugs (BTC -> bitcoin, etc.)
  const SYMBOL_TO_SLUG: Record<string, string> = {
    btc: "bitcoin", eth: "ethereum", usdt: "tether", bnb: "binancecoin",
    sol: "solana", usdc: "usd-coin", xrp: "ripple", doge: "dogecoin",
    ada: "cardano", trx: "tron", avax: "avalanche-2", link: "chainlink",
    dot: "polkadot", matic: "matic-network", ltc: "litecoin", shib: "shiba-inu",
    uni: "uniswap", xlm: "stellar", atom: "cosmos", xmr: "monero",
  };
  const fromSlug = SYMBOL_TO_SLUG[from] || from;
  const toSlug = SYMBOL_TO_SLUG[to] || to;
  if (!KNOWN_CRYPTO_IDS.has(fromSlug) && !isFiatCode(to.toUpperCase())) {
    return err(c, 400, `unknown_asset: ${from}`, "unknown_asset");
  }

  // Same asset
  if (fromSlug === toSlug || from === to) {
    return ok(c, {
      from: from.toUpperCase(), to: to.toUpperCase(), amount: Number(amount),
      result: Number(amount), rate: 1, timestamp: Math.floor(Date.now() / 1000),
      source: "identity", stale: false,
    });
  }

  // Fetch prices for both assets
  const ids: string[] = [];
  if (KNOWN_CRYPTO_IDS.has(fromSlug)) ids.push(fromSlug);
  if (KNOWN_CRYPTO_IDS.has(toSlug)) ids.push(toSlug);
  if (ids.length === 0) return err(c, 400, "no crypto assets to price", "no_crypto_assets");
  const result = await fetchCoinGeckoPrices(ids, "usd");
  if (!result.ok) return err(c, 503, `coingecko_unavailable: ${result.error}`, "upstream_down");

  // Compute conversion
  let rate = 0;
  let source = "coingecko";
  if (KNOWN_CRYPTO_IDS.has(fromSlug) && isFiatCode(to.toUpperCase())) {
    rate = result.data![fromSlug]?.price || 0;
  } else if (isFiatCode(from.toUpperCase()) && KNOWN_CRYPTO_IDS.has(toSlug)) {
    const toPrice = result.data![toSlug]?.price || 0;
    rate = toPrice > 0 ? 1 / toPrice : 0;
  } else if (KNOWN_CRYPTO_IDS.has(fromSlug) && KNOWN_CRYPTO_IDS.has(toSlug)) {
    const fp = result.data![fromSlug]?.price || 0;
    const tp = result.data![toSlug]?.price || 0;
    rate = fp > 0 && tp > 0 ? tp / fp : 0;
    source = "coingecko_bridge";
  } else {
    return err(c, 400, "unrecognized asset pair", "unknown_assets");
  }
  if (rate === 0) return err(c, 503, "rate computation failed", "compute_failed");
  return ok(c, {
    from: from.toUpperCase(), to: to.toUpperCase(), amount: Number(amount),
    result: Number((Number(amount) * rate).toPrecision(12)),
    rate, timestamp: Math.floor(Date.now() / 1000), source, stale: false,
  });
});

function isFiatCode(s: string): boolean {
  return /^[A-Z]{3}$/.test(s) && !KNOWN_CRYPTO_IDS.has(s.toLowerCase());
}

export { crypto as cryptoRouter };
