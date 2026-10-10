# Finite class-2 lifecycle contract at current main

**Result:** the existing lifecycle mapping still identifies the actual missing
port owner. No source-backed Swarm gameplay slice can presently obtain its
building candidates by projecting the current Building array without changing
tie order or identity/alias behavior. The remaining prerequisite is live event
and allocation ownership, not original binary-save compatibility.

This consolidation inspects main `3b13a7ff534ab95797b0b06330055cead956160d`, tree
`f821f3d711694cbb74e4c2c70e4ab2ce4ff5834c`. Nineteen of the twenty port files
pinned by the original `f9675f56` mapping are byte-identical. The only changed
file, `computer-runtime.ts`, has four stored-origin fallback changes. They can
change AI plan placement, but do not add or change its allocation, cancellation,
ID, cell-membership or retirement ownership. Current source hashes and the
exact bounded diff are in `current-owner-comparison.json` and
`current-owner-changes.diff`. All native facts below reuse the accepted static
packets; no further native decoding was performed.

## Event and owner table

| Event | Proved native lifetime/order | Exact current port owner | Missing state or boundary |
| --- | --- | --- | --- |
| Initial authored class-2 body | `00484a10` allocates eligible authored records in file order; ordinal `+8` differs from physical ID `+0x24`. Class initialization inserts the actual supplied origin; later geometry relocation only reinserts across a cell boundary. | `world-initialization.ts:124–146` calls `addBuilding`; `construction-runtime.ts:224–271` assigns a terrain handle, computes the final model origin, and appends one Building. | A body lifetime, initial insertion/relocation events, physical-slot binding and supported initial cell order. The current final array contains neither intermediate membership nor complete shared allocation history. |
| Plan creation and cancellation | Class 9 is a distinct object and is not admitted by the class-2 acquisition predicate. Cancelling a plan before class-2 body allocation is not class-2 retirement. | Player `live-command.ts:355–358`; AI `computer-runtime.ts:972` creates `addBuilding(...,{plan:true})`. Cancellation removes that preparation object at `construction-runtime.ts:337–343` or `computer-runtime.ts:896–898`. | Keep plan ownership separate from any eventual body. Array presence and `progress` are insufficient class-2 admission tests. |
| Plan becomes a constructed body | `004b8470:303–331` requests a separate class-2 allocation, stores its physical ID in the retained plan's `+0x92`, then performs staged initialization only on success. | `construction-runtime.ts:345–354` changes object/progress/position and clears `preparation` on the same Building and ID. | Separate body birth and plan-to-body alias, the allocation-success/failure boundary, and the actual insertion opportunity. No new native identity can be inferred from the existing handle. |
| Upgrade/replacement | `004050c0:57–85` allocates the new body before retiring the old one. Success creates a distinct identity while the old slot is still allocated; failure preserves the old body. | `world-turn.ts:1233–1248` changes model, level, position, progress and work state in place on the same ID. | Replacement birth and old retirement as separate events, preserving failure semantics. Remembering the old ID must not automatically mark the distinct successful successor as already visited. |
| Neutral Vault | Authored model-18 class-2 bodies and `004866a0` postprocessing allocations are distinct from their trigger/reward objects. They satisfy class 2 independently of whether they have occupants. | `world-initialization.ts:124` skips owner 255; `341–358` borrows a nearby model-18 angle for a newly identified shrine. `vault.ts:209–217,235–237` owns its visible morph. | A separate neutral body and its actual native lifetime/position/alias. Neither shrine ID, trigger position nor morph completion establishes that body. |
| Relocation and deactivation | `004ee580` preserves same-cell order and splices cross-cell moves. `004edf50` clears activity and conditionally unlinks while keeping an allocated record; retirement is separate. | Geometry uses `buildingPosition(buildingPose(...))`. No class-2 ordered-cell owner exists. The accepted M1–3 inventory has zero trigger-linked class-2 targets. | Previous membership, ordered links and active-but-unlinked state when reachable. The zero-case inventory does not justify an M1–3 deactivation patch or an invented HP/model filter. |
| Destruction, dismantling, retirement and reuse | `00403820 → 004edcf0` immediately unlinks cell/allocation membership, sets class zero/deleted, and enters pending with counter 3. The accepted scheduler opportunity eventually invokes `00401b40` to prepend the same physical slot to the appropriate free pool. | Building/runtime/combat/entry callers set HP zero; `world-turn.ts:1733–1742,1763` performs end-of-turn cleanup/filtering. `buildingId:211–222` can recycle unused ten-bit terrain handles. | The actual retirement event, pending processing opportunities and later reusable-slot order. HP-zero filtering and terrain-handle availability do not provide those events or delays. |
| Save, Load and older checkpoints | A modern owner can preserve its own proved lifecycle graph; native format and pointer encoding are separate. The actual native user-Load reconstruction remains unproved. | `game-store.ts:431–444` clones the World, stores it, then clones/migrates it on Load. Existing migration contains no missing class-2 history. | Persist the maintained owner once it exists; preserve a truthful completeness/version boundary for old checkpoints. Do not sort current arrays or replay startup to fabricate past identities/order. |

The separate `objectCells` mechanics already implement native head insertion,
unlink and cross-cell relocation. They are not a missing primitive. Their live
consumer is person-owned: `live-people.ts:317–350` removes registry objects that
are not the current person-map object. Adding Building entries to that same map
without changing its owner contract would immediately lose them. Building
occupancy (`BuildingAdmission`) and terrain footprints are also different owners.

