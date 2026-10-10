# One phase3 raw completion capture and offline membership projection

Exact source preparation; no replay authorized by this document. The existing
phase3 run atbe6e8df2 remains FAILED at6479, before its first controller delegation,
with zero accepted visits or completion cohort. Its complete12-byte detached-wire
mismatch is two integer/double encodings of equal coordinates103/111; all other
bytes match. This is consistent with [Node24.19's documented noncanonical output](https://github.com/nodejs/node/blob/v24.19.0/doc/api/v8.md#serialization-api),
not a retrospective pass. All prior failures, captures and receipts stay local.

## Question and decisive boundary

Capture the first naturally completed Chumara phase3 task, then determine its entire
registered class1/tribe2 state14 population offline. Include unlisted, dead,
unmatched and stale-alias people, with model/state/raw assignment and authoritative
ordinary identity. No hp, task.members, model, flag or old-assignment eligibility
filter is allowed. Registry Map order is not recovered native chain order.

The [accepted native ownership contract](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md)
places full state14 admission after positive final selection. Current port assigns
no such ownership. Callback return and controller return precede the runtime's
actual select-action/state14 batch. Preserve their separate scalar task/callback/
action metadata. The only persisted full-world capture occurs immediately after
the complete real final dispatcher batch, before later gameplay. It is accepted
only when entry phase3 has naturally reached active phase4 with selected>0.
The enclosing tick returns normally; later terminal state is not the cohort input.

## Source and minimal delta

Production remains main4754e12d3590bde18656416514871b033de164be in owned worktree
`/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-20261010`, branch
`research/issue248-phase3-admission-20261010`. Only the exact QA directory changes.
PR30932ad31ce remains separate expected-red; no held PR292 source is imported.
The old phase16 and failed phase3 sources/results remain immutable at published
commits485ed5c3,52766b75 andbe6e8df2. No previous test result is transferred.

Reuse the source pin, exact-once allocator/controller and declaration-only runtime
wrapper, original function bodies, first authored createWorld(6), default seed,
both opponents and tick(1/12). No injections, checkpoints, state/AI edits, extra
callbacks, native/browser execution or scenario search.

During the live run, snapshot copies only task/queue/RNG metadata. The existing
complete live-world V8 byte guard and original-error/finally rejection behavior
remain unchanged. A mismatch still fails with the bounded before/after pair.
At the positive dispatcher boundary, save the already-created guarded before
buffer once with wx and its path/size/hash. No detached clone or registry/helper
projection occurs during gameplay. There is no canonicalization, exception for
particular fields or new semantic comparator. The live gate remains conservative
and may itself reject differing encodings of equal values.

After terminal exit0 and passed source/input guards, run project-phase3.mjs
separately on immutable, hash-verified files. It checks the receipt's hashes for
JSONL/summary/capture, the source-pinned helper hash, one positive completion,
turn/task correspondence, and input hashes again before writing its result.
It imports only Node built-ins and projects ordinary registry/person/Unit data.
Unsupported membership structures, non-data fields or non-integer membership
values fail explicitly instead of being silently coerced. Known raw7f presence
stays separate from absence. Ordinary alias identity is evaluated inside the one
decoded graph; original typed backing and cross-capture pointer identity are not
claimed. See purity-inventory.md for the finite read surface and seven contracts.

No task31, native route/counter or native-chain projection is invented. Full
specialist maintenance, universal activation, production repair, native parity and
Mission1–3 impact remain outside this observation. A bounded ordinary cohort would
not by itself authorize an admission patch.

## Fixed budgets and commands

One fresh world, at most22,064 turns and180,000ms internal including imports;
CPU4; external190s timeout plus5s SIGKILL grace. Stop after the first actual positive
phase3 completion tick, empty retirement, unexpected phase exit, exception or
bound. No automatic retry. Capture misses/terminal states honestly.

Each serialized world is at most16MiB. Accepted capture, JSONL and offline cohort
share32MiB; the first rejected before/after pair has a separate32MiB allowance.
Summary/stdout/stderr/receipts remain at most1MiB each (receipt allowance shared
across mission/offline collection), total68MiB. Raw captures remain local.
Use fresh phase3-capture-run.*, phase3-capture-command-receipt.json, TMP/cache,
stdout/stderr and source-bound receipts; any existing run output causes refusal.
The offline projection does not start until terminal mission receipt exists.

Before any mission replay: independent exact-source prelaunch ACCEPT, passing
controlled qualification, normal Git push/readback, coordinator's fresh one-run
CPU4 grant and immediate source/input/dependency/fresh-output guards. The existing
stationary dependency symlink is read-only; canonical device27/inode538212 must
match. No installs/moves/copies, dependency writes, broad standards or extra runs.

Controlled qualification (each command bounded to20s on CPU4, fresh receipts):

```
node --check qa/issue248-scheduled-trace-20261010/observe.mjs
node --check qa/issue248-scheduled-trace-20261010/project-phase3.mjs
node --check qa/issue248-scheduled-trace-20261010/purity.test.mjs
node qa/issue248-scheduled-trace-20261010/observe.mjs --verify-source-only
node --test qa/issue248-scheduled-trace-20261010/purity.test.mjs
```

Prospective mission command (not executed):

```
taskset -c 4 timeout --signal=TERM --kill-after=5s 190s node --experimental-test-module-mocks qa/issue248-scheduled-trace-20261010/observe.mjs
```

Prospective offline command, only after successful terminal capture (not executed):

```
taskset -c 4 timeout --signal=TERM --kill-after=2s 20s node qa/issue248-scheduled-trace-20261010/project-phase3.mjs
```
