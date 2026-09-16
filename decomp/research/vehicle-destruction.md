# Vehicle damage and destruction

Evidence uses executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Static executable bytes establish the damage storage and gates; reviewed Ghidra
pseudocode establishes the existing class-4 controller boundary. The focused native
probe executes damage, destruction-state selection, and immediate full-capacity
passenger ejection; downstream terrain-dependent passenger fate remains open.

## Damage and life

`00466f00` is the complete vehicle-damage consumer used by Blast `0050b740` and
Lightning `00514410`. It returns without changing the vehicle when level flags 2
contain `0x04000000` or the attacker tribe equals owner byte `+0x2f`. Otherwise it
subtracts the amount's low signed 16 bits from vehicle word `+0x98`; it records no
attacker and does not inspect alliances, model, state, or shields.

Vehicle descriptors start at `005a7938` with a 23-byte stride. Models 1 and 3 both
store 8000 at descriptor `+0x00`; shipped `constant.dat` overrides both values to
5000 before `00463ba0` copies that word to vehicle `+0x98`.
`00463cb0` decrements every nonzero value once per vehicle pass. Positive life is
restored to 5000 when the vehicle has speed or passengers, so separated ordinary
50-point Blast hits do not accumulate against an occupied vehicle. Exact zero is a
sentinel and does not enter destruction; a pass beginning at 1, or a negative signed
result, does.

## Destruction and passengers

At the life boundary, descriptor flag 0 sends a model-1 Boat to state 5 and flag 1
sends a model-3 Balloon to state 6. Both state initializers in `00463370` stop the
vehicle and repeatedly call `004659d0` until every passenger slot is empty.
`004659d0` clears the person's vehicle link, restores speed, applies 160 horizontal
and +60 vertical velocity, selects the exit animation, and promotes a replacement
driver only while passengers remain. Person life and state are not killed by the
transition. The browser ejection keeps the recovered flag masks, randomized person
speed, Boat/Balloon heading and coastal exit-target search, and target-directed
160/+60 velocity.

`00466190` selects that shared exit target before the passenger loop. On ordinary
terrain it projects 512 units along Boat heading or 1024 for a Balloon. A coastal
cell first uses its terrain direction and perimeter offset. If the point fails
`00518200`'s coastal resting-cell check, it tries the next seven 256-angle directions
at 768 Boat or 1024 Balloon units, then falls back to the vehicle position.

`00463780` state 5 sinks a Boat by 8 height units per pass before shared removal (or
uses its immediate terrain/effect branch). State 6 raises a Balloon by 80 per pass
until height exceeds 1023, then uses the same remover. The browser keeps the
destruction mesh visible while making the vehicle unavailable to picking, routing,
and boarding; a Boat on supported coastal terrain takes the immediate removal branch.

## Proof boundary

Static bytes directly prove `00466f00`, descriptor values, and the relevant
`00463ba0`/`00463cb0` branches. The existing Blast oracle intercepts `00466f00`, so
it proves dispatch and the amount 50, not storage or destruction. Reviewed exports
and the focused non-recording probe prove state ownership and immediate ejection for
a full Boat (5 passengers) and Balloon (2): every slot and vehicle link clears while
person state 1 and life 1000 remain. The probe supplies exit-target search, animation
data, and generic initialization leaves, so it does not prove eventual survival or
death over representative water, coast, and land cells.

The browser check uses the authored active Mission 10 Boat, naturally ages its empty
life through ordinary turns, changes only its owner because supported content has no
enemy vehicle, and casts Blast through rendered keyboard/mouse input. It proves live
damage, state-5 checkpoint persistence on a fresh page, visible open-water sinking,
and mesh removal. Occupied ejection remains native/portable evidence rather than part
of that player-input check.

The probe command is:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-vehicle-damage.py \
  work/orchestration/ceo-release/mission2/d3dpoptb.exe
```

It exits 0 after checking damage gates, signed boundaries, shipped 5000 occupied
reset, exact-zero behavior, model states 5/6, and full-capacity immediate ejection.

The browser command is:

```sh
POPULOUS_URL=http://localhost:4317 node scripts/check-browser-vehicle-destruction.mjs
```
