# Native G / Shaman command30 lifecycle and Firewarrior phase

Read-only research started on `3cc9e830d2e7d2aa9844e8104fa51017d65dd171`, 2026-10-05 UTC.
The parent integrated reviewed main to `3b899125cc8cedef938823718ad5d44f49957b66`
during research; receipt/review HEAD is that later commit. All probe inputs and
source paths used for these conclusions are unchanged between those commits.
No runtime, generated fixture, parity, issue, PR or browser changes. This packet
extends the [retained task-category evidence](../../../decomp/research/follower-tasks-live.md)
and the [prior guard handoff assessment](../../../../sprite-fallback-hold-audit/work/orchestration/firewarrior-fallback-214/guard-handoff-assessment.md).

## Result and decision

The shipped G input has a proven producer mismatch, independent of the pending
ordinary Mission10 screenshot witness. Native G creates/replaces a shared order30
targeting the current Shaman identity. With no selected non-Shaman, it instead
cancels already adopted state10/status30 followers across the tribe roster. A
Shaman-only selection counts as no selected non-Shaman. Queued order30 on a person
still in state19 is not cancelled by that latter branch.

The port's [guardShaman](../../../app/live-command.ts#L197) instead toggles each
selected follower's legacy `guard` boolean after releasing native work. Repeated G
while selected therefore turns guard off; native repeated G replaces the order and
continues guarding. Empty/Shaman-only selection does not release the port's legacy
guards. The legacy flag also contains no saved Shaman target identity.

The new composed native probe proves ordinary on-foot Firewarrior queue adoption
and actual animation-setter boundaries. It does **not** prove physically settled
guard movement or complete Mission10/browser/native-world parity. The smallest
next implementation is a G producer adapter into the existing native order owner,
after closing its listed edge cases. A general renderer phase rewrite is not
required by this evidence.

## Executed chain and phase

[probe-guard-lifecycle.py](probe-guard-lifecycle.py) executes 11 cases / 64 stages
against the pinned EXE; [attempt-04.json](attempt-04.json) contains ordered entry
snapshots, person byte changes, queue records and events. The first eight cases
compose native entry points explicitly; the final two re-entry cases additionally
execute the native state10 switch body and its common owner transition.

1. `00443b40` G producer → real `00436c20` allocation → `00438730` payload
   preparation → `00436ca0` clear → `00436d00` attach → `0043b010` route normalization.
   One Firewarrior initially state19/source48, seed f1=1/f2=3, receives slot0 order30
   targeting Shaman73; references=1. The producer leaves source/f1/f2 unchanged and
   sets flags2 bit16 for deferred adoption. The retain-selection argument controls
   selection clearing, without choosing an animation.
2. [004d42a0](../../../decomp/generated/004d42a0.c) consumes that flag →
   `004ed640` → [004d2740](../../../decomp/generated/004d2740.c) state10 initializer
   → `00432260` startup → `00432df0` configuration. Configuration saves target73 at
   person+0x72, sets status30 and increments tribe guard count. The initializer's
   **common tail**, after its state10 body, calls `004d3ea0` → `004d4040` → `004ee700`.
   Thus this real nonempty-queue path chooses walking source40/draw18 before the
   first guard dispatch. The empty-order observation in the prior assessment does
   not establish this G path's phase.
3. [00432590](../../../decomp/generated/00432590.c) dispatches order30 to
   [0043daa0](0043daa0.asm). First guard entry sets substate1 and calls recovery
   `004d4f40`, which invokes the real upper/source setters again, then requests the
   target destination. The probe supplies only the destination-planning leaf here.
4. Both setter invocations clear f1 to0. Valid f2=3 is retained for four-frame
   source40; seed f2=5 is clamped to0. Seed f2=2 remains2. Native G does not justify
   copying both old counters or unconditionally resetting both to frame zero.
5. Real tribe command0x7b Ctrl-click deselection changes only permitted selection
   bytes in the whole 256-byte person. It does not replace the record, change
   source40/draw18/f1/f2, stop the queue, or select a source64/48 pose. Four supplied
   eligible animation stamps then yield the real descriptor18 two-visit countdown.
   Stamps in those stages are fixture inputs, not an executed world scheduler.
