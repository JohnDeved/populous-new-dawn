# Tutorial recommendation: supplemental component acceptance

Candidate: `fdde7dd58bbc6ffe8aca6a9efd2e7c138c192a07`. This is **real
OriginalMainMenu component evidence**, not full Home/Tutorial loading acceptance.

The component uses unchanged candidate code, actual frontend composition,
production fonts/cursor/CSS/assets, and controlled Tutorial/campaign callback
counters. Options is not exercised. The compact immutable source snapshot was
built from the previously bound main673b89ad snapshot using hardlinks for unchanged
files and detached inodes for each changed Git blob. All1,111 baseline inputs were
verified before and after;396 candidate source blobs matched Git. The fixture
hashes its17 component/package/asset inputs; the shared checkout was not imported.

## Passed 16 October 2026, 11:21:29–11:21:36 UTC

- Native640×480, widescreen1920×1080 and short900×360: paragraph/choice bounds,
  repeated Back/Escape, initial Back focus, New Game focus restoration, no answer
  written by cancellation and no callback fired.
- No invokes campaign callback once, persists the explicit answer and bypasses the
  recommendation after reload.
- Fresh Yes invokes Tutorial callback once and persists the answer. No actual
  Tutorial or world was loaded in this fixture.
- Denied localStorage: choice works, an answer survives component remount in the
  page, and a full reload safely offers the recommendation again.
- Forced low-font network failure: visible HTML paragraph remains cancelable.

Receipt: zero page errors/warnings on the primary page, unchanged source and
installed dependency metadata, verified browser/server cleanup. Secondary
blocked-storage page errors were separately asserted empty. Four screenshots were
visually inspected: paragraph and controls fit all tested sizes. In the low-font
fallback, native indexed shadows remain behind the narrower HTML text; it remains
readable but is not native-font fidelity. Secondary contexts are not covered by
the primary page's console-error count.

## Important remaining limit

An unchanged-main673b89ad full Home control still crashed during initial navigation
at11:21 UTC after storage relief and process-local writable TMPDIR/XDG_CACHE_HOME.
Those environment values are preserved. Neither cache warnings nor disk pressure
are established as the cause. No security flags or global environment settings
changed. Full Home startup and actual Tutorial loading remain blocked; the
component pass does not supersede that missing acceptance or prior failed/canceled
receipts in `evidence/tutorial-recommendation-482`.

The native paragraph callback004c5b20 and profile-bit persistence are still unproved.
Word wrapping, final Yes/No positioning and answered-flag policy are explicitly
browser adaptations. No native runtime, hardware FPS or complete UI parity claim.


## Fallback repair follow-up, 11:36 UTC

Candidate `56d062825ac50294eee06df8090aa03fc6eca213` passed the same
supplemental component scenario. The new `fallback-repaired-56d0628.png` shows
HTML fallback without the previously misaligned native paragraph shadows.
The old four screenshots and their source revision remain preserved above.
The final receipt records unchanged source/dependencies and verified cleanup.
Focused tests passed 11/11. This still proves component rendering/callbacks only.

A subsequent plain production Home build attempt exited on SIGKILL after
transforming 384 modules, before browser launch. Its failed receipt and build log
are retained here; no exact cause is established. Actual Home integration is now
assigned to the separate hosted Tutorial browser check. Its success and Full check
are both required by the maintainer before merge; local component success does not
replace either gate.
