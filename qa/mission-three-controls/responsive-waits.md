# Responsive preserving stops and prospective Erosion evidence

This is a QA-only repair for the failed Erosion observation in recovered successor
1c430e41 on sourcebbd7371. That run accepted an ordinary shrine101 order at5362
and first sampled its used state at6003. It never sampled a live Erosion effect,
then reached the existing progress-stall guard and closed normally. The genuine
4813 checkpoint was preserved, cumulative active time reached980.0833333333333,
and all prior failures remain. No effect onset/retirement, terrain result or flyby
cause is attributed retrospectively. Its independently accepted sermon
cancel/reload/same-victim conversion evidence is unaffected.

## Stop consumption

Write a sole `stop-preserve-latest` command atomically to the next unconsumed
numbered command file. An optional `runId` must equal the current harness run.
While a batch is active, the checker inspects only the immediately following
ordinal. It neither consumes nor dispatches ordinary future commands and does
not skip gaps. The current-run destination, ordinal, exact bytes and SHA256 are
recorded before preservation. The reader rejects symlinks, hardlinks, files not
owned by the executor, oversized inputs and observed replacement/drift.

Mixed, wrong-run or changed preserving requests are terminal failures with
preservation intent already set. The normal command-error handler cannot swallow
them and continue. An accepted request clicks a visible ordinary Pause control with a5-second bound, then reads the actual committed
checkpoint and uses the normal harness close. If that control is absent during startup, the receipt says so instead of inventing a paused state; normal close still stops the context. It never invokes fallback Save
or changes clocks, processes, source, World or browser storage directly.

Control is checked before the first active-condition read and each subsequent
sample, before health/budget/objective handling. Explicit bounded UI polls also
check it: introduction input release60s, camera settlement30s, fresh dispatch5s,
victory camera60s and Mission4 button60s. Game canvas/diagnostic binding and mission-dialog polls keep45-second bounds. Every full diagnostic read checks control too, except during already-active terminal handling. The command-file wait and actual profile
readback poll do the same. Individual browser reads/actions retain their existing
timeouts; responsiveness is between completed asynchronous samples, not an
unbounded concurrent cancellation mechanism.

If an ordinary Save was already issued, a newly noticed stop is recorded and
deferred while its bounded committed readback completes. The full observer digest
must update protectedLatest before the stop is serviced. A readback failure is a
failed preservation path; it cannot assert that the superseded old save remains.
No ordinary action follows a deferred stop.

## Erosion producer and passive observation

The authored Mission3 trigger101 at(-7,115) links one-based104 to object103,
class7/model23 at(-15,111): level-three.ts and world-initialization.ts:244–364.
world-turn.ts:555–843 processes/removes existing effects before shrine firing at
885–926. The firing block increments the use and allocates the linked Erosion
with age0 and remaining64. On the next63 turns the controller processes counters
63→1. The64th later turn decrements to0, sets duration=age and removes it before
afterTurn. The source lives in erosion.ts:103–121 and world-turn.ts:655–664.

Native initializer export00509c10.c sets model23's state24 and short+0x6c to64;
0050a750.c dispatches state24 to processor0x50ff30. Retained
scripts/check-native-erosion.py supplies processor state/terrain/RNG and intercepts
sound, terrain notifications and deletion for16 complete lifetimes. It does not
prove whole-native Mission3 worship/allocation/scheduling, and this repair does
not run a new native probe. The actual M3 simulation test uses normal model
commands and ticks to establish the observer's producer boundary; it is explicitly
not ordinary rendered/UI gameplay evidence.

Before the next ordinary shrine order, arm the existing passive afterTurn
observer with the unused actual shrine, its actual linked target(s), and prior
Erosion IDs. On the observed uses0→1 turn, require one newly appearing effect at
each unique authored target, actual age0/remaining64 and matching native center.
The controller carries no source-shrine field, so the exact use/target/creation
association is required. Late arming, existing matching effects, ambiguous IDs,
missing turns, changed targets/countdowns or early disappearance reject proof.

The observer retains a private read-only reference to each actual controller,
but all exported historical samples are cloned finite scalars. It records64
adjacent present samples, the last remaining1, and the actual remaining0/removal
at onset+64. Live duration Infinity is intentionally omitted. Retirement duration
is recorded only when finite and equal to actual age. JSON round-trip tests cover
both synthetic boundaries and the actual simulation producer.

Small radius6 native height/walk-mask snapshots (the four actual packed quarter-cell bits per coarse height cell) are copied at onset, first active
visit, last active visit and retirement, with available finite version values and
other known terrain controllers. Changed cells are correlated observations;
other terrain producers are not excluded. No terrain is constructed or adjusted.
The observer must never call nativePosition: it can call syncNativeTerrain and
mutate World. Native center is read from the actual controller and checked with
pure coordinate arithmetic. Rendering and hardware performance remain separate.

The host waits on retained prospective onset/retirement, even if the64-turn
lifetime ends between host polls or during an input-mask wait. A milestone
screenshot can follow the actual event; raw per-turn evidence retains the real
onset/retirement turns. Erosion progress uses only this shrine/use/linked controller
state. Unrelated combat, wandering units or the simulation clock cannot postpone
its stall. Other named waits derive progress from their objective IDs; victory
progress excludes unrelated Wildman movement. Budgets remain unchanged.

No new profile admission, continuation, replay or parity credit is granted by
this source change. Any future resumed gameplay must retain the real latest
terminal run, cumulative980.0833333333333 and the failed Erosion wait.
