# Prospective current-source rebind, revision 11 (UNEXECUTED)

PR617 remains held; this exact source pair is frozen for review before launch.
Baseline e1b468a9b8a355bd46fb149a1100b43442898b1e versus candidate
0d9ae8b299b613fc729e3c7d05c5e9a06fd4c36f, tree b076302470779f130aa9bdaaf906f3e532e9b88a.
Only source identities and branch target change. Both original Scene byte hashes
and exact startup transformation hashes remain identical to the historical pair.
The lossless storage, four children, 28 callbacks, 24 controls, literal targets,
viewports, symmetric bootstrap/focus precondition and all deadlines remain fixed.
New source fixtures/assets are generated and bound afresh; historical proof is not
relabeled as proof of these commits. No local browser/build or hosted run.

Historical protocol and rationale follow unchanged for provenance:

# Prospective real-renderer body-layer validation, revision 9

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
binding and pause-latch removal checks. Assert the exact constructor focus and use the existing public drag/right-click
setup. Only the redundant animated focus key and its RAF-dependent wait are omitted,
under the read-only exact precondition described below. Do not overwrite authored units or add a
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
the earlier revisions had not run at that freeze. Subsequent failed hosted setup
attempts are recorded below; neither reached pixel comparison.

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

Revision 5 preserves failed hosted attempt 39172358949 (diagnostic f8e17698). Both builds passed, but the generated test entry had an automatic-semicolon-insertion error before the startup latch, so no controlled callback or pixel comparison ran. The only executable setup repair adds an explicit statement separator. An execution-level TSX regression runs the exact generated entry with IO mocks, proves the preserved old entry throws, and proves the repaired entry installs the latch before its single render. Candidate runtime, fixtures, trajectories, counters and acceptance remain unchanged. Revision 5 then ran once as 39172774059 and failed at the setup focus-motion wait,
with zero browser page errors and no controlled callback or pixel comparison.

## Revision 6: exact redundant-focus precondition

The actual constructor at the unchanged authored turn-70 checkpoint already has
selected Shaman 54, viewPoint {-107,-101}, native camera {40192,23808,angle:0},
bearing zero and inactive camera motion. An actual-constructor IO-leaf regression
proves that animate:true focus at this identical target leaves the camera unchanged
but sets motion active, requiring a callback forbidden by the startup latch.

The exact-source-bound setup adapter now replaces only the focus key and inactive
wait with a read-only precondition. It asserts exact authored selection and Shaman
identity/position, camera/viewPoint/bearing, inactive motion, turn/pause/input state,
scene/store/latch identity, no callbacks, and complete World equality to the start
latch. Camera or motion is never assigned, and no private controller is called.
Canvas focus, actual public drags/right-click and every original admission check
remain unchanged. Negative tests reject camera, selection, World and callback drift.
Both failed hosted runs and their exact source/bindings remain preserved. Revision 6
is unexecuted and requires new independent source admission before any hosted run.

## Revision 7: lossless observation transport and diagnostic phases

Retained run 39173419489 passed setup and rendered the dt0 bootstrap plus three
baseline camera steps, then reached the unchanged 100-second child deadline. No
candidate or pixel comparison ran. Actual renderer was ANGLE SwiftShader WebGL2,
with a 1240x1000 canvas in the canonical window. Each state was about15MB JSON,
plus6.6MB pixel base64; approximately20-second whole-proof write intervals do not
attribute cost to rendering, readPixels, capture serialization or transport.
Transport overhead remains a hypothesis, not an established bottleneck.

Revision7 retains every callback, control, deadline, observation field and original
RGBA byte. After the existing capture finishes synchronously and the scheduled RAF
is cancelled, native CompressionStream gzip packs the complete observation before
Playwright transport. Existing encoded state/initialState graphs and pixel base64
remain verbatim; outer metadata uses the same checkpoint codec to retain undefined,
signed zero and nonfinite values without double-encoding the large state graph.
Node verifies raw byte length and SHA256, decompresses, and restores the identical
observation before the unchanged store/comparator. Unsupported compression fails;
there is no download, fallback or data omission. A64MiB uncompressed payload bound
protects decoding, not callback/control coverage.

Diagnostic phases live only in report.observationDiagnostics, outside state equality:
callbackMs (actual animate), readbackMs (gl.readPixels), captureTotalMs (including
readback, graph construction/codec and pixel base64), controlRenderMs where relevant,
encodeMs, gzipMs, packTotalMs, Node roundTripMs and decodeMs. Nested phases overlap
and must not be summed. Roundtrip includes browser execution/packing and transfer,
not pure transport. These are untimed-proof attribution aids, never gameplay speed
or StageB measurements. No GPU synchronization beyond existing proof readPixels
is added. Earlier raw receipts and both setup failures remain preserved. Revision7
requires separate independent admission before any hosted execution.

## Revision 8: bounded proof budget, not gameplay timing

Retained run 39174207447 completed the baseline dt0 bootstrap, all 28 camera callbacks
and 10 of 24 controls before the 100 s browser deadline. No candidate or pair comparison
completed. Across 28 baseline camera callbacks, separate nearest-rank medians were
animate 32.5 ms, readback 117 ms, capture 397.4 ms, packing 652.3 ms, roundtrip 1149.0 ms and
Node decode 442.7 ms. These phases overlap; they are not summed, nor evidence of
gameplay speed or current-main acceptance.

