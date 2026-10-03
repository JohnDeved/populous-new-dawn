# Temple top decoration and missing VFX: bounded evidence

## Result and scope

Research base: `5a0c8152e421b5082b97c0e235fb878f76fd0726`, fresh isolated
`codex/worker5-temple-top-vfx-evidence`. Related reports: #27 (unidentified sprite
mismatches) and #30 (missing effects). This note does not close either report.

**Proved:** the four original Temple meshes contain flame-textured faces whose
native material follows the global ANIBL animation bank. Current imported geometry
and all needed atlas frames are present, but the ordinary building material stays
on tile 92. The first divergent owner is the **building material/texture-frame
consumer**, not a missing Temple particle producer, model importer or occupant.

**Unresolved:** a separate user-reported sprite at the Temple apex has not been
identified. The roof mesh exists; that does not prove the absence of an additional
original actor. No original screenshot, mission/state/direction or actor trace was
supplied to bind that report to an HSPR/VFRA frame or a separately allocated effect.
Do not invent such an ID, attach a person to a socket, or relabel panel/occupant
artwork as the reported roof sprite. This part remains a distinct evidence blocker.

Only this note and `scripts/check-native-temple-top-vfx.py` are new maintained files.
No production, importer, atlas, provenance, world-turn, gameplay, RNG, occupant,
worship-acquisition, Shaman-death or Totem/model149 code is changed.

## Reused evidence and original identity

Reused `scripts/check-native-building-objects.py`,
`scripts/check-native-building-sockets.py`,
`scripts/check-native-training-hut-assets.py`,
`scripts/check-native-model-materials.py`,
`scripts/check-native-scenery-fire.py`, and
`decomp/research/vault-side-fire.md`. The scenery-fire and building-ignition sections
of `decomp/README.md` already distinguish ANIBL artwork from allocated fire lifetime.
Existing exports were used; no new Ghidra export or original Windows game launch.

Pinned executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Pinned `data/anibl0-0.dat` SHA256:
`e243a4fc4f336d5f3879f0906c750acad8370fc2796c948054107b74162933b9`.
The probe verifies nine source files against existing provenance before execution;
it uses the pure existing decoder without calling an importer entry point.

## Authored Temple and static models

Original **class 2 / building model 5** is the Temple. `0040b170` reads the 76-byte
building descriptor at `0x5a7228 + 5*76`: base object 95, flags `0x489f`. The tribal
object-selection branch produces **95, 96, 97, 98** for owners 0, 1, 2, 3. Existing
`app/building-shapes.ts` and `app/training-hut-appearance.ts` agree.

The imported campaign contains 22 authored Temples in 11 missions:
5, 10, 12, 15, 16, 17, 18, 19, 20, 21 and 22. The scan uses exported mission numbers
1–23 plus tutorial 79, not a guessed 25-mission range. As a concrete normal-world
entry, Mission 5 source records 60 and 86 are class2/model5 at `(-88,-6)` and
`(-74,50)`, owners 0/1, heading 0. `createWorld(5)` produces Temple objects95/96,
progress1. Current object centers include the existing building-origin adapter;
this note does not classify that coordinate difference as a new defect.

| Owner | Object | Original scale | Faces / expanded vertices | Panel height | Highest native Y | Apex texture |
| --- | ---: | ---: | --- | ---: | ---: | --- |
| Blue / 0 | 95 | 160 | 147 / 666 | 645 | 1032 | 226, mode7 |
| Red / 1 | 96 | 150 | 147 / 666 | 555 | 948 | 227, mode7; some tile25 faces share this height |
| Yellow / 2 | 97 | 160 | 147 / 666 | 553 | 885 | 228, mode7 |
| Green / 3 | 98 | 160 | 147 / 666 | 815 | 1305 | 229, mode7 |

All four model JSON records compare exactly to the pure bank-2 OBJS/FACS/PNTS
reconstruction. Roof tiles226–229 and nine flame-frame tiles compare pixel-for-pixel
with the existing atlas. Neither a missing tribal model nor missing atlas coverage
explains the proved animation gap. The static apex faces above are **not** a newly
identified billboard or sprite sequence.

## Socket identity is not a roof-effect producer

All four meshes use shape records **55,56,57,58** for their four quadrants. The only
nonzero general socket is slot0. Its original `[x,height,y]` bytes are
`[40,40,56]`, `[55,40,40]`, `[40,40,40]`, `[40,40,40]`; corresponding shape origins
are `[4,6]`, `[6,4]`, `[4,4]`, `[4,4]`. Other five slots are zero.

