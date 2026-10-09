# Early raids retain their loaded staging origin

[PR #285](https://github.com/JohnDeved/populous-new-dawn/pull/285) corrects Mission 1–3 type-20 raid staging when no construction base has been established. The caller now uses the authored, loaded Shaman cell owned by that campaign tribe. Moving, losing or removing the live Shaman, or changing defense position, no longer substitutes a different staging origin. A present construction base, including cell zero, still wins. Later-mission fallback and Mission 3 recruitment retain their existing behavior.

Source, focused results, the five existing model regressions and the final fixture correction have independent acceptance. Final quality attribution and standard-continuation admission are accepted. All 16 standard stages and the final product have independent acceptance. **Merge and provider outcomes are pending.** This draft makes no completed delivery claim. Exact receipts, source identities and verdict hashes are indexed in [receipt-index.json](receipt-index.json).

The final product is `27c3fb261b445c642b06e53721f19b6581e72826`, tree `35e6ceddebaba1185898a1999c79a2da372f8999`, against main `47680b8fd124aab50b0528eea77a81cacb556060`. Its application bytes and all earlier focused/model inputs match accepted `7bc41bd09c4f65e5c1a70677af61aa4625a3897d`; only the two-line marker-three fixture precondition described below was added afterward.

## Original source and checkpoint ownership

The [published source packet](https://github.com/JohnDeved/populous-new-dawn/blob/ef5d26329ac0f6b011746d556afdf655d6563013/decomp/research/issue256-stored-fallback-20261009/findings.md) binds ten bounded disassembly ranges and 32 existing source files. The canonical executable was hash-verified and read only as data with GNU objdump 2.44. It was never run for this work.

In the named original reset/load chain, `00461d70` clears tribe word `+0x5a2`; the authored loader calls `00485b00`, whose class-1/model-7 branch writes the loaded person's even coordinate cell at `00485b9a`. `004f6020` reads that stored cell when base-established `+0x5b4` is unset, otherwise the established base at `+0x36a`. It does not read current defense or live-Shaman position.

The supported computer tribes each have exactly one authored Shaman: Mission 1 Red cell `0x1c08`, Mission 2 Matak `0x8062`, and Mission 3 Chumara `0x60da`. The port's existing mission/tribe-owned `campaignPosition` reproduces those cells. Modern cloned checkpoints and supported legacy single-AI migration preserve the required mission and tribe ownership, so no new mutable state or save field is introduced. Duplicate/missing authored records, failed native allocation, arbitrary malformed Worlds, all original reset/copy writers and original binary saves are outside this contract.

## Failure-first and focused results

The new actual-caller assertions ran against unchanged prior-main application code with a test-only diff: **37 cases ran, 13 passed and 24 failed**. Every failure was the intended staging comparison after the real dispatcher/controller call. The first Mission 2 mismatch was defense cell `0x8232` versus loaded cell `0x8062`. The fixture covers moved/dead/missing live Shamans, defense enabled/disabled, modern clones and actual legacy ownership migration.

The first implementation run remains **failed**: its 39 staging cases and 14 settlement/state-33 cases passed, but an existing Mission 3 recruitment observer still expected the old defense-derived staging. The reviewed one-expression adapter correction uses its retained `fixture.shamanCell` for absent-base staging. Existing native recruitment comparisons, selection base/radius, whole-world mutation checks and established-base controls remain intact; historical native results were not regenerated.

The corrected exact `7bc41bd` run passed **61/61** cases. It covers the 39 actual-caller controls plus loaded-cell/recruitment, state-33 release and phase-6 settlement regressions. The maintained caller deliberately stops before order attachment/pathing; its passing RNG, order-pool, phase and action assertions apply at that boundary. Two Mission 5 controls preserve the old later-mission branches.

Separately, **3/3 Mission 2** and **2/2 Mission 3** existing model tests passed on the same source. They cover natural raid progression/recruitment and checkpoint ownership. These preserve existing routes; they do not establish a distinct-coordinate absent-base ordinary episode.

## Standard failure and the supplied marker fixture

The first full standard attempt's tests-03 shard remains **failed, 282/283**. The marker-three Mission 1 case failed its original phase-11 wait at line 1008. Its supplied setup had relocated every Red non-Shaman near staging `0xfa12` and changed defense position there, while leaving construction base absent. The corrected runtime consequently used loaded origin `0x1c08`.

Both bounded diagnostics retained the exact setup and budgets:

- Diagnostic01 reached turn 445 with a cleared/reused task slot in phase 5 and an empty current member list. That snapshot alone did not identify the original cohort or prove a phase-6 stall or death.
- Diagnostic02 retained the original cohort 35/33/34. At the first phase-6 observation, turn 207, those living registered people shared command 3, ID 4, reference count 3, toward `(0x0880, 0x1c80)`, the center of loaded cell `0x1c08`. At turn 445 the original Units remained alive and registered; the task slot had been reused. This demonstrates the changed staging input without inferring why every later movement transition occurred.

The accepted final fixture adds only an explanatory established-relocated-base comment and `w.ai.constructionBase = staging` before the existing defense assignment. This selects the original established-base precedence branch, as the neighboring building-attack fixture already does. Every subsequent phase, attack-19, combat-person, shared-reference, damage, retirement and slot-reuse assertion, and every time budget, is unchanged. The complete named case passed **1/1** on exact final `27c3fb2`; the full standard continuation also passed. No partial pass from failed tests-03 is claimed as a completed shard.

## Quality and standard validation

On final `27c3fb2`, changed-application Oxfmt, four-file ESLint, structural checks and **7/7 context checks** passed. Strict Oxlint remains **failed with 73 inherited diagnostics: 16 errors and 57 warnings**. Independent review verified exact diagnostic multiplicities against the earlier accepted attribution and unchanged runtime bytes. This is an attributed failure, not a clean lint claim.

The reviewed continuation carries only passed typecheck and tests01 **170/170** plus tests02 **165/165** from unchanged `7bc41bd` inputs. The two-line final fixture belongs exclusively to tests03. All tests03 and previously unrun stages ran on final `27c3fb2`; no partial failed-shard credit is carried. Admission verified the same dependency/tool/configuration identity and all 272 maintained test files exactly once: 66 carried, 206 fresh, across three carried and 13 fresh stages. The final aggregate reports **1607/1607 tests**, with zero failures, cancellations, skips or todos: 335 carried from `7bc41bd` and 1272 freshly run on `27c3fb2`. Typecheck, all test shards, parity, orchestration and build passed. Build finished at 13:30:40.343 UTC. Aggregate SHA-256 is `35286e6ce721bcc851f0aabc401358ae4d681f7fb58273ef62f4bfc346af61de`; independent final product verdict SHA-256 is `fca6c53134e52b0955c402646283ff5609e4a180c532964ca067199675ba181e`. The original raw aggregate keeps its pending-review wording, and the final top-level summaries exclude nested child-test summaries.

## Limits and packet contents

[Issue #256](https://github.com/JohnDeved/populous-new-dawn/issues/256) remains open for the missing distinguishing ordinary history. The existing Mission 2/3 model routes establish a base before their retained raid observations; Mission 1 initially has equal defense and loaded coordinates. Neither those routes nor the explicitly relocated marker fixture prove the new absent-base branch through ordinary browser controls.

This packet contains only this report and its compact receipt/verdict index. It publishes no raw archive, profile, original executable or screenshots. It adds no original execution, rendered visual parity, original binary-save compatibility, universal reset ownership, whole-mission acceptance or performance claim. Merge and provider outcomes remain pending; they will be added only when verified.
