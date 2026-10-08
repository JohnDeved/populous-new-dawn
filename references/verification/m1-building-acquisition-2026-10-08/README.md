# Mission 1 acquisition: accepted partial evidence

**The completion-only run PASS at 2026-10-08 20:16:51.847 UTC is independently accepted.** It covers the restored remaining grant/terminal journey and enabled-card selection. Ordinary01, tail01 and continuation02 remain FAILED with only their independently accepted portions carried. The assembled evidence closes the stated M1 gates while retaining those histories and the limits below.

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

## Completion-only restored tail

[QA a409893](https://github.com/JohnDeved/populous-new-dawn/commit/a409893cdab222e140f1acc02b69c25d6e6e05b6) loads the unchanged saved 1300 state using the reviewed early observer. It records zero new handoffs and exactly one grant: gift 3541 remains locked with remaining 1 at 1331 and grants at 1332. The terminal overlay is hidden, without claiming fresh GPU pixels for that hidden draw.

At1343 the actual inputMask is 0, the current scene is started/connected with no loader, Buildings is selected, the card is enabled and the public card click sets mode camp. The committed saved 1300 state remains unchanged; cleanup/continuation are verified and errors are empty. The run took 40.692 seconds. These are observed port results, separate from source-derived comparison with the original.

This completion carries the accepted resize/workload and active-building Restart from failed continuation02. It does not repeat them or claim interruption of active companion/pulse owners. All three previous failed histories and raw hash references remain in [facts.json](facts.json). Final result verdict SHA256: `e967be4e928942a953eec33686e49f3d7d2e55097ded80fcae1d28c92754c81f`.

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
|[Restored completion](restored-camp-complete.png)|Full browser screenshot of the enabled camp card and actual camp build mode at 1343|

[Derived facts and identities](facts.json) records PNG byte hashes, raw receipt hash references and the current source, standard and partial-review verdict hashes. The raw files stay local and are not included or attested by this package.

Source qualification passed 61 focused checks and TypeScript. Exact e6 full standards passed 1539 tests across 261 files, type/parity/orchestration validation and build (aggregate SHA256 `7990026341704599c3ff9624f4664a16e3d7b328d5b54ee87d77eec5fa9cf1e8`). Strict lint remains failed with independently attributed inherited findings.

M3 remains blocked on real shared ANIBL ownership and scoped bank-p sprite/tint integration. These current browser pixels do not prove original GPU equality. Complete original audio parity, including later 0xce/0xcd/stop behavior, and hardware performance are not claimed. No raw reports, archives, profiles, storage or original binaries are published here.
