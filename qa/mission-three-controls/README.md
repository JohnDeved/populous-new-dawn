# Mission 3 ordinary-controls evidence driver

Prepared source only. A passing syntax/unit-test result is **not** a browser run.
The plan was accepted at `c01d788` and the actual driver source preflight at
`e4fc02a`. The run adopts accepted main `76df601` through PR185/196. Four guarded callers
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

The fifteen isolated tests cover original callback receiver/arguments/return and
exact invocation count; diagnostic exception isolation versus real application
exceptions; idempotent detach; separate reload/time epochs; strict singleton
conversion identity; rejecting death/poll gaps; and progress that ignores a
merely advancing simulation clock. Additional cases cover null/undefined/hostile
diagnostic exceptions, copied native admission occupancy/queue data, and the
explicit incomplete-stop classification, authored allocation identity, fresh
command/recipient/ground-target correlation, worker construction progress and
wall-clock diagnostic boundaries and terminal observed-defeat classification at
all batch/wait/catch boundaries. The tests use isolated plain JS data, not the
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
Each wait checks state each second and reports stage progress at 30-active-second
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

First batch:

```
[{ "action": "acquire" }]
```

This executes Vault → Shaman home → Temple built by five existing Braves → one
actual trainee → recorded authored Yellow Brave listening → ordinary persisted
sermon checkpoint. Original untrained Braves must remain. Shaman home arrival is observed before construction and checked again before
Preacher intrusion. Every meaningful order/plan is asserted immediately; it does not accept unrelated AI construction.

Second batch:

```
[
  { "action": "cancel-sermon" },
  { "action": "reload-sermon" },
  { "action": "complete-conversion" }
]
```

Load auto-resumes. The new observer must attach while the original saved sermon
is still observable. A missed conversion before attachment is not a pass. The
conversion milestone requires the same named victim and Preacher, adjacent-turn
state23 ownership, singleton same-kind flagged replacement, and an actual new
Blue Brave. The screenshot uses ordinary minimap positioning.

Third batch:

```
[{ "action": "erosion" }]
```

It must observe one use, a real Erosion effect and its completion after the
protected conversion witness.

## Tactical continuation

Combat remains an observed tactical session, not a huge fixed-turn loop. Read the
retained screenshots/snapshots and journal, then choose ordinary commands:

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
Camera preparation must precede mode selection. A selected plan/spell must not
be followed by a minimap helper that clears its mode. Entity clicks require a fresh dispatch timestamp/pointer acknowledgement and
a matching selected follower work/target/order. An unchanged prior assignment is
explicitly labelled existing-order after fresh UI input, rather than a new order; they do not incorrectly demand a
ground marker (the native context deliberately omits ground markers for objects).

Wait types are `temple-unlocked`, `building-complete`, `trained-kind`, `listener`,
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
