# Bounded Tornado rendered acceptance (prepared, not executed)

Entry: `scripts/check-browser-tornado-appearance.mjs`; reusable `runTornadoAppearance(browser, { artifactDir, budgetMs })`. No workflow/job/check registration changed. Intended later placement is one separate episode after unchanged profile-recovery assertions, not in tutorial or held-Escape/F9 checks. Close the preceding profile context first; the episode preserves any pre-existing contexts and owns only its two sequential new contexts. Existing profile receipts and 180-second outer cap remain unchanged.

## Route and limits

Two fresh Mission 1 contexts, each with one public F9 unlock/refill grant, ready Shaman portrait selection, Tornado HUD selection, and one actual canvas cast. Reports explicitly label supplied stock. Read-only nearby target search chooses land then reachable water; missing reachable water fails rather than teleporting or inventing coverage. No gameplay effects, terrain, people, particle metadata, cooldowns or caster ownership are injected. Bounded modern fixed-clock advancement is test-controlled after the click; it preserves the normal projectile/controller path.

Per context: arrival bounded by 64 logical visits; active capture after 60 visits. Land follows first/last tail and exact natural child/parent deletion within the controller's 224-visit lifecycle bound. Water restarts while the column remains active. Both restart through public settings, rebind the new scene/store, await native Shaman readiness, and check old material disposal/no residual column. Normal composition screenshots are separate from GPU diagnostic images. Save/load portability remains a separate non-cheat test; F9 sessions do not save.

Actual original HFX source/UV, fixed ordinal/variant, width-only native scale with own-depth view scaling, bottom/integer-half-width anchor, live painter command bucket, propagated native palette and constant opacity are asserted. Captures report only observed palette/terrain subsets; they do not claim all five palettes, all slopes, seams, overlap, or native dust coverage.

## Pixel oracle

The helper independently decodes retained original signed PSFB runs and validates fixed original frame hashes. For the current source frame/palette it predicts encoded-byte RGB modulation then alpha compositing over black and white. One byte tolerance is rounding only. A color-space difference is an assertion failure, not a reason to substitute `material.color` metadata. CPU-only tests verify both accepted original values and rejection of deliberate color drift.

The diagnostic keeps the actual live selected Sprite/material/texture/shader/camera. It hides other renderables, reads both framebuffers, and requires visible, fractional-alpha and transparent samples to match the original-byte oracle. It additionally reads the actual image URL's encoded PNG and checks its source-bound atlas hash; it does not use Canvas2D RGBA round-trips, which can alter low-alpha RGB. The shipped atlas already has independent full-pixel original fixture validation.

All visibility, background, target/cube-face/mip, viewport, scissor, clear color/alpha and auto-clear settings changed by diagnostics are restored in `finally`. The existing painter render lease protects temporary material/geometry edits on render failure. After restoration the normal scene is rendered again and simulation/RNG/presentation fingerprints must match. No texture/geometry/material properties or simulation fields are changed by the diagnostic. A closed context on watchdog expiry leaves no live diagnostic state.

## Budget before first execution

Hard aggregate episode deadline: 90 seconds across both contexts, including cold navigation, readiness, casts, screenshots, diagnostic readbacks, lifecycle and restart. Each readiness wait is at most 12 seconds; ordinary UI assertions at most 8 seconds. The episode closes its contexts at the deadline; it does not reset or extend the caller's unchanged 180-second cap. Parent's measured accepted profile job is 71.7 seconds including build, giving 161.7 seconds if this episode consumes its entire bound, before integration overhead. Expected episode time is 55–75 seconds, NOT measured yet; report actual elapsed time before hosted placement is accepted.

One newly owned page/context at a time, existing browser reused by host. Two full RGBA readback buffers per diagnostic (about 11.5 MB at 1440×1000/DPR1), at most eight normal screenshots and four diagnostic PNGs; no parallel browsers or full builds. Overall Chromium/WebGL RSS is not yet measured and is not claimed bounded by the CPU buffer estimate. First execution must be coordinator-authorized and observed; failure or budget exhaustion remains failure, without relaxed assertions or extra casts.

Prepared-source gates: Node syntax; independent decoder/oracle tests and existing Tornado appearance tests (8 pass); scoped lint has no errors (style warnings retained); formatting and orchestration structural check pass. No browser was launched while authoring.
