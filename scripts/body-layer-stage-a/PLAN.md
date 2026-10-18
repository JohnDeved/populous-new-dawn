# Prospective real-renderer body-layer validation, revision 4

STATUS: design for review only. No browser launch, build, measurement, publication,
new cloud task or hardware qualification is authorized by this file.

## Sources and purpose

Baseline 5087f2e805097665c4fdcce657553db3a693bb76 versus candidate
8bd14a84e34545f9a0f0b1fe5c1ebbf8267e5f59 (tree
b1e72fb19f19be1161303871b2185918eec2978e). Source correctness accepted separately.
The question is whether omitted genuinely clipped body-layer draw submissions
preserve pixels and reduce meaningful whole callback/render CPU cost. CPU object
inventory reductions are not WebGL draw-call counts or GPU-time evidence.

Use a separately reviewed, one-shot GitHub hosted CI diagnostic with the existing
preinstalled supported Chrome and sandboxed launch configuration. The attempted
saved-cloud browser restoration was denied (403) and stopped. No download retry,
Mac use, sandbox relaxation, local build/browser, permission expansion, or secret
is involved. Require at least 2 GiB free before builds, a 512 MiB running floor and
768 MiB bounded evidence (symlinked immutable public assets are not copied or
counted as generated evidence). Reuse one locked base dependency install for both
exact-source builds. No user recordings. The diagnostic branch/workflow remains
unpublished until source review and explicit launch approval.

## Reused fixture, not a new gameplay toy

Use the existing exact-base snapshot-setup author: Level 2, 140 actual advanceGame
calls at 1/24 seconds, genuine skipIntroduction, turn 70, no input mask. Load the
same lossless checkpoint through the existing IndexedDB/public Load helper and
verify exact migrated World bytes before continuing. Preserve its source/asset
binding and pause-latch removal checks. Normalize camera/selection using the
existing public focus/right-click setup. Do not overwrite authored units or add a
synthetic favorable population. Fresh document/World/context for each child.

F8 is off (scene.fpsGraph === null), no GPU timer observer is installed. Bind
the canonical browser window to 1440x1000, devicePixelRatio 1 and renderer pixelRatio
1. The main cohorts retain the actual HUD-laid-out canvas, not a forced window-sized
canvas. Record its CSS rectangle and actual drawing-buffer dimensions separately;
assert agreement with the unchanged setup admission and normal renderer sizing. Wait for the actual required textures/assets to finish loading in both arms; do
not compare placeholder textures. Verify WebGL2, non-lost context, logarithmic/reversed-depth capabilities false,
actual renderer/GL vendor strings and actual browser binary/flags. Software WebGL
is valid rasterization evidence but explicitly not physical GPU performance.

The fixture uses real GameScene construction and the actual Three WebGLRenderer,
but a declared symmetric test-only scheduling boundary. Exactly one known start()
requestAnimationFrame statement is replaced with a startup latch, with literal
original source hashes and original/transformed hashes retained. The latch does
not invoke animate. Actual browser RAF, animate, renderer, Painter and producer
functions are unchanged. Assert frame 0, previous null, one start, and complete
World equality between the start latch and the pre-input setup observer. This
prevents paused presentation/worship clocks, cosmetic work and sound draining from
advancing an uncontrolled number of callbacks. The existing real browser-RAF
setup observations may still run; they do not run the latched game callback.

Retain and compare the complete pre-bootstrap World, camera and animation-clock
state. One separately recorded actual animate(initialNow) bootstrap has dt exactly
zero because previous is null. Capture its real pixels, logical state and counters.
Then cancel every original scheduled successor synchronously before yielding, and
invoke the 28 fixed actual callbacks. No World reset, field dropping or actor
retargeting is permitted. This is a controlled-callback fixture with a patched
startup scheduling boundary, NOT unmodified startup or a natural RAF benchmark.
Browser viewport is the canonical 1440x1000 required by the trusted setup helper.
No main-cohort canvas CSS or renderer size is changed. CSS dimensions, actual
drawing buffer and outer window are distinct recorded fields. No local browser execution is allowed.

## Fixed ordinary cohorts and events

Two cohorts, each 28 callbacks: four declared warmup callbacks plus 24 measured.
Preserve warmups, never discard outliers or adapt the event count.

1. Paused camera-changing: world remains paused. Real held-right pointer events
   alternate +64/-64 integer CSS pixels around one verified in-canvas starting
   point, via the application's actual pointer listener. Verify angle 64/0 after
   each event, unchanged center and prior native terrain submission continuity.
   Pointer input work is outside the callback clock and reported separately;
   actual updateView performed by input is not silently called free. Report an
   inclusive input-plus-callback window as well as the nested render window.
