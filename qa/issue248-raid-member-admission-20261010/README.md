# Raid membership: expected-red caller regression

**FAILED as expected:** one controlled run reached all seven supplied actual
dispatcher cases. Four negative controls passed. Only the three labeled missing
admission/release assertions failed. This is a reviewed failure-first regression,
not a product fix or a merge-ready change.

The [accepted original-game contract](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md)
identifies the phase3 completion admission writer and phase23 matching-owner
release. The [test source review](test-source-review.md), [result review](test-result-review.md), [proposal](proposal.md),
[preflight hashes](preflight.json) and [receipt projection](receipt.json) bound this
run to those operations. Production remains byte-identical to
`4754e12d3590bde18656416514871b033de164be`.

## Observed result

- Phase3 completed and its final fallback action changed the selected person's
  state to14. The full state14 set retained assignments0/99/0 instead of owner3;
  known7f bytes remained0xa5 instead of0xa4.
- The registered-owner admission case preserved both stale aliases but left the
  actual state14 person's assignment0 and7f0xa5 unchanged.
- Phase23 cleared the task flags/member array and released the selection lock.
  Matching registered people retained assignment3 and person0x2000; known7f0xa5
  also remained unchanged. Foreign and other-tribe owners were preserved.
- Incomplete quota work, zero-count completion, a state14-blocked returned ID,
  and retirement with a foreign registered owner all passed their controls.

Every fixture-path assertion passed before the intended ownership assertions.
There were no import/setup errors, skipped cases, timeout, or unexpected failures.
Known masks and unknown flag absence were kept distinct. The order pool and RNG
retirement controls passed. Both historical phase6 fixture files and their test
remain unchanged.

## Execution and limits

Tested commit: `b6a74587a428faea1e08ff46f5b3bb0361be6c53`.
Test SHA256: `95420d98dceb5a149f11b730ea9aa82ad7d6d01cf1d08778ec72e6dfc5205c18`.

Command: `taskset -c 4 timeout --signal=TERM --kill-after=5s 55s node --test tests/raid-member-admission.test.mjs`.
Exit1,1.233 seconds wall time, Node reported1159.037ms. The55-second TERM deadline
and5-second kill grace were not approached. Source hashes, clean tracked state,
and stationary dependency device27/inode538212 were identical before/after.
No run preceded source acceptance and no rerun occurred. The initial unrun
e9b9187e fixture-owner correction remains documented in the source review.

No runtime/native/emulator/browser work, campaign continuation, full check/build,
dependency installation or parity credit was performed. These are supplied
controller-boundary cases; Mission1–3 reachability/impact remains unproved.

The next ownership-contract step is to settle the runtime representation of
task+0x31 and partial7f knowledge, and how native assignment agrees with arrays,
reassignment, early retirement, retained/fresh owners and legacy-zero checkpoints.
Production edits remain held until that bounded contract is accepted. A byte write
on every select/order action or a17/19 predicate patch would not implement it.
