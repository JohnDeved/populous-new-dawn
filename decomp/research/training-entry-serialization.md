# Training-hut entry serialization — issue 29

Research base: `ba28259ad5b5cce20a03ac98ec7158522f9c319d` on `codex/worker-3-training-entry`.

User report: the browser appears to let five followers enter a training hut together, while the original game was observed admitting them one at a time. The requested investigation must distinguish doorway throughput from interior capacity and active training/conversion slots.

This finite diagnosis finds a real browser multi-entry symptom, but the recovered canonical executable does **not** expose a one-person admission semaphore in the command-8/building admission path. No production change is justified until an end-to-end native group-entry trace resolves that discrepancy.

## Current browser reproduction

A normal eight-brave command to a completed Warrior Training Hut was reproduced in the model using the existing `command(w, building)` path with training conversion disabled (`gameFlags=32`).

The first five followers entered the doorway pipeline before overflow queuing took over:

- `entering` reached **5**.
- turn 50: one resident admitted;
- turn 52: three residents admitted on the same simulation turn;
- turn 54: the fifth resident admitted.
- three overflow followers remained on the training queue.

A direct shared command-8 order using `appendLiveOrders` produced the same qualitative result: `maxEntering=5` and multiple same-turn admissions. Therefore the browser human path's one-order-per-person bookkeeping is a real native-ownership mismatch, but it is **not sufficient to explain** the throughput defect.

## Capacity is not the admission rule

The canonical extracted building descriptors give models 5–8 (Warrior Training Hut / Temple / Spy Training Hut / Firewarrior Training Hut) an interior capacity of **5**.

The native command-8 controller `0x434610` uses that capacity for both:
- resident occupancy (`hut_people_inside` / browser `inside`), and
- the number currently in the entry pipeline (`field_0xad` / browser `entering`).

When the queue is empty, an unqueued follower may proceed toward the building interior while:
`inside < capacity && entering < capacity`.

When the follower enters state 5, native increments `field_0xad` up to the building capacity and arms `field_0xae=0x10`.

The building controller `0x4055f0` independently tests:
`inside + entering < capacity`.

The final admission routine `0x407150` checks interior capacity and fills the first empty occupant slot; it does not impose a one-person doorway lock.

Accordingly, changing `buildingCapacity` from 5 to 1 would contradict the canonical executable and would destroy real multi-occupant training semantics.

## Training/conversion is also batch-capable

Existing native parity work for `0x405b80` and `app/training-conversion.ts` establishes that a completed training building can hold and convert multiple residents. The browser's current focused test converts a complete five-person resident batch and preserves the overflow queue.

Issue 29 therefore must not:
- reduce interior capacity to one;
- convert only one occupant at a time without new native evidence;
- hide extra occupants in the panel/UI;
- alter training cost, RNG, trained-model selection, or exit behavior.

## Existing low-level native parity

The following retained checkers were reused rather than rerun:

- `scripts/check-native-building-entry.py`: entry-delay / entering / entry-timer clock blocks from `0x403280`.
- `scripts/check-native-training-queue.py`: queue rebuild/search/append/predecessor and complete command-8 controller `0x434610`, including all 14 substates and explicit sequential overflow-queue handoff.
- `scripts/check-native-training-conversion.py`: native conversion/batch behavior.
- `scripts/check-native-training.py`: AI training task scheduling/selection/command leaves.
- `scripts/check-native-orders.py`: one shared person-order record per original click.
- `scripts/check-native-person-routes.py`, `check-native-person-motion.py`, and `check-native-person-collision.py`: route, motion, and terrain/building collision primitives.

Those checks mean the missing original behavior cannot safely be invented inside `training.ts`: its state machine already matches the recovered original function.

## Current human and AI ownership

### Human normal group click

`app/live-command.ts` handles a friendly training building outside the shared mixed-order pipeline. It routes each selected follower and sets `u.work`; `app/live-building-entry.ts::begin` later allocates an independent command-8 record for each follower.

The existing test even records eight active building-order records after one eight-brave training click.

This differs from original `appendPersonOrders`, where one command record is shared by all accepted followers from the same click.

However, a current-model experiment issuing one shared command-8 record to all eight followers still reached `entering=5` and admitted multiple followers on the same turns. Shared order ownership should eventually be restored for normal-path fidelity, but it is **not the demonstrated serialization fix**.

