# Modernization audit

Status: in progress. Highest priority before new parity features, per the user's
2026-09-09 instructions. Preserve mechanics, intended timing, input response and
experienced-player expectations while improving performance and presentation.

## Review coverage

| Area | State | Evidence / next check |
| --- | --- | --- |
| Frame loop and clock ownership | Core fix verified | Removed the 100 ms time cap, interleaved simulation and animation, reset clocks on blur/visibility changes. Node and actual Scene checks cover 5–240 Hz. Camera/flyby/result ordering and audio scheduling still need review. |
| High-refresh motion and camera/input | Ground navigation and focus improved | Fractional native-step previews produce distinct ground views at 5–240 Hz and irregular schedules without a delayed first response. Native endpoints and focus schedules remain identical. Cloud wind/parallax now uses retained fractions and camera-step snapshots, with identical endpoints at 0.5–240 Hz. Units, flybys, globe motion, transitions and result cameras still need smoothing. |
| Terrain, water, lighting and visibility | Submission optimized | Indexed native row spans preserve pixels and picking while reducing CPU/GPU work. Wide-screen sky background now covers exposed areas; terrain perimeter and expanded-region clipping remain open. Water still recomputes shared vertex samples; profile first mission, changing terrain, shadows and heavy effects; test wide/high-DPI displays. |
| Models, sprites, painter and effects | Profiled | Painter traversal now skips unsubmitted terrain faces.  Measure submissions, batching, geometry updates, allocations and resource lifetime; retain native draw/sprite regressions. |
| HUD and minimap | Partially reviewed | Uniform bounded HUD sizing replaces axis stretching; saved size preference and ten desktop/window sizes checked. Minimap native colors/transforms and modern dense rows verified. Fixed native frame corners/tiled edges and full HUD/display audit remain. |
| Simulation and gameplay systems | Clock regression added | Complete world-state comparisons cover movement, construction work, Blast, combat and native celebrations at three speeds and seven frame schedules. Long campaign playthroughs and larger combat/effect loads still require clock/performance coverage. |
| Audio and presentation timing | Read review; issues open | WebAudio owns sample duration and pitch; buffers are cached and ended nodes disconnect. Simulation sounds still drain once per render, so catch-up events can bunch. Cloud wind/half-heading drift is corrected below; full presentation-event scheduling remains open. |
| Resources, loading and memory | Read review; measurements pending | Scene disposes listeners, observers, renderer, owned geometry/materials and textures; shared atlas caches survive restarts. Globe rebuilds geometry on camera movement; Live DPR changes now resize the renderer and star pixels while retaining CSS projection. Measure restart/resize/effect lifetime and live display-scale changes. |
| Readability and maintainability | Started | Fallow baseline: maintainability 85.3, average cyclomatic 2.8, p90 5, three cycles and three unused dependencies. Review measured hot paths before refactoring. |

## Measurement rules

- Record browser/runtime, hardware, viewport and workload. Separate real hardware
  measurements from headless/software rendering and microbenchmarks.
- Use the same workload and conditions for before/after comparisons. Record frame
  time distributions, long frames, draw calls, allocation/memory behavior and
  elapsed-time correctness; average fps alone is insufficient.
- Rendering is uncapped within the browser/display's scheduling. Native simulation
  cadence must not depend on presentation fps. High-refresh motion must actually
  become smoother, without changing rules or responsiveness.
- Keep native comparisons and gameplay regressions. Document any compatibility
  correction rather than disguising it as exact original behavior.

## Completed local optimization: minimap palette conversion

`scripts/bench-minimap.mjs` compares the initial implementation's per-pixel
`subarray`/spread/temporary-array conversion with the live `minimapRGBA` function's
single output allocation and indexed channel writes. It asserts equality of every
RGBA byte before timing. Both methods convert the same indexed source and palette.

Measured on Apple M5, macOS arm64, Node v24.18.0: 20 warmups, nine alternating-order
batches of ten conversions, median milliseconds per conversion:

