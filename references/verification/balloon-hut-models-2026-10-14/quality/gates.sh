#!/usr/bin/env bash
set -u
status=0
r(){ node scripts/orchestration/command-receipt.mjs --output "work/orchestration/balloon-hut-models/$1.json" -- "${@:2}" || status=1; }
r focused node --test tests/balloon-hut-models.test.mjs tests/training-hut-appearance.test.mjs tests/model-wave-deformation.test.mjs tests/vehicle-destruction.test.mjs
r check npm run check
r build npm run build
r style node_modules/.bin/eslint app/scene-entities.ts tests/balloon-hut-models.test.mjs
r format node_modules/.bin/oxfmt --check app/scene-entities.ts tests/balloon-hut-models.test.mjs
r oxlint npm run lint:standard
r oxlint-comparison node work/balloon-hut-models/compare-oxlint.mjs
r fallow npm run quality:health
r banks python3 decomp/research/balloon-hut-model-evidence/verify-banks.py ../populous-research-inputs/game/app
exit "$status"
