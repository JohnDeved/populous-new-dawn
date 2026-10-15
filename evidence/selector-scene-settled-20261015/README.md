# Settled shared scene, not final acceptance

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
