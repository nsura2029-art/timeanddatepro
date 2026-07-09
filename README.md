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