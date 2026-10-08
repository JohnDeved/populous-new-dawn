# Screen polygon submission: bounded static findings

Source-only follow-on to accepted`5fedc5f6`. Canonical EXE SHA remains
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No native, browser or renderer execution; no app/asset change. These facts narrow
the new drawer contract but do not claim final GPU equivalence.

## Face material subset

Static FACS/current-model reads agree:

|Geometry|Mode6|Mode7|Mode32|Original tile IDs|
|---|---|---|---|---|
|103 camp|36|71|0|12,24,29,32,117,123,127,138,160,169,198,226|
|95 Temple|40|91|16|12,24,44,92,109,122,123,127,143,160,226|

Only tile226 in these subsets has tribe-remap bit1 in byte table`005aa218`.
Both screen producers encode tile+1 normally, or tile+player+1 for that remap.
`0046c3f0` follows the mode tables at`0046c6ec`/`0046c710`:

- mode6 ultimately selects flags0, then `0046c800` adds0x80;
- mode7 takes `0046c515`, submitting through`0047d8a0` with0x82;
- mode32 selects0x12, then `0046c800` adds0x80, producing0x92.

Mode32's`0046cb22..0046cb31` forces diffuse white. `0047d6f0.c` maps flag2
to alpha-test enable/reference127 and flag0x10 to flat shade mode. No inspected
mode enables its bit8 specular toggle. The numeric shade conversion can still
populate specular fields; that alone is not evidence of visible warm highlights.
Do not blindly reuse the world shader's distance fade/highlight addition.

## Culling, winding, ordering and affine vertices

Whole geometry calls`0046d970` at`00473048`, then requires positive screen signed
area. The retained `decomp/generated/0046d970.c` first rejects triangles wholly
outside one common left/right/bottom outcode; it does not CPU-clip every edge.
Final viewport clipping remains downstream.

Per-face geometry performs that common-outcode rejection inline at
`00473945..00473a46`. After its earlier eligibility writes it **keeps both sides**:
`00473b41..00473be3` writes normal corner/UV order for positive area;
`00473be5..00473c53` reverses first/third corners and matching UVs otherwise.
Using the existing world model's single-sided material would hide rotating faces.

The quad producer loop visits triangle023 then012; triangles share face shade.
Each0x46-byte polygon record prepends to its computed bucket via next pointer+2.
The depth expression uses the selected three transformed Z values, adds3072,
multiplies by85 with signed32 arithmetic, shifts8, then divides by16 with signed
truncation and adds negative object+face byte biases, with source clamps.
`0046c3f0` drains bucket256 down to0 and follows that prepend list. Equal-bucket
triangles therefore reverse insertion order. Do not conflate source model
triangulation order with final painter order or the at-most-four admission order.

The queue resolves the remapped tile through`005d2510`'s animated wrapper bank
and converts native UV words via the resolved tile rectangle in
`0046c515..0046c677` /`0046c800..0046cb86`. `0047d8a0.c` retains the resulting
screen vertices/material flags. Existing
`references/reverse-engineering.md` (Shoreline vertex shading,2026-09-08) and
`004f9380.c` establish RHW=1 for this queued triangle family: affine texture
coordinates are appropriate; a world perspective projection is not required.
Texture inset/filter/encoded-color and alpha-test behavior still need a bounded
drawer comparison, distinct from the already accepted CPU-motion reference.

## Lighting

`00472fab..00472fce` uses the stored face normal index at FACS+48, the original
shade lookup table, signed G+17 adjustment and clamp1..63 for whole geometry.
`00473881..004738f2` uses`0040cd00` on the first three transformed corners,
looks up that normal, subtracts20 at first-depth>=400 or adds4 at<=-400, then
clamps0..63. The subsequent queue converts shade<32 to eight-times grayscale;
larger numeric shades yield white diffuse. Existing `faceNormal`, sunlight
lookup and vertex-lighting helpers can be reused only with this screen owner.
The CPU admission threshold is a separate calculation and cannot depend on shade.

## Temple's additional material owner is absent from the app

`decomp/research/temple-top-vfx.md` already identifies geometry95 faces127–142
as16 mode32 quads using tile92. ANIBL record1 maps the global handle through
92,93,94,95,100,101,102,103,108. `0044fc40` resets the shared bank; `0044fbd0`
advances before drawing. Screen `0046c800` also resolves bank2[92], so this is
relevant to the Temple acquisition model, not an unrelated world-only assumption.

Scoped current-source lookup found no global ANIBL phase or animated bank2 owner.
The only live `original-fire.json` consumer is `SceneryFire.frame`: randomized
per-object initialization and `stepSceneryFire` advancement, then `fireUV` in
`scene-effects.ts`. `nativeModel` caches static UVs. `gameClock.animationFrame`
is a different owner and is not source proof of the global texture phase.

The honest scope choice is therefore:

1. Deliver **M1 camp screen acquisition only** after its small material/drawer
   contract and ordinary witness. It has no mode32/tile92 dependency. Keep M3
   visibly open; source CPU support is not its completed screen feature.
2. Include M3 after a specific shared ANIBL phase prerequisite: prove/init/save
   the shared record phase and update-before-draw/pause/hidden ownership, and let
   the screen renderer consume bank2[92]. No per-acquisition fire timer; no silent
   substitution of the scenery fire clock. The existing static92 world consumer
   remains a separately identified gap, not an excuse for a broad renderer or
   cadence rewrite.

M3 also needs the separate bank-p sprite/palette audit. Neither the existing
world-glow atlas nor the accepted bank-c companion fixtures proves those pixels.
