# Mission 3 Temple knowledge world sprites

Refs #23. This implements only Mission 3's bank-p Temple world marker, collected
body and their independently owned glow. Building screen acquisition, other Vault
rewards, side-fire recollections, global animation cadence and payout changes are
outside this slice. No parity credit is requested.

## Reused and new native evidence

[Accepted research d749b15](https://github.com/JohnDeved/populous-new-dawn/blob/d749b15be097573201666064c1eae7b0f1dd3c93/decomp/research/vault-knowledge-presentation.md)
established the authored record 91 → record 92 Temple payload, separate startup
marker, actual clone/copy/dispatch order, HFX1079/HFX1417 resource identities and
the consistent 82-visit payout. This branch's extended
[probe](../../scripts/probe-native-vault-knowledge.py) preserves that chain and
additionally executes:

- `004ef180` source/marker deletion and `004edcf0` collected-glow removal. At
  finite completion the original source, model 10 marker and its glow become
  class 0; the new model 2 gift and its own model 8 glow remain class 6. Gift visit 6
  hides its body and removes only its glow. Knowledge remains absent through
  visit 81 and is set on visit 82.
- `004ee770 → 004ee7b0` on the real allocated list. Draw 43 advances its signed
  quarter-frame cursor by 4 and wraps at 56, selecting HFX1417–1430. Native pause
  blocks advancement. Morph 1 is a sprite depth bias, not a geometry morph.
- World primitive 1 instructions `004689a4..00468c2b`, including bottom-center
  placement, `00516270` palette selection and actual `005162e0 → 0047dc50 →
  004f95a0` queue initialization. The supplied screen anchor `(320,240)` produces
  HFX1079 at `(310,217)`, render type 17, no alpha flag and ARGB `ffffffff`.
  HFX1417 produces `(280,172)`, render type 18, queue alpha bit 2, vertex flag 8 and
  ARGB `fff7ebc9`. Original dimensions are 21×23 and 81×68.

The canonical EXE is SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Mission 3 header bank 25 selects palette suffix p, as already established by
`check-native-early-mission-skies.py`. The probe pins header, level, PAL-p, AL-p,
HFX, geometry/socket and constants inputs and guards their mapped bytes.

The extended frozen probe SHA256 is
`48ca690c78230073b0f1a69ee203d252ed768bb2efcc11ba44ff434b067b530d`.
Its initial result SHA256 is
`6f897f8a6260d52c9dd5f9debfe7f1dfd9eedd514e12606448b060b6ab1f8cc8`.
Independent review replay matched all semantic output and all 254 guarded regions.
Supplemental checks verified nonzero pause/resume and that cursor 24 chooses
HFX1423 regardless of morph 0/1/7. The independent review accepted the bounded
world-resource/lifecycle proof, not final pixels or absolute cadence.

Supplied boundaries remain explicit in the result: trigger allocation/link
resolution, finite free lists, occupied Vault fixture and terrain 200, forced
command 33 completion, renderer viewport/anchor, sprite bank/cache handles, final
device upload, cell/global-list/sunlight bookkeeping, audio, UI/geometry/companion
leaves and campaign notification. Original removal decisions, sprite selector,
palette/queue initialization, cursor and knowledge-bit write execute. Allocation
failure coverage and original-game replay are not claimed.

## Owned assets and live integration

[import-vault-knowledge.py](../../scripts/import-vault-knowledge.py) owns only
`app/original-vault-knowledge.json` and `public/original/vault-knowledge.png`, listed
in `engineering/generated-files.json`. It reads the Temple body descriptor,
draw 43 count/step and authored Mission 3 source from pinned inputs. It imports one
ordinary-PAL body plus fourteen AL nibble-alpha glow frames into a dedicated atlas.
The fixed palette 0 diffuse tint `[247,235,201]` is baked into encoded RGB; opacity
comes only from the original nibble alpha. Original shared atlases are untouched.

The existing PSFB/AL decode is reused from `import-original.py`; original palette
slot and uploader behavior are documented in
[the accepted sprite-bank/alpha note](worship-acquisition-body-raster.md).
Metadata retains every source frame, dimensions, rectangle and complete RGBA hash.
The importer is idempotent, refuses partial/differing installs and supports a
read-only `--check`. The [asset checker](../../scripts/check-vault-knowledge-assets.py)
independently reproduces the output, checks canonical pixels, tests failed-input
preservation, and compares prior HUD/effects/person metadata and image bytes.

Ordinary `createWorld(3)` gives the authored Shrine one saved glow cursor.
`createGift` recognizes only that Mission 3 Temple source, including wrapped native
coordinates, and uses existing gift position/height/frame/animation/sprite fields.
Its placement uses the original occupied Vault socket 1 offset 1072 instead of the
generic 800. The existing phase 6 hide and timer 82 payout owners remain unchanged.

The renderer uses explicit HFX atlas rectangles, ordinary body opacity and the
separate alpha glow. It retains bottom-center integer-half-width placement,
existing scaled-sprite projection and native sprite depth biases. Mission 3 requires
the dedicated texture before its first visible scene. It never indexes HFX IDs
through compact VFRA person frames.

New-world creation and checkpoint migration initialize absent marker cursors.
New checkpoints retain nonzero cursors; legacy checkpoints start an absent cursor
at 0 without guessing elapsed history or replaying rewards. A valid collected gift
keeps its saved position/cursor; legacy gifts recover presentation only, retaining
IDs, phase, timer and knowledge state. Deactivation stops marker advancement.

## First displayed frame and clock boundary

The original draws before `004ee770`; the existing browser clock updates before
rendering. The local Shaman presentation adapter already handles this difference
by latching before advancement. This slice follows that same pattern: the marker
cursor retains `displayedFrame`, and the gift uses existing `Effect.sprite.frame`.
Both are initialized to 0 and latched before their own cursor step. Rendering reads
the latch. A gift born exactly on a turn/animation boundary therefore first shows
HFX1417 while its next cursor is 4; the following boundary displays HFX1418.
Hidden gift glows stop both cursor and display-latch advancement.

This reuses the current chronological 24 Hz adapter. It does not change that rate
or settle issue 214's broad animation-speed report. The native per-visit sequence,
browser frame-rate independence and absolute original wall-clock cadence remain
different claims.

## Verification boundary

Failure-first portable tests observed the old frame 1077, missing marker glow state
and collected terrain+800 placement while timer 82/phase 6 already matched. A later
first-frame test failed before the local draw latch was added. The first candidate
also exposed wrapped-coordinate legacy migration; matching was corrected without
resetting existing cursors or reward state. Raw failures remain retained.

Focused tests cover ordinary command 33 acquisition, exact hide/payout visits,
separate cursors, new/legacy/nonzero checkpoint state, pause/deactivation,
first-visible-frame ordering and unrelated-family controls. TypeScript, formatting,
canonical asset checks and final standard/rendered gates are recorded in the PR
evidence; no passing browser or full-campaign result is implied by this note.
