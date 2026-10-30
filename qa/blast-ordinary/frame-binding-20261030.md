# Passive Blast observer: retained-frame binding

Refs #74. This is an evidence-only extension of historical QA commit
`2a33f94cd0661947bb1348b1e1efd48400c8ae91`, not current-main game code or a
renewed ordinary moving-enemy trial. The original 90 misses remain unexplained;
range, consumed winner, source/runtime qualification and gameplay acceptance are
still open. No targeting repair, extra picker call, render, native-game execution,
browser launch, screenshot, parity credit or merge is claimed.

## Change

Version 2 records the preceding natural frame's sequence on each observed call,
includes the actual Scene frame in its context, and qualifies each call against
the one image still retained. A later image invalidates earlier call associations
even if all context values happen to be equal. No additional images are retained.
The top-level `frameMatched` now requires a nonempty, entirely matching call set
and no observer errors. `searchFrameMatched` explicitly retains only the original
admission-context comparison; it is not a per-call or gameplay guarantee.

These fields establish only recorded context/image correspondence. Consumers must
still check world/target/group ownership, errors, restoration and the particular
event/call, and distinguish source-derived inference from a directly observed
winner. The helper does not capture the complete sorted hit stream or tag callers
as search, hover or release. Historical runtime qualification is not current-main
execution: main `9abbb950` picker/reducer bytes were only compared read-only with
the previous `7299ac87` source diagnostic and found identical.

## Focused verification, 30 October 2026

All eight existing supplied-method test definitions are unchanged. Three new
definitions cover post-admission context drift, replacement of the retained image,
and detached/positive/empty-set metadata. The drift definition runs ten mutations
on the candidate, including the Scene frame, renderer frame and object identities.

- **Failure-first baseline:** unchanged historical helper plus final expanded tests:
  8 passed / 3 failed; child exit 1. Each new definition failed. The drift loop
  stopped at its first camera assertion, so the other nine mutations are not
  separately claimed as baseline failures.
- **Candidate:** complete focused file 11/11 passed; child exit 0; zero failures,
  cancellations, skips or todo. Both runs had empty stderr and stable before/after
  source and Node fingerprints. Owned direct children were reaped and private
  directories remained empty. Sampled peak RSS was 33,546,240 / 33,390,592 bytes
  (baseline/candidate), not a hard peak or whole-machine memory measurement.
- Fresh independent source/guard review and terminal-result review accepted this
  exact scoped evidence. Tests ran before the later data-only checkpoint; unchanged
  source blob/tree verification binds them without relabeling or rerunning.

Runtime: Node 24.22.1. Command, per isolated three-file source view:

```text
node --max-old-space-size=128 --permission --allow-fs-read=<source>
  --test --test-isolation=none --test-concurrency=1 --test-reporter=tap
  tests/blast-ordinary-pick-observer.test.mjs
```

The parent guard allowed 10 seconds elapsed, 5 seconds CPU, 256 MiB sampled direct
RSS and 1 MiB per log. Node had source-only filesystem reads and no filesystem-write,
child-process or worker permission. This is a narrow builtin-only fake-method graph,
not a full installation, browser/WebGL memory test, standard check/build or native
equivalence proof. Guard completion and the actual child exit were evaluated
separately. Full current-main integration is neither attempted nor claimed.

Retained local evidence packet: `issue74-pick-frame-binding-20261030T2226/`
with both `*-attempt01` directories and independent reviews; this is a local path,
not a public download. Raw TAP SHA-256:

- Baseline: `51d4585e3f947edef5181283c4533f13691947ec710bce4bf7ae4e4b7a1e1b93`.
- Candidate: `560bd3b9db69d8d77caf5c546282a534623a3d93e1eb559efdaf6a6fddb3c032`.

Candidate helper SHA-256:
`9a679380c912f38cabffe9a31c9f9c0f6c508a184b3c3759447cccecbf6f4182`.
Expanded tests SHA-256:
`f5781256c4fb43714116a8846796191ef246f1176a43d3c0a1e1642d17765f60`.

Visual evidence is not applicable to this source-only QA-helper change. Any later
browser reuse requires separate exact-runtime qualification and admission; this
checkpoint does not unfreeze the ordinary trial.
