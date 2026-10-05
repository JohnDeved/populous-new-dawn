# Independent review: Mission 3 Vault world HFX proof

**ACCEPT for the bounded world-presentation implementation.** The source and
execution support a dedicated Mission 3 Temple HFX body/glow consumer, the
occupied Vault socket, separate marker/gift ownership, and a draw 43 cursor on the
existing animation boundary. This is not final implementation, pixel, cadence,
whole-game, or class-2 screen-sequence acceptance.

- Base: `71b3860e7025a9534d56248c194aa18610b5df4d`.
- Frozen probe: `scripts/probe-native-vault-knowledge.py`, SHA-256
  `48ca690c78230073b0f1a69ee203d252ed768bb2efcc11ba44ff434b067b530d`.
- Producer result: `work/orchestration/vault-hfx/native-attempt-1/probe-result.json`,
  SHA-256 `6f897f8a6260d52c9dd5f9debfe7f1dfd9eedd514e12606448b060b6ab1f8cc8`.
- Producer receipt: same directory, `receipt.json`, SHA-256
  `1e4cdbfad6ca7272af8325ee95b2b77e86e0d862f835df20db7c044f856d56ad`.
- Canonical EXE SHA-256:
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Accepted findings

1. The earlier independently reviewed research head `d749b15` supplies the authored
   record, class dispatch, descriptor and socket chain. I read that prior review,
   the full current probe, and its complete delta from that head. The new proof
   executes `004ef180` and `004edcf0`; it no longer supplies their outcomes. The
   remaining removal hooks supply global-list, sunlight and cell bookkeeping.
   Real removal marks source 900, marker 901 and marker-owned glow 902 class 0 while
   newly allocated gift 903 and its distinct glow 904 stay class 6. These supplied
   bookkeeping leaves do not prove global-list unlinking or later pool reuse.
2. Real `004ee770` and `004ee7b0` advance the glow cursor by 4 and wrap 56. The
   original descriptor at `005a6af8 + 43*11` is
   `[1,14,0,4,1,0,0,0,1,4,0]`: primitive 1, fourteen frames, increment 4, animation
   kind 1. Descriptor 0 is `[1,1,0,0,0,0,0,240,0,6,0]`, and the body stays 1079 with
   cursor 0. Native bytes independently confirm the global pause bit and the
   case 1 increment/wrap path. The supplemental execution freezes a supplied
   nonzero cursor 20 while paused and reaches 24 when resumed.
3. Original selector bytes `004689a4..00468a09` use the HFX table; for a descriptor
   with multiple frames they add unsigned `f1 >> 2` to the base object. At cursor 24
   they select 1423. Varying only the glow morph byte between 0, 1, 7 leaves that choice
   unchanged; draw 43's case 1 does not consume the morph table. This supports
   HFX 1417–1430, not a morph animation or fourteen VFRA entries.
4. The continued primitive slice executes bottom-center placement, real
   `00516270`, `005162e0`, `0047dc50` and `004f95a0`. With supplied projected point
   `(320,240)`, body 1079 is 21×23 and queues at `(310,217)` with renderType 17,
   queueFlags 0, vertexFlags 0 and diffuse `ffffffff`. Glow 1417 is 81×68 and queues
   at `(280,172)` with renderType 18, queueFlags 2, vertexFlags 8 and diffuse
   `fff7ebc9`. Those are native queue outputs, not final screen pixels.
5. Hash-pinned Mission 3 header byte 96 is 25; the established bank resolver maps
   that to `p` (`25+0x57`). Actual bank-p PAL and AL bytes are loaded and guarded.
   Original `00516270` bytes read the palette RGB through AL selector offset
   `0x2f82`. Direct original uploader bytes show queue bit 2 selects palette slot 1;
   original palette constructor bytes implement `AL[(value|15)*256]` RGB and
   `(value&15)*255/15` alpha. Together these support ordinary opaque positive-run
   body pixels and AL/nibble-alpha glow pixels tinted `#f7ebc9`. Texture-cache
   upload, pixel-format quantization, edge expansion/filtering and final device
   blending remain outside execution.
