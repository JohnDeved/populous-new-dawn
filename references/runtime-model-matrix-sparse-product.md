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

Draw-stage medians are lower in every pair. Inclusive effects-stress and
moving-pose medians/totals are also lower in both orders. Custom setters use the
same scalar path; their inclusive totals remain mixed (+4.1% / -6.0%). Ordinary
opening and crowd results are mixed, with adverse candidate outliers and sums
retained below. The cause of
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

### Retained-log settling diagnosis (no rerun)

Sixteen warmups did **not** establish a steady-state measurement. Several arms
continue declining across the measured window; others rise or have late spikes.
The table below retains all five fixed 16-cycle windows, including warmup, to
show that limitation without changing the declared 64-sample analysis. Values
are inclusive CPU medians in milliseconds; frame indices are zero-based.

| Cohort | Order | Arm | Frames 0–15 (warmup) | 16–31 | 32–47 | 48–63 | 64–79 | Largest measured frame: ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening | AB | base | 0.7693 | 0.2649 | 0.3811 | 0.2220 | 0.2296 | 18: 1.2187 |
| opening | AB | head | 0.6501 | 0.4241 | 0.2403 | 0.1870 | 0.1959 | 28: 11.2093 |
| opening | BA | base | 0.7740 | 0.2778 | 0.2878 | 0.2217 | 0.2273 | 20: 0.8514 |
| opening | BA | head | 0.6384 | 0.2219 | 0.3156 | 0.1861 | 0.2869 | 61: 10.0235 |
| crowd256 | AB | base | 4.6225 | 2.3112 | 1.9817 | 1.7801 | 1.8083 | 21: 4.4169 |
| crowd256 | AB | head | 3.8585 | 3.1415 | 1.7700 | 1.5227 | 1.4578 | 19: 17.1791 |
| crowd256 | BA | base | 3.4995 | 2.0519 | 1.8374 | 1.6726 | 1.7005 | 34: 6.0854 |
| crowd256 | BA | head | 3.3949 | 2.5581 | 1.9719 | 2.1490 | 2.0643 | 22: 13.1309 |
| effects128 | AB | base | 28.0265 | 24.4931 | 28.6063 | 26.8254 | 28.7551 | 28: 83.3733 |
| effects128 | AB | head | 24.1653 | 22.6123 | 17.1381 | 19.7008 | 28.7498 | 77: 64.3111 |
| effects128 | BA | base | 30.3109 | 25.2083 | 25.5253 | 26.2909 | 25.3574 | 58: 31.0888 |
| effects128 | BA | head | 26.9340 | 25.2008 | 19.7214 | 19.4567 | 19.3608 | 18: 46.4520 |
| moving-pose | AB | base | 4.3456 | 4.1044 | 2.6752 | 2.3126 | 2.2286 | 23: 5.6856 |
| moving-pose | AB | head | 3.5766 | 2.4150 | 2.2407 | 2.0129 | 1.9797 | 32: 5.3291 |
| moving-pose | BA | base | 5.5592 | 3.4011 | 2.7819 | 2.5467 | 3.7398 | 75: 6.1809 |
| moving-pose | BA | head | 4.4235 | 2.8742 | 2.4284 | 2.0934 | 2.0765 | 32: 6.0540 |
| custom-setter | AB | base | 2.8464 | 2.0000 | 1.6511 | 1.5801 | 1.5531 | 35: 4.8448 |
| custom-setter | AB | head | 2.9486 | 2.5099 | 1.4228 | 1.3690 | 1.3758 | 19: 15.6569 |
| custom-setter | BA | base | 3.4058 | 2.4339 | 2.1308 | 1.6861 | 1.6979 | 37: 5.2445 |
| custom-setter | BA | head | 2.6112 | 2.2681 | 1.5928 | 1.3968 | 1.3257 | 18: 11.8043 |

For example, crowd AB falls from 2.3112 to 1.8083 ms (baseline) and 3.1415 to
1.4578 ms (candidate) between the first and last measured blocks. Conversely,
the opening BA candidate spike at frame 61 is 10.0235 ms, with 9.8544 ms inside
draw; the effects AB candidate peaks at frame 77 with 64.3111 ms. A startup-only
explanation therefore does not cover all observed tails. Work counts are constant
and paired, and the fixtures substitute texture IO; no actual asynchronous asset
download or GPU upload settling was measured.

This is a fixed transient CPU workload comparison, not demonstrated steady-state
throughput or stable tail latency. No retained data identifies JIT, GC, scheduling
or another cause for the spikes, and none is asserted. No samples are removed,
no alternative warmup cutoff is adopted and no additional trial was run. Hosted
whole-frame/browser qualification with the actual renderer remains required.