### AI

`app/computer-runtime.ts::stepTrainingTask` selects training candidates and issues a shared command-8 record through `appendLiveOrders`. It therefore reaches the same command-8 state machine as the shared-order experiment.

Any eventual entry-throughput repair must be below the human/AI producer split (or prove a native producer distinction), and acceptance must exercise both human group orders and AI training.

## Rejected current-only explanations

### Live-person class counter

Original `alloc_unit` seeds each unit's `class_counter` from a per-class rolling `start_24` byte and increments that byte on allocation.

Browser `createLivePerson` currently bootstraps a transitioning legacy follower with `counter=(world.turn-1)&255`, so a group materialized in one turn initially shares a counter value.

Because command-8 and motion contain counter-phase gates, this was a plausible PND-04 transition defect. It was tested by manually staggering the eight current live-person counters as native allocation would. Admission timing and `maxEntering=5` were unchanged. It is not the issue29 throughput cause in this fixture.

### Shared versus per-person order record

Using a single shared command-8 record reduced active order records from eight to one but still produced `maxEntering=5` and multiple same-turn admissions. Not the throughput cause.

### Building-clock scheduler order

Native `main_loop_inner` processes allocated people before class-2 building entry clocks. Browser `world-turn.ts` currently advances building clocks before its follower loop.

A no-source-edit A/B compensated the browser pre-person decrement and applied `stepBuildingEntryClocks` after followers to emulate native people→building-clock ordering. Multi-entry remained: `maxEntering=5` and multiple residents were still admitted on the same turns. This parity difference does not explain the initial five-person doorway pipeline.

## Why no production change was made

The recovered native state code itself permits concurrent entrants up to capacity. The user-observed original one-at-a-time behavior therefore depends on a condition outside the isolated command-8/admission semantics—most plausibly the **composed end-to-end native person movement / route progression / update ordering under an ordinary group click**, or a presentation distinction between multiple people in the approach pipeline and visibly crossing the doorway.

Existing native checkers validate those primitives individually but do not run the exact multi-person, same-hut, full-motion scenario. In particular, `check-native-training-queue.py` supplies path, animation and admission leaves; it cannot establish the real admission call timeline of eight moving followers.

Adding an `entering < 1` gate or forcing `entryDelay` on every entrant would therefore be a new rule not supported by the recovered executable.

## Exact next discriminating proof

Use one bounded canonical native proof with the hash-verified executable and no GUI/focus dependency:

1. create one completed model-5 training building with canonical capacity 5;
2. create eight same-tribe brave persons in a compact group outside the same door;
3. issue the original normal shared command-8 order to all eight;
4. execute the real per-person update composition (`0x4d32b0`), real route/motion where feasible, real command-8 controller `0x434610`, building clocks `0x403280`, and real admission `0x407150`;
5. record each turn's person position/substate, building `inside/entering/entryDelay/entryTimer/queueHead`, and actual admission calls;
6. do not run rendering, panel code, conversion, browser input, or unrelated game systems.

The proof must answer one question only: **can two or more group members call real admission on the same native simulation turn under the same fixture?**

- If **yes**, the canonical executable does not support a hard one-at-a-time simulation rule; the user-visible difference must be narrowed to original fixture/path/presentation rather than patched in training state.
- If **no**, compare the first divergent native step against browser `stepBuildingEntry`; implement only that missing composition behavior.

## Implementation reservation after that proof

No production file is reserved for editing yet because the owner is not demonstrated.

The smallest likely reservation, only if the native group trace proves serialization, is:

- `app/live-building-entry.ts`: primary composition boundary for native person motion → order queue → `stepTrainingPerson`.
- `tests/training-entry.test.mjs`: add exact turn-level group admission assertions and lifecycle coverage.
- `app/live-movement.ts` / `app/live-pathfinding.ts`: only if the native trace's first divergence is route/order progression.
- `app/world-turn.ts`: only if the first divergence is scheduler ordering, and only after coordinating Worker5 ownership; this research explicitly does not edit it.

Do **not** reserve/edit `app/training.ts` merely to add a one-slot gate: its command-8 logic is already native-parity and the canonical function permits multiple entry-pipeline occupants.

