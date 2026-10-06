# Mission10 ordinary Firewarrior firing baseline

Prepared source only. No browser has run this checker. Tracked application and
artwork are unchanged from accepted b0208188b8de345a6ad5e86cb7c49769624dda86.
Issue: https://github.com/JohnDeved/populous-new-dawn/issues/229.
The completed source720 resting correction stays separate.

The accepted native producer/phase comparison is checkpointed under
evidence/firewarrior-firing-phase/native-comparison-20261006. Its application
comparison failed with retained differences; its preparation failure, startup-only
PASS and completed comparison remain distinct. This checker supplies the missing
ordinary baseline evidence before any runtime/artwork correction.

## One acquisition and firing route

1. Enter Mission10 through All missions, Mission10 and Enter. Use only the visible
   intro Skip control and ordinary Shaman readiness.
2. Bind source-proven Blue Firewarrior Hut149 by model8/tribe0/object99/angle0/
   anchor(7168,0), and its five original Braves using the accepted construction
   identity evidence. Bind hostile Matak Tower112 by model4/tribe3/object82/angle0/
   anchor(4608,64000), without assuming earlier runtime IDs.
3. Select an original Brave through HUD and click an actual exposed Hut pixel.
   Passive independent RAF observation starts **before this input**, admission,
   allocation and emergence. Retain occupancy, actual4000-mana training cost,
   removal of that Brave, new allocation and visible/selectable on-foot model6.
4. Select only the acquired Firewarrior and deliver one actual ground Move. Try
   exposed model3 pixels for (19,-1), (19,-3), (17,-1) in that order, without another
   point after a rejected/delivered click. Existing detached-clone classification
   and actual synchronous pointer-handler proof remain unchanged. Camera uses the
   same real minimap helper toward (27,-8), keeping the prospective actor away
   from the centered Pause badge. Never click the Tower, which would issue19.
5. After the ground click, arm the real public Pause button and hold mouse-down.
   A read-only RAF predicate detects the same owner in actual current command21,
   substate11/phase44, target Tower and an attributed two-projectile volley. Release
   immediately, before reading the detection handle or draining/logging history.
   The release/click observations must still prove phase44 and the same owner.

Detection does not assume the intended artwork. On this frozen baseline it must
record actual48/14; f1/f2 are observed, not forced. Firewarrior airborne family296
and intended firing56 are never alternative detection predicates. A missed release
is a failed capture; old RAF rows cannot substitute for screenshot-time state.

The automatic building response's rest eligibility is source-backed. Whether an
independent RAF actually samples state17/19 between Move and firing is recorded
separately; no missed transient state is invented. Actual post-emergence movement,
model3 input ownership and model21 firing are required.

## Evidence and acceptance

The observer retains exact Unit/native/command/animation-source identities and
aliases, current order records, flags2/3/4, assignment, state/substate/phase/timer,
source/draw/f1/f2/stamp/counter, unit and native facing, target pose/HP/damage,
projectile source/target/impact attributes and exposed effect meshes. It never
ticks or mutates the live world, RNG, actor, camera, animation or renderer.

Real Pause input includes trusted pointerdown/up/click, coordinates, scene/world
identity, native owner, phase, actual current order and projectile attribution.
After a naturally rendered paused frame, capture the actual mesh frame/VFRA,
direction/flip, descriptor, tribe/layers/pieces/UVs and layer scales. Compare those
against the current source-selected atlas and pure layer selector. Save full-view
and actor-crop screenshots, binding their hashes and unchanged paused owner/phase.
No manual render, mesh hiding, frame pumping, controlled tick or source injection.

Resume through the public control, retain phase40 and observed completion with the
tracked projectiles absent. Native completion fields and facing have outer live
owners; this single witness does not redefine those ownership boundaries or claim
every controller/animation visit. The result remains
captured-pending-visual-review until a reviewer actually inspects the screenshots.
Mesh visibility alone does not prove visible pixels. No performance/parity credit.

## Reused code and focused changes

