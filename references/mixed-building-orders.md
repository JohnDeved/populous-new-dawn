# Mixed ground and building orders — 2026-09-11

Ordinary Ctrl sequences can now visit ground waypoints, enter a completed hut,
warrior-training hut or tower, and retain subsequent ground orders where the
original retains them. Previously, clicking the building replaced the current
queue; conversion then discarded its inherited commands and copied one browser
path. The same person record and shared native command pool now cross controller
boundaries. No second queue, render-loop work or new dependency is introduced.

## Original evidence

Executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
All listed exports were already in the maintained executable manifest.

- Player append is `00435cb0`,
  packet application `00444f60`, encoding `00435780`, preparation `00438730`.
  Command 8 copies the target payload and merges flags only when changed; a
  dismantling target rewrites it to command 10. The full preparation routine is
  compared in 256 new CPU cases, with a portable fixture. The irrelevant native
  uninitialized terrain local is not recreated; command 8 has no terrain payload.
- `00432590` dispatches entry command 8 through `00434610`, runs formation
  admission, and owns completion/anchor/removal/advancement. The live entry
  controller now uses this same reconstructed dispatcher as ground movement.
  `004366b0` advances, `00432df0` configures, and `004d4f40` recovers movement;
  advancement does not repeat the extra startup speed draw from `00432260`.
- `00407150` and `004d80e0`: ordinary hut/tower admission clears all queued
  commands. Training keeps them. Failed admission does not itself clear orders.
- `00405b80`: conversion replaces people, inherits the **first nonempty physical
  occupant's** remaining queue for every replacement, or attaches one shared exit
  order. It requests initialization with flag 16. The live adapter now retains
  these references and lets the person visit initialize and move them.

`check-native-order-update.py` passes 16,384 advance/idle/update/composed
comparisons with its documented command/world leaves. Training conversion passes
1,024 comparisons executing actual command allocation, attachment, cleanup and
exit geometry; allocation, UI and other listed world leaves remain supplied.
`check-native-occupants.py` rechecks admission, order cleanup and combined entry
with its explicitly documented spatial/transport leaves. These are native helper
and composition comparisons, **not** an end-to-end original running-game replay.

## Live checks and modern performance

`tests/mixed-building-orders.test.mjs` covers all four building orientations,
waypoint-first movement, retained person identity, shared training tail and default
exit ownership, appending while inside, hut/tower tail consumption, cancelled or
removed approach targets, replacement and death. Every recorded turn, RNG state,
pose and footprint cursor agrees at 5/30/60/120/144/240 Hz and irregular intervals.

`check-browser-mixed-building-orders.mjs` performs real Ctrl-click sequences at
1440×1000 and 3440×1440, then checks admission, inherited destinations, original
warrior walking frames, 770 changed GPU pixels and final arrival/route cleanup.
The existing ground-waypoint browser regression also passes. Headless Chromium
and renderer identity are retained in the raw performance report. Three-person
simulation visits have 0.1 ms p95 under the browser's coarse timer; the reported
zero median means timer resolution, not zero work. This is not hardware FPS proof.

The unchanged 200-person ground benchmark ran against baseline
`348322c4a07cb25d46fd0762686f89a6e4b4a783` and the modified source in three
alternating process pairs. Median-of-run medians: command append 1.455 → 1.466 ms,
simulation visit 0.314 → 0.312 ms. Visit p95 spans 4.679–4.881 ms before and
4.747–4.852 ms after. Raw samples, CPU/Node identity and benchmark hash are in
`performance/2026-09-11-mixed-orders-ground-regression.json`. No speedup claim;
the unchanged populated ground workload remains in the same measured range.

## Remaining scope

Construction and explicit dismantling clicks, combat/vehicles, other schools and
person classes, complete target invalidation and recovery, global object limits,
registration/visit order and persistent staged waypoint previews remain open.
This closes real live handoff gaps without declaring the broader order or training
ownership requirements verified, or awarding duplicate parity credit.
