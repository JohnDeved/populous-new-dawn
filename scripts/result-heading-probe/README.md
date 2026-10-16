# Result heading probe

This probe observes the real `OriginalResultScreen` with production `globals.css`
and `hudScale`, following the isolated fixture convention in
`scripts/result-ui-fixture`. Running it changes no application code or imported assets.
The neutral battlefield and inert callbacks do not establish Home lifecycle,
campaign progression, natural outcomes, or original executable behavior.

The [retained before run](https://github.com/JohnDeved/populous-new-dawn/tree/16ee3983c4d9fa501a1a8bb99dc41377008b8fbc/review-evidence/result-heading-before/213b9342)
confirmed visible leftward drift when bitmap-derived coordinates positioned Arial.
The observer captures evidence without asserting fallback centering. The separate
`compare.mjs` checks the matched after run, including unchanged ready screenshots.

## Matrix and measurements

The eight scenarios are won/lost × Mission 1/the widest retained mission title
(currently Mission 14, `14 : Attacked From All Sides`) × 640×480/1920×1080 at DPR1.
Each captures five states, for 40 unmodified full-page screenshots:

1. Ready font.
2. Failed decode, using a successful HTTP response containing invalid PNG bytes.
3. Valid font after a fresh page load, because this component does not retry a
   rejected decode on its own.
4. Pending font, with the actual image request held by the browser route.
5. Recovery after releasing that same request, without remounting the component.

Every observation records all three heading advance boxes, their signed offsets
from the retained content midpoint, panel/viewport/scale, and bitmap glyph count.
Ready states assert native left/top/width with a 0.02 local-pixel DOM rounding
tolerance, and recovered heading geometry must exactly equal the initial ready
measurement. Native floor rounding remains part of the reference. DOM boxes
measure typographic advances, not painted ink; inspect the corresponding PNGs
before accepting a visible discrepancy. Original layout context remains in
`decomp/research/original-result-ui.md` and `app/original-result-ui.json`.

## Execution

Do not execute while another worker owns the browser lane. Coordinate the lane
with the parent; do not overlap browser or build workloads.

From the checkout, set `POPULOUS_BROWSER` to the existing official Chrome/Headless
Shell executable and run after the lane is granted. Set
`POPULOUS_RESULT_PHASE=after` for an after capture (default: before):

```sh
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/result-heading-before/browser-01.json -- \
  node scripts/result-heading-probe/run.mjs work/result-heading-before-01
```

The loopback port defaults to 4362; `POPULOUS_RESULT_PORT` can select another free
unprivileged port. The script requires a fresh output path and starts its own small
Vite component server with caches under that output. It does not build the game,
alter browser sandbox settings, or install anything. It owns and closes its
contexts, browser and server, and evaluates terminal errors after cleanup.

`receipt.json` binds raw PNGs by SHA-256 and records execution identity, browser
version/binary hash, renderer, geometry, injected failures, errors, and cleanup.
`inputs-before.json`/`inputs-after.json` include source HEAD/diff, all relevant
component/fixture/assets/configuration hashes and the actual bytes of installed
dependency files (including file-symlink targets). Unsupported directory symlinks
fail closed. Any input drift, launch/capture/cleanup error or 180-second browser
deadline makes the run fail. `completed-before-observation` or
`completed-after-observation` means the matrix finished; neither asserts
fallback-centering acceptance.

Compare against the immutable before bundle, keeping both directories intact:

```sh
node scripts/result-heading-probe/compare.mjs BEFORE_DIRECTORY AFTER_DIRECTORY COMPARISON.json
```

The comparator verifies receipt/input/screenshot hashes and the exact 40-case
inventory. All ready PNGs and heading geometry must match before exactly; every
fallback heading must lie within 0.02 screen pixels of the content center and fit
the panel. Pixels above/below the heading band (including statistic rows and
controls) must match before exactly. Same-mount delay recovery and reload recovery
must reproduce ready PNG bytes in every scenario. It preserves failed comparisons
and refuses an existing output path. These are isolated-component, DPR1 results,
not a natural Home outcome or general pixel-parity certification.
