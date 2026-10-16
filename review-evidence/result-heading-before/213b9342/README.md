# Result heading before evidence

Source: `213b93426002877f37552ee1faa1c885351734b3`, clean tree, based on
`c9e3cbc8003be7c9b3fc489d794297679476d2b9`. No product changes.

The before-only run completed all 40 captures, exit 0, with zero runtime errors.
All 15 bound source files and 21,318 dependency entries were unchanged. Both input
manifests have SHA-256
`b8eb001a56e968e796599f2d505346f83b01aa783cf8af6662fd537a612e46e0`.
The detailed `receipt.json` SHA-256 is
`8c40c782008e63bd7f6cd745283625447da2c46e98b6c14aa8a387a8a7c7f210`.
The raw command receipt/logs and prior focused 5/5 tests and ESLint receipts are
included. The complete file hash inventory is `manifest.json`.

## Finding

The fallback headings are visibly left of the panel content midpoint and do not
share a common center. The real component keeps bitmap-derived left coordinates
while Arial has narrower advances. This is a demonstrated presentation defect
for the tested failed/pending font cases, not a native behavior claim.

| Heading | 640×480 offset | 1920×1080 offset |
| --- | ---: | ---: |
| Mission 1 title | -23.27 px | -48.48 px |
| Mission 14 title | -37.88 px | -78.91 px |
| Player 1 | -9.00 px | -18.75 px |
| Completed status | -30.47 px | -63.47 px |
| Failed status | -23.54 px | -49.03 px |

These are signed typographic advance-box offsets; negative means left. Visual
inspection of the original PNGs confirms the displacement. Ready font headings
retain the native floor-rounded centering (0 or -0.5 local pixels), exact native
left/top/width, and visible alignment. Across all eight scenarios, failed and
pending screenshots are byte-identical; both recovery screenshots are
byte-identical to the initial ready capture (`pixel-pairs.json`).

Representative unedited pairs:

- [640×480 Mission 14 ready](won-level14-640x480-ready.png),
  [failed](won-level14-640x480-failed.png).
- [1920×1080 Mission 14 pending](won-level14-1920x1080-delayed.png),
  [same-mount recovery](won-level14-1920x1080-delay-recovered.png).
- [1920×1080 lost Mission 1](lost-level1-1920x1080-failed.png),
  [640×480 lost Mission 14](lost-level14-640x480-delayed.png).

## Boundaries and cleanup

Actual `OriginalResultScreen`, production stylesheet and HUD scale; neutral
battlefield, inert callbacks. Failed decode uses invalid PNG bytes; recovery from
that failure is a fresh mount. Pending decode recovers on the same mount. No Home
lifecycle, natural outcome, original executable, or performance claim.

Sandboxed Chrome for Testing 153.0.8010.12, DPR1, ANGLE Metal Apple M5 renderer.
The component server and browser closed successfully; port 4362 has no listener
(`cleanup.json`). Browser lane released. No product correction has been made;
parent scope acceptance remains required before implementation.
