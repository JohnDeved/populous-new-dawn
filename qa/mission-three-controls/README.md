# Mission 3 ordinary-controls evidence driver

Prepared source only. A passing syntax/unit-test result is **not** a browser run.
The plan was accepted at `c01d788` and the actual driver source preflight at
`e4fc02a`. The run adopts accepted main `b381851` through PR185/196/197/199/201/202/205.
PR202 changes only an independent Mission4 checker/profile test; all50 guarded
application/direct-import bytes remain identical to `f78e5c1`. PR205 adds the
reviewed owned persistent-profile harness; its three direct callers bring the
manifest to53 guards. The shared Mission1 Save→close→Load proof establishes
profile persistence; Mission3 preparation/continuation still needs its own observation. Four guarded callers
were refreshed after source review of the transport additions; ordinary dispatch,
load, clock and observer paths are unchanged. The driver reads rendered geometry
and retains its accepted bytes. The additive PR196 browser helper is also guarded.
Browser execution needs coordinator resource release.
Do not install packages, reuse M2 resources, or run a browser merely because
this file contains a command.

The driver uses the current maintained sandboxed local-render harness, its fresh
owned browser context, and the ordinary controls described in
`engineering/local-render-harness.md` (accepted shared guidance commit
`5ec5d4681f2160d006c333d4a9877aa90a7dfd14`, "Ordinary-control scenario preflight").
Its scenario and browser source must be the same isolated worktree. No production
application code is changed. See `preflight.md` for strategy, scope and evidence
requirements.

## Small source-only checks

```
node --check qa/mission-three-controls/driver.mjs
node --test qa/mission-three-controls/observation.test.mjs
```

The twenty-five isolated tests cover original callback receiver/arguments/return and
exact invocation count; diagnostic exception isolation versus real application
exceptions; idempotent detach; separate reload/time epochs; strict singleton
conversion identity; rejecting death/poll gaps; and progress that ignores a
merely advancing simulation clock. Additional cases cover null/undefined/hostile
diagnostic exceptions, copied native admission occupancy/queue data, and the
explicit incomplete-stop classification, authored allocation identity, fresh
command/recipient/ground-target correlation, worker construction progress and
wall-clock diagnostic boundaries and terminal observed-defeat classification at
all batch/wait/catch boundaries. Temporal cases preserve an actually observed
secondary-owned ground marker after its four-turn expiry, reject stale or missing
witnesses and cross-reload history, and verify the bounded512-marker cursor window.
The minimap regression rejects a geometrically nearest pixel covered by a HUD tab,
requires real canvas ownership, and rejects unowned or overly distant alternatives.
Additional cases cover immediate required-actor stops, successful conversion before
expected victim disappearance, prospective deterministic approach anchors, a declared candidate pool, first
owned-sermon onset locking, rejection of retrospective arming or a missed
listener, native preaching-cell limits and the bounded specialist-distance anchor tactic. Idle Preacher timers do not count
as progress toward a sermon. The tests use isolated plain JS data, not the
game simulation, browser, assets, native executable or installed packages.

## Reserved future launch

After review, dependency transfer and explicit resource release, use an agreed
private port and fresh task-owned output/TMP/cache paths. For example:

```
node scripts/local-render/harness.mjs --game-root "$PWD" \
  --browser "$POPULOUS_BROWSER" --port AGREED_PORT \
  --output /absolute/fresh/mission3-output --timeout 5700000 \
  --scenario "$PWD/qa/mission-three-controls/driver.mjs"
```

The 95-minute outer harness allowance leaves cleanup/checkpoint margin beyond the
driver's initial 90-minute wall envelope. It is not a gameplay ETA. The initial
active budgets are 10 pooled game minutes through reloaded conversion, then 30
from that conversion milestone through the result. Changing a budget requires a
reviewed checker revision and coordinator ownership, not a runtime clock change.
The marker observation repair is described in `marker-expiry.md`; its failed
first run remains failed. The separate minimap repair and failed second run are documented in
`minimap-ownership.md`. Each wait checks state each second and reports stage progress at 30-active-second
intervals. Two active minutes without relevant progress, 30 wall seconds without clock/RAF
advancement, or a stage/resource budget stop ends as an explicitly incomplete
observation and best-effort UI checkpoint. These do not become gameplay assertion
failures, nor do they return a successful harness result. Stochastic sermon
countdowns count as meaningful progress. Ordinary defeat terminates the failed journey promptly instead of awaiting another batch.

The driver opens All missions → Mission 3, derives the authored victim ID from the source-verified allocation prefix before
startup readiness waiting, without requiring its current position to stay fixed, waits for the real selection gate, and pauses using
the HUD. It then consumes task-owned numbered JSON command batches at
`OUTPUT/commands/0001.json`, `0002.json`, etc. Each file must be an array of at
most 32 commands; create it atomically when ready. The driver copies and hashes
its exact consumed bytes, refuses changes during execution, and pauses using
normal UI after each batch. Paused command-wait time is still wall time.

