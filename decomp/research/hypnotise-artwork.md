# Hypnotise artwork and cell-center origin

Canonical original `d3dpoptb.exe` SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
All evidence here is static bytes/disassembly and decoded data; no original code
or installer was executed.

## Source

Class7/model16, not17, selects `0050e9e0` via `00509d63` in the model-minus-one
switch. Model17 instead calls Lightning's `00511ef0`.

`0050e9e0` snaps both coordinates to `(v & 0xfe00) + 0x100`, obtains ground
height through `0044e940`, initializes draw44/HFX1264, zeroes its counter, sets
state17 and emits cue0x2a. Descriptor44 at `005a6af8+44*11` is
`[1,16,0,4,1,0,0,0,1,4,0]`: primitive1, hold16, step4, mode1, palette0,
reset1, flags4. No logical-visit animation gate is added. Existing mode1 logic
advances through HFX1264–1279 and hides at object0x650 on presentation visit16.
All16 frames are100×100 with nibble alpha and AL/PAL bank-c colors.

Processor `0050ea60` increments the counter before checking5, then calls
`00515e30` with callbacks `0050eab0` and `0050eb00`; it removes on visit16.
Critically, the position argument is the same effect+0x3d initialized above
(`lea` at `0050ea84`), so gameplay targeting uses the snapped center too.

`scripts/check-hypnotise-source.py GAME_ROOT` independently checks original
opcode operands, descriptor, all160,000 decoded source pixels, old metadata
and old atlas pixels. `scripts/import-hypnotise.py GAME_ROOT --check` checks
reproducibility and transparent appended padding. The importer appends after
all old atlas rows; it cannot silently overwrite previously imported frames.

## Live correction and intentional behavior delta

The ordinary projectile completion still allocates one Hypnotise controller.
Its existing constructor now grounds/snaps that controller, initializes the
existing animation state and emits cue0x2a. The fifth-turn callback and
sixteenth-turn expiry remain owned by `world-turn`; temporary ownership,
replacement rules, target selection algorithm and gameplay RNG are unchanged.
The existing animation owner advances this nongated animation at the elapsed
24Hz presentation cadence, separate from the12Hz logical lifetime.

Previously the callback ranked distances from the unsnapped cast point. The
source-correct origin remains in the same native512-unit cell, so the scan
footprint is unchanged, but nearest-six selection and distance ties can differ.
A seven-candidate test proves this exact delta without modifying the selection
algorithm. Boundary and signed-wrap tests cover the new coordinate transform.

Current-format checkpoint continuation preserves the animation fields through
the existing serializer; no old-save fallback or migration was added. The
existing earned Mission22 cast test now demands this artwork and cue, alongside
its gameplay callback and save/load assertions. Additional focused tests cover
all16 frames/terminal hiding, pause, lifetime, and30/60/120/144Hz/irregular timing.

The existing normal-alpha shared material consumes source pixels at100×100 and
centered-bottom anchoring with no extra animation fade. Original full primitive1
depth-bucket sizing, painter ordering, final GPU blend and native wall-clock
scheduling remain shared renderer boundaries, not established parity claims.
No changes to Convert Wild, Tornado or other spell artwork are included.
