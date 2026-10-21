# All 25 native selector records

Refs #17 / #457. Inactive data/import prerequisite based on
`5757d591cf0f5b266d17a81037e2b4179d9230c5`; no campaign or UI restoration claim.
`app/original-world-selector.json` is generated, not imported by the live app.
It joins the original 25 bodies, panel socket records, selected-world palette
banks and Western title strings. It does not change profiles, enable Missions
4–25, remove All missions, or produce/replace any PNG.

## Sources and extraction

The existing verified archive has SHA-256
`6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
The executable SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
[sources.json](sources.json) pins all 51 exact inputs, their archive URL and
base-game Component0 ownership. Existing globe provenance independently matches
the recovered Missions 1–24 headers/palettes; the text importer independently
matches the shared sprites, language and opening palette/header inputs.

Only missing small data members were extracted with the existing
`scripts/extract-reference.py --component Component0`: `data/plsdata.dat`,
`data/plspanel.spr`, the two `data/fenew/` font sprites, `data/plspl0-*.dat`,
and `levels/levl20[012][0-9].hdr`. The executable and language file were reused.
No installer/game execution, network download, emulator or Ghidra run occurred.
The importer only needs the 20 palette banks actually named by the 25 headers.

## Exact contract and evidence

- Bodies: decode `plsdata.dat` with the existing bounded layout reader. All 25
  records match `app/world-selector-data.ts`, including Mission 25 as body 0,
  the sun. This does not imply an ordinary `mission-25.png` globe texture.
- Panel: read 25 seven-int records at `0059dff8`, stride 28, followed by
  `INT_MIN`. Initialization and rendering are already retained in
  [panel.asm](../world-selector-panel/panel.asm) and explained in
  [the panel findings](../world-selector-panel/findings.md). Kinds 0/1/2 use
  available frames 5/3/1 and completed frames 6/4/2, respectively. Dimensions
  are 10×12, 13×15 and 21×21. Initialization adds panel origin minus one to
  coordinates, subtracting one more for kind 2. The manifest keeps source,
  panel-local and native 640×480 coordinates separately.
- Do not flatten the branch cluster: Missions 16–19 use positions
  (408,426), (412,437), (412,448), (408,459), while 20/21 use (442,430) and
  (442,456). These are source hit/draw positions, not a modern touch layout.
- Frame 0 is 638×61 at (1,419). Launch hit geometry comes from frame 11,
  37×37 at (577,430); frame 10 supplies the highlight. Hit tests exclude left
  and top, include right and bottom. Click feedback offsets one draw by (1,1).
  Availability uses profile mask 5; completion can independently show a glyph.
  The manifest describes these consumers without implementing their profile rules.
- Palette: header byte 96 through `004852f0` / `00412780`; 25 missions use
  20 banks. This palette applies to the selected panel/title reconstruction,
  not each socket's mission independently. No main-menu palette substitution.
- Titles: `004c3c40` receives a direct campaign number from `0047e902`.
  The importer follows its byte dispatch at `004c3fb4`, pointer table at
  `004c3f00`, and validates each `mov esi, mission; mov edx, stringId; jmp
  004c3e75` case. The UTF-16 format at `005d4784` is `%02d : %s`.
  [title-dispatch.asm](title-dispatch.asm) retains the newly inspected ranges.
  Slot 3 / `felo20we.spr` title metrics and source-palette RGBA hashes are
  reconstructed using the existing text importer's glyph decoder/composer.
  Missions 1–3 exactly match their prior dimensions and RGBA hashes. Y=400,
  horizontally centered, is unchanged. No inferred sequential language IDs.
- Tooltip/cursor: shared existing text-import contract only. Slot 11 uses
  `fettwe.spr`; strings 978/979/980 and their exact mouse-icon braces are
  retained, with a strictly-greater-than-500-ms delay. Cursor is panel frame
  12, 26×27, hotspot (0,0). Its native palette backend remains unresolved.
  This manifest does not add tooltip framing/positioning or infer cursor RGB
  parity from panel palette evidence.

Raw title disassembly was produced with GNU objdump 2.44, using
`objdump -d -Mintel --start-address=0x4c3c40 --stop-address=0x4c3df2 EXE` and
`--start-address=0x4c3e75 --stop-address=0x4c3e9a`. The input pathname is
normalized to `d3dpoptb.exe`; instruction bytes/addresses are unchanged.
The dispatch tables and format are decoded directly by the importer against
the full executable hash. No original binary is checked in.

## Reproduction and acceptance boundary

Run:

```sh
python3 -B scripts/import-world-selector-manifest.py GAME_ROOT \
  --executable VERIFIED_EXE --language-root LANGUAGE_ROOT --check
node --test tests/world-selector-manifest.test.mjs tests/world-selector.test.mjs
```

Without `--check`, the importer writes only its manifest after every source
passes validation, refusing to overwrite a different result. Use a new
`--output` path to review a deliberate candidate. No dependencies are needed
beyond Python/Node and the repository's existing helper scripts.

Portable tests compare all body/socket/bank records against independently
retained evidence, all title IDs, representative 4–25 text/metrics, first-three
pixel identities, shared tooltip/cursor contracts, source ownership, and
missing/corrupt input rejection. `--check` re-derives the complete manifest from
verified original bytes. These establish a data prerequisite only. A future
patch must still import the missing palette-specific art, handle accessibility,
integrate reviewed progression, preserve all current direct access, and test
the live selector and launch flows before replacing All missions.

Full check/build and browser rendering are not run in this disk-constrained,
data-only task. Visual screenshots are not applicable because no consumer or
image changes. Existing unknown native device quantization/filtering and cursor
palette behavior remain unknown; no gameplay parity credit is added.
