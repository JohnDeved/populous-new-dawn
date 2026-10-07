# Retire chimney smoke when a hut starts burning

This repair binds native state-exit ownership to the existing Lightning and Spy
ignition callbacks. It supersedes the implementation delivery in [PR244](https://github.com/JohnDeved/populous-new-dawn/pull/244);
that draft and its research branches preserve every raw proof and failed attempt.
The clean integration base is `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`.

## Original producer and consumer

[00408cb0](../generated/00408cb0.c) changes an eligible building to state4 and
calls [004ed640](../generated/004ed640.c), whose class2 dispatcher reaches
[004030c0](../generated/004030c0.c). The state4 arm first runs
[00408840](../generated/00408840.c), initializing timer127 and fire. The common
tail at `00403227..0040325d` then retires an existing `+0x92` chimney root when
state is no longer2: actual `004ef180` at `0040324f`, then handle zero at
`00403254`. Resident evacuation belongs to the later timer119 branch of
[00408ab0](../generated/00408ab0.c).

The retained [dispatch](hut-smoke-state-exit/ignition-dispatch.asm.txt) and
[root cleanup](hut-smoke-state-exit/class2-root-release.asm.txt) byte listings
come from canonical EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The existing fire probe intercepted the dispatcher before this tail. Existing
smoke ownership evidence did not compose ignition with actual root deletion.

## Live ownership

`spell-effects-runtime.ts::igniteBuildingAt` and
`live-building-combat.ts::igniteSabotagedBuilding` now call the existing smoke
reconciler after fire/person initialization. Shared smoke eligibility requires
state2 when a damage state exists; completed legacy huts without that state keep
their prior behavior. Secondary restore applies the same rule before a paused
scene can reconstruct a historical burning root.

Previously the occupied hut retained its root during state4 until evacuation.
The root now retires immediately, before residents leave. Emitted children keep
their own secondary slots, normal visits and lifetime. Allocation, fire, RNG,
resident admission, animation cadence and render frequency retain their owners.

The ignition callback files are byte-identical to focused candidate
`b26f66b24da4fe133441e83c5377467a5066ef64` and ordinary executed source
`4363be773890acfb89eff90eecee11fe0c633f9e`. The smoke owner differs only by
one formatter line break, with all1070 TypeScript tokens proven identical.
The maintained checker, observer,
tests and native probe preserve the accepted source bytes, including historical
“draft/unrun” comments. Those comments label preparation; the results below
identify what was subsequently executed.

## Evidence and limits

All links below bind the preserved immutable evidence commit
[`a7014653`](https://github.com/JohnDeved/populous-new-dawn/tree/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06).
Raw logs, repeated source snapshots, dependency inventories and host wrappers stay
there rather than being duplicated into the integration tree.

- [Native attempt02](https://github.com/JohnDeved/populous-new-dawn/tree/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/attempt-02)
  passed the full-root/already-emitted-child case and its independent review.
  The runnable [probe](hut-smoke-state-exit/probe-ignition-root-draft.py) uses real
  `004ef180 → 004ed530`, 179-byte secondary records, pool bounds/lists/count and
  the real `004ed6f0` no-op. Actual deletion precedes handle clearing; child
  non-link data is preserved and its next real visit decrements lifetime9→8.
  All six primary fire allocations deliberately fail at a declared supplied
  leaf; terrain/sunlight/model setup are also supplied. This does not prove
  native fire-stream equality with the live/browser route. Native attempt01's
  ABI-checker failure remains in the adjacent immutable `attempt-01` packet;
  the corrected checker decodes class/model/tribe as bytes while retaining raw
  DWORD diagnostics and the full pointer. No game-state assertion was relaxed.
- [Controlled live baseline](https://github.com/JohnDeved/populous-new-dawn/tree/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/live-baseline-01)
  retained18 actual caller samples and the intended failure: root retention
  until timer119. Its admission fixture is supporting runtime evidence.
- [Focused red/green](https://github.com/JohnDeved/populous-new-dawn/tree/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/focused-01)
  used identical test bytes: baseline3 passed/4 intended root failures;
  candidate7/7 passed. Full, partial and absent roots, protected/repeated
  ignition, fire ordering, children, paused restore, legacy huts and actual
  Spy command15 are covered. [Independent result ACCEPT](https://github.com/JohnDeved/populous-new-dawn/blob/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/focused-result-review/review.md)
  binds the raw receipts and source correspondence.
- [Observer contracts](https://github.com/JohnDeved/populous-new-dawn/tree/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/observer-contracts-02)
  passed4/4 plus syntax: original render receiver/arguments/result/throw,
  bounded diagnostic failures and safe ownership restoration. The launcher-only
  first failure remains separately labelled.
- [Ordinary Mission1 attempt05](https://github.com/JohnDeved/populous-new-dawn/tree/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/ordinary-05)
  passed through earned Land Bridge, completed crossing, earned Lightning,
  actual housing and actual stock1→0 cast. Actual draw1382/frame1159 shows the
  legacy completed hut with residents13,15,1186 and chimney root6/slot158;
  draw1425/frame1203 is state4/timer125 with the same residents and no root;
  draw1432/frame1205 has timer118, empty residents and no root. The bundle
  includes all three original canvas PNGs and a separately labelled paused
  screenshot. [Independent result ACCEPT](https://github.com/JohnDeved/populous-new-dawn/blob/a701465361070036fd6493de623b04d3d7d23086/references/verification/hut-smoke-state-exit-2026-10-06/ordinary-05-result-review.json)
  verifies pixels, same-turn stock, source, errors and cleanup. No child puffs
  were present in these frames; child preservation rests on native/focused
  evidence. Software WebGL rendering proves browser behavior, not native
  raster matching or hardware performance.

Ordinary attempts01–04 remain failed, with their raw packets adjacent to05:
final picking, the missing Bridge prerequisite, additive selection and the
Bridge range guard each required a source-reviewed input correction. There were
no runtime changes between those ordinary attempts. Missions2–3, complete
primary class7 stream equality and native elapsed/raster matching remain outside
this bounded witness. No global timing cause or parity coverage expansion is
claimed.

## Integration correspondence and checks

[Exact source and evidence correspondence](hut-smoke-state-exit/correspondence.json)
records all11 accepted executable/static files and the formatting correspondence. The Firewarrior port changes only
its strict whole-caller SHA guard; `stepAreaAttack` remains byte-identical over
9332 bytes, SHA256
`dd9c099be0a5eda1bb571a88a9ac7a30ade5de567325400ec63f5a1ab5fa4a59`.
All16 Firewarrior fixtures, native observations, projection and tests are
unchanged. The portable suite exercises that exact guard and comparison.

[Scoped quality comparison](https://github.com/JohnDeved/populous-new-dawn/tree/89070c5d7ed15acef46609007f2e61275ccf8e02/references/verification/hut-smoke-state-exit-2026-10-06/final-quality-03) found no introduced diagnostics: candidate
and exact main1c7 each have45 Oxlint rows (27 errors,18 warnings) and the same
single ESLint error in unchanged code. Broad lint retains its failed737-warning/
671-error advisory result. Broad format retained the smoke line-break issue
plus unchanged render-view/viewport-bounds issues; only the smoke line break
was corrected using the preview and identical-token proof. No unrelated cleanup
is included.

`npm run check` and `npm run build` remain pending final source review and the
serialized dependency window. Earlier failure/pass labels and accepted proof
remain attached to their exact source revisions.
