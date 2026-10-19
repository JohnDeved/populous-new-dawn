# Validated ordinary projection reuse

Candidate only; no runtime performance claim. Base: 3d4ab6eb178fbd8a95092315765023a38ab835ce.

## Aggregate retained-memory budget (before implementation)

One view retains at most 32,768 cached projections across ALL instances, never
32,768 per instance. Nine Float64 lanes contain raw XYZ plus world/NDC XYZ:
2,359,296 bytes. Uint32 context tags add 131,072 bytes. At most nine context
records, each 40 Float64 values, add 2,880 bytes. Cache total: 2,493,248 bytes.
Existing numeric working storage remains capped at 98,304 * 6 * 8 = 4,718,592
bytes; current-query corner/slot maps use (129*129 + 98,304)*4 = 459,780 bytes.
Aggregate maximum retained typed-array payload: 7,671,620 bytes (~7.32 MiB).
This is not total JS heap, peak allocation, or a GC bound: small records/arrays
have engine overhead; working-buffer growth briefly keeps the previous buffer,
and independently owned generic/native paths keep their existing allocations.
Release/disposal detaches cache and working data; an active lease can finish.
Overflow projections and instances beyond nine are computed without cache growth.

## Invariant split

The original scan, candidate order, current Painter resolution, query-time XYZ
reads, corner equality, visibility preparation, and frame/water phase order stay
unchanged. Only pointer-independent projection arithmetic may be reused. Each
entry validates current raw XYZ with Object.is and an exact numeric context
(world/instance transform, raw center, projection fields/matrix, config depth).
Entries follow the bounded query-wide projection ordinal, not geometry IDs; an
ordinal collision is harmless unless ALL arithmetic inputs match. Current-query
corner aliases remain fresh. Version-only ownership assumptions are not added.

The context records use exact numeric equality, not string keys or object identity.
Thus signed zero, NaN, replaced projection objects, and in-place matrix edits are
handled without conflating differing inputs. An altered submission can lose reuse,
but cannot reuse a mismatching arithmetic result. Water/light revision changes do
not themselves invalidate: actual raw coordinates do. The 32,768-entry limit
keeps memory fixed even when changed visibility visits many instances/vertices.

## Proof and limits

The initial repeated-pointer test on the unchanged implementation failed with
6,092 projected vertices on the second authored input query (expected zero), after
candidate/output parity succeeded. Raw output is in the ignored task evidence.
This is a deterministic work-count witness, not measured speed or a browser result.
Focused parity and lifecycle checks, independent review, controlled total-cost
measurement and browser acceptance are separate gates.

## Paired CPU whole-query benchmark plan (not executed)

Freeze parent and candidate commits, Node/V8 versions, dependency lock hash and
fixture input hash. Load parent RenderView AND its original numeric projection
module from the parent commit; do not time the generic picker as a substitute for
the parent's owned numeric path. Use independently created real Level2 scenes
through the same existing Node scene fixture, authored scene input entry and
ownership factory. Repeat separately with migrated structured-clone checkpoints.
No browser/GPU or hardware-performance conclusion follows from this fixture.

Use deterministic identical pointer sequences and alternate AB/BA order. Establish
warm-up separately, then retain paired per-query samples and aggregate distributions
rather than best times. Time the complete inputPick invocation with diagnostics
disabled: visibility, current XYZ reads, corner sharing, context construction/key
comparison, cache validation/copy/save, numeric growth/misses, full ordered triangle
scan and Painter resolution are ALL inside the measured boundary. Do not subtract
cache maintenance or count only the projectionMs bracket. Capture work counters in
separate untimed passes so diagnostic branches do not distort the primary samples.

Cases for both fresh and checkpoint worlds:
- Fixed-camera warm pointer movement across a deterministic screen grid, including
  hits and misses; separately include the first cold query and cache allocation.
- Alternating camera positions/bearings/zoom/viewport, seam/copy changes and broad
  submissions that exceed aggregate capacity. These are deliberate miss/eviction
  cases, not excluded outliers.
- Unversioned raw XYZ edits (one duplicate, localized batch, wide batch), restored
  values, water turn changes, and lighting-only rewrites. Prepare both sides with
  identical changes and preserve pointer-before-water/render phase ordering.
- Changed Painter depth/occupancy with unchanged geometric positions, to ensure
  current winner resolution remains live.

Compare ordered candidates, winners and state fingerprints outside timed samples.
Record total preparation/update time separately AND a combined preparation + query
cycle for scenarios that mutate terrain/water/view/Painter; report both so moving
work outside the query cannot manufacture savings. Include cold start separately
from amortized warm behavior. Report allocation/retained typed-array capacities,
cache fill/overflow rates and context count, including the 7,671,620-byte aggregate
ceiling; process heap/GC observations are supplementary, not exact memory bounds.
Stop and diagnose on any parity mismatch. Advancement needs a reproducible net
whole-query/cycle result without unacceptable cold/moving-camera/memory regressions,
then the separately authorized browser and whole-frame gates. Zero projection
calls alone is not an acceptance criterion for performance.
