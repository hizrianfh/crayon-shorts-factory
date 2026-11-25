#!/usr/bin/env bash
# Idempotent engine bootstrap. Run from anywhere; safe to re-run.
# - clones mromidev/claude-animated-shorts (pinned) into /tmp/_cas
# - strips templates/bridge/toon.ts -> engine/toonbase.js (Pen + colour helpers, used by engine/crayon.js)
# - unpacks three@0.160.0 -> engine/lib/three.module.js
# - installs the pinned Playwright + its Chromium
# Upstream ships a Remotion project, not a standalone renderer, so the renderer itself
# (engine/*, render.mjs, timing.py, sheet.py, mix.py, finish.sh) lives in this repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CAS=/tmp/_cas
CAS_REF=e3b817b

if [ ! -d "$CAS/.git" ]; then
  git clone -q https://github.com/mromidev/claude-animated-shorts "$CAS"
fi
git -C "$CAS" checkout -q "$CAS_REF" 2>/dev/null || { git -C "$CAS" fetch -q --unshallow 2>/dev/null || true; git -C "$CAS" checkout -q "$CAS_REF"; }

mkdir -p "$ROOT/engine/lib"
if [ ! -s "$ROOT/engine/toonbase.js" ]; then
  node --no-warnings -e '
    const { stripTypeScriptTypes } = require("node:module"), fs = require("node:fs");
    fs.writeFileSync(process.argv[2], "// generated from claude-animated-shorts toon.ts (MIT)\n" +
      stripTypeScriptTypes(fs.readFileSync(process.argv[1], "utf8")));
  ' "$CAS/templates/bridge/toon.ts" "$ROOT/engine/toonbase.js"
fi

if [ ! -s "$ROOT/engine/lib/three.module.js" ]; then
  tmp="$(mktemp -d)"
  (cd "$tmp" && npm pack -q three@0.160.0 >/dev/null && tar -xzf three-0.160.0.tgz package/build/three.module.js)
  cp "$tmp/package/build/three.module.js" "$ROOT/engine/lib/three.module.js"
  rm -rf "$tmp"
fi

cd "$ROOT"
[ -d node_modules/playwright ] || npm ci --no-audit --no-fund
npx playwright install chromium >/dev/null
echo "engine ready: $(wc -c < engine/toonbase.js) B toonbase.js, $(wc -c < engine/lib/three.module.js) B three.module.js"
