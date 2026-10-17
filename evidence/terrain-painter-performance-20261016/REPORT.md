# Initial terrain-only production painter baseline

Source target: main 0b94142bd83fc4b6c961d44e8c7338cf452139dd. Reused immutable baseline wrapper originally captured for 673b89ad; every 335 tracked input was compared byte-for-byte to target Git blobs. All 339 loaded input fingerprints remained stable. One Node 24.19.0 process, exit 0, empty stderr; no source changes, optimization candidate or repeated runs.

## Measurements

1920×1080 projection, Mission 1 original terrain/waves, actual production Painter.update followed by afterRender, 32 warmups and 128 samples per case. Milliseconds:

| Case | Median | p95 | p99 | Maximum | Total 128 calls |
|---|---:|---:|---:|---:|---:|
| Static |5.216697|7.111837|8.636771|8.895144|701.481924|
| Water-invalidated |7.4670245|11.358264|15.146401|15.896306|1007.641119|
| Moving camera |5.7177235|9.284274|10.974891|11.295729|779.155231|

These are one-process descriptive CPU baselines, not FPS, full-frame timing, optimization gains or statistically stable comparisons. Case order was static, water, camera. Setup/imports, actual water updates, view/visibility/matrix preparation, validation and hashing were excluded. Geometry-version-driven painter cache refresh remains included. Imports took 5725.404 ms and terrain setup 46.505 ms outside measurement. No samples discarded.

## Faithful scope and observed work

Real RenderView exists before production rebuildTerrain establishes height bounds. Production terrain visibility sets submitted indices, draw range and active wrapped copies before each call. Real Three objects/material registration are used; renderer boundary only captures transparent-sort callback installation. No WebGL context, GPU upload, rendering, browser or native executable is involved.

Terrain-only fixture is opaque. Models, sprites, selections, alpha-sort execution and crowd effects are excluded; afterRender restoration checks therefore do not establish alpha behavior. The scene has 98,304 vertex slots and 16,641 unique shared corners. End-of-case accepted command counts were 2321, 2269, 2233; these are final-state counts, not per-sample averages. Final submitted index counts were 30,132, 30,132, 29,538, with 1, 1, 2 active instances respectively.

Retained typed caches observed: center 786,432 bytes; vertex source/seen/depth 884,736 bytes, excluding projected-array/object overhead. Texture capacity retains high-water allocation from earlier verification/camera states: static/water 1024×64 float entries despite one active instance, camera 1024×96. This is a warmed fixture with retained capacity, not cold construction or minimal-capacity memory. Process memory records are checkpoints, not allocation rates.

## Correctness and limits

Untimed repeat checks covered static, wave phases 0/23/255/256 and two camera headings. Full depth-texture dimensions/bytes, command slots including holes, ranges, submitted indices and instance matrices/count were hashed. Nonzero command count, exact painterDepth for sorted commands, unused sentinel values, texture version increments and material/group identity restoration passed. Structured world equality and geometry/wave/input hashes were unchanged by painter. These establish deterministic current-engine regression outputs, not independent native visual parity.

Object ID 7 is retained in output; a future fixture must preserve deterministic construction or explicitly account for tie-break identity without dropping semantics. Warm water cases exercised real position-version changes. Timed water phases are 32–159 after 32 warmups; this is not exhaustive 256-phase timed coverage. Viewport remains 1920×1080; no broad resolution claim. Host CPU entitlement/contention and timing perturbation are unknown. Any future optimization requires identical source/input controls, correctness and representative additional scenes before wider claims.

## Files

benchmark.mjs, source-manifest.json, run-1.jsonl and run-1.stderr retain the runner, exact Git/source mappings and every timing/output hash. No further run is authorized by this report.

Independent review verified every raw summary, all 339 current fingerprints, empty stderr and correctness receipts. The shared fixture carries wave phase 159 from the water case into the camera case; static timing uses phase 0. No rerun was performed.
