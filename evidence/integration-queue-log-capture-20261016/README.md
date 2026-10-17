# Captured Actions log transport

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-log-capture-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Tested source: `1637a692fb6d215e9f5f230e48d4a32b8daedf21`. Previous accepted source: `d5bac197da1f2be57a438b4800f42b6f9d4b2272`.

The retained read-only #505 observation passed stale-base refresh proof but stopped at job-log GET `repos/JohnDeved/populous-new-dawn/actions/jobs/117178077076/logs`: gh 2.101.0 rejected terminal escape sequences. Its exit code was 2, with null action, plan and execution. Journal UUID `00aed794-84e6-4b03-a94b-a2e46e3ffc90` and content were unchanged. These logs are before-change evidence, not a successful patched live observation. Parent owns cancellation of Full run 38967631933 and future readiness; this worker did not rerun or cancel workflows.

The repair passes `--allow-escape-sequences` only when capturing raw text from a fixed-repository numeric Actions job-log GET. JSON and other GETs retain their original argv. Child stdout/stderr use explicit pipes; GH_PAGER remains cat. Failed child diagnostics strip terminal controls. The Actions adapter retains the hash of the untouched captured log and parses a stripVTControlCharacters copy. Raw log content is absent from returned observations. Gate identities, stage requirements, draft guards, duplicate checkout rejection, writer permissions and #505 source remain unchanged.

Native reviewer supplied the boundary and official references: [gh api manual](https://cli.github.com/manual/gh_api), [GitHub CLI terminal escape advisory](https://github.com/cli/cli/security/advisories/GHSA-3m3g-3wcr-px46).

## Validation

All four receipts have unchanged before/after source snapshots and exit 0:

- `npm run test:focus -- tests/integration-queue.test.mjs`: **54 passed, 0 failed, 0 skipped**.
- Targeted ESLint: passed.
- Targeted Oxfmt check: passed.
- `npm run orchestration:check`: passed.

A subprocess regression invokes the production transport against a disposable fake gh executable that reproduces rejection without the escape flag. It emits ANSI and OSC sequences to both stdout/stderr and verifies successful capture without rendering, preserved raw hash, sanitized failing-child diagnostics and failure propagation. The full fake Actions adapter now returns colored identity/guard logs, preserves raw-versus-sanitized hash distinction, and still rejects conflicting source identities and duplicate checkout records. Endpoint tests reject nonnumeric, foreign-repository, query-appended and unrelated text requests before transport.

No patched live observation yet: independent review precedes that next read-only run. No full local suite, build, browser, original executable, deployment, credential/protection changes, or #505 effect/arming. Existing failed observations and journal are preserved. Manifest hashes bind source and raw evidence; JSON receipts embed original stdout/stderr.
