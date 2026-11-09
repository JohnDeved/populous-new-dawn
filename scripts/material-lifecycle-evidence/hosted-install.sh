#!/usr/bin/env bash
# Trusted default-branch setup only. No candidate package scripts or browser.
set -euo pipefail
test "$(git rev-parse HEAD)" = 977bf3026e429f7edd6187c16427913357224f7d
test "$(git rev-parse HEAD^{tree})" = c17cce4f10b9f4407d22c9266254e6cbb524a8f3
test "$(node -p 'JSON.parse(require("fs").readFileSync("package.json","utf8")).packageManager')" = pnpm@11.25.0
timeout --signal=TERM --kill-after=5s 120s npm install --global --ignore-scripts --no-audit --no-fund pnpm@11.25.0 2>&1 |
  python3 -I -B "$PND_MATERIAL_TOOLS/material/hosted_setup.py" capture "$PND_MATERIAL_EVIDENCE/manager-install.log"
pnpm --version > "$PND_MATERIAL_EVIDENCE/pnpm-version.txt"
test "$(cat "$PND_MATERIAL_EVIDENCE/pnpm-version.txt")" = 11.25.0
timeout --signal=TERM --kill-after=5s 480s pnpm install --frozen-lockfile --ignore-scripts --store-dir "$PND_MATERIAL_TOOLS/pnpm-store" 2>&1 |
  python3 -I -B "$PND_MATERIAL_TOOLS/material/hosted_setup.py" capture "$PND_MATERIAL_EVIDENCE/install.log"
printf '0\n' > "$PND_MATERIAL_EVIDENCE/install.exit"