There is no arbitrary code, eval, key injection, model command, direct camera
mutation, RAF suspension or simulated tick action in the protocol. Diagnostic
page evaluation only observes/projects/picks, validates on detached World
clones, reads IndexedDB, and installs the reviewed nonthrowing observation hook.
The live app callback is invoked exactly once; only observation exceptions are
caught, and any such exception invalidates the proof. Every load starts a new
observation epoch, including its forward game-time accounting.

## Acquisition batches

The complete `acquire` wrapper still executes preparation, training and approach.
The protected strategy now uses split actions so real combat decisions can occur
while the trainee trains. See `protected-sermon-strategy.md`. First batch:

```
[{ "action": "prepare-temple" }, { "action": "start-preacher-training" }]
```

This executes Vault → Shaman home → Temple built by five existing Braves → one
verified training order. Inspect the paused snapshot for the actual hostile
Preacher. Use ordinary Shaman movement/Blast and current target results while
training advances, then `finish-preacher-training` and `approach-sermon` (with
`resume` at the start of each new batch). Keep the Shaman at the observed covering
position or use `return-shaman-home` as a prospective tactical choice. Original untrained Braves must remain. Shaman home arrival is observed before construction. Before the protected
approach, the actual Shaman must be alive and its current position is recorded. Every meaningful order/plan is asserted immediately; it does not accept unrelated AI construction.

Once `approach-sermon` has recorded and saved the exact first-onset locked listener,
the interruption batch is:

```
[
  { "action": "cancel-sermon" },
  { "action": "reload-sermon" },
  { "action": "complete-conversion" }
]
```

Load auto-resumes. The new observer must attach while the original saved sermon
is still observable. A missed conversion before attachment is not a pass. The
conversion milestone requires the same victim locked at its first observed owned-sermon onset and named Preacher, adjacent-turn
state23 ownership, singleton same-kind flagged replacement, and an actual new
Blue Brave. The screenshot uses ordinary minimap positioning. An eligible idle Brave supplies only a prospective movement anchor. Before
intrusion, the observer records the complete bounded pool of current living
Yellow Brave IDs (including workers/housed people) and the actual Blue Preacher.
It locks the first new owned state23 onset, choosing lowest ID on a same-turn
tie. That exact listener must still exist before ordinary Pause/Save; no
retrospective arming, re-arming or substitution after disappearance is allowed.

After the conversion witness, the Erosion batch is:

```
[{ "action": "erosion" }]
```

It must observe one use, a real Erosion effect and its completion after the
protected conversion witness.

## Tactical continuation

Combat remains an observed tactical session, not a huge fixed-turn loop. Read the
retained screenshots/snapshots and journal, then choose ordinary commands:

- `prepare-temple`, `start-preacher-training`, `finish-preacher-training`,
  `return-shaman-home`, `approach-sermon`
- `resume`, `pause`, `clear`
- `select`: kind `shaman`, `brave`, `preacher`, `warrior`; count `one`, `five`, `all`
- `map`: point `{x,z}`; `rotate`: one actual right-button camera drag
- `move`: point `{x,z}` (view prepared first, then accepted ground input)
- `order-entity`: collection `units`, `buildings`, `shrines`; exact numeric ID or
  remembered alias `vault`, `temple`, `preacher`, `victim`, `erosion`, `replacement`
- `build`: kind `hut`, `temple`, `camp`; preferred point; a new safe `alias`
- `cast`: spell `blast` or `swarm`; target coordinate or known actor ID/alias
- `wait`: typed `condition`, progress `scope`, optional `watchIds`
- `snapshot`: safe `name`; `checkpoint`: safe `name`
- `prove-victory`, then `finish`

Start tactical batches with `resume`; batch boundaries are intentionally paused.
Camera preparation must precede mode selection. The minimap helper waits for
ordinary camera settlement, chooses an actually canvas-owned pixel within8 world
units of the requested camera point, and verifies the observed focus destination.
Only Shaman home return searches a radius2 ground neighborhood; its actual click
is less than3.5 units from home and the unchanged arrival condition requires≤4.
Preacher approach checks at most eight exact ground candidates in the
prospectively recorded anchor area; that anchor is not a fixed victim requirement. Cancellation prepares at most eight fixed nearby ground candidates through
normal paused selection/camera controls, chooses one outside the locked victim's
preaching cells, then resumes for the real accepted move. Tactical moves retain
exact-point probes. A selected plan/spell must not
be followed by a minimap helper that clears its mode. Entity clicks require a fresh dispatch timestamp/pointer acknowledgement and
a matching selected follower work/target/order. Ground orders require a new marker
at the requested coarse cell, either still live or actually captured after the
pre-click observation cursor by the same scene/world epoch. The latter retains
its allocation serial and dispatch turn through normal four-turn expiry.
An unchanged prior assignment is
explicitly labelled existing-order after fresh UI input, rather than a new order; they do not incorrectly demand a
ground marker (the native context deliberately omits ground markers for objects).

