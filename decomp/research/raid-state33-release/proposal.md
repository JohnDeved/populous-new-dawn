# Mission 2 state33 raid-member release proposal

Refs #248 and #247. Source-only at runtime `48a84610254d3ad5cddb600c266ed9a151233b79`.
No new simulation/native execution, runtime edits, fixture recording or Ghidra export.
Isolated from the Mission 1 `appendLiveOrders` owner repair.

## Question and finite source closure

Can one real `004cb400(tribe3, taskIndex1)` phase-6 visit release original living
member10, release its command131 once and reset state/motion/animation/idle anchor,
preserving member11 and person/cell/tribe links? This visit need not finish the task.
Replacing member10 with a later survivor is not acceptance.

`observed-3227.json` projects raw line4446, after normal turn3227: registered
`u.native`, class1/model2/state33/substate3, life1000, speed0, current131
(model3/refs1/object0), assignment280, actual computerAssignment0. Task1 has
members[10,11], phase6/fallback14/elapsed359. Member11 is living state19/substate5
with no order. This is first directly proved *unconditional* eligibility, not
first possible eligibility. Raw3171/substate2/commandPhase8 lacks animationMode.
Preserve the invalid derived `firstReleaseEligible` label and the old25/29/10
fixtures as history; the correction review supersedes that interpretation.

- Real `004cb400` header -> `004d14f0` -> `00462750`/`004f2460`/`004f39f0`.
  The release predicate reads state+2c/substate+2d and, only for substate2,
  animationMode+a8. commandPhase is +aa.
- `004f2440(p,0)` clears Unit.nativeFlags7f +7f bit0, membership +af and
  flags3 +14 bit0x2000. It does not unlink/delete the person.
- `00436ca0` -> `004364d0` releases131: refs1->0 and pool active-1; object0
  avoids `004ef180`. `004da1d0`'s current3/state33/sub3 avoids stop-work.
  Real `00501be0` executes and returns on assignment280 without `004d4f40`.
- `004e9b40` resets motion; real `004ed6f0` is RET; `004ed640` -> `004d2740`
  enters model2 default state10. State10 flags6916 include0x200: no speed RNG.
  `00432260` returns on cleared queues, avoiding idle-search expansion.
- Keep real `004a3940`, `004d47d0`, and conditional `004d3ea0` -> `004d4040`
  -> `004ee700`. Bind animation/render, cargo/vehicle and world/tribe fields.
  The existing person-state harness intercepts leaves and is not this proof.
- Anchor relocation reads actual cell flags/building index; if occupied keep
  real `004044b0`, actual building pose and verified bank2 object/shape tables.
  Snap the resulting point to cell center, clear +82, preserve actual position.
- `mission2-no-cast-source.json` binds ATTACK680/740: last three field operands32
  are literal -1. Caller/allocator argument13 gives task+2f=0xff; helper argument7=1
  and its original sentinel branch bypass spell/world processing. Static source
  provenance is not a newly executed script/allocator result.

All named generated leaves already exist. Unknown reachable calls or inputs stop
preparation; no additional no-op interception is an acceptable repair.

## One passive capture after independent review and a resource grant

Old JSONL cannot reconstruct omitted animationMode, nativeFlags7f, complete pool,
task slots, anchor or animation-world inputs. Prepare one narrow observer around
the unchanged `tests/mission2-raid.test.mjs` case with identical setup/assertions
and1/12 ticks. At after-tick3227 require the entire known projection to match,
write one snapshot, then stop with a distinguished capture-complete outcome.
This is a capture, not a passing maintained test. No clock/world mutations,
extra commands/entities, skipped assertions, later-turn search or native calls.

One Node process/attempt/reserved CPU, maximum3227 ticks, TERM120s + KILL10s,
1GiB RSS and8MiB snapshot/diagnostics, no network/package access. Parent selects
the CPU/window. Retain failures; no retry is granted. Capture:

1. Complete person and Unit records for10/11, property presence, registered-owner
   identity and native/fight/flight/entry/builder alternatives. Include motion,
   physics, animation/render/cargo/vehicle/anchor fields, +a8/+aa and Unit+7f.
2. All800 orders/8000 native pool bytes plus cursor/active; all ten tribe3 task
   slots, queue cursor, selection/AI flags and actual AI identity.
3. Both RNGs, actual game/level/load flags, player tribe, relevant animation-world
   and tribe records; every source-referenced optional object and its presence.
4. Actor10/11 positions, registry/cell-head/chain links; actor10 cell flags/building
   ID and actual building/outside-point inputs. Target1022 presence and complete
   class/model/flags/life/state/position header. Do not reuse target290's tombstone.
5. Runtime/test/observer/import-closure hashes, tools, tick count and matching raw
   trace projection. Geometry/animation tables come from verified original inputs.

Missing properties stay absent. Native values require a reviewed source default
or explicit supplied projection; never silently use `get(key,0)`.

## One composed pair after capture, binding review and a separate grant

This is an isolated supplied visit on a post-turn3227 port snapshot, not a whole
native Mission2 capture or native scheduler timing proof. Freeze the raw snapshot.
Map task.members[10,11] to native+af=2 as an explicit admitted-member projection;
preserve observed port computerAssignment0. Declare supplied[10,11] tribe chain,
native addresses/pointer table, all ten task slots and any source-default fields.

Native: exactly one real cdecl004cb400 call, full header/reached leaves intact.
Freeze256-byte people, full tribe/tasks/pool/counters/pointers/target/cell/building
inputs, tables/globals, stack/registers and read/write allowlists. Canonical EXE
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Cap100000 instructions, 1s emulator/15s outer, one attempt,8MiB evidence. Stop on
unknown reads/writes/calls, ABI drift, allocation, deletion, spell processing,
RNG writes or terrain writes. Retain all accesses/intermediate writes/call values
and full before/after snapshots. PE-mapped BSS is not a supplied input.

Port: exactly one real `withCampaignTribe` -> `stepComputerTasks` ->
`dispatchComputerTask` -> `stepAttackTask` visit on a reconstruction. Supply an
explicit ordinary dispatch turn/cursor1; no world tick. Freeze that adapter,
prove actual callback coverage, retain registered ownership and assignment0.
The wrapper turn/cursor are declared supplies/effects, not a changed capture or
claimed scheduler parity. Do not copy the private settled callback into a probe.

Failure-first prediction:48a leaves10 state33/queue131/member intact; native releases
10, decrements131 refs1->0/pool active-1, enters state10, resets motion and snaps
anchor without allocation/deletion or RNG draw. Life/position/list links and11
stay unchanged. Release makes all-settled false; phase6 persists with elapsed
359+captured active-task count, not fallback14. Audit header visit-counter/target
refresh separately. Native+af2->0 compares semantically with port member removal,
not its already-zero byte. EAX is residual/semantic void; port returns undefined.

## Gates and stopping point

`review_preacher_restart_proof` first reviews this proposal; then inspect the
capture observer/manifest before the parent's capture grant. After capture,
bind every field/range/ABI and publish the small probe plus source-only preflight
for a second review and separate native/port grant. Neither grant is implied.
Only paired failure-first receipts justify proposing a live release correction.
No runtime rewrite, maintained-test changes, recorded fixtures, extra controls,
full checks/builds or full original OS-game execution are included. All execution
checks are not-run pending review/resource authorization; source-only structural
validation suffices for this proposal. Stop after publishing hashes/review request.
