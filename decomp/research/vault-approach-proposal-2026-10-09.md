# Issue 75: Vault approach proposal, source assessment only

Base: `56115714ede56ac0837110d870c87cc10a344727`. No runtime change, test,
browser/native execution, asset extraction or new acceptance claim accompanies
this proposal. Exact inspected-file hashes and authored calculations are in
[the source manifest](vault-approach-proposal-2026-10-09.json).

## Disposition

The Stone Head canonical-heading repair is already integrated. GitHub's
[comparison](https://github.com/JohnDeved/populous-new-dawn/compare/d36d05a7fb54392f2f6e5a69abbece81fb04565b...56115714ede56ac0837110d870c87cc10a344727)
reports 687 commits ahead, zero behind and candidate `d36d05a7` as merge base.
Its live-worship, approach test and approach checker are unchanged in this base.
The checkout is shallow; a negative local ancestor query was not evidence of
absence. [Issue 75](https://github.com/JohnDeved/populous-new-dawn/issues/75)
still lacks identification of the exact reported structure and accepted paired
ordinary current/native clipping evidence.

**A separate command-33 Vault destination mismatch is source-proved. A point-only
repair is not ready:** work admission and persisted goal ownership are coupled
dependencies. Temple training is command 8 and already uses building shape doors;
Stone Head worship is command 27. Neither is interchangeable with this finding.

## Geometry and actual caller

`live-command.ts` dispatches command 33 through `appendLiveOrders`;
`adoptLiveOrders` preserves its native owner and mirrors `u.vault`. The world-turn
command map calls `processVaultTask`. Its `entrance(head, 2)` is a radial fallback
because a Shrine lacks Building's level/team fields. Phase 1 approach and phase 7
exit use that point; phase 4 uses the shrine center; phase 9 uses radius 6.

Original `0043c7a0` calls `004044b0` for phases 1/7, `00404420` for phase 4,
and, in phase 9, moves another `0x400` from the outside point along
`(heading + 0x400) & 0x7ff`. `00403610` supplies coarse-aligned anchors.
`buildingOutsidePoint` and `buildingInsidePoint` already port those consumers.
Use their shape records, not a replacement constant radius. All current Vault
frames 152–155 select shapes 59–62; original shape indices and heading own the
door even while the visible frame morphs.

Authored coordinates produce these unsigned-native pairs:

| Mission / records | Inside | Current outside | Original outside | Current leave | Original leave |
| --- | --- | --- | --- | --- | --- |
| M1 Vault 35 / trigger 1, heading 512 | 768,64256 | 256,64256 | 65280,64256 | 64768,64256 | 64256,64256 |
| M3 Vault 104 / trigger 91, heading 0 | 58112,32000 | 58112,31488 | 58112,30976 | 58112,30464 | 58112,29952 |

Both current outside destinations occupy shape-mask bit-1 cells; both canonical
outside destinations are outside the footprint. M1's outside is browser (-9,-3),
versus current (-7,-3). M3's outside is (-37,127), equivalently (-37,-129), versus
current (-37,-131). These are static coordinate/mask calculations, not observed
movement or rendered clipping. M1/M3 shrine positions recover the same snapped
anchors as their authored Vault records; no new stored anchor is required for
those examples. Generalize to other or moved Vaults only after verifying their
source association rather than assuming every Shrine has a building identity.

## Required admission boundary

`world-turn.ts` currently requires `wrappedDistance(shaman, shrine) < 3` for work.
The original outside point is four world units from the inside point. Replacing
only the task destination would therefore strand ordinary phase-2 prayer.

`004fb270` type 4 checks player Shaman state 10 / command status 33, then admits
either a successful `get_adjacent_unit(shaman,18)` or the same `0xfe00` coarse cell
as the linked Vault's outside point. `0040a3f0` is a current-cell building-mask and
model lookup, not radial adjacency; its successful model-18 result need not be
the linked target. `processVaultTask` separately approximates adjacency by a
strict `<512` square around its current door. The original task instead consumes
`0040a3f0`'s building-mask lookup. Its arrival comparisons use signed position and
retained goal words with `<=11` on each axis; that ownership differs from the
port's same-sized comparison against a freshly calculated phase point.

The live collision/footprint registries currently cover `w.buildings`, while
Vaults are `w.shrines`; command-context performs a separate Vault shape lookup.
A door-cell predicate can prove the ordinary M1/M3 branch, but must not silently
replace the original OR condition, invent a building link, or imply full native
occupancy. Resolve this bounded adapter contract before implementing. This
proposal does not authorize a global footprint/navigation rewrite or wider radius.

## Smallest proposed implementation and regressions

Reuse a single Vault shape-pose derivation at the actual task caller (same snapped
anchor formula already used by `vaultKnowledgePlacement`), then existing
inside/outside helpers and `movePosition` for the departure point. Preserve the
Vault's building heading; `stoneHeadAngle` deliberately leaves Vaults unchanged.
Use native unsigned points internally and browser conversion at the route boundary.
Do not change shared `entrance`, mesh placement, Stone Head routing or training.
Keep existing route planning, route advancement, collision and physics consumers
outside this proposed geometry change. They remain adapters whose full composed
native behavior is not established by the geometry evidence. The source directly
provides the endpoint formulas, arrival goal ownership/order, and admission/adjacency
predicates above. The current radial work/adjacency predicates are known deviations,
not consumers to relabel as proved while preserving them silently.

The first regression should start an authored M3 World, finish startup using the
existing fixture, select the original Shaman and call the ordinary `command`
entry, then advance the existing turn owner. Assert accepted order 33/target,
phase-1 native goal **58112,30976** and shape-mask exclusion. Continue to actual
phase-2 prayer and require nonzero work growth at the canonical outside cell;
otherwise the admission dependency remains exposed. Do not call the helper alone,
teleport the actor, supply work/readiness or force a phase. Keep the ordinary reward
and phase-7/9 destinations as continuation obligations. These tests are proposed,
not written or run.
Require the phase-2 prayer position outside the footprint before opening, then
preserve phase 4's deliberate travel to `buildingInsidePoint` after opening.
The later intentional entry is not itself a clipping defect. Paired captures must
label approach, pre-open prayer, and open-door entry separately, binding each image
to the actual phase/goal/position and comparable camera rather than judging a
single unlabelled frame inside the Vault.

Add focused supplied-state boundary cases separately for four headings, wrap,
invalid/removed target, and native adjacency versus outside-cell admission. Label
their supplied state; they cannot replace ordinary acquisition or prove navigation.

## Save, cancellation and goal ownership

`createGameStore` clones World on Save/Load; `migrateCheckpoint` preserves native
goal, command phase and entering flag. Existing `processVaultTask` calculates
arrival from fresh phase geometry; the original compares actual position with
the retained goal words at `+0x4f/+0x51`. A loaded phase 1/7/9 with entering false
can retain the old goal and never reach the newly calculated one after a naive
change. Establish retained-goal ownership first, and explicitly decide/test recovery
of pre-fix active routes; do not silently reset phase, reward work, timers or RNG.
The original also installs the first-entry destination before testing arrival in
that same call. The port precomputes `arrived` before processing actions, so simply
switching it to `p.goalX/Y` could mistake the old goal for a completed new approach.
Regress first entry and saved entering-false continuation separately, preserving
the original 11-unit comparisons and phase timing. Neither a blanket saved-goal
migration nor replacing one expression establishes that ordering.
The proposed ownership contract for an already-dispatched, saved entering-false
phase is to compare against its retained goal until the next original phase entry;
for first entry, install/resolve that phase's destination before its arrival test.
This avoids comparing an old active route with an unreachable freshly recomputed
target. It does not retroactively correct an old saved endpoint. If correcting
those checkpoints is part of delivery, a separate exact recovery case is required;
no generic route reset or migration is proposed here.

Proposed persistence coverage: Save/Load during approach and prayer, after forced
reward while exiting, and phase-9 departure; compare restored task/route/order/RNG
continuation. Include a legacy old-goal checkpoint and verify a deliberate,
non-teleporting recovery or documented continuation, with no duplicate reward.

Ordinary replacement flows through `releaseTasks`, `cancelLiveOrder` and
`clearTaskBindings`; it clears the shared order/route and `u.vault`/work bindings.
Test replacement during phase 1 and phase 2, work decay without eligibility, and
reissue through the ordinary command. Later-phase cancellation/close behavior must
retain its own boundary; this geometry proposal does not claim its full parity.

## Existing ordinary witness and evidence limits

Reuse `scripts/local-render/mission3-temple-checkpoint.mjs` through its existing
select-Shaman → view-Vault → `clickEntity(...,33,...,[shamanId])` prefix. Its input
observer records queued phase 0 before advancing; extend only read-only observation
when authorized to capture phase-1 goals, phase-2 position/work and render pixels.
Record command ownership before the first simulation visit. Preserve the normal
route and clock, then observe opening/entry/reward/exit. Existing Temple construction
can provide a later command-8 control, but its current receipt excludes training.
The accepted M3 Swarm reward establishes reachability, not the proposed geometry.

The existing ordinary05 report at
`work/orchestration/mission3-swarm-9197b1a6-05/mission3-swarm.json` has SHA-256
`6617e2203185c3f0d5bd55ab0aafeb5683cd91f5f70dd299ac235d3fc478480c`.
Its real samples retain Shaman 46 at (-37.0078125,124.99609375), command 33 target
92, on turns 878/1001/1120/1243 with Vault uses 0. These positions support proximity
to the current two-unit endpoint, but contain no native goal/command phase or
shrine work; do not relabel them as phase-2 prayer or infer work growth. Its queued
input sample has phase 0; Temple knowledge is observed at turn 1406.

The precise future capture point is before the existing `clickEntity` dispatch:
install chained `scene.gameClock.beforeTurn/afterTurn` callbacks, preserving their
receivers, arguments, return/throw behavior and restoration ownership. Retain the
synchronous pointer-boundary accepted order, then consecutive natural-turn samples
of original World/Shaman/order identities; native x/y, goalX/Y, state,
commandStatus/commandPhase, flags2, timer and workTarget; and Vault work/target,
uses/forced/open state. This observes goal installation and phase-2 work changes
without replacing a route or advancing a clock. The current 500-ms scenario reads
and coarse stored samples cannot reconstruct those boundaries retrospectively.

For the integrated command-27 repair, existing ordinary M3 Erosion is discriminating
(heading 1536 versus old trigger 256). M1 head headings 0 versus 256 both select
quadrant zero, so that route cannot detect the historical heading bug.

Retained `check-native-vault.py` supplies both geometry helpers, movement,
adjacency, presentation and association leaves. Its passes certify task branches,
not these adapters. `check-native-building-shapes.py` checks raw import/relocation
and geometry without mocked geometry leaves; its retained documentation is evidence
of prior checks, not a new execution here. The six exports match exports.json's
hashes and refer to Ghidra 12.1.3 / the pinned original executable. No raw input,
original binary or new rendered/native comparison was accessed for this proposal.
