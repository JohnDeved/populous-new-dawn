# Water-point reuse experiment: correctness passed, performance inconclusive

Candidate source commit: 813b60dc5571cec369731928354ed0d947beebbf (draft PR #483).
Baseline: 673b89ad4d53821a592b80ccc87cf6fc6048fc58.
The lighting-lookup experiment is not part of this candidate.

## Result

The candidate preserves every measured 256-phase output and passes qualified serial focused correctness checks. Its median CPU update time was lower, but tail latency worsened and one paired run took longer overall. Keep this as an experiment; the current evidence does not establish improved smoothness, FPS, browser performance or merge readiness.

All times below are milliseconds for the actual production updateWater call on the 98,304-vertex Mission 1 terrain:

| Order | Variant | Median | p95 | p99 | Maximum | Total over 512 calls |
|---|---|---:|---:|---:|---:|---:|
| 1 | Baseline | 5.0660435 | 6.306247 | 8.182279 | 18.061222 | 2687.016089 |
| 2 | Candidate | 4.0514895 | 6.654719 | 7.906132 | 11.350640 | 2254.713520 |
| 3 | Candidate | 4.5874790 | 10.633247 | 12.870320 | 60.703585 | 3025.305904 |
| 4 | Baseline | 5.0656875 | 7.405028 | 9.946560 | 12.420924 | 2743.326371 |

Adjacent forward/reverse pairs showed median reductions of 20.03% and 9.44%; the mean of process medians was 14.73% lower. Baseline median drift was only -0.007%. However, p95 was 5.53% and 43.59% worse in those pairs; the second candidate p99 was 29.39% worse. Including every retained sample, total timed duration was only 2.77% lower overall: one pair was 16.09% lower, the other 10.28% higher. Reporting only the median result would hide this important limitation. The cause of the tail variation was not established.

## Implementation and memory

Two weakly scene-keyed Float64 arrays retain 262,144 bytes of element storage plus object/runtime overhead per live scene. Values are recomputed for all 16,384 wrapped terrain indices on each existing key miss. Original per-vertex indexing, lighting/tint, Float32 writes and attribute version increments remain unchanged. The unchanged-key return still precedes buffer work. This experiment trades repeated point computation for retained memory and array traffic; it does not reduce resolution, fidelity, geometry or simulation timing. Eager full-grid refresh can cost more for tiny/custom geometry.

## Verification and failures retained

- Independent source review of the committed candidate: accepted for execution.
- Initial focused invocation with default file concurrency: existing Mission 1–3 checks passed, but the new test file ended with a file-level failure, exit 1, without recorded assertion/signal detail. Its cause remains undiagnosed.
- Unchanged serial focused rerun: 7 passed, 0 failed. This is qualified recovery, not a clean initial aggregate. The new fixture-heavy test has not been promoted into the reviewed parallel whitelist.
- Default full typecheck: killed, exit 137, no TypeScript diagnostics.
- Attempt to use /usr/bin/time: unavailable, exit 127 before typecheck execution.
- Full typecheck with 768 MiB old-space cap: explicit JavaScript heap exhaustion, exit 134.
- Full typecheck with 1536 MiB cap: killed, exit 137, no TypeScript diagnostics.
- No further local typecheck retries. Typecheck remains blocked, not passed. A required hosted full check must pass before any merge.

Root explicitly authorized this bounded WIP measurement after the typecheck failures, based on source review and serial runtime correctness. That authorization did not waive merge gates.

## Measurement controls and limits

Four fresh Node 24.19.0 processes ran serially in ABBA order, each with 256 warmups and 512 individually timed calls per case, capped at 120 seconds. No local tests or browser work overlapped the measurement lane. The shared checkout was released for unrelated tutorial edits only after confirming no editable source inode was shared with the wrappers. Only the two original terrain/wave asset inodes and read-only installed dependencies remained shared and hash-checked.

The immutable wrapper baseline reuses 332 hash-matching files from the existing QA baseline; three missing support files and the candidate's detached/new files required only 31,025 copied payload bytes. The manifest fields sourceBytes, availableBefore and reserveBytes are inherited provenance from the earlier snapshot preparation, not current-run headroom; snapshot-provenance-note.json makes this explicit. The current run requested a 2 MiB reserve, but its exact pre-preparation free-byte reading was not retained. All source hashes remained stable. Cross-variant differences were exactly scene-terrain-runtime.ts, water-point-values.ts and its test. All 256 complete position/light/highlight hashes and immutable inputs match the original archived baseline, not just the new reference runs.

These are warmed Node CPU preparation measurements. Setup, hashing and reporting are outside measured calls. No samples or outliers were discarded. Browser scheduling, GPU upload/rendering, painter sorting and full-frame performance are excluded. Underlying VM contention and CPU entitlement were unknown. Memory figures in raw logs are observed process high-water at checkpoints, not precise isolated allocations. The unchanged-key timings are timer-sensitive and carry no improvement claim. No original-game correctness oracle or generalization to all mission/terrain/light states is established by the phase hashes alone.

## Artifacts

Raw pair-*.jsonl files contain every timing sample and fingerprints. paired-comparison.json and paired-effect-summary.json retain validation and calculations. snapshot-manifest.json binds baseline/candidate source hashes. focused/typecheck logs preserve successes and failures. Runners and comparator are retained for reproduction. The feature remains a draft experiment pending review of these results and further justified validation.

Independent post-run review recomputed all raw timing summaries and verified candidate source hashes against commit 813b60dc, archived phase equality, input equality and the three expected source differences. The reviewer also recommends keeping this experimental because of the tail regressions and unresolved typecheck.
