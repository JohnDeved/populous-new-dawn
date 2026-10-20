# Issue 16 startup logo review artifacts

Artifact-only branch; do not merge into development branches.

Source base: `96becd8826afc5a4256a12ccebf3caa61729e24b`.
Source candidate: `252dc89f59fc1afada67b06c24e3e1af0435fd0e`.

Actual Home rendered in Chromium 153.0.8010.12 at 1280x960. Browser sandbox enabled. Local compositor output, not original-game screenshots or hardware performance evidence. The native executable was read as data, never executed.

`before-menu.png`: unchanged baseline opens the menu immediately.
`logo-1s.png`, `logo-3s.png`, `logo-6s.png`: candidate natural playback, without seeking or changed playback rate.
`after-natural-menu.png`: candidate after natural completion. Byte-identical to `before-menu.png`.
`pointer-down-stopped.png`: playback paused on trusted left-button down; release subsequently opens only the menu.
`media-failure.png`: explicitly injected 404, truthful failure with a working exit.

The browser receipt records 13 passing checks: ordering, framing, fresh keys versus repeats/releases, held-at-entry key, left/middle/right interruption without click-through, keyboard sound control, Options return without replay/storage writes, and injected failure recovery. Only the injected 404 produced a console error. Autoplay refusal and visibility lifecycle are component-tested; audio was unmuted, not acoustically measured.

`native-static.json` is the source/input-bound static PE/TGQ geometry checker receipt, not native execution proof. Final standard gates: `npm run build`, `npm run parity:check` and `npm run orchestration:check` PASS on unchanged252dc89f. Full clean-runtime `npm run check` FAILS:4299pass,2fail,7skip. Both failures are existing `tests/performance-queue.test.mjs` cases376/399. Untouched96becd88 reproduces both exact failures. Read-only PID sampling observed one identified terminated fixture child as Z/PPID1 while the test waited for its PID to disappear. The failed full gate remains a baseline/executor process-lifecycle blocker; it is not waived. Parent owns integration and the passing combined gate.

The first full attempt inherited NODE_PATH, causing three orchestration fixture expectation failures; it was explicitly interrupted after diagnosis and its descendants were verified exited. `check-final.json` retains that failed130 receipt. All54 integration-queue fixture tests pass with the documented process-local runtime overrides cleared. `check-clean-runtime.json` is the completed full run under that environment. No third full retry, queue fix or weakened assertion was made.

Independent fresh review ACCEPTs code/browser evidence and independently confirms baseline reproduction/identical queue source; it explicitly retains the failed standard gate. New logo lint is clean; Home's47warnings match baseline exactly. This artifact set makes no full startup parity claim.

The portable `review-bundle.tar.gz` contains the exact binary source diff,21changed-source identities and12bounded/redacted raw receipts. Export and independent verifier both passed. Expected diff SHA256: `efebb812e0462b161e0145a50ef90d5ab4beb6e47519f84d18a5c5ac894cb17d`. Pin this artifact commit from the trusted PR handoff before consuming `review-identities.json` as verifier arguments. Transport verification does not turn failed tests into passes.

`entry-handoff/` retains bounded original Credits/RollingDemo/ComingSoon callback assembly and recovered-data hashes for the other owners. The executable was never run. `previous-pointer-failure.json` records the f0fe01fa capture-guard defect before its scoped repair; current candidate acceptance uses `candidate-browser.json`.

Missing work: native initial timed-page visibility/early-skip ordering, separate language-selected New Game intro, unavailable BLOGOJAP/P3INTROJ/P3INTROC. Credits/Rolling Demo/Coming Soon remain owned by other workers.
