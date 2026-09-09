# Modernization audit

Status: in progress. Highest priority before new parity features, per the user's
2026-09-09 instructions. Preserve mechanics, intended timing, input response and
experienced-player expectations while improving performance and presentation.

## Review coverage

| Area | State | Evidence / next check |
| --- | --- | --- |
| Frame loop and clock ownership | Core fix verified | Removed the 100 ms time cap, interleaved simulation and animation, reset clocks on blur/visibility changes. Node and actual Scene checks cover 5–240 Hz. Camera/flyby/result ordering and audio scheduling still need review. |
| High-refresh motion and camera/input | Pending | Measure visible movement and response at 30/60/120/144 Hz and irregular schedules; avoid adding a turn of input latency. |
| Terrain, water, lighting and visibility | Submission optimized | Indexed native row spans preserve pixels and picking while reducing CPU/GPU work. Water still recomputes shared vertex samples;  Profile first mission, changing terrain, shadows and heavy effects; test wide/high-DPI displays. |
| Models, sprites, painter and effects | Profiled | Painter traversal now skips unsubmitted terrain faces.  Measure submissions, batching, geometry updates, allocations and resource lifetime; retain native draw/sprite regressions. |
| HUD and minimap | Partially reviewed | Minimap native colors/transforms and modern dense rows verified. Original border uses fixed corners/tiled edges; stretched circle is still an adapter. Full HUD/display audit remains. |
| Simulation and gameplay systems | Clock regression added | Complete world-state comparisons cover movement, construction work, Blast, combat and native celebrations at three speeds and seven frame schedules. Long campaign playthroughs and larger combat/effect loads still require clock/performance coverage. |
| Audio and presentation timing | Read review; issues open | WebAudio owns sample duration and pitch; buffers are cached and ended nodes disconnect. Simulation sounds still drain once per render, so catch-up events can bunch. Sky movement also loses integer fractions per frame; high-refresh drift needs correction. |
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
flyby accumulator boundaries now tolerate floating-point rounding. Their visible
motion is still stepped at 24 Hz, and full camera/result/animation/audio chronology
remains open. This fix does **not** complete high-refresh smoothing or the audit.

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
