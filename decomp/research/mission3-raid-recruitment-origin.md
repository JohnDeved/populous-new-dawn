# Mission 3 raid first-selection origin: source-only preflight

The accepted plan now has a separate [two-pair probe preflight](mission3-raid-recruitment-preflight.md).
It records unequal radius inputs honestly and stops incremental pairing at the
first declared difference. The separate [executed origin witness](mission3-raid-recruitment-witness.md)
retains its controlled limits; no runtime repair is included.

## Finding and boundary

On source `89e68606a406f93715b930550317519818ddc081`, the live type-20
adapter supplies different fields from original `004cb400` phase 3. The fields
are not aliases. This is a concrete source-level adapter discrepancy on the
implemented Mission 3 raid path, not a demonstrated change to naturally selected
raider identities. No native or portable gameplay execution occurred for this note.

The source-only preparation is isolated from the accepted raid-admission repair
at `64c47960f718b76ac8680f39f296c8acf0c4d2a4` and
[issue 227](https://github.com/JohnDeved/populous-new-dawn/issues/227).
That repair changes pre-target admission/RNG behavior, not this selection caller.
Do not broaden its scope or reopen its five accepted paired cases.

Artifacts are in
[`references/verification/mission3-raid-recruitment-origin-2026-10-06/`](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/).
The disassemblies are bounded static reads of the supplied canonical EXE,
with trailing whitespace removed for review; original stdout hashes are retained. They are
not new Ghidra exports, executed traces, or recovered original source.

## Exact ownership and units

| Meaning | Original storage and owner | Current port |
| --- | --- | --- |
| Established construction base | `AI+0x5b4` selects retained packed cell `AI+0x36a`; `00461d70` clears the flag, ordinary Tower construction `004c6da0` phase 3 establishes it from `004b9fc0`'s exterior point | Optional `ComputerQueue.constructionBase`; already written by ordinary Mission 2/3 construction phase 3 and retained in checkpoints |
| Fallback Shaman cell | `AI+0x5a2`; `004f6020` returns it while `+0x5b4==0` | Living Shaman position, converted to an even packed cell |
| Script defense position | Opcode 1038 (`00492c30`) writes `AI+0x46e` and `AI+0x596` bit `0x100`; its state gate is `AI+0x59a` bit `0x400` | `flags & 0x100` and `defencePosition`, correctly owned by `campaignCommand` |
| Base eligibility radius | Byte `AI+0x36c`; reset to zero when the base is established; `004615f0`'s periodic radius branch can increase it from building spread and the profile | No corresponding base-radius field in `ComputerQueue`; `computerSelectionWorld` instead passes `defenceRadius` |
| Script/territory defense radius | Byte `AI+0x5be`; initialized to 11 by `00461d70`, written by opcode 1196, used for building territory | `defenceRadius`, initialized to 11 and written by opcode 1196; the existing computer/territory probes bind this field |

Cells pack unsigned coarse X in the low byte and coarse Y in the high byte.
Person/base conversion masks both axes even. Each terrain cell spans two coarse
coordinate units. Ranking uses wrapped Manhattan distance in coarse units.
Eligibility leaf `004f55d0` uses `0049c720`'s squared wrapped distance after
halving each axis, compared inclusively with `(+0x36c)^2`: this radius is in
terrain-cell units. It is not the separate territory-radius setting, even when
the numeric values happen to agree.

The actual type-20 block in `app/computer-runtime.ts` chooses its staging cell
from script defense flag/position, otherwise the Shaman. `computerSelectionWorld`
also maps `hasBase`, `base`, and `radius` to those script fields. Consequently
both nearest-person ranking and defending-order eligibility receive the wrong
native field ownership. The existing `selectComputerPeople` helper already
implements the documented ranking and eligibility rules for correctly supplied
inputs; this note does not propose replacing it.

## Actual Mission 3 entry and source facts

The shipped Mission 3 adapter runs CPSCR012 words `796..<833`; the accepted
allocator creates type 20 with requested count 3 and quotas `[100,0,0,0,0,0]`.
`stepComputerTasks` dispatches that task to `stepAttackTask`, whose first phase-3
visit calls the actual world selector for three model-2 Braves. Existing natural
tests reach this path through births, building, training, and the authored raid
opportunity. They verify three Braves, commands, combat and checkpoint continuity,
not their original-versus-port selection identities.

Static inspection of the entire imported program finds exactly one 1038 token,
at code word 20: `1038,5,6,1022`, with literal fields 5=252 and 6=100. Thus the
authored script enables defense position `0x64fc`. It contains no opcode 1196.
The shipped raw level's Chumara Shaman record 46 starts at native X=`0xdb00`,
Y=`0x6100`, giving even cell `0x60da`. These inputs already distinguish script
defense from the unestablished-base fallback. The first ordinary Tower later
writes a retained construction base; the current port explicitly includes
Mission 3 in that phase. The Shaman is mobile, so it is not an invariant alias
for that retained point either.

These startup coordinates are useful controlled inputs, not a claim that the
raid naturally happens at startup. The authored raid requires Blue Warriors >2,
Blue population >30 and Chumara population >25. The first real raid's current
Shaman/base/radius, candidate records and native list order have not been captured
as a matched original world. Do not infer its selected IDs from startup data.

## Original visit and selection semantics

The retained machine-code range binds the following, beyond pseudocode:

- Entry `004cb400(ai,slot)` handles normal subtype `task+0x26==0`. It increments
  task visit counter `+0x08`, then phase-3 jump-table entry `004ccac4+3*4`
  dispatches to `004cb592`.
- At `004cb59a`, original `004f6020` executes to obtain the origin. It does not
  read the script defense flag/position. Phase 3 increments byte cursor `+0x25`
  while skipping zero quotas. The first Mission 3 visit reads Brave quota byte
  `+0x48`, multiplies signed requested count `+0x36`, divides by 100 with signed
  truncation, and clamps positive selection to at most 100.
- At `004cb6d5`, the exact first selector is
  `004f8490(ai,2,2,-1,1,origin,7,3,0x00a0d108)`. Origin semantics use its low
  16 bits; the caller's dword stack load can retain unrelated upper bits.
- **Stop before executing `004cb6da`**, immediately after selection returns.
  EAX is the selected count despite the export's inferred `void` return type.
  Task selected count `+0x0c` has not yet been incremented and person preparation
  has not begun. `004ed6f0` and `004ed640` follow later at `004cb70f/004cb71c`.
- A normal full next visit skips remaining zero quotas, reaches cursor 7 and
  fills a positive deficit through the wildcard selector at `004cb75a`, returning
  at `004cb75f`. With no deficit it does not call that selector. This second
  visit, selection reservation, commands and paths are outside the proposal.
  Port cursor representation is six slots plus its separate fallback, so a raw
  native cursor byte is not a portable whole-lifecycle equivalence claim.

Flags 7 permit assignment-mask `0x804`, redirectable orders and housing order 6.
They do not request the flag-64 Guard Tower exclusion. The selector visits priority
bands 0 through 6 and, within each, the supplied linked-list order. Distance is
then ranked globally; strict-less insertion keeps equal-distance traversal ties.
Shamans and the wrong model still fail, as do flags4 bit `0x800`, transport duty,
and qualifying full special buildings. Ordinary idle availability requires
person-state flag 8 and zero person `+0xaf`. Current commands are read only in
states 10/33, and a cancelled immediate command suppresses a queued housing order.
Orders 17/31/32 can qualify through `004f55d0` only with zero assignment byte and
inside the native base radius. Forced flags3 bit 0 is another eligibility path.
Only the returned prefix consumes that flags3 bit; native scratch-tail writes
beyond the prefix are retained but not projected onto portable world state.

## Prior proof reused

- `scripts/check-native-selection.py` and the follower-selection section of
  `references/reverse-engineering.md` cover 1,870 native helper cases without
  intercepted eligibility leaves and 256 combined training-controller cases.
  They supply `hasBase/base/shaman/radius` directly, so they cannot certify this
  live adapter's ownership choices or original world-list construction.
- `scripts/check-native-computer-attack.py` executes original attack selection
  for controlled Mission 1/5/6 routes, sets `+0x5b4=1/+0x36a=staging`, and uses
  person lifecycle leaves. It does not pair distinct live Mission 3 origins.
- [Mission 2 rebuilding](mission2-rebuilding.md) already proves construction-base
  lifecycle and explicitly separates script defense from it. The current source
  implements Mission 3 base establishment too.
- [Mission 3 defense](mission3-defense-task.md), producer scheduling/training,
  the original raid interpreter and the accepted admission repair retain their
  completed scopes. Historical pending paragraphs elsewhere are not reopened.

## Proposed four finite cases, not executed

[`selection-cases.json`](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/selection-cases.json)
freezes at most four independent first-Brave visits. Every case supplies tribe 2,
one normal type-20/phase-3 task, request 3, the authored six quota bytes, cursor 0,
selected count 0, its existing selection lock, script defense ON at `0x64fc`,
territory radius 11 and RNG `0x12345678`. Task entity 0 deliberately avoids an
irrelevant target-table read in this phase; it is supplied controller state,
not an allocation or target-validity claim.

The first three cases use the six authored Brave coordinates from raw records
47..52, mapped to controlled IDs 301..306, with Shaman 307. Their explicit list
order is shared by both implementations; it is not asserted to be the native
loader's original order. All Braves are available state 17, priority 0, flags3=3.

| Case | Native base state | Predicted native prefix | Predicted current port prefix |
| --- | --- | --- | --- |
| Common-origin control | Established at `0x64fc` | 306,302,303 | 306,302,303 |
| Authored-coordinate no-base input | Not established; Shaman `0x60da` | 301,302,303 | 306,302,303 |
| Distinct established base | Supplied retained base `0x62d8` | 305,301,304 | 306,302,303 |
| Eligibility, radius and stable ties | Established at `0x64fc`, native radius 0 | 302,306,301 | 307,302,306 |

All table results are source-derived predictions, not observations. The fourth
case has ten explicitly supplied people: idle, housing, cancelled-immediate,
busy, prohibited-flag, assignment-eligible, defending-order, Shaman, wrong-model
Preacher and forced-selection records. It holds the ranking origin equal and
separates radius ownership: person 307 has order 31 one terrain cell from the
base, outside radius 0 but inside territory radius 11. Its other candidates
exercise priority ties and returned-prefix flag consumption. Radius 0 is a valid
base-establishment boundary; it is not an asserted radius at a natural raid.

## Required probe contract before execution

Native execution must enter `004cb400`, run actual `004f6020`, `004f8490`,
`004f8390` and all reached eligibility/command/distance leaves, and stop at
`004cb6da` before that instruction executes. No native selector or eligibility
leaf may be replaced. Supply the task/tribe/list/person/order records, unit
pointer table, zero transport/inside-building references, source PE rule tables,
and world-origin/radius fields. Initialization, script interpretation, allocator,
population, target resolution, original list creation and world loading are
deliberate supplied boundaries. There are no required native intercepted leaves
on these finite visits. Known person, command, path and wildcard entries are
abort points, not permissive zero-return hooks.

The portable half must enter **actual `stepComputerTasks(w,2)`**, at a dispatch
turn with only slot 0 active, and use **actual `computerSelectionWorld` plus
`selectComputerPeople`**. Do not duplicate its staging expression in the driver.
An instrumentation-only delegating module mock of `selectComputerPeople` can
record its actual arguments/world and returned IDs/flags while returning the
original result unchanged. A second delegating wrapper around `stepAttackTask`
wraps only its `input.select` callback: call that actual callback, let the live
adapter copy flags3 back to source people, then throw a unique sentinel before
returning to the original `stepAttackTask`. This cuts before membership/count
updates and person actions, matching the native stop. Throwing inside the helper
mock would be too early because it would skip the adapter's flags3 propagation. Configure native person/command presentation fields so
`unitAnimationSource` sees the supplied records; assert every input field before
comparison. Use an isolated controlled Mission 3 world, retain only fixture
people, no buildings, zero building references and no gameplay ticks. The mock's
support and import order still need source preflight when the driver is written;
this proposal does not claim that an unbuilt adapter works.

Compare origin, normalized selector arguments, returned count/ordered IDs,
each returned candidate's wrapped rank, all people's flags3 before/after, task
phase/quota/cursor inputs and unchanged RNG. Retain full native 400-byte scratch
output and raw person/task bytes. Native visit counter increment and cursor=1
are native observations; compare only the matching portable cursor=1, not a
counter field with different lifecycle meaning. At the stop, native selected
count remains zero; the portable sentinel likewise precedes membership updates.
Assert no person state, assignment, command pool, path state or other task changes.

Resource proposal: one native process and one portable process, sequential on a
coordinator-granted CPU lane; at most four original calls and ten people per case.
Use the already accepted 16 MiB Unicorn TCG-buffer control/readback from the
admission branch, not main's unbounded default. Map only the PE plus at most
256 KiB scratch. Cap each native call at 1,000,000 microseconds/2,000,000
instructions, native address space at 1 GiB, CPU at 30 seconds, alarm at 60 seconds
and outer timeout at 65 seconds with TERM then KILL after 5 seconds. Portable
execution gets one process, at most four adapter calls, 256 MiB old-space and
20 seconds timeout; cap records and hook traces to 128 events per case. No
browser, Ghidra, server, package install, full checks, fixture recording or game
launch belongs to this experiment.

Stop at the **first paired difference**, retain both records, and return a
failed mismatch receipt. Abort malformed inputs, exceptions, unexpected entry,
stop-address failure or limits as probe failure, not parity results. Do not
automatically execute the remaining cases, repair runtime, extend phases, or
rerun. The exact source, imports, native bytes, tool fingerprints, fixture and
adapter require independent preflight and a fresh lane grant first. A later
runtime correction requires reviewed witness evidence plus its own natural and
checkpoint acceptance. Full campaign/whole-world timing, native list creation,
later raid visits, command/path preparation and rendered parity remain open.

## Verification and preservation

Static original hashes, authored operands, seven raw level records, bounded
disassembly, four-case structure, local links, JSON and maintained-source diff
checks are the appropriate checks for this documentation/evidence-only work.
Native/portable/browser/package jobs are **not run**, as explicitly instructed.
No runtime files, importer outputs, parity, admission worktree or shared lane changed.

The parent receives the exact source commit and a locally verified Git bundle.
It remains **unpushed and not reset-durable** while normal Git authentication is
absent. A local bundle is review/preservation material, not publication or a
claim that another environment can recover it after a reset.
