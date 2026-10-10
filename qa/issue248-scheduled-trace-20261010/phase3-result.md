# Full Mission6 phase3 completion input

**Accepted bounded port observation:** the first authored Chumara raid completed
phase3 at turn6485 with three Warriors (model3:377/378/540) and one Preacher
(model4:455) in registered state14. These are the entire state14 set among all11
registered tribe2 people; no unlisted state14 person was present. All four have
`computerAssignment=0`. This is a mixed cohort, not a Warrior-only witness.

[Bounded rows and actual callbacks](phase3-result.json), [source/command/hash receipt](phase3-receipt.json)
and [independent result verdict](phase3-result-review.md) support this result.
The raw world is retained locally and is not published.

## Actual scheduled path and capture

Exact tested [sourcecf6b03f3](https://github.com/JohnDeved/populous-new-dawn/tree/cf6b03f34bf6ffc9e9d6f59b9a033ea90c679e32)
leaves production identical to main4754e12d. One default-seed createWorld(6) kept
both authored opponents active and advanced with tick(1/12), without injections,
checkpoint restores, AI edits or scenario searches. The natural allocation was
turn6475, slot2, requested4 and quotas[0,80,30,0,0,0].

- Turn6479: actual select(3,3,47244) returned377/378/540; their select actions ran.
- Turn6482: actual select(4,1,47244) returned455; its select action ran.
- Turn6485: final select(-1,0,47244) returned[]; selected4 entered phase4. The final
  action batch was empty in this observed case. Its completed dispatcher returned
  before the one decisive raw capture; prior selection actions had already run.

Callback return, controller return and completed-dispatch metadata remain distinct.
The decisive capture preceded later gameplay in the enclosing tick. The unchanged
full live-world guards passed; no detached projection ran during gameplay. Mission
exit0 was confirmed before the separate hash-verified offline projection, which
also exited0. Source, package/dependency and capture hashes remained unchanged.

## Entire registered tribe2 population

Registry order below is port Map iteration order, not native tribe-chain order.
`person.assignment` is distinct from `person.computerAssignment`.
All rows have absent/unknown nativeFlags7f; absence is not a recovered zero byte.

| ID | Model | State | computerAssignment | person.assignment | Listed in task | Registered alias |
| --- | --- | --- | --- | --- | --- | --- |
| 16 | 7 | 19 | 0 | 1 | no | native |
| 347 | 3 | 19 | 99 | 281 | no | native |
| 377 | 3 | 14 | 0 | 281 | yes | native |
| 378 | 3 | 14 | 0 | 281 | yes | native |
| 455 | 4 | 14 | 0 | 272 | yes | native |
| 482 | 4 | 10 | 0 | 272 | no | native |
| 540 | 3 | 14 | 0 | 281 | yes | native |
| 541 | 3 | 19 | 0 | 281 | no | native |
| 560 | 4 | 10 | 0 | 272 | no | native |
| 567 | 2 | 19 | 0 | 1 | no | native |
| 11 | 2 | 10 | 0 | 272 | no | entry |

Every registry key matched its person's ID. No unmatched authoritative alias or
stale-alias mismatch was observed. The whole-registry scan retains nonmembers,
including Warrior347 with computerAssignment99 and Brave11 whose registered
owner is entry.person. None of the eleven people was removed by hp filtering.

## Preserved limits and failed attempts

The [accepted native admission/release source](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md)
places admission after positive final selection across the whole native state14
chain. This observation supplies the current port input at that boundary; it does
not implement that operation or recover native chain order, task31 flags, routing,
visit cadence or full specialist maintenance. Ordinary alias identity is supported
inside the captured graph. Original typed-view backing and cross-stage raw pointer
identity remain unproved. Later owner lifetime and Mission1–3 impact are unknown.

All earlier failures remain failed: the first phase16 attempt rejected at7637;
the [revised phase16 run](https://github.com/JohnDeved/populous-new-dawn/blob/52766b75355edd4668941e9c5bce297a929fc4bb/qa/issue248-scheduled-trace-20261010/README.md)
failed at7649 with only its earlier guarded prefix accepted; and phase3 source
be6e8df2 rejected before its first controller at6479, with zero accepted visits.
That last12-byte difference was precisely two integer/double encodings of equal
values103/111, consistent with [Node24.19's documented serialization limitation](https://github.com/nodejs/node/blob/v24.19.0/doc/api/v8.md#serialization-api).
Its cause/original backing was not proved and it was never relabeled a pass.
The earlier zero-case controlled import failure is retained in the prior packet.

This report grants no runtime-fix, universal activation, native parity or release
credit. Production is unchanged and no additional replay followed this capture.
