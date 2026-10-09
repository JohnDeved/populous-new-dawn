# Swarm building integration correspondence

Source-only follow-up to the independently accepted static controller contract, `findings.md` SHA-256 `6b5a4811593aca3b9c1090f427c94a604c0cd236dc316f6b2c33a05a388eb87c`. Current interpretation base is main `d6cf109474379172728a3ccebf46ef72a15f3a58`. No code, model, browser or original instructions were executed. Retained helper C is Ghidra pseudocode, not recovered compilable source; this follow-up reuses the source-bound exports instead of generating new disassembly.

## 1. Class-2 cell membership and order: absent live producer

Native producer and traversal are explicit:

- `decomp/generated/00403610.c` (`init_unit_building`) copies original position to aligned building anchors, then calls `insert_unit_into_land_tile(building, &building.pos)` before normal building initialization.
- `decomp/generated/004ee470.c` inserts at the head of the object's 512-unit cell, writes `next` and `previous`, and sets flags2 `0x20000`.
- `decomp/generated/00403d50.c` computes the model-origin position from shape/object/rotation and calls `add_unit_to_cell`; retained `004ee580` performs a real remove/insert only across cell boundaries. `00403280.c` calls the geometry relocation when building flag `0x8000000` is set. Native membership is the object's position cell, not every footprint cell or necessarily its inside/outside point.
- The recovered Swarm controller traverses that head/next chain: `00510334..0051035e`, `00510421..00510430`. Relative class-2 order therefore comes from actual insertion, movement and removal history.

Current port cannot yet provide this order:

- `app/object-cells.ts` already ports generic insertion, removal, movement and traversal. Reuse these mechanics; do not implement an alternative sort.
- All live inserts into `w.objectCells` found by the bounded source search belong to person records (`app/live-people.ts` and `app/live-building-entry.ts`). `syncLivePersonCells` at `app/live-people.ts:310..343` builds a person map and removes any registered object not equal to its corresponding person record. Adding buildings to the existing structure without changing ownership would cause them to be deleted on the next person synchronization.
- `app/world-terrain-runtime.ts:126..170`, `syncLandscapeObjects`, maintains footprint flags, land building handles and shadows. It does not maintain class-2 object head/next links. Neither `buildingFootprints` nor `land.buildingIds` supplies native linked-list ordering.
- `app/construction-runtime.ts:addBuilding` appends the browser Building at line 269. It can initially represent a class-9 plan. Actual allocation in `prepareBuildingSite` at lines 344..353 changes preparation to undefined and updates geometry in place, without a class-2 cell insertion. Authored loading (`app/world-initialization.ts:116..146`) and computer construction (`app/computer-runtime.ts:959..977`) both reach this producer. Ordinary upgrade geometry changes at `app/world-turn.ts:1235..1237`; removal/cleanup has separate callers. Array position or numeric ID is therefore not evidence of current native cell-list order.
- Existing repository evidence explicitly limits this infrastructure to people and disclaims original pre-handoff/all-class allocation order: `references/reverse-engineering.md`, "2026-09-08 — native cell lists and live neighbor ordering".

**Concrete prerequisite:** define a persistent, lifecycle-owned class-2 membership mapping, using the existing linked-list mechanics at actual class-2 creation/plan allocation, geometry relocation, removal and checkpoint restoration. Its first supported ordinary path must preserve creation/relocation order, and its consumers must not be cast as `LivePerson`. A class-2-only projection could preserve the filtered native traversal because insertion/removal of other classes does not change relative class-2 order, but only if driven by these actual lifecycle events; reconstructing one by sorting current arrays/IDs is not equivalent. That projection is a design possibility, not an implemented or reviewed runtime adapter.

The source question is resolved: the missing port producer is now identified, rather than an unavailable native input. A model observer may report actual building positions, geometry and occupancy, but cannot claim an exact ordered acquisition roster until this ownership exists. No target-selection surrogate is authorized by this note.

## 2. Removed-person and panic command ownership: preserve the queue

The concrete state-26 handoff can reuse existing owners with explicit preservation:

- Recovered `005105ea..0051061d` first calls `00407490(building, exactPerson)`, clears flags2 `0x10`, and changes to state 26 only without protection flag `0x100000`.
- Retained `00407490.c` removes the requested physical slot and calls `004d80e0(person,1)`. Mode 1 in `004d80e0.c` restores visibility/cell membership/vertical state without `00436ca0` command clearing. Mode 0 does clear commands, but mode 0 is not this ejection path.
- `004d2740.c`, the class-1 initializer selected through `004ed640`, handles state `0x1a` by setting animation, deselecting, speed 110, timer 64, releasing motion, drawing heading and setting movement flags. Its common training-reservation cleanup (`00409d40` / `00409580`), work-association cleanup (`004a3940`), formation cleanup (`004d47d0`) and route release (`004ea460`) do not clear the person's eight command slots/immediate command. `004a3940` clears work flags/target only; `004ea460` releases a motion-route reference only. No `00436ca0` queue-clear call belongs to this recovered transition.
- Current `leaveBuildingEntry(w,u)` (`app/live-building-entry.ts:359..369`) chooses `u.entry.person` before `u.native`, calls maintained `removeBuildingOccupant`, and returns the exact removed person. Preserve that returned identity through all subsequent operations; do not create another person or select a stale `u.native`.
- For an unprotected removed person, `initializeLivePanic(w,u,p,false,'preserve')` is the existing explicit handoff: `cancelBuildingEntry(...,true)` releases the entry adapter/route without clearing command references, `u.native = p`, then normal state-26 initialization runs. `initializePersonState` already performs state-specific training-reservation cleanup. The default `'cancel'` would destroy retained queue state and is not justified here. The existing reincarnation-wave adapter uses the same explicit-preserve option.
- Recovery already has a command owner: `updateLivePanic` in `app/live-people.ts:1026..1049` keeps the native person when commands remain and calls `adoptLiveOrders` on state-10 recovery. A future regression should verify the exact existing command IDs/cursor/immediate command and pool references survive ejection/panic/recovery, not merely the numerical state.
- A protected person still undergoes occupancy removal and flags2 `0x10` clear, but skips the panic initializer and its route/adapter handoff. Preserve its existing active-person owner and command state; do not force a state change, clear entry ownership, or add route release solely because occupancy changed. Native then continues through removal/damage/reveal in its recovered order.

**Minimal future ejection contract:** resolve each native physical slot to its live Unit and admission-owned person; call the existing occupancy removal; clear the forced-exit flag; for an unprotected person call explicit preserve-mode panic on the returned person; preserve the protected path; then apply native removal, damage and Spy reveal in the recovered order. Keep the later ground scan separate, including possible same-visit additional damage. This closes the queue/identity selection decision at source level; it is not a runtime acceptance result.

## Status and next acceptance

Static controller proof has independent ACCEPT. These correspondence findings are submitted for independent source review. No production implementation is ready while class-2 lifecycle membership/order is absent. A subsequent implementation must establish that shared mapping and a real ordinary occupied-building episode; field-only helpers, injected entities or a footprint/array selector do not meet acceptance.
