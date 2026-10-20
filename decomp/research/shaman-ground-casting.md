# Ordinary Shaman cast ownership

Source base: `655e5d6cc0368eee73c3ccf9006d0fd2d5775626`.
Relevant existing tracking: [sprite coverage #27](https://github.com/JohnDeved/populous-new-dawn/issues/27)
and [timing #214](https://github.com/JohnDeved/populous-new-dawn/issues/214).
This is a bounded correction to the ground/retained-seat cast handoff, not an
all-spell or all-interruption parity claim.

## Independent original evidence

Only static reads/disassembly were used. The original executable and installer
were not run or emulated. Verified executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The fixture `tests/fixtures/shaman-casting-native.json` records the executable,
VSTART and VFRA hashes, raw table locations, descriptor bytes and all 32 original
tribe/direction frame chains. It was extracted directly from PE sections and ANI
bytes, without calling production helpers or copying imported expected values.

- `generated/004c1b80.c:57–80`: unless `flags2 & 0x100000` protects the person,
  save previous state and enter state 22. There is no seat/command 18 restriction.
  The apparent old-state release, `004ed6f0`, is a no-op. After attempted admission,
  face the allocated spell point using signed-short wrapped deltas; update
  `turnAngle` only under bit128, always set heading, and reverse visible angle
  under bit0x8000.
- `generated/004d2740.c:206–217`: speed0; `004e96f0` zeros horizontal velocity;
  `004e96d0` clamps negative signed vertical velocity. If neither a vehicle nor
  the current-cell lookup is present, select upper object109 and timer10.
  Otherwise select cargo row4/standing row0 through `004d3ff0`, including its
  existing airborne row2/12 override. Entry does not release the movement route.
- `generated/0040a3f0.c` (community name `get_adjacent_unit`) and static objdump
  at `0040a3f0`: argument0 tests the CURRENT terrain cell's flag0x200, then
  `unit_land_array[cell.unit_index_2 & 0x3ff]`. This is not a neighboring-vehicle
  scan. The earlier seated research note's “adjacent-but-unseated” wording and
  “release motion” initializer description are superseded by these raw leaves.
- PE `005a6858 + 109*4 = 005a6a0c`: source520, descriptor14. Descriptor14 at
  `005a6af8 + 14*11` is `0a000000020000f0000000`: mode2, step0, hold0, reset0.
  State22 flags at `005a6f79 + 22*5` are0x241, suppressing the speed RNG draw.
  Object93 happens to share this source; that does not give its level-start
  caller ownership of every casting context.
- VSTART520/528/536/544 plus direction0–7 selects the four tribes. VFRA next-link
  traversal yields 382 frame references: 12 in every direction except green
  directions1/7, which have11. Upper setter `004d4040` retains valid f2 and
  resets it only if it exceeds the selected source's loaded count. `004ee700`
  resets f1 for this hold0 descriptor, not all f2.
- `generated/004d32b0.c:227–244` (state-minus-one case0x15): after preparation
  and physics, decrement signed timer. On `<1`, stop/clamp velocity, speed0,
  restore standing/cargo row, and `004e9dd0` sets destination/goal/turn position
  to self while releasing the route. If animationMode is nonzero, `00432520`
  adjusts an occupied building cell to its outside point, `00402e70` centers the
  anchor in a 512-unit cell, and `004d3e00` releases the route and requests heading.
  `004d3e30` then resets motion and, unless protected, initializes the model's
  default state (Shaman 10; Armageddon 39). The raw expiry disassembly is also in
  `m16-seated-casting-evidence/004d32b0.asm` and `004d3e30.asm`.

## Shipping failure and correction

Public pointer casting travels through `scene-input-runtime.ts` to
`live-command.cast`, then `spell-casting.beginCast`. Before this correction only
native seats or command18 entered state22. Ordinary casting used a six-turn
browser wrapper, leaving a retained rest/movement/combat source authoritative or,
with no native render owner, falling back to the single-frame source648 alias.
Neither path is the state22 source520 mapping proven above.

`person-casting.ts` ports the bounded native entry/facing/expiry bodies.
`live-people.ts` supplies current-cell lookup, existing physical ownership,
route/anchor leaves and one preparation/physics visit. It rechecks the state
after preparation rather than decrementing a replacement controller's timer.
`beginCast` admits grounded people and retains the existing seated/command18
boundary for other owners. Public task release preserves the existing physical
person; AI allocation no longer initializes the combat person twice.

The renderer already uses `unitRenderAnimationSource` and
`shamanNativeDirections(team, source)`, then native f2 rather than elapsed age.
`game-clock.ts` already advances gated person animations once after each completed
logical turn, independently of 24 Hz presentation and uncapped rendering.
No importer, atlas, shader, or clock change is needed here.

The six-visit projectile, cost, stock, cooldown, targeting and effect bodies are
unchanged. Pose completion is ten visits. Ground state22 now participates in the
existing cast-state eligibility check, including the existing unlimited-range
bypass; it does not broaden unrelated flags or range rules. Action ownership
lasting ten rather than six visits is an intentional native lifecycle correction,
not a claim that all surrounding AI/gameplay is unchanged.

## Regression plan and limits

`tests/shaman-casting.test.mjs` checks raw table/link
identity for all tribes/directions; retained/out-of-range phase; wrapped facing;
current versus adjacent cell; velocity and expiry order; public rest/move/combat
handoffs; AI single initialization; six-versus-ten visits; checkpoint clone;
presentation-only visits; 30/60/120/144 Hz, irregular frames, catch-up, pause and
speed; admitted-projectile survival under replacement commands; recast stock
and distinct effect counts; airborne/protected exclusions. Explicit expiry
controls cover cargo, airborne rows 2/12 and reverse-facing-bit clearing. Live
controls mask high building-ID bits and verify physical owner/cell linkage.

Retain `tests/seated-casting.test.mjs` as the separately sourced historical seat
control. Required next review selects focused state/cast/clock/Blast/AI tests,
then standard check/build and the affected original-source and rendered browser
checks. Source-bound execution receipts, including failed fixture attempts, are
retained under `work/orchestration/shaman-casting/`. Full hosted verification and
rendered-browser acceptance are separate from the bounded portable/TS7 checks.

Known gaps: forced/script airborne casting and incoming impulse/landing
interruption ownership are not established by this investigation; they are not
guessed here. Current-cell lookup uses the live building/Vault registry, not a
claim of complete native unit-land-array coverage for every object class.
Controlled regression actors are not an ordinary campaign acquisition witness.
No browser visual inspection or original executable execution is claimed.

## Hosted-failure repair and causal boundaries (2026-10-20)

### Camera-relative cast direction follow-up

Hosted candidate `11447bf4` reached both real casts but rejected ordinary crop
directions0/1 at turns166/167. Every recorded active frame already matched its
reported direction's original VFRA/flip. The old observer did not retain camera
bearing or native/unit heading, so that artifact alone cannot identify which
projection input changed, nor independently prove its reported direction.

A bounded ordinary Mission1 CPU replay, using the natural opening, public Skip,
selection and cast at turn164, demonstrates native turning during state22:
entry angle703 remains on visit1, then447/191/1983/1921 on visits2–5 while the
original ground destination remains0,0. This is not an original-game execution
or a reconstruction of the browser's missing heading samples. Original `004c1b80`
only replaces the direct turn target when flags2 bit128 is set. Ground physics
`004e6d00` requests a turn every fourth class-counter visit and retains the
destination during casting. The verified executable's physics18 turning field
at `005a7d64` is `00 01`, signed-short256. The regression independently applies
that bounded turning rule rather than calling the production turn helper.

The observer now retains actual camera bearing, unit heading, native angle,
native heading and destination. Each active rendered frame must independently
match `004673b0`'s signed-short camera-relative bucket, match the native person's
angle, and resolve the original directional VFRA/flip. Thus two crop directions
may differ only while each has the correct projection and artwork. Missing input,
stale native angle, wrong camera bucket, wrong source/flip, and internally
consistent but incorrectly projected artwork fail closed. All original stock,
source520/draw14, retained phase, logical cadence, two distinct crop phases,
visibility, pause-hold and twelve-visit completion assertions remain.

The hosted candidate at `c811fcc5` exposed one real double-visit bug: command18's
suspended opening controller still incremented `site.counter`/`p.counter` before
the newly active state22 physics visitor. Original `004ec6f0` increments the
person's class counter once before dispatch. `level-start-runtime.ts` now leaves
suspended visits to the actual person and resumes its snapshot from `p.counter`.
The existing interruption, completion and Save/Load tests remain unchanged.

The remaining post-cast differences must not be treated as arbitrary new native
oracles. A paired Mission22 acquisition trace was replayed from main `440598b0`
and this candidate using the same ordinary commands and supplied focus mask.
The recorded Shaman/RNG fields are identical immediately before Swarm at turn1289 (RNG208323085,
position18.62109375,-46.30078125, counter9). The first changed operation is cast
admission: old state10/object616 remains versus native state22/object520/timer10.
Both projectiles still launch after six visits. At visit7 old code has initialized
idle19 and consumed its two speed draws; corrected state22 remains timer3. RNG
therefore differs at1296 (old3096154387 versus corrected1604970295). At1300 the
aggregate RNG converges again, but draws were consumed by different actors/effects
on intervening turns, and native facing retains674 rather than old675. Equal final
seeds do not imply equal per-actor outcomes. The raw paired trace and exact replay
script are retained under `work/orchestration/shaman-casting/diagnostic/`.

Independent source explains that divergence, not the observed output alone:
`004d2740` suppresses speed draws for flags0x200; original state22 flags0x241 and
state10 flags0x1b04 suppress them, while states17/19 flags0x180a consume one each.
`004d6f90` can initialize19 immediately from17 in the same cell. The new bounded
regression checks no RNG/counter drift across all ten actual cast visits and the
two original-formula idle draws only after expiry. `game.test.mjs` now expects
only the enemy's two idle draws during projectile travel, preserving exact flight,
particle counts, impact and presentation assertions. Its isolated population-scan
fixture now resets the actual native cast owner rather than only `u.casting`.

The supplied-focus Balloon flows retain exact current-state timelines, physical
ownership, all arrival/boarding/departure, target acquisition, death/retirement,
reference counts and checkpoint assertions. Acquisition's later Bridge idle
release shifts their flight inputs by four turns; combat participants/damage can
change because of the earlier RNG-consumer order. Historical checkpoint controls
are not rebased. Mission22 Boat damage now lands at1354, queued safe boarding at1376,
and the lethal contrast still dies with full queue/registry cleanup. These are
strict reproducible port-continuation traces, not newly claimed original-game
combat or full-campaign timing parity.

Mission2's old single Brave defender now loses, so waiting longer cannot witness
an enemy casualty. The test instead sends an already trained Warrior by the same
public attack command and retains the exact original recruited cohort, one actual
death tick, exclusive cleanup and Blue kill credit. The observed cohort is already
in fallback14 after regroup, not the previously assumed first-launch fallback18.
Mission3's raid recruits and engages correctly but leaves one original Brave alive
at the attacked settlement; the trained Blue Warriors now receive ordinary attack
orders to finish each surviving original member. Neither test injects health,
entities, fight state or outcome, and neither accepts survival instead of death.
Mission6 retains authored staging, marker16 Bridge allocation, real terrain
connectivity and every-tick checkpoint equality; its end-to-end deterministic
trace is now turn7339 rather than8404 after the global AI RNG-consumer change.

The flame-cell full-campaign snapshot changes with cast timing, but now has a
separate local original-formula oracle: `004d2740` state26 consumes speed and
panic-direction draws, then `00408840` consumes a burn-trail draw per retained
person in actual cell-list order. This checks each person's exact outcome and the
aggregate RNG from the pre-ignition seed, independent of production RNG helpers.
No native executable was run/emulated, no imported sprites were rewritten, and
no original-source timing was shortened to preserve old browser-only snapshots.