Do not edit Worker4 panel/Followers surfaces or Worker5 world/migration ownership from this task.

## Lifecycle acceptance required for any later repair

The existing `tests/training-entry.test.mjs` already provides substantial invariants that must remain:

- capacity remains five;
- overflow queue survives;
- cancelling a queued follower preserves successors;
- occupant departure reuses the first empty slot;
- checkpoint clone/reload preserves occupants + waiting queue without loss;
- funded conversion replaces resident identities, keeps queued followers, uses shared exit order, and walks trained specialists outside;
- Temple and Spy conversion/output remain native;
- result is render-rate independent;
- already-trained specialists yield queue priority to new braves.

A repair must extend this with:
- exact admission-turn serialization from a real human eight-person group click, **only if native proof confirms it**;
- equivalent AI training admission;
- building destruction while followers are approaching, waiting and inside;
- cancellation while one follower is in the doorway and successors wait;
- completion/exit followed by next admission;
- unchanged RNG state/training conversion sequence for equivalent native-supported timelines;
- no lost or duplicated follower IDs across checkpoint/retry.

## Finite issue29 status

Browser symptom: **reproduced**.

Canonical capacity/conversion semantics: **capacity 5 and batch training are real**.

Recovered command-8/admission semantics: **permit concurrent entry pipeline up to capacity; no one-person semaphore found**.

Current-only candidate causes tested: **shared-order ownership, counter phasing and building-clock order rejected**.

Production fix: **no gameplay-state repair is demonstrated**. The continuation proof below disproves a hard one-person semaphore in the exercised native command/admission composition; the remaining report concerns visible doorway/motion/animation behavior.

## Continuation proof: native group admission allows same-turn calls

The authorized GUI-free native continuation was executed on the canonical executable through the shared queue.

The proof used:
- real state-10 command dispatcher `0x432590`;
- real command-8 controller `0x434610`;
- real admission `0x407150` plus native occupancy/weight/cost/order-cleanup logic;
- the exact entry-clock blocks inside `0x403280`, after all person visits;
- one shared command-8 record for eight braves and a model-7 Warrior Training Hut with capacity 5.

Result:
- native `entering` reached 5;
- actual `0x407150` calls occurred twice on turn 14 (people 5, 7);
- actual `0x407150` calls occurred three times on turn 15 (people 2, 4, 6);
- interior occupancy therefore reached 5 with multiple native admission calls on the same simulated turn.

This **disproves a hard one-person admission semaphore** in the exercised native command/admission composition. It does not close the reported original visual-doorway behavior.

Exact limitations:
- full `unit_processing_class_1_person` (`0x4d32b0`) was not executed; the real state-10 dispatcher `0x432590` was called after manual class-counter increment;
- route/pathfinding/ground motion was supplied as deterministic straight-line movement toward coordinates produced by native command-8 geometry;
- destination/release-motion/cargo/work consumers were supplied;
- admission/occupancy itself was native, while transport/cell/tower/indicator consumers remained supplied by the existing occupant oracle;
- no rendering, animation proof, panel, conversion, browser input, or OS focus was involved.

Therefore there is still no demonstrated gameplay-state repair in `app/training.ts`, `app/live-building-entry.ts`, or capacity data. The remaining issue29 question is narrower: whether original **visible doorway/movement/animation composition** serialized the crossing despite the simulation accepting multiple residents in the same turn. Any repair now requires evidence in that presentation/motion composition, not a capacity or admission-state guess.

Canonical job: `e1048af1-dece-431e-bb5d-667a7567e383`.
Ignored durable result: `work/orchestration/worker-3-training-entry/native-group-entry-result.json`.


## One-shot real-motion continuation: stopped at the animation boundary

The CEO-authorized single canonical composition run was attempted from preserved head
`8c937643cf57a25aae0f748846d45d4024c7ae37` with the old supplied-motion result
left intact. The dedicated probe removed the old occupant-checker hooks and the
`supplied_motion` function. It initialized a flat native terrain/walk mask, the
completed model-7 hut's native position/cell membership and real `0x403a00`
footprint, native person cell membership, and brave life/max-life so full
`0x4d32b0` could own the decisive person visit.

The one authorized queued run was
`e1210710-9e18-4611-ad7e-69baf46f9eb3`. It failed on the first person visit and
was **not retried**.

