#!/usr/bin/env bash
set -u
status=0
r(){ node scripts/orchestration/command-receipt.mjs --output "work/orchestration/m17-route-cells/$1.json" -- "${@:2}" || status=1; }
r focused node --test tests/registered-route-cells.test.mjs tests/vehicle-cell-membership.test.mjs tests/route-vehicle-launch.test.mjs tests/melee-encounter.test.mjs tests/combat-pose-handoff.test.mjs tests/seated-native-position.test.mjs
r check npm run check
r build npm run build
r style node_modules/.bin/eslint app/live-pathfinding.ts tests/registered-route-cells.test.mjs
r format node_modules/.bin/oxfmt --check app/live-pathfinding.ts tests/registered-route-cells.test.mjs
r oxlint npm run lint:standard
r oxlint-comparison node work/m17-route-cells/compare-oxlint.mjs
r fallow npm run quality:health
exit "$status"
