# Mission 13 Balloon transport

## Native identity and production

Evidence uses executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Building descriptors at `005a7228` (76-byte stride) link model 15 to class-4
model 3 and model 16 to model 4. Vehicle descriptors at `005a7938`
(23-byte stride) are byte-identical for models 3 and 4:

- capacity and passenger layout: 2;
- landed and occupied states: 2 and 4;
- rest height: terrain + 560;
- production work: 1000;
- descriptor flag 1: airborne behavior.

Reviewed producer `00406600` handles Balloon Huts through the ordinary completed
vehicle-house path. It requires an eligible occupant, 1000 accumulated work, and a
shape cell flagged `0x10`; it allocates model 3 for model 15, boards the worker,
resets production work, and leaves the producer available for another cycle. Native
player-type 1 producers eject remaining occupants after launch; this runtime maps
that type to computer tribes. Fresh allocation leaves Balloon
physics at index 0, whose native speed-table value is 40.

## Flight, landing, and passengers

`004641d0` is occupied Balloon state 4. The slot-0 passenger owns the route and
shared steering while `00465ea0` keeps all passengers at the model-2 attachment
offsets. Balloon destination adjustment does not require Boat water/coast flags.
Landing requires centered coordinates, no terrain flags `0x204`, no other vehicle,
and no existing land reservation. It enters descriptor state 2 and rests at terrain
+ 560.

Shared passenger removal accepts a Balloon exit cell without flags `0x206`, uses a
1024-unit airborne exit offset instead of the Boat's 512, clears the vehicle link,
restores person speed, and promotes a replacement slot-0 driver when needed.

## Browser integration and checks

Mission 13 now naturally charges and casts the three Land Bridges needed for the
ordinary guarded-Shaman route to the authored Balloon Hut reward, using a rendered
Swarm to cover the Yellow-side crossing, then worships,
places and completes the Hut through the shipped building UI, produces model 3,
boards through rendered input, preserves an occupied Balloon through a fresh-page
checkpoint reload, and flies, lands, and disembarks through canvas commands. The focused
portable regression is `tests/mission13-opening.test.mjs`; the full live path is in
`scripts/check-browser-mission11.mjs`.

Run the descriptor check with:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-balloon.py /path/to/d3dpoptb.exe
```

The checked-in exports are Ghidra pseudocode, not recovered source. The descriptor
check proves exact static fields; the producer interpretation also reuses reviewed
`00406600`. Browser evidence owns construction, recurring production, persistence,
rendered controls, and full-world integration. Exact native per-tick steering,
combat/death, audio, Balloon Hut source artwork, and model-3 Balloon artwork remain
outside this slice.
