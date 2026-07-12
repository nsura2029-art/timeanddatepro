# TimeAndDatePro

A global time/date workspace + public REST API + admin control room.

Live API:  https://timeanddatepro.com/api/v1
API docs:  https://timeanddatepro.com/docs

## Stack
- **Frontend:** Vite + React 19 + TypeScript + Tailwind v4
- **Backend:** Express 4 + Vite middleware (`server.ts`)
- **DB:** Node built-in `node:sqlite` (Node 22.5+) — zero native build
- **Data sources:** ECB eurofxref (currency), Wikipedia REST + curated RSS (news + history), SunCalc (sun position), Open-Meteo-ready

## Run locally

**Prerequisites:** Node.js **22.5+** (for `node:sqlite`).

```bash
npm install
cp .env.example .env.local   # optional — only ADMIN_PASS and JWT_SECRET need values
npm run dev                  # → http://localhost:3000
```

### Cross-platform

Scripts are written so they work identically on Windows (PowerShell / cmd.exe), Mac, and Linux. The dev script invokes Node directly:

```bash
node --experimental-sqlite --no-warnings=ExperimentalWarning --import tsx server.ts
```

No `NODE_OPTIONS=...` bash-only syntax. No `cross-env` dependency. No native build.

> **Windows users:** if you previously hit `gyp ERR! find Python / find VS` errors from `better-sqlite3`, those are gone now — `node:sqlite` is built into Node itself.

### Admin panel

Visible to everyone at `/admin`, but the API is auth-gated.

```bash
# On first boot, a default user is seeded:
#   username: admin
#   password: <generated, 18 chars, written to ./.admin-credentials>
cat .admin-credentials
# Then open http://localhost:3000/admin
```

To set custom credentials:
```bash
echo "ADMIN_USER=admin" >> .env
echo "ADMIN_PASS=your-strong-password" >> .env
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" >> .env
```

## Local frontend + live dev API (recommended)

The fastest way to develop: run the **Vite dev server on your machine**, pointing it at the **already-deployed dev API** at `https://dev.api.dateandtime.live`. No need to run the Worker locally unless you're changing the API itself.

**Prerequisites:** Node.js 22.5+.

### 1. Clone + install

```bash
git clone https://github.com/nsura2029-art/timeanddatepro.git
cd timeanddatepro
npm install
```

### 2. Start Vite (frontend only, hits the live dev API)

```bash
VITE_API_BASE=https://dev.api.dateandtime.live npx vite
```

Open **http://localhost:5173** in your browser. You should see the full app with live city data, holidays, DST info, currency rates, and the v2 search.

The dev API at `dev.api.dateandtime.live` is the **deployed Worker** (Cloudflare edge) — 46+ endpoints, D1-backed, 9,876 seeded rows, all Phase 1–5 features. No local Worker or D1 needed.

### 3. Test the API connection from your terminal

```bash
# Health check
curl https://dev.api.dateandtime.live/api/v1/health

# v2 search (the main search)
curl 'https://dev.api.dateandtime.live/api/v2/search?q=NYC&limit=1'

# Country lookup
curl https://dev.api.dateandtime.live/api/v1/countries/JP
```

### 4. (Optional) Run the API Worker locally too

Use this only if you're **changing the API code** (`cloudflare/datetime-api/src/`). For UI-only work, skip this and use the live API from Step 2.

**On Windows MINGW64 / Git Bash**, there's a known wrangler 4.x bug with `--config` + relative paths. The fix is to use the **default** `wrangler.toml` (no `--config` flag) — it already has the D1 binding for the dev env.

```bash
# 4a. Get API credentials (one-time)
#    Go to https://dash.cloudflare.com/profile/api-tokens
#    Create token with: Account.Workers Scripts:Edit + Account.D1:Edit
#    Copy your Account ID from the right sidebar of the dashboard

cd cloudflare/datetime-api
cp .dev.vars.example .dev.vars
# Edit .dev.vars — paste in your CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID

# 4b. Install + start
npm install
npx wrangler dev --env dev --port 8787 --remote
# → http://127.0.0.1:8787
```

The `--remote` flag tells wrangler to use your **real D1 database** (`timeanddatepro-full`, 9,876 rows) instead of the empty local simulator.

**In a second terminal**, point the frontend at your local Worker:
```bash
cd ../..   # back to timeanddatepro/ root
VITE_API_BASE=http://127.0.0.1:8787 npx vite
```

Now every API call from the frontend hits **your local Worker on :8787** which reads from the real D1.

**If `--config wrangler.local.toml` is needed on Windows**, use an absolute path (the bug doubles the relative path):
```bash
# Git Bash:
npx wrangler dev --config "C:/dev/pro/timeanddatepro/cloudflare/datetime-api/wrangler.local.toml" --env dev --port 8787 --remote

# PowerShell:
npx wrangler dev --config "C:\dev\pro\timeanddatepro\cloudflare\datetime-api\wrangler.local.toml" --env dev --port 8787 --remote
```

### 5. Test endpoints locally (with the local Worker running on :8787)

```bash
# Health
curl http://127.0.0.1:8787/api/v1/health

# v2 search (all 13 edge cases)
curl 'http://127.0.0.1:8787/api/v2/search?q=Hyderabad&limit=2'   # disambiguation
curl 'http://127.0.0.1:8787/api/v2/search?q=NYC&limit=1'          # alias
curl 'http://127.0.0.1:8787/api/v2/search?q=Londn&limit=1'        # fuzzy
curl 'http://127.0.0.1:8787/api/v2/search?q=M%C3%BCnchen&limit=1'  # diacritics

# Countries (D1, 194)
curl http://127.0.0.1:8787/api/v1/countries/JP

# Holidays (curated 200+)
curl 'http://127.0.0.1:8787/api/v1/holidays/today?country=US'

# Currency (static snapshot)
curl 'http://127.0.0.1:8787/api/v1/currency/convert?from=USD&to=EUR&amount=100'

# DST (computed)
curl 'http://127.0.0.1:8787/api/v1/dst?tz=America/New_York'
```

### Quick reference

| What you want | Command |
|---|---|
| Frontend + live dev API (easiest) | `VITE_API_BASE=https://dev.api.dateandtime.live npx vite` |
| Frontend + local Worker (full stack) | `wrangler dev --env dev --port 8787 --remote` (one terminal) + `VITE_API_BASE=http://127.0.0.1:8787 npx vite` (another) |
| Build for production deploy | `VITE_API_BASE=https://dev.api.dateandtime.live npm run build` |
| Run all 195 integration tests | `cd cloudflare/datetime-api && npx vitest run` |
| View API endpoint list | `curl https://dev.api.dateandtime.live/api/v1` |
| Open Postman collection | Import `postman-collection.json` from the repo root |


## Build + ship

```bash
npm run build     # → dist/index.html + dist/server.cjs + dist/assets/*
npm run start     # production server
```

## Deploy to Cloudflare (future)

The DB layer in `src/admin/db.ts` is the only thing that needs to change — swap the body of `openDb()` for a D1 client. Everything else (`all()`, `get()`, `run()`) is API-stable.

---

### Original AI Studio notes (legacy)

This repo was bootstrapped from an AI Studio app. View your app in AI Studio: https://ai.studio/apps/37abf85c-4a67-4a52-aae1-2c6b1fb9109f

**Legacy run:**
1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local)
3. Run the app: `npm run dev`