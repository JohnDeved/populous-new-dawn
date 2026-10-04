# Balloon rendered checker preflight

Decision: **ACCEPT for checker preflight**, at
`6b6eb684f4f010420a758cfe4fd481b6dfca9545`.
No actionable defect found. This approves the proposed checker as a useful next
verification step; it does not claim rendered success or merge readiness.

## Scope and source identity

Read-only follow-up to `review-dcc8a85.md` for issue #198 / draft PR #199.
Inspected the complete checker and research-note diff from merge
`5ab25f1c16345f17190edfa5705cf00e37c2191c`, the actual UI/input/renderer callers,
`vehiclePoint`, `bindGame`, and the maintained local-render harness.
The intermediate merge has parents `dcc8a85` and tooling-only main `ea52124`;
its two imported files are the checkpoint checker and its regression test.

Independently checked `tooling-merge-correspondence.json` against Git blobs and
current bytes: live movement, native probe, transport source tests, both retained
native exports, and imported command descriptors are unchanged from the previously
reviewed runtime. The new checker and note are the only following commit changes.
Tracked status was clean throughout this preflight.

## Concrete findings

- The default remains Boat model 1; explicit `POPULOUS_TRANSPORT_IDLE_MODEL=3`
  selects Balloon, with other models rejected. Authored population/routes remain
  present. Only the added Spy's population, position, selection, game flag 32,
  camera focus, and deterministic clock ownership are supporting setup.
- `vehiclePoint` uses the rendered vehicle mesh, camera projection, DOM hit testing,
  and existing pickers to find exposed geometry. The checker issues a real mouse
  click; normal `pointerDown`/`pointerUp` call `command`. It then demands command 22
  with the actual craft ID before ticking, and proves first-passenger/driver identity,
  passenger count one, expected airborne flag, retained selection and authored people.
- The exact `followers` title and disguise aria-label prefix match `app/page.tsx`.
  These are actual clickable buttons invoking `disguiseSelectedSpies` through the
  store. The first click must yield a non-cancelled command 16 before any explicit
  simulation tick. Balloon destination words are compared with that accepted record.
- Frame ownership is coherent: each manual draw uses `scene.previous`, so
  `animate` has zero elapsed time; its newly scheduled RAF is immediately cancelled.
  World speed is zero, and deliberate simulation advances use `tick(w, 1/12)`.
  There is no direct invocation of boarding/disguise commands in the page setup.
  Using `testSceneRef.current` avoids a captured stale scene alias.
- Completion checks cover state 30, zero speed, the initial 63-turn disguise timer,
  final target disguise, retained vehicle/passenger membership, a stable vehicle
  position during the following 63 turns, and a second real disguise-button command.
  The rest comparison starts after the completion visit, consistently with source
  and native evidence. The checker does not broaden this to non-driver scheduling.
- The two PNGs correctly document boarded-before-disguise and completed-disguise
  states in the same candidate run. They are not a baseline-versus-fix comparison.
  Raw JSON retains accepted orders, positions, labels, results, viewport/DPR and
  actual renderer; page/console errors are checked. Parent should inspect the PNGs
  after the run, and use the terminal harness plus outer command receipt as the
  authoritative outcome rather than `result.json` alone.

## Validation and launch boundaries

Verified final-head receipts and their raw logs/input hashes:

- `checker-syntax-6b6eb68.json`: passed, `node --check`, exit 0.
- `checker-eslint-6b6eb68.json`: passed, scoped ESLint, exit 0.
- `git diff --check 5ab25f1 6b6eb68`: passed, exit 0.

No maintained TypeScript changes were added in this follow-up. The prior runtime
quality findings and limits continue to apply; this script reuses the maintained
vehicle-picking helper rather than adding a duplicate renderer/input implementation.

Inspected `validation-plan-6b6eb68.json`, including its verified scenario hash,
port 4367, private TMP/output, explicit model 3, 180000 ms timeout, and receipt
wrapper/input-binding plan. The unchanged harness uses `chromiumSandbox: true`,
`--remote-debugging-pipe`, loopback Vite, source fingerprints before/after, and
cleanup limited to its own browser/server process group. No launch occurred here.

If the planned source-bound rendered run succeeds and its images are inspected,
this case plus the unchanged independently reviewed source/native evidence suffices
for the narrow driver Balloon raw-payload disguise startup/completion/rest/replacement
claim. Natural acquisition/campaign progression, complete vehicle lifecycle,
cell/object encodings, non-driver scheduling and hardware performance remain outside
that claim; pending-command checkpoint continuation remains source-covered.

Full aggregate check, build, and browser execution remain parent-owned gates.
They were not run in this preflight, and no successful rendered outcome is asserted.
