# Original-game visual pass — 7 September 2026

The user explicitly replaced the earlier low-poly direction with the original game's look. Reviewed every image in this folder, including the AVIF (decoded to PNG for viewing). These screenshots are visual references; they are not used as backgrounds for the playable scene.

| Reference | Details used |
| --- | --- |
| images-3.jpg | Gold sidebar, connected hut rooms, small followers, square compounds |
| images-2.jpg | Purple spell glyphs, compact controls, strong spell contrast |
| populous3007_640w.jpg | Tall training hall, weathered thatch, painted reincarnation stones |
| images-1.jpg | Eight inward-bending painted stones, low curved horizon |
| populous-the-beginning-03_02_2025-12_32_05-e1745996170632.webp | Tapered towers, tree silhouettes, worn ground |
| user-campaigns.jpg | Hut upgrades, square fences, terraces and cloud backdrop |
| settlement.webp | Tall waisted towers, small blue roof crests, dark thatch |
| user-ref3.jpg | Monumental carved stone head, followers worshipping nearby |
| populus-3.png | Exposed timber frames, compact gold controls |
| village.jpg | Plaster and blue tribal markings, thatch grain, follower proportions |
| user-village.jpg | Distinct training architecture, bare-chested followers, cloudy daylight |
| user-world.png | Mottled grass, dark sea, foliage and narrow cypresses |
| images.jpg | Settlement compounds and differentiated building silhouettes |
| user-gameplay.jpg | Crossed timber braces and construction frames |
| user-ref6.jpg | Original building proportions and icon panel |
| user-ref5.jpg | Green/brown terrain, tree shapes and dramatic spell lighting |
| 5912757e5bafe3e1e709fb9d.avif | Gold sidebar proportions, curved terrain and tribal colour contrast |

Implemented: native building and tree meshes, original layered 2D unit animations with eight viewing directions, native shaman headdresses, original spell/building/unit icons, gold panel texture, landscape bank c colours/displacement and sky layers. Level-one terrain and initial objects still come from the original level. Native compounds fit the existing tangent-plane foundations. Original-game imagery supersedes the earlier generated cover and low-poly direction.

See [native asset formats and source hashes](native-assets.md) for the import pipeline and remaining renderer differences.

## 8 September 2026 — Visible-fidelity priority

Opening view inspected at 1440×1000, with additional comparisons against
`village.jpg`, `images-2.jpg`, `user-world.png`, `user-village.jpg`, `images-1.jpg`
and `populus-3.png`. Ranked discrepancies:

1. Terrain remains too yellow and its detail/shading too uniform. The shader
   still guesses height/color and lighting weights despite using original assets.
   **Corrected in the following terrain pass below.** Water/shore texture motion
   remains approximate and is the next target.
2. The normal view had a flat sky: its cloud dome was only visible in overview.
   Now corrected with the original lens data and both original cloud textures.
   Native camera motion, UVs and fades are CPU-compared; keyboard rotation,
   independent clock, viewport resize and GPU world occlusion pass in-browser.
3. The HUD remains oversized, with approximate fonts/layout and extra floating
   labels. Original textures/icons alone do not establish interface parity.
4. Sprite/effect scheduling, shadows, ground detail and object activity still
   need representative gameplay captures beyond the opening settlement.

Before/after captures: `/private/tmp/populous-visible-before.png`,
`/private/tmp/populous-visible-sky-after.png` and
`/private/tmp/populous-visible-sky-rotated.png`. The latter two are reproducible
with `node scripts/check-browser-sky.mjs` while the local server runs.

### Native terrain texture pass

Replaced the guessed terrain shader with the original 32×32 indexed texture
calculation. The terrain now has the shipped bank-c soil/grass detail, original
cliff remapping and shaded building compounds. Original screenshots use several
landscape banks; their different colors are not a reason to tint this mission's
verified bank by eye. The opening and a completed Land Bridge were inspected.

`check-browser-terrain.mjs` captures `/private/tmp/populous-terrain-after.png`
and `/private/tmp/populous-terrain-bridge.png`; the prior sky-only build is retained
locally as `/private/tmp/populous-terrain-before.png`. An actual targeted click
casts Land Bridge; its changed native cells update the atlas after terrain
synchronization. Incremental atlas output matches a fresh rebuild.

