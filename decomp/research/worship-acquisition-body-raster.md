# Ordinary acquisition body: HFX bank, palette and raster geometry

Source-only addendum to [the accepted presentation proof](worship-grant-presentation.md),
2026-10-05. The pure controller port remains frozen at
`de5b624d400b4aef8ed7cb2163001826135d258a`. This note changes no runtime code,
probe, asset or fixture and makes no new native execution or GPU-pixel claim.

## Body bank and palette ownership

The bank argument `009910e8` passed by `00484870` is the original **HFX0 sprite
bank**. This is established by both a retained named export and original bytes:

- [00516170](../generated/00516170.c), `get_sprite_bank`, subtracts
  `hfx_0_addr` (`0059df14`) at `0051617a`, divides by eight, and validates the
  resulting frame index against the sprite count of `hfx_0_mem` (`0059dee8`).
  Its accepted branch at `0051619c` writes the exact bank address `009910e8`.
- [004b6820](../generated/004b6820.c)'s sprite setup reaches
  `004b6c1b..004b6c37`: it loads `0059dee8`, passes that source to
  [004ff570](../generated/004ff570.c), and sets `ECX=009910e8` for the bank
  being initialized. The bank keeps the original HFX sprite-file pointer at
  `+8`, its per-frame descriptors at `+4`, and its ordinary/alpha texture-cache
  owners at `+0x10/+0x14`.
- `00484870` obtains body frame `005a80de + model*62`; the retained executions
  submit **1059, 1060 and 1068** for models 3, 4 and 12. They are HFX frame
  indices, unrelated to the numbered entries of `original-units.json`.

The body uses the **ordinary palette**, not the effects nibble-alpha decoder:

- Original `0047e070` initializes a sprite quad through
  [004f95a0](../generated/004f95a0.c). The recorded body flags are zero.
  Instructions `004f960a..004f966b` therefore select render type `0x11` and
  retain white diffuse `ffffffff`; they do not set the queue's alpha-palette
  selector bit 2. Scaling may set queue bits `0x20/0x40`, which do not select
  that palette.
- `004f96fa..004f96fc` choose ordinary cache `00993080` when bit 2 is clear.
  The queued source has vtable `0058f1a0`, whose first entry is `00476a30`.
  That uploader checks bit 2 at `00476a9b`; absent bit 2 and bit `0x10`, its
  `00476ae5` load selects `sprite_palette_struct[0]` and passes it to the RLE
  blitter [00476cb0](../generated/00476cb0.c).
- [004b6820](../generated/004b6820.c) constructs that palette from `pal0_mem`
  and `al0_mem` using [00476570](../generated/00476570.c). Palette slot 0
  converts the ordinary PAL RGB bytes with opaque positive-run texels. Slot 1
  separately implements the AL high-nibble color and low-nibble opacity path.
  Transparent RLE skips remain outside the positive pixel runs.

For the bounded M1/M2 bank-c artwork, the established portable decode is therefore
`sprites(hfx_bytes, pal_bytes)` from
[import-original.py](../../scripts/import-original.py), using its default
`alpha=False`. Device pixel-format quantization, texture-edge expansion, filtering
and GPU blending are separate from these canonical RGBA bytes.

## Dimensions and native crop ownership

All three raw HFX entries are **28 by 25**. The bank's per-frame descriptor
retains those original dimensions at `+0/+2`. Its crop offset and size come from
`00476fa0`, called by `004ff570`: positive RLE runs set minimum x, maximum
exclusive x and maximum exclusive y; initial empty rows set minimum y. These
are source-run bounds, not a guessed icon rectangle.

| Model | HFX frame | Original size | Crop x,y | Crop width,height |
| --- | --- | --- | --- | --- |
| 3 Lightning | 1059 | 28,25 | 8,2 | 13,23 |
| 4 Tornado | 1060 | 28,25 | 5,2 | 19,21 |
| 12 Bridge | 1068 | 28,25 | 2,6 | 25,15 |

The bounds above also match the nontransparent rectangles of the canonical
ordinary-palette decode. SHA-256 of each complete 28x25 RGBA byte array:

