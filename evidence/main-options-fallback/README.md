# Main menu and Options foreground/shadow readiness

Product candidate: `a935b649db5443fcc083b35f61d04a1a750c8d7b`.
Base: `01be71701f9ce085be47c07a27d1347d320c9225` (includes the accepted logo fallback fix).
Refs #16 and #457. This evidence commit changes no product code.

## Change and source boundary

The existing native compositor implicitly draws nine main-menu glyph rows. Those
rows now follow main foreground artwork readiness via a default-true eighth
argument. The seventh logo-readiness argument remains independent and unchanged.
Options publishes its explicit shadow rows only when its own image/font loading
succeeds. Reopening Options clears old rows before mounting its fallback content.
Native row geometry, labels, actions and compatibility controls are unchanged.
This is a browser missing-asset adaptation; no new native execution or research.

## Checks

- `npm run test:focus -- tests/frontend-text-readiness.test.mjs tests/frontend-logo-readiness.test.mjs tests/tutorial-recommendation.test.mjs`: **passed**, 12 tests, exit 0. Ran on the same product/test bytes before the checkpoint commit.
- Tests preserve the native all-ready golden and explicit-default output; a copied transparent glyph-mask oracle verifies that only main text shadows are removed, independently of logo visibility. Actual production draw/effect/entry callbacks cover parent and Options readiness, row identity and remount reset. Existing logo, Quit and Tutorial callback checks remain included.
- Independent source/resource review accepted the bounded read-only C2 tests before fingerprint refresh; shared test helpers unchanged.
- Orchestration plan: first attempt could not resolve the base because it lacked the checkout's Git wrapper. The recorded retry with the wrapper and existing authentication environment passed. Both logs are retained; no check was run by the plan.
- Component browser: **passed**, 2026-10-16 13:46 UTC, exact source manifest unchanged, dependencies unchanged, cleanup verified. Nine screenshots retained.

## Browser coverage

Actual production OriginalMainMenu and OriginalOptions, original assets/CSS,
controlled preference callbacks, native 640×480/DPR1 and 1280×720 main fallback.
Every context used reduced motion. Exact canvas hashes check all-ready output,
main-font failure, Options-image failure with parent title ready, logo failure
with Options ready, held Options-image fallback and readiness recovery. Exercises
Game/Sound/Graphics/Direct3D navigation, volume control presence, browser help,
Back/Escape focus, and Options reentry. Intentional requests are aborted only in
fresh failure contexts; unexpected page errors fail the scenario.

The screenshots show HTML fallback text with its existing CSS text shadow; the
misaligned native glyph layer is absent. All-ready output remains the original
compositor output. No screen/layout redesign is claimed.

## Limits and reproduction

This is component browser evidence, not actual Home/gameplay acceptance or hardware
performance evidence. Required hosted Full check and Tutorial browser gates remain
pending on the final proposed merge. No full local suite/typecheck/build was run.
The browser is sandboxed software headless Chrome; no security flags changed.
The retained runner/fixture use this cloud executor's absolute paths. Reproduction
requires mapping those paths to a candidate checkout/dependencies and verifying the
manifest, not blindly executing them elsewhere. The manifest hashes every copied
production input; fixture and scenario hashes are recorded in the receipt.
