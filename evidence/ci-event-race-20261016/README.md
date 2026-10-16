# CI draft/ready race: source-bound local evidence

Base: cf38a755a3a00255184c63c175a00076cff6b025
Tested implementation: 7c86021d208780659bb91ef55e7b948e37fd0b08

37 focused tests passed across workflow-policy, workflow-handoff and tutorial-browser-config. ESLint passed for the changed test; orchestration structural validation passed 135 checks. Workflow YAML parsed with existing js-yaml; this is syntax validation, not GitHub scheduling validation. No full suite, production build, browser, hosted lifecycle pilot or merge ran locally.

The initial focused attempt failed 1 of 37 tests in unchanged workflow-handoff coverage: macOS temporary-directory alias /var resolves to /private/var, defeating the receipt CLI's exact entry-point comparison and leaving no receipt. Both that failed attempt and the successful rerun are retained. The rerun uses an explicit canonical TMPDIR in its recorded command, with no repository change. The suite and receipt helper are unchanged from the base.

Local policy tests validate the authored expression subset and execute the actual guard. Failure propagation uses stub npm/git commands and process cancellation; it does not replace genuine hosted test/build failure cases. Runtime was Node 24.18.0 on this Mac; hosted runtime remains pinned to 24.19.0.

The portable review bundle contains raw output in source-bound receipts, redaction counts, the implementation diff and a standalone verifier. trusted-identities.json was derived from source checkout hashes and recorded exporter receipt identities; the bundle was verified against it before publication. This evidence-only addition does not alter tested implementation bytes.

Remaining: independent implementation review and the bounded hosted lifecycle pilot in engineering/ci-event-race-pilot.md. Required-check resolution after a later differently named draft suite remains unproven; keep the drained-draft → ready workaround until that evidence passes. Main protection was observed strict with required Full check from Actions app 15368, administrator enforcement and no force pushes/deletions; no settings changed. Weekly Codex usage was 8% (stop threshold 70%).
