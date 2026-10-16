# PR495 main integration

Tested merge: 28343293a919180cc0a18f8dc9151dece2fb8881, parents 5314bd846ca8f25104734641d9b4f75a0c6b1c0a and f85a8105fd77c71547fe5cd01594d3467c47b098. This later publication contains evidence only.

The only conflict was productionSha256 in engineering/test-resources.json. Recomputed with productionFingerprint() from scripts/orchestration/test-runner.mjs against the combined tree and installed dependencies: 61028d22fe5086614d5e277821c5526df7ecd0cf11b182da494c4622d7f5befc. Runtime: Node24.18.0, darwin arm64. Neither previous hash was retained. No helper or per-test classification changed. The FPS implementation and tests equal the original PR head byte for byte; the merged pause menu equals main.

Passed with stable source/input fingerprints: 13 FPS/frame tests, six pause-save-notice tests, targeted ESLint, oxfmt and oxlint, 135 orchestration structural checks. The pause command also includes the existing pause-menu assertion script, which exits successfully without reporting node:test cases. The resource runner was planned only (364 C2,81 serial on this exact Mac runtime); no full suite ran. Hosted Linux runtime/installed dependency differences safely fall back to serial unless matching a separately reviewed fingerprint.

No browser, build, full local suite, original executable, readiness change, or PR merge. Root owns fresh review and hosted Full CI after PR494.

The portable review bundle contains seven source identities and seven raw receipts, with only source-root path redactions. Its verifier passed against the caller-pinned identities. Diff SHA-256: f7c375aa8bb00854c4ef440036b067d9f275af995125a217f316f4ed452a5476.
