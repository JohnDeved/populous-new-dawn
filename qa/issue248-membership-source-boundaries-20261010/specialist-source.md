# Issue 248: finite phase16 specialist membership-release guards

The ordinary model5 branch releases only after its `flags4 & 0x40` latch is already set, its state-table flags include8, and the collected building-list head is0. The ordinary model7 branch releases only when `004f4f60(task+0x1f, person)` returns0. Both attempt a return-home order, then unconditionally call `004f2440(person,0)` regardless of that order helper's success. Their already-incremented local member count is not decremented. These are exact release boundaries, not permission to clear every specialist at task completion or every failed spell cast.

Model5 is Spy and model7 is Shaman. Their releases are dependencies of universal admission activation; they do not by themselves establish a blocker in the accepted M6 selected-member cohort of three model3 Warriors plus one model4 Preacher. Model4 retains its separate previously identified maintenance boundary at004f5770/0043b790. The observed selected-member list does not prove that no other same-tribe state14 person would be included by the original full-set phase3 admission scan. This packet makes no arbitrary3/4 activation recommendation.

This source-only packet reuses accepted exact instruction excerpts and five registry-matched exports from `4754e12d3590bde18656416514871b033de164be`. No native/emulator/port/campaign run, new disassembly, or production edit was performed. The manifest binds every input. The prior general proposal is held and the Warrior-only subset is withdrawn for unproved current gameplay usefulness; PR309's ten-test red checkpoint remains unchanged.

## Shared caller and admission gates

The phase16 controller at `004cc130–004cc172` first calls `004f5950` with target/task+0x10, independent ten-entry building and person arrays, maximum10 and radius7; it then calls `004ce2c0(tribe,task,index+1,buildings,people,resolvedTaskEntity)`. The assignment producer remains the accepted phase3 full-tribe-state14 scan through `004f2440(person,index+1)`.

Inside `004ce2c0`, EBX is the person, EDI the task, and EBP the tribe. It walks tribe+0x881 via person+8, requiring exact `+0xaf == index+1`, deletion flag `+0x0c & 1 == 0`, and special bit `+0x7f & 1 == 0` for the ordinary model paths. The separate special-bit path reaches another release at004cebc9; this packet does not compose it. The once-per-call coordinate selector `004f2e40(task,buildings)` may run before the model branch when task elapsed+8 is divisible by4. Its producer/side effect was already accepted and is distinct from a membership predicate.

The collected building head here is the actual `004f5950` list, not `computerAttackTargetsRemain`, the person-list head, a raid member count, or an arbitrary radius check. The existing pure `collectDefenseTargets` is available, but whole-world adapter ownership/order remains a separate accepted limit.

## Model5 / release at004ce7f3

Entry is004ce5f7. Before counting, an optional disguise prefix reads signed tribe byte+0xc22 and the associated table byte at `0x960805 + 48*tribeIndex`. If this cadence byte C is nonzero, `(task.elapsed & (4*C - 1)) == 0`, and person state is neither25 nor29, it compares `004de740(person)` with task byte+0x1e; a difference calls `004de760(person,task+0x1e)`. Existing Spy evidence identifies the target/disguise byte+0xb2 and the setter's target<<6|63 operation. This packet does not re-prove the unregistered getter/setter bodies or that cadence-table producer; supplying C=0 skips this optional prefix in the finite case below. Do not map it to a guessed AI attribute.

At004ce645 the local count increments. The release path then requires:

1. `person+0x10 & 0x40` is already nonzero at004ce649, selecting004ce748.
2. `personStateFlags[person.state] & 8` is nonzero at004ce74d–004ce755.
3. The collected building-list head at `[buildings]` is0 at004ce75b–004ce765.

A nonempty building list does not release. It scans up to ten entries for a building whose state+0x2c is not4; finding one calls0043b8e0, otherwise returns to the next person. That command-producing callee remains outside this finite release path.

The latch producer is the immediately preceding unlatched branch, not a new external owner field. With bit0x40 clear,004ce653–004ce743 processes the resolved task entity / collected buildings and ORs the bit at004ce677,004ce6ab,004ce6cc,004ce71b or004ce73f. Every such branch returns to the next person. In particular, with resolved task entity null and buildings[0]=0 it reaches004ce73f directly, sets0x40 and returns without releasing membership. On a later idle visit with the same latch set and an empty building list, the release path is taken. Setting the latch and release are not the same visit.

At004ce7ac it calls `004f6020(tribe)` for the return coordinate. That pure export reads tribe byte+0x5b4; zero selects the loaded packed point+0x5a2, nonzero selects+0x36a. Each coordinate byte has its low bit cleared, then becomes the corresponding uncentered native x/y word by shifting8. `0043b2a0(person,&point)` is called at004ce7e8. Its EAX is discarded, and004ce7f0–004ce7f3 unconditionally invokes `004f2440(person,0)`.

Port representation: registered `flags4`, `state`, rules state flags, assignment, and known7f can represent the local latch/state predicates. The current runtime has no producer setting flags4 bit0x40 for raid Spies; inventing it from model5 or an array would skip the proved first-visit behavior. The collected building list and resolved native task entity need their actual current-world producer. C, target-tribe byte+0x1e, and complete disguise-prefix ownership are not silently supplied by current `task.mode` or a default zero.

## Model7 / release at004ceab8

