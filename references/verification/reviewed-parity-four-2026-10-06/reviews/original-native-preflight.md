# Firewarrior firing producer and phase comparison: execution preflight

Status: **prepared, not executed**. No firing, visual, elapsed-cadence,
runtime-correction, or parity-completion claim is made. Application/artwork base is
accepted `b0208188b8de345a6ad5e86cb7c49769624dda86`. The accepted static audit
`efd5d17293b18802b3cdca447b2efa8de8aca5b0` is
`decomp/research/early-people-artwork.md`; its independent review is retained in
`work/reviews/firewarrior-firing-proof-20261006/review.md` in that separate tree.
The source720 resting correction and the audit's harmless result.json EOF newline
remain unchanged. Only this research packet is writable.

Initial preparation freeze e2bcc32a6fd0a088e3ef4f9f092f7bab3af8b984 remains
in history and its separate bundle. Its launch preflight was rejected for missing
failure preservation and explicit emulated-write protection. This revision repairs
those two harness blockers, pending renewed review/grant before native/port execution.

At source 7526bc3da98958aaa71bf148bb62fede4fdd2583, granted native-01 completed
all 16 native cases, then failed before any port case because Node24's native
TypeScript loader requires WebAssembly, disabled by --jitless. All native results
and the failed outer receipt remain unchanged. This revision removes only that
Node argument, retaining the same memory/CPU/timeout/cleanup guards. The dedicated
[port-only smoke preflight](port-smoke-preflight.md) must receive its own grant
before startup is checked; native calls must not be repeated for that check.

## Question and actual executable bodies

Compare full original command21 controller `0051a2a0` with the actual existing
`stepAreaAttack` in `app/live-building-combat.ts`, preserving actual animation
setters. This finite synthetic comparison is separate from the ordinary UI witness
in [ordinary-route.md](ordinary-route.md).

Original row/object/descriptor bytes execute through
`004d3ff0 → 004d4040 → 004ee700`. Native readiness `0051f990`, paired launch
`0051fbf0`, class initialization `004ed580 → 004bab10 → 004bbcf0`, phase cleanup
`00518390` and its idle consumer `004d4da0` remain real. Setter entry and return-site
snapshots preserve assignment, animation and phase changes, including first
decrement. No output or timer is replaced with an expected answer. The known
row15→object94→56/13 versus object15→48/14 table pair is an input identity check.
Descriptor13/14 bytes are identical.

The private port body is exposed using Node's synchronous load hook in `port.mjs`.
It verifies caller SHA-256
`fa648b2ae6b1708c26f81b4fa019ce3c3ccc5c8813891412742a2ddf71e464a2`, then appends
only `export { stepAreaAttack as probeStepAreaAttack }`. No body, import, setter,
readiness, launch, timer or expected value is replaced. The unchanged local
application dependency closure is recursively fingerprinted by preflight, including
type-only dependencies conservatively; bare package dependencies are rejected.
This command does not use the recruitment npm tree.

## Supplied fixture state and leaves

- Grounded class1/model6/state10, command21, substate10/person or11/building,
  vehicle0, airborne bit clear, source override/disguise bits clear. Prior frames3
  and4 test reset. Actor/target identity, coordinates, life, flat height128 land,
  allocation context and pointer tables are supplied; no native acquisition claim.
- Original VSTART/VFRA chains supply six-byte frame-count records through the
  existing reader boundary; original asset-loader execution is not claimed.
  Constants are validated/configured by the existing helper. Original EXE SHA-256:
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- `004ed8a0` allocator supplies exactly two zeroed class8/model6 slots, IDs3/4.
  A bounded64-byte thunk region runs their actual original initializer and
  allocation-context stack. No third allocation is accepted.
- `0048a050` audio and `004010b0` sunlight are logged no-op leaves.
- Building cases only: `00404420` returns the supplied target coordinates.
  Building geometry, footprint/occlusion variety, damage and destruction remain
  outside this coordinate boundary.
- Counter1 excludes periodic retarget. No world/animation update runs between
  visits; cooldown/projectile lifetime remain supplied. Present/gone is explicit
  initial fixture state, never deletion during an ordinary witness. No elapsed
  time or per-render cadence follows from controller visits.

