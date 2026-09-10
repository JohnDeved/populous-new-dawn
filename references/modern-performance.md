# Modernization audit

Status: in progress. Latest 2026-09-09 direction: finish the current terrain
optimization, then resume important gameplay and visual parity. Continue this
audit alongside feature work; unfinished items remain explicit. Preserve mechanics, intended timing, input response and
experienced-player expectations while improving performance and presentation.

## Review coverage

| Area | State | Evidence / next check |
| --- | --- | --- |
| Frame loop and clock ownership | Core fix verified | Removed the 100 ms time cap, interleaved simulation and animation, reset clocks on blur/visibility changes. Node and actual Scene checks cover 5–240 Hz. Camera/flyby/result ordering and audio scheduling still need review. |
| High-refresh motion and camera/input | Ground navigation and focus improved | Fractional native-step previews produce distinct ground views at 5–240 Hz and irregular schedules without a delayed first response. Native endpoints and focus schedules remain identical. Cloud wind/parallax now uses retained fractions and camera-step snapshots, with identical endpoints at 0.5–240 Hz. Unit bodies, shadows and hit targets now follow fractional turn positions, checked at 5–240 Hz; full native displacement ownership remains partial. Flybys, globe motion, transitions and result cameras still need smoothing. |
| Terrain, water, lighting and visibility | Submission optimized | Indexed native row spans and omission of unused wrapped copies preserve pixels, active painter commands and picking while reducing CPU/GPU work. Wide-screen sky background now covers exposed areas; normal/close lateral terrain cuts now have bounded expansion and native CPU face rejection; circular/bird coverage remains open. Water still recomputes shared vertex samples; profile first mission, changing terrain, shadows and heavy effects; test wide/high-DPI displays. |
| Models, sprites, painter and effects | Painter work reduced | Retained float64 triangle centers, per-model anchor checks and shared-corner projection preserve depth slots, pixels and picking through geometry edits. Native overlap and sprite regressions pass; headed Metal frame comparisons recorded below. Unit health bars now use two instanced submissions with identical checked pixels/depths, including 4K buffers and removal/reuse. Per-vertex projection, sorting, transparent sprite draw calls and wider resource lifetime remain to review. |
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

## Painter geometry work on the Mac GPU

The [headed hardware baseline](performance/2026-09-09-hardware-baseline.json)
identifies painter processing as the largest sampled JS cost in opening, rotating
camera and 215-person scenes. Unlike the earlier SwiftShader runs, Chromium reports
`ANGLE Metal Renderer: Apple M5`. The viewport and browser-reported screen are
Playwright-emulated 1440×1000 at DPR 1; these values do not establish the physical
monitor's resolution or refresh rate. This is the development build with Chrome's
CPU sampler enabled, not a production performance certification.

`Painter` now retains local triangle centers by position-attribute identity and
version. Geometry edits invalidate them, replacement attributes start fresh, and
weak keys release the cache when source attributes become unreachable. Float64
centers preserve the previous JS addition order and precision before native cell
rounding. The terrain cache retains 786,432 bytes (0.75 MiB); it is CPU-only and
adds no GPU buffer, upload, draw or triangle. Native models test their common
anchor's visibility once per instance instead of once per face. Transforms,
projection, native buckets, cell/object/face ordering and alpha handling are still
computed from the live state. Simulation, inputs and animation clocks are untouched.

`check-browser-painter-work.mjs` at version 151 (commit `2df812c42cfbca52254c3b61d2928500e84add66`) compared the retained browser implementation from
`b69306d1524258cd9b04db2ebee5305133f2961c` with that version’s painter in the same scene. Reproduce this historical comparison from that checkout; the current helper baseline is advanced for subsequent work.
All depth slots, RGBA bytes, draw counts, triangle counts and center picks agree in
11 cases: six heading/zoom/seam poses, a warm cache, terrain deformation, attribute
replacement, changed transforms/model headings and overview bypass. The baseline
is reconstructed from Git into ignored `.tools/performance/` by a shared test
helper; it is not shipped. [Raw comparison](performance/2026-09-09-painter-equivalence.json).
A portable check covers cache reuse, float precision, interleaved positions and
attribute-version invalidation.

The native executable comparison still passes 70 mixed queues / 1,036 triangles,
774 deferred alpha records and 55 model-bias arrays. All twelve native GPU overlap
cases, eight sprite overlaps, four interleaved mesh/sprite overlaps, eight native
cell/pass ties and 392 sprite poses pass. Typecheck, all 149 portable tests, parity
consistency and production build pass. Selected source lint has no errors; Fallow
reports maintainability 85.8, average cyclomatic 2.8 and p90 5. Existing lint
warnings, three dependency cycles and three unused dependencies remain.

Reproduce the alternating whole-frame comparison with:

```
node scripts/profile-game.mjs --headed --compare-painter /tmp/painter-paired.json
```

Each opening/camera/crowd workload runs six samples in old/new/new/old/old/new order,
with one second settling and four seconds profiling each. Camera input is released
before resetting each run's pose so a pending RAF cannot rotate the next static
workload. The crowd adds 200 stationary braves once. Static comparison scenarios
freeze simulation; camera samples hold Q. Both implementations share the current
sky, camera, sprite and terrain-submission code.

[Raw corrected paired hardware report](performance/2026-09-09-painter-hardware-paired.json),
Apple M5/macOS arm64, Node 24.18, headed Chrome 153/Metal, 1440×1000/DPR 1.
The table takes the median of each mode's three per-run statistics:

| Workload | Before CPU median / p95 | Current CPU median / p95 | Before / current frame-gap p95 | Draw calls |
| --- | ---: | ---: | ---: | ---: |
| Opening | 5.0 / 5.8 ms | 4.2 / 4.9 ms | 7.7 / 7.3 ms | 79 / 79 |
| Rotating camera | 5.4 / 6.2 ms | 4.4 / 5.2 ms | 7.8 / 7.4 ms | 79 / 79 |
| 215-person crowd | 7.1 / 8.2 ms | 6.3 / 7.3 ms | 10.7 / 8.0 ms | 479 / 479 |

Median JS frame work falls by 16%, 19% and 11% respectively. Static submission
counts are identical in every run: 68,613 opening and 69,413 crowd triangles.
Camera triangle medians vary with sampled headings (68,955–69,099); the separate
fixed-pose comparison verifies exact equality. Both implementations retain the
same GPU drawing and shader paths. The benchmark samples whole JS frames and RAF
gaps, not GPU execution time or physical display presentation. It does not prove
those monitors can display the inferred frame rate, or certify 4K/high-DPI loads.

Long frames remain: current runs include maximum gaps of 43–110 ms, and the last
crowd run's maximum exceeds the baseline runs despite better median/p95 costs.
Do not report this as a complete stutter fix. Painter vertex projection/visibility
and command sorting remain major costs; the crowd still issues 479 draw calls.
Unit motion smoothing, larger gameplay/effect workloads, production profiling,
resource-lifetime measurement and the other audit rows remain open. This removes
redundant browser work while preserving the existing parity boundary, so it adds
no native completion credit.


## Unit motion between simulation turns

