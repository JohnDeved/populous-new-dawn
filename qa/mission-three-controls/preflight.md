# Mission 3 ordinary-controls, real-clock preflight

## Status and exact scope

Source-only plan prepared against `ab6e857553fd2a534bbe34b4ba600df8a40872ff`.
No browser, game simulation, native executable, build, dependency installation,
application edit, or parity recording was performed for this preflight. The
source manifest beside this file fingerprints the code and retained evidence used.
A future driver must be reviewed before it occupies the serialized browser slot.
The later ordinary Run03 tactical outcome and the prospective target-selection
amendment are documented in `protected-sermon-strategy.md`; that amendment governs
the next protected approach while retaining exact identity through the sermon.

The missing witness is a fresh public Mission 3 journey whose game-affecting
inputs are actual mouse/keyboard controls and whose simulation remains owned by
ordinary requestAnimationFrame elapsed time at speed 1. It should establish
Vault acquisition, construction, training, an actual Blue conversion, the Erosion
head, sustained ordinary combat, victory/profile completion, and the Mission 4
offer. This independent direct-entry run does not establish Mission 2 → 3
continuation. The retained #181 fixed-turn campaign and #188 resumed-sermon
witnesses remain separate evidence; neither is upgraded by this plan.

The worker owns only this isolated checker/evidence directory and later private
run output/cache. The application and M2 resources have other owners. Browser
execution waits for the coordinator's explicit resource release; no reuse of
another worker's server, browser, cache or profile.

## Source findings that determine strategy

1. Fresh imported Mission 3 has one Blue Shaman at `(35,81)`, a Blue Hut at
   `(28,98)`, one Yellow Shaman plus six Yellow Braves, and 44 Wildmen.
   Twelve of the Wildmen are near the Blue start. The ordinary level-start
   controller converts starting Wildmen by allocating replacement Braves; the
   run must wait for this lifecycle instead of treating the createWorld snapshot
   as the playable initial population. Skip introduction releases the camera
   before the Shaman's independent native flags4/128 selection gate necessarily
   clears. Use the read-only `campaignShamanReadiness` predicate.
2. The Vault at `(-37,-133)` rewards Temple knowledge. The head at `(-7,115)`
   is a one-use Erosion-effect trigger targeting `(-15,111)`, not an Erosion spell
   gift. The header provides rechargeable Blast and Swarm; there is no Swarm
   head. Do not assert or manufacture a gift stock.
3. Retained natural acquisition returned the Shaman to `(35,81)` after the Vault,
   built a Temple near `(24,70)`, trained one existing Brave, then moved that
   Preacher to `(-39,-110)`, near the authored Yellow Brave initially at
   `(-43,-107)`. The reference identified that victim from its imported position
   before it moved. Identify it during fresh entry, preserve its ID in evidence,
   and never retrospectively substitute another actor while claiming that witness.
   Current prospective fallback selection is separately recorded before the sermon.
4. The prior successful #188 acquisition milestones were turns 1327 (Vault),
   1820 (Temple complete), 2036 (Preacher), and 2526 (listener). Those are
   historical observations from a different exact source and a fixed-turn
   acquisition; they are neither success assertions nor reliable wall-time
   forecasts here. The same source records a direct intrusion into the dense
   enemy settlement ending in ordinary combat death.
5. The isolated reference returned the Shaman home before a Preacher intrusion.
   Current ordinary-defense tests show that leaving her at the Vault legitimately
   changes the enemy scanner's target priority. The later protected strategy may
   instead record a prospective covering position after its initial home milestone;
   it makes no unchanged-defender-priority claim. Current main includes real type9 detection, type8
   defense, and the complete marker-Preacher block. Older research paragraphs
   calling those branches absent describe historical boundaries, not this HEAD.