| Map pixels | Initial conversion | Current conversion | Ratio |
| --- | ---: | ---: | ---: |
| 100×96 | 1.688 ms | 0.022 ms | 77.8× |
| 225×200 | 7.918 ms | 0.079 ms | 99.6× |
| 600×432 | 44.910 ms | 0.483 ms | 93.0× |

This compares two browser-port conversion implementations, **not** the original
Windows game's renderer and not total game frame time. The terrain canvas stays
cached until its inputs or size change, so this cost is not paid on every frame.
Native/browser RGBA comparisons independently check palette and map correctness.
These results do not establish that the whole game meets the performance goal.

## Modern display correction: minimap storage

Original `00420100` writes into a 256-byte-stride, 65,536-byte buffer. The browser
uses dense canvases sized to the displayed map, retaining the recovered camera
scroll without imposing that storage limit. `check-browser-minimap.mjs` captures
24 cases at six desktop sizes through 3440×1440 and 3840×2160. The native checker
compares original terrain generation and quad transforms for every case; wrapped
RGBA matches the original buffer within its supported extent. Larger cases use
the already-compared scroll with dense rows, explicitly as a compatibility
correction. Complete minimap marker/input ownership and frame rasterization remain
separate unfinished parity requirements.

## Indexed terrain submission and picking

The previous browser path submitted all 32,768 terrain triangles in nine wrapped
map instances (294,912 terrain triangles), then hid excluded primitives through
the native visibility/painter shaders. The new index buffer selects the union of
cells in the recovered half-open row spans. Source vertices, face IDs, texture
coordinates, native projection, instance transforms and painter sorting remain
unchanged. Picking projects the submitted vertices and uses their source face IDs.
Globe mode retains the full submission; further per-instance rejection is open.

`tests/terrain-visibility.test.mjs` compares selection with the native-fixture cell
gate. `scripts/check-browser-terrain-submission.mjs` compares **every RGBA byte**
and the center terrain pick against the old full submission, at seven poses:
three headings, two wrapped seams, two zoom settings and globe view. All seven
are identical. This is browser-path equivalence, backed by the existing native
visibility fixtures, not a new claim that the whole renderer is native-exact.

Reproduce the paired frame profile with:

```
node scripts/profile-game.mjs /tmp/full.json --full-terrain
node scripts/profile-game.mjs /tmp/indexed.json
```

The flag restores the full-submission path inside the test page; all other code
is identical. Raw reports: [full terrain](performance/2026-09-09-full-terrain.json)
and [indexed terrain](performance/2026-09-09-indexed-terrain.json).
Measured Apple M5/macOS arm64, Node v24.18.0, headless Chrome 153, SwiftShader
Vulkan, 1440×1000/DPR 1. Each scenario settles for one second and samples four
seconds. The crowd adds 200 stationary braves for renderer stress.

| Scenario | Before CPU median / p95 | Indexed CPU median / p95 | Before / indexed triangles | Draw calls |
| --- | ---: | ---: | ---: | ---: |
| Opening | 12.2 / 13.3 ms | 6.3 / 9.9 ms | 297,443 / 68,627 | 86 / 86 |
| Rotating camera | 12.1 / 12.7 ms | 7.1 / 11.2 ms | 297,429 / 69,135 | 79 / 79 |
| 215-person crowd | 11.9 / 12.8 ms | 7.8 / 9.1 ms | 298,229 / 69,125 | 479 / 479 |

These are diagnostic single-run CPU distributions, **not hardware FPS results**.
The opening submits 77% fewer triangles and uses 48% less median JS frame time.
The clock and picking fixes are present in both runs; this comparison isolates
terrain submission. An earlier profile also improved, but absolute timings varied,
so the retained paired reports above are the reproducible evidence.
The renderer still shares nine instances' visibility union, retains a full-size
painter depth buffer and uses per-layer sprite calls; those are remaining costs.

## Chronological game clock

The old frame loop discarded elapsed time above 100 ms, then advanced all pending
12 Hz simulation turns before all 24 Hz animation updates. Person controllers read
owned animation fields, making the latter ordering a correctness issue, not just
presentation. `advanceGame` now splits elapsed time at animation boundaries,
advances simulation up to each boundary, then advances animation. Rendering remains
on requestAnimationFrame without a fixed-rate cap. Animation frames are selected
before drawing instead of one render later. Native authored cadence and the
existing independent presentation-speed convention are retained.

`tests/game-clock.test.mjs` compares all world fields (including typed arrays and
Maps) for movement, active construction workers, Blast, combat and native victory
celebrations, at 0.25×, 1× and 2× speed,
using 5/30/60/120/144/240 Hz and irregular schedules. Only sub-nanosecond pending
time residue is normalized after asserting its bound. All runs produce identical
state, RNG and owned animation. Pausing and two-second active frames are tested.
`check-browser-game-clock.mjs` injects timestamps into the actual Scene loop and
checks turn/animation counts, blur and visibility reset. GPU drawing is stubbed
for that clock-only check; separate browser tests cover rendered output.

Blur pauses and clears input; both visibility transitions reset the timestamp.
Hidden time is not replayed on resume. Active frame time is retained. Camera and
flyby accumulator boundaries now tolerate floating-point rounding. Ground keyboard navigation and focus journeys now preview fractional native
steps (see below); flybys, globe/transition/result motion and full
camera/result/animation/audio chronology remain open. This fix does **not** complete high-refresh smoothing or the audit.

## Display changes, audio bursts and maintainability

`setSize` owns render resolution and star-pixel scaling. Each frame cheaply checks
for a device-pixel-ratio change, covering monitor moves that leave the CSS viewport
unchanged. The existing 1.8 render-resolution ceiling is retained; HUD layout uses
CSS pixels independently. `check-browser-display-audio.mjs` uses Chrome device
metrics to switch DPR 1 → 1.5 → 2 → 3 → 1 without restarting. Drawing-buffer sizes,
star scale and unchanged CSS projection all agree. This is browser emulation;
physical monitor moves and hardware frame budgets remain to be tested.

The audio voice cap previously called `stop()` without releasing the stopped
voice's slot until its asynchronous `ended` event. A burst could repeatedly stop
the same oldest voice and exceed 64 active voices. Stealing now releases that
slot immediately. The same browser check starts 200 real WebAudio sources in one
synchronous burst: 64 remain active, all 200 finish callbacks run, and disposal
leaves zero buffers and a closed context. Sample duration/pitch remain WebAudio
owned. Catch-up cue spacing and the original priority scheduler remain open.

Clock ownership and terrain selection are small independently checked modules;
minimap drawing is extracted from Scene. Fallow reports maintainability 85.5
(previous baseline 85.3), average cyclomatic 2.8 and p90 5; this score alone is not
proof of readability. New modules pass ox-standard's error rules. Whole-repository
ox-standard still reports existing issues in older ports (including raw type
style, chained assignments and labeled flow); that cleanup remains in the audit,
and is not hidden by weakening its configuration.

## Validation for this checkpoint

`npm run check`: 147 tests, TypeScript and parity-ledger consistency pass.
`npm run build`: production build passes. Browser regressions pass for terrain
submission, native visible cells, terrain UVs, water, terrain lighting, painter
order, sprite layers, unit shadows, selection, camera input/focus, game clocks,
population HUD, minimap, live DPR changes and audio bursts. The minimap retains
its 24 native/browser capture comparisons. This checkpoint is not a completed
modernization audit; the open items in the coverage table still block returning
to new parity features.

## Ground camera presentation between native steps

The ground camera still commits the recovered navigation/focus updates at 24 Hz.
Between those boundaries it previews the next native input and focus step on
shallow state copies, then displays the appropriate fraction along the short
wrapped map/heading arc. Previewing does not advance the owned controller or run
its side effects. Camera projection is updated once for the final displayed view;
no deep clone, second world simulation or extra rendering pass is needed.

This deliberately improves the old discrete presentation. It does not interpolate
from the previous committed view (which would add a step of input latency).
Changing/releasing navigation, dragging the mouse or issuing a focus request
retains the displayed fraction as the new starting view, rounded to the native
coordinate/heading precision. Continued held input never feeds previews back into
owned state. Ground preview positions use the same canonical wrapped map copy as
`browserPosition` while retaining fractional precision. Input gates are still
re-evaluated after each native view-transition step.

`scripts/check-browser-camera-smoothing.mjs` checks actual Scene state and
projection at 5, 30, 60, 120, 144 and 240 Hz plus an irregular schedule. Forward
movement, rotation, and combined pan/turn produce identical native endpoints;
every frame changes the projected view. Actual keyboard events respond on the
first 240 Hz frame, release without undoing the displayed fraction and remain
stationary with momentum disabled. A focus journey has identical controller
state at every native boundary and 243 distinct positions across 25 native steps
at 240 Hz. Three real GPU renders between native boundaries repeat identical
pixels with preview disabled, but change over a million pixels per frame with
preview enabled. Existing camera-input/focus, globe-transition, sprite-layer and
terrain submission/picking regressions remain required.

The native 24 Hz movement convention is still an adapter, not a claim that the
full original frame scheduler is integrated. Globe dragging/inertia, zoom/morph,
flybys, result-camera choreography and unit movement remain separate work. Full
input-event timestamp/replay equivalence and physical high-refresh hardware
validation are still open.

### Camera cost measurement

`node scripts/bench-camera-smoothing.mjs /tmp/camera.json` measures the actual
Scene camera/input/flyby/view-update path in one browser. Both modes update the
projection on every frame, including the original inactive-camera fallback.
There are 1,200 warmup frames per mode and nine alternating-order batches of 2,400
frames at each cadence. GPU drawing is intentionally excluded from this CPU
microbenchmark; it cannot certify total frame time or hardware FPS.

Separate whole-frame diagnostic reports are retained for
[stepped](performance/2026-09-09-stepped-camera.json) and
[smooth](performance/2026-09-09-smooth-camera.json) camera modes, selectable with
`profile-game.mjs --stepped-camera`. Those runs were noisy: the unchanged opening
workload also became slower in the second process, and rotation CPU medians were
5.6 versus 9.8 ms. They do **not** establish unchanged whole-game performance.
The alternating in-browser benchmark isolates camera overhead; ongoing hardware
and whole-game profiling remains a requirement rather than being waived.

The final isolated measurements (Apple M5, macOS arm64, headless Chrome 153) are:

| Cadence | Stepped camera median | Fractional camera median | Added CPU time per frame |
| --- | ---: | ---: | ---: |
| 60 Hz | 0.01058 ms | 0.01175 ms | 1.17 microseconds |
| 240 Hz | 0.00983 ms | 0.01058 ms | 0.75 microseconds |

[Raw alternating CPU batches](performance/2026-09-09-camera-smoothing-cpu.json)
retain all measurements and endpoint comparisons. A second whole-frame check,
`profile-game.mjs --compare-camera`, alternates stepped/smooth camera modes in
one browser, resetting the same opening view each run. Its six runs use the order
stepped/smooth/smooth/stepped/stepped/smooth, each with one second settling and
four seconds sampled. Median CPU frame time across the three runs is 5.3 ms
stepped versus 5.7 ms smooth; median p95 is 6.8 versus 7.2 ms. Median frame spacing
is 33.3 ms for both in SwiftShader. [Raw paired runs](performance/2026-09-09-camera-paired.json)
show the variability. Smoother moving views can refresh dependent presentation
work more often, so the isolated microsecond result must not be substituted for
the measured 0.4 ms whole-frame difference. No extra draw passes are introduced.
These software-renderer observations support the chosen inexpensive preview
approach; they do not certify hardware performance or finish the audit.

