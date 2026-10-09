# Mission 3 player Swarm: ordinary05 publication packet

The bounded fresh Mission 3 Vault-to-Swarm episode and all three retained natural PNGs passed independent review. Final standard validation also passed independent review. This is a local publication candidate; source/report review and normal Git publication remain separate. No remote write has been made, and normal Git authentication is unavailable.

Issue #85 concerns cast/control acceptance; issue #61 is the broader visible-effect report. This single episode supplies bounded evidence for both and fully closes neither issue’s full scope.

Game bytes match main `56115714ede56ac0837110d870c87cc10a344727`. The tested commit is `9197b1a6a584fb982ac2932711296ac5df5d1358`; its six changed files are QA scripts, tests and correspondence metadata. There is no production game change.

## Accepted ordinary05 evidence

A fresh profile earned the M3 Vault reward through public controls. One ordinary staging move completed through the existing command-3/native-arrival witness. The predeclared authored Yellow Brave 53 passed fresh eligibility, range, ground-pick and impact-scan checks. Public input and natural callbacks produced:

- Turn 1770: one trusted stocked player cast, stock 1 → 0, projectile 3147. No immediate mana debit was expected or observed for this stocked shot.
- Turn 1779: projectile arrival created controller 3201 with lifetime 200 and no children yet.
- Turn 1780: first controller visit retained lifetime 199 and 60 insects; Brave 53 changed from HP 50 → 45, state 19 → panic state 26, attacker 0. Expected pre-turn eligibility and actual after-turn response were uncontested in the retained evidence; this is not a leaf damage trace.
- Turns 1793, 1797 and 1800: three actual renderer frames, each with 60 visible insect sprites, retained as the unchanged PNGs in this packet. Independent pixel review accepted all three.
- Cue `0xa4` was observed at turn 1779. Audible output and the mixer were not tested.
- Public Pause at turn 1827 stopped the episode with controller lifetime 152 and 60 insects remaining. Callback restoration and normal cleanup were verified; observer and cleanup error arrays were empty.

These PNGs capture the game canvas from actual natural render calls, not the surrounding browser or desktop. The harness reported software WebGL fallback/deprecation warnings, GPU-stall/readPixels warnings and Three.js texture-update warnings about missing image data. Those known warnings are retained in the original receipt. This evidence makes no hardware-renderer or GPU timing-equivalence claim.

The raw report still says `observed-pending-pixel-review`; it has not been rewritten. This packet records the subsequent independent acceptance separately.

## Standard validation status

The exact source-bound aggregate passed independent review: **1585/1585 maintained tests across 267 files**, **28/28 supplemental QA tests**, and passing typecheck, parity, orchestration and build stages. It combines six terminal stages carried from the same unchanged QA source with nine fresh stages.

Aggregate reference: `swarm-9197b1a-final-02/aggregate.json`, SHA-256 `b648277f7ae593f80167a16cac6daa4f86aee62ca50162aeae6d7878dc6d2ca4`. Its original pre-review status remains unchanged; independent acceptance is recorded here separately. Independent verdict SHA-256: `d83368be2ce0f3d027ca91e713acca80ed3b734c7c7bd0453e5133743f9c19b3`.

Final01's shard05 remains failed and uncredited: exit 124 at 2026-10-09 05:45:22.869 UTC after 150.066 seconds, with a raw summary of 100 passes, 0 assertion failures and 9 cancellations. Receipt reference: `swarm-9197b1a-final-01/tests-05.json`, SHA-256 `d33ddf6ad44a6b12594748df87083b14be3a2418e9695b033021987a5c06a3d4`. Required coverage came from the successful continuation; the failed shard receives no coverage credit.

Recorded durations are 731.081 seconds of successful commands; 387.659 seconds of fresh continuation commands over a 425.406-second span; and 1337.802 seconds across all attempts. These are accounting figures, with no speed or performance-improvement claim.

Separate accepted preflight limits remain: the shared input helper retains an inherited Oxlint `Error(...)` construction finding and existing warnings, plus one new serialized `deadlineAt` shadow-name warning independently accepted as nonblocking. Its entire file is not formatting-clean. Scoped checks do not establish global lint or formatting success. The accepted ordinary05 result and natural PNG reviews are unchanged. Raw receipts are not included in this packet.

## Retained failed attempts

1. **01 / 6044f446:** failed before casting. The body-owned pixel picked terrain whose expected scan already excluded unchanged target 53 at paused turn 1466. Final turn 1493 also failed range (7344 distance versus 5784 range). Earlier caster movement and the ground-pick mismatch are distinct retained facts.
2. **02 / 42f20635:** failed before staging command dispatch or casting. All 8281 strict ground candidates were rejected: 925 object hits, 1492 absent terrain picks and 5864 precision failures. The nearest point was 2.813084509 units from the planned target. The missing inner deadline admission was repaired later; no cancellation is claimed.
3. **03 / 3ac18234:** cast 1698, arrival 1707, first response 1708 succeeded; zero frames were retained and the combined 240-turn wait expired. Source review found the QA observer required the wrong parent (`objects` instead of the actual `ground`). The later guard repair gives no retrospective pixel credit.
4. **04 / 5f1a9ad5:** failed before casting. Nearest candidate 2665 was eligible at turn 1716, then moved outside the fixed impact scan by final preflight 1787. Target 53 was also eligible in the retained candidate array. The scan gate stopped input; the render repair was not exercised.

All four failures retain their original status, exact boundary and report/harness/outer receipt SHA-256 values in `summary.json`. Normal cleanup was independently accepted for each. Raw receipts are intentionally not included.

## Scope and contents

This witnesses one current-source player cast, stocked payment, projectile/controller progression, visible insects and an eligible enemy response. It does not establish original-executable/native equivalence, original AI Swarm behavior, audible playback, full lifetime/expiry, checkpoint reload or full campaign acceptance, and does not close all of issue 61.

The packet contains this README, `summary.json` and three unchanged natural PNGs only. The JSON records exact source and evidence hashes, frame metadata, all five attempt outcomes and independently accepted standard validation with its preserved failed attempt and preflight limits. No raw profile, archive, credential, receipt or standalone original asset is included.
