# Model7 automatic panel implementation contract

Refs #25. Proposal only, after the independently reviewed
[request/latch contract](training-panel-auto-contract.md) and
[load reset](training-panel-auto-reset.md). No gameplay code is changed here.
The intended outcome is one shared, capacity-admitted automatic/manual panel
record for a normally training local Warrior Training Hut, with source-backed
request, renewal and expiry. Existing occupant artwork and commands stay in their
current owners. This does not complete #25 or all native UI timing.

## Ownership and actual producer

Use the existing `stepLiveTraining -> stepTrainingConversion -> updateTrainingPanel`
call. Its invocation before repricing/conversion is the authoritative opportunity.
Restrict this new consumer to class2/model7, the local tribe, completed/live camp
identity and activity0x80. Other training families retain their current behavior.
Do not derive requests from `renderBuildingPanels`, `stepBuildingInspections`, an
activity edge, final state after a turn, or a coalesced frame queue.

A small transient binding, keyed to the current World, may route that callback
to the Scene's ObjectPanels owner synchronously. This is a **browser architecture
adaptation**, not a claim about native object layout. Bind only a current Scene;
its disposal removes only its own binding, so stale disposal cannot remove a
newer Scene's owner. A World without a Scene has no UI request consumer. Do not
serialize bindings, callbacks, queues, DOM references, record phases or latches.
The existing `afterCurrentGameTurn` hook is too late for this allocation boundary.

Keep records in the existing `buildingRecords` map. Keep a separate Scene-owned
set of latched automatic-training IDs: record.automatic and the request latch
cannot be the same Boolean because native activity expiry clears only the latter.
Do not read/write persisted `admission.flags3 & 0x800000` to implement this UI latch.
A restored legacy bit23 therefore cannot suppress a fresh Scene request.

## Admission and lifetime rules

| Event | Required browser behavior |
| --- | --- |
| Eligible training callback | If this Scene's ID is latched, return. Otherwise attempt shared record admission at this exact callback, before conversion and subsequent building/pool consumers. |
| Successful existing record | Mark automatic and latch the ID. Preserve phase, remaining and hold; do not accelerate D again. Manual and automatic ownership share one record and one reservation. |
| Successful new record | Create phase -1/remaining0/hold16; set automatic and latch only after successful admission. Invoke the existing new-building T-cache/D=T+1 side effect exactly once. |
| Failed admission | Leave the ID unlatched. No fresh record, D acceleration or feedback. Retry on a later eligible callback, not on paint. Keep the existing 32-record/shared-secondary count adapter and same-class timer-zeroing order. |
| Phase1, local activity still positive | Restore remaining from hold, then perform the existing phase step/decrement; a 16-visit hold ends the visit at 15. |
| Phase1, activity stops or local ownership changes | Clear the request latch and remaining, then enter phase2 on that visit. Keep record.automatic until disposal. This automatic expiry wins over an earlier manual renewal. |
| Activity restarts during phase2 | An unlatched callback may reuse and relatch the exiting record; do not restart it. Its eventual disposal clears the latch again; a subsequent training callback may create anew. |
| Invalid identity or final phase retirement | Remove the record and its latch together, release its reservation, and preserve separately held DOM controls only under the existing camp interaction/dismantling adapter. |

All fresh records use the existing 3/16/3 stepping rule. The transition from entry
to phase1 does not retroactively run a phase1 activity test. No new wall timer,
RAF, animation clock or resetting of the shared tooltip threshold is allowed.
Map-only record creation must publish its reservation immediately so another
request in the same fixed turn observes occupied capacity. The port still does
not allocate native physical secondary slots; do not upgrade the count adapter
to a full native-pool equivalence claim.

`inspectBuilding` currently combines admission and manual ownership/string output.
It may expose a small internal record-admission result for this consumer while
preserving the public manual behavior. Do not infer success from a visible panel
or create a second map. Existing browser modal/overview admission guards are an
explicit compatibility policy; a rejected automatic request remains unlatched.
Do not add selection, ordinary-hover dwell or an on-screen gate to the callback.

