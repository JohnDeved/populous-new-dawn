# Integration driver main refresh

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-main-refresh-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Approved prior head: `7c5f375c66bd20e84d794a12a5409e21edcc8699`.
Exact approved main: `52aacab7e17a12090b9158649b373427d439f234`.
Tested merge: `3b7a7152bc8c230bcd91f1df1dcb793b4b03040c`.
Merge tree: `7eb0ebe80577bf811b35c7877bc24dd2daa7d36e`.

The ordinary two-parent merge completed without conflicts, preserving parents
`[approved prior head, approved main]`. Its tree equals the independently predicted
`git merge-tree --write-tree` result. All approved integration driver files and its
tests are byte-for-byte unchanged. Both workflows and `engineering/test-resources.json`
are identical to approved main. No source feature or policy adjustment was made.

[Refresh proof](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-main-refresh-20261016/refresh-proof.json) records these checks, exact identities, resource
policy digest and the complete tested diff path list against main. The non-evidence
PR diff consists only of six integration-queue files and its focused test file.

## Focused validation

All six source-bound receipts passed with exit 0 on the tested merge:

- `node --test tests/integration-queue.test.mjs tests/test-runner.test.mjs tests/workflow-policy.test.mjs`:
  **81 passed**, zero failures/skips (49 queue, 12 runner, 20 workflow-policy tests).
- Targeted ESLint and Oxfmt checks on six maintained JavaScript files.
- Structural orchestration check and `git diff --check`.
- Exported resource preflight: 451 files, concurrency 1,
  `production-config-runtime-drift` on this Mac. Inherited policy remains intact.

No full local suite, build, browser, ready transition or live driver action ran.
The PR stays draft pending refreshed-head review and separately authorized hosted
Full validation. Prior hosted evidence for main is not claimed as validation of
this refreshed PR candidate.

## Artifacts

[Source manifest](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-main-refresh-20261016/source-manifest.json) binds 13 source/input files.
[Artifact index](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-main-refresh-20261016/artifact-index.json) binds 18 receipts/logs with original and
published hashes. Repository and temporary paths are redacted. Original receipts
remain in ignored `work/orchestration/integration-queue-main-refresh/`.

- Artifact index SHA-256: `529a2764ba6cf6c418aecedca4fcd502ff7638b9c7a96c2e575eefa2f510e59e`
- Source manifest SHA-256: `a2d669feef94fbf5b6214a6663ce5d5ea2c24173c1043d5585a172d0822bbbb5`
