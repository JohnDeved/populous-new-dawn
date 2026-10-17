#!/usr/bin/env bash
set -u
status=0
r(){ node scripts/orchestration/command-receipt.mjs --output "work/orchestration/m17-combat-pose-revised/$1.json" -- "${@:2}" || status=1; }
r focused node --test tests/combat-pose-handoff.test.mjs tests/melee-encounter.test.mjs tests/mixed-combat-orders.test.mjs tests/seated-native-position.test.mjs tests/seated-casting.test.mjs
r check npm run check
r build npm run build
r oxlint npm run lint:standard
r oxlint-comparison node work/m17-combat-pose-revised/compare-oxlint.mjs
r eslint-comparison node work/m17-combat-pose-revised/compare-eslint.mjs
r test-style node_modules/.bin/eslint tests/combat-pose-handoff.test.mjs
r format node_modules/.bin/oxfmt --check app/live-people.ts app/world-turn.ts tests/combat-pose-handoff.test.mjs
r fallow npm run quality:health
exit "$status"
