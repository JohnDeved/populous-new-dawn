# Mission3 live Convert Wild task

## Source and scope

This runtime slice follows [population/state and target research](mission3-population-state.md)
and original `004e5900` → `004623e0` → `004c7370`. The executable identity and
scoped export provenance remain in that note and `decomp/exports.json`.

Only Mission3 uses the new live type2 adapter. Other missions retain their existing
spell path. CPSCR012 `768..<796` is now included in the recurring script, and
opcode1030 uses the original state-bit mutation. The state bit gates allocation;
an active task is not cancelled by OFF.

The current construction-first producer adapter is retained. Full original
producer-table sorting/fairness and exact allocation-turn equivalence are still
unproved; this is not a claim of complete AI timing or whole-Mission3 parity.

## Implemented path

- Real Wildmen count/state/no-duplicate/free-slot producer gate, without an early
  spell-payment gate.
- Phase0 base/Shaman origin, one-use marker override or density/distance/list-centroid
  target search. Native count bytes and strict tie behavior are preserved.
- Phase2 actual resting collision and first24 spiral candidates, signed vehicle
  model-pair counts, and real route construction with a raw Shaman start and centered target. Failed
  reachability clears flags4 `0x10000000`; it is not a cost-only path query.
- Selection lock and state14 phases4→5→6→7, real group movement order3, release and
  shared restoration, then phase8. No invented command-delay gate is introduced.
- Phase8 elapsed count advances by active tasks. Density/cardinal target choice,
  native range squared (without the separate generic helper's +2 slack), readiness,
  mana, permission, existing spell allocation and allocation-safe return order run
  in the original branch order. The moving-density fallback intentionally has no
  normal range gate.
- Timeout/no-target cleanup preserves a valid first vehicle passenger/driver and
  otherwise clears orders/motion before the immobility state gate, retaining route
  and goal fields while centering the idle anchor. Phase3 releases selection and
  frees the task.

The Mission3 marker-only spell shortcut is disabled to prevent duplicate casts.
The existing native spell effect, person movement and route implementations remain
consumers; their broader limitations are not erased by this adapter.

## Current verification and remaining gates

At checkpoint `82b6ef5`, four portable helper/controller tests pass, as do the
53 target/wrapper cases (including the stronger wrap-winning case) and eight
controlled phase8 decision cases. Search/vehicle counting and the original script
and producer cases execute unhooked. Terrain/route/density/readiness/range/permission
and spell/return effects are explicitly supplied in their bounded wrapper cases.

A normal6000-turn diagnostic on that checkpoint observes allocation, all selection
phases, real command3 movement, one paid cast, nine actual conversions, population16
and the authored state OFF transition; the world remains playing. Those counts and
turns are observations of that browser-model run, not an original timing oracle.

Natural checkpoint/RNG assertions, two unhooked timeout/driver comparisons and the
rendered checker are prepared next. Full standard gates, combined original-startup
validation and fresh source review remain required. The rendered checker uses
normal tick progression with diagnostic camera focus and actual mesh-pixel
contribution; it must not be represented as realtime or hardware performance.

Reproduction uses `scripts/check-native-mission3-convert-task.py`,
`tests/mission3-convert-task.test.mjs`, `tests/mission3-convert-wild.test.mjs` and
`scripts/check-browser-mission3-convert-task.mjs`. Native probes require the verified
EXE argument and adjacent inputs described in the preceding research note.
