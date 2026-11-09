# Options font and slider readiness

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Refs #457. Product base: `b77aa038914196781e717c4436659fffeeec24f2`.
Tested fix: `f4db91c5bd70d7683f14b17275e4a593cb932620`.

A failed slider PNG previously rejected the same readiness promise as the Options
fonts, replacing successfully decoded original labels with HTML fallback and
withholding their frontend shadow rows. A font failure also discarded usable
slider artwork. Actual Home reproduced both directions in both skins.

The fix gives text and sliders independent, skin-bound readiness. The three
frontend font banks remain one coherent group; text readiness alone controls
frontend shadow publication. CSS, image assets, Home lifecycle and CI are unchanged.

## Evidence

`receipts.tar.gz` retains exact executed browser scenarios, runner, raw build logs,
source/input manifests, screenshots and focused test output. `manifest.json` maps
original and retained SHA-256 values; only absolute source/home prefixes are
redacted. Failed-attempt scenarios were reconstructed after the run and matched
against their recorded hashes before retention. Original local receipts remain
intact. Archive SHA-256:
`23307221ad522ec0a981d9c975a275eb918e30ed7fa5bb94d534d49a1fa8e2ba`.

| Check | Result |
| --- | --- |
| Initial focused regression on unchanged product | 18 tests: 14 fail, 4 pass. Deliberate failing baseline. |
| Final focused suite on tested fix | 30/30 pass, no skips/cancellations. Includes existing Options layout and frontend shadow tests. |
| Baseline actual-Home matrix | 12/12 expected coupled-fallback observations reproduced. This is defect evidence, not healthy behavior. |
| Fixed actual-Home matrix | 12/12 pass: three failed slider frames per skin; all three failed frontend font banks; failed in-game font; all-success per skin. |
| All-success pixels | Zero changed pixels in both skins' Options Sound content/navigation region, rectangle `[105,130,640,480]`; hashes in `all-success-pixels.json`. |
| Source/dependencies during accepted browser runs | Source hashes identical before/after, no dependency changes, cleanup verified. |
| Full `npm run check` / Vinext `npm run build` | Not run locally; required hosted ready-PR gate remains pending. Vite Home fixture builds passed. |

The focused tests exercise the shipped component with controlled hooks and deferred
image decodes: either group settles first, each individual image fails, unmounted
callbacks cannot write, a new mount stays independent, and pending/fully-ready
skin replacement cannot publish readiness for another skin. The existing shadow
publication assertions remain intact with their binding renamed to `textReady`.

Browser cases mount actual `app/page.tsx` through the existing production Vite
fixture. Frontend Options uses the Main menu. In-game Options uses public
New Game → recommendation No → Start Mission 1 → Continue anyway → Skip introduction
→ Game settings → Options. Cases abort only their specified image requests and
forward all other requests. An image-decode observer forwards the original method;
no world, scene, clock, or loader is modified. Both volume controls respond to
Home/End and Rotation changes through its public control. In-game world remains
paused while Options is open.

Chrome `155.0.8059.80` ran headless on the Mac with sandboxing enabled and isolated
ephemeral browser contexts on port 5199; binary hash and launch settings are in each
receipt. The background world is hidden only during screenshots to remove unrelated
animation. Pixel comparison excludes the battlefield HUD and frontend pointer glow.
This is not whole-frame pixel equality, native-runtime parity, deployed
Vinext/Cloudflare/RSC acceptance, or hardware performance evidence. GPU renderer
identity was not captured. Deferred ordering and skin replacement are focused
component tests, not browser episodes.

## Retained setup failures

`baseline-01` failed waiting for an obsolete `.skip-introduction` selector after the
frontend all-success case. `baseline-02` acknowledged the small-screen gate but
still used that stale selector, so its gameplay-readiness wait timed out. Neither
credits in-game coverage. `baseline-03` used the current accessible Skip introduction
button and completed. All attempts report cleanup. No source fix was applied until
the complete baseline matrix reproduced the defect.

## Representative before/after pairs

Each before image is from base `b77aa038`; each after is from tested fix `f4db91c5`.
The corresponding full hashes are above. All captures are 640×480, DPR 1.

Frontend, only slider track fails:

![Before: all text falls back](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/before-frontend-slider-0.png)
![After: original text retained, browser slider fallback](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/after-frontend-slider-0.png)

In-game, only slider track fails:

![Before: all text falls back](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/before-ingame-slider-0.png)
![After: original text retained, browser slider fallback](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/after-ingame-slider-0.png)

Frontend, normal font fails (coherent text fallback):

![Before: usable slider art suppressed](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/before-frontend-font-normal.png)
![After: usable slider art retained](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/after-frontend-font-normal.png)

In-game font fails:

![Before: usable slider art suppressed](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/before-ingame-font-normal.png)
![After: usable slider art retained](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/options-readiness-20261017/after-ingame-font-normal.png)
