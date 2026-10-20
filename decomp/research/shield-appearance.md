# Shield person overlay

The original `d3dpoptb.exe` SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
This change reads that executable **as data only**, along with hash-pinned
HFX/PAL/AL files. It does not execute or emulate original instructions.

## Source contract

The Shield branch of [004673b0](../generated/004673b0.c),
raw addresses `00469019..004691ec`, follows the body draw:

- The active Shield flag is `flags3 & 0x8000`. The final timer-byte window
  (`timer < 16`) blinks using the rendered person's counter mask `2`.
- Start phase is `(unsigned person index + shared animation counter) & 15`.
  Pieces 0, 1, 2 use phase `(start - piece) & 15` and source
  `table[phase].source + 5 * piece`.
- Table `0059d9d8` contains 16 signed-short source/lift pairs. Source families
  are HFX1538..1542, HFX1543..1547 and HFX1548..1552, all 32 by 16.
  Their maximum alpha bytes are respectively 170, 119 and 85.
- Let B be the already-scaled body VFRA header height. The base offset is
  trunc(B/8). Unscaled lift span is trunc(B*28/32); the scaled branch instead
  uses the scaled **overlay frame height**. The raw instructions at
  `004690ee..00469124` replace the span local before calling
  [00476090](../generated/00476090.c).
- Each rectangle has x=-trunc(width/2) and
  y=-trunc(lift*span/256)-trunc(B/8), relative to the person's screen anchor.
- Shield selects diffuse color using the body's displayed tribe, including
  Spy disguise, not necessarily its actual gameplay team. Selectors at
  `005a89cb + owner*5` are `[4,0,1,3]`. The palette byte at
  `AL[selector*4096+0xf82]` gives PAL indices `[220,138,154,228]` and RGB
  `[(51,63,203),(255,75,22),(223,155,31),(47,171,99)]`.
  See [00516270](../generated/00516270.c) and
  [0047dc50](../generated/0047dc50.c).
- [00476570](../generated/00476570.c) decodes source texture RGB from
  `PAL[AL[(value|15)*256]]` and alpha from `(value&15)*17`. Shield's nonzero
  source RGB is `(229,220,214)` before the separate diffuse color.

The standalone importer reads the phase and owner tables directly from the
verified PE sections. It writes only `app/original-shield.json` and
`public/original/shield.png`; shared effects and Bloodlust assets are untouched.

## Live adapter and boundaries

`updateUnitsFrame` calls `updateShieldSprites` after `animatePerson` has resolved
the current body frame, scaled header height, depth bucket and displayed tribe.
The selected person is the same resolved owner used by the body: flight, fight,
native, entry or builder. Sprites share the original frame atlas and use
per-draw atlas transforms. They retain the person's normal painter bucket and
cell visibility, following its body in piece order 0, 1, 2. Assets are shared;
per-person materials follow existing group release/rebuild ownership.

The existing 24 Hz presentation clock supplies phase. Repeated rendering never
advances it or changes the complete World. The existing whole-turn Shield timer
is not changed: remaining<128 is the current adapter's blink threshold. This is
not proof of the original person's phase-dependent expiry scheduling. Unit.id
is the available stable staggering adapter, not proof of native whole-world
allocation identity.

The texture uses the existing sprite convention: nearest sampling and no
mipmaps. Source alpha and separate tribe diffuse colors are preserved; no
procedural sphere, world-time rotation or opacity pulse remains. Final original
GPU gamma/precision/filter/blending equality is not asserted.

Bloodlust geometry, runtime, tint, timing and arrival effects are unchanged.
Shield's generic arrival sparkle is also deliberately unchanged; this patch
does not edit `spell-effects-runtime.ts` or retry the earlier denied Bloodlust
runtime write.

## Acceptance

- `python3 scripts/import-shield.py GAME --check` independently regenerates the
  standalone outputs without writing them.
- `POPULOUS_GAME=GAME npm run test:focus -- tests/shield-artwork.test.mjs`
  compares every atlas pixel against a separate PSFB decoder and verifies raw
  PE/PAL/AL tables. Without original files, the portable subset still checks all
  15 fixed RGBA hashes, distinct alpha families and exact table/color values;
  only the raw-input comparison is explicitly skipped.
- `tests/shield-appearance.test.mjs` checks independent fixed rectangles, all
  16 phases, unsigned wrapping, scaling, culled sizes, all four tribes, Spy
  displayed owner, resolved person counters, body pose/direction changes,
  actual CPU painter order, resource cleanup, hidden groups, pause, unchanged
  World/RNG, 30/60/120/144 Hz and irregular elapsed schedules, current adapter
  expiry and unchanged Bloodlust behavior.
- Existing Shield selection/spell and animation/clock tests remain separate
  gameplay regression coverage.
- The existing `check-browser-shield-spell.mjs` observer now reads the actual
  three-sprite array, exact UV/source/color, correct Shield flag and resource
  teardown. It retains its supplied-stock/population setup and controlled
  last-turn expiry diagnostic. It was not launched for this delivery.

Node texture IO/projection fixtures and CPU painter checks are not browser/GPU
pixels. Ordinary earned Shield acquisition, full shipped cast-to-render
acceptance, camera/water/seam/overlap GPU scenes, exact original expiry and
hardware performance remain unproved here. No full check, build, browser,
original executable run, publication or parity credit is part of this task.
