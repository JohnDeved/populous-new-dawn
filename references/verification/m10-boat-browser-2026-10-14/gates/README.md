# Publication gates on 6b36565f

All receipts bind exact source `6b36565fc6c362651f78a77cfa9b4cf0cd5ac8cf`
and unchanged tracked inputs before/after. Publication afterward adds only these
receipts, the official browser metadata entry, this explanation and manifest hashes.
The QA scenario and all application/runtime/test/dependency sources are unchanged.

- Typecheck: PASS inside the aggregate.
- Full `npm run check`: **FAILED**, 2,603/2,605 tests passed, no cancellations/skips.
  The aggregate stopped before its trailing parity/orchestration commands.
- `foreground-command.test.mjs` TERM-resistant fixture: expected SIGKILL, actual
  SIGTERM. Its fixed500ms deadline can precede handler installation; that timing
  explanation is an inference from fixture source and the isolated outcome.
- `performance-queue.test.mjs` following-job fixture: timed out under aggregate
  scheduling; its isolated complete suite later **PASS**, 20/20.
- Isolated complete foreground suite: **FAILED**, 8/9. Original escalation case
  passes. A different fixed250ms leader-exit fixture emits no descendant-ready
  marker. The source lacks a ready handshake before exiting; no application
  regression or exact scheduling cause is asserted from the empty output alone.
- Separate parity and orchestration structural gates: **PASS**.
- Production build: **PASS**. Existing vinext route-classification and plugin timing
  warnings remain in raw output. No deploy was requested or run by this task.

No assertion, timeout, expectation, process supervisor or product code was weakened
to obtain a green result. The final declaration is scope-qualified acceptance of
QA/docs/evidence, **not** a fully-green aggregate. The failed source files are
byte-identical to main758fcb84. The independent reviewer and parent integration own
that qualification. Do not silently replace these failed receipts with reruns.

Raw stdout/stderr are embedded unchanged in each command receipt with their hashes;
original local artifact paths remain provenance. Before the aggregate, the receipt
wrapper rejected a nonstandard output path, before executing tests; the corrected
run used the required ignored `work/orchestration/` output. That prelaunch error
is preserved locally in `work/m10-browser-check-console.log`, with no test credit.
