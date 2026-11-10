# Startup replacement allocation and first person visit

Issue 29; bounded research only. Source HEAD `c65752d0ae41cfb039c0e6f09b7ac22f56cdf35d`, clean tracked checkout before and after. No product patch, fixture recording, parity claim, full original game, installer, OS bridge, or network bridge.

## Observed result

One original CPU-only run completed, exit 0, with no replaced function bodies, return values, or leaves. The run stopped at the end of the turn18 primary pass, after the first converted Brave's complete person visit and seven further Wildman visits.

- The selected original reset instruction range `0042bfe7..0042bffe`, with EBX=0, changed the twelve class seed bytes from sentinel 173 to zero. This is not execution of the whole reset or level loader.
- Eight genuine `004ed8a0(1,1,255,position)` allocations produced Wildman counters 0 through 7 and advanced the class-1 byte at `0096eac2` to 8. The fixture uses the eight previously approved geometry records, with Wildmen replacing the prior Brave model and no building.
- Original `004ed8a0(7,8,0,point)` created the startup wave at `(11264,40192,400)`; original `0050c820` enabled conversion. This fixture explicitly creates the wave instead of executing Shaman command18. The command's real primary allocator call is independently retained in `decomp/generated/00433a10.c`.
- On fixture turn 17, original wave `0050c840` called `004d7fd0` (return address `0050cac3`) for Wildman ID1832. The converter's real allocator call (return address `004d8038`) produced Brave ID1541, state10, counter8; the class-1 seed became9.
- At the end of the turn17 primary pass the Brave still had counter8. There is no `004d32b0` visit for this ID anywhere on or before its allocation turn.
- On turn18 the original primary loop incremented the Brave to9 before its first actual `004d32b0` visit. The whole visit ran and changed state10 to19; its counter remained9.

`summary.json` is a compact derivation; `attempt01/result.json` retains full allocation events, all observed person visits, full turn snapshots, source/input hashes, tool identity, and the error/leaf-replacement lists. Top-level fixture allocations end at the emulator stop address, so their post-return state is retained in `births`; the nested conversion allocation is observed by the return hook. These are intentionally distinct receipt sources.

## Source composition and browser comparison

The retained native chain is `00433a10 -> 004ed8a0(7,8) -> 0050c840 -> 004d7fd0 -> 004ed8a0(1,2)`. The allocator prepends the replacement to the primary list. In `004ec6f0`, `004ec898..004ec8cb` caches each current record's next pointer before incrementing its counter and dispatching it. A new primary record born during this primary traversal therefore waits for the next primary pass. The run above observes that precise conditional case, not a manually incremented child.

Current browser `app/world-turn.ts` calls `stepLevelStarts(w)` before its ordinary `for (const u of w.units)` loop. `convertStartingWildman` in `app/level-start-runtime.ts` replaces the array slot and creates/registers its new owner immediately. The reviewed ordinary browser observation separately saw those owners constructed with world-turn-minus-one counters and visited by resting on their creation turns17/20/21; their resting writes were equivalent to ordinary +1. Together with this conditional native witness, this identifies startup allocation ownership and birth-turn scheduling as relevant repair boundaries. It does not establish exact Mission3 replacement counters, an accepted product repair, or a universal doorway rule.

Existing `scripts/check-native-level-start.py` replaces allocation/removal/sound in its conversion test and writes person counters in the Shaman phase test. Its independent outer-loop probe supplies object processors. Those tests do not prove the complete conversion allocation/first-visit composition measured here.

## Execution boundary and supplied inputs

The same isolated CPU support as the reviewed tight-native fixture loads the verified constants, search data, animation counts, object shapes, flat height400 terrain, zeroed pools and tribe fields, fixed gameplay/cosmetic RNG inputs, and an empty conversion-notification buffer at `02080000`. The original pool setup, Wildman model/state initialization, wave allocation/initialization, movement, conversion, removal, animation/person state processing, and selected outer-loop segments execute unchanged. The explicit animation-clock input is `00897981 = fixture turn`; complete original outer/render timing is excluded.

