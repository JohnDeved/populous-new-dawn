# Resting transport passengers

## Native behavior

The shipped Spy disguise command can finish while aboard. Its state17 idle
initializer (`0x4d6f90`, already ported) then transitions to state30. The shared
initializer previously rejected that state, crashing the simulation.

`decomp/generated/004d2740.c` switches directly on state. Case `0x1e` performs
`assignment |= 1`, sets speed to zero, and releases motion (`0x4ea460`). All shared
prelude/tail behavior remains necessary, including the speed RNG draw that occurs
before the body zeroes speed and the final animation choice.

`decomp/generated/004d32b0.c` instead switches on **state minus one**. Its case
`0x1d` is state30: return zero while the vehicle ID is nonzero, otherwise return
`defaultPersonState`. The executable jump table at `0x4d3d18`, index29, confirms
entry `0x4d38e4` through join `0x4d3ae1`. No person fields change in that body.
Case `0x1e` / `0x4d9080` belongs to state31 (burning panic), not state30.

## Verification

Run `python scripts/check-native-person-state.py "$POPULOUS_EXE"` after selecting
the existing native environment. The executable is verified by `native_cpu` against
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The extended initializer matrix includes 512 state30 cases, comparing full fixture
fields, RNG, tribe state and ordered callbacks against the maintained TypeScript.
World leaves retain the probe's documented interception boundaries. Previous state14
with a vehicle is outside this matrix's separate passenger-deselection boundary.
An additional 180 state30 dispatcher cases execute the actual body for all nine
models, four vehicle IDs and five game-flag values; the default-state leaf runs
natively and the probe verifies no person-field writes. Shared dispatcher preparation
and tail are outside that bounded body proof. Research used Unicorn2.1.4 and
existing reviewed exports; no new Ghidra export or native asset was generated.

`node --test tests/transport-idle.test.mjs` stages a Spy's population/location beside
an authored Mission22 vehicle, then uses the shipped `command` boarding path. It
covers Boat disguise completion, 63-turn hold, repeated disguise, occupied checkpoint
continuation, Balloon state30 idle entry, and valid-ground detachment returning to
orders for one visit. Detachment calls the existing consumer directly; the test does
not claim a complete ordinary acquisition, sailing/landing or rendered UI journey.
The failure-first run reproduced `Unported person-state initializer 30` through the
real disguise/order-completion/idle-approach chain before implementation.

## Live integration and limits

State30 is initialized by the existing nested state17 transition. The world turn
holds passenger position while aboard and returns a detached passenger to its model's
default order state, ending that visit before the next idle body. Existing Spy countdown,
vehicle destruction/flight, order replacement and checkpoint structures retain ownership.

A separate earlier boundary remains: issuing disguise aboard a Balloon reaches
`configurePersonOrder`'s airborne destination branch, whose live `commandPosition`
consumer is unported. This change does not claim Balloon disguise command completion.
The Balloon test deliberately enters state30 through the already-ported idle initializer.
No transport ownership fields, lower-panel rows, vehicle AI or parity credit changes
are included. No complete native game execution or hardware-performance claim is made.
