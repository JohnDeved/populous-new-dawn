# Shared geometry membership during resource release

Issue: [#144](https://github.com/JohnDeved/populous-new-dawn/issues/144).
Base: `f8c6915b62eac65f70070f9453aa51c40ba0ca9c`.

`scene-assets.geometry()` owns the shared geometry cache. Unit shields/auras,
boxes and native-model factories use it; native-model meshes clone its geometry.
`releaseGroup()` runs during unit/vehicle replacement, effect/building cleanup and
`GameScene.dispose()`. Its previous Mesh/Line ownership query spread every cached
geometry into a new Array for each visited object.

The cache now has a lazily built WeakSet of its current geometry values. Every
successful cache write invalidates that membership, including nested same-key
factory calls; cache hits preserve it. A throwing outer factory retains any
successful inner write and its invalidation. The WeakSet adds no strong geometry
owner or Scene/World/texture references. It is replaced after the next write and
ownership query; the existing strong cache and its lifetime are unchanged.

The membership receiver is evaluated before the first geometry-property read.
A cache write from that getter therefore affects later ownership queries; it
does not change the already captured query. The conditional second getter read
used for disposal remains unchanged. Traversal, geometry disposal multiplicity,
Sprite texture ownership and final material deduplication/order stay intact.

The focused tests use real geometry factories, Mesh/Line/Sprite resources,
native-model clones and maintained `GameScene.dispose()`. The lifecycle shell
observes DOM/GPU endpoints without constructing a browser renderer. Unchanged
unit/vehicle reconciliation tests cover the actual frame, replacement and load
callers. Controlled disposal/getter observers additionally exercise cache writes
between visited objects and same-key overwrite/throw behavior.

Two separately asserted diagnostics use real `releaseGroup()` at 64, 256 and
1,024 visited Mesh objects. Each records cold, warm and post-insertion rows before
any cost assertion. A delegated observer identifies only the real private cache
Map and counts its yielded values; another delegates `Array.prototype.includes`
and recognizes the exact ordered cache-values Array. Fixture construction and
reference capture occur outside the measured interval. Both roles must retain
the actual cache size `C`, including entries from earlier tests; they use the
same keys and insertion order.

The final paired invocation ran the same eight new cases plus five unchanged
unit and five unchanged vehicle cases. Candidate **18/18 PASSED**; pristine
production **16/18 PASSED**, with only the two intended cost assertions **FAILED**.
Both roles retained all nine rows per diagnostic with matching cache sizes.

| Mesh visits `M` | Cache `C`, cold / after insertion | Candidate reads, cold / warm / insertion | Base reads, cold / warm / insertion |
| --------------- | --------------------------------- | ---------------------------------------- | ----------------------------------- |
| 64              | 76 / 77                           | 76 / 0 / 77                              | 4,864 / 4,864 / 4,928               |
| 256             | 78 / 79                           | 78 / 0 / 79                              | 19,968 / 19,968 / 20,224            |
| 1,024           | 80 / 81                           | 80 / 0 / 81                              | 81,920 / 81,920 / 82,944            |

The separate result-Array trial measured cache sizes 148–153: the candidate
produced zero recognized cache-values Arrays in every row; the base produced `M`
in every row. These are controlled real-caller diagnostics. They demonstrate one
`C` traversal per membership rebuild and warm reuse versus `M × C` traversal,
plus removal of this specific Array-result boundary. Prototype observers
delegate native operations and are restored in `finally`.

Scoped Oxfmt and both ESLint runs **PASSED**. Strict Oxlint remains **FAILED** in
both roles with the same four inherited findings (two errors, two warnings).
Its original production/input bindings stayed identical through the test-only
repair, so those strict receipts were carried explicitly. The separate complete
diagnostic/raw-input/body-restoration comparison **PASSED**; only numeric source
locations were normalized when comparing diagnostics.

Earlier attempts remain **FAILED** evidence: a clone fixture requested absent
model `6:1` (repaired to imported bank-6 model `13` without changing assertions),
then ESLint rejected the observer's `this` alias (repaired by capturing the same
native `Map.set` return). Both repaired roles were rerun with the same final test.
No production or quality configuration repair was needed.

Standard check/build: **NOT RUN** here, reserved for the coordinator on the exact
published source. No browser, native raster, hardware timing, cold startup,
backing-store reuse, GC or total-allocation claim is made. Texture-cache ownership
and the typed BufferGeometry factory contract are unchanged. #144 remains open
for its other rendering/performance work. Rich review artifacts remain local.
