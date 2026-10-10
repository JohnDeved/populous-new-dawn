# Issue 248: one scheduled Mission 6 port trace, proposal v3

## Outcome and exact scope

Observe the first authored Chumara mixed dispatch and the following scheduled
phase16 inputs/effects on unchanged port production code. This is a discriminator
and missing-input audit, not a repair, native execution, or parity acceptance.
One world starts through `createWorld(6)` with its default seed and both authored
opponents active; repeatedly call `tick(world, 1/12)`. No state injection, altered
AI settings, added/removed entities, checkpoints, seed sweeps, or helper-only visits.
Unlike the existing `tests/mission6.test.mjs` scenario, Matak stays enabled.

Base/head is current main `4754e12d3590bde18656416514871b033de164be`, isolated
worktree `/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-20261010`.
All twelve named sources in `source-only.json` are byte-identical to accepted
static source `721c3b08950fee0e19e4117bc7c516fe73d773c8`; `git diff --exit-code`
confirmed correspondence. `source-only-721.json` preserves the earlier check.
Only this QA source directory may differ from that base. Production is unchanged.
This observer is preserved on its dedicated research branch, not proposed for main.

## Fixed bounds and stop conditions

- Exactly one fresh world, at most 22,064 turns (1,838 2/3 simulation seconds).
  The turn cap is the existing Mission6 regression's 3,000 + 6,000 + 10,000 + 64
  + 3,000 upper stage limits, used as a single natural-run bound.
- Cooperative wall limit 180,000 ms, checked before every tick, including import time.
  External `timeout` at 190 seconds, SIGTERM then SIGKILL after five more seconds.
- Stop after four phase16 visits following the first Chumara dispatch, on its first
  phase16 exit, on a nonmixed first dispatch, at either bound, or on any exception.
- No automatic retries or second scenario. A miss is retained with its exact last
  state and reason. A controlled actual-caller case requires a separate reviewed
  proposal and coordinator admission; it is not authorized by this proposal.

## Observer and verification

`observe.mjs` SHA256 `a974b738efed2202b8e54130bc6ed8d65d2ee231d07e7e80fa1901c0c4c133d9`.
The executable must be this committed QA file, and it verifies its own bytes and
this proposal against HEAD before importing any production code. HEAD must descend
from the stated base with all changed paths confined to this exact QA directory;
the entire worktree must be clean. The final cheap source-check receipt is retained
outside the tracked packet, since it binds the final QA commit itself.
The observer follows the existing repository `node:test` `mock.module` pattern:
every wrapper delegates once to the unmodified actual allocator/controller/runtime
and returns its exact result. It logs actual delegated inputs/results for
activeMembers, entity, targetsRemain, and RNG without extra calls to those inputs.
The wrapper's world is the same object used by the normal tick/scheduler.

One `registerHooks` load hook exposes existing private `computerResponseWorld` and
`computerAttackTargetsRemain` for read-only observation. It also renames only the
`stepComputerTasks` declaration, then exports a same-name wrapper that invokes the
original body once, invokes a read-only after-dispatch callback, and returns the
original result. The callback uses a task-specific Symbol, asserts that it was
previously absent, and is removed after the run. It checks the entire original
source text and records original and evaluated hashes. Every original function
body stays unchanged. This avoids a late module mock that cyclic model imports
would bypass; that unrun v1 proposal/observer is preserved separately.
Every snapshot hashes V8 serialization of the entire world before and after
observation and fails on any change. The observer does not use wall time or logs
as simulation inputs.

Capture allocation arguments and scheduled turn; task/queue state; registered
identity versus retained native/fight/flight/entry/builder owners; current immediate
and queued order records, command17/19 payloads and cancellation/state gates;
all current yellow people, retained assignment+0xaf and optional flag+0x7f;
assigned-state23 prelude candidates; ordered actual registered cell chains and
separately the existing defense-adapter rows; both cap10/radius7 collector results;
old all19/payload and distance-world predicates; actual returned actions;
controller, after-dispatch, and after-turn retry/target/order/RNG state.

The runtime does not retain native task+0x26, task+0x08 visit counter, task+0x23
building selector model, task+0x2c condition, or native tribe-person list ordering.
Those are null/unbound in the packet. Optional nativeFlags7f absence is also null,
never inferred zero. Native assignment projection can disagree with task.members.
The existing defense adapter is labeled a candidate projection, and direct
registered lists are separate; neither is asserted to compose the native world.
No coordinate-selector effect is invented: record whether production changed
target and why its actual branches ran, while retaining native-selector cadence
and input fields as unresolved.

The old all19/payload comparison is explicitly derived from the same existing,
positive-hp unit subset and old owner/payload semantics. The `calls` array separately
records the actual consumed `targetsRemain` callback result and arguments, without
calling it when production short-circuits. `mixedDispatch` is true only when the
after-dispatch orders actually contain both17 and19. Every terminal result retains
the exact final Chumara AI (queue and all tasks), turn/RNG, active tribes, and living
counts, including bound/exception misses.

Pre-execution v1 used a late runtime mock that cyclic imports could bypass; v2
fixed the binding but its derived predicate failed to exclude dead/missing members,
its summary used dispatch existence as mixed qualification, and a bounded miss did
not retain the exact final queue. All were caught before any run. Unrun v1/v2
artifacts remain in the local review packet; v3 addresses the three review findings.

The first native invariant assertion would require proved ordinary-call routing,
prelude exclusion, nonzero ordinary admitted per-visit tally, nonempty native-bound
hostile lists, and return-condition ordering. If those inputs remain missing, the
result is a missing witness, not a passing invariant or a justified repair.
For a live entity distinguish repeated blanket attack issuance from empty-target
RNG/retry behavior; a mixed command does not imply the no-entity branch ran.

## Resource request and commands

Already passed: `node --check observe.mjs` and `node observe.mjs --verify-source-only`.
Both use only built-ins and source reads; no production/dependency execution.

After independent proposal acceptance and coordinator resource admission only,
create one symlink in this isolated worktree named `node_modules`, pointing to
`/workspace/scratch/69fd8163d94e/populous-recovery-20261009b/node_modules`.
Verify the shared directory remains device27/inode538212. Never move, copy, install,
rebuild, or modify dependencies. No browser, native/emulator/EXE, held probes,
archives, auth, GitHub writes, check/build suite, or performance claims.

Run once from the isolated worktree, with raw stdout/stderr and exit retained:

```
taskset -c 4 timeout --signal=TERM --kill-after=5s 190s node --experimental-test-module-mocks qa/issue248-scheduled-trace-20261010/observe.mjs
```

Raw records append to the external review packet's `run.jsonl`, never overwrite;
result to `run.summary.json`. Use fresh task-local TMP/cache directories and retain
the command/start/session/deadline/exit, raw stdout/stderr, and dependency identity.
An existing raw run causes refusal. Exceptions and failed eligibility survive.
Record exact command, start/end, exit, observer/source hashes, dependency identity,
all tracked app-file before/after hashes and Git diff/status. Production source
equality is mandatory. Ordinary full standards are not run for this observational
packet. Resource release follows confirmed foreground process exit; no global
process cleanup or deletion of unknown work.
