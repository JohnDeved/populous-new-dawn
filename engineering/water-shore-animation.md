# Water/shore animation source contract

Base: 4fdf367db4eb6d15d9a05d84f85758a2893c0526. Issue #315.

Retained decompilation is pseudocode, not recovered source. No original executable
was run for this correction. Independent bounded source review established:

- 004673b0.c:585–654 chooses water_texture_block for category flag 2. UVs derive
  from the polygon UV mapping and cell coordinates masked by 7; there is no turn
  term. The same branch converts point light into grayscale diffuse, with zero
  specular.
- 0046cb90.c:60–80,102–139 and 0046cfc0.c:10–17 animate all wet terrain points,
  including shore points. Two WATDISP samples use opposing phases
  (offset_counter_2 & 255) * 257 and an offset of 76. Height = sum >> 3;
  diffuse = min(32, (sum >> 4) + 16). Classification is not equivalent to selecting
  open-water material cells.
- 004bdcb0.c:14–31 generates 65,536 indexed pixels from signed DISP and BIGF,
  gated by resource bits 8 and 16. Its offset_counter argument establishes
  phase-dependent pixel math, not its caller cadence.
- 00418270.c:223–224,00417ca0.c:30–31,0041c140.c:137–138 set the misleadingly
  named does_water_texture_exists flag after position changes. 004be330.c:408–429
  consumes it to refresh terrain-cache entries, not to call set_water_texture.

Retained loading callers 004a4960,0042a500,0042b230 reach load_watdisp_2 (004bd230)
then load_bigf0_cliff0_disp0. The latter body is absent. No retained generated C
caller invokes set_water_texture. Thus neither exclusive load-only scheduling nor
nonzero reload-phase behavior is freshly verified. The unavailable historical
13-hash/1,285-span packet is not evidence claimed here.

Browser mismatch: initializeTerrain generates waterTexture(textures,0) once per
resource acquisition, while updateWater sets a shader offset to (world.turn&255)/256.
The shader adds it only for open-water triangles. Shore atlas UVs stay spatial.
The old native helper test supplied phases directly; it did not prove this extra
live sea-only movement. The correction removes that unsupported adapter and leaves
shared WATDISP height/light, spatial UVs, acquisition palette and input clocks intact.

Scope: observed browser seam correction supported by retained native drawing/point
code. Not complete original rendering or original texture-regeneration scheduler parity.