helper-provenance.json binds accepted helper bytes at evidence commit23f11ea9.
Byte-identical: ordinary input, detached browser probes, input/identity assertions,
Mission10 entry/construction identity and event-deadline helpers.

Three adaptations only:
- ground-and-dispatch: the declared corridor points and real camera destination;
- observer: passive cooldown, projectile payload/mesh and target identity/damage;
- pause-input: extra passive firing reads and firing-specific release assertions.

scenario.mjs composes those helpers; render-observation.mjs reads actual frame data.
The eight host-only pause-input tests check valid baseline ownership and rejection
of expired phases, manual19, foreign target/projectiles, changed owner, untrusted
input and a phase change at click. They are not ordinary gameplay evidence.

## Bounds and cleanup

- One CPU0–3 foreground browser lane, one existing Vite harness, one sandboxed
  official Headless Shell and fresh ephemeral context at1440×1000. No profile.
- Harness300s and outer330s TERM plus5s KILL grace, leaving cleanup reserve.
- Entry/readiness60s; training-target preparation15s; training110s with30s
  no-progress stop; ground Move plus natural automatic firing42s; paused pixels
  and ordinary recovery20s (recovery itself8s).
- One continuous observer,180s, at most18,000 total rows/12,000 undrained rows,
  plus192MiB raw-row disk ceiling. Drain during training and after actual Pause;
  no expensive full-state drain delays the firing release.
- Stop on owner/scene/target loss, non-playing status, hidden page, unexpected
  speed/input mask/pause, entry/vehicle transition, objective/timer activation,
  rejected input, stale pixel, missing firing, missed release, phase/mesh mismatch
  or exceeded resource bound. No new destination, route, case or automatic retry.
- Finally release only an owned unreleased press once, remove only this pointer/
  Pause observer and stop only its independent RAF. Preserve cleanup failures.
  Existing scripts/local-render/harness.mjs owns browser close and Vite process
  group shutdown on completion/error/signal; no global process-name/port kills.
  Retain its terminal receipt and actual original-session termination. Its
  ephemeral contract has no profile cleanupVerified field; do not invent one.

## Source preflight and exact proposed CLI

preflight.py parses/checks source without importing game code or third-party
packages. It traverses literal imports and explicitly seeded dynamic roots,
binds the complete unchanged app/public Git trees, accepted helper correspondence,
checker files and runtime entry/lock hashes. Built-in Node require/import-meta
resolution reads package entry paths; it does not load package code or launch Vite.

The sole dependency tree is still in mission3-raid-recruitment-20261006/node_modules,
inode1978923 (device27 when inspected). Installed lock SHA-256 is
65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8;
root package-lock is c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba.
It requires a coordinator-receipted move to this worktree after source review.
No install/copy/symlink/second dependency tree is allowed.

After that move, rerun the same cheap preflight with --require-local-dependencies:

```sh
python qa/firewarrior-firing-baseline/preflight.py \
  --dependency-root node_modules --browser "$POPULOUS_BROWSER" --require-local-dependencies
```

Only after fresh review, dependency transfer/runtime preflight and a browser grant:

```sh
timeout --signal=TERM --kill-after=5s 330s taskset -c 0-3 \
  env TMPDIR="$PWD/work/orchestration/firewarrior-firing-browser-baseline-01/tmp" \
  CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_SEND_METRICS=false \
  node scripts/local-render/harness.mjs --game-root "$PWD" --browser "$POPULOUS_BROWSER" \
  --port 4401 --mission 10 --timeout 300000 \
  --scenario "$PWD/qa/firewarrior-firing-baseline/scenario.mjs" \
  --output "$PWD/work/orchestration/firewarrior-firing-browser-baseline-01/run"
```

Create fresh owned tmp/output directories and use the existing command-receipt
wrapper with checker/import/preflight/runtime inputs explicitly bound. Check the
chosen private port before launch without disturbing another service. Standard
check/build, browser, native reruns and actual pixel acceptance are not run during
this source preparation. Work remains local, unpushed and not reset-durable.
