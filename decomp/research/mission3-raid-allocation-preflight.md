# Mission3 raid allocation: PhaseA source preflight

Status: attempt2 controlled RNG witness accepted; attempt3 gate/cap witnesses retained.
Runtime base is
`89e68606a406f93715b930550317519818ddc081`. Changes are two evidence programs,
a controlled fixture, an optional shared-loader buffer argument, this note and raw
attempt receipts. Recruitment PhaseB, gameplay repair,
ordinary campaign observation and rendering are deferred.

The earlier workspace disappeared before source review or execution. Both programs
and the fixture were reconstructed from their retained tool writes and exactly
match all three SHA256 values captured before that loss. This is a newly labelled
preflight note; its predecessor had no separately captured hash. The original
unpublished commit `facb0dd7df31c56943305b6214f1366960387f44` is not claimed
recovered. Current source is restored on the verified base in a new worktree.

## Exact question and controlled inputs

Does the actual Mission3 campaign adapter preserve the original state20,
attribute25 raid cap and ten-slot resource gates **before** target-selection RNG?
The fixture supplies the already verified48-byte Mission3 startup profile,
states1052527, tribe2/turn2046, seed0x12345678 and population reads3/31/26.
Startup PopScript is not run; there are no hidden presentation-command hooks.
The genuine CPSCR012 block796..<833 and its complete imported fields/variables run.

Five cases are frozen in `tests/fixtures/mission3-raid-allocation.json`:

1. Nominal accepted fixture.
2. State20 disabled.
3. One existing type20 task at the authored attribute25=1 cap.
4. All ten task slots occupied by other types.
5. Only the last task slot free.

These are controlled composition fixtures, not ordinary gameplay acceptance.
Each native list is two unique, acyclic, live Blue model1 building records in the
same order/IDs/poses as the port; native building count is exactly2. No count/list
mismatch, model10 exclusion, person fallback, changed cap, or whole-world actor
creation is folded into this phase.

The actual native00404420 inside-point geometry executes using original object
bank2 and shapes. The current campaign adapter uses its actual building-position
routine; a route-coordinate disagreement is reported, never normalized away. Such
a baseline mismatch stops the probe before later native cases and may precede the
planned cap/RNG witness.

## Interception and observation contract

Only0048f350's internal reads1153/2/1 return supplied population values. Other
operand reads, interpreter0048c6b0, ATTACK decoder0048fc50, allocator004e5fd0,
gate004627f0/count00462d40, free-slot00462730, task writer00462790/reset00462ca0,
target selectors004f5240/004f6100/004f6180, building coordinate00404420 and status
writer0048c650 execute original bytes.

Initializer00461d70 and its actual004f52c0/004d1420 callees execute before the
controlled profile and task fixtures are supplied. Observational entry hooks log
these routines and arguments. RNG memory-write hooks only observe. There is no
intercepted allocator, target, RNG, position, status, recruitment or outcome.
Entering004cb400 or004f8490 is an explicit out-of-scope failure. These are known
deferred-entry guards, not an exhaustive unknown-function-call guard. Other
unexpected dependency failures are detected only by native exceptions, input
assertions, resource limits or subsequent trace review.

The pair program calls real `runScript` and `campaignCommand`, which reaches the
existing target selector and `requestAttack`; it does not reimplement them.
Comparison preserves new task index/flags/type/phase, entity, target/origin,
request/damage/marker, six quotas, retreat percentage, three spell bytes, final RNG,
population-read order, all48attributes, and unchanged occupied records. Native
status calls, raw task bytes and intermediate RNG writes are diagnostics. Native
RNG has an intermediate LCG store; it is not falsely equated with two port draws.
No native allocator return value is guessed from the interpreter return register.
The raw snapshots retain every task slot; only occupied-slot preservation has an
automatic boolean comparison. Witness review must inspect any other changed bytes
and confirm occupiedUnchanged is true, since matching false values could otherwise
compare equal. No claim that every unused slot is automatically asserted follows.

## Resource and stopping limits

One foreground process tree, no browser/server/profile/port/Ghidra/dependencies.
The Node adapter runs once, all five finite fixture cases, with256MiB old-space
and20seconds subprocess timeout. A static import walk finds217 repository
modules/data files and no external npm package dependency. Its entire source is
bound by the evidence commit and clean tracked diff.

