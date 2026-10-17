# Raid target availability reuses the reviewed native collector

This correction follows the phase16 member-order/availability split in PR447.
It changes only the live caller's target-presence query. Cached-entity handling,
member orders, retries, random fallback, damage and retreat remain unchanged.

## Evidence

The retained phase16 disassembly passes radius7 at `004cc134`, maximum10 at
`004cc13d`, and calls `004f5950` at `004cc14a`. The existing export
`generated/004f5950.c` and [M3 defense research](mission3-defense-task.md) establish
center-first native cell traversal plus223 spiral positions, independent person
and building caps, alliance selection, and native person flags/model/state/Spy
filters. They do not contain a browser `flight` Boolean exclusion. Original
executable material was inspected statically; it was not executed.

A source-bound ordinary M6 observation with the separately proposed newborn
visit correction reaches internal turn8116 with Shaman95 aliveHP100, life2000,
state29, flags2=2757248, flags4=536879360, disguise0. The same physical owner is
shared by flight and fight.motion and remains registered and linked into its
actual cell. The old approximate raid predicate returns false. At the same call,
the existing reviewed native collector returns people[95], buildings[]. The
public next-turn snapshot alone would have missed this transient ownership.
The old predicate also used a radius10 circle and only one selected opposing
team, rather than the native cell scan and alliance filtering.

## Bounded implementation

`computerAttackTargetsRemain` now uses the existing `computerResponseWorld`
projection and `collectDefenseTargets`, exactly as the defense caller does.
There is no new copy of the native filters and no newborn scheduler change in
this branch. The projection retains actual indexed cell order for registered
objects, with its existing browser-only fallback/list composition for objects
not represented in that index. Its existing health, inside-building, preparation
and owner projection boundaries are inherited, not newly proven complete native
world equivalence. In particular this is not a reconstruction of the original
mixed-object scheduler or all object lifecycle semantics.

## Regression boundaries

Supplied caller fixtures cover a registered transient flight-only owner and the
observed shared flight/fight owner, including checkpoint identity. Controls cover
native exclusion flags, conversion, completed matching disguise, alliance,
unlinked physical owners, non-Blue opponents, physical scan-edge relocation,
and independent ordered caps. The previous fake `flight={}` exclusion was an
adapter-specific proxy, so it is replaced by the native exclusion bit; a moved
public coordinate now also relocates the physical indexed owner.

The new14 controls fail10 cases on the unchanged parent and pass on the candidate.
The candidate also passes the existing raid controls and M3 defense/return
fixtures (37 focused tests total). The unchanged ordinary M6 Chumara regression also passes its original anchors,
phase16, health/casualty, retirement and producer reuse assertions. A separate
combined newborn+collector diagnostic still fails the original fixed8203 anchor
sample. A bounded deterministic cloned-world replay shows all three Warriors
reach the required anchor at8271, but then stops at a later phase16→6 transition
at8371 (retries32 on the preceding turn), before its requested+513 endpoint.
That combined newborn result remains a semantic hold; the later empty collection
and casualty timeline are not qualified by this correction. No assertion values
or phase obligations in the original M6 fixture change. Each query builds the
existing world/cell projection, so focused correctness tests do not establish
performance parity. Final-head full gates and independent review remain required.
No M19 airborne signed-life repair or broader native parity credit is claimed.
