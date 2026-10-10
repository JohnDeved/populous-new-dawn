# Completed local Temple manual inspection

Refs #25. This proposal is based on main
`26f23e1f8d61f431f87eb18fffcd4ee4d41fe35f`. It extends the intentionally
automatic-only Temple scope from PR293, rather than correcting that scope.
No runtime change or native/browser result is claimed by the test-only baseline.

## Bound source

The [existing Temple automatic contract](temple-automatic-panel-contract.md)
binds the local completed class-2/model-5 selector: `0040b9c0` returns zero for
the local owner, model 5 has flags `0x489f`, capacity 5 and panel kind 5. The
imported local title is string 913. Its executable and finite static-read hashes
remain authoritative. The retained exports are indexed by
[the existing source manifest](camp-manual-inspection-source.json).

The accepted [ordinary controller table](https://github.com/JohnDeved/populous-new-dawn/blob/c1b16d5af571f4735f036f71b063827b3a7f6e17/decomp/research/ordinary-tooltip-controller/contract-table.md)
and [ordinary admission closure](https://github.com/JohnDeved/populous-new-dawn/blob/c1b16d5af571f4735f036f71b063827b3a7f6e17/decomp/research/ordinary-tooltip-controller/ordinary-admission.md)
bind the existing shared input/tooltip route. `00508fe0` calls `0047ae00(1,0)`
on first name display. `004aab80` case `0x72` calls `0047ae00(1,1)`; `0x73`
releases its button flag. Class 2 falls through `0047b1d0` to `0047ae00`'s
local building-cell path and `00504060`. No inactive-training or empty-roster
condition guards this manual allocation. Reuse leaves the existing record
unchanged; fresh building allocation sets phase -1, hold 16 and the existing
`004a2530` shared-dwell side effect. `00509290` marks a reused manual record
automatic and sets its separate successful-request latch. `00504920` owns
renewal/exit; starting training during phase 2 must not restart that exit.

## Proposed delta and preserved ownership

1. Extend the shared `retainedBuildingPanel` predicate for completed Temple
   admission only when admission class is 2, model is 5 and tribe equals the
   current player's tribe. Pass that tribe from the existing World at every
   caller. Preserve Hut/Camp predicates and existing Blue/living/ordinary guards.
   Pick and cell-fallback targeting, queued right-button dispatch, first-name
   admission and record validity therefore share the same Temple identity.
2. A completed inactive Temple cannot paint merely from `hoveredObject`.
   A fresh Temple record at phase -1 cannot paint until the existing composed
   controller opportunity steps it. Existing raster, text, controls, positioning
   and presentation cadence are unchanged. No clock or threshold is introduced.
3. Preserve the stronger active-training/automatic-record gate: neither hover
   nor held controls can expose a Temple when active allocation failed or its
   automatic record is still at phase -1. Independent dismantling remains the
   existing exception. Inactive held/focused controls can outlive a retired
   record and retain their one reservation until departure/defocus. This browser
   control adapter does not recreate a record or claim native status ownership.
4. Manual admission/repetition does not mark automatic or set a training latch.
   Actual training reuses the identical record without phase/remaining reset;
   phase-2 reuse still completes exit. Automatic expiry clears its latch even
   with hovered controls. Retained/visible owners reserve once per building.
5. Same composed renewal/release/expiry and supported capacity adapter apply.
   Explicit feedback occurs once after the allocation attempt, including
   capacity failure. Stale/blocked presses and releases produce none.
6. Save does not dispose the live record. Load creates no manual owner and
   clears transient reservations through existing migration. The new Scene has
   an empty record map and the same Page tooltip session; no replayed input,
   feedback or manual allocation. Preserve full typed checkpoint data and
   existing automatic reconstruction at the next real training callback.

This supersedes only clause 5's historical Temple manual-exclusion and inactive
immediate-hover allowance in the automatic contract. The old automatic test's
setup will explicitly use independent dismantling/held controls where it needs
a legacy DOM owner; all downstream active-capacity, phase -1, latch, dwell,
reservation and automatic-exit assertions remain required.

## Acceptance and limits

`tests/temple-manual-inspection.test.mjs` starts from real Mission 3 acquisition
and construction through model commands/fixed turns, then runs actual picked
pointer input, controller, painter and store callers. DOM/projection/texture IO,
frame deltas and negative-state mutations are supplied and labeled. Failure-first
results must reach the intended manual-admission/paint failures before repair.
Full typed Save/Load comparison uses the maintained checkpoint encoder and real
store publication/migration; Node storage is not committed browser IndexedDB.

Independent ordinary QA must continue the maintained
`mission3-temple-checkpoint`/`temple-training-auto` public-input route (or a
genuine committed checkpoint with exact provenance), never inject this Node
fixture as browser state. Its manual segment starts after crew departure and
prior inspection retirement, before ordinary Brave training input. It must
capture delayed/manual input, release/expiry, same-record transition into
automatic activity, rendered pixels, committed typed Save/Load and cleanup.

Standard check/build, affected quality gates, independent review and ordinary
rendered QA remain gates after the focused red/green stage. This adds no parity
credit by itself. Native wall-clock pacing, complete Temple raster equivalence,
physical secondary-slot allocation and hardware frame performance remain gaps.
