# Residential hut occupancy smoke

Issue 73 is a bounded PND10 presentation slice. It reuses the existing building,
occupancy, effect and HFX evidence and does not change admission, breeding,
building work, gameplay RNG, clocks, checkpoint state or panel behavior.

## Native producer

The completed-building controller `00403280` calls `0040c4e0` on the
building's 32-count phase. The relevant branch is player-tribe only and reads the
building's real `hut_people_inside` byte.

For residential hut models 1/2/3, the imported native capacities are respectively
3, 4 and 5.

At each `building.class_counter & 31 == 0` producer visit:

- zero occupants removes the retained occupancy visual;
- nonzero occupancy below the building's native capacity selects class-7 model 75;
- occupancy at native capacity selects class-7 model 74;
- there is one retained root visual, not one particle per occupant.

This is therefore a partial/full state, not a linear smoke-count mapping.

## Placement and frames

`0040c4e0` first allocates at the building inside point, but model 74/75
initialization in `0050c150` immediately finds the owning building and calls
`00404540` using the building's native capacity as the socket index. Residential
hut levels therefore use sockets 3, 4 and 5. The browser reuses the already
recovered `buildingSocketPoint`, including its socket height offset.

Both models use animation descriptor 40: a 16-frame mode-1 loop with step 4.

- model 74 sets object/HFX start `0x531 == 1329`, giving HFX1329-1344;
- model 75 sets object/HFX start `0x569 == 1385`, giving HFX1385-1400;
- every recovered frame is 32×64.

Model 74's root lifetime is -1, so the full-hut root persists until the building
producer replaces/removes it. Model 75's root starts visible with lifetime 16;
on expiry it hides rather than deallocating. While hidden, each later effect visit
uses the separate presentation RNG and becomes visible again when
`random & 15 < 3`, resetting the same 16-visit lifetime and animation frame.

## Secondary full-hut puffs: deliberately not claimed here

Model 74 also has a secondary child-puff producer: on
`effect.class_counter & 7 == 0`, `random & 31 < 2` allocates a child model 75
with the child flag set, and that child deallocates after 16 visits.

The phase is not safely reconstructible from the current browser presentation
state. Class-7 `class_counter` is initialized from global `start_24[14]`;
regular class-7 allocation increments that global because the class-7 descriptor
byte is `0x28` and does not contain the no-increment `0x10` flag. The browser
does not currently model the complete native class-7 allocation stream. Guessing
zero, tying it to render count, or deriving it from gameplay RNG would fabricate
timing.

This slice therefore restores the occupancy-driven **root** visual and its fully
proved partial/full lifecycle, but does not synthesize model-74 child puffs. That
remaining secondary phase is a separate allocator/presentation dependency, not a
reason to invent particle timing.

## Browser binding

The normal browser hut path already owns the required inputs:

- `b.counter` advances with the ordinary building turn;
- real admission sets living followers' `u.inside === b.id`;
- `world.cosmeticRandom` is the existing separate presentation RNG.

The presentation helper advances only by the delta in `b.counter`; render calls
with no building turn consume no RNG and change no root lifetime. The scene
binding samples real living occupants, uses the native capacity/socket, and
renders only the recovered HFX root sequence. A scene reconstruction initializes
the root from the current persisted occupancy because the browser checkpoint does
not serialize native class-7 presentation units.

## Append-only generated assets

The dedicated `scripts/import-original.py ... --hut-smoke-only` mode verifies
the existing provenance hashes for `pal0-c.dat`, `al0-c.dat` and
`hfx0-0.dat`. It decodes the existing owned RGBA atlas, starts new frames on the
next **row** boundary, and writes only:

- `public/original/effects.png`
- `app/original-effects.json`

The prior 2048×4608 decoded pixel rectangle is preserved exactly. Every existing
animation metadata entry/index is unchanged; only the overall height becomes
5632 and the new sequences occupy indices 144-175. The intentionally unused old
row cells 142-143 remain untouched.

This is not collapse/damage smoke model 76. The existing
`buildingSmoke` HFX1345-1360 path and its damage smoke lifecycle remain
unchanged.
