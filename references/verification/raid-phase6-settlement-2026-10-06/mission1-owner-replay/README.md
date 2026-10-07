# Strict Mission 1 owner replay

Refs #243, #247, #248. Executed source `c00bcea1c481c87290f48c08655674fa724c25bc` contains only the reviewed registered-owner accessor/non-vacuity test repair over frozen application `48a84610`.

The route scenario passed all 874 continuation ticks. The building scenario failed its unchanged 30-second current-model-19 wait after 368 ticks; all original shared-reference and later behavior assertions remain required. This is not a budget waiver.

At end-of-tick turn 409 (and still 443), units 40/41/39 have shared order 12/model 19 on unregistered `native` records, while their actual registered `fight.motion` records retain current 21/3 and queued order 9/model 3. Unit 42 owns shared19 on its registered native record. No sampled row has all registered members on 19. The trace proves this end-of-tick fork; the mid-tick register/sync sequence is source inference, not sampled observation.

The [raw manifest](raw-manifest.json) binds the original streams, sources and receipts; `raw/` preserves each file losslessly with gzip. The [independent result review](result-review/review.md) accepts route PASS and building FAIL. The extra [shared19 observation](shared19-observation.json) is a read-only extraction, separately hashed by the archive manifest. CPU4 receipt records 2026-10-07 00:31:55.817330–00:31:59.144437 UTC, exit1, 246 unchanged inputs and empty owned process group.

The separate [state33 offset erratum](../three-test-diagnostic-result/field-correction/review.md) remains in force. No Mission2 survivor substitution or release/lifetime proof follows from this result.
