# Recorded native-event mask replay

`scripts/native-event-replay.py` is a standard-library-only, pure analysis helper
for the next observer-ordered training receipt. It reads supplied bytes, merges
three already ordered arrays, and reconstructs memory **known masks and event
provenance**. It does not import a native engine, read paths from a receipt, run
instructions, or issue a native acceptance verdict.

## Evidence boundary

The reset and reset/palette historical receipts have separate read/write arrays
without shared ordinals. Their reviewed wrappers reconstructed source/call/REP
order. Do not add ordinals to those receipts, infer a recorded chronology from
that reconstruction, or replace their frozen review authority with this helper.
The pool review already streams an ordered JSONL trace; this helper does not
replace it or add a format registry.

The maintained tests are **synthetic schema integration**, including a two-iteration
REP-shaped copy, known write/read, projection invalidation, and pointer expiration.
No newly admitted native receipt has been validated with this helper as part of
this change. Its availability is not deployed native use, instruction correctness,
gameplay/parity evidence, or a measured speed improvement.

## Producer interface (new, unfrozen driver only)

Keep existing `memoryReads` and `memoryWrites` rows, adding `eventOrdinal` as a
nonnegative JSON integer. Both retain `pc`, `address`, `size` in bytes, and
`knownMask`; writes require `committed: true`. Hex strings are lowercase `0x…`.

Add `invalidationEvents` with one row per affected target:

- Common: `eventOrdinal`, `pc`, `target`, `size`, `knownMask`, `reason`
- Memory: `target: "memory"`, plus `address`
- Register: `target: "register"`, plus `register`; `size` is four bytes

The mask is the post-invalidation mask. A memory invalidation may clear knowledge
but may not create it. Register descriptors are checked against the independent
contract only: these arrays do not record all register changes, so the helper
cannot replay or certify register state. A projection envelope receives no second
ordinal; a no-op omitted fragment is outside this memory-event stream. Case review
still verifies every omitted fragment, including those with no invalidation.

`eventStream` contains exactly:

```json
{
  "schemaVersion": 1,
  "ordering": "observer",
  "eventCount": 0,
  "firstOrdinal": null,
  "lastOrdinal": null,
  "counts": {"memoryReads": 0, "memoryWrites": 0, "invalidationEvents": 0}
}
```

For a nonempty stream, ordinals are contiguous from zero through `eventCount - 1`.
Each individual array is strictly ascending. Duplicate, missing, reordered, and
noninteger ordinals fail. The merge uses only the recorded ordinals, never PC
sorting or reconstructed REP offsets.

The driver owns truthful instrumentation: reads receive ordinals at the recording
point; writes only after their commit decision; invalidations at the actual mask
change. Aborted attempts do not receive committed-write ordinals. These are
**observer recording order**, not universal CPU retirement or a hardware trace.
This successful-receipt helper rejects nonempty/missing `abortedInstructions`.
Fault/rollback correctness still needs the driver's own reviewed synthetic tests;
a dishonest `committed` flag alone cannot prove a real commit happened.

## Caller API and independent contract

```python
state = replay.replay_receipt(
    receipt_bytes, expected_receipt_sha256,
    reviewed_contract, expected_contract_sha256,
)
```

Use `contract_digest(contract)` to produce a canonical contract digest when
preparing the independently reviewed handoff. That digest uses Python JSON with
sorted keys, compact separators, default ASCII escaping, and no nonfinite values.
Do **not** compute expected identities from the receipt under review or accept its
own hash/status/contract as authority. Preserve the expected identities in a
separate trusted review handoff. The helper cannot establish their independence.
Hash comparison precedes replay; JSON rejects duplicate keys and nonfinite values.
There is no CLI that manufactures an expected contract from an untrusted receipt.

The contract has these exact top-level fields:

- `case`: nonempty label for the independently reviewed boundary
- `eventStream`: exact expected schema, counts and ordinal extent
- `memoryRanges`: admitted `[start, endExclusive]` ranges, nonoverlapping, 32-bit
- `forbiddenPcRanges`: original omitted/forbidden instruction windows for memory
  reads/writes; invalidation boundary PCs may legitimately lie in these windows
- `pcRules`: maps for `memoryReads` and `memoryWrites`, each keyed by an approved
  PC. Each rule has nonempty `sizes` (1–16 bytes) and optional `knownMasks`.
  For example, an independently proved unknown palette-copy byte write uses
  `{"sizes": [1], "knownMasks": ["0x0"]}`. Mask replay alone cannot infer that
  an instruction copying unknown input must produce unknown output.
- `initialMemory`: nonoverlapping `{address, size, knownMask, source}` entries,
  supplied **after** the case wrapper checks original initial bytes/supply hashes
- `invalidationEvents`: exact ordered descriptors, including expected ordinals,
  source PCs, target ranges/registers, masks and reasons

Projection timing and scoped-pointer expiry must be pinned in this independent
contract. The helper checks exact descriptors and read masks in recorded order;
it does not guess the correct boundary from an event's self-description. Unknown
extra event fields remain available in the raw receipt for case-specific checks.
The test fixture in `tests/native-event-replay.test.py` is a full minimal example.

Returned state offers:

- `known_mask(address, size)`: final little-endian bit mask
- `byte_sources(address, size)`: last mask-affecting event per byte, or initial/
  unknown provenance; invalidation remains distinguishable from a native write
- `byte_writers(address, size)`: last committed write per byte, or `None`; later
  invalidation does not erase that history or make its unknown bits known again
- `reads`: each read's ordinal, location, mask, and source/writer snapshot
- `counts`: validated stream counts

Sources are tuples: `("unknown",)`, `("initial", source)`,
`("write", ordinal, pc)`, or `("invalidation", ordinal, pc, reason)`.
Memory values are not replayed because the producer's writes do not retain them.

## What each fresh case wrapper still verifies

Keep executable/driver/source hashes, approved source bytes and instruction
semantics, exact calls/returns/skip windows, all initial supplies, register and
flag effects, specific REP source/destination coverage, final values and required
unknown outputs, and the case's admitted scope in its reviewed wrapper. A receipt
hash plus this helper is not a replacement for those checks. A forged producer can
record internally consistent events; recorded masks cannot independently prove
that its native run happened or that its transfer functions were correct.

The wrapper can use `known_mask` and writer snapshots to check final observations,
but a final known byte/value must still be source-bound. An allowed-PC mask rule
is a case constraint, not a generic instruction interpreter. No wrapper may
promote a successful replay into whole-game/native equivalence or parity credit.

Run focused tests with `python3 -B tests/native-event-replay.test.py -v` or
`node --test tests/native-event-replay.test.mjs`. The latter is included in the
standard `npm test` / `npm run check` path without a dependency change.