6. A subsequent near-target visit (counter0, each axis distance<824) retains
   command30 and clears flags2 bit0x2000000. It invokes **no stop or animation setter**;
   source40, speed61 and phase remain in that fixture. The bit controls pursuit/path
   behavior; this observation alone does not prove physically stopped guard motion.
7. Invalid target flags2 bit1, class0, or nonzero target vehicle+0x9f makes the guard
   body finish. Real queue removal releases the reference and tribe guard count,
   and queue completion returns state17. No-selection G first calls `00433490`
   cancellation-anchor logic then clears the queue; that producer itself leaves
   source40 and speed unchanged.
8. Actual state10 jump-table case9 (`004d3519`) through common transition end
   `004d3b1c` executes queue completion and state initialization after loss or G
   cancellation. On the supplied empty-land/walk-mask fixture it enters17 then19,
   choosing source48 with f1=0 and retained f2=3 on the same person. Final speed65
   is retained: this is **idle artwork re-entry**, not evidence of a stopped person.
   There is no `004d4ee0` stop event in that composed result.

## Exact native limits and remaining cases

- Native fixture supplies roster, selected state19 Firewarrior, Shaman identity,
  memory tables, terrain cells, walk mask, seed phase, and schedule of calls.
  VSTART/VFRA frame counts are decoded from original files; imported balance
  constants are checked against original `constant.dat` through the retained loader.
- Intercepted leaves: `004e9d80` copies requested goal/destination coordinates;
  `0047a550` selection UI refresh and `0048a050` sound return without side effects.
  Formation/footprint consumers are excluded by explicit levelFlags2=0x50000.
  The state10 segment excludes the processor preamble (including physical movement)
  and post-initialization health/combat tail. No full dispatcher, OS clock, route
  solver, collision journey or rendered frame is claimed.
- Producer [disassembly](00443b40.asm) has one allocated order shared across the
  selected roster. Allocation/refcount routines execute here for one follower;
  multi-follower shared ownership and allocation exhaustion still need producer
  cases. In particular, allocation returning0 is **not** followed by an early return:
  native code still clears/attaches for that follower, and can retry allocation on
  a later follower. Do not assert failure preserves existing orders. Decide any
  bounded compatibility correction explicitly after an exhaustion probe.
- The producer counts selection bit0x80 and excludes the exact Shaman pointer; it
  does not call the port's `canOrder`/descriptor eligibility checks. Full live roster
  eligibility (death, flight, training, contained people, stale selection) is not
  established by the ordinary one-follower fixture. “No eligible selection” must
  not silently replace “no selected non-Shaman.” The producer returns immediately
  when the tribe Shaman pointer is absent; the body validates its saved target.
