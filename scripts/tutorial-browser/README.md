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
→ press Space to skip the introduction, then Menu → Options → Browser compatibility and help
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
recommendation, Start Mission 1, press Space to skip the introduction, Pause, Brave selection and Hut
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

A NEW ordinary-M2 policy grants one setup phase of at most 45 seconds, then one
shared functional phase of at most 45 seconds for all pointer/camera, four viewport
layouts, public exports, scrolling, F8 reset and live resume/menu inputs. The single
absolute 90-second bound starts before context acquisition and includes cleanup,
clipped by the unchanged enclosing host remainder. The transition requires exact
public Load, completed introduction, paused scene and the same restored authored
popup. No per-case reset or unused-setup transfer is allowed. This is explicitly
+45 seconds of functional admission, not an optimization or recovered old bound.
See [ordinary M2 policy](../../engineering/ordinary-m2-functional-admission.md).
The isolated M2 host remains 180 seconds and Tutorial host 240 seconds;
browser sandbox/config, all per-action caps and state/geometry oracles stay unchanged.
No live world, camera, clock or selection mutation is injected. Seam crossing,
hidden-tab behavior, hardware FPS, overhead and responsiveness remain unproven;
this functional mode does not report performance acceptance.

Historical activation budget (not the current policy): the initial PR533 hosted receipt measured 85.178 seconds for
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

The later `public-pause-transition-v1` protocol recorded actual countdown and
physical-source fields and accepted only a same-attack resume or a tightly
source-qualified expired successor. Run 39179935993 passed that historical
contract: running special turns 515→517 advanced f2 1→3 and frames 1029→1031;
its resumed sample at 518 was exact-expiry approach. Run 39180912617 separately
passed with running special turns 504→506, f2 0→2, frames 1033→1035 and a resumed
same-attack sample at 507. These are historical successes, not evidence for the
replacement protocol below: only their first running sample had a running crop.

Run 39181971639 remains failed under that same transition contract. Its only
running attack sample was turn 491, started 490, remaining 2, f2 1/frame 1007.
One trusted Space landed at turn 493, exactly when the native attack expired to
approach. The first failure was the post-pause attack predicate, not incorrect
artwork, missing source identity or a timeout. Its actual fight opponent was
1207 in group 1254, despite the original public order to target 20. One sample
cannot establish running advancement, and this run is not retroactively passed.

#### Maintained running-artwork contract

The maintained browser acceptance is `running-original-entry-v2` in
`melee-attack.mjs` and `validateMeleeRunningObservation` in
`melee-attack-running-evidence.mjs`. This is an explicit correction of the former
v1 ten-turn survival contract, not a retroactive pass for its failed receipts.
Public setup Pause/Resume, real command delivery, all per-render attack artwork
and crop checks remain unchanged. After the attack command no input interrupts
observation. The first observed attack/strike/special anchors one immutable
actor/action/start/group/opponent entry and the original physical person.
Independent original tables, passed to the observer before Resume, set duration
`D = (descriptor.step + 1) * nativeFrameCount`; the endpoint is
`entry.started + D - 1`, never first-observed-turn plus a chosen grace period.
The observer retains every attack render before that endpoint and must observe
its exact logical turn while the same actor is still alive. Neither an advancing
pair nor the fourth crop ends the episode. A missing/changed entry, early action
change, death, or skipped endpoint fails even after a valid cropped pair. A later
entry cannot replace the first or provide more favorable evidence.

The endpoint follows `melee.ts` and `combat-runtime.ts`, both now source-hashed:
entry initializes `remaining = D - 1`; later visits decrement it, and expiry
changes to `approach`, clears the countdown and continues without same-turn
re-entry. For Shaman special, object 552/draw 14 has step 0 and five mapped
frames. An entry at turn 402 therefore has four live attack poses at 402–405,
remaining 4/3/2/1, f2 0/1/2/3. At 406, f2 4 is the fifth native frame but the
action is already `approach`, not a fifth live attack sample. The v2 endpoint
records that exact transition, retained entry/person identity and native phase,
not a successor-artwork or extended combat-survival claim.

