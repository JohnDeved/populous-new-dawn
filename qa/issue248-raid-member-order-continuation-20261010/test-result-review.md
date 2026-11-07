# Issue248 ordinary cleanup continuation: independent result review

Verdict: **ACCEPT as the intended separate failure-first continuation result** on exact tested commit `20f22f5908eddab2cf8b164c5d2a119b5dd4bbc5`. The run retains status `failed`, exit1. Production remains unchanged; this is not a product pass or implementation approval.

## Identity and receipt

- Runtime base: `4754e12d3590bde18656416514871b033de164be`
- Test SHA256: `9057a6351db9cf9026aba75e4d23cfc099ee042c2b736d02faea0d013ba38d8d`
- Test-source review: `1a85f52cf385bf8dbb53560c4f36070e8c31e94cf1e2cb32302b4368f76bad9c`
- Accepted finite original cleanup report: `c2baca97c15acd3fb42df93de7144934f8b058709e5bdf7ef89a981e11934ccb`
- Independent cleanup review: `1c54e9e78edeb1a8ba20800dfef883a2019424f1c5b89a0ebf55ed10f4c22231`
- Raw directory: `/workspace/scratch/69fd8163d94e/issue248-raid-member-tests-20261010/work/orchestration/issue248-raid-member-order-continuation-20261010/run-1`
- Raw `receipt.json`: `ed75dac07d7e3c01aceef749b204ea81af26dfc9906498e9ac7f5af86ac68ae9`
- `stdout.log`: 3641 bytes, SHA256 `fd2a6a6fe69b6983648b17f2cbc6427cdf91283f84d09707840fe5e8913b8262`
- `stderr.log`: empty, SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

Command exactly matches the accepted plan: `taskset -c 4 timeout --signal=TERM --kill-after=5s 55s node --test tests/raid-member-order-continuation.test.mjs`. Start `2026-10-10T08:21:57.917883+00:00`; end `2026-10-10T08:21:59.078453+00:00`; elapsed1.1601721110055223 seconds. Node reported1079.492344ms. No timeout, cancellation, skipped case or stderr error occurred.

Independently read the full result and matched receipt/output sizes and hashes. Verified before/after source identity equality, exact command, clean tested head, all26 preflight/current source hashes and unchanged dependency realpath/device/inode. The raw receipt uses nested stdout/stderr metadata; equality of its before/after snapshots establishes source continuity. No repeat run was performed.

## Observed continuation

The sole-native case reached its single final labeled ownership assertion after all cleanup, target eligibility, response-success, immediate command21 attachment, order-reference/pool, registry, RNG and structured-clone guards passed.

- Immediately after cancellation, the original registered person still held assignment3 and0x2000, but the raw-native query had no matching owner and busy0. The task roster still contained owner3.
- After registry reconciliation, the original registry owner was absent; assignment and the ownership mask were undefined. Query busy stayed0 and the roster stayed3.
- Successful response attached and registered a different person with assignment0 and ownership mask0. Query busy remained0. Known7f stayed0xa4 and roster ownership stayed3.
- Structured clone preserved the replacement's alias graph and assignment0/busy0, with the task roster still3.

The retained-entry owner3 and retained foreign owner4 controls both passed the complete same caller sequence. They preserved their respective authoritative person/assignment and roster through response and clone. These controls establish that the failing fixture reaches the finite sole-alias discard boundary rather than a universal response/allocation failure.

This is one expected failure and two passes, kept separate from the prior admission/retirement three-failure/four-pass run. Independently checked that both its raw receipt (`4d285168f67499a6e5fb068a91f6116cf275d95a60f9917b6b9dc33f27cc3679`) and published compact receipt (`217da873021e1854b3cde25fac38baddd1f04b3d000009c0c9fe721a3f0156dd`) are unchanged.

## Meaning and limits

The result demonstrates the named port owner-loss continuation for supplied ordinary cleanup conditions. The accepted original cleanup closure preserves that person's membership, so this cancellation boundary needs retention rather than a retirement policy or reconstruction from raid arrays.

The query explicitly uses raw-native mode and the clone is a field/alias continuity check. Neither proves default selection adapter coverage, ordinary campaign composition, native response/save parity or legacy-zero migration. General task+0x31, partial7f, reassignment/retirement agreement and other owner-discard paths remain separate. No runtime fix, broad validation, further execution or Mission1–3 impact is established by this result.
