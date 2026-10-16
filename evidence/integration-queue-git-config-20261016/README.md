# Hosted inherited Git configuration repair

Tested repair: `eeec329f9dc6455713fd2e40927046adad83a4ee`.
Prior accepted/failed-gate head: `ad9043fd6ca0b0a35f31b93227148a42d60bb3e4`.
Only `tests/integration-queue.test.mjs` changes outside this evidence directory.
Production reader/guard/writer, workflows and resource policy are byte-for-byte unchanged.

## Failure and diagnosis

[Full run 38960740277](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38960740277)
failed at the three temporary-repository tests: real merge-tree proof, resource
preflight, and CLI fixture. The first/third reported custom Git merge/filter-driver
rejection; preflight returned blocked. The gate completed all 451 files and 3,008
cases: 3,005 passed, three failed, zero skipped. Production build was skipped.
The real Linux resource plan remained reviewed (362 C2 / 89 C1), not a resource-policy failure.

The hosted log does not enumerate the offending inherited key. Global Git LFS
configuration is plausible, **not confirmed**. A controlled LFS-shaped global
configuration reproduces exactly the three failures on the old head: 49 queue
tests, 46 passed / three failed. See before.json, before.stdout.log and the exact
inherited-global.gitconfig. No LFS exemption or configuration trust was added.

## Repair and witnesses

Disposable fixtures now own a per-child Git environment: suppress global/system
configuration and inherited GIT_CONFIG injection, while retaining repository-local
configuration. The same environment reaches fixture Git commands, the injected
reader executor, resource-preflight Git callback and CLI child processes. No parent
process environment or user Git settings are modified.

The regression child injects global LFS, system and command-environment filter
configuration, then executes the three affected fixtures plus the local malicious
filter test. It asserts four actual executed passes; NODE_TEST_CONTEXT is removed
only from that nested runner invocation so the child cannot silently avoid execution.
A separate real default-reader child sees an inherited malicious clean filter and
must reject before status; the execution marker remains absent. The original
repository-local malicious filter test continues to verify rejection before any
working-file operation. Production behavior is unchanged and remains conservative.

## Validation

All seven source-bound repair receipts passed, exit 0:

- Focused queue + unchanged runner suite: **63 passed**, zero failures/skips.
- Same inherited-global witness after repair: **51 queue tests passed**, zero failures/skips.
- Targeted ESLint and Oxfmt on six maintained JavaScript files.
- Structural orchestration check and diff whitespace check.
- Mac resource preflight: 451 files, concurrency 1, production-config-runtime-drift.

These are focused macOS Node 24.18.0 results. No full local suite, new hosted run,
build, browser, ready transition or live driver effect was executed. Independent
repair review and a new genuine hosted gate remain required. The external #505
allowlist stays unarmed and unchanged at SHA-256
`0da040d5a7454157e1fb9b9e0ac9bc156c518b6154d955937d635052feea59bf`.

## Preserved evidence

The complete failed hosted log is retained losslessly as
[hosted-full-38960740277.log.gz](hosted-full-38960740277.log.gz), with run/job metadata
and line-numbered failure excerpts. Its decompressed SHA-256 is
`6df1882e0046e3e8afcf29a3ffbf3fcaacf06af06dfd64790246951b841db08c`.
Original downloaded log/metadata remain outside the repository under
`integration-pilot-503/observations/`. Local before/after originals remain under
ignored `work/orchestration/integration-queue-git-config*/`.

[Artifact index](artifact-index.json) binds original/published hashes; local
repository paths in the before receipt/log are redacted. The hosted log is unchanged
apart from lossless gzip. [Source manifest](source-manifest.json) binds nine tested
source/input files. The controlled config digest matches the before receipt and
was unchanged during the after run.

- Artifact index SHA-256: `7971e625e03e6d8deba87d99393cd8326006549754f6be986f761e8728322b29`
- Source manifest SHA-256: `87e141c7ea1b4a24479d9a97a686e99687ce83451cbfb02f11aa34f1757bed21`
