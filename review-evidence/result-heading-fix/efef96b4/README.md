# Centered fallback result headings

Source head: `efef96b45bc62907a3eaa3d62c14001e6cff1afa`.
Base: `f85a8105fd77c71547fe5cd01594d3467c47b098` (main with PR 493).
Before source: `213b93426002877f37552ee1faa1c885351734b3`.
The [immutable before bundle](https://github.com/JohnDeved/populous-new-dawn/tree/16ee3983c4d9fa501a1a8bb99dc41377008b8fbc/review-evidence/result-heading-before/213b9342)
contains the 40 baseline PNGs, input manifests and raw receipts.

The product correction centers fallback text by its actual rendered width. Ready
bitmap headings retain their exact floor-rounded native coordinates. No CSS,
artwork, statistic anchors, controls, campaign behavior or ARIA labels changed.
`source.patch` contains the complete branch diff, including the real-component
fixture and regression comparator.

## Measured result

All 40 after observations and matched comparisons passed. For all three headings
in every failed/pending case, the maximum absolute center offset is
0.0000152587890625 screen pixels (DOM rounding). Before, the widest mission title
was 37.875 px left at 640×480 and 78.90625 px left at 1920×1080.

All 24 ready/recovered PNGs are byte-identical to the baseline. In all 16 fallback
captures, every pixel above/below the heading band is unchanged, including the
statistic rows and controls. Within each scenario, failed/pending PNGs match;
same-mount delayed decode and failed-decode reload recovery reproduce the ready
PNG exactly. `comparison.json` records each pair and its hashes. The comparator
was also run against the unfixed baseline and failed its centering assertion
(`comparison-red-result.json`); that expected failure is retained.

Representative unedited pairs:

- [Before 640×480 Mission 14](https://github.com/JohnDeved/populous-new-dawn/blob/16ee3983c4d9fa501a1a8bb99dc41377008b8fbc/review-evidence/result-heading-before/213b9342/won-level14-640x480-failed.png)
  → [after](won-level14-640x480-failed.png).
- [Before 1920×1080 lost Mission 1](https://github.com/JohnDeved/populous-new-dawn/blob/16ee3983c4d9fa501a1a8bb99dc41377008b8fbc/review-evidence/result-heading-before/213b9342/lost-level1-1920x1080-failed.png)
  → [after](lost-level1-1920x1080-failed.png).
- [After pending Mission 14 widescreen](won-level14-1920x1080-delayed.png),
  [same-mount recovered](won-level14-1920x1080-delay-recovered.png).

## Verification and provenance

- `focused-final.json`: 6/6 focused result-screen tests, exit 0. New fallback
  regression failed before the product correction (`fallback-red.json`).
- `lint-final.json`: exit 0, one existing Next img-element warning.
- `typecheck-final.json`: TypeScript passed, exit 0.
- `component-build-final.json`: isolated real-component Vite production bundle
  passed, exit 0; full game build remains the parent-owned hosted gate.
- `browser-after-final.json`: exact-head 40-capture browser command passed, exit 0.
- `comparison-final.json`: all 40 matched comparisons passed, exit 0.
- All raw command stdout/stderr files are retained. Draft red/green receipts are
  labeled by filename; final acceptance uses the exact efef96b4 head.

After input manifests are identical, SHA-256:
`be2953520869e633c287e41fd26aa6f4d0ca6ece48131a9e6d7a25e0e6249be6`.
Browser report SHA-256:
`69222bbac73713095105c47239553dd63e870f0f645659093577ba7ee201682f`.
Comparison SHA-256:
`eddf14ffae37b1f0301949ad5e6e73ffaaedbb9110c2916804b0fbdf20c4a5a4`.
The manifests bind 15 source/config/asset inputs and 21,318 dependency entries;
the comparison command separately binds its script and both browser reports.
`manifest.json` binds every published evidence file except itself.

## Limits and cleanup

Isolated real `OriginalResultScreen`, production globals/HUD scaling, inert
callbacks, neutral battlefield; no natural Home outcome or campaign claim.
Two viewport sizes, DPR1 only. Failed-font recovery requires a fresh page/mount;
delay recovery happens on the same mount. This is a measured browser compatibility
correction, not generalized native pixel parity or performance evidence.

Sandboxed Chrome for Testing 153.0.8010.12, ANGLE Metal Apple M5 renderer. Browser
and server closed; port 4362 has no listener (`cleanup.json`). Browser lane released.
No full local suite/game build, original executable, new native research or merge
ran. PR 491 remains frozen at fd63f454; parent owns fresh review and hosted CI.
