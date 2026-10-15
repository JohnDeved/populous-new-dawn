# Normal Hut newborn first scheduled visit

Static input: D3DPopTB.exe SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The original executable was inspected as data, not executed.

## Recovered ordering

- `generated/004ec6f0.c`: the primary mixed-object traversal caches the current
  object's `next_unit_1` before dispatching it through `FUN_004ed700`.
- `generated/00404c80.c`: an ordinary Hut birth calls the primary allocator for
  the newborn person, then allocates birth feedback and initializes the exit.
- `generated/004ed8a0.c`: primary allocation prepends the new object to
  `allocated_units`, rather than inserting it into the cached remaining chain.

Consequently, an ordinary newborn allocated by a Hut during that traversal gets
its initialization immediately, but no scheduled person visit until the next
turn. The browser's building pass appended newborns before its person pass and
therefore scheduled them too early.

## Scoped adapter correction

`world-turn.ts` records only normal Hut newborn object identities in a local set.
Their person body, health tail, fire-trail tail and arrival cooldown epilogue wait
until the next turn. Birth initialization, exit route, flash, sound, population,
cell registration, global cleanup and target-side interactions remain available.
The set is not checkpoint state and does not change training or conversion policy.
This is not a reconstruction of the complete native mixed-object scheduler.

`tests/hut-newborn-first-visit.test.mjs` reaches three simultaneous births from
unmodified authored M1 hut clocks, checks allocation pose and immediate feedback,
and verifies movement on the next turn. It also crosses the public Save/Load
boundary. Clearly labeled synthetic controls test tail exclusions and existing
actor processing; they do not establish naturally burning newborn reachability.

This independently verified scheduling gap does not establish a repair for the
unresolved M19 airborne signed-life overflow.
