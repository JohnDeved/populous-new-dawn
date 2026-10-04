# Minimap frame composition

## Native evidence

Canonical executable SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Retained exports: `decomp/generated/0049d070.c` and
`decomp/generated/004a1f50.c`. `scripts/check-native-minimap-frame.py` executes both
routines and the real coordinate converters, intercepting only terrain refresh
`00523560` and final sprite/quad submission leaves `005162e0` / `0047dfd0`.
This establishes descriptors, geometry, draw order and submitted UV ratios. It does
not run Windows, the original D3D rasterizer, or a complete native UI frame.

The packed minimap control at `005cb4e9` is `(0,0,0,0,100,96)`, with renderer
`0049d070` at `005cb4f9`. After coordinate conversion, viewport width below 513
selects descriptor `005cab48`; otherwise it selects `005cab30`.

| Descriptor | Top-left / top / top-right | Left / center / right | Bottom-left / bottom / bottom-right |
| --- | --- | --- | --- |
| large | 690 / 694 / 691 | 696 / 0 / 697 | 692 / 695 / 693 |
| small | 86 / 694 / 87 | 696 / 0 / 697 | 88 / 695 / 89 |

Large upper corners are 50×49, lower corners 50×50. Small upper corners are
40×36, lower corners 40×37. Horizontal edges are 8×3; vertical edges are 3×8.
There is no center sprite. Corners retain their exact dimensions; edges span the
remaining gap. Edges draw before top corners, then lower corners. At 100×96 the
large corners overlap vertically by three pixels, and the bottom corners win at
opaque pixels. The previous 100×99 four-corner composite incorrectly removed that
overlap and scaled every corner with the entire HUD.

The submitted horizontal repeat ratio is span/3; the vertical repeat ratio is
span/3. Every horizontal edge row is constant across all eight columns, and every
vertical edge column is constant across all eight rows. The probe verifies that
property from original decoded pixels, so simple unscaled tiling produces the same
edge pixels regardless of these UV ratios. This is specific to these four sprites,
not a claim about general native texture repeat behavior.

The narrow importer `scripts/import-minimap-frame.py` owns
`app/original-minimap-frame.json` and `public/original/minimap-frame.png`. It checks
the canonical EXE and accepted HFX/palette hashes, copies exactly the twelve
referenced sprites, and leaves the shared HUD atlas and old composite untouched.
The native checker compares every imported sprite byte with the original decoder.

## Modern live path and boundary

`app/page.tsx` keeps the existing 100×96 minimap canvas and its engine ref. A
separate `MinimapFrame` overlay calls `drawMinimapFrame` only on artwork load, saved
HUD-size changes, and viewport resize. Its backing dimensions follow displayed CSS
pixels, which cancels the surrounding HUD artwork transform for frame corners.
The overlay has no pointer events. The former CSS `border-radius:50%` on the
terrain canvas is removed: it masks the native rounded-rectangle hole into an
ellipse and leaves background wedges at larger HUD sizes. A failure-first rendered
comparison observed the wrong pixel at (44,3) for the 1280×720 viewport; native
frame submissions plus the unchanged terrain buffer require the terrain there.
This changes the CSS mask and hit region, not canvas pixels, the canvas rectangle,
or coordinate mapping. The full existing rectangular map domain is now clickable,
including newly visible terrain outside the old ellipse and opaque artwork corners.
This is an explicit browser compatibility correction so visible map area is usable;
it is not new native input parity. Exact native hit-region/dispatcher behavior is
still unproved and remains open. The old ellipse is not retained as an invisible
hit mask, and sprite opacity is not used to create a new input mask.
Canvas terrain, colors, rotation, markers,
pick-coordinate math, simulation and checkpoints are not modified.

The modern outer rectangle retains the existing bounded, uniform HUD scale rather
than reproducing native independent-axis stretching. Native frame composition is
compared separately at its original rectangles and at modern uniform rectangles.
Fractional displayed sizes round the backing extent to the nearest pixel; the CSS
box remains aligned to the existing minimap and therefore may resample by less
than half a pixel. This is a display-size compatibility boundary, not original
pixel equivalence at fractional CSS scales.

## Runnable verification

`scripts/local-render/minimap-frame-hits.mjs` compares new terrain/corner hit
ownership with the accepted baseline, four bearings, normal and wrapped centers,
and points outside the actual right and bottom map bounds. This supplements the
existing minimap central-click, seam, marker and terrain-invalidation checks.

- `python scripts/check-native-minimap-frame.py "$POPULOUS_EXE"`: 13 native draw
  lists, both descriptors, 512/513 threshold, 640×480, 1280×720, 1440×1000 and 4K;
  modern 1×/2×/2.5×, partial tiles and suppressed undersized frames; exact asset bytes.
- `node --test tests/minimap-frame.test.mjs`: exact 1× overlap, 2×/partial-tile corner
  and edge pixels, transparent center, frame/input separation.
- Rendered browser, existing minimap regression, standard check/build and independent
  review are required before acceptance. No parity credit is added by this repair.