## Presentation and existing frontend-order adaptation

Remove **bare activity0x80** as a completed camp's DOM-creation authority. Rendering
uses its shared record, existing independently held camp controls or the existing
dismantling0x8000 adapter. Dismantling alone must not manufacture an automatic
training record. Keep kind5 artwork, physical occupant slots, selection/focus and
dismantle/cancel commands unchanged.

A fresh automatic record (numeric phase **-1**) is already an allocated
owner but waits for its first existing controller step before painting. This
preserves creation-before-step-before-draw without inventing an extra step at high
game speed or during a zero-opportunity render. Entry/exit artwork equivalence
remains separate from this record-ownership change.

For an automatic camp, evaluate phase1 activity and advance its record even when
DOM controls are hovered/focused. The existing early DOM-interaction `continue`
cannot bypass latch clearing or phase2 retirement. Accessibility can retain the
DOM panel independently after that retirement; the current union-of-owner IDs
must count it once. Preserve ordinary manual-only camp/Hut interaction behavior.

Native `004a4960` handles input before its simulation requests and record step.
Current `GameScene.animate` instead calls `advanceGame` before its composed
tooltip visit in `updateFlyby`. This proposal **preserves that existing browser
frontend order**: synchronous automatic admission/D writes occur during simulation;
a later same-frame tooltip acquisition follows the current controller rules.
No exact native precedence is claimed for simultaneous new input/tooltip
acquisition. Do not conceal this difference by buffering requests or globally
moving the established controller/forced-acquisition clock as part of this slice.
Tests must describe the actual sequence and preserve existing manual acceptance.

## Save, load and new Scene

Ordinary Save clones gameplay state and does not reset the current Scene's records.
Load/Restart/mission replacement dispose the old Scene and its binding, records,
latches and DOM. Migration already clears transient secondary reservations.
New Scene starts with no record/latch and does not replay saved requests. An active
restored camp can request on its next genuine training visit; a paused or otherwise
nonadvancing World cannot create an automatic record solely from paint.

This ownership reset matches the proved post-load effects of `00503f60`; the
Scene-local storage choice remains a browser adaptation. Preserve World activity,
occupants, mana, orders and unrelated flags. Preserve the existing Page-owned T
cache across replacement. Do not claim the entire native new-level/restart caller
chain was recovered merely because the browser's new Scene starts empty.

## Reachable Mission2 witness and required regressions

Reuse the accepted ordinary Mission2 construction helper: select Braves, open
Buildings, choose the 8-wood Warrior Training Hut, place near (-99,-105), and wait
on real clocks through completion/crew departure. Wait for any prior manual camp
record to expire. Select ordinary Blue Braves and left-click the completed camp;
move the pointer away immediately. Natural admission must produce activity and the
actual training callback; observe automatic creation, pointer-independent retention,
conversion, activity clearing, exit and reservation release. No injected people,
activity, mana, requests, direct ticks, clock replacement or training completion.
This is an attainable planned witness, not evidence of a run by this source task.

Before implementation, retain failure-first actual-caller cases for: no record
from zero-tick paint; pre-conversion request even when conversion clears activity
in that same turn; ordered repeated callbacks/multiple buildings; allocation
failure/retry; existing manual reuse with no D reset; entry-stop and phase1 expiry;
phase2 restart/reuse; DOM hold without frozen automatic lifetime; stale/dead/enemy
target cleanup; no duplicate shared reservation; and Save/Load/new Scene with a
stale serialized bit23 and no replay. Cover current-Scene binding replacement and
stale disposal. Repeat existing manual camp/Hut, training and capacity regressions.

Acceptance requires standard code gates, affected native comparisons with all
intercepts disclosed, the natural Mission2 browser witness, and fresh review of
the final implementation. Existing frontend timing, modal/overview admission,
DOM-control holding and physical secondary allocation remain explicit adaptations.
No runtime edit is authorized by this document before independent acceptance of
this complete bounded contract.