- Guard processor reads saved person target+0x72. It rejects a zero/removed target
  or a target in a vehicle; it otherwise resolves an adjacent building's outside
  point. Building adjacency and vehicle containment are different branches.
  Current `shamanGuardTarget` filters `unit.inside` but does not visibly reject
  `person.vehicle`. [boardLiveVehicle](../../../app/live-vehicles.ts#L82) sets the
  native person's vehicle while `Unit.inside` can remain null. An explicit target
  vehicle rejection and its boarding/cancellation test belong in this migration.
- The separate [distance probe](probe-guard-distance.py) executes 28 native cases:
  each axis at distances823/824 and replan displacements439/440, plus signed16 edge
  controls including -32768. All match `abs(signed16(a)-signed16(b))`. Native near
  means both axes strictly<824; far destination refresh means either axis>=440.
  Current `stepShamanGuard` instead computes `abs(short(a-b))`. Five controls differ:
  opposite sides of 0x7fff/0x8000 can be near under the port's wrapped expression
  while native is far, and the wrapped expression can suppress native replanning.
  For example32767 versus32768(-32768) gives native65535 versus port1; person32768
  versus target31945 gives native64713 versus port823. The thresholds themselves
  agree. The minimal arithmetic correction is signed coercion of each operand
  before subtraction, in both proximity and replan comparisons. The companion
  evaluates these source expressions, not the TypeScript runtime or world movement.
  Far stopped recovery and full movement remain outside that boundary proof.

## Smallest port adapter and acceptance boundary

Use the current pool primitives `allocatePersonOrder`, `clearPersonOrders`,
`attachPersonOrder` and `currentPersonOrder` in
[person-orders.ts](../../../app/person-orders.ts), with `orderEffects` /
`releaseShamanGuard` for cleanup. Native G needs its own bounded producer semantics;
`appendLiveOrders` also eagerly restarts current states and is not an exact G
producer merely because it accepts model30.

Preserve the native person identity and queue through `adoptLiveOrders` and existing
registration. `preparePersonTurn`/`changeLivePersonState` → `startLiveOrders` →
`orderContext` already configure command30, its saved target and tribe guard count.
`stepLiveMovement`/`stepLiveOrderQueue` → `stepPersonOrders` → `stepShamanGuard` already
own consumption, recovery and queue completion; `setLivePersonAnimation` supplies
the existing native setter. Check which live controller consumes deferred bit16
before switching ownership; blindly calling `release()` first destroys the state
history that native G preserves until adoption. Cancellation requires the native
command-aware anchor step before `clearPersonOrders`; `setPersonAnchor` is an
available centering primitive, not a complete replacement for `00433490`.

Do **not** use `appendLiveGuardOrders`: that is native004cedd0 AI marker guard,
emitting commands3/11, and has only the AI caller. It is not Shaman order30.

The [source selector](../../../app/selection-runtime.ts#L40) already accepts
state10/status30. Adopting a real command30 would keep its native animation owner
eligible; the current [legacy guard loop](../../../app/world-turn.ts#L1503)
instead blocks resting adoption while state10/status0 loses that owner. This is
the established source reason for the fallback interval. Ordinary selected or
deselected rendering must follow the current native source, not infer pose from G.

Old `Unit.guard=true` data contains neither the original order target identity,
shared reference, queue lifecycle, nor native phase history. A migration may choose
new behavior, but cannot relabel that boolean as a recovered original order or
retroactively manufacture the historical f1/f2. Preserve an explicit legacy-save
policy and test it separately from newly issued native G.

Before coding, finish bounded producer cases for shared ownership, exhausted pool,
selection/target exclusions and current-controller handoff. Then the pending
ordinary Mission10 witness must train a Firewarrior through completed hut149 with
ordinary4000 mana, move near Shaman110, use G/deselect/repeat/cancel, and record native
owner/source/state/status/phase plus visible frames. No authored Blue Firewarrior
or injected test unit substitutes for that acquisition path. Full physically
settled original guard phase additionally needs native route/physics→guard→setter
composition with an unchanged ordinary target; this packet does not close it.

## Receipts and durable proposal

- Original EXE SHA256:
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Frozen probe SHA256:
  `7f6ad6a478db9138af4b5ff3d69b612969c5dcc8365ec324309d18771ec77064`.
- Result SHA256:
  `7c7d6eff380665b6240822b29e38e9eff47de1c1a4c8855b58b4b5c71bde3711`.
- [receipt.json](receipt.json) records exact command, exit0, clean source HEAD,
  tool/input/source hashes and supplied leaves. Python3.12.14, Unicorn2.1.4,
  Capstone5.0.7; each probe invoked with timeout60s and CPU4.
- [distance-receipt.json](distance-receipt.json) records the bounded distance run.
  Companion probe SHA256:
  `5a7578947b47e7a2e795e881893028250278f8845a2c9f45bdae74372f62cc70`;
  result SHA256:
  `fa07a6393231153208152ba789b80d9954ae01baefdd87729c3257bedcd52b76`.
- Independent reviewer reports byte-identical frozen replay and verifies original
  assembly bytes plus relevant indexed exports. Its own report remains the
  authoritative review artifact; this is not self-acceptance.
- Initial attempt01 failed at a probe-only JSON-key assertion; attempts02–04
  passed with increasing bounded scope. Raw attempts are retained. No standard
  check/build/browser ran because this task writes ignored research only.

After review, retain the reusable probe under `scripts/`, its new evidence and a
concise `decomp/research/shaman-guard-lifecycle.md`, linking the project map and
decomp index. These disassemblies are from the pinned image, not new Ghidra exports.
Issue60 classification and issue214 broad sprite timing remain open at their
existing scope; this packet earns no whole-game or playable parity credit.
