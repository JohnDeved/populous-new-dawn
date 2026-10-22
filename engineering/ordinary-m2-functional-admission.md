# Ordinary M2 functional admission policy

Exact candidate: 1a6b838ff6f7f2455b7864dbfeb85f5e47d140ac. Tutorial run 39697920434, job 119559745361, synthetic e66c60108b7893d41c679b95989b2aa59cf3e629, base 0add10ecc911d08a38c780066908e233020fbe1b. GitHub artifact12390723940 has SHA-256 4e55287cf275b38d0df211dd7fe36c83a1d89266efaa53e24d0caf49965caebe. Raw member m2-pointer-f8.json has SHA-256 150ce2682bdf0fa4eb098040e299c8ef7ddd5f9b1cc41ecf25097c53cac29295. They are retained externally in the exact-head hosted evidence, not committed under engineering. This is a failed run, not completed M2 acceptance. Every four layout and both export assertions passed before the 45s timeout interrupted first F8-hide wait. Reset/resume/menu tail and subsequent projection/building companions were not reached.

## Raw phase breakdown
- start: cumulative 0.002 s; delta 0.002 s
- home-open: cumulative 0.582 s; delta 0.581 s
- idb-readback-matched: cumulative 1.097 s; delta 0.514 s
- public-load-ready: cumulative 1.645 s; delta 0.548 s
- load-boundary-matched: cumulative 1.847 s; delta 0.202 s
- scene-bound: cumulative 4.520 s; delta 2.672 s
- introduction-ready: cumulative 14.801 s; delta 10.281 s
- compact-admitted: cumulative 15.124 s; delta 0.323 s
- paused-baseline: cumulative 18.690 s; delta 3.567 s
- campaign-closed-for-camera-input: cumulative 20.576 s; delta 1.885 s
- initial-pointer-routes-matched: cumulative 23.410 s; delta 2.834 s
- camera-reached: cumulative 25.250 s; delta 1.840 s
- export-640-verified: cumulative 27.249 s; delta 1.999 s
- viewport-640x480-asserted: cumulative 28.053 s; delta 0.804 s
- viewport-640x480-captured: cumulative 28.302 s; delta 0.250 s
- viewport-900x360-asserted: cumulative 30.452 s; delta 2.150 s
- viewport-900x360-captured: cumulative 30.676 s; delta 0.223 s
- export-1280-verified: cumulative 35.972 s; delta 5.296 s
- viewport-1280x720-asserted: cumulative 36.206 s; delta 0.234 s
- viewport-1280x720-captured: cumulative 36.892 s; delta 0.687 s
- viewport-1440x1000-asserted: cumulative 43.954 s; delta 7.062 s
- viewport-1440x1000-captured: cumulative 44.877 s; delta 0.923 s
- deadline: cumulative 45.002 s; delta 0.125 s

The four screenshot call intervals sum 2.083s. The45s includes setup, real public input, native waiting, RPC transport, layout/scroll witnesses, public download exports, and screenshot capture. Neither this nor the previous 7e33 run measures a batching speedup. The baseline moved from 17.973s to 18.690s and the last captured viewport from 43.700s to 44.877s. Internal duration attribution within each named phase is unknown, not presumed actionability or main-thread time.

## Source provenance
- 7160549ccda47120629324e0b6c8b1e958f39d2a introduced 45000 on 2026-10-17 as a bounded functional pointer/F8 episode, explicitly excluding timing, hardware FPS, and responsiveness acceptance. Initially the timer began after bindGame; there were two viewport cases and no download exports.
- ea2e31e0a25c1e1c5291daa0ecc72456f501f096 immediately moved the same bound to before IDB admission/public Load. README explicitly names total-scenario resource admission, justified against the then 180s host and prior observed workload. It was not an application latency SLA.
- e3b2ceee894a5559db5ca94c502505579c0f7924 added two real frame-download exports, without changing 45s. Current coverage has four viewport cases.
- 60b0611a9caffeadfcd14ee3c3248909cb150d2a added exact retained native-popup close/reopen around per-viewport pointer/layout observations. 985f2cfe7 added popup-aware public input preparation; c759fac31 preserved the exact inner-closure identity. 0c9117f81 added complete real scroll evidence to ordinary M2 after ff9f1d6b4 established its strict oracle. These public interactions and glyph/metric reachability are required, not optional overhead.
- Existing Tutorial host is 240s (903fec2ae), isolated M2 host 180s, build 120s and job 900s. This policy does not change them or claim they admit the sum of all declared episode maxima. Actual aggregate remains authoritative.

## Avoidable work assessment
- Same-task owner/graph/export reads were already batched in 2b65; atomic layout/text/world settle was composed earlier. Both retained 45s runs still expire at the late tail. No measured benefit is claimed.
- Two 250ms key holds are intentional real camera input and are not removable sleeps.
- The two-rAF resize/popup settles and progress-conditioned wheel snapshots establish rendered-state freshness. Replacing them with unconditional reads would weaken evidence. Missing/hidden/stale/partial-scroll/world-change negatives stay required.
- Screenshots total2.083s and are real evidence at four different live viewports. Deferring them requires replaying viewport/input state or capturing buffers at the same moment; no proven materially cheaper equivalent is identified. PNG encoding is not application latency, but currently counts in the total episode.
- More read-only batching is technically possible for some route-read pairs, but available evidence does not establish enough savings for the unexecuted F8 reset, native popup preparation, resume, and Menu/Escape tail. Another blind micro-optimization publication is not justified.

## NEW policy, independently design-reviewed and authorized for implementation
Keep all existing public Load/skip/pause, exact retained-popup close/reopen, camera holds, native target/HUD routes, four strict layout cases with every metric/text row, real scroll, both pointer/keyboard frame downloads, F8 reset, live resume and Menu/Escape assertions. No gameplay/state writes or speed changes.

Define ordinary M2 only as two phases: one 45s public setup allowance through verified loaded/intro-ready/compact-admitted paused baseline and exact authored popup restoration, then one shared 45s functional allowance for all pointer/camera/layout/export/reset/resume/menu work. No per-case reset, no unused preparation time transfer. A single absolute 90s includes context acquisition and all cleanup, and is clipped to the unchanged caller host remainder. This is explicitly +45s total functional admission, not historical restoration or optimization. Ordinary expanded picking stays 45s; compact's already-reviewed 90s/225s contract stays unchanged.

Use the accepted bounded resource/input guard pattern: sticky monotonic phase/absolute expiry, close owned pending actions/contexts on expiry, reject and close late acquisitions, no late new inputs, preserve primary failures and individual pending/settled cleanup evidence durably. Completion fails on late or failed cleanup. Keep per-action input/response caps unchanged. Negative tests must cover fixed baseline boundary, inability to reset per viewport, setup expiry, functional expiry, total expiry through cleanup, pending action/read -> no late key, late context acquisition, and original-error-plus-late-cleanup failure. The implementation changes the ordinary M2 admission only. Source, focused tests and fresh exact-head hosted validation are separately required; the earlier failed run remains failed. The standalone m2-admission.json records late cleanup settlements durably even when the bounded episode has already returned failure.
