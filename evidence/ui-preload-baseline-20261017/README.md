# Frontend asset-loading baseline (#513)

Production base: accepted #510 `14a985b3f11c6efde862d9837596fe2e9ed0588b`.
Final baseline probe source: `75c4e9005ca163855f321ace54a9f71c83e116e7`.
Original baseline publication: `ce76881944c446c0aa9fab5005323e3b05c12de5`.

The actual Home baseline showed MainMenu before images/composition settled, with
ten fallback labels/title and a transparent canvas. Immediate Options showed
fallback text and sliders. Back text changed from 71.59×36.67 to 106.67×46.67 CSS
pixels despite an unchanged outer button. Independent font/slider readiness worked,
but slider requests began only when Options opened.

Warm reopening added no image requests yet repeated six decode calls and showed
nine fallback labels/unready sliders in an animation-frame sample. Foreground
readiness and shadow-row publication also changed in separate observations; this
alone does not prove an extra painted shadowless frame. The initial canvas was
already correctly sized, so this baseline does not establish a viewport-size defect.

Both captures passed their baseline-observation assertions. The final run lasted
3.836 seconds on sandboxed Chrome at 1280×800 DPR 1 through plain React/Vite.
It excludes hosted serving/hydration, gameplay clocks and hardware/native parity.
Response gates are diagnostics, not a network profile. Warm means same-document
reuse after removing routing. One Canvas2D readback warning occurred per run;
there were no page/console errors.

`run-probe.mjs` and `scripts/local-render/ui-preload-baseline.mjs` remain reusable
source. Set `POPULOUS_BROWSER` to official Chrome Headless Shell and
`POPULOUS_UI_PRELOAD_OUTPUT` to a fresh ignored `work/orchestration/` folder. The
runner uses port 4401; serialize it with other browser work. It is a defect probe
for the stated baseline and is expected to differ on the repaired implementation.

Screenshots, observation JSON, manifests and run logs are generated outputs rather
than fixtures. Their local bytes remain intact after untracking, with a verified
outside-checkout archive at `local-evidence/pr514-before-cleanup-20261017/` and raw
ignored runs under `work/orchestration/`. The archive retains original documentation,
source fingerprints and artifact manifests. Earlier Git history is unchanged.
See the [implementation summary](../frontend-prepared-assets-20261017/README.md)
for the subsequent frontend-only repair and its validation limits.
