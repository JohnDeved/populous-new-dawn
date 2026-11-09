# Convert Wild conversion flash

Bounded correction from base `655e5d6c`: ordinary Convert Wild used the unrelated
birth HFX1441 family. Its replacement now uses the existing imported HFX1240–1247
conversion sequence, one neutral visual allocation linked to the new Brave. No
recruitment, targeting, allocation count, cue5 ordering or gameplay RNG changes.

## Original evidence

Original `d3dpoptb.exe` SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Only static file reads/disassembly were used. No installer, original code or
emulated original function was executed.

- `00512350` calls `004d7fd0` at `0051256c`. The latter allocates a new Brave,
  then neutral class7/model58 at the old Wildman's point, emits cue5 and stores
  the replacement handle at effect+0x72. The spell does not emit the separate
  owner flash used by the level-start caller `0050c840`.
- `00509c10` switches on model minus one. Case0x39 at `0050a10e` grounds the
  effect; sets state45, draw45 and HFX1240; sets remaining8; zeros +0x5f/+0x72.
- Descriptor45 at `005a6af8+45*11` is
  `[1,8,0,4,1,0,0,0,1,4,0]`: primitive1, hold8, step4, mode1, palette0,
  reset1 and flags4. `004ee700` adds render flag0x100 and resets frame offset.
- Mode1 `004ee7b0` adds four to f1 until hold*4=32. Thus initial frame1240,
  frames1241–1247 after presentation visits1–7, then hidden object0x650 at8.
  This is not mode2's step-plus-one frame hold. Processor and presentation visits
  are distinct. Initializer does not add a logical-visit animation gate.
- `005138b0` decrements remaining before the link branch and removes on visit8.
  Earlier visits follow a nondeleted/nonzero-class linked object and re-ground
  the flash. A missing target neither shortens lifetime nor retargets the effect.
  It clears a flag on the effect, not the replacement Brave.
- HFX1240–1247 are eight100×100 source sprites. Nibble alpha and AL/PAL colors
  are independently compared against the existing imported atlas by
  `scripts/check-conversion-flash-source.py GAME_ROOT`. The script validates
  original EXE identity, reviewed opcode operands, descriptor and every pixel.

## Live ownership and scope

`stepLiveConvertWild` retains the ordinary cast/controller path and calls
`animatedSiteEffect` once, then binds `startConversionLink` to its replacement.
The existing `world-turn` decrement and `stepLevelStartConversion` consumer
already implement the common effect58 lifetime/follow path. The existing animation
owner advances non-gated effects on the elapsed24Hz presentation clock; logical
removal remains eight12Hz turns. There is no birth allocation or extra sound.

The scene consumes the descriptor's frame offset and terminal hidden object,
uses source100×100 rectangles with centered-bottom anchoring and material opacity1
(no extra fade). It uses the existing normal-alpha atlas material. Full native
primitive1 depth-bucket sizing, painter ordering, final GPU blend composition and
original wall-clock scheduling remain shared renderer boundaries, not established
by this correction. No shared renderer, importer or atlas changes are included.
Tests assert the modern clock adapter, not original full-frame equality.

## Separately investigated, not changed

Hypnotise is class7/model16, not17 (the latter initializes Lightning).
`0050e9e0` snaps x/y to cell center, grounds, sets draw44/HFX1264 and counter0,
state17, and cue0x2a. `0050ea60` applies targets at counter5 and removes at16.
Descriptor44 is `[1,16,0,4,1,0,0,0,1,4,0]`; HFX1264–1279 are100×100.
The current sparkle1288 family is wrong, but a dedicated source import and
separate scope are required. Neither its gameplay targeting nor artwork is
changed here.

## Regression evidence

The dedicated tests reach the flash via ordinary Mission3's authored AI cast,
then independently exercise source frames/terminal hiding and linked eight-turn
lifetime, pause, checkpoint continuation and30/60/120/144Hz/irregular elapsed
schedules. The existing supplied-player-cast test now demands exact source1240,
draw45, remaining8 and the replacement link rather than the obsolete birth kind.
The old implementation fails the new ordinary-emission assertion.

A read-only archived-base comparison of1000 ordinary Mission3 turns matches the
candidate for every turn's units, simulation RNG, allocation serial/counter,
casts, mana, sound events and AI (visual effects intentionally excluded).
Aggregate SHA256: `846edfb5c6c3b74a1cff86db328403ecd73cd93b7aebf3372d3986c4246ceaa2`.
This is a bounded nonregression witness, not an exhaustive gameplay proof.

Scoped Oxlint adds one `import/no-cycle` diagnostic for shared constructor reuse
inside the already cyclic runtime graph. All other scoped diagnostics match base
`655e5d6c` after line shifts. No suppression was added; the root accepted keeping
the existing helper rather than broadening this repair into constructor movement.
The helper module has no eager world access or calls; its functions are invoked
only from the later live callback. Final checks and renderer/browser acceptance
remain separately recorded; no parity percentage is awarded.
