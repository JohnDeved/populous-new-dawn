# Read-only producer fixtures

Exact source bytes from reviewed historical commit
`288207c72e8cabbfb7e4b4a5d13da5e7284907ab`, retained for portable synthetic tests of
`theme-reference-evidence.mjs`. These fixture modules are read as bytes only,
never imported or executed. They are not a browser harness installation.

- scenario.mjs: scripts/local-render/world-theme-switch.mjs
- witness.mjs: scripts/local-render/world-theme-witness.mjs
- harness.mjs: scripts/local-render/harness.mjs
- observer.mjs: scripts/local-render/checkpoint-observer.mjs

The helper pins all four SHA-256 values and checks their recorded Git blobs.
Tests create a temporary Git repository from these bytes and explicitly synthetic
receipts. Changing a producer fixture requires a reviewed mapping change; never
refresh fixtures merely to obtain a passing test. Actual raw pilot receipts remain
separate local evidence, not these synthetic fixtures.
