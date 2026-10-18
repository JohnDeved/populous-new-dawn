# Firewarrior Hut automatic training panel

Refs #25 and #457. Narrow model8 extension of the accepted Camp/Temple automatic
panel contract; base main `7a04b1ac25c69d8f7ca059b5be8809c5ab6703e1`.
Spy/model6, manual panel admission and training gameplay are unchanged.

## Source contract

`building-shapes.ts` maps Firewarrior Hut to building model8; its trained person
is model6, a separate namespace. `original-rules.json` gives building8 flags
`0x489f`, identical to buildings5/7, and capacity5. Retained exports:

- `00403280`: completed state2 and descriptor bit0 (without bit0x20) dispatch
  `00405b80`. Active training calls `00509290` before repricing/conversion.
- `005092e0`: local class2 activity0x80 qualifies. `00509290` sets bit23 and
  automatic ownership only after successful `00504060` allocation/reuse.
- The owner-generic `0040b9c0` proof retained in
  `temple-automatic-panel-contract.md` returns zero for the local player.
  Building8 is not special model18/19 or construction state1; descriptor bit0
  selects panel kind5 in `00504060`.
- `00504920`: phase1 renews from activity; activity loss clears the latch and
  begins exit. Reusing phase2 does not restart it; final retirement releases it.

The existing camp source provenance and export index bind these exports to
executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No new original-executable invocation is required or claimed for this static
extension. The old Temple contract's manual-rejection statement predates later
Temple manual-inspection work; current baseline admissions remain authoritative.

## Demonstrated gap and correction

`stepLiveTraining -> stepTrainingConversion -> requestTrainingPanel` already
reaches the synchronous Scene request for model8. `ObjectPanels.trainingIdentity`
accepted only models5/7, so that request was rejected, while the renderer painted
legacy activity DOM without allocation, fresh-phase or retained-exit ownership.

The failure-first supplied-building test uses actual geometry picking, Brave
input, entry and fixed simulation turns. At turn367, Hut1022/Brave278 reached the
real callback with activity=true, trained=0: no record/latch/reservation existed,
but legacy training DOM was visible. Baseline red02 failed all five intended
assertions. The earlier receipt symlink attempt failed before launching any test
because Git refuses check-ignore traversal through a symlink; it earns no test
result.

The correction admits only living completed local class2/model8 identity, uses
existing synchronous allocation/latch/lifetime, and makes legacy training paint
yield to that owner. Independent dismantling and post-retirement held controls
remain available. No new manual retained admission is introduced. Existing
Camp/Temple behavior, clocks, training, mana, orders and RNG remain unchanged.

## Acceptance and limits

`tests/firewarrior-automatic-panel.test.mjs` covers the actual callback before
conversion/paint, capacity failure and later retry, fresh-phase suppression,
latched repetition, activity expiry, phase2 reuse, held controls and reservation
release, wrong class/model/tribe, Spy exclusion, death, and in-session Save/Load
reconstruction. The affordable conversion is also run on an identical unbound
world and compared in full, including units/orders and both RNG streams.

The completed building, DOM/projection/texture boundary and frame deltas are
explicitly supplied. This is not ordinary Mission8 acquisition, actual browser
pixels, IndexedDB durability, full native allocation or cadence parity. Natural
Mission8 and rendered acceptance remain separate, bounded work; no broad mission
run was launched. Full check/build remain required before merge.

Raw source-bound red02, green01 and focused02 receipts remain in the owner's
`work/orchestration/firewarrior-panel-20261018/` and exported `/tmp` packet.
Focused02 passed all28 new/existing Firewarrior, Camp, Temple automatic and Temple
manual cases. Exact frozen-source follow-up and independent review are recorded
in the PR handoff, not inferred from these earlier working-tree results.

### First-allocation World comparison

The actual initial callback now compares the complete World immediately before
and after synchronous allocation. A separate actual-entry case begins without a
Scene owner, binds one only after admission, then compares first allocation plus
same-call affordable conversion against an identical unbound World. Both permit
exactly one documented mutation: adding `building-panel:<id>` to the previously
empty `secondaryEffects.reservations` array. No fields are deleted, zeroed or
otherwise normalized, and no World/native latch is excused. All other state,
including both RNG streams, matches. The shared reservation adapter accounts for
the native class10/model3 panel allocation observed in `00504060`; Scene latch
and record maps are transient, outside World. This bounded comparison does not
claim future near-capacity secondary-effect allocations ignore that real resource
reservation. The extended six-case working-tree run allocation06 passed.

## Proposed ordinary rendered witness (not executed)

Use the shipped Mission10 selector, not a fabricated Mission8 victory. Read the
actual initial state and use only public pointer/keyboard controls. The imported
`level-ten.ts` has **two** Blue model8 schools: DAT120 at(-126,-32) and DAT149
at(20,-8). The old checker uses `.find` and selects the remote first one before
teleporting a Brave; do not reuse that target shortcut. DAT149 is near the initial
Shaman DAT110 at(29,-5), Brave DAT173 at(23,-3), and Brave DAT174 at(21,-15).
Imported positions are target identity hints, not instructions to alter positions.

Bound the first proposed episode to 180 seconds after mission entry and at most
2160 ordinary simulation turns, with no forced ticks or accelerated game speed.
This is well below the retained first mission deadline of5760 turns; path travel
and naturally funded conversion duration are still unmeasured, not guaranteed.
Allow ordinary introduction completion or its shipped Skip introduction control.
Find the visible central school and an actual local Brave through the consumed
picker; use normal click selection followed by a real school click. If occluded,
use ordinary camera controls, not `scene.focus` or injected camera settling.

Retain read-only command8/target/entry and synchronous callback observations,
then capture visible progress/list after normal controller admission, pointer
leave/re-entry, natural conversion/activity loss, exit, and no stale panel.
Capture phase-1 and phase-2 pixels where a natural frame exposes them; phase-1
absence at synchronous creation is a CPU observation, not a claimed screenshot.
Do not rewrite timers, mana, actors, activity, phase or outcomes. Stop on first
rejection, path stall, mission outcome or the declared limit and report exact
last state rather than silently substituting a fixture. This verifies ordinary
training in an authored building, not earning/building one or full Mission10.
Build/acquisition acceptance remains a separate unproved route. No browser or
long simulation was launched while preparing this proposal.