Final native comparisons also pass: 8,192 complete keyboard and 6,153 drag-axis
calls; 256 camera journeys/291 plans/7,921 movement calls; 256 result initiations
and 12,288 composed frames; 1,024 focus requests and 5,120 following steps. These
checks certify the unchanged native controllers, not the new fractional frames.
The browser smoothing/pixel/input checks cover the deliberate presentation change.

## Modern HUD sizing correction (2026-09-09)

User review rejected the independent viewport X/Y scaling introduced in
06b07bd74965bd2e77b9bb6b6953615c8c42f029. Original logical control coordinates and
artwork are retained, but a single CSS transform now preserves their proportions.
Automatic scale uses half-step increments, fits the original 640×480 layout and
caps at 250%. Only the panel background extends to the bottom of a taller window;
icons, minimap, meters and portrait do not stretch to fill it. Settings offers
100–400% with the same fit limit, saved locally when browser storage is available.
The preference survives a reload and returns to the chosen size after a small
window is enlarged. No dependency, per-frame layout handler or simulation change
is introduced; the existing ResizeObserver resizes the battlefield.

| CSS viewport | Previous sidebar | Automatic sidebar now | Original-art scale now |
| --- | ---: | ---: | ---: |
| 1280×720 | 200 px | 150 px | 1.5× |
| 1920×1080 | 300 px | 200 px | 2× |
| 3440×1440 | 537.5 px | 250 px | 2.5× |
| 3840×2160 | 600 px | 250 px | 2.5× |

The minimap uses the actual displayed rectangle: at 4K its default raster changes
from 600×432 (259,200 pixels) to 250×240 (60,000 pixels), 76.9% fewer pixels per
map buffer. This is a buffer-size calculation, **not an FPS claim**: the wider
battlefield also draws more world pixels. This patch adds no GPU passes and
reuses the cached minimap renderer. The user can choose larger controls rather
than accepting a maximum size tied to monitor width or device pixel ratio.

`check-browser-hud-scale.mjs` checks ten window sizes from 640×480 through 5120-wide
and 4K, uniform original health/portrait/minimap geometry, full-height background,
renderer resizing, settings reachability, fit limits, persistence and disabled
storage. Existing HUD artwork/state and minimap tests retain their native logical
comparisons; their physical-size assumptions now follow the uniform scale.
This is a deliberate modern compatibility correction with no new native parity
credit. Complete native control roster, minimap frame tiling and resampling
fidelity remain unfinished.

Validation passed: all 147 Node tests, typecheck/build, HUD size/persistence,
24 minimap browser/native pixel-transform comparisons, and the native HUD
health/portrait/population/mana/spell checks. Fallow maintainability remains 85.6.
Visual review at 1920×1080 and 3440×1440 confirms the proportional sidebar;
it also exposes black areas outside the ground globe against the sky on wide
views. That world/sky coverage defect remains a priority in the rendering audit;
HUD sizing does not resolve it or certify the whole modern-display experience.

## Wide-screen sky coverage (2026-09-09)

The fixed native ground region can expose the clear surface below the original
sky rectangle on modern wide/tall viewports. The backdrop now uses its existing
two triangles across the viewport, preserving the native horizon as its texture
scale. Below that horizon it samples the bottom texel row; vertical sampling is
clamped to texel centers to prevent the repeating sky texture from mixing its
opposite edge into the horizon. Clouds retain their original geometry, UVs and
fade, and the defeat flash retains its original rectangle. Overview still hides
all ground-sky layers. Zero-height ground skies use the edge color as a fallback.

