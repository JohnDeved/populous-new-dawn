# Sparse object-basis multiplication

Related: #143, #144 and #648. This replaces the sparse roll × pitch product inside
`modelMatrix`; it does not add a cache or make `RenderView.prepare` incremental.
There is no ownership/invalidation contract or per-object result storage.

## Arithmetic and observable boundaries

The original left roll and right pitch matrices contain one nonzero product per
nonzero output cell. Removing zero products therefore preserves the original
signed low-32-bit dot sum followed by arithmetic `>> 14`. Every surviving term
uses `Math.imul`, including multiplication by 16384: replacing those four terms
with the coefficients would incorrectly discard overflow for adversarial sine
values. The all-zero cell remains positive zero.

All four `rules.sine` property reads and input expressions stay unchanged and in
order. In particular, `pitch & 2047` coerces numerically, while `pitch + 512`
first uses addition's default hint, so these reads must not be combined. The same
applies to roll. Each successful table value `>> 2` yields an int32 primitive;
BigInt/Symbol conversion errors still occur at the same read. The final truthiness
conditional and `rotateBasis(matrix, -heading, 2)` remain unchanged. Each result
is a fresh ordinary nine-element Array; no matrix/table/pose result is retained.
Mutable tables, per-read getters, value coercions and reentry remain supported.

The execution assumption is standard, unmodified JavaScript Array/Math intrinsics,
including during getters/coercions. Arbitrary global monkey patches that observe
or change the old temporary arrays, Array species, or Math.imul call count are
not an equivalence claim. No such writers exist in the shipped application. This
is an algorithm replacement, not an ownership contract around those internals.

The unrotated multiplication changes 24 source-level Array constructions to one
and 27 integer products to eight. This is a source fact, not a measured backing-
store allocation, heap-byte, garbage-collection or full-frame performance claim.

## Shipped consumers and tests

The helper is reached by RenderView draw hooks/uniform initialization/picking,
Painter model vertices, Scene model picking, model lighting and building debris.
No caller, transform order, shader, material ownership, simulation state or RNG
logic changes. Only `app/projection.ts` is production code changed.

`tests/model-matrix-sparse-product.test.mjs` retains the pristine pre-change helper
body from base `55770f1a03478883e8d0b00a1fd518e222782c3b`; the untouched rotateBasis
serves normal CI. `PND_MODEL_MATRIX_BASELINE` additionally loads a pristine complete
projection module for an independent differential oracle. Coverage includes all
2,048 angles on each axis and mixed poses, 8,192 deterministic signed-int32 poses,
nonfinite/signed-zero/fractional/string/nullish/BigInt/Symbol inputs and errors,
mutable arbitrary sine values and overflow, changing table/value getters, exact
coercion/read order, exceptions, nested calls, fresh result ownership, and the
actual RenderView custom-setter handoff.

Resource review found only reduced synchronous allocation: no new external IO,
retained cache, timers, sockets, processes or shared writes. The production policy
fingerprint was deliberately refreshed after independent source review. The new
environment-controlled differential test remains serial/unclassified; no parallel
inventory or shared-helper fingerprint was changed.

## Frozen CPU protocol

`scripts/benchmark-model-matrix.mjs <checkout> <pristine-projection.ts>` compares
fresh baseline/candidate processes, redirecting every projection module resolution
in the baseline arm. Both arms otherwise use the same current source/dependencies.
It retains exactly five cohorts (authored Level 2 units only, synthetic 256 braves,
128-swarm stress, moving poses and custom setters), two AB/BA process pairs,
16 warmup and 64 measured cycles per arm. The unit update, RenderView preparation,
actual Painter and CPU draw-hook dispatch are included. Actual Three renderer
submission, browser scheduling and GPU work are not. It is not a complete game
frame or hardware-FPS measurement.

Every paired run must match all work counts and a terminal World/object/Painter/
uniform/depth-texture digest. All raw samples and outliers are retained, with no
adaptive repetition or favorable subset selection. The benchmark is a new
algorithm comparison, not a rerun of the rejected cache looking for a better result.

## Measured result and limits

The source-bound run completed all 20 arms in 68.435 seconds on 2026-10-19,
18:35:46.650–18:36:55.085 UTC. Node v24.19.0, Linux x64, AMD EPYC 9V74 80-Core
Processor. Baseline and candidate used identical fixture/dependency bytes; all
paired work counts and terminal digests matched. The tested source remained clean
and unchanged before/after.

