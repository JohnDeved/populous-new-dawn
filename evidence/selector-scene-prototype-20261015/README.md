# Early shared-scene prototype (not final acceptance)

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-scene-prototype-20261015), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Before: clean `265444c6dc5ce58ec7e6427b123374a0de7dc44d` (PR464).
After: clean `c023cc2606e9e98d3bf94af48c013b98713c0d28` (PR465 prototype).
Matched 640x480 / 1280x960 viewport captures from the actual shipped selector.
After captures show initial camera travel, then a Mission2 transition while still
moving. They do **not** show settled focus or the later native text/chrome change.
Chrome154, sandbox enabled, ANGLE SwiftShader. These are modern reconstruction
screenshots, not original-runtime references or hardware-performance evidence.
Both source-bound successful receipts are retained. Prior failed baseline/browser
startup and prototype server readiness attempts are retained in the task evidence;
no screenshot or scene correctness claim is derived from those attempts.

Text helper verification is static source-data reconstruction only. Its external
paths identify inputs used; current importer/assets are committed independently.