This is a background coverage correction, **not a terrain clipping fix**. A
full-region diagnostic removed black pixels but visual inspection showed invalid
ground projected over the whole scene. Multiplying native polygon extents also
produced vertical terrain strips. Those approaches were rejected. Do not use a
zero-black-pixel count as evidence of correct visibility. The native terrain
region and projection remain unchanged. Resolving its jagged perimeter and
extending terrain safely needs proper near-plane/range handling and further
original draw-pipeline investigation. The backdrop extension makes that remaining
perimeter visible against sky rather than black; the overall widescreen audit is
still unfinished.

`check-browser-sky-coverage.mjs` compares actual old/new shaders at 12 viewport/view
states (640×480 battlefield through ultrawide/4K; normal, close and bird views).
Its white-background diagnostic distinguishes translucent edges from opaque
ground: opaque ground pixels, projection, bounds and center picks remain identical.
Existing upper sky pixels differ by at most one channel value from floating-point
interpolation, excluding the intentional texel-edge correction. Translucent
edges correctly blend with the new backdrop. The test also verifies overview
hides the backdrop. [Raw pixel/submission comparisons](performance/2026-09-09-sky-coverage.json)
retain filled-area counts and submission counters. There is no added draw call or
triangle for existing nonzero-height skies; the formerly empty zero-height sky
adds one two-triangle backdrop. No extra terrain is submitted.

The native cloud oracle still matches 128 lens updates, 4,992 cloud triangles,
nine complete horizon dispatches and 756 outer-dispatch triangles. Existing browser
sky tests retain twelve view/size states, all zoom frames, native cloud fades,
flash bounds, independent sky motion, keyboard rotation and overview return.
This compatibility correction earns no additional native parity credit. Sky wind
rounding and frame-rate-independent cloud motion remain separate unfinished work.

### Sky coverage cost

`node scripts/profile-game.mjs --compare-sky references/performance/2026-09-09-sky-paired.json`
alternates the retained original and extended backdrop in one browser, in the
order old/new/new/old/old/new. Six opening-view runs at 3440×1440, DPR 1 use one
second settling and four seconds sampling each. The renderer remains at 79 calls
and 68,613 triangles in both modes. Median CPU frame time across runs is 5.3 ms
old versus 5.4 ms new; median p95 is 6.3 versus 6.6 ms. Median frame gap across runs
is 66.7 ms in both modes, but the final new-background run reaches 83.3 ms.
[Raw paired runs](performance/2026-09-09-sky-paired.json) retain that variability.

Conditions: Apple M5/macOS arm64, Node 24.18, headless Chromium with SwiftShader.
These measurements do not certify hardware FPS or prove unchanged GPU cost.
Filling previously empty pixels costs raster work; the implementation reuses the
existing backdrop pass rather than rendering extra terrain or adding a second
background layer. Representative hardware and wider renderer performance remain
open audit requirements. The 147 portable tests, typecheck/build and native cloud
oracle pass; the new shader comparison protects the specific compatibility change.

The 96-sample real-material palette/filter check also passes. Its sky input now
inverts the screen-to-horizon UV mapping before sampling the same 2×2 calibration
texture; expected native bilinear palette values and tolerance are unchanged.
Next investigate the fixed-resolution camera table, displayed projection scale,
near-plane handling and terrain perimeter together before expanding row spans.
The unsafe full-region diagnostic is not a correctness baseline for that work.

## Frame-independent cloud motion (2026-09-09)

The previous browser called recovered `0x523830` once per rendered frame. Its
integer wind increments and `turn >> 1` discard different fractions at different
refresh rates. That exact routine stays in `sky.ts` for the executable oracle;
the live presentation now uses the small `sky-motion.ts` reconstruction with
floating-point state. It retains the original wind rates (2,125 and 1,125 native
coordinate units per second), wrapped camera translation and half-heading rotation.
An analytical average of the rotating basis integrates wind and camera parallax
along each linear camera segment. It avoids accumulating render-sample rounding.

