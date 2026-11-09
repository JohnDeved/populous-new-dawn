# Preparation render snapshot reuse (#144)

`updateBuildingsFrame` now reuses a Scene-owned preparation Array instead of
creating the result of `world.buildings.filter(...)` on every frame. The view is
rebuilt at the original eager snapshot site, after stale-plan cleanup and before
the first plan draw. It retains exact preparation truthiness, ordered references
to current records, and every later plan/completed draw and resource path. The
existing plan and completed-building ID-membership cleanup remains unchanged.

The scratch view has a weak Scene owner. Refilling overwrites its prefix and
truncates its length, releasing references beyond the current eligible count.
This removes this filter-result Array object boundary; it does not establish
backing-store reuse, peak engine capacity, allocation-free callbacks or frames,
GC behavior, or a hardware speedup. Maintained Worlds use ordinary arrays. No
arbitrary subclass/species, custom same-Scene reentry, or new sparse-World support
is claimed; the existing earlier ID collector already rejects undefined entries.

The live caller is the synchronous building phase in `GameScene.animate`.
The shipped placement command calls the maintained building initializer with
`plan:true`. Tests use that initializer, actual building/plan frame, maintained
plan geometry and Scene transforms, and real geometry disposal. Cloned plan
populations and disposal/draw observers are explicit Node diagnostics, not play.

## Focused evidence

Candidate `0579a3607becaa666b944f69f5fc632533b873d0` was compared with pristine
merged main `a3deda60cedbde74ba6bfde8b0886e5883e1cb73` using the same command:

```sh
node --test tests/preparation-render-view.test.mjs tests/plan-mesh-reconciliation.test.mjs
```

All eight candidate cases passed. The baseline passed seven and failed only the
new allocation assertion: three measured frames created three filter-result
Arrays containing 192 references at population 64. Candidate populations 64, 256
and 1024 each created zero such results over three measured frames; full-caller
building ID reads remained respectively 128, 512 and 2048 per frame. These
populations contain preparations only, with an empty completed mesh map and
quiet smoke; the later completed/occupancy/puff costs are excluded.

Timing cases prove cleanup-time geometry-disposal edits are seen by the snapshot,
while drawing-time eligibility edits wait until the next plan snapshot. Captured
records supply current pose, and the later completed phase sees current World
edits. Replacement/load, empty/refill and independent Scenes are covered. The
five existing plan lifecycle cases and three fixtures remain byte-identical;
cursor-material ownership, geometry disposal, cache identity, accepted NaN-ID
cleanup, terrain refresh, land flags and both RNG owners stay covered.

Receipts bind all 336 maintained app files plus actual tests, fixtures,
dependencies and receipt tools: 349 inputs, 348 unchanged between the pair. The
sparse baseline retains the exact full index tree and all maintained app Git
bytes. Completed task-private dependencies were moved by rename after collector
closure; source, raw evidence, lock snapshots and frozen packets remain intact.

The first pair failed the timing case because its expected World omitted the
unchanged completed consumer's terrain-cache reconciliation after a controlled
terrain-version change: candidate seven passes/one failure, baseline six/two
including the separate allocation failure. Both raw receipts and original test
are preserved. The test-only repair uses maintained `nativePosition` on the
expected clone's first completed record, asserts stale versions reconcile and
all land bytes/both RNG owners remain equal, and retains the full actual World
comparison. Both versions then ran the same repaired file without skipped cases.

## Quality and remaining acceptance

Scoped Oxfmt and candidate/baseline ESLint passed. Strict Oxlint **failed** on both
versions: candidate seven findings (six warnings, one error), baseline eight
(seven warnings, one error). The removed old filter callback accounted for the
baseline `b` shadow warning at `app/scene-entities.ts:720:48`. The separate
comparison passed: the remaining seven complete diagnostics match after only
numeric line/column normalization; severity, rule, message and multiplicity stay.

Standard check/build are not run by the author; the coordinator owns exact-head
integration gates. Browser, native rendering, play-session and hardware checks
are not run here. This bounded slice does not complete #144 or establish
deployment behavior. Richer evidence remains local pending disclosure approval.
