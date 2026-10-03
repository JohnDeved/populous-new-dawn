# Mission 3 complete 128-turn AI block: native handoff

## Provenance and scope

Question: bind CPSCR012's complete later AI block rather than isolated 1074/1103 stubs.
Research baseline: `145768b54bca43e4b763c4d682028bf9fff505ec`. This evidence-only handoff is preserved on top of `5599760904c90adc8c4cc397bb11c9ee8b65b936`; no task adapter is implemented here.
Executable: original `d3dpoptb.exe`, SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Script: `levels/cpscr012.dat`, SHA256 `d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`.
Prior boundary: `decomp/research/mission3-recurring.md#Later-block reachability and PND02 boundary`.
No runtime/source/ledger edits, recording, installer, Wine, or full game execution.

## Complete authored block

Codes `570..<715`, EVERY mask 127 offset 3: `(turn + sign8(tribe) + 3) & 127 == 0`; tribe 2 opportunities 123,251,...
Order matters:

1. If Blue Warrior and Preacher reads (1153/1154) are both >9, and user variables12/10 are zero: set both to1, message73, panel command1180, lifetime256.
2. 1136 sets AI flags bit0x10000 (include unfinished buildings).
3. If internal1088 <1 and Blue population >25, then Blue Warriors <1 and variables11/10 clear: set variables11/10, message71, 1180, lifetime256.
4. Reset variable10 to0.
5. If own Warriors (1147)>2 and own population>7: 1092(1,2,3,-1), existing marker-route task path.
6. If own Preachers (1148)>0 and own population>8: 1074(3).
7. 1068(Blue,marker7,radius8,user9).
8. If user9>3 AND own population<8: 1102(own population), existing Shaman-guard request. Otherwise1103.

The intact native interpreter probe covers six adjacent/boundary/recurrence cases. It supplies internal world reads and intercepts all command hosts in this portion, recording ordering and supplying the marker count. Thus the full-block result proves control/argument-field ordering, not world effects or message RNG. 1136 has direct reviewed dispatcher evidence in `0048cc60.c`, case0x6c.

## 1074 producer: exact evidence

`0048cc60` case0x2e resolves its one operand then calls `004f4520(ai,markerIndex)`.
`004f4520` reads ushort marker coordinate `0x89b7a5+2*index`. For index3 this is marker3, not a delay or troop count.
- `004f5680(ai,position,1)` must return0. It rejects an own currently preaching person at the target coarse cell; also scans own model4 people with active order17/31/32 in states10/33 whose raw order payload word+6 equals marker position. Preserve the literal native payload comparison; do not silently normalize its units.
- `004f7dc0(ai,4,4,-1,1,position,0x47)` returns the actual person pointer. This is single-person selection, with native band/list ordering, near-within-19-both-axes early return, otherwise nearest wrapped Manhattan. It is not interchangeable with sorting an unlimited multi-person result.
- `00462730` obtains first free of ten slots, or -1.
- Real `004627f0(ai,11,0)` requires states bit0x800, zero active type11 tasks, signed short ai+0xa2f>0, and >4 free slots. Exactly five free slots is allowed; four is rejected.
- `00462790(ai,slot,11,person.id,position,0,4)` creates active/noncancelled task. Additional ai+slot*82+0x36 is zero. Native fields: person at+0x68, position+0x6c, extra+0x70, phase ushort+0x78, type byte+0x85, flags dword+0x74.

Probe validates seven gate cases with duplicate/selection leaves controlled, then an additional fully unintercepted allocation including real selector, duplicate test, gate, and writer. A subsequent call cannot duplicate type11. Six further native duplicate-predicate cases cover states, order types, flag and payload boundaries. RNG unchanged in all these cases.

## Actual task consumer and orders

Existing reviewed `004623e0` selects one active slot and dispatches type11 to newly exported `004c8c50`.
Authored entry phase4 avoids phases2/3 completely:
- Missing/dead person (id lookup, deleted bit or class0), or cancellation flag2, releases selection and frees slot before phase handling.
- Phase4 calls `004f63a0` for selection ownership. A conflicting lock stalls; native type20 reservation check `004f2290` also applies. Once acquired: phase5; commandDelay byte20; save previous person state and enter14 unless person flags dword+0x0c bit0x100000 already set.
- Phase5 writes phase6 via `004f5d10`; this helper contains no timer test.
- Phase6 with offset0x36 zero writes one group order17 `(argument0, markerPosition)` through real `00435730/00435780`. For position0x1234 the ten-byte record is `11000000000080348012`, i.e. x0x3480/y0x1280. Nonzero offset0x36 (other producer path) prepends order19 with0x202.
- Release selection ownership `004f6440`, commit group to selected native people `004359b0(ai,-1,-1,-1)`, restore state14 people through `00418ce0(ai,14)`, phase7.
- Phase7 releases via `004f6840` then deactivates via `00462770`.

