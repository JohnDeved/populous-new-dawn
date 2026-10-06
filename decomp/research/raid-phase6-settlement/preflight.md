# Executable preflight: two supplied phase-6 visits

Refs #248. **Source-only and not run.** This packet implements the accepted
5d0ac7dd plan. PR247 application and tests remain byte-identical to 0d278277.
The intended success means two predicted mismatches are confirmed, not that the
port is repaired or that the maintained Mission6 gate passes.

## Entry points, ABI and real code

`run-preacher-response-once.py --settlement` reuses the existing external supervisor
and selects only `probe-native-raid-phase6.py`. There are exactly two native calls
to 004cb400, then one Node process with exactly two measured actual
withCampaignTribe → stepComputerTasks → dispatchComputerTask → stepAttackTask calls.
No tick, sermon, movement, allocation or state-machine simulation is part of the
measured port visits. One continuous precise-coverage session retains separate
setup and measured counts; all output is flushed before assertions.

All native leaves execute: 004cb400 header/phase6, 004d14f0, 00462750, 004f2460,
004f39f0 and 004df0e0. No instruction/leaf is intercepted. Each fixture freezes
canonical code-byte hashes, allowed instruction ranges, cdecl argument widths,
stack, registers including EFLAGS2, and read/write ranges. Raw EAX accompanies
every return. The processor/helper semantic returns are void; only the count and
member/release predicates consume EAX, while active sermon consumes AL.

The real helper arguments must be
`[tribe, task0, 0, initialESP-0x28, initialESP-0x50, 23, 1]`.
Each case has eight real member filters (four header/four helper), four release
predicates, and one real count returning2. Combat case has no sermon-leaf call;
moving case has four AL0 returns. Exact entered sequences and stack balance are
asserted, with callee-saved registers checked at terminal return.

## Native data and explicit supplies

Each case freezes six raw files: four complete256-byte people (1024 bytes), the
complete3173-byte tribe (including ten82-byte task slots), expected tribe output,
complete8000-byte order pool, complete4096-byte pointer table and256-byte inactive
entity290 tombstone. Every file has an explicit hash and is reconstructed or
checked by host preflight. Snapshot all bytes before/after and retain each native
read/write and the complete stack. Only stack, task elapsed, native visit counter,
and (in combat case) task phase are writable.

Observed actor fields remain unchanged except the expressly accepted semantic
membership projection: task.members IDs map to native +0xaf=1 and a supplied
native tribe chain. Captured +0xaf values0 remain unchanged in the port and in the
original captures. Unobserved, unread person bytes are zero supplies, listed in
each fixture; they are not a recovered original memory image. Native read ranges
exclude unprovided fields and shadowed pool records.

The second active task is a supplied opaque count carrier at slot1. It contributes
one flag to the real count and is never dispatched. Task+8 is a supplied native
visit counter0→1 without a claimed port analogue. Entity290 is absent from the
recorded live world; its supplied native tombstone has inactive flag1 and class0,
so the real processor header follows the no-live-target path. All four selected
records, the pool, pointer table, tombstone and both RNG words must remain unchanged.

## Ground/no-cast correspondence

`no-cast-binding.json` and four canonical disassemblies freeze the source route.
Chumara codes811..825 include ATTACK operands12/13 as field64; field64 is literal−1.
At0048fec0 the low byte of operand12 is saved;0048feff pushes it as the second of
fourteen allocator words, hence argument13. The allocator's24-byte prologue makes
argument13 `[ESP+0x4c]`;004e6304 reads DL and004e6326 writes `[ESI+0x65]`, which is
native task+0x2f because the task begins at ESI+0x36. Therefore the stored byte is
0xff. The real phase6 caller passes seventh argument1; 004d156c sees the sentinel
and bypasses the auxiliary world/spell arm. There are no supplied return stubs.

The ATTACK_NORMAL code1078 selects EBP0 at0048ff3c, pushed at0048ff0a as allocator
argument10. Its low byte is stored at004e6291, task+0x26, keeping the processor's
normal ground branch. Captured spells are[0,0,0] and selected people are models3/4;
the port task-spell callback must be called zero times. This no-cast fixture
boundary proves no Shaman spell behavior or broader phase6 spell composition.

## Port fixture and comparison limits

Use the captured registered fight.motion records in the combat case and retained
native records in the later case. Preserve stale u.native alternatives exactly.
The port's task membership and its observed assignment zeros are not rewritten.
The two unobserved readiness inputs, casting=null and lift=0, are explicit supplied
port-only values. They are not claimed as captured fields. Other Unit defaults
come from the normal constructor before measurement; no world turn occurs.

Captured cell head/ID/link metadata is materialized coherently. Uncaptured chain
neighbours are opaque non-unit supplies with cell-center coordinates, membership
bit and the known links; no semantic class/state is invented. These neighbours
are not native task members and the measured task path must not invoke any cell
registration/physics consumer. Their supplied records and all selected identities
are retained before/after. The complete original cell world was not captured.

Known current order records are populated identically in both full pools. Unknown
shadow records remain zero/unread supplies; original queued slot IDs remain exact.
Port pool cursor1 and active count2 are supplied bookkeeping values, not recovered
live allocator history. Task0 is the captured record; cursor0 deliberately selects
it. The wrapper advances that cursor to1 and restores its campaign aliases.

The complete port snapshot may change only task0 elapsed/phase and scheduler
cursor. Compare its full before/after units, selected records, alternative owners,
registry/heads, queues/pool and RNG. Native comparison checks every raw byte,
including the native-only counter. Combat prediction: native elapsed1801/phase23
versus port2/6; moving prediction: native47/6 versus port47/23. Native task flags1
and both semantic member sets remain intact. No phase23 cleanup visit is added.

## Frozen envelope and stopping rule

Default Python invocation and `--settlement` without `--execute` validate only host
files/bytes/hashes. They import neither Unicorn nor the app. Node `--check` is
syntax-only. Exact execution still needs independent executable-preflight ACCEPT
and a separate coordinator grant.

Prospective command:

`<pinned venv Python> -E -s -B scripts/run-preacher-response-once.py --settlement
--execute --expected-source-head <reviewed full head>
--expected-manifest-sha <reviewed launch-manifest SHA256>`

Use CPU4, one1s/100000-instruction native call per case, one5s port batch,
external15s TERM plus3s KILL grace, pinned Python/Node/Unicorn/timeout/taskset,
cleared injection variables and fresh
`work/orchestration/raid-phase6-settlement-20261006/{launch-01,run-01}` only.
The existing supervisor retains actual start/deadlines/PID/exit, pre/post hashes
and exact owned-group cleanup. Stop on any failure; no retry or case expansion.
These supplied comparisons do not settle the full native raid lifetime, the
separate mixed19/17 target adapter, or any maintained-test expectation change.