Only childMs changes 100000 → 150000. All 4 children, 28 callbacks and 24 controls per child,
every observation and assertion remain fixed. The 720000 ms launcher and 15-minute
hosted hardcaps remain unchanged, as do 120 s per-build and 5 s child-kill-grace caps.
R7 driver start 22:54:28.871 to first browser child 22:55:00.641 was 31.770 seconds,
including both builds (10.179s and10.332s). Budget arithmetic: 4 × 150 s = 600 s; reserve
45s for pre-browser setup/builds (13.230s above the observed 31.770 s),4 × 5 s = 20 s for
possible child kill grace, leaving 55 s for comparison/end-binding verification
inside 720 s. Comparison of complete pairs has not yet run, so this is a bounded
prospective allowance, not a completion guarantee. The independent 120 s build caps
cannot all be exhausted together with maximum browser caps within 720 s; the global
launcher remains the authoritative fail-closed bound. Do not inflate it on failure.

A structure regression pins this arithmetic, exact four-child order, callback and
control coverage, action/launch/build deadlines, 720 s launcher literal and 15-minute
workflow cap. No new attempt is authorized by this file; independent review is
required. All previous incomplete/failing attempts remain separately retained.

## Revision 9: fixed per-viewport authored correctness-control targets

Run 39174948729 completed 28 baseline camera callbacks and 21 controls, then correctly
failed the 1440-wide shared-Points clipping precondition. The original fixed unit 5
was clipped at 640x480, but its stored depth at 1440x1000 was 0.9892343879, not sentinel 2. This is baseline control invalidity, not candidate pixel mismatch.

Only correctness controls now use a literal map shared by both arms and cohorts:
640x480 uses unit 5/layer 0; 1440x1000 uses unit 9/layer 0. Both are existing authored
green braves with three layers. Retained baseline native-projection observations
independently prove the selected layer clipped at each size. This is an explicit
reviewed control selection, not adaptive retargeting after a failure during a run.
Missing actors, changed class/team/topology, non-clipped targets, or target drift
fail closed. Original clipping is checked on admission and after return to the
actual viewport, and the shared/ignored controls retain their strict clipping test.

Bounded CPU preflight used actual GameScene construction/Painter/producers with the
existing DOM/GPU IO seam. From the retained pre-bootstrap authored World it ran the
actual dt0 callback plus all 28 live callbacks at the fixed timestamps, ending at
turn 75, then all 24 controls sequentially. Both source arms retained clipping,
three-layer topology, fresh factory ownership, positive Points inventory/hook
observations and restoration, with equal control-result rows. This is not WebGL
pixel/counter validation; IO endpoints do not establish real draw counts.

No main-cohort actor, World, trajectory, callback count, control count, assertion or
budget is changed. The existing controlled removal/recreation operations now apply
to the explicit target for each viewport. Previous failures remain retained.
Separate source admission is required before any new hosted attempt.

## Revision 10: lossless observation storage (unexecuted)

Revision 9 run 39176221668 retained three complete children; its final animation
candidate stopped after 20 callbacks because the fixed 805,306,368-byte evidence
cap was reached. This was not a pixel mismatch. Offline, the unchanged comparator
passed all 53 camera observations (bootstrap, 28 callbacks, 24 controls). Full
Stage A remains incomplete. The exact failed physical byte count was not recorded
by revision 9; the archive contains only selected extensions, not every build or
Chrome profile file, so it cannot reconstruct that count.

Revision 10 changes storage only. Every original gzip byte stream, including
initial states, is stored under its SHA-256 in observation-cas/*.blob.gz. A durable
manifest maps every original logical path to its exact compressed byte length
and hash. Identical blobs are compared byte-for-byte before reuse. Before the
unchanged comparator runs, all paths are verified and reconstructed as hardlinks.
No observation, codec marker, pixel byte, callback, control, or assertion is
removed. Missing/corrupt blobs, unsafe paths, symlinks and conflicting existing
materializations fail closed. These are sequential children, not concurrent
manifest writers.

The unchanged cap measures total regular-file bytes by unique device/inode,
including builds, browser profiles, fixture files, logs, CAS blobs and manifests.
This is physical content-byte accounting, not filesystem allocated-block usage;
the independent free-space floor still applies. Logical path bytes and file
counts are reported separately, so hardlink deduplication is explicit. Budget
failures now record exact physical bytes, logical bytes and cap. Checks occur
before and after observation writes and around comparison; a write crossing the
cap is retained and fails rather than silently deleting evidence.

The hosted artifact retains CAS blobs, manifest, reports, logs, binding receipts,
and comparison/failure PNGs. It excludes only redundant materialized per-child
gzip paths. To reconstruct an artifact, call materializeObservations(runRoot),
then invoke the unchanged comparePair with the original checkpoint codec. A
copy-only filesystem can copy each verified blob to its mapped path offline,
but this launcher requires same-filesystem hardlinks and does not hide a copy
fallback from the fixed budget. All prior artifacts and revisions remain intact.

The 150-second child, 720-second launcher, 15-minute hosted limits and all four
children remain unchanged. Deduplication adds hashing and manifest work, so this
is not evidence that the remaining deadline will pass or that gameplay is faster.

Final launcher accounting covers the entire output root, not only run/: it is
performed after driver.log and child terminal receipts exist. The launcher.json
receipt includes its own exact UTF-8 size through a bounded fixed-point encoding,
then the whole directory is recounted to reject drift. Exceeding the unchanged
cap marks the final receipt failed and exits nonzero, retaining all evidence.
Inner per-observation checks remain early run-subtree checks, not the final total.

Historical revision 10 passed hosted run 39177616067 on 5087/8bd, with both
53-observation comparisons passing. Revision 11 does not reuse those results as
current-source proof. It reuses the unchanged lossless CAS, final whole-output
accounting and fixed schedule; only exact source identities/branch bindings change.
