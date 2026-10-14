# Route advancement must launch passengers, not relocate them

## Static native owner

`decomp/generated/004eadc0.c` is the indexed native route-advance export.
Its disembarking branch sets the following ground waypoint as the destination,
propagates route index/destination to matching passengers, then repeatedly scans
matching slots and calls `FUN_004659d0(vehicle, person, destination)`.

The indexed `004659d0.c` clears vehicle association, clears seated state through
`004d8250(person,1)`, preserves the current position and applies horizontal160 /
vertical60 departure velocity toward the supplied destination. That destination
is not a new physical position. Existing `departVehiclePerson` and
`publishLiveVehicleLaunch` model this same native operation for command completion.
This investigation uses static original EXE data only; it does not execute/emulate
it or regenerate native oracle fixtures.

## Browser discrepancy and exact historical trace

The route-advance effect in `live-pathfinding.ts` instead called
`leaveLiveVehicle`, whose legacy relocation assigns the entire next ground
waypoint directly to the person. Other users of that legacy helper are outside
this correction.

The retained historical M10 input is turn3800 on source
`8e1b1494b7039c1940271465821a91462b4a2bde`, runtime-identical to merged main
`9f763cd4fe3d0a322acc9cf78bff36301f526785`. The input SHA-256 is
`0dc9273cca6214ca7ab3794d1f8c9f1e2be37145f5919c4fd02894969be77792`.
The original trace and source-bound receipt are archived under
`references/fixtures/m10-route-launch/`. They prove that turn3822 moves all five
passengers 50.7–51.5 world units in one tick: their craft remains near
(7.539,-15.016), while they appear at the following ground waypoint near(-9,33),
with no flight wrapper. The earlier endpoint and Totem receipts remain observations
of browser outcomes; they do not certify authentic crossing continuity.

## Narrow correction and acceptance

Only the route-advance departure effect changes: remove the exact physical
passenger slot using the native voluntary-departure helper, then publish its
existing flight/animation owner. Do not clear routes/orders, relocate actors,
move the Boat to hide the gap, or alter terrain. Repeated scans retain the native
promoted-driver behavior and terminate after every matching passenger has left.

`tests/route-vehicle-launch.test.mjs` replays the exact pre-transition historical
world through public synthetic-store Save/Load twins. Over100 ticks it verifies
one person clock per logical turn, exact native/cell ownership, all five matching
slot departures, retained shared command references and routes, flight publication,
continuous person/craft movement, living natural completion of the launch, and
honestly distant final positions. The two-world-unit per-frame bound is a generous
regression ceiling around this fixture's actual approximately1.047 maximum; it is
not a general native speed limit or a gameplay restriction.

This is a checkpoint-local lifecycle/trajectory proof. Earlier history, a new
ordinary island route, full M10 victory, rendered graphics, and hardware FPS
require separate evidence. No endgame checkpoint is repaired or treated as an
authentic campaign result.
