# Issue 40: ordinary zoom observation preflight

Initial base: `86c0dd37b1a7879a84d5a55ab9bca4b14beed029`; integration adopts
main `eac737a0f7411f432ed790202cde63a42e314115` (the delivered PR275 acknowledgment
repair and its test) without altering the QA source. This change adds QA only;
the integrated PR42 renderer is unchanged. It does not establish a new defect or
complete issue40, issue15, or the issue87/62 hardware acceptance.

## One bounded run, when assigned

Use the existing `scripts/local-render/harness.mjs` with an owned server port,
fresh output directory, official installed browser, and this scenario:

```text
--scenario scripts/local-render/ordinary-zoom.mjs
```

Omit `--profile`: saved task profiles belong to their existing coordinator.
Do not copy dependencies or reuse the historical Mac/performance queue jobs.
The existing harness records source/browser provenance and stops only its owned
server process group and browser. No browser or server was launched for this PR.

The scenario opens Mission1 through the harness's public Mission1/Skip controls,
retains the ordinary opening position, and leaves simulation speed, pause state,
flyby, clocks, RNG, camera state and rendering ownership to the game. It issues:

1. `-` from normal to bird, then `=` back to normal.
2. `-`, followed by one `=` after an actual fractional frame was observed. This
   request is not guaranteed to arrive during a fraction. Its in-page keydown
   record must prove active `0 < previewFraction < 1`, matching last-render state,
   and preservation of the displayed config through the existing game key handler.
   A missed fraction stops the run without retry.
3. Held `w` and `q` with `-`, genuine release after one naturally rendered combined
   movement/rotation/zoom sample, then the settled bird-view endpoint observation.

The post-readiness observation is capped at 15 seconds, 512 metadata rows and
12 PNGs. Absent intermediate bands remain missing evidence. No artificial RAF,
render, time delta, event dispatch, direct `Scene.pick`, or camera reset is used.
The controlled camera-view and zoom-edge scripts are not imported or executed.

## Observation and cleanup

The renderer wrapper forwards the original receiver, arguments, return and thrown
object. Only successful, naturally requested main-scene draws are sampled. PNGs
are retained immediately on that return, before host serialization. Keyboard
capture/bubble listeners record actual trusted delivery before and after the
existing game listener. The observer does not invoke that game listener itself.

Cleanup releases held keys through browser input, removes owned listeners, and
restores the original renderer descriptor only while ownership still matches.
Partial receipts and PNGs survive scenario failure or an ownership conflict.
The harness retains the final browser/server cleanup responsibility.

## Cheap contracts and verification status

`node --test tests/ordinary-zoom-witness.test.mjs` passed 8 tests. The composed
fixture drives an ordinary-handler stand-in between passive capture/bubble
listeners and existing-render stand-ins. It covers delivered chronology, a real
observed fractional versus missed-endpoint reversal, no World/clock mutation,
same-call PNG capture, callback receiver/return/throw, descriptor restoration,
readback failure, partial installation, ownership conflicts, and row/time bounds.
These are contract tests, not browser delivery or visual evidence.

Both new modules passed `node --check`; `git diff --check` passed.
Scoped format, Oxlint and ESLint use the stationary checkout's binaries and exact
config paths, without copying or linking dependencies. Formatting and Oxlint
errors found in the first preflight were repaired. Remaining Oxlint browser-alias
and function-scoping warnings are advisory: the observer must remain self-contained
for page serialization, and `window` identifies the browser context. ESLint's
React-version discovery warning reflects the isolated checkout's absent dependencies,
not a source error.
The actual-base orchestration plan conservatively selects `repository-check`
because the new QA paths are unmapped. This is an explicit review requirement,
not an empty check set. Aggregate check/build and browser/native/performance
checks are **not-run**: this bounded assignment permits cheap contracts only,
with the coordinator owning the stationary execution lane. No dependency
installation or additional aggregate execution was attempted.

Passing this scenario later would establish only sampled current-port ordinary
control/render observations. Full-resolution images still need human review.
Readback perturbs scheduling; no hardware FPS, performance nonregression, full
transition raster equivalence, original scheduler timing, or pointer-picking
proof follows. The original 18-step native recurrence remains separate evidence.
