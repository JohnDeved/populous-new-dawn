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
