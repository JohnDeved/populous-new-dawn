# Native terrain corner sharing: research comparison only

This branch is an inspectable experiment for issue #24, not an accepted performance fix. Do not merge it into main or treat a deployment preview as performance approval.

## Source

The source and correctness tests from reviewed experiment `7182adc13c1ce59a2c38549ed7d5eae52d15a27f` are composed onto main `b7e93daf82682ac2da34eaa30cc94749416f093f`. RenderView SHA-256 remains `56ec9b7c68b6d75c1d8929c1bd6c40b9d1426a2e406d24768966d820ce64d39b`.

The six-line production change allows the existing strictly equal grid-corner projection sharing only during a fresh native terrain cache rebuild. Native caches still use original vertex indices. Packed slots remain default-edge only. Warm native queries allocate no corner map. Cache keys, invalidation, painter resolution and native pixel-edge math are unchanged. The rejected array-capacity experiment is not included.

## Performance acceptance remains unresolved

The original fixed six-pair experiment FAILED its warm-tail gate: median per-process warm p95 increased from 1.582906 to 1.729889 ms (+9.29%, limit 3%). Moving-pointer/water and camera/water workloads improved median paired query sums by 12.85% and 30.68%, respectively, but these gains do not override the failed gate. The original failure remains a failure. There is no accepted speedup or user-hardware/FPS claim.

Subsequent identical-code controls did not demonstrate that the local harness could reliably resolve a 3% warm-tail difference. That limits attribution of the observed tail differences; it does not retroactively pass this candidate, change its thresholds, or authorize a favorable rerun. Further performance acceptance needs a prospectively designed, reliable measurement protocol.

## Correctness and remaining gates

Focused differential/lifecycle tests and typechecking are rerun for this composition. The differential oracle is the immutable original PR546 RenderView, with shared dependencies from the composed checkout. Tests cover exact ordered candidates and winners, water/camera/seams, original IDs, strict signed-zero/height equality, warm reuse, newly submitted indices, invalidation and retained results.

Full aggregate/build/browser admission has not been completed for this research composition. Its production resource fingerprint has not been refreshed or claimed valid for admission. No raw user recording, device metadata or raw diagnostic logs are committed.

Issue: https://github.com/JohnDeved/populous-new-dawn/issues/24
