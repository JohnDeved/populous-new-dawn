# Spy capture evidence version 2

Version 1 (no evidenceVersion field) records ordinary independent RAF observation. Historical receipts retain their exact source, driver, and interpretation. They are not migrated or validated as version 2. The version 1 attempt1 failure on run40072217096 remains a failed capture; the separate unchanged-source attempt2 contains genuine frame0/1 evidence.

Version 2 changes only the test harness. Public load, readiness, selection, disguise, sabotage input, pause, and resume remain public actions. Between the existing pause-before-sabotage and pause-after-capture, the harness owns only the original Scene's RAF successor and supplies monotonic1000/24ms timestamps to the complete unchanged Scene.animate path. It does not call tick, advanceGame, a renderer leaf, or mutate World, controller, animation, speed, or clock fields. This is controlled-elapsed browser integration with actual pixels, not natural wall-clock performance or original-game raster parity.

The transparent afterTurn witness records consecutive actual World visits, preserving callback receiver, arguments, result, and thrown value. Logical phase2 entry must still follow the armed visit exactly, with source136, timer23, and f2=0. This callback occurs before logical animation; its data must never be presented as a render sample.

A separate synchronous observer runs after each complete rendered frame. It must capture real native frame0 and frame1 pixels, bind frame0 to the exact logical entry turn, and retain the existing packed-source, owner, draw, direction, pieces, visibility, canvas ownership, overlay, crop, and hash checks. Missing frame0 remains failure even with a valid logical ledger. No >= visit relaxation, synthesized crop, replayed crop, or automatic episode retry is permitted.

Acquisition requires the current live paused Scene at normal speed. Only its exact captured animate callback is intercepted. Other RAF and cancellation calls are forwarded. A single held Scene successor is consumed for each controlled frame; duplicate or missing ownership fails. All frames share one384-frame/192-turn ceiling and the original45-second Spy deadline within the unchanged180-second Mission10 host ceiling. Logical and render ledgers share the existing600-sample ceiling.

After public Pause, a complete original paused Scene.animate(performance.now()) reconciles the synthetic timestamp with real wall time. This handback frame is explicitly non-evidence. Full Spy state, logical turn, and animation clock must remain unchanged; no claim is made that unrelated paused presentation/UI clocks cannot run. Descriptor restoration must preserve foreign successors. Only after successful current-owner restoration is one real Scene RAF scheduled. The existing public pause hold and public Resume continuation then run on ordinary RAF.

Failure abandons the owned scheduling epoch, restores only descriptors still owned, and closes the browser context without restarting an unpaused Scene. Cleanup and restoration diagnostics are retained. No source change can retroactively make an earlier receipt pass.

## Required release checks (not yet executed)

- Scheduler fixtures: exact callback ownership, unrelated callbacks, duplicate/missing successors, aggregate limits, visibility/deadline failure, partial install failure, foreign descriptors, stale Scene, idempotent cleanup, and paused handback without simulation mutation.
- Logical callback fixtures: catch-up without rendered entry, receiver/arguments/result/throw fidelity including falsy throws, consecutive visits, shared storage bound, stale owner, foreign successor restoration.
- Production CPU regression: two logical visits in one advanceGame preserve timer23/frame0 at entry while the final state is timer22/frame1; this is not pixel evidence.
- Strict evidence fixtures: delayed entry, omitted frame0, swapped crops, missing restoration, old-version receipts and falsely labeled handback all fail.
- Exact source/build validation and independently reviewed browser execution of the whole Mission10 episode. Confirm real crops0/1, pause/resume, source receipt, version2 composed validator, and cleanup within45/180s. Runtime cost remains unmeasured until that authorized run.
