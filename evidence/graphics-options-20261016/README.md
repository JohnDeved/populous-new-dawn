# Original Graphics and Direct3D Options rows

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/graphics-options-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Refs #457 and #16. This restores original row presentation through both shipped
Options callers. It does not implement legacy graphics/device settings.

## Source and research

- Baseline: `7ab389ce07177c4fcd2a45724d651675c429f29a`.
- Product candidate: `b675952c87c905de9a7d7046aa22264ac1ba0101`.
- `decomp/research/options-menu-static/findings.md` SHA-256:
  `a39b5d58b772e0086d89499478dfbb6b6d41511c765aec3b6a2024cefb811e17`.
- Retained static-data, layout, render and in-game-style-alpha evidence supplies
  menu 13's visible row sets, positions, text format, tab states and font alpha.
  No new disassembly, original executable execution or asset import was performed.

Graphics uses the proved no-gamma row set at x320/y139,169,199,229,259:
Screen Resolution, Sky, Footsteps, Landscape Detail, Quick Defaults. Direct3D uses
Device Selection and Filtering at x320/y139,169. `Unavailable` is an explicit
browser adaptation; the notes have no handlers or tab stops. Gamma and dormant
settings remain absent. Native language 402 is `Direct3D Options`; its 245 px
native glyph run fits the new 260 px target. Internal category identity stays
`Direct3D`, independent of the accessible display label.

Frontend rows use FEFT33WE/Fehi33we/Felo33we and feed the existing indexed shadows.
In-game rows use F00T9, ordinary opacity 2/3 and selected/focused opacity 1.
The last Graphics row and compatibility notice do not overlap.

## Verification

- Passed: all 10 tests in original-options, pause-menu-ownership and pause-font.
- Passed: TypeScript no-emit check with incremental output disabled.
- Passed: changed-file Oxfmt, ESLint and Oxlint (raw source-bound receipts retained).
- Passed: actual Home frontend navigation, inert rows, native/wide/short layouts,
  DPR2, full-label edge click, keyboard focus/tab order, help/Escape/back/reopen,
  and deliberately broken font-image responses with readable fallback labels.
- Passed: actual live Mission 1 in-game flow at 640×480, including DPR2, both
  panels, full-label edge hit, keyboard/help/Escape, full-world hash/RNG/camera/
  input/audio freeze, and restored world/input/audio pause after Continue.
  Audio was disabled in this browser run; no audible playback claim is made.
- Passed: all 12 focused audio-pause regressions at the product head.
- Passed: all 38 integrated focused tests after merging verified main, including
  the approved hosted-workflow policy tests.
- Advisory Fallow audit: exit 1, not a pass. Its findings include unchanged
  dependency/glyph/CSS issues, component/helper estimated-no-coverage CRAP metrics,
  and the new two-skin/two-category test matrix (CC9/cognitive24). The row lookup
  adds one null-coalescing branch. No thresholds or findings were suppressed;
  independent review found no code-quality blocker for this bounded diff.
- Independent product/source/browser review accepted the slice with the limits
  below. Final publication review and exact-merge hosted full check/build are
  recorded on PR #476; a pending gate is not a pass.

The focused tests evaluate production row declarations/component output, verify
indexed-shadow inputs, original glyph advances, font banks/alpha, inertness and
focus identity. They supplement actual rendered browser checks, not replace them.
The policy fingerprint update was reviewed: production changes add only UI row
constants/rendering, and the test reads existing files and evaluates code in
memory. No subprocess, socket, shared output or asset mutation was introduced.

## Browser method and failure history

The source-hashed fixture imports the unchanged production Home, global CSS,
GameScene and original assets directly from the checkout. The ordinary New Game
and Start Mission 1 controls launch the world; observation uses the existing
React-ref discovery helper. No scene/world callback or state is substituted.
Serving uses plain React/Vite with the installed dependencies; Vinext/RSC and
Cloudflare hosting are excluded. Existing Three.js ESM is excluded only from
Vite dependency prebundling to fit the disk budget. Each receipt hashes all app
and public inputs, the harness/scenario, browser binary and dependency metadata,
and verifies source/dependency identity after the run and browser/server cleanup.

Sandboxed Chrome Headless Shell 154.0.8037.92 reports ANGLE Vulkan SwiftShader.
This is browser consistency evidence, not native full-frame parity, audible audio
parity or hardware-performance evidence.