The separately named `entry`, `endpoint`, protocol and schema-version fields
prevent old ten-turn receipts from being interpreted as v2. Acceptance requires
an `entry-complete` terminal with the exact endpoint turn/stamp, later than every
retained sample, plus alive actor, physical state/phase and unchanged running,
Scene/world/canvas/document guards. Deferred crop failures still fail acceptance.
Later death cannot alter an already completed episode, but actor loss before or
at its endpoint fails. Supplied-observer tests are not browser evidence; fresh
source-bound hosted evidence is required for this revised contract.

Run [39406765707](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39406765707)
remains failed under v1. It retained valid-looking special crops at 402–405 and a
diagnostic alive `approach` visit at 406, then Shaman54 disappeared at 411 inside
its [402,412) window. Its failure screenshot shows the reincarnation message.
That diagnostic supports the endpoint rationale but is not a v2 terminal receipt;
no stored failure, HP, enemy setup, game timing or runtime code is changed.

The first four distinct native poses reserve the only crop slots, before
visibility or bounds eligibility is decided. Pose identity includes actor,
action/start, fight/opponent, native object/draw/f1/f2 and sprite direction.
Repeated same-pose renders do not consume slots. A missing or obstructed planned
crop fails acceptance and cannot be replaced by a later eligible duplicate.
All planned crops are required, with at least two forming a same-direction,
same-sequence pair whose logical turn, native f2 and actual mapped frame advance.
The observed fight must retain the same actor, original physical person and group.
The first entry retains its action and actual opponent; natural interception
is not forced to target 20. Sequence and crop identities include that opponent,
and no later sequence can substitute for either endpoint of the advancing pair.
Sparse rendering that supplies only one pose or misses the exact native endpoint
still fails. This is not a guarantee against arbitrary scheduler starvation.
The standalone supplied-frame validator still exercises historical multi-entry
identity constraints; maintained browser acceptance additionally requires that
all retained samples belong to its immutable first entry.

The earlier global-opponent assertion rejected the normal special entry at turn
395 against person 13 followed by an attack entry at turn 400 against person
1207, both in group 1252. The first entry expires at turn 399. An ordinary M2
CPU command/clock regression reproduces these entries without editing positions,
health, RNG or AI. This corrects a witness contract, not gameplay, and does not
retroactively turn the failed hosted receipt into a browser pass.

Independent original tables determine each attack's object/draw, descriptor
step, native frame count and duration, and directional frame/flip. Exact native
phase/countdown, physical state/model/class, fight roster, logical animation
stamp, no flight/airborne override and submitted renderer draw are required.
Every sample must show a connected canvas, live Scene/store, visible body and
submitted layers. Idle object 424 cannot satisfy attack object 456 even with a
forged ownership marker. Source ownership remains a reviewed-source inference
plus independent mapped artwork, not a private getter-return observation.

This functional artwork context uses a fixed 960×720 viewport at DPR 1;
the separate performance frame-recording context remains 1440×1000. The smaller
raster workload is intended to improve acquisition of short native attack poses,
not to slow gameplay, extend the native entry or relax artwork/crop requirements.
The failed PR #666 1440×1000 attempt retained only one attack pose and remains a
failure. Actual viewport, canvas and WebGL drawing-buffer sizes are recorded,
alongside every observer/RAF timestamp and crop-copy cost; improved acquisition
must be verified in the hosted run, not assumed. Full cropped body bounds must fit the
canvas; actual DOM ownership at its center and non-overlap with shipped
HUD/pause/message/dialog rectangles remain required. Canvas readback excludes
HTML overlays, so these checks cannot be inferred from nonblank PNGs. Copies
are synchronous with samples, with source/frame/turn/renderer binding, crop
coordinates and PNG hashes retained in `melee-attack.json`. No hidden-body redraw,
replacement rendering method or game-state mutation is used. Bounds reads may
touch renderer/picker metadata; copying perturbs rendering. Crops require visual
review and are not pixel-perfect or hardware-performance evidence. A later
paused context screenshot is separate, not an advancing-pose substitute.

