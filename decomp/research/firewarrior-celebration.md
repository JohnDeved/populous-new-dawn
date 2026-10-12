# Firewarrior victory point shots

## Failure and live ownership

At base `08a51df03fdbced4e959f65c178211f032af5495`, a supplied Blue
Firewarrior/outcome fixture reaches the normal `tick` victory transition at turn32.
The unchanged celebration controller chooses state41/substate2 at turn112; the
next tick throws `Live firewarriors are not yet implemented` from the projectile
callback in `app/live-people.ts`. This is a reproducible production-caller failure,
not proof of ordinary training or an earned campaign victory. The original failed
run is retained separately from the passing regression.

The repaired caller remains `world-turn → stepLivePerson → stepCelebration`.
No celebration-state, probability, RNG, order or outcome rule changes. The callback
passes the actual native person position/heading and the controller's elevated
point to `launchCelebrationShots`. Existing entity-target launches keep their
previous serialized shape and combat behavior.

## Source-derived contract

Sources are indexed in `decomp/exports.json`, from executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, Ghidra12.1.3.
Names/types are inferred; these are pseudocode exports, not recovered source.

- [`004e0af0`](../generated/004e0af0.c#L513): copies the person's position,
  advances1280 along heading, adds3072 to the signed height, then calls
  `0051fbf0(person, null, point)`.
- [`0051fbf0`](../generated/0051fbf0.c): requests two class8/model6 objects,
  passes the source, indexed side and point through allocation context, and applies
  the ordinary/tower/Bloodlust cooldown after successful allocation.
- [`004bbcf0`](../generated/004bbcf0.c): uses the explicit point as destination;
  source heading controls perpendicular minus/plus96 offsets. Starting height is
  clamped against terrain before source middle-height plus16 is added. The point
  branch marks only the second projectile with terminal mode2, rather than
  entity-damage mode1. Each allocated projectile uses object0x460/descriptor0x1d,
  speed512, and cue0xa1.
- [`004bbf30`](../generated/004bbf30.c): absent-target coordinates stay fixed except
  destination terrain-height clamping. Arrival requires each sign-extended axis
  difference to be strictly below1032 and 3D wrapped distance strictly below512.
  Even on the terminal visit, the projectile moves by floor(distance*15/16), then
  clamps its new height against terrain. Mode2 emits cue0xb2 without calling
  damage00514410; both sides are removed. There is no16-visit timeout in this path.
- [`00450520`](../generated/00450520.c) and
  [`004e6ac0`](../generated/004e6ac0.c) provide wrapped distance and signed-short,
  half-height movement. The implementation reuses their existing math adapters.

The point-shot union has no entity target ID. Its consumer cannot retarget or
apply health/building damage, even after source death. It uses independent point
records, tracks the second side for terminal audio, and survives structured-clone
checkpoint restoration without migration defaults. Old entity-shot records remain
valid and keep their existing16-visit adapter lifetime.

## Regression and proof limits

`node --test tests/firewarrior-celebration.test.mjs` covers pair geometry, signed
coordinate wrapping, caller destination/heading, cooldown and launch audio, strict
arrival and final movement, terrain clamping, a flight longer than16 visits, source
death, no entity/building damage, single terminal audio, retained entity launches,
and the real outcome/tick path through repeated volleys and checkpoint continuation.
The tests do not inject the firing substate. Separate retained firing-phase and
Bloodlust regressions protect existing entity-target behavior.

This change is source-backed point-shot integration, not a new native executable
comparison. The existing celebration oracle compares projectile requests with the
consumer intercepted. The existing Firewarrior oracle supplies entity targets and
cannot prove this point-target flight. Fresh original execution and rendered
ordinary-acquisition/victory acceptance are still required for those claims.

Native class7/model3 trail allocations, sunlight, allied-person wake flags, finite
native allocation failure behavior, full projectile scheduler ordering, and exact
render/audio playback remain outside this bounded adapter. Existing browser effect
allocation and non-tower middle-height-plus16 (80) offset are retained; entity combat is not
requalified. No parity or complete-specialist/outcome acceptance is awarded here.
