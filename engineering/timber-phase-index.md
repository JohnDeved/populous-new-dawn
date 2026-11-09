# Expansion-only timber cell index

Only the expansion adapter supplied by stepLiveTimberSearches replaces objects.
The existing stepTimberSearches expansion owner selects it without duplicating
native budget, timer, cursor or indexed-search admission conditions. Its optional
sixth argument defaults to the existing world, preserving other consumers.
Route callbacks and route-driven availability checks always retain the original
live iterator, including when an expansion ran earlier in the same phase. General
liveTimberWorld and Fetch callbacks also remain unchanged.

A generator builds a local Map only on the first actual expansion lookup, after
fog gating and successful indexed-search allocation. Route-only, deferred,
zero-budget, exhausted, fog-hidden and inactive phases do not build the index.
The first nativePosition remains at the first tree lookup and may synchronize
terrain. Empty/no-query phases do not synchronize.
Shipped expansion and route callbacks mutate search/pathfinding scratch, not tree
roster or X/Z. Terrain notifications mark building/person/effect state, not tree
membership. The closure is discarded when the synchronous search phase ends.

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

Construction still costs O(T): one world descriptor, one per roster slot, up to
six per tree, and absent flags4 prototype checks, plus one nativePosition per tree
and bucket references. The original all-search-phase experiment had 255 builds
but only 50 expansion calls in authored Mission 6. Its full-tick timing was mixed:
median 4.4% lower but observed p95/max 2.8% higher, with increased process peak RSS.
That result does not establish this narrower candidate's performance. Keeping
route-only short-circuit scans unchanged is a cost hypothesis, not a speed claim.

Tests cover default native fixtures, exact reverse/native seam ordering, live
resource/reservation reads, phase-boundary roster mutation, lazy/fog/empty behavior,
custom getters and sparse fallback. Expansion-adapter tests compare complete
search pools, indexed-search bytes and original route observations across mixed,
route-only, deferred, zero-budget, exhausted, fog-hidden and inactive cases.
The optional authored-world comparison requires PND_TIMBER_BASELINE explicitly;
complete current-main graph parity, full gates and timing are separate acceptance
steps. New tests remain serial.

## Source-bound descriptive comparison

One fixed run compared expansion-only commit
0064c248fb80ad4893a151846d1feeb939184685 against main
f1b3d290afd3a48bed4eaa12d4ad56ca665e0287. Each authored M6/M1 cohort used 20
fresh-process alternating pairs, 128 separate-world warmup ticks and one complete
1024-tick timed interval. All 80 raw samples were retained; every final full-world
state matched the separate per-turn graph preflight. No exclusions or retries.

M6 interval median was 1334.57 to 1287.30 ms (3.54% lower), with 15/20 paired wins
and paired median ratio 0.97144. Observed p95 was 1524.54 to 1524.90 ms (+0.024%);
maximum was 1700.39 to 1674.84 ms. M1 had no search activity: its unpaired median
was 281.66 to 276.23 ms, but only 9/20 paired wins, paired median ratio 1.01295,
p95 +2.49% and maximum +3.80%. The mixed control result must not be reduced to
its lower unpaired median. M6 median process peak RSS rose 359.88 to 367.42 MiB;
this includes setup, warmup and graph hashing, not isolated index memory.

The evidence supports a modest central CPU improvement in that M6 workload,
not broad improvement, per-tick tail latency, browser FPS or hardware rendering.
Host exclusivity is unverified and sample tails are descriptive. The later
composition on main 5087f2e805097665c4fdcce657553db3a693bb76 was not timed; it retains
the same three changed production-file bytes, with corrected tests/documentation
and the newer main's unrelated changes. Full integration gates remain separate.
