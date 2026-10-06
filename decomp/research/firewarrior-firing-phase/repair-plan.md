# Bounded firing repair

Implementation base: b0208188b8de345a6ad5e86cb7c49769624dda86.
Proof transfer: 4a5e19b2; all 61 source/evidence files match c8732a30 exactly,
with byte hashes in transfer.json. Historical native and ordinary records remain
unchanged on their original evidence branch and in this transferred evidence.

The independently frozen owned-projection.json (SHA256
5ea3bf389c59cb4ecbf98b19f98566939103e14ce49301b7fb64b330289d0128)
is the prospective acceptance policy. Every completion boolean and visit presence
must match. During incomplete visits compare animationMode, object, draw, f1, f2,
timer, the full assignment word, renderFlags, morph, palette, mapped projectile,
normalized cooldown, and flags2 bit0x40000000. Facing, other flags, caller state
and all terminal residual fields remain raw diagnostics. No whole-command or
elapsed-time claim follows from this projection.

## Failure first

Before any runtime/importer edit, read-only command:

```
python3 decomp/research/firewarrior-firing-phase/compare-owned.py \
  evidence/firewarrior-firing-phase/native-comparison-20261006/native.json.gz \
  evidence/firewarrior-firing-phase/native-comparison-20261006/port.json.gz
```

Exited 1 with 238 owned differences across the unchanged 16 cases; first is
person-entry-walk-frame3, visit0, object56 versus48. The original 394 full-record
diagnostic comparison is not rewritten. The recorded initial normalized states
all match. Tests/firewarrior-firing-phase.test.mjs executes the actual existing
private body via the reviewed import-hook exposure, using unchanged native
fixtures/records, and asserts those active fields plus every completion boolean,
visit count and paired projectile attribution. It retains terminal diagnostic
fields without claiming their equality. Tests/firewarrior-firing-artwork.test.mjs
requires the missing firing key and raw VFRA90–114 cycles with original mirrors,
while preserving melee120, resting720 and idleGesture728.

## Production scope

Only the ranged substate10/11 phase lifecycle in app/live-building-combat.ts:
consume changed-target entry, set pending0x10, use existing row-aware setter for
row15, reset f1=1/f2=0 on firing/recovery entry, assignment0x200 while firing,
derive duration then decrement on entry, defer44→40 initialization, initialize
recovery with render hold and six then decrement, and initialize32→31 cooldown.
Preserve current outer completion and facing owners. Reuse shared functions;
no global clock/FPS/renderer changes or unrelated phase rewrites.

## Importer preservation

Extend only append_unit_families in scripts/import-original.py, after its existing
Shaman/resting720 sequence. Resolve row15/model6 → object94 → source56/draw13;
append directions56–63 as separate firing keys for Blue/Red. Existing generic
native-source lookup supplies other tribes through descriptor overlays. Append
25 unique missing VFRA frames and 80 missing HSPR pieces; reuse shadow source22.
Do not replace melee/fallback chains. Keep all old frame/piece indices, metadata,
animations, frameCounts and occupied atlas RGBA bytes. Existing source720 and728
remain untouched. The existing shared shadow's flag qualification remains; no
new raster/blending claim.

The bounded --units-only importer is the only producer of original-units.json,
unit-layers.png and their three provenance fields. Decode original VSTART/VFRA/
VELE/HSPR/PAL inputs from prerequisites/game after checking recorded hashes;
validate every old rectangle against original data before writing. Compare old
metadata prefixes and animation maps to b020, plus every old occupied pixel,
all appended source cycles/layers/pixels and a second import's idempotence. No
full asset regeneration, fixtures/parity recording or unrelated writes.

After implementation freeze, obtain fresh independent source/probe review before
any native/browser/full run. Execution lanes and the sole dependency installation
remain with the coordinator. Standard check/build/quality and affected native/
ordinary rendered acceptance remain required, with source/input-bound receipts.