- HFX1059: `b6044bb1c3c555baa0caeb3c9dbbf1a2fb224cc338e4441ff6f5e135750495a1`
- HFX1060: `7129be75969942bb56382f18ad1f5adb101f855efd00b5c98927a132f33308a1`
- HFX1068: `9c767bdc31459d0c23226bfe7939b3f457bd1b44a27b37dcaa00ece13bbaa61d`

`0047e070` multiplies the original 28x25 dimensions by the supplied body scale
before constructing the queue record. Then
[004f98a0](../generated/004f98a0.c) multiplies the crop offsets and crop
dimensions by that same scale, adds the offsets to the submitted x/y, and replaces
the queued width/height with the scaled crop width/height. The full original
dimension and the cropped texture dimension must not be interchanged.

Finally [004f9bc0](../generated/004f9bc0.c) emits the four vertices. Let the
submitted command be `(x,y)`, scale `s`, radians `a`, and crop `(ox,oy,cw,ch)`.
Before rotation, its adjusted point is `q=(x+ox*s,y+oy*s)` and dimensions are
`w=cw*s`, `h=ch*s` (plus the renderer's separate global vertex shift).

- For exactly zero radians, q is the **top-left**; the quad extends by w and h.
  The native zero-angle branch does not subtract half dimensions.
- For nonzero radians, the edge vectors are
  `X=(w*cos(a),-w*sin(a))` and `Y=(h*sin(a),h*cos(a))`. Native code first changes
  the top-left to `q-(X+Y)/2`, then emits that point, `+X`, `+X+Y`, and `+Y`.
  Constant `0058f884` is the float `0.5`.

An equivalent Canvas geometry mapping for the nonzero branch translates to q,
rotates by **negative a**, then draws the cropped source centered at
`(-w/2,-h/2)`. For the zero branch it draws the cropped source at q directly.
Centering the complete 28x25 frame at the submitted command point would change
this native geometry. This source mapping does not establish texture sampling,
global half-pixel adjustment or native GPU pixels; those remain explicit browser
renderer acceptance concerns.

## Minimal artifact change

At the frozen source HEAD, `original-hud.json` has none of HFX1059/1060/1068;
the effects atlas also omits them. Existing HUD356/357/365 are separate art, and
the units atlas uses VFRA/VELE layer indices. Do not substitute either.

The minimal import is to append exactly these three complete ordinary-palette HFX
frames to the existing HUD atlas without moving existing rectangles or changing
existing pixels. Follow the established non-repacking pattern in
[import-spell-hud-icons.py](../../scripts/import-spell-hud-icons.py), preserving
its current imports. Retain raw 28x25 dimensions and the crop metadata above for
the body renderer; the crop does not justify trimming the shared source art.
The companion/pulse assets already exist: HFX318–321 are `blastTrail` entries
4–7 and HFX1288–1299 are `sparkle` entries 0–11.

## Input binding and inspection limits

| Input | SHA-256 |
| --- | --- |
| d3dpoptb.exe | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| data/hfx0-0.dat | `681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf` |
| data/pal0-c.dat | `6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53` |

This inspection reused the linked retained exports, read the pinned executable
using GNU objdump ranges, and decoded original assets using the existing Python
standard-library decoder. No Windows code, Unicorn, Ghidra, package tool, browser
or renderer ran. Private raw disassemblies and `source-audit.json` are retained
under `work/orchestration/worship-acquisition-body-raster/`; the audit records
the input, decoder and disassembly hashes. Example reproduction:

```sh
objdump -d -Mintel --start-address=0x516170 --stop-address=0x5161a3 "$POPULOUS_EXE"
objdump -d -Mintel --start-address=0x4b6c0c --stop-address=0x4b6c44 "$POPULOUS_EXE"
objdump -d -Mintel --start-address=0x476a30 --stop-address=0x476af8 "$POPULOUS_EXE"
objdump -d -Mintel --start-address=0x476fa0 --stop-address=0x477052 "$POPULOUS_EXE"
```

The accepted presentation probe's bank/context interception remains unchanged.
This addendum resolves static bank, palette, source-art and geometry ownership;
it does not upgrade the probe into a native full-raster execution claim.
