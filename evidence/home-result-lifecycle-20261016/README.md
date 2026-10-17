# Home result lifecycle coverage audit

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/home-result-lifecycle-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Base: `8280e4b367dd2b58f047e4e23cf2dda056cdee4c` (main through #494).
This branch changes tests and a browser scenario only. It does not depend on the
heading-position repair in #496 and changes no outcome or statistics producer.

## Existing coverage

| Boundary | Existing evidence/code | Limit |
|---|---|---|
| Won/lost headings, unavailable statistics, labels and layout | `tests/original-result-screen.test.mjs`; #496 component captures | Isolated component; no world replacement |
| Home visibility gate and callback selection | `scripts/result-ui-fixture/{prepare.py,capture.mjs}` | Extracted Home fragments with callback spies and fixture stubs |
| Won result -> Continue | `scripts/check-browser-campaign-natural-victory.mjs:1115`; `scripts/check-browser-mission4-natural-victory.mjs:726` | Campaign-specific routes; existence of a checker is not a fresh passing receipt |
| Continue/restart and loading disposal | `scripts/check-browser-loading-screen.mjs:384` | Continue uses a seeded win; Restart comes from the pause menu |
| Pause restoration and obsolete-world protection | `tests/pause-menu-ownership.test.mjs` | Extracted Home handlers; no result-selector round trip |
| Historical Home won/lost copy checker | `scripts/check-browser-invented-ui-copy.mjs:125` | Retains obsolete labels such as Level Complete/Level Failed; does not execute loss Restart |

The missing dedicated route is a paused loss result -> Select Level -> Back or
Escape -> same loss result -> Restart -> fresh playable world with old-scene cleanup.
No claim is made that the existing route is broken.

## Added regression scope

`tests/home-result-lifecycle.test.mjs` executes Home's actual JSX and handlers with
the real game store. It covers the loss/camera gate, Restart routing, selector Back
and cancel without a pause-menu detour, and replacement of the paused lost world
while clearing stale menu/camera ownership. It does not mount React or dispose a
real scene.

`scripts/local-render/result-loss-lifecycle.mjs` is one actual-Home browser fixture
for the missing route. It starts Mission 1 through the normal UI, pauses with the
public button, then explicitly seeds `status='lost'` and a finished result camera.
All subsequent selector return and Restart actions use shipped buttons/keyboard.
Assertions cover result labels, ten unavailable counters, same world/scene/canvas
on return, then a fresh unpaused Mission 1, disposed/aborted old scene, detached old
canvas and an unsuspended replacement scene. Two screenshots and a JSON report
are planned.

Browser execution is **not run**: parent coordination is required before occupying
the browser/build lane. Use the existing actual-Home Vite hosting fixture and a
fresh output directory when the parent authorizes the run. The scenario does not
launch its own browser or change security options. Outcome injection establishes
presentation prerequisites only; no natural defeat, native lifecycle/timing,
statistics production, persistence or complete campaign acceptance is claimed.

## Focused verification

Run these tests together: `tests/home-result-lifecycle.test.mjs`,
`tests/original-result-screen.test.mjs`, `tests/pause-menu-ownership.test.mjs`.
Check the two new JavaScript files with ESLint and Node syntax checking.
The orchestration plan identifies new paths as unmapped and conservatively selects
the full repository check. That full gate remains with the parent's hosted ready-PR
CI; it is not replaced by the focused local checks. No maintained TypeScript changed.
