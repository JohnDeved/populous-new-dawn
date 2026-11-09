# Settled shared scene, not final acceptance

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-scene-settled-20261015), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

All captures and browser receipts here refer to clean source
`52e645ad96273c6c153bb895b3b566d8299652d7`. Mission 1/2 settled images are
800×600 captures after natural camera convergence; the separately named 640×480
and 390×844 captures exercise responsive layouts. Initial/moving captures remain
in the earlier prototype evidence directory and must not be mislabeled settled.

The render episode passed: center `(320,240)` and outer submitted mesh extent
`14.0235` logical pixels for both selected missions; actual ribbon draws changed
110/243 sampled pixels. CPU submission samples exclude five warmup samples and
are software-browser observations, not GPU completion or hardware FPS.

Repeated scene lifecycle assertions passed in the stage-logged diagnostic with
seven owners, no detached draws and all owners disconnected at the end. The first
unlocalized 240-second timeout remains retained. The diagnostic changes only
external stage logging; its wrapper/input hashes are in the receipt.

Failure/context handling remains unverified: one attempt crashed at the main menu
before selector creation, another before the external scenario began. The proposed
ready-document observer adaptation never ran and has not been integrated.
Visibility is unverified because Vite exited SIGKILL during readiness before the
browser launched. Actual Mission 1 launch was clicked but the browser crashed
before the world canvas, leaving paused-world identity unverified. These failures
are retained verbatim; empty page-error arrays do not convert them to passes.

Sandboxed Chrome 154 / ANGLE software renderer. No original-runtime pixel parity,
unsafe browser flags, forced production animation freezes or hardware FPS claim.
The final candidate also needs its tooltip/fallback repair checks and standard gates.

## Text diagnostic at `22fdd9ee`

The first live text attempt failed the same-ID observation without persisting its
epochs, so its cause remains inconclusive. The external raw-timestamp diagnostic
passed the entire unchanged episode and assertions: title/cursor, strict >500 ms,
same-ID retention, changed-ID reset, keyboard locked selection, resize/real-scroll/
leave/unmount clearing and title/panel fallbacks. One timer survived a second move
360.8 ms after the first, with insertion at 510.8 ms total and no invalidations.
The later accessibility-only repair replaces aria-description with useId-scoped
aria-describedby hidden status text; it does not change pixels, timing or controls.
