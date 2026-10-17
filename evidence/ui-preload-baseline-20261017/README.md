# #513: observed frontend asset-loading baseline

This is a reproduction, not a fix. Production and public assets are byte-identical
to accepted #510 head `14a985b3f11c6efde862d9837596fe2e9ed0588b`; the isolated
branch adds only the diagnostic scenario/runner and evidence. It is separate from
accepted #511/#512. No timeout policy, production change or CI admission was added.

Final tested source: `75c4e9005ca163855f321ace54a9f71c83e116e7`.
[Final receipt](receipts/browser-2.json) ran from 2026-10-17T02:10:59.171Z to
02:11:03.007Z. [Full observations](attempt-2/baseline.json) bind network events,
forwarded native Image.decode calls, DOM mutations, independent animation-frame
samples, geometry, focus and supplemental LayoutShift entries. [Source hashes and
actual supplied launch options](attempt-2/source.json) include the added owned
user-data-dir argument. The first capture at `98df3266a765cd29241cdcddeaf548df56ef7a7b`
also passed its defect-observation assertions; it lacked a separate deduplicated
animation-frame stream. Both captures and all screenshots are retained.

## Concrete observations

1. **Main menu is presented before its images/data.** First recorded open-menu
   animation frame at page time 2214.20ms had no loading screen, ten fallback
   labels/title, and a transparent canvas corner. Viewport was 1280×800 DPR1;
   canvas was already correctly sized 768×480 logical pixels / 1280×800 CSS pixels.
   This episode does not demonstrate a viewport sizing defect.
2. The held frontend requests were observed at runner-relative 2217ms. Main menu
   was usable while they were pending. [Initial screenshot](attempt-2/01-first-menu-held.png)
   shows plain background/text. Logo/background release was 2645ms and composition
   release 2763ms; [final menu](attempt-2/08-main-ready.png) shows restored artwork.
   These two changes are distinct: foreground/logo/static image can be ready while
   the composition canvas is still transparent. Runner and page clocks are
   separately labeled; do not subtract between them.
3. **Immediate Options visibly uses fallback type and sliders.**
   [First Options](attempt-2/02-immediate-options-held.png) has nine fallback labels.
   After opening Sound, the Back text changes from x604.19/y760, 71.59×36.67 CSS
   pixels to x586.67/y756.67, 106.67×46.67 when fonts decode. The outer button stays
   x521.67/y756.67, 236.67×43.33. This is visible text/geometry change despite a
   fixed control box. Compare [held](attempt-2/03-sound-held.png) and
   [fonts ready, sliders held](attempt-2/04-fonts-ready-sliders-held.png).
4. **#508's independence works and does not prewarm.** Releasing only fonts makes
   all Options bitmap labels ready while sliderReady remains false. Releasing
   sliders later enables their artwork. The first slider requests occur only on
   Options opening (2305–2306ms runner-relative), not during startup loading.
   This is delayed-success evidence, not a new failure-isolation test.
5. **Warm reopen still resets readiness without new downloads.** All nine gated
   URLs were requested once during the episode; no original asset requests were
   added on reopening. Routing was removed before that reopen. Six native decode
   calls repeat at page time 2948.9ms and resolve at 2951.9ms. Options mounting
   records fallbackCount=9/sliderReady=false at 2951.8ms. Independent animation
   frame 175 at 2963.7ms still samples those fallback states; frame 176 at 2980.4ms
   samples bitmap labels/sliders. Cached network resources are insufficient.
6. **Shadow publication is later than foreground readiness.** On warm reopen the
   row139 canvas hash is `4e059302` during fallback. A mutation sample at 2967.1ms
   records bitmap foreground with that same hash; the following animation frame
   has `ee09a376`. Thus DOM/foreground readiness and shadow/canvas update are not
   atomic. This does not independently prove an extra shadowless *painted* frame:
   the intermediate observation is a MutationObserver callback, not a screenshot.
   Hashes cover a fixed 480×28 canvas region and are FNV observation signatures,
   not full-image cryptographic parity or identification of each shadow glyph.
7. Initial main focus is New Game; Options initially focuses Back. Selecting Sound
   focuses its active-category span. Back restores Options focus in the main menu.
   These observed routes remain usable during pending asset groups.

LayoutShift entries are retained, including entries with recent input. We do not
reduce these to a CLS score or treat absence of shifts as absence of visual pops.
Screenshots document deliberately held cold states; warm-transition screenshots
show the settled result, supplemented by the frame and mutation records above.

## Minimum repair boundary established by this baseline

- Prepare and settle frontend fonts, logo/static background and composition during
  existing startup loading, then reveal with the first correctly sized canvas
  already drawn. Normal/highlight/low glyphs must be available for first Options.
- Frontend slider images must load during that boundary, not on Options opening.
- Options must consume synchronous settled readiness on initial render/reopen;
  repeated native decode or HTTP-cache reuse alone cannot prevent the reset.
- Initial Options shadow-row/canvas publication must be coordinated with its
  foreground; a passive callback after foreground reveal is insufficient as a
  readiness contract even though an extra painted gap is not proved here.
- A stable-fallback policy must suppress pending/failed CSS image URLs as well as
  freeze JS readiness; otherwise background/pointer CSS may change independently.
  Cursor visual timing was not captured by this screenshot probe and remains a
  source-based concern. No 8-second or other product timeout was implemented.
- Preserve independent font/slider outcomes. A future in-game boundary belongs
  before GameScene.start and must retain existing world/disposal/pause/no-catchup
  safeguards. This frontend-only probe did not start a mission or retest clocks.

## Runtime, bounded scope and cleanup

Actual Home/CSS/assets mounted through plain React/Vite, official sandboxed Chrome
Headless Shell 153.0.8010.12, Node24.18.0/macOS arm64, owned port4401 and unique
owned profile. Excludes Vinext/Cloudflare/RSC serving/hydration and hardware
performance. Response gates use real bytes and explicit release, not a claimed
network-throttle profile. Fresh browser contexts establish empty document storage
and no prior browser session; routing disables HTTP cache while installed. The
reopen is same-document loaded-resource reuse, not a general HTTP-cache benchmark.

Both runs have zero page/console errors. The observer's getImageData calls cause
one Canvas2D readback-performance warning, retained in each report. No screenshot
or timing is a hardware performance measurement. No app readiness/world mutation,
original executable, full local suite, production build or new policy was used.
Scoped ESLint passed at final tested source. Source/product hashes were unchanged
after each run. Awaited cleanup closed context/browser/server and removed only the
owned temporary profile. Heavy browser slot released. Weekly usage last measured19%.

The manifest binds raw and portable hashes; absolute paths are redacted in the
published packet. Original raw artifacts remain under
work/orchestration/ui-preload-baseline. This publication adds evidence only after
the final tested source; the baseline is ready for parent/design review, not a fix
or readiness/merge claim.

```sh
POPULOUS_BROWSER=/path/to/official/chrome-headless-shell \
POPULOUS_UI_PRELOAD_OUTPUT=work/orchestration/ui-preload-baseline/fresh-attempt \
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/ui-preload-baseline/fresh-attempt.json \
  --input node_modules/.package-lock.json \
  -- node evidence/ui-preload-baseline-20261017/run-probe.mjs
```
