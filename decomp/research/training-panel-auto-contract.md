# Training panel automatic request and latch

Refs #25. Finite retained-source pass at
`4e8356ef043d9963abd16a840c3246abc972fe48`, after the model-7 manual inspection
change. This closes the ordinary live request/record contract; **native save/reset
reconciliation remains unproved at `00503f60`**. No runtime change, original/native
execution, browser run, asset import or gameplay-parity credit is claimed.
The [source manifest](training-panel-auto-contract-source.json) pins the inputs.

## Request and ordering

[00403280](../generated/00403280.c) dispatches a live state-2 building to
[00405b80](../generated/00405b80.c) when its imported flags have bit 1 and lack
bit `0x20`, unless `game_state.level_flags & 0x20`. Model 7 meets that descriptor
condition (flags 18591, capacity 5). The active `building+0x9c & 0x80` branch
calls [00509290](../generated/00509290.c) **before** training repricing, mana
comparison, replacement allocation and occupant removal. It is a request on each
eligible building visit, not just a start-training edge or a successful conversion.

[005092e0](../generated/005092e0.c), for class 2 other than model 18, returns a
nonzero low byte exactly when the building belongs to `player_tribe_num` and
activity bit `0x80` is set. Dismantling bit `0x8000` alone is not this predicate.
The request then tests building byte `+0x16 & 0x80`, equivalent to **flags3 at
`+0x14`, bit `0x00800000`**. If already latched, it does nothing. Otherwise it
calls `00504060`, and only on success sets that building latch and record `+2=1`.
Do not confuse the building latch with occupants' flags2 bit `0x800000`.

[004ec6f0](../generated/004ec6f0.c) processes buildings before the secondary-object
pass and `00504660` validity cleanup. [004a4960](../generated/004a4960.c) calls
`main_loop_outer` before `00504920`; [004a5590](../generated/004a5590.c) can run
multiple inner turns before returning. Consequently automatic allocation can
happen during simulation, and the later frontend record step can observe activity
already cleared by conversion in that same outer visit. Sampling only final
activity loses that request. Native physical secondary ordering remains outside
the port's existing count-reservation adapter.

## Allocation and ownership

[00504060](../generated/00504060.c) first requires `00451370(2)==0` and global
`level_flags_1 & 0x20` clear. This latter flag is a distinct owner from the
`game_state.level_flags` training-dispatch guard. It has no ordinary-hover dwell,
selection, on-screen or pointer requirement. `draw_mode==2` disables its entry/exit
animation flags but does not itself reject creation.

- Existing same-object record: return its index unchanged, including its phase,
  remaining time and hold. `00509290` then marks it automatic and latches the
  building. A preexisting manual record and automatic request share one record.
- New record: retire eligible same-class records before testing capacity. The
  class-2 replacement rule requires **both** targets' activity `0x80` clear and
  excludes model 18. An active training request therefore does not retire another
  ordinary building record.
- Search the 32-slot table at `00895fb9`, stride `0x9e`. With a free slot,
  [004edae0](../generated/004edae0.c) permits class10/model3 at secondary count
  `<=159`; [004edbd0](../generated/004edbd0.c) can still fail when no physical
  secondary slot is free. Full table, failed precheck or failed allocation leaves
  the request unlatched, so a later eligible building visit can retry.