Entry004ce8c0 first increments the local count. If the state flags include8, it computes the person's even packed cell and calls `004f2fc0(task.target,personCell,5)`. This pure registered helper compares both packed axes using wrapped byte distance<=5. When outside that square, the task target is converted to an uncentered native point and passed to0043b2a0 before spell selection. This optional move is not the release condition; a finite state10 input (state-table mask8 clear) skips it.

At004ce946–004ce955 it always calls `004f4f60(task+0x1f,person)`. EAX0 jumps directly to004cea71. Existing accepted Mission6 source research binds the three input bytes to ATTACK operands5/6/7 through opcode1059 `0048fc50 → 004e5fd0`; the allocator writes task+0x1f/+0x20/+0x21. The selector scans those bytes in order, ignores0,6,19, and applies the existing per-model AI usage limit when enabled; it returns the first permitted model. Three known zero bytes therefore establish the zero result without mana/casting/target assumptions. The generic selector body is not a registered export in exact4754; reuse of the prior source contract does not turn an unknown saved spell list into three zero bytes.

Only the zero-selector branch attempts `004f6020` return coordinates and0043b2a0 at004ceaad, then calls `004f2440(person,0)` at004ceab8 regardless of the return-order result.

A nonzero selector takes the separate payment/mana, Shaman eligibility, cadence, range, usage, target and cast chain. Refusal at those later checks retains membership; successful casting removes the spell from the list through004f4ff0 but does not pass the zero-selector release in that same visit. This is why the port's `castAttackTaskSpell(...) === null` cannot stand in for the release guard: it conflates an empty/disallowed selector result with missing Shaman, insufficient mana, cast-state/range/target refusal and other outcomes.

Port representation: newly allocated `ComputerTask.spells` already retains exactly three byte values in `requestAttack`, and the phase6 task caster uses the same first-permitted-model algorithm before later cast checks. Known fresh lists and existing spell-usage fields can represent the selector condition. Missing legacy `task.spells` remains unknown; the current `?? []` convenience does not prove a native empty list. Phase16 does not currently call this selector/release path. Do not change phase6 spell behavior or infer phase16 release from its callback's null return.

## Observable write order and exact stopping boundary

Both releases call the same complete leaf004f2440: clear person+0x7f bit0, write+0xaf=0, clear person+0x14 mask0x2000, preserving other bits. Neither removes its already-added count for the current maintenance call. The next visit's assignment test then excludes that person. A port array mirror would need to remove this person's current membership on the explicit release, not retroactively subtract the already-counted visit.

The pre-release return helper0043b2a0 is allocator-first. With a valid allocator cursor in1..799 and all799 usable order records having nonzero references, it returns0 without pool mutation, queue cleanup or downstream calls, and the outer release still occurs. This gives finite supplied positives with no unresolved executed return-helper callee:

- Model5: matched ordinary owner, no deletion/special bit, C=0, state17 (mask8 set), latch0x40 already set, buildings[0]=0, known home-selector fields, full order pool with cursor in1..799.
- Model7: matched ordinary owner, no deletion/special bit, state10 (mask8 clear), known task spell bytes[0,0,0], known home-selector fields, full order pool with cursor in1..799.

Choose task elapsed not divisible by4 and a one-person chain to exclude the optional coordinate selector and additional people from these maintenance-call cases. Both keep the queue/pool unchanged on failed return allocation and still clear membership. This is a static supplied-state contract, not a newly executed result or a current campaign witness. The outer controller's later target-list/retry/RNG behavior is outside these selected-person cases.

For successful return allocation, the first directly necessary uncomposed boundary in this packet is `0043b2a0 → 00438730(order,3,&point,0)` (order/terrain preparation), followed by existing-order cleanup through004364d0 and attachment00436d00. The prior command19/no0x20/object0 cancellation proof is only one cleanup case and cannot justify arbitrary specialist queues. This pass stops there rather than inventing an order or conditional release on allocation success. For general model5 latch production with a live target, the directly named additional producer is0043b8e0; optional disguise cadence/getter/setter fields retain the limit above. For general model7 nonzero selection, the existing selector contract can be reused but its exact live usage-limit inputs must be bound; the broader casting chain is unnecessary for the known-zero positive and remains unmodified.

Result: the membership-release guards and unconditional post-return clearing are established; universal positive admission still must compose the required current-world/return-order producers. The captured3/4 cohort has its own membership/full-set and model4 maintenance questions; this Spy/Shaman pass does not settle them. No Warrior-only activation, special-bit shortcut,17/19-only patch or full phase16 rewrite is proposed.

## Current-caller decision

A new supplied failure-first regression can reach phase16 through the existing `withCampaignTribe → stepComputerTasks → stepAttackTask` caller; no helper-only runner is needed. For model7, an explicitly known fresh three-zero spell list, registered matching owner and full order pool with valid cursor in1..799 provide all inputs for the finite release condition. The current caller lacks the maintenance invocation, so its missing clear is testable without inventing a selector result. This remains an unexecuted test design, not permission or evidence for a general repair.

For model5, a supplied already-set latch would test the later release predicate, but it would not establish the producer. A composed two-visit case must first test the unlatch/no-resolved-entity/empty-building-list branch setting0x40 without clearing membership, then the later idle visit releasing it. The current caller has no corresponding latch producer or exact raid collector binding. Those named inputs must be owned explicitly; an injected bit alone cannot justify activating general Spy ownership. No unavailable file or tool blocks these known local guards. The implementation blockers are the missing phase16 producer/caller bindings and, for a normal successful return, the named00438730/cleanup/attachment composition above. No broader spell or target engine was followed.
