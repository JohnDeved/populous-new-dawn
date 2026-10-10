# Selection radius: accepted static contract

This source-only checkpoint belongs to [issue 256](https://github.com/JohnDeved/populous-new-dawn/issues/256).
It preserves the accepted producer/reset/math contract at product source
`b2213c221f9037573093ccdf4248c0d081b806bf`, equivalent to merged main
`3b13a7ff534ab95797b0b06330055cead956160d`. No runtime, test, parity, or fixture
change is included. No original instructions were executed or emulated.

[Manifest](manifest.json) binds byte-for-byte copies of the local artifacts.
[Independent review](source-review.json) accepts the named source/math contract
and compatibility direction, while holding runtime admission on the remaining
building-list correspondence. Its SHA-256 is
`f9fce35603542b8831db84d6270b68c563612cc809466a141dfb97a480e0a319`.
The [frozen contract](contract.json) predates that review; the review resolves its
then-pending decisions without rewriting the original artifact.

## Bound source and arithmetic

- Canonical EXE SHA-256:
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
  [Decoder manifest](code-manifest.json) records GNU objdump 2.44 identity,
  exact commands, byte ranges, input stability, and output hashes.
- [Delta leaf](delta.asm): `00461d40–00461d70`, 48 bytes.
  [Producer](producer.asm): `004615f0–004617de`, 494 bytes.
  [Square-root leaf](sqrt.asm): `00586000–00586074`, 116 bytes.
- The actual producer zero-extends base/building coordinate bytes. Building high
  bytes are masked even; the stored base is not newly masked. Each wrapped delta
  is `min(abs(a-b), 256-abs(a-b))`, including 128. Squared distances range from
  0 to 32768; axes are not halved before squaring.
- Instruction `00586011` binds the [first 32 seed bytes](seed-table.json) at
  `00586034–00586054`, file offsets `1593396–1593428`. Sixteen little-endian
  words suffice for the proved input domain. The positive seed and descending
  integer Newton loop produce floor square root.
- [Pure host arithmetic](static-arithmetic.json) compared all 32,769 inputs
  with `math.isqrt`: zero mismatches, maximum three updates. This is static
  mathematical equivalence, not a native run or gameplay test.

## Producer, reset, and consumer

`004615f0` updates only when its internal `(counter + signed tribe + 13) & 63`
predicate is zero and the established-base byte `+0x5b4` is nonzero. It scans
the entire tribe `+0x885` list through node `+8`, starting its squared maximum
at zero, then computes:

`candidate = floor(isqrt(maximum) / 2) + unsigned attribute14`

It compares the old unsigned `+0x36c` byte with the full candidate, and writes
`candidate & 255` only when the old value is smaller. There is no clamp:
candidates 256–345 wrap to 0–89. An empty established-base list still contributes
the margin. No RNG call occurs in this block.

`00461d70` clears this byte at reset, separately from script defence radius
`+0x5be`. `004c6da0` phase 3 clears it at the first valid ordinary base
establishment, preserving the exact-request, existing-base, and plan-validity
gates. `004f55d0` consumes the stored/established center and this native byte;
the current selection adapter instead uses script defence fields and a live
Shaman fallback. The contract enumerates the five qualifying current callers.

The maintained `computerPhase` radius visit is an available integration point.
Its matching internal predicate does not prove original invocation cadence or
wall-time equivalence.

## Accepted compatibility direction and remaining boundary

An explicit valid saved byte, including zero, can retain modern history.
Fresh zero must be scoped to supported authored M1–3 owners. A legacy checkpoint
with no established base may use an explicitly labelled zero-initialization
compatibility rule. An established-base checkpoint, including base zero, with
missing history must retain the complete previous center/radius adapter and
skip native accumulation. Present buildings cannot reconstruct a historical
maximum. Malformed saved values still require an explicit tested rule.

Runtime admission remains blocked on the exact `+0x885` membership and position
projection: plans, incomplete buildings, deactivation, retirement, and snapshot
timing must correspond. The radius loop itself adds no class/model/HP/state
filter. A newly identified retained lead is `004ecac0`, which rebuilds the tribe
list; its admission and relative call order require their own review. Accepted
Swarm cell/global allocation ownership must not be mistaken for this list.

Universal writer/alias/native binary-save history, original caller cadence,
ordinary distinguishing selection effects, and runtime implementation remain
unproved. This checkpoint requires no merge PR or product dependency.

## Reviewed membership follow-up

The [partial membership review](membership/review.json), SHA-256
`d19267857bd09da6767238ddb068f578ce3046c057db733da540b0e1a06624e0`,
accepts these additional source boundaries. The earlier assessment remains
unchanged in [its original form](membership/assessment.json).

- `004ecac0` rebuilds the own-tribe list from active class-2 allocations,
  excluding models 18/19. Incomplete class-2 buildings belong; class-9 plans
  belong to a separate list. No HP, completion, or state filter admits members.
- `004ec6f0:128` rebuilds after object processing, followed by epilogue work.
  `004a5590` calls the next tribe visit before its next object turn. Membership
  therefore comes from the preceding rebuild, while coordinates are read from
  those retained members at consumption. Initial rebuild is `0042b230:82`.
- Plan allocation and Hut replacement supply constructor metadata, and
  `00403610` resolves model-origin geometry before returning. The port's
  `buildingPosition(buildingPose(b))` supplies those coordinate values.
- The [bounded delayed-plan decode](membership/plan-activation/findings.json)
  distinguishes old-plan state initialization `004b8a74 → 004ed640` from new
  building activation `004b8a94 → 004ed580`. The latter sets active bit
  `0x20000000`. The canonical byte window is 1,752 bytes; the interpreted
  successful-allocation tail is 93 bytes. No original instructions ran.
- A shallow array of Building references can represent retained membership
  and current coordinates without the full physical-ID allocator. Removed
  references must remain readable; an in-place port upgrade must occur before
  the applicable rebuild. [Modern Save/Load preserves these graph aliases](membership/modern-alias-audit.md).
  Missing legacy membership is not recoverable from surviving buildings.

**Runtime remains on hold:** ordinary Mission 2 Tornado grants and casts are
retained in the [Tornado instruction](../mission2-message-103.md) and
[ordinary controls observation](../../../references/verification/mission-two-controls-2026-10-04/README.md).
The latter retains a failed checker envelope, despite its bounded observed
gifts/casts. `tornado-runtime.ts:87 → damageDisasterBuilding` immediately
clamps HP, but its corresponding native damage/retirement tail is not yet
accepted. The current HP filter must not be declared equivalent to native
active membership. Earthquake remains a separate reachability question.

[Copied-artifact hashes](membership/copied-artifacts.json) bind this follow-up.
The [initial publication review](membership/initial-publication-review.json)
records two exact raw objdump trailing-space exceptions. Raw assembly is
preserved byte-for-byte; no clean all-files whitespace result is claimed.

## Tornado retirement closure and separate damage discrepancy

The subsequent [independent source review](tornado-retirement/review.json),
SHA-256 `43c5473526e6020bf203394c21293dc5207bf0581f89d2e1c8737d9da6cbe3cd`,
closes the named retirement tail. Three bounded data-only windows and their
exact hashes are retained in the [packet](tornado-retirement/manifest.json).
No original instructions were executed or emulated.

The [full sequence](tornado-retirement/findings.json) is:

1. Tornado class-2 admission decrements the stage byte before calling
   `004980a0(building, 1)` at `0050f898`.
2. The owner ensures a live work plan and attempts a neutral class-5/model-11
   loose-log allocation at the current building position. Only successful
   allocation applies `004ba2c0(plan, -100)`.
3. Signed work at or below zero calls `0040b130(plan, building)`. Its complete
   64-byte body cleans/retires the plan, records building loss, then retires
   the building through the already bound class-2 retirement chain.

This exposes a separate current Tornado discrepancy: `damageDisasterBuilding`
applies work loss unconditionally and does not create the loose log. Native
allocation failure preserves work while retaining the prior stage decrement.
The port can store stage and work independently; its existing loose-log
adapter is explicitly unbounded, so native pool-exhaustion parity is unavailable.
No disaster-damage change is folded into the radius work. Earthquake shares the
current adapter but has no newly accepted effect contract here.

The radius input contract may therefore use the maintained supported
active-building adapter at its genuine completed-object rebuild. Successful
work exhaustion corresponds to class-2 retirement. The adapter's existing
Tornado allocation/work history remains an explicit native-equivalence limit;
this source closure does not certify full building history or authorize runtime
changes without the separate failure-first caller review.