What executed before the stop:

- turn 1, person 1 entered real `0x4e6d00` at position
  `(13312,14848)`, class counter 1, command-8 substate 0;
- real native motion changed the position to `(13312,14922)`;
- real `0x4eadc0` was reached at that post-motion position with
  `routeId=0`, `routeIndex=0`; no synthetic route was created;
- real command-8 then called native destination handling with the hut approach
  point `(16512,15808)`;
- no `0x407150` admission call occurred before the stop;
- none of the probe's explicit unsupported-abort leaves fired, and none of the
  supplied ambient/indicator leaves had fired yet.

The captured exception was an emulator `UcError` after the destination call and
before the first `0x4d32b0` visit returned. The retained command-8 decomp places
`0x4d4f40` immediately after that first destination setup; `0x4d4f40`
computes native speed/RNG and then enters `0x4d4040` object/animation setup.
This is also the boundary the retained `check-native-training-queue.py`
explicitly supplies as an **animation output** leaf while leaving geometry,
speed/RNG and stopping native. Because this one-shot probe intentionally did not
pre-supply that presentation leaf, the result does not advance far enough to
answer the same-turn admission question.

Interpretation is therefore bounded:

- the run proves that the retained fixture reaches real native motion and real
  route-advance before command-8 destination initialization;
- it shows the retained flags use the native direct-destination path
  (`routeId=0`) at this point, so a route record must not be invented merely
  to satisfy the proof;
- it does **not** prove or disprove same-turn admissions under the requested
  full composition;
- it does **not** identify a browser motion/admission defect, and it does not
  establish presentation/occlusion as the only remaining cause;
- the first exact native-vs-current admission divergence remains unresolved,
  because the native fixture stopped on person 1 of turn 1 before a comparable
  admission timeline existed.

The evidence limit is now narrower than the earlier supplied-motion proof:
continuing this exact composition would require explicitly admitting the
`0x4d4040` animation/object setup as an external supplied presentation leaf (or
providing all of its original presentation data dependencies). That was not part
of the single-run authorization, so no correction/retry was made.

Ignored durable result:
`work/orchestration/worker-3-training-entry/native-group-entry-real-motion-result.json`.
The preserved prior supplied-motion result remains
`work/orchestration/worker-3-training-entry/native-group-entry-result.json`.


## Corrected speed/animation composition: stopped at the native unit pool

A later bounded correction exists on the preserved research head
`b33e7b5eeef9a7918bce0d8af924965038859489`. Queue provenance binds it to
canonical job `ebc079a1-df98-4cdd-8d02-14c0491a8f2a` with an empty tracked
diff. This job is the one corrected native composition attempt; it must not be
repeated under the unchanged native-proof budget.

The earlier animation-boundary prerequisite was repaired from original data,
not by substituting a canned animation or speed result. Native
`0x42c320 load_vele` is the producer of the six-byte `vstart_related`
runtime records consumed by `0x4d4040`. The corrected harness materialized
the verified frame-count projection from the shipped files already exercised
by `scripts/check-native-animation.py`:

- `data/vstart-0.ani`: SHA-256
  `64a8975f234aa67eafc4d4d9edd7cc4aeba9f5743d028d8203e0c67ca199a1aa`;
- `data/vfra-0.ani`: SHA-256
  `c91720da3c636fb74cb749c5f8747ae884c1d76dbeed4b845f5a199ef1a55258`;
- 792 VSTART records were projected; the Brave's referenced object-40 chain
  has four frames.

The corrected composition therefore left these decisive functions original:
full person update `0x4d32b0`, speed/RNG `0x4d4f40`, object/animation
setter `0x4d4040`, person motion `0x4e6d00`, route advance
`0x4eadc0`, command-8 `0x434610`, and admission `0x407150`.
No straight-line movement, synthetic route, or canned speed was supplied.
The only supplied leaves remained the explicit ambient post-person consumers
`0x4d4690`, `0x4d9bd0`, `0x4def50`, `0x4da2a0`, plus the
post-admission occupancy indicator `0x40c4e0`.

The corrected run completed 23 full person/building-clock turns with all eight
Braves still in native state 10, command-8 substate 1, and with the genuine
direct-destination route state `routeId=0`. At the end of turn 23 the
positions were:

