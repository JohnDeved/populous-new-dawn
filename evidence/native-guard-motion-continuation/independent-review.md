# Independent review: native Guard movement and animation continuation

Verdict: **ACCEPT**, solely for the frozen, four-case synthetic flat-world native witness. No blockers found. This accepts neither PR220's implementation nor full Guard parity. It does not authorize implementation or expand gameplay acceptance.

## Reproduction and evidence identity

The reviewer executed the exact frozen `native-guard-motion-followup/probe-motion.py` against the original input paths, using the restored Python/Unicorn environment, on CPU4, under a 60-second command timeout. Output was redirected exclusively into this sibling directory. The probe was not copied, edited, or repointed to altered inputs. It only prints the report; its inspected code and imported prefix do not write host files. `PYTHONDONTWRITEBYTECODE=1` prevented import cache writes.

- Replay exit: 0. Raw output: `reviewer-result.json`; raw stderr: `reviewer-result.stderr` (empty).
- Replay is byte-for-byte identical to frozen `result-03.json`: 11,742,671 bytes, SHA256 `13ca18e32601f551ae911ae19d9717725950b18124389666aadd3d0de42759d5`. No path normalization or other exceptions were needed.
- Frozen probe SHA256: `c15642c46d8cf593527be3c1fd98d3a396b9f2de49b3397de107b5e5ee059be1`.
- Frozen manifest SHA256: `52b6f17dd948ad7ae70f90f1b1b9f28510d3bf601c63fabe00e2a328616f28af`.
- All 59 packet/input/source identity checks passed before replay, including the pinned manifest. `preflight.json` retains each expected/actual digest and clean source heads. `preservation.json` repeats those checks after review.
- Original EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`; Python 3.12.14, Unicorn 2.1.4, Capstone 5.0.7. `independent-audit.stdout.json` additionally fingerprints the Python executable, emulator/disassembler modules and native shared libraries, and the loader's implicit `decomp/tools.json` and `decomp/exports.json` inputs.

I inspected `verify-result.py` before execution. Despite its general audit role it has no file-writing calls: it reads JSON and prints a summary. I supplied the reviewer result as its positional argument and redirected stdout/stderr here. Exit 0; stderr empty. Its output also exactly matches frozen `verified-summary.json`.

`independent-audit.py` is a separate reviewer check, not a modified native probe. It verifies all retained assembly rows against the original mapped executable and independently decodes their instructions; validates cited Ghidra exports against the existing index; tests call operands and jump-table entries; checks producer construction, visit continuity, preparation/ground/physics/route/tail/stamp order, native animation phase equations from shipped frame counts, actual displacement, route state, and both settling tails. Exit 0, empty stderr. Raw output and complete assertions are retained here.

## Caller order and supplied boundaries

The executed allocated-person loop is the actual `004ec898..004ec8cb` segment. It loads the list, increments the follower's class counter, and invokes `004ed700`. The class-1 jump table selects `004d32b0`, whose unconditional native calls are preparation `004d42a0`, reaction `0051fed0`, ground/water check `004e9050`, then full physics `004e6d00`. Reaction is established by the unconditional original instruction bytes, not by a separate named observer event. All other named stages have measured entry/return observations in the expected order.

Full physics calls route advance `004eadc0` at `004e786e` before returning. State10 then calls `00432590` at `004d351a`; command30 calls Guard `0043daa0` at `00432a17`. The health, combat, and three named common-tail bodies return normally on all 96 visits. Class dispatch stamps person+18 after the full processor returns. The separately invoked native animation list `004ee770` calls `004ee7b0` after that stamp. All 96 phase transitions match the shipped frame-count projection and native mode-2 descriptor, and animation changes only the observed phase fields.

The original outer draw/timer/scheduler loop is not executed. The indexed sources show `draw_main` calling `main_loop_outer` and later invoking the animation list behind its render gate. The probe supplies the global turn and sprite counters once per visit and schedules one animation-list invocation after each person invocation. Therefore elapsed timing, render gating, catch-up behavior, other world phases, and arbitrary original schedules remain outside this proof.

The baseline prefix is read up to its report construction, so its old lifecycle scenarios and their manual phase changes are not executed. Its code hook is removed before compilation; the new hook clears the inherited leaf map. Consequently the old destination-planning stub is not present. Only acknowledgement `00436330`, selection refresh `0047a550`, and audio `0048a050` can be supplied. Exactly two supplied events occur, both in the command3 input producer: acknowledgement and selection refresh. Audio is never reached. No supplied leaf runs during the 96 person or 96 animation visits. Allocation/free-list boundary hooks would abort, not return invented success, and no such abort occurs.

## Fixture initialization and Guard acquisition

The fixture remains explicit and limited: synthetic Firewarrior id1/model6/physics17 at (4096,4096), stationary Shaman id73/model7 at x+600 or x+1800, both life/maxLife1000; only the follower is scheduled. Identity slots and record addresses stay stable. Native `004ee470` inserts both records into genuine cell lists. The land is zero-height/category0, whose native category flag is 1, tile flags zero, all-walkable mask, no buildings or combat targets. The Shaman still exists as a collision record. Initial state19/source48/draw18 and phase (1,3), selection, animation gating, goals, destinations, and turning point are supplied. This is not original allocation history or campaign acquisition.

The loader maps the hash-verified PE32 image without launching Windows. Constants are decoded from the shipped constant file and applied through native descriptors, checked against imported constants. Frame counts are projected from shipped VSTART/VFRA links. MWSEARCH.DAT is hash-pinned and loaded at `008929cd`; genuine startup `0042c210` generates the resting geometry before the pristine memory snapshot. The observed default resting table pointer is `00895f4d`. The established resting checker corroborates this initialization path, but its broader native/port comparisons were not run for this review.

Each case restores all mapped memory from that snapshot, resets explicit route/order/person/world fields, and inserts the objects. CPU registers are not independently zeroed between cases; they retain ordinary native call-return state in the exact replayed sequence. No fixture-independence beyond that sequence is claimed. `levelFlags2=0x50000` suppresses formation/footprint world effects, as disclosed.

Guard is genuinely queued by `00443b40(0,1)`, with command30, target73, one reference, and deferred flag16. The next native preparation adopts state10/status30, increments Guard ownership, and configures the target. The first Guard callback runs its actual recovery/destination-planning path despite initial proximity. No later speed, phase, or planner result is forced. The movement control invokes real `00444f60` with action0x57/model3 and packed cell0x1012; the resulting command's goal is (4736,4224). These are native input-function entry tests, not keyboard/UI/whole-game acquisition tests.

## Supported motion conclusions

- Near Guard clears pursuit at visit4 after physics has already displaced the follower. The following visit moves (+61,+17), retaining speed61, route1, state10/status30/source40. Route1 is gone at visit11, while nonzero displacement continues through visit24. The callback's observed snapshot changes are only flags2/pursuit; original near-branch instructions contain the bit clear and return, with no stop, route-release, or animation setter.
- Far Guard retains pursuit at visit4 and clears at visit20 after entering the near square. Visit21 moves (+63,+8), still speed61/route1/source40. Nothing here proves a universal eventual outcome beyond visit24.
- Target loss is explicitly injected by setting the target-dead bit before visit5. Visit5 first moves (+61,+17), then completes the Guard order and enters state17. Visit10 is state19/source48 but speed65 and still moving. Visit11 selects the real resting slot and resumes source40. Visit13 reaches (4864,4352), speed0/route0/state19/source48, then position remains fixed through visit24.
- Command3 first reaches the corresponding settled state at visit12 and remains fixed through visit24.
- The settling visit itself has nonzero displacement, including the final snap. Zero displacement is established on subsequent visits. The settled target-loss/control records retain velocity components (+57,0,+18)/(+65,0,+20). Neither source48 alone nor stale velocity bytes establish physical rest. The reviewed evidence uses position deltas, speed, route, and the actual resting consumer together.

The state19 resting substate3 branch in `004d73e0` performs the position insertion, writes speed0 at `004d7743`, and invokes `004d3ff0` at `004d7765`, reaching the measured upper/source setters. This supplies a real stopping consumer and closes the previously missing-table boundary without faking a leaf.

## Failed fixtures and port comparison

The retained failed attempt and result02 are correctly excluded from authoritative proof. Result02's target-loss case aborts at `004d52d6` on address00000004, consistent with the uninitialized resting-table pointer. Its movement packet also encodes coordinates where packed cells were expected, and it has shorter continuation windows. The frozen final probe adds native startup/MWSEARCH initialization, corrects that packet, extends all cases to 24 visits, and adds clearer route/fixture reporting. All old files remain intact.

The six cited TypeScript files match frozen PR220 source head `c20a297f5f815ce404f796b08f77ea56396f96da`. I read the actual relevant callers. `world-turn` routes active/pending Guard to `stepLiveMovement`; its applicable branch calls physics, then route, then the order queue. The generic physics path callback is intentionally empty because the outer movement composition advances routes. `stepShamanGuard` matches the bounded native first-entry, four-counter, signed-coordinate near, and replan structure; its near branch clears pursuit without stopping movement or selecting a resting source. The logical animation adapter stamps and advances after a logical turn.

This source mapping establishes correspondence only. Competing controllers, route exact-goal cleanup, complete target-loss/resting trajectories, native/browser coordinate adaptation, formation/collision behavior, and original wall-clock/render scheduling are not compared at runtime. No production defect is established, and no inferred proximity stop, default resting frame, broad movement rewrite, or PR220 acceptance expansion is justified.

## Checks and preservation

Read the applicable AGENTS.md, repository engineering skill, GOAL.md, engineering protocol, and native-research guidance. Integration head at review start: `3b899125cc8cedef938823718ad5d44f49957b66`; source candidate head as above; both clean. Read-only Git queries used `--no-optional-locks`. Review writes are confined to this sibling directory. Frozen packet/input/source hashes were rechecked after work.

Native replay, supplied verifier, independent audit, and preservation checks: passed. TypeScript format/lint/check/build: not applicable to this evidence-only review, with no maintained TypeScript edits; no new implementation quality claim is made. Browser/performance/full-game/port trajectory tests: not run and not claimed. No installs, dependency jobs, browser sessions, Ghidra project work, application edits, index/ref changes, or child agents were used. Native work and follow-up inspection ran on CPU4 with per-command timeout60s.
