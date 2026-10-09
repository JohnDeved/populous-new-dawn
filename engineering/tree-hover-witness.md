# Ordinary Mission 1 tree-hover witness

This focused issue19 checker uses the maintained local-render harness, one fresh
ordinary Mission1 opening, real Skip/readiness, default Shaman selection, normal
speed and natural RAF. It does not mutate the game clock, world, selection,
commands, camera, uniform or render schedule. No original-game execution is added.

The declared target is DAT object20: type5/model1/neutral255 at browser (3,23).
Resolve its runtime ID by coordinates/model rather than assuming DAT index equals
runtime ID. The control is DAT object42, the Blue Hut with authored anchor (-12,34).
Its runtime anchor is (64512,54784); `addBuilding` separately normalizes the
rendered origin. Resolve by anchor/owner/kind and use its actual runtime x/z.
The neutral owner is represented as -1 by the existing browser highlight adapter.

Preparation uses existing rendered model-face candidates and the existing integer
5x5 `findEntityInput` contract. Its direct `scene.picking.pick` calls may update
picker and matrix caches. They are explicitly diagnostic preparation, never ordinary
input evidence. `pickWorldObject` is unsuitable because it omits trees. Before
real pointer delivery the checker requires a later natural renderer frame and a
changed Scene RAF handle. The actual `updatePointerFrame`→`picking.pick` receipt must
then occur beyond that retained preparation boundary and return the authored ID.
No arbitrary turn-age cutoff or cache clearing is used.

The finite route is tree hover, stationary-pointer W pan, stationary-pointer zoom
out, zoom-in/minimap return, tree re-hover, actual HUD leave, Blue Hut hover and HUD
leave. Each live object hover observes all four natural turn residues. Uniforms
must be200 for residues0/1 and255 for2/3; both inspected models must be0 when not
hovered. Actual input handlers have synchronous before/after selection, order and
RNG snapshots. Natural world evolution between input events is allowed.

The observer chains only owned pointer-update, picker and render methods and
passive pointer/keyboard listeners. Original return values, receivers, arguments
and exceptions are preserved. Diagnostic failures become evidence failures and
cannot stop the game's next RAF. Each PNG is read synchronously at the actual
main-scene render return, before host serialization. Owned methods/listeners are
restored even after failed observation. There are at most512 records,10 PNGs,
12 seconds per phase and120 seconds from observer installation. Startup has a
60-second admission budget; the harness supplies the outer run timeout/cleanup.

Run only after the coordinator grants the exact reviewed source/checker pair.
Use the already installed official sandboxed Chrome154 runtime and stationary
dependencies; do not copy/link/install dependencies or change sandbox settings.
The existing harness keeps `CLOUDFLARE_CF_FETCH_ENABLED=false` and
`WRANGLER_SEND_METRICS=false`. Use a fresh output directory and no persisted profile.
The scenario can live in this QA worktree while `--game-root` names the exact
baseline or candidate: browser preparation imports only pre-existing game helpers.

- Baseline:2107ccfabc1737aed55aca3c5579a920dd63a667. Full applicability means
  startup/target/input/camera/leave/Blue Hut controls complete. The expected tree
  uniform0 failure is retained as a failed run, never reclassified as passed.
- Candidate: exact reviewed product commit, recorded in the harness receipt.
  Requires the same target, route, bounds and checker bytes. Partial startup,
  missing interior point, missed natural residues or changed ownership are failed
  prerequisites and do not reproduce or disprove the product bug.
- Before assertions, `tree-hover.json` retains raw observations; PNG extraction
  then precedes acceptance. Every action/preparation is persisted as it happens.
  Keep all failed directories and checker hashes alongside the later result.
- Dependency-free preflight: `timeout 90s taskset -c 4 node --test
  tests/tree-hover-witness.test.mjs`. It composes exact shipped input functions,
  real minimap inverse and current heading with supplied rendering/DOM boundaries;
  it does not claim actual browser rendering.

This is current-port input/highlight/captured-frame evidence only. It does not
establish native controller or raster equivalence, hardware performance, tooltip
behavior, campaign completion, or complete issue19 acceptance. Readback overhead
perturbs timing. Existing forced-turn/focus highlight scripts remain supporting
fixtures and cannot substitute for this ordinary witness.

## Retained baseline01 preparation failure

The first ordinary attempt on QA9dcee20/application2107ccf reached real readiness
at turn405/inputMask0/default Shaman30, then failed before any target/pointer
preparation. The checker incorrectly compared the Hut's displayed origin with its
DAT anchor. Exact `createWorld(1)` already places object42/runtime37 at
(-11.0703125,33.0546875), anchor(64512,54784); the old predicate is false at turn0.
This attributes a checker prerequisite error without replay or a new target. It
does not establish which live entities remained at turn405 because that attempt
did not retain a roster. Future attempts persist a bounded roster and separate
object20/object42 match counts before asserting target availability. Keep
`tree-hover-baseline-9dcee20-20261009` failed; no hover reproduction credit applies.
The same feasibility contract advances that actual model through one fixed405-turn
`tick` sequence and retains the same tree ID/four logs and Hut ID/anchor. This is
supporting model evidence; it does not reproduce the browser's RAF, flyby or exact
readiness timeline and does not fill the first attempt's missing live roster.
