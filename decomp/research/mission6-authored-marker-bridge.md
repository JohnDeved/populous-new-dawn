# Mission 6 authored raid shoreline and marker Bridge

Static-only original input: `D3DPopTB.exe`, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original executable was run or emulated for this change.

## Missed authored inputs

Matak's first ATTACK has the previously retained spells `[12,3,2]` and tail
`[1078,0,0,16,-1]`. The old browser recognized that vector but discarded its
movement and spell markers. This made phase 6 attempt a distant Blue-targeted
Bridge, then send the army through a nonexistent route. The failed-raid recovery
remains correct for a genuinely markerless/refused task; it is not the whole
original first Matak attack.

Native parser `48fc50` forwards 14 parameters to `4e5fd0`. The allocator's
`sub esp,8` and four register pushes place parameter 1 at `[esp+1c]`.
Parameter 12 (`[esp+48]`, ATTACK operand 10) resolves through the level marker
array to task WORD `+0e` (`4e6351..636a`). Parameter 13 (`[esp+4c]`, operand 11)
is stored as task BYTE `+2f` (`4e6304`, `4e6326`); parameter 14 stores `+30`.
Thus this attack retains movement marker 0 and spell marker 16. The browser
stores the resolved movement cell and the spell marker index separately.

## Staging and casting

- Phase 7 (`4cb8e8`) takes a present movement cell through the ground phase-8
  staging branch. Phase 8 orders the assigned group to that cell, clears it to
  `ffff`, and sets phase 6/fallback 7.
- Once the movement cell is absent, `4cb948` calls `4f5050`, which examines only
  the FIRST spell byte and accepts 2..17. If that byte qualifies and marker byte
  `+2f` is not `ff`, the next phase is 21, fallback 7.
- Phase 21 (`4cc7d7`) uses the tribe's live Shaman pointer (`4f25a0`), not a new
  task-member search. It requires cast eligibility and low three bits of task
  visit counter `+8` zero. That counter increments at `4cb549` before phase work
  and resets in phase 0.
- Stock payment bypasses the mana threshold. Insufficient mana removes the first
  spell. In range, AI permission refusal also removes it; success allocates the
  spell directly at the signed marker index's cell and removes it. This branch
  does not call the phase-6 positional target selector.
- Range refusal removes the spell only when person-state flags include bit 8;
  both forms stop this visit. Moving state 10 and failed-path state 33 preserve
  the spell. Settled state 17/19 removes it.
- Clearing byte zero does not compact the payload. The same-call tail after a
  cast/refusal scans all remaining nonzero models except 6/19 for minimum payment
  cost (stock-funded cost is zero). An affordable remainder retains the Shaman.
  Otherwise `43b2a0` replaces its home movement queue without a state initializer,
  and `4f2440` clears assignment even if order allocation fails.
- Both completion paths set delay byte `+2e` to 32 and phase 22. Phase 22 counts
  task visits before restoring fallback. No Shaman restores fallback immediately.

## Actual topology

The retained ordinary pre-bridge world has a Green route to marker 0, browser
`(-122,-102)`, and a Blue route to marker 16, `(120,-102)`. The reverse routes
are empty. The two shores are only 14 world units apart across the map seam.
This is an authored, naturally reachable cast; no injected shoreline target or
player spell stock is required.

## Boundaries

Only the already validated Mission 6 Matak vector enables these new fields.
Chumara and other marker/transport variants retain their existing adapters.
The group selection/movement adapter remains in use rather than claiming complete
native linked-person traversal and phase-8 initialization equivalence. Actual
ordinary marker travel, live Shaman ownership, target identity and terrain
connection are separate acceptance requirements. Old checkpoints with absent
optional fields keep their established markerless behavior; no lost historical
marker is reconstructed into a pending or retired raid.

The old first-raid cleanup regression is retained as an explicitly supplied
markerless legacy-task compatibility case, with its historical raw natural
receipt unchanged. A separate fresh current-source test must prove the authored
marker Bridge. CPU simulation and synthetic storage do not establish rendered
browser output or original-game save compatibility.

## Retained ordinary diagnostic

Fresh Convert was earned at 566 and recruitment completed at 580. The first
Matak task allocated at 6767, staged at marker 0 through phase 8 at 6888, entered
phase 21 at 7261, allocated its actual Bridge at 7267 and terrain effect at 7275.
The effect finished at 7338, when Blue gained a 12-waypoint route to the original
Matak home. Public Save/Load twins remained equal through both casting and terrain
completion. The first diagnostic incorrectly asserted connectivity when the effect
was allocated; that failed receipt is retained alongside the successful completion
receipt rather than treating `stats.bridges` as a completed-terrain signal.

These diagnostic receipts bind main `3145066` plus the then-current tracked-diff
SHA-256 `9c804b290e77202977a4f030f9caeaa705e34b9354dd01b582870b9995179911`.
The final maintained fresh regression repeats the result on the candidate. Its
home-queue failure fixtures cover subsequent cleanup corrections separately.
