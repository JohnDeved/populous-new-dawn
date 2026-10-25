# Vehicle render snapshot reuse (#144)

`updateVehiclesFrame` now reuses a Scene-owned eligible-vehicle Array instead of
creating the result of `world.vehicles.filter(...)` on every frame. The view is
rebuilt at the original eager snapshot site, after stale-mesh cleanup and before
the first draw. It retains exact `active || destructionState` truthiness,
ordered references to the current records, and the unchanged draw, UV, pose and
resource paths. The prior ID-membership cleanup remains unchanged.

The scratch view has a weak Scene owner. Refilling overwrites its prefix and
truncates its length, releasing references beyond the current eligible count.
This removes this filter-result Array object boundary; it does not establish
backing-store reuse, peak engine capacity, allocation-free callbacks or frames,
GC behavior, or a hardware speedup. Maintained Worlds use ordinary arrays. No
arbitrary subclass/species, custom same-Scene reentry, or new sparse-World support
is claimed; the existing earlier ID collector already rejects undefined entries.

The live caller is the synchronous vehicle phase in `GameScene.animate`.
Authored level initialization and occupied boat/balloon building work produce
the vehicles. Tests use actual Mission 22 class4 templates, maintained vehicle
factories/frame/Scene transforms and real resource release. Cloned populations
and disposal/draw observers are explicit Node diagnostics, not ordinary play.

## Focused evidence

Candidate `2e067c6a4cfeb62dba0259e342a138115077cda2` was compared with pristine
merged main `de140b901202047d5c93fc45aab4a39725d3987f` using the same command:

```sh
node --test tests/vehicle-render-view.test.mjs tests/vehicle-mesh-reconciliation.test.mjs tests/follower-transport-owner-consumers.test.mjs
```

All 11 candidate cases passed. The baseline passed 10 and failed only the new
allocation assertion: three measured frames created three filter-result Arrays
containing 192 references at population 64. Candidate populations 64, 256 and
1024 each created zero such results over three measured frames; full-caller
vehicle ID reads remained respectively 128, 512 and 2048 per frame.

The two new timing cases prove cleanup-time disposal edits are seen by the
post-cleanup snapshot, while drawing-time eligibility edits wait until the next
frame and pose consumers still read the captured record's current values.
Replacement/load, empty/refill and independent Scenes are covered. All eight
existing lifecycle/UV/ownership cases remain byte-identical, including destruction
states 5/6, ordered geometry/material disposal, shared-atlas survival, cached
group identity, actual transforms and accepted NaN-ID cleanup. Full expected
World and both RNG owners are compared, allowing only explicitly injected edits.

Receipts bind all 336 maintained app files plus actual tests, fixtures,
dependencies and receipt tools: 349 inputs, 348 unchanged between the pair. The
sparse baseline retains the exact full index tree and all maintained app Git
bytes. Completed task-private dependencies were moved by rename after collector
closure; source, raw evidence, lock snapshots and frozen packets remain intact.

The first candidate invocation passed 10 cases but failed the new allocation case
at a wrong checkpoint argument after its population-64 allocation assertion had
passed. The baseline separately failed the expected allocation assertion before
reaching that call. Both failed receipts and the original test remain preserved.
Only the call was corrected to the maintained `migrateCheckpoint(World)` contract;
the same repaired tests were then run on both versions without skipped assertions.

## Quality and remaining acceptance

Scoped Oxfmt and candidate/baseline ESLint passed. Strict Oxlint **failed** on both
versions: candidate eight findings (seven warnings, one error), baseline nine
(eight warnings, one error). The removed old filter callback accounted for the
baseline `v` shadow warning at `app/scene-entities.ts:673:47`. The separate
comparison passed: the remaining eight complete diagnostics match after only
numeric line/column normalization; severity, rule, message and multiplicity stay.

Standard check/build are not run by the author; the coordinator owns exact-head
integration gates. Browser, native rendering, play-session and hardware
performance checks are not run here. This bounded slice does not complete #144
or establish deployment behavior. Richer evidence remains local pending the
parent's disclosure approval.
