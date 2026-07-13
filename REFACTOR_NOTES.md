# Currency API — Refactor Notes (for Week 2+)

These are deliberate tech-debt items from the Option-A "ship now, refactor later" approach. Each one has a recommended fix and an estimated time. Don't touch in Week 1 — ship the API, get traffic, then refactor with real usage data.

## Tech Debt to Address

### 1. `CurrencyConverter.tsx` is 500+ lines and adding dashboard on top will be messy
**Where**: `src/components/tools/CurrencyConverter.tsx` (React app, not Worker)
**Why**: Built incrementally, no clean abstraction over the rate source, fetch logic mixed with UI
**Fix**: Extract to `src/lib/currency/` module with:
  - `client.ts` — typed wrapper around the API
  - `formatter.ts` — Intl.NumberFormat wrappers (number, currency, percent)
  - `hooks/` — useRate, usePair, useTimeseries
**Time**: 1 day

### 2. Upstream call works from curl but not from Worker (HTTP 404)
**Where**: `src/lib/upstream.ts` in Worker
**Why**: Frankfurter + AllRatesToday return 404 when called from Worker context, but 200 from curl. Likely Worker egress IP is on a blocklist, or there's a routing issue.
**Workaround**: Pre-populate D1 via curl + wrangler, serve from D1. This works for now.
**Real fix**: Test from Worker with different User-Agent, test from different Cloudflare region, or switch to a provider with better CF compatibility (e.g., Open Exchange Rates, Currencybeacon).
**Time**: 0.5 day investigation + 0.5 day fix

### 3. No rate limiting on the API
**Where**: All endpoints
**Why**: Anyone can hammer the API. Cloudflare Workers free tier allows 100K req/day. One bad client could exhaust it.
**Fix**: Add per-IP rate limiting via KV (sliding window). 100 req/min for unauthenticated.
**Time**: 0.5 day

### 4. No authentication or API keys
**Where**: All endpoints
**Why**: B2B customers can't use it (no SLA, no isolation). Abuse risk.
**Fix**: Add optional `X-API-Key` header check. Authenticated = 1000 req/min. Free tier = 100 req/min.
**Time**: 1 day (includes KV-based key validation, billing tracking)

### 5. No caching of crypto prices
**Where**: `currency_rates_latest` doesn't have crypto, only `crypto_prices_latest`
**Why**: My bulk endpoint doesn't check `crypto_prices_latest` for cached crypto rates, only fiat.
**Fix**: Add a cron Worker that hits CoinGecko every 5min and populates `crypto_prices_latest`. Add a fallback in `/crypto/convert` that queries D1 if upstream fails.
**Time**: 0.5 day

### 6. `currency_rates_latest` is only seeded for USD base
**Where**: D1 `currency_rates_latest` table
**Why**: The seed only inserted USD→X rates. `/convert?from=EUR&to=USD` works (inverse calc), but `/convert?from=EUR&to=GBP` doesn't.
**Fix**: Add a cron Worker that refreshes all 33×33 ECB pairs hourly. Or seed all inverse pairs on first run.
**Time**: 0.5 day

### 7. `currency_rates_history` is only seeded for USD→EUR (21 days)
**Where**: D1 `currency_rates_history` table
**Why**: Most pairs have no history. `/pair?from=EUR&to=GBP` returns `chart: []`.
**Fix**: Cron Worker that fetches and stores history for top 20 pairs daily. Or pre-seed top 50 pairs with 1 year of history on first run.
**Time**: 1 day (mostly API calls + storage)

### 8. No CORS preflight handling for custom headers
**Where**: `src/middleware/cors.ts`
**Why**: If we add `X-API-Key` header, browsers will send a preflight OPTIONS request. Current CORS only allows `Content-Type, Authorization, X-Requested-With`.
**Fix**: Add `X-API-Key` to allowed headers. Test preflight.
**Time**: 0.25 day

### 9. No observability (logs, metrics, traces)
**Where**: All endpoints
**Why**: When something breaks at 3am, we have nothing to look at except `wrangler tail` (which shows recent logs, not history).
**Fix**: Add structured logging (JSON with ts, route, status, duration, ip). Pipe to a free observability service (Logflare free tier, or Cloudflare Workers Analytics Engine free tier).
**Time**: 1 day

### 10. The pair endpoint has a known bug — chart is empty if no history
**Where**: `/api/v1/currency/pair`
**Why**: I fixed the self-fetch bug, but if `currency_rates_history` is empty for the pair, the chart returns `[]` instead of computing change from a different source.
**Fix**: Fall back to fetching history from upstream on empty D1, OR compute change from cached `currency_rates_latest` only.
**Time**: 0.5 day

### 11. No automated accuracy audit (Study #3 SLA)
**Where**: `rate_audit` table is empty
**Why**: I designed the cron but didn't build it. The `/status` endpoint shows `audit: { last24h: null }`.
**Fix**: Build a cron Worker that runs hourly, compares our cached rates to the upstream source, inserts into `rate_audit`. Alert on delta > 0.5%.
**Time**: 0.5 day

### 12. `/api/v1/currency/bulk` doesn't validate crypto items
**Where**: `currency.post("/bulk")` in `src/routes/currency.ts`
**Why**: It only handles fiat pairs. If someone sends `{"from": "BTC", "to": "USD"}`, it tries to find it in `currency_rates_latest` (fiat table) and fails.
**Fix**: Detect crypto ids/symbols in the bulk handler and route to crypto conversion. Or document that bulk is fiat-only and add a separate `/crypto/bulk` endpoint.
**Time**: 0.5 day

## Not Tech Debt (Deliberate Trade-offs)

### ✅ Pre-populated D1 with USD rates (manual SQL)
This is fine. It's a one-time seed. The cron will refresh going forward.

### ✅ Worker upstream calls fail (404 from Frankfurter)
This is concerning but mitigated by D1 fallback. Investigate in Week 2.

### ✅ No OpenAPI spec at `/api/v1/openapi.json`
Postman collection covers this for now. Generate from code in Week 2 with `hono-openapi` middleware.

### ✅ No rate limiting
Acceptable for MVP. Add in Week 2 before B2B customers.

## Priority Order for Refactor

1. **#1 CurrencyConverter.tsx refactor** (1 day) — needed before dashboard MVP
2. **#2 Upstream 404 from Worker** (1 day) — needed for live data, not just seed
3. **#6 Seed all 33×33 pairs** (0.5 day) — needed for /convert to work for non-USD pairs
4. **#3 Rate limiting** (0.5 day) — needed before any public launch
5. **#4 API keys** (1 day) — needed for B2B
6. **#7 Seed history** (1 day) — needed for charts
7. **Everything else** in Week 2-3