| person | x | y | speed |
| ---: | ---: | ---: | ---: |
| 1 | 14963 | 15392 | 75 |
| 2 | 14949 | 15406 | 71 |
| 3 | 15303 | 15469 | 84 |
| 4 | 14983 | 15442 | 71 |
| 5 | 15204 | 15421 | 73 |
| 6 | 15506 | 15531 | 83 |
| 7 | 15591 | 15520 | 84 |
| 8 | 15420 | 15517 | 79 |

There were **no end-turn substate-5 persons** and **no actual
`0x407150` admission calls** in those complete turns.

On turn 24, person 1 entered real motion at `(14963,15392)`, state 10,
substate 1, speed 75 and direct goal `(16512,15808)`. Real
`0x4e6d00` advanced it to `(15039,15412)`, and real `0x4eadc0` was
then reached with `routeId=0`. Before the person visit completed, original
`0x4ed8a0 alloc_unit` was reached. The harness intentionally aborted rather
than inventing allocator output. No supplied ambient leaf had fired on turn 24
and no admission had occurred.

The exact missing native producer is now identifiable:
`0x4ee300 update_unit_lists`. It rebuilds `free_units_less_640`,
`free_units_more_640`, `allocated_units`, `units_to_free` and their
allocation counts by walking the original contiguous
`unit_array_ptr_2 .. unit_array_ptr_3` pool. `0x4ed8a0` consumes those
lists and free unit records. The bounded training fixture instead materializes
only its selected people/building at dedicated addresses and pointer-table
entries; it never constructs the original contiguous free-unit pool. Executing
through `0x4ed8a0` without that producer's genuine inputs would therefore
fake native world-allocation semantics.

The retained abort receipt records the allocator address but not its return
address or arguments. Static command-8 evidence is not enough to name the
upstream caller safely: the obvious substate-1 cargo-release path
`0x4d58c0` requires both goal deltas below `0x70`, while turn-24 person 1
was still `1473` native x-units and `396` y-units from its goal, and the
fixture's cargo field `+0x78` was initialized to zero. The allocator call
must therefore not be labelled as a cargo/drop event without another
caller-bearing trace.

This stops the requested discriminator. The corrected run does not prove
one-at-a-time entry, multiple same-turn admissions, a browser defect, or a
presentation-only cause. Reaching a comparable admission timeline requires
authentic original unit-pool initialization compatible with
`0x4ee300`; the current native run budget does not authorize another
composition attempt.

Canonical corrected job:
`ebc079a1-df98-4cdd-8d02-14c0491a8f2a`.

Ignored corrected result:
`work/orchestration/worker-3-training-entry/native-group-entry-real-motion-corrected-result.json`
(SHA-256 `a2a6019f591c057d6aca27ea6fa303fab68baa579f2bb4cfc4ed062050480dd9`).

Ignored animation diagnostic:
`work/orchestration/worker-3-training-entry/native-group-entry-animation-boundary-diagnostic.json`
(SHA-256 `7f7146774c3a903cb76e080a87d9d04aa1ce7b5940a5ee06931a3db121fc30f0`).

The earlier supplied-motion result and failed real-motion result remain
preserved separately and are not overwritten by this stop.

Source-binding receipt:
`work/orchestration/worker-3-training-entry/native-group-entry-unit-pool-prerequisite.json`.


## Formation-aware visible doorway composition — retained-evidence continuation

Research head: `4212d1a35ba27602e8d5ae31154b0e3abfeeb209`. This section supersedes
older statements above that leave the pool/formation prerequisite unresolved or
infer presentation as the only possible cause. It does not alter those historical
receipts and does not claim a production repair.

The preserved formation-aware canonical job
`838acb15-f68d-424e-b47b-b8933be255fe` completed the requested model-5/object-95,
capacity-5, eight-Brave shared-command-8 fixture. Its authentic contiguous pool,
formation phase `0x4ec7da -> 0x501000`, person motion/route, command and admission
bodies reached five occupants in 58 turns. Result:
`work/orchestration/worker-3-training-entry/native-group-entry-formation-phase-result.json`
(SHA-256 `d9e3e4ea6ea327b164c2a0779a3c3f9428c69804cb4cc78320f1e9aa072e792a`).
The formation-phase findings/audit beside that result preserve its full scope and
queue provenance. This continuation reuses it; no new native job was executed.

