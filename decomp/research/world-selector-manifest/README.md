# All 25 native selector records

Refs #17 / #457. Inactive data/import prerequisite based on
`5757d591cf0f5b266d17a81037e2b4179d9230c5`; no campaign or UI restoration claim.
`app/original-world-selector.json` is generated. The initial data-only PR did not
import it into the live app; the opt-in renderer below now consumes its metadata.
It joins the original 25 bodies, panel socket records, selected-world palette
banks and Western title strings. It does not change profiles, enable Missions
4–25 or remove All missions. The manifest importer itself produces no PNG.

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

## Opt-in all-world artwork and rendering prerequisite

The follow-on `scripts/import-world-selector-art.py` uses the same 51 pinned
inputs, re-derives and checks the complete manifest, and decodes only panel frames
0–6/10, cursor frame 12, Western titles and the three existing tooltips. Font slot
3 titles and slot 11 tooltips retain separate source sprite banks. It reuses the
unchanged `sprites`/`png` decoder functions and `compose` glyph assembly. Existing
opening art is reused only when dimensions, raw RGBA and PNG bytes all match;
the original opening URLs stay unchanged. No font atlases or globe art are added.
All 20 palette bindings remain explicit even when their relevant pixels match.

The added output is 102 PNGs plus runtime/provenance JSON, 98,713 bytes total.
Provenance binds every reused/new image to its decoded dimensions, RGBA hash and
PNG hash. The importer validates inputs and destinations before writing; `--check`
only compares, and a differing existing result requires a new output directory.
The existing archive was SHA-256-verified again, and only its missing
`language/lang00.dat` member was extracted as data. No original code was executed,
no network download performed, and no dependency tree copied.

`WorldSelector.nativeSelection` is an optional, controlled rendering input:
`selected`, `available`, `progressionMission` and `onSelect`. `completed` remains a
separate input. The caller owns all state and availability decisions. With the
optional state, all 25 sockets use their exact source coordinates and 10×12,
13×15 or 21×21 sizes. Every socket uses the selected world's palette. Completed
glyphs render independently of availability. Titles, tooltip artwork and cursor
switch by selected world; the existing scene already owns the 24 globes and sun.
Keyboard arrows skip unavailable records, wrap, and safely handle an empty list;
browser controls also expose all 25 inspectable entries. Start checks both
availability and the existing caller-provided playable mission list.

No shipped caller supplies `nativeSelection`. The default still uses Missions
1–3, existing progress/recommendation helpers, artwork URLs and enlarged opening
hit targets. All missions and direct access through Mission 23 are retained.
There is no profile migration, progression-model import, new mission launch,
local-storage change or parity credit. This does not complete the All missions
replacement.

The opt-in preserves the shared 640×480 art scale, including the clustered branch
coordinates and title y400 at smaller viewports. Browser focus outlines, button
edge/press-duration semantics and missing-art text fallbacks remain browser
adaptations, not native UI parity claims. Cursor palette backend, original device
RGB quantization/filtering and live all-world integration remain unproved.

Reproduction adds:

```sh
python3 -B scripts/import-world-selector-art.py GAME_ROOT \
  --executable VERIFIED_EXE --language-root LANGUAGE_ROOT --check
npm run test:focus -- tests/world-selector-art.test.mjs \
  tests/world-selector.test.mjs tests/world-selector-panel.test.mjs \
  tests/world-selector-text.test.mjs tests/world-selector-manifest.test.mjs
```

Source/data tests are bounded verification only. Full check/build and actual
rendered before/after captures are deliberately deferred while the shared
integration lane is occupied. The renderer PR must stay draft until these gates
and independent review are complete; no screenshot claim is made by PNG hashes.
