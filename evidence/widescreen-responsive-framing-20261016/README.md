# Responsive original-art menu framing

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-responsive-framing-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Refs #460 and draft #470. This revision replaces the held cropped-cover experiment with a source-derived, palette-coherent side field. The face, crown, title and menu retain their original logical scale. The 640→641 breakpoint no longer zooms the artwork.

## Sources and scope

- Before screenshots: `d5768f9dd957a65c76c12a568a92d32ff164cac5`.
- Visually accepted screenshots: `69d450d7184c003ec1f6729e08eedea12796d190`.
- Allocation-only optimization and behavior checks: `20274ec4eb65db21e9e2abb4e6d444637b8ff8b6`. The later equivalent typed-array-copy repair is `b7be6c6b76a24afd41c161f68f5f4435feb4c154`. All 45 complete RGBA comparisons against the accepted revision passed: nine widths, each with five main/Options/Quit/pointer/glow states. The eight wide indexed outputs are also pinned in regression tests.
- Actual production Home, CSS, store and assets through the plain React/Vite fixture, Chrome Headless Shell 154.0.8037.92. This excludes Vinext/Cloudflare/RSC serving/hydration, deployed-runtime testing, original-game screenshot parity and hardware performance claims.
- The image manifest binds each original PNG to its lossless WebP copy. Decoded RGBA bytes were compared exactly; no pixels were edited. Original PNGs and full local matrices remain retained.

Both comparison sides are unfocused with reduced motion. The older multi-view scenario retained a different pointer position after its first view, which changes native shadows. Compare framing and geometry, not every shadow pixel. The matched native 640×480 PNG is byte-identical. The portrait pair has this pointer-state mismatch, so no portrait screenshot byte-identity claim is made.

## Paired screenshots

### 16:9, 1920×1080

Before:

![Before 1920×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-1920x1080.png)

After:

![After 1920×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-responsive-framing-20261016/after-1920x1080.webp)

### 21:9-class, 3440×1440

Before:

![Before 3440×1440](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-3440x1440.png)

After:

![After 3440×1440](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-responsive-framing-20261016/after-3440x1440.webp)

### 32:9, 3840×1080

Before:

![Before 3840×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/before-3840x1080.png)

After:

![After 3840×1080](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-responsive-framing-20261016/after-3840x1080.webp)

## Composition contract

The full original 640×480 artwork stays centered at the unchanged height-based scale. The central 400 columns remain exact. A feather grows continuously from zero to at most 120 columns per side. Six small outer-art samples above the baked badge strip supply averaged source RGB colors; interpolating these creates a subordinate field without repeated texture, added motifs or a second face. Serpentine error diffusion selects only original palette indices, avoiding the rejected broad quantization bands. Existing native palette-fade masks then apply to the widened indexed background at the same logical offsets.

The exact Bullfrog/QSound panels and source-coordinate trademark mattes stay at their original centered-frame positions. They do not move to the viewport's outer corners. This avoids duplicate baked marks during resizing. The matte is an explicit modern extraction, not recovered original transparency; the [source-coordinate contract](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/widescreen-source-framing-20261016/tm-matte-contract.json) records its limits. Imported assets are unchanged.

The backing canvas stays 480 logical pixels high with an even width; DPR does not increase it. Only one current-width indexed background is cached per source. Per-width quantization maps and diffusion buffers are local to generation; cached draws do not resample the field. Native 4:3 and narrower compositions use the unchanged native path.

## Verification and limits

- Visual PASS: native 640, 641/660/720/800 at height 480, 16:9, 21:9, 32:9, portrait 768×1024, and short 1280×480. Independent review found no crop/zoom jump, hard source-frame seam, broad color bands, repeated motifs or duplicate marks.
- Geometry: frame/title and all nine control bounds match the baseline at comparable sizes.
- Focused tests: all 18 pass. Five pre-change SHA-pinned native RGBA cases cover main, Options, Quit, pointer and glow; wide tests cover source core, exact badges, cache immutability, palette stride, opacity and accepted diffusion output.
- Actual Home behavior PASS: odd dimensions, DPR 2 with unchanged logical backing/hitboxes, keyboard/hover, 24 repeat-return panel routes, reduced-motion stability, and real composition-data fetch failure. Browser errors: zero; source and installed dependency metadata stayed unchanged; browser/server cleanup verified.
- Failure mode: when composition.bin fails, the usable original static 4:3 background and plain side margins remain. Wide-field rendering depends on that data; it is not failure-mode-wide support.
- Cold resize still creates a visible one-off cost. The optimized software-browser samples reported 147/168/207 ms main-thread long tasks at 16:9/21:9/32:9, versus 148/219/233 ms before allocation reduction. These are individual observations, not a hardware threshold or repeatable speedup claim. Cached draws are measured separately.
- Resize-burst PASS: five requests coalesced into two events and settled to 1537×480 viewport / 1538×480 backing. One physical Options click opened exactly one panel; Escape restored focus with no late duplicate after 250 ms. Burst-to-Options was 413 ms, click-to-open 109 ms, and observed click queue 13.6 ms. Six cached pointer updates had median renderer script 7.24 ms / task 10.05 ms, including input dispatch, React and observation overhead. No paired baseline timing claim: the old actual-Home fixture could not be verified against its source manifest.
- Independent visual/behavior/resource review accepted this bounded menu-only revision with the cold-resize and fallback limits above. Final verification is recorded in [gate-report.md](gate-report.md): the full attempt had one disk-capacity failure, recovered by an unchanged-file retry and the skipped downstream stages. It is not relabeled as a clean aggregate pass.

The first crop candidate and first smooth-field candidate were held on actual pixels before broad tests. The latter's nearest-palette bands were corrected with error diffusion. Two scratch browser attempts failed on harness selectors (a disabled-row locator and an implicit-region selector), then passed after scenario-only corrections; their original receipts are retained. No assertions or product behavior were weakened.

`raw-evidence.tar.gz` and its artifact manifest preserve source-bound receipts, scenarios, comparisons, timing, and failed attempts without rewriting them. `SHA256SUMS` covers the portable deliverables. No parity credit was changed.

The final [gate report](gate-report.md) and `gate-evidence.tar.gz` preserve the failed aggregate, successful scoped recovery, equivalent-copy repair checks and canonical build evidence. The original receipts are unchanged.
