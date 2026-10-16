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

## Verification status at WIP publication

- Source review of the second candidate: accepted for execution; unchanged-key test strengthened to inspect all three output attributes.
- Second-candidate focused tests: not run.
- Second-candidate typecheck: not run.
- Second-candidate paired measurement: not run.
- Browser validation: not run.
- Hosted full check/build: not run; draft remains work in progress.

Planned checks include exhaustive point comparisons, input immutability, storage/owner isolation, all existing invalidation gates, mixed triangle tints, geometry replacement and same-identity coordinate rewrites. Benchmark acceptance requires exact archived 256-phase outputs and immutable inputs, stable source/dependency fingerprints, serialized fresh-process ABBA runs and candid timing variance. Full required gates and integration review remain mandatory before any merge.
