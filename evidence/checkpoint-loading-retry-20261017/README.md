# Checkpoint loading retry preparation

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

## Browser episode prepared, not executed

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
No application code has changed and no product defect or browser pass is claimed.

## Slot request

Mac2 retains the shared heavy slot. This preparation started no browser, server or
build. Request four minutes for one bounded episode including setup/cleanup;
expected useful browser execution is under one minute, with a 180-second watchdog.
Use isolated loopback port 4398, a newly created task-only browser profile, a fresh
output directory, and the installed official sandboxed Chrome Headless Shell.

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
performance or native parity. Browser execution, independent review and approved
hosted full gates remain pending. Planner leaves the new paths unmapped and requests
conservative full validation; focused preparation does not replace that gate.
