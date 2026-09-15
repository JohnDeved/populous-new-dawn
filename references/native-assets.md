# Native Populous assets

The user supplied `/Users/johann/Downloads/PopulousTB-Setup.zip` and explicitly requested original-file extraction and asset fidelity. The Inno Setup payload was read with Binary Refinery in a temporary Python environment. The Windows game was not launched. Isolated native movement instructions are now exercised in a CPU emulator for comparison. The game executable and external converters are not runtime dependencies.

`python3 scripts/import-original.py /path/to/extracted/game` regenerates the browser assets using only Python's standard library. It validates bank magic/counts, RLE row boundaries, face and point indices, animation chains, layer offsets and texture dimensions. [`public/original/provenance.json`](../public/original/provenance.json) records SHA-256 hashes for every input, the 59 selected model IDs, 7,953 source frames and 2,982 composited frames.

## Geometry

`OBJS0-2.DAT`, `FACS0-2.DAT`, `PNTS0-2.DAT` use packed records of 54, 60 and 6 bytes. Object face/point starts are one-based. Face point offsets are relative to the object's start. Native triangle/quad vertices and 21-bit fixed-point UVs are preserved. Coordinates are divided by the per-object scale times three, matching the documented converter. No replacement hut, training-building, tree or shrine geometry is generated.

Models in bank 2: huts 131–136, warrior training 103, 104 and 106, towers 79–82, temples 95–97; trees 13–18; reincarnation stone 30; stone head 45; vault base/open/closed/spent 152–155. Models 82 and 106 are the green Mission 2 Tower and Warrior Training Hut; models 81 and 97 are the yellow Mission 3 Tower and Temple reached by autonomous construction. The original loader `0040c670` redirects requested object bank 0 to bank 2. Reading bank 0 directly caused the wrong geometry mappings: its model 94 is a prison, and its pyramid 192 corresponds to bank-2 model 154. Both pyramids match all 110 unique vertices of the world editor's named `knowledge.3ds` after rounding to 1/10,000 model units. This independent geometry fingerprint is checked by the vault gameplay regression. The runtime restores raw coordinates from these editor-sized meshes, applies the original per-object integer scale and heading, and projects objects and their flat native-height foundations together. There are no invented decorative rocks.

The 256×1024 `BL320-C.DAT` atlas contains 32×32 tiles. `PAL0-C.DAT` contains 256 RGB-plus-padding entries. Black-key cutouts preserve rope fences and foliage. The archive's object atlas C is byte-identical to atlas 0.

## Units and animations

`HSPR0-0.DAT` is a PSFB bank: eight-byte header, eight-byte width/height/absolute-offset entries, signed run-length encoded rows. Zero terminates a row; negative runs skip transparent pixels; positive runs copy palette indices.

`VSTART-0.ANI` contains four-byte start/mirroring records; `VFRA-0.ANI` contains eight-byte frame/next-frame records; `VELE-0.ANI` contains ten-byte sprite/offset/layer/next-element records. Sprite references address six-byte legacy TAB entries, numbered from one. These tables supply the original signed body/clothing/weapon offsets and frame cycles. Frame rectangles preserve their signed native origins rather than clipping extended poses to a fixed foot-centred cell. Team-colour overlays and warrior weapon layers are composited from source pixels. Blue and Dakini shamans use their distinct native headdresses. Eight viewing directions include the native mirrored sequences.

The importer also retains all 792 native animation frame counts, the original brave/warrior dance cycles and normal-palette HFX sprite 23 for dropped logs. Live celebrations select their sprite object and frame from persistent native animation records; other unit states still use the legacy animation adapter.

The browser uses camera-facing 2D sprites anchored at the original foot origin. Selection now uses original HFX 53 and CPU-compared placement from each rendered VFRA header height. Health overlays remain browser-drawn. Animation states map simulation walking, idle, working, carrying and combat onto native cycles; this is not a port of every original animation-state transition.

## Landscape and HUD

`levl2001.hdr` byte 96 selects landscape bank 12 (`c`); byte 97 requests object bank 0, which the native loader redirects to bank 2. These two header fields are preserved in generated level data; the importer applies the native redirect. Sprite and HFX bank selection is separate. Bank c's `BIGF`, `DISP`, palette and Direct3D sky layers are decoded. Displacement bytes use signed wrapping plus 128 for the grayscale representation. `BIGF` is the native 256×1152 terrain/water colour lookup. The live terrain renderer now uses the CPU-compared original 32×32 indexed generator, including native height, brightness, signed displacement and CLIFF remapping. The importer retains these tables with the palette and FADE in `landscape.bin`. `HFX0-0.DAT` supplies original spell icons, building icons, unit icons, tabs and gold panel fill.

