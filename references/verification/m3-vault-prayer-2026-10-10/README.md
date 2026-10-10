# Mission 3 automatic Vault prayer panel

PR [#310](https://github.com/JohnDeved/populous-new-dawn/pull/310), refs [#72](https://github.com/JohnDeved/populous-new-dawn/issues/72). This is a bounded slice; #72 remains open. Product PR310 merged2026-10-10T10:22:32Z as `35de8e6ca6864a98aff3bca0f263e87eee7fa65c`; its GitHub tree exactly matches the tested tree. [Integration readback](integration-readback.json) records provider status as in_progress at10:23:29Z; a later authoritative check response verified success for check 114191849429 at 10:23:30Z, version `86776fd2-a982-4c88-8aee-9845b0bdab06`. The [provider build dashboard](https://dash.cloudflare.com/19321bcee0ed17a93b709cb602dd070c/workers/services/view/populous-new-dawn/production/builds/d90bca2e-ad32-43ee-a53c-d17ee0a512ea) requires project-account access. That completed response establishes success; the later optional saved-response collection remained empty and is not represented as a verified raw receipt.

Source: `79618d3323a6062dd2b7fc1c4e37e8055d2f86a0`, base `4754e12d3590bde18656416514871b033de164be`.

The original Mission 3 Shaman's ordinary command33 now requests the existing prayer/progress panel before the Vault sampler replaces its cached local-player count. The controlled caller test sees old 0/work 0 at turn 536 and rejects opening; at turn 540 it sees old 1/work 1, creates phase−1 with hold 16, then the sampler advances work to 2. Cancellation expires the automatic panel and reissue recreates it. The authored finite-trigger retirement uses the existing combined Shrine active-state adapter.

## Verification

| Evidence | Result |
| --- | --- |
| Failure-first caller,189d394d | Expected FAILED: missing first0→1 request; original approach/work test passed |
| Initial consumer attempt,158ff2ed | FAILED:1 capacity-fixture setup error; retained, repaired without weakening assertions |
| Corrected caller,55948aa6 | PASSED11/11, including ordinary open/cancel/reissue/reward and supporting capacity/identity/load cases |
| Existing shared Camp/Temple callers,55948aa6 | PASSED53/53 |
| Independent source review | ACCEPTED product and reviewed QA carry into79618d33 |
| Fresh full standard profile,79618d33 | PASSED17/17 stages;1864/1864 tests across all300 standard files once; fresh typecheck, parity, orchestration and build |
| Scoped formatting | PASSED |
| Scoped ESLint / Oxlint | FAILED208 /287 inherited diagnostics; exact baseline attribution found no new identities |
| Ordinary rendered browser | PASSED and independently ACCEPTED, all4 images inspected, unchanged 79618d33 |

The standard run finished2026-10-10T10:16:48.660Z. Build retained nonfatal proxy/npm, plugin-timing, large-chunk and route-classification warnings. The failed Oxlint stdin attempt is retained as a tool failure; the detached exact-base comparison supplies the valid attribution.

[Standard aggregate](standard-aggregate.json), [independent source, standard and rendered-result review](source-and-standard-review.txt), and [hash-bound verification summaries](verification.json) identify exact inputs, source, statuses and retained raw receipts. These summaries do not replace the retained raw logs. All product/caller bytes remain unchanged from 55948aa6; the final candidate adds reviewed QA only. No original bytes, browser profiles, or raw large archive are included.

## Scope and limits

The implementation preserves work/reward/RNG algorithms, reuses the existing binding/painter/lifetime, admits automatic owners through the existing32-record/160-secondary count adapter, latches only successful creation/reuse, and reads post-sample activity on every elapsed phase1 visit. Loaded/replaced/disposed Scene ownership is transient. enabled=false alone does not hide a panel.

Retained original static evidence is in [worship-panel-auto-producer.md](../../../decomp/research/worship-panel-auto-producer.md) and generated004fb270,00509290,005092e0,00504060,00504920. Earlier original comparators intercepted requests; no composed original execution is claimed. The extra second-body/invalid-owner cases are explicitly supplied supporting coverage, separate from the ordinary Mission 3 route.

Native mixed-class scheduling, physical allocator equivalence, exact Vault building socket anchors, clickable Vault glyphs, sinking, generic trigger retirement, original raster/audio fidelity and hardware performance remain separate. Nonzero model and active are documented browser body/trigger adapters. No art, geometry, imported asset or parity-ledger change.

## Ordinary lifecycle images

The sandboxed headless Chrome 154.0.8037.92 run used a 1440×1000 viewport and the existing 1× clock. It created automatic records at turns 736 and 852, accepted trusted ground interruption at 776 with work 12, expired the first record at 781, earned use at 1330, unlocked Temple knowledge at 1412 and released the original Shaman task/order at 1425. The observer closed at 1449. The observer recorded no errors/overflow; owned-profile cleanup and continuation checks passed. These are lifecycle views of the same source, not a before/after implementation pair.

[Browser summary and screenshot hashes](ordinary-browser.json) preserve source, launch, raw-report hashes and before/after observations. Screenshot time is bracketed because the game continued while capture ran. Software WebGL, ReadPixels-stall and missing-image update warnings remain explicit; this is no hardware-performance result.

Automatic prayer is visible without inspection, hover or focus. Capture interval745–761, followers 1, work 4–8/100; record 1 is automatic, phase1, hold 16.

![Automatic prayer panel](vault-first-automatic-panel.png)

The ground command interrupts prayer; the panel/latch/reservation have expired. Capture interval789–807, followers 0, work 9→5/100.

![Interrupted prayer panel expired](vault-interrupted-panel-expired.png)

Ordinary reissue recreates the panel with a new record/DOM identity. Capture interval859–875, followers 1, work 3–7/100; record 3 is automatic.

![Recreated automatic prayer panel](vault-recreated-automatic-panel.png)

The Temple reward is earned and the original Shaman has departed. Capture interval1431–1448; the final observer closes at 1449 with uses 1, unlockedTemple=true and no panel, latch or reservation.

![Earned Temple knowledge and departure](vault-earned-knowledge-and-departure.png)

The command reporter produced an empty parityMeasurements list: the local-render scenario name is outside its current discovery convention. No computed parity credit or ledger change is claimed. Final independent product, ordinary-result and merge-scope review ACCEPTED. The retained raw summary names1449 as departureTurn, but that is observer closure;1425 is the actual task/order-release event. Raw reports were not rewritten.
