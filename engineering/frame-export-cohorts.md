# Offline frame-export cohorts

Run `node scripts/summarize-frame-cohorts.mjs /path/to/local-export.json` to emit JSON to stdout. Input is a regular local file, bounded to the unchanged 2 MiB limit, and validated by the existing frame-export parser. No network, new dependencies, frame-loop imports, or user recordings are involved.

The versioned output labels overlapping cohorts explicitly: all frames, world pointer moving, world pointer stationary, world pointer unknown, camera/view changed, camera/view unknown, HUD, outside, and unknown. Unknown means missing context, unknown route, or either nullable change field is null. A known world stationary frame with unknown camera history belongs to both stationary and unknown. Camera change is the existing `viewChanged` field, which includes view/viewport inputs, not a newly inferred camera signal. Recorded context is used as-is even at the retained ring boundary; no prior sample is reconstructed.

Every known numeric metric has its own measured sample count and nearest-rank p50/p95/p99/max. Missing optional detail is omitted from that metric's population, not replaced by zero. Zero-sample cohorts/metrics have null quantiles. Empty captures remain invalid under the existing parser. Frame and nested pointer/terrain/visibility/native timings and counters are reported independently, never added together. Unknown input extras are not copied into output.

Groups are not mutually exclusive. Their counts must not be summed, and timing phases may overlap. Different cohort distributions or unmatched captures cannot establish causal speedup. RAF is cadence, not presented FPS; CPU timing is not GPU timing. Water masks are intentionally unsupported until their schema and exact bits are frozen; do not guess them from optional input fields.

This branch composes the frozen visibility counter source onto main `4569807fbd3a38e3c11e0f49f4d67d3bf5680b94`; the offline addition does not modify the parser or frame schema. Existing test resource entries are untouched; new/unreviewed tests use the repository's conservative serial fallback.
