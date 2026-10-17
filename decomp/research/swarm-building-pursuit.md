# Swarm building pursuit and ejection

Issue #61 continuation of `swarm-effect.md`. Static inspection of the executable
pinned by `decomp/tools.json` supplies `00510120`, `00511180`, and `005112d0`;
no original code was executed for this change.

The controller now preserves the complete building arm: phase-1 wander update,
64-visit acquisition across 167 spiral offsets around the immutable cast origin,
ten-ID history, one-stage-per-visit entrance approach, child outside/inside
movement, six physical occupant slots, four-visit dwell, child return, then
wandering. Common ground scans and the 200-visit lifetime continue throughout.
Acquisition does not enter stage 0 on that same visit. Invalid targets only return
the parent to wandering; they do not invent a child reset.

Child target movement uses separately sign-extended coordinates, strict Manhattan
distance below 200, mode-1 half-delta velocity initialization before arrival,
signed-word acceleration before the +/-64 clamp, and existing terrain-height
projection. The parent entrance threshold is strictly below 112 on each signed
axis. Stage 7 consumes ten signed-nine-bit jitter draws per surviving child;
stage 9 consumes three masked-seven-bit motion draws. Arrival/hidden bits drive
the waits and the existing sprite visibility, rather than a guessed duration.

The building ejection arm gates on occupancy count, traverses six live physical
slots, and reuses `leaveBuildingEntry` for admission, person and indicator
ownership. Ordering is removal, flags2-bit16 clear, panic unless protected,
ghost removal adapter, damage100, then Spy reveal. The common ground scan may
subsequently affect newly ejected people on the same visit.

## Ordinary witness and bounded acceptance

`tests/swarm-building.test.mjs` earns a Swarm shot in Mission 22, uses actual
movement commands to get within range, and casts beside occupied Red Hut92.
The existing mana-focus mask is an explicit setup fixture; no shot, actor,
position, terrain or occupant is supplied. The first eligible source spiral cell
(index7) uniquely contains Hut92, with actual residents138,202,254. The test
requires ingress before ejection/damage, cleared physical occupancy and exact
person registry, return to wandering, expiry, and public Save/Load continuation.
Comparison normalizes only the established missing reward defaults on Mission22
shrines0/2, on copies; it does not claim raw checkpoint or IndexedDB/UI rendering.

Building class-2 cell chains are absent from the browser adapter. Same-cell
building selection therefore retains roster order; the unique-cell witness does
not establish arbitrary native chain ordering. Live building and resident lookup
retain browser hp>0 eligibility, excluding zero-life still-allocated native
objects. Particles retain allocation ordinals rather than original object-pool
indices. Person physics, ghost deletion lifecycle and building point/terrain
adapters remain existing projections. No native runtime or rendered parity claim.

Existing ground Swarm tests remain acceptance controls. Source requires wander
RNG before acquisition and the common ground scan; the previous combined motion
helper ran that wander update after the scan. This change composes the native
order without replacing ground eligibility, damage or panic behavior.

## Requalification of existing transport routes

The first standard check failed five maintained Mission22 transport expectations.
Their shared acquisition route casts Swarm beside empty BoatHouse94, which is a
valid enemy class2 target (occupancy is not an acquisition condition). At1311 the
new controller acquires94; stage0 and stage1 replace wandering visits, so the first
RNG difference at1313 is the skipped old wander draws. No transport runtime changed.
The original staged detour subsequently reaches its waypoint but is intercepted
by Warrior97 at1473, fights97/98 and dies1506 with retired references, instead of
boarding. This lethal route is retained as evidence, not reclassified as boarding.

Independent source-bound transport replays retain public checkpoint and ownership
assertions: tower105 selection/departure4256, Warrior11 interception4262 and
Shaman death4297 (tower260 unchanged); queued person17 departure4272/fight4273,
target death4505 with Shaman aliveHP96.35 at4580; plain person17 departure4276/
fight4277 and Shaman death4302 (target55 unchanged). Worship now rejects through
3992, admits3993, lands4033 and grants exactly one reward4234. These are observed
browser campaign outcomes, not original-game trajectory/timing equivalence.

Acquisition excludes class9 preparation plans, using the same browser class
projection as building combat. Partially built allocated class2 objects remain
eligible; progress alone is not a native class test.

The maintained successful staged boarding path uses the actual approach waypoint
(22,-39), reaches within0.65 browser units and boards at1387 with HP100. Its
waypoint-only control, exact native/registry owner, both retired references,
legacy missing-b payload and public checkpoint replay remain asserted. The old
western detour remains a separate ordinary branch in the same test, with exact
first opponent/death, waypoint visit and complete ownership cleanup asserted.
