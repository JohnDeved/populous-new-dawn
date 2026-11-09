# Result-screen scoped browser acceptance

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/result-ui-20261015/after), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

## Outcome

PASS for source-bound presentation and explicitly stubbed integration fragments at source commit `73f3b74271850344b15fe996a456bd6153108b60`. Final run completed 24 checks and 19 screenshots with no page errors and all nine production input hashes unchanged. It took 14.9 seconds. Repository files were never edited by this worker.

- Receipt: `/tmp/result-screen457/after-static-73f3b742-final/receipt.json`
- Raw stdout: `/tmp/result-screen457/after-fixture-run-73f3b742-final.log`
- Source manifest and exact extracted fragment hashes: `/tmp/result-screen457/after-fixture-73f3b742/source.json`
- Preparation: `/tmp/result-screen457/after-fixture-73f3b742/prepare.py`
- Actual fixture source: `/tmp/result-screen457/after-fixture-73f3b742/main.tsx`
- Final runner: `/tmp/result-screen457/after-fixture-73f3b742/capture-final.mjs`
- Browser: Chrome Headless Shell154.0.8037.92, Chromium sandbox enabled, no unsafe SwiftShader option. Observed WebGL renderer ANGLE/Vulkan/SwiftShader. This is no hardware-performance evidence.

## Coverage

1. Actual OriginalResultScreen, current globals.css, actual hudScale helper on mount/resize, native art/font decode, title `01 : The Journey Begins`, Player1, Level Status Completed/Failed, time00:02:05 and ten unavailable groups. Healthy panel has3405 fully transparent source pixels, and both panel and overlay CSS background are transparent.
2. Paired before/after won/lost at640×480,1280×960,1920×1080. Baseline `/tmp/result-screen457/baseline-static-auto-aaa3202a` and final use the same neutral source-styled battlefield and production HUD scale; respective sidebar widths96,192,200. Baseline used legacy source JSX; final imports actual new component. These are presentation fixtures, not native or live-game screenshots.
3. Resize while mounted to960×540,900×500,3440×1440; real devicePixelRatio2 at1440×1000. Native384:368 proportions retained; panel centered over source viewport; all panel bounds and control buttons fit without overlap.
4. Exact byte-extracted Home result JSX gate and root click capture: playing hides, both terminal statuses with cameraPlaying hide, camera completion reveals; world mask65535 blocks neutral outside click and allows result action.
5. Parent-decided callbacks and labels: Mission23/Tutorial79 Restart; playerTribe3 maps Player4; Tutorial and unknown Mission999 fallback; negative/nonfinite time fallback.
6. Primary rapid double click and DOM detail-zero repeated clicks dispatch once; selector blocked after primary consumption; repeated selector dispatch stays usable and does not consume primary. Same-mount status changes do not reset guard; actual unmount/remount does.
7. Enter/Space and repeated keydown against native buttons dispatch once. Exact source Home key-effect fragment did not trigger stubbed overview or pause when a button was focused. Focus outline is visible.
8. Missing and corrupt panel, font, and both independently tested (six combinations), with text and controls still readable and actionable.

## Visual inspection

Inspected rendered640×480 win,1920×1080 loss,900×500 short-height,1440×1000@2 Tutorial/Player4, and combined missing-art/font. Artwork is proportionate, text/counters visible, healthy background transparent, actions separated below panel. Fallback uses visible ordinary text and flat brown panel, remains readable. No clipping or unexpected occlusion found in inspected captures. Final receipt records geometry for every screenshot.

## Evidence limits

World/store/engine and unrelated keyboard dependencies are explicit fixture stubs. Callback counts prove dispatch only. This run does not prove simulation continues, real camera finishes, pause restoration, scene replacement, selector dialog Back/Escape, campaign completion/profile writes, checkpoint preservation, earned outcomes, native runtime equivalence or native pixel modulation. The production code and before screenshots are fingerprinted, but this is not a replacement for a full integrated browser check.

## Attempts and recovery

- Initial static attempt from the broad workspace cwd ended SIGKILL137 before any test/screenshot. Its raw in-progress receipt is preserved; terminal observation is `/tmp/result-screen457/after-static-73f3b742/terminal-observation.json`. Tailwind plugin source defaults scan base to process.cwd(); bounding it to the fixture and changing cwd made subsequent runs complete. Memory/resource exhaustion remains an inference, not a measured OOM cause.
- First bounded run completed but had seven harness-only failed assertions because expected labels guessed punctuation (`01 -` instead of source `01 :`) and shortened status (`Status` instead of source `Level Status`). Raw receipt `/tmp/result-screen457/after-static-73f3b742-bounded/receipt.json` retained. Expectations corrected to exact native metadata, never application behavior weakened.
- Final command (exit0): `NODE_OPTIONS=--max-old-space-size=512 node capture-final.mjs`, cwd `/tmp/result-screen457/after-fixture-73f3b742`.

## Possible later integrated attempt

Do not repeat the failed unchanged dev harness. The prior dev harness already used repository cwd, unlike this fixture's initial mistake, so Tailwind scan-base recovery does not establish that its SIGKILL is fixed. A materially different candidate after the writer's successful final build is a one-shot local production-server smoke using that exact built tree, without RSC/SSR Vite dependency optimization. This would need a dedicated bounded runner and fresh source/build hash receipt; the existing local-render harness hardcodes a dev server and exposes no production-server option. Production also has no fixture-injected testStore, so start with shipped main-menu/selector entry and ordinary mission load; deeper terminal flow must use supported controls or separately reviewed instrumentation. Not attempted here because writer explicitly reserved integrated work and instructed no startup retry.
