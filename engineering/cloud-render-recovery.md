# Restoring cloud rendered QA after a workspace reset

Use the existing `scripts/local-render/harness.mjs` and `engineering/local-render-harness.md`. No application runtime change is needed. This setup is separate from the provisioned cloud Chrome/CDP browser, and failure there is not evidence that Headless Shell cannot render.

## Known-good, verified 2026-10-14

- Official Chrome Headless Shell: 154.0.8037.92, linux64.
- Official metadata: https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json
- Metadata-matched archive: https://storage.googleapis.com/chrome-for-testing-public/154.0.8037.92/linux64/chrome-headless-shell-linux64.zip
- Observed archive SHA-256: 636aa5c79f2693632e9921b8bbb050038ba11672e02346c06c20f991aed096f9
- Observed executable SHA-256: 7c141b276aacc74fe51f06986345fb0dbce0e3756413746fb18541b878c17706

These are measured reproducibility hashes from the official HTTPS download, not separately signed publisher checksums. Keep them with the metadata entry and provenance receipt in durable version control. Do not commit downloaded binaries/browser profiles.

## Reset recovery contract

1. Check whether the recorded executable still exists. Run `--version`; hash it and compare with the recorded receipt. Do not silently substitute the desktop Chromium wrapper.
2. If missing, restore only under user authorization for official browser dependency installation. Retrieve official metadata and require an exact version/platform match. Download the URL supplied by that entry; verify the archive hash before extraction, reject absolute/traversal/symlink archive entries, then verify the executable hash. Keep the sandbox enabled. If metadata, version or bytes differ, stop and investigate instead of treating a different binary as the same test environment.
3. Use a new task-owned installation directory. Never change an existing personal/system browser profile, security setting or package defaults. No `--no-sandbox`, unsafe SwiftShader opt-in, GPU sandbox disabling, or arbitrary launch flags.
4. Smoke-check the browser with the repository launch contract: `headless: true`, `chromiumSandbox: true`, `ignoreDefaultArgs: true`, `args: ['--remote-debugging-pipe']`. Confirm WebGL2 and collect the renderer string. Then run an actual Mission 1 capture through the harness. Inspect the PNG, exact commit/tree/source fingerprints and final cleanup outcome.
5. Supply the absolute executable as `--browser` (or POPULOUS_BROWSER); do not depend on a volatile old recovery path. Use a fresh ignored output directory and an unused allowed loopback port, serialize graphics captures with performance work, and retain failures honestly.

## Current-main startup command

```
node scripts/local-render/harness.mjs --game-root "$PWD" \
  --browser /absolute/verified/chrome-headless-shell \
  --port 4389 --mission 1 --output "$PWD/work/render-smoke-unique" --timeout 120000
```

Verified current main 758fcb84d64f55670b3a407183ec94e5a4929b46: actual Mission 1 turn125/playing, real RAF, WebGL2/ANGLE SwiftShader, 1440x1000 capture. This proves rendered startup only, not campaign completion or persistence.

## Persistence boundary

The existing owned-profile harness supports actual browser restart, not survival of deleted cloud storage. It requires a unique marked profile, the same exact loopback origin and game/runtime inputs, separate run outputs, and successful browser cleanup before reuse. Never clear live/stale/unknown locks automatically. Save through visible UI and inspect committed IndexedDB; load via public startup Load Game and observe the replacement boundary before normal auto-resume. A direct CPU store fixture is not browser-persistence evidence. Profiles must never be committed, uploaded or exported.

The profile and binary will be lost if the workspace is reset. Durable source, setup instructions and evidence receipts make restoration reproducible; they do not preserve that old private save. A fresh post-reset checkpoint journey must begin from authored startup unless a separately authorized supported game-save transfer exists.