Remaining visible differences include water/shore behavior, dynamic light and
scenery shadow scheduling, native texture-cache filtering/LOD and HUD layout.
Native texture pixels matching does not establish whole-frame visual parity.


### Compact HUD pass

Compared the live panel with `images-2.jpg` and `populus-3.png`: native minimap
corners, tab silhouettes, portrait proportions, compact unit counts and spell
charge markers now replace stretched cards and persistent labels. Native bitmap
counts retain glyph widths. Both 720- and 1000-pixel desktop heights fit without
button overflow. Original spell inactive/charged artwork replaces opacity-only
fading. Building/shrine descriptions appear on model hover; the same mesh hit
accepts orders. Objectives and help are in the menu.

Capture: `/private/tmp/populous-native-hud-after.png`, reproduced by
`node scripts/check-browser-hud.mjs`. The panel still exposes the implemented
command subset; original slot ordering, full native font/color/layout behavior
and control scheduling remain open. Next comparisons should show actual spell
impacts, selection/targeting and building activity, beyond the opening view.


### Selection feedback

Selected followers now show the original HFX 53 arrow above the current native
animation-frame height. The invented ground selection rings are removed.
`node scripts/check-browser-selection.mjs` captures braves and the shaman,
checks GPU-visible markers and exercises varying real walk poses. Depth testing
still lets nearby world geometry obscure a marker. Native rectangle/gating
comparisons do not prove the browser's complete painter ordering or occlusion.
Spell cursors, range indicators and travel/impact effects are the next target.

### Spell pointer feedback

The pointer now carries native POINT spell artwork, HFX 589 unavailable marks
and the four-frame POINT walking indicator for out-of-range targets. Native
offsets replace the invented small ground target ring. Screenshots:
`/private/tmp/populous-cursor-ready.png` and
`/private/tmp/populous-cursor-range.png`, reproduced by
`node scripts/check-browser-spell-cursor.mjs`. The operating-system arrow and
large casting circle still differ; ground targeting and spell impacts remain
the next visible comparison. Pointer tests do not prove whole-frame fidelity.

### Casting-range halo

The continuous blue circle has been replaced with the original 85 animated
HFX particles and their small shadows. It follows the original terrain heights
and previews range on spell hover. Inspected captures:
`/private/tmp/populous-halo-blast.png` and
`/private/tmp/populous-halo-bridge.png`; reproduce with
`node scripts/check-browser-spell-halo.mjs`. The test also captures a real Blast
impact as a baseline for the next effects pass. Native clock ownership and
full painter/blend behavior remain open, alongside ground target tiles.

### Coastline lighting pass

Revisited `images-1.jpg`, `user-world.png` and `user-campaigns.jpg` alongside the
live first mission. The current terrain bank remains original data; the reference
images' different landscape palettes do not justify recoloring this mission by
eye. A concrete rendering mismatch was visible at the sea edge: coastal terrain
ignored vertex diffuse shading even though adjacent water received it.

The recovered `0046c340` conversion now serves both surfaces. Wet coast vertices
darken with the same native wave samples as the sea, and terrain supports the
original additive warm-light channel. Inspected matched-view captures:
`/private/tmp/populous-coast-before.png` (the previous omission reproduced with
white terrain diffuse) and `/private/tmp/populous-coast-after.png`. The browser
check measures 49,213 changed coast pixels and 6,817 pixels responding to supplied
warm-light inputs. These are integration checks, not a whole-frame original-game
comparison or proof of complete sunlight scheduling.

Reproduce with `node scripts/check-browser-water.mjs`. Original terrain texture
updates after a real Land Bridge cast remain verified. Next visible comparisons
should examine model lighting/shadows and representative unit activity alongside
the remaining terrain raster/filter differences.

### Scenery ground shade pass

Compared the previous coast capture and original references, including the newly
provided AVIF. Tree cells were missing the original terrain shade: they previously
received it only when a nearby building refreshed its own footprint. The recovered
scenery setter now updates these cells on creation/removal, including overlap.
The matched browser views show soft native terrain shading below the trees;
26,778 GPU pixels change, and a real Lightning burn clears the shade on removal.

Reproduce with `node scripts/check-browser-scenery-fire.mjs`; inspect
`/private/tmp/populous-scenery-shadows-before.png` and
`/private/tmp/populous-scenery-shadows-after.png`. This verifies the terrain shade
contribution, not model lighting, unit shadow art, sunlight or the full scenery
scheduler. Those remain the next visible comparison targets alongside native
raster/filter differences. The existing native burn visibility cutoff is unchanged.

