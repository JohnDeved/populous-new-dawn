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

The later [producer trace](result-statistics/README.md) resolves the live storage,
reset and bounded increment owners separately for all ten rows, with remaining
death/building/reward admission and final-snapshot limits. It does not enable UI rows.

The later [result-navigation trace](result-navigation/README.md) establishes the
two-stage native Space flow, HUD hiding/pause and selector destination, including
the verified LEVLSPC2 level-54 sentinel. It supersedes those research unknowns
below, but does not activate that lifecycle or remove the browser's sole routes.

## Bounded browser implementation

`OriginalResultScreen` accepts scalar presentation values and existing callbacks.
The Page retains exactly its terminal-status/finished-result-camera gate,
Continue/Restart choice, Select Level action and `.end-screen` click exemption.
It does not receive World/store/scene objects, pause or suspend simulation, award
completion, alter checkpoints, or manufacture statistics.

Deliberate adaptations and remaining limits:

- Existing browser after-camera activation is retained. Native statistics opening,
  input ownership and Space destination were outside this presentation slice;
  the later result-navigation trace resolves their bounded static contract.
  Blink-clock mapping and reward row remain separate. This implementation adds
  no native Space prompt, blink, reward icons or cursor change.
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
- Fallback headings use their rendered text width for centering. The retained
  [40-case before probe](https://github.com/JohnDeved/populous-new-dawn/tree/16ee3983c4d9fa501a1a8bb99dc41377008b8fbc/review-evidence/result-heading-before/213b9342)
  showed Arial headings displaced left by bitmap-based coordinates when font
  decode failed or was pending. This is a browser compatibility correction;
  ready bitmap geometry and original artwork remain unchanged. The matched
  component probe/comparator is in `scripts/result-heading-probe/`.
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

Standard split checks passed on the clean `17f9d776` candidate: all 430 test files
(2,765 passing tests), TypeScript, parity and orchestration. Canonical exact-source
production-target builds succeeded. Independent review accepts this bounded
presentation slice; raw gates, global-quality attribution and source fingerprints
are retained in `evidence/result-ui-20261015/validation/`. Actual full-game rendered
lifecycle remains blocked and is not claimed. Two clean-main integrated-harness
baseline attempts terminated during initial route readiness with server SIGKILL,
before browser launch. Source-bound static before/after UI fixtures are separate
and retain that limitation.

One remote immutable-preview episode stopped at ERR_CERT_AUTHORITY_INVALID before
loading the game. Certificate validation remained enabled; no bypass or retry was
used. Static fixture checks do not replace those unverified live lifecycle paths.
