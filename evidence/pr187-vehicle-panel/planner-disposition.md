# Planner disposition at 1a6ae6835f2491fd2287b910e421744964066d1c

Plan: `plan-1a6ae68.json`, base `2a8211b88e278b70cffa7a7ee8489441516ea9d1`.
The plan is a conservative file-level routing aid; its selected/not-run records are
not execution results. Exact terminal receipts below supersede only their named scope.

- All selected portable and metadata checks are covered by the exact full
  `npm run check` (955 tests, typecheck, parity and orchestration). This includes
  automatic Boat crossing, construction, follower-task ownership/nonmutation,
  orders, all campaign portable scenarios, selection, and both unknown test paths.
- Production build passed independently on the same clean head.
- Affected native suites were executed: vehicle-panel layout/input/readiness and
  hover/pressed; complete passenger selection; terrain exit; complete voluntary
  unload/order cleanup; settled geometry plus native seating/ejection/physics;
  and existing vehicle damage/destruction/full-capacity ejection. Their supplied
  boundaries are retained in each script and `decomp/research/vehicle-panel.md`.
- The affected new panel browser scenario passed at d18ff90, including real world
  craft picks, passenger primary/Shift/right actions, no camera movement, person
  panel coexistence, native source-pixel states, dimensions/DPR, occupied/airborne
  checkpoints, and living landing. `browser-correspondence-1a6ae68.json` plus the
  independent review justifies carrying it through equivalent branch/projection
  cleanup and tooling-only main adoption. Original source labels are not rewritten.
- Existing vehicle-destruction browser was not separately rerun. The actual
  destruction owner/Blast/ejection/checkpoint and corrected seat-relative impulse
  are covered by final portable regressions; native destruction and shared ejection
  were checked directly. New-panel inactive removal is rendered fixture coverage,
  not a claim that the full destruction browser ran.
- Mission9 sailing/landing browser and all other campaign journey browsers were
  not separately rerun. Route/boarding geometry is covered by automatic-crossing
  portable tests, registered-cell movement/exit tests, and the native geometry/exit
  probes. The panel scenario covers live boarding command, real world picking,
  unload, checkpoint and landing. No new natural campaign journey claim is made.
- Other selected campaign, construction, computer attack, message, reincarnation,
  vault/worship and follower-task native/browser checks are not applicable as
  separate reruns for this scoped change: their native implementations, campaign
  bytecode/data, order interpreters, building/resource work, counterattack logic,
  selection/search algorithms and HUD art are unchanged. File-level routing arises
  from shared live-command/live-people/live-vehicles/ObjectPanels/input files and
  the native research index. Only command22 attachment publication, transport-owned
  geometry/flight retention and class4 object-panel opening changed in these shared
  files. Exact aggregate regressions cover their portable callers. Unchanged
  general person/worship panels retain the same painting branches, with coexistence
  and person-panel open exercised by the affected rendered scenario.
- Camera clock/renderer/performance implementation is unchanged. Geometry consumer
  effects are checked by actual world picks, checkpoint camera preservation, no-camera
  passenger inspection and viewport/DPR cases. Software rendering does not certify
  hardware frame performance; no hardware performance result is claimed.

## Explicit unknown-path disposition

- `scripts/check-browser-vehicle-panel-baseline.mjs`: reviewed setup-only baseline
  scenario executed against unmodified0b0719f; its own external source hash is in
  that baseline receipt. It observes missing panels and captures genuine images.
- `tests/vehicle-cell-membership.test.mjs`: updated to independently expected
  settled-seat coordinates rather than craft center; executed in exact full check
  and the 31-test focused final run.
- `tests/vehicle-destruction.test.mjs`: expected impulse reflects independently
  proved seat offset; all destruction/live-owner/checkpoint assertions retained,
  executed in exact full and focused final runs.

Scoped format passed. ESLint retains its one identical baseline diagnostic;
Oxlint112 vs baseline114 has no introduced diagnostic. Fallow advisory findings
are preserved rather than treated as a clean quality gate.
