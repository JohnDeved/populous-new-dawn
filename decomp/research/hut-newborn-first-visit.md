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


The M22 queued-boarding case was paired through its complete 300-turn replay.
The plain grounded control completes command3 against the prepared native point
(7808,8064), using the strict per-axis model7 extent160 plus target extent56,
rather than a Euclidean distance from the original clicked point. Its assertion
now observes the actual reference retirement, unchanged payload, predecessor,
every-fourth counter phase, physical owner and command cleanup. Both runtimes
meet that native contract. The baseline plain control later dies from ranged
hits, while the corrected plain control survives; no unchanged survival outcome
is claimed for that unasserted control. The queued actor still reaches the
original clicked-point distance below1, boards with HP100.6 and retains exact
ownership/cleanup. The lethal route still encounters Warrior97 and dies with
all order and vehicle cleanup. Reviewed measured pins change fight1476→1460,
death1507→1485 and boarding1390→1375. Both source-bound diagnostic runs passed
all downstream assertions and full replay; final maintained-file gates remain
required.


The historical M22 Tower checkpoint separately retains input/cancel/departure,
Warrior11 interception, HP100.75, survivor position and anchor, physical ownership,
cleanup and every-turn replay through6429. Its reviewed target death5339→5350
and order retirement5340→5351 are the only changes accepted from that pair.
That first candidate file aggregate failed (3/4): the fresh cancellation control
rested at (16640,32512) instead of (16128,32512). The protected spatial assertion
remained unchanged at that stage, and the later continuation was not executed.


A subsequent source-bound fresh Tower continuation passes all obligations and
full replay through6429: input[3531,203], cancellation3551, departure3820,
fight3828/opponent10, intact Tower HP260, and Shaman death/order retirement3996.
Its cancellation control rests at[16640,32512], while the historical control
retains[16128,32512]. Paired actual command3 completion and original landing
search observations establish identical prepared goals and eligible landings
on opposite sides of cell16384 after existing browser coasting. This is a
qualified browser outcome, not a new claim of native coasting parity. Maintained
and final-head full gates remain required.

## Qualified Mission 6 alternate natural outcome

With the separately merged native target collector, the current fresh raid
converts Blue289→Yellow549 at8097,290→572 at8191,282→575 at8193 and291→595
at8246. Blue Shaman95 dies8269 after no other Blue population remains; the
existing reincarnation eligibility therefore schedules no respawn. The first
empty-target scene also has no hostile buildings and all seven linked Green
owners outside the native radius7 scan. Thirty-three empty retries lead to
phase6 at8371, with all four original actors sharing return command126/ref4.

Public Save/Load and full replay retain reference transitions4→3 at9071,
3→1 at9112 and1→0 at9116. This scene retires by timeout, not settlement:
elapsed1800→1801/phase23 at10233, inactive task/empty members at10234. All four
original owners remain healthy and registered, assignment0, no queued or
immediate commands, and home anchors[38144,53504]. No current natural producer
slot reuse is claimed.

A separately labeled complete historical pre-newborn8529 checkpoint retains the
original four real reincarnation-wave casualties, Blue kill credit, phase23
retirement and first producer-slot reuse through8702. The exact9f7a4758 producer
passed the entire unchanged original8016→8702 test before exporting. Its
provenance and producer receipt are retained with the compressed fixture; the
current-runtime historical consumer uses public Save/Load and full replay.
Both maintained files pass11 tests on the measured candidate; final-head full
gates remain required.

The M22 patrol pair preserves exact7168 position, returned-owner health79.7,
patrol order payload/reference accounting and full1100-turn replay. Individually
reviewed acquisition/return pins6166→6172,6179→6185,6617→6625 change;
6916 remains unchanged. Later unpinned observations differ (restored actor850
and HP79.25 versus849 and79 at7168), so this is not an unchanged full-world
outcome claim.

## Registered occupant damage and retained death6323 witness

The fresh earned Hypnotise route reaches cast eligibility6241 and effect6255,
nine turns after the old route. Real conversion retains actor825/HP35, but the
actual melee ledger changes: attacker364 replaces366 among attackers398/425,
with different hit ordering, health-scaled damage and regeneration. At6312 the
fresh actor hasHP16.9/remaining48; it is alive at6323 withHP9.55/remaining46,
and dies6331 fromHP2.1. Its existing native owner restores Red tribe and clears
Hypnotise before removal, with no restored replacement allocation. Full replay
through6721 preserves registry cleanup. This is not an unchanged damage history.

A complete source-bound historical pre-conversion world6246, produced by exact
9f7a4758 only after its unchanged full original test passed, separately retains
HP6.15/remaining47 and real death6323. Current-runtime public Save/Load validates
all original admission/ghost exclusions, conversion and same-owner restoration,
no replacement allocation and cleanup. The two maintained cases keep exact HP,
remaining and death assertions for their explicitly labeled routes; no threshold
was widened and the historical6323 obligation remains executable.

## Queued and plain balloon attack opponent sequences

Both current fresh routes retain their requested Preacher17 and first actual
contact with that target. The source-bound paired observer records actual guard
reinforcement and melee opponent writes, rather than treating every changed
`fight.opponent` as a new acquisition. Queued writes are
[3841,17],[3868,12],[3882,11],[3888,12], with departure3836/death3891;
fresh plain writes are[3845,17],[3858,10],[3863,11],[3871,12], with
 departure3840/death3872. Their prior sequences each had three entries; the
current four-entry sequences are explicitly different combat histories.
The qualified continuation executes full original replay and all targetHP55,
no-target-death, actor removal, registry, order-reference and passenger cleanup
checks. The separately labeled historical plain case is unchanged.


## Staged balloon branches and retained historical obligations

The current fresh idle command still requests Preacher17, but actual native
visit-phase ordering lets Warrior10 intercept at3872 after departure3867. The
paired baseline first reaches Preacher17 at3886 after departure3881. Source-bound
actual selector/contact calls retain the same forced-exit geometry and target.
The current browser melee history ends at3975: Warrior10 applies16.4 damage to
HP9.25, making browserHP0 while the same physical owner retains native life185.
The ordinary body and health tail skip the dead actor, then release its command
and remove its registry entry. This is the existing browser-owned lethal-damage
boundary, not a repair for native signed-life overflow. Full1200-turn replay
retains exact residual185 and all cleanup.

The supplied successor's +71 counter offset now completes the driver first:
command models[27,3] at3612 with counters[28,99], both27 at3613/[29,100].
The seat transfers at3641 and becomes empty3642; references follow the complete
[2,2]→[1,2]→[0,2]→[0,1]→[0,0] sequence, ending3862 with shrine use1.
All owners stay healthy/registered, and final command queues/immediate slots
and shared bindings are empty. The historical3566 input separately retains its
original passenger-first[3,27] ordering and every original exact transport pin.

Two complete source-bound historical worlds preserve the original mechanisms.
The3566 witness covers original staged/final-tail/Shift/successor branches and
idle acquisition through3886/opponent17 only. A full current-runtime continuation
from3566 failed at death3926 versus3917 and remains failed evidence. A separate
genuine3916 predeath world preserves actual death3917, retained owner227 and
complete cleanup/replay through4853. Each archive is exported only after the
unchanged original full baseline test passes. The maintained tests explicitly
separate fresh natural input, historical acquisition/transport, and historical
lethal cleanup, with no selected-actor repairs or widened thresholds.
