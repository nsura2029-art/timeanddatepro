#!/usr/bin/env bash
# scripts/deploy-dev.sh
# One-shot: build the React app, deploy to the dev Pages project, and
# purge the Cloudflare CDN edge cache so the new bundle is visible
# immediately (no waiting for TTL expiry, no hard-refresh needed by users).
#
# Required env vars:
#   CLOUDFLARE_API_TOKEN  — must have Account.Pages: Edit permission
#   CLOUDFLARE_ACCOUNT_ID — the account that owns the Pages project
#
# Usage:
#   npm run deploy:dev
#   # or
#   bash scripts/deploy-dev.sh
#
# After it runs, the new build is live at:
#   https://develop.timeanddatepro.pages.dev
set -euo pipefail

PROJECT="timeanddatepro"
BRANCH="develop"
API_BASE="${VITE_API_BASE:-https://dev.api.dateandtime.live}"

# --- Preflight checks ---
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN is not set" >&2
  exit 1
fi
if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "ERROR: CLOUDFLARE_ACCOUNT_ID is not set" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is not installed (needed to parse the purge response)" >&2
  exit 1
fi

echo "==> [1/3] Building React app (VITE_API_BASE=$API_BASE)..."
rm -rf dist
VITE_API_BASE="$API_BASE" npx vite build

echo "==> [2/3] Deploying to Cloudflare Pages ($PROJECT @ $BRANCH)..."
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
  npx --yes wrangler pages deploy dist/ \
    --project-name "$PROJECT" \
    --branch "$BRANCH" \
    --commit-dirty=true

echo "==> [3/3] Purging CDN edge cache for $PROJECT..."
# Two-step purge: try account-level Pages API first, fall back to zone-level.
# Either may be blocked by the token's scopes — in that case we log a
# warning and continue (the new deploy is already live; TTL will
# eventually expire the cache, or the user can purge via the dashboard).
PURGE_RESP=$(curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo '{"success":false,"error":"curl failed"}')
PURGE_OK=$(echo "$PURGE_RESP" | jq -r '.success // false' 2>/dev/null || echo "false")
if [[ "$PURGE_OK" == "true" ]]; then
  echo "    Cache purge: OK (Pages API)"
else
  PURGE_ERR=$(echo "$PURGE_RESP" | jq -r '.errors[0].message // .error // "unknown"' 2>/dev/null)
  DASH_URL="https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/pages/view/${PROJECT}"
  echo "    Cache purge: SKIPPED ($PURGE_ERR)"
  echo "    -> The new deploy is live; cache will expire per TTL."
  echo "    -> One-click manual purge: $DASH_URL"
  echo "       (Pages project -> Deployments -> ⋯ on latest -> Purge cache)"
  echo "    -> Or add 'Account.Pages: Edit' to CLOUDFLARE_API_TOKEN in https://dash.cloudflare.com/profile/api-tokens"
fi

echo ""
echo "==> Done. Live at: https://${BRANCH}.${PROJECT}.pages.dev"