6. The native occupied Vault socket remains body offset 1072 above supplied
   terrain 200, with glow 80 below the body. The sixth gift object visit reaches
   visualPhase 0, removes its glow and enters the existing class 2 handoff. Original
   `004facf0` bytes/export set body hidden bit 16 on that same phase transition;
   supplemental post-run inspection confirms the hidden body and retired glow 904.
   Object visit 81 is remaining 1/knowledge 0/not removed; visit 82 is
   remaining 0/knowledge 32/removed. The new proof supports no payout-time change.

## Independent execution and integrity

One authorized replay ran on CPU 4 after the producer released it:

`timeout --signal=TERM --kill-after=2s 20s taskset -c 4 ../prerequisites/venv/bin/python -B work/reviews/vault-world-proof-48ca690c/rerun.py`

It completed in about 1.19 seconds including supplemental checks. The wrapper ran
the unchanged frozen probe and required every semantic result to equal the
producer's JSON (only elapsed seconds excluded). All 254 guarded regions passed;
the wrapper additionally asserted queue modes/colors, draw/morph bytes, nonzero
pause/resume, cursor-derived HFX identity, gift hidden/glow retirement, and exact
visits 81/82 payout. CPU 4 was released immediately. See `native/probe-result.json`,
`independent-rerun.json`, `stdout.log`, `stderr.log` and `rerun.py` here.

The harness was inspected before execution. It hash-checks ten canonical inputs,
uses the existing verified PE loader and constant configurator, runs only finite
Unicorn calls, and writes only its requested output JSON. It does not launch
Windows or install anything. Original code/read-only sections, configured
constants, relocated geometry/shapes, HFX entries and bank-p PAL/AL have before/
after snapshot guards. Fixture gameplay/controller state intentionally changes;
these are integrity guards, not complete write instrumentation.

All intercepts are explicit in `result.interceptedLeaves`: cell insertion and XYZ
relocation; fixed terrain 200; sunlight; head presentation; cell refresh; global
list/sunlight/cell removal bookkeeping; sound; HUD/landscape/renderer rectangles;
display requests; geometry renderers; companion controller; limiter; sprite-bank
and frame-index resolution; texture-cache upload; arrival/center feedback; and
campaign notification. The bank/cache fixture supplies dimensions and valid cache
handles. It does not supply the palette selection, diffuse color or render type.

Direct canonical-EXE disassemblies are retained as `primitive.txt`, `cursor.txt`,
`palette-submit.txt`, `palette-uploader.txt` and `palette-construction.txt`.
`structural-review.json` binds all review artifacts, source fingerprint and
producer receipt/log hashes. Python AST and JSON parsing passed. App files were
untouched through the proof replay; pre-existing new paths were the frozen probe
and failure-first `tests/vault-knowledge.test.mjs`. All reviewer writes remain in
this ignored review directory.

## Implementation limits and next acceptance

Proceed with the proposed minimal source-owned bank-p atlas, explicit HFX body/
glow consumer, existing Gift fields, one optional Shrine glow cursor and existing
`animateLiveObjects` registration. Reuse the existing canonical RLE decoder and
verify every generated pixel/hash; preserve all prior shared atlases and metadata.
Keep Mission 3 Temple scope explicit rather than silently recoloring other Vaults
with bank-p assets. Separate marker and gift presentation must survive checkpoints
and pause and retire with their respective owners.

This proof has supplied allocation/link/occupancy/completion/viewport inputs. It
does not execute whole-level startup, natural command/worship, allocation failure
matrices, final projection/sorting/raster, native scheduler wall-clock cadence,
class 2 per-face/whole-geometry raster or companion composition. Existing animation
cadence is an allowed integration boundary, not newly calibrated native timing.

Final exact-code acceptance still requires full-diff review, live-path tests,
source-owned importer/asset negative and idempotence checks, applicable TypeScript
quality gates, required standard check/build and comparable rendered browser
evidence. No final-pixel, hardware performance or parity credit follows from this
native proof alone. No world-init/world-turn/payout/new-clock/native-pool/screen-
geometry change is justified. Maintained TypeScript quality checks are not yet
applicable to this proof-only review; no TypeScript app change was accepted.