The Scene commits motion at existing native camera/flyby step boundaries, then
renders a copy advanced through the remaining fraction. A slow render therefore
retains intervening camera bends, and a fast render cannot feed its preview back
into the next owned step. Input changes adopt the already displayed sky together
with the already displayed camera. Paused flybys/results commit stationary-camera
wind independently; blur retains the existing timestamp reset and does not replay
hidden time. Native lens-grid precision, clouds, backdrop and flash geometry remain
unchanged. The live loop no longer passes rounded millisecond ticks to cloud motion.

A one-second comparison of the previous per-render leaf invocation demonstrates
the problem (native angle units; camera turns by 400 units):

| Render rate | Previous wind X/Y | Continuous wind X/Y | Previous sky turn | Continuous sky turn |
| --- | --- | --- | ---: | ---: |
| 5 Hz | 2125 / 1125 | 2125 / 1125 | 200 | 200 |
| 60 Hz | 2120 / 1120 | 2125 / 1125 | 180 | 200 |
| 144 Hz | 2000 / 1000 | 2125 / 1125 | 144 | 200 |
| 240 Hz | 2000 / 1000 | 2125 / 1125 | 160 | 200 |

This describes the earlier browser scheduling of the recovered leaf, not a claim
that the original game's complete scheduler ran at these refresh rates. The
compatibility fix is intentionally not bit-for-bit old rounding and earns no
additional native parity credit.

`tests/sky-motion.test.mjs` checks native wind constants, arbitrary subdivision of
stationary/panning/rotating/combined segments, map and angle wraps, long elapsed
time and invalid-time rejection. `check-browser-sky-clock.mjs` exercises 72 real
camera/sky sequences: 0.5, 5, 24, 30, 60, 120, 144 and 240 Hz plus irregular frames,
with idle, forward movement, turning, combined navigation, focus journeys, flyby,
paused flyby and result camera. Owned and rendered endpoints agree within 2e-7
coordinate units. Every frame changes the lens UVs. Three real GPU renders at
240 Hz change 96,305 and 96,147 pixels between successive frames. The actual Scene
frame-loop check keeps wind running with a paused world and verifies blur does not
replay hidden time. [Raw clock/pixel results](performance/2026-09-09-sky-clock.json)
retain all cases. The camera-only pixel regression explicitly holds sky drawing
still so autonomous cloud motion cannot masquerade as camera movement.

All 148 portable tests, typecheck/build, native cloud oracle, browser camera
smoothing/input/focus, sky/zoom/flash, game-clock and all 392 sprite-pose checks pass.
Fallow maintainability remains 85.6; selected source lint has no errors. The existing
24 Hz camera/flyby convention is still an adapter. Cross-domain event timestamps,
unit movement, other camera presentation, audio cadence and full engine scheduling
remain open, as does the wider rendering/perimeter audit.

### Sky motion CPU cost

`bench-sky-motion.mjs` compares motion plus the full native lens-grid calculation
with 1,000 warmup frames per mode and nine alternating batches of 2,000 frames.
The modern mode includes all 24 Hz camera snapshots and each rendered preview.
On Apple M5/macOS arm64, Node 24.18:

| Cadence | Previous path | Continuous path | Added CPU time per frame |
| --- | ---: | ---: | ---: |
| 5 Hz | 5.543 microseconds | 6.034 microseconds | 0.491 microseconds |
| 60 Hz | 5.508 microseconds | 5.605 microseconds | 0.097 microseconds |
| 240 Hz | 5.549 microseconds | 5.612 microseconds | 0.063 microseconds |

[Raw alternating batches and rate comparison](performance/2026-09-09-sky-motion-cpu.json)
make the measurement reproducible. This isolates the changed CPU work; it does
not measure GPU drawing, whole-game frame time or hardware FPS. The correction
introduces no draw pass, shader, texture or geometry. The existing grid calculation
already takes only a few microseconds here, so further caching is not justified
by this measurement; larger render-loop costs remain the performance priority.
