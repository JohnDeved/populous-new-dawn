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