The observer now draws each eligible crop exactly once into a private 2D canvas
in the same sample callback. At most four copies, each at most 256×256 pixels,
are retained. Neither pixel readback/color scanning nor PNG encoding runs during
any observer RAF, including the terminal callback. Explicit `retain()` stops the
observer if necessary and processes only those immutable copies, never the live
game canvas. Retention releases all copied backing stores even after a readback
or encoding failure. Failed crops and their timing remain in the report, other
copies are still retained, and repeated stop/retention cannot change the terminal
record, retry a failed crop or replace a missing slot. An early stop remains an
incomplete witness; a retention failure cannot pass acceptance.

Every observer RAF records its performance timestamp, supplied RAF timestamp,
logical turn, renderer stamp, animation clock, pause state, action/entry, actor
life and observed pose, including pre-attack approach, held and non-attack visits.
Pre-inspection error rows set `actorInspected: false` with null actor/action
fields. The exact native endpoint is inspected and retains its alive actor,
entry and phase evidence before completion. Each row records observer-body and synchronous
copy elapsed milliseconds separately. Copies record later readback/color-scan
and encoding elapsed milliseconds, with the retention timestamp/duration kept
separately. These measurements include their own perturbation and do not measure
GPU completion, full Scene cost, original-game timing or hardware smoothness.
The all-visit diagnostic bound is 18,000 rows (75 seconds at 240 callbacks/second),
separate from the unchanged 1,200 attack-sample bound. Exhaustion fails explicitly
at its terminal row, without silently dropping visits or extending the case cap.

The union hosted run [39303586144](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39303586144)
retained only attack turn 491, entry 490, renderer stamp 304, native f2=1,
direction 6 and frame 1007, followed by a window-complete terminal at turn 502,
stamp 310. It correctly failed the advancing-pair requirement. Its absent
non-attack visits and copy/encoding timings cannot establish why intermediate
attack frames were missed. `scene.ts` advances the elapsed game clock before
rendering, and `game-clock.ts` consumes chronological fixed turns; a rendered
frame can therefore legitimately follow several logical turns. Deferred work is
a candidate reduction of in-window observer work, not proof of the earlier
failure's cause or a performance improvement. Historical failures remain failed.

Paused target-hover preparation is source-feasible: ordinary paused Scene frames
still call `updatePointerFrame`, and public `pointerMove`/hover are not blocked by
ordinary pause. That is distinct from a suspended modal. However, the current
public Resume button moves the pointer, so a paused hover cannot replace a fresh
post-Resume public hover check. This candidate leaves setup unchanged to avoid
confounding the sampling diagnosis. In the failed union receipt, paused setup
was turn 125, after Resume 133, before attack 148, and the public order turn 152.
No gameplay/RNG/health edit, private hit query or setup-timing guarantee follows
from those source observations.

The case retains its 75-second bound, 1,200-sample storage bound and the unchanged
180-second aggregate browser cap. No workflow, dependency, browser route, game
speed or budget increases are introduced. Existing full gameplay frame exports
remain separate with their assertions unchanged. Runtime errors and observer/
context cleanup still participate in terminal acceptance; partial failure data
is retained. A diagnostic is not a full-gate/readiness pass.

Coverage is explicitly layered:

- Browser: real public order, visible original attack artwork and cropped
  same-direction/same-sequence logical advancement only. No browser in-attack
  pause/hold/resume or running same-turn hold is claimed.
- `tests/melee-attack-animation.test.mjs`: deterministic actual Scene unpaused
  same-turn hold/advance and pause-to-exact-expiry rendering, executing the real
  frame-selection caller with supplied texture/projection/motion boundaries,
  not GPU rendering or trusted keyboard input.
- Its separate 30/60/120/144 Hz and irregular schedule checks compare simulation
  World states with pause/speed changes; they do not render Scene artwork at each
  schedule. Public pause-control coverage is separate and does not reconstitute
  the removed end-to-end attack/Space claim.

