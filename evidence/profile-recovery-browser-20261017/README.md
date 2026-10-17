# Nine real IndexedDB recovery cases

Final browser matrix passed all nine cases at clean source
`2e8faef403b9b78cd93eeb1803c3b5bf8967a6d8`, based on current main
`b77aa038914196781e717c4436659fffeeec24f2`. This ports the retained #342
scenario from `f76625792649edfee519a68c584d4cb97b7f763a`, original file SHA-256
`9545a0da0e832424f999f851a8feaedee3367a52b2469f75ee266614195c45e3`.
The production repair from #147 is already present. No application, dependency,
resource-policy, CI, deployment or parity-ledger changes were made.

[Final command receipt](receipts/browser-4.json), [case observations](attempt-4/profile-recovery.json),
[page/console events](attempt-4/browser-events.json) and [input hashes](attempt-4/source.json)
retain exact source, runtime and results. The nine cases are:

| Case | Observed contract |
| --- | --- |
| Empty database | No checkpoint/completion; ordinary first mission available. |
| Profile, missing latest | Completion survives; no checkpoint offered in selector controls. |
| Profile, malformed latest | Completion survives failed migration; stored records unchanged. |
| Profile, partially migratable latest | Clone converts Uint16Array cell heads, then missing units fails; stored record digest unchanged. |
| Profile, incompatible latest version | Completion survives rejection; stored records unchanged. |
| Current checkpoint | Public Load preserves selected boundary fields, canvas visible and WebGL context live. |
| Missing-drawMode checkpoint | Public Load supplies drawMode 0 and preserves selected fields. This is one default migration, not broad legacy compatibility. |
| Ordinary Start → Save → page reload → Load | Public navigation and committed IndexedDB save, with no seeded records or gameplay state. Loaded level, turn, time, actor/terrain/stock hashes equal saved values. |
| Usable session checkpoint + malformed persistent latest | Ordinary UI save remains usable; direct restore preserves active world identity/turn, merges completion [1,2,3], performs no storage writes; public Load recovers selected saved fields. |

Every case uses a fresh ephemeral browser context. Seeded records use real
IndexedDB transactions, and those diagnostic fixtures are explicitly marked.
The partial-migration fixture is `{version:1, world:{objectCells:{heads:new
Uint16Array([0,17])}}}`. Current `migrateCheckpoint` converts heads before its
`world.units` iteration throws. Full stored-record digests include typed arrays,
references, Maps and Sets; forwarding observers count put/add/delete/clear calls.
The source order and unchanged stored digest establish this bounded clone-failure
case; this does not independently observe all intermediate clone fields.

Navigation uses Main menu → New Game → the first-time recommendation when shown
→ native campaign panels. Panel labels/descriptions and Start/Replay aria-labels
are asserted. Browser controls are opened only to inspect/use the selector's
conditional Load button. No All missions bypass is used as unlock evidence.
Save/Load uses Game settings → Save Game → Save checkpoint and Load Game → Load
checkpoint. Continue Game resumes between in-session save and restore.

The replacement observer captures the world synchronously at public Load's store
replacement, before subsequent gameplay. Its version 1 wrapper is supplied by
the observer and is not independent version evidence. Full persisted-record
hash equality is distinct from the selected loaded-world field/hash comparisons.
Page reload in the same context is distinct from browser-process restart.
Seeded completion/direct restore is distinct from naturally earned progression.
This does not establish authentic native-save compatibility, shared-transaction
read isolation, deployment behavior, hardware performance or full PND-07 parity.

## Retained attempts

- Attempt 1, `2368d7b37c5f490288f8eda476bc03823e58b34b`: first five cases passed;
  current checkpoint failed because `.world-viewport canvas` matched battlefield
  and overlay. Fixed the probe to select `canvas.battlefield`.
- Attempt 2, `917ca6e91a36667a63a5da951d9f028c92d5c2ea`: first seven cases passed;
  ordinary save setup timed out on inputMask 64. Failure screenshot shows the
  introduction control. An immediate visibility check ran before that control
  appeared. The probe now waits for the public Skip introduction click.
- Attempt 3, `aedfcce1c0b8745f58a22cbfcc9e8a65f6daecb3`: all nine passed, but review
  identified that the historical partial-migration fixture failed before mutation.
  That attempt is retained with this limitation, not counted as the final matrix.
- Attempt 4, `2e8faef403b9b78cd93eeb1803c3b5bf8967a6d8`: all nine passed with the
  corrected typed-array partial-migration fixture. No browser page/console errors.
  Three.js missing-image warnings remain in stderr; this is not a silent-console claim.

All attempts retain their receipt, stdout/stderr, observations, metadata and PNGs
where captured. The manifest records original and portable hashes. Absolute user,
repository, browser and temporary paths are redacted; hash fields inside receipts
continue to identify their original raw output. Raw artifacts remain in the owned
worktree under `work/orchestration/profile-recovery-browser`.

## Focused verification and runtime

28/28 focused tests passed at `2368d7b37c5f490288f8eda476bc03823e58b34b`:
`tests/campaign-profile-recovery.test.mjs`, `tests/campaign-profile-union.test.mjs`,
`tests/checkpoint-restore-ui.test.mjs`, `tests/selector-profile-launch.test.mjs`.
Their production/test dependencies are unchanged in subsequent probe-only repairs.
Scoped ESLint passed at the final browser source; repository structure checks
passed at `917ca6e91a36667a63a5da951d9f028c92d5c2ea`. Planner retains unmapped
probe/evidence paths and conservative full verification. Full check/build gates
remain hosted, parent-owned; no full local suites or native executables ran.

Runtime: Node 24.18.0, macOS arm64, official sandboxed Chrome Headless Shell
153.0.8010.12, actual Home/store/GameScene/CSS/assets through a plain React/Vite
fixture on owned loopback port 4400. Vinext/Cloudflare/RSC serving and hydration
are excluded. Each browser episode used a unique owned profile. Awaited cleanup
closed contexts/browser/server and removed that profile; the shared heavy browser
slot is released. Product and probe inputs were rehashed unchanged after each run.
Installed package-lock hash is recorded; this does not hash every dependency byte.
Weekly Codex usage measured 18%, below the 70% stop threshold.

```sh
POPULOUS_BROWSER=/path/to/official/chrome-headless-shell \
POPULOUS_PROFILE_RECOVERY_OUTPUT=work/orchestration/profile-recovery-browser/fresh-attempt \
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/profile-recovery-browser/fresh-attempt.json \
  --input node_modules/.package-lock.json \
  -- node evidence/profile-recovery-browser-20261017/run-probe.mjs
```

Use fresh output and the coordinated browser slot. This evidence publication is
an unchanged-code child of the final tested source. It remains separate from
frozen integration #510; parent owns independent review, readiness and merge.
