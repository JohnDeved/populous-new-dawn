# Authored heads, completion-time clones and request order

Source-only addendum to [the frozen two-ready-gift proof](worship-grant-request-order.md),
commit `084eea97fe98c4ac302333227cc3c9495d090e10`. No new native execution or
runtime change is included. This maps the proved newest-allocation-first rule
to the ordinary Mission 1–2 producer and clarifies the initial phase boundary.

## The authored reward is a template

The [level loader](../generated/00484a10.c) reads twenty batches of one hundred
55-byte records in ascending file order. Instructions `00484e80..00485046` start
the source ordinal at 1, allocate each eligible record through `004ed8a0`, store
its source ordinal at `+8`, and advance the ordinal/source pointer. The allocator
prepends at `004ed9b2..004ed9cd`. Thus original authored heads occupy the primary
list in descending source-index order, regardless of subsequently assigned handles.
The head initializer `004fb1d0..004fb26b` selects state 5, cell and visual state;
it does not replace those primary-list links.

[004851e0](../generated/004851e0.c) resolves each head's ten links at `+0x72`
from source ordinals to native handles, retaining their slot order.
[004edf50](../generated/004edf50.c), called at `0048506f`, makes linked templates
inactive: it clears their initialized flag, removes their cell membership when
present, and sets state zero. The authored class6/model2 record is therefore
not the active acquisition flight whose later phase-zero callback is ordered.

On successful completion, [004fb270](../generated/004fb270.c) traverses the
linked slots in ascending order (`004fbaab..004fbbca`, start `+0x72`, stride 2).
It allocates a fresh clone at `004fbb57`, copies its template at `004fbb67`, then
immediately processes that clone at `004fbb82`. The native
[template copy](../generated/004ede10.c) preserves the new allocation's primary
list links, handle, class counter, state and cell links. The clone retains its
newly prepended position. Later primary-list visits deliver the ready clones in
reverse clone-allocation order, as dynamically proved by the frozen probe.

## The immediate call does not consume the six subsequent visits

The supplied M1/M2 records have reward settings `[11, model, 3, 1]`: class 11,
spell model, grant mode 3 and automatic collection flag `+0x7d == 1`.
Head mode 0 is a separate field. Original allocation clears the full record;
the template initializer/post-loader writes its settings but does not start the
timer or phase. Its inactive state prevents ordinary updates. Consequently the
completion-time copy carries timer `+0x7a == 0` and phase `+0x7f == 0` into the
new state-4 clone, before `004fbb82` calls `004ed700 → 004fa8f0 → 004facf0`.

That immediate gift visit initializes body/glow and enters the timer-zero branch
at `004faf03`, not the countdown branch `004fafc8`. It either returns with
timer/phase `0/0`, or, if the class-counter gate and nearby follower eligibility
pass, starts `82/1`: `004faf9e..004fafbc` briefly writes phase 6, timer 82 and the
follower's recipient, emits cue `0x70`, then writes phase 1 and returns at
`004fafc7`. There is no timer decrement on either timer-zero path.

After that call returns, `004fbb8a..004fbba4` verifies a non-255 head recipient,
class6/model2 and automatic flag 1. For these ordinary claimed rewards,
`004fbba6..004fbbb1` writes timer **82**, the head recipient and phase **6**,
then emits cue `0x70`. This final state is independent of which timer-zero branch
the immediate visit took. The enclosing primary loop saved its next pointer
before visiting the head (`004ec8aa`), so the newly prepended clone is not visited
again by that same traversal. Its next six object visits therefore produce
`81/5, 80/4, 79/3, 78/2, 77/1, 76/0`; the last owns the screen handoff.
This supports the existing browser's completion-at-82/6 followed by six future
gift visits. It does not change the later UI-arrival clamp or payout ownership.

## Mapping the order to retained browser provenance

For original ordinary heads successfully completing in one primary traversal:

- Heads allocate clones in descending authored head index.
- Within a head, clones allocate in ascending original link slot.
- Ready handoffs reverse that allocation order: ascending head index, then
  descending link slot. Different completion cohorts retain their chronology;
  newer allocations precede older ones when otherwise ready together.

The exact raw records are zero-based, matching
[the importer](../../scripts/import-level.py) and retained browser object indices:

| Mission | Head index | Reward template index | Link slot | Spell model |
| --- | ---: | ---: | ---: | ---: |
| 1 | 28 | 29 | 0 | 3 Lightning |
| 1 | 30 | 31 | 0 | 12 Bridge |
| 2 | 63 | 62 | 0 | 4 Tornado |

Conditional on both M1 heads completing in the same native traversal, Bridge's
head allocates first, then Lightning's. Later Lightning hands off first, then
Bridge, so Bridge wins the singleton. M2 head 59 has no linked class6/model2 gift;
mode-4 Vault 25 is outside this ordinary scope.

[world-initialization.ts](../../app/world-initialization.ts) walks source objects
in ascending order, and [world-turn.ts](../../app/world-turn.ts) walks the
resulting shrine array in that order. Simply reversing browser gift-creation
serials would invert the conditional same-turn M1 native result. Retain completion
chronology, authored head index and original link slot to derive native clone
allocation priority at the narrow presentation dispatch boundary. The authored
reward index identifies the template; it is not the allocation-order key.

This is source-derived composition, not another paired-head execution. Native
class-counter phases and eligibility determine whether a simultaneous completion
is naturally reachable. Dynamically cloned heads, later script producers and
failed allocations remain outside this mapping; no generalized world-scheduler
equivalence is claimed.

## Fixture clarification and receipts

The frozen pair probe supplies reward `+0x7d == 0` only as synthetic metadata
before setting both records phase-ready. Its executed phase-ready processor does
not read that byte. The earlier note's phrase “ordinary variant 0” must not be
read as the authored reward flag: ordinary head mode 0 produces the `+0x7d == 1`
rewards above. The frozen probe and eight-case receipts remain unchanged; this
addendum corrects that terminology and preserves their ready-state boundary.

All byte checks used the accepted EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Local `work/orchestration/worship-request-order/source-order-mapping.json` retains
source/level/disassembly hashes and raw links; `static/` retains loader-tail,
head-init, worship-clone, template-copy and initial-gift-phase disassembly.
No native emulation, Ghidra, browser, build or full suite ran for this addendum.
Only source/byte inspection, raw-record parsing, link checks and diff checks apply.
