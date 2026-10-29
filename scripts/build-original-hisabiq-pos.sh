#!/usr/bin/env bash
# Compiles the original HisabIQ_UI React code unchanged to a Vue-served asset.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/vendor/hisabiq_ui"
OUTPUT="$ROOT/apps/web/public/hisabiq-pos"
if [[ ! -x "$SOURCE/node_modules/.bin/vite" ]]; then
  (cd "$SOURCE" && npm ci --no-audit --no-fund)
fi
(cd "$SOURCE" && ./node_modules/.bin/vite build --base ./ --outDir "$OUTPUT" --emptyOutDir)
echo "Built unchanged HisabIQ React POS at $OUTPUT"
