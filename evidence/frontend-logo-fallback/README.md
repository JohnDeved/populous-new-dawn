# Frontend logo shadow: fallback readiness

Refs #16, #457. Stacked checkpoint on PR484's frozen head
`f1e085cbb5e0f2d63a1e5cf1fb79d5addc158cc5`; not yet accepted for main integration.

The original FELGsdEN mask belongs to the sprite logo, as retained in
`decomp/research/frontend-menu-composition.md` (title and shadow source binding).
The existing grouped artwork readiness controls whether the foreground is that
logo or an HTML title. This patch passes the same readiness to the compositor,
which defaults to drawing the logo shadow for every existing caller. Only the
logo mask is gated; text shadows, background, glow and controls are unchanged.
This is browser fallback correctness, not newly recovered native behavior.

## Source-bound checks

The raw archive records the exact scratch patch SHA, base commit, source hashes,
runner/scenario hashes and outcomes. The candidate product/test bytes are copied
unchanged from that reviewed scratch patch. The component used production menu,
CSS, composition and original art; navigation callbacks are fixture-owned.

- Focused logo/composition/wide suites: 15 passed, zero failed, 2.5 seconds.
- Default and explicit-true compositor preserve native golden output.
- Disabled shadow equals rendering a clone with only the logo mask made transparent.
- Production callback passes artwork readiness across all four panels and all
  four question/artwork readiness combinations.
- Browser: four groups passed under a 90-second cap, source/dependencies unchanged,
  cleanup verified. Actual logo and font requests fail independently. A held logo
  request is released under reduced motion; the actual canvas returns to the exact
  native-ready reference hash. Back/Escape focus is preserved.

## Images

All images are component captures at 640×480, DPR1, reduced motion. They are not
original-game screenshots, actual Home/world integration, or hardware benchmarks.

- `logo-ready.png`: unchanged fully loaded native title.
- `logo-failed.png`: failed logo image, HTML title without its native silhouette.
- `font-failed.png`: failed normal font also causes the existing grouped fallback.
- `logo-delayed.png`: HTML title while the logo request is held.
- `logo-delayed-ready.png`: sprite title and matching shadow after request release.

The prior mismatch is visible in PR484's `quit-choice-fallback.png`; it is a
separate panel capture, not a pixel-matched before image for these main-menu shots.
Main/options glyph-shadow mismatches behind HTML labels remain outside this slice.
Full hosted checks and exact merged-base review remain pending. Do not merge the
stacked branch before its parent; no workflow or check semantics change here.
