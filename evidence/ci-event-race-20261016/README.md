# CI draft/ready race: source-bound local evidence

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/ci-event-race-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Base: cf38a755a3a00255184c63c175a00076cff6b025
Tested implementation: 7c86021d208780659bb91ef55e7b948e37fd0b08

37 focused tests passed across workflow-policy, workflow-handoff and tutorial-browser-config. ESLint passed for the changed test; orchestration structural validation passed 135 checks. Workflow YAML parsed with existing js-yaml; this is syntax validation, not GitHub scheduling validation. No full suite, production build, browser, hosted lifecycle pilot or merge ran locally.

The initial focused attempt failed 1 of 37 tests in unchanged workflow-handoff coverage: macOS temporary-directory alias /var resolves to /private/var, defeating the receipt CLI's exact entry-point comparison and leaving no receipt. Both that failed attempt and the successful rerun are retained. The rerun uses an explicit canonical TMPDIR in its recorded command, with no repository change. The suite and receipt helper are unchanged from the base.

Local policy tests validate the authored expression subset and execute the actual guard. Failure propagation uses stub npm/git commands and process cancellation; it does not replace genuine hosted test/build failure cases. Runtime was Node 24.18.0 on this Mac; hosted runtime remains pinned to 24.19.0.

The portable review bundle contains redacted output in source-bound receipts, redaction counts, the implementation diff and a standalone verifier. trusted-identities.json was derived from source checkout hashes and recorded exporter receipt identities; the bundle was verified against it before publication. This evidence-only addition does not alter tested implementation bytes.

Remaining: independent implementation review and the bounded hosted lifecycle pilot in engineering/ci-event-race-pilot.md. Required-check resolution after a later differently named draft suite remains unproven; keep the drained-draft → ready workaround until that evidence passes. Main protection was observed strict with required Full check from Actions app 15368, administrator enforcement and no force pushes/deletions; no settings changed. Weekly Codex usage was 8% (stop threshold 70%).

## Publication correction

Temporary alias and canonical directory prefixes are consistently replaced by
`<TEMP_ALIAS_ROOT>` and `<TEMP_CANONICAL_ROOT>`. `redaction-hashes.json` retains
separate original-local, prior-published and corrected-published receipt/output
SHA-256 values. Existing stdout/stderr hash fields describe original local bytes;
the ledger records the published stream hashes. Manifest published hashes, byte
counts, redaction counts and trusted receipt identities were updated and verified.
The original ignored local receipts were not modified.

The bundle and its patch remain historical evidence for implementation 7c86021d.
Its copied pilot proposal is superseded by the current
`engineering/ci-event-race-pilot.md`: #502 is the primary candidate after #500 and
a reviewed native Linux production-fingerprint refresh. One genuine Full gate and
bounded cheap admission probes replace repeated full runs and injected failures.
The companion-suite association limitation remains explicit. Workflow logic,
policy tests and resource classifications are unchanged by this correction.
