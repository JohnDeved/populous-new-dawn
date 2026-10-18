# Search-phase timber cell index

Only stepLiveTimberSearches overrides its local world's objects callback. General
liveTimberWorld and the Fetch adapter are unchanged: their reservation, transfer,
depletion and allocation callbacks can mutate timber while iterating.

A generator builds a local Map only on first actual iteration, after fog gates.
The first nativePosition remains at the first tree lookup; it may synchronize
terrain and invalidate search routes. Empty/no-query phases do not synchronize.
Shipped stepTimberSearches and its collision/path-cost callbacks mutate search
and pathfinding scratch, not tree roster or X/Z. Terrain notifications mark
building/person/effect state, not tree membership. Therefore membership remains
valid for this synchronous phase only. The closure is discarded afterward.

Buckets retain tree references in exact reverse roster order, including duplicate
references/IDs and non-resource/depleted entries. Yields retain the original
id, logs/class, model, flags4 and second logs/wood read order. No resources or
reservations are snapshotted. Every later phase re-admits and rebuilds, so edits,
movement, insertion, deletion and roster replacement need no invalidation API.

Admission requires an own data world.trees field, ordinary dense Array storage,
and ordinary own numeric x/z/id/logs/model fields; optional flags4 must be own
numeric/undefined data or absent without an inherited property. Accessors,
sparse/custom storage fall back without invoking getters during admission.
Arbitrary Proxy traps and monkey-patched builtins are not a supported world
storage contract; this is explicitly not a general Proxy-equivalence claim.

Structural cost: one world descriptor, one descriptor per roster slot and up to
six per tree, plus an absent flags4 prototype check where applicable. These
checks create transient descriptor objects. Construction adds one nativePosition
call per tree, one reference per tree, and at most min(T,16384) bucket arrays/Map
entries. Query scans become bucket-local, but a single early-hit query can cost
more than the old short-circuit scan. No runtime benefit is claimed before a
controlled comparison. There is no retained turn cache, global index, or new
resource ownership.

Tests cover exact reverse/native seam ordering, live resource/reservation reads,
phase-boundary roster mutation, lazy/fog/empty/early-exit behavior, custom getters
and sparse fallback, and complete authored Mission 6 world-state parity against
an explicitly supplied untouched main, including dirty-terrain synchronization.
New tests remain serial. Full gates and timing are separate acceptance steps.