2. Live animation, fixed camera: remove ordinary pause for exactly 28 callbacks
   with literal 1/60-second deltas, no camera inputs. Actual advanceGame and all
   producers run. Verify complete World state, unit animation/layer rectangles,
   camera, land and submission state against the other arm at every verification
   step. No fake world.time or unit-heading assignment in this cohort.

The dt-zero bootstrap establishes the same initial previous timestamp, then the literal
28 timestamp/input list is frozen before execution. If genuine controllers do not
produce the declared states, stop and report a fixture failure. Do not tune camera
positions or population after seeing timing. Initial current-world source counts
55/59 do not predict this turn-70 browser fixture's outcome.

## Stage A: untimed real-browser admission, required before timing

One baseline and one candidate fresh browser child per cohort, four children total.
At the bootstrap and every callback, capture original ordered Painter commands/depth, submitted
terrain index/drawRange/instances, logical body-layer identity/visible/material
state/atlas/center/scale/transforms and complete World/controller inputs. Compare
losslessly, retaining signed zero/nonfinite distinctions where applicable. Normalize process-local resource/RAF handles only through stable authored IDs and
hierarchy/material-alias paths; retain their original values in raw evidence and
assert no pending app RAF after cancellation. This is not numeric handle equality
across browser processes. Exclude
only documented unconsumed deferred draw-local uniforms and renderer program cache
artifacts. Require the next submitted body's native uniforms equal the baseline.
Compare naturally addressed person-bound center and fixed grid native/ordinary
picks outside callback execution, retaining complete ordinary/native terrain candidates and resolved winners plus actual ScenePicking object winners. The internal ScenePicking sorted object queue is not hooked; its source is unchanged, and exact logical/Painter inputs and winners are checked.

Read actual renderer.info.render calls/triangles/points/lines immediately after the
one render. Three WebGLInfo increments calls at renderer draw submission; these are
actual renderer counters, not a Sprite inventory estimate and not GPU durations.
Assert counter differences are explained by omitted opaque two-triangle sprites;
controls must not lose Points/selection/transparent submissions. Keep the raw values
rather than promising a particular reduction before admission.

Immediately after each explicit render, in the same browser evaluation, use
WebGL readPixels on the current real drawing buffer. This synchronous readback is
allowed ONLY in untimed validation. Compare every RGBA byte at identical driver,
canvas and state. Preserve lossless compressed pixel buffers/hashes for both arms,
plus PNG pairs/diff on mismatch. No tolerance until a specific driver discrepancy
is investigated and reviewed. Do not hide mismatched pixels through cropping.

Additional untimed paired controls at 640x480 and 1440x1000: overview and return,
opaque-to-blended and back through actual producer state, hidden/show and normal
unit removal/recreation, scene override shader, shared Points, native-ignored Points,
and custom visible Points callback. These preserve exact source fallback; none is
a timed favorable population. Use a test-only build entry exposing the same locked
Three constructors for the non-gameplay fallback fixtures. Its source and added
entry are separately hashed; no production global or native shader changes.
Normal/throw/nested restoration remains mandatory; rendered fallback pixels and
restored material visibility supplement, not replace, the accepted source tests.
Reject browser/page/GL errors, context loss or an unsupported browser; preserve the
attempt. Do not infer a pixel pass from source arithmetic or the earlier IO fixture.

## Stage B: prospective whole-path timing, separately released

Only after A and independent final launcher admission. Exactly eight fresh browser
children: baseline/candidate/candidate/baseline for each of the two cohorts (two
fresh-process pairs per cohort). Four warmup and 24 measured callbacks each. One
fixed attempt, 600-second cap plus 20-second cleanup grace after prebuilt assets;
all failures/raw durations retained in finally. No retries, exclusions or tuning.

Primary CPU result: complete actual animate callback, including simulation, terrain,
units/animation/adoption, effects, pointer, environment, actual renderer submission,
restoration and HUD. Camera cohort additionally reports full input-plus-callback
elapsed CPU. A narrow test-only synchronous wrapper around the existing
scene.renderSceneFrame records its inclusive render CPU slice with exactly one
original call. It does not replace renderer/Painter or change any ownership guards.
This nested slice includes model-light preparation, prepare traversal/sharing
checks, Painter preparation, lease checks/toggles, Three matrices/culling/sorting/
program dispatch/draw submission and finally restoration. Never add it to the
inclusive callback/input window. Wrapper timing and scalar counter-copy overhead
must be identical in both arms and documented.

No readPixels, screenshots, gl.finish, timer-query polling, full snapshots, hashes,
serialization or renderer instrumentation inside/between timed callbacks. Retain a
preallocated 28-entry scalar result/counter table. After the final clock, compare
compact outputs and complete terminal World/logical/Painter/geometry state to A.
Only then perform any terminal pixel readback. Setup/build/import/initial shader
compilation costs are separately retained; four warmups do not prove steady state.
Report maxRSS/process memory and renderer memory/program counts with sampling point;
these are not retained allocation or leak proofs.

