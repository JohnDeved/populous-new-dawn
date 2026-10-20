# Original Angel presentation adapter

This replaces the Blue Warrior stagger stand-in with original Angel geometry,
tribal texture selection and morphs. It deliberately preserves the existing
three-phase gameplay controller. It does not establish full native Angel parity.

## Source and import

The original EXE is SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The scoped importer pins every OBJS/FACS/PNTS/MORPH input in
[`scripts/angel-inputs.json`](../../scripts/angel-inputs.json), verifies banks 2/6
agree, and writes only `app/original-angel.json`. No shared atlas or model catalog
is regenerated. Original ownership/licensing is unchanged.

- Bases 62/69 each have 111 faces, 157 triangles and 87 points. They have distinct
  UV/material metadata despite matching point topology.
- Resources 63–68 and 70–78 are raw 87-point animation inputs. Their mode-zero,
  untextured faces are not runtime meshes. Base 69's raw points are retained for
  the native source-key fallback.
- Cycles 4/5 have six two-visit segments: 12 visits. The generic animation helper
  consumes final frame 11, not count 12.
- The original table 005aa218 marks tiles 162/170 for tribe selection. The
  polygon encoders at 004718c0 (unflagged) and 00471a80 (tribal) both add one
  before the type-6 consumer 004673b0 indexes `bank1[tex_index + 0xff]`.
  That shared encoding is already accounted for by the imported atlas. The
  relative atlas offset is therefore `tile + owner`, not `tile + owner + 1`.
  Blue/Red/Yellow/Green use 162–165 and 170–173. Neutral owner −1 uses 161/169:
  the neutral condition in 004708d0 changes lighting, not helper selection.
  The 73 flagged faces per base retain local UVs; unflagged tiles are unchanged.
  Static disassembly of the pinned executable confirms `inc al` at 004719d0
  and owner addition followed by `inc dl` at 00471b8e/00471b92. This corrects
  the previous off-by-one interpretation; no original code was executed.
- Existing compatibility-c atlas pixels match the original palette, alpha-table,
  ARGB4444 quantization and transparent-edge expansion. All 18 covered tiles are
  independently reconstructed by the checker. Mission 5/14 currently fall back
  to c, not their authored landscape 22/10 palettes.

Static checks, without executing original code:

```sh
python3 scripts/import-angel.py /path/to/verified/game --check
python3 scripts/check-angel-import.py /path/to/verified/game
```

The second checker independently decodes every imported field/coordinate/cycle
from bytes, compares both banks and every palette tile, and checks provenance.

## Source-derived protocol

Retained disassembly and executable/tool/file identities are in
[`angel-presentation/`](angel-presentation/provenance.json). Its instruction
bodies were rechecked with bounded static GNU objdump ranges, not emulation.
Existing exports 0040cc60, 004ee700, 004ee7b0, 004ed8a0, 004ed580, 004fa530,
004ee770, 004a4960, 0046ec80, 004708d0 and 00471a80 supply adjacent ownership.

004de440 selects textured base 62/69 through pending-base and signed stage state.
Toward 62 from 69 the intermediate targets are 76,77,77,78,78; the sixth request
installs 62. Reverse from stage 5 targets 78,77,77,76,76 before installing 69.
Immediate 62 starts stage 3, not 5. A request for the still-current base does not
cancel a pending transition. Missing source-key state defaults to raw 69.

0040cc30 resets the transition counter but only ORs flag 0x1000. It retains
0x400/0x800, so a restarted held transition displays its destination immediately.
0040c9f0 owns ordinary draw-side source-key writes and restart-flag clearing.
004ee7b0 advances signed-short transition counters even when the pose holds.
Raw interpolation uses 0040cc60 integer truncation and signed-short wrapping.

Ordinary class 6/model 8 allocation has flags3=0x100104 without the 0x40000 logical
gate. Native draw precedes animation advance. The browser's existing chronological
presentation owner therefore latches a displayed pose before advancing its next
counters. GPU rendering never samples or advances this state. Visiting all Angels
at the existing browser 24 Hz cadence is an explicit adapter, not a claim of
native visibility-dependent readiness or universal native wall-clock cadence.

## Live and renderer boundary

`createAngel` initializes required presentation state. The existing logical
`stepAngel` result maps seeking→69, striking→62, dying→69; all controller choices,
positions, timers, damage, expiry and both RNGs remain owned by their old code.
The browser producer has no native approach, desired/current speed, pitch or bank
inputs. The adapter supplies zero pitch/bank, never invented flight dynamics.

`nativeModelFromResource` reuses the existing material/shader/lighting path.
The old `nativeModel` API is unchanged. Resources retain base normals, modes,
bias and topology; each Angel owns mutable geometry clones. Pose updates bump
position versions and bounds. Owner changes release instance geometry/materials
but not shared atlas textures. The renderer sets native scale and heading
metadata, not a Warrior layer or uniform tribe tint.

`scene.locate` already converts existing height units by `round(height*45)/128`.
Do not convert again. Existing death entry displays timer 16, followed by 15..1;
the adapter retains scales 160..10 and the original expiry turn. Capturing the
previous countdown indiscriminately would duplicate the entry scale.

Checkpoint format 4 stores both displayed pose and next counters. Missing or
malformed current state is rejected; old development envelopes are not migrated,
deleted or overwritten. No age-based reconstruction is used. Current-save test
fixtures and browser witnesses consume the exported current version; the trusted
Mission 10 receipt validator independently pins version 4. Obsolete v3 and unknown
future envelopes still fail. Previously retained browser profiles are not migrated.

## Acceptance and limits

- `angel-import.test.mjs`: pinned generated bytes, structure, point correspondence,
  unchanged atlas and invalid-source refusal without output changes.
- `angel-presentation.test.mjs`: independent instruction-derived vectors for
  complete loops/stages, current-base requests, retained flags, signed wrap,
  raw interpolation, display/next state and death scales.
- `angel-render.test.mjs`: 1,640 previous model outputs match the pre-extraction
  `80dfb6f7` baseline, including attributes/material/shader/lighting; owner UVs,
  independent instances, disposal, actual effect-frame caller and height units.
  Texture IO is supplied. This is not GPU/pixel evidence.
- `angel-runtime.test.mjs`: actual presentation clock, pause/land-pause,
  30/60/120/144 Hz and irregular schedules, current checkpoints, non-destructive
  v3 rejection and live death expiry.
- `scripts/check-angel-gameplay.mjs`: run the same driver against baseline and
  candidate, then supply the baseline JSON as its third argument. It compares
  840 full-World frame snapshots across supplied cast/combat/wrap/death/checkpoint
  scenarios, excluding only `effects[*].angel.presentation`. Source fingerprints
  and both RNG results are retained. The supplied terrain includes refreshed
  full-map flags/walk masks; flattening only the cropped legacy terrain grid
  would drown the seam target before the intended scenario.

Standard full check/build, fresh review and ordinary rendered Mission 14
reward→stock→HUDcast→projectile→Angel plus Mission 5 route remain separate gates.
Native spawn growth, approach/dive, encounter/split, state 9 pitch, state 11 special
pose, visibility-owned latching and authored palettes are outside this repair.
Do not close the all-sprite umbrella or claim complete native Angel parity.