`00404540` computes wrapped map X/Y from the building anchor minus shape-origin
units256 plus socket units32, and height from terrain plus socket-height units16.
No Temple-specific smoke.txt correction applies. Thus slot0 is terrain+640. The
probe supplies terrain240 and compares 96 calls with `buildingSocketPoint`, across
all owners, quadrants and slots. Zero slots remain raw API outputs, not proof that
five decorations should exist.

The descriptor's panel socket index is0. `005090f0` consumes that slot for its
building/panel anchor and adjusts the height during construction. `00509290` is
called from the active training controller. The socket and `panelHeight` fields
are distinct quantities. Neither is evidence for attaching a permanent flame or
an occupant sprite at the apex. The general render call chain is
`0046d070 -> 0046ec80 -> 004708d0` for a complete model, with `00471c40` for staged
construction. Geometry positions and socket positions must not be interchanged.

## Exact embedded flame identity, anchor and lifetime

Each model has **sixteen mode32 quads, zero-based faces127–142**, all using
**source texture tile92**. They form four groups of four crossed/double-sided faces.
Their FACS stage byte is0. They are present in complete stage4 and absent from
stages0–3. Current stage vertex counts81/171/264/438/666 agree with that structure.
`004049d0` owns completed-building setup; `00471c40` and `app/model-faces.ts` own
stage-face selection. The probe does not change completion or damage states.

These are **model-local PNTS anchors**, not a new class7 effect or HSPR sprite.
For object95 the native-space bounding boxes are:

| Faces | Minimum X,Y,Z | Maximum X,Y,Z |
| --- | --- | --- |
| 127–130 | 411,373,221 | 536,567,340 |
| 131–134 | 420,373,-332 | 539,567,-206 |
| 135–138 | -536,373,221 | -411,567,340 |
| 139–142 | -539,373,-332 | -420,567,-206 |

The other tribes have their own already-imported point geometry; their flame
heights are370–534 (96),290–472 (97),449–643 (98). The normal model scale, placement,
heading and terrain transform carry these points. A separate terrain-centered or
socket-centered effect would duplicate or misplace the original geometry.

Activation is the **visibility of those complete-model faces**, not worship,
occupancy, training completion, a Shaman death or structural ignition. This material
has no per-Temple allocator, independent duration or expiry callback. It persists
as part of the visible complete mesh and ceases to draw when that mesh/face is no
longer rendered. Construction, culling and later building lifecycle remain their
existing owners; this is not a claim of having replayed every lifecycle state.

## Original texture producer and renderer consumer

ANIBL record1 targets tile92 and contains nine frames:

`92, 93, 94, 95, 100, 101, 102, 103, 108`.

That exact sequence already exists in `app/original-fire.json`. Its use by allocated
scenery fire does not automatically animate ordinary building materials.

`0044fc40` saves original tile pointers and resets counters. `0044fbd0` increments
the global record counter, wraps at9, and updates its dynamic texture handle.
Important addresses independently matched to the existing executable instructions:

- pixel-pointer table: `0x974160`;
- immutable texture-wrapper bank1: `0x5d2110`;
- animated wrapper bank2: `0x5d2510`, exactly256 pointer entries after bank1;
- ANIBL records: `0x5a9f20`, 20bytes per record.

Face submission (`004718c0`/`00471a80`) encodes tile+1 in the polygon byte. For tile92
that is93. `004673b0`'s material lookup at mode32 uses
`bank1[(byte)tex_index + 0xff]`:93+255=348, i.e. **bank2[92]**, not bank1[92]. A
superficial reading of the decompiler's bank1 name would miss the animated alias.

The bounded execution follows this lookup to triangle submission. After reset,
tile92 is the initial handle; subsequent updater visits select93,94,95,100,101,102,
103,108,92 and repeat. Nineteen submissions verify two cycles and fullbright
`0xffffffff` diffuse for the supplied ordinary shade. Original `004a4450` calls
`update_bl320_sprites` **before** `draw_main`; the first update after reset therefore
selects93. A newly created Temple joins the existing global phase rather than
starting an effect-local frame0 timer.

The updater itself reads no building/occupant/lifetime state and advances in both
supplied land-flag0 and land-flag2 cases. That does not prove complete outer-loop
pause behavior or a universal wall-clock rate. In particular this is **not** the
Shaman model12 draw-before-increment contract and should not reuse its latch.

## Current first divergent owner

