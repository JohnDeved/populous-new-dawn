# Mission 3 Vault finite browser driver preflight

**ACCEPT for the three proposed finite rows, subject to the coordinator's execution
lane and dependency-closure prerequisites.** This accepts the driver for execution,
not an ordinary UI-path result or rendered application pixels. No browser was
launched during this review.

Candidate remains clean `ef62e48f07834cddcb543969a7afab5c77a84f4a`; baseline is
clean `71b3860e7025a9534d56248c194aa18610b5df4d`. Reviewed files:

- `driver/scenario.mjs`: `c3fc42d163cf943d98e7ef7d3bb69c7866f71d5b7cd10a31c6aa33404eb89244`.
- `driver/witness.mjs`: `f378b01081a22e20a039d739d1e880e59568a8c00ed650e8f865b867cdab6401`.
- `driver/checkpoint.mjs`: `67bca92dc66241223b5ef72aafcf86d45737e0cdf3449435cf0b63f2923646ea`.
- `driver/launch-plan.json`: `7ab4b42c657cfc23a52e5581811e07fdf0f6c99139b841e80ef67e61d9a08837`.

Those paths are under `work/orchestration/vault-hfx/`. `verification.json` retains
full paths, hashes, caps and source status. The earlier in-turn-Pause drafts are
not referenced by any launch command and are not accepted launch inputs.

## Public control path and observation boundaries

The scenario uses the maintained ephemeral harness without `--profile`. The
unchanged harness starts a new sandboxed Headless Shell browser and context,
opens the shipped startup UI, selects public Mission 3 and skips its introduction
through its existing button. No source/dependency/profile guard is modified.

The production requestAnimationFrame and full Scene animation/turn callbacks keep
running. Readiness checks observe the active Shaman; host Playwright owns Pause,
Resume, Select and focus shaman, minimap clicks and the final Vault click. The
minimap search invokes the existing pure inverse mapping. Vault hit search invokes
the existing input picker, whose mutations are geometry caches, not simulation
state. The final order is an ordinary pointer click after one selected unit is
observed; it is not a direct command/controller call, injected gift or forced
worship completion.

The observer wraps beforeTurn, afterTurn and renderer.render. Each calls the
original exactly once with the original receiver/arguments and propagates original
exceptions. Diagnostic observation failures are retained and cause the scenario
to fail; they do not replace/suppress application calls. Hook restoration checks
ownership, reinstates own properties or removes wrappers for inherited methods,
and marks an unsuccessful cleanup as a failed result. No observer invokes Pause,
advances clocks, writes World state, changes simulation fields or invokes rendering.
Canvas capture occurs only after the actual production renderer returns for the
main scene/camera, with a two-million-pixel bound.

The repaired observer arms birth → retirement → payout prospectively. It retains
exact before/after-turn samples even when the host cannot Pause immediately.
Multiple lifecycle transitions crossed before a real render retain separate turn
snapshots and receive the same later actual rendered snapshot. They never receive
synthetic intermediate pixels. In particular, if the gift retires before its first
real render, the recorded birth post-render gift is hidden and the scenario's
required `birth.postRender.gift.visible === true` assertion fails. A pending label
alone therefore cannot certify a visible birth/body PNG. The raw late image may be
retained diagnostically, but it cannot be accepted as visible-body evidence.

The lifecycle assertions require original birth remaining 82/phase 6, Temple HFX
1079 plus a glow in 1417–1430, hidden source marker, gift retirement exactly six
object turns later with remaining 76 and no knowledge, and payout exactly 82 turns
after birth. Payout's immediately preceding object sample must still show remaining 1
and no Temple knowledge; the next sample must show knowledge and no gift.

## Checkpoint path

The candidate first saves a nonzero marker cursor through Game settings → Save
checkpoint. A read-only IndexedDB transaction confirms exact saved cursor, turn,
Mission 3, active source, absent Temple knowledge and no gifts. The old witness is
restored before an ordinary page reload in the same browser context.

The load witness subscribes to the existing store before the real startup
dialog's Load Game button is clicked. The existing store replacement/update is
synchronous; its first changed-World notification is cloned and unsubscribed before
later React activation/automatic resume. That snapshot is compared exactly to the
saved state. The later live Scene state is captured separately after rebinding and
host Pause; it is not incorrectly required to have the same advanced cursor as the
pre-activation boundary. The driver claims only same-context reload persistence,
not cross-process profile persistence. Its helper never writes IndexedDB.

## Launch rows and resource boundaries

I read the full launch arrays and verified all three explicit `--input` bindings
against the frozen hashes. Every row wraps the maintained harness with
`command-receipt.mjs`, exclusive CPU affinity 0–3, an inner harness deadline and an
outer TERM/KILL timeout. Candidate preflight and baseline marker have 120000ms inner
caps and 140s outer caps; candidate acquisition has 420000ms inner and 440s outer.
All outer wrappers use `--kill-after=5s`.

Each row names the correct candidate/baseline cwd and game root, fresh output and
TMP/TEMP/TMPDIR paths, and the verified prerequisite Headless Shell path. Port 4363
is intentionally reused sequentially, not concurrently. Before reuse, the previous
row and its owned browser/server descendants must be terminal and the listener
must be absent. A failed `ss` invocation is not evidence of that absence. The owner
will retain closure-move receipts and verify equal root locks while moving the
approved dependency closure between candidate and baseline; this review itself did
not move or mutate it. Baseline had no node_modules at review time, as expected
before that explicitly planned move.

Only the candidate's final row claims acquisition/checkpoint/lifecycle evidence.
The preflight and baseline exit after the marker capture and clean witness
restoration. Any failed row retains its evidence and requires diagnosis; it is not
permission for an unbounded retry or a weakened assertion.

## Verification and acceptance limits

Independent host tests passed 3/3 on these frozen sources, retained in
`witness-tests.log`. They cover receiver/argument/return preservation, one original
call per visit, diagnostic purity, production exception propagation, restoration,
and crossed birth/retirement without a render. Hash/launch-boundary checks passed.
These tests are driver evidence, not browser UI-path acceptance.

I also verified the newly available unchanged-head standard check/build receipts
and raw log hashes: both passed on ef62e48. Source-bound format/Oxlint/ESLint receipts
are present and report failures; they must remain labeled with their legacy-source
attribution, not described as passing gates. Full attribution and final rendered
artifacts remain for the final acceptance review.

Actual ordinary reachability, screenshots, browser errors, transient rendered-stage
availability and cleanup must be inspected after execution. The proposed rows do
not calibrate native wall-clock cadence, reproduce the class 2 screen sequence,
prove native full-raster equivalence or certify hardware performance. They also do
not by themselves establish rotated/resized rendering beyond their fixed viewport
and minimap camera move. Missing transient body pixels must remain failed/missing
evidence even if the turn-level lifecycle samples pass.
