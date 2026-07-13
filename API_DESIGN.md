# Currency API Design — TimeAndDatePro

## Overview

9 read-only endpoints, all GET, Cloudflare Worker + Hono + D1 + KV.
Designed for the unified real-time dashboard (Segments A/B/C).

## Endpoints

### 1. `GET /api/v1/currency/codes`
**Purpose**: List all supported currencies with metadata.
**Response**:
```json
{
  "success": true,
  "data": {
    "count": 33,
    "codes": [
      { "code": "USD", "name": "US Dollar", "symbol": "$", "flag": "🇺🇸", "decimals": 2 },
      { "code": "EUR", "name": "Euro", "symbol": "€", "flag": "🇪🇺", "decimals": 2 },
      ...
    ]
  }
}
```
**Edge cases**:
- Empty result: 200 with `count: 0, codes: []`
- DB unavailable: 503 with retry-after

### 2. `GET /api/v1/currency/rates?base=USD`
**Purpose**: All rates against a base currency.
**Query**: `base` (3-letter code, default USD)
**Response**:
```json
{
  "success": true,
  "data": {
    "base": "USD",
    "timestamp": 1720876800,
    "source": "frankfurter",
    "stale": false,
    "nextRefreshIn": 3600,
    "rates": {
      "EUR": 0.8759,
      "GBP": 0.7821,
      "JPY": 156.4,
      ...
    }
  }
}
```
**Edge cases**:
- Missing base: default to USD
- Invalid base (not 3 letters, not in codes table): 400 `invalid_base`
- All sources down: 200 with `stale: true` + last known rates from D1 + 24h-old timestamp
- Partial source down: return available rates + warning

### 3. `GET /api/v1/currency/convert?from=USD&to=EUR&amount=100`
**Purpose**: Convert a specific amount.
**Query**: `from` (req), `to` (req), `amount` (req, number)
**Response**:
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "amount": 100,
    "result": 87.59,
    "rate": 0.8759,
    "timestamp": 1720876800,
    "source": "frankfurter",
    "stale": false
  }
}
```
**Edge cases**:
- Missing param: 400 `missing_from` / `missing_to` / `missing_amount`
- Invalid amount (NaN, negative, > 1e15): 400 `invalid_amount`
- Same currency (USD→USD): 200 with `result: amount, rate: 1`
- Unknown code: 400 `unknown_currency`
- Inverse rate fallback: if USD→EUR missing, compute from EUR→USD

### 4. `GET /api/v1/currency/pair?from=USD&to=EUR`
**Purpose**: Pair detail with change metrics + 30-day mini-chart.
**Query**: `from` (req), `to` (req)
**Response**:
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "rate": 0.8759,
    "timestamp": 1720876800,
    "change": {
      "24h": -0.0021,
      "24hPct": -0.24,
      "7d": 0.0089,
      "7dPct": 1.03,
      "30d": -0.0152,
      "30dPct": -1.71
    },
    "chart": [
      { "date": "2026-06-12", "rate": 0.8911 },
      { "date": "2026-06-13", "rate": 0.8905 },
      ...
    ],
    "source": "frankfurter",
    "stale": false
  }
}
```
**Edge cases**:
- Missing from/to: 400
- Same currency: 200 with `rate: 1, change: { 0, 0 }, chart: [{date, rate:1}]`
- Less than 30 days of history: return what's available + note in response
- All history missing: 200 with `chart: []`