- Baseline commit: `55770f1a03478883e8d0b00a1fd518e222782c3b`.
- Measured candidate: `ac501a5b03c1c1d716885d4a8f2d9e42ca8a9ffd`.
- Baseline projection SHA-256: `9fddaf1641dbcf2e6cead68528051da64a33e0e4181b26256f6b25e163dfc003`.
- Candidate projection SHA-256: `d11a4e091915d1943dc244edfa1d02360f70cda281d8ba9ecccf042d3116bcd5`.
- Benchmark script SHA-256: `924b44e660d7aedaafa94e792d53837f5859284e6388401655d120fd609c6753`.

Owned draw-stage medians are lower in every pair. Inclusive effects-stress and
moving-pose medians/totals are also lower in both orders, and custom setters no
longer need a slower cache fallback. However, ordinary opening and crowd results
are mixed, with adverse candidate outliers and sums retained below. The cause of
those spikes is not diagnosed by this benchmark. Two process pairs do not justify
a universal performance or tail-latency conclusion. This supports a simple bounded
algorithm candidate, not completion of #143, browser FPS/GPU gains or a full-frame
speedup claim.

### Every measured pair

Milliseconds: median / nearest-rank p95 / maximum / sum over exactly the last 64
of 80 cycles. AB means baseline first; BA means candidate first. Negative percent
change is lower cost. Warmup exclusion was fixed before execution, not selected
from these results.


| Cohort | Order | Slice | Baseline median / p95 / max / sum | Candidate median / p95 / max / sum | Median / sum change |
| --- | --- | --- | --- | --- | --- |
| opening | AB | Inclusive | 0.2521 / 0.5717 / 1.2187 / 20.0390 | 0.2242 / 0.6523 / 11.2093 / 29.5058 | -11.1% / +47.2% |
| opening | AB | Draw | 0.0560 / 0.1248 / 0.6375 / 5.0241 | 0.0203 / 0.0784 / 0.1278 / 1.9458 | -63.7% / -61.3% |
| opening | BA | Inclusive | 0.2480 / 0.6969 / 0.8514 / 18.7969 | 0.2519 / 0.6785 / 10.0235 / 28.3676 | +1.6% / +50.9% |
| opening | BA | Draw | 0.0559 / 0.1055 / 0.1457 / 4.0938 | 0.0197 / 0.0355 / 9.8544 / 11.3328 | -64.7% / +176.8% |
| crowd256 | AB | Inclusive | 1.9070 / 3.5857 / 4.4169 / 137.3305 | 1.7186 / 3.7813 / 17.1791 / 146.6485 | -9.9% / +6.8% |
| crowd256 | AB | Draw | 0.4117 / 0.8058 / 1.6004 / 30.4305 | 0.1740 / 0.4410 / 0.6070 / 14.9634 | -57.8% / -50.8% |
| crowd256 | BA | Inclusive | 1.7712 / 2.3501 / 6.0854 / 121.5380 | 2.1163 / 3.8734 / 13.1309 / 157.1178 | +19.5% / +29.3% |
| crowd256 | BA | Draw | 0.3824 / 0.6068 / 0.6575 / 26.6014 | 0.2249 / 0.4571 / 1.4415 / 17.5074 | -41.2% / -34.2% |
| effects128 | AB | Inclusive | 27.1905 / 35.8157 / 83.3733 / 1818.7741 | 20.7277 / 40.9675 / 64.3111 / 1517.4461 | -23.8% / -16.6% |
| effects128 | AB | Draw | 10.1909 / 12.8839 / 20.2027 / 673.9311 | 5.0568 / 11.4001 / 13.7206 / 369.3033 | -50.4% / -45.2% |
| effects128 | BA | Inclusive | 25.6570 / 28.4599 / 31.0888 / 1640.1224 | 20.0210 / 34.3238 / 46.4520 / 1389.0132 | -22.0% / -15.3% |
| effects128 | BA | Draw | 10.0937 / 11.5511 / 12.6822 / 656.5772 | 5.3049 / 7.0317 / 8.6717 / 356.7919 | -47.4% / -45.7% |
| moving-pose | AB | Inclusive | 2.4578 / 5.1130 / 5.6856 / 191.1242 | 2.1406 / 3.0751 / 5.3291 / 146.7246 | -12.9% / -23.2% |
| moving-pose | AB | Draw | 1.0050 / 1.8294 / 1.9172 / 74.5479 | 0.6513 / 1.3446 / 3.9025 / 49.0368 | -35.2% / -34.2% |
| moving-pose | BA | Inclusive | 2.8903 / 4.3214 / 6.1809 / 203.6927 | 2.3468 / 3.7511 / 6.0540 / 166.5797 | -18.8% / -18.2% |
| moving-pose | BA | Draw | 1.0714 / 1.8614 / 3.7511 / 80.7361 | 0.6929 / 1.5692 / 4.2369 / 56.9439 | -35.3% / -29.5% |
| custom-setter | AB | Inclusive | 1.6459 / 2.4835 / 4.8448 / 117.8702 | 1.4264 / 3.3402 / 15.6569 / 122.7280 | -13.3% / +4.1% |
| custom-setter | AB | Draw | 0.3622 / 0.5451 / 0.9628 / 25.1276 | 0.1386 / 0.2905 / 0.3928 / 10.7191 | -61.7% / -57.3% |
| custom-setter | BA | Inclusive | 1.9304 / 3.0805 / 5.2445 / 136.1766 | 1.4856 / 3.7807 / 11.8043 / 127.9922 | -23.0% / -6.0% |
| custom-setter | BA | Draw | 0.4644 / 0.7395 / 1.1503 / 31.3697 | 0.1461 / 0.3669 / 9.1487 / 20.4097 | -68.5% / -34.9% |

