# One automatic-sermon producer comparison: source preflight

Refs [#243](https://github.com/JohnDeved/populous-new-dawn/issues/243).
This is implementation of the independently accepted plan at `0fc9329d`, with
one required registration-state correction. **Native and application execution
have not occurred.** The prospective claim is one supplied response-producer
omission, not ordinary Mission3 history, whole-sermon parity or a runtime repair.

## Exact frozen inputs and membership correction

[fixture.json](fixture.json) contains every named native field/width/offset and
corresponding port value. [people-input.bin](people-input.bin) contains both full
256-byte records; [orders-input.bin](orders-input.bin) is the complete8000-byte
pool. All unlisted native person bytes are explicitly zero. Host preflight
reconstructs these binary files from the declared fields and rejects any difference.
Queued order1 is model3/flags0/references1/object0/XY2300,2100; all other records
are initially zero. Cursor2 and active count1 are supplied.

Both records have flags2 **0x20000**, not the outline's provisional zero. That is
the ordinary cell-membership bit established by `insertObjectIntoCell`; source1
heads the cell and links to enemy2, whose previous link is1. Both native and port
start with this exact supplied post-registration state. Native unit-table entries
0/1/2 and port Map identities agree. No registrar runs after the initial snapshot.
The expected native flags2 becomes0x20010; the unchanged production port remains
0x20000. No flag normalization or ignored registration delta is permitted.

The source is an already-retained `u.native` record. Port setup uses
`createWorldState(3)` and `addUnit` only to construct the supplied World/units;
there is no campaign initialization, tick, acquisition, movement or native-person
creation. The registry, two native records and full pool are then supplied directly.
The port's unit coordinates are `(25,-41)` and `(25.5,-41)`, HP50 each, matching
native XY2100,2100 /2180,2100 and life1000. After setup, both RNG states and
world.turn0 are frozen. Complete port people, units, pool, cell heads, identities
and path owners are retained before/after. Newly-created-person adoption is later
work; no runtime code is changed here.

## Field and data supply ledger

- Flags2/3/4: membership only in flags2; others0. Source flag3 pending bit0x800 is
  transiently set/consumed by the real dispatcher. Assignment0 and levelFlags2=0
  permit ordinary response dispatch. No ghost, invisible, airborne or listener flag.
- Source class1/model4/state10/substate1/speed40/counter0/tribe0/life1000,
  commandStatus3, immediate0, cursor0, queue `[1,0,0,0,0,0,0,0]` are supplied.
  Range comes from the real command/model tables, not a stub. Enemy is
  class1/model2/state17/tribe1/life1000, no orders/group/vehicle/disguise.
- `id`, XY, height0 and linked-cell fields describe the two supplied records.
  Reaction fields, work target/flags, selection, orderLocation and commandPhase
  are zero. The fixture defines their exact sizes; bytes outside the declared
  fields and eight command words are zero, and all512 bytes are compared.
- World turn0 equals native person counter0. Both sides use gameFlags0 and
  alliance bytes `[0,0,0,0]`; no asymmetric-alliance case is included.
- Native terrain is supplied zeroed16384×16-byte cell data, category0 everywhere,
  with one head index1 at cell2064. Port terrain categories/flags/owners/building
  IDs are supplied equivalently for the consumed response domain; units/buildings/
  fights are the declared two/zero/zero. Native whole-cell chain traversal and the
  actual production `combatWorld` adapter run without replacements.
  This two-person case does not claim general native-chain ordering parity; the
  production adapter's existing list fallback remains part of what executes.
- Canonical executable and `levels/constant.dat` hashes are pinned. The existing
  `native_cpu` and `configure_native_constants` helpers map the PE and apply the
  shipped balance data before observation. Person/state/command/category tables
  remain native data. The model4 descriptor, state10 descriptor, command3 range
  mode, command32 flags and category0 flags are explicit read-allowlist regions.
- Simulation seed0x12345678 and cosmetic seed0x9abcdef0 are supplied after setup.
  Native words89d178/89bc72 and port-owned words must both remain unchanged.
- The cdecl stack/local region is explicitly zero-initialized by the mapped
  scratch allocation, with the return sentinel and source argument then supplied.
  Raw stack before/after is retained; stack traffic is not treated as person state.

## Real calls, observations and failure boundaries

The only native invocation is `004d4690(source)`. The ordered entry sequence must
be exactly:

`004d4690, 0051ff60, 004d44e0, 0051e7b0, 0051ff60, 004df140,
0051f030, 0051f030, 004de7b0, 004de7b0, 00436c20, 00438730, 00436d00`.

The fixture pins the full bytes and bounds of those ten distinct functions,
argument-slot counts, return widths, call counts and exact memory regions.
All original instructions and callees execute. Hooks only observe and assert;
they never change registers, return values, pointers or memory. Any code outside
the listed ranges, or memory access outside the declared read/write regions,
fails. Peer sharing00520480, sermon0043a4d0, coast004ec630, building004044b0,
cleanup004364d0, tower lookup and ritual helpers are not permitted in this case.
The dry00438730 body must execute rather than be replaced with a payload writer.

Arguments occupy32-bit cdecl slots. Predicate/scanner/producer results use AL;
range and disguise use EAX; allocation uses AX; dispatcher/preparation/attachment
are void. Raw argument slots are retained, with masks applied only to the
documented consumed byte/word widths. Return stack balance and preserved registers
are checked. Scan output pointers are read from the actual callee arguments at
return; primary AL0/friendly0 and secondary AL2/threat=enemy2 must be observed.

The sole port invocation is actual exported `startLiveCombatResponse`, reaching
private `startPreacherResponse` without copying it. Node's built-in precise
coverage is enabled after setup to record actual production function visits:
one wrapper/allocator/scanner/eligibility/private producer/detector, two range
visits, and zero allocation/sharing/registration/path cancellation/startup/sermon/
queue/tick visits at the frozen unchanged runtime. Full application coverage is
retained. Unexpected visits or coverage mismatch fail, without a rerun.

Native read/write events and every raw record/pool byte are retained. The exact
predicted native delta is source flags2+16, immediate2, orderLocation2021, new
order2=`32,32,1,0,2100,2100`, cursor3, active2. The entire enemy and queued order1
must remain unchanged. Native producer AL remains0 despite attachment. The
production port is predicted to return false with no persistent state change.
The comparator verifies both complete snapshots and labels success
`expected-mismatch-confirmed`; it never reports parity equality.

## Source guards, host checks and prospective launch

[launch-manifest.json](launch-manifest.json) pins the fixture, raw inputs,
launcher, actual-port runner, source evidence and helper files. It also binds
runtime main`1c7e6b05`: preflight rejects any local app change or any app difference
from that reviewed main. Accepted static/adoption evidence is preserved unchanged.
The runtime's sole delta from the originala00 baseline is the already-accepted
timer<840 condition; this response-only run cannot execute that sermon controller.

Host-only preflight:

```sh
python3 scripts/probe-native-preacher-response.py
node --check scripts/preacher-response-pair.mjs
```

The first command imports neither Unicorn nor application code. Python AST parse,
JSON/raw reconstruction/hash checks and `git diff --check` are the only other
checks performed during source preparation. Standard application tests/build,
rendering, native emulation and Ghidra were not run.

After independent review and a separate coordinator execution grant, the exact
launch is the prerequisite venv Python with `scripts/probe-native-preacher-response.py
--execute --expected-source-head <reviewed-full-head>
--expected-manifest-sha <reviewed-launch-manifest-sha256>`. Those two pins must be
supplied externally; the script does not infer permission from the manifest.
Output is the fresh task-owned
`work/orchestration/preacher-response-trigger-proof-20261006/run-01` under this
research worktree. An existing directory rejects the launch.

There is one native invocation and one port subprocess, no controls and no retry.
Limits are100,000 native instructions,1,000,000 native microseconds,5 port seconds
and15 outer seconds. Timeouts/errors retain observations and terminate. No Ghidra,
browser, server, fixed port or fixture/parity recorder is used. Review must accept
the exact source/fixture/allowlist packet before any execution.