6. Chumara autonomously builds Tower → Temple → first Preacher → huts. Its
   ordinary regression observes the first Preacher by 6000 turns. Type8 may
   recruit that Preacher against a Blue intrusion; the type11 producer may also
   send it to marker 3 after population exceeds eight. Delaying indefinitely is
   tactically consequential, even if the player's own economy remains safe.
7. Preachers are immune to being converted: the imported model-4 descriptor
   lacks the victim eligibility bit. Do not repeat the old route's optional
   "counter-preaching" wait as a required way to remove an enemy Preacher.
   Use actual Blast casts and/or Warriors. A disappearing or dead enemy is not
   proof of conversion.
8. A Temple can hold five trainees. Training creates replacement IDs, charges
   mana, and may take longer when multiple people enter or existing specialists
   change the price band. Start with one Brave and retain known untrained Brave
   IDs for subsequent building work. Later training should use small explicit
   HUD batches; avoid selecting every Brave into the Temple or training hut.
9. Campaign victory is owned by `processOutcome` on its 16-turn cadence after
   turn 16. It checks remaining people, including people inside buildings;
   buildings are not themselves the final win count. Destroying huts stops
   replenishment and exposes occupants, but screenshots of an empty exterior,
   zero visible enemies, or a dead Shaman alone do not establish victory.

## Input contract and known traps

All movement, targeting, selection, camera motion, pause/resume, save/load,
restart, and continuation use normal DOM/mouse/keyboard actions. Forbidden:
`tick`, `advanceGame`, `command`, `cast`, `placeBuilding`, `setSelection`, direct
world mutation, camera/focus injection, clock edits, RAF cancellation, synthetic
animation calls, state/model injection, and IndexedDB writes outside Save.

Permitted evaluation observes state, projects current rendered geometry, reads
current picking results, and reads checkpoints in a read-only transaction.
Potentially synchronizing placement/range validators must run against a detached
structuredClone, never the live World. The driver records all actual input
coordinates, pressed modifiers, selected IDs, intended target and acceptance.

Important controls:

- `Select and focus shaman`, `Select brave`, `Select preacher`, `Select warrior`.
  Follower buttons are additive: click adds one, Ctrl-click adds five,
  Shift-click adds all, right-click focuses the next follower. Clear targeting
  and prior selection with Escape before an explicit new group and verify IDs.
- Minimap click or normal camera keys/right drag position the camera. Do this
  before choosing building/spell mode. Shipped camera focus cancels targeting:
  selecting Hut and then clicking the minimap can turn the next ground click
  into a movement command. After mode selection, use a no-focus ground click
  and immediately assert the requested plan/cast appeared. Do not infer success
  from a click returning without error.
- Open the buildings tab before choosing `Temple, 8 wood`, `Hut, 3 wood`, or
  `Warrior Training Hut, 8 wood`. Find an actually legal visible plan near the
  preferred point, then assert a new Blue building of the correct kind and
  selected-worker orders. An unrelated enemy AI building must not satisfy it.
- Spells use the visible labelled stock button. Resolve range/terrain first,
  choose mode second, then click. Assert accepted cast/effect/cooldown or stock
  change and retain the requested point. Moving to a spell target through the
  minimap after choosing the spell is not valid preparation.
- Use explicit Pause game/Resume game buttons, not ambiguous Space while a
  plan is active or a button has keyboard focus. World orders require unpaused
  play. Pausing for diagnosis is an ordinary player action and is recorded;
  elapsed pauses are excluded from the active-game duration.
- Camera rotations must use a canvas-owned corridor. Re-query the rendered
  target after camera motion; do not reuse stale projected coordinates.
- Skip authored flybys only through the visible Skip introduction button or
  normal Escape. Wait for actual inputMask release and applicable actor
  selectability; an asynchronous wait predicate must never pass as truthy merely
  because it returned a Promise.

## Event-based journey

### A. Fresh entry and resources