Inclusive totals including all 16 warmups and 64 measured cycles:

| Cohort | Order | Baseline ms | Candidate ms | Change |
| --- | --- | --- | --- | --- |
| opening | AB | 58.9898 | 55.6232 | -5.7% |
| opening | BA | 60.6273 | 54.7305 | -9.7% |
| crowd256 | AB | 297.1522 | 277.5473 | -6.6% |
| crowd256 | BA | 245.1816 | 283.7855 | +15.7% |
| effects128 | AB | 2392.0645 | 2013.8298 | -15.8% |
| effects128 | BA | 2268.8374 | 1980.3125 | -12.7% |
| moving-pose | AB | 327.2373 | 278.1018 | -15.0% |
| moving-pose | BA | 368.6154 | 313.2051 | -15.0% |
| custom-setter | AB | 188.0291 | 181.9165 | -3.3% |
| custom-setter | BA | 214.9033 | 186.1076 | -13.4% |

Opening: 27 authored Level 2 units, 241 objects, 78 draw/Painter commands per
cycle. This excludes the complete opening terrain/building scene. Crowd, moving
and custom-setter cohorts: 256 synthetic braves, 2,050 objects, 512 commands.
Effects: the opening units plus 128 synthetic swarms / 7,680 sprites, 8,049 objects
and 7,758 commands. Effects is deliberately stress, not a representative normal
mission density. There is no cache or invalidation work to omit from the timings.

### Verification and retained raw evidence

- 49/49 focused tests passed across ten files, including the new independent
  differential oracle, draw hooks, Painter cleanup/anchors/origins, model picking,
  stone-head orientation, balloon-hut debris and vehicle/model-lighting consumers.
- Native TypeScript checker passed with no emit/incremental state in 3.962 seconds.
- Changed TypeScript Oxfmt, ESLint and Oxlint passed (zero Oxlint diagnostics).
- `orchestration:check` and `git diff --check` passed. Unknown new test/script/doc
  paths were explicitly reviewed; they were not treated as an empty check set.
- Standard full check/build and required rendered browser/native acceptance are
  not run by these receipts and remain separate integration gates. No local
  browser or original-game execution was performed.

Raw source-bound receipts and stdout/stderr stay outside Git under ignored
`work/orchestration/scalar-basis-{focused,benchmark,typecheck,structural}-01/`
in the review checkout. The review handoff retains each source/input fingerprint
and all raw timing samples; these summaries do not replace that evidence.

Reproduction with locked dependencies:

```sh
git show 55770f1a03478883e8d0b00a1fd518e222782c3b:app/projection.ts > /tmp/projection-baseline.ts
PND_MODEL_MATRIX_BASELINE=/tmp/projection-baseline.ts node --test --test-concurrency=1 tests/model-matrix-sparse-product.test.mjs
node scripts/benchmark-model-matrix.mjs "$PWD" /tmp/projection-baseline.ts
```
