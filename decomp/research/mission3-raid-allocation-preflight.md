# Mission3 raid allocation: PhaseA source preflight

Status: attempt1 setup failed; bounded translator-buffer correction prepared.
Runtime base is
`89e68606a406f93715b930550317519818ddc081`. Only the two evidence programs,
controlled fixture, and this note are added. Recruitment PhaseB, gameplay repair,
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

Wrap this payload with existing `scripts/orchestration/command-receipt.mjs`, output
`work/orchestration/mission3-raid-allocation/attempt1.json`. Pass both new scripts,
fixture, `scripts/decomp.py`, original EXE/script/geometry, env.sh, resolved Python
and Node binaries, Unicorn shared library and package metadata as explicit inputs.
The receipt retains exact HEAD/diff/input hashes and stdout/stderr. Its expected
first mismatch is a **failed** receipt with a structured mismatch report, not PASS.
Use a new attempt path if a later reviewed change authorizes another execution.

## Frozen fingerprints

SHA256:

- Corrected harness: `682244ce84837a737c49388d66f6ece96ea4ac8cd728ed11bba9555794f8a5dd`
- Corrected shared loader: `0a4783a8ee924c52e1125a5df3e4e625b3ab00835e848a2013e444bcfd979c2e`
- Pair adapter: `7bbe07e5dad4275cc33ba843b63d6089bd826aee1e173969c23265d15b4172af`
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
