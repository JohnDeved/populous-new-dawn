# Sparse object-basis multiplication

Related: #143, #144 and #648. This replaces the sparse roll × pitch product inside
`modelMatrix`; it does not add a cache or make `RenderView.prepare` incremental.
The preceding draw-basis cache experiment remains parked and unpublished because
its inclusive totals and generic fallback costs were mixed.

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

Measurement and complete source-bound results are pending. Standard full check,
build, browser and any required native acceptance remain separate gates.
