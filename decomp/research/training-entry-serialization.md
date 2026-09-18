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