`app/scene-entities.ts:makeBuilding` obtains the correct original tribal Temple
model and uses `nativeModel` at the existing stage. `app/scene-assets.ts:geometry`
caches `modelStage` positions/UVs; `nativeModel` samples `texture('atlas')`. The
mode32 shader branch correctly forces fullbrightness, but its source UV continues
to address **tile92**: no ordinary-building ANIBL handle/frame remapping exists.
The first divergent presentation visit is the first ANIBL advance: **original93,
current92**. Import and static geometry precede this divergence and compare equal.

`app/scene-effects.ts` updates `fireUV(f.fire.frame)` only for an allocated
`Effect.fire` mesh5. `app/scenery-fire.ts` owns those effect-local frames. A Temple's
embedded quads are not in that effects path. Adding a fire effect, worship callback,
training dependency, occupant decoration or new global scheduler is not justified
by this evidence. The smallest future reservation is a **Temple material-frame
consumer** for the proved faces, with an explicit shared presentation phase and
original update-before-draw semantics; all existing gameplay clocks stay unchanged.

The current shader's alphaTest/blending, full native cache behavior and painter
ordering are not GPU-compared here. They remain separate questions, not additional
proved defects. This evidence establishes missing texture motion, not that all
flame pixels disappear or that the user's entire visual report is resolved.

## Distinct producers that must stay separate

| Path | Original identity and condition | Why not the proved facade animation |
| --- | --- | --- |
| Training/occupants | Temple trains person model4; `00405b80`, `004d80e0`, `00509290`/`005090f0` handle training, people and panel anchoring | Different owner/state; no flame activation dependency proved |
| Capacity markers | `0040c4e0` allocates class7/model74 or75 for player-owned capacity states only with descriptor flag0x1000 | Temple flags0x489f do **not** contain0x1000 |
| Building ignition | `00408840` allocates **class5/model10**, rendering fire object5 at nonzero shape-fire positions; size byte+1,135-turn flames via `004a8c60` | Damage-triggered allocated fire, not healthy embedded tile92 geometry |
| Structural burn | `00408ab0` uses127-turn burn state, evacuation119 and structural damage79, as existing fire research documents | Existing `app/building-damage.ts`/`app/spell-effects-runtime.ts` owner, not this material lifetime |
| Terrain contact | `004708d0`/`00471c40` have gated class7/model51 dust and65 splash paths | Height/contact flags and allocation gates, not a permanent roof accessory |
| Worship acquisition / Shaman death / Totem149 | Separate worship effect, model12 death and model149 research scopes | No producer or artwork may be borrowed to fill an unidentified Temple apex |

## Execution, limits and next evidence boundary

Successful canonical receipt: **`5d990885-5a4e-4bcd-9146-b3190e04ba60`**, exit0.
It validates4 decoded meshes/tribal selectors,96 sockets,13 atlas tiles,19 native
material submissions,2 updater pause-flag discriminants and authored Temples in
11 imported missions. The native cache placement, texture handles, terrain height
and GPU triangle sink are supplied leaves; the object selector, socket arithmetic,
ANIBL reset/update and material texture selection execute from the pinned PE.
No Windows process, original GPU, browser acceptance or production implementation.

A cheap mission scan first assumed1–25 and was corrected to exported mission IDs.
Initial queue receipt `c758c54a-86d3-4010-b8e1-5d995b69ed97` then stopped at a checker
descriptor assertion **before its first emulation call**: it used83-byte stride
instead of76. `scripts/inspect-executable.py` lines54–83 supplied the exact correction.
The failed script/fingerprint/log are retained; one changed-checker attempt ran the
same bounded probe successfully, without broadening native scope or relaxing any
assertion. No additional native run is required to attach a final commit identity;
the successful receipt's script hash binds the committed checker.

Detailed results, original input hashes, every PNTS anchor and captured tile handle
are under `work/orchestration/worker5-temple-top-vfx/native-report.json`. The sibling
`face-anchor-summary.json`, `descriptor-correction.json`, saved failure and final
handoff preserve provenance and limitations. The malformed mid-instruction tail of
an exploratory disassembly is not used as evidence; original source exports and
the executed probe establish the material result above.

```sh
python -B scripts/check-native-temple-top-vfx.py \
  --exe /path/to/d3dpoptb.exe --data-root /path/to/game \
  --output /new/ignored/temple-evidence.json
```

Coordinator follow-on: review this draft evidence, reserve the narrow material
consumer only if desired, and separately obtain a reproducible original apex
scene/frame/actor before naming or changing the reported top sprite. No issue
closure, implementation readiness for that unidentified actor, or parity credit.
