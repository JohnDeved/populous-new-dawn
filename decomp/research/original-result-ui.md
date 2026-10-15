# Original outcome-sensitive statistics panel

Refs #457. Static PE/data research and independently reviewed source artwork support
this bounded presentation restoration. The native general-statistics overlay is
not itself proof of the original automatic win/loss activation lifecycle.

## Proven source

D3DPopTB.exe SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Exact original input, glyph, tile, output and decoder hashes are retained in
`app/original-result-ui.json`. Bounded raw disassembly, static layout reference and
independent checks are in `evidence/result-ui-20261015/native/`.

- Renderer `00523fa0`, called by reviewed draw owner `00522570`
- Layout `0042b940`; tile composition `00523d40`; font selection `0042bde0`
- English normal-resolution panel: 384×368; HFX1450–1462; F00T3 glyphs
- Panel centered in the battlefield viewport, leaving the world visible around it
- Three headings at local y13/31/49: numbered mission name, `Player 1.`, and
  `Level Status: Completed` or `Level Status: Failed`
- Mission-title helper `004c3c40(level,1)` uses `%02d : %s` for campaign levels1–23.
  Tutorial79 reaches dynamic metadata whose actual value was not established.
- Time Taken at y76. Label column x17; separator x277; counter value origin289,
  reserve86px. Ten row y positions101,119,144,162,180,198,223,241,259,284.
- Descriptor table `005add30`: labels741–750, counters0–9, seven-pixel gaps before
  rows0/2/6/9, otherwise eighteen-pixel line steps.

Labels are Fights Won/Lost; Enemy Tribes Destroyed; Enemy Followers Killed; Enemy
Buildings Destroyed; Enemy Shaman Kills; Own Followers Lost; Own Buildings
Destroyed; Own Shaman Deaths; Vaults of Knowledge Raided. Native signed counters
are read from per-player display storage. Their event producers and browser
counter equivalents are not established by this presentation research.

## Bounded browser implementation

`OriginalResultScreen` accepts scalar presentation values and existing callbacks.
The Page retains exactly its terminal-status/finished-result-camera gate,
Continue/Restart choice, Select Level action and `.end-screen` click exemption.
It does not receive World/store/scene objects, pause or suspend simulation, award
completion, alter checkpoints, or manufacture statistics.

Deliberate adaptations and remaining limits:

- Existing browser after-camera activation is retained. Native statistics opening,
  input ownership, Space destination, blinking cadence and reward row are unproved.
  No native Space prompt, blink, reward icons or cursor change is invented.
- All ten unowned statistics show `-`, with a visible explanation and accessible
  unavailable labels. Existing cast/build counters are not relabeled as native data.
- Time reads the current browser simulation time on every render. The original
  elapsed-millisecond producer/final-result snapshot semantics are not recreated.
- Tutorial's literal `Tutorial` title is a browser fallback, without a guessed79 prefix.
- Existing browser actions sit outside the native panel. Their labels state their
  real consequence. Normal font3 is uniformly fitted to the actual battlefield and
  user's HUD-size preference, with space reserved for reachable browser controls.
- Original RLE skipped-pixel transparency is preserved. The imported panel uses
  unmodulated pal0-c source RGB. Native inherited panel tint, live mission palette,
  GPU blending/filtering/quantization and hardware-frame pixel equality are unproved.
- Text and a simple panel fallback stay usable if the imported images fail.
- Static fixtures establish presentation only. They do not certify native runtime,
  naturally earned outcomes, full-game lifecycle or hardware performance.

## Asset regeneration

`python3 scripts/import-result-ui.py GAME_ROOT` writes only its two new PNGs and
metadata. It validates every pinned input before writing, statically reads PE
bytes, and extracts only existing sprite/PNG decoder definitions. It never runs
an executable, emulator, broad importer, gameplay code or notification controller.
Generated ownership is registered in `engineering/generated-files.json`.

## Verification

Focused component/layout tests: `node --test tests/original-result-screen.test.mjs`.
Independent import checks cover every glyph, frame and tile position, deterministic
regeneration, and rejection of each mutated input before output writes.

Full checks/build/rendered lifecycle acceptance are tracked in the linked PR;
this source note does not declare them passed. Two clean-main integrated-harness
baseline attempts terminated during initial route readiness with server SIGKILL,
before browser launch. Source-bound static before/after UI fixtures are separate
and retain that limitation.
