# Automatic delivery recovery

The parent detects delivery stalls and applies corrections during active work without
waiting for user prompting. Use a read-only `pnd-scout` when diagnosis needs an
independent view; the parent remains the source writer and final decision maker.

Game parity, modern desktop performance, and clean, readable, maintainable code
are non-negotiable. Every recommendation must preserve all three and the evidence
needed to verify them. Token savings, fewer checks, less code, or faster delivery
cannot justify weaker gameplay, slower performance, or harder-to-read code.

## When to run

At task resumption, before selecting another task, and after each commit or completed
research/check cycle, briefly compare the locked feature's remaining acceptance gaps
with the last handoff. Trigger recovery when two consecutive cycles close no gameplay
gap, resolve no necessary uncertainty, and remove no concrete blocker; also trigger
when work exceeds its stated effort estimate without explained progress. Trigger
immediately for a second prerequisite refactor, repeated unchanged triage/checks, or
helper-only work being presented as a completed feature. These are investigation
signals, not proof that difficult research is wasteful.

Coalesce related signals into one diagnosis at the next safe boundary, including
inside an unfinished slice. Do not wait for slice completion or a user complaint.
Use existing commits, diffs, handoffs, and receipts; a flat parity percentage alone is
insufficient, especially when recording is not authorized. This procedure runs while
the task is active; it does not wake an idle task.

Use existing handoffs and receipts to identify the sample. The delivery clock below
stores timing and evidence references, not a second parity ledger. Missing historical
measurements stay unknown.

## Wall-clock feedback

Use `npm run orchestration:progress -- status` at resumption, progress boundaries,
and at least every 10 minutes during active work; check after a long tool returns.
Preparation and verification also include the clock report automatically. Only the
parent writes the shared ignored `work/orchestration/delivery-clock.json`.
A clock read failure appears as `unavailable` with a repair action; it cannot replace
completed verification results or turn successful contract preparation into failure.
Repair the monitoring fault while preserving recorded history.

Before implementing a selected feature, start its clock with an honest estimate:
`npm run orchestration:progress -- start --task "feature outcome" --minutes 90`.
Choose a budget from scope and comparable work, not the desired score. Original
budgets and timestamps persist; starting another task cannot erase elapsed time.
Do not retroactively invent a start time for existing work.

Record an advance with `npm run orchestration:progress -- note --kind gameplay
--note "behavior now reached" --evidence work/orchestration/acceptance.md` (one line).
Use `research`, `refactor`, or `workflow` for supporting work. A `gameplay` event must
cite a distinct accepted behavior through a normal game path, with appropriate proof;
repeated assertions, checks, and helper work cannot refresh the gameplay clock.
Use `finish` with the same arguments only when the feature acceptance is met, or
`abandon --note "concrete blocker" --evidence <handoff>` before choosing another task.

At 30 minutes without gameplay advancement, or when a task exceeds its budget, the
clock returns `review-approach`. At 60 minutes it returns `recover-now`: explain the
delay and apply a supported correction at the next safe boundary. Necessary research
may justify continuing, but requires a concrete next result and a timed reassessment.
These initial thresholds can be adjusted in the helper when measured work supports it.
Clock warnings do not terminate checks or weaken feature acceptance.

The primary rate is canonical parity percentage-point gain per elapsed hour; changed
scope makes that rate unavailable. Supporting work receives no feature reward. A
feature delivered within its original budget receives positive feedback: keep the
effective approach in the existing handoff and reuse it on comparable work. Overruns
prompt a diagnosis. Compare feature scope and regressions as well as time; inflated
budgets, tiny checkpoint counts, commits, and test counts are not speed measures.
This is operational feedback for AI decisions, not model-weight training.

Wall time includes idle time, external waits, review, and verification. Report known
interruptions separately without deleting them or claiming wall time is active effort.
If parity recording is unavailable, report the observed accepted gameplay outcomes
and elapsed time while leaving the canonical rate unchanged. Timing alone cannot
certify gameplay, and an idle task still needs a running executor to take action.

## Optional scout assignment

Start a fresh `pnd-scout` with `fork_turns: "none"` and no model/reasoning override.
Explicitly label the assignment "workflow-efficiency review" and supply this guide
plus one compact brief (aim for at most 600 words):

- The trigger and up to three recent slices: commits, delivered gameplay outcomes,
  assignments, blockers, and any repeated work.
- Observed packet bytes, preparation calls, check durations, and repeated executions
  where recorded; label absent measurements unknown and estimates as estimates.
- Exact receipt/log paths or line ranges supporting those observations, relevant
  workflow source references, and the current objective and constraints.

For this small read-only review, this brief replaces the gameplay subsystem packet;
do not invent a subsystem or create another contract just to dispatch it. Begin with
the supplied evidence and expand into exact relevant sources, callers, or contradictory
evidence only as needed. Do not load whole task history, GOAL, native notes, or the
performance log. If the running task lacks the updated scout instructions, put the
assignment and this guide's path directly in its prompt.

## Scout authority and output

Read and recommend only. Do not edit files or policy, run checks or benchmarks,
produce artifacts, delegate, message other tasks, interrupt work, or implement a
recommendation. Preserve all gameplay parity scope and native/browser/performance
proof requirements. The orchestrator owns priority, acceptance, and source edits.

Return at most three ranked recommendations in at most 400 words. Each names:

1. Observed waste and its exact supporting evidence, including uncertainty.
2. The smallest remedy and how it would help gameplay delivery.
3. Implementation/maintenance cost and how parity, performance, code readability,
   and their required evidence remain protected; identify unknown impacts.
4. What to compare on a subsequent similar slice to judge whether it helped.

Prefer removing repeated work or fixing coordination before adding infrastructure.
Distinguish necessary re-verification after a source change from avoidable reruns.
Do not claim token savings from byte counts or speedups from intuition. Return
"No change justified" when appropriate, or identify the specific missing evidence
when the sample cannot support a conclusion. Stop after this bounded report.

## Orchestrator follow-through

Apply the smallest supported local correction without requesting routine approval:
remove redundant process, reuse valid evidence, narrow an investigation, change the
implementation approach, or retire stale cleanup instructions. Preserve feature
acceptance, parity scope, required proof, modern compatibility, and existing work.
If diagnosis finds a concrete blocker, choose another feature only within the user's
authorized priorities. Publishing, recording, credentials, and external actions retain
their existing authorization requirements.

The parent may revise local workflow policy, agent assignments, procedural limits,
and task decomposition autonomously when evidence supports the change. Commit a
concise reason with the correction and assess its effect on the next gameplay cycle.
Preserve the original game objective and acceptance constraints; do not weaken proof
or relabel unfinished work to improve reported progress. Adopt changes that improve
delivery and revise or revert ineffective ones without waiting for human direction.

Record the cause, correction, and expected next gameplay advance in the existing
handoff, then resume implementation in the same work session. At the next meaningful
cycle, check whether the correction removed the delay. If it did not, revise the
diagnosis or approach; do not repeat an unchanged remedy or enter recursive workflow
reviews. Resolve internal engineering decisions autonomously. If an external dependency
cannot be obtained within existing authority, record it and continue useful work on
another path. Only when all useful authorized paths are exhausted, report the exact
blocking dependency truthfully; never invent missing evidence or claim completion.
Evidence of necessary ongoing work justifies continuing with a named next result.

Retire ineffective remedies, retaining the lightweight stall check. Code changes
still receive their required verification and review; efficiency findings are not
gameplay acceptance evidence.
