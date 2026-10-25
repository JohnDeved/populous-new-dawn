# Allocation-only triangle scan

This change does not replace the picking algorithm or add spatial pruning.
A ray cannot invert the current curved screen projection, and a heuristic screen
AABB can change near-collinear acceptance. The existing projected triangle scan,
absolute determinant cutoff (`1e-12`), division/grouping, barycentric signs, native
pixel-edge test, interpolation and painter winner resolution remain unchanged.

The three index getters execute first in the same order, followed by the three
screen lookups in the same order. The old `every(z < -1)`, `every(z > 1)` and
`some(w <= 0)` perform left-to-right short-circuit reads; the scalar conjunctions
and disjunctions perform exactly the same reads. In particular, NaN does not
become an early rejection, signed zero and nonfinite division are untouched,
and getters are not cached or reread differently. Existing successful-hit IDs
and weight arrays remain; their allocation is delayed until after acceptance.
Native coarse bounds are untouched and still execute before clipping.

For each rejected triangle, avoid its ID array, mapped screen array, and each
executed clip array: two arrays before native coarse rejection, three after the
first clip test, up to five after all clip tests. An accepted triangle avoids the
map array plus three clip arrays (four), but still creates its ID/weights arrays.
No retained buffers, cache, geometry preprocessing, ownership contract, global
hook or new counters are introduced. Candidate count and ordering must be exactly
identical, not merely winner-equivalent. No runtime speed claim is made.

The frozen parent predicate test exercises near-collinear determinants on both
sides of the cutoff, sign reversal, NaN/Infinity, clip boundaries, and accessor
read order. The optional explicit parent caller comparison includes custom index
getters, native/ordinary interleaving and exact winner parity; authored terrain
water/camera/seam tests run against the same untouched public parent. Protocol
receipts state its source path. The new test remains serial by default, outside
the parallel allowlist. Full checks, browser acceptance and controlled timing
are separate gates, not implied by focused correctness checks.