### Unit shadow and depth-size pass

Original code confirms the dark disks under standing people were invented. HFX22
is a small screen-facing ground shadow enabled by airborne physics. The scene now
uses that artwork during actual Blast flight, with original terrain anchoring,
depth-scaled dimensions and the unscaled two-pixel painter offset. Standing units
have no generic rings. Body sprites and selection arrows now use actual projected
depth rather than fixed buckets; halo shadow scaling shares the painter convention.

Reproduce with `node scripts/check-browser-unit-shadows.mjs`; the inspected
`/private/tmp/populous-native-unit-shadow.png` shows the shadow below an elevated
red shaman. GPU isolation measures 36 changed pixels and landing removes it.
Selection and halo checks still pass. Native queue/painter/gate comparisons total
2,048 cases. Full interpolation, model lighting, all shadow owners and painter
ordering remain open; this capture does not establish whole-frame parity.

### Model light pass

Rechecked `images-1.jpg` and the running first mission. A code-backed difference
was that all original meshes used unlit texture materials. Faces now receive
native sunlight shades, original heading records or quantized transformed normals,
first-vertex distance fade and the warm additive channel. This changes roof/wall
and tree shading without changing mission palette assets by eye.

Inspected `/private/tmp/populous-model-lighting.png`, showing the Dakini settlement
and nearby warrior vault. Reproduce with `node scripts/check-browser-model-lighting.mjs`.
The check covers 41 live models plus six isolated GPU colors, and verifies shade
refresh on rotation/resize without replacing attribute buffers. Original and
browser captures still differ in scene/view/content; this is not a matched-frame
parity claim. Dynamic light scheduling, selection colors and painter ordering are
explicit next lighting targets.

The same painter audit removed twelve non-drawing picking faces from the fire
mesh, leaving its eight native visible faces. Real spell ignition, animated fire
textures and cleanup are rechecked after this correction.

### Hovered building and worship-object feedback

The original model renderer alternates a hovered eligible object's diffuse color
between gray 200 and white 255, every two simulation turns. The scene now applies
that override to buildings and shrines through the shared picker; ordinary enemy
buildings stay unhighlighted. Sunlight, additive color and distance shade are
bypassed while the override is active, as confirmed with isolated GPU samples.

Inspected `/private/tmp/populous-model-highlight.png` over the opening stone head.
`node scripts/check-browser-model-highlight.mjs` verifies 5,454 phase-difference
pixels, 5,387 pixels versus ordinary lighting, real press/release, spell targeting,
canvas exit, ownership/construction gates and camera movement beneath an unmoving
pointer. Full native picking/modal ownership and other colored effects remain open.


### Focus travel and view preservation

The focus/minimap handler was jumping to its target and forcing rotation/zoom to
zero. Native `00417ca0` requests a planned journey with angle -1 for ordinary
focus; neither request branch resets zoom. The live controls now share the native
camera planner/mover already used for result sequences, including toroidal wrap.
Inspected `/private/tmp/populous-camera-focus-moving.png` and
`/private/tmp/populous-camera-focus-arrived.png` after rotating/zooming the opening
view and clicking the Dakini flag. The view travels through intermediate points
and retains its settings. Reproduce with `node scripts/check-browser-camera-focus.mjs`.
The original opening tour still completes, pauses and restarts through current UI.
Native keyboard/edge-scroll speeds, full minimap mapping and globe transitions
remain separate visible-control gaps; this is not complete camera parity.

### Desktop camera input, 2026-09-08

Replaced arbitrary floating-point camera speeds with original keyboard and mouse
movement. Browser input checks compare eight original keyboard outcomes, diagonal
and opposing directions, paused/locked input, fixed presentation timing, focus
interruption and right/middle drags. Right drag now rotates without vertical drift;
middle drag pans with native integer coordinates. Inspected
`/private/tmp/populous-camera-input.png` after rotating the live first-mission
camera; original model/sprite rendering is retained. Native keyboard and drag-axis
state comparisons pass (8,192 / 6,153 calls). Full pointer sampling, edge scrolling,
settings/zoom/overview controls and whole-frame rendering remain open. The camera
checkpoint stays partial; these counts do not award a complete subsystem.

