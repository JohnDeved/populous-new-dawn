# Building construction-gauge consumer (issue 166)

## Question and result

Main `734e496807020a8ab62bc5e981cfd00187f71719` renders a floating dark segment in
natural Mission 3, turn 260. The existing diagnostic identifies Yellow Tower 1023
at progress 0.2: temporarily suppressing only its `health` render group changes
167 pixels, screen bounds `(629,210)–(684,218)` in the 1440×1000 capture. This is
inherited building presentation, not a Convert Wild regression.

The original partial-Tower consumer does **not** submit a horizontal construction
bar. Its ordinary stage geometry, picking and hover submissions have now been
executed through the cell dispatcher. This supports removing that always-on
construction placeholder. It does not establish full original-frame raster parity
or the correct replacement for the separate completed-building damage gauge.

[Observed unchanged-main screenshot](https://github.com/user-attachments/assets/a946c726-a5b0-48f9-89f7-e1376cb58a32)
shows the actual scene, with diagnostic camera focus and explicit tick stepping.
It uses sandboxed Headless Shell 154, WebGL2 ANGLE/SwiftShader; it is not an original
game screenshot or hardware-performance measurement. [Issue 166](https://github.com/JohnDeved/populous-new-dawn/issues/166)
owns this work; worship-panel issue 72 and building-menu issue 25 keep their scopes.

## Native consumer and bounded evidence

- [`0046e030`](../generated/0046e030.c) selects the ordinary mesh consumers.
- [`0046ec80`](../generated/0046ec80.c) is the actual two-pass cell dispatcher.
  Original descriptor 10 has type 4 and routes partial buildings to
  [`00471c40`](../generated/00471c40.c).
- That consumer reads the original object/point/face data, applies stage masks,
  and submits type-6 triangles. Its extra records are
  [`00475550`](../generated/00475550.c) type 0x15 picking bounds and
  [`004756a0`](../generated/004756a0.c) type 0x16 hover records. Neither is a
  construction gauge: the latter is a ten-byte object/depth record without
  bar position, dimensions or fill geometry.
- [`004673b0`](../generated/004673b0.c) handles the queue. Its recovered overhead
  health branch at `00468e1c–00468e8a` only admits local class-1 people;
  [`00525450`](../generated/00525450.c) is their six-by-26-pixel vertical gauge.
  It is not a building-progress consumer. Existing unit-health probes retain
  the full draw submission and input evidence.
- Original automatic panels are separate class-10/model-3 objects. For ordinary
  class-2 buildings, [`005092e0`](../generated/005092e0.c) requires local ownership
  and activity bit 0x80. It rejects an enemy Guard Tower even when that bit is set.
  [`00504060`](../generated/00504060.c) selects kind 1 for class-9 construction
  plans, whose existing [`constructionPanel`](../../app/construction-panel.ts)
  renders registered workers and timber, not this floating horizontal bar.

[`check-native-building-gauge.py`](../../scripts/check-native-building-gauge.py)
executes 32 complete Tower cell dispatches: all four tribes, stages 0–3, and
hover off/on. Every queue contains only stage triangles and picking/hover records.
It also executes 64 automatic-panel eligibility decisions. The original EXE and
all three bank-2 geometry inputs are hash-verified; no imported assets or fixtures
are rewritten. Only projection `0046de00` and normal calculation `0040cd00` are
supplied, using the same deterministic in-bounds coordinates as the retained
building-face oracle. The renderer's triangle choice and queue writes execute.
This is queue composition evidence, not raster, lighting, occlusion, original
mission playback, or every possible building controller.

The native input is SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Only missing leaf `004756a0` was exported with Ghidra 12.1.3, Temurin JDK
21.0.12.1, the existing analyzed project, and `-noanalysis`. `ExportFunctions.java`
verified file-backed sections against `decomp/sections.tsv` and supplied a fresh
completion marker. The manifest records its hash; names/types are inferred
pseudocode, not recovered original source.

Reproduce the native evidence:

```sh
python scripts/check-native-building-gauge.py "$POPULOUS_EXE"
python scripts/check-native-unit-health.py "$POPULOUS_EXE"
```

## Live regression and remaining limits

[`building-construction-gauge.mjs`](../../scripts/local-render/building-construction-gauge.mjs)
reuses the maintained natural Mission 3 Convert Wild checker without changing its
assertions or simulation. It then checks the exact turn-260 Tower 1023, progress
0.2, retained model visibility, and absence of always-on construction boxes.
Its screenshots are the ordinary scene, with no temporary presentation hiding.

The construction visibility correction must leave simulation, stage geometry,
construction panels and the separate completed-building damage gauge unchanged.
The latter remains unproved by this narrow research. Do not infer its shape or
visibility from the person-health gauge, and do not invent a building-height offset.
