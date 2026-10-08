# Mission 1 acquisition: accepted partial evidence

**ordinary01 FAILED at 2026-10-08 19:13:48.387 UTC.** A delayed post-Load assertion missed the active controller window. This small package preserves independently accepted results from that run. Continuation02 also remains FAILED, after independently accepted resize/workload and active-building Restart results. The restored remaining grant/terminal timeline and final enabled-card selection remain pending; this is not a merge-ready claim.

[PR274](https://github.com/JohnDeved/populous-new-dawn/pull/274), product [e6a607bc](https://github.com/JohnDeved/populous-new-dawn/commit/e6a607bc4617e3c18287b7fe2d82d5b7da17fdcc), QA [b1e60f4](https://github.com/JohnDeved/populous-new-dawn/commit/b1e60f4da98b2015a365fb4dd6929a8e9bcdadaa). Scope is M1 record 1 → reward 2, class 2/model 7, geometry 103, modes 6/7 only. Refs #23; this slice does not close the broader issue.

## Accepted portion

- Ordinary gift 3541: birth 1250, one handoff/hide 1256 (six object visits), one grant 1332 (82 visits). The real still-locked Buildings card was measured automatically; input mode stayed unchanged. The enabled card subsequently selected camp mode.
- Natural whole frame 1282 and first flight frame 1308 reached the real drawing surface with fresh renderer frames. The four flying submissions in the latter are source-labelled CPU state, not a claim that four isolated faces are visibly distinguishable in the PNG.
- Active Save/Load at 1300 matched synchronously with building phase 4/visit 1, remaining 32, camp locked and pause retained. Equality covers the retained checkpoint projection, including acquisition state/RNG/gifts; it is not a new whole-checkpoint digest claim. The later read at 1334 found legitimate retirement, so the run remains failed and no restored per-visit tail is inferred.

## Continuation02: accepted resize and active-building Restart

[QA 5b691bce](https://github.com/JohnDeved/populous-new-dawn/commit/5b691bce5cac322a1f66a402305a20653a6f8421) ended **FAILED at 19:53:11.591 UTC** on a later locked-card locator timeout. No second Load occurred. The exact live inputMask/click outcome was not retained; source-consistent HUD input suppression remains a conditional explanation, not a proven product defect.

- After the genuine saved 1300 Load, 16 natural draws at 1440×1000 and 16 at 1280×960 matched actual Float32 buffers and the measured HUD endpoint. The owned surface/resources were reused, frozen logical geometry stayed unchanged and per-draw state/RNG purity passed. Each draw submitted 175 triangles. Four attribute arrays stayed 14,700 bytes; this excludes textures/framebuffers/total GPU memory. Observed callback spans include instrumentation overhead and are not a hardware-performance benchmark.
- Trusted Restart at 1320 interrupted the active building (phase 4/visit 35, gift remaining 12) and synchronously produced turn 0, camp locked, Vault active, null building/companion/pulse, empty requests/tagged gifts. Companion/pulse were already inactive before the click: only their retained-owner clearing is claimed. The committed saved 1300 checkpoint was unchanged.
- Earlier **tail01 remains FAILED**: it compared source-backed +Infinity gift duration against null in a prior JSON report. That lossy comparison did not establish product checkpoint loss. The corrected continuation used the actual committed snapshot plus an explicit sentinel; neither old failed run is relabelled passed.

## Exact, unedited images

The whole, flight and two resize files are **isolated transparent overlay canvases**, not full browser screenshots; transparent regions may appear black in an image viewer.

|Image|What it establishes|
|---|---|
|[Whole overlay](ordinary-whole-overlay.png)|Textured camp whole-model frame at 1282; 279 submitted vertices|
|[First flight overlay](ordinary-flight-overlay.png)|Source-labelled phase 4/visit 15 frame at 1308; 525 vertices|
|[Locked HUD](locked-camp-card.png)|Full browser screenshot before acquisition, with the camp card disabled|
|[Unlocked HUD](camp-screen-complete.png)|Full browser screenshot after the first-epoch grant; the filename does not mean the entire run passed|
|[Before resize](beforeRestart-resize-before-overlay.png)|Continuation02 isolated overlay at 1440×1000|
|[After resize](beforeRestart-resize-after-overlay.png)|Continuation02 isolated overlay at 1280×960|

[Derived facts and identities](facts.json) records PNG byte hashes, raw receipt hash references and the current source, standard and partial-review verdict hashes. The raw files stay local and are not included or attested by this package.

Source qualification passed 61 focused checks and TypeScript. Exact e6 full standards passed 1539 tests across 261 files, type/parity/orchestration validation and build (aggregate SHA256 `7990026341704599c3ff9624f4664a16e3d7b328d5b54ee87d77eec5fa9cf1e8`). Strict lint remains failed with independently attributed inherited findings.

M3 remains blocked on real shared ANIBL ownership and scoped bank-p sprite/tint integration. These current browser pixels do not prove original GPU equality. Complete original audio parity, including later 0xce/0xcd/stop behavior, and hardware performance are not claimed. No raw reports, archives, profiles, storage or original binaries are published here.
