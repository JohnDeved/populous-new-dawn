# Ordinary Mission2 Blast episode

Prepared from runtime freeze `4635c1acc9b66c1d54e5e2bc7cad4b88fa30754b` and
read against the reviewed lifetime repair `7c3ac608917d0b6a3a6c4c779460953905f2738e`.
The driver is prospective: no game/browser journey has run. A passing pure helper
test is not a passing ordinary episode, native comparison or parity award.

## Stage and route

`scenario.mjs` uses the public Mission2 selector and introduction skip, waits for
the real Shaman selection gate, selects the original Blue Shaman through the HUD,
and issues one real ground movement command near `(58,108)`. It observes an
existing, living Green Warrior following the authored cyclic model25 patrol, then
uses key1 and a real person hit/release to cast once. No camp, training, kill-credit
raid or bridge reward is requested. No fallback target, injected unit/resource,
terrain-target substitute, synthetic game event or clock stepping is permitted.

The authored patrol is allocated at turn53 and is asserted by turn122 in
`tests/game.test.mjs`. Its marker endpoints are `(52,114)` and `(50,108)`.
`tests/ai-response-task.test.mjs` separately reaches existing camp territory by
turn1000 using the original Shaman and an ordinary ground command. It does not
prove this exact approach point. Approximately one to two simulation minutes is
a planning estimate only. The bounds (turn1800, 140s approach, 240s overall) are
explicit experimental stop limits, not previously measured route durations.
Failure to reach the point, keep the target in range, retain a current pixel or
observe motion during both windup and flight fails this attempt.

Stage1 records person hover/ack, actual delivered pointer calls, stock/cast count,
adjacent real turn observations, parent/shot identity and destinations, actual
arrival and effect allocation, and corresponding rendered frames. It does not
cover the empty-ground control, rejection/cancel/repeat cases, pause, active-cast
save/reload, or completed baseline/candidate frame review. These remain listed in
every result. The maintained early-missions/checkpoint-restart helpers are the
later public Save/Load route; this first driver does not write storage.

## Run only after coordinator lane assignment

Freeze all application and helper sources before creating profiles. Use the
maintained harness and an already installed official sandboxed browser. Substitute
the lane-assigned port, browser path, product root and unique run suffix:

```sh
POPULOUS_BLAST_EXPECTATION=candidate node scripts/local-render/harness.mjs \
  --game-root /absolute/candidate-root \
  --browser /absolute/installed/chrome-headless-shell \
  --port 4188 --timeout 300000 \
  --scenario /absolute/candidate-root/qa/blast-ordinary/scenario.mjs \
  --profile /absolute/candidate-root/work/local-render-profiles/blast-m2-candidate-UNIQUE \
  --output /absolute/candidate-root/work/orchestration/blast-m2-candidate-UNIQUE
```

Replace `candidate` with `baseline` throughout for the unchanged product. Use a
lowercase/digit/hyphen suffix to satisfy profile validation. Both runs require
fresh, separate profiles and fresh outputs. Neither run imports the other's
checkpoint. Baseline explicitly expects the historical absent spell-mode hover
and person identity, plus a fixed point projectile. It still requires a genuine
person pixel, real accepted cast, target motion, arrival and impact. Baseline
success means the expected defect was reproduced, not candidate acceptance.

`owned-profile.mjs` already classifies every `qa/**` path as checker input; no
harness/config reservation is necessary. Its `git ls-files --cached --others
--exclude-standard` enumeration includes the new scenario/helpers. The new test
file is classified as application input; editing it after profile creation
therefore also requires a new profile. Root, origin, application digest and runtime
must match for any later reuse. Checker correspondence cannot authorize a changed
application digest. Preserve failed/locked profiles for review.

The driver reads a bounded `commands/0001.json` stop using the existing preserving
stop helper. Any file there stops further input and is retained; a normal stop is
`[{"action":"stop-preserve-latest","runId":"ACTUAL-RUN-ID"}]`. No Save is issued.

## Evidence and observational limits

- `episode.json`: source/profile/run binding, public actions, full bounded reducer
  report, remaining acceptance and errors. `receipt.json` remains authoritative
  for source drift, browser errors, cancellation and cleanup.
- `startup.json`, `target-setup.json`: selection readiness and natural movement.
- `hover/ack/arrival/impact.png`: actual canvas captured immediately after the
  game's own render, when the corresponding phase and submitted visible mesh or
  SVG are observed. `hover/ack.svg` and `*-brackets.png` preserve the actual SVG
  geometry/computed stroke and its detached rasterization. `terminal.png` is a
  full-page screenshot taken after completion.
- Arrival is captured at its first qualifying render within the exact observed
  arrival turn. An earlier render without the visible effect does not suppress
  later renders in that same turn; a later-turn arrival image is rejected.
- Effect frame pixel counts cover the full nontransparent game canvas. They are
  not isolated-effect pixel counts or an occlusion proof; review the PNG and
  recorded on-screen visible effect together. Bracket counts are from the detached
  SVG raster. No mesh is hidden or redrawn to create an image difference.
- `observer.mjs` wraps existing clock/render/picker functions, calls each original
  once with its receiver/arguments, copies results and restores every wrapper.
  Observer aliases and detached diagnostic clones are not saved game state.
  Range/context diagnostics that synchronize terrain receive detached clones.
- Fresh living outdoor setup is required. After release, native owner class and
  deleted flag determine identity validity; HP alone does not invalidate a
  retained nondeleted class1 owner. Ordinary motion acceptance is separately
  mandatory in both windup and flight.

Helper validation (no runtime imports, browser, simulation, build or native run):

```sh
node --test tests/blast-ordinary-contract.test.mjs
node --check qa/blast-ordinary/scenario.mjs
node --check qa/blast-ordinary/observer.mjs
node --check qa/blast-ordinary/contract.mjs
git diff --check
```

The pure reducer rejects stale context, wrong real-handler identity, missing
feedback/arrival/impact, changed/removed owners, repeated before samples, skipped
turns and externally supplied success fields. Its synthetic records are helper
contract tests only; they do not certify the driver or evidence adapters have run.
