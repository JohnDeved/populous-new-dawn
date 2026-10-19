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
At base `b2990fe5`, `ObjectPanels.trainingIdentity` rejected model 5, while the
renderer created Temple progress DOM from activity/hover. That progress artwork
did not establish synchronous allocation, latch or retained lifetime.

Retained exports bound by `camp-manual-inspection-source.json` to executable
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
prove the generic chain `00403280 -> 00405b80 -> 00509290 -> 005092e0`:
Temple's descriptor qualifies, local class-2 activity `0x80` qualifies, and a
successful `00504060` allocation/reuse precedes setting bit 23. `00504920`
renews phase 1, clears the latch on expiry, and retires the record. PR290's
hash-bound `00503f60` proof covers the accepted post-load reset boundary.

The initial contract left `FUN_0040b9c0` unresolved. A separately reviewed,
function-bounded static read of the same verified executable now closes selection
for the **local-owned state-2 Temple**. The helper returns zero immediately when
signed building byte `+0x2f` equals the passed player tribe. `00504060` passes
player global `0x89c6f0`; zero plus model 5, state 2 and descriptor bit 1 selects
panel kind 5. State 1 would select 8; a nonzero helper result selects 11. Neither
alternate is the admitted local training caller.

The finite read used GNU objdump 2.44; the independent reviewer additionally
verified raw PE offsets/bytes. Executable length is 2,275,840 bytes with the SHA256
above. Exact region bindings are:

- Selector VA `[0x40b9c0,0x40ba1c)`, file `[0xadc0,0xae1c)`, SHA256
  `ac6397c507769c8744d10afbf9ea46d22ac1c427e2fc2bd8f10979c0b35a41eb`.
  At `0x40b9d6`, `0f be 4e 2f` reads the signed owner; at `0x40b9e1`,
  `3b ca 75 05 33 c0 5f 5e c3` compares and returns zero on equality.
- Allocator VA `[0x50434a,0x504489)`, file `[0x10374a,0x103889)`, SHA256
  `a7e7e89bfd8ebdf572f5175a1f16c8b15464371e5dde18aadd63a0b79a559c49`.
  Call is at `0x504359`; zero branch is `0x50441d`, kind-11 write is
  `0x504424`, and kind-5 write is `0x50444c`.
- Model-5 flags at VA `0x5a73ec`, file `0x1a51ec`, are `9f 48 00 00`.

Source/design review artifact SHA256:
`96ea7a4834ba55015b21bf6b664c4c64d02911c9c2d05634ddf7444ea543650c`.
This closes local selection only. Foreign ownership, complete Temple raster
output, physical allocation and native cadence remain outside this change.

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

## Preserved test-only baseline

Application/runtime bytes remain identical to base. At test-only
`baf197dff75e5ef171f90af4ebbbbac0dcb277d5`, run01 failed all four cases on an
unsupplied Temple material resource before the product assertions. It is a
fixture prerequisite failure, not the product red (receipt SHA256
`4dbee27240a4a54e81133fe965513f98901efa97da65b0ca5ccf46c3db73921a`).

Successor `9aeaedcf8d6d96f1e0552a2cf13f5e036d0edee3` supplies the existing
`createSharedAniblResource` at that art/texture fixture boundary. CPU 4 command
`node --test tests/temple-automatic-panel.test.mjs` then reaches four intended
ownership/consumer failures (0 pass, 4 fail; 12.85 seconds). The actual M3 request
at turn 2023, Temple 1021 and Brave 312 captures activity/admission true and zero
trained, but no automatic record, latch or reservation; legacy paint is visible.
Subsequent assertions in each failing case are future acceptance, not completed
negative coverage.

Receipts remain under ignored `work/orchestration/`:

- `temple-automatic-first-red-02.json`: SHA256
  `aeb8217d641c2c8cdb5e3c175d74899f2e6f8cdb18ae2613fd1b386bf6ecec33`,
  exit 1; stdout SHA256
  `3c630f17a10d875a8eea83127a25588b3cea18f6fe8db647ee7869b749d6f77e`.
- `temple-automatic-baseline-eslint-02.json`: SHA256
  `63e8b619bb2332cd86d5737628e4c26c866b69f31b16b985e8aa9285ff4273f0`,
  exit 0 for the three changed test/support modules.
- `temple-automatic-baseline-format-02.json`: SHA256
  `05863c785e6d128b15ccf522b9d101baf66abf9514097bf60074ec6897c3aa9e`,
  exit 0 for those same modules.

The standard orchestration plan conservatively requests the repository check
for these unmapped paths. Full standards and browser/native runs are not run at
this expressly focused failure-first stage; they are not implied by cheap passes.