Report every raw paired total and nearest-rank p50/p95/p99/max for all samples and
the 24 measured samples separately, setup/warmup totals, counter reductions and
memory. Do not pool callback samples as independent process replicates. Mixed
pair/tail results stay explicit. No automatic speed/FPS or no-regression gate.

## Identity and admission before launching

Freeze exact Git heads/trees/clean status, source diff, actual consumed app JSON and
assets, authored checkpoint and all 28 literal events, helper/build/observer/driver/
launcher hashes, installed lock realpath/hash, Node executable/full versions/env,
browser executable/version/launch flags and WebGL capabilities. Hash requested and
actually served asset bytes, including atlas and terrain/waves. Explicit fetch
allowlist; pre/post binding and end drift required. Launcher pins the binding hash,
one attempt path and fixed child count, preserves partial results on terminal
assertion failures. No old manifest is silently rebound to a new candidate.

The old held-drag source pin currently differs for the two added optional-map
arguments in modal rendering. Do not disable or wildcard it. This distinct proposed
cohort needs its own reviewed source manifest; any eventual existing hosted smoke
must receive a narrow independently reviewed pin refresh separately.

## Stage A execution limits

Exactly four fresh browser children, camera baseline/candidate then animation
baseline/candidate. Each retains one bootstrap, 28 callback records and 24 explicit
fallback-control records. Two source builds have 120-second caps; each browser
child has a 100-second context/run cap with five-second termination grace. The sole
launcher enforces 720 seconds overall plus bounded cleanup. Partial reports/logs
and completed gzip RGBA/state records survive any failure. The browser uses the
same sandboxed preinstalled-Chrome launch flags as existing CI; no Stage B timing
code is enabled. Network is restricted to the local fixture origin. Full served
asset hashes are checked against build/public bytes. The PNG difference renderer
is diagnostic only; exact raw RGBA bytes are the acceptance oracle.

## Unexecuted current-main rebind

Revision 2 compared 15798e01 with accepted 31cdaa23 and was never built or run.
Its exact source, manifest, launcher and checks remain preserved. Revision 3
compares main 5087f2e8 with body composition 8bd14a84; this includes the current
owned numeric picking/runtime and current controller dependencies in both arms.
The body helper, Painter, entity wiring, tests/docs, RenderView.prepare and Scene
animate slices are exact accepted copies. Only adjacent imports and the production
fingerprint required composition resolution. Original and transformed startup
Scene hashes are rebound explicitly; snapshot-authoring helper bytes are unchanged.
Actual scene.pick now exercises the owned numeric route. The extra explicit
ordinary candidate oracle uses the generic public pickCandidates API, while the
actual facade winner remains separately recorded. Neither path is substituted for
the application's animate/pointer work. No previous browser proof is being reused:
there has been no browser execution of either protocol revision.

## Unexecuted revision 3 rejection and revision 4 repair

Revision 3 was rejected before any build/browser run: its outer viewport conflicted
with canonical setup, and its Points fixtures omitted SpriteMaterial center and
actual submission/independent-ownership witnesses. The full revision is preserved.
Revision 4 retains the canonical 1440x1000 window and actual ordinary HUD layout.
The 640x480 and 1440x1000 fallback canvases are explicit controlled resizes, not
claims about the natural HUD layout; they may extend outside the browser viewport.
They use direct render submission and full-buffer readPixels, not pointer input.

Every shared/ignored/hook Points case removes and reinserts the same authored unit
through updateUnitsFrame to obtain a fresh factory-owned body. It never reuses a
previously revoked owner. The fixed target layer must remain naturally clipped or
the fixture fails without selecting another actor. Points gets the required copied
SpriteMaterial center and frustumCulled=false. Actual renderer points must be one
in both arms; the custom material callback must run. Shared/ignored controls require
exact suppression accounting excluding only the shared target, while hook controls
require all draw counters equal. Completed source review is still not pixel proof.


Revision 5 preserves failed hosted attempt 39172358949 (diagnostic f8e17698). Both builds passed, but the generated test entry had an automatic-semicolon-insertion error before the startup latch, so no controlled callback or pixel comparison ran. The only executable setup repair adds an explicit statement separator. An execution-level TSX regression runs the exact generated entry with IO mocks, proves the preserved old entry throws, and proves the repaired entry installs the latch before its single render. Candidate runtime, fixtures, trajectories, counters and acceptance remain unchanged. Any new hosted attempt requires separate review and authorization; no retry has run.
