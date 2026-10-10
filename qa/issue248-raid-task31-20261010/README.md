# Issue 248: reviewed ATTACK latch contract and stopping boundary

Successful native ATTACK allocation snapshots PopScript attributes 22 and 42 into task+0x31 bits 0 and 1, preserving the upper bits, then clears both attributes. Failed allocation skips that consumption. The [source contract](findings.md), [independent acceptance](source-review.md), [exact byte excerpt](004e638b-task31-tail.asm.txt) and [source provenance](provenance.json) establish this supplied-input operation.

The port already represents the two attributes, but ATTACK does not snapshot or consume them. The [authored-script inventory](script-input-inventory.json) found neither typed attribute field in Mission 1, 2, 3 or 6. Fresh port construction initializes both to zero; native initial-bank values and unknown legacy task values remain unproved. A latch-only implementation has no demonstrated standalone gameplay benefit in these missions.

The five packet files are exact copies of the accepted freeze, with four content hashes in its [artifact manifest](artifact-manifest.json). The copied independent verdict has SHA256 `4632fbf6f5eced4c6ee1fc6b335f7c6555a77e3a4ae5e16c3bcb450467e19f51`. No production code or tests changed, and no new run occurred for this checkpoint.

## Current evidence and stop

The separately [accepted phase3 observation](https://github.com/JohnDeved/populous-new-dawn/blob/00cafa609ffadd3a853f91ca3244ae57b2890ffc/qa/issue248-scheduled-trace-20261010/phase3-result.md) closes the earlier full-cohort input gap: at turn6485 the complete registered same-tribe state14 set is 377, 378, 455 and 540, comprising three Warriors3 and one Preacher4. All four actual port assignments are zero. This observation establishes the admission input, not their later lifetime.

Record205 metadata was not retained at the first dispatch, turn7637. Its model, flags, references, associated object and payload remain unknown. The independently accepted 40-input inventory is bound in the source provenance. This is a first-dispatch historical continuity limit; it does not reopen the later accepted ordinary command19/17 cleanup or prohibit a supplied-case component correction.

The [admission/retirement three-red result](../issue248-raid-member-admission-20261010/README.md) and [separate continuation one-red result](../issue248-raid-member-order-continuation-20261010/README.md) remain unchanged, including all ten tests and both failed/exit1 receipts. PR309 remains an expected-red draft, not ready to merge. Universal admission is held; the Warrior-only/model-only activation proposal remains withdrawn.

Further source work is paused. The named remaining specialist lifetime obligations are successful return-order preparation through `0043b2a0 → 00438730(order,3,point,0)` with its applicable cleanup/attachment, and the live Spy latch/list producer including `0043b8e0` and the actual collected-building inputs. Their [accepted finite release guards](../issue248-membership-source-boundaries-20261010/specialist-source.md) already show why new ownership must not outlive native release. No new composition or export was started. Unknown7f bits, authoritative identity, assignment/array reconciliation and legacy-save continuity also remain implementation limits.

This checkpoint adds no Mission 1–3 gameplay-impact claim or captured-M6 repair. Existing byte-level admission, ordinary cleanup and Preacher retention findings remain available in the [reviewed source boundaries](../issue248-membership-source-boundaries-20261010/README.md); the historical input-absence statements there describe their earlier freeze and are superseded for phase3 by the separately accepted observation above.