Use a fresh owned browser profile and record initial completedMissions, requiring
Mission 3 to be absent before starting. Use All missions → Mission 3 through the
startup UI. This is an explicit independent-entry setup, not campaign progression
proof. Capture the authored Yellow Brave's ID at the first obtainable world epoch,
before startup-readiness waiting. Imported object index52 begins at `(-43,-107)`;
trace that object through ordinary createWorld allocation and retain the actual
ID, without assuming it stays at that position until readiness. A missing early
identity is an evidence gap, never a reason to inject or substitute an actor.

Then wait for startup readiness and capture the screen, HUD stocks, population,
world/input state, renderer/browser identity, and wall/game clocks. Assert normal
speed and a live RAF owner. Read-only diagnostic bindings must not expose a
shipping test API or modify the application.

### B. Vault and Temple

Select the Shaman using her HUD control, position via minimap, and click the
actual Vault mesh. Assert accepted worship/Vault order, then wait for Temple
knowledge and inspect the changed HUD. Return the Shaman home through a ground
click. Select a small construction group of existing Braves, position the camera
near `(24,70)`, open buildings, choose Temple and place it without refocusing.
Wait for that exact building's progress to reach 1; record wood/workers/progress
if it stalls. Do not move every builder away while waiting.

Clear selection, select one available Brave, and click the completed Temple.
Record the trainee ID, training order, real occupancy/queue and storedMana/cost.
Wait for a new Blue Preacher ID from that building; assert an original untrained
Brave still exists and its HUD control remains enabled. Do not require training
to preserve the trainee's ID.

### C. Ordinary conversion and interruption

Select the new Preacher by normal controls. Prospectively select the current
victim and approach clear ground in its actual native preaching-cell square,
then observe the first new state23 and exact workTarget ownership under the
prospectively declared candidate rule.
Before intrusion, record the actual Blue Preacher and all current living Yellow
Brave IDs as a bounded candidate pool, including presently housed/work-assigned
people. An eligible idle Brave guides movement only, excluding candidates within8 wrapped
world units of observed living non-Brave Yellow specialists. Log positions,
distances and excluded/remaining IDs; no remaining candidate stops the attempt.
This prospective tactic does not certify a safe route or native immunity. The passive observer locks
the first new actual owned state23 onset, breaking same-turn ties by ID; the
listener must still exist before Pause/Save. No retrospective arming, re-arming,
post-conversion selection or later replacement of that locked identity is allowed.
Do not Swarm this witness before its sermon, since its flight changes the route.

Use ordinary Pause promptly on the first listener observation, then capture the
visible sermon and save through Game settings → Save checkpoint.
Await each IndexedDB read sequentially with `waitForCheckpointReadback`, requiring
exact saved victim/preacher IDs and state23 ownership. Close the menu through
Continue Game. A normal Preacher move should cancel the listener link and leave
that same Yellow Brave alive; assert cleared ownership/listener flags.

Reload the page and use Load Game. The shipped beginLoad path explicitly sets
paused=false: loading auto-resumes, even if the saved checkpoint was paused.
Rebind on the new scene and inspect actual saved sermon ownership, normal speed
and retained object identities from its first obtainable observation epoch.
If stable inspection is needed, click Pause game and later Resume game as
separately logged UI actions; do not assume Load itself leaves the game paused.
Do not halt RAF or alter clocks to recover an observation missed during loading.
A listener that converted before the new observer attached has not produced the
required resumed conversion witness.

Observe the conversion: preceding state23 with this exact Blue Preacher, old ID
removed, newly allocated Blue same-kind replacement with native flags3/0x1000000
and flags4/0x40000. Require singleton victim/replacement pairing for the locked
Brave. Both callback and source must be source-bound.

