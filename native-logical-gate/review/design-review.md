# #214 bounded implementation design review

Decision: **ACCEPT** the frozen proposal for implementation. This is source-only
design acceptance, not review or acceptance of a runtime candidate.

Proposal: `work/orchestration/sprite-stamp-gate-214/implementation-proposal.md`
SHA256: `a5300ed73b3fe3b5fe073b3abc73135736143c9d291b3a594f2a8152e6c70841`.
Audit and feature trees both reported clean source
`a53fa05587c4c1d363e3596162b41fcb9f26e3e8` when the proposal was read.
This review follows the accepted research in `review.md`; no additional native
replay, browser, full check/build, or runtime edit was performed.

The proposed phase split addresses the supported defect without changing the
global 24-Hz clock. The branch-aware predicate correctly keeps mode 3 and mode-4
transitions on their existing presentation owner. Always limiting elapsed slices
to the next turn handles fast simulation and catch-up even without worship hooks.
Adding only the ordinary person gate bit, keeping frame state on restore, and
using the completed logical turn as an explicit adapter identity are within scope.

One implementation detail must remain explicit: **phase ownership and visit
eligibility are separate predicates**. A flagged ordinary person with a gated
animation branch and state 0 is ineligible for logical advancement, but does not
therefore become eligible for the 24-Hz fallback. Otherwise a combined
`isEligibleLogicalObject` predicate followed by its negation in presentation
reintroduces extra draws for state-0 records. Apply the same principle to detached
or removed sources. The proposal's planned state-0 and handoff assertions cover
this; no new test framework or broader migration is requested.

Keep the frozen observer order: completed turn body, clock.afterTurn, queued
afterCurrentGameTurn callbacks, one owned logical animation visit, then any
coincident 24-Hz presentation visit. Existing passive snapshots retain their
pre-animation meaning and the next controller observes the advanced frame.
Advance independently of optional diagnostic callbacks. Direct tick remains
explicitly simulation-only; it must not silently acquire animation advancement
from a diagnostic hook. Land-paused accumulator drains are not completed World
turns. A focused callback-order/catch-up assertion is sufficient for this design
boundary.

The post-turn selected-source boundary is accepted as the existing bounded live
adapter. One selected source per unit prevents alias double advancement. Its
planned coverage of early-return owners, handoffs, allocation, expiry and restore
is appropriate; a full original dispatcher port is not required here. Splash
created within a completed turn can receive allocation-eligible animation without
an extra lifetime visit. The explicit next-turn treatment of out-of-turn helper
fixtures and existing-person UI handoffs is clear. Native-created person models
outside 2–7, fallback sprites, Stone Heads, other effects and smoke remain excluded.

Removing command-27 compensation only from the repaired logical path is sound
provided the planned real controller-completion assertions pass. Preserve any
unproved presentation-owned path's existing behavior. Keep raw mode/frame rules,
simulation lifetimes, observers, pause and ordinary effect/UI cadence unchanged.

Proceed with the declared failure-first tests and implementation, then freeze a
coherent candidate for fresh source/evidence review. This design review does not
add a complete native lifecycle run as a prerequisite: inspect known masks and
only request a narrow composed probe if a concrete relevant conflicting write
is found. Full gates and ordinary rendered acceptance remain later coordinated
candidate requirements already recorded by the owner.