### What the apparent single-file crossing can mean

The original-data approach point is `(16640,15232)` and the inside target is
`(16640,16448)` for the retained pose: a 1,216-native-unit (4.75 browser-unit)
segment, not a one-slot doorway. The command-8 near test checks each coordinate
against 112 and runs on an even class counter. Position, substate, occupancy,
render eligibility and visible pixels are different measurements.

| Brave | First substate 5 | Real admission | Substate 13 / speed zero |
| ---: | ---: | ---: | ---: |
| 7 | 37 | 50 | 51 |
| 3 | 39 | 52 | 53 |
| 6 | 40 | 53 | 54 |
| 8 | 40 | 55 | 56 |
| 5 | 43 | 58 | Not captured after turn 58 |

All five admissions returned `AL=1` and increased occupancy by one. All other
turns 1–58 had zero calls. Nevertheless, five people simultaneously occupied
substate 5, and two began it on turn 40. Thus single admissions do not imply a
single-person approach pipeline. Four observed admitted people took one further
native motion step before the next command visit stopped them; the fifth next
visit is outside the retained trace. These facts follow from the saved
`turnVisits` and `timeline`, and `004d32b0.c`/`00434610.c` call ordering.

Training admission selects mode 3 of `0x4d80e0`: it sets occupancy but retains
commands/cell membership and does not set object hide bit `0x10`.
`0046ec80.c` tests that hide bit before queuing the sprite through `0x46f080`;
it does not equate training occupancy with invisibility. Browser
`building-occupants.ts::setPersonOccupancy` and
`scene-entities.ts::updateUnitsFrame` preserve this distinction in ground view.
There is no demonstrated missing admission-time hide operation to add.

The supported narrow composition is therefore **formation-spaced motion toward
a shared inside target, staggered arrival, a further motion step before stopping,
and camera-dependent model-face/sprite overlap**. It is compatible with seeing
successive doorway crossings without a capacity-one or admission-lock rule.
Native and browser painters order model faces and sprites by buckets and source
order, rather than using an occupancy semaphore as an occlusion mask.

A controlled projection of the retained turn-58 resident anchors through the
imported 640x480 normal camera at yaw 0 spans only **0.5625 by 4.8125 pixels**;
the referenced Brave frame is 22 by 30 pixels. Eight controlled preset/yaw cases
show overlapping anchor ranges and nearer model triangles covering their anchor
points. These are projection/solid-triangle diagnostics, **not** alpha-tested
sprite pixels, original-camera evidence, or proof that every resident is hidden.
Texture holes, individual animation layers and the actual camera still matter.

### Concrete presentation-adapter candidate, not a gameplay repair

`UnitMotion.afterTurn` collapses `from` to `to` on **any** `inside` identity change,
including mode-3 trainees which remain renderable. With the five saved native
admission-step endpoints, the actual unmodified adapter skips interpolation over
**0.293203–0.340405 browser units**. With identical endpoints but unchanged
occupancy metadata, it interpolates normally; halfway through the turn the
positions differ by **0.146602–0.170202 units**. This is an observed,
occupancy-metadata-triggered presentation discontinuity, not an admission gate.
It could move an otherwise visible final step across a roof/wall coverage edge.

Native `0046f080.c` instead interpolates from position minus displacement under
its flags/counter conditions; occupancy mode 3 does not zero those displacements.
However, the retained composition trace did **not** capture per-turn flags3,
displacements, complete render flags or presentation stamps. It therefore cannot
establish the original interpolation-enabled pixel trajectory for this fixture.
The broad browser interpolation regression intentionally treats entry as discrete;
this candidate must be checked specifically for visible training entry before
changing `unit-motion.ts`. It cannot explain or repair multi-admission turns in
other browser fixtures by itself.

### Exact remaining visual evidence boundary

The old `check-browser-training.mjs` checks each resident group's `visible` flag,
but its framebuffer subtraction measures only the three queued outsiders.
The retained `2026-09-10-training.json` value of 685 pixels is **not** a resident
or doorway-crossing pixel count. Globe view independently omits all `u.inside`
people; that separate camera mode must not be confused with ground-view occlusion.

