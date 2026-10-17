# Spell HUD checker contract validation

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/spell-hud-checker-480), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Candidate: `731bda43becc9abe3479be8e1cca26a65a8aa54d` (PR #480 plus main `7dc1ecda9a4b1901ffcfbb1dc1339185e649de55`).

Latest-main integration: `12da9549756b71a5a686c0613f91647b110a2103`, main `9151962441d5735aea0427edac842dff86943ed8`. Browser evidence is explicitly carried from the tested candidate; no browser rerun is claimed. Of 1113 browser-input fingerprints, 1111 are unchanged. Only the Graphics/Direct3D options component and CSS changed; neither panel is opened by this spell scenario.

## Source scope

Only the browser-checker contract repair and its tests change. No game UI, atlas pixels, opacity, gameplay, native research, or original executable execution. The initial integrated focused run passed 57 tests. After the Graphics main integration, the expanded focused run including original-options passed 63 tests in 7.50 seconds. Both had no failures or skips.

## Historical PNG encoding portability

The original historical preservation receipt could not be recovered. We extracted commit `016852f4b354be1019495ec3ec0595027024dd6b` and used its unchanged existing checker/importer/decoder against base `21c0ddbde41ed9f0f88e50e67022bd4165c2dc95` and retained hash-pinned HFX/palette inputs. The first replay FAILED its exact PNG output-byte reproduction assertion. That failure is retained.

A diagnostic established exact historical JSON byte equality and complete decoded RGBA equality at 1024×460. PNG compressed bytes differ under this environment (Pillow 12.3.0, zlib 1.3.2): original SHA-256 `1d2315d25538f419e3f3ae42043efd25f6e83731060ca39a6afa3df280c30341`; recreated SHA-256 `7eba7b644d8f68eaf1f3173d3d9bd40d9fc341c72df0623e1e882aa1f22619c6`.

A separate current-encoder reconstruction snapshot substitutes only that PNG encoding. The unchanged preservation checker passed against this separately labelled artifact. Its PASS producer status is never a claim that original PNG bytes were reproduced. The browser adapter additionally verifies both PNG-byte hashes, their full decoded RGBA hash equality, dimensions, and exact original Git metadata hashes before using the reconstructed receipt's crop references. Strict identity of the current served atlas PNG remains unchanged.

## Supplemental actual-Home harness

The scratch scenario preserves every maintained checker assertion. The initial adapter retained its complete mission-entry through final-state body byte-for-byte; the final adapter adds only a public Continue anyway button dismissal after entry, before initial-state capture/freeze. The proven plain React/Vite runner imports unchanged production Home, store, scene and CSS; framework hosting/hydration is excluded. It owns a fresh sandboxed Chromium context and 240-second timeout. Native 640×480 replaces the standalone checker's 1440×1000 viewport for a bounded software-rendered run. No canonical queue identity is invented, and this is not an unchanged standalone-checker execution.

The first native-size attempt failed because the real desktop recommendation intercepted pointer events. Its failure receipt and screenshot are retained; zero page/console errors, unchanged source/dependencies and cleanup were verified. After the public-button harness setup repair, a fresh context passed all seven rendered states: Shield ready, hover, selected, charge-paused, inactive-hover, resumed; and Bloodlust undiscovered. All seven served RGBA crops and current 1024×551 PNG identity passed. Mission 16 availability, disabled mask, stocks, gifts, RNG and turn 11 were preserved. Runner errors were empty; source and dependency identities were unchanged; browser/server cleanup succeeded. Chromium 154 used ANGLE/SwiftShader. Eight software-renderer/ReadPixels/texture-no-image warnings remain in the receipt; this is not warning-free. No hardware performance, earned Bloodlust casting, original question-mark alpha or native full-frame parity claim is made.

## Retained evidence

`validation.tar.gz` contains both browser attempts, original-byte failure, separate reencoded replay, immutable source hashes, the full-pixel bridge, adapter variants/mapping, focused logs and source carry. No original DAT source files or executables are included; historical generated atlas assets are retained for proof. The final ready-PR full check/build is pending in GitHub Actions.
