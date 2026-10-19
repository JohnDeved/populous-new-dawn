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

Admission is only `pull_request: ready_for_review`, with the existing main-branch
and path filters. Ordinary draft opening, synchronization and conversion create no
browser-workflow run, rather than a failing draft precheck or a skipped validation
job. The runtime ready guard remains fail-closed defense in depth. Full already
uses the same ready-event-only policy and is unchanged; no skipped duplicate
`Full check` is introduced (see the #526/#528 eligibility observations).

After source changes or a main refresh, review the exact new candidate and issue
one draft-to-ready transition when fresh validation is needed, including a PR
opened already ready. An old-head green check, missing/path-filtered run or skipped
job is not acceptance. Preserve the existing source-bound head/base/merge check
before merge; readiness is an admission signal, not permission to reuse stale
results. Historical runs and their failures are not rewritten by this trigger fix.

GitHub documents activity-type filtering under
[events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).

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
The workflow retains only receipts, frame/analysis JSON, logs and screenshots for seven days, even
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

The bounded spell-projection episode uses a fresh public Mission 1 start, then
public Pause/Resume/Pause around at least eight naturally advancing turns. It
records scene/store/world identity, computer-tribe eligibility, living outside
people, renderer details and comparable-view before/after screenshots. Test-only
Chrome precise function coverage is reset while paused immediately before Resume.
The browser script must match the emitted bundle byte for byte; the emitted source
map must embed the exact app/computer-runtime.ts source. Each of the three own
function declarations (stepComputerSpells, computerSpellWorld, computerSpellPerson)
must map unambiguously to a positive call count. A nested callback, script root,
stale source or missing map cannot substitute for that evidence. The existing
production-mode fixture builder emits source maps without changing minification.
Node's built-in SourceMap reader adds no dependency.

The episode has a 35-second body bound inside the unchanged 180-second aggregate
browser bound. Coverage and context cleanup are independently attempted. Retained
spell-projection.json, spell-projection-coverage.json and screenshots bind this
functional witness to the runner's source manifest and hashed built artifacts.
Precise coverage changes optimized execution: these observations are not timing,
FPS, GC, natural spell-firing, terrain-refresh rendering or native-equivalence
acceptance. Paired baseline/candidate screenshots must retain exact source and turn
identities; unequal final turns are not deterministic pixel-comparison evidence.

## Real IndexedDB profile recovery (#90 / #342)

The separate `Profile recovery browser` job selects
`POPULOUS_BROWSER_SCENARIO=profile-recovery`. It uses the same exact-merge build,
source/dependency manifests, official sandboxed Chrome and 180-second browser cap;
it does not extend the Tutorial sequence or generate the M2 checkpoint fixture.
Its artifact is named `profile-recovery-browser-<merge SHA>`.

The retained nine-case scenario exercises seven diagnostic storage fixtures plus
ordinary public Save → fresh-page Load and an in-session usable checkpoint after
storage corruption. Fixtures use actual IndexedDB committed transactions in fresh
contexts. Read-only full stored-record digests and forwarded write observation
must show no restore/load mutation. UI availability, loaded fields, actual WebGL
canvas and screenshots remain required. The current-world-without-drawMode case
only checks that legacy default, not arbitrary historical saves. Page reload is
not browser-process restart; no original binary-save, deployment or full PND-07
claim follows. `profile-recovery.json` records every case and terminal failure.
The build/browser gate must actually pass on the final candidate; focused Node
checks and source review alone do not close #90.

The current composition retains Tutorial and Pause checkpoint recovery as separate
matrix jobs and adds Profile recovery as a third job, with no change to their
caps or assertions. Profile startup and loaded worlds reuse the reviewed public
Skip-or-unlocked readiness helper. No forced simulation ticks or production state
mutation is used to satisfy readiness.

The explicit reviewed `profile-recovery-v1` integration policy requires all three
jobs; historical single-job and `pause-recovery-v1` two-job admissions remain
separate. Profile success emits a bounded source-bound terminal envelope with
all nine case results, unchanged runtime evidence and hashes of the two actual
screenshots and full raw receipt. Failed scenarios retain the original report and
error, never a successful compact envelope. Candidate policy modules are not a
trusted authority; the coordinator must review and pin the transition externally.

## Automatic live Level 2 frame recording

`POPULOUS_BROWSER_SCENARIO=gameplay-frames node scripts/tutorial-browser/run.mjs`
selects an isolated real-browser recording. The existing ready-only workflow adds
`Gameplay frame recording browser` alongside, not instead of, Tutorial, Pause
checkpoint recovery and Profile recovery. It retains their triggers, sandbox,
180-second browser bound, 15-minute job bound and seven-day artifact retention.
The separate required `Full check` workflow is unchanged. The integration
coordinator must explicitly review the four-job workflow transition before using
it as merge evidence; three historical green jobs do not certify the new episode.

The scenario starts the authored Mission 2 through New Game → recommendation No
→ Browser controls → All missions → Mission 2, then uses the public Skip control
if needed. This is direct public mission access, not campaign-unlock proof. No
checkpoint or user profile is imported and no scene state, simulation clock,
renderer call, picked object or exported sample is injected. It does not force
terrain changes or claim construction/spell-mutation coverage.

At fixed 1440×1000 CSS pixels and DPR 1, normal-speed natural RAF advances the
world through a two-second warmup, then five independently labeled 1.6-second
phases: rendered-person hover, public camera rotation/pan with a world pointer,
HUD hover, world-pointer recovery, and world-pointer recovery after a public
pause-menu interruption. Twelve specified pointer offsets at 120 ms intervals
and the camera key-down/up schedule are retained in `gameplay-frames.json`,
alongside actual browser timestamps, coordinates, turns and phase outcomes.
Actual duration can exceed the requested duration on a busy renderer. Camera
motion and scene work are measured, not assumed identical across machines.

Each phase enables a fresh F8 window and activates the actual Export recent
frames button with keyboard Space. `gameplay-frame-<phase>.json` is the unchanged
browser download using the existing schema. A separate
`gameplay-summary-<phase>.json` contains its hash, the independent phase bounds,
selected raw frame indices, measured work totals, the existing offline parser
output and overlapping cohort distributions. Only complete RAF intervals inside
the observed phase enter that phase's summary. Boundary/export input frames are
retained in raw data but excluded from the phase summary. Timings can validly
quantize to zero; positive counters establish actual work.

Acceptance rejects menu/paused-only captures, nonadvancing turns, non-rendered
frames, absent/wrong pointer routes, zero terrain/object queries or terrain work,
missing initial native-occlusion work, unchanged camera inputs, ring overflow,
and wrong mission/build/viewport. The raw export now embeds the real checkout
revision through the production Home fixture build, including `-dirty` when
applicable. The enclosing receipt binds source and bundle hashes, exact browser
executable/version, package versions, OS/CPU identity and available GitHub
head/base/merge/run/runner-image metadata. Failures retain available raw files and
terminal diagnostics rather than producing a successful recording.

Find the artifacts under `gameplay-frame-recording-browser-<tested merge SHA>`.
They are generated only in ignored output directories and never committed. These
are cloud/browser-renderer workload diagnostics, not the user's Mac GPU results,
presented FPS or hardware smoothness acceptance. Compare matching phases,
viewport, renderer/runtime and observed work/turn counts across source-bound
builds; unmatched workload, scheduling and runner variation cannot establish a
causal speedup. Nested CPU timing buckets overlap and must not be summed.

### Ordinary M2 melee artwork

After every existing gameplay-frame phase/export/assertion, that same job closes
its first context and starts one fresh authored Mission 2 context. Public New Game,
recommendation No, Browser controls, All missions, Mission 2 and Skip controls lead
to public Pause and Select and focus shaman. One public `-` zoom-out reaches the
ordinary bird’s-eye preset (2), explicitly not the no-person world overview.
A declared pure minimap inverse chooses the nearest input to Green Shaman 20,
then adds exactly `(0,+12)` minimap backing pixels, converted to CSS coordinates,
for one public camera click. This fixed setup frames the target above the pause
badge and the retained approach/interception corridor inside the canvas; it is
not adaptive camera pursuit. Nearest input, offset, actual click, predicted native
point and resulting camera are retained. Bounds and actual minimap DOM ownership
must pass before the click. Source-bound CPU geometry is setup rationale only;
that person must be outside, visible and eligible in the actual renderer's picking
metadata, and real pointer hovers must identify him before the attack click.
The same five fixed body-interior candidates are checked for actual DOM ownership
before waiting for canvas pointer events. A HUD-covered candidate is recorded and
skipped, never clicked through; an exposed candidate still needs a real pointer
event, a later renderer stamp and the ordinary hover winner. No qualifying point
fails closed with the complete attempt trace, without moving or hiding the HUD.
The observer is installed before public Resume, then fresh live eligibility,
bounds, DOM ownership and hover checks precede a public Shift+left attack click.
Shift is released in `finally`, even on input failure. Shaman 54's actual target,
issued-command turn and renderer stamp are recorded; all accepted observations
must follow that command. Defenders may naturally intercept the order; actual
opponent and encounter participant IDs are retained,
not forced. The native artwork assertions still observe Blue Shaman 54.
No person, health, position, selection, clock, renderer call or command is injected.

The first hosted attempt at `fd435e24` failed before any attack: Warrior 13 was an
invalid public target. An exact-position/turn CPU replay places him inside Hut 71,
where ordinary picking correctly rejects him. That failed artifact is not an
animation failure or browser acceptance. The repaired route records eligibility,
camera/preset, bounds and hover winners, plus a best-effort failure PNG and state
trace before cleanup. A closed/crashed page may prevent those diagnostics; missing
evidence is retained explicitly rather than treated as a pass.
The second attempt at `24eb18a1` confirmed eligible Shaman 20 and ordinary preset 2,
but the pause badge covered the first body-interior point. Its pointer wait timed
out before the previous late DOM guard could skip that point. That separate failed
artifact includes the actual failure screenshot and is also pre-attack setup
evidence, not an animation failure. The ownership preflight preserves every
candidate, camera input, timeout and native artwork assertion from that attempt.
The third attempt at `5895f983` then recorded all five body-interior points owned
by the paused badge or its child and correctly failed closed before attacking.
The fixed corridor offset addresses this observed setup obstruction. Projection
of retained startup/encounter witnesses predicts target bounds above the badge
and attacks inside the viewport, but neither CPU projection nor these three
pre-attack failures establish browser artwork acceptance. The prior unshifted
inputs and screenshots remain retained; no live fallback offset is attempted.
The fourth attempt at `cf4a691b` confirmed the fixed camera and real canvas hover
on eligible Shaman 20, then failed because plain left-click takes the selection
branch and paused World rejects commands. No attack order or animation result
was produced. The repaired public Resume / Shift+left route is backed by actual
pointer-down/up caller regressions on authored Worlds for all four paused/running
and plain/Shift combinations, not a direct command invocation. All four prior
failures remain separate setup evidence; the later diagnostic below supplies
actual command and artwork observations but does not pass the strict hold contract.

The corrected one-job diagnostic at `0da6bcb9` (run 39176936163) reached actual
public command delivery: target 20 at turn 143, then natural Shaman 54 versus 20
combat. All five observed special samples matched original object 552 and their
native directional frames; four same-frame crops showed changing visible poses.
The original strict running-hold validator still failed: turns 508/509/511/517/519
never repeated across renderer stamps. The sampled interval averaged 131.06 ms
per stamp, including rendering, scheduling and readback. No callback-end or
readback span was recorded, so observer overhead cannot be isolated. That failed
run remains failed, not relabeled as a cadence pass. A preceding diagnostic
failed Chrome admission before build/browser; the reviewed normalization repair
kept exact version/bytes pinned and retained raw output before comparing.

The subsequent layered diagnostic at `ac72f1de` (run 39178423583) also remains
failed under its unchanged contract. It delivered target 20 at turn 145, observed
attack object 456/frame 1006 at turn 514 and frame 1008 at turn 516, then eight real
paused render stamps at turn 516/clock 1032. The two held PNGs are byte-identical,
with complete canvas-owned bodies and no overlay intersection. Public Resume was
observed unpaused at turn 522 in recoil, but that observer omitted non-attack
phases and captured no synchronized successor artwork. Its first failure was
missing running-after-resume evidence, not wrong artwork or a timeout. Existing
gameplay exports, source identity, runtime-error and cleanup guards passed.

The original attack duration is four turns: entry retains three countdown turns,
so start 514 expires at turn 517. Pausing at 516 leaves only one inferred turn;
normal resume can expire it before another attack render. That inference is not a
recorded countdown or successor crop and cannot retroactively pass this artifact.
The revised protocol records the actual remaining count and physical source
fields. It requires `remaining = started + duration - 1 - turn` during the attack,
with original-table duration, and retains the same actor, physical person, fight
and actual opponent. Same-attack resume must advance before expiry. Exact-expiry
approach must retain the final native attack pose; later approach/ready must map
original walk or idle rows while retaining the original action start/marker.
A narrow uninitialized recoil requires its same-turn, original-mapped Shaman
opponent producer and actor-before-producer roster order, and must occur before
the earliest possible intervening complete attack. Initialized fallback recoil,
an unknown producer, changed fight/person/opponent, early expiry, a future attack
or missing source/crop evidence fails closed. This is source-qualified existing
successor-render consistency, not new recoil-entry/reset/cadence parity.

The observed raw source fields admit only the reviewed visual-source branches;
that is an explicit source-contract inference, not direct observation of a private
getter return. Retained physical-reference identity, logical stamp and actual
rendered draw/frame/flip/layers are independently checked. No production hook or
runtime change is added. Both prior failed runs and their strict validators remain
preserved, alongside the new transition-specific negative tests.

The separate 75-second case fits inside, not in addition to, the unchanged
180-second aggregate browser cap. The PR adds no new workflow/job, browser route,
dependency, cap increase or resource-policy refresh. A separately reviewed one-job
diagnostic is not a readiness/full-gate run. Hosted execution must
actually meet that budget. The existing complete frame exports remain separate
from this functional case and retain their original assertions and interpretation.

A read-only post-render RAF observer keeps the same maximum ten-turn window from
the first Shaman attack. The separately named `public-pause-transition-v1` protocol has three explicit
phases: `running-before-pause`, `public-paused-hold`, and `running-after-resume`.
After the first natural attack signal, one public Space pause requires actual
canvas keyboard focus, no dialog, mode, modifier or input mask, and a live attack.
The actual paused action/start/turn is recorded; it is not assumed to be the first
observed sequence. Final acceptance explicitly binds the validator's paused anchor
to both paused input receipts, and brackets paused/resumed renderer stamps with
the public input receipts. Two distinct real renderer stamps must retain identical turn,
animation clock, action/start, object/draw/f1/f2, direction/frame/flip and opponent.
One public Space resume must then produce the first logical-clock-advanced render
of either that same attack or its source-proved legal expired successor. The observer
retains same-turn resumed renders, then stops at that first advanced render even
if its phase or crop is invalid. It never waits for a later attack. Both Space keys
are released in `finally`. Landing outside an attack or missing evidence fails
closed; there is no retry to seek another attack and no World/clock rewrite.

The viewport remains 1440×1000 at DPR 1, with the 200-pixel HUD leaving a 1240×1000
game canvas. Camera, target, startup route, game speed and all budgets remain
unchanged. Exactly four small canvas crops are reserved: first running attack,
first two paused render stamps, and first logical-clock-advanced resumed render. Each binds
physical native object/draw/f1/f2, original directional frame/flip, visible
body-layer submission and the actual renderer stamp. Full body bounds must fit
the canvas; actual DOM ownership at the body center and non-overlap with the
shipped HUD/pause/message/dialog rectangles are recorded and required. This
guard matters because canvas readback excludes HTML overlays. Crops are copied
synchronously with those samples, with
their PNG hashes, source/frame/turn/renderer stamps and crop coordinates retained
in `melee-attack.json`. No hidden-body redraw or replacement rendering method is
used. A later paused context screenshot is labeled separately, not substituted
for those same-frame crops. Terminal acceptance includes observer/context cleanup
and runtime errors; available partial observations survive ordinary failures.
The observer does not mutate World or issue hit-selection queries, but reading
crop bounds may touch renderer/picker metadata. Readback perturbs rendering.
The retained crops require visual review; metadata
matching alone does not prove pixel-perfect composition or hardware performance.

The original table mapping is independent of observed artwork. Idle source 424
cannot satisfy Shaman strike source 456, even if an ownership marker is forged;
the pure validator's baseline-shaped fixture is an explicit negative test of this
same predicate. Running this same browser case against the old runtime is a
failure-first route, not an already executed browser-baseline claim. The retained
ordinary CPU baseline separately observed that exact idle-pose failure.

Coverage is deliberately layered, not a generic `paused=true` exemption:

- Running browser samples must prove original mapped artwork and advancing logical
  phase/frame in the paused attack sequence before the public pause.
- Public-paused browser samples prove native-pose hold across real renders.
  `page.tsx` toggles ordinary pause; `scene.ts` still updates/render-submits people,
  while `game-clock.ts` and `live-people.ts` freeze native animation. Retained
  `004ee770.c` gates animation lists on the pause flag; this is not a newly
  verified original-game Space-key/UI mapping.
- The actual Scene CPU regression explicitly asserts unpaused equal-turn/equal
  native-phase/equal-artwork pairs around a one-turn advancement. It executes the
  real frame-selection caller with supplied texture/projection/motion boundaries,
  not a GPU render. The 30/60/120/144 Hz/irregular CPU schedule checks remain separate.

Both prior validators remain byte-identical: `validateMeleeAttackFrames` rejects
paused evidence or absent running same-turn hold; `validateMeleePauseFrames` requires
same-attack resumed advancement. The separately named `validateMeleeTransitionFrames`
does not retroactively pass either failed run or claim running same-turn browser
behavior. Missing observations fail closed. No protocol proves original absolute FPS, hardware
smoothness, Firewarrior browser behavior or pixel-perfect composition. Broad issue
#214 and recoil/knockback remain outside this acceptance.