- Successful fresh class-2 record: phase -1, remaining 0, durations **3/16/3**,
  one class10/model3 UI object; completed model7 chooses panel kind5. New building
  creation calls `004a2530`, so it lazily caches T and writes D=T+1. Reuse and
  failure do not repeat that side effect. The already accepted
  [clock/caller excerpt](https://github.com/JohnDeved/populous-new-dawn/blob/c1b16d5af571f4735f036f71b063827b3a7f6e17/decomp/research/ordinary-tooltip-controller/clock-and-caller.asm.txt)
  pins `004a2530..004a2558`; this pass did not decode new executable bytes.

The record's automatic flag and the building's latch are related but distinct:
the flag selects phase-1 renewal, while the latch suppresses repeated requests.
Neither is the gameplay activity bit.

## Renewal, expiry and restart during exit

[00504920](../generated/00504920.c) checks automatic activity only when record
`+2!=0` and phase `+1==1`. Positive activity sets the building latch and restores
remaining from hold `+0x1c`; the usual decrement follows. Negative activity clears
remaining and the building latch, then advances into exit on that same visit.
It does **not** clear record `+2` at that transition.

Creation at phase -1/remaining 0 first steps to phase0/remaining2. After entry,
phase1 starts with remaining15. Active renewal keeps it at15 after each step.
Inactive phase1 advances to phase2/remaining2, then1, then0, and retires on the
following step. No seconds-based guarantee follows without the frontend clock.
Activity that stops during entry is first tested on the next visit that begins in phase1.

If activity restarts during phase2, an unlatched request can reuse that exiting
record and set its latch without resetting/reversing the phase. Phase2 still
retires it and clears the latch; a subsequent eligible building visit can create
a fresh record. Do not invent immediate phase1 resurrection or reset-on-request.
Final retirement clears a valid target's latch, frees the record and releases the
secondary UI object. [00504660](../generated/00504660.c) performs corresponding
cleanup for an invalid target during the unpaused simulation branch.

Manual inspection renewal occurs earlier in the native input path; inactive
automatic phase1 renewal later overwrites its remaining time with zero.
[00504bc0](../generated/00504bc0.c) separately renews phase1 for active roster/status
hits. These facts do not establish the port's broader DOM hover/focus hold as an
exact native control owner. Keep that existing accessibility/interaction adapter
explicit, including how it delays retirement.

## Save, new Scene and the exact unresolved reset

The native latch lives on the **world building**, not in the record table.
[00442cd0](../generated/00442cd0.c) submits the state block
`0089d178..<0096eadc` (length `0xd1964`) to its save helper. The primary-building
flags and secondary objects lie inside the bounds initialized by
[004ed820](../generated/004ed820.c), within this block; the UI table `00895fb9` and its
count `00895fad` are outside. This proves address coverage, **not that an active
latch survives all pre-save helpers or that a complete UI record is serialized**.
The retained [shared-pool findings](hut-smoke-secondary-owner.md#checkpoints-and-reconstruction)
establish list reconstruction, not automatic-panel save fidelity.

[00443260](../generated/00443260.c), after successful load/list reconstruction,
calls `00503230` and later **`00503f60`**. The restore/reset path
[00442b50](../generated/00442b50.c) also calls both. Neither routine has a retained
body in this inspected tree. `00503f60`, immediately preceding the allocator's
address range, is the precise next reset/reconciliation boundary; proximity is
not proof of what it clears. The visible `&0xffffff7f` load writes clear bit7,
**not** bit23. No original new-level/restart table/latch-reset contract can be
claimed from these callers. Stop here rather than invent reset behavior or survey
the whole save system. Pre-save transformations and complete restore behavior
remain outside this finite result. A finite availability check found no retained
`00503f60` export/assembly, canonical EXE or static/recovery manifest in the current
shared/task workspaces, including ignored files; the documented canonical EXE path
was absent. No extraction, installation or substitute input was attempted.

In the port, [saveCheckpoint](../../app/game-store.ts) clones World, including
`Building.admission.flags3` and activity. [ObjectPanels](../../app/object-panels.ts)
records, pointer ownership and the DOM map belong to GameScene, and disposal clears
them. [page.tsx](../../app/page.tsx) creates a new Scene for a replacement World;
the Page tooltip session survives. Migration calls
[restoreSecondaryEffects](../../app/hut-smoke-runtime.ts), which clears derived
panel/preview reservations. No existing building migration clears bit23. Therefore
writing the latch into persisted admission.flags3 without a matching reset owner
would allow a loaded World to suppress requests for a record that no longer exists.

A narrow browser implementation can deliberately keep request-latch bookkeeping
with the Scene's record owner. A transient binding keyed to the live World can
deliver actual training visits to that owner and be removed on Scene disposal;
neither callback, DOM object, queue nor latch belongs in serialized World. A new
Scene starts empty and becomes eligible on its next actual training visit, not a
paint or replayed saved request. This is a proposed browser lifetime policy, not
proof of native save/new-level behavior. A paused loaded active camp would receive
no fresh training request until simulation resumes under that policy.

## Actual port gap and bounded future scope

[world-turn](../../app/world-turn.ts) calls
[stepLiveTraining](../../app/live-building-entry.ts) for completed live training
buildings. [stepTrainingConversion](../../app/training-conversion.ts) invokes
`effects.updateTrainingPanel(b)` before repricing, matching the source boundary;
the live callback is a no-op. Real admission/removal in
[building-occupants](../../app/building-occupants.ts) owns activity0x80, derived from
untrained occupant weight. This producer is already implemented, not unresolved.

`renderBuildingPanels` currently exposes local camps directly from activity0x80
or dismantling0x8000. That path can create DOM on a paint, bypasses record allocation
failure/dwell side effects and has no native 3/16/3 automatic expiry owner.
`ObjectPanels.stepBuildingInspections` polls activity only for Huts; changing that
filter to include camps would still put request production on the wrong clock.
Its `inspectBuilding(...,'automatic')` can reuse/mark a shared record, but has
browser modal/overview guards and no distinct request latch. It is not a drop-in
complete implementation of `00509290`.

The source supports an ordinary local model7 slice: connect the actual pre-conversion
callback to shared Scene record admission, preserve successful-create-only D/T
effects and failure retry, share manual/automatic records, and retire from actual
activity at the existing record step. Deliver requests in their original building
visit order before later conversions/pool users; a final-activity scan or a
coalesced end-of-frame ID list is insufficient. The current count-only secondary
reservation remains an explicit adapter; exact native physical pool ordering,
all training models, modal/overview behavior, dismantling's separate producer,
frontend pacing and native save/reset fidelity are not thereby completed.

## Attainable Mission 2 episode and acceptance

Mission2's imported header allows model7 (header byte4=143 includes bit7), and
`createWorld`/the Buildings HUD expose the camp. Reuse the separately validated
ordinary Mission2 construction prefix from the manual-inspection work: select
Braves, Buildings, Warrior Training Hut (8 wood), place near (-99,-105), and wait
through construction/crew departure using normal clocks. This pass did not rerun
that prefix. The historical `ordinaryMissionTwoTrainingHut` checker records the
next real input: select Braves, then left-click the completed camp. Its injected
clock/camera portions are not ordinary acceptance evidence.

Use that command with at least one admitted living Blue Brave and normal mana
generation; retain the natural doorway/occupancy producer. Move the pointer away
immediately so neither hover maturity nor explicit inspection is the creator.
Observe one automatic record before repricing, retention through training, natural
conversion/last-occupant activity clearing, exit and release. Re-entry while held
or exiting must preserve the phase rules above. This is a proposed attainable
episode, not a newly observed run. Prior manual records from construction inspection
must expire before testing fresh creation, or be explicitly asserted as the reuse
case. No activity, people, mana, counter or request injection can prove this route.

Focused future caller regressions must cover failed allocation retry, existing
manual reuse/no D reset, inactive phase1, activity stopping during entry, restart
during exit, invalid building removal, multiple training visits in one RAF, and
Save/Load/new Scene with no orphan/replayed latch. Retain the existing manual camp,
Hut, control accessibility, training simulation and shared-capacity regressions.

## Validation limits

All 14 exports named by `camp-manual-inspection-source.json` and its export-manifest
hash match. Additional referenced exports were verified against `decomp/exports.json`;
the manifest records their SHA-256s and the inspected port files. The original
executable was not opened or run. Static/hash and documentation-structure checks
are the applicable checks; runtime tests, full check/build, native probes, browser
QA and performance measurements were not run because this change is research only.

Executed checks on the documentation candidate: `git diff --check`,
`npm run orchestration:plan -- --base 4e8356ef043d9963abd16a840c3246abc972fe48`,
`npm run orchestration:check`, and the manifest/relative-link integrity pass all
exited 0. The planner conservatively routes the shared research index to campaign
checks and lists the two new research files as unmapped; these four docs/index-only
paths were explicitly reviewed. No executable code or check behavior changed, so
focused structure/hash validation is sufficient for this deliverable. The planner
only selects checks and does not execute its native/browser recommendations.
