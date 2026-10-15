# Ordinary selector globes

Refs #17 / #457. This bounded restoration replaces the selected opening world's
flat CSS-cropped image with the ordinary-body texture, screen-ring mesh, radial UVs
and interpolated vertex light. It does **not** restore the full original scene.

## Static source evidence

Input D3DPopTB.exe SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original execution/emulation. GNU objdump disassembly and Python data reads.
See [full globe findings](world-selector-globe-evidence/globe-findings.md),
[scene boundaries](world-selector-globe-evidence/scene-findings.md), retained
`decomp/generated/004e3bc0.c`, and the adjacent raw disassembly/constants.

- 004289c8 binds each nonzero body's mission to its own 00428b90 texture.
- 00428b90 loads that mission's header bank, `plspl0` palette, and `plstx` data.
  Four sequential 256-square tiles form TL/TR/BL/BR; 004306d0 averages 4x4 decoded
  RGB channels with integer sum >> 4. The result is 128-square RGB, before device
  format quantization. Palette index zero is not transparent in this path.
- 004e3450 initializes the angular subdivision table. 004e3bc0 uses adaptive
  concentric rings strictly before the equator, sine/cosine recurrence and the
  ordered angle stitch, including two closing seam triangles. Not a lat/long sphere.
- 004e3590/004e36c0 produce unwrapped radial UVs. 004e35c0 produces screen-relative
  vertex shade, and 004e36c0 splits it into diffuse and optional specular channels.
  The raster interpolates those vertex channels, rather than recalculating a
  guessed light per pixel.

## Deliberate browser adaptations and limits

- Existing selected-world placement, diagram, camera and panel remain unchanged.
  This is an enlarged static component at reference radius 128, not the native
  camera's first frame. Uniform scaling to CSS size/DPR avoids the native >=256
  radius cutoff. Mesh reference radius and UV pose are independent of display size.
- UV offsets are fixed at zero. No render-count-derived texture drift, sun/body0
  wobble, glow, or speculative elapsed-time animation is added.
- Fixed-depth screen-space interpolation is used for this isolated preview. Native
  camera-derived depth/rhw variation and whole-scene projection remain separate.
- Device adaptation: RGB8, repeat addressing, bilinear byte-space sampling,
  interpolated specular enabled, additive specular after diffuse modulation.
  Native GPU format/filtering/raster edge coverage and x87 extended precision are
  not claimed. Float32 structural stores/recurrence are retained; JS arithmetic
  is not an x87 emulator.
- Canvas2D uploads a static indexed-triangle raster on texture/size/DPR changes
  only, with cancellable six-millisecond scanline batches and no continuous animation loop, extra WebGL context, or input handlers. Backing size
  is bounded at 2048 square to avoid pathological display-scale allocations;
  ordinary 4K/DPR2 fits below that bound. During resize, the prior complete image
  remains visible until the current-size generation finishes. Obsolete size work
  is discarded; unmount cancels pending work. Pixel-centre edge coverage is a browser
  adaptation, not an original-device pixel-parity claim.
- Missing/invalid textures show a text fallback without preventing navigation or
  starting the mission. Mission-keyed lifetime prevents an old load replacing a
  newer selection. All campaign/progress/load/tutorial/back owners are unchanged.

## Asset ownership

`scripts/import-world-selector-globes.py` exclusively owns
`public/original/world-selector/globes/`. It writes per-mission source, RGB and PNG
hashes in its provenance file. The older selected-preview assets and provenance
remain separate and unchanged. No parity credit or fixture recording is added.

Reproduce: `python3 scripts/import-world-selector-globes.py <game-root> --output <scratch-dir>`.