The missing comparison is a same-pose, same-camera, same-fraction person-pixel
trace joining `0x46ec80 -> 0x46f080` to the original model queue/painter
(`0x4708d0`, `0x4673b0`) and the shipped ground renderer. It needs each person's
object/frame/render flags, interpolation flags/displacement/stamp, cell order,
model pose and camera state. Preserve the native admissions and compare the last
visible sprite pixels before/after them, first with the hut present, then in
labelled diagnostic passes isolating hut coverage and person overlap. Any
interpolation A/B must change presentation only, not simulation or admission.
No new camera, movement, occlusion, capacity or semaphore rule is justified yet.

Current stop: **NEEDS_REVIEW for the exact reported visible cause**. The narrow
composition and one concrete adapter discontinuity are identified; a matched
original-frame disappearance boundary is not established. No browser production,
capacity, admission or training code was changed.

### Continuation artifacts and checks

All new executable diagnostics are ignored under
`work/orchestration/worker-3-training-entry/`:
`doorway-composition-analysis.mjs`, `doorway-composition-result.json`,
`doorway-composition-checks.json`, and `doorway-composition-portable.log`.
Analysis result SHA-256:
`fbdc081d4ef0d8098466f13d7976dec5579a266f6615fa90e88119ec1b1830b4`.

- `node --check .../doorway-composition-analysis.mjs`: passed, exit 0.
- `node .../doorway-composition-analysis.mjs`: passed, exit 0; retained-data analysis
  and actual portable interpolation adapter, not native emulation or rendering.
- `node --test tests/unit-motion.test.mjs tests/painter-order.test.mjs`: passed,
  exit 0; all eight checks. Input/log hashes are in the checks receipt.
- Native and browser/pixel runs: not run in this continuation; native evidence is
  reused and the missing visual inputs are reported rather than invented.


## Original triangle-arena producer — bounded continuation

Research base: `08853d5d77a24dde8f947c48b9071301c64cb1ff` (PR115).
PR125 remains separate at `3069ec92657b760ead091479d2953ccd22ddc228`;
its browser acceptance and red-receipt bundles were not rerun or regenerated.
This section records a **source-proved prerequisite**, not a successful new
renderer reference or a production repair.

The retained GetCaps/BL320 result already establishes native construction of
`0x5d2570` and a successful texture-storage return through `0x487e30`.
Its next fault is the null arena owner loaded from `0x5ce0bc` at `0x46a5fd`,
then dereferenced by `0x47d8ac`. That earlier result remains unchanged:
`work/orchestration/worker-3-training-entry/getcaps-binding/result.json`, SHA-256
`e8acad5f33e19738f0818cf7592a4ef615b473a93e5a3bc91799ca4886b4be48`.
The completed formation-aware 58-turn admission evidence above is also preserved.

### Authentic owner and frame-initialization boundaries

The following is decoded from the original executable, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
using the existing read-only `native-unit-pool-static.py`; no new Ghidra export,
function replacement, or native fixture recording was needed.

| Original boundary | Source-proved operation |
| --- | --- |
| `0x4b5693..0x4b56a7` | Startup loads the existing D3D interface and calls complete `0x47c6e0`, which creates/configures the material at `0x59df74`. |
| `0x4b56a7..0x4b5716` | Requests `0x248066` bytes through `0x55aca0`, executes the inlined constructor, and publishes its returned owner at `0x5ce0bc` with instruction `0x4b5711`. |
| Constructor fields | Sets arena `+0x1e` to 8; clears six dwords at `+0x24803a..+0x24804e` and `+0x24805a`; sets `+0x248052` and `+0x248056` to `0x4000`. |
| `0x52260d..0x522624` | Loads the UI device handle and the published arena, then calls complete `0x47c790` for the frame. |
| `0x47c790` | Clears count `+0x1c` and previous count `+0x18`, sets cursor `+0x20002a` to owner `+0x2a`, binds the device at `+0x26`, sets `+0x248046` to 1, and executes three `0x460890` cache resets. |
| `0x47d8a0` | Consumes that cursor, writes the triangle record/vtable and three vertices, advances the cursor by `0x80`, and increments the 16-bit command count. |

