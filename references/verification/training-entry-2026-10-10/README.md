# Issue 29: finite investigation, candidate blocked

- Baseline: `50aefe1d49f70057380bf9a5fa8f0b319c8ad441`.
- Tested product candidate: `bd420fd252182e8e28fdeb03a6577f844a04a746`.
- PR: https://github.com/JohnDeved/populous-new-dawn/pull/320 (draft, not merged).
- Decision: **REJECT integration**. The reported entry behavior remains, and a
  required Mission 2 gameplay regression fails. No acceptance was weakened.

## What was found

The actual training route adapter overwrites the entry controller's retained
person counter with `world.turn`. Original scheduler, motion, route and command
exports support retaining that counter. Eight failure-first human/shared-AI
school cases fail at the real routed visit before the one-line guard. Forty-one
focused tests passed after it; the expanded counter-owner suite passes 15 tests,
including nontraining entry and dismantling compatibility. The AI cases use the
real shared producer boundary, not an autonomous AI scheduling witness.

This local contract does not establish full original composition. The fix changes
later battle results and does not serialize admission; it is not safe to ship on
the evidence presently available.

## Ordinary rendered training witness

Both runs use Mission 3, its ordinary startup/population, five selected builders,
shipped Warrior Hut placement, natural completion and a ten-Brave pointer command.
No units, resources, terrain, work states, counters or simulation turns are injected.
A synchronous read-only observer copies state after the existing turn hook. Game
advancement remains real-clock RAF; all selection/placement/orders use UI input.

- Baseline: maximum five simultaneous outside substate-5 entrants; admission IDs
  513 at turn 1156, 309 and 300 at 1158, 312 at 1160, 519 at 1162.
- Candidate: maximum five simultaneous outside substate-5 entrants; IDs 519, 513
  and 300 all admit at 1122, then 312 at 1124 and 309 at 1126.
- Both finish with five residents and a complete five-person overflow queue.
- These independently performed real-clock sessions are not identical initial
  simulation snapshots; their absolute turn difference is not a speed comparison.
- Baseline checker lacked a terminal timeout assertion. Its retained final snapshot
  was independently checked for all five residents, exact occupant IDs and the
  complete acyclic queue. Candidate asserts those conditions before passing.
- Candidate adds a bounded, read-only CDP screencast. It records 25 live PNG frames;
  capture stopped/detached and the observer restored. There were no console errors.
- Chrome 154.0.8037.92, software SwiftShader; no hardware performance claim.
- Both owned browser/server scopes completed cleanup. A separate optional Fallow
  gate lost its session; its process cleanup remains unverified.

The baseline receipt's stable fingerprint is
`5db4edcd5ba35903f41dfe5c6d1c6eeae48d3aa4a903a95245377b0e225fbab6`.
Baseline had stable research/test-only edits; production matched its stated commit.
The candidate clean-source stable fingerprint is
`c53a536463384a6aea32e01eb7637c39d59abaa0c2259425dce7a380981e9533`.
The earlier unsuccessful Mission 4 preparation is excluded from acceptance.

Images:
- `ordinary-base-result.png`: baseline ordinary paused occupied hut and waiters.
- `ordinary-candidate-result.png`: candidate equivalent scenario/result view.
- `ordinary-candidate-live.png`: candidate live rendered approach interval, near
  observed turn 1118. The roof occludes the crossing bodies. It is **not** evidence
  that three sprites cross the visible door on an identical rendered frame.

See the paired `ordinary-*-summary.json` snapshots for the admission/queue evidence.
None of these are original-game pixels or establish a one-person admission rule.

## Blocking paired Mission 2 result

`mission2-diagnostic-source.txt` retains the existing test's assertions, adding
only prebattle/per-target/postbattle logs (imports relocated for the ignored run).
`mission2-base.log` passes; `mission2-candidate.log` fails.

Both versions start combat at turn 6372 with identical 27 Matak IDs/HP and 30 Blue
people, after training 16 Blue Warriors. Base kills target 21 at 6985, target 6 at
7278 and target 14 at 7285, leaving 14 Matak. Candidate kills target 21 at 6994 and
target 6 at 7357, leaving 9. The required population `>10` assertion then fails,
before the actual replacement request assertions. This demonstrates downstream
battle consequences rather than an economy-preparation failure. No army size,
target ranking, delays, required target deaths or thresholds were tuned.

## Gates and independent review

`gate-status.json` binds source/commands and raw receipt hashes. The full check
passes 1,928/1,929 tests and fails; its subsequent parity/orchestration stages do
not run. Build passes. Format/ESLint/Oxlint report inherited findings; no introduced
finding was reported for the guard or new tests. Fallow health is inconclusive
(session timeout then unknown process); dupes/unused were not started. Fresh
paired diagnosis and candidate browser used private isolated worktrees/dependencies.
No repeated advisory or native executable run was attempted.

Fresh independent review found the local source contract/readability defensible,
but **rejected integration** because the full gate fails with consequential battle
changes lacking an accepted native-composition explanation. Source-local correctness
is narrower than gameplay acceptance. The rendered candidate does not remove this
blocker. Issue 29 stays open and main remains unchanged by this work.

## Missing inputs and smallest next discriminator

The historical native Temple summary is not a paired baseline for a Warrior Hut
fixture. Missing are the exact original initial person/building records, rolling
allocation counters, RNG and visit/list order, terrain/routes/formation state,
full group-entry driver with supplied/intercepted leaves, and per-person timeline.
For visual disappearance, original camera/render flags/displacement/animation/frame
and painter inputs are also missing. Existing exports prove primitives, not this
complete ordinary composition across all four schools.

The next useful source-only step is to use the current actual-caller trace to
specify that exact equivalent fixture and its captured fields. A new fix requires
recovering the complete preserved original trace/driver from an authorized supplied
source, or an explicitly authorized bounded original comparison with equivalent
inputs. An original save/replay plus a short matching doorway video would ground
that setup; video alone cannot prove the full scheduler. Do not add a semaphore,
reduce capacity, repeat broad archaeology, or execute/recover original inputs under
an expired native-run budget. No permitted source-only step currently proves a
safe complete doorway correction.
