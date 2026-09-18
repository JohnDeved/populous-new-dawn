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

Production fix: **blocked on one end-to-end native group-entry timeline**. A hard one-at-a-time gate would currently be fabricated rather than native-supported.
