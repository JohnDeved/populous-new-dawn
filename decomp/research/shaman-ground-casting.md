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

Authored, not yet executed: `tests/shaman-casting.test.mjs` checks raw table/link
identity for all tribes/directions; retained/out-of-range phase; wrapped facing;
current versus adjacent cell; velocity and expiry order; public rest/move/combat
handoffs; AI single initialization; six-versus-ten visits; checkpoint clone;
presentation-only visits; 30/60/120/144 Hz, irregular frames, catch-up, pause and
speed; admitted-projectile survival under replacement commands; recast stock
and distinct effect counts; airborne/protected exclusions.

Retain `tests/seated-casting.test.mjs` as the separately sourced historical seat
control. Required next review selects focused state/cast/clock/Blast/AI tests,
then standard check/build and the affected original-source and rendered browser
checks. No test/build/browser gate has been run for this draft.

Known gaps: forced/script airborne casting and incoming impulse/landing
interruption ownership are not established by this investigation; they are not
guessed here. Current-cell lookup uses the live building/Vault registry, not a
claim of complete native unit-land-array coverage for every object class.
Controlled regression actors are not an ordinary campaign acquisition witness.
No browser visual inspection or original executable execution is claimed.
