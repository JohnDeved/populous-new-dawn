#!/usr/bin/env bash
set -u
status=0
r(){ node scripts/orchestration/command-receipt.mjs --output "work/orchestration/m17-celebration/$1.json" -- "${@:2}" || status=1; }
r focused node --test tests/firewarrior-celebration.test.mjs tests/firewarrior-impact-owner.test.mjs tests/firewarrior-firing-phase.test.mjs tests/firewarrior-firing-artwork.test.mjs tests/firewarrior-resting-artwork.test.mjs
r check npm run check
r build npm run build
r style node_modules/.bin/eslint app/firewarrior.ts app/live-people.ts app/world-types.ts tests/firewarrior-celebration.test.mjs
r format node_modules/.bin/oxfmt --check app/firewarrior.ts app/live-people.ts app/world-types.ts tests/firewarrior-celebration.test.mjs
r oxlint npm run lint:standard
r oxlint-comparison node work/m17-celebration/compare-oxlint.mjs
r fallow npm run quality:health
exit "$status"
