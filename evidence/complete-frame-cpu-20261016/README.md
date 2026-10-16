# Synchronous game-callback CPU telemetry

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
  only captured page error. No passing live-game integration is claimed; no cause
  or pre-existing status is established. No repeated heavy run was made.
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
