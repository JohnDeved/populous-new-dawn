# PR 217: native logical animation repair validation

Candidate: `d8897cf8eeac1886d2f653af2cad0674c6bfa91a`, based on
`a53fa05587c4c1d363e3596162b41fcb9f26e3e8`.
[PR217](https://github.com/JohnDeved/populous-new-dawn/pull/217) references the
still-open [broad sprite report](https://github.com/JohnDeved/populous-new-dawn/issues/214).

The [accepted original producer/stamp packet](../native-logical-gate/findings.md)
is separate from this implementation validation. The
[ordinary a53 baseline](https://github.com/JohnDeved/populous-new-dawn/blob/8b5e2134e21b1e128e5e100e4530af1042b75ee5/README.md)
observes95 same-turn native frame changes at1×. The
[ordinary d889 candidate report and raw capture](https://github.com/JohnDeved/populous-new-dawn/blob/102736ea2d83249ad30c498bf0161d00bed0af47/candidate-d8897cf/report.md)
passes the same discriminating analyzer with284 stable same-turn owner pairs
holding frames,1,544 logical stamp pairs,2,480 native frame/draw matches and4,960
piece-UV matches. Natural native walking and shipped1×/2×/pause/resume are covered;
partial hut smoke retains its own clock. No Splash/full-hut/damage-smoke sample
occurred. Static screenshots corroborate appearance; raw frame sequences establish
cadence. This is functional software-rendered evidence, not original OS or hardware
frame-rate calibration.

The [final independent review](reviews/final-review-d8897cf.md) **ACCEPTS** the
exact d889 candidate for bounded PR217 integration. It verifies source, all gate
and carry dispositions, the97-check planner selection, ordinary raw observations,
negative control, screenshots and terminal cleanup. No blocking findings remain.

## Source and checks

The exact full candidate diff is `candidate.patch`. Independent reviews accept
runtime, test-caller migration and the two-line style-equivalence boundary.
Fresh final-head checks:12 lifecycle tests, TypeScript, production build, scoped
format and ESLint on all four changed app files and six changed tests. The full1,126-test/parity/orchestration pass at3123edf and the
168 retained native timeline comparisons at a76d1c7 are **explicitly reviewed
carries**, not fresh d8897cf full/native runs. See
[style carry review](reviews/style-review-d8897cf.md) and
[terminal receipt](validation/gate-terminal-d8897cf.json).

Scoped oxlint exits1 on both exact a53 and the final candidate:37 errors and21
warnings, with zero added/removed rule/message/file multiplicities. Raw streams
retain exact source locations. The initial extra destructuring warning and
format failure were fixed before final-source capture; every failed attempt is
retained. Fallow advisory exits0 while reporting1,893 threshold findings; this
is not a clean project-health claim. The final97-check planner, per-check dispositions and explicit unknown-path
dispositions are included. Unchanged broad native/browser/static routes are
labelled not-run; their mapping is not presented as a fresh pass. No unrelated baseline cleanup is included.

The original eight failure-first cases and their exact source bytes are retained;
`failure-first-source.json` explains recovery against the recorded input hash.
Old elapsed test helpers also reproduced two failures before migration to the
production clock; the36 affected tests and focused victory case then passed.
Assertions about completion, frame progress, source identity and pause remain.

## Scope

Ordinary native-backed person models2–7 and Splash receive logical visits in the
accepted gated modes; mode3/morph transitions keep presentation ownership. The
24Hz clock, ordinary fallback artwork, unrelated effects, Stone Heads and UI keep
their owners. Original absolute OS pacing, other reported sprite families and
the separate fallback Firewarrior descriptor-delay lead remain open.

Native adapter comparison supplies recorded animation poses and clear-bit smoke
records, while running current person/Splash creation and the real phase adapter.
Its168 comparisons establish that boundary, not full native controllers or
original elapsed time. Original research person proofs execute the common
creation prefix and real stamp/updater boundary with logical processor bodies
supplied; effect leaves remain documented. This evidence contains no executable,
browser profile, dependency tree or credentials.

Raw command receipts include source/diff/input fingerprints and output hashes;
matching stdout/stderr streams are retained. The comparison driver expects its
original path under `work/orchestration/sprite-logical-visit-fix` in the candidate
checkout and the separately published native result packet at the documented
relative audit path. Source/test fixtures alone do not replace ordinary gameplay.
