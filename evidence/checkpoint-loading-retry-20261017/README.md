# Checkpoint loading retry verification

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/checkpoint-loading-retry-20261017), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.


Final bounded episode: **passed** at source
`85d3b555f45bca2fed9bcebeff06bac755cba7b5`. No product defect demonstrated.
[Command receipt](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/checkpoint-loading-retry-20261017/browser-1.json), [observations](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/checkpoint-loading-retry-20261017/browser-1/checkpoint-loading-retry.json)
and [recovered screenshot](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/checkpoint-loading-retry-20261017/browser-1/checkpoint-recovered.png) retain exact results.

The genuine UI save was Mission 1, turn 101, time 8.4166666667. Both failed-world
mutations changed turn to 1102/1103, Blast stock to 105/106 and actor HP to -1/-2.
Each subsequent real Retry restored turn 101 and the saved actor/stock/terrain
hashes, with a new world and scene. All three held scenes stayed frozen for 1.2s.
The third scene activated at turn 118 then advanced to 119; its elapsed game time
fit the measured post-release interval. Exactly three landscape and three waves
requests occurred; persisted checkpoint hash remained unchanged. No page error or
crash occurred. Three.js missing-image warnings remain in stderr; this is not a
no-console-warning claim. Chrome Headless Shell 153.0.8010.12 was sandboxed.

Final scoped lint and structure checks passed at the browser-tested source. Seven
focused tests remain attributed to the preparation source below; subsequent edits
only remove the self-supplied version assertion and clarify its limitation, leaving
those tests and application sources unchanged. The publication is an evidence child.

Prepared on current main `b77aa038914196781e717c4436659fffeeec24f2`, fetched and
verified before editing, on `codex/checkpoint-repeated-loading-retry`. No dependency
on PR #507; that branch, evidence and historical failures remain unchanged.
The fixture runner adapts its bounded plain React entry without changing production.

Tested preparation source: `6063c036a44d8a919b9c5084cc4053043e138e5c`.
Seven focused cases passed across the exact existing paths:
`tests/home-checkpoint-retry.test.mjs`, `tests/original-loading-screen.test.mjs`,
`tests/pause-checkpoint.test.mjs`. The exact-path runner validated file existence.
Three-file ESLint passed. Both raw source-bound command receipts are retained with
original/published hashes. Local repository and Node executable paths are redacted.

The new portable test evaluates Home's actual Load/Retry handlers and loading-screen
callback with the real store. Both retries restore the complete saved world after
changes to the failed world's turn/time, spell stock and actor health. It uses an
in-memory save without IndexedDB and synthetic UI bindings. It does not establish
React remounts, scene failure, persistence, browser input, or rendered recovery.

## Browser episode

1. Start Mission 1 through Home, clear its introduction and allow ordinary turns.
2. Open Game settings, Save Game, Save checkpoint; require the persisted notice and
   independently read the real committed IndexedDB record.
3. Reload the same page/context, select Home Load Game, and hold its actual
   environment-specific landscape request. Observe the store replacement boundary
   before activation, comparing saved level/turn/time/actor/terrain/stock hashes.
4. Abort that landscape request. Require disposed/aborted scene, detached canvas and
   focused Try again. Mutate only the discarded live world's stock, clock and actor
   health as an explicit fixture; verify the committed save remains unchanged.
5. Activate actual Retry with Enter; require a fresh loading phase/world/scene,
   restored saved boundary fields, and frozen clocks/RNG during another 1,200 ms
   hold. Abort again, mutate that second failed world, and Retry by pointer.
6. Require the third loading boundary to match the saved fields; release it. Verify
   active scene, no held-time catch-up beyond the saved fractional turn, ordinary
   advancement, exactly three landscape and waves requests, no fourth request,
   unchanged committed checkpoint, and no page error/crash.

All three attempts occur in one document after the initial save/reload. There is
no imported storageState, supplied readiness, scene replacement, or fabricated
success callback. Partial observations and failures are written on exit. Existing
checkpoint comparison fields deliberately exclude a full serialized-record hash
comparison at the load boundary because migration may normalize runtime fields;
committed storage itself is compared by full record hash before/after each mutation.
The boundary wrapper uses the independently read saved record version to serialize
its clone; that supplied version is not an independent version observation and is
not asserted as one. This limitation was corrected after source review; no browser
episode had run.
No application code has changed and no product defect was demonstrated; the bounded browser result below is the only new browser claim.

## Execution and reproduction

After parent granted the shared slot, the single bounded browser command completed
in 21.55 seconds. Awaited cleanup closed context/browser and Vite server on port
4398, then removed only the newly created task profile. The heavy slot is released.
There was no local build or full suite. Future execution requires a fresh slot and
output directory, with the installed official sandboxed Chrome Headless Shell.

```sh
POPULOUS_BROWSER=/path/to/official/chrome-headless-shell \
POPULOUS_CHECKPOINT_RETRY_OUTPUT=work/orchestration/checkpoint-loading-retry/browser-1 \
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/checkpoint-loading-retry/browser-1.json \
  --input node_modules/.package-lock.json \
  -- node evidence/checkpoint-loading-retry-20261017/run-probe.mjs
```

The fixture imports unchanged Home, store, GameScene, CSS and assets and excludes
Vinext/Cloudflare/RSC serving/hydration. Headless results do not establish hardware
performance or native parity. Independent review of this executed evidence and approved
hosted full gates remain pending. Planner leaves the new paths unmapped and requests
conservative full validation; focused preparation does not replace that gate.
