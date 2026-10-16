# Water-point CPU performance research — work in progress

Refs #474. This branch experiments with reusable per-scene water height/color buffers. It does not combine the earlier lighting lookup with this candidate, and it does not claim an engine-wide speedup or FPS improvement.

## Retained baseline and first experiment

The archive and its SHA-256 manifest retain the raw JSONL samples, input/output hashes, benchmark runners, focused test receipt, source patch and reports for:

1. Three original production updateWater baseline runs: changed-turn medians 5.17–5.44 ms for 98,304 vertices.
2. A separate 192-entry lighting-lookup experiment. All three focused tests and 256-phase comparisons passed, but adjacent ABBA pairs showed only 2.26% and 9.39% lower medians. The descriptive mean-of-process-medians reduction was 6.10%, versus 16.72% baseline drift. Large tail spikes occurred in both variants. That patch is retained as an experiment and is not included in production code on this branch.

The initial baseline ran at actual HEAD d5088d8fa5c75f1e17fce5b8397146a5074128c7. All 335 tracked inputs matched main 673b89ad4d53821a592b80ccc87cf6fc6048fc58 byte-for-byte; all 339 loaded input fingerprints were stable. The paired experiment used isolated snapshots derived from those inputs. Snapshot directories were subsequently removed to return disk space; their reconstruction manifests remain in the archive.

Measurements are Node CPU preparation on unchanged Mission 1 terrain, excluding GPU uploads, browser scheduling, painter sorting and rendering. They do not establish gains on other missions, dynamic terrain/lighting, browser hardware, or the 120 FPS target. VM CPU entitlement/contention was unknown. Recorded RSS is observed process high-water at checkpoints, not precise isolated allocation cost.

## Current independent hypothesis

A WeakMap keyed by scene retains two Float64 arrays: 256 KiB of typed element storage plus object/runtime overhead per retained scene. Every existing updateWater key miss recomputes all 16,384 height/color pairs using the unchanged waterPoint function. The caller retains actual per-vertex landIndex, the original vertexLighting conversion and triangle-specific tint, Float32 attribute writes and version increments. Unchanged-key calls still return before buffer work. Values do not hold their scene key alive.

The normal 98,304-vertex mesh can reuse six vertex occurrences per wrapped terrain index on average. This is an operation-count observation, not a predicted time saving. Tiny/subset geometry may do more work because the eager buffer refresh covers the full grid.

## Measured second-candidate outcome: keep experimental

Candidate source commit 813b60dc5571cec369731928354ed0d947beebbf was measured against the byte-verified main 673b89ad baseline in isolated wrappers. Original lighting stayed unchanged. Every archived 256-phase output, immutable input and source fingerprint check passed. Independent review recomputed all raw results.

Adjacent ABBA pairs showed 20.03% and 9.44% lower medians, but p95 worsened by 5.53% and 43.59%; second-pair p99 worsened by 29.39%, with a 60.70 ms maximum. Total timed duration was only 2.77% lower overall, and the second candidate run took 10.28% longer than its paired baseline. These mixed, tail-negative results do not establish improved smoothness. See WATER-POINT-RESULT.md and water-point-reuse-experiment.tar.gz; the matching manifest binds raw evidence and archive hashes.

Separate instrumented diagnostics observed no GC entries for the candidate despite ten calls over 10 ms, including a 48.025 ms maximum. Process CPU tracked wall time at 64-call granularity. Process CPU includes helper threads and GC observation is incomplete evidence; the cause remains unresolved. Diagnostics have their own controls and are not pooled with primary ABBA. See DIAGNOSTIC-RESULT.md and water-point-tail-diagnostics.tar.gz.

## Verification status

- Source and raw-evidence reviews: accepted for experimental investigation only.
- Initial default-concurrency focused invocation: exit 1, undiagnosed file-level failure in the new test; existing Mission 1–3 tests passed. Raw failure retained.
- Unchanged conservative serial rerun: 7 passed, 0 failed. Qualified recovery, not a clean initial aggregate. New fixture-heavy test is not promoted to a parallel whitelist.
- Typecheck has NOT passed: default and 1536 MiB-cap runs were killed with exit 137 and no TypeScript diagnostics; 768 MiB cap explicitly exhausted the JavaScript heap, exit 134. A /usr/bin/time attempt failed before running typecheck, exit 127. All receipts retained; exit 137 cause is not established.
- Browser validation and hosted full checks remain outstanding. Required full checks including typecheck must pass before any merge.

PR #483 stays draft. No FPS, engine-wide gain, stable tail improvement or merge readiness is claimed. The small diagnostic report is informational; no further run is justified without a targeted hypothesis and controlled execution lane.

## Current-thread CPU follow-up diagnostic

The independently reviewed v2 block diagnostic found that slow candidate blocks were almost entirely accounted as current-thread CPU. Across all 16 changed-case blocks, wall-minus-thread-CPU gaps were below 0.5 ms. Candidate's last 64 calls took 498.864 ms wall and 498.848 ms current-thread CPU; all seven calls over 10 ms fell in that block, with no recorded GC event.

This narrows the accounting question but does not identify JavaScript versus native/JIT/GC work, explain the prior 48–60 ms outliers, or resolve primary ABBA tail regressions. It establishes no FPS or smoothness gain. Local typecheck remains unpassed and PR #483 remains draft. See THREAD-CPU-RESULT.md and water-point-thread-cpu-diagnostics.tar.gz, bound by thread-diagnostic-archive-manifest.json. The original primary and v1 diagnostic evidence remains unchanged.