The port uses real readiness, paired launch and setters on a minimal flat-land
World. Native +0x72 is this command's projectile role, stored by the current port
in p.stateObject. Comparison names it trackedProjectile and retains both raw
records, including native +0x87 and port p.target. Completion has different outer
ownership boundaries: the port body returns to stepLiveOrderQueue. A raw
completion-field difference must be traced through that outer caller before
promoting it to a live defect.

## Finite branch table and stopping

Each of these8 cases runs for person/substate10 and building/substate11:
exactly16 fixtures, at most70 native calls and70 port calls.

| Case | Initial state | Max visits | Question |
| --- | --- | ---: | --- |
| entry-walk-frame3 | changed target, phase0, 40/18, f1=7/f2=3 |14| real44 entry/launch,44→40 and present-shot expiry |
| entry-idle-frame4 | changed target, phase0, 48/18, f1=2/f2=4 |1| another prior frame and assignment128 |
| recovery-boundary-present | phase44/timer1, 56/13, shot4 valid |8| transition then exact40 initialization/hold |
| wait-entry-present | phase40/assignment528, shot4 valid |7| reselection/reset/hold/first decrement/expiry |
| wait-entry-gone | phase40/assignment528, missing shot |1| missing-projectile completion and real cleanup |
| cooldown-entry | changed target, phase0, cooldown25 |2| phase45 initialization and first/next decrement |
| cooldown-expiry | phase45/timer1, cooldown25 |1| timer completion |
| cooldown-cleared | phase45/timer10, cooldown0 |1| cleared-cooldown completion |

Stop each case at actual completion or its listed cap. No case expansion, unrelated
combat sweep, new consumers or bound increases after a failure. Execution order is
all eight person native cases in file order, then all eight building native cases,
then one actual-port batch in the same order, then comparisons in case, visit and
declared field order. All declared differences are retained; first-mismatch.json
means the first difference in that comparison order. It does **not** mean execution
stops as soon as a pair differs. No cases are generated in response to any result.
Any mismatch returns exit1.
A known baseline mismatch is a **failed comparison**, never a passed parity test.
Native/import/resource failure remains a failed attempt, without synthesizing the
missing output or weakening its assertions.

Each native case and supplied fixture is persisted before its calls. Each visit
has an atomic, flushed before-record on disk before emulation, then completed
after-state/events, or failed state with error and partial after-state/events.
PC/SP/EAX and actor bytes accompany snapshots. An exception updates case.json and
terminal.json to failed with its case/visit/error, stopping before later cases or
the port. SIGALRM, SIGTERM, SIGXCPU and SIGXFSZ use this failure path. Uncatchable
SIGKILL or host failure can only leave the previous running record, which remains
unknown; an outer receipt must never relabel that interruption completed.

Node stdout/stderr stream to owned files from process start. On timeout/error,
only the unreaped direct child receives TERM, then KILL if needed. wait4 confirms
that exact child was reaped and supplies its RSS/exit status. port-process.json
retains partial-log hashes, signals and cleanup result. Cleanup failure remains
explicit. Terminal failure is saved after cleanup instead of losing timeout output.

## Emulated-write policy

After trusted host initialization, default-deny guest writes: original image is
read/execute, scratch storage read-only, and initializer thunk read/execute. Only
pages containing these mutable bytes regain write permission; UC_HOOK_MEM_WRITE
checks exact containment on every guest store (range ends are exclusive):

- Four actor records 0x2000100..0x2000500 and allocation context 0x2000800..0x2000900.
- Native stack 0x2049000..0x204e000.
- Alert byte 0x89d167, RNG word 0x89d178..0x89d17c, allocation flag byte 0x89243a,
  and context pointer 0x892443..0x892447.
- Only two-byte land-list heads at cells x16/17,y17/18, the four cells reachable
  by the supplied +/-96 launch offset at a coarse-cell corner.

