# Workflow efficiency adviser trial

Use an existing read-only `pnd-scout` for this explicitly assigned responsibility.
This reviews delivery friction; it does not replace the fresh final code reviewer.

Game parity, modern desktop performance, and clean, readable, maintainable code
are non-negotiable. Every recommendation must preserve all three and the evidence
needed to verify them. Token savings, fewer checks, less code, or faster delivery
cannot justify weaker gameplay, slower performance, or harder-to-read code.

## When to run

Run one review at a safe slice boundary only after repeated setup, duplicate checks,
excessive context loading, or coordination failures are observed. Coalesce related
incidents into one assignment. Do not interrupt active implementation or add a review
to every turn. This is not a scheduled checkpoint.

Use existing handoffs and receipts to identify the sample; do not add a counter,
metrics ledger, or daemon. Missing measurements stay unknown.

## Compact assignment

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

## Authority and output

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

Record acceptance or rejection in the existing task handoff. Normally try the
highest-value small recommendation first, preserving the single source writer.
Compare actual avoided work with the adviser, implementation, and maintenance
effort; do not run extra benchmarks merely to populate a scorecard.

Retire the review when it does not produce an observed delivery benefit. Code changes
still receive their own fresh final review; the efficiency report is not acceptance
evidence.
