# Boat movement completion and per-person ownership

## Observed ordinary Mission9 blocker

On main `c44dadfc91ba5bdca9b97552c84e42ebff63d62f`, public play earned
Land Bridge, crossed to Vault190, unlocked the Boat House, built House1023,
and produced Boat3375 with Brave139. A second Brave308 could not approach the
craft through the workshop footprint. Ordinary sailing to clear the dock exposed
a different, reproducible ownership error.

From the verified turn16546 checkpoint, cancel308 to(-103,-79), then issue a
plain movement command to139 at(-117,-83). At16650 the command3 fallback in
`live-movement.ts` ejected the whole crew while the Boat was still moving32 in
open water. Its actual position was(-114.765625,-84.58203125). The empty craft
was not `vehicleReady`; public reboarding did not recover after2000 ticks.
The diagnostic call stack identified the command3 fallback, not the independent
route-ground-leg departure callback. The original failed playthrough and the
instrumented104-tick trace remain historical evidence; neither is a passing
candidate qualification.

## Native owners and exact boundaries

Static research uses the retained D3DPopTB.exe data image, SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The executable was not run. Checked-in generated exports and static disassembly
of the missing controller bodies establish these owners:

- `004336c0` command3 completion is vehicle-model agnostic. Every fourth person
  counter compares the actual craft position with that person's native goal,
  with strict353 per-axis distance. Existing `stepMovementOrder` owns this test.
- `00432590` final-tail departure requires person flag10000000, or order64
  without128, except command22. Plain0 and Ctrl128 complete aboard. Shift64
  requests per-person departure; Ctrl+Shift192 retains the queue behavior.
- `004eadc0` independently permits departure when a vehicle route changes to a
  ground leg. A plain land destination can therefore cause legitimate route
  departure. Staying aboard at command completion is not a blanket prohibition
  on every departure during plain movement.
- `00463780` dispatches Boat moving state3 to `00463f20`, and Balloon state4 to
  `004641d0`. Boat `00463f20` calls driver selection `00466760` at00463fb2.
  Resting Boat `00463e80` also uses this selector. It cleans physical seats,
  promotes eligible queued owners, and preserves independent person counters.
- The Boat zero-desired-speed tail calls `00466a20` at00464196, followed by Boat
  motion `004e7fb0`. Ordinary decay is trunc(speed*22/32), with values below6
  becoming1. The collision-countdown24/32 branch is outside this composition.
- At speed<=1 the Boat zeroes displacement and checks exact512-cell centering
  plus `004650d0` approach suitability. Suitable open water is allowed. It does
  not require coastal disembark readiness for every rest position. Otherwise
  `00466fc0(vehicle,12)` uses `00464ce0` landing search, centers its returned
  point even on search failure, snaps within strict13 per axis, or advances12.
  This centering operation preserves height. Successful rest-state1 entry
  separately calls `00463370` -> `00463750`, raising height only if below
  terrain; the completed-rest branch uses that upward clamp.
- Ordinary coasting height is separately supported: `004e7fb0` at004e88d2
  tests WORD[vehicle+4b]==0, calls terrain interpolation `0044e940` at004e88e3,
  and stores AX directly to height+41 at004e88e8, including a decay tospeed1.
  The flags2&4000 early exit and nonzero+4b exception remain outside this
  bounded ordinary projection.

The retained static disassemblies are the463f20,466fc0,466a20 and4e7fb0 owner
records used by the independent source review. No inferred native arrival radius,
coastal veto, passenger teleport, or fabricated terrain/resource state is added.

## Bounded live composition

Boat and Balloon movement selections now share the existing public command
producer, including mixed ground/vehicle selections and shared record references.
Every seated person's command3 is consumed independently through the existing
native order controller. Voluntary final-tail departure uses the existing
per-person launch/physics owner. Panel unloading and route-ground departure
remain their separate existing owners.

The shared selector is explicitly limited to supported live models1 and3.
It requires the exact Unit/native/object-cell owner. Workshop production now
registers a Boat's driver before boarding, as Balloon production already did.
One browser world pass permits at most one craft movement even if a later
passenger becomes driver during that pass. Counters are never synchronized.

The zero-desired-speed adapter reuses the retained ordinary decay and approach
leaves. Active movement and coasting still use the browser fixed-vector/heading
projection. Native `004e7fb0` steering, collision, route visitation and height
composition, `00463e80`/`00466d90` resting cadence, and complete class4 dispatch
are not claimed. Native Boat production funding also remains distinct from the
existing600-occupied-turn browser recipe. These limitations must not be hidden
by the corrected command-completion semantics.

## Validation scope

Supplied control fixtures exercise plain/Ctrl/Shift flags, mixed selections,
independent owners and once-per-pass motion. Existing ordinary repeat-Boat
production tests cover real workshop output and checkpoint continuation.
The Mission9 diagnostic preserves the earned world: the initial plain sail
retires its order aboard and settles at native goal37632,19712; a second public
move(-117,-81) takes the actual ground-route departure, leaves a ready craft,
and permits public reboarding of139 and308. Final qualification must rerun on
the frozen reviewed source rather than relabel dirty diagnostic receipts.

This work does not bind Mission9's later scripted AI, prove rendered-browser
controls/storage, or establish full native transport parity.

The previous Mission5 earned-Boat test expected the obsolete plain-command
mass ejection and an unready empty craft. Its failed old-position assertion is
preserved as a diagnostic. The requalified maintained route keeps the exact
new24-tick position, waits for the public plain return to retire aboard at916,
then issues a separate reachable dry-land move(-39,-59). Actual route departure
at922 preserves50HP and leaves a ready craft; public reboarding completes923.
The same public Save/Load twins continue through every tick. A diagnostic Shift
click at the unsuitable original open-water point killed the follower and is
not used as successful landing evidence.

## Downstream Mission22 requalification

The full frozen916 run retained ten failed tests whose acquisition expected
plain Boat water-stop mass ejection. Current tests instead verify real dry
route-ground departures at(-25,-61) and(-83,-59). This changes acquisition from
historical2206/counter158 to2471/counter167 and therefore changes later phases,
world RNG and combat chronology. Exact spatial input points and native order,
owner, target, reference and checkpoint assertions remain checked.

These Mission22 setups directly supply spell-focus masks. They are explicitly
campaign-derived supplied-focus fixtures, not fully ordinary public acquisition.
The separately qualified Mission9 route supplies the ordinary public-input
transport/victory witness.

Most current continuations retain their previous structural result with measured,
nonuniform timing changes. Two combat scenarios change materially: fresh plain
attack is intercepted by guards instead of killing Preacher17; fresh Tower105
attack first encounters Warrior10 rather than11. Their current-source tests
assert the actual target handling, encounters, outcomes and cleanup. Separate
[historical supplied-focus checkpoint continuations](../../tests/fixtures/mission22-historical/README.md)
retain every original strict Tower105/Warrior11 and Preacher17-victory assertion.
The historical producer was independently reproduced with identical full-world
hashes. It is browser-port history, not native execution or current fresh-route
coverage. Failed idle/ground phase probes remain diagnostic failures and are not
accepted as restored historical phase or successful outcome controls.
