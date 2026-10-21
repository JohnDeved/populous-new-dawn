# Native route-failure tooltip replacement

## Scope and source identity

English 603 is mode 9 of the shared world tooltip, not a persistent bottom card.
This patch removes that card, star and CSS fade and adds no other visible gameplay UI.
A persistent visually hidden status region preserves route-failure announcements;
request-keyed content renews on retrigger and presentation expiry/replacement notifies
the page even while simulation is paused.
F8 and cheat components are untouched. It does not alter route decisions, order
allocation, gameplay deadlines, RNG or checkpoint schema.

Source EXE SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The `native/` receipt preserves the bounded original static reads and their manifest;
`blend/` preserves the independent static geometry/normal-state audit and its manifest.
No original executable instructions were run or emulated. GNU objdump 2.44 and Python
standard-library data reads supplied the evidence. Existing PNG assets were reused,
not regenerated. `hud-font-pixel-verification.json` records zero RGBA mismatches for
all 448 raw F00T3/F00T4 glyphs. Source-data records exact HFX591–598 frame equivalence.

## Source to shipped browser mapping

- `004aa8b0` / `004aa97e` stores last issued command destination `0089bc26`.
  `live-command.ts::command` copies a packed scalar destination only after input
  acceptance, beside the existing last-order turn. `world-effects.ts::requestTutorial`
  snapshots that scalar into a route request. A later command cannot move an old request.
- `00499f40` mode 9 -> `0044d7f0` -> shared `0044a2f0` renderer.
  `scene-tooltip-runtime.ts` acquires the request in the existing shared controller,
  using flags 8, style 1, English 603 and signed-short `3 * frameRate` remaining visits.
  Repeated request object identity replaces the old owner even if a serial is reused.
  A new forced object tooltip replaces the route owner; hover/HUD cannot overwrite it.
- `0044db60` decrements eligible frontend visits. The browser's existing 24 Hz
  presentation clock gives 72 reference visits, not an independent 3-second CSS timer.
  Modal suspension freezes/hides the tooltip and resumes without wall-time catch-up.
  Ordinary pause permits only route presentation visits, not paused flyby/simulation
  advancement. Existing camera-owned-frame eligibility remains unchanged. Original
  frame throttling, all native command-reset gates and original whole-main-loop cadence
  are not newly certified by this patch.
- Cell flags 8 center the packed cell, then `004e6a70` offsets length 128 at camera
  angle +512. `route-tooltip.ts` calls the existing recovered `movePosition`,
  `terrainPointHeight` (`0044e940`), signed wrapped `relativeCoordinate`, and
  `projectPoint` (`0046dbe0`) against the live `scene.view` center/basis.
  This does not use the ordinary object screen adapter or its 4-pixel safe margin.
- `0046e700` copies view rectangle origin +0x22/+0x24 to `0087ca8c/e` (retained
  `viewport-origin.asm`). The browser equivalent is the actual world viewport's DOM
  left/top; its projection dimensions/center are local to that viewport. The shipped
  renderer adds those origins, truncates, rejects clip flags 0x1e and clamps text to
  full-screen dimensions. Flags 8 do not horizontally center the text at its anchor.
- `0044a2f0` selects raw F00T4 when full screen height <=600, otherwise F00T3.
  The existing recovered width search/wrapping is reused. `004a24c0` and final packet
  `004f9470` bind geometric frame origin x-4/y-4 and span W+7/H+7, with no hidden +1.
  The route canvas paints the verified 4x4 tiles before unmodulated glyphs.
- `0042adc0` / `00526660` choose unique nearest palette entry 139, RGB(255,37,0).
  Opaque fill is accepted for the initialized, active-HUD, normally returning D3D path
  audited in `blend/FINDINGS.md`. The route owner inherits blend flags; this is not a
  universal claim about arbitrary native renderer states or historical GPU raster rules.

## Save and recovery

The two new presentation fields are optional. Only finite safe integers in 0..65535
are accepted. Producer/consumer guards reject malformed values without native wrapping;
checkpoint normalization removes invalid anchors from the recovery clone, not stored
data. Current-format saves lacking the command cell still restore; unknown anchors remain hidden, expire through the same owner, and
are never guessed from the cursor, a follower or cell zero. New saves clone scalar
command/notice cells without object aliasing. Scene-owned countdown remains presentation
state, so rebuilding a scene reacquires a still-pending notice, like its prior mounted
CSS lifetime. No gameplay checkpoint schema/version or normalization rule is changed.

## Verification and limits

`tests/route-tooltip.test.mjs` checks native layout examples, explicit projection math,
text-only clamp, asymmetric frame endpoints, scalar capture/current normalization and
legacy absence. `tests/route-notice-modal.test.mjs` executes actual Home handlers and
Scene animate/updateFlyby/controller paths with supplied GPU/DOM leaves, including
pause/menu/selector/reopen, F9-style suspension, repeated ownership and expiry.
Existing route-recovery and hut-tooltip-controller tests cover unaffected native logic.
The route-announcement test renders the actual Home JSX fragment, not copied markup.

`node scripts/route-tooltip-fixture/run.mjs <new-output-directory>` with the verified
`POPULOUS_BROWSER` captures the real production canvas and shipped CSS at 640x480,
800x600, 1024x768 and 1280x720 (DPR2). It independently composes expected pixels from
retained native line breaks/widths and raw glyph/frame assets, exercises origin/clamp,
clip/absent-anchor hiding, the 600/601 font boundary and helper lifetime. The supplied
terrain/projection/background are controlled; these are component browser screenshots,
not original screenshots, full-game acceptance or hardware performance evidence.
Paired before uses the exact base card CSS and former star/text markup.

Remaining native limits: altered/hidden HUD and arbitrary inherited blend/ghost states,
runtime palette changes, global 0x40000 scrolling/colon behavior, all reset-command
bindings and main-loop frame throttle. Ordinary tooltip rendering remains out of scope.
Full repository check/build and combined UI integration remain parent-owned gates.
