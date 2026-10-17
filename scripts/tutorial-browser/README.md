# Hosted actual-Home Tutorial validation

`node scripts/tutorial-browser/run.mjs` builds the real `app/page.tsx`, production
styles, store and scene through a small plain Vite entry, then runs
`scripts/local-render/tutorial-recommendation.mjs`. The entry only mounts Home;
it does not replace loaders, inject scene state, or seed the answered flag.
This checks real Tutorial loading and retry behavior, but does not validate
Vinext, Cloudflare, or RSC hosting.

The separate `Tutorial browser` GitHub check runs on relevant ready PRs, on the
exact synthetic merge revision. It is not yet a branch-required check. For
PR #482, the maintainer must verify both this check and `Full check` succeeded
on the final candidate before merging. A skipped/path-filtered browser run is
not acceptance for a change affecting this scenario. No auto-merge or repository
settings are changed here.

The Playwright client is lockfile-installed; the browser is the official Chrome
channel preinstalled on the Ubuntu runner. Ubuntu provides an existing AppArmor
profile for this supported channel. Its exact version and executable hash are
recorded, but its version is runner-managed rather than pinned by Playwright.
The runner image and system packages are not claimed to be immutable. A missing
Chrome channel or sandbox failure fails the check. No downloaded-browser fallback,
AppArmor/sysctl changes, or sandbox-disabling arguments are permitted.

Local Mac runs may explicitly set `POPULOUS_BROWSER` to an already installed,
verified official Chrome executable, for example
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Verify the app's
identity before using this override. The path must be absolute and executable;
the runner records its hash/version and launches that exact executable with the
same sandbox settings. Without an override the hosted Linux path and Chrome
channel stay unchanged. There is no browser download or automatic fallback.

Build time is capped at 120 seconds, browser time at 180 seconds, and the job at
15 minutes. The output directory must be fresh (default
`outputs/tutorial-browser`). Public assets are linked from the checkout rather
than copied into a second large asset tree. Receipts record the source hashes,
browser executable hash/version, dependencies, output bundle hashes, and cleanup.
The workflow retains only receipts, logs and screenshots for seven days, even
on failure; it does not upload dependencies, the bundle, or original game assets.
Local typechecking/full builds should not be repeated just to run this check.

After the existing Tutorial groups, one Mission 1 scene checks live-world selector
inspection. A fresh context follows New Game → recommendation No → Start Mission 1
→ Skip introduction, then Game settings → Options → Browser compatibility and help
→ Select Level. Browser controls' Inspect campaign world selects Mission 2 without
starting it. Both initially paused and initially running episodes exercise Back,
Escape, Continue Game, and a second Escape from the returned pause menu.
Read-only observers retain world/scene/canvas and captured menu-session identity,
check frozen level/turn/time and modal suspension, and reject disposal, terrain
abort, canvas removal, or a loading replacement. Continue and repeated Escape must
restore the captured pause policy. This differs from Quit Level → Yes, which
abandons the world. `selector-inspection.json` and two screenshots retain the
episode results; the runner's source manifest includes the added scenario.
The selector receipt is saved after observation/context cleanup and validates late
runtime errors. Scenario failures and each cleanup failure remain in the terminal
receipt; cleanup still attempts to close the context if observer teardown fails.

The final bounded Mission 1 scenery/placement episode follows the actual New Game
recommendation, Start Mission 1, Skip introduction, Pause, Brave selection and Hut
controls. Read-only observers project authored settlement points into the viewport;
real pointer events exercise valid, invalid and scenery-overlapping footprints.
Repeated paused previews must leave building IDs and retained scenery poses unchanged.
After Resume, an invalid click must create no building and a valid click must create
exactly one plan. No world entities, selected IDs, camera poses, simulation clocks,
rendering calls or placement helpers are injected. Screenshots and
`scenery-placement.json` include actual renderer/viewport/DPR and observed state.
The new scenario has a 60-second bound inside the unchanged 180-second aggregate
browser bound; existing Tutorial and selector scenarios still run first.

This is preview/plan and scenery-preservation coverage, not completed construction,
tree depletion/regrowth, native-executable equivalence or hardware performance.
The scenario's own context closes before terminal acceptance, including late runtime
errors; the runner hashes its source and retains its normal failure/cleanup receipts.
No new workflow, browser-download route, permission or timeout increase is involved.

## Selectable M2 pointer/F8 functional diagnostic

`POPULOUS_BROWSER_SCENARIO=m2-pointer-f8 node scripts/tutorial-browser/run.mjs`
selects an isolated diagnostic invocation of the same runner. The default
`tutorial` selection retains all existing Tutorial, selector and scenery episodes,
then appends M2 on the reviewed F8/picker composition. The isolated selection does
not imply the default episodes passed. Unknown selections fail. No workflow is
changed: the existing job invokes the default sequence.

Node generates `createWorld(2)` from the exact checked-out source using the existing
fixture loader. Its immutable structured checkpoint, source/Node/RNG identity and
SHA256 are recorded. The JSON transport preserves typed-array buffers/offsets,
Maps, Sets, special scalar values and shared references. The V8 copy is an additional
local artifact; the JSON transfer/source receipts match the existing hosted artifact
filter. Both checkpoint copies are hash-checked again after execution.

Only disposable-context test setup seeds IndexedDB `latest`, verifies the completed
transaction by full structured readback, then reloads Home and clicks public Load
Game. A read-only synchronous store subscription verifies the entire loaded world
against the exact-source restore/load migration result before normal RAF advances.
This is imported test setup, not a user save or earned campaign-unlock evidence.

A 45-second total scenario bound includes IDB admission and public Load, then
ordinary Skip/Pause/F8/pointer/camera,
resize and menu/resume inputs, including unchanged selection/order witnesses while
paused, actual renderer/state, layout, overlay input transparency and reset checks.
The aggregate browser bound stays 180 seconds; browser sandbox/config stay unchanged.
No live world, camera, clock or selection mutation is injected. Seam crossing,
hidden-tab behavior, hardware FPS, overhead and responsiveness remain unproven;
this functional mode does not report performance acceptance.

Activation budget: the initial PR533 hosted receipt measured 85.178 seconds for
build plus all prior browser scenarios (Vite reported 1.41 seconds). Independent
browser-phase timestamps were not recorded, so 85.178 seconds is a conservative
observed browser upper bound, not an exact browser duration. Adding the M2 total
45-second cap leaves about 49.8 seconds within the unchanged aggregate 180-second
cap on that observed workload. This is feasibility planning, not a performance
guarantee; the composed hosted run must actually pass without excluding episodes.
