# Built-worker UI asset diagnostic (proposed, not executed)

This is a separate verification-only candidate for #513/#457. The current
`tutorial-browser/run.mjs` and `build-home.mjs` serve a plain React/Vite fixture;
they do not exercise the configured Vinext/RSC/worker entry. This runner instead
requires `npm run build`, serves its generated `dist/server/wrangler.json` with
local Wrangler/workerd on a GitHub Ubuntu runner, and launches the existing
approved official Chrome configuration with its sandbox enabled. It never
deploys, changes app code, uses a user computer, or falls back to unsafe flags.

The proposed workflow runs only on explicit ready-for-review transition of a PR
changing this diagnostic/workflow. Root must review/admit it before publication
or execution. No CI result or rendered finding is claimed by this candidate.

## Scope and bounds

- Exact GitHub proposed-merge checkout, clean tracked source, full tracked input
  hashes before/after, locked dependencies, browser hash/version and run identity.
- Standard current `npm run build` (10-minute step cap), then local worker on
  127.0.0.1:5199. Worker HTML is recorded by status, bytes and SHA256.
- One browser, fresh 1280×800 DPR1 context per case, service workers blocked and
  response routing disabling cache. This is cold-context asset readiness, not an
  HTTP-cache benchmark. Same-document reopening is checked separately.
- Reuse unchanged assertions from frontend prepared-assets (healthy, font 404,
  slider 404, native timeout/late success) and in-game prepared-assets (healthy,
  font 404, slider 404, late font, late sliders). Only report serving-description
  metadata is parameterized; assertions and original 10-second timeout stay intact.
- One separate public Mission 1 building-palette baseline case captures normal,
  hover, selected Hut and locked-button input, plus bounds/border/atlas data. It
  does not change artwork or classify content-box intrusion as a visual defect.
- One public contextual-help case checks Missions 1/2/19 at standard/wide/high-DPI
  sizes, four captures max and an 85-second bound. This requires integration of
  reviewed help runtime successor `a7535cfa`; it deliberately fails on the old
  generic help. Runtime changes are not copied into this diagnostic-only branch.
- Retain response/decode observations, first animation-frame states, text/shadow
  and geometry checks, keyboard behavior, actual mission/pause/Options navigation,
  modal freeze/resume, and screenshots. A failure remains failed, not waived.
- Worker readiness 60 seconds; each case 90 seconds; runner 7 minutes; external
  kill-after bound 8 minutes; workflow 20 minutes. Server log retained at 2 MiB;
  report/screenshots checked against a combined 128 MiB limit. Artifacts retained
  for 7 days. Source mutation fails the diagnostic.

## Limits

Local workerd on a GitHub runner exercises the built worker/RSC route, not deployed
Cloudflare edge/CDN behavior. Source readiness is already implemented and tested;
this does not justify another loader rewrite. Software/headless rendering does not
establish hardware performance or native-game parity. Asset readiness and palette geometry are initially only 1280×800 DPR1; the
separate help case covers 1024×768 DPR1, 1920×1080 DPR1, and 1280×800 DPR2.
This is not all-surface standard-aspect/high-DPI acceptance.
