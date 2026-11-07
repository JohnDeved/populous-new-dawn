# Issue 248: ordinary attack-order cleanup preserves raid ownership

The finite original cleanup boundary retains the same person and its `+0xaf` computer assignment. Clearing an ordinary attack order is not a membership-retirement operation. There is no unresolved executed callee in the case below.

This is static composition of five existing Ghidra 12.1.3 exports at source commit `4754e12d3590bde18656416514871b033de164be`, all matched against `decomp/exports.json`. It does not execute or emulate the original game. The manifest binds those exports and the approved EXE. Pseudocode names/types remain inferred.

## Concrete supplied case

Person P is a valid class-1 person, model 3, tribe 2, state `+0x2c=10`, substate `+0x2d=1`, and assignment `+0xaf=3`. Its `+0x76` ushort has bit `0x20` clear. Immediate order `+0x9b=0`; queued slot 0 holds valid order Q and slots 1–7 are zero. Q has model 19, cancellation flag bit 0 clear, references 1, and associated object `+4=0`; the order pool active count is at least 1. No alias in this setup overlaps P with an order or target record.

The target branch is included: P's nonzero `+0x89` resolves to a distinct valid target T through the original object table, T has deletion bit `+0x0c & 1` clear and class nonzero, T's `+0x10` has `0x100000` set, and byte `+0x31=1`. A zero `+0x89` is the bounded alternative that skips this target mutation. These are supplied conditions, not a claim that a captured campaign person has every one of these fields.

## Complete executed closure

1. `00436ca0(P)` resets cursor `+0xa6=0`, finds queued slot 0, and calls `004364d0(P,0)`. It later sees all other slots and the immediate slot empty.
2. `004364d0` calls `004da1d0(P)`. This predicate has no writes and no callees. State 10, substate 1, the uncancelled current order 19, and immediate order 0 make it return true.
3. The valid `+0x89` target causes `0051ff40(T)`. This leaf clears only T's `+0x10` bit `0x100000` and decrements nonzero T byte `+0x31` from 1 to 0. It neither frees T nor touches P's assignment. No recursive target cleanup is reached.
4. Q is neither model 7 nor model 30, so both specialized branches are skipped, including the model-30 RNG branch. Q's references decrement 1 to 0 and the pool active count decrements once. Q's associated object is zero, so `004ef180` is not called.
5. P's queued slot 0 and command status `+0xa7` become zero. `00501be0(P)` is called and returns without mutation because `+0x76 & 0x20` is clear; `004d4f40` is not called.
6. Back in `00436ca0`, P's `+0x0c` clears `0x08000000`, and `+0x10` clears `0x200`. The call returns.

Postcondition: P retains its original identity, class/model/tribe, state 10, substate 1, `+0xaf=3`, `+0x7f`, and `+0x14` flags. The queue and command status are cleared as described. No person destruction, membership-release helper, state-specific exit leaf, allocation, or RNG draw executes. The target reservation is released independently of person membership. The same closure preserves any other supplied assignment byte, including a foreign owner.

## Port implication and next bounded regression

The reviewed exact-current port path is `cancelLiveBuildingAttack` → `syncLivePersonCells` → successful `startLiveCombatResponse` / `createLivePerson`. Cancellation clears an ordinary order and can remove the sole `u.native` alias; registry reconciliation then deletes that object; a later fresh response initializes `computerAssignment=0`. The accepted readiness decision binds these source reads. This original cleanup result resolves the policy question at the cancellation boundary: preserve the existing person ownership; do not interpret cancellation alone as retirement or seed ownership from the raid array.

Prepare a supplied actual-caller continuation with the conditions above guarded before execution, plus retained-owner and foreign-owner controls. Check authoritative assignment and array agreement after cancellation, reconciliation, successful response attachment, and structured-clone/query readback. Keep it separate from PR 309's existing three expected ownership failures. The test may expose owner loss; it is not a campaign witness or proof of a complete native response/allocator/save path.

This packet does not authorize runtime edits. Task `+0x31`, unknown `+0x7f` upper bits, general reassignment/array agreement, fresh owners outside this finite continuation, and legacy-save migration remain the limits recorded in the readiness decision. The shared order cleanup result alone does not resolve those other paths. M1–3 gameplay impact remains unknown.

## Inputs and prior reviewed artifacts

- Original EXE: size 2275840; SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- [Published membership source contract](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md).
- Local readiness decision `issue248-raid-member-readiness-20261010/decision.md`, SHA256 `84f33903fe7bfef1275633f8f9655d7248aa03120a12faf976fcfb421a70e13c`.
- Independent readiness review `issue248-raid-member-readiness-review-20261010.md`, SHA256 `fba26fa140b15e19bc151ae7428231258657b570b8c2dbb59ac5412de616ce81`.

Validation status: static source/hash checks passed; original execution not run; port continuation not run; runtime implementation not made. All five source files are reproduced locally for exact independent review; no executable, raw archive, or serialized world is included.
