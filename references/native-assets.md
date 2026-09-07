# Native Populous assets

The user supplied `/Users/johann/Downloads/PopulousTB-Setup.zip` and explicitly requested original-file extraction and asset fidelity. The Inno Setup payload was read with Binary Refinery in a temporary Python environment. The Windows game was not launched. Isolated native movement instructions are now exercised in a CPU emulator for comparison. The game executable and external converters are not runtime dependencies.

`python3 scripts/import-original.py /path/to/extracted/game` regenerates the browser assets using only Python's standard library. It validates bank magic/counts, RLE row boundaries, face and point indices, animation chains, layer offsets and texture dimensions. [`public/original/provenance.json`](../public/original/provenance.json) records SHA-256 hashes for every input, the 21 selected model IDs, 7,953 source frames and 1,512 composited frames.

## Geometry

`OBJS0-0.DAT`, `FACS0-0.DAT`, `PNTS0-0.DAT` use packed records of 54, 60 and 6 bytes. Object face/point starts are one-based. Face point offsets are relative to the object's start. Native triangle/quad vertices and 21-bit fixed-point UVs are preserved. Coordinates are divided by the per-object scale times three, matching the documented converter. No replacement hut, training-building, tree or shrine geometry is generated.

Models: huts 169–174, warrior training 141–142, towers 117–118, temples 133–134; trees 13–15 and 60–62; reincarnation stone 30; stone head 82; vault 94. Semantic identities were checked against the world editor's named 3DS exports by comparing their vertex extents. The runtime keeps native proportions, scales compounds to their existing ground pads and converts the original object angles into the reflected map coordinate system. There are no invented decorative rocks.

The 256×1024 `BL320-C.DAT` atlas contains 32×32 tiles. `PAL0-C.DAT` contains 256 RGB-plus-padding entries. Black-key cutouts preserve rope fences and foliage. The archive's object atlas C is byte-identical to atlas 0.

## Units and animations

`HSPR0-0.DAT` is a PSFB bank: eight-byte header, eight-byte width/height/absolute-offset entries, signed run-length encoded rows. Zero terminates a row; negative runs skip transparent pixels; positive runs copy palette indices.

`VSTART-0.ANI` contains four-byte start/mirroring records; `VFRA-0.ANI` contains eight-byte frame/next-frame records; `VELE-0.ANI` contains ten-byte sprite/offset/layer/next-element records. Sprite references address six-byte legacy TAB entries, numbered from one. These tables supply the original signed body/clothing/weapon offsets and frame cycles. Frame rectangles preserve their signed native origins rather than clipping extended poses to a fixed foot-centred cell. Team-colour overlays and warrior weapon layers are composited from source pixels. Blue and Dakini shamans use their distinct native headdresses. Eight viewing directions include the native mirrored sequences.

The browser uses camera-facing 2D sprites anchored at the original foot origin. Selection and health overlays remain browser-drawn. Animation states map simulation walking, idle, working, carrying and combat onto native cycles; this is not a port of every original animation-state transition.

## Landscape and HUD

`levl2001.hdr` byte 96 selects landscape bank 12 (`c`); byte 97 selects object bank 0. Bank c's `BIGF`, `DISP`, palette and Direct3D sky layers are decoded. Displacement bytes use signed wrapping plus 128 for the grayscale representation. `BIGF` is the native 256×1152 terrain/water colour lookup. The renderer samples it using height, slope and displacement detail. `HFX0-0.DAT` supplies original spell icons, building icons, unit icons, tabs and gold panel fill.

The browser still approximates the original terrain lookup calibration, lighting, water motion, cloud projection and construction reveal. Native HFX spell frames now use the original nibble-encoded alpha and AL0-C colour lookup. The globe projection is a browser implementation; the original software rasterizer and its exact camera/terrain transform have not been decompiled. Native PCM voices and effects are decoded and played; ambient/music scheduling remains unported. These differences prevent a claim of pixel-identical rendering or complete gameplay parity. See [the executable analysis](reverse-engineering.md) for verified animation/effect routines, balance changes, reproduction steps and remaining behaviour differences.

## Format evidence

- [ALACN's native object converter](https://github.com/OpenPop/pop3dobj): packed object, face and point layouts and UV conversion.
- [PopResourceEditor](https://github.com/Toksisitee/PopResourceEditor): PSFB, palette, block atlas, BIGF, DISP and landscape bank formats.
- [PopSpriteEditor](https://github.com/Toksisitee/PopSpriteEditor): source sprite bank decoding and transparent overlay structure.
- [ALACN Pop World Editor](https://github.com/Toksisitee/ALACNPopWorldEditor): level header structure and named model exports.
- [OpenPopulous HFX definitions](https://github.com/OpenPop/OpenPopulous/blob/master/src/Graphics/HFX_Defs.h): named UI sprite identifiers.

These projects were used to understand data layouts and identities; the Python importer and browser renderer are newly written. Converted sprites, models and textures remain the original game's artwork.
