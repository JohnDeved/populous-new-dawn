# Tight-geometry native training diagnostic

## Result

The single authorized run completed with exit 0 at the first-five stopping boundary, turn 33. Real original admission calls (`0x407150`) succeeded at:

| Turn | Native person | Ordinary geometry tag |
| --- | --- | --- |
| 25 | 1836 | 513 |
| 29 | 1838 | 300 |
| 30 | 1833 | 309 |
| 31 | 1832 | 312 |
| 33 | 1834 | 519 |

No turn contained two successful admissions. Both the building's maximum `entering` field and maximum concurrent person substate 5 were **five**. Original behavior still permits a five-person approach pipeline; this does not establish a one-person semaphore.

Distant tags 507, 510, and 516 remain in approach substate 1 when the fifth admission stops the run. The building's queue is then empty. Their eventual overflow/queue behavior was not executed or proved. No further native runs were made.

This is the native arm of a reduced, flat geometry-template differential. It is **not** an exact ordinary Mission 3 continuation, and it cannot alone attribute the ordinary same-turn triple to allocation counters, resting rephasing, or another initialization field. The sibling browser comparison owns both exact-native snapshot replay and an independently app-produced state arm.

## Identity and inputs

- Research checkout HEAD: `96a465d1b3dfb7ff7aae34865088308dc26d4783`; tracked worktree clean before and after.
- Executable: `/workspace/scratch/69fd8163d94e/original-game-restoration-20261010/game/d3dpoptb.exe`.
- Verified executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Private runtime: `../native/venv/bin/python`, Unicorn 2.1.4, Capstone 5.0.7. Exact Python/platform and source/data hashes are in `receipt.json` and `attempt01/result.json`.
- Frozen source template: `../native/attempt08/driver.py`; all behavior changes are shown in `driver.diff`. Existing native research, scheduler provenance, and excluded-phase analysis are in `../native/findings.md` and its referenced static receipts.
- Geometry witness: `/workspace/scratch/69fd8163d94e/training-movement-composition-20261010/work/issue29-composed-browser/composed1/ordinary-m3.json`, rejected/off-main product commit `ebe803d4d54cbd1b45041e2d9b271d94c0096a9f`, `observerInitial` turn 1064. Its source hash is retained in `fixture.json`.

Exactly the first eight selected geometry labels are used: 312, 309, 519, 516, 513, 510, 300, 507. Tags are labels only; they do not overwrite native identity fields. Tags 306 and 589 are explicitly omitted. The native planar transform comes from `app/world-terrain-runtime.ts::nativePosition`:

- x = round((app.x + 8) * 256), normalized unsigned 16-bit
- y = round((-app.z - 8) * 256), normalized unsigned 16-bit
- h = 400, an explicit synthetic substitution, not the missing ordinary native height

The building is native class 2/model 7, object 103, angle 0, anchor (11264,38400), height 400. Native initialization produces its rendered-position fields (11444,38636,400). These are distinct from the anchor. Native output asserts the model-specific object and angle/anchor; no rendered center is injected.

## Authentic producer sequence

The building is allocated first. Braves are allocated in reverse geometry-label order so original prepend semantics yield primary person visit order 312,309,519,516,513,510,300,507. Actual IDs in that traversal are 1832 through 1839. Their counters are **7,6,5,4,3,2,1,0**, produced solely by original allocation from the existing cleared class seed array. No arbitrary sequential counters or app-synchronized phases are written into the oracle.

All original class/model/state initialization, life generation, flags, cell insertion and RNG draws remain. Original pool/list initialization, walk-mask generation, building initialization and tribe-list publication are unchanged. Before the human command, original-produced people have state 10/substate 0, speed 0, angle/heading 0; the complete records are preserved rather than reconstructed.

The RNG is 1488818045 after the eighth birth and immediately before the human command. The original shared command producer `0x435780/0x4359b0` plus original selected-person restart block `0x44512b..0x44519b` produces eight references to shared record 1 and advances RNG to 1757885462. Pose RNG is 2271560481 through setup. Post-command speeds in primary visit order are 73,72,75,83,81,82,75,73. All fields and original command/restart ordering are retained in the snapshots.

