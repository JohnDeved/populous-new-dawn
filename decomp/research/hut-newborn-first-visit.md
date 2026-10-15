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

## Campaign re-observation boundaries

The initial whole-suite run passed 2645/2665 tests; its 20 failures are retained
as failed evidence. A first divergent newborn visit changes later movement and
simulation random history, so a later timestamp is not automatically safe to
replace. Each changed observation must retain the original gameplay, ownership,
health, cleanup, and checkpoint obligations.

The reviewed M12/M16 training/staffing observations retain earned counts,
destination identities, complete owner cleanup, and full replay. The legacy
markerless M6 case now explicitly verifies the two healthy original Warriors
released during native state33 settlement, then the three remaining admitted
owners sharing model3/ref3. All five original identities and health values remain
checked through final release and the full 145-turn replay tail. These cases and
the new newborn controls passed 27 focused tests.

The mixed M6 raid exposed a separate existing adapter defect: target availability
required every raid member to have command19, although mixed dispatch gives the
Preacher command17. With its cached entity gone, a living eligible Blue Shaman
four squared cells from the target was ignored and retries reached33. That fix
belongs to issue446; it is not disguised as a newborn fixture update.

The M23 Red population observation at turn 2585 was separately reconciled against
full paired birth/removal ledgers: seven initial actors plus five baseline or six
corrected ordinary Hut births, with no removals, exactly equal the final 12/13
identity sets. Corrected actor 392 was born from Hut 341 at 2423 and is a healthy
physical resident of Hut 313 at 2585. Active registry ownership, passive resident
slots, and builder work/roster ownership were qualified independently; passive
owners are intentionally not cell-registry owners. Both diagnostic runs retain
all original settlement checks, checkpoint equality and the 128-turn tail. Only
the Red population count changes; final maintained-file gates remain required.
