# PR 491 timeout cleanup repair

Source head: `fd63f4542e1465d326bd918f4b244df6e202946e`.
Previous reviewed/rendered head: `a3986f05fa94fd30733bd995d28faee226d05489`.
Only the evidence lifecycle helper and its regression test changed; see
`source.patch`. Application code, fixture data and rendered assertions are unchanged.

The timeout callback previously discarded the rejecting `browser.close()` promise.
The new child-process regression reproduces this with strict unhandled-rejection
handling and a stalled run. Its pre-fix attempt fails with the uncaught close error
(`timeout-close-red.json` plus raw logs).

The helper now consumes that rejection, races the run against the deadline,
records `timeoutCleanupError`, awaits the attempted close, and performs final
cleanup before saving terminal evidence. The regression checks the actual saved
file for `status: failed`, timeout/cleanup error details, `finishedAt`, unchanged
source, two close attempts and successful final cleanup, with no stderr crash.

Exact-head verification:

- `timeout-close-final.json`: 86/86 focused tests passed, exit 0.
- `timeout-close-eslint.json`: affected-file ESLint passed, exit 0.
- `timeout-close-witness.json`: deliberately failed run, exit 1, empty stderr;
  this expected failure proves error reporting, not a passing browser run.
- `timeout-close-terminal-report.json`: persisted failed receipt, timed out,
  first close rejection retained, final close succeeded, source unchanged and
  `finishedAt` present. Helper SHA-256:
  `a69e353c1fd2ee579c27a504cd7d4746cb4399fbaaf913070c08552b88f45d76`.
- `timeout-close-green-draft.json` is the earlier dirty-tree focused pass;
  it is not the final source receipt.

`timeout-close-witness.mjs` was executed from
`work/orchestration/mac-spell-icons/` in the source checkout; its relative import
is retained exactly. The final command receipt binds its hash and helper hash.

No browser was launched for this repair. The successful 164-observation browser
run and 328 PNGs under `../a3986f05/` remain preserved and bound to that older
source head; they are not represented as an exact-head browser pass for fd63f454.
No full local suite/build or merge was run. Parent owns renewed review and CI.
