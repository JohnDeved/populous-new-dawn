# Independent fb12687 evidence review: owned game checkpoint profiles

**Historical reviewed acceptance; superseded by the narrow final error-path review at 7625708.**

**ACCEPT** at `fb12687d2bbad9bd817f12d8cda63209626a8f11`, relative to accepted main `d32a184`.

No blocking source or evidence findings remain. Source review, real restart proof, aggregate checks, build correspondence, and scoped lint attribution have been independently inspected. The scoped ESLint command failed; it is not reported as a pass. Its two introduced diagnostics are verified false positives, detailed below.

## Source correspondence

The complete feature diff against d32a184 is the same eight files reviewed at d9f518e: 659 additions, 13 deletions. Their bytes are identical. The normal merge d9f518e+d32a184 adds only the two already accepted Mission 4 checker/test paths relative to d9f518e; this entire merge delta was inspected. No application, production input, deployment config, or M3 driver is changed by this feature. Clean tracked/untracked working tree and diff --check verified.

The prior independent review and 13-case exact-production fault probes remain applicable because all harness/profile/scenario/test bytes are unchanged. Source preflight review: `../owned-profile-review-69e3e33/REVIEW-d9f518e.md`. Initial defects and their reproduced failures remain retained there. The repairs prevent checkpoint mismatch adoption, digest collisions, symlink source drift, unbound external scenarios, and callback diagnostic exceptions. The implementation remains one bounded opt-in game profile with no recovery mechanism.

## Real two-invocation proof

Both source-bound command receipts are passed with exit 0. Save ran 20:40:42–20:41:24 UTC; Load began later at 20:41:48 and finished 20:42:16. Both use exact clean fb12687 source fingerprint `6ce19a4a842c83c014f2f87fbce035d34250701d31f533ed9061e23b2075adde`, identical scenario/runtime/application/checker hashes, and origin `http://127.0.0.1:4371`.

- First run created profile `d52cd650-d928-48ea-b22e-2cb229757cb2`, entered Mission 1 through ordinary controls, awaited actual Shaman readiness, opened Game settings and clicked Save checkpoint. Readonly IDB observation awaited transaction completion at turn 121, time 10.083333333333334.
- Terminal context/browser close completed, with cleanup and continuation verified. Second invocation reused the same profile with a distinct run ID and a previousRun receipt hash that matches the first retained receipt's actual bytes.
- Fresh startup read the same checkpoint. Shipped Load restored exactly the saved full-record, actor, terrain and stock digests at the synchronous world replacement boundary, including level, turn and time. Full checkpoint digest: `2f0cccb69a1b02201ce15c03d59d991ab441ca683beccc92f21e0ed0b9884174`.
- Shipped Load normally resumed play; the first later observation was turn 137, paused=false. The ordinary Pause action then produced the loaded screenshot. Load did not overwrite the stored save.
- The final scoped profile manifest correctly names and hashes the load receipt and unchanged committed checkpoint. The owner lock and three browser Singleton markers are absent. Only bounded manifest metadata and marker existence were inspected; private browser data was not read/exported.

Both genuine 1440×1000 PNGs were visually inspected: `save/saved-settings.png` shows the settings/Save controls and 00:10 clock; `load/loaded-paused.png` shows the rendered Mission 1 world and WORLD PAUSED overlay. The image hashes and all source/runtime/scenario/browser/receipt/raw-log checks are recorded in `independent-restart-review.json`.

Browser: official Headless Shell 154.0.8037.92, binary SHA-256 `7c141b276aacc74fe51f06986345fb0dbce0e3756413746fb18541b878c17706`; sandbox enabled, Playwright defaults disabled, explicit pipe and owned user-data-dir, blocked external origin requests/service workers/downloads. Zero browser errors. Retained warnings include software WebGL fallback, ReadPixels stalls, and texture-not-ready warnings. Renderer string was not sampled. This is normal browser-restart checkpoint evidence only, with no cloud-reset, hardware performance, campaign completion, or visual-parity claim.

## Gates and attribution

- `full-check.json`: fresh exact-fb12687 `npm run check` passed, including typecheck, all 1,038 tests, parity check and orchestration structural check. Exact before/after source and installed-lock fingerprint match. Raw stdout/stderr hashes independently verified.
- `scoped-eslint.json`: terminal exit 1 with three diagnostics. `harness.mjs:111 no-empty` is inherited from original base f78e5c1 line72. Introduced `no-unsafe-finally` at lines197 and211 is nonblocking: each throw is caught immediately by its enclosing inner catch, which assigns the failed outcome; neither throw escapes the outer finally or bypasses terminal receipt writing. The installed ESLint rule simply scans ancestors to an outer finally and lacks an inner try/catch sentinel. Independent production-function fault cases cover still-connected browser and runtime drift and verify failed receipt/retained lock. No rule or code was weakened to hide these diagnostics. Raw receipt/log hashes and attribution are in `../owned-profile-error-path/independent-gate-verification.json`.
- Build is **carried, not rerun**: original passed build at `6b6eb684f4f010420a758cfe4fd481b6dfca9545` has matching raw streams and source-stable receipt. Independently verified all 13 production Git objects and root/installed dependency locks are identical to fb12687. All later changes are QA harness/tests/docs only. See `independent-build-review.json` and `build-correspondence.json`.
- Maintained TypeScript style checks are non-applicable to this feature's MJS/docs-only diff. No hardware performance gate is implied.

## Safe handoff

Publish only the bounded receipts, review, command logs and genuine screenshots as needed. Do not commit/upload/archive the profile/browser data. M3's stricter exact-full-source boundary remains intact even though the general harness permits explicit reviewed checker correspondence. M3 owner already received the stable receipt/observeCheckpoint schema and the named-default-export scenario contract.
