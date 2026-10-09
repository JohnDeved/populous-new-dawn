# Temple automatic training panel contract

Refs #25; related acquisition work is #23. Base is merged main
`b2990fe5312b0a0da7e9dc1c23bb3bc071bb0d13`, tree
`9a45d71258b6fed77b808d4901648903067f313d`. This extends the bounded model-7
ownership accepted in PR291, using the static contract in PR290. It does not
complete either issue.

## Source and existing gap

Temple is class 2/model **5**, with descriptor flags `0x489f`, capacity 5 and
trained person model **4** (Preacher). Rendered object 95 is a different identity.
The shipped training order is command 8. `stepLiveTraining` supplies the real
`stepTrainingConversion` callback before repricing, mana use and conversion.
Currently `ObjectPanels.trainingIdentity` rejects model 5, while the renderer
still creates Temple progress DOM from activity/hover. Thus existing progress
artwork does not establish synchronous allocation, latch or retained lifetime.

Retained exports bound by `camp-manual-inspection-source.json` to executable
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
prove the generic chain `00403280 -> 00405b80 -> 00509290 -> 005092e0`:
Temple's descriptor qualifies, local class-2 activity `0x80` qualifies, and a
successful `00504060` allocation/reuse precedes setting bit 23. `00504920`
renews phase 1, clears the latch on expiry, and retires the record. PR290's
hash-bound `00503f60` proof covers the accepted post-load reset boundary.

`FUN_0040b9c0` is not retained. Its result selects original kind 5 versus 11.
This change claims automatic request/latch ownership and consumption by the
existing supported Temple progress UI, not full original panel-selection or
Temple-specific pixel parity. No new original execution or recovery is needed.

## Exact owned fields and consumer boundary

1. Support completed, living Temple kind/model-5/class-2 identity alongside the
   existing camp/model-7 identity. Local tribe, Blue ownership, activity `0x80`,
   current Scene, overview and modal guards remain the accepted training guards.
2. The live callback synchronously calls the current Scene's existing
   `requestAutomaticTraining(id)`. Admission owns `buildingRecords`,
   `automaticTrainingLatches`, and the deduplicated `building-panel:<id>`
   reservation before the caller returns. Failure creates no latch, record,
   reservation or tooltip side effect; a later callback may retry.
3. Reuse preserves the existing record's phase and remaining time. Repeated
   latched callbacks do not renew it. Phase 1 renews from source activity; loss
   clears the latch and starts exit. Phase-2 reuse does not restart exit.
   Record retirement releases its latch and reservation unless an independent
   visible control adapter still owns that same deduplicated reservation.
4. Temple's automatic record is a valid target for the existing stepping and
   painting consumers. Fresh phase -1 remains unpainted until the existing
   controller opportunity. Automatic exit cannot be frozen by hovered controls.
   No simulation, frontend clock, threshold sample or animation cadence changes.
5. Keep `retainedBuildingPanel`'s manual Hut/Camp admission unchanged. Temple
   hover/right-click must not gain a manual retained record. Inactive Temple
   hover and held/focused controls retain their current DOM adapter; dismantling
   remains independent. While Temple training activity is set **or an automatic
   record exists**, ordinary hover/activity DOM must yield to that record:
   no record means no training paint, including capacity failure; phase -1 means
   no training paint; later phases paint only from the owned record. Independent
   dismantling is the explicit exception. A retired record may leave held
   controls visible, as the existing camp adapter does; this does not renew or
   recreate an automatic record. Defocus/departure releases that DOM reservation.
6. Existing Scene disposal/new-Scene/load ownership applies unchanged. Saving
   does not serialize renderer maps/sets; loading reconstructs them only on the
   next real training callback. Scene-local ownership is a port adaptation, not
   an additional claim about original restart/reset producers.

## Failure-first proof and remaining ordinary episode

Use the existing controlled Scene fixture, production animate/input/entry/training
callers and Node test runner. A Mission-3 model-command acquisition/construction
prefix can supply a real completed Temple, followed by rendered-geometry pointer
input and actual Brave admission. Capture primitive request/record/latch/capacity
state synchronously before frontend stepping or serialization. Exercise rendering
inside that callback and after the normal controller opportunity. Separate
supplied-state negatives cover legacy DOM yielding, failed capacity, phase reuse
and controls; they do not establish ordinary browser or natural clock parity.

Ordinary acceptance remains separate: the existing Mission-3 checkpoint route
earns knowledge and constructs a Temple but explicitly requires `trained === 0`.
A distinct continuation can use the existing public command-8 input helper with
one living Blue Brave, then natural mana/conversion and lifecycle capture. No
verified final completed-Temple profile was established by this finite evidence
pass. Any runtime change requires fresh profile provenance. Held QA repair `df0`
is only a future prerequisite and is not copied into this branch. Prior #23
acquisition/artwork and older suspended-RAF preaching evidence do not satisfy
this automatic-panel witness.