The native phase requests a16MiB TCG translation buffer before the first memory map,
then reads back and asserts a positive actual size no greater than16MiB before any
original instructions run. This optional keyword-only loader argument leaves every
existing caller's default behavior unchanged. The report retains actual buffer
bytes, setup VmSize/VmRSS and peak RSS; these are resource observations, not a
performance benchmark. The phase uses a1GiB process address-space limit,30seconds CPU limit,
and60seconds alarm. An outer timeout65seconds, TERM then KILL after5seconds,
owns any stuck child. PE map is0x94c000bytes; scratch is0x40000bytes. Layout:
object bank02000000(8532bytes), shapes02004000(4604), program02008000(12552),
two256-byte building records0200c000, stack0203d000, return sentinel0203e000.
Every native call is capped at1,000,000microseconds and2,000,000instructions.
Maximum is five initializations plus five block calls. Hook traces cap at128entries
and four RNG writes per case. CPUs are reclaimed between cases.

Stop at the **first paired difference** and retain full native/portable records.
Exit1 means a retained mismatch, not a passing implementation. A native exception,
known deferred-entry visit, failed expectation, timeout or malformed input aborts
as a probe failure, not a parity result. Unknown calls are not generically rejected.
No retry or scope expansion without examining a failure.
An independent reviewer must inspect the witness before runtime implementation.

## Reproduction after preflight approval and lane grant

The next execution requires the corrected source review and a new coordinator lane.
From this isolated worktree, use the absolute Python/Node paths after that verified
restoration. Recheck all original inputs and tool hashes; the fingerprints below
describe the pre-reset readings, not proof that current tools were recovered.
Set `PYTHONDONTWRITEBYTECODE=1`. The previously prepared bounded payload is:

```
timeout --signal=TERM --kill-after=5s 65s env PYTHONDONTWRITEBYTECODE=1 \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  scripts/check-native-mission3-raid-allocation.py \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe \
  --node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node
```

Wrap this payload with existing `scripts/orchestration/command-receipt.mjs`, using
a fresh receipt path under `work/orchestration/mission3-raid-allocation/`.
Attempts1/2 are already retained and must not be overwritten. Pass both new scripts,
fixture, `scripts/decomp.py`, original EXE/script/geometry, env.sh, resolved Python
and Node binaries, Unicorn shared library and package metadata as explicit inputs.
The receipt retains exact HEAD/diff/input hashes and stdout/stderr. Its expected
first mismatch is a **failed** receipt with a structured mismatch report, not PASS.
Use a new attempt path if a later reviewed change authorizes another execution.

## Frozen fingerprints

SHA256:

- Current harness: `d010174c235d69f1a7fc3aa80ab1b00b3fde80e83fec9267d36d6427d0299d4b`
- Corrected shared loader: `0a4783a8ee924c52e1125a5df3e4e625b3ab00835e848a2013e444bcfd979c2e`
- Current pair adapter: `b43e835fc839cb9a82bc7332e58ecb88f18654d11910dd13aae1fa32c13b96dc`
- Fixture JSON: `da7c1916549335e2f731162b971533910e576f79736aee9850529e00a960c27a`
- Supplied48attribute bytes: `c471187cb56bb6c813c4941ccd617c432e3b7634e96a26b35057371ba580bfc3`
- Exact12552-byte program: `47425726a56232467e042d5ef7e33f7f5f40d1362164c7fbe481ec9bce26a930`
- EXE: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
- CPSCR012: `d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`
- Object bank2: `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`
- Shapes: `ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849`
- Imported shapes JSON: `0d0fcd2252efe0bae7cbb9a7f3a9acc4f6f0bb7a6e6e83eb5fe4e34ec247e094`
- Python3.12.14 binary: `fa67443527ed9647f760d807e2a38f26340757123e643c4639cf273ed15d5ea7`
- Node24.19.0 binary: `bc17c508ffeed0ec622934f9b7fa72f8e78da65350e63c3eceb56fa688aa5e12`
- Unicorn2.1.4 shared library: `ddb196ec82b52e502c18e4a34478bf7b9f61c83c2ebaa95c74d8ded45a95da9c`
- Unicorn package metadata: `ce96de4160dc06c1bbcf35074cb542c9f296219f740aa0f34606f8837650c2e8`

