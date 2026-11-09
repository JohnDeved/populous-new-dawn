# Same-session Home loading recovery

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/home-loading-retry-20261017), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Bounded negative result: no product defect demonstrated. On main base
`b77aa038914196781e717c4436659fffeeec24f2`, actual Home recovered from two consecutive
required atlas failures in one page/context. Only the existing browser regression
and this evidence changed; application/runtime, CI and resource policy are untouched.

Final tested source: `ed7976ee2a85db170c036ffb516f63248c44f709`.
The manifest binds its tree, original and portable receipt hashes. The publication
commit is a documentation/evidence child, not the tested source. Browser was
sandboxed Chrome Headless Shell `153.0.8010.12`, Node `24.18.0`, macOS arm64.
Weekly Codex usage was 15%, below the 70% stop threshold.

## Actual entry point and observations

The retained runner imports production Home/CSS/public assets through plain
React/Vite. It excludes Vinext/Cloudflare/RSC serving and hydration. The test uses
New Game, declines the tutorial recommendation, and starts Mission 1. It holds real
atlas requests, aborts the first two, activates the focused Try again with Enter
then pointer, and releases the third. Ref inspection observes existing Home/store/
scene objects; it does not supply readiness, callback, scene, world or clock results.
The post-recovery placement check retains the existing injected `placeBuilding`
caller; it is texture identity evidence, not pointer placement acceptance.

[Final browser receipt](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/home-loading-retry-20261017/receipts/browser-attempt5.json) and
[observations](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/home-loading-retry-20261017/attempt5/observations.json) establish:

- Three committed loading phases, three distinct scenes/worlds/atlas objects.
- Each scene held for 1,200 ms with unchanged time, turn, RNG, frame and start state.
- Both failures disposed/aborted their scene and detached its canvas; each focused
  a usable Try again control. Later loading scenes retained Mission 1.
- Third scene became active with no overlay; game time was bounded by measured
  wall time after resource release, excluding held loading catch-up. After the
  real Skip introduction control cleared the input mask, game time advanced again.
- Exactly three atlas requests/two expected atlas errors. The successful unit-layers
  texture was requested once. No fourth atlas request after passive rendering;
  the recovered cursor and a real placement plan shared a fresh atlas identity.
- No page error or crash. Expected aborted-texture console errors and Three.js
  missing-image warnings remain in raw stderr; no claim of a silent console.
- The pre-existing optional unit-health failure case also passed: repeated passive
  lookups issued/logged only one failed request.

[Second failure](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/home-loading-retry-20261017/attempt5/failed-2.png) and [recovered battlefield](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/home-loading-retry-20261017/attempt5/recovered.png)
are 1280×800 captures of that exact source. Loading-1/2/3 and first-failure captures
are adjacent. These are state evidence, not native pixel parity or hardware performance.

## Attempts and checks

All five command receipts are retained, including failures:

1. `dbd95a9b`: restricted shell denied loopback bind (`EPERM`); browser not started.
2. Same source, approved loopback execution: system Chrome reported an existing
   profile session. No test ran. The probe was corrected to create a unique owned
   profile; later attempts used the installed official Headless Shell.
3. `a9fba37d`: both failures and third activation were reached, but the probe's
   arbitrary game-time `<1` threshold failed. It included automation delay after
   activation and did not isolate catch-up; no product diagnosis is inferred.
   Available before-failure captures are retained. The corrected bound measures
   browser wall time immediately before releasing the resource and compares it
   with game time at observation, scaled by the actual game speed.
4. `149a7017`: passed two-failure recovery and measured time bound. The final change
   additionally waits for introduction input-mask clearance before checking normal
   gameplay advancement, instead of allowing advancement during the flyby.
5. `ed7976ee`: final stronger episode passed. Awaited cleanup closed browser/server
   and removed only the newly created temporary profile. Heavy slot released.

Focused `npm run test:focus -- tests/original-loading-screen.test.mjs`: four tests
passed at `a9fba37d`. The exact-path runner verifies the file exists; this result is
reused because the tested component/test and transitive source are unchanged by
later browser-only edits. Final two-file ESLint and orchestration structure checks
passed at `ed7976ee`. Maintained TypeScript did not change, so TypeScript formatting,
Oxlint and Fallow are not newly claimed. Full check/build are not run locally;
parent review and the approved ready-PR hosted merge gate remain pending.

The planner conservatively marks both changed probe/runner paths unmapped and
requests full validation; this bounded evidence does not override that result.
The first plan command used a nonexistent script filename and failed; the actual
`npm run orchestration:plan -- --base b77aa038...` subsequently completed.

## Remaining scope and next useful case

The historical cumulative Chrome crash and broader-wrapper failures remain in
`references/loading-recovery-ui.md` and their original receipts. This passing
bounded episode neither explains that crash nor replaces those failed runs.
The referenced Mac2 final inventory thread could not be read on this executor
(host unavailable); current source and retained loading review were inspected.

Landscape/waves use per-scene fetches in `scene-terrain-runtime.ts`, whereas this
case exercises shared required texture replacement. A landscape pair would test
that distinct resource path but adds no coverage of retained load-request meaning.
The highest-value next case is a saved-checkpoint retry through Home Load Game:
`beginLoad({kind:'checkpoint'})` calls `store.loadCheckpoint()` on each retry, and
that method clones the saved checkpoint. Verify two failures with held landscape
fetches, mutate only the failed world as a labeled fixture, then confirm each Retry
restores the saved snapshot rather than that failed world. This variant is assessed
from source, not executed or claimed passing here. Parent owns scope and slot
coordination. No production fix, parity credit, full lifecycle acceptance or PR
readiness is claimed.

Reproduce from this checkout with installed dependencies and a fresh output path:

```sh
POPULOUS_BROWSER=/path/to/official/chrome-headless-shell \
POPULOUS_RETRY_OUTPUT=work/orchestration/retry-fresh \
node evidence/home-loading-retry-20261017/run-probe.mjs
```

Use the existing command-receipt wrapper for exact source attribution. This runner
uses isolated loopback port 4397 and must hold the shared Mac browser slot.