The existing conversion observer needs adjacent turns; slow polling alone cannot
prove this under catch-up frames. A reviewed diagnostic after-turn observer may
chain the existing callback unchanged and collect copied snapshots into a
separate diagnostic object. Call the original callback exactly once, preserving
its normal semantics, then execute only synchronous diagnostic work. Catch every
diagnostic exception out of band, record it in the separate diagnostic state and
invalidate the affected proof; never throw it into afterTurn or allow it to stop
the next RAF. Do not swallow or relabel an original application exception. No
async work belongs inside the callback. It must never change World, clock
counters, RNG, orders or scheduling.

Save/load requires rebinding to the new scene and a fresh observation epoch;
never pair a pre-reload victim snapshot with a post-load replacement. Sum forward
simulation-time intervals separately for each scene/load epoch, recording wall
and paused duration alongside them. End-minus-start across a checkpoint rewind
undercounts actual play. If review rejects this instrumentation, report that
conversion identity is unproved rather than treating an arbitrary
poll/disappearance as equivalent evidence.

### D. Erosion, economy and sustained combat

After the conversion witness, use a healthy Blue Preacher at the Erosion head.
Assert the accepted ordinary order, uses increment, the real Erosion effect and
its completion. Separate uses/effect completion from the later victory outcome.
Build huts near `(40,72)` and `(20,100)` if needed for stable population, keeping
builders untrained. Build a Warrior Training Hut near `(45,90)` and train small
batches while retaining Brave workers. These are preferred locations from the
old route, not guaranteed legal positions on a future state.

Use the Shaman/Blast and Warriors to remove enemy Preachers. A recovering Shaman
must become genuinely selectable after reincarnation before another command.
Use Swarm against an actually eligible in-range Yellow follower after the
conversion witness, if needed; assert its real effect and flight rather than
calling the cast function to search for targets. Preserve failed casts.

Prefer attacking replenishing Yellow huts and exposed opponents from the southern
foothold near `(-19,117)` while keeping support Preachers away from direct melee.
At every action, re-read live IDs, casualties, enemy occupants, building state,
and accepted order. A target that becomes hidden/dead/moves during camera travel
requires a new visible target, not coordinate injection. Do not wait the old
fixed 600/2400 turns after every target. End a wait when the target dies,
conversion is proved, the building falls, the group loses its order/route or
strength, an enemy Preacher threatens it, or victory/defeat occurs. Retask through
ordinary controls based on that observation. Restore losses through actual
training/building only when the economy still supports it.

### E. Actual result and durable completion

Require world.status=won, ordinary outcome-camera completion, the victory UI,
Mission 3 newly added to the initially M3-absent profile, and visible Continue to
Mission 4. The store launches its profile write without awaiting it, so the
victory UI and in-memory completedMissions alone do not establish durability.
After the normal result path, explicitly await repeated sequential read-only
IndexedDB profile reads until the correct persisted profile contains Mission 3.
Apply the same awaited-read principle as checkpoint verification; never use an
async Playwright predicate as a persistence assertion. Optionally verify
fresh-page selector completion without overwriting the earlier checkpoint. Do
not require starting Mission 4 to prove its offer. Retain screenshots plus source-bound raw
receipt, action journal, timings, conversions and any prior failed commands.
A run with unresolved failed assertions is an exploratory result, not a clean
passing acceptance. A later clean replay can only claim what it actually repeats.

## Practical bounds and stopping conditions

At 12 simulation turns per second, the old sermon milestone at turn2526 is about
210.5 seconds of game time. The historical Vault/training approaches are therefore
minute-scale, but the real input route, headless rendering, UI interruptions and
live defense can change timing. After Run08 demonstrated the ordinary Camp/escort strategy, allow up to900
pooled active seconds through saved/reloaded conversion. Thereafter allow at
most1800 further active seconds, with the entire journey capped at2400. This
reallocates time for combat/training moved earlier; it does not change gameplay
or conversion/result assertions. These are diagnostic budgets, not measured
ETAs, gameplay deadlines or fixed sleeps. Record active game time per scene/load
epoch, actual turns, paused intervals and wall time. Check accepted actions
immediately; compare meaningful progress in 30–60-second observation windows.