Wait types are `temple-unlocked`, `building-complete`, `trained-kind`, `first-owned-sermon`, `listener`,
`conversion`, `shrine-used`, `effect-present`, `effect-finished`, `target-gone`,
`units-near`, `won`, `shaman-ready`. These accept explicit fields from
`observation.mjs`, never expression strings. For a meaningful disappearance
check, use a verified existing target from the preceding screenshot/order. A
`target-gone` wait is not conversion evidence. Suggested progress scopes are
`construction`, `training`, `worship`, `sermon`, `movement`, `combat`.

Example builder batch (preferred position is checked, not assumed legal):

```
[
  { "action": "resume" },
  { "action": "select", "kind": "brave", "count": "five" },
  { "action": "build", "kind": "hut", "point": { "x": 40, "z": 72 }, "alias": "home-hut" },
  { "action": "wait", "condition": { "type": "building-complete", "id": "home-hut" },
    "scope": "construction", "watchIds": ["home-hut"] }
]
```

Select a small explicit Brave batch and `order-entity` it into a completed camp
for training, retaining known original Brave builders. Enemy Preachers are
conversion-immune: remove them using actual Blast/Warrior actions. Re-evaluate
moving/hidden/dead targets rather than casting at stale coordinates. Keep the
protective Preacher separate from direct melee and stop replenishing huts before
expecting zero enemy population. Buildings with hidden occupants still matter.

`prove-victory` requires actual won status, completed outcome camera, the Mission
4 button, in-memory new completion and sequential awaited disk-profile readback.
The driver first required M3 absent from the fresh profile. `finish` additionally
requires all acquisition/interruption/conversion/Erosion milestones, zero retained
command failures, no browser/observer errors, and actual victory. It archives the
final diagnostic epoch and result. A late win after a helper error remains an
exploratory failure; use a separately hashed repaired input/replay for clean proof.

On a diagnostic budget/stall, outer cap or unhandled failure, the driver best-effort saves an incomplete
checkpoint through normal UI before the harness closes its own processes. Later
continuation must be labelled; it is not an uninterrupted fresh journey. The journal ends with explicit failed/incomplete status; the thrown stop retains
the authoritative harness failed receipt, never a successful result. All
failures and exact inputs remain in `journey.json`, `actions.jsonl`, screenshots
and consumed command copies. The normal harness owns process cleanup. Nothing in
this driver stops unknown sessions or alters the deployment/parity sources.

## Owned preparation checkpoint and labelled continuation

This entry requires the separately reviewed maintained-harness `--profile` option
using one task-owned profile and the same localhost origin/port. A fresh profile
starts normally; a reused profile requires explicit provenance. No IndexedDB
seed, storageState import or reconstructed World is supported. Run05's discarded
nonpersistent save cannot be resumed.

For a new persistent run, save after the Temple and before selecting a trainee:

```
[
  { "action": "prepare-temple" },
  { "action": "preparation-checkpoint" },
  { "action": "resume" },
  { "action": "start-preacher-training" }
]
```

The preparation action requires the exact Vault/home/Temple milestones and no
retained failure. It ordinarily pauses and saves, awaits the committed readback,
and obtains the maintained profile observer's full-checkpoint digest. It writes
`preparation-record.json` in the run output with the profile/source/origin,
checkpoint turn/time/digest, actor IDs, input hashes and observed milestones.
This file is provenance, not a save or state input to the application.

On tactical failure before a successful sermon save, the driver ordinarily pauses
and captures the terminal state while preserving the preparation in the game's
single latest slot. It observes and logs whether the actual committed digest
still matches. It does not overwrite that slot with the failed world. A successful
sermon Save explicitly replaces latest; that later state is not accepted by the
preparation-only continuation entry.

A later run may set `M3_PREPARATION_RECORD` to the original task-owned output's
absolute `preparation-record.json` and pass the same retained `--profile`. Include
that provenance file as an explicit command-receipt `--input`. The driver requires
exact source fingerprint, profile ID/path, origin and committed checkpoint digest
before clicking ordinary Load Game. It copies/hashes the input, logs prior-run
status, then checks actual resumed actors, completed Temple, knowledge and M3
profile absence. Load auto-resumes; the observer starts a new epoch at saved game
time, then the driver ordinarily pauses for a new command batch. Begin continued
tactics with Resume and start-preacher-training.

Inherited acquisition milestones are explicitly labelled and retain their original
source/checkpoint. Duration reports separate inherited prefix active time from
new epoch time and sum them for the unchanged10+30 active budgets. Each run has
its own90-minute wall/95-minute harness cap. A completed continuation is labelled
checkpoint-continuation and cannot be described as a fresh uninterrupted run;
previous failed attempt receipts remain failed. Three isolated host-only tests
cover mismatched source/profile/origin/digest, failed prefixes and resumed actor
identity. Runtime acceptance of this entry remains pending.

The Mission3 continuation entry deliberately keeps an exact full source fingerprint
requirement, even if the shared harness later supports reviewed QA-only profile
correspondence. Initial retries may change hashed tactical command files only.
A driver/source change requires a separately reviewed future boundary; this
entry does not silently adopt the harness's broader correspondence option.
Generic checkpoint commands are rejected while the preparation slot is protected,
so an exploratory command cannot erase the genuine early save before a failure.
