# Optional web-game performance overlay

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/performance-overlay479), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Issue #478 / PR #479. Product and browser source: `f48a7a2fd6040f3cc2e9b09507bf8731c5c75087`.
Independent source/UI review: ACCEPT, pending the hosted exact-merge `Full check`.

- `?fps` enables at startup; F8 and battlefield Options → Browser compatibility and help toggle it.
- Callback FPS and raw frame-time history use a fixed 240-frame ring. The time span varies with FPS. A 150 ms foreground spike remains visible. DOM/graph refresh is bounded by a 250 ms collection window.
- Simulation CPU measures `advanceGame`; scene render CPU measures lighting/painter preparation, submission and body bookkeeping. These are CPU wall times, not GPU duration or whole-system CPU usage. Scene draw calls exclude separate HUD renderers.
- The existing WebGL context supplies browser-reported GPU/renderer identity once per enable. Reported logical cores may be privacy-reduced. Device RAM is a rounded/clamped hint, not usage or available RAM. Optional legacy Chromium JS heap is an estimate which can include shared heaps or exclude workers. Unavailable/denied hints remain explicitly unavailable.
- Disabled diagnostics have no ring, graph, hardware queries, timers or timing calls. Hidden-tab and blur resets discard gaps. Paused/menu rendering is labelled. Game timing, saves and RNG are untouched.

## Verification

Six focused sampler/hardware tests passed, including aggregation, unclamped spikes, chronological ring/reset, invalid intervals, supported and privacy-denied hardware APIs. Raw output and exact source/input hashes are retained in `focused-f48a7a2.*`.

`receipt.json` retains browser launch/runtime, source/input fingerprints, actual check result, errors and cleanup. `run-home.mjs` and `scenario.mjs` retain the local serving/scenario entry: actual unchanged Home, store, scene, CSS and assets on plain React/Vite. This excludes Vinext/Cloudflare/RSC hosting, which remains covered by the hosted production build. Browser 154.0.8037.92, sandboxed headless, SwiftShader, DPR 1. All browser assertions passed; zero errors, source identical afterward, dependencies unchanged, clean shutdown.

Passed single-scene browser coverage: URL startup and repeated F8/menu off/on toggles, current menu `aria-pressed`, ignored repeats/modifiers/editable targets, direct null/Window/document event targets, first-sample warmup, actual scene CPU/counters, paused/menu rendering, blur/visibility gap reset, click-through, accessible text, bounds and disposal.

Default-off initialization is additionally established by source review and the first successfully rendered scene in the earlier partial two-load attempt; it is not part of the passed single-scene `?fps` run.

Images are the same candidate with diagnostics off/on, not a fabricated earlier implementation:
- `performance-off-640x480.jpg`: diagnostics off in Mission 1.
- `performance-640x480.png`: enabled in Mission 1, panel within 640×480. Existing campaign message overlaps the lower-left footer corner; nonblocking known small-screen overlap.
- `performance-1280x720.png`: enabled wider view, clear full panel.

All displayed numbers are this software-rendered test environment, not the user's hardware. No original-game visual parity or hardware-performance claim.

## Bounded overhead observation

`performance.json` and `summary.json` retain raw samples and summaries for paused Mission 1 at 640×480, ABBA off/on/on/off, eight warmup and forty samples per batch. CPU medians: 5.5 ms off / 5.7 ms on; means 5.80 / 6.45 ms. One enabled 35.7 ms outlier affects the mean. This short software-renderer observation is noisy and does not certify a general overhead bound, hardware FPS or absence of regressions.

Earlier failed local attempts are not passes: the Vinext-based attempt at `6be72285` was SIGKILLed before browser readiness; a plain-Vite two-scene attempt at `f48a7a2f` rendered the first scene then the browser target crashed during the second load. The successful run used one fresh `?fps` mission and exercised off/on in that same scene; failures and raw logs remain retained in the task evidence directory.

## References

Visual inspiration only; no Xbox assets copied: [Xbox Wire Game Bar update](https://news.xbox.com/en-us/2020/07/01/xbox-game-bar-update-july-2020/).
API limits: [WebGL renderer](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info), [device memory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory), [legacy JS heap](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory).
