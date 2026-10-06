# Mission 3 first raid selection: two-pair execution preflight

**Frozen preflight; [attempt1 now has a retained mismatch](mission3-raid-recruitment-witness.md).**
The input manifest below retains its original pre-execution identity. This implements the independently accepted
[source-only four-case proposal](mission3-raid-recruitment-origin.md), with the
review's narrowed first experiment. There is no runtime repair or native/browser
parity result. The third and fourth proposed cases are not executable through
this driver and establish nothing under this preflight.

## Exact comparison

`tests/fixtures/mission3-raid-recruitment.json` declares the entire comparison
projection: `selector`, `count`, `ids`, `ranks`, `flags3`, `task`, and `rng`.
The selector object contains model, alternative, target, mode, low-16-bit origin,
flags and requested count. Ranks retain selected ID and wrapped Manhattan
distance. Flags3 cover all seven people. Task projection includes type, phase,
selected count, selection cursor, requested count, quota bytes, flags and entity. The portable cursor is `task.remaining`, not the dispatcher cursor.

Both full roster inputs and the native/portable `hasBase/base/shaman/radius`
inputs are retained. Roster/command equality is a precondition, checked before
original execution. Tribe-field differences are explicitly recorded outside the
comparison projection. In particular, the common-origin control has native
radius 0 and portable radius 11. A matching control means its declared outputs
agree with these unequal recorded inputs; it never means whole-world equality
or radius equivalence. Its state-17 people do not use defending-order radius.

The first pair is `common-origin-control`: native established base `0x64fc`,
portable script defense `0x64fc`. The second is
`no-base-authored-coordinates`: native falls back to Shaman `0x60da`; the current
adapter still supplies script defense `0x64fc`. The expected first difference is
the second pair's selector origin and resulting ordered selection/flags. These
are predictions until the reviewed source executes.

## Supplied state and actual consumers

All records are controlled. Both cases supply one normal type-20/phase-3 task,
slot 0, request 3, quotas `[100,0,0,0,0,0]`, selected count 0, selection cursor 0,
entity 0 and its already-acquired selection lock. Dispatcher cursor is explicitly
0. Turn is **2047**, a dispatch turn for tribe 2. Native entry is direct
`004cb400(ai,0)`; original scheduler/interpreter/allocator do not execute.

The seven raw-level coordinate pairs, controlled IDs 301..307, list order, state
17, flags, commands and browser X/Z are frozen in the fixture. Browser positions
are derived from signed native words and asserted through actual `nativePosition`.
Every unit supplies its actual native person record; commandStatus=0,
guardInputPending=false, and no flight/fight/entry/builder owner. The adapter
asserts `unitAnimationSource(u) === u.native` for every person. No state-10
fixture is part of this first experiment; later eligibility cases require their
own reviewed presentation mapping.

The portable fixture is a minimal supplied Mission 3 world with flat zero-height
terrain, equal terrain/land versions, no buildings, no inside-building references,
no orders and no gameplay ticks. The actual `stepComputerTasks` dispatches to
actual `stepAttackTask`, actual `computerSelectionWorld` and actual
`selectComputerPeople`. Assertions freeze the actual helper roster, source
identity, list order, order map, busy/assignment fields and selector arguments.

Two observation wrappers delegate unchanged computations. The selector wrapper
records its real input/result and returns normally. The controller wrapper
delegates `stepAttackTask`, wrapping only its `input.select`: after the actual
callback returns and source flags3 have been copied back, it throws a unique
sentinel. Full before/after portable world equality permits only task.remaining
0→1 and selected flags3 bit0 clearing. Task membership/count, commands, paths,
RNG, dispatcher cursor and people otherwise remain unchanged.

Native execution maps the canonical PE and supplied tribe/list/person/order
records. It runs real `004f6020`, `004f8490`, ranking and every reached eligibility
leaf. There are **no intercepted native leaves**. It stops on the code hook
**before `004cb6da` executes**. EAX and the scratch prefix contain selection;
task selected count and person preparation are untouched. A memory-write guard
allows only stack, 400-byte selector scratch, visit counter, selection cursor and
person flags3 fields. Full task/person/order byte comparisons narrow these writes
further; RNG must stay fixed. Known later-person, group-command, path, wildcard,
special-subtype, Shaman, tower-exclusion and vehicle-landing entries abort.
The exact addresses are frozen in the driver and manifest. This is not an
exhaustive function-entry allowlist.

## Incremental pairing and shutdown

There is one Python/native process and one Node adapter process. The adapter
receives one JSON-line request, executes exactly that case, replies, and parks
on stdin. Python pairs that reply with one original call, compares the declared
fields and stops at the first differing pair. It sends case 1 only after case 0
has matched. No portable results are precomputed for later cases. A first-pair
difference also stops immediately, whatever the static prediction was.

On a mismatch, both results and input differences are retained and exit code is
1. Exceptions, limits, bad inputs or shutdown failure are `probe-failure`, never
parity results. Closing the adapter's stdin ends its read loop; it must exit in
2 seconds or is killed and the receipt fails. A pending portable result is kept
if native setup/execution subsequently fails. At most two paired cases run.

## Bounds, identities and next authorization

The optional `native_cpu(..., tcg_buffer_size=16*1024*1024)` loader change is
byte-identical to the independently accepted issue227 source
`64c47960f718b76ac8680f39f296c8acf0c4d2a4`. This copies only that accepted loader
behavior into this branch; the issue227 worktree is unchanged. Readback must be
positive and no larger than 16 MiB before original instructions execute.

Native limits: one mapped PE plus 256 KiB scratch, seven people, one selector
call per case, at most 128 observed call entries, 1,000,000 microseconds and
2,000,000 instructions per call; 1 GiB address space, 30 seconds CPU and 60-second
alarm. Node starts before the parent-only address-space cap, gets 256 MiB old
space, a 20-second watchdog/parent response deadline, 64 KiB per response and
16 KiB total stderr. It waits while native work runs. No npm install, browser,
Ghidra, server, fixture recording, original OS launch or full mission simulation.

The [frozen preflight manifest](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/probe-preflight.json)
binds the two drivers, fixture, shared loader, 217 statically reachable portable
source/data files, PE/range hashes, original provenance inputs, Python, Node and
Unicorn package/library hashes. The static import walk found no external npm
package. No interpreter program blob exists in this direct-entry experiment:
the executed original program is identified by PE/range hashes, and the supplied
world/task program inputs by the fixture and driver hashes. Native world loading,
mission allocation and original list construction remain supplied boundaries.

Node module mocking uses its documented delegating export support, enabled with
`--experimental-test-module-mocks`; prior imports retain the originals. See the
[official Node 24 API](https://nodejs.org/docs/latest-v24.x/api/test.html#mockmodulespecifier-options).
Syntax checks do not prove module interception or runtime import success. A failed
mock setup is a probe failure and cannot be treated as a selection observation.

Only after independent **exact-source preflight and a fresh CPU4 lane grant**:

```
timeout --signal=TERM --kill-after=5s 65s env PYTHONDONTWRITEBYTECODE=1 \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  scripts/check-native-mission3-raid-recruitment.py \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe \
  --node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --manifest references/verification/mission3-raid-recruitment-origin-2026-10-06/probe-preflight.json
```

Wrap that exact payload in a fresh source/input-bound command receipt on the
granted lane. The expected mismatch must remain a failed receipt. No automatic
retry, case expansion or runtime repair follows. The adapter assertions bind the
current-source witness; a future correction needs a new reviewed comparison.
All preparation and local bundles remain unpushed and not reset-durable.