## Why a Building-only adapter changes observable outcomes

Three independent facts prevent an honest array projection:

1. **Acquisition depends on retained order.** The accepted controller takes the
   first eligible class-2 body in its cell chain; it does not sort by ID or
   distance. Native head insertion reverses successive same-cell insertions,
   while later cross-cell moves alter that order again. Final positions and
   array order cannot recover these event sequences. A class-2-only ordered
   list can mathematically preserve the relative order of class-2 members, but
   only after the real insertion/relocation/removal events are supplied.
2. **A browser handle is not a lifetime.** Successful native replacement obtains
   its new slot before releasing the old one, so those simultaneous identities
   differ. The port's in-place upgrade keeps one ID. Reusing that ID for Swarm
   history would silently exclude a new successor; assigning an arbitrary
   “native” ID would merely conceal the missing producer.
3. **Raw-ID reuse is observable after acquisition.** The accepted pursuit path
   looks up the stored ID and rejects zero/deleted/class-zero. It does not repeat
   class-2/tribe filtering or compare a generation. A resolver must retain the
   actual current occupant of a reusable identity slot. Adding a generation
   guard, deleting remembered IDs, or resolving only current Buildings changes
   that predicate.

## Exactly where shared allocation accounting is needed

`004ed8a0` selects from the global low/high free heads using class-descriptor
flags, scenery conditions, the global allocation/count thresholds and pool
availability. It removes the chosen record, preserves its physical `+0x24`,
prepends it to the global allocated list, and updates shared counts before class
initialization. Retirement later returns the physical record by its index
boundary. Those are shared slots and counters, not a per-building ID sequence.

A faithful Swarm raw-ID/reuse contract therefore needs a record of the
allocation/free operations that can affect the selected pools, their admitted
failure conditions, and the current class/liveness occupant at each relevant
slot. It need not replace unrelated rendering/resource allocators or reproduce
binary-save encoding. But a class-2-only counter cannot determine these shared
head choices or later aliases. The already-proved startup/reset free orders
are conditional initial facts, not evidence for the intervening allocation
stream or the current browser's unrecorded past.

Cell ordering is a related but separate requirement: other classes' cell
insertions need not be materialized to preserve relative class-2 order, yet
their shared allocation/reuse effects can still affect identity and pursuit.
This distinction avoids requiring a full mixed-class renderer rewrite merely
to maintain a class-2 view.

The smallest shared owner contract is therefore a slot/lifetime ledger, not a
replacement for all object behavior. For the named primary allocations it must
own: the low/high free-head order and relevant counts; current slot class/model/
tribe and deleted/liveness; allocated versus pending status and the pending
counter; allocation success/failure and reuse; and a bridge to the current
object's position and lifetime. The class-2 view additionally owns ordered
membership and the plan/replacement/Vault aliases. It must receive the real
allocate, deactivate, relocate, retire and pending-processing events. Existing
physics, art, occupancy, worker queues and rendering can retain their owners.

The exact absent current producer is the shared transaction behind those
events: `addBuilding` uses `buildingId`; `world-state.ts:364–390` creates people
with `w.nextId++`; `world-effects.ts:69–84` explicitly uses a browser effect
adapter and the same counter. These constructors do not publish native pool
selection/count/failure or pending-slot transactions. A listener that sees only
their final objects cannot recover those transactions after the fact. The
global allocation request stream needed to seed that ledger is not proved by
the native reset-return free-list snapshot alone.

## Known authored history versus old checkpoints

Fresh authored M1–3 inputs provide the exact ordered records, model/owner/
position/rotation and authored ordinals. The accepted bootstrap pass also
establishes the ordinal-to-physical-link resolution order and finds no linked
class-2 target in those missions. These are real initialization facts and need
not be rediscovered. They do not contain the physical slot chosen by every
interleaved constructor/helper allocation or the later replacement/reuse stream.
A fresh-game owner could retain provenance from a proved event boundary going
forward; it must not label authored ordinals as those missing physical IDs.

An old checkpoint is different: its World has already advanced beyond startup,
with in-place upgrades, discarded plans/dead buildings and omitted neutral
bodies. Even re-reading the authored level cannot recover that elapsed history.
`migrateCheckpoint:146–147` explicitly avoids replaying startup. Modern graph
preservation is not the missing mechanism; only a previously recorded complete
lifecycle owner can restore its own history. A version/completeness distinction
must remain truthful for checkpoints that never recorded it.

## Smallest honest slice and stop

The native cell primitives and model-origin geometry already exist, so another
pure helper or an array scan would not close an absent producer. A non-consumed
opaque browser lifetime token could be useful implementation scaffolding, but
would not prove native identity, resolve legacy aliases, or deliver Swarm
building pursuit. No such runtime change is proposed as parity progress here.

The finite prerequisite for the next gameplay proposal is a supported live
ownership boundary that supplies the table's class-2 births, replacements,
Vault aliases, membership and retirements, together with the necessary shared
slot accounting if raw-ID reuse is claimed. Its initial state must come from a
proved producer, not a current-array reconstruction. Until that concrete
boundary is chosen and proved, this audit stops runtime proposals for building
pursuit/ejection. No original binary-save/UI child, native executable, browser,
test or broad allocator implementation is needed to deliver this contract.