The inspected immutable #181 packet records Mission 3 victory at turn17568,
time1464 seconds (24.4 active minutes), and profile `[2,3]`, then its result at
turn17930. It records five Temple trainees with seven original Braves retained,
18 trained people by victory, and no Blue conversion events. This is a more useful
strategy anchor than the loop ceiling, but its acquisition/combat used suspended
RAF and direct ticks, so it is not a current browser ETA. Its route source is
`401bcf4ff4a102595fd0ee9623ff6f43c3659ac5`; see the retained-evidence JSON.

A single historical 2400-turn combat wait represents 200 seconds. The former
10-wave × 80-target loop has a many-hour theoretical maximum and is not a useful
real-clock victory bound. Predeclare an initial 90-minute wall resource envelope
for the owned exploratory run. Diagnose roughly two active minutes without
relevant changes in movement, route, delivered wood, construction progress,
stored training mana, HP, population or sermon timer. Advancing stochastic sermon
timers remain progress even if conversion has not yet occurred. Record whether
the simulation itself advanced; a browser/server stall differs from a valid
failed route or combat stalemate.

Extend a diagnostic budget or the resource envelope only with recorded advancing
evidence and coordinator resource ownership, retaining the same owned session
where practical. At the outer cap, preserve a player-made checkpoint through
ordinary UI when possible and report the incomplete result; any later checkpoint
continuation is labelled. These are operating bounds, not observed performance
results. Do not shorten native timers or change the clock to meet them.

The purpose ends at observed victory with durable completion, observed defeat,
a reproducible gameplay/control blocker requiring application work outside this
worker's ownership, loss of the owned environment, or the declared safety limit.
On a material blocker: preserve evidence, pause/save through UI if possible,
report the exact current state and next owner action. An incomplete window may
be continued from a verified player-made checkpoint, but must be described as
such rather than as an uninterrupted fresh journey. Do not silently call a
pending, slow, or unchanged outcome a pass.

## Review and later acceptance

This plan is source inspection only. No gameplay/performance claim follows from
its presence or from syntax checks on a future driver. A reviewed driver should
retain a hash of its exact input bytes, commit/tree/diff fingerprints before and
after, renderer/browser/viewport, full ordinary action log, milestone screenshots,
active elapsed and simulation time, and all failures. Final checker changes need
appropriate orchestration planning and affected validation; full application
check/build can reuse only coordinator-approved identical-input receipts.
Software/headless evidence does not establish hardware FPS, original-game pixel
matching, complete native live-game timing, or all Mission 1–3 parity.

## Preparation continuation boundary

The reviewed persistent-profile path may retain an actual ordinary preparation
save after the completed Temple and before training. Its host provenance retains
the original input hashes, exact source/profile/origin and full saved-record
digest. Later entry must verify this unchanged committed record before ordinary
Load, validate retained actor/Temple identities and M3 profile absence, and start
a new observation epoch. Inherited acquisition milestones and their active-time
prefix stay explicitly separate from new observations. The continuation provides
no fresh-start claim and does not rehabilitate prior failed attempts.

Because the shipped store has one latest slot, pre-sermon tactical termination
preserves the genuine preparation rather than overwriting it with a dead actor.
An explicit later sermon save may replace it. Mismatched storage/source/profile
is a rejection, never permission to rebuild a World or seed IndexedDB. Run05's
discarded ephemeral checkpoint is unavailable and cannot enter this path.

For the requested QA-only revision, the app/runtime stays on accepted `b381851`.
The driver may consume one explicit correspondence already validated by the
maintained profile harness, from the preparation's exact original source to the
new QA source. Original acquisition identity is retained; a separate admission
record permits only immediately successive same-source retries. No second
source migration, arbitrary bypass, app/runtime/origin drift or storage/world
reconstruction is allowed. See README for the exact forwarded-record contract.
