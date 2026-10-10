# Missions 1–3: shared authored environment selection

Issue [#14](https://github.com/JohnDeved/populous-new-dawn/issues/14) already owns
terrain, skies and ambience. Johann's October 10 report says Missions 2 and 3
retain Mission 1's appearance instead of their original colors and trees.
This inventory establishes source/data differences and current loader gaps; it
does **not** independently reproduce a rendered defect or complete the issue.
The existing early-mission sky implementation and sky-only PR #162 do not cover
the terrain and vegetation work below.

## Frozen source and permitted work

- Comparison source: `35de8e6ca6864a98aff3bca0f263e87eee7fa65c` (fresh main,
  isolated research worktree). Runtime code and imported assets are unchanged.
- Canonical archive SHA256:
  `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
- Existing Binary Refinery 0.10.11 reads only 32 selected Component0 members.
  `inventory.json` retains exact member names/components, sizes, SHA256 values,
  comparison-source hashes and computed metadata. No raw members or archive
  are published.
- Pure helpers from `scripts/import-original.py`, SHA256
  `02127ee637d42c033119a16045c26b01adaa7d8c2833a82c3bedd03d247039e0`, decode
  geometry and atlas pixels **in memory**. Its main importer never runs.
- No installer/original instruction, game, browser, native probe, dependency
  installation, regression test or asset generation is run. Data integrity
  assertions are part of the inventory, not gameplay validation.

## What the supplied data proves

| Mission | Header landscape byte | Selected landscape | Header object byte | Resolved objects | Authored tree models/counts |
| --- | ---: | --- | ---: | ---: | --- |
| 1 | 12 | c | 0 | 2 | 1:15, 2:2, 3:1, 5:1 |
| 2 | 28 | s | 0 | 2 | 1:24, 2:5, 3:6, 4:1 |
| 3 | 25 | p | 6 | 6 | 2:3, 3:46, 6:1 |

All three original 616-byte header hashes match imported mission data. Retained
`0042a140.c` and `early-mission-skies.md` bind landscape characters to successful
palette selection; `0040c670.c` redirects object byte 0 to 2. Landscape and
object-bank selection are independent. Do not infer the object bank from c/s/p.
These findings do not establish original Windows file-open or rendered behavior.
Tree counts above come from the hash-recorded imported mission files; original
DAT placement decoding was not repeated in this inventory.

Terrain combines PAL (1,024), BIGF (294,912), CLIFF (8,192), DISP (65,536) and
FADE (16,384) bytes, in that order. Each of the five c components differs from
both s and p. All bundles remain 386,048 bytes:

| Bank | Concatenated terrain SHA256 | Matches shipped landscape.bin |
| --- | --- | --- |
| c | `8b23328932f2aeac33a0ce65e64cc0ab9bc110fe35a812b1d53ab81f9e68f68f` | yes |
| s | `e4bbc3509b7eae22ed24648e0a7161ba940a723de1720a9ff479e842075aaaac` | no |
| p | `a07fc142b38441dd65bc99e55e2eb8f33a6423b4d02b3662f3be78e4eb4880f9` | no |

All three BL320 indexed files are byte-identical
(`26fbee4d3cb590462e1ef3c9afe1964283f1b662e8c58057ed8f2cbf324b2a05`). Their
PAL/AL tables differ. Established `object_atlas` plus `object_texture` decoding
produces distinct c/s/p RGBA atlases, with 79 changed tiles against c in each
case. All alpha bytes remain equal. The full c result exactly equals the shipped
atlas. This preserves the existing AL color/nibble alpha, ARGB4444 quantization
and edge expansion; approximate RGB tinting would discard original behavior.

Every one of the 78 currently imported model records equals decoded bank 2.
Only meshes 13–18 differ between banks 2 and6 within that imported set. All six
have changed positions, UVs, faces, tiles, normals, modes, biases and panel
height; scale remains 160. This does not inventory unimported model records.

| Tree mesh | Bank2 triangles | Bank6 triangles | Bank2 tiles | Bank6 tiles |
| --- | ---: | ---: | --- | --- |
| 13 / 16 | 38 | 54 | 129,222 | 129,222 |
| 14 / 17 | 69 | 38 | 129,136 | 129,222 |
| 15 / 18 | 81 | 29 | 129,136 | 222,231 |

Tree tiles 129/136/222/231 have identical decoded pixels in c/s/p. In these
inputs, Mission 3's distinct tree artwork follows its object geometry/UV choice,
not a tree recoloring. Mission 2 shares object bank 2 but has a different authored
tree distribution and landscape; do not invent a different geometry bank for it.

Bank6 assigns shadow-shape index1 to meshes 13–18. Bank2 uses0/1/5 for
13/14/15 and repeats for16/17/18. The existing scenery routine maps0 to1, so
the material difference is meshes 15/18 changing shape 5 (4×4) to1 (3×3).
These are Mission 3's dominant model 3 trees and its model 6 tree. The original
SHAPES table matches the imported table; the missing bank selection is in object
indices. This shadow ownership belongs in the coherent vegetation correction.

## Current shared consumers and smallest coherent implementation

1. Add one immutable, generic environment selection from actual header data.
   Resolve landscape12/28/25 to c/s/p terrain and full model atlas, and resolve
   object0/6 to2/6 independently. Keep existing sky selection and authored
   scenery placements. Never mutate a process-global active palette/model bank.
2. Add a **scoped** importer/check mode for only s/p terrain bundles, s/p full
   model atlases, and bank 6 mesh 13–18 plus their shape-index metadata. Reuse the
   pinned pure helpers; preserve every existing c byte/model index. Retain raw
   source and output hashes, and generated-file ownership. Existing
   `import-temple-acquisition.py` is a useful scoped pattern, but its selective
   p atlas is not a full environment atlas. The broad importer hardcodes c and
   writes unrelated assets, so it is not the entry point.
3. `scene-terrain-runtime.ts:initializeTerrain` currently fetches the same
   landscape.bin for every mission. Feed it the selected bundle. Water uses its
   BIGF/DISP/PAL, minimap uses the same texture data/palette, and overview/globe
   uses `scene.terrainTextures`; they must share that selected resource.
   WATDISP is the evidenced common wave table. Do not substitute only PAL.
4. Bind ordinary model materials to the selected c/s/p atlas through the shared
   scene asset boundary, including the early-mission building/scenery callers.
   `nativeModel` currently defaults to `atlas`. Keep required-texture preload,
   encoded-color filtering, quantization, alpha and failure/retry semantics.
   Sprite/HUD palette conversion and ambient audio are separate unproved scope;
   this proposal cannot close all of issue #14.
5. Bind bank 6 trees to their actual model records. Geometry cache keys must
   include model-bank identity. Rendering, `updateModelLighting`/wave offsets,
   `ScenePicking`, bounds and hover must consume the same selected model data;
   those currently independently read the global bank 2 map. Carry identity on
   the mesh or a shared immutable resource, rather than replacing global data.
   The scenery shadow caller must resolve the selected object's first shape
   index, preserving its zero fallback and lifecycle notifications. The equal
   scales support retaining existing wood-growth/burn scaling; verify that
   claim through the actual lifecycle before implementation acceptance.
6. Derive theme identity from the world mission on fresh start, transition,
   restart and checkpoint reconstruction. No new mutable save field is required
   by these authored constants. Abort stale terrain loads on disposal; await
   selected terrain/model resources before readiness. Preserve scene-owned
   minimap/globe invalidation and atlas/model cache separation on M3→M1→M2.

M1–3 bounds this evidence and the ordinary comparison witnesses, not runtime
selection. Use generic authored resource lookups with explicitly supported
landscape c/s/p and object-bank 2/6 identities; do not add a mission-number
allowlist. Other callers using these same identities receive the same resources.
The 78 imported-model comparison supports sharing these records across callers,
but the reviewer must inspect each relevant model/material consumer, including
ordinary effects, buildings, scenery and reincarnation, before integration.
Keep unsupported resource identities on an explicit existing fallback/unknown
path. A failed load of a supported identity must retain required-resource failure
semantics rather than silently substituting c. Shared resource reuse does not
establish ordinary behavior or complete theme/campaign parity for other missions.

## Temple boundary

The concurrent Temple source inventory found that `temple-model-p` patches only
12 Blue 95-verified crops over the c atlas. It must not become the generic p
atlas. This inventory independently finds that Temple 95–98 geometry is equal
across banks 2/6, while each tribe has distinct texture tiles. Full c/s/p decoding
can supply a shared bank-correct atlas without inventing geometry or colors.

Shared ANIBL clock ownership, ordinary Temple material admission, stages/tribes,
and resource snapshots remain the Temple workstream's decision. Preserve the
already accepted Mission 3 Blue animation/acquisition path, its scoped sparkle
atlas/tints and timing. A theme change must not reset, fork or broaden its clock.
The boundary should allow Temple materials to consume the scene's bank-selected
atlas once their independent admission is reviewed; ordinary theme loading does
not authorize new acquisition VFX, sprite recoloring or new Temple gameplay.
Do not merely delete the existing Mission 3 gate: any broader animation admission
must follow the actual shared resource/controller lifetime and readiness contract.

## Failure-first and ordinary comparison plan (not run)

- Establish a source-bound failing caller witness for the actual M2/M3 terrain
  fetch/resource identity: current code requests c. Use imported mission data,
  not a fabricated theme ID. Contrast expected raw-derived s/p hashes.
- Through actual authored decoration construction, show M3 model 3 selects
  mesh 15 with bank 2's81 triangles instead of bank 6's29, then require the same
  bank 6 record in geometry, lighting/waves, picking and shadow-shape ownership.
  Preserve M1/M2 bank 2, authored counts and logical scenery identity.
- Validate s/p decoded RGBA including alpha/edge treatment, with source-pinned
  crops outside the Blue Temple subset. Exercise real required-resource
  readiness, failed load/retry, aborted old loads and warm-cache M3→M1→M2.
  Preserve M1 bytes and existing sky behavior. These controlled callers are
  distinct from an ordinary gameplay witness.
- Ordinary comparison: start each mission through shipped world selection,
  use normal flyby completion/skip and normal camera controls, then capture
  comparable ground/coast/water, trees, minimap, overview and sky views at fixed
  viewport/zoom. Record the exact game source/assets, mission, camera and turn.
  Use supplied original assets/references to ground expected colors and geometry;
  no original-process pixel parity claim without its separately obtained frame.
- Follow real save/load, restart and available campaign continuation in M1–3;
  include reload with warm caches, tree hover/pick and ordinary wood depletion
  or burning when naturally available. Check growth scale, removal and shadow
  refresh. Retain Mission 3 Blue Temple and an ordinary non-Blue Temple control
  coordinated with that workstream. Do not inject a tree or award a spell and
  call the resulting scene ordinary play.
- After implementation review selects scope, run normal check/build and the
  affected texture, terrain/water/minimap, picking/tree-hover, model-light/wave,
  shadow and checkpoint gates. Existing terrain browser/native scripts often
  use controlled fixtures or a hardcoded c bundle; inspect/adapt them rather
  than treating an old pass as s/p or ordinary acceptance. Fresh independent
  review and rendered evidence are still required before runtime merge.

## Reproduction and next decision

The recovered canonical archive and existing archive-reader runtime were found
on this executor. The old shared-prerequisites directory was absent; that was
not a missing-input blocker. All32 scoped members were readable and checked.
Use the already verified extraction environment; no installation is required by
this proof. From the source checkout, with that environment on PYTHONPATH:

```sh
PYTHONDONTWRITEBYTECODE=1 python decomp/research/early-mission-theme-20261010/inventory.py \
  /path/to/PopulousTB-Setup.zip --repo . \
  --source-commit 35de8e6ca6864a98aff3bca0f263e87eee7fa65c
```

`run.json` records the actual command, source/input identities and exit status.
No external source blocker remains. **Review this data/scope freeze next; no
runtime implementation or imported asset changes have been started.**