Original code, row/object/descriptor tables, constants, pointer table, command,
loaded frame counts, thunk instructions and every unlisted byte remain forbidden.
Rejected stores retain address/size/value/PC before failure. Page protection
separately prevents code/table/count/thunk writes; byte guards protect immutable
data sharing a mutable-global page. Trusted host fixture/leaf mem_write calls do
not grant guest permissions. No range expansion after failure without new review.

## Hard resource envelope and launch gate

Fresh review of the exact committed packet and a coordinator CPU4 grant are
required before probe.py. Read-only preflight runs no emulator, game module,
browser, server, package install or full check.

- One foreground Python, at most one sequential owned Node child; no subprocess
  pool, daemon, server, port, browser, OS executable, Wine, Ghidra, install or npm.
- taskset CPU4. PE plus0x50000 fixture mapping must total below16MiB. Unicorn TCG
  is set to16MiB before mapping.
- Python address-space soft limit 512 MiB while emulating, hard limit 8 GiB so
  its Node child can use the declared 8 GiB cap; CPU soft30s/hard35s, total
  alarm45s, each output file8MiB, core files disabled. Node address-space8GiB,
  V8 heap128MiB, CPU soft15s/hard20s, subprocess timeout20s and thread pool1.
  Reserved address space differs from resident memory; retain both maximum RSS
  figures. No performance claim.
- Per native call100,000 instructions and1,000,000µs; safety cap96 calls,
  cumulative1,000,000 instructions,4,096 watched events per call. Breach fails.
  Execution outside original code range or64-byte initializer-thunk region fails.
  Leaves add no memory mappings.
- Outer timeout TERM55s/KILL+3s owns the foreground group. Synchronously reap the
  owned Node child using wait4; retain exit/cleanup evidence in that same invocation.
  Do not infer cleanup from another namespace's PID or touch other processes.

The restored mapper is read-only
`../mission3-raid-recruitment-20261006/scripts/decomp.py`, frozen SHA-256
`0a4783a8ee924c52e1125a5df3e4e625b3ab00835e848a2013e444bcfd979c2e`.
It supports tcg_buffer_size before mapping. Bind it and its identical constants
before/after; drift fails. No dependency directory is reused.

## Exact commands for review

Source `../prerequisites/env.sh` first. Preparation only:

```sh
PYTHONDONTWRITEBYTECODE=1 python decomp/research/firewarrior-firing-phase/preflight.py \
  "$POPULOUS_GAME" \
  --native-helper ../mission3-raid-recruitment-20261006/scripts/decomp.py
```

After fresh review and CPU4 grant, the real proposed CLI is:

```sh
timeout --signal=TERM --kill-after=3s 55s taskset -c 4 \
  python decomp/research/firewarrior-firing-phase/probe.py "$POPULOUS_GAME" \
  --native-helper ../mission3-raid-recruitment-20261006/scripts/decomp.py \
  --output work/orchestration/firewarrior-firing-phase-20261006/native-01
```

Use existing scripts/orchestration/command-receipt.mjs with every native input,
external mapper/constants, all probe source and the receipt helper explicitly
bound. Fresh output paths only; exit1 remains failed. This packet grants/runs no
emulation. Browser work requires its own frozen checker/import/guardian/dependency
preflight and grant; this route alone is not browser-launch readiness.

Focused host-only failure checks use:

```sh
PYTHONDONTWRITEBYTECODE=1 python decomp/research/firewarrior-firing-phase/host-check.py \
  --output work/orchestration/firewarrior-firing-phase-20261006/host-check-01
```

They import only this probe's stdlib definitions, exercise exact write-range
boundaries and immutable-address rejection, and force visit exception/timeout
records. Two sequential harmless Python children check direct-peer success and
forced timeout (including a TERM-ignoring child), retained stdout/stderr, KILL,
wait4 reaping and exact child RSS. No Unicorn, game module, actual port, Node,
browser or package is imported/executed by these checks. They do not establish
the unexecuted Unicorn memory-permission or application comparison result.

Standard check/build and TypeScript quality gates are not applicable to research
preparation and are not run. App/public and parity data stay unchanged. Local
commits and the small verified source-only bundle remain unpushed and not
reset-durable. No GitHub/auth/issue/Library/public-upload action is included.
