# Independent review: fresh Missions 1–3 class1 callback audit

**ACCEPT the bounded source/data audit at `a09eba7f5afdd420367eb5cecdb3eff860e0532b`. No blocking defect found in its stated conditional result. This does not accept an executed fresh load or a shared-phase implementation.**

Reviewed against accepted base `e3a7a06a4250457502288d5b4c4e4ad8f3b40b53`. The exact diff adds only the seven audit files. The audited worktree was clean before and after review. Manifest SHA256 `148cd06d43472fbbbacb4b9b3120d80ee3e646450300e36634e5eac3f5900155` and canonical EXE SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` match the assignment.

## Verified result

- Independently parsed all 2,000 records of each canonical DAT and its HDR. All 44/81/109 nonzero numeric `(index,class,model,owner)` tuples match the application arrays. All retained people, buildings, skips, effects, rewards, head links, co-located scenery, reverse head order and header fields match. Direct class1 counts are **12/27/52**.
- The original filter at `00484f02..00484f08` performs `MOVSX` on owner, then signed `JGE` against the zero-extended tribe count. Owner255 is -1. Shaman owner remapping is identity in this ordinary fresh path. The six `(record ID, numeric owner, conditional zero-based seed)` tuples are M1 `(35,0,6),(38,1,7)`; M2 `(23,3,16),(58,0,18)`; M3 `(46,0,32),(47,2,33)`.
- All **77** source/reused-evidence/report member hashes, all **12** retained original-range hashes and every retained assembly instruction's bytes match. Independent constant decoding and native narrow-write overlays reproduce all seven scenery descriptors; tree life400/state1 and scenery9/state10 are correct.
- Checked original initializer/state jump-table bytes and selected targets. Class1 models1/2/3/7 select the common initializer, with model1 state8 and models2/3/7 state10. Fresh empty orders do not visit a command. Model7 registers its actual tribe Shaman. The real class7 state initializer at `0050a740` is a single RET, distinct from the later effect processor.
- Building state2 may nest **class6/model9**, whose argument consumption and initializer have no person creation. The scenery low-health edge creates **class5/model17**; fresh full-health trees do not take it. Reward byte2=1 makes the **class6/model10** attempt, allocation owner0 then initializer owner255. The linked-head upgrade is **class2/model18** and its mode3 condition is absent from these files. None of these allocations increments class1 merely by using the primary pool.
- Link targets are only classes6/7. Appearance leaves only change geometry/animation fields; linked state0 initialization does not visit a processor. Class7/model89 is absent from the authored inputs and identified nested producers, so the loader's Convert Wild branch is excluded. The roster rebuild and secondary-effect count do not traverse ordinary people. Final tribe initialization allocates an order and initializes command18; it does not run the opening wave. Later `0050c840 → 004d7fd0` person replacements remain separate admissions.

## Interpretation and remaining gate

The selected game-side dispatches leave **no unresolved person-creator edge identified in this narrowed callback inventory**. Audio/graphics/file imports are not a certified complete closure. Model24 sound may use its separate sound allocator and cosmetic RNG/GetTickCount. That boundary does not contradict the conditional class1 creator result; it prevents a claim about the whole loader, its complete RNG trace, or OS behavior.

**Require one finite composed receipt for each of the three fresh cases before accepting the proposed owner as exact for fresh Missions1–3.** Keep the implementation acceptance gate closed under that intended contract. Source counts are a correct prediction conditional on successful admissions, not observations of those returns. Mixed-class nested allocations, allocator failure/argument cleanup, exact pool state, cell/list/state callbacks and the final ordered command initialization have not yet run together. A failure in that composition could change which class1 records succeed even without an additional creator. This is the concrete remaining gap, not an unknown new allocation algorithm.

The smallest next proof remains the report's fixed three-case sequence: accepted reset to seed0; exactly 2,000 file-order branches with real allocation/initializer/post-processing; real link callbacks and roster/site/order chain; stop before `004ec6f0`. Retain caller/depth/class/model/owner/return, argument stack, every class1 copy/increment and final seeds. Treat 12/27/52 and the six Shaman seeds as assertions only, never fixture writes. Source-review the supplied tables and presentation/import boundaries, preserve admission-affecting callbacks, and freeze per-case resource/instruction limits before any execution grant. Mission2 first does not certify Missions1/3.

Reuse the accepted reset/allocator, creation, three controls and 11-call supplied-context scheduling evidence in `reincarnation-phase5-proof-draft`; none was rerun or promoted to full-load proof. Subsequent shared ownership still needs the accepted phase proposal's replacement provenance, failed-admission/no-refund distinction, newborn deferral, alias handoffs and checkpoint-history acceptance. Angel, Hypnotise, Ghost Army and other excluded histories do not become covered here. Exact later Shaman/world parity remains separate.

## Review artifacts and checks

- `independent-data-checks.json`: exact identities, 77 hash checks, 12 range checks and canonical numeric records.
- `descriptor-and-scope-checks.json`: independent descriptor/header/link geometry verification and exact changed-file scope.
- `additional-source-slices.json` / `.asm`: independently read native jump tables, person next-state bytes and secondary roster/state-setter slices; Capstone5.0.7, disassembly only.
- `git diff --check e3a7a06… a09eba7…`: passed, exit0.
- Python static parsing/hashing: passed, exit0. One reviewer one-liner initially had a syntax error and was corrected before executing any checks; it changed no source or evidence.
- Native/game/application/package/browser tests: **not run**, expressly outside review authorization. Maintained TypeScript quality gates: **not applicable**, no TypeScript change. This source-only review provides no rendered or performance result.

No active PR255/254/246 files, application code or audit artifacts were edited. No runtime/shared resource held.
