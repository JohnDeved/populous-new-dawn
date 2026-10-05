# #214 test-adapter delta preflight

Decision: **ACCEPT** exact final head
`3123edf97dce9dc13fd3510cdb3ad1d15aedc160` for the final gate chain.
This supplements `source-review-ed95f031.md`; final check/build, quality and
ordinary rendered candidate evidence are still pending.

Reviewed the complete five-test-file delta from
`ed95f0313e367367a32c232eb4b6d1e118068b58`: 23 additions and 17 deletions.
All app and native-note bytes remain unchanged from the accepted runtime.

The changed elapsed-gameplay helpers used to call simulation-only tick followed
by two presentation calls. They now use production advanceGame with a clock.
The opening-person and victory checks explicitly distinguish presentation holds
from a logical advance. Existing completion, stable identity, cancellation,
selection/readiness, pause and frozen-pose assertions remain. Simulation-only
controller tests remain on tick, and the direct logical-phase calls in the
victory test are plainly a bounded updater assertion, not a claimed gameplay
turn. No expected native frame values or completion conditions were relaxed.

The opening frame check now consumes an actual simulation turn; the separate
command-18 one-visit and interruption/completion tests in the same passing set
retain the exact startup/controller-order boundary. New clocks in the small
helpers are used for integer-turn, speed-1 advances with complete presentation
intervals; this does not claim arbitrary mid-frame clock reconstruction.

Verified the three source-bound receipts and exact raw stdout/stderr hashes:

- `legacy-callers-ed95f03.json`: expected baseline failure, including the stale
  opening frame and construction diversity assumptions.
- `legacy-callers-migrated.json`: all 36 affected tests passed in 14.84 seconds.
- `victory-caller-migrated.json`: the focused real victory case passed.

The latter two ran against ed95 plus a stable dirty test delta. I independently
computed `git diff ed95f031..3123edf --binary` SHA256
`465ece6cf3e72ee10be0a81854b3692b7eec19b15ae2871470f39e2aa12bb543`, exactly
matching both before/after receipt fingerprints. Thus those results bind to the
committed final test bytes. `git diff --check` passed and final tree was clean.
Receipts remain under the feature tree's
`work/orchestration/sprite-logical-visit-fix/` directory.

No additional runtime fixes, native proof, browser Save/Load row, or duplicate
focused rerun is requested. Renew standard and ordinary rendered gates on the
exact final head, retaining the final evidence boundaries in the runtime review.
No resources are held.
