# Authored tree hover

The normal-world tree highlight needs two existing browser callers connected:
`GameScene.animate` needs a model-hover descriptor when its tooltip lookup finds
no object, and `renderSceneFrame` needs the decoration parent's `point.id`.
Trees do not gain a text tooltip. The fallback is restricted to live resource
trees with scenery model 1–6 and at least one log, using type 5, the scenery model,
and neutral owner -1. Sprite logs and other scenery remain outside this repair.

## Retained original chain

The exports below are indexed and hash-bound by `decomp/exports.json`, which
records executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and Ghidra 12.1.3. These are retained pseudocode, not recovered original source or
a newly executed complete original-game trace.

- `004a5ef0.c` routes scenery models 1–6 to `004a67d0.c`, which sets the owner
  byte at +0x2f to 255 and calls `004a66c0.c`.
- `004a66c0.c` copies scenery descriptor flag 0x80 into object flags +0x35.
  Imported `sceneryFlags[1..6]` are 129. `0046ec80.c` submits ordinary scenery
  through `004708d0.c`, which emits `00475550.c` model bounds for that flag.
- `004673b0.c` records the bounds' object identity and assigns `unit_index_2`
  from the winning model face. `00467130.c` links polygon setup, unit drawing,
  polygon submission and the next center update in the normal frame path.
- `004708d0.c` checks that picked identity and accepts neutral owner -1 before
  replacing face shades with 200 or 255. Existing `modelHighlight` and the native
  model material already implement that override.

`0046e030.c` enables ordinary hover subject to UI/global flags and
`00451370(2)`. The latter only reads configuration bit 0x100; the inspected enable,
pick and neutral-owner gates do not read selected-person class. This supports
ordinary Mission 1's default Shaman selection without a Brave-only condition.
The browser's existing pointer-button, mode, input-mask and overview gates remain
the input owners. Full original modal-flag initialization and mapping are unproved.

Mission 1's authored object 20 is type 5, model 1, owner 255 at (3,23), with
objects 21 and 22 nearby. `world-initialization.ts` imports the tree, and
`makeDecorations` binds it to `parent.userData.point` with `sceneryObjects[1] = 13`.
Model 13 has 27 faces, all texture mode 7, so its material consumes the existing
highlight override. `ScenePicking` already carries that `point.id` through its
actual model bounds and face path.

## Verification boundaries

`tests/tree-hover.test.mjs` composes authored Mission 1 decoration creation,
actual model picking, existing pointer gates, the source-bound animate field and
the actual render caller. Texture IO, painter submissions, GPU rendering and
unrelated frame stages are supplied. Controlled phases, stale targets and
building/shrine attachments provide regression coverage, not ordinary gameplay
or rendered-pixel evidence.

An ordinary browser witness must separately use shipped startup/input, normal
speed and unpaused frames: a visible authored tree, both naturally occurring
highlight phases, pointer leave/re-entry, stationary-pointer camera pan/zoom,
and a building control with unchanged selection/orders. The existing native
highlight script supplies globals, model 131 and projection; the existing browser
highlight script changes turns, material values and building state. Neither is
an ordinary authored-tree controller witness. No full native-pixel/timing,
hardware-performance, complete issue 19 or additional parity-credit claim follows
from this caller repair.
