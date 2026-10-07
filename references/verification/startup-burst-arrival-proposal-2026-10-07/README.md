# Issue252: one original startup carrier-arrival capture proposal

Status: **source preparation only; not executed**. Independent exact-source review
and the parent's explicit execution/resource grant must precede any launch.
The accepted [9ca45344 source/data report](https://github.com/JohnDeved/populous-new-dawn/blob/9ca4534463a3ba2b868722454d38e888a1cd40cc/decomp/research/startup-burst-root-height.md)
remains immutable. No application, PR251, tests/fixtures or parity file changes.

## One question and finite stop

Does one fresh successful arrival retain the original sequence
`stone G-240 -> model9 common clamp G -> model9 offset G+90 -> model3 G+90`?
Enter original `004bb290` once with a supplied class8/model1 carrier record. Stop
only when that entry returns, including its original final `0050a750` visit on the
already-retired effect7 record. No `004baf00` movement, `00433a10` command,
`004ec6f0` outer turn, model3 physics, second case, retry or longer lifetime runs.

`probe-arrival.py` uses the unchanged accepted `scripts/decomp.py::native_cpu`
constructor and constant configuration. Its fixed high-pool/list/argument-stack
setup and passive observations adapt the accepted phase5 success/11-call observer.
This is a new bounded component fixture, not another emulator or OS-game runner.
The original EXE is pinned to SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Explicit supplied inputs

- Mission1 Blue's authored center is4352,55040; stone index7 is3328,56064.
  Only those XY/payload values are source-traced from normal command18.
- `app/level-one.ts` supplies its original raw vertex heights. Every terrain
  diagonal flag is explicitly supplied as0. At index7 the four vertices are
  A82/B62/C92/D102; original `0044e940` with diagonal0 yields G87. These are
  **raw imported terrain and supplied flags, not a recovered post-wave snapshot**.
  No application import, world creation, terrain simulation or resampling runs.
  Expected stone/dust/root/child heights are−153/−25/177/177.
- Carrier handle640 is supplied active and cell-registered at3328,56064,87.
  Stored destination has the same XYZ. Owner0, payload class7/model7, argument
  count3, index7/X3328/Y56064 and zero fourth word; copied angle/vector words
  `+0x57..+0x5c` are supplied zero. Movement, actual arrival time, yaw/pitch and
  the pre-arrival jitter RNG stream are outside the claim.
- Tribe0 is supplied active, with center4352,55040 and nominal site height64.
  All eight prior-stone handles are zero. Other tribe data is zero. The nominal
  site h does not substitute for current sampled terrain or stone h.
- One already-allocated carrier and exactly36 high free records641..676;
  low pool is empty. Total/ever counts start1, low count0. Original class/model
  descriptor bytes select the ordinary high pool here. Every allocator executes;
  success is an assertion against declared sufficient capacity, never a supplied
  successful return. Native pool exhaustion is not tested.
- Gameplay RNG starts0x12345678, cosmetic RNG0x11223344. Class seeds start0,
  except class8 seed1 for the existing carrier; animation stamp0. The actual
  original sound-alternation counter starts0 and must end1.
- UI pointer `00afc2f4` is supplied zero. This forces original `004b2670` to
  return0, which makes `0048a050` return before audio allocation or cosmetic RNG.
  **Active audio can consume cosmetic RNG and is not claimed equivalent.**
- Original balance constants are loaded through the existing verified descriptor
  routine, with all244 values guarded. Object-related and scenery descriptors
  remain original PE bytes. The retained calls do not need frame traversal,
  search, objects/shapes files, or an audio device. Shadow presentation is supplied
  below instead of silently constructing fake geometry/lighting state.

The native stack is zero-mapped as in the accepted fixture, but the temporary
third stone-position word read by `0050c690` remains whatever the original stack
computation produces. It is recorded, not overwritten with a convenient height.
The real class5 state initializer and rise own its eventual height.

## Real closure and the only two supplied calls

`004bb290 -> 004ed8a0 -> 004ed580 -> 00509c10/0050bcd0/0050c690`
creates effect7, then real scenery initialization
`004a5ef0 -> 004a7d80 -> 004ed640 -> 004a6210(state6)`.
Both `004a66c0 -> 004ee700` shape setters and the early class5 ground sample stay
real, followed by cell insertion, XY snap, heading and immediate `004a7eb0` rise.
Dust is a real nested `(7,51)` allocation through common effect initialization and
`005137c0`; suppressing it would change the root/child pool order.

The returned stone XYZ reaches real `(7,9)` initialization and its common clamp,
then `0050ccd0` creates32 real `(7,3)` records via common initialization and
`0050bf60`. Both child RNG streams remain original instructions. Real `004edcf0`
unlinks/retires effect7; the carrier then copies its original six angle/vector
bytes and performs the original state0 effect visit before returning.

| Original call site | Supplied callee | Exact arguments | Return behavior |
| --- | --- | --- | --- |
| 004a7e82 | 00403c10 shadow refresh | stone pointer,4,1 | EAX0; EIP=[ESP]; ESP+=4 |
| 004a7f1f | 0048a050 sound device | stone pointer,159,0 | EAX0; EIP=[ESP]; ESP+=4 |

The native caller removes12 argument bytes at004a7e8b/004a7f24. Supplies match
both callee and original return address, assert class5/model12 and arguments,
and perform **no memory, height, terrain, RNG or pool writes**. Shadow's excluded
body writes flag0x10, shade nibbles and texture refresh; compared ground reads
height and diagonal bit0. Sound is supplied only under the immutable zero-UI
condition above; its generally RNG-consuming active branch is not called neutral.
[Static bytes and caller continuations](native-boundaries.json) pin both ABIs.

The original descriptor gates are asserted: scenery12 `flags_1 & 4 == 0` excludes
unclassified `00494f50`, and its other flags skip the unrelated nearby-tribe scan.
The empty old-stone handle excludes old-stone allocation/removal. Effect7 has no
auxiliary-light bit0x04000000, so conditional `00401140` is not supplied. Unexpected
calls/writes/branches fail; the proposal never adds an interception at runtime.

## Passive output and acceptance contract

- Retain full supplied carrier bytes, pool bytes, tribe bytes, terrain hashes,
  initial globals/RNG, executable identity and exact source/input fingerprints.
- Retain all36 allocator entries/returns, parent call site, argument flag/stack,
  supplied XYZ bytes, returned full record bytes and before/after RNG words.
  Order must be effect7, stone, dust, root, then32 children.
- Retain every original ground call/return, six-byte XYZ snapshots at stone
  return, root common entry, model9 entry after common initialization, post-offset
  boundary, child allocator return and completed-child loop boundary. All70 ground
  reads in this case must sample the declared point and return87.
- Require stone−153, dust−25, root−153→87→177 and32 children at177. Capture raw
  birth records; later browser expectations must decode these actual records,
  not synthesize a native oracle from a proposed port helper.
- Retain every original gameplay/cosmetic memory write. Require192 writes at the
  six pinned original instruction addresses:96 gameplay advancements and32
  child cosmetic advancements. Sound's disabled-audio context is explicit.
  Preserve second-draw pitch/third-draw yaw and lifetime1–2/speed60.
- Execute and retain effect7 retirement and exactly one immediate state0 visit;
  require returned EAX to identify that retired record. Validate active/cell lists,
  counts, empty pools, cleared argument flag/restored argument stack and original
  class seeds. No root/child scheduled visit or retirement is inferred.
- Guard all non-writable PE sections,244 constants, the handle table and disabled
  audio pointer. During the call terrain writes are limited to two-byte cell-list
  heads; all flags/heights and other terrain bytes must be unchanged afterward.
  Unknown native writes or direct/indirect calls fail without automatic recovery.

One `emu_start` has a1,000,000µs timeout and200,000 instruction/callback cap.
Trace caps:4,096 events,50,000 unique access tuples and2,048 direct-call rows.
The shared accepted64MiB translation buffer is retained. Failures print partial
raw observations and exit nonzero; a bound or assertion is never relaxed in-run.

## Strict launch, validation and review boundary

`launch.py` is unexecuted source. It requires the parent's explicit full reviewed
commit argument, the one named fresh worktree, matching clean HEAD, every pinned
input hash and a never-used output directory. It creates one marker and starts
exactly one existing command-receipt supervisor in an owned session. No shell,
background task or retry loop. The generic host portions reuse the accepted state33
capture guardian at `c32dade74abf76dd8d0fd86db07659c68f830a67`,
`decomp/research/raid-state33-release/capture/guardian.py`; task-specific provenance
and changes are frozen in `launch.json`.

The host observes PID, parent, process group, session and start ticks. Session
membership captures GNU timeout's separate child group; retained PID/start identity
also follows observed descendants after reparenting. Cleanup signals only those
owned identities after a fresh start-tick check. One absolute TERM deadline at30s
and absolute KILL deadline at35s are calculated once and never extended. RSS/output
caps and external interruptions take the same cleanup path. The terminal
`host-receipt.json` retains observed identities/groups, signals, actual residual
members, source/input/manifest hashes before and after, command-receipt status and
release result. Missing ownership evidence, read errors, residual processes or
source drift prevent a pass.

The native child remains pinned to CPU4 with its unchanged20s wall timeout,
5s TERM-to-KILL grace,15s CPU,1GiB address-space,32MiB file-size,128-descriptor
and zero-core limits, in an empty environment plus fixed PATH/locale/UTC. The host
also limits aggregate RSS and outputs to1GiB/32MiB and reserves256KiB for its
terminal receipt. `launch.json` freezes exact argv/input hashes; its `status:
not-run` is intentional. This launcher-only correction changes no native fixture,
original call, observer, byte range, assertion or native execution bound.

A future parent grant must reserveCPU4 and create the named fresh execution tree
at the reviewed head. Preparation does not create that tree or reserve resources.
A result requires terminal passed receipt, unchanged inputs/source, probe JSON
`status: passed`, verified cleanup and independent raw-result review. No retry or
second invocation follows a failure without a separately reviewed recovery.

Preparation validation is limited to Python AST/compile-as-data, JSON/hash/link
checks, source bounds and static-byte correspondence. No probe import, native_cpu,
emulation, application import, simulation, browser or runtime change is performed.