Probe executes native scheduler, consumer phases, ownership helper, command record writer, and free-slot routine. Person state hooks `004ed6f0/004ed640`, final group commit `004359b0`, restore `00418ce0`, and cleanup `004f6840` are intercepted. Observed sequence4→5→6→7→inactive, command17 payload exact, no RNG. This is not proof of final person movement/conversion.

Unreached generic phase2 randomizes an origin and searches up to23 positions; its two inline RNG transitions are irrelevant to authored1074 phase4 entry. Do not add these random draws to marker3 dispatch. Phase3 selects/reselects model4; neither is reached by the proven1074 request path.

## 1103: exact retarget meaning

`0048cc60` case0x4b → `004f3280(ai)`.
Select target from ushort ai+0x5a2 if no base (byte+0x5b4==0), else ai+0x36a; mask each byte even, shift each to 8-bit world scale, without +0x80.
Visit native own-person list ai+0x881 (next+8). States10/33 only. Prefer immediate order id+0x9b, otherwise queue word+0x8b+2*cursor byte+0xa6. Require nonzero order, (order.flags & 1)==0, model30. Then `0043b2a0(person,&position)`.
New export `0043b2a0` allocates a free order, writes model3, resets/replaces existing orders, and attaches it. Allocation exhaustion returns0 without mutation. This is return-to-base/shaman movement for current order30, not blanket AI retarget or a new attack. Five native probe cases verify filters, fallback order lookup, both bases, exact coordinates, no RNG, with final helper intercepted. Static helper export establishes replacement behavior.

## Live integration recommendation and acceptance

Owner should add entire570..<715 block in original script ordering to `app/campaign-command-runtime.ts`, retaining existing1136/1092/1068/1102 and message hosts, plus narrow1074/1103 adapters. Bind type11 in `app/computer.ts` and `app/computer-runtime.ts`; preserve lock/reservation, cancelled/dead cleanup, byte command delay, four scheduled task visits, native selection side effects, and checkpoint fields. Use existing real `appendLiveOrders`, order17, state14, restoration and preaching/motion consumers, not a synthetic attack or conversion.
`app/computer-selection.ts` already has eligibility leaves, but its multi-person selector must not be assumed equivalent to `004f7dc0`'s early-near selection. Extend with reviewed single-person semantics.
1103 should traverse native ordered people and replace only qualifying model30 via existing order3/movement path at exact uncentered even coordinate. Query actual order pool and actual base ownership.
Prove ordinary mission3 Tower→Temple→trained Preacher, population9+, next script opportunity, marker3 preaching order and real movement, no injected entities/results; recurrence duplicate suppression, type11 cancellation, selection conflict, correct checkpoint continuation and RNG. Full block messages can consume existing message RNG even though new allocator path doesn't.
No browser acceptance performed. No complete mission/native live-game equivalence claim.

## Reproduction and export provenance

Run `python scripts/check-native-mission3-person-task.py /path/to/d3dpoptb.exe`
with Unicorn available. The executable and adjacent original `levels/cpscr012.dat`
are hash checked. Allocation, consumer, duplicate, retarget, and script-block
assertions are distinct; the final PASS does not broaden their interception limits.

The six exports are `decomp/generated/{004f4520,004f3280,004c8c50,004f5680,
004f63a0,0043b2a0}.c`; their exact SHA256 values are registered in
`decomp/exports.json`. They were produced with official Ghidra12.1.3 from a fresh
isolated project, without importing community metadata, using `scripts/decomp.py
init` followed by `export` for these six addresses. The wrapper verified all
file-backed section bytes and successful export/save completion. No original
binary, private machine path, or scratch project is required in this checkout.
The global registry's historical metadata description is not provenance for these
six fresh-project exports.

The portable probe adds exact order17 payload and retarget-coordinate assertions
to the original bounded handoff. Original record allocation and final person
movement remain the explicitly listed boundaries. This is reusable native
evidence; gameplay integration and rendered acceptance remain open.
