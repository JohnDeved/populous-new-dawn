# M1/M3 building screen acquisition: static contract and next proof

Refs #23. Source-only assessment/proposal, 2026-10-08, based on main
`9751eee28bd6f43cac3a84eda350eac71f5a4e8a`, app tree
`ba6df35a5a9fcd06b7c9004cd5a833d24f8d359c`. **No runtime implementation or
complete screen-controller equivalence is claimed.** Independent review gates
the next implementation/proof work. This is not a release/parity completion.

The accepted [d749b15 handoff packet](https://github.com/JohnDeved/populous-new-dawn/blob/d749b15be097573201666064c1eae7b0f1dd3c93/decomp/research/vault-knowledge-presentation.md)
remains the executed evidence anchor. Its geometry, companion and HUD leaves
were supplied/intercepted. The already delivered
[world body/glow work](vault-knowledge-world-assets.md) remains separate.

## Result and live entry

This is a concrete missing product behavior. `app/level-one.ts` record1 links
record2 `[2,7,1,1]` (Warrior Training Hut); `app/level-three.ts` record91 links
record92 `[2,5,1,1]` (Temple). Both are mode4 Vaults. Mission2 has no linked
class2 knowledge reward. Current `world-turn.ts` runs `stepVaultWork`, then
`createGift`; its phase-zero request gate accepts only `ordinaryWorship`, whose
`worship-acquisition-source.ts` producer excludes Vaults and class2 rewards.
The new world sprite work therefore does not provide the missing screen sequence.

`004facf0` decrements gift `+0x7f` from1 to0 on the sixth subsequent object visit,
hides the body, calls local-recipient `00481550`, and removes that gift's glow.
Class2 dispatch at `0048156f..0048157e` calls `004819c0` then `00481490`.
Preserve this boundary. The later knowledge grant has a distinct object owner.

## Data audit and reproducible inputs

[static-audit.py](building-acquisition-screen/static-audit.py) uses only Python's
standard library to read source bytes/data. It never imports native helpers or
executes the original instructions. [static-audit.json](building-acquisition-screen/static-audit.json)
contains executable range hashes, repository source hashes, archive/member hashes,
data identities, conditional HUD references, and exact model comparisons.
[extraction.json](building-acquisition-screen/extraction.json) records the existing
parser/extractor identity and the two-file data-only extraction.

The archive is the already supplied `PopulousTB-Setup.zip`, 322676040 bytes,
SHA256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
Its exact member `Populous The Beginning [Setup]/Setup_Populous_The_Beginning.exe`
contains Component0 `data/{app}/objects/facs0-2.dat` and `pnts0-2.dat`.
Only those two DATA files were extracted with the existing `extract-reference.py`
and binary-refinery0.10.11 parser. No download, installer, emulation or native
execution occurred. Originals remain local/ignored, never part of this packet.

| Building | Descriptor | Geometry | Faces / points | First FACS / PNTS (one-based) | HFX / HUD ID |
| --- | --- | --- | --- | --- | --- |
| M1 model7 | `005a743c` |103|107 /115|7151 /5390|1077 /6|
| M3 model5 | `005a73a4` |95|147 /131|5987 /4286|1079 /4|

For both models, canonical FACS/PNTS reconstruction exactly matches the current
imported face groups, triangulated positions, UVs, tile IDs and modes. Both have
scale160 and no mode-zero faces. `scripts/import-original.py:390..416` retains
native face order; `app/model-faces.ts` retains group boundaries. No broad model
import is needed. This audit does not compare screen transforms, shading or pixels.

Reproduce from this worktree, using the adjacent supplied recovery paths:

```sh
python3 decomp/research/building-acquisition-screen/static-audit.py \
  --canonical-root ../raid-base-delivery-shards-03/work/orchestration/canonical-input-recovery/component0 \
  --data-root work/orchestration/issue23-static-inputs \
  --archive ../raid-base-delivery-shards-03/work/orchestration/canonical-input-recovery/PopulousTB-Setup.zip
```

The missing routines have no committed Ghidra exports on this base. Static
`objdump -d -Mintel --no-show-raw-insn` listings are retained locally at
`work/orchestration/issue23-static-source/{geometry,controller}.asm`; exact
end-exclusive input ranges/hashes are in the audit JSON. They can be reproduced
without executing the original code. Do not describe these as executed probes.

## HUD destination contract

`004819c0` uses the model descriptor's signed word+14 as control ID. `0044bb50`
requests synthetic command39 (Buildings tab), through `0044b445`,
`0044bf50`, `0044c303` and `0044c650(3)`. Construction completes synchronously.
Main panel tab definition `005cafa8` names subpanel3. Panel3 definition
`005cd13a` has origin `(0,204)`; camp child `005cc4dc` has local `(3,57)` and
Temple child `005cc51e` `(49,57)`, both46x52.

`0044ca80` independently truncates parent and child positions into16.16 units.
`0044bc10` requires child allocation+4 and draw pointer+0x53, then matches ID;
it does **not** require knowledge-enabled+8. `0049da40` changes the latter and
artwork fields, not the rectangle. A locked knowledge card is still a target.
For a normally constructed panel, native rectangle arithmetic gives:

| Viewport | Camp rectangle / center | Temple rectangle / center |
| --- | --- | --- |
|640x480|`(2,260,48,312)` /`(25,286)`|`(48,260,94,312)` /`(71,286)`|
|1280x960|`(5,521,97,625)` /`(51,573)`|`(97,521,189,625)` /`(143,573)`|

These are **source-derived references**, not native allocation/layout runs.
They supersede the old probe's arbitrary rectangle `(1,2,31,42)` only as a static
contract. The modern browser must measure its actual uniformly scaled card;
copying these historical coordinates would conflict with modern HUD layout.
Current disabled cards exist at `app/page.tsx:1111`; acquisition measurement
and synchronous selection at `:176`/`:293` are presently spell-specific.

## Building state, phases and renderer feedback

Let B=`00986ba0`. `004819c0` replaces only this building block, then initializes:

- active byte+0x0e, phase word+0x0f, visit dword+4, pending byte+0x13;
- geometry record G=B+0x35: dword scale+0, word yaw+4, word tilt+6,
  signed screen anchor+10/+12, geometry ID+14;
- F=B+0x49, 12 bytes per original face: signed word radius/threshold+0,
  three angle words+2/+4/+6, heading word+8, rate/countdown byte+10, flags+11;
- face count+0xe59, HUD target+0xe5b/+0xe5d, viewport center+0xe5f/+0xe61,
  saved gift handle+0xe63, spin+0xe65, radius+0xe67, radial delta+0xe69.

G starts scale8/yaw0/tilt1536 at the source anchor. Every face starts radius0,
three random11-bit angles, heading0, random rate0..33 and flags0. Four draws
from cosmetic RNG `0089bc72` per face mean428 draws for camp/588 for Temple.
Gameplay RNG is a different owner. Do not reseed the companion independently.

`004839f0` consumes pending transitions before its pause test. Each transition
clears pending, resets visits and advances phase; reaching total5 retires the
controller before drawing. Normal initializer phases are:

| Phase/type | Parameter | Controller arithmetic before drawing |
| --- | --- | --- |
|1 /2|18|On entry spin56/radius0. Later visits ease radius toward700, scale toward40, anchor toward viewport center and tilt toward1956 using signed truncation with divisor `19-visits`. Each face takes shared radius and advances its angles/heading.|
|2 /4|22|Divisor `23-visits`: radius and heading converge to0; angle components converge to2048 and mask2047; face rate becomes0; spin converges to56.|
|3 /5|30|On entry spin182; subtract8 each visit. Draw whole geometry.|
|4 /6|100|Draw whole geometry while visits<12. At12, set every face's flags bit2 and threshold=-16384. Consume renderer bit4 on subsequent visits, as below. Spin decreases6 while above-273.|

After nonpaused phase work, `00484064` increments visits and adds spin to yaw,
masked2047. Comparison uses the pre-increment visit count. The unused type1/3
branches are not a reason to enlarge the authored M1/M3 scope.

At phase4, `00483d8d..00483e26` consumes a face whose bit1 is clear and bit4 set:
set bit1, clear bit2, retain current G yaw in face heading, set countdown10;
advance face rotations and decrement a nonzero countdown in that same visit.
When every face has bit1, `00483e48..00483e86` sets its completion latch and can
advance visits to parameter-10. This changes retirement relative to a no-op
renderer. The old175-visit result is not the actual composed lifecycle.

`00484153..00484179` dispatches per-face
`00473210(G,F,targetX,targetY)` or whole-model `00472da0(G)`. Both use the
OBJS geometry and its native FACS/PNTS ordering, not the world projection.
The per-face sequence is:

1. `0047336b..0047346e`: for flags without bits1/2, nonzero radius translates
   corners radially using the first corner's native polar angle minus face
   heading, original sine/cosine lookup, signed products shifted16.
2. `0047346e..004735ea`: rotate about the integer mean of all3/4 face corners,
   in helper order `0047f9b0(angle2)`, `0047f930(angle4)`,
   `0047fa30(angle6)`. Matrix products are shifted14 before centroid restoration.
3. `004735ea..004736d5`: apply global matrix constructed with negative G yaw
   (`0047fab0`, argument2) then G tilt (`0047f930`). Bit1 faces use their saved
   heading instead of live yaw, retaining G tilt.
4. `004736d5..00473772`: effective scale is G scale normally; bit1 faces use
   `scale-trunc(scale/countdown)` while countdown>0, otherwise0. Screen X is
   `anchorX + transformedX*effectiveScale/256`; screen Y uses the corresponding
   negative1/256 constant. Intermediate integer products and float32 stores matter.
5. `00473772..004737cd`: reset an invocation-local selected count to0. For each
   bit2 face while selected<4, D is the first three transformed Z values plus3000.
   If signed threshold is nonzero and >=D, set bit4 and increment selected.
   If threshold<D, store low16(D) into threshold. Iterate original face order.
   Selection happens before triangle clipping/culling, not only on visible faces.
6. `004737cd..00473881`: for bit1/countdown>0, translate every projected corner
   by the truncated `(target-firstProjectedCorner)*(11-countdown)*float32(0.1)`.
   This uses a shared translation, not independent corner interpolation.
7. `00473881..00473c8f`: calculate per-face lighting, split quads as012/023,
   clip/cull, depth-bucket, retain UV/material/tribe mapping, submit through
   `0046c3f0`. These final submission/pixel boundaries require separate validation.

The whole-model path applies the global matrix/scale, ordinary face lighting,
012/023 triangulation and painter submission, without face feedback. Its exact
range is `00472da0..00473205`. Reusing the world mesh's projection/shader would
not establish equality of either screen path.

[feedback-reference.py](building-acquisition-screen/feedback-reference.py) and
[its seven finite cases](building-acquisition-screen/feedback-reference.json)
exercise only steps5/6 and the next phase4 consumer with **supplied transformed
depths**. Cases retain equality/below/zero/above thresholds, signed16 writes,
budget-exhausted skipped threshold writes, unused fourth corners, repeated paused
feedback, same-visit countdown decrement, all-started shortening/no rewind, and
bounded flight scale/shared delta. They do not prove the preceding transforms,
whole controller, companion composition, clipping or visible face count. The
initial harness attempt aliased its Python face dictionaries and failed its first
assertion; distinct records fixed that reference setup without changing equations.

Pause bit2 branches directly to the drawing section at `00483a81`, skipping
motion/visit increments but **not** per-face geometry feedback. A pending phase
still advances first. The per-invocation draw-mode local also remains zero on
this path, so paused calls enter per-face rendering. A modern port must make
this logical UI-visit side effect explicit; uncapped RAF must not select extra
faces. Initial/mid-phase pause needs source-derived reference cases.

## Companion, replacement, pulse and payout ownership

`00481550` calls the building initializer then `00481490`; the latter replaces
the shared companion block at `00988a88`, not the building or spell block.
Its type7/parameter1 then type8/parameter20 sequence is already evidenced in
[worship-grant-presentation.md](worship-grant-presentation.md). Reuse that contract,
with the building initializer's preceding RNG consumption and shared ordering.

`decomp/generated/00480ea0.c` executes pulse, companion, building, spell, then
updates limiter bit4 from the three controller active flags. A new building
replaces building+companion; a spell replaces spell+companion; the other kind's
controller survives. The pulse at`00988a68` survives either initializer.
Building phase4 visits16 creates its100-visit HFX1288..1293 pulse; its phase end
reinitializes that shared pulse with4 remaining. Therefore draw/update order
matters when building and spell lifecycles overlap.

The building stores its gift at B+0xe63, but `00483f56` reads companion+0x5b,
which the subsequent ordinary companion initializer clears. Preserve this
cross-block read; do not substitute the saved building handle or copy spell
arrival acceleration. The accepted probe establishes six-visit hide and
knowledge on gift visit82 under its supplied/intercepted composition. It does
not establish universal payout behavior during arbitrary unrelated replacements.

## Smallest next proof and implementation boundary

The remaining prerequisite is a reviewed **source-derived composed reference**,
not another whole-game native run and not a generic renderer rewrite. The raw
model/HUD input uncertainty is now resolved. The next reference is finite and can
be implemented from the retained source: no new external/native dependency is
identified. Current imported sine2048/atan257 tables match original bytes exactly;
`0047f7b0` is the signed32 product/sum followed by arithmetic shift14 matrix
composition, `0047f930/0047f9b0/0047fa30` construct axis matrices from sine/cosine
arithmetic-shift2 values, and `0047fab0` selects axis2 for the initially identity
global yaw matrix. `0055bc54` explicitly switches x87 rounding to truncation for
the flight delta. Audit hashes bind all these ranges and the float constants.
Remaining unimplemented comparison equations are those complete matrix/centroid/
radial/projection stages, with each signed32 wrap/shift, signed16 store, float32
projection store and truncated target delta; the leaf cases must not stand in
for that composition. Before runtime implementation:

1. Independently translate the scoped G/F transforms and feedback above, using
   exact pinned trig/matrix helpers and integer/float conversion semantics.
   Keep per-face state updates in a reference UI visit, separate from draw-only
   sampling. Compare full state plus face selection order and triangle submissions.
2. Finite matrix: both models, cosmetic seeds1/0x12345678, visible source(420,180)
   and offscreen midpoint, normal through retirement; initial pause, a pause at
   phase3 and phase4 selection, repeated paused draws, and resume. Add explicit
   signed-threshold equality/below/above cases and first/fifth candidate boundaries.
3. Compose existing companion reference with building initialization and scheduler
   order; cover building→building and building↔spell replacement before face
   selection and after destination pulse creation. Compare RNG/state and gift
   timers independently. Use the actual ordinary initializer, not invented
   generic-companion branches. These are supplied source-reference cases, not
   naturally simultaneous campaign events or executed-original proof.
4. Independently review the translation and vectors against retained assembly.
   A matching future browser implementation proves source-reference consistency;
   it must not be presented as new native execution or original GPU equivalence.

After that review, a narrow candidate can add a building singleton and face
draw commands beside the existing acquisition state, reuse companion/pulse and
the logical UI clock, add model-keyed building-card measurement, and retain full
checkpoint state. Keep `world-turn.ts` as the hide/grant owner, preserve the
existing world sprites, and keep untagged legacy gifts from replaying. No proposed
change to global animation clocks, model imports, construction or knowledge rules.

## Ordinary witness feasibility and verification status

The accepted M1 driver at`91c9453061e92aa2ada4f4c170904b47c7e56a98`,
`scripts/local-render/mission1-vault-knowledge.mjs`, has a genuine Bridge-first
route: worship → earned Bridge → shore cast → crossing → guard → public Save →
Load → Vault command33 → camp construction. It runs normal RAF/speed1 and does
not inject World, actors or stock. Review/adapt only its passive screen observer
and current input contracts after the candidate is fixed; do not freeze a route
whose current guard step has not been validated. The existing guard method uses
accepted terrain-cell spell input, not a person-picker chase.

Historical continuation08 passed on`2bb0a161` with unchanged saved turn946/full
SHA`d737edcff40882186b99f996a7243df01659bf02f3504eedff36f15398391f33`.
It does not authorize loading that profile under changed app inputs:
`scripts/local-render/owned-profile.mjs:87..96` requires exact application/runtime/
root/origin binding. Use a **fresh profile and public M1 prefix**, then save a new
same-source pre-acquisition checkpoint for interruption/repetition. Leave946 alone.

For M3, the maintained public startup permits `Start game → All missions →
Mission 3` without campaign progress. The recovered
[ordinary real-RAF route](https://github.com/JohnDeved/populous-new-dawn/blob/b45073eb75f8e2c8aa66ef809e76eaf621a68fc0/qa/campaign-continuity/scenario.mjs#L634)
commands the original Shaman directly into the Vault. Its retained
[successful milestone](https://github.com/JohnDeved/populous-new-dawn/blob/473da60f62d8a08e95a18d9802d4444e71a4c636/references/verification/current-campaign-continuity-source-2026-10-05/mission-three-prefix-bcf8ac55/campaign-continuity/mission-three-segment-01/m3-milestone-vault.json)
reports Temple unlocked, Shaman100HP, cast0/bridges0 at turn1555. The enclosing
historical campaign harness remains FAILED; that status must not be upgraded.
Use a fresh candidate profile and live actor IDs, not the old complete harness.
The old suspended-RAF preacher checker is not a real-time screen witness.

The separately reviewed local witness plan is
`mission1-vault-driver-20261007/work/orchestration/prepare-vault-screen-witness-20261008/plan.md`
(sibling worktree; SHA256`1dd91f6a5f325c9ce90af58414a7f5875dab9c7d85fad0bdaba577e916c71a27`).
It is unpushed planning, not a receipt. Capture locked-card baseline, gift birth,
six-visit handoff, first real whole/per-face screen renders, independent81/82 grant,
and final enabled-card selection. Then cover natural pause, synchronous public
Save/Load replacement, restart cleanup and resized display mapping from a new
same-source checkpoint. Full construction/battle/victory need not be repeated for
a screen-only change. World visits, UI visits and actual renders remain separate.

This packet's static data/hash/conditional-layout audit and seven supplied-depth
CPU-reference cases passed. Full controller
reference comparison is **not run**, browser/standard code gates are **not run**,
and native execution is **not run**. These are deliberate scope boundaries, not
passing runtime acceptance. No parity file, generated model/atlas or app changed.
