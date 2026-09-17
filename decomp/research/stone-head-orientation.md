# Stone Head authored orientation and source-field loss

**2026-09-18.** This is separate from the model45 morph work. Correct raw-point
interpolation does not establish that the object was given the correct world
heading. No global angle offset, camera compensation or animation change is
supported by the evidence below.

## Two distinct source errors

A reward trigger is class6/model6. Its colocated visible Stone Head is a separate
class5/model9 scenery object. The post-load linker
[`004851e0`](../generated/004851e0.c) associates the first such scenery object in
the same512-unit native cell; it does not copy the trigger's settings as a heading.

The original per-object postprocessor
[`00485b00`](../generated/00485b00.c) copies the little-endian **unsigned16-bit
word at scenery record+10** to runtime object+`0x26`. For class6, bytes7onward have
a different meaning: mode, range and other controller settings. They are not an
angle, even though the old generic importer labels the first four bytes `angle`.

There are therefore two independent faults in the previous source-to-render path:

1. `world-initialization.ts` derives ordinary `shrine.angle` from the **trigger's**
   overloaded dword at record+7. Its low bits often encode mode/range and yield256
   or259, unrelated to the decorative orientation.
2. `scripts/import-level.py` also reads record+7 as a dword for scenery. That
   includes the low heading byte at+10 but omits the high byte at+11. Merely
   switching the consumer to the existing `scenery.angle` would still lose real
   authored headings such as1024and1536. A missing high byte cannot be recovered
   by a sign flip or a universal quarter-turn correction.

## Canonical examples

The focused original checker hashes the supplied executable and level files,
passes the actual55-byte scenery records to the original postprocessor, and
verifies that subsequent model selection preserves the loaded heading.

| Mission / trigger / scenery | Original selected family | Previous runtime heading | Original scenery heading |
|---|---:|---:|---:|
| 1 / 30 / 32, Bridge | 45 | 256 | 0 |
| 1 / 28 / 33, Lightning | 45 | 256 | 0 |
| 3 / 101 / 102, Erosion | 149 | 256 | 1536 |
| 5 / 116 / 117, Convert Wild | 45 | 256 | 1024 |
| 5 / 113 / 114, landscape head | 149 | 256 | 1536 |
| 22 / 141 / 142, mode3 head | 8 | 259 | 0 |

For Mission3's scenery102, the leading raw bytes are
`0905ff00010085000000000600000000`: bytes10/11are`00 06`, or1536. The old imported
scenery `angle` is nevertheless0 because its four-byte read ends at byte10.
Mission5 scenery117 similarly contains heading bytes`00 04`, or1024, while the old
scenery angle is0. This proves that using the decorative object's existing angle
alone would not fix the user report.

The mapping defect affects45, mode3/base8 and other decorative families. The
orientation correction must not change which family is selected, manufacture
model8/149 geometry or alter Worker5's separate static-identity work. The initial
live direction check is intentionally scoped to available model45 actors; the
mode3/149 heading-preservation proof does not certify their browser artwork.

## Angle units, axes and camera independence

The native draw consumer [`00471490`](../generated/00471490.c) reads object+`0x26`
and applies **negative heading about basis axis2**. Angles index the2048-entry sine
table. Imported geometry reflects native map-Z into browser-Z; the existing
`GameScene.orientModel` applies `rotation.y = -heading * Math.PI / 1024` and records
`nativeHeading` from the same angle. The current sign convention is consistent
with the original basis. Cardinal-direction tests exercise both sides without
modifying the shared projection or shader.

Model-local keypoints are independent of this orientation. Camera bearing changes
the view matrix, not the authored object's heading. There is no evidence for a
new global45degree offset or a heading dependent on the camera. The focused paired
render check must compare the browser heading against the **loaded original
scenery record first**, rather than pass the browser's own arbitrary heading back
to the native renderer and mistake agreement for source correctness.

## Producer boundary and presentation repair

The required producer datum is an optional `heading` field containing the complete
scenery record+10word for class5/model9. It was absent at the initial checkpoint;
CEO then reserved the one-line importer addition and exact additive level metadata.
The patch adds63heading fields across23affected campaign/tutorial files. Mission12,
which has no matching scenery, is unchanged. Source hashes match the original level
bytes, and deleting only the new members restores every old decoded value and the
previous file text byte-for-byte. No broad importer, morph/model/atlas regeneration
or provenance change is used. The missing-field condition is not silently treated
as zero.

The reserved `app/stone-head-orientation.ts` helper resolves decorative scenery by
native cell and converts a supplied canonical heading to radians. The two
ordinary-head scene call sites use that value for initial placement and updates.
Vault returns its unchanged angle. Reward state, animation counters, camera
transforms and saved gameplay data are not mutated. Existing saves can therefore
use the canonical authored heading at render time without replaying gameplay or
rewriting their legacy angle field. An unsupported/missing source keeps its old
fallback and remains a validation blocker, not a successfully repaired head.

## Reproduce and limits

```sh
node --test tests/stone-head-orientation.test.mjs

# Original isolated instructions: submit through the canonical shared queue.
python3 -B scripts/check-native-stone-head-orientation.py /path/to/original-game \
  --output /path/to/new-orientation-result.json
```

The original checker uses the existing `native_cpu` environment. Its no-capture
mode verifies six actual authored cases and ten labelled uint16boundary fixtures;
model45/149/8selection preserves the scenery heading. Canonical resource buffers
are relocated into supplied memory and selected reward flags are supplied, not
claimed as a fresh test of every trigger. No compared body is intercepted. The
executable SHA is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`;
level/resource identities and exact observations appear in the result.

Optional `--live-models` checks a few actual head/camera poses through complete
original drawing and picking commands. It reuses selected morph poses rather than
rerunning the whole18-phase animation/reward suite. A fresh headless page verifies
initial heading, camera independence, picking and checkpoint restoration without
OS input or window-focus manipulation. These checks do not imply hardware FPS,
full native GPU rasterization, other-family artwork, sound fidelity or issue21
closure. The PR must record whether the producer dependency and actual live checks
have passed; helper tests alone do not complete this repair.
