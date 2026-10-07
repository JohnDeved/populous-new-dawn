# Fresh early-level class1 callback audit

Source/data audit against `e3a7a06a4250457502288d5b4c4e4ad8f3b40b53`.
No native or application execution, implementation, package work, or browser run.

**Finding:** the selected authored-record initializer and link callbacks expose
no extra class1 creator for Missions 1–3. The 12/27/52 direct person records
remain the candidate successful class1 admission stream at loader return.
That is a source-derived result with the fresh campaign boundaries below,
not an executed full-load allocation receipt. Keep the shared accounting and
final returning-Shaman implementation blocked pending review of that distinction.

## Three different cuts

1. **Authored records:** `00484a10` executes 20 batches of 100 records, each
   55 bytes, in file order. The allocation branch is `00484edc..00485038`;
   `00485011 → 004ed8a0 → 004ed580` initializes each successful record before
   `0048502d → 00485b00` post-processes it. Allocator reset/copy/increment and
   failure behavior are already accepted; they are not retested here.
2. **Loader return:** link processing, conditional nested non-person creation,
   deactivation, roster rebuild, and per-tribe command18 initialization still
   occur. Counting the records alone does not observe these calls.
3. **Opening logical visits:** command18 later produces the opening wave;
   `0050c840 → 004d7fd0` can allocate a replacement brave for a wild person.
   These are additional class1 admissions after loading. They cannot be folded
   into the authored ordinal or omitted from a later shared seed owner.

The fresh wrapper is `0042c790` (header-selected load), or `0042b590` with explicit
level/bank/flags: both call `0042bfa0` reset before `0042b230 → 00484a10`.
The accepted reset slice `0042bfe7..0042bffe` zeros 12 class seeds, including
`0096eac2`. Ordinary campaign mode has `land_flags_1 & 8 == 0`, a fresh load
without `load_level_flags & 0x200`, and no prior live objects. These are required
entry conditions, not values inferred from the surviving population.

[`authored-callback-inputs.json`](authored-callback-inputs.json) retains **every**
class1 record as numeric class/model/owner, both zero-based index and one-based
file ID, plus the selected buildings, heads, links, rewards and loader skips.
All 44/81/109 nonzero record identity tuples match the current application data.
The headers supply tribe counts2/4/3 and flags0/0/0. The native filter compares
signed byte owner to tribe count: owner255 is -1 and is admitted. The six
conditional Shaman observations are:

| Mission | One-based record ID | Model | Numeric owner | Successful direct ordinal/seed |
| --- | --- | --- | --- | --- |
| 1 | 35 | 7 | 0 | 6 |
| 1 | 38 | 7 | 1 | 7 |
| 2 | 23 | 7 | 3 | 16 |
| 2 | 58 | 7 | 0 | 18 |
| 3 | 46 | 7 | 0 | 32 |
| 3 | 47 | 7 | 2 | 33 |

These are allocation bytes before a logical visit. They are not global turn
numbers, team-name mappings, or measured full-load results.

## Selected callbacks and possible creators

| Owner | Reachable early-level behavior relevant to class1 |
| --- | --- |
| `004ed580 → 004d23d0 → 004d5920` | Authored person models 1, 2, 3, 7 initialize the allocated record. Model7 registers the actual tribe Shaman handle. Ordinary state10 initialization `004d2740 → 00432260` has no orders and returns; wild post-processing enters state8/substate1. Neither is another person allocation. |
| `00403610` building initialization | Authored building models are 1, 3, 4, 7, 18. The loader supplies state2 in the 20-byte argument record. The common path uses `004030c0 → 004049d0`, cell/shape/terrain setup, then may allocate **class6/model9** from the building RNG branch. `004fc330` consumes that record, enters state7, registers geometry, and makes no person attempt. The boat models13/14 effect83 branch is not selected. |
| `004a5ef0 → 004a67d0` scenery initialization | Models1–6 have descriptor life400/state1; model9 uses state10. The conditional low-health producer `004a79f0` creates **class5/model17**, not a person; it is not selected by full-health tree initialization. Stone-head neighborhood setup `004a9030` only marks scenery, records building damage via `00409200`, or clears a plan. `00409200` does not execute a building visit or spawn occupants. |
| `004fa530` resource initialization and `00485b00` | Authored class6 models2/6 initialize reward/head records. Reward setting byte2 equal1 creates **class6/model10**; one such record exists in each mission. The model10 height/geometry helper is `004fc790`. Authored class6/model9 records in Mission2 are **skipped** at `00484f58..00484f5c`; they are not the nested building-created model9 records. |
| `00509c10` effect initialization | Mission2 has only authored class7/model24; Mission3 only model23; Mission1 has none. After `0050bcd0`, models23/24 enter states24/25 through `00401b10`. The class7 state initializer `0050a740` is a single `RET`; it does not execute the later effect processor `0050a750`. No class1 producer is selected here. |
| `00485050 → 004851e0` head-link resolution | Resolves file indices to handles, then `004fbd20` adjusts a co-located scenery head's model/animation. Its `0040cb90/0040cbb0/0040cbf0` leaves only write animation fields. All authored links here target class6/model2 or the class7 model23/24 record; none targets a person. |
| `0048506a → 004866a0` linked-head upgrade | Can allocate **class2/model18** only for a mode3 head with a linked qualifying reward and co-located scenery9. The actual head modes in these three files are0/4, so this branch is excluded. Even the candidate created object follows the building path above. |
| `0048506f → 004edf50` linked-object initialization | Removes eligible linked records from cells and initializes state0. This is deactivation, not retirement or a seed refund. The selected linked class6/7 state initializers do not create people. |
| `004850f9/0048510c → 00478c60` loader Convert Wild | Requires class7/model89. None is authored or produced by the selected callbacks above. This loader-only candidate must not be confused with the later opening wave's `004d7fd0` replacements. |
| `0042b403 → 004ecac0`, `0042b408 → 00503230` | Rebuilds rosters/tribe Shaman handles and counts existing secondary effects. Neither invokes ordinary person processing. |
| `0042b44c/45d/466 → 00419790/00419810/00419880` | Sets tribe/site coordinates and queues an **order** through `00436c20`, then initializes the existing Shaman's state10. `00432260 → 00432df0`, command18 case, sets the start flag. It does not call the command18 visit body or create the wave/person. No prison model19 is authored. |