### 5. `GET /api/v1/currency/timeseries?from=USD&to=EUR&start=2026-01-01&end=2026-07-12`
**Purpose**: Historical time series for charts.
**Query**: `from`, `to`, `start` (YYYY-MM-DD, req), `end` (YYYY-MM-DD, req)
**Response**:
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "start": "2026-01-01",
    "end": "2026-07-12",
    "count": 192,
    "source": "frankfurter",
    "series": [
      { "date": "2026-01-01", "rate": 0.9212 },
      { "date": "2026-01-02", "rate": 0.9201 },
      ...
    ]
  }
}
```
**Edge cases**:
- Missing dates: 400
- Invalid date format: 400 `invalid_date_format`
- start > end: 400 `start_after_end`
- Range > 5 years: 400 `range_too_large` (max 5 years for performance)
- Frankfurter limit: returns up to ~30 years of data

### 6. `POST /api/v1/currency/bulk`
**Purpose**: Convert multiple amounts in one call.
**Body**:
```json
{
  "items": [
    { "amount": 100, "from": "USD", "to": "EUR" },
    { "amount": 50, "from": "GBP", "to": "USD" }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "count": 2,
    "results": [
      { "amount": 100, "from": "USD", "to": "EUR", "result": 87.59, "error": null },
      { "amount": 50, "from": "GBP", "to": "USD", "result": 63.92, "error": null }
    ]
  }
}
```
**Edge cases**:
- Empty array: 400 `empty_items`
- More than 100 items: 400 `too_many_items`
- Invalid item: include in result with `error: "invalid_amount"`, don't fail whole request
- Malformed JSON: 400 `invalid_json`

### 7. `GET /api/v1/crypto/prices?ids=bitcoin,ethereum&vs=usd`
**Purpose**: Multiple crypto prices in one call.
**Query**: `ids` (comma-separated slugs, req), `vs` (fiat code, default USD)
**Response**:
```json
{
  "success": true,
  "data": {
    "vs": "USD",
    "timestamp": 1720876800,
    "source": "coingecko",
    "prices": {
      "bitcoin": { "price": 67423.21, "change24h": 1.42, "change7d": -3.21, "marketCap": 1324000000000 },
      "ethereum": { "price": 3521.55, "change24h": 0.89, "change7d": 2.15, "marketCap": 423000000000 }
    }
  }
}
```
**Edge cases**:
- Missing ids: 400
- Unknown id: skip + log warning, don't fail
- Too many ids (>50): 400
- CoinGecko down: 200 with `stale: true` + cached prices + 60s-old timestamp

### 8. `GET /api/v1/crypto/convert?from=BTC&to=USD&amount=1`
**Purpose**: Convert crypto amount.
**Query**: `from` (crypto slug or symbol, req), `to` (fiat or crypto, req), `amount` (req)
**Response**:
```json
{
  "success": true,
  "data": {
    "from": "BTC",
    "to": "USD",
    "amount": 1,
    "result": 67423.21,
    "rate": 67423.21,
    "timestamp": 1720876800,
    "source": "coingecko",
    "stale": false
  }
}
```
**Edge cases**:
- Same asset: 200 with `result: amount, rate: 1`
- Cross-crypto (BTC→ETH): compute via USD bridge
- Invalid amount: 400
- Unknown asset: 400 `unknown_asset`

### 9. `GET /api/v1/status`
**Purpose**: Health of all rate sources (for `/en/status` page).
**Response**:
```json
{
  "success": true,
  "data": {
    "timestamp": 1720876800,
    "sources": {
      "frankfurter": { "status": "ok", "lastFetch": 1720873200, "age": 3600, "pairsTracked": 33 },
      "allratestoday": { "status": "ok", "lastFetch": 1720876740, "age": 60, "pairsTracked": 161 },
      "coingecko": { "status": "degraded", "lastFetch": 1720876680, "age": 120, "error": "rate limit approaching" }
    },
    "audit": {
      "last24h": {
        "checks": 24,
        "avgDeltaPct": 0.02,
        "maxDeltaPct": 0.08,
        "aboveThreshold": 0
      }
    }
  }
}
```
**Edge cases**:
- All sources down: 200 with all `status: "down"`, page renders warning
- Audit table empty: 200 with `audit: { last24h: null }`

---

## Rate Limiting (Worker-level)

- 100 requests/min per IP for unauthenticated
- 1000 requests/min for authenticated (year 2)
- 429 response with `Retry-After` header
- KV-based sliding window

## Caching Strategy

| Endpoint | KV TTL | D1 TTL | Notes |
|---|---|---|---|
| `/codes` | 24h | Permanent | Rarely changes |
| `/rates` | 5min | 24h | Cron refreshes hourly |
| `/convert` | 5min | 24h | Derived from /rates |
| `/pair` | 5min | 24h | Chart from history |
| `/timeseries` | 1h | Permanent | Historical, static |
| `/bulk` | None | None | Compute on-the-fly |
| `/crypto/prices` | 60s | 5min | Real-time, short TTL |
| `/crypto/convert` | 60s | 5min | Derived |
| `/status` | 30s | None | Always fresh |

## Fallback Chain (per request)

```
1. Check KV cache (instant)
2. If miss: check D1 (10-50ms)
3. If D1 stale or missing: fetch from upstream
   - fiat: try AllRatesToday (60s) → fall back to Frankfurter (daily)
   - crypto: try CoinGecko (30s)
4. If all upstreams fail: return D1 cache with stale: true
5. If D1 cache missing: return 503 with retry-after
```

## Schema Versioning

All responses include `version: "1.0"` field. Breaking changes bump major version + new route prefix (`/api/v2/`).

## Error Response Format (uniform)

```json
{
  "success": false,
  "error": {
    "code": "invalid_amount",
    "message": "Amount must be a positive number",
    "status": 400
  }
}
```

## OpenAPI Spec (auto-generated from code)

Exposed at `/api/v1/openapi.json` for documentation + Postman import.
