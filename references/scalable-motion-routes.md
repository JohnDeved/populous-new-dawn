# Scalable motion routes (#661, under #648)

This slice depends on the population/current-save policy in #653. It addresses
route storage and ownership, not the complete supported gameplay population or
any performance/FPS target.

## Failure and bounded replacement

The unchanged `55770f1a` accounting fixture issued twenty ordinary group moves to
1,000 supplied followers. Setup made 1,000 builds and 240,799 slot probes, with
601 actual route-pool exhaustion returns; no simulation turn ran. The original
failure and workload remain acceptance inputs, not something to replace with
closer destinations, frozen actors or direct-movement fallback.

Shipping scalable worlds keep the 109-byte route geometry/flag layout, but own
references in a `Float64Array`. The old first two reference bytes are zero and are
not authoritative. Active counts and person handles remain exact JavaScript
integers, without signed-word narrowing. Counts reject invalid/unsafe changes
before owner/counter mutation. Current saves validate actual ownership, including
controller and registry aliases deduplicated by object identity. Two distinct
objects with the same ID are still two owners, not one alias.

Allocation starts with the existing 399 usable records and doubles usable storage
only after the cursor scan finds no unowned slot. Record zero remains the sentinel
and one end record remains outside allocation, matching the existing cursor/reuse
scan boundary. Growth copies all bytes and counts before publishing either array;
a failed allocation does not replace arrays or advance the cursor. A range/allocation
error propagates, not a success or direct-motion fallback. Search failure remains
a distinct ordinary return with unchanged failed-search cache and retry cadence.

Reuse still scans backward from the last attachment with the existing active-count
budget, including holes, vehicle eligibility and near-cell rules. Growth extends
the same ring; no sorting, new sharing heuristic or RNG draw is introduced. The
reserved flag survives its last reference's release, excludes reuse by other
people and is cleared on ordinary attachment. As in the native allocator, a
zero-reference reserved record can be reclaimed: reservation is not an immortal
slot lock. There is one deliberate scalable bookkeeping difference: retained native boarding
`004657d0` calls attachment with a zero driver route (verified export SHA256
`886447f98d79875282d710f02f14d45af6e9855c2e6c271f093067f364620e56`).
Classic `004ea3b0` increments sentinel storage and active count even though the
person has no route. The central scalable helper instead keeps zero unowned,
while preserving last-route zero, reset-then-copied index and the passenger result.
This removes a phantom reuse-budget contribution; universal equivalence for that
native oddity is not claimed. The adapter and classic low-level oracle are unchanged.

Construction itself does not acquire a person reference; ordinary
callers attach immediately after successful construction.

## Audited consumers and current format

- `person-routes.ts`: allocator, reuse, ownership, failure cache, route positions,
  vehicle-leg flags and the planner's former signed-word build-result cast.
- `person-route-recovery.ts` and `live-people.ts`: recovery passes complete route
  handles through release, failure clearing and reserved attachment.
- `route-advance.ts` and `live-pathfinding.ts`: payload offsets remain 109 bytes;
  motionIndex is a waypoint byte (at most 23 points), not a route handle. Ordinary
  live advancement callbacks do not allocate new route arrays while retaining a
  payload view.
- `live-vehicles.ts`: boarding shares driver ownership; departure/flight lifecycle
  retains person aliases, and teardown releases through the shared route helper.
- Building, resting, worship, combat and spell consumers all release/redirect
  through the same helper; no separate packed reference counter remains.
- `world-state.ts` selects route mode at factory construction. `createWorld`
  selects the scalable empty route table before authored initialization commands,
  while preserving #653's authored IDs/RNG and later general-ID reservation.
- `capacity-policy.ts` validates payload/sidecar shape, safe counts, handle/index
  domains, actual owner multiplicities and active total before current load/save.
  It never derives a missing sidecar, changes IDs or resets a route on restore.

Checkpoint envelope **v3** deliberately replaces v2; database and campaign-profile
versions remain 1. The writer's canonical version lives in `checkpoint-format.ts`.
The JSON checkpoint codec already preserves Float64Array bytes and graph aliases;
new round trips cover large safe-integer counts, while current-schema admission
rejects missing/wrong-type/wrong-length/aliased sidecars without repair. Snapshot
admission binds the route pool into its gameplay identity and validates current
ownership even if a transport hash is recomputed. Current generators consume it where practical; serialized browser closures retain
explicit, tested v3 admission pins. Existing incompatible-save UI and independent
campaign progress behavior remain unchanged. No obsolete-save migration or
sidecar reconstruction is a shipping path. Explicit classic factories retain the
old 401-record/signed-word behavior only for native/research evidence.

## Bounds and evidence limits

- Each allocated slot costs 109 payload bytes plus 8 reference bytes, excluding
  object/array overhead and shared 80-byte failure/1,033-byte search buffers.
  Geometric growth may temporarily retain old plus new arrays (approximately
  three times the prior storage), and leaves spare capacity. Host allocation
  limits, memory pressure and GC remain real limits; a fatal host OOM is not a
  recoverable JavaScript capacity result.
- Handles and reference counts are bounded by exact JavaScript integers
  (`Number.MAX_SAFE_INTEGER`). Growth checks exact address multiplication before
  allocating; actual typed-array/ArrayBuffer engine limits and available memory
  are much lower. This is not an assertion that those theoretical tiers fit.
- The original 23-point route truncation, 256-point search buffer, pathfinding
  node/request budgets, 8-entry failure cache, map wrapping and visit cadence do
  not change. The reuse scan is still linear in its active-count budget; this
  change is not an asymptotic route-sharing optimization.
- Other capacities remain independent: 1–1,023 terrain building handles, 160
  shared secondary-effect slots, 120 timber-cache records, actor-ID narrowing in
  unaudited native consumers and other simulation/render costs. The retained
  1,000 gate conservatively requires actor IDs below 32,768; wide route-handle
  tests do not prove that wide actor IDs are safe everywhere.

Tests compare every route payload byte, logical reference count, cursor, reuse
choice and failure-cache state against the classic reference path below its
capacity. Separate supplied tests cover 40,000 distinct route owners/handles,
40,000 references to one shared route, reservations, clean injected allocation
failure, malformed current ownership, full-graph Save/Load and the live Boat
sharing consumer. These are not 40,000 active followers or a timing benchmark.

The remaining acceptance is the unchanged 1,000-follower workload through an
explicitly reviewed scalable-mode/representation adapter, real movement and strict
ownership/failure/semantic gates, plus final standard integration gates and fresh
review. Differential ordinary traces must use #653 scalable mode on both sides
so ID scheduling policy is identical. Beyond the old exhaustion boundary, use
explicit logical ownership/geometry and deterministic reload evidence, not a false
claim of full-state equivalence to an incomplete baseline. Later #657 comparisons
must apply the same accepted capacity changes to both variants.
