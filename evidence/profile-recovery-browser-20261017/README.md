# Real IndexedDB recovery browser coverage (#512)

This restores a reusable browser scenario for nine recovery cases. The production
repair from #147 already exists; this branch changes no application code.

## Accepted source and verification

- Production base: `b77aa038914196781e717c4436659fffeeec24f2`.
- Retained #342 scenario source: `f76625792649edfee519a68c584d4cb97b7f763a`.
- Final nine-case browser source: `2e8faef403b9b78cd93eeb1803c3b5bf8967a6d8`.
- Accepted publication: `0700b9cc66a86270c6fefd1d01222f9615e5dc8d`.

The final browser matrix passed: empty database; profile with missing, malformed,
partially migratable or incompatible latest checkpoint; valid current checkpoint;
missing-drawMode migration; ordinary Start/Save/page-reload/Load; and usable session
checkpoint alongside malformed persistent latest. Each uses a fresh context and
real IndexedDB. Seeded cases are diagnostic fixtures in the scenario source;
ordinary Save/Load uses public UI without seeded records. No scenario fixture is
removed by the generated-output cleanup.

The corrected partial-migration fixture converts typed-array cell heads before
missing units causes failure; its full stored-record digest stays unchanged.
Public Load checks selected saved fields and actor/terrain/stock hashes at the
replacement boundary. The session case preserves active world identity/turn,
merges completion and performs no storage writes. These are bounded checks, not
full loaded-world equality, native-save compatibility or naturally earned progress.
Page reload in one context is not browser-process restart. The observer supplies
its version wrapper; that wrapper is not independent version evidence.

28 focused tests passed; subsequent repairs changed only the probe. Final scoped
ESLint and earlier structure checks passed. Earlier attempts retain a canvas-selector
failure, an introduction-button timing failure and the superseded partial-migration
fixture. The final run passed all nine cases with no page/console errors. Software
WebGL, GPU readback and Three missing-image warnings remain. Actual Home/store/scene
runs through plain React/Vite, excluding hosted serving/hydration, native parity
and hardware performance. Full suites/build remain parent-owned hosted gates.

## Reusable probe and local outputs

`run-probe.mjs` runs `scripts/local-render/campaign-profile-recovery.mjs` on port
4400. Set `POPULOUS_BROWSER` to official Chrome Headless Shell and
`POPULOUS_PROFILE_RECOVERY_OUTPUT` to a fresh ignored `work/orchestration/` folder.
Serialize browser work and use the command-receipt wrapper for local run results.
The runner adds an owned temporary profile argument; earlier metadata does not
exhaustively describe its launch arguments or platform behavior.

[Historical evidence and full acceptance notes](https://github.com/JohnDeved/populous-new-dawn/tree/0700b9cc66a86270c6fefd1d01222f9615e5dc8d/evidence/profile-recovery-browser-20261017)
remain available at the accepted commit. The 52 generated screenshots/reports/
logs/receipts/manifest were untracked while preserving local bytes. The original
README/probe, outputs, hashes and removal inventory are archived outside the
checkout under `local-evidence/pr512-before-cleanup-20261017/`; raw ignored runs
remain local. Cleanup leaves every accepted application/test/probe byte and prior
commit unchanged. No new runtime pass is implied. Shared ignore policy belongs to
root's cleanup worker.
