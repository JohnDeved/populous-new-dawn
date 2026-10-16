# Independent loading/recovery UI review

Reviewed implementation: 42e9e2bc6b3300685fb3133aebe0e932bb5a9b7a.
Base: 4687490198313ccf0f55d85c1cbcbd680d720cea.

## Status and boundaries

Source and rendered-presentation review: ACCEPT for the bounded loading/recovery UI, subject to the parent's independent final repository gate audit. No open implementation finding remains. Parent owns integration and merge. This is not full native-frame, browser-framework bootstrap, remote deployment, hardware-performance, checkpoint lifecycle, or campaign acceptance.

The exact production Home, GameScene, store, listeners, CSS and public assets are imported by a separate plain React/Vite entry. No application source is copied or modified by the runner. This excludes Vinext/Cloudflare/RSC serving/hydration only. Browser is sandboxed Chrome Headless Shell, with renderer identity recorded on successful activation. No unsafe renderer, certificate or sandbox flags are used.

Injections are explicit: cold restore delays notification of the real IndexedDB-open success event and later delivers that same event to its original listener; loading/failure holds or aborts real landscape/waves requests; missing-art aborts only loading-mask and loading-label image requests. No scene/world, clock/RNG, readiness result or success callback is supplied or overwritten. The initial Mission 1 is entered through ordinary New Game / Start Mission 1 controls. Browser recovery and opaque black are labeled adaptations.

## Episodes

- baseline/receipt.json: passed. Actual base app/public before pictures at 640x480 and 1440x1000 for cold restore, held load, actual resource failure. Baseline source status correctly lists three concurrently edited browser scripts; all 1,105 rendered production source/assets stayed unchanged. It is not described as a globally clean checkout. capture-baseline.mjs exactly matches its recorded runner hash.
- final-core-42e9e2bc/receipt.json: FAILED terminal episode, retained. Four groups passed: cold restore, held real load/frozen time-RNG-input, auto-focus/Tab/technical details/full viewport, and recovery scrolling at 640x300. Native geometry includes odd 641x481. Chrome crashed on actual activation after two consecutive failed retries; no success is claimed for that cumulative episode. All 1,108 production inputs stayed unchanged. Final-core before-crash PNGs remain valid presentation observations.
- final-dpr-42e9e2bc/receipt.json: passed. Successful original loading art and exact geometry at 640x480 and 1280x960 CSS pixels, DPR2.
- final-missing-42e9e2bc/receipt.json: passed. Both loading art images unavailable; readable restore/load status and keyboard/pointer-reachable recovery stay above the small-screen notice at 640x480 DPR2.
- final-repeat-42e9e2bc/receipt.json: passed. Separate failure-only scenario verifies repeated Enter and Space result in one same-Mission1 request each, exactly two held terrain resources, unchanged clocks/RNG/input while pending, then usable failure focus again. This does not claim successful activation after multiple retries.
- final-retry-42e9e2bc/receipt.json: passed. Separate fresh single actual terrain failure followed by ordinary Enter retry reaches actual GameScene readiness; scene started, Mission 1 preserved and overlay detached. ready-after-single-retry.png is the real rendered battlefield. No unchanged retry of the crashed cumulative scenario was made.

The split episodes reduce cumulative browser load but do not establish the cause of the first crash or certify cumulative scene-replacement reliability. Existing full lifecycle checks remain the writer's responsibility. Headless software rendering does not prove hardware performance.

## Independent native/source review

- static-evidence-audit.json and audit-static.py independently bind all 20 code windows, 6 data windows/listing hashes and 7 source inputs to the canonical EXE. The selected font, metrics, FE/FF colors, software solid-mask dispatch and contextual palette0 clear were read directly from those listings.
- independent-label-validation.json records a separate original PSFB RLE decode of all ten glyphs: measured 81x19 and composite 82x20; every RGBA pixel and generated PNG hash matched. independent-label/ retains the reproduced output. Static reconstruction does not certify original GPU/device quantization.
- Code review confirms Home loadRequest, retryLoad, scene readiness, store/persistence, cancellation and simulation sources are unchanged. New component owns presentation/focus/duplicate activation only. Phase key resets the one-presentation retry guard. Missing assets cannot reject actual GameScene readiness.
- The fixed relative label X was corrected before candidate commit: native centering uses the 81-pixel measured text, not composite 82-pixel width or constant offset from the mask. Odd-width browser evidence confirms the correction.

## Reproduction

Use the existing dependency tree and explicit browser path from each receipt. Prepare with prepare-home-fixture.py and verified git wrapper on PATH. Set POPULOUS_GAME_ROOT, POPULOUS_FIXTURE_ROOT, POPULOUS_REVIEW_OUTPUT, POPULOUS_BROWSER and NODE_OPTIONS=--max-old-space-size=512. capture-final-42e9e2bc.mjs supports core/dpr/missing via POPULOUS_REVIEW_MODE; capture-retry-42e9e2bc.mjs adds repeat/retry. POPULOUS_BASELINE=1 selects baseline assertions. Always choose a fresh output directory and coordinate the heavy lane. Scripts retain terminal status, captures and unconditional source rehashes. Files in packet-manifest.json are retained with exact bytes/hashes; Vite caches and dependency symlinks are excluded.
