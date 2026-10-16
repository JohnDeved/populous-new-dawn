# Stale advertised base: refresh-only admission

Tested source: `6b97054be7b37429d227a1f494f15b3fc40c2a9f` on base `e3d3659793b70f6ec82cf09f9704041e2b662ff5`.

The accepted driver stopped correctly when PR #505 advertised base `52aacab7e17a12090b9158649b373427d439f234` while authoritative main was `e3d3659793b70f6ec82cf09f9704041e2b662ff5`. The retained live CLI output is **before-change evidence only**, captured by driver `8ba665e391fdc9d3b05eb32137be30753d7d527c`; action, plan and execution were null. The patched driver has not been run against #505 and no live effect was attempted.

[GitHub's February 19, 2026 notice](https://github.blog/changelog/2026-02-19-changes-to-test-merge-commit-generation-for-pull-requests/) explains that synthetic commits regenerate on PR branch pushes, merge-base changes, or after twelve hours. Viewing the PR no longer triggers regeneration. The accompanying stale PR `base.sha` is our observed condition, not a guarantee from that notice.

The narrow exception requires the original reviewed draft head/tree, advertised base equal to its reviewed base, actual main descended from that base, behind mergeability, and a clean disjoint deterministic merge-tree proof. Observations retain advertised base SHA/ref/repository and authoritative main; both must remain stable across the read. Old synthetic parents must match the reviewed base/source. Its identity is retained separately, cannot verify current gates, and participates in the stable-window fingerprint. Existing run draining, review, protection, workflow, fresh-writer observation, plan binding, expected-head CAS, one-refresh bound and post-effect reconciliation remain intact. After refresh the original-head exception cannot apply; current advertised base and synthetic/preflight/gates are required for ready/merge.

## Validation

All four JSON receipts retain exact commands, before/after source identity, exit code and raw stdout/stderr with hashes. `manifest.json` binds source and evidence bytes.

- `npm run test:focus -- tests/integration-queue.test.mjs`: **52 passed, 0 failed, 0 skipped**, file isolation and concurrency 1.
- Targeted ESLint: passed.
- Targeted Oxfmt check: passed.
- `npm run orchestration:check`: passed.

The new regression uses real disposable Git commits and merge-tree with a fake read-only GitHub adapter. It verifies stale draft → stable-window refresh; old successful runs do not authorize ready/merge; active runs still drain; changed stale identity resets quiet time; nonancestor main/base, unknown/refreshed head, source-tree drift, disabled refresh, overlap, unknown mergeability, wrong synthetic parents, and changing main/base SHA/ref/repository/head stop. A real Actions-adapter regression also verifies that absent current synthetic never yields `identityVerified`.

No local full suite, build, browser, original executable, deployment, protection change, or live #505 mutation. Full hosted validation and independent review remain required. This is tooling correctness evidence, not gameplay parity or hardware performance evidence. The accepted driver checkout and #505 source are untouched.
