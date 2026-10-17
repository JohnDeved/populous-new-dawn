# Frontend asset readiness (#513)

Home prepares composition, normal/highlight/low fonts, logo, background, pointer
and frontend sliders alongside checkpoint restore. MainMenu and frontend Options
consume one settled session snapshot. Independent failures preserve healthy groups;
a named 10-second deadline freezes fallbacks and suppresses their pending CSS URLs.
Initial canvas drawing and Options shadow-row publication happen before paint.
GameScene, level loading, pause ownership and in-game asset loading are unchanged.

## Source and verification

- Accepted production base: `14a985b3f11c6efde862d9837596fe2e9ed0588b` (#510).
- Tested implementation: `7122a48291150fbb201fa59e5724b1d2a0289dd7`.
- Original evidence publication: `6cbc72c42c4a1a96f3443d6eb188fcec275518ac`.
- 73 focused tests across nine affected files, TypeScript, scoped formatting and
  new-helper strict lint passed. Scoped ESLint comparison found no new findings.
- Four actual-Home browser cases passed: healthy cold/warm, slider 404, normal-font
  404, and successful decodes arriving after the real deadline. Checks include
  first visible canvas sizing/content, stable Options text-shadow rows, keyboard
  use, return focus and no new relevant requests/decodes on warm reopen.
- Inherited MainMenu ref errors and page HUD-restoration/image lint findings remain.
  Scoped strict lint fails on the inherited MainMenu errors. Full check/build and
  any resource-policy refresh remain parent-owned integration work.

The browser fixture uses production Home through plain React/Vite and sandboxed
Chrome, excluding hosted Vinext/Cloudflare/RSC serving and hydration. Warm means
same-document resource reuse, not an HTTP-cache benchmark. No hardware-performance
or native-parity claim is made. Expected deliberate 404 errors and observation
warnings were retained; no unexpected page/console errors occurred.

## Reusable probes and local results

`run-probe.mjs` runs `scripts/local-render/frontend-prepared-assets.mjs` with
`POPULOUS_BROWSER` pointing to official Chrome Headless Shell,
`POPULOUS_PREPARED_OUTPUT` pointing to a fresh ignored `work/orchestration/` folder,
and `POPULOUS_PREPARED_MODE` set to `healthy`, `slider-failure`, `font-failure`, or
`late-success`. It uses port 4401 and an owned temporary browser profile. Serialize
browser runs. `lint-compare.mjs` retains the scoped baseline-comparison procedure.
The [prior baseline summary](../ui-preload-baseline-20261017/README.md) explains the
observed defect and links to its reusable runner.

Generated screenshots, reports, manifests and command logs are local review
outputs, not repository fixtures. They were untracked without changing their local
bytes. A hash-verified copy of both original evidence directories, including their
old summaries and source metadata, is retained outside this checkout under
`local-evidence/pr514-before-cleanup-20261017/`; raw ignored runs remain under
`work/orchestration/`. The local inventory records the pre-cleanup head and every
removed path/hash. Earlier commits remain intact; cleanup does not rewrite history
or change the tested implementation. No fresh runtime pass is implied by cleanup.
