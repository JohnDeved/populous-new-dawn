# Source-only widescreen framing experiment

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Status: **held after visual review; not accepted for merge**. Refs #460; experimental draft #470. This is a new bounded source-only framing experiment, not another tile surround or generated outpaint. It does not replace draft #461 or complete the issue.

## Captured sources and method

- Before: `d5768f9dd957a65c76c12a568a92d32ff164cac5`.
- After: `96868869d694523b97ae06009e3ac6874a567d95`.
- Actual production Home, global CSS, store and assets through the existing plain React/Vite fixture.
- Chrome Headless Shell 154.0.8037.92, software/headless, DPR1. No Vinext/Cloudflare/RSC serving/hydration, deployed runtime, hardware-performance, or original native-runtime screenshot parity claim.
- Reduced motion; deterministic keyboard focus/pointer sequence. Paired screenshots below are unfocused. Full source-input hashes, errors and cleanup are in the retained receipts. Both captures passed, with unchanged inputs and dependency installation and verified browser/server cleanup.
- `capture-baseline.mjs` and `capture-candidate.mjs` retain the exact scenarios. `run-home-scenario.mjs` retains the shared runner. Their local paths are historical execution locations, not portable prerequisites.

## Result

16:9 fills the screen coherently without visible repeated textures, duplicate logos or whole stone rectangles behind the corner marks. The same framing becomes an extreme facial close-up at 32:9, places the 21:9 gold subtitle over a bright forehead, and jumps in backdrop zoom when resizing from 640×480 to 641×480. Those visual problems block accepting this candidate. No broad checks, build, or performance run was started after the first visual hold.

`comparison.json` proves the native focused and unfocused 640×480 screenshots and portrait 768×1024 screenshot were byte-identical. The frame, title and every button's bounds stayed identical in all six compared viewports. The six-view candidate matrix used backing dimensions 640×480, 854×480, 1148×480, 1708×480, 640×480 and 642×480 respectively. DPR never increases backing dimensions. Static indexed sampling is cached per immutable source/current width; the existing 101ms glow cadence and reduced-motion behavior are retained. This describes implementation and observed geometry, not a measured speedup.

## Comparable screenshots

### 16:9, 1920×1080

Before at `d5768f9d`:

![Before 1920×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-1920x1080.png)

After at `96868869`:

![After 1920×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/after-1920x1080.png)

### 21:9-class, 3440×1440

Before:

![Before 3440×1440](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-3440x1440.png)

After:

![After 3440×1440](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/after-3440x1440.png)

### 32:9, 3840×1080

Before:

![Before 3840×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-3840x1080.png)

After:

![After 3840×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/after-3840x1080.png)

### The 4:3 breakpoint

Native 640×480, unchanged before/after:

![Native unchanged](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/native-640x480-unchanged.png)

Before 641×480:

![Before 641×480](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-641x480.png)

After 641×480; the one-pixel wider viewport triggers a roughly 25% backdrop zoom:

![After 641×480](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/after-641x480.png)

## Exact source and trademark limits

The background field is original source rectangle (0,0,640,384), uniformly covered with horizontal center and bottom anchor. The source image is `public/original/frontend/background.png`, SHA256 `509cc6129cbb0574bf873d91e8b6cd2f49cbb2711f6f2cd8ea6d394723725fb4`. Original assets and importer remain unchanged.

The Bullfrog panel is x5–58/y387–475; the QSound panel x569–616/y416–475. Both are exact opaque source crops. The TM glyphs use a shared, explicitly adapted source-coordinate 17×9 row matte, origins (61,387) and (619,416). `tm-matte-contract.json` preserves the audited spans and all 99 included source indices/RGB values per glyph. Original transparency is not recoverable; faint fringe pixels remain a review caveat. No thresholding, new lettering or invented texture is used.

Actual rendered 16:9 detail crops:

![Bullfrog detail](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/bullfrog-detail-1920x1080.png)
![QSound detail](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/qsound-detail-1920x1080.png)

## Checks and deferred gates

- Passed: 16 focused Node tests in 0.73s. Five pre-change SHA-pinned native RGBA cases cover main, Quit, options, pointer and glow. Other tests cover safe field samples, exact badge panels, immutable cache and wide palette stride.
- Passed: focused Oxfmt and git whitespace check.
- Passed: actual-Home baseline and small candidate capture runs; retained raw receipts and geometry comparison.
- Not run: full `npm run check`, `npm run build`, candidate short-viewport and broader interactive browser regressions, DPR2, data-failure browser probe, and per-frame cost measurement. The visual hold came first.
- Known implementation limit: if composition.bin fails, the original static 4:3 fallback remains; do not claim wide failure-mode support.

`SHA256SUMS` identifies the retained raw evidence. No parity credit was changed.
