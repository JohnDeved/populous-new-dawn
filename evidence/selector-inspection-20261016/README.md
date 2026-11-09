# Actual-Home selector inspection browser evidence

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Passed on tested code commit `e8e2dea065155cd509fe6cf17339214caabe292f`, base
`c9e3cbc8003be7c9b3fc489d794297679476d2b9`. This evidence publication is a later
evidence-only commit; the tested application, scenario and dependency inputs are
unchanged. Refs #17 and PR #492. Full issue acceptance and ready-PR CI remain separate.

The existing runner completed in **21.169 seconds**, including its production Vite
build and browser scenarios, below the unchanged 180-second browser cap. The outer
command took 22.658 seconds. Build exit 0, timeout false; browser run exit 0.
Google Chrome 155.0.8059.80 on macOS used the verified installed executable through
`POPULOUS_BROWSER`, with `chromiumSandbox: true` and the existing safe arguments.

```sh
POPULOUS_BROWSER='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npm run orchestration:receipt -- \
  --output work/orchestration/selector-inspection/browser-e8e2dea0.json -- \
  node scripts/tutorial-browser/run.mjs outputs/tutorial-browser-e8e2dea0
```

All five existing Tutorial groups passed. The added scenario followed New Game →
recommendation No → Start Mission 1 → Skip introduction, then Game settings →
Options → Browser compatibility and help → Select Level. Browser controls' Inspect
campaign world selected Mission 2 without launching it. Both initial pause policies
passed Back, Escape, Continue Game, and a second Escape from the returned pause menu.

The original store world, scene, scene.world, canvas and captured menu session were
retained during inspection. Level/turn/time stayed frozen, pause and modal suspension
were true, and no disposal, terrain abort, removed canvas or loading replacement was
observed. The initially paused episode remained at turn 101 / time 8.416666666666666;
the initially running episode resumed and reached turn 103 / time 8.583333333333334.
Runtime/console errors and warnings were empty. Selector teardown recorded successful
observer disconnect and context close with no late errors.

- [Terminal selector assertions](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/review-bundle/receipts/outputs/tutorial-browser-e8e2dea0/selector-inspection.json)
- [Full source/dependency/browser receipt](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/review-bundle/receipts/outputs/tutorial-browser-e8e2dea0/receipt.json)
- [Command receipt](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/review-bundle/receipts/work/orchestration/selector-inspection/browser-e8e2dea0.json)
- [Existing Tutorial groups](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/review-bundle/receipts/outputs/tutorial-browser-e8e2dea0/progress.json)
- [Build log](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/review-bundle/receipts/outputs/tutorial-browser-e8e2dea0/build.log)
- [All seven screenshot hashes](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/screenshots.json)
- [Portable review bundle and exact identities](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/review-bundle/manifest.json)

The portable bundle verified six changed source identities and eight receipts against
caller-pinned hashes. It redacts source-root/home paths and retains both original and
published receipt hashes. Diff SHA-256:
`938cc9734efbbab48e80299202febbde7c5597ded04a4764d8793c074d63521f`.
Source inputs were identical after the run; dependency changes were empty and both
metadata fingerprints were
`e2301c197db58000d6b96a2b1624abcddc36dbdce79909d823ed1b11138dd71e`.

The runner recorded cleanup success. Follow-up process inspection found no remaining
task runner or browser process, and port 5198 had no listener. The Mac browser lane
was released. No full local suite or merge was run.

These screenshots show the Mission 2 inspection panel at 960×720 in the two episodes;
their pixels alone do not establish object identity, which is covered by the retained
assertions. Both selector screenshots were visually inspected for readable controls.

![Initially paused Mission 1 inspecting Mission 2](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/screenshots/selector-inspection-paused.png)

![Initially running Mission 1 inspecting Mission 2](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/selector-inspection-20261016/screenshots/selector-inspection-running.png)

Limits: actual production Home through plain Vite excludes Vinext/Cloudflare/RSC
hosting. This is browser regression evidence, with no new native campaign rules,
original-executable equivalence or hardware performance claim. Full ready-PR gates
and independent review remain required before merge.
