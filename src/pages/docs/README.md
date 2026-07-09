# Pages / Docs DOX

## Purpose
- Owns the static documentation site at `/docs/*`. Mirrors cloudconvert.com/docs: left-sidebar nav, breadcrumbs, code samples with copy buttons, per-endpoint references with request/response examples, per-tool integration guides with live API demos.
- Renders completely client-side; the React app checks `window.location.pathname.startsWith("/docs")` and switches to `<DocsPage />` which uses its own sticky top bar (no marketing chrome).

## Ownership
- `DocsPage.tsx` — single entry point. Receives the `pathname` prop from `App.tsx`, calls `parseDocsPath()` to find the route, and switches content.
- `content/gettingStarted/*.tsx` — Introduction, Quickstart, Authentication, Errors.
- `content/api-reference/*` is rendered dynamically by `EndpointRef.tsx` from `src/data/docs/endpointCatalog.ts: ENDPOINT_CATALOG`.
- `content/sdks/*.tsx` — Node.js (live), Python (placeholder), cURL (reference).
- `content/integrations/<tool>.tsx` — one per tool, with a `<LiveApiDemo>` widget that hits the live API.
- `content/Changelog.tsx`, `content/Support.tsx` — top-level resources.
- DocLayout, DocSidebar, Breadcrumbs, CodeTabs, CopyButton, EndpointRef, ParamTable, ResponseBlock, LiveApiDemo — all in `src/components/docs/`.

## Local Contracts
- New docs pages go in `src/utils/docRoutes.ts: DOC_SECTIONS` first (this determines sidebar + breadcrumbs). Then content goes in `src/pages/docs/content/<section>/<page>.tsx` and is imported by `DocsPage.tsx`.
- New endpoints go in `src/data/docs/endpointCatalog.ts: ENDPOINT_CATALOG`. A path-slug matching the docs slug (e.g. `time/now`) is required so the resolver can find it. The endpoint ref page is auto-rendered from the catalog entry — no extra page file needed.
- New Node.js SDK methods surface automatically under `content/sdks/NodeJsSdk.tsx` (no code change to that page unless you want to call them out).
- New per-tool integrations go in `src/pages/docs/content/integrations/index.tsx: integrations` map.

## Work Guidance
- Content lives in TypeScript files (not markdown) to keep the React renderer + interactive demos first-class. If we ever need markdown authoring, route-level content lives under `content/` and could be swapped for an MDX loader later.
- The site is English-only on day one. Add a language key on `DOC_SECTIONS` + per-language content files when translating. Hreflang tags will land alongside the existing tool-page SEO work (Phase 6.2 in the SEO plan).

## Verification
- After adding a docs page: visit `/docs/<section>/<slug>` in dev. Confirm the sidebar highlights it, breadcrumbs are correct, and the footer prev/next links work.
- After adding an endpoint: visit `/docs/api-reference/<slug>`. Confirm the method+path header, code samples, params table, and response block all render and the live curl copy button works.
- After adding an integration: visit `/docs/integrations/<tool>`. Click "Run request" — confirm the response renders and highlighted fields are correct.
- `npm run build` for any frontend change.
- Update nearest child README (this file) + the project's root `README.md` whenever contracts change.
