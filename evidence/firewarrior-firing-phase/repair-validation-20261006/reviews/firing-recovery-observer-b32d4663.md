# Captured-volley recovery observer review

**ACCEPT source/preparatory readiness** at
`b32d46639c1f80629ad958e99f3e2fd54ff626a1`.
No blocking source, forwarding, attribution, capture-boundary, fixture or cleanup
defect was found. This accepts the narrow QA observation extension and its actual
host-test evidence, not a candidate-02 browser result. Fresh integrated runtime
preflight and a separate coordinator browser grant remain required.

Only the declared five qa/firewarrior-firing-candidate files changed relative to
6f93: README, preflight, scenario and the two new recovery observer/test files.
App/public, normal CI tests/scripts, package files and compiler configuration are
byte-identical to6f93. Its check-02.json and build-01.json remain passed/0 with
stable source records on their original6f93 label. This QA-only change does not
require a new full check/build or native replay; do not relabel those prior runs
as executions on b32. The earlier native2ea correspondence also remains unchanged.

## Actual callback boundary

The selected hook is source-backed, not a timer-derived inference:

- world-turn.ts:450–452 invokes the turn observer after each real stepTurn.
- game-clock.ts:41–44 dynamically invokes clock.afterTurn within that per-turn
  observer. A multi-turn advanceGame therefore consults the current callback for
  each actual turn.
- scene.ts:278–281 supplies the existing callback for unit/projectile motion and
  worship-presentation handoffs. The adapter forwards it before observing.
- game-clock.ts subsequently performs logical animation before the next controller
  turn. The added rows are therefore after the existing callback and before that
  logical animation, not renderer-frame samples or isolated controller returns.

The callback replacement is an explicitly scoped instrumentation change to the
previous RAF-only witness. It does not call tick, advanceGame, render or animation,
alter elapsed-time values, or synthesize missing states. Existing callbacks remain
authoritative and execute in their original order.

## Captured-volley ownership and acceptance

Installation requires the actual paused captured turn, class1/model6 Blue on-foot
Firewarrior, actual automatic21/0x22 command and phase44/source56/draw13. It pins
this run's scene/world/clock/registry epoch, actor/native and target identities,
current order ID, both captured projectile IDs and the impact projectile actually
tracked by the person. IDs come from the live paused records, not candidate-01's
historical identities. Both attributed projectiles must still be present.

Every recorded row requires the next adjacent turn and the same live owners and
surviving target. Phase44/40 rows must retain the captured order, target, source/
draw and tracked captured projectile (or its disappearance). Another tracked
projectile fails. Phase40 is credited only to that captured command, after arming.
Completion requires leaving that command and phases44/40 with the captured pair
absent, and then still requires a previously recorded real phase40 row.

The scenario retains the original required40 assertion and independently verifies
the row contains the captured order and that all turn numbers are adjacent from
paused.turn+1. It no longer relies on RAF luck for this single transient phase.
It cannot use the earlier volley observed in candidate-01; arming occurs only
after the current captured screenshots. A later launch with a different tracked
projectile cannot substitute. The existing RAF evidence, actual input, texture,
frame/UV/pixel assertions, screenshot checks and deadlines remain intact.

The result establishes the sampled post-turn command release and recovery states;
it does not upgrade the earlier bounded native proof into whole-command or global
clock equivalence. Logical animation can legitimately change frame fields after
this observation boundary.

## Transparency, bounds and cleanup

The wrapper calls the saved original exactly once through Reflect.apply, with
unchanged receiver and arguments. Its original return value and thrown object are
preserved. Diagnostic failures are contained, recorded, and stop observation;
they do not replace normal callback results or escape into application code.

The observer retains at most32 actual rows and lives at most8 seconds. It stops
and restores on success, bound, ownership failure or original callback failure.
Restoration uses the exact original descriptor only while the wrapper still owns
the property. A foreign replacement is retained and invalidates QA. Installation
failure restores an already replaced callback and removes its partial observer.
Timer cleanup and restoration errors are explicit rather than converted to pass.

Each projectile payload is deeply cloned at observation time; expected/initial/
returned rows are cloned when read. The original scalar order/native fields are
captured into separate records. Later game mutation does not rewrite the retained
rows. The scenario persists recovery-turns.json and recovery-cleanup.json, releases
an owned mouse hold before cleanup, and retains the existing harness cleanup.
The fresh preflight destination is candidate-02; candidate-01 is not overwritten.

## Actual preparatory evidence checked

browser-recovery-host-02.json at exact b32 is passed/0,47 tests/47 passes, with
zero failed/cancelled/skipped tests, approximately768ms test duration. This contains
the unchanged original32 checks plus15 recovery checks. Receipt SHA256:
c0157b66f1fd5d9bf70d91300071d50080cb525819567ca968be7e7241d81757.

The new tests cover a synchronous multi-turn catch-up retaining40, the historical
missing-turn sequence failing without reconstruction, adjacent completion lacking
40 failing, original call/result/error behavior, changed ownership/attribution,
tracked projectile and order drift, row/lifetime bounds, invalid arming,
installation failure restoration, diagnostic error containment and immutable
projectile payloads. They exercise observer behavior; they do not simulate or
claim an actual browser recovery result.

browser-source-preflight-04.json is passed/0 at b32, SHA256
e85edabf75ac63284dd10cc5a9b45385960b04a659b0f4af2ae4956c21166aef.
Its339 source-closure hashes and25 checker-file hashes match the current files.
It correctly retains runtimeReady=false. Both receipts have exact stable source/
input records and verified raw stdout/stderr artifact hashes. No host test was
rerun by this reviewer.

Candidate-01's outer receipt and both screenshot hashes remain exactly those in
the previous independent failure review, and its witness status is still failed.
That attempt's missing captured-volley phase40 requirement is not retroactively
satisfied by this prepared observer.

Reviewer work: source/receipt inspection plus read-only Python hash and scope
checks, exit0, approximately0.13s. HEAD and tracked status remained clean. No
browser, package, native or application execution occurred. Only this ignored
review file was written. Review complete; no further source expansion requested.
