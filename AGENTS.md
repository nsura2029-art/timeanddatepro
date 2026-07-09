# TimeAndDatePro DOX

## Purpose
- TimeAndDatePro is a Vite + React 19 + Express SaaS prototype. Renders a global time/date workspace with localized landing pages, 7 per-tool calculator pages, an inline meeting finder, and a sticky CTA bar.
- Deployment target is a Cloudflare Workers Static Assets static bundle (`dist/`) served by the bundled Express server in `server.ts`, which also exposes the public REST API at `/api/v1/*` and serves `/sitemap.xml`.

## Ownership
- Root owns project-wide scripts, dependency manifests, Vite/TypeScript config, Express server, env templates, and this DOX index.
- Do not commit real secrets. Keep `.env.example` as placeholders only.
- `dist/`, `node_modules/`, and `sdk/**/dist/`, `sdk/**/node_modules/` are generated and not part of source contracts.

## Local Contracts
- Source code lives under `src/` (UI), `server.ts` (Express + Vite middleware).
- The Node.js SDK lives at `sdk/node/` and is published from there as `@timeanddatepro/sdk`.
- `src/pages/docs/` owns the documentation site at `/docs/*`. Adding a docs page = one entry in `src/utils/docRoutes.ts: DOC_SECTIONS` plus a content file.
- Public API endpoints live as pure functions in `src/utils/timeApi.ts` and are mounted in `server.ts`. Adding an endpoint = function in `timeApi.ts` + handler in `server.ts` + `EndpointDoc` entry in `src/data/docs/endpointCatalog.ts`.

## Mandatory Loading Workflow
- Before any code change, read this root `AGENTS.md`, the nearest child `AGENTS.md`/`README.md` for every area being changed (e.g. `src/pages/docs/README.md` for the docs site), and any relevant SDK doc.
- Use `npm run build` + `npm run lint` (tsc --noEmit) before any commit. `tsc --noEmit` is allowed to surface pre-existing warnings (e.g. duplicate `workingDays` keys in `src/utils/toolTranslations.ts`, the `error.code` access on `ApiResponse<T>` in `sdk/node/src/index.ts`); do not silently expand those warnings into your own files.

## Contract Updates
- Whenever code changes alter behavior, ownership boundaries, deployment requirements, env keys, or workflow rules, update the nearest child `AGENTS.md`/`README.md` in the same change.
- New docs page? Append one entry to `src/utils/docRoutes.ts: DOC_SECTIONS`. New endpoint? Append one entry to `src/data/docs/endpointCatalog.ts: ENDPOINT_CATALOG`.

## Work Guidance
- Keep UI consistent with the MeetingFinder palette: rounded-3xl cards, `#e8eaf6`/`#e0f2f1`/`#e8f5e9` hero gradients, `#3f51b5` accent, `#e0e0e0` borders, `#fafafa` inputs, font-mono uppercase labels.
- For Cloudflare deployment, keep Wrangler config aligned with Workers Static Assets and SPA fallback (the Express server already handles this in production builds).
- The docs site is English-only on day one. Add `<LangSlug>` keys + per-language content files when translating. Hreflang lands in the SEO phase.

## Verification and Tests
- `npm run build` — required for any frontend, styling, or routing change.
- `npm run lint` — TypeScript types.
- For the docs site: open `/docs/getting-started/introduction` and walk Intro → Quickstart → any API Reference page → SDK page → an integration page. Verify the sidebar highlights the active page, the SDK panel toggles in tool pages, and the live `Run request` widgets hit the API.
- For the public API: `curl /api/v1/health` should return `{status:"ok"}`. Any new endpoint needs a handler in `server.ts` AND a `EndpointDoc` entry in `endpointCatalog.ts`.
- SDK: `cd sdk/node && npm run build` produces `dist/index.js` + `dist/index.d.ts`. Smoke-test with `node --input-type=module -e 'import("./dist/index.js").then(m=>console.log(Object.keys(m)))'`.

## Major Subsystems (Phase 1+)
- **Public REST API v1** (15 endpoints) — `server.ts` mounts pure functions from `src/utils/timeApi.ts`. Standardized envelope: `{ success, data, meta }`. Cache-Control per endpoint.
- **Node.js SDK** (`@timeanddatepro/sdk`) — `sdk/node/`, zero-dep, native fetch, ESM-only. Builds to `dist/`.
- **Documentation site** (`/docs/*`) — content in `src/pages/docs/content/`, sidebar + breadcrumb registry in `src/utils/docRoutes.ts`, endpoint catalog in `src/data/docs/endpointCatalog.ts`. DocLayout renders its own chrome (no marketing header).
- **Per-tool SDK panels** — `src/components/tools/ToolSdkPanel.tsx` is embedded in all 7 calculator pages + MeetingFinder + WorldClockDashboard so the same engine that powers the UI is also documented in-place.

## Child DOX Index
- `src/pages/docs/README.md` — documentation site contracts (route table, content authoring).
- `sdk/node/README.md` — Node.js SDK reference (also published as the npm package README).
