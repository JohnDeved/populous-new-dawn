# Authored Erosion activation boundary

Independently reviewed ACCEPT, 2026-10-05; see `review.md`. No production edits or parity claim.

## Question and bounded finding

Does the real Mission 3 authored Erosion reward execute once inside its head's
activation, before a later scheduled visit, and how does the current browser port
order that first step?

The supplied-state composition supports **one immediate native Erosion processing
call during activation**, followed by one call on the next scheduler traversal.
There is no additional same-turn scheduled clone visit. The current port's actual
Mission 3 shrine creates remaining64 at the end of the activation turn and first
processes it on the next turn. With the exact same declared terrain/seed, its first
two Erosion calls match all native heights and RNG; their activation boundaries
are one processing visit apart. This is a reviewed bounded activation-order difference.
It is not a captured ordinary native gameplay run
or proof of the full engine's mixed-class cadence.

## Source and actual inputs

- Clean detached worktree `erosion-activation-proof` at
  `10f168733815921070621842d8c025f35715a56d`.
- Original EXE SHA256
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- `levels/levl2003.dat` SHA256
  `eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf`.
- DAT zero-based head row101 links token104, therefore reward row103, class7,
  model23. Do not mistake the DAT index, one-based DAT link token, browser ID or
  supplied native pool index for the same identity. The native pool in this proof
  gives head640, template641, clone642.
- Authored reward x/y: unsigned63744/35072. Real native grounding on supplied raw
  DAT heights yields h814. Port's actual shrine target resolves to the same center.
- Raw source bytes and all 16,384 initial heights are frozen in
  `authored-input.json`. Full source/input fingerprints are in
  `source-input-manifest.json`; versions in `tool-versions.txt`.

## What executed

Actual native allocation `004ed8a0`, model initializer dispatcher `004ed580`,
Erosion constructor `00509c10` including baseline `0050bcd0`, tile insertion and
height calculation, authored field decode `00485b00`, head link resolver
`004851e0`, post-load scan `004866a0`, linked-template suspension `004edf50`, and
the loader's template-flag segment `00485074..004850d2` execute.

The constructor's head reset is consumed by an actual `004ed700` visit. A supplied
completion bit then enters original scheduler `004ec6f0` with the two-object world.
It calls the head, which allocates and clones through `004fb270→004ed8a0→004ede10`,
then immediately dispatches `004ed700→0050a750→0050ff30→004983a0`. Original head
and template removal executes (lighting cleanup intercepted). The allocator
prepends the clone; the original allocated-list loop uses its cached successor,
so that clone is not revisited by the same traversal. The next real outer traversal
visits it once.

Machine-code check: allocator instruction `004edaa5` is `e8 d6 fa ff ff`, a direct
call to `004ed580`. Retained `004ed8a0.c` calls that target “init_unit_class”, while
other exports use that label for `004ed640`. The address/bytes, not that inferred
name, establish this constructor path. Relevant frozen disassemblies are
`allocation.asm`, `loader-tail.asm`, `load-init-units.asm`, `class-init.asm`,
`effect-class-init.asm`, `effect-baseline.asm`, `copier.asm`, `head-dispatch.asm`,
`scheduler.asm`, and `erosion-controller.asm`.

## Exact state observations

| Boundary | State | Remaining | Flags2 | Flags3 | Flags4 | RNG | Changed heights from input |
| --- | ---: | ---: | --- | --- | --- | ---: | ---: |
| Authored reward allocated/decoded | 24 | 64 | 0x10020000 | 0x4 | 0x20000000 | 305419896 | 0 |
| After original template suspension | 0 | 64 | 0x10000000 | 0x4 | 0 | 305419896 | 0 |
| After loader marking / before clone | 0 | 64 | 0x10000000 | 0x4 | 0x40000000 | 305419896 | 0 |
| Fresh clone allocation | 24 | 64 | 0x10020000 | 0x4 | 0x20000000 | 305419896 | 0 |
| Immediately after copier | 24 | 64 | 0x10020000 | 0x4 | 0x60000000 | 305419896 | 0 |
| After immediate processor / activation traversal | 24 | 63 | 0x10020000 | 0x4 | 0x60000000 | 1317931103 | 46 |
| After first later scheduler visit | 24 | 62 | 0x10020000 | 0x4 | 0x60000000 | 2870622653 | 65 |

Copier preserves the new allocation's state and class counter, so suspended
template state0 does not prevent processing. It preserves the allocation-owned
flags4 bit0x20000000 while copying the template's other flags, including
0x40000000. State24 dispatch has no template-bit exclusion.

`attempt02.json` contains full 179-byte object snapshots, changed-height vectors,
all terrain hashes, RNG, caller return addresses and intercepted call events.
`004ed700`'s immediate return address is `004fbb87`; the later scheduled return is
`004ec8bb`. Class counter is1 at allocation and immediate processing,2 at the next
scheduled visit. The hash over little-endian 16-bit heights is:

- Input: `5646f3ecfc50b22a46fd403f4838727ef0a2baeb2428cb54f2d511f0a4185269`
- First step: `d503cb3d3f4ec9091ed26d2b67bd0a373a5ecc4c0a84840e906f7690d02fa9a6`
- Second step: `dc9f487ed787a37dda89659c074980aa87084b9e231ec66b8832d34c9d8f0c2d`

## Port comparison

Static source at this exact head: `app/world-turn.ts:563` captures the current
effect count, `:663` steps existing Erosion, then `:928` creates authored shrine
Erosion using `createErosion`, whose initial remaining value is64. The creator
contains no immediate Erosion processing call. `app/world-initialization.ts:248`
selects the class7/model23 linked reward and preserves its authored target.

`port.mjs` additionally executes the actual `createWorld(3)` shrine and `tick` with
the documented supplied world. Results in `port01.json`:

- Activation turn1: remaining64, initial RNG and every terrain height unchanged.
- Turn2: remaining63, first-step native RNG and all heights identical.
- Turn3: remaining62, second-step native RNG and all heights identical.

The standalone `createErosion→stepErosion` comparison matches the same native
per-call results. Audio callbacks are only request observations, not playback.

## Supplied and intercepted boundaries

Native setup supplies raw DAT heights with zero terrain flags, seed0x12345678,
eight free pool records, no unrelated actors, normal-mode level_flags0, and the
completion bit after reset. These are declared test inputs, not recovered dynamic
ordinary-play startup state. Only the linked head/reward graph is loaded. The
complete OS loader and earlier full-terrain initialization are not executed.

Common intercepted leaves: `004fbd20` head presentation, `0044fad0` post-load
terrain refresh, `0048a050` sound request, `0044ddf0` terrain queue notification,
`0044f2f0` terrain dependent-unit notification, `004ee190` deletion lighting cleanup.
Unrelated outer calls are supplied as no-ops and listed exhaustively in
`attempt02.json.schedulerSuppliedCalls`. Allocation, constructor, template state,
copier, head/class dispatch, inner Erosion arithmetic and allocated-list traversal
are not intercepted. Raw argument dwords preserve upper register residue for
short/byte arguments; cell IDs use the low16 bits.

The audio interceptor returns zero and does not set flags4 bit0x10. In the full
engine `0048a050` sets that bit when accepting a sound allocation and `0048ad50`
clears it after final owned sound release. Repeated intercepted sound requests
here prove no audio cadence. No backend composition was attempted.

Port setup retains the actual authored shrine but clears units, vehicles,
buildings, trees, effects, gifts, projectiles, marching, combatMarches, fights,
replants and levelStart. It supplies gameFlags34 to suppress unrelated AI/tribe
and outcome work, zero land flags, initial terrain, identical seed, and
reset=false/forced=true. These masks are test scaffolding, not a claim that native
and browser global mode flags are equivalent. The scope is creation/order and
per-step controller outputs for this supplied world.

## Reproduction and failure-first receipts

Attempt01 used copied formation-test level_flags32, which the original head
correctly treats as an early-return gate. It failed the reset assertion before
activation. `attempt01-probe.py`, `attempt01-inputs.sha256`, `attempt01.json`,
`attempt01.log` and `attempt01.exit` preserve this failure (exit1). No instruction
budget was widened. Only level_flags was corrected to0 for the next authorized run.

Successful native invocation, CPU4, timeout60s, exit0:

```sh
source ../prerequisites/env.sh
timeout 60s taskset -c 4 "$POPULOUS_PYTHON" work/orchestration/erosion-activation-proof/probe.py "$POPULOUS_EXE" --output work/orchestration/erosion-activation-proof/attempt02.json
```

Frozen source `attempt02-probe.py` matches `probe.py`; source/input hashes,
stdout/stderr and exit are `attempt02-inputs.sha256`, `attempt02.log`,
`attempt02.exit`. Unicorn executes only the bounded instruction slices; the
original Windows executable is never launched.

Successful port invocation, CPU4, timeout30s, exit0:

```sh
timeout 30s taskset -c 4 node work/orchestration/erosion-activation-proof/port.mjs ../prerequisites/game/levels/levl2003.dat
```

Port source/input hashes, stdout/stderr and exit are `port01-inputs.sha256`,
`port01.log`, `port01.exit`. No browser, package install, build, fixture recording,
profile change or production change occurred.

## Next decision and compatibility boundary

Fresh independent review accepted the executed chain and supplied-state claims
in `review.md`. A later targeted gameplay change would need to execute the actual
first terrain/RNG/notification step at the proved activation boundary; merely
changing the initial countdown would be incorrect. Ordinary browser acceptance
and mixed-class interactions would remain necessary for that implementation.

The separately owned passive recorder currently arms at an afterTurn boundary
with remaining64. That matches present port behavior. An eventual immediate-step
repair would move the first Erosion work before that observation and require a
pre-activation capture boundary. The recorder owner has been informed; no edits
were made to that worktree.

Proposed durable integration, after review: a reusable bounded probe under
`scripts/`, a concise `decomp/research/` note indexed in the existing evidence map,
and only missing useful exports if needed. This scratch proof adds no gameplay or
parity credit.
