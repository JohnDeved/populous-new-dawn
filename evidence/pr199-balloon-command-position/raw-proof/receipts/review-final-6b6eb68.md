# Final Balloon driver startup review

Decision: **ACCEPT** the exact-head delivery for the narrow functional/UI Balloon
driver raw command-position repair. No actionable introduced defect remains.
The previously missing aggregate, build, and rendered functional gates now pass.
Parent integration/remote verification and authorized merge remain parent-owned.

- Issue / draft PR: #198 / https://github.com/JohnDeved/populous-new-dawn/pull/199
- Final base: `ea521248b64f0993f4b9884b8e070fb20c4cbbe1`
- Final head: `6b6eb684f4f010420a758cfe4fd481b6dfca9545`
- Final tree: `aace5dbe66f68f8b7fdde1bd3936e7949970bd40`
- Reviewed 2026-10-04 UTC; tracked source remained clean.
- Retained earlier reviews: `review-dcc8a85.md` (full implementation/native/source)
  and `review-checker-6b6eb68.md` (complete rendered checker preflight).

## Final evidence verification

Inspected retained evidence only; launched no package, browser, or native jobs in
this final review. Verified all final command receipts have `passed`, terminal
exit 0, matching before/after clean source identity at the exact head, and matching
raw stdout/stderr bytes and SHA-256 values. Every declared source/runtime input hash
still matches its current file, including installed dependency lock, checker and
helpers, harness/configuration, and the Chrome Headless Shell binary.

- `check-final-6b6eb68.json`: PASS. `npm run check` completed TypeScript checking,
  all 997 tests (zero failures/skips/cancellations), parity structure validation,
  and 124 orchestration checks. The affected Balloon startup, signed payload,
  retained encoding-boundary, pending-checkpoint and transport regressions appear
  in the actual final test log.
- `build-final-6b6eb68.json`: PASS. All five production build phases completed.
  Retained warnings concern proxy configuration, plugin timing, chunk size, and
  static route classification; the result does not claim production deployment.
- `browser-command-6b6eb68-run01.json`: PASS, as do nested
  `rendered-6b6eb68-run01/receipt.json` and `result.json`. The nested source/result
  objects are identical to the outer hash-bound stdout. Before/after harness
  fingerprints agree, with no tracked/untracked source changes and `errors: []`.

The existing correspondence proof remains valid: runtime adapter, native probe,
transport source tests, both native exports and command descriptors are byte-identical
to accepted `dcc8a85`. Its independently rerun 126 native raw leaves and 1,152 real
configuration/position compositions therefore still support this unchanged code.
The tooling merge changes no runtime evidence input.

## Rendered functional finding

The accepted run used sandboxed Chrome Headless Shell `154.0.8037.92`,
ANGLE/Vulkan SwiftShader, 1440×1000 CSS pixels, DPR 1.

- A real mesh click accepted command 22 targeting the authored Balloon, craft 1.
  Ten explicit ticks boarded staged Spy 187 as first passenger/driver, with count 1,
  airborne true, selected Spy retained, and authored population retained.
- Clicking the actual Dakini disguise control accepted non-cancelled command 16,
  payload `[1, 0]`, destination `[1, 0]`, state 10 before ticks.
- The next turn reached state 30, disguise 127 and speed 0. After 63 further turns,
  disguise was 64; craft coordinates held at `[-19175, 14573]`, the Spy remained
  aboard, and the world remained playing with authored population retained.
- Clicking the actual Matak replacement control completed to state 30, disguise 255,
  on craft 1. No page/console errors were recorded.

Warnings were retained, not suppressed: automatic software-WebGL fallback deprecation,
ReadPixels GPU stalls and missing image-data texture warnings. The launch did not add
`--no-sandbox` or `--enable-unsafe-swiftshader`. This is software-rendered functional
UI evidence, not hardware performance evidence.

## Image inspection and claim limits

Personally inspected both original PNGs. `aboard-before.png` shows the Balloon,
mission viewport and boarding message. `aboard-after.png` shows the disguise controls
and preparation message, but framing is vertically shifted and most of the Balloon
is above the top edge. The images are two action states on the repaired staged build,
not a baseline-versus-fix pair. They do not establish matched framing, geometry,
Balloon visual disguise correctness or native pixel parity. The retained source
failure-first test establishes the old startup throw; functional state observations
and actual UI clicks establish this repair.

The bounded claim excludes ordinary Spy acquisition, natural campaign completion,
full vehicle lifecycle, cell/object command-position resolution, non-driver scheduling,
complete native-game execution and hardware performance. Pending-command checkpoint
continuation is source-covered. No parity credit is granted by this review.

## Cleanup and quality status

`terminal-release-6b6eb68.json` binds the final receipt hashes and records foreground
session 52843 terminal exit 0. The reviewed, parent-approved harness awaits browser
close and its owned server-process-group cleanup in `finally` before writing the
terminal receipt; the outer command then exited 0. The server log ends with
`Tunnel closed`. This satisfies the agreed harness-owned cleanup contract.
No independent post-run process/port census was captured or inferred; there is no
machine-wide idleness claim, and this review started no additional jobs.

Prior TypeScript quality findings remain explicit: changed runtime formatting and
scoped ESLint passed; all 18 scoped Oxlint diagnostics match exact-base code; the
full formatting failure names only two unchanged files. These legacy tool failures
are not relabeled passes. Final-head checker syntax/ESLint also passed. No added
abstraction, duplicated resolver, type defect or broad cleanup was introduced.

## Retained integrity anchors

- Aggregate receipt: `e5a9a9a9fa8b736092da1043a59097f6e31efb9aee6f9da6b9fe4cd45d510ab3`
- Build receipt: `6ddc4bf5ab3124d9504440d465834700503c662283b7611764dc4b84866e1033`
- Browser command receipt: `a0f6fe96d7f67c0b9cda73e209b38ee08574da80c64ee20cf6a0908ebf834646`
- Nested harness receipt: `8cd16e17fd7754ca5dddd232d3e0d770d6d6fa8e8bc1df471a46442b3be4b4e0`
- Scenario result: `0139797746f484d0b288ed9f630acc9be09dcc0758eb144fc74aa43032e8e52d`
- Before PNG: `29ee672b38218dfbd7918aa1dba2f15372453efd657d3b318a610fef76b415c9`
- After PNG: `ee5705f8699381e7bae049bac66047b4c9d2879a5c0b9a6adba645591c5f9b1e`
