# Synchronous game-callback CPU telemetry

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/complete-frame-cpu-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Product commit: `5667b35666c36c991147c22d121d17e16ffb952b`.
Base: `9151962441d5735aea0427edac842dff86943ed8`.
Refs #474; instrumentation only, no claimed performance improvement.

## Measurement meaning

The new mean covers synchronous current-scene callback work from the diagnostic
start immediately after the stale-scene guard, through resize, simulation,
presentation, terrain/entities/camera, rendering, HUD and RAF scheduling. It
excludes the diagnostic overlay's own update, deferred browser work, and GPU
execution. Simulation and render are contained sub-times. Game work retains its
relative order. Disabled/hidden diagnostics add no clock reads. The fixed history,
4 Hz maximum DOM publication cadence and 240-frame bound remain unchanged.

The dashed guide is now 120 FPS / 8.33 ms. This is a budget, not a measured claim
that this game or software-rendering host achieves 120 FPS.

## Evidence

- PASS: ten deterministic tests, including the actual extracted animation callback
  body with isolated stubs. Covers normal, menu, hidden, disabled and stale paths,
  timing boundaries, ordering, reset and 120 FPS arithmetic. Not a real rendering test.
- PASS: TypeScript no-emit, targeted ESLint, formatting and whitespace checks.
- Existing targeted Oxlint findings: scene.ts has the same type-only terrainAtlas
  import error and nine warnings on the exact baseline. No changed-code finding.
- PASS, component layout only: real FpsGraph and production CSS, real tiny WebGL
  context for hardware hints, synthetic sample values. At 640×480 the panel is
  272×463.15625 at (356,12), ending at y475.15625; no overflow. Screenshot is labelled
  Component fixture and must not be presented as gameplay/performance evidence.
- FAILED: one fresh actual-Home Mission 1 software-rendered browser attempt crashed
  in page.waitForFunction before telemetry/fit completion. Page crashed was the
  only captured page error. That initial attempt established no passing live-game
  integration; no cause or pre-existing status is established. It was not simply
  repeated. See the separately authorized matched follow-up below.
- Both browser routes verified unchanged source/dependency metadata and cleanup.
  Browser is Chrome154 with ANGLE/SwiftShader software rendering, not hardware GPU.
- The first component receipt inherited Home-fixture descriptive limits from its
  preparation template. Its result correctly identifies component-only coverage.
  A second tiny capture corrected the fixture limits; that corrected receipt and
  screenshot are authoritative for layout. The original receipt is retained.
- Full local suite/build not run. The hosted ready-PR full gate remains required.

The resource-policy refresh covers only these reviewed instrumentation changes.
The modified test reads source and runs isolated VM stubs, without browser launches,
filesystem writes, network or shared mutable resources. No inventory entry removed.

`validation-5667b356.tar.gz` retains raw receipts, checks, runners and scenarios.

## Follow-up matched live integration

Frozen candidate `ae785e80022ad61f353512b2aeefd7206c880585` integrates main
`167d88081ade0a63f09d2e849eb574edfdf1de1c`. The three telemetry product files and
focused test file are byte-identical to accepted product5667b356.

A first matched baseline attempt timed out waiting for inputMask=0. It did not
crash: live telemetry and turn124 were observed. Stages proved that a conditional
immediate Skip visibility check at turn2 missed the later introduction button.
The setup was repaired, independently reviewed, and accepted: wait up to10s for
the real Skip introduction button, then click it. No game state was injected.

The corrected baseline and candidate both PASS the same bounded scenario:
- Fresh640×480/DPR1 browser process, direct ?fps navigation, real Home/Mission1.
- Real desktop notice dismissal and introduction skip; no frozen RAF or world edits.
- Live telemetry, one JPEG, and F8 off/on. Candidate total contains simulation/render.
- Zero page errors, no observed context loss, unchanged source/dependencies, cleanup.
- Candidate panel bottom475.15625 fits480; baseline bottom456.359375.
- Hard90-second process caps; disk remained above40MiB. No parallel local tests.

Before/after images show the same mission/viewport but are not frame-aligned pixel
parity or controlled performance benchmarks. Existing campaign-message overlap
covers some lower telemetry at native size, as with the previous optional overlay.
Live readings update between receipt sampling and screenshot, so their numbers
need not match. Incidental SwiftShader values do not establish an overhead delta,
120 FPS gameplay, or hardware performance.

The original candidate crash remains retained and unexplained. This fresh pass
establishes bounded live integration; it does not retroactively resolve that crash.
`matched-validation-ae785e80.tar.gz` retains the failed baseline setup and corrected
baseline/candidate receipts, stages, stderr and scenarios. The original failed
candidate and component-only evidence remain in the first validation archive.
