# One scheduled Mission 6 phase3 admission-input observation

Status: source preparation and separately granted controlled qualification only.
No authored mission execution is authorized. Independent prelaunch review and a
separate coordinator resource grant are required before any mission execution. This is a new input question, not a retry of the
failed phase16 trace and not an admission implementation.

## Question and exact boundary

What is the entire current registered class-1 tribe-2 state14 population when the
first naturally allocated Chumara type20 task completes phase3? Capture all same-
tribe registered people, then derive the state14 set. Do not filter by task.members,
hp, model, old assignment, flags or whether an expected unit alias matches.

The [accepted native ownership source](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md)
places admission after positive final selection, across the full tribe state14
chain. Current port production does not apply this assignment operation. The
controller's selection callback returns IDs before the runtime processes its
`select` actions and `changeLivePersonState(...,14)`. Therefore four stages remain
separate: before controller; immediately after each actual consumed selection
callback; after controller return; immediately after the real dispatcher has
applied the entire action batch. Only the last stage is the decisive cohort.
No intervening gameplay step precedes that final snapshot. The enclosing tick
then returns normally, and the loop stops without another tick; its terminal
world/AI may reflect the remainder of that tick and is not substituted for the
captured dispatcher boundary.

Observe the first allocation only, including its incomplete quota visits. A
positive completion requires actual entry phase3 followed by phase4, selected>0
and active task. Empty retirement and unexpected phase exits stop as misses.
A returned selected ID is not automatically a state14 member. Registry order is
port Map iteration order, not recovered native tribe-chain order.

## Source, scope and preserved history

Production base remains main `4754e12d3590bde18656416514871b033de164be` in the owned
worktree `/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-20261010`, branch
`research/issue248-phase3-admission-20261010`. The observer is a bounded delta from
the accepted runner at `485ed5c3aeae59ae2756685786555c2bbfc75d13`, after its compact
publication `52766b75355edd4668941e9c5bce297a929fc4bb`. Only this QA directory may
differ from production; app, tests and package inputs remain unchanged. PR309
`32ad31ce01d0a95a0da2cbd002e96fa1d7f0b8ff` remains separately expected-red and is
not imported. No held PR292 code is used.

The old phase16 runner, tests, proposal, inventory and results remain immutable
at their published source commits. All local failed attempts and buffers remain
untouched. The old overall run remains FAILED; its accepted dispatch7637 and
three-visit prefix are not a phase3 input witness. No prior purity-test acceptance
is transferred to the changed observer.

## Minimal observer and contract

Reuse the source pin, exactly-once allocator/controller wrappers, declaration-only
runtime wrapper, original-body check, first authored `createWorld(6)` and
`tick(world,1/12)` loop. Both authored opponents stay active; use the default seed.
There are no injected entities/tasks, state or AI edits, checkpoints, native or
browser execution, alternate scenarios or searches. There is no extra production
query: remove defense/terrain/collector/order helpers and their private export.
Only actual `select`/`selectShaman` callback invocations are delegated once and
logged, with the exact returned actions preserved.

Each snapshot clones the world once and reads only detached retained properties.
Enumerate the registry directly, preserving every class-1 tribe-2 row even when
its unit is dead, missing, unlisted, has another team, has an ID/key mismatch, or
has no matching alias. Record raw person model/state/assignment/flags, missing
fields, registry key, task inclusion and each matching unit's hp/kind/team/inside.
Match unit aliases by object identity (flight, fight.motion, native, entry.person,
builder.person, resident.person); retain both matching and stale aliases. Unit
matching accepts registry key, person ID or exact alias identity so mismatches are
diagnostics rather than dropped rows. Raw nativeFlags7f presence and value remain
separate. No owner precedence or native upper-bit value is invented.

The strict whole-live-world and whole-detached-world V8 byte guards are unchanged,
including finally guards, original helper error retention and bounded local
before/after rejection buffers. The prior typed-view uncertainty is not exempted;
a new byte mismatch fails this attempt. See `purity-inventory.md` for the finite
read surface. Five dependency-free controlled tests are prepared in `purity.test.mjs`
with status recorded in the separate source-bound qualification receipt. They cover
complete cohort/identity retention, exact wrapper/action-batch timing, mutation plus
exception, live mutation, and oversize refusal.
They cannot prove a scheduled game path or resolve the historical byte mismatch.

Missing task+0x31, route+0x26, native visit counter and native tribe-chain ordering
remain null/unbound. This observation cannot qualify universal admission or
specialist maintenance, prove original/native parity, or establish Mission1–3
impact. A Warrior-only current cohort, if observed, would be one bounded input;
it would not authorize a Warrior-only activation patch.

## Fixed bounds and prospective execution

Exactly one fresh world; at most22,064 turns and180,000ms internal wall time,
including imports; CPU4; external190s timeout with SIGTERM and5s SIGKILL grace.
Stop on the first completed phase3 dispatcher batch, first retirement/unexpected
phase exit, any guard/error, or either bound. No automatic retry or second case.
Capture an exact terminal AI/queue where in-process termination permits it;
outer/import failure supports only its last recorded boundary.

Retain the previous byte caps: JSONL32MiB, each world buffer16MiB (pair32MiB),
summary1MiB; the prospective outer receipt caps stdout1MiB and stderr1MiB, total
raw evidence67MiB plus a separately bounded1MiB command receipt. Use fresh
`phase3-run.*`, TMP/cache and a source-bound outer receipt; refusal if raw output
already exists. No raw-world publication. The committed observer, proposal and
contract-test bytes must equal HEAD and the independently reviewed source pin.

Before mission execution, freeze/review the source, qualify the controlled contract
under its own resource grant, push/read back if authorized, and receive a new
mission run grant. Immediate source, package/dependency and output-freshness guards apply.
Canonical dependencies remain stationary at device27/inode538212, accessed only
through the already-owned read-only symlink if the coordinator admits that use.
No move, copy, install, package/cache writes outside task-local paths, broad
check/build, authentication changes or unrelated GitHub writes.

Controlled qualification command, status in its fresh source-bound receipt:

```
taskset -c 4 timeout --signal=TERM --kill-after=2s 20s node --test qa/issue248-scheduled-trace-20261010/purity.test.mjs
```

Prospective mission command, not executed:

```
taskset -c 4 timeout --signal=TERM --kill-after=5s 190s node --experimental-test-module-mocks qa/issue248-scheduled-trace-20261010/observe.mjs
```

Syntax/source-only checks and the five controlled contracts are authorized on CPU4
with fresh receipts and commands bounded to60s or less. Their exact statuses belong
in those receipts. No production/runtime/dependency execution is part of preparing
this proposal; broad standard checks are not applicable to this observational QA delta.
