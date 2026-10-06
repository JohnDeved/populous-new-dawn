# Firewarrior resting artwork: original source720 is missing

Issue [214](https://github.com/JohnDeved/populous-new-dawn/issues/214).
**Static source/assets and retained ordinary observation recheck passed.**
This packet proposes a bounded importer repair; it contains no runtime/importer
change, generated asset update, native execution, browser run or parity claim.

Base: `89e68606a406f93715b930550317519818ddc081`, app tree
`6f4235c9e6ca59f478d3c9834a9740a0c5142318`. The five relevant files are byte-identical
to accepted Guard candidate `c20a297f5f815ce404f796b08f77ea56396f96da`:
`person-idle.ts`, `scene-entities.ts`, `original-rules.json`, `original-units.json`
and `scripts/import-original.py`. Exact hashes are in [result04](result-04.json).
This source correspondence does not relabel the older browser run as a new one.

## Finding

The original Firewarrior resting controller selects animation object163, which
resolves to source720/draw18. The browser controller does too. Its importer instead
hard-codes source728 for Firewarrior `idleGesture`; the current blue/red metadata
contains no source720. When that real native person reaches720, the renderer falls
back to elapsed-time idle or selected artwork and ignores authoritative nativef2.

Source728 cannot simply be relabelled720. All eight original directional chains
differ. Source720 needs70 distinct VFRA records and134 HSPR pieces; all70 frame
records and38 pieces are absent from current metadata. This is an artwork lookup
omission downstream of a correctly retained native animation owner. Halving FPS
would still display the wrong gesture and phase.

## Retained ordinary witness and corrected ownership statement

The [published accepted Guard packet](https://github.com/JohnDeved/populous-new-dawn/blob/b49b0f42ff8641db4b5d90f05df726c7aaa9a326/evidence/native-shaman-guard-input/README.md)
is recovered at exact commit `b49b0f42ff8641db4b5d90f05df726c7aaa9a326`.
The local [retained](retained/) directory preserves exact receipts, manifest,
README and compressed row files. The audit checks both compressed/expanded SHA256
values, row counts, source identities and original terminal statuses.

Baseline04 on `3b899125cc8cedef938823718ad5d44f49957b66` has530 Firewarrior samples,
including249 null animation sources: idle125, walk31, selected93. These came from
legacy G. The native animation phase was dormant; the whole native record was not
unchanged, because legacy motion updated coordinates. Baseline04 retains its later
deadline FAILURE and exit1; its observed prefix is not promoted into a full pass.

Accepted candidate06 has830 Firewarrior samples across three epochs and zero null
animation sources. That closes the bounded ordinary G/deselect owner-loss path.
It does **not** establish zero renderer fallbacks: epoch0 raw lines629–652, spanning
turns897–921, contain24 source720/draw18 observations with a native owner. Twenty
are named idle, four selected. All24 have state19, no legacy Guard, and native and
selected source identity69. The original ordinary training/Move/G controls and
both Save/Load cycles retain their prior acceptance.

The [24-row index](result-04.json) records native phase, state, flags, camera-relative
direction, expected original VSTART/VFRA, actual mesh frame/VFRA and fallback source
for every affected sample. Example: line629/turn897 has source720/f2=1/direction2,
so original VSTART722 resolves VFRA3736. The actual mesh frame3014 resolves VFRA83,
from idle artwork. No sampled mesh frame belongs to source720's needed frame set.

All24 records have no source96 override (`flags4 & 0x400000`), no disguise branch
(`flags4 & 0x20`), no hidden render bit16, and no alternate primitive26 bit64.
Browser heading and native angle give the same direction in each row. Independent
RAF observations skip some turns; the24 rows are not24 consecutive logical visits.
No new capture, pixel identity, hardware timing or absolute original OS cadence is
claimed. The old observer did not capture mesh `state/since`; this packet does not
invent those values or reconstruct a renderer epoch.

## Original producer, dispatch and consumer

The audit reads the canonical PE32 bytes directly and statically decodes bounded
instruction spans with Capstone5.0.7. It does not map an emulator or launch the EXE.
Every cited Ghidra export is checked against `decomp/exports.json`; pseudocode is
an interpretation, not original source.

1. Resting `004d73e0`, branch `004d7d52..004d7d64`, checks the model6 formation
   shape, pushes0xa3 and invokes upper setter004d4040. Original table005a6ae4 is
   `d0 02 12 00`, resolving object163 to source720/draw18. Controls: object161 is
   712/draw14; object162 is728/draw15. The port's `stepRestingPerson` case10 agrees.
2. Descriptor18 at005a6bbe is mode2/step1/person2/variant1. Its first byte is
   **descriptor type10**, not the render primitive. The actual0046ec80 jump table
   maps that type to0046ef12, which writes polygon type13 and calls0046f080.
   The queue retains the same person's pointer. The sampled renderFlags bit64 is
   clear, so the separate primitive26 override does not apply.
3. The person branch of004673b0, at00468c58..00468c94, reads that person's source
   andf2, then adds `((cameraHeading - personAngle - 0x380) & 0x700) >> 8`.
   Only the Shaman-family branch adds tribe*8. Ordinary Firewarrior source720 is
   not remapped to728.
4. `0042c320` loads six-byte VSTART runtime records from original VSTART/VFRA:
   mirror byte, frame count and pointer to the linked-frame sequence. The renderer
   reads the record at00468d4f..00468d54 and selects its `ushort frames[f2]` at
   00468d82. Mirroring is independent of phase. Indexed00450e60 corroborates the
   lookup in its separate UI context; it is not substituted for the world branch.
5. `0045f9d0` traverses that VFRA's VELE chain. It admits body layers, current-tribe
   overlays and person2/variant1 layers from descriptor18. Variant selection does
   not choose a different VSTART family. Per-layer dimensions, signed offsets,
   mirroring and visibility still require their ordinary native/browser checks
   after an actual importer change.

The source gate and descriptor countdown are already owned by the current native
animation adapter. With the correct source720 artwork available, the existing
`Object.values(animations).find(...source...)` branch will pass the retained
nativef2 through `animatePerson`. No new clock, fallback epoch or saved phase is
needed for this witnessed case.

## Original asset recheck

All supplied files were restored by the separate recovery owner. This audit
rehashes EXE, VSTART, VFRA, VELE, HSPR and palette; asset hashes also match current
`public/original/provenance.json`. The newly recorded VELE SHA256 is
`e6158220383ae2f17db8d12844c16e4fb931030780fb3d02416fde303257a7c9`.

The eight720 directional first frames are3707,3721,3735,3749,3763,3749,3735,3721;
their mirror words are0,0,0,0,0,723,722,721. Each chain has14 frames. The728 controls
begin3777,3791,3805,3819,3833,3819,3805,3791 and are all different.
The complete chain and layer metadata, missing-frame set3707..3776 and38 missing
piece IDs are in result04. No original executable, sprite bank, palette or other
game input is copied into this packet.

The currently imported atlas has5021 frame records and4004 pieces,2048×8064 pixels,
32 columns of64-pixel cells. The proposed source720 append adds70 frames and38
pieces. Header-only inspection found all missing pieces at most30×26, fitting
those cells. Source720 pixels were not decoded or rendered by this audit.

## Smallest repair proposal, pending independent proof acceptance

Extend the existing bounded unit append path in `scripts/import-original.py`:

- Resolve object163 from the imported, original-byte-verified table. Walk actual
  VSTART720–727/VFRA/VELE chains; append missing source frames and pieces after
  existing records, sharing already imported source pieces.
- Add a clearly named native resting-gesture entry for blue/red Firewarriors.
  Preserve every existing animation key and direction chain, including the old
 728 entry; do not relabel its frames. The existing native-source lookup will
  discover720 without a renderer change. Both tribe signatures use the same
  source-frame chain; descriptor18/current tribe selects the layers.
- Keep old frame and piece indices, layer metadata and every established piece's
  RGBA rectangle byte-exact. Assert preservation against the pre-import data.
  New pieces may occupy previously unused tail cells and extend the atlas one
 64-pixel row to8128; the complete PNG hash necessarily changes. Do not confuse
  unchanged old artwork with equality of unused transparent padding receiving new
  pieces. Record expected old/new dimensions and per-piece RGBA preservation.
- Restrict generated writes to `app/original-units.json`,
  `public/original/unit-layers.png` and its provenance. Wire the same append after
  a full import so future regeneration retains720; never run the broad importer
  merely to make this change. Require an idempotent second bounded import.
- Keep the 24Hz presentation owner, logical countdown, renderer selection policy,
  other families, person controllers and checkpoint state unchanged.

The existing append routine is Shaman-specific. Reuse its decoding, identity and
append-preservation pattern without broad restructuring. Choose the smallest clear
helper adjustment after review; this proposal is not an instruction to replace all
person metadata or redesign animation dispatch.

Required validation after the authorized repair:

1. Failure-first coverage must reproduce source720 missing from current native
   lookup, then require the exact8 directional chains,14 frames, mirror values,
   original VFRA/VELE metadata and descriptor18/body/tribe/variant1 selection.
   Verify all existing frame/piece entries and animations remain equal, old piece
   pixel hashes remain equal, and the three authorized generated outputs alone
   change. Update the final atlas-hash expectation with these preservation checks;
   do not re-record the established576 native sprite fixtures.
2. Use the established bounded native layer-renderer checker for the newly imported
   source720 frames, Blue and Red ownership, all directions and phase boundaries,
   with only raster submission supplied. Inspect the loader boundary before use:
   original0042c320 normalizes raw VELE low-bit4 to bit8, while the current layer
   checker directly loads raw VELE flags. Source720 contains raw low flags0 and4.
   Retain raw/loaded flags and distinguish displayed geometry/pixel selection from
   unsupported equivalence of final raster flag words; do not silently call its
   existing raw-table fixture full loader/render equivalence or expand this fix
   into unrelated blending behavior.
3. Reuse the accepted ordinary Mission10 training and G route and passive observer.
   After ordinary cancellation into state19, observe the actual naturally occurring
   source720 interval, native owner/f1/f2 and actual mesh VFRA/UV/layer identity.
   A finite predeclared observation window must fail as unobserved if the gesture
   does not occur; no RNG/phase/actor injection. Existing baseline24 rows are the
   before witness. A fresh current candidate is needed for after acceptance.
   Include camera-direction/mirroring and selected/deselected variation only when
   they occur or through reviewed public inputs, retaining any sampling gaps.
4. Confirm the imported frame follows authoritative nativef2, holds across extra
   same-turn presentation samples, and returns to normal idle without an invented
   phase reset. A focused controlled test can supplement pause/speed/catch-up and
   checkpoint cases, but cannot replace the ordinary source720 observation.
5. Run the selected full check/build and affected quality/assets/native/rendered
   gates, serialized through the coordinator. Independently review full diff and
   source-bound receipts before integration. No tests/build/browser or native
   checker has been run as part of this proposal.

Busy/mixed G remains separate. Its whole-batch legacy ownership path is still a
source-reachable question. The corrected prospective setup is running entry input,
verified entry ownership before occupancy, public Pause and revalidation, Ctrl-click
to extend, release Ctrl, then G. Original secondary-state fixtures must stay
explicitly supplied and unscheduled. No such new scenario is prepared or run here.
Issue214 remains open for its other families and original absolute-time pacing.

### Exact layer-loader qualification

The [loader supplement](loader-flags.json) retains aligned original bytes at
0042c5b7..0042c5e3 and the current importer/checker/runtime source hashes. The
loader clears the low nibble, retains bits1/2 and maps raw bit4 to bit8:
`loaded = (raw & 0xfff0) | (raw & 3) | ((raw & 4) << 1)`.
The current importer preserves raw flags; its layer checker adjusts the HSPR
reference but does not perform this flag normalization. The browser uses the
resulting draw flag's mirror bit and separately controls material transparency.

Across the70 distinct720 VFRA chains, every raw-bit4 occurrence is the already
imported HSPR piece22, type0/choice1: the shared ground-shadow layer. All70 are
admitted for an ordinary Blue/person2/variant1 record. No new missing body/weapon
piece introduces that bit. This localizes the qualification to an existing shared
layer convention; it does not prove final native/browser raster-flag equivalence.

A new bounded layer fixture may supply the exactly normalized original input and
compare selected pieces, dimensions, signed offsets and mirroring, while separately
reporting raw/loaded raster flags. Do not silently suppress a mismatch or infer
equivalent blend behavior. If the proposed repair requires runtime flag/blending
changes, stop and make that additional scope explicit before implementing them.

## Reproduction, attempts and preservation

After sourcing the restored sibling prerequisites environment:

`env PYTHONDONTWRITEBYTECODE=1 python evidence/firewarrior-source720/audit.py "$POPULOUS_GAME"`

The script only reads and prints JSON. Final result04 exited0 with empty stderr.
It verifies the five current source files, exact original inputs, nine indexed
exports, correctly aligned instruction spans and jump table, original chain/layer
data, exact browser receipts and all relevant compressed/expanded row identities.

Attempt01 exited127 before Python because the restored environment uses
`POPULOUS_GAME` and its PATH, not the previous `POPULOUS_GAME_ROOT`/
`POPULOUS_PYTHON` variables. Attempt02 exited1 at an incorrect proof assertion
equating descriptor type10 with primitive13. Its exact script is retained. The
corrected attempt03 passed; final04 additionally verifies the actual type10→13
dispatch and the sampled render override predicates. Earlier failed statuses and
raw stderr remain unchanged. No failure involved executing original game code.

The earlier workspace-loss recovery note and v1 findings are historical; their
zero-null-source statement alone did not prove no renderer fallback. This packet
supersedes that inference and independently rebinds the missing720 witness.

TypeScript/full-check/build/performance gates are not applicable to this evidence-
only preparation. Actual importer implementation and its required acceptance remain
unstarted. Local commit/bundle preserves this packet without a login or remote write.