Allocation alone therefore cannot replace frame initialization. Conversely,
seeding the cursor/count as older isolated painter probes do would not establish
the authentic producer requested here. `decomp/generated/0047d8a0.c` documents
the triangle consumer; `0047c7e0.c` and `0047cc60.c` describe downstream batch
preparation, not substitutes for the missing constructor/frame setup.

The new ignored diagnostic imports the preserved GetCaps and render-producer
functions unchanged. Its only additional allocation response supplies raw heap
storage for the exact `0x4b56b1` return site/size. Original instructions, not host
writes, are intended to publish the owner and initialize arena fields. The
existing COM D3D/device handles are supplied at the documented native call
boundaries; this does not execute a complete original UI/outer-loop startup.
Any unsupported subsequent native or COM consumer must stop the proof.

### Execution disposition: arena bound; backend selector is next

Static preflight passed, including original opcode checks, live input hashes,
unchanged inherited assertions and preservation of earlier artifacts. Preflight:
`work/orchestration/worker-3-training-entry/triangle-arena/preflight.json`, SHA-256
`5cecd0049c14ae5b53b55b5fb34816bba6d2c16702bb84c1103f5f48566e5ddc`.

Exactly one serialized job was submitted and no rerun was needed:
`a2bb8a3f-1ff5-4f9b-bd1e-e5b777a64f03`. The saved queue metadata records
terminal status `failed`, exit code 2, and 21,102 ms execution time. The saved
result is now readable at `triangle-arena/result.json`, SHA-256
`c4269884a4e1ba0197ff80816ca3557aa67820357aaf0036e5d95796907c60ff`.

The runtime result authenticates the arena prerequisite. The only supplied
allocation was raw `0x248066`-byte heap storage returned at original caller
`0x4b56b1`. Original instruction `0x4b5711` then published `0x6000000` to
`0x5ce0bc`. On turn 49 / frame 193, complete `0x47c790` initialized that owner
with cursor `0x600002a`, count/previous-count zero, device `0x4042200`, and the
constructor/frame fields described above. The unchanged original painter then
emitted 47 `0x47d8a0` triangle records: the count reached 47 and the cursor
advanced to `0x60017aa`. This is original arena construction and triangle
production, not a host-seeded command buffer.

The proof stopped later in phase `unchanged-original-person-hut-painter` at
`0x52a7f3`, still on turn 49 / frame 193. `pixelDiagnostics` remained `not-run`;
there is therefore no matched native/browser pixel result and no new visible-
doorway conclusion. The stop is also not an unsupported harness leaf: the saved
result reports `inheritedMissingLeaf: null`.

Static decoding identifies the exact runtime dependency. `0x45f713` calls
`0x5162e0`; when `0x5da078` is nonzero that wrapper calls `0x52a7e0`. At
`0x52a7ee`, the original executable loads dispatcher selector `0xD05AF0`;
`0x52a7f3` immediately dereferences it and the saved run faults on address zero,
before the virtual call through slot `+0x38`. Thus the new boundary is a missing
original render-backend selector, not missing arena state or a person/admission
operation.

The corresponding original producer is also source-localized. `0x4b2650` returns
the current runtime render descriptor at `[0xafc2f4] + 0x0c`. The normal frame
outer loop passes that descriptor to `0x5281c0` at `0x522df3..0x522dfe` (and the
repeat path does the same at `0x523134..0x52313f`). `0x5281c0` inspects the
descriptor at `+0x20` and selects one of the original dispatch tables
`0xD05B10`, `0xD05B18`, `0xD05B1C`, or `0xD05B20` into `0xD05AF0`.

**Next exact matched-pixel prerequisite:** execute/bind that original descriptor
producer and `0x5281c0` selector step for the same frame/pass before entering the
preserved person/hut painter, then let `0x52a7e0` consume the resulting selector
naturally. Do not host-write `0xD05AF0`, invent a vtable, or force
`0x5da078 = 0` to divert into the software branch. After this prerequisite, a
newly authorized proof still must reach the actual pixel diagnostic; the 47
triangle commands alone do not establish framebuffer equality or disappearance.

No browser production, admission, capacity, training or interpolation behavior
was changed. No gameplay fix is supported by this result. Research publication
is limited to binding the saved native outcome and the next original producer
boundary; TypeScript/build/gameplay suites are not relevant to the unchanged
implementation.
