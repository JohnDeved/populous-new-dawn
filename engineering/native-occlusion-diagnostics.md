# Optional native occlusion diagnostics

F8 frame exports keep outer schema version 1. New recordings may include `pointerBreakdown.nativeOcclusion`, a versioned extension (`version: 1`). Old recordings omit it; absence means unavailable, not measured zero. The offline analyzer accepts both and copies only validated known fields into worst-frame/context evidence.

All counters are per callback. Timers are milliseconds. The entire extension is nested inside `objectOcclusionMs`, itself inside object/pointer CPU. Do not add these values to their enclosing timers. The subphases do not exhaust `objectOcclusionMs`: projection timing begins after native cache-key construction; transforms, that key construction, cache lookup/clearing and live painter resolution can remain in the residual.

- `submissionKeyMs`: validating/building the terrain submission key, including the existing submitted-cell comparison.
- `pixelCacheHits`, `pixelCacheMisses`: ScenePicking's geometric terrain-candidate pixel cache, not the same-frame whole-object pick cache.
- `projectionMs`: per-instance projection preparation, cached-vertex lookup/fill and cache publication. Includes array preparation and loop overhead, not solely mathematical projection.
- `triangleScanMs`: per-instance triangle scan, pixel-edge tests and candidate creation. Counts elapsed synchronous work, not isolated allocation or GC time.
- `cacheHits`: retained per-instance projection-cache entries. A hit can still project previously unsubmitted original vertex IDs.
- `cacheCold`, `cachePositionChanged`, `cacheKeyChanged`: mutually exclusive rebuild reasons per instance. Missing prior entry, changed position-attribute identity, or otherwise a changed existing key. `cacheKeyChanged` intentionally does not guess whether camera, transform or position version changed. If identity and key both change, identity takes precedence. New F8 recordings additionally include optional `cacheRepresentationChanged`: a packed/sparse representation-only rebuild with unchanged position identity and key. It is the final mutually exclusive reason, after cold/identity/key checks. Historical version-1 recordings omit it, so their reasons remain non-exhaustive. Absence means unknown; do not infer zero from a missing field.
- `projectedVertices`: actual calls to the screen-projection function, including retained-cache fills.
- `submittedTriangles`: triangles visited by the scan, before rejection; not successful hits.

An enabled frame without this native route (including overview, no object hit, empty roots or same-frame object-cache hit) has zero native counters/timers. Pixel-cache hits do not enter RenderView, so they have no per-instance projection or triangle work. Uninstrumented/old frames omit the extension. Invalid geometry still propagates the existing error behavior; diagnostics do not repair or suppress errors.

Storage is created once per GameScene and reset in place while F8 diagnostics are enabled. Export snapshots use fixed ring slots. Disabled picking takes no new clock readings; no per-vertex clock reads, extra projection calls, scene traversals or serialization are introduced. Diagnostic timers and counters have observer overhead, so this is attribution evidence, not a benchmark improvement or a GC/GPU diagnosis. Export/analyzer retain the existing 1200-frame and 2 MiB limits.


## Actual ordinary instance paths

New F8 exports include optional
`pointerBreakdown.ordinaryTerrain.paths = { version: 1, numeric, packedVector, sparseVector }`.
These are counts of actual selected instance representations after culling, not
query counts, vertex counts, timings, or eligibility guesses. Packed vector includes
both scratch-backed and independently allocated storage; it does not distinguish
why numeric was unavailable. Overview, empty roots and culled instances do not
increment these counters. One query can visit multiple instances; callback totals
do not preserve individual query order.

The selection is observed once after the existing numeric decision. No eligibility
predicate, geometry getter, or runtime ownership check is repeated, and neither
vertex nor triangle loops gain operations. Native-edge queries never increment
ordinary path counts. The optional native representation miss counter observes
the existing final cache-miss branch, without changing cache selection.

F8 enables these fields through its existing pointer metrics sink. No additional
menu rows, controls, hover behavior or recording epochs change. Frame rings retain
1,200 entries using five additional Float64 slots per frame (48,000 bytes total).
Export preserves exact newest contiguous frames under the unchanged 2 MiB bound;
additional fields can reduce the retained export span, explicitly reported by the
existing retention metadata. Offline worst-frame and cohort reports validate and
retain the new values. Missing fields remain unknown and are excluded from numeric
cohort coverage, while measured zero remains zero.

The shipped serializer regression fixture quantifies the tradeoff:
- Representative small-count frames: historical 1,430,572 bytes and instrumented
  1,549,372 bytes; both retain all 1,200 frames (99 additional bytes per frame).
- Adversarial maximum-safe-integer counters: historical 2,096,572 bytes retains
  1,200 frames with only 580 bytes of remaining budget; instrumented full payload
  grows by 190,800 bytes and retains 1,100 frames at 2,097,092 bytes.
- A hypothetical compact ordinary tuple still retained only 1,129 maximum-detail
  frames. It cannot preserve that almost-full adversarial baseline's window.
  The descriptive extension keeps established nested metric names and parsing.

Tests separately preserve historical 1,200-frame maximum-detail coverage,
require 1,200 instrumented representative frames, bound per-frame addition to
160 bytes in the maximal fixture, and protect the instrumented maximal-detail
retention floor of 1,100 frames. The two capture windows must not be conflated.

These counters establish path selection, not a cause for a timing difference,
cost equivalence, GC behavior, or hardware frame performance. They cannot recover
missing path observations in old captures.

### Strict benchmark source admission

This instrumentation changes only the `query-inputs` protected slice of the
`owned-numeric-terrain-neutral-cursor-v1` profile:
- file: `app/render-view.ts`, from `  private collectPickCandidates(` to
  `          for (let vertex = 0; vertex < count; vertex++) {`;
- historical reviewed SHA-256:
  `766eeb9c4c381ce38f1e718e13f8ba9cf79ae912bd1b0031fae36dbcb10c2a0e`;
- instrumented SHA-256:
  `c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c`.

After independent review of this precise delta, the additive
`owned-numeric-terrain-neutral-cursor-pick-paths-v1` profile admits the instrumented
source with the same 17 slice boundaries. Only its query-inputs hash differs from
the historical neutral-cursor profile. All historical profiles and hashes remain
unchanged and selectable for their exact sources.

The unchanged `readerImportAdmission` continues to require an exact reviewed
query-inputs slice. Tests verify old and candidate profile selection, all 17
slice mutations, unknown counter variants, and eligibility/lifecycle changes.
No reader patterns, normalization, matching rules, or rejection assertions are
relaxed. The earlier three current-source admission failures were retained as
pre-profile evidence; the additive profile resolves that specific blocker only.

Source/build fingerprints still require new exact-head evidence. Admission is
not a performance-equivalence finding, and previous captures and acceptance
results remain tied to their original identities.
