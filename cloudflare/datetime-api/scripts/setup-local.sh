#!/usr/bin/env bash
# setup-local.sh — wire up the API Worker to your local environment
# Works on: Windows MINGW64, macOS, Linux
#
# What it does:
#   1. Creates .dev.vars from template (if not exists)
#   2. Installs npm deps if needed
#   3. Creates wrangler.local.toml from template
#   4. Optionally runs the Worker locally
#
# Usage:
#   bash scripts/setup-local.sh           # one-time setup
#   bash scripts/setup-local.sh --start   # setup + start the Worker

set -e

# ── Paths ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "── TimeAndDatePro API — local setup ──"
echo ""

# ── 1. .dev.vars ──────────────────────────────────────────────
if [ ! -f .dev.vars ]; then
  cp .dev.vars.example .dev.vars
  echo "✓ Created .dev.vars (edit with your Cloudflare token + account ID)"
  echo "  → Not required for `wrangler dev` (local sim), only for `wrangler deploy`"
else
  echo "✓ .dev.vars already exists (skipping)"
fi
echo ""

# ── 2. wrangler.local.toml ───────────────────────────────────
if [ ! -f wrangler.local.toml ]; then
  cp wrangler.local.toml.example wrangler.local.toml 2>/dev/null || echo "⚠ wrangler.local.toml.example not found, using wrangler.toml as-is"
  echo "✓ wrangler.local.toml ready (same D1 binding as dev)"
else
  echo "✓ wrangler.local.toml already exists (skipping)"
fi
echo ""

# ── 3. npm deps ──────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "→ Installing npm dependencies..."
  npm install
  echo "✓ npm deps installed"
else
  echo "✓ node_modules already exists (skipping npm install)"
fi
echo ""

# ── 4. Start the Worker (optional) ───────────────────────────
if [[ "$*" == *"--start"* ]]; then
  echo "── Starting local Worker on http://localhost:8787 ──"
  echo "  Press Ctrl+C to stop"
  echo ""
  npx wrangler dev --config wrangler.local.toml --env dev --port 8787
else
  echo "── Next steps ──"
  echo ""
  echo "  1. Start the local Worker:"
  echo "     npx wrangler dev --config wrangler.local.toml --env dev --port 8787"
  echo ""
  echo "  2. Test it:"
  echo "     curl http://localhost:8787/api/v1/health"
  echo "     curl 'http://localhost:8787/api/v2/search?q=London&limit=3'"
  echo ""
  echo "  3. Point your frontend at the local Worker:"
  echo "     VITE_API_BASE=http://localhost:8787 npx vite build"
  echo ""
  echo "  4. Or import the Postman collection:"
  echo "     postman-collection.json (in the repo root)"
  echo ""
  echo "  Run this script with --start to also start the Worker:"
  echo "     bash scripts/setup-local.sh --start"
fi