### Texture sampling, 2026-09-08

Inspected `/private/tmp/populous-texture-filter-before.png` and
`/private/tmp/populous-texture-filter-after.png` at the same opening camera
(x=2, z=30, heading=0), alongside `images-1.jpg`, `user-world.png` and
`user-campaigns.jpg`. The change is subtle at this zoom: original model and cloud
textures now use bilinear sampling without mipmaps/anisotropy, and ground,
water, models and clouds interpolate encoded palette colors. No mission palette
was recolored to resemble a reference using a different landscape set.

Reproduce with `node scripts/check-browser-texture-filter.mjs`: 80 GPU palette
calibration samples exercise all five material paths. Original CPU renderer
state checks, model lighting, clouds, water, terrain deformation and sprite
regressions pass. The terrain fixture now selects Land Bridge after focus,
because native focus clears spell targeting. Whole-frame visual parity is open;
these checks do not reproduce the original GPU's complete raster output.

### Close and bird's-eye camera presets, 2026-09-08

Inspected `/private/tmp/populous-camera-view-close.png` and
`/private/tmp/populous-camera-view-birds-eye.png` over the same mission-one
settlement. Zoom now changes among the original view presets: a close, low
view with larger sprites; normal view; and the elevated bird's-eye view. All
preset fields come from the selected original resolution table, including its
specific horizon and clipping diameter; values differ between resolutions.

`node scripts/check-browser-camera-view.mjs` reproduces the captures and checks
the 18-frame transition, original endpoint data, = / −, wheel/menu input,
interruption, paused/locked controls, resize and overview return. Native comparisons
cover 3,480 transition frames. The full original world-view renderer and its
transition remain unported; the existing spherical overview is still an adapter.

### Desktop navigation and screen edges, 2026-09-08

Left/right arrows now rotate; Ctrl swaps them to sideways panning, while Shift
enables native fast pan. The pointer scrolls at the outer screen edges, including
the left edge of the sidebar. The seam between sidebar and terrain does not
scroll. A key and edge requesting the same direction trigger native fast pan.

`node scripts/check-browser-navigation.mjs` uses real keyboard and pointer events
to compare positions/headings, keypad behavior, modifier changes while holding
an arrow, corners, release, pause and modal/drag/leave/blur gates. Inspected
`/private/tmp/populous-navigation.png` after the checks; original terrain, models,
unit artwork and HUD remain in place. Existing view, focus, movement and sprite
checks pass. Native comparisons cover command selection/merging and edge gates;
full event ownership, settings and world-view controls remain open.


## Hut family silhouettes — 2026-09-08

Compared local `village.jpg`, `images-3.jpg` and `user-gameplay.jpg` against the
running original-textured scene. The browser had only one hut family; original
screenshots show varied roof silhouettes and compounds. Imported all three
families, levels and tribe colors using the native selector. Inspected captures
`/private/tmp/populous-hut-107-v108.png`, `populous-hut-119-v108.png` and
`populous-hut-131-v108.png`: distinct roofs, walls and fences remain grounded and
retain original atlas detail. All 36 variants contribute real GPU pixels.
Construction caps and invisible picking faces now follow the original stage
and collapse rules. These are local model/integration comparisons, not matched
original full-frame screenshots. Original whole-scene lighting, painter order,
settlement scheduling and exact opening allocation RNG remain open.


## Newborn exit and original entrance flash — 2026-09-08

Inspected `/private/tmp/populous-hut-birth-v109.png`: the newborn is visible at its
hut and the original HFX1441 flash sits at the distinct outside socket. The live
check measures flash GPU pixels, observes the newborn walking out, verifies full
opacity and sixteen-turn expiry, and checks original cue40 PCM playback. This is
backed by native socket/controller/animation comparisons, not an original matched
video-frame claim. Complete native newborn person-state ownership remains open.


## Original timber staging before upgrades — 2026-09-08

Inspected `/private/tmp/populous-hut-timber-v110.png` and
`/private/tmp/populous-hut-upgrading-v110.png`. A carrying resident deposits the
original HFX23 log graphic at the hut entrance while the complete hut remains
standing. With enough timber, its next-family model appears in the native first
construction stage. The browser test measures 166 log pixels and observes the
entire reconstruction completing. Native clock/resource accounting is compared;
full worker order, harvesting timing and replacement allocation are still adapters.