The true baseline run passed actual Home and live Mission 1 menu flows. The first
candidate combined frontend-stress/live run crashed while Playwright was clicking
the live Graphics control. A fresh 1280 px live-only run then timed out during
Game settings scroll-into-view before reaching Options. Their cause remains
unestablished; both failed receipts are retained and neither is called a pass.
A native-size diagnostic identified a separate harness setup bug: the real
“Continue anyway” screen-size prompt had paused the world at turn 0/inputMask128,
while the harness waited for introduction readiness before dismissing the prompt.
The correction performs that ordinary UI dismissal before waiting. It changes the
setup workload and does not retroactively pass either earlier failure.

## Paired images

Images are source-bound local browser screenshots at 1280×960/DPR1. The frontend
pair compares Graphics and the live pair compares Direct3D Options. Baseline and
candidate mission captures use the same ordinary level entry but can differ in
elapsed turn/camera framing; they are menu-composition comparisons, not a native
pixel-match claim. Exact source and renderer identities are in the raw receipts.


The repaired wide live run reached both panels and passed 640×480, 1920×1080 and
900×360 row-layout assertions, then crashed at 1280×960/DPR2. Its source-bound
1280px screenshot is useful composition evidence, but the run remains failed.
The accepted native-size run tests DPR2 at 640×480 and all freeze/close assertions
without that preceding high-resolution stress sequence. This does not establish
1280×960/DPR2 live stability or explain the retained high-resolution crashes.

## Retained artifacts and source carry

- [Before frontend Graphics](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/graphics-options-20261016/before-frontend-graphics-1280x960.png): baseline
  `7ab389ce`, 1280×960/DPR1, passed baseline run.
- [After frontend Graphics](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/graphics-options-20261016/after-frontend-graphics-1280x960.png): candidate
  `b675952c`, 1280×960/DPR1, passed frontend run.
- [Before live Direct3D](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/graphics-options-20261016/before-ingame-direct3d-1280x960.png): baseline `7ab389ce`,
  1280×960/DPR1, passed baseline run.
- [After live Direct3D Options](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/graphics-options-20261016/after-ingame-direct3d-1280x960.png): candidate
  `b675952c`, 1280×960/DPR1, captured before the later large-DPR crash described above.
- [Accepted native-size live composition](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/graphics-options-20261016/accepted-ingame-direct3d-640x480.png):
  candidate `b675952c`, 640×480/DPR1, from the fully passed native-size run.
- `validation-b675952c.tar.gz` retains all seven raw browser receipts (including
  four failed attempts), exact hash-matched scenario/runner files, the setup
  failure screenshot, fixture entry, and source-bound command receipts.
  Harness paths reflect the actual local execution, not a turnkey hosted runner.
- `source-carry.json` indexes raw receipts, screenshots and archive hashes. It
  verifies all browser app/public/package/helper inputs unchanged after merging
  exact main `88e4d971` into feature head `81fa319a`, along with unchanged options
  tests/resource policy. Later publication-only commits do not change those inputs.

No original-game native binary ran, no parity recording or deployment occurred,
and no source assertions were weakened to obtain the accepted bounded run.

## Latest-main integration after the performance overlay

The separately accepted opt-in performance overlay (#479) was merged as main
`7dc1ecda9a4b1901ffcfbb1dc1339185e649de55`. Graphics integration head
`3b03e7f66bb73e434a19e4a5e6eb8179cbd48dce` carries that exact base. The Graphics
component, scoped CSS and focused test remain byte-identical to `07674e89`.
Home, scene, global CSS and telemetry inputs changed through the reviewed overlay;
the earlier 1109-input equality claim ends at `07674e89`, not this new integration.

Only the resource-policy production fingerprint conflicted. It was recomputed
for the combined tree while retaining both original-options and frame-performance
reviewed test hashes; helper fingerprints and other classifications remain intact.
Local NODE_PATH customization still conservatively selects serial execution.

All 44 focused tests passed at the integrated head, together with the no-emit
TypeScript check and orchestration structural check. Raw source-bound receipts
and logs are in `latest-base-validation-3b03e7f6.tar.gz`; `latest-base-carry.json`
records exact hashes and changed-input boundaries. No whole browser matrix or
full local check/build was repeated. The earlier hosted pass (2822 tests/436 files,
run 38873479354) covered the old base only; a fresh exact-merge hosted gate is
required on the latest base before merge.