Superseded validators/tests remain in Git, not as alternate executable acceptance:
[strict running-hold at `0da6bcb9`](https://github.com/JohnDeved/populous-new-dawn/blob/0da6bcb9d5adb970fde6b91d0e42623184c1eea1/scripts/tutorial-browser/melee-attack-evidence.mjs),
[same-attack pause/resume at `ac72f1de`](https://github.com/JohnDeved/populous-new-dawn/blob/ac72f1de622cec56094189d2a73b70de76b2c827/scripts/tutorial-browser/melee-attack-pause-evidence.mjs),
and [transition acceptance at `2b27d4a33`](https://github.com/JohnDeved/populous-new-dawn/blob/2b27d4a33fd8db4dd3fd8651fcda350c337c1d20/scripts/tutorial-browser/melee-attack-transition-evidence.mjs).
All earlier successes and failures keep their original scope and raw artifacts.
The earlier running-only diagnostic lacks current DOM/source fields; neither it
nor old transition receipts can establish an exact-head running-artwork pass.
Fresh source-bound browser evidence is required. No protocol proves original
absolute FPS, hardware smoothness, Firewarrior browser behavior or pixel-perfect
composition. Broad issue #214 and recoil/knockback remain outside this acceptance.

## Compact campaign/status message layout (#538)

The additional `Compact message layout browser` matrix job selects
`compact-message-layout`. It reuses the exact imported authored Mission 2
checkpoint, public Load/Skip/Continue/Pause admission and read-only scene observers
from the existing M2 scenario. It does not append work to the pointer/camera/export
episode or replace any existing job. The new episode has the same explicit
45-second cap from before navigation through public settings, all captures and
restoration; the existing 120-second build, 180-second outer browser and 15-minute
job caps remain unchanged. This is one additional hosted job, not free coverage.

The public Menu → Options → Browser compatibility and help → HUD size
control selects Automatic and 400%. Each preference covers 900×360 and 640×480
with authored campaign and objective/status messages active. Receipts retain
individual wrapped text-fragment bounds, scroll dimensions via fit checks,
F8/pause/campaign rectangles and close/export/pause hit testing. Every case toggles
F8 off again and requires exact restoration of ordinary text geometry and fonts.
Screenshots are `compact-message-{auto,4}-{900x360,640x480}.png`; terminal results
and partial failure witnesses are in `compact-message-layout.json`.

Only these preferences/sizes are browser acceptance targets. Other supported
manual preferences have equal source-derived clamping at these two sizes, not
separate browser captures. This layout correction neither hides messages nor
reduces font sizes, and does not claim universal small-window or hardware
performance support. #538 remains open until exact-source hosted receipts and
actual screenshots are reviewed successfully.

## Frontend held-Escape regression

`POPULOUS_BROWSER_SCENARIO=frontend-held-escape node scripts/tutorial-browser/run.mjs`
uses the existing production Home build, preview server, browser, source fingerprints
and cleanup. One permanent, separate `Frontend held Escape browser` matrix job is
added to the existing ready-PR workflow; this is additional hosted work, not free
coverage appended to Tutorial or pause recovery. Existing selections and caps stay
unchanged: 120-second build, 180-second browser, 15-minute hosted job.

The new episode has its own 60-second bound, including Home navigation. It uses
one 1280×960 viewport, two Help → Options held-Escape/release/fresh-press episodes,
one direct Options control, one Quit control and one screenshot. Trusted keyboard
events and final default prevention, category/focus retention, repeat reopening,
unchanged URL/history/storage and absence of battlefield startup are observed.
On deadline it closes only its runner-owned page to interrupt pending actions;
the existing runner owns final context/browser/server cleanup and failure receipts.
This is frontend navigation regression coverage, not native-game input parity,
deployed hydration, exhaustive display acceptance or a performance measurement.

### Grounded Shaman casting artwork in the existing F9 episode

The same `frontend-held-escape` job already runs the independent F9 Mission 1
episode after its frontend context closes. Casting coverage reuses that F9 Scene
and its current absolute 75-second bound, inside the unchanged 180-second browser cap.
It adds no world, context, workflow, grant, driven simulation turn or production
test hook. All existing F9 input, grant, charge, cooldown, save/load and restart
assertions remain in order.

Before any testing grant, ordinary public Resume waits for the authored Shaman's
native rest state and completion of opening order18. Public Pause, Select and
focus shaman, the ordinary HUD Blast card, Resume and a real terrain pointer
click spend naturally available stock. The existing post-grant F9 Blast is the
subsequent cast, not a second claim of naturally acquired stock. Both allocations
must synchronously debit one charge, preserve the mana pool and set cooldown12.

Pass-through callbacks preserve their original receiver, return and exception.
`afterTurn` observes each completed controller visit before that visit's logical
animation: projectile launch6, native pose expiry10 and cooldown expiry12 are
separate obligations. After the real `renderer.render` returns, the observer
records submitted frame, draw, flip, direction and person phase. The raw original
PE/VSTART/VFRA fixture supplies expected source520/frame identities; imported
indices are only bridged back to their original VFRA identities. Two reserved,
unobscured same-direction crops per cast must positively pass original artwork
validation. Readback and PNG encoding happen only after observers are detached.

During the existing second cast's active windup, public F9 suspends presentation
for 350ms before its original refill-preservation assertions. At least two actual
suspended renders must retain identical person, projectile, cooldown and turn
state, followed by a running rendered native-phase advance after public F9 close.
This proves modal suspension, not the separate world-pause control. Empty paused
coverage, static screenshots or only advancing logical samples cannot substitute.

`shaman-casting.json` and at most four `shaman-casting-*.png` files retain the
observations, original-input hashes and source identities. Partial failures are
retained before the existing context closes; a failed retention is never retried.
These are functional browser/artwork checks, not original executable execution,
pixel-perfect composition, every-tribe/direction coverage or hardware performance.

## Hypnotise artwork in the compact lane

After the unchanged compact-message layout and picking-path episodes, the existing
`compact-message-layout` lane runs one independent Hypnotise context. Its absolute
allowance is the smaller of 75 seconds and the remaining existing 180-second outer
browser deadline, including context creation and cleanup. No job, workflow or cap
is added. PR680's exact compact receipt at merge `5136c6f2` completed in88.520s
including preparation/build/cleanup; adding the full75s conservatively totals
163.520s. This is prior budget evidence, not a guarantee that the new run passes.

The test-only Vite entry imports `hypnotise-fixture.mjs` only with query
`hypnotise-fixture=1`. The production Home entry does not import it. Preparation
uses accelerated ordinary Mission22 mana charging and movement with the existing
mana-focus adapter, not real-time earning or campaign-unlock proof. It does not
supply stock, actors, callbacks or animation state. Preparation itself is bounded
by25s and checks elapsed time after batches/yields and before returning.

The episode saves the earned pre-cast state through the public menu and loads it
normally. A read-only subscription checks exact saved content at the synchronous
resumed notification; the public Pause button then allows reframing before the
HUD/pointer cast. Normal-speed RAF observation binds actual source frames,
materials/UVs and painter submission to synchronous canvas crops, checks the
fifth-visit target replacement and16-visit expiry, and records terminal hiding.
Display callbacks can skip frames; exhaustive16-frame proof remains in the
independent original-byte/pixel oracle and CPU tests. In-progress effect checkpoint
continuation remains separate CPU coverage, not a claim of this pre-cast episode.

The runner retains all five helper hashes and the opt-in fixture entry hash.
`spell-hypnotise.json` and `spell-hypnotise-frame-*.png` are written directly into
the existing artifact root, covered by its unchanged JSON/PNG upload globs. No
hidden subgroup, recreated artwork, raw production `/app/*.ts` import, new output
subdirectory or second checkpoint allowance is used. Any timeout is a failed
witness; a late-created context is closed without admitting the episode.

Hypnotise preparation preserves the public startup's initial mana allocation.
At turn zero M22 has 30,000 unallocated mana; after one ordinary turn it has
2,142 progress in each of 14 enabled spells. The old turn-zero-only test focused
before that allocation and earned stock in 5,948 visits (6,172 including walking),
which did not justify the former 6,100 charging ceiling after public startup.
The bounded charging ceiling is now 9,195 visits: ceil(85,000 / 37) * 4 + 3,
using the native model-7 charge cost, this authored idle cohort's observed
37 mana per four-turn scan, and at most three alignment visits. No credit is
assumed for the initial allocation; no mana/stock or actors are injected. The
initial turn, available mana, all spell progress, mask, actual charged turn and
visit count are retained. Failure retains the initial state and includes final
state in its error. CPU regressions include 0, 1, 20 and 60 ordinary startup
visits. The unchanged 25s preparation, 75s episode and remaining 180s outer
wall deadlines still reject overruns regardless of visit budget.
