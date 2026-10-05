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
node --test qa/mission-three-controls/observation.test.mjs \
  qa/mission-three-controls/checkpoint-provenance.test.mjs \
  qa/mission-three-controls/command-probes.test.mjs \
  qa/mission-three-controls/sermon-protocol.test.mjs \
  qa/mission-three-controls/sermon-checkpoint.test.mjs \
  qa/mission-three-controls/driver-checkpoint-path.test.mjs
```

The isolated observer tests cover original callback receiver/arguments/return and
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
active budgets now allow900 pooled seconds through reloaded conversion to cover
the Camp/escort work moved before it. After conversion, allow at most1800 more
active seconds while capping the entire inherited-prefix/current-segment journey
at2400 active seconds. Health and batch boundaries enforce that whole-journey cap. Changing a budget requires a
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
training advances, then `finish-preacher-training` and `declare-sermon` before
any Preacher departure or staging order. The driver rejects a selected Preacher's
ordinary order until declaration. Use `resume` at the start of tactical batches.
Keep the Shaman at the observed covering
position or use `return-shaman-home` as a prospective tactical choice. Original untrained Braves must remain. Shaman home arrival is observed before construction. Before the protected
approach, the actual Shaman must be alive and its current position is recorded. Every meaningful order/plan is asserted immediately; it does not accept unrelated AI construction.

`declare-sermon` only arms the existing passive observer and records the current
candidate pool, epoch and actual Preacher before departure. It issues no movement.
The `approach-sermon` wrapper still declares if needed, chooses its bounded anchor
and moves normally. A separately directed holding approach may instead use
ordinary movement after declaration. Neither path requires Yellow-Shaman suppression.

`capture-sermon` validates the exact first listener, ordinarily pauses, validates
that identity again and uses the existing Save/readback path. It adds no movement.
The driver also captures a pending first onset before the next command/world click,
at paused batch boundaries, and before accepting a wait's completion condition.
A movement wait therefore stops for the listener even if arrival is still pending
or becomes true on the same observation. The remaining batch is deferred with an
explicit journal entry; an interrupted wait is not reported as completed. The
passive afterTurn observer remains read-only and never pauses or changes the clock.
See `staging-onset.md` for the retained Run13 failure and source-only repair boundary.

Once the exact first-onset locked listener has been saved,
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
  `return-shaman-home`, `declare-sermon`, `capture-sermon`, `approach-sermon`
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
- `stop-preserve-latest`: verify the actual committed digest and close incomplete
  through the harness without replacing it or using a process signal
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

On a diagnostic budget/stall, outer cap or unhandled failure, the driver preserves
a known committed latest checkpoint and records a readback before the harness
closes its own processes. If no committed checkpoint is known, the prior
best-effort ordinary incomplete Save remains available. Later
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
sermon Save explicitly replaces latest; that later state is accepted only by the
separate genuine saved-sermon entry described in `sermon-continuation.md`.

That entry uses `M3_SERMON_RECORD` and the actual committed Save's source-bound
`sermon-record.json`. It preserves first-onset identity and inherited failures,
starts a fresh Load epoch and never restores state from diagnostic JSON. The
ownership-aware cancellation check records a later combat-person bit reuse
separately from any actually observed cleared bit. The interrupted Run14 profile
still needs independently verified recovery before this entry can be used there.

A later run may set `M3_PREPARATION_RECORD` to the original task-owned output's
absolute `preparation-record.json` and pass the same retained `--profile`. Include
that provenance file as an explicit command-receipt `--input`. The driver requires
the source-admission rules below, exact profile ID/path, origin and committed
checkpoint digest before clicking ordinary Load Game. It copies/hashes the input, logs prior-run
status, then checks actual resumed actors, completed Temple, knowledge and M3
profile absence. Load auto-resumes; the observer starts a new epoch at saved game
time, then the driver ordinarily pauses for a new command batch. Begin continued
tactics with Resume and start-preacher-training.

Inherited acquisition milestones are explicitly labelled and retain their original
source/checkpoint. Duration reports separate inherited prefix active time from
new epoch time and sum them for the900 pre-conversion /2400 whole-journey bounds. Each run has
its own90-minute wall/95-minute harness cap. A completed continuation is labelled
checkpoint-continuation and cannot be described as a fresh uninterrupted run;
previous failed attempt receipts remain failed. Four isolated host-only tests
cover mismatched source/profile/origin/digest, failed prefixes and resumed actor
identity. Runs06–13 established the genuine preparation and repeated ordinary
Load identity; the new staging-onset protocol remains source-only until replay.

The game/runtime remains pinned to accepted `b381851`; later main application
changes cannot be adopted into this profile. By default the complete QA source
fingerprint must match the original preparation. One transition may instead use
only the correspondence already validated by the maintained harness, from that
exact original preparation fingerprint to the independently accepted new QA
source. Match its prior run/checker, current source/checker, reviewer/reference
and correspondence digest. The harness still requires unchanged application,
runtime, root and origin bindings; the driver still requires the original full
checkpoint digest and retained actors.

The original acquisition source/milestones remain unchanged. A separate
`qaAdmission` records the accepted QA source and correspondence. Each admitted
run writes a forwarded `preparation-record.json`; later same-source retries must
use the immediately preceding run's forwarded record, whose recorded run ID
matches the profile's verified previous run. One additional independently reviewed
edge may append `qaContinuation` from that exact admitted source/current terminal
run to the new QA source. It preserves the entire first `qaAdmission` unchanged,
including its correspondence and last forwarded run ID. The new edge must name
that source/checker and run, and use only the maintained harness's validated
correspondence. Later retries forward only the second admission's recorded run ID;
no third QA transition is supported. The original acquisition source, checkpoint,
milestones and inputs are never relabelled. This is provenance only, never a World
export or browser-storage write. Generic checkpoint commands remain rejected
while preparation is protected, so they cannot erase the genuine early save.

Run08 established real Camp construction, three90HP Warriors, retained builders
and clearing of the eastern defense pocket, with all three Warriors surviving.
It ended before any owned sermon and retained its helper failures at573 active
seconds. The larger pre-conversion allowance reallocates the original overall
resource envelope for that observed strategy; it does not change gameplay,
conversion, result, clock, speed or failure-retention requirements.

## Native move-context preflight

Run08 showed that a terrain hit with no visually picked object can still occupy
a native building footprint. Its intended Preacher move acknowledged ground0
and drew a ground marker, but correctly produced enemy-building attack19. That
movement assertion remains failed. The prospective repair now resolves each
visible candidate with the shipped liveCommandContext after terrain/footprint
synchronization on a detached World clone. It accepts only enabled model3, logs
rejected native contexts, and retains all existing renderer ownership, exact
point, fresh acknowledgement, recipient and marker requirements.

This probe never calls command, tick or path planning and never synchronizes the
live World. It applies only to movement, including home return, sermon approach
and cancellation. Spell/plan validators retain their existing separate semantics.
Two source-bound fixture tests exercise the actual native resolver, including
the visually unpicked enemy-hut-cell trap, blocked ground and original-World
noninterference. These isolated fixtures are not browser/gameplay proof.


## Building-attack recipient evidence

Run08's actual Hut1020 click had fresh target1020 acknowledgement and selected
Warriors carrying model19/a21221. The old generic ID comparison rejected that
packed cell. Snapshots now call the shipped read-only `liveBuildingAttackTarget`
lookup for each actual person-order owner. A model19 recipient is accepted only
for a building click with that exact resolved building identity, an uncancelled
order and the existing fresh dispatch/acknowledgement checks. Work/target remnants
or coincidentally equal packed values cannot satisfy this branch. Ground moves
still reject model19, including Run08's separately retained Preacher move failure.

Source-only fixtures exercise a non-center registered footprint cell, absent,
cancelled, dead, unfinished and friendly targets, stale dispatch/selection, and
lookup nonmutation. They establish the checker contract; the earlier failed
browser envelopes remain unchanged. The direct lookup adds the57th source guard.


## Responsive waits and transient Erosion

See `responsive-waits.md` for authenticated preserving-stop consumption inside
active/UI/readback polls, safe deferral during an already-issued Save, objective
progress and prospective per-turn shrine-linked Erosion onset/retirement. These
are source-only QA changes until separately reviewed ordinary gameplay runs.
