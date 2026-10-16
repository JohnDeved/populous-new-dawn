# Avoid redundant cleared FPS graph resets

Base: c9e3cbc8003be7c9b3fc489d794297679476d2b9.

The graph remembers when reset has already cleared sampling state and SVG output. Repeated resets still update a changed state label but skip redundant clearing. Every update invalidates the guard, including warmup-only and unpublished samples, so the next reset still clears those states. The existing reset output, peak history, auto scale, 120 FPS guide and resume sampling semantics remain unchanged.

The two new tests exercise actual FpsGraph prototype methods with real FramePerformance and small text/SVG sinks. They do not replace globals or need a browser. They cover repeated no-write resets, changed visibility labels, warmup and unpublished sample invalidation, and exclusion of hidden time from resumed cadence. Existing frame-performance and 1020 ms spike/expiry tests ran alongside them.

Focused result: 13/13 passed, exit 0, no skips, empty stderr, 482.645821 ms TAP total. The embedded raw TAP includes Node's experimental TypeScript stripping warning. Source-bound input fingerprints were stable before and after. This is functional evidence, not a measured FPS or speed improvement.

preparation.json records the prior isolated scratch checkpoint; focused.json records the applied checkout run. The new test remains in the conservative serial lane. Only the production fingerprint was refreshed; no existing parallel classifications or gates were changed. Required hosted checks remain necessary before merge.
