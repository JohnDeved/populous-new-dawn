# Painter centers reuse: allocation reduced, timing benefit not demonstrated

Experimental scratch patch against main 0b94142bd83fc4b6c961d44e8c7338cf452139dd. Only app/painter.ts changes in the runtime import closure. This is separate from the water-point optimization in draft PR483; neither is combined with the other.

## Change and correctness

The existing triangle-center accumulation and Float64 writes are unchanged. On a source version miss, the candidate reuses the previous BufferAttribute/backing array only when its length matches the current source count. Different source attributes retain separate WeakMap entries; count changes allocate again. Source edits/count changes still require a version update, as before. The returned centers now have an explicit mutable-cache contract rather than an implicit previous-version snapshot identity.

Focused existing/new tests passed 18/18 serially: ordered precision, plain/interleaved version invalidation, source replacement, growth/shrink, shared interleaved backing isolation, painter ordering, anchor projection and unscaled origins. A separate correctness-only fixture run matched all seven archived baseline output checks and all three final case outputs before performance timing. Full world/input/source invariants and depth/range/sentinel checks passed. The subsequent timing pair matched the same outputs; all loaded fingerprints remained stable.

An untimed candidate census observed 128 changed-water calls after warmup with zero center-buffer replacements and zero new center payload bytes. The separately observed baseline census replaced 786,432 bytes each call, 100,663,296 bytes (96 MiB) cumulatively. This is avoided typed-array replacement payload, not resident memory saved, total allocation avoided, garbage collection volume or CPU time saved. Other per-refresh objects remain.

## One matched process pair

Baseline first, candidate second, each fresh process with the identical warmed terrain-only fixture, 32 warmups and 128 samples per static/water/camera case, 120-second cap. Both exited 0, stderr empty; no reruns or discarded samples. Times in milliseconds:

| Case | Baseline median / p95 / p99 / max | Candidate median / p95 / p99 / max |
|---|---|---|
| Static | 5.2273 / 6.8275 / 7.8415 / 14.7333 | 8.9711 / 15.8897 / 23.4353 / 24.3008 |
| Water-invalidated | 7.5532 / 14.5967 / 17.5269 / 22.0797 | 9.0226 / 21.1503 / 28.1594 / 28.4764 |
| Moving camera | 8.1906 / 16.3205 / 79.4642 / 175.5578 | 6.0645 / 10.6070 / 11.8074 / 12.6954 |

The target water-invalidated case got worse: median +19.45%, p95 +44.90%, total timed duration +28.70%. Static also worsened; camera improved against a baseline with a very large outlier. This mixed one-pair result does not establish reliable performance benefit or causally attribute the regression to reuse. Host contention, scheduling/JIT effects and order drift were not controlled by this single AB pair. No FPS, browser, engine-wide or smoothness claim is warranted. Retain as an experiment; do not integrate based on these timings or continue rerunning to seek a favorable result.

## Scope and artifacts

Actual production Painter.update plus afterRender is measured. Production water/view/visibility preparation, setup, validation and hashing are outside timing. Real visibility and warmed retained texture capacity match the preceding baseline fixture; camera inherits wave phase 159. Models, sprites, alpha execution, browser/GPU/upload/rendering are absent. The output hashes are current-engine regression receipts, not an independent native visual oracle.

candidate.patch, candidate source/test files, manifests, paired-benchmark.mjs, focused-tests.tap, correctness-only output, both raw timed outputs and comparison.json preserve the experiment. No shared checkout edits, dependency installs or blanket typecheck reruns were performed. Any production proposal would still need broader validation and required hosted gates.

Independent review verified all 18 tests, all archived output records, current runtime fingerprints and every raw timing statistic. The unchanged static path regressed while camera moved in the opposite direction, making this one pair confounded rather than proof that reuse caused the target regression. Timed pair census fields are zero because census probes were disabled; allocation evidence comes exclusively from the earlier separate baseline census and candidate correctness-only census. manifest.json retains historical preparation status; execution-receipt.json records completed execution.
