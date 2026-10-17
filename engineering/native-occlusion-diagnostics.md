# Optional native occlusion diagnostics

F8 frame exports keep outer schema version 1. New recordings may include `pointerBreakdown.nativeOcclusion`, a versioned extension (`version: 1`). Old recordings omit it; absence means unavailable, not measured zero. The offline analyzer accepts both and copies only validated known fields into worst-frame/context evidence.

All counters are per callback. Timers are milliseconds. The entire extension is nested inside `objectOcclusionMs`, itself inside object/pointer CPU. Do not add these values to their enclosing timers.

- `submissionKeyMs`: validating/building the terrain submission key, including the existing submitted-cell comparison.
- `pixelCacheHits`, `pixelCacheMisses`: ScenePicking's geometric terrain-candidate pixel cache, not the same-frame whole-object pick cache.
- `projectionMs`: per-instance projection preparation, cached-vertex lookup/fill and cache publication. Includes array preparation and loop overhead, not solely mathematical projection.
- `triangleScanMs`: per-instance triangle scan, pixel-edge tests and candidate creation. Counts elapsed synchronous work, not isolated allocation or GC time.
- `cacheHits`: retained per-instance projection-cache entries. A hit can still project previously unsubmitted original vertex IDs.
- `cacheCold`, `cachePositionChanged`, `cacheKeyChanged`: mutually exclusive rebuild reasons per instance. Missing prior entry, changed position-attribute identity, or otherwise a changed existing key. `cacheKeyChanged` intentionally does not guess whether camera, transform or position version changed. If identity and key both change, identity takes precedence.
- `projectedVertices`: actual calls to the screen-projection function, including retained-cache fills.
- `submittedTriangles`: triangles visited by the scan, before rejection; not successful hits.

An enabled frame without this native route (including overview, no object hit, empty roots or same-frame object-cache hit) has zero native counters/timers. Pixel-cache hits do not enter RenderView, so they have no per-instance projection or triangle work. Uninstrumented/old frames omit the extension. Invalid geometry still propagates the existing error behavior; diagnostics do not repair or suppress errors.

Storage is created once per GameScene and reset in place while F8 diagnostics are enabled. Export snapshots use fixed ring slots. Disabled picking takes no new clock readings; no per-vertex clock reads, extra projection calls, scene traversals or serialization are introduced. Diagnostic timers and counters have observer overhead, so this is attribution evidence, not a benchmark improvement or a GC/GPU diagnosis. Export/analyzer retain the existing 1200-frame and 2 MiB limits.