Before reset, prepared-source verification with Python AST parse without imports
and Node `--check` passed. Tool version-only queries ran. Native/portable adapter execution,
the five paired cases, natural simulation and browser checks are **not run**.

## Attempt1 and the bounded correction

On source69c94543ecda1e53ce7ba5632888e7442347970b, attempt1 ran once on CPU4
from03:42:31.749 to03:42:33.024 UTC. All original input and Python/Unicorn/Node
hashes matched the pre-reset fingerprints, and the source-bound receipt's before/
after identities matched. Exit1 was **setup failure**, not a gameplay mismatch:
stderr was `Could not allocate dynamic translator buffer`; stdout was empty.
The portable subprocess returned successfully before native setup, but its result
was still in process memory and was not emitted, so no paired observation is claimed.
No original instruction result was produced. The prior paragraph's not-run status
describes source preparation before this attempt; natural/browser checks remain not run.

Raw receipt and logs are retained under
`references/verification/mission3-raid-allocation-2026-10-06/attempt1/`.
Receipt SHA256 is`c7c0e521aa40b62bad8423c57282f08c4678bc333041ebf308db70cc27467b63`.

Read-only inspection of the pinned installed library explains the failure:
`tcg_exec_init_x86_64` at library address0042f960 defaults to0x40000000bytes,
then mmap at0042fa2a reserves that whole1GiB. Python plus the PE cannot fit beside
it under a total1GiB virtual-address limit. This is a virtual reservation, not a
claim that1GiB of resident RAM was used. The same library's control13 writer at
003c68c0 stores the requested size before initialization. The shipped header
documents `UC_CTL_TCG_BUFFER_SIZE`; the Python wrapper supplies
`ctl_set_tcg_buffer_size` and its readback. The correction requests16MiB before
the first `mem_map` without changing fixture values, original instructions,
interceptions, task/target comparison, or CPU/time/address-space bounds.

Pinned control-source hashes:
- Python wrapper: `62ffe84341f4288e309040e06555b81798031817d32fd19a945e250813f872f0`
- C header: `66fdf8f39df34e507a163eb550549669cec3399c2103b8dc84bc4131f600e55a`

Corrected source AST parsing passed without imports or original execution. Retry
is not yet run. Use a fresh `attempt2.json` receipt if independently approved.

## Attempt2: first bounded mismatch, no runtime repair

The preceding correction proposal was independently accepted and executed once on
source `da998fa10559fcc35532943df520a447096c06ac`, CPU4, from03:47:07.167
to03:47:08.496 UTC. Receipt and raw stdout/stderr are under
`references/verification/mission3-raid-allocation-2026-10-06/attempt2/`.
Exit1/receipt **failed** is the intentional first-mismatch stop, not a passing
implementation. Stderr is empty; stdout contains both paired observations and the
native call/task/RNG records. Source and explicit input identities remained unchanged.

The nominal accepted fixture matched every projected field: slot0, type20,
phase0, building78, target/origin20018, requested3, damage8, Brave quota100,
other quotas/spells0, retreat20 and final RNG851343515. Only slot0's raw native
bytes changed; slots1..9 stayed byte-identical. This is not ordinary gameplay or
general target-geometry equivalence; the apparent inside/display-origin difference
did not produce a different packed cell in this fixture.

The second fixture differs only by disabling state20. Native executes the same
script/ATTACK request, calls004627f0, then writes failure status1 through0048c650.
It does not call either target selector, allocate a task, or write RNG. All ten
raw task slots remain byte-identical and all48attributes are unchanged. Native RNG
stays305419896 (the supplied0x12345678 seed).

The real portable adapter also allocates no task, but `campaignAttackTarget` runs
before `requestAttack`'s state gate and advances RNG once to851343515. The only
compared mismatch field is `rng`. Both occupiedUnchanged values are true; neither
of these first two fixtures contains an occupied slot, so that boolean is vacuous
here and the raw whole-pool check is the substantive preservation evidence.

Actual TCG buffer readback is16,777,216bytes in both native CPUs. Setup VmSize is
94,096/102,304kB and VmRSS31,516/31,912kB. These establish the bounded setup ran;
they are not hardware or gameplay performance claims.

