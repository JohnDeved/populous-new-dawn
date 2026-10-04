# Readiness observer lifecycle repair evidence

Candidate **8ef89e38fce059082419b8a86538132c28a8d417**, base `ab6e857553fd2a534bbe34b4ba600df8a40872ff`. Refs #194 / PR #196.

This is QA tooling only: two new exports in the existing browser helper, focused tests, and one short ordinary scenario. Existing helper behavior and production runtime remain unchanged. Each observation binds the current document, locally imports the existing pure readiness observer, and checks current connected scene/store identity after the await. Readiness polling awaits sequential samples from the host; no persistent readiness-function alias or asynchronous Playwright readiness predicate is used.

## Results

- **Passed:** actual sandboxed Chrome 154 ordinary lifecycle run, original foreground 9146, private 4364, 180-second outer cap. Both browser and outer receipts passed with unchanged source/inputs and browser errors `[]`. Source fingerprint and all warnings remain in [the raw browser receipt](browser-01/receipt.json).
- Initial Mission 3 observation was genuinely unready at turn 50 (input mask 64, native selection flag set), then ready at turn 62 through real RAF. Repeated reads kept the existing selection and current scene/store.
- Normal Settings paused at saved turn 122. Save checkpoint committed the exact turn/level/Blue identities. A real page reload erased old bindings; the public Load Game route reached ready Mission 3 at observed turn 152. No function alias was installed or assumed.
- Normal Settings → Select Level → All missions → Mission 2 replaced the actual scene and world. Initial sample was unready at turn 81; native input later released and Shaman 54 was ready at 328, actually selected by the portrait at 338. Repeated observation used the new world. Final ordinary Pause held Mission 2 at 364.
- **Passed:** exact-source `npm run check`, 963 tests passed, zero failed, plus typecheck/parity/orchestration validation. Original foreground 88119 terminated exit 0. Ten focused readiness/readback tests and syntax checks also passed.
- **Passed:** scoped ESLint for all three changed files, original foreground 8343 exit 0, no output/errors. `git diff --check` passed.
- **Carried, not rerun:** production build from immutable source `4170e24` / evidence `cfdf764`. [Build correspondence](build-correspondence.json) verifies all 13 production Git objects plus installed-lock SHA equality. The exact passed historical receipt and raw streams are retained and their hashes verified. No fresh-build claim is made.
- **Cleanup:** [final release](final-cleanup-release.json) records all three terminal sessions, connection-refused on 4364 and no matching owned runtime processes. Dependency directory inode 925630 moved with two-ended receipts and an unchanged installed lock; the source stub was preserved. The tree is released for its next owner.

## Failure-first and limits

The retained `failure-first.json` proves the new exported interface was absent before implementation; it is not a replay of the original missing-alias failure. `failure-first-test.mjs` was recovered byte-exact against that receipt's input SHA 9885c21fbe58af6148f39edf8e268665a5ad75a086a7563ed8bb8a5d719da52f. Four new portable tests mock page operations; existing pure-observer tests separately prove non-mutation. Actual callback/import/DOM/UI behavior is established by the rendered lifecycle scenario.

The original observed M2 victory and failed diagnostic continuation remain unchanged at [c94a819 evidence](https://github.com/JohnDeved/populous-new-dawn/blob/c94a8194efd721d47401c9f2d649e15729545dba/references/verification/mission-two-controls-2026-10-04/failure-analysis.md). This repair does not relabel that failed envelope. The short scenario uses a level selector, not a victory fixture, and does **not** replay M2→M3 Continue or complete any mission.

Renderer: sandboxed software ANGLE/SwiftShader, 1440×1000. This is functional checker evidence, not native timing/pixel equivalence, hardware performance or full mission parity. The helper's timeout is checked after awaited reads; the outer harness cap is the hard bound. Broader native/fixed-turn journeys selected by the shared-file planner mapping are explicitly unnecessary for the export-only change; source preflight accepts the scoped gates above.
