# Issue248 raid membership: independent controlled-result review

Verdict: **ACCEPT as the intended failure-first actual-caller result**, on unchanged production source. The run itself correctly retains status `failed`, exit1. This is not a passing product test or runtime implementation approval.

## Identity and verification

- Exact tested commit: `b6a74587a428faea1e08ff46f5b3bb0361be6c53`
- Runtime base: `4754e12d3590bde18656416514871b033de164be`
- Test SHA256: `95420d98dceb5a149f11b730ea9aa82ad7d6d01cf1d08778ec72e6dfc5205c18`
- Accepted source readback: `issue248-raid-member-test-source-review-20261010.md`, SHA256 `69fcd7b84fcf3c86d8443cf79348a2a7d1d4e14dc4b4a6f2d799c300d6ccbfde`
- Raw result directory: `/workspace/scratch/69fd8163d94e/issue248-raid-member-tests-20261010/work/orchestration/issue248-raid-member-admission-20261010/run-1`
- `receipt.json`: `4d285168f67499a6e5fb068a91f6116cf275d95a60f9917b6b9dc33f27cc3679`
- `stdout.log`: `c3832c88fd72b23600547741500a79668b9fcecd041ee120141f3931399e1ea7`
- `stderr.log`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty)

The retained command exactly matches the accepted plan: `taskset -c 4 timeout --signal=TERM --kill-after=5s 55s node --test tests/raid-member-admission.test.mjs`. Start: `2026-10-10T08:00:23.845519+00:00`; end: `2026-10-10T08:00:25.078500+00:00`; elapsed1.2327820139980759 seconds. Exit1 reflects the intended assertion failures, with no import, setup, timeout or stderr failure.

Independently compared before/after receipt identities, exact command, all16 source hashes against preflight and current files, and dependency realpath/device/inode. Source snapshots are identical and clean at the accepted commit; tracked-diff hashes are empty. Historical phase6 fixture and test hashes remain unchanged. Read full retained output and verified three assertion failures, four passes, zero cancelled/skipped/todo and the three exact expected failure labels. No repeat run was performed.

## Observed bounded result

1. Phase3 completion reached phase4 with the fallback actually transitioned to state14 and all prerequisite/exclusion guards satisfied. Actual owners remained `[0,99,0]`, whereas the accepted contract requires `[3,3,3]`; known7f stayed0xa5 instead of0xa4. Existing flags3 remained0x2200 as expected.
2. Registered-person phase3 admission reached its final check after preserving stale aliases and the excluded registered owner. Actual registered owner stayed0 instead of3 and known7f stayed0xa5 instead of0xa4.
3. Phase23 completed slot and selection-lock cleanup, preserving foreign/other-tribe ownership, order-pool/RNG state and absent7f knowledge. Matching registered owners nevertheless remained3 instead of0, flags3 stayed0x2200 instead of0x200, and known7f stayed0xa5 instead of0xa4.

All four controls passed: incomplete quota work does not admit; zero final count does not admit an unrelated state14 person; a returned ID blocked from entering state14 does not admit; a stale matching alias does not release a foreign registered owner.

This establishes the missing phase3 admission and phase23 matching release projection through the actual supplied dispatcher path. It does not establish ordinary campaign composition, phase6 legacy-fixture reinterpretation, native save serialization, M1–3 impact, or a production repair. The five implementation boundaries remain held: task+0x31, partial7f knowledge, array/reassignment/retirement consistency, fresh versus retained registered owners, and legacy checkpoints versus new continuity.