The native body/shadow queues (`0046f080` / `0046f850`) draw the previous position
plus displacement times a presentation fraction. `004ed700` stamps the person
record after its controller. The browser now captures positions around each actual
simulation turn and uses elapsed fractional turn time instead of last second's
measured frame/turn ratio. Reusable vectors and a weak map keep presentation state
outside gameplay records and avoid new per-frame position allocations. This retains
the native previous-to-current curve; it does not predict future movement. The
original first draw can already have a nonzero frame-counter fraction, whereas
our phase starts at the actual turn boundary. The previous-turn visual delay and
remaining native flag/displacement/support-height ownership are explicit boundaries,
not a claim of identical outer scheduling. See [native evidence](reverse-engineering.md#person-render-position-interpolation--2026-09-09).

Bodies and shadows use the displayed position; shadow height samples the ground
beneath it. Visibility and painter cell ties retain the authoritative current cell.
Click bounds, drag selection and tooltip anchors follow the displayed body. Picking
also resolves an airborne body when the pointer has no terrain intersection.
Class/team changes, building transitions, explicit placement and new unit identities
cut stale motion history. Sprite frame selection and authored animation cadence stay
unchanged; interpolating positions does not invent additional sprite frames.

`check-native-unit-interpolation.py` executes 1,024 native body/shadow pairs and
four controller-stamp cases. Of these, 814 coordinate cases match exactly; the
remaining continuous fractions differ by at most one native coordinate unit from
integer truncation. Portable fixtures preserve executable provenance. Whole-world
regressions compare observer-enabled schedules against simulation without observers,
including RNG, movement, construction, Blast, combat and celebrations at three speeds.

`check-browser-unit-motion.mjs` runs the actual Scene loop at 5/12/24/30/60/120/144/240 Hz
and irregular intervals. All reach the same two-second endpoint and 24 simulation
turns / 48 animation updates. At 240 Hz, 16 movement turns produce 320 distinct
visible positions; at 60 Hz they produce 80. First displayed movement occurs within
one browser frame after the first simulated move. Drawing is stubbed for this
schedule sweep; separate real GPU probes verify three isolated person frames differ,
paused motion freezes, airborne selection works and an authoritative-cell-only gate
still draws 350 person pixels. [Raw checks](performance/2026-09-09-unit-motion.json).

Reproduce the hardware comparison with:

```
node scripts/profile-game.mjs --headed --compare-unit-motion /tmp/unit-motion.json
```

Each workload runs old/new/new/old/old/new, settling one second and profiling four.
Each run resets the world/camera and orders the blue units to the same destination;
the crowd adds 200 braves. The baseline disables snapshots and uses direct current
positions. Both modes contain the current cell-uniform and selection changes, so
this isolates interpolation cost, not the entire change from version 151.
[Raw hardware report](performance/2026-09-09-unit-motion-hardware.json): Apple M5,
macOS arm64, Node 24.18, headed Chrome 153, ANGLE Metal, 1440×1000/DPR 1.
Medians of each mode's three per-run statistics:

| Workload | Direct CPU median / p95 | Interpolated CPU median / p95 | Direct / interpolated frame-gap p95 | Draw calls / triangles (both) |
| --- | ---: | ---: | ---: | ---: |
| Opening orders | 4.1 / 6.1 ms | 4.1 / 6.1 ms | 7.2 / 7.2 ms | 97 / 68,769 |
| Selected crowd orders | 12.7 / 15.9 ms | 12.7 / 16.0 ms | 17.9 / 17.9 ms | 1,072 / 74,619 |

No measurable median increase appears at this precision. This is not proof of zero
cost, GPU execution time or physical display FPS. Opening orders finish during each
sample; 47–50 crowd units still move at its end. Direct crowd CPU medians range
11.5–12.9 ms and interpolated medians 12.6–12.7 ms. Interpolated maximum frame gaps
still reach 85.6 ms. Selected crowds remain a performance limit: 1,072 draw calls
and 12.7 ms JS work do not support robust high-refresh play. Sprite/selection/health
submission is the next measured rendering target. Production, 4K and other hardware
remain unverified.

TypeScript, 152 portable tests, parity consistency and production build pass.
Native painter overlaps, sprite ordering, all 392 sprite poses, moving shadows and
live selection regressions pass. New clock/motion modules pass ox-standard; Fallow
maintainability remains 85.8, average cyclomatic 2.8 and p90 5. Full native per-class
interpolation ownership remains partial in the ledger; modern smoothness alone does
not earn whole-engine parity credit.


## Instanced unit health bars

The selected-army profile identified hundreds of opaque health meshes alongside
transparent person layers and selection arrows. `HealthBars` retains the existing
person meshes as the source of visibility, transforms, team colors and native
per-triangle painter slots, then submits the background/fill shapes as two
`InstancedMesh` draws. It restores source visibility after rendering, so selection,
queries, updates and disposal continue to use the existing scene. Only ground-view
unit health bars are batched; building bars, transparent sprites and overview retain
their current paths. This optimizes the browser's existing health-bar presentation;
it does not claim that its 3D bar artwork is an original-game reconstruction.

Per-instance attributes carry the source painter offset and authoritative cell.
The native depth texture and polygon queue stay unchanged; all submitted triangles
retain their original slots. The shared projection hook now includes the instance
transform in lighting's view position as well as in the projected position. Without
that, the initial comparison caught one-byte color differences on some damaged
bars. No tolerance was added: the corrected path matches every RGBA byte checked.

Batches grow to twice the required capacity, retain that capacity across removals,
and upload only the active matrix/color/cell/slot spans. Growth releases the old
batch resources. Scene disposal releases both retained geometries, materials and
instance buffers. This adds two small geometry copies and instance buffers, while
retaining the original source meshes and CPU painter work. It is a submission
optimization, not a claim of reduced total memory or eliminated per-person work.

`check-browser-health-bars.mjs` compares batching disabled/enabled in 16 cases:
unselected/selected opening, damaged mixed-team crowds at six headings, 1920×1080,
3440×1440 and 3840×2160 render buffers, 1920×1080 at DPR 1.8, removal, complete
removal, recreated source meshes and overview bypass. These explicit GPU buffer
sizes test rendering equivalence, not physical display changes or HUD layout.
Every RGBA byte, native painter depth slot and submitted triangle count agrees.
Source visibility is restored, temporary batch meshes are detached, retained
capacity survives reuse and disposal removes both GPU geometries.
[Raw comparison](performance/2026-09-09-health-bars-equivalence.json).
The mixed-team crowd falls from 1,079 to 685 calls (394 fewer); selected opening
falls from 97 to 85. The native depth overlaps, translucent sprite/mesh ordering,
392 imported sprite poses, real Blast shadow, live selection and nine motion
cadences also pass. TypeScript, all 152 portable tests, parity consistency and the
production build pass. The new module passes ox-standard; Fallow remains 85.8,
average cyclomatic 2.8 and p90 5.

Reproduce the paired whole-frame measurement with:

```
node scripts/profile-game.mjs --headed --compare-health-bars /tmp/health-bars.json
```

The existing moving-order workload resets the world/camera for each run, orders
blue people to (10,34) and adds 200 braves for the crowd. Each scenario uses six
old/new/new/old/old/new runs with one second settling and four seconds profiling.
Both modes retain the same unit interpolation, gameplay and renderer; the flag
only toggles instanced health submission. The comparison therefore includes its
collection, buffer-update and GPU-submission costs together.


[Raw paired hardware report](performance/2026-09-09-health-bars-hardware.json):
Apple M5/macOS arm64, Node 24.18, headed Chrome 153, ANGLE Metal, 1440×1000/DPR 1.
Medians of each mode's three per-run statistics:

| Workload | Separate CPU median / p95 | Instanced CPU median / p95 | Separate / instanced frame-gap p95 | Separate / instanced calls | Triangles (both) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Opening orders | 6.0 / 8.5 ms | 6.0 / 8.4 ms | 10.1 / 7.8 ms | 97 / 85 | 68,769 |
| Selected crowd orders | 11.6 / 14.8 ms | 10.7 / 13.9 ms | 15.0 / 14.4 ms | 1,072 / 670 | 74,619 |

The crowd uses 37.5% fewer draws and 7.8% less median JS frame work. All six crowd
runs end with 47 people still moving. Separate-draw CPU medians are 11.6 ms in all
three runs; instanced medians are 10.7, 11.3 and 10.6 ms. Opening median cost is
unchanged. Absolute timings differ from earlier audit sessions, so only this
paired comparison supports the improvement claim. Both modes retain any allocated
batch capacity between samples; this is not a before/after memory-savings result.

Stutter remains: instanced maximum frame gaps reach 100.3 ms in the opening and
128.6 ms in the crowd. This benchmark measures whole JS frame work and RAF gaps,
not GPU execution time or physical monitor presentation. Pixel equality at 4K
is not a 4K performance certification. The last crowd CPU profile still spends
1,829 ms of its four-second sample inside `Painter.update`, with native visibility
and projection also prominent. The remaining 670 calls include transparent person
layers and selection arrows. CPU painter work, transparent batching and the other
unfinished audit rows remain targets; this optimization adds no native parity
credit and does not finish the modern-hardware goal.


## Shared-corner painter calculations

Native depth ordering remains unchanged. The browser's non-indexed mesh vertices
repeat the same positions across adjoining faces; the painter now transforms each
shared corner once per instance/frame, then reuses its integer depth and, for
completed models, projected screen coordinates. It still generates the same
per-face commands, applies the same cell and winding gates, sorts the same native
buckets/ties and writes the same depth slots. Raw model, triangle-depth and
projected-point arrays are reused within a frame. Model rotation is constructed
only for model geometry, and object-constant cell/pass work is outside the face loop.

`PainterVertices` retains exact local-coordinate identity with weak attribute keys.
It observes normal/interleaved attribute versions, verifies that previously shared
corners still agree after edits, and rebuilds the mapping when a corner splits.
Projection results and raised-ground flags are recomputed for every instance/frame;
camera, transforms, scale, land flags and clipping do not require fragile cache keys.
Native terrain uses its 129×129 corner grid to build the mapping without string
hashing. Grid coordinates and shared heights are checked; irregular edits fall back
to exact XYZ keys. The opening terrain has 98,304 source vertices but only 16,641
unique positions. Mapping, visit flags and integer depth buffers retain 884,736
bytes (0.844 MiB), in addition to the existing center cache. This is CPU storage;
it adds no GPU buffer, triangle, draw or depth-texture upload.

The first generic XYZ-map implementation improved warm calculations but regressed
new-terrain median CPU time from 3.8 to 12.1 ms. The checked grid path removes that
cost rather than hiding it behind a warm-only benchmark.
[Initial diagnostic](performance/2026-09-09-painter-vertices-initial-cost.json).

`bench-painter-work.mjs` runs the actual painter without GPU drawing, using 12 warmup
pairs and 18 alternating-order pairs per case. The water case changes all duplicate
heights together and increments the attribute version; it tests invalidation cost,
not the complete water renderer. The cold case clones the terrain position
attribute before each pair, forcing new center/mapping entries. Every depth slot
is compared after every pair. Apple M5/macOS arm64, headed Chrome 153:

| Isolated painter workload | Separate median / p95 | Shared median / p95 |
| --- | ---: | ---: |
| Warm geometry | 3.5 / 3.8 ms | 2.7 / 2.9 ms |
| Changed water heights | 3.8 / 4.1 ms | 3.3 / 3.5 ms |
| New terrain attribute | 3.9 / 4.2 ms | 3.5 / 3.7 ms |

[Raw corrected CPU comparison](performance/2026-09-09-painter-vertices-cost.json).
These are isolated painter timings, not frame times or FPS. Generic irregular
geometry still pays for an exact XYZ map when first seen or split; the native
terrain path avoids that string-map cost. Full terrain rebuilding, atlas uploads
and other construction/loading work are outside this microbenchmark.

`check-browser-painter-work.mjs` compares against version 153's complete painter,
`d7f33d90e498755cdc1db0802c6729423bd098a0`, in the same scene. The retained helper
reads its baseline from Git into ignored `.tools/performance/`; it is not shipped.
All RGBA bytes, depth slots, draw/triangle counts and center picks agree in 16 cases:
headings/zoom/seams, warm reuse, raised-land flags changed without geometry edits,
exclusion flags, 3440×1440/4K/high-DPI render buffers, split vertices, replacement
attributes, model headings/transforms and overview bypass. The opening calls the
native coordinate conversion 3,912 times instead of 22,188 (82.4% fewer); irregular
split geometry intentionally shares less. These counters exclude model-local
projection and are not whole-frame performance measurements.
[Raw rendering comparison](performance/2026-09-09-painter-vertices-equivalence.json).

Portable checks cover interleaved attributes, shared motion, splits, replacement
and invalid grid candidates. TypeScript, all 154 tests, parity consistency and
production build pass. The original executable check still matches 70 mixed queues,
1,036 triangles, 774 deferred alpha records and 55 model bias arrays. Native GPU
depth overlaps, translucent sprite/mesh order, 392 sprite poses, Blast shadows and
live selection pass. The health-bar comparison also retains identical pixels and
cleanup. New cache code passes ox-standard; Fallow remains 85.8, average cyclomatic
2.8 and p90 5. No original-behavior requirement is newly completed by this renderer
optimization, so the parity percentage stays unchanged.

Reproduce the whole-frame comparisons with:

```
node scripts/profile-game.mjs --headed --compare-painter /tmp/painter-static.json
node scripts/profile-game.mjs --headed --compare-painter --moving-orders /tmp/painter-moving.json
```

The first command covers frozen opening/crowd scenes and a rotating camera. The
second resets the world and issues the existing opening/crowd movement orders,
covering actual water updates and active gameplay. Each workload uses six
old/new/new/old/old/new runs, one second settling and four seconds profiling.
Both implementations share the current renderer, health batching and unit motion.


The profiler now clears residual input/camera state, ignores physical mouse edge
panning during its keyboard workload, records starting/ending poses and checks
fixed-view terrain counts throughout each sample. Earlier runs with drifting views
were rejected. The retained moving run also records camera controls and simulation
turns: crowd samples all finish on turn 62 with 43 people still moving.

[Static/camera hardware report](performance/2026-09-09-painter-vertices-hardware.json)
and [active-gameplay hardware report](performance/2026-09-09-painter-vertices-moving-hardware.json):
Apple M5/macOS arm64, Node 24.18, headed Chrome 153, ANGLE Metal, 1440×1000/DPR 1.
Medians of each mode's three per-run statistics:

| Workload | Separate CPU median / p95 | Shared CPU median / p95 | Separate / shared frame-gap p95 | Calls (both) |
| --- | ---: | ---: | ---: | ---: |
| Frozen opening | 4.1 / 4.3 ms | 3.4 / 3.7 ms | 9.3 / 9.3 ms | 79 |
| Rotating camera | 4.1 / 4.4 ms | 3.6 / 3.8 ms | 9.3 / 9.3 ms | 79 |
| Frozen crowd | 5.7 / 6.1 ms | 5.1 / 5.8 ms | 9.3 / 9.3 ms | 479 |
| Opening orders | 5.8 / 8.6 ms | 3.8 / 6.9 ms | 9.1 / 9.3 ms | 85 |
| Selected crowd orders | 10.8 / 14.5 ms | 7.6 / 11.4 ms | 17.0 / 9.3 ms | 670 |

Median JS work falls by 17.1%, 12.2%, 10.5%, 34.5% and 29.6% respectively.
Fixed-scene triangle medians agree in every run: 68,613 frozen opening, 69,413
frozen crowd, 68,769 opening orders and 74,619 crowd orders. Camera triangle counts
vary with sampled headings; the fixed-pose pixel/depth checks establish equality
at matching views. Active-crowd separate medians are 10.8–10.9 ms and shared medians
7.6–7.8 ms. This comparison covers the actual Scene loop, but its fresh simulation
fixtures do not constitute a full UI/campaign playthrough.

The static workloads gain CPU headroom without a material frame-gap change.
Shared maximum gaps still reach 74.9 ms in the static workloads and 108.1 ms in
active gameplay. GPU execution time, physical display presentation, production
performance and 4K frame budgets are not established by these headed development
runs. The 4K checks above establish output equivalence only. Painter traversal and
sorting, transparent sprite submission, larger effect/terrain-rebuild workloads,
wide-screen terrain clipping and the remaining modernization audit stay open.

## Ground draw-region diagnosis (2026-09-09)

The remaining sawtooth terrain/sky edge is reproducible independently of the
sky material, HUD, lighting and sprites. `check-browser-ground-coverage.mjs`
clones the live first-level terrain into a black scene with an opaque white
material. It retains the native GPU projection hook, front-face culling, real
terrain heights, indexed cell selection, nine wrapped instances and painter.
The ordinary ground view is compared with the same quadrilateral widened
by 16 and 32 cells on each side. Near/far distances and all projection parameters
are unchanged. These expansions are **diagnostics, not a shipped correction**.

64 cases cover four CSS resolutions, eight headings and two camera centers,
including a toroidal seam. Both expansions preserve every baseline covered
pixel at the 50% multisample threshold. Their footprints converge within one
pixel across the matrix. At the opening center and heading on 3440×1440, the
16-cell expansion restores 120,316 terrain pixels. It submits 109,296 ground
triangles versus 66,096 before (+65.4%); 32 cells submit 152,496 with the same
footprint in this pose. A single instanced draw still processes nine copies of
each selected cell, even though most copies are rejected later.

| CSS viewport | Added terrain pixels, 16-cell expansion (range across 16 poses) |
| --- | ---: |
| 740×480 (640 px battlefield) | 0 |
| 1920×1080 | 3–782 |
| 3440×1440 | 103,630–133,018 |
| 3840×2160 | 191,287–236,906 |

[Raw coverage and submission counts](performance/2026-09-09-ground-coverage.json)
record the baseline source commit. Reproduce with
`node scripts/check-browser-ground-coverage.mjs [output.json]`; the default writes
to `/private/tmp` so rerunning cannot silently replace historical evidence.
No GPU-time, CPU-time or FPS result is inferred from these counts. The isolated
mask deliberately does not compare terrain color, object occlusion or picking.

The native normal-land caller `0046d070` invokes `0046d970` before `0046e930`:
shared left/right/bottom rejection and positive projected winding. The browser
terrain material already uses GPU front-face culling. Missing CPU execution of
that leaf alone therefore does not establish missing raster winding rejection.
Native special-land mode (level flag 8), full original ground queue ownership and
near-plane/far-range handling still need separate verification.

Next: derive a viewport-dependent visible footprint, reduce the repeated wrapped
terrain submissions, then check ground, models, sprites and picking together.
Retain the fixed-region reference for differential checks. Do not multiply both
polygon axes: the earlier experiment produced invalid near-camera strips.
Normal-view lateral convergence does not certify close/bird views, transitions,
all terrain heights or projection overflow. The terrain correction remains open;
this diagnostic earns no new parity percentage and changes no shipped assets.

## Reject unused wrapped terrain copies (2026-09-09)

Visible ground rows now select which of the existing nine terrain copies can
contain a submitted cell. The 128×128 source geometry, cell index buffer, tile
translations and their original relative order are retained. A copy with no
visible cell is omitted before both painter traversal and GPU submission.
Instance matrices upload only when the selected copies change. Overview bypass
restores the original copy set; the ground renderer remains hidden during the
actual globe view. The one unconditional nine-copy reset in the animation loop
is removed. No shader, projection, simulation, mesh detail or draw boundary is
changed by this optimization.

The opening ground submission drops from 66,096 to 7,344 triangles (88.9%) in the
same single instanced draw. The opening whole scene drops from 68,613 to 9,861,
with the same 79 draw calls. A seam case keeps four copies: 29,376 ground triangles
instead of 66,096. These are submitted-triangle reductions, not FPS percentages.
The painter texture retains its high-water capacity after a larger frame; this
patch makes no retained-memory reduction claim.

`check-browser-terrain-copies.mjs` compares 41 frozen scenes against the actual
previous visibility method retained from `be78f473d1358cb1d437a2c7a6c2fe7bc91484eb`.
It verifies every RGBA byte, active painter command/depth (keyed by original
object, tile translation and source face), three terrain/model picks per view,
and unchanged draw calls. Cases include eight headings, both seams, close/bird
presets, ultrawide/4K/DPR 1.8, deliberately expanded lateral bounds, deformed
vertices, changed land flags, attribute replacement and overview bypass. Whole
painter buffers are intentionally not compared: compacting instance slots moves
otherwise identical commands. The portable test independently scans original
cell visibility to verify selected tiles in 54 heading/center/expanded-bound
combinations, plus empty bounds. All 155 portable tests and typechecking pass.

Validation also passes the 392 native GPU sprite poses, Blast shadow, selection,
indexed-terrain equivalence, water/overview and 16 health-bar batching checks. The
production build succeeds; Fallow maintainability remains 85.8, average cyclomatic
2.8 and p90 5. Existing lint warnings remain, with no new errors.

The earlier ground-coverage diagnostic explicitly restores the original nine
copies, preserving its historical submission-cost baseline. The hardware profiler
adds `--compare-terrain-copies`, optionally with `--moving-orders`; it uses the
retained old selector and alternates old/new/new/old/old/new. Its fixed-camera and
per-run constant-ground-submission guards remain enabled.

### Measured frame cost

Headed Chrome 153 / ANGLE Metal / Apple M5, 1440×1000 CSS viewport, DPR 1.
Values below are medians of three run medians/p95s per implementation. Each run
settles for one second and measures the next four seconds of the live frame loop.

| Workload | Previous CPU median / p95 | Selected-copy CPU median / p95 | Median reduction |
| --- | ---: | ---: | ---: |
| Frozen opening | 3.5 / 3.8 ms | 2.5 / 2.9 ms | 28.6% |
| Rotating camera | 3.7 / 4.0 ms | 2.7 / 3.0 ms | 27.0% |
| Frozen 200-brave crowd | 5.5 / 6.6 ms | 4.3 / 4.9 ms | 21.8% |
| Opening with move orders | 4.4 / 7.6 ms | 3.1 / 6.0 ms | 29.5% |
| Selected crowd with move orders | 9.0 / 12.7 ms | 7.2 / 10.8 ms | 20.0% |

Draw calls remain 79/79/479/85/670 respectively. All fixed poses remain unchanged
through each run and agree across implementations. Rotating views naturally
sample differing headings and copy counts. Moving crowd runs all end at turn 62
with 43 moving units; opening runs end at turn 60–62 after the short move finishes.
The fresh-world moving fixture retains the existing React-store boundary described
in the earlier unit-motion audit; it is not a complete campaign/UI playthrough.

The moving crowd's median run p95 frame gap improves from 16.7 to 9.3 ms; other
p95 gaps remain about 9.2–9.3 ms. New maximum gaps still reach 83.3 ms. These short
local CPU samples do not certify sustained refresh rates, all hardware or 4K GPU
performance. They support removing unnecessary terrain work without lowering
visual fidelity. The visible draw-region defect remains open and no new native
parity credit is recorded.

Raw evidence: [41 exact comparisons](performance/2026-09-09-terrain-copies-equivalence.json),
[static/camera profiles](performance/2026-09-09-terrain-copies-hardware.json),
[moving-order profiles](performance/2026-09-09-terrain-copies-moving-hardware.json).

### Rejected early shader experiment

Before selecting whole terrain copies, an early GPU rejection was tested. It
looked up the existing painter depth before transforming a vertex, returning an
outside-clip position for rejected faces. Twenty full RGBA/depth/draw/pick cases
were identical, including health instances and overview bypass. Headed Chrome
153 / ANGLE Metal / Apple M5 elapsed queries at a 3440×1440 render size measured:

| Frozen scene with 80 added selected braves | Old median / p95 | Early-rejection median / p95 |
| --- | ---: | ---: |
| Original draw region | 1.266 / 1.832 ms | 1.246 / 1.919 ms |
| Diagnostic lateral expansion | 1.358 / 2.835 ms | 1.317 / 2.054 ms |

Each group contains 30 samples after six warmup pairs, with pair order reversed
each iteration; disjoint queries fail the experiment. Queries surround the full
renderer call, including uploads and driver scheduling, and can include submission
bubbles. They do not measure display FPS or isolate shader execution. The median
improvement is small (1.6–3.0%) relative to variation, with a worse unexpanded p95.
The extra shader branch is **not shipped**. The report and candidate patch are
retained as `performance/2026-09-09-early-projection.{json,patch}`. Reproduce with
`check-browser-early-projection.mjs --measure` after applying that candidate patch;
the script refuses to run if the candidate is absent. The original measured
terrain-copy layout is the report's baseline commit, before copy selection.

### Coverage fixture reproducibility correction

A final replay reproduced all 64 historical submission counts but failed an
additional attempt to match historical pixel counts exactly (up to 2,477 pixels
of coverage difference). The old diagnostic cloned whichever terrain geometry
was present during startup, without waiting for the wave data or recording the
water turn. Its same-frame native/expanded comparisons remain valid; its absolute
pixel counts are not a deterministic startup fixture.

The diagnostic now waits for original wave/terrain data, rebuilds a fresh first
mission at turn zero, applies its water geometry, then freezes and hashes the
cloned positions. Two independent browser startups now match all 64 cases exactly
with geometry SHA-256 `79cb2490e161801e9d6ec0240b32561f0b62365ee53f611f3fd28051d8776f86`.
The pinned opening ultrawide case restores 121,105 pixels with the 16-cell
expansion; submission counts remain 66,096 / 109,296 / 152,496. The historical
report is preserved, and the controlled fixture is recorded separately as
[turn-zero coverage](performance/2026-09-09-ground-coverage-pinned.json).
This is a diagnostic correction, with no additional runtime change or parity credit.


## Wide ground coverage and native face rejection (2026-09-09)

The smaller proportional HUD exposes more battlefield. The original fixed-width
normal/close ground quadrilaterals then cut off visible terrain at their sides.
`viewport-bounds.ts` widens those quadrilaterals laterally, retaining native
near/far distances, taper, pitch and projection. A side/bottom projection envelope
limits unnecessary close-view expansion. Cached terrain extrema include the full
0–63 native wave range and refresh when terrain geometry is rebuilt.

Expansion is bounded by the original signed radius and horizontal scale products.
An initial two-cell margin failed at a rotated row edge (configuration 1, normal,
3840-wide, heading 768, negative height); the retained four-cell margin passes the
row-edge regression through 8K input sizes. This is a bounded modern correction,
not proof that native projection supports arbitrary coordinates. Circular/bird
views and extreme terrain/projection limits remain open.

Simply widening the region increased painter work. Ordinary native ground calls
`screen_clipping` (0x46d970) before queueing each face. The browser previously left
that rejection to GPU front-face clipping. The painter now shares the existing
model triangle gate, reversing imported ground winding, before sorting commands.
Shared vertex projections reuse their output records. Native projection itself
is unchanged. The direct native leaf comparison covers 1,564 float32 triangles,
including both windings, shared side/bottom rejection, retained top-edge triangles
and near-degenerate cases. Special level flag 8 and full ground queue ownership
remain separate from this ordinary-ground gate.

Queue compaction necessarily changes absolute depth-slot values. The retained
painter comparison now records those changes and checks identical final pixels,
draw submissions and picking, plus nonincreasing active commands. Earlier cache
optimization reports retain their stronger identical-slot evidence at their
original commits; that invariant does not apply across this queue change.

Hardware comparison: headed Chrome 153, Apple M5, ANGLE Metal, 3440×1440 CSS,
DPR 1; three alternating old/new pairs per workload, one-second settling and
four-second CPU samples. These are medians of the three run medians/p95s:

| Same expanded scene | GPU-only rejection CPU p50/p95 | CPU rejection p50/p95 |
| --- | ---: | ---: |
| Frozen opening | 3.4 / 3.7 ms | 3.0 / 3.3 ms |
| Rotating camera | 4.1 / 4.6 ms | 3.5 / 4.0 ms |
| Frozen 200-person crowd | 4.8 / 5.3 ms | 4.3 / 4.8 ms |

The measured median reduction is 10.4–14.6%. Frame-gap p95 remains 9.2–9.3 ms.
The complete wider-view feature still costs more than the previous cut-off view:
opening 2.3→3.0 ms, rotation 2.5→3.6 ms, crowd 3.9→4.5 ms in a separate paired
comparison. It draws additional visible ground; this is not claimed as an overall
speedup over that incomplete view. Calls remain 79/479; opening submitted triangles
increase 9,861→17,961. The complete comparison includes an 83.4 ms new-path outlier;
it does not certify stutter-free performance, GPU time, other hardware or 4K speed.

Raw comparisons and coverage checks accompany this section. Modern compatibility
and implementation efficiency receive no new parity percentage credit.


The first moving-crowd profile rejected the initial cache layout: CPU p50/p95
rose from 7.3/10.4 to 12.1/18.1 ms, despite passing static comparisons. Ground
source indices can be far apart in the non-indexed mesh. Preallocating the
projection array to the source vertex count avoids sparse-growth behavior; the
retained final comparison measures 7.4/10.6→6.4/9.9 ms for 200 extra ordered
braves, and 4.1/7.1→3.3/6.3 ms for opening orders. Both paths retain 9.3 ms
frame-gap p95 in the crowded case. This reserves more array slots; no memory
reduction is claimed. The raw failed candidate remains alongside the final result.
The frozen/complete-view measurements above precede this slot-reservation fix;
the final moving comparison is the acceptance measurement for the cache change.

Final checks: 128 isolated normal/close coverage cases match the larger lateral
reference without removing native coverage; eight full-color ultrawide/4K views
match reference pixels and 120 edge/center picks. Nineteen painter comparisons,
41 terrain-copy comparisons, 392 original sprite poses, Blast shadows, selection,
water and ten HUD window sizes pass. The normal 3440-wide opening restores
121,105 isolated ground pixels; the checked maxima are 131,498 at 3440-wide and
234,326 at 4K. These counts use the pinned terrain fixture, not startup timing.
All 156 portable tests, native projection comparisons, typecheck and build pass.
Fallow reports 85.9 maintainability, average cyclomatic 2.8, p90 5; existing
three cycles and three unused dependencies remain. Broad ox-standard warnings
remain, with no new rule errors. Screenshot review confirms intact HUD proportions
and smooth lateral ground edges; distant model lighting remains a parity gap.

Evidence under `references/performance/2026-09-09-viewport-*`: initial widening
cost, complete-view comparison, frozen clipping comparison, rejected and final
moving comparisons, pinned normal/close coverage, full-color/picking comparison,
and final painter equivalence. Run `profile-game.mjs --headed --wide
--compare-painter --moving-orders` for the retained old/new painter comparison.
`--compare-viewport-bounds` compares the complete old/new ground presentation.


## Burning followers: native clocks, shared rendering — 2026-09-09

After finishing the wide-terrain optimization, visible gameplay resumes with
burning-building occupant panic and personal trails. The integration reuses the
existing person movement, spell-trail phases, sprite renderer and fractional unit
interpolator. It adds no render-frame simulation loop or dependency. Native
12 Hz turn endpoints and the existing animation clock are preserved; portable
live-world outcomes agree at 5–240 Hz and irregular frame schedules.

`node scripts/check-browser-person-panic.mjs --headed` exercised actual Lightning
input against a hut containing six followers, original panic poses and both
particle types. GPU isolation found 974 spark pixels and 1,138 bright-particle
pixels. All six followers survived, their emission counters expired and particle
objects were removed. The audio probe observed 27 actual source starts with
nonzero PCM, 21 completions and no more than six concurrent panic voices.

On Apple M5 / Chrome 153 / ANGLE Metal at 1440×1000, DPR 1, the moving scene
sample recorded 390 rendered frames: CPU median **2.5 ms**, p95 **6.8 ms**;
frame gaps median **8.3 ms**, p95 **10 ms**, maximum **75.1 ms**. Peak personal
particles were 84, with 249 total draw calls. Raw evidence:
[`2026-09-09-person-panic.json`](performance/2026-09-09-person-panic.json).
This is an absolute feature-cost observation, not a claimed speedup or a guarantee
for other hardware, larger crowds, 4K or every frame. It retains the modern
renderer while matching native controllers; original mixed-class draw stamps and
complete native voice priority/stealing remain open. The browser audio check now
requires playback: counting cue requests had falsely passed before cue 0x51 was
added to the preload list.

Validation after integration: all 159 portable checks, 392 GPU unit poses,
Blast shadows, selection and the complete Lightning/fire/repair browser scenario
pass. Fallow reports maintainability 85.9, average cyclomatic complexity 2.8 and
p90 5. New panic/trail modules pass ox-standard lint; existing large integration
files retain earlier lint debt, so this is not a claim of a lint-clean repository.


## Share sprite atlases during new fire reactions — 2026-09-10

Nearby-follower ignition exposed recurring render stalls. Chrome's sampling
profiler attributed roughly 1,047 ms of the four-second moving-scene sample to
`texSubImage2D`. An instrumented WebGL call then identified the image: the
2048×4608 original effects atlas, 37,748,736 RGBA bytes. Creating another particle
cloned its Three texture; `Texture.copy` marks the shared `Source` dirty, causing
another upload of the unchanged image. This also affected newly allocated unit
layers and the halo/shadow atlas consumers.

The renderer now shares the original atlas texture and stores each sprite's
repeat/offset in its existing per-object shader uniforms. Source images, palette,
frame selection, filtering, alpha, geometry, orientation and painter ordering stay
unchanged. Destruction releases particle materials while retaining shared atlas
ownership. This avoids both repeated source invalidation and private texture
wrappers; no pool, cache eviction scheme or new dependency was added.

Paired headed Chrome 153 / Apple M5 / ANGLE Metal runs at 1440×1000, DPR 1, used
six nearby followers, actual Lightning ignition, the same opposite-facing camera,
50 peak personal particles and 215 peak draw calls. No other profiling/check jobs
ran concurrently. In a 4.2-second sample:

| Measure | Cloned texture transforms | Shared atlas uniforms |
| --- | ---: | ---: |
| Effects-atlas uploads | 17 | 0 |
| Time inside those uploads | 1,046.6 ms | 0 ms |
| CPU frame median | 4.3 ms | 4.1 ms |
| CPU frame p95 | 71.3 ms | 12.7 ms |
| Frame-gap median | 33.4 ms | 33.3 ms |
| Frame-gap p95 | 66.7 ms | 33.5 ms |

Raw runs: [`before`](performance/2026-09-10-fire-atlas-before.json) and
[`after`](performance/2026-09-10-fire-atlas-after.json). This run was scheduled at
about 30 Hz by the browser/display; it does not certify high-refresh throughput
or other hardware. The game still uses uncapped requestAnimationFrame with native
simulation/animation clocks. The demonstrated improvement is removal of repeated
large uploads and the associated CPU stalls, not a universal FPS guarantee.

`check-browser-person-panic.mjs --nearby --compare-atlas` compares actual rendered
RGBA bytes against the previous cloned-texture UV path, restores the shared path,
and checks that subsequent particle creation uploads neither original sprite
atlas. It also verifies real PCM playback, owned-voice completion and particle
cleanup. Sprite/shadow/spell regressions continue to check native frames, scales,
mirroring and visible pixels; UV assertions now read the per-object transform.

The frozen comparison covered 286 sprites and produced zero differing RGBA bytes
for both the legacy transform path and restoration of the shared path (see
[`pixel evidence`](performance/2026-09-10-fire-atlas-pixels.json)). The broader
392 GPU unit-pose, airborne-shadow and selection regressions pass. All 163 portable
checks pass; Fallow remains 85.9 maintainability, average cyclomatic 2.8, p90 5.


### Occupant exits after shared atlas modernization (2026-09-10)

The native exit integration adds event-time restoration only; it does not add
per-frame work or per-person atlas copies. Shared typed state replaces the old
inferred velocity/formation names and reuses reviewed geometry and flag handling.
The fixed 12 Hz simulation, separate animation clock and fractional presentation
remain unchanged; panic outcomes still agree at 5, 30, 60, 120, 144 and 240 Hz.

`node scripts/check-browser-person-panic.mjs --headed` measured the real six-person
burning-hut evacuation on Chrome 153 / Apple M5 ANGLE Metal, 1440×1000 CSS pixels,
DPR 1. Over 502 frames, CPU p50/p95 was **2.6/6.2 ms**; frame gaps p50/p95/max were
**8.3/9.3/16.6 ms** (roughly 120 FPS), with up to 84 personal particles and 249 draw
calls. No new 2048×4608 or 2048×5824 sprite atlas upload occurred. Small dynamic
texture uploads remain; this is not a claim of zero GPU uploads. Evidence:
`references/performance/2026-09-10-building-exits.json`.

This is a regression budget for this scene, not a paired speedup over the earlier
nearby-flame benchmark: the camera, particle count and browser scheduling differ.
The established atlas before/after and exact pixel comparison remain the evidence
for the modern representation's performance advantage. Neither measurement
claims identical performance across all displays, missions or hardware.

Fallow reports maintainability **85.9**, average cyclomatic complexity **2.8**
and p90 **5**. Changed application files pass formatting/type checks. Ox-standard
still reports existing debt in the large integration modules; this is not a
repository-wide lint-clean claim.

## Staged housing entry: native mechanics on the shared modern renderer

`node scripts/check-browser-housing-entry.mjs --headed` verifies actual right-click
input, three native staged entries and original visible sprite layers. The
hardware run used Chrome 153 / ANGLE Metal / Apple M5, 1440×1000 CSS pixels,
DPR 1, normal simulation speed and the original first-mission village. No other
heavy checks ran during measurement. Camera setup completed before recording;
GPU pixel reads and screenshots occurred after the measured approach.

Across 425 frames, CPU time was 2.5 ms p50 / 6.0 ms p95. Frame gaps were 8.3 ms
p50 / 8.8 ms p95 / 9.4 ms maximum, consistent with roughly 120 Hz scheduling;
maximum draw submissions were 87. Raw report:
`references/performance/2026-09-10-housing-entry.json`. This is a bounded scenario
measurement, not a paired speedup, whole-game budget or guarantee on other GPUs.

Entry reuses the shared ground movement, routes, sprite atlas and fractional
presentation. No new texture copies, render loop or frame-rate-dependent timers
were added. Portable 5–240 Hz comparisons preserve exact entry positions, RNG,
occupancy and animation clock state. The ordinary unit list remains the source
of resident counts; full global allocation/slot ownership is still pending.
Fallow reports maintainability 85.8, average cyclomatic 2.8 and p90 5. Existing
repository-wide ox-standard debt remains; the new housing module has no lint
errors. Native-facing memory labels remain at the oracle boundary rather than
being duplicated in live TypeScript fields.

## Native warrior queues and batch conversion

`node scripts/check-browser-training.mjs --headed` exercised eight ordered braves:
five entered the original warrior hut and three waited at native queue positions.
The native conversion then created five warriors that walked out using original
sprites. One existing animation loop, shared atlas textures and the existing
fractional unit presentation handle the added behavior. Admission/conversion
advance on native turns; 5–240 Hz comparisons preserve RNG, queue, occupancy,
shared command records and resulting unit positions.

Chrome 153 / ANGLE Metal / Apple M5, 1440×1000 CSS pixels, DPR 1, normal speed:
545 measured approach frames, CPU p50 2.8 ms / p95 6.6 ms, frame gaps p50 8.3 ms /
p95 9.3 ms / max 9.4 ms, at most 103 draw submissions. This is consistent with
roughly 120 FPS scheduling. Camera setup finished before measurement and screenshots
and GPU readbacks followed it; no heavy checks ran alongside the hardware sample.
Raw report: `references/performance/2026-09-10-training.json`. It is a bounded
scenario, not a paired speedup or whole-game performance guarantee.

The world adapter counts people in one pass instead of filtering the whole unit
list for each tribe/model pair. Movement, queue logic, facing, admission, native
orders and conversion reuse their existing controllers. Fallow reports 85.7
maintainability, average cyclomatic 2.8, p90 5 and 12 circular dependencies. Shared
live adapters still depend on the central model; broader module-boundary cleanup
remains open. ox-standard's existing repository-wide debt is not treated as a
passing lint gate. The new/renamed entry module has no lint errors after formatting.

## Training panels on the modern HUD

Original HFX icons and the small immutable silhouette masks share the existing HUD
atlas. A native-size Canvas2D bitmap is composited at the saved uniform HUD scale;
its position follows the existing render loop. Content is cached by actual panel
state, with only the two relevant native turn bits retained in the cache key.
No extra render loop, React update per frame, image readback, cloned WebGL atlas or
simulation clock was added. Thirty real stationary browser frames trigger zero
bitmap repaints; 24 freshly painted canvases still match original source artwork
and native submissions. This is measured avoided repaint work, not a claimed
whole-frame speedup. The shared spell/training charge helper removes duplicated
layer arithmetic, and corrects the original charge-only integer overflow.

`node scripts/check-browser-training.mjs --headed` used the same eight-person
queue approach as the previous training measurement, now with floating feedback.
Chrome 153, ANGLE Metal / Apple M5, 1440×1000 CSS pixels, DPR 1, normal speed:
545 frames, CPU p50 **2.9 ms**, p95 **6.7 ms**; frame gaps p50 **8.3 ms**, p95
**9.0 ms**, maximum **10.4 ms**; at most **103** WebGL submissions. The earlier
sample without panels was 2.8/6.6 ms CPU with the same 103 submissions. Both are
consistent with approximately 120 FPS in this scenario; the 0.1 ms CPU difference
is not evidence of a meaningful speedup or regression. No heavy checks ran during
this hardware measurement. Source report:
`references/performance/2026-09-10-training-panels.json`.

Five live panel geometry checks cover 1440×1000 through 3840×2160, including
3440×1440 ultrawide. The 120×68 logical panel scales uniformly and its tail stays
on the projected building; extra width remains battlefield space. Fallow reports
85.8 maintainability, average cyclomatic 2.8 and p90 5. Existing integration-module
lint/dependency debt remains open. Complete panel input/lifetime, dynamic palettes,
whole-game performance and other hardware/high-DPI coverage remain unfinished.


## Interactive training occupants (2026-09-10)

Training controls reuse the cached native-art canvas and the browser's ordinary
button event/focus machinery. Five small transparent buttons use the same uniform
HUD transform as their icons; no per-frame listeners, new RAF, WebGL textures,
render cap, simulation clock or React animation loop were introduced. Their
selection action reuses existing native occupancy/order/movement consumers when
players issue subsequent orders. Original bit operations live in one short named
helper, separate from the DOM and live-world adapter.

The same eight-person queue workload ran headed on Chrome 153 / ANGLE Metal /
Apple M5 at 1440×1000 CSS pixels, DPR 1. Across 545 measured approach frames,
CPU p50 was **2.9 ms**, p95 **6.9 ms**; frame gaps p50 **8.3 ms**, p95 **9.5 ms**,
maximum **10.4 ms**; maximum WebGL draw calls **103**. The preceding read-only
panel sample was 2.9/6.7 ms CPU and 8.3/9.0 ms frame gaps. This bounded comparison
remains consistent with roughly 120 FPS; it does not establish a speedup, a
statistically significant regression or whole-game performance. No heavy checks
ran during the hardware measurement. Raw report:
`references/performance/2026-09-10-training-selection.json`.

The stationary panel still repaints its bitmap zero times across 30 browser RAF
frames. All 195,840 source-art pixels remain matched; mouse hit regions scale
with the icon row at five desktop sizes through ultrawide/4K. Actual keyboard,
mouse, camera-focus, physical-slot reuse and movement-order checks pass. Fallow
reports maintainability 85.8, average cyclomatic 2.8, p90 5 and 12 existing module
cycles. Broader module/DOM lifecycle cleanup and high-DPI/other-device/heavy-effects
profiling remain open. Native command buffering, panel lifetime, full selection
states and voices remain separate parity boundaries.


## Dismantling with original worker behavior (2026-09-10)

The new controller runs on the existing native turn clock and uses shared movement,
animation, occupancy, command-pool and construction-plan helpers. Presentation
continues on uncapped RAF. The original work phases and RNG delays are preserved;
5/30/60/144/240 Hz tests produce identical final positions, timber, turns and RNG.
A normal DOM button reuses the cached original-art canvas and uniform HUD scale;
hover/pressed changes repaint only when its draw trace changes. No new textures,
render loops or per-frame worker allocations were introduced by the controller.

Headed Chrome 153, ANGLE Metal / Apple M5, 1440×1000 CSS pixels, DPR 1 measured
736 dismantling frames: CPU p50 **2.6 ms**, p95 **6.3 ms**; frame gaps p50
**8.3 ms**, p95 **10.3 ms**, maximum **16.6 ms**; at most **105** WebGL submissions.
The script excludes the deliberate screenshot/pause boundary from frame gaps.
No heavy checks or app edits overlapped profiling. This supports roughly 120 FPS
in the eight-worker scenario, not a paired speedup or a whole-game performance
claim. Raw report: `references/performance/2026-09-10-dismantling.json`.

Named phases keep the command reconstruction separate from its live-world adapter.
The entry adapter now shares one state initializer and simple dispatch branches.
Fallow reports maintainability 85.7, average cyclomatic 2.8, p90 5, twelve existing
module cycles. Formatting passes; repository-wide ox-standard still reports
existing lint debt (including model/type style), so it is not claimed clean.
The new dismantling module has no lint errors. Broader world-adapter cleanup,
other hardware/high-DPI and heavy-effect profiling remain open.


## Guard-tower occupants on the shared modern renderer (2026-09-10)

Tower entry reuses the original movement, command, animation, occupancy and cell
helpers. One signed display-height field replaces a misleading duplicate field.
Its renderer uses the existing shared sprite atlas and interpolated positions;
there is no additional render loop, texture, unit mesh, frame-rate cap or global
traversal. Native simulation rules advance on the existing turn clock, with
identical outcomes and held animation at 5/30/60/144/240 Hz. Exit height cleanup
uses the existing person-cell synchronization pass and native physics rule.

The isolated headed Chrome 153 / ANGLE Metal / Apple M5 sample at 1440×1000 CSS
pixels, DPR 1 recorded 1,061 close-view approach frames: CPU p50 **1.5 ms**, p95
**2.0 ms**; RAF timestamp gaps p50 **3.6 ms**, p95 **3.9 ms**, maximum **7.2 ms**;
maximum **83** WebGL submissions. No app edits or heavy checks overlapped the
measurement. This is a different view/workload from earlier 120 Hz eight-worker
samples, so it does not prove a speedup or a physical display refresh rate. It
records observed browser callback cadence and CPU cost, not whole-game or other
hardware performance. Raw report:
`references/performance/2026-09-10-tower-entry.json`.

The GPU visibility check keeps normal roof/lattice occlusion instead of drawing
the occupant on top of the structure. Four camera-bearing screenshots supplement
the native socket and imported-pose checks. Fallow reports maintainability 85.7,
average cyclomatic complexity 2.8, p90 5 and twelve existing module cycles.
Formatting passes; repository-wide ox-standard continues to report existing
lint debt. Native-comparison scripts retain low-level field detail, while live
TypeScript shares named socket, pose and support-height helpers. Broader scheduler,
module-cycle cleanup, high-DPI and heavy-effects profiling remain unfinished.


## Construction controls and shared panel rendering (2026-09-10)

Building-panel DOM handling now lives in `app/building-panels.ts` rather than the
large scene controller. Training and construction share canvas painting, native
frame/control drawing, normal DOM buttons and task/selection helpers. The panel
rebuilds its bitmap only when meaningful state changes; a stationary live canvas
performed zero drawImage calls across 30 RAF frames. Buttons follow native icon
positions and the existing uniform HUD scale. Panels rebuild their button count
only when model capacity changes, avoiding stale controls after a hut upgrade.
Focused/hovered controls survive cancellation; input locks and overview still hide
them. No new texture per panel, render loop, framework or frame-rate cap is added.

The original unlinked two-row plan reports a canvas 28 logical pixels too short.
The native oracle records the defect; the browser preserves every draw submission
and allocates the full height. This is a deliberate modern clipping correction,
not invented artwork or additional native completion credit. Geometry checks keep
the full canvas, hit regions and tail aligned at five desktop sizes through
3440×1440 and 3840×2160. Other hardware/high-DPI coverage remains open.

An isolated headed Chrome 153 / ANGLE Metal / Apple M5 sample, 1440×1000 CSS pixels,
DPR 1, captured 2,422 frames of the four-builder restart/removal scenario. CPU
p50 was **2.5 ms**, p95 **3.6 ms**; RAF gaps p50 **3.6 ms**, p95 **3.9 ms**, maximum
**14.6 ms**; at most **93** WebGL submissions. No heavy tools or application edits
overlapped the sample. Callback cadence is not proof of physical display refresh;
this differs from preceding tower/eight-worker workloads and is not a paired
speedup or whole-game performance claim. Raw report:
`references/performance/2026-09-10-construction-panels.json`.

Fallow reports maintainability 85.6, average cyclomatic complexity 2.8, p90 5 and
twelve existing module cycles. Original comparisons and portable captures remain
separate from readable live TypeScript. Repository-wide lint debt and the broader
module/scheduler modernization audit remain open.


## Guard-tower controls on the shared panel renderer (2026-09-10)

The tower reuses the training panel's native one-row drawing and existing HUD
atlas, parameterized for its original single occupant. DOM controls, selection,
focus, dismantling and canvas painting remain shared. The stationary live tower
canvas makes zero drawImage calls over 30 RAF frames; phase changes depend on
simulation turns. No additional RAF, texture or frame-rate cap is introduced.
Control hit regions and the anchored tail pass at five sizes from 1440×1000 to
ultrawide/4K using the existing uniform HUD transform.

The isolated headed Chrome 153 / ANGLE Metal / Apple M5 sample at 1440×1000 CSS
pixels, DPR 1 captured 1,061 close-view entry frames: CPU p50 **1.6 ms**, p95
**2.1 ms**; RAF gaps p50 **3.6 ms**, p95 **3.9 ms**, maximum **7.5 ms**; maximum
**83** WebGL submissions. No heavy checks or application edits overlapped profiling.
This is an entry/close-view sample rather than proof of whole-game performance or
physical display refresh. It does not establish a paired speedup. Raw report:
`references/performance/2026-09-10-tower-panels.json`.

Fallow reports maintainability 85.7, average cyclomatic complexity 2.7, p90 5 and
twelve existing module cycles. The touched panel modules have no oxlint errors;
repository-wide debt and broader native scheduling/modernization remain open.
Shared state initialization now calls the already compared resting-slot consumer
when a tower occupant is reassigned, preserving the original mechanic without a
new update loop or speculative formation subsystem.

## Fight-site search without redundant height sampling (2026-09-10)

The original interpolates every candidate height before validity testing, then
interpolates the accepted point again. Validity reads only XY and collision data.
`app/melee-placement.ts` shares the native collision/search helpers and samples
height only for actual moves. The original executable produces identical final
coordinates, height and search-pool bytes in 2,048 cases: 814 browser height
queries versus 33,817 original queries. Allocation/search failure retains the
fight and releases any allocated search record.

`node scripts/bench-melee-placement.mjs` compares the original sampling order with
the production implementation, reusing the same terrain and validity helpers.
It asserts identical output and alternates eleven warmed samples on Node 24.18.0,
Apple M5. For 3,072 restricted-terrain queries per sample, median CPU is **2.247 ms
before, 1.923 ms after** (14.4% lower); height reads are **38,064 versus 3,048**.
This is a bounded CPU search improvement, not a claim about game/display FPS.

Live relocation builds an occupancy set only when the turn gate or building
escape requires a visit. Rendering stays uncapped on its existing RAF; all
placement is simulation-turn work. A separate isolated headed combat acceptance
sample records 1,678 callbacks: CPU p50/p95 **1.4/2.0 ms**, callback gaps
**3.6/4.3 ms**, maximum **7.2 ms**, at most **104** WebGL draws. Chrome 153/ANGLE
Metal Apple M5, 1440×1000 CSS pixels, DPR 1. This is not a paired whole-game or
physical-refresh benchmark. Raw search and browser data:
`references/performance/2026-09-10-melee-placement.json`.

Native allocation/counter phase, approach movement and whole-game scheduler
ownership remain separate work. The original placement algorithm is isolated
from the live adapter with named fields; no decompiler-shaped state machine,
new dependency, render loop or generalized cache is introduced.

Validation: 204 portable tests, typecheck/build/format checks, native timing and
placement oracles, combat browser checks and sprite/shadow/selection regressions.
The new placement module has no oxlint findings. Fallow reports maintainability
85.6, average cyclomatic complexity 2.7, p90 5 and twelve existing module cycles;
repository-wide lint/complexity debt and broader modernization remain open.

## Shared native combat motion with on-demand state context (2026-09-10)

Melee approach now uses the same person preparation, terrain/collision physics,
cell lists and sprite animation helpers as existing impulse movement. The original
speed RNG and ready-slot timing stay on simulation turns. Native motion records
survive recoil and supply height to the existing smooth render interpolation;
there is no new RAF or FPS-dependent movement. Portable replay passes at 5–240 Hz
and irregular cadence; nine actual Scene cadences and distinct 240 Hz pixels pass.

The common physics adapter previously built a celebration/order context on every
visit, including a complete cell-list reconciliation. Ordinary grounded combat
needs none of those consumers. Context is now created only for actual state
initialization/panic; direct destinations use the existing route helper directly.
`node scripts/bench-melee-motion.mjs` compares eager reconciliation with the
production path for 64 retained combat people × 24 visits. It asserts identical
whole worlds, excludes fixture cloning and alternates nine warmed samples.
On Node 24.18.0/Apple M5, median CPU drops **8.211 → 4.859 ms (40.8%)**. This
isolates removed reconciliation overhead; it is not a previous-release, whole-game
or display-frame-rate claim.

The isolated headed six-fight acceptance sample records **1,679** callbacks:
CPU p50/p95 **1.5/2.0 ms**, p99 **4.6 ms**, max **6.7 ms**; callback gaps
**3.6/4.1 ms**, max **4.5 ms**, at most **104** WebGL submissions. Chrome 153,
ANGLE Metal Apple M5, 1440×1000 CSS pixels, DPR 1. No heavy checks/edits overlapped
profiling. Both reports are in
`references/performance/2026-09-10-melee-approach.json`.

Validation: 4,096 native approach blocks, 1,536 composed native/live motion turns,
existing timing/physics oracles, 207 portable tests, build/typecheck/format and
browser combat/sprite/shadow/selection/interpolation checks. Fallow remains 85.6
maintainability, average cyclomatic 2.7, p90 5 and twelve existing cycles. The melee
and unit-motion modules have no oxlint findings; broader repository debt remains.
Full allocator/state/command ownership and large-army/multiple-hardware profiling
are still open.

## 2026-09-10 — engagement rules and recurring crowd scans

Native scan bounds use modular whole-cell geometry rather than a rendered-frame
clock or team-specific radius. The browser checks area membership with constant-time
wrapped bounds; 4,096 full original person-only scans agree. A reproducible paired
predicate benchmark (`scripts/bench-melee-engagement.mjs`) compares 32,768 queries
against enumerating the same square cells. Nine alternating warmed samples on
Apple M5/Node 24.18.0: median **0.881 → 0.353 ms**, identical answers. This isolates
membership math; native cell-list traversal and whole target-query performance are
not represented, so it is not an original-engine or previous-release speedup.

Headed Chrome 153/ANGLE Metal Apple M5, 1440×1000 DPR 1, no concurrent heavy work:

- Six staged active fights: 1,676 callbacks, CPU p50/p95 **1.5/2.1 ms**, p99
  **4.8 ms**, maximum **6.7 ms**; maximum 104 draws.
- 96 separated idle warriors, six seconds of recurring no-match scans after
  landscape synchronization/sprite creation: 1,676 callbacks, CPU p50/p95
  **2.5/3.0 ms**, p99 **5.5 ms**, maximum **7.0 ms**. Eighteen scan-bearing frames:
  p50/p95 **5.3/5.7 ms**, maximum **5.8 ms**; maximum 378 draws.
- The earlier unwarmed synthetic terrain replacement had a **76.5 ms** outlier.
  Its cause was not traced; retain that run separately rather than presenting the
  warmed sample as a loading-performance result. First-use/rebuild cost remains an
  audit item. Profiling fixtures must preserve the live turn clock: resetting it
  while effects remain creates invalid negative effect ages.

Full evidence: `performance/2026-09-10-melee-engagement.json`. Browser callback
cadence is not physical display FPS. No whole-game smoothness claim. The remaining
array target search is quadratic across a scan visit; move it to native area-order
cell ownership when that controller lands. The present profile supports this
bounded gameplay step, not unlimited populations. Sprite, selection and live
movement checks pass, including deterministic 5–240 Hz/irregular replay.


## 2026-09-10 — native target priorities with modern stable sorting

The recovered selector uses stable standard-library sorting instead of the
original repeated adjacent-swap passes. `scripts/bench-combat-targets.mjs` verifies
identical stable order for 2,048 lists of 64 candidates, including equal distances.
Nine alternating warmed samples on Apple M5 / Node v24.18.0: reconstructed
bubble-sort median **13.451 ms**, standard-library `toSorted`
**6.137 ms**. This isolates candidate ranking in JavaScript;
it does not benchmark the original executable, the full query or rendered FPS.
The 64-candidate cap, cell ties, distance bands, priority and RNG are unchanged.

Live queries run on simulation scan visits, not render frames. They allocate
candidate records only within the native area and read building records lazily.
Existing native cell-chain order is reused where available. The browser broadphase
still checks the follower array for each scanner, so population scaling remains
quadratic; native mixed-class cell ownership is the replacement path. This scoped
integration does not justify unlimited-army or whole-engine performance claims.
Reservations and their expiry advance by simulation turns. Target selection never
takes over sprite ownership and introduces no new animation or render clock.

Final headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, no simultaneous
builds or source changes:

- Six staged active fights: **1680 callbacks**, CPU p50/p95
  **1.5/2.1 ms**,
  p99 **4.6 ms**, max
  **6.2 ms**, 104 draws.
- 96 separated idle warriors, six seconds of recurring no-match scans after
  landscape synchronization/sprite creation: **1674 callbacks**,
  CPU p50/p95 **2.4/3.3 ms**, p99
  **5.3 ms**, max **7.1 ms**.
  18 scan-bearing frames: p50/p95
  **5.3/5.8 ms**, max
  **6.3 ms**, 378 draws.

These are unpaired warmed workload samples. Prior release figures are retained
above; only the isolated ranking benchmark establishes a speedup. Browser callback
cadence is not physical monitor FPS. Earlier first-use terrain-replacement spikes
remain an open loading/rebuild audit item. Full raw evidence and live squad choices
are in `performance/2026-09-10-combat-targets.json`.

Validation: 4,096 complete native calls, portable captured cases, **217 tests**,
5–240 Hz and irregular live replay, browser squad assignment/poses and existing
combat/recoil/approach, 392 GPU sprite poses, Blast shadows and selection pass.
Typecheck, production build, formatting and the two new modules' oxlint pass.
Fallow: maintainability 85.5, cyclomatic average 2.7/p90 5, twelve existing cycles;
no new runtime import cycle. Query code is extracted from movement/sprite handling,
and the existing building model, disguise and reaction helpers are reused.


## 2026-09-10 — automatic scan dispatch and coastal response preparation

Live scanning now consumes pending flags through the reviewed native dispatcher,
respects campaign suppression, and prepares the coastal alert center with the same
coast calculation as movement orders. It still runs on simulation visits and
retains the early no-scan exit. Coastal queries include one extra candidate ring
only when preparation actually shifts the center; each native collector still
uses its exact authored area/cap. No new animation timer, render loop, dependency
or sprite-state owner was added. Original shared command allocation is separately
reconstructed and native-tested; its full live queue integration remains open.

Headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, no concurrent builds,
heavy checks or application edits during measurement:

- 96 separated idle warriors, six seconds after terrain/sprite synchronization:
  1,675 callbacks, CPU p50/p95 **2.5/3.1 ms**, p99 **5.3 ms**, max **6.6 ms**;
  18 scan-bearing frames p50/p95 **5.4/5.5 ms**, max **5.7 ms**; 378 draws.
- Six staged active fights: 1,678 callbacks, CPU p50/p95 **1.5/2.1 ms**, p99
  **4.7 ms**, max **5.9 ms**; 104 draws.

Raw evidence: `performance/2026-09-10-combat-alerts.json`. These are unpaired,
warmed, bounded workload samples, not speedup, loading or whole-engine claims.
Callback cadence is not physical display FPS. Quadratic follower broadphase,
first-use rebuild costs and broader hardware/population coverage remain open.

Native checks cover full alert allocation/sharing and coastal preparation, every
scanner dispatch outcome, pending flags/consumer counts, and existing movement /
queue behavior after sharing coast math and correcting restoration consumer names.
Portable captures, live coastal target/suppression, original squad walking poses,
combat/recoil/approach, 392 GPU sprite poses, Blast shadows and selection pass.
Existing 5–240 Hz and irregular combat/squad replays remain deterministic.
Build/typecheck/format and changed scanner/controller modules' oxlint pass.
Fallow: maintainability 85.6, average cyclomatic 2.7/p90 5, twelve existing cycles.
No additional verified requirement credit: ordinary live command ownership and
completion/restoration still need their actual world consumers.


## 2026-09-10 — moving-target pursuit

A visible parity correction now refreshes a follower's route during pursuit,
using the original per-axis target movement threshold. The existing route is
retained below the threshold; the native route planner/reuse/release logic is
shared. There is no per-frame path search, extra animation owner, package or
render clock. Decisions remain on simulation turns and portable live outcomes
agree at 5/30/60/120/144/240 Hz. This is a gameplay correction, not a claimed
algorithmic speedup; no native implementation was deliberately replaced here.

Headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, with no concurrent
builds, heavy checks or app edits during measurement:

- Six seconds of 16 warriors pursuing 16 moving shamans after terrain/sprite
  synchronization: 1,678 callbacks, CPU p50/p95 **1.9/2.3 ms**, p99 **4.6 ms**,
  max **5.2 ms**; scan-bearing frames p50/p95 **4.5/4.6 ms**; 119 draw calls.
- Six staged active fights: 1,679 callbacks, CPU p50/p95 **1.5/2.1 ms**,
  p99 **4.4 ms**, max **6.2 ms**; 104 draw calls.

Raw evidence: `performance/2026-09-10-pursuit.json`. These unpaired, warmed,
bounded samples do not establish physical display FPS, loading performance,
whole-game smoothness or a speedup. Broader populations/hardware and full native
command lifecycle remain unfinished. The browser pursuit check retains original
walking sprites, and existing melee/approach/recoil regressions pass.

Validation: 224 tests, typecheck/build/format, sprite/shadow/selection checks and
26,624 native route regressions pass. Routing cleanup replaces nested limit
selection, chained assignments and a shadowed cache offset with explicit names
and branches. The touched route module has no ox-standard errors; its existing
local-function-scoping warning remains. Fallow reports maintainability 85.5,
average cyclomatic 2.7/p90 5 and twelve existing dependency cycles. This cleanup
does not claim a measured speedup or complete the wider code-health audit.

## 2026-09-10 — outdoor encounters and first-hit upload

Visible original encounter behavior now shares the native route, person-motion,
animation and RNG helpers. A separate readable phase controller avoids expanding
the frame loop; there is no new package, per-frame simulation or animation clock.
Named phases and shared assignment cleanup replace scattered adapter branching.
Person-state types and a chained facing assignment were simplified while touched.

The new 16-pair encounter-to-melee workload exposed a repeatable **83.6–89.2 ms**
frame on the first ordinary melee hit. CDP sampling attributed ~75 ms to
`texSubImage2D`; direct upload instrumentation identified the **2048×4608 effects
atlas**, with one 74 ms upload during the combat interval. Merely loading its PNG
had left GPU upload deferred because earlier shadow sprites were hidden.

The shared texture cache now exposes load completion; the scene initializes the
same effects texture on its renderer during scene loading. Three.js owns the
GPU resource, caches are reused, failed loads report errors, and disposed scenes
skip the callback. This moves an unavoidable upload earlier; it does not reduce
atlas pixels or claim to eliminate loading cost. No native mechanics or effects
pixels were changed. A browser regression rejects effects-atlas uploads during
the actual first-hit workload, rather than warming effects in the test itself.

Same headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, six seconds of
16 new encounters followed by melee, without concurrent builds/checks/app edits:

- Before, instrumented: 1,618 callbacks, CPU p50/p95 **3.0/4.2 ms**, p99 **6.6 ms**,
  max **83.6 ms**; effects upload **74 ms**. An earlier uninstrumented sample was
  **1.8/2.5 ms**, max **89.2 ms**; do not interpret median differences as a speedup.
- After, same upload instrumentation: 1,675 callbacks, CPU p50/p95 **1.8/2.6 ms**,
  p99 **4.8 ms**, max **11.6 ms**; **zero effects-atlas uploads** in combat.
  Encounter-bearing frames: 303, p50/p95 **1.4/2.6 ms**, max **5.3 ms**. 178 draws.
- Existing six-fight workload: p50/p95 **1.5/2.2 ms**, max **6.4 ms**; 104 draws.

Evidence: `performance/2026-09-10-melee-encounter.json` retains distributions,
worst frames, source/dimensions of uploads and observed encounter poses. These
sequential bounded samples establish the first-hit stall's source and its removal
from combat. They do not establish physical display FPS, statistically improved
steady-state throughput, loading performance or full-game smoothness.

Validation: 228 tests; 4,096 native encounter calls; expanded shared initializer
comparisons; 520 GPU sprite poses, live shadows/selection, ordinary melee and
target/pursuit regressions. Outcomes/animations agree at 5–240 Hz and irregular
schedules. Fallow reports maintainability 85.5, average cyclomatic 2.7/p90 5 and
12 existing dependency cycles. The encounter and person-state modules pass
ox-standard; pre-existing live-person warnings remain. Full lifecycle and broader
hardware/population coverage remain open.

## 2026-09-10 — live fight reinforcement and splitting

Reinforcements now reuse native target selection's slot decision, rather than
maintaining a contradictory admission shortcut. A small typed controller handles
replacement/splitting; native persistent slots are separate from center-first
presentation order. Running this only on admission avoids adding a render-frame
scan or another simulation clock. All movement/animation still uses the shared
fixed-turn and elapsed-presentation path. No dependency was added and no native
mechanical rule was dropped for performance.

Headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, six seconds, eight
initial fights growing to 48 people and sixteen fights through live commands:
**1,666 callbacks**, CPU p50/p95 **1.9/3.8 ms**, p99 **5.5 ms**, maximum **12 ms**;
217 maximum draw calls. Admission, replacement and split frames are included;
terrain and initial sprites were loaded first. No concurrent heavy checks, builds
or app edits. The evidence file `performance/2026-09-10-melee-groups.json` retains
staged member assignments, visible poses, distributions and worst frames.
This is an unpaired bounded sample, not a speedup claim or physical display FPS.
Larger populations and global allocator/counter ownership remain unverified.

5–240 Hz and irregular replays retain identical units, groups, RNG and sounds.
Native admission/splitting has 4,096 comparisons, with entry/allocation supplied;
the shared target detector/selector regression passes. New controller and shared
target helper have no ox-standard findings. Fallow: maintainability 85.5, average
cyclomatic 2.7/p90 5, twelve existing dependency cycles. Existing overhead health
bars remain visibly detached from sprites in the ground-view capture; this is a
separate rendering defect for native placement/gating review, not a completed
visual-parity claim.

## 2026-09-10 — native health gauges with less render work

The broad performance pass is complete; this is a visible-parity correction with
its performance checked. Native gauges are drawn on demand while Quote is held.
A single shared 150×26 atlas contains the 25 integer fill heights, generated from
actual native GPU submissions. One sprite quad replaces six original primitives;
nearest sampling, original alpha and native painter ordering remain intact.
The former horizontal box meshes and their special instancing implementation were
removed, including health-only shader branches and render-time hide/restore state.
The ordinary sprite/material/cache path suffices. No new dependency, clock or
render-frame simulation was introduced.

Same headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, 200 half-health
braves, stationary camera, Quote held, paused simulation. Three sequential 3-second
samples each, following loading, without concurrent builds/heavy checks/app edits:

| Implementation | CPU p50, three runs | CPU p95, three runs | Draw calls | Triangles |
| --- | --- | --- | --- | --- |
| Previous horizontal boxes, instanced | 4.1 / 4.1 / 4.0 ms | 4.5 / 4.7 / 4.6 ms | 444 | 14,866 |
| Native vertical atlas gauges | 3.3 / 3.2 / 3.2 ms | 3.6 / 3.6 / 3.6 ms | 642 | 10,466 |

Median callback cost improves about 20% in this bounded workload despite more draw
calls: removing hundreds of 3D box faces and their CPU painter preparation matters
more here than combining their GPU submissions. Transparent gauges retain the
ordinary object ordering. Without held health display, no gauges are submitted.
This is a CPU measurement, not GPU elapsed time, physical display FPS, whole-game
performance, or pixel equivalence with the incorrect previous geometry. Larger
populations, other GPUs and 4K performance remain unmeasured here; desktop/DPR
layout and native rendered pixels are independently checked.

Evidence: `performance/2026-09-10-unit-health.json`; reproduce current samples with
`node scripts/profile-unit-health.mjs`. The old `--compare-health-bars` experiment
belongs to its historical checkout (before removal, commit `718bf01`); current
`check-browser-health-bars.mjs` checks native pixels/input/lifetime instead.
234 tests, 2,048 native draw decisions, 150 atlas quads, 32 native key lookups,
3,900 browser gauge pixels and the 520-pose sprite/shadow/selection checks pass.

Fallow reports maintainability 85.5, average cyclomatic 2.7/p90 5 and twelve
existing dependency cycles. The new pure rule has no ox-standard findings; the
render path removes more production code than it adds.

## 2026-09-10 — fight cleanup and recovery without a new rendering path

Cleanup remains turn-driven. Pure six-slot rules live beside existing admission
and splitting; shared person initialization, animation and physics handle recovery.
A per-pass person map replaces repeated membership searches in cleanup. No new
framework, render-frame timer, recovery animation loop or task-snapshot layer.

The existing six-second headed Chrome 153 / ANGLE Metal Apple M5 workload creates
eight fights, admits reinforcements, replaces weaker people and splits into sixteen
fights. At 1440×1000 DPR 1, 1,674 measured callbacks: CPU p50 **1.6 ms**, p95 **3.3
ms**, p99 **5.0 ms**, max **9.4 ms**; at most 215 draw calls. No app edits, builds or
heavy checks ran during sampling. This unpaired integration sample is not a speedup,
GPU elapsed-time or physical display-FPS measurement; other hardware remains open.
`performance/2026-09-10-fight-cleanup.json` retains the staged workload and results.

A separate paused browser stage verifies last-opponent death, exactly one winning
tribe increment, recovered original idle sprites and walking after a new command.
The existing multi-class strike/recoil/approach browser check also passes; fixed
turn/RNG replay remains identical at 5–240 Hz and irregular frame intervals.
Fallow remains 85.5 maintainability, average cyclomatic 2.7/p90 5, twelve existing
cycles. The pure cleanup module has no ox-standard findings; broader legacy
adapter lint debt remains, and is not reported as a clean repository-wide lint.

## 2026-09-10 — remove unused work from native reinforcement positioning

The reconstructed `0051f750` waiting-position query retains native ring traversal,
collision, occupancy, fallback and RNG. The original calculates each candidate's
height before collision, but collision only reads XY and the query returns XY.
The modern implementation omits that unused calculation. The full native oracle
executes without replaced consumers and confirms equal results: **0 browser versus
16,401 native height queries** across 1,024 waiting scenarios, including occupied
rings, wrapped positions, terrain restrictions and complete failure.

This is a proven reduction in query work, not a measured hardware/frame-time gain.
The query and complete pursuit dependencies await integration into the live
command-19/21 controller. The current published game retains its existing adapter;
no new live performance or visual-parity claim is made for these staged ports.


## 2026-09-10 — share idle gestures while reconstructing attack orders

Fight/person approach and retry use existing pursuit/wait/animation primitives.
The ordinary outdoor encounter now shares `004d4da0` idle gestures with these
branches. No new renderer, animation clock, dependency or per-frame simulation.
The attack-order branches remain staged pending queue/world integration; performance
of those future live paths is not claimed here.

The shared live idle change passes the six-second, 16-new-encounter browser sample:
headed Chrome 153 / ANGLE Metal Apple M5, 1440×1000 DPR 1, 1,675 callbacks, CPU
p50/p95 **1.5/2.2 ms**, p99 **4.5 ms**, maximum **10.5 ms**, at most 175 draw calls.
301 callbacks contain opening encounters (p50/p95 **1.4/2.1 ms**), followed by live
melee. Original attack/recoil/recovery poses, sound, handoff and no first-hit atlas
upload pass. No builds, heavy checks or app edits ran during the sample.
`performance/2026-09-10-combat-approach.json` retains the workload and observations.
This is an unpaired CPU regression sample, not a speedup, physical display FPS,
GPU-time or whole-engine claim. Broader hardware and population coverage stay open.

242 tests pass. The new module has no ox-standard findings. Fallow reports 85.5
maintainability, average cyclomatic 2.7/p90 5 and twelve existing dependency cycles;
legacy adapter debt remains explicit. The full sprite/shadow/selection checks
protect the shared animation change.


## 2026-09-10 — attack search uses existing turn primitives

The staged attack-order front half reuses movement recovery, RNG, animation and
wait/retry helpers. March aggregation uses a bounded eight-entry array with one
search per native scan visit; it retains byte count wrapping and minimum distance.
No packed-memory emulation, duplicate queue, new dependency or presentation timer.
The required target/world callbacks correspond to existing native consumers.

8,192 native boundary comparisons and 283 portable captures pass; 243 repository
tests pass. The new module has no ox-standard findings. Fallow remains 85.5
maintainability, average cyclomatic 2.7/p90 5, twelve existing dependency cycles.
The new module is not on a live path yet, so no hardware/frame-time improvement or
regression measurement is claimed. Existing uncapped rendering and fixed-turn
mechanics remain unchanged; measure the composed controller when integrated.


## 2026-09-10 — skip repeated toroidal occupancy probes

The new attack approach query reuses existing collision, shape and search code.
Original area extents can span 256 coarse steps per axis on a 128×128-cell world,
revisiting the same occupancy flags. The modern implementation scans each axis at
most once. Occupancy is a pure read during this synchronous query; after one full
lap, further laps cannot reveal another cell. Original first-cell fallback,
collision order after this scan, indexed-ring order, pool bytes and outcomes remain
unchanged.

The complete native oracle observes original loop address `0051c1de`. Across 103
fully occupied area cases: **277,001 native versus 73,225 modern occupancy probes**
(about 74% fewer). All 1,024 query comparisons agree, including maximum extents,
wrap and exhausted searches. The portable check also limits occupied-area scanning
to one lap. Reproduce with `check-native-combat-approach-point.py --record` and the
supplied executable; see the reverse-engineering notes for the full command.

No rendering or live simulation path changed, so this is an operation-count proof,
not an FPS or hardware speedup claim. Measure the eventual composed controller
when integrated. 244 tests pass; ox-standard reports no findings in the changed
module. Fallow: maintainability 85.6, average cyclomatic 2.7/p90 5, twelve existing
cycles. No dependencies or separate animation clocks were added.


## 2026-09-10 — construction-plan attacks reuse existing engine primitives

Plan entrances use the imported shape table and shared resting-cell collision;
four-exit selection is bounded. Approach uses existing wrapped facing, speed RNG,
recovery and animation. Timed attack phases use the caller's simulation visits;
there is no render-frame timer, extra animation system or duplicated queue.
No dependencies or packed-memory emulation were added.

10,624 native calls and 364 portable captures validate these staged mechanics,
including 128 complete approach/attack sequences. All 245 repository tests pass.
The new pursuit/attack code has no ox-standard findings; `building-shapes.ts`
retains its pre-existing nested ternary warnings in `buildingModel`, outside the
new geometry. Fallow: maintainability 85.6, average cyclomatic 2.7/p90 5, twelve
existing cycles. No live rendering or controller path changed, so no new hardware
or FPS claim is made. Profile the composed controller once integrated.

## 2026-09-10 — building attacks retain the simulation clock

Completed-building attacks reuse original shape geometry, integer movement,
animation and existing damage primitives. Plan/building entry share a single
implementation. Timers advance on simulation visits; no rendered-frame counter,
new animation clock, queue or dependency was introduced. Named action phases and
focused helpers replace the decompiler's goto/temporary-variable structure.

16,305 native executions and 361 portable captures cover the new branches. The
10,624-call plan comparison passes after the shared-entry refactor. An invalid
fully occupied world now cancels model-19 positioning after a repeated coordinate
cycle instead of hanging; valid searches still match the original. This correction
has a runnable termination regression, not an invented hardware-speedup claim.

No live renderer/controller path changes in this stage. Profile the composed
controller on hardware after queue/world integration. ox-standard reports no new
findings. Fallow maintainability remains 85.6, average cyclomatic 2.8/p90 5, with
twelve existing cycles; its repository-wide threshold findings remain open.

## 2026-09-10 — streaming original music with an independent audio clock

The original MP2 music driver streams rather than retaining every decoded track.
The browser preserves that resource strategy using a native media element and
Web Audio gain, while retaining only the selected drum bank's short decoded clips.
The tested 48 kHz Chromium run retained **4,423,608 bytes of percussion PCM**, with
one timing-only silent descriptor. Long drones are absent from the AudioBuffer
cache. This counts application-owned percussion buffers; browser-internal streaming
buffers, total process memory and hardware FPS were not measured. No speedup versus
the original streaming driver is claimed.

A 50 ms scheduler submits percussion/ambient sources against AudioContext time;
render FPS neither schedules beats nor changes their speed. Pure scheduling checks
compare equal timestamps across 30/60/120/144/240 Hz and irregular calls. A delayed
callback skips stale starts. Ambient random decisions run at a fixed 24 Hz instead
of inheriting unlocked render FPS. The 81-cell environment adapter refreshes at
4 Hz only while audio is enabled; exact renderer-derived counts remain parity work.
Pause/mute stop scheduling, and disposal clears source/buffer/media ownership.

Browser evidence covers real UI activation, all five music streams and 29 PCM drum
clips, output signal, camera-dependent ambience, pause/resume, gain, settings layout,
muting, restart and release. See the retained background-audio report and native
comparison notes. ox-standard is clean in the new audio modules; existing page
warnings remain outside this change. Fallow maintainability is 85.6, average
cyclomatic 2.8/p90 5, with twelve existing cycles.


## 2026-09-10 — update playing ambience without replacing sources

Ordinary environmental layers now change existing GainNode parameters on the
50 ms audio scheduler, rather than holding stale volume until sample completion.
One live handle per cue replaces estimated sample end timestamps. The native
active-cue gate forbids overlapping copies of a layer; completion releases its
handle. Silent out-of-view layers finish naturally, and reset/mute clear handles
immediately with identity-checked asynchronous cleanup. The existing 64-voice cap
still applies; full native voice priority remains unfinished.

This changes at most five gain parameters per scheduler visit, independent of
render FPS, and allocates no new AudioNodes to change a playing layer's volume.
The browser regression checks object identity across lowland/water transitions
and exact expected gains, including the original globe-layer exception. Native
volume arithmetic passes 4,096 additional comparisons. No hardware frame-time or
speedup claim is made; exact renderer counts and native cadence ownership remain
open. Environmental samples now restart after completion at the next 50 ms visit,
while percussion continues to use its existing audio-clock lookahead scheduler.


## 2026-09-10 — renderer-derived terrain ambience at bounded cadence

Replaced the 81-cell camera-neighborhood approximation with the original submitted
terrain-triangle/depth-midpoint rules. The painter reuses its existing accepted
faces, buckets and toroidal instance membership. A reusable 43,020-byte histogram
collects only when the enabled audio input timer requests a snapshot (4 Hz); other
frames skip classification. The next rendered frame fills the same snapshot held
by audio. There is no second terrain projection, sorting pass, per-triangle
allocation, retained frame list or dependency. Tree/activity ownership remains
partial.

The paired headless Chromium CPU comparison uses the pre-change painter at
`c30d8827d48e7bb0548d4082540b44c656752492`, unchanged scenes and alternating run order,
with eight warmups and 40 retained samples per mode. At 1440×1000, median painter
time was 1.4 ms before, 1.3 ms without a requested sample and 1.3 ms while collecting;
all p95 values were 1.5 ms. At 3440×1000, medians were 2.6/2.7/2.8 ms and p95
2.9/2.9/3.0 ms respectively. The sampled ultrawide difference is about 0.2 ms on
four frames per second; timer granularity/noise limits smaller comparisons. These
are isolated painter CPU measurements, not a claimed speedup or hardware FPS.

Twelve actual views (six at each width) preserve every captured pixel and painter
depth relative to the previous code. Independently reconstructed submitted lists
replay through native ground drawing with matching audio counters. The separate
256-list/8,070-triangle native regression covers clipping-input boundary ties,
empty lists, raised bias, signed terrain heights and category high bits. GPU
consumers and texture-cache data are supplied; exact original full-scene membership
and special rendering modes are not certified. Existing browser audio output,
pause/mute/restart, original track/drum decoding and resource checks also pass.


## 2026-09-10 — music activity follows simulation visits

Removed the audio input timer's scan of unit fight/action labels. A single scalar
is now cleared on the fixed object turn and updated by existing encounter, fight
and attack visits. Audio reads the result; rendering rate cannot advance it, and
pause retains it. The actual percussion scheduler still uses AudioContext time.
The existing tribe mapping is shared with live combat rather than duplicated.
No audio node, timer, queue, dependency or second simulation pass was introduced.

Native encounter/fight comparisons and live low/high/irregular-frame-rate tests
include the music state. Browser evidence confirms a pre-strike encounter reaches
battle music and a quiet turn clears it. No CPU/hardware speedup is claimed for
removing this small scan. Ordinary attack intent still uses the existing live
target adapter until shared command integration, while native tree eligibility,
full voice ownership and frontend music remain open.


## 2026-09-10 — Blast movement shares the follower presentation clock

Attached Blast artwork now interpolates retained endpoints using the same elapsed
turn fraction as followers. The existing observer captures only five sprites per
projectile at 12 Hz; a WeakMap releases histories with their effect objects.
Rendering writes the existing Three.js position in place. It adds no timer,
prediction, GPU submission, texture, dependency or simulation/RNG change. This
modern presentation adapter fixes a visible timing mismatch; it does not replace
the original enemy-first/allied-last wave mechanics. Arrival also retains the
native head instead of removing it one visit early.

The paired CPU microbenchmark uses 40 projectiles (200 attached sprites) and 800
other effects, 240 presentation steps per batch and alternating direct/interpolated
order over 12 batches (two warmups omitted). Headless Chromium 153.0.8010.12 at
1440×1000 measured median 0.0033 ms/frame direct versus 0.0092 ms/frame interpolated:
about 0.006 ms additional CPU for the smoothing. Histories and output objects are
reused. This is not a speedup, complete frame measurement or hardware-FPS claim.
The report and runnable browser check retain the conditions. Real input, arrival
pixels, smooth positions, pause and exact first-launch visits pass; portable tests
retain identical simulation outcomes and display samples from 5 through 240 Hz and
irregular cadences. Full native outer scheduling and other effect-motion classes
remain unfinished.


## 2026-09-10 — live building combat and retained orders

Building combat reuses fixed-turn movement, the native route pool, object cells,
shared sprite atlases, existing model tilt/roll and the same person/order records
through defender combat. No render-driven damage/timer or new animation clock is
introduced. Original poses and authored cadence remain unchanged; existing
interpolation presents movement at uncapped refresh rates. Complete native timing
and mixed-class ownership are still separate unfinished requirements.

Use the existing `registerLivePerson` identity check for each attacker instead of
rebuilding the whole person-cell index on every attacker visit. The paired browser
microbenchmark holds one 200-person world, 40 attackers, 12 alternating batches,
ten turns per batch and two warmups. Full-world synchronization per attacker costs
0.44 ms/turn median; direct retained registration is below the timer's measurable
resolution in this sample. Both leave identical cell heads and person records.
This compares implementation alternatives, not shipped old/new gameplay or a
hardware-FPS speedup; zero measured time does not mean zero cost.

The 1440×1000 headless Chromium 153.0.8010.12 occupied-building sequence measured
4.5 ms median / 7.6 ms p95 for a simulated turn plus presentation, with at most 29
draw calls. It includes actual mouse input, original strike pixels and a 4,901-pixel
shake difference, defender ejection, fight, resumed building order, pause and
cancellation. Headless figures are not representative hardware performance claims.
Conditions and the runnable check are retained in
`performance/2026-09-10-building-combat.json`. Cross-cadence tests produce identical
worlds at 5/30/60/120/144/240 Hz and irregular schedules. Broader hardware and dense
whole-scene profiling remains part of the continuing modernization work.
