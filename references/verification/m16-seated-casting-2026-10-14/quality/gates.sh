#!/usr/bin/env bash
set -u
status=0
r(){ node scripts/orchestration/command-receipt.mjs --output "work/orchestration/m16-casting/$1.json" -- "${@:2}" || status=1; }
r focused-final node --test tests/seated-casting.test.mjs tests/level-start.test.mjs tests/seated-native-position.test.mjs tests/vehicle-panel-runtime.test.mjs
r check npm run check
r build npm run build
r oxlint npm run lint:standard
r oxlint-comparison node work/m16-casting/compare-oxlint.mjs
r eslint-comparison node work/m16-casting/compare-eslint.mjs
r test-style node_modules/.bin/eslint tests/seated-casting.test.mjs
r format node_modules/.bin/oxfmt --check app/live-command.ts app/person-state.ts app/spell-casting.ts app/world-turn.ts tests/seated-casting.test.mjs
r fallow npm run quality:health
exit "$status"