Absolute native start remains turn 0, with loop 1..160 and stop on five admitted occupants. Training completion/exit stays disabled by the existing explicit `gameFlags=32` fixture input. Terrain is synthetic flat 128×128 at height 400.

## Executed dependencies and boundaries

The complete selected scheduler from attempt08 remains unchanged: native header/command maintenance/formation phase, primary allocated-object traversal, full person/motion/route/collision/command/admission paths, building controller, secondary traversal, tribe-list rebuilding, deferred-free block, full terrain processing, and failed-route aging.

There are 264 person visits and motion calls, 272 route calls, 251 collision calls, 264 command-8 visits, and 5 actual admission calls. Two native class-10/model-1 formations are allocated on turn 25 (IDs 1831/1830). All 33 terrain calls return; 49 pending updates on turn 1 run through original lighting/globe consumers and clear to zero.

All 99 excluded-guard snapshots preserve the previously source-inspected dormant conditions: only model-8 orders, disabled tribe AI/no shamans, zero sunlight/effect/fight/guard/count gates. `summary.json` includes the observed values. This is a fixture-specific guard check, not proof that every excluded world phase is harmless.

Zero function bodies, returns, leaves or dependencies are replaced. Hooks only observe or stop invalid memory, interrupts, out-of-text execution and bounded instruction overrun. No installer, PE startup, OS bridge, network bridge, rendering, source export, production edit or broader trial was used.

The prior unproved outer-loop logical animation boundary (`0x4ee770/0x4ee7b0`) remains. This run does not establish frame cadence or original rendered doorway appearance. Other omitted whole-world/UI/script phases retain the earlier limits.

## Snapshot contract and artifacts

- `fixture.json`: exact source-bound geometry, desired visit/allocation order, mapped building inputs and explicit omissions.
- `attempt01/births.json`: full decoded/raw person record immediately after each genuine birth, RNGs, class-counter bytes and allocation order.
- `attempt01/allocated.json`: full snapshot after all nine allocations, before the first building-controller visit and tribe-list publication.
- `attempt01/before-command.json`: full snapshot after original building initialization, tribe-list rebuild and explicit selected-group/cursor setup, immediately before the original shared human command producer. Includes pending terrain queue.
- `attempt01/before-command-runtime-globals.bin`: raw original `[0x890000,0x990000)` at that boundary.
- `attempt01/initial.json`: authoritative post-command/restart, turn-0 replay input, with pending terrain queue. `snapshot.people` is allocation order (1839..1832), while `allocationOrder` is primary traversal (1832..1839, then building639).
- `attempt01/initial-runtime-globals.bin`: corresponding post-command memory range.
- `attempt01/result.json`: complete end-turn timeline, pre-person/pre-command/post-person observations, actual admission entry/return events, terrain traces, guard snapshots, full terminal state and source hashes.
- Person snapshots add `geometryTag`; IDs remain native. `result.geometryMapping` maps the two namespaces. All prior schema fields are retained.
- `attempt01/driver.py` and `attempt01/fixture.json` are frozen copies. Root `driver.diff` exposes all changes from attempt08.
- `summary.json`, `receipt.json`, `attempt01.stdout`, `attempt01.stderr`, `attempt01.exit`, and `artifacts.sha256` provide compact evidence and verification.

Command, from the research checkout:

`PYTHONDONTWRITEBYTECODE=1 work/orchestration/training-native-20261010/native/venv/bin/python work/orchestration/training-native-20261010/tight-native/driver.py attempt01`

A fresh reproduction needs a new output tag because the driver refuses to overwrite a run. This report does not authorize another run.

## Interpretation and next decision

The fixture is adequate to compare actual native births with declared app materialization/resting producers and to replay this native state through unchanged browser consumers. The parent should use the sibling comparison to find the first differing field/consumer before selecting further scope.

The source witness lacks full native height/support, person angle/heading/velocity, precommand routes/cells/lists, actual allocation/resting history, full terrain/walk masks, and precommand RNG. The ten-to-eight reduction also changes shared references, RNG consumption, formations and queue interactions. Start turn 0 differs from ordinary turn1068. Therefore a match or mismatch in this reduced diagnostic cannot on its own prove the cause or correction of the ordinary symptom, and it provides no basis for a global lifetime-counter repair.

No production implementation or merge recommendation follows solely from this native result. The permitted native lane is complete and released.