Post-record calls retain their actual order: `004851e0`, clear each active
record's temporary file-ID field, `004866a0`, `004edf50`, clear/reapply linked
flags, then the conditional model89 scan. Primary allocations prepend, so the
selected head file IDs in the first callback are M1 **31,29,2**, M2 **64,60,26**,
M3 **102,92**, conditional on successful admissions. These are all class6/model6,
native owner0. Their links respectively are M1 **32,30,3** (class6/model2,
owner255), M2 **63,61,27** (6/2/255, 7/24/0, 6/2/255), and M3 **104,93**
(7/23/0, 6/2/255). Reward records **3,27,93** make the class6/model10 attempt
with allocation owner0; its initializer then stores owner255. The post-load
tribe loop runs numeric owners ascending (0..1, 0..3, 0..2); owners without a
Shaman return before allocating an order.

The terrain queue `0044ddf0 → 0044df40` updates terrain/texture data; it is not
the world traversal `004ec6f0`. The post-load `0048c620` clears script storage;
the adjacent script interpreter `0048c6b0` is a different function. The
`0042b230` multiplayer-only `0041c140` branch and level>5 reward branch are
outside the stated fresh Missions1–3 conditions.

The selected original class/model/state dispatch targets have been resolved;
there is no unidentified indirect **person creator** left in this narrowed
initializer inventory. The complete Windows file/audio/graphics import closure
is intentionally not certified. For example, model24's `0048a050` sound calls
reach their separate sound allocator and `GetTickCount`; their device/import
state is not supplied by this source audit. A later game-only fixture must name
that boundary and cannot claim the entire loader's RNG or OS behavior. The
record callbacks, argument stack, native pool success and final ordered returns
have not yet been executed together. Those are the remaining composition checks,
not evidence that an unidentified nested person has been observed.

## Current application and prior evidence

At the pinned main, `app/world-initialization.ts:149` admits authored people via
`world-state.ts:addUnit`; `world-initialization.ts:489` calls
`initializeLevelStart` and returns. These functions are unchanged from the prior
`1c7e6b05` audit. `level-start-runtime.ts:89` still derives each Shaman's byte
from its authored person ordinal; line180 performs later opening-wave replacement.
`addUnit` still returns `native:null`. There is no shared class1 next-seed owner.

This narrows the unmatched-startup-callback stop in
[`0a9c1605`'s phase plan](https://github.com/JohnDeved/populous-new-dawn/blob/0a9c1605db452f1af7ace247f6971ab76bb167c2/references/verification/reincarnation-class1-phase-plan-2026-10-06/README.md).
It does not change
[`58c5afd6`'s post-birth prerequisite](https://github.com/JohnDeved/populous-new-dawn/blob/58c5afd665d2dc63758d5025cceaeaa23e68fc46/references/verification/reincarnation-class1-prerequisite-2026-10-06/README.md):
successful future replacements, failed admissions, newborn visit eligibility,
the three live counter overwrites, Angel's class1 identity, Hypnotise reversion,
and checkpoint history still need the bounded shared contract. The accepted
eleven-call native reincarnation timeline supplies later person processing and
does not establish a full world after birth.

The prior class7 authored-contribution probe explicitly supplies all model
initializers and post-processing and returns failure for other classes. The
accepted creation/control/scheduling packets supply their initial pool/person
state. None is a full-load receipt. Reuse their allocator and return/failure
facts; do not relabel them. Current main has already corrected burst pitch/yaw
in `app/level-start.ts`; that earlier producer mismatch is not reopened here.

## Smallest remaining acceptance

The concrete missing evidence is an **executed ordered admission receipt across
the selected real loader callbacks**, including class1 seed writes and final
per-tribe initialization. No additional class1 creator has been identified that
requires a new allocator design. Source-only review can decide whether the
conditional callback closure above is enough for the narrow phase-owner proposal;
it cannot be presented as an observed successful load.

If a composed native receipt is required, prepare three closed fresh cases,
one each for the already hashed Missions1/2/3. Each executes exactly the 2000
record branches in file order with real `004ed8a0/004ed580/00485b00`, then the
three real link callbacks and the actual roster/site/order initialization chain.
Stop before the first `004ec6f0` traversal. Observe every primary allocation's
caller/depth/class/model/owner/return and class1 seed copy/increment, including
non-person nested allocations and failure/argument cleanup. Check the predicted
12/27/52 successful class1 records and the six Shaman bytes only as expectations,
not fixture writes. Observe the zero-entry seed via the accepted reset owner.

File delivery, model/animation tables and presentation leaves need an exact
source-reviewed supplied-state manifest; terrain/cell/list/state callbacks that
can affect admission must remain real. Use the established bounded supervisor,
fresh outputs and fail-closed calls. Freeze concrete per-case instruction/time/
memory and allocation limits before any grant. Do not execute the OS loader,
add a later logical visit, sweep capacities, retry unexpectedly, or change app
allocation policy. Mission2 is the useful first case (wild people, building
facade branch, reward icon, linked effect); it alone cannot certify Missions1/3.