Per turn, the driver executes these original segments:

1. Header/formation segment `004ec701..004ec7f1`.
2. Primary objects `004ec898..004ec8cb`.
3. Secondary objects and tribe rebuild `004ec924..004ec947`.
4. Deferred free `004ec94c..004ec98d`.
5. Original queued-terrain consumer `0044df40` and failed-route aging `004ec390`.

It asserts empty fight and guard-control lists. It does not execute intervening fight/encounter or guard-control passes, `004ef7f0/004f0460`, the sunlight call between `004ec947` and `004ec94c`, or the late full-world/UI/save/audio/render phases after `004ec98d`. At turn18 the stopping condition is reached after the primary pass, before secondary/end-turn work. These exclusions prevent a whole-frame or whole-game equivalence claim. Hooks observe functions, returns and blocks, and abort invalid memory, interrupts, execution outside original text, or instruction/time caps. No stop/replacement hook supplies a decisive result.

## Exact unresolved Mission3 boundary

The hash-verified original Mission3 level is available: `levels/levl2003.dat`, SHA256 `eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf`. Its imported object inventory contains 52 direct class1 records:44 Wildmen, six Chumara Braves, and two Shamans. It also contains a Blue class2/model1 hut, neutral class2/model18 object, scenery, triggers and one linked effect. **52 is a direct-record count, not a proved complete pre-wave person seed.** The fixture's measured seed8 must never be substituted for that missing history.

Missing evidence is an ordered original class1 allocation ledger through the actual Mission3 pre-wave initialization and the selected conversion events, with callback origins and first scheduled visits. No external file is currently shown missing. Relevant retained owners are:

- `00484a10`'s eligible authored-record allocation branch and each reachable model initializer/postprocessor, including the hut's initializer;
- post-load `004851e0` trigger links, `004866a0`, and `004edf50` linked deactivation, plus any reachable effect producers;
- `0042b230`'s post-load tribe/startup callbacks and command18 setup;
- actual mission turn-zero script state, both tribes' startup waves, and any person-producing hut/script/system callbacks before the selected Wildmen convert.

The smallest next proof is a source-bounded Mission3 allocation ledger: recover the above reachable callbacks' person-allocation effects and prove absent branches with actual level/script fields, rather than running a full original battle or assigning count52. Only then compose the actual relevant startup pass history and map original Wildman records to browser replacement owners. Current research deliberately stops here. No arbitrary class seed, counter offset, manually scheduled first visit, or product patch is justified by this run.

## Command and fingerprints

Command (run once):

`work/orchestration/training-native-20261010/native/venv/bin/python -B work/orchestration/training-native-20261010/startup-person-phase/driver.py attempt01`

- Result: passed conditional first-converted-person witness; exit0; stderr empty.
- Driver SHA256: `c6eb874010450dac62ca31c19ff5f4223c053a75a0fa13b2923f5179a0309efc`.
- Original executable SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Exact20 source/input hashes and Python/Unicorn/Capstone/platform versions: `attempt01/result.json`.
- Pre/post source state: `preflight.json`, `postflight.json`.
- Frozen driver copy: `attempt01/driver.py`; byte-identical to root driver.
- Not run: all-eight conversion completion, actual Mission3 loader/startup composition, browser rerun, product checks/build, fixture/parity recording.

Independent read-only reviewer verified the20 hashes and the raw result; final acceptance remains with the parent/reviewer handoff. This note does not replace their review.

## Publication review

Independent raw/source review accepts the finite conditional observation only. It rejects an ordinary Mission 3 seed inference or a safe product repair from this evidence alone. Raw record snapshots verify that the Brave remained primary and was not in the secondary list. The stop boundary is the end of turn18 primary traversal, including seven subsequent Wildman visits; the earlier local wording “immediately after” was corrected here. No raw execution artifacts changed.

`native-observation.tar.gz` retains the complete result, initial snapshots, exact driver, source observations and execution receipts without executable/assets. The published manifest hashes each raw archive member. The report is separate from that archive.
