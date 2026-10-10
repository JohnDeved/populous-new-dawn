# Issue 248: one revised scheduled Mission 6 port trace, proposal v4

This is a new-run proposal after the retained f957ea23 attempt stopped on an
observer equality guard. Its earlier acceptance does not authorize this run.
The corrected observer's four controlled purity cases passed; fresh independent
source/binding review and coordinator admission remain required before simulation.

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

`observe.mjs` SHA256 `1f3b56604348f6bd30b91189796f0fd23fe7cbf6350ad07176074f91a11e6b61`.
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

One `registerHooks` load hook exposes existing private `computerResponseWorld`
for a candidate projection on detached data. It also renames only the
`stepComputerTasks` declaration, then exports a same-name wrapper that invokes the
original body once, invokes a read-only after-dispatch callback, and returns the
original result. The callback uses a task-specific Symbol, asserts that it was
previously absent, and is removed after the run. It checks the entire original
source text and records original and evaluated hashes. Every original function
body stays unchanged. This avoids a late module mock that cyclic model imports
would bypass; that unrun v1 proposal/observer is preserved separately.
Every snapshot clones the world, passes only that detached graph to projection
helpers, and keeps strict before/after V8 serialization guards on both the live
world and detached input. Guards run in finally, including when a helper throws;
the original helper exception is recorded first. The first mismatch preserves
the exact bounded before/after buffers locally, then fails. The observer does not
use wall time or logs as simulation inputs. See `purity-inventory.md` for the finite
transitive helper audit and output bounds.

Capture allocation arguments and scheduled turn; task/queue state; registered
identity versus retained native/fight/flight/entry/builder owners; current immediate
and queued order records, command17/19 payloads and cancellation/state gates;
all current yellow people, retained assignment+0xaf and optional flag+0x7f;
assigned-state23 prelude candidates; ordered actual registered cell chains and
separately the existing defense-adapter rows; both cap10/radius7 collector results;
derived old all19/payload comparison and actual consumed callback results; actual returned actions;
controller, after-dispatch, and after-turn retry/target/order/RNG state.

The runtime does not retain native task+0x26, task+0x08 visit counter, task+0x23
building selector model, task+0x2c condition, or native tribe-person list ordering.
Those native projections are null/unbound in the packet. Raw `task.mode` and
`elapsed` are retained separately; they must not be substituted for route+0x26 or
visit-counter+0x08. A separate static report maps mode to+0x23; this observation
does not invent coordinate-selector execution from that source fact.
Optional nativeFlags7f absence is also null,
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

The single v3 mission run then failed at turn7637 after an allocation at6475;
no mixed-dispatch record or phase16 visit was accepted. The optional extra distance
query could invoke `nativePosition → syncNativeTerrain`; no field diff survived
to prove the exact cause of that run's serialization mismatch. V4 deletes that
query/export, keeps actual targetsRemain callback evidence, uses detached projection
inputs and preserves rejection buffers. The old failed run stays invalid.

Controlled observer-contract check: four cases passed at
`2026-10-10T07:24:08.032022+00:00`, exit0, under the separate20s CPU4 grant.
Test SHA256 `996821fcdc2c674b5df93b1e162f384f5c406e7d22bf98e47edf29530adb527e`;
inventory SHA256 `34561fea07b089be17f93337abf846ec21adfb7eef1744ab459f0ba09ee9c345`.
Receipt SHA256 `c882f2221789e8c9a42a602f87c399653bcef3e99c17d03eef6033f15c43e753`;
stdout SHA256 `aa034a9d9b0ac98564b45d06bb5153bd7ec5b09b38ff02664156eb58924a5e9f`.
An earlier controlled invocation failed import resolution before any cases ran;
its source and receipt remain preserved. These controlled cases do not reproduce
the lost field difference or establish scheduled gameplay/native behavior.

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

Raw records append to the external review packet's `revised-run.jsonl`, never overwrite;
result to `revised-run.summary.json`. Preserve all old `run.*` and purity receipts.
Use fresh task-local TMP/cache directories and a fresh outer receipt, and retain
the command/start/session/deadline/exit, raw stdout/stderr, and dependency identity.
An existing raw run causes refusal. Exceptions and failed eligibility survive.
Record exact command, start/end, exit, observer/source hashes, dependency identity,
all tracked app-file before/after hashes and Git diff/status. Production source
equality is mandatory. Ordinary full standards are not run for this observational
packet. Resource release follows confirmed foreground process exit; no global
process cleanup or deletion of unknown work.
