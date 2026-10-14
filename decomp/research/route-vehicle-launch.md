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
`references/fixtures/m10-route-launch/`. The authoritative per-turn snapshots are
the receipt's immutable stdout JSON lines. The separately retained rows file
contains shared nested velocity/order references that its producer mutated in
later ticks; only its copied primitive position/ownership fields are historical
snapshots. Do not use that rows file to infer earlier velocity/order values.
The immutable stdout proves that turn3822 moves all five
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

## Physical landing expectations and campaign qualification

The first frozen full-suite run (`4f295f22`) covered 401 test files and 2,605
cases: 2,594 passed and 11 failed. Ten failures expected supported ground
immediately when a Boat's passenger list became empty; one expected the old
Mission5 landing turn922. Those assumptions omitted the native launch interval.
The failures remain retained, rather than reported as a passing aggregate.

The updated integration preparations explicitly observe the native flight alias,
seat retirement, continuous motion, once-per-turn person clock, unchanged health,
and real supported landing before their next input. Earned Mission5 now launches
at922, lands at926 and reboards at927 through unchanged public Save/Load twins.
The shared Mission22 preparation has four real physics ticks on each Boat launch;
its later Balloon acquisition changes the campaign clock and RNG history. The
standalone Boat voyage lands on its actual first shore at(-33.2890625,-57.13671875)
at1951, rather than pretending that a short launch reached its distant final goal.

Consequently, the fresh direct Tower105 attack now meets Warrior10 and loses its
Shaman at3870 before damaging the Tower. The fresh regression explicitly requires
that intact Tower, actual attack admission/departure/interception, cancellation
controls and complete person/order cleanup. The unchanged hash-verified historical
acquisition regression still requires Tower105 destruction and its later casualty.
These are distinct browser outcome witnesses, not native combat damage/death parity.
The original failure is preserved; no combat runtime, target health, guard population
or terrain was changed to manufacture a win.

A separate fresh public-start M10 replay on the runtime-identical `4f295f22`
reaches genuine mainland with all five healthy at5796 and the second Totem at6527,
with its ten Erosion effects and retired deadline. Every person/craft movement is
checked per tick; settled boarding uses the existing adapter's separately bounded
seat attachment. The last idle driver departs through another ordinary ground
command and real flight. This supplies authentic transport and Totem integration;
full mission victory, exact native boarding parity and rendered/FPS claims remain
outside this result.
