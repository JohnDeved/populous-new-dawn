# Issue 22 Totem Pole model prerequisite — bounded source proof

**18 September 2026. Base: `9e77367ba3cbcadab236e817138ae6b7704127f7`.**

This slice answers one question only: is the missing normal-campaign Totem Pole
presentation an independent worship model that can be reserved without touching
Worker1's parked default149/cadence scope?

The answer is **no**. The authored Mission 10 Totem Pole and its linked Erosion
Totem both select original object **149**. Model149 is exactly the parked Worker1
family, so a second import/provenance/runtime reservation would duplicate an
existing owner. No shared generated output or gameplay file was changed here.

No new native executable run was performed. The selector result reuses canonical
job `08b82309-9c3b-4519-89bc-fda212fba046`; model geometry uses the existing
`decode_original_model` decoder against the already hash-pinned bank-2 files.

## 1. Normal campaign producer: Mission 10

The first authored Mission 10 objective is class-6/model-6 trigger **119** at
browser `(29,-67)`, with colocated class-5/model-9 scenery **118**. Its settings
begin `[0,1,0,1,2,0,...]`: presentation mode is 0, required worshippers are 2,
and it has one use with target 64.

Its five authored links are:

- index 144, class-7/model-90;
- indices 145 and 146, class-7/model-26;
- index 58, the next class-6/model-6 trigger at `(-5,21)`;
- index 59, class-5/model-9 scenery for that linked trigger.

The linked trigger **58** is also mode 0, two worshippers, one use, target 64.
Its colocated scenery **59** has native heading 1024. Current
`createWorld(10)` exposes trigger119 as the rendered `Totem Pole` and stores
trigger58 as its `linkedShrine` named `Erosion Totem Pole`.

This is the existing normal player path already exercised by the Mission10
campaign work; it is not a synthetic selector fixture.

## 2. Why the Totem selects model149

Retained post-load source `004851e0` clears presentation bits 0x10/0x20 on the
class-6/model-6 head, then sets them only when a linked class-6/model-2 reward
source has native mode 1 or 3. Trigger119 has no class-6/model-2 reward link, so
its derived presentation flags are **0**. The same is true for linked trigger58.

The retained original selector job executed `004fbd20` against the verified
executable and proves:

- mode0 + flags0 -> **object149**, draw4, presentation4;
- mode0 + flags0x10 -> object147;
- mode0 + flags0x20 -> object45;
- mode3 -> object8;
- mode5 -> object157.

Therefore Mission10 trigger119/scenery118 and trigger58/scenery59 both select
**149**. This is a source-qualified result, not a blanket rule for all mode0 or
all `stoneHead:null` records.

### Negative controls

The unresolved object147 selector row is not an independent Totem target in the
campaign data scanned here. Its authored single-player occurrences are mode4
Vault controllers with a linked class-6/model-2 mode-1 source; current
initialization intentionally renders the separate Vault model154 instead.

Mission10's class-7/model-90 link is also **not** the Totem mesh. Reviewed
Mission10 completion evidence shows `004fb270` clones model90 only after worship
completion as a linked terrain/effect payload. The Totem presentation is the
class-5/model-9 scenery object passed by `004851e0` into `004fbd20`.

## 3. Base149 geometry and atlas coverage

Read-only decoding of model149 from the accepted bank-2 source files gives:

- `objs0-2.dat`
  `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`;
- `facs0-2.dat`
  `01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a`;
- `pnts0-2.dat`
  `09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911`.

Object149's record is 51 faces, 51 raw points, scale 160, face start 10675,
point start 9217. Existing decoder output has canonical SHA-256
`4500fc0e919cc8362f22900a100918f7aceb4c779212a09f2fb9c6724ee19a53`,
258 expanded vertices / 86 triangles, face modes 4/6/7, and panel height 503.

Its only texture tile IDs are **159 and 167**. All decoded UVs are within
`[0,1]`; both tiles are inside the shipped 256x1024 atlas
`fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0`.
Thus the static base mesh needs **no new atlas pixels**.

Current main still has neither model149 in `app/original-models.json` nor 149
in provenance `modelIds`.

## 4. Current caller and checkpoint boundary

Current `world-initialization.ts` creates the root and linked Mission10 Shrine
objects through `worshipAppearanceModel(mode)`. That helper currently maps only
mode3->8 and mode5->157; ordinary mode0 falls back to model45. Consequently both
the live `Totem Pole` and stored `Erosion Totem Pole` are model45 today.

On completion, `world-turn.ts` pushes the already-created `linkedShrine` into
`w.shrines`; it does not reconstruct presentation identity. Checkpoint migration
recurses through `linkedShrine`, but its existing appearance migration only
upgrades the accepted mode3/model8 and mode5/model157 cases. A structured-clone
Mission10 checkpoint therefore preserves both Totems as model45/stoneHead-null.

The existing scenery-heading path is already adequate for the producer:
scenery118 heading0 and scenery59 heading1024 remain source data for orientation.
No new heading or camera offset is justified.

## 5. Exact blocker: no independent reservation exists

The assignment excludes Worker1's parked **model149/cadence** work. The proved
Totem Pole identity is exactly that family. Worker1's existing parked reservation
already includes the same required base149 import, provenance addition, authored
source qualification, presentation state/cadence, scene integration, and
checkpoint policy.

Therefore this branch must **not** reserve or implement:

- model149 in `app/original-models.json`;
- model149/provenance output;
- a mode0->149 runtime selector;
- model149 presentation/cadence state;
- scene/model149 rendering integration;
- model149 checkpoint hydration.

There is no missing decoder and no missing normal campaign producer: both are
proved above. The blocker is the explicit ownership boundary. Inventing a
different Totem model (147, 90, 45, 157, or 8) would contradict the retained
selector and authored Mission10 graph.

## 6. Acceptance if the existing 149 owner resumes

No acceptance job is run in this prerequisite because no independent
implementation is justified.

The smallest normal-path acceptance remains the existing Mission10 campaign path:
use real selectable followers to worship trigger119's rendered Totem, verify
model149 at scenery heading0, let normal completion reveal linked trigger58,
verify its model149 at scenery heading1024, save/load before second-Totem
completion, then complete the normal Erosion Totem path. Picking, old/new
checkpoint behavior, work/RNG/reward invariance, and the existing linked terrain
effects should be asserted without injected progress or duplicated native probes.

Proof artifacts:
`work/orchestration/issue22-totem-model/producer-proof.json` and
`asset-proof.json`.