The browser still approximates dynamic lighting, water motion, texture-cache/LOD behavior and parts of construction reveal. Normal-view clouds now use the CPU-compared native lens and both original textures; overview remains an adapter. Native HFX spell frames now use the original nibble-encoded alpha and AL0-C colour lookup. Normal ground view now uses the CPU-compared original camera transform through `app/render-view.ts`, including terrain, water, models, sprite anchors and labels. The globe overview remains a browser approximation. The original software rasterizer remains unported. Native PCM voices/effects and original streamed music now play, with recovered percussion selection and ordinary ambient-layer rules. Exact world-dependent audio ownership/mixing and complete lifecycle remain unfinished. These differences prevent a claim of pixel-identical rendering or complete gameplay parity. See [the executable analysis](reverse-engineering.md) for verified animation/effect routines, balance changes, reproduction steps and remaining behaviour differences.

## Format evidence

Casting-range feedback uses HFX 1466–1477 (32×32), with HFX 70 (9×2) for
each particle's shadow. The halo uses the AL0 nibble-alpha palette and native
vertex tint derived from `AL0[0x2f82]`; bank c supplies RGB `[229,220,214]`.
The existing effect atlas and updater are shared with spell impacts. See the
halo comparison in the reverse-engineering log for positioning and limits.

- [ALACN's native object converter](https://github.com/OpenPop/pop3dobj): packed object, face and point layouts and UV conversion.
- [PopResourceEditor](https://github.com/Toksisitee/PopResourceEditor): PSFB, palette, block atlas, BIGF, DISP and landscape bank formats.
- [PopSpriteEditor](https://github.com/Toksisitee/PopSpriteEditor): source sprite bank decoding and transparent overlay structure.
- [ALACN Pop World Editor](https://github.com/Toksisitee/ALACNPopWorldEditor): level header structure and named model exports.
- [OpenPopulous HFX definitions](https://github.com/OpenPop/OpenPopulous/blob/master/src/Graphics/HFX_Defs.h): named UI sprite identifiers.

These projects were used to understand data layouts and identities; the Python importer and browser renderer are newly written. Converted sprites, models and textures remain the original game's artwork.


Vault identity reference: ALACNPopWorldEditor revision
`1adcc222c6f35cdc76429cbb9c536b6410359df6`, `data/knowledge.3ds`, SHA256
`79c7b9d77561be8f49d72feb9d7da7bbd2a1ca8df2b0653d3f006858a9e4aff1`.
Decode 3DS vertex chunks (`0x4110` within object/mesh containers), quantize each
coordinate with `round(value * 10000)`, remove duplicates, sort XYZ numerically,
and hash the compact JSON list. The result is
`977d4efcc02c8ac2269fb8e44d56c442b2a3b0a27da8c9eabbf1760ab105481e`.
Browser geometry reverses Z, so undo that reflection before comparison. The
rendered closed pyramid was also inspected in Chrome. Original task references
`0x98`–`0x9b` address bank-2 models 152–155. The task opens from 154 to
153 and closes from 153 to 155, each over 40 turns using base model 152's
faces/UVs; it explicitly selects static model 153 after opening. `app/morph.ts`
ports signed integer coordinate interpolation from `0040cc60`. The importer
checks shared face topology and scale; rendering clones cached geometry before
changing positions. The bank selector passes all 256 byte inputs against native
x86 and interpolation passes 7,595 coordinate cases, including real vault points.
Browser approach/interior routing, initial idle morph scheduling and the complete
native object-phase schedule remain unported. The current hut mesh uses one of
the original variant families; native RNG selection between families is pending.


## Campaign text

`scripts/import-messages.py` reads the supplied English `language/lang00.dat` as
NUL-separated UTF-16LE strings and uses the executable's `005ae310` map for the
first mission's eight constant notification references. It also imports HFX 174
from the native type-3 notification definition. Source hashes and the definition
are recorded in `app/original-messages.json`. Text remains original game content;
popup layout and font rendering are currently browser implementations.

The same importer now reads executable tooltip name tables and their 72 English
strings into `app/original-tooltips.json`. It records the language, palette and
HFX hashes and verifies the tooltip color operands in the executable. The native
window table selects HFX 591–598, packed as a 12×12 nine-patch with transparent
center in `public/original/tooltip-border.png`. Ordinary English tooltips now use
original F00T3/F00T4 bitmap glyphs, including mouse-button artwork, with native
desktop wrapping and centering. The similarly named FONT banks are different
assets. `scripts/import-hud.py` records their source hashes; the native layout
comparison and actual browser canvas hashes cover 222 cases. Scrolling, other
languages, native hover ownership, exact anchoring and full UI blending remain
open. See `../decomp/README.md` for extraction and comparison commands.
