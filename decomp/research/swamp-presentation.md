# Swamp presentation (issue 27)

Base: `96becd8826afc5a4256a12ccebf3caa61729e24b`. The original
`makeFx` uses a fixed green `CircleGeometry(2.8, 32)` at opacity `.78`;
`animateFx` skips Swamp. The existing controller already stores variant/counter.

## Original path and data

Pinned EXE: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Recovered as data using the documented archive/extractor, Component0. No installer
or game process was launched. `original-swamp.json` binds all four input hashes.
The retained pseudocode was checked against original instructions and isolated CPU
execution; it is not original source code.

- Spell 11 arrives as class7/model18. `00509c10` dispatches its initialization to
  `00511340`: object descriptor52, render-hidden flag cleared, lifetime32000,
  one gameplay RNG draw masked by3 for byte `+72`, and same-tribe trap cap29.
  Existing `check-native-swamp.py` owns initializer/controller comparison.
- Descriptor52 at `005a6af8 + 52*11` has type19. `0046ec80` dispatches type19 to
  `0046f290`. It is neither a generic effect sprite nor a horizontal circle.
- Nine samples use cell offsets `(-1,+1),(0,+1),(+1,+1),(+1,0),(+1,-1),
  (0,-1),(-1,-1),(-1,0),(0,0)` in that order. Positions are centers of512-unit
  cells containing the trap and its neighbors, wrapping to16 bits.
  Each sample independently rejects cliff>=128 or terrain-category flag2.
  Native `0044e940` samples height, then subtracts32; queue primitive is30.
  Its frame is `(uint32(sprite_animation_counter + ordinal) % 10)`.
- Five plants use signed XY pairs from `0059d980 + variant*20`, relative to the
  exact trap center, not the snapped cell center. They have the same individual
  terrain gates, freshly sampled height without the32 offset, and primitive31.
  Their frame is `(unit_index + ordinal*variant) % 12`. Neither part reads the
  gameplay scan counter, kills or remaining lifetime. The full offset table is
  imported directly from pinned PE section bytes.
- `004673b0`, at `0046c088`, maps primitive30 to HFX1574–1583, and primitive31
  to HFX537–548. Both subtract half the scaled width (integer truncation) and
  the full scaled height from the projected anchor. Queue bias is -300.
  `level_flags_1 & 0x380` selects the existing native sprite scaling path.
- The bubble branch passes AL0 at `0087f000` to `00516270`, enables flag8,
  then restores ghost palette `00974560`. The real `004f95a0` initializer selects
  alpha-texture mode18, **opaque vertex alpha**, and queue flag2. This is not the
  ghost opacity85/255 branch. `0047dc50` applies the AL0 tint. Plants use ordinary
  palette, mode17, white tint, opaque vertex alpha. The importer reuses the
  existing PSFB decoder and `00476570` high-color/low-alpha nibble mapping.
- `004a4450` increments global `sprite_animation_counter` in the display loop.
  Native `00511400` separately decrements lifetime, sounds, scans every fourth
  object-counter visit, retires at ten real victims or invalid terrain, and has
  separate ghost-removal accounting. Presentation does not change those owners.

## Browser adaptation

`scene-swamp.ts` creates fourteen persistent sprite objects, sampling their
positions and visibility through `swamp-presentation.ts`; it does not allocate
simulation entities. Only Swamp creation/drawing/early-return wiring changes in
`scene-effects.ts`. Convert, Tornado and Hypnotise sections are untouched.
One dedicated PNG/metadata pair avoids editing shared atlases/importers.

The saved `secondaryEffects.animationFrame` supplies the existing elapsed-time
24Hz presentation clock. This deliberately avoids original display-frame-dependent
speed, freezes during pause and resumes from the current checkpoint. The object's
scan counter remains gameplay-only. The existing stable effect ID supplies the
plant index input (low16 bits); this preserves the source selection rule, but
does not claim the browser's allocation identities equal the original unit pool.
The imported colors are the existing default bank-c environment; matching every
mission's alternate palette is outside this patch.

## Checks and boundaries

`scripts/check-native-swamp-presentation.py EXE` executes the complete `0046f290`
queue for256 cases across all variants, wrapped cell boundaries, original terrain
interpolation and filtering, varied object counters/IDs and global frame values.
Projection is supplied at `0046dbe0`; the test compares projection inputs and
queue frame values with the live helper. It additionally executes all22 HFX painter
frames through the real palette setter and quad initializer, asserting dimensions,
bottom-center anchoring, tint, alpha, texture mode and palette restoration.
Only texture-bank metadata/cache-upload leaves are supplied there. This is not a
capture from a running original game or a native framebuffer comparison.

`scripts/import-swamp-art.py GAME_ROOT --check` reproduces only the two owned
outputs in a temporary directory, comparing complete bytes. No shared outputs,
fixtures, exports or parity ledger are regenerated.

`tests/swamp-presentation.test.mjs` covers render purity, independent counters,
terrain rejection, all variants, a complete32000-visit lifetime, and current
checkpoint/pause continuity. Existing Swamp tests own real-person/ghost accounting,
registered Tower occupants, cap/ordering and frame-rate independent gameplay.
The local-render scenario explicitly supplies stock and a victim, then uses the
public hotkey/click, projectile arrival, controller kill and actual renderer.
It is not evidence of ordinary spell acquisition or original-game pixels.

Raw command/browser receipts, failed attempts and captures are under
`work/orchestration/issue27-swamp/`; final checks bind the committed candidate.
Before capture binds base96becd88 plus recorded untracked files, with an empty
tracked diff: new helper/art files were not yet imported by the live renderer.
Full suite/build, final browser evidence and review status belong in the draft PR.
No parity percentage or issue closure is claimed.