The original run stopped before the cap/full-pool/last-slot cases, exactly as
reviewed. Their portable subprocess results were not emitted after that stop;
there is no paired result for them. Native recruitment, original world-list creation,
path/combat, natural campaign occurrence and rendering remain untested by this
slice. The state20-off request is controlled; do not claim Mission3's authored
script naturally disables state20. Runtime repair requires independent witness
review and a bounded accepted scope before implementation.

## Frozen supplemental gate plan

Independent review accepted attempt2's bounded witness, including exact raw pool/
attribute preservation and its controlled scope. Before any production repair,
the coordinator requested a single run of only the remaining three already-frozen
cases. The new `--remaining-gates` switch selects fixture entries2..4 in both the
native harness and actual portable adapter: one active raid at authored cap1,
full queue, and last-free-slot. It introduces no fixture, actor, RNG or gameplay
change. Earlier nominal/state20 observations retain their existing source labels.

This supplemental mode retains every paired difference across those three cases
instead of stopping at the first one. It still aborts exceptions, known deferred
controller/recruitment entry, failed native expectations, malformed input or
resource limits. There is still no exhaustive unknown-function-call guard.
No reproduction of the first two cases is part of this mode.

Resource and intercepted-consumer contracts are unchanged. Maximum original work
decreases to three initializations plus three block calls. Use the same CPU4,
65-second TERM/5-second KILL payload with `--remaining-gates` appended, fresh
`work/orchestration/mission3-raid-allocation/attempt3.json` receipt, and current
source fingerprints. Differences return exit1 and a structured mismatch report;
the command receipt must remain failed, never promoted to PASS.

The raw report's historical `sourceHead` field is the fixture/runtime base89e6860,
not the executed harness commit. A new explicit `sourceHeadMeaning` labels that
distinction; the outer receipt is authoritative for executed HEAD and dirty diff.
The supplemental source passes AST/Node syntax inspection only and is **not run**.
It needs source preflight acceptance and a new coordinated execution grant.

## Attempt3: complete declared gate scope

After exact-source review and the coordinator's separate CPU4 grant, source
`ce9dc4bcabfb5ee55ed4c82170125df0fdff2452` executed the three unchanged suffix
cases from03:51:32.117 to03:51:33.530 UTC. Fresh attempt3 is retained under
`references/verification/mission3-raid-allocation-2026-10-06/attempt3/`.
Receipt SHA256 is`c448edc0df82cb674da9c6e05941857c6077fcf4ecafad004b1e2ee2c943ddca`.
Receipt status is **failed**, exit1, because the structured report retains actual
paired differences. Stderr is empty, and source/input fingerprints remain identical.

- **One active type20, authored attribute25=1:** Native gate/count rejects before
  free-slot/target search and writes status1. No native task bytes or attributes
  change; RNG stays305419896. The port allocates a second raid in slot1 and advances
  RNG to851343515. Both occupiedUnchanged booleans are true, now non-vacuously.
- **All ten slots occupied by other task types:** Native passes the type20 gate,
  finds no slot, writes status2, and performs no target/RNG operation. Both sides
  allocate no task and preserve all occupied tasks; only port advances RNG.
  All820native task bytes remain identical.
- **Only slot9 free:** Both sides allocate the same slot9, entity78, target/origin
  20018, request3/damage8/Brave-only quota, no spells and one RNG step. Every
  projected field matches; only slot9 native bytes change, while slots0..8 remain
  byte-identical. Both occupiedUnchanged values are true.

All three actual translator buffers read16,777,216bytes. No additional case,
hook, original controller, recruitment consumer or ordinary mission observation
was included. Witness review is pending; no production code has changed.

The minimal proposed correction stays at Mission3's existing ATTACK adapter:
after the current argument validation and before target lookup, reject disabled
state20, active type20 count at/above attribute25, or no inactive task slot. Supply
attribute25 to the existing task allocator instead of the tribe number. Keep
other mission adapters, target/recruitment geometry and the script itself outside
this slice. Acceptance should replay these same five paired cases, add a controlled
live-adapter regression, retain the current ordinary raid/checkpoint test unchanged,
then complete relevant standard/native/rendered gates and independent code review.

GitHub issue165 is closed/completed for producer scheduling. Repository issue
search found no open narrow raid-allocation owner. A new bug linked to165/8 should
record the accepted witness and own this repair; it must not reopen the completed
natural-victory scope of issue2 or imply full early-mission AI parity.
