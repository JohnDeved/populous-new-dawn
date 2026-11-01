# Native attack animation ownership

Related to broad sprite-cadence issue #214; this is not an absolute original FPS
calibration or a complete melee, recoil, renderer or animation-family claim.
The later [recoil entry and push handoff](melee-recoil-animation.md) note covers
that separate, source-owned slice without extending this attack-only evidence.

## Ordinary defect and retained original contract

On main `f1b3d290afd3a48bed4eaa12d4ad56ca665e0287`, authored Mission 2 reached
combat through normal startup, Shaman selection and an attack command on Warrior
13. At turn 318 Shaman 54 entered `strike`, but its physical person retained idle
source 424 and `unitAnimationSource` returned null. At turn 321 Warrior 13's strike
retained source 48. Neither action initialized the native sprite; the renderer
substituted an elapsed-time sequence. These are CPU actual-clock observations,
not browser screenshots or original-game executions.

Retained `decomp/generated/00518fb0.c` shows the original model-8 fight controller:
substates 2/3/4 call `004d3ff0` with rows 10/8/16, respectively, then reset f1=1 and
f2=0. Their duration is `(descriptor.step + 1) * original frame count`; signed
countdown, damage, facing and sound already have separate live owners. Existing
`check-native-melee-timing.py` documents previously executed controller/timer
comparisons with supplied membership, damage and relocation consumers. No new
original byte read or native run is claimed here.

The existing ordinary-person logical gate and `004ee7b0` mode-2 updater supply the
frame delay. Imported descriptor 18 has step 1, so Firewarrior attack frames hold
for two logical visits; the former fixed 12 FPS fallback omitted that hold.
Other ordinary follower attack descriptors have step 0. The initial f1=1 holds
frame 0 through the entry turn's logical visit in all these cases.

## Bounded repair

The existing attack entry initializes the physical person's original row and
frames. An optional `Fight.nativeAttackAnimation` marker admits only those newly
initialized attacks to a visual-only native animation source. Gameplay queries
continue using the unchanged `unitAnimationSource`; only the existing animation
clock and unit-render caller use `unitRenderAnimationSource`. It also retains the
last native pose during the already-existing transition to approach, until the
next controller visit selects its movement/idle pose. Flight retains precedence.

Attack/strike/special action selection, damage, duration, RNG, target choice,
facing, expiry and sound code remain unchanged. Recoil and knockback keep their
current owners and are outside this slice. The marker is not inferred from a
matching sprite number. Existing active checkpoints without it keep their prior
fallback until a new real attack entry; new checkpoints serialize and restore the
person's phase and marker without replaying entry, damage or an animation visit.
No save version change or guessed historical phase migration is needed.

## Verification and boundaries

`tests/melee-attack-animation.test.mjs` covers the ordinary Mission 2 entry,
controlled six-class/three-attack row and delay cases, actual Scene frame selection
and render read-only behavior, active checkpoint twins, old active-save fallback,
flight precedence, pause and 30/60/120/144 Hz plus irregular schedules at several
game speeds. Supplied class/action fixtures are not ordinary Firewarrior
recruitment/combat evidence. The Node Scene check executes the real render caller
but is not GPU or hardware-performance evidence.

The repair does not recalibrate the shared 24 Hz presentation clock or change the
12 Hz simulation clock. Other fallback families, recoil/knockback phases and the
broader user report remain open. Source-bound checks, failures and the qualified
ordinary outcome comparison are retained with the implementation review receipts.
