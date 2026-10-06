# Candidate-01 phase40 observation diagnosis

Source freeze:6f93bf493139bb61e86e3b275269277c12c09593. Read-only inspection of
firewarrior-firing-phase-fix-20261006/work/orchestration/firewarrior-firing-browser-candidate-01.
Companion JSON retains exact source/raw-file hashes and compact actual rows.
All row numbers below are1-based JSONL line numbers, not0-based array indices.

## Finding

The evidence contains a concrete sampling gap at the captured volley's expected
recovery boundary. It does not demonstrate a skipped-phase runtime defect.
The failed run remains failed; earlier-volley rows cannot complete the captured
volley's post-Resume acceptance. No browser rerun or QA/runtime source edit occurred.

- Rows185–186, turns514–515: actual FW178/native95 automatic order36/flags34,
  source56/draw13/phase44, paired shots185/186.
- Rows187–188, turns517–518: the same actual owner/order in phase40, first timer0
  and then timer5. The earlier volley therefore proves this candidate can enter
  and retain the real phase40 state. It is not the captured volley.
- Row204 and detection at turn540: actual FW178/native95, order37/model21/flags34,
  Tower65, source56/draw13/phase44/timer4, paired shots190/191 with remaining16.
  Real pointerup/click retained turn540/phase44. Both screenshots bind to this turn.
- Row277, now70339.1ms: still paused at turn540, same captured ownership.
- Row278, now70526.8ms/scene70448.6ms: resumed at turn542, phase44/timer2.
- Row279, now70634.6ms/scene70598.5ms: turn543, phase44/timer1/f2=3,
  stateObject191, both190/191 still present (remaining13), Tower65 alive.
- Row280, now70754.1ms/scene70715.1ms: turn545, native state17/command0/phase0,
  captured shots absent. There is no RAF row for turn544. Adjacent observations
  span119.5ms of observer time and116.6ms of scene time while crossing two turns.
- Row281 is turn546. The first recovery drain retained rows209–281; its subsequent
  direct read was already turn557. The loop correctly found completion and failed
  the required phase40 assertion. Final cleanup retained another7 RAF rows; none
  contains the missing turn544.

The full file has288 RAF rows and exactly two phase40 rows, both before Pause.
The row stream and source-bound input/detection prove the same ordinary route;
no manual19, world replacement or target loss explains this missing observation.
There is no logged exact Resume timestamp; rows277–278 bracket it.

## Source trace and limits

app/scene.ts:696–704 computes real elapsed time and calls advanceGame synchronously.
app/game-clock.ts:66–104 processes elapsed time chronologically, allowing multiple
logical turns in one renderer frame. app/world-turn.ts:447–452 calls stepTurn and
its existing afterTurn observer for each due turn. Only afterward does scene.ts
finish renderer work and request its next RAF. The independent RAF in
qa/firewarrior-firing-candidate/observer.mjs:155–168 samples once per browser frame;
it cannot interleave between synchronous catch-up turns. Faster host polling,
setTimeout or another RAF cannot guarantee access to an intermediate turn.

app/world-turn.ts:1334–1339 runs the current command21 controller once and continues
to the next unit. app/live-building-combat.ts:571–590 decrements a phase44 timer;
reaching zero changes animationMode to40 and sets the entry bit. Its separate
phase40 branch at554–570 runs on the next controller visit; absent tracked shot or
expired timer completes it. stepFirewarriorShots executes earlier in the real turn
(world-turn.ts:858), with ordinary impact/removal in firewarrior.ts:114–149 and the
end-of-turn effects filter at world-turn.ts:1827. Thus a nearby-target recovery can
be as short as one completed logical turn and need not appear in a rendered frame.

Turn544 is consistent with the source's phase44→40 transition and545 completion,
but it was not observed and must not be fabricated. Automatic target rescanning
also has a normal outer owner (combat-order-search.ts:156–158); missing raw state
prevents a claim that the exact intervening invocation was directly proved.
The earlier real phase40 observations and source path support a sampling diagnosis;
only a prospectively captured per-turn row can settle this captured-volley gate.

## Smallest proposed repair for review

Keep all existing gameplay input, RAF capture, screenshots, phase ownership and
phase40-required assertion. Add one short-lived, separately named QA recovery
observer armed on the actually paused captured owner immediately before the real
Resume input. Adapt only the existing scene.gameClock.afterTurn callback:

1. Retain the original callback; forward its receiver/arguments exactly once,
   preserve its return and original thrown exception. After its normal return,
   read only compact actual world/unit/native/current-order/target/projectile data.
2. The clock's existing adapter (game-clock.ts:41–44) invokes this callback after
   each actual stepTurn, even when several turns share one renderer frame, and
   before that logical turn's subsequent animation visit (game-clock.ts:84–92).
   Record this phase precisely. Do not interpret stale render mesh data as that
   turn's pixels or sample the full renderer snapshot here.
3. Pin the armed scene/world/unit/native/order/Tower and captured190/191 identities.
   Require adjacent real turn numbers after the paused turn, normal speed/status/
   visibility/input/health, actual model21/flags34/substate11/phase40 before that
   captured lifecycle's completion. Retain stateObject and projectile presence,
   without requiring a projectile still be visible when its normal impact removes
   it. Never fill missing turns or borrow an earlier-volley phase40.
4. Keep8s recovery and20s capture/recovery limits. A compact128-row ceiling covers
   the normal96-turn8s bound while failing closed on unexpected work. Observer
   errors should invalidate evidence without changing game callback results.
   Restore only the owned callback on completion/error/finally; never call it,
   tick, advanceGame, renderer, RAF scheduler or a world mutator from the observer.
5. Use actual retained per-turn rows for the same phase40 requirement. Preserve the
   ordinary real Resume/completion/projectile-removal checks and existing RAF rows.
   Add focused source tests for forwarding, adjacent catch-up turns, foreign owner,
   missing40, wrong command/target, record/time bounds and owned-only cleanup.

A similar transparent afterTurn adapter already exists in
qa/erosion-ordinary/lifecycle.mjs:58–75 and qa/erosion-native-replay/capture.mjs:54–79;
the broad fixture-controlled browser checkers are not a model for this change.

This proposal changes observation instrumentation at an existing callback. It does
not propose a new game-clock field, clock reset, adjusted delta, synthetic turn,
forced phase, world mutation, render invocation or simulation scheduling change.
It is nevertheless a narrow exception to the original observer's independent-RAF-
only scope, so it needs explicit coordinator/source review before implementation.
If that boundary must remain absolute, robust per-turn proof cannot be obtained by
polling alone; another lucky browser sampling result is not a sound repair.

No hardware-performance or complete native caller-parity claim follows. Actual
screenshots and8192-limit texture evidence remain separately retained; this
investigation did not redo their visual review.
