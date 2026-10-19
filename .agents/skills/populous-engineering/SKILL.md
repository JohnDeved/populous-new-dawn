---
name: populous-engineering
description: Evidence-driven engineering for Populous New Dawn using GitHub issues and reviewed PRs, local native research, rendered QA, and source-bound verification.
---

# Populous engineering

Read root `AGENTS.md`, `GOAL.md`, and `engineering/README.md`. A delegated specialist
starts from the parent's bounded brief and relevant evidence, not whole task history.

Apply [README's gameplay parity and performance principle](../../../README.md#gameplay-parity-and-performance):
preserve observable gameplay and relevant deterministic outcomes, including intended
timing, targeting, RNG progression and checkpoint continuation where required.
Historical code structure, algorithms, architecture, incidental allocations and
internal representation are not parity requirements. Prefer modern, measurably
better algorithms/data structures that preserve required behavior; do not sacrifice
performance to imitate the original. A slow ray-cast path may be replaced with a
better method after validating its gameplay semantics, including relevant edge cases.
Keep native comparisons, supported-behavior regressions, and correctness requirements; change an assertion
about incidental internals only after establishing coverage of the required behavior.
Measure comparable full-frame/end-to-end cost, including setup, updates,
invalidation, deferred work and allocations as applicable. A smaller or renamed
timing bucket alone does not demonstrate an improvement.

Apply [the development save contract](../../../README.md#development-save-contract).
Do not retain old-save fallback support merely for backwards compatibility. Keep
current-format gameplay flows correct and reject incompatible saves clearly
without changing stored data. Explicit classic/native research fixtures are separate.

1. Continue the assigned GitHub issue/feature outcome. Record actual base/head and
   existing dirty paths. Use one writer per isolated branch/worktree; the parent
   coordinates at most four active workers across the entire delegation tree,
   including nested workers and reviewers, and owns integration. With the parent,
   this is five active agents total: the current usage budget, not a platform ceiling.
2. Read existing topic findings and actual callers. Use `orchestration:context` when
   helpful; follow omissions or contradictions. For native work, use
   `engineering/native-research.md`, verify local inputs/tools, and preserve useful
   exports/probes in indexed durable evidence.
   Restore missing native prerequisites automatically using
   `engineering/native-setup.md`; try its verified download/extraction path before
   asking the user for files or setup instructions.
3. Implement a playable live path. Keep acceptance and limits in the linked issue/PR.
   Optional contracts and role packets in `engineering/contracts.md` help complex
   scope; they are not required for every assignment.
4. Select checks with `orchestration:plan -- --base <actual-base>`, inspect side
   effects, and serialize expensive/shared work. Preserve standard gates, affected
   native/browser/performance checks, rendered QA, and generated ownership.
5. Commit coherent checkpoints, push the feature branch, and open/update a linked
   draft PR. Capture exact source/input-bound raw receipts; use
   `engineering/worker-handoff.md` for portable bundles when needed.
6. Give a fresh internal reviewer the full diff, acceptance, and completed evidence.
   Repair findings on the same branch; the parent reviews/integrates and performs
   authorized main merges. Workers never push main. Report useful results and
   concrete blockers, not repeated status snapshots.

GitHub owns task status; `parity.json` owns verified gameplay coverage. No delivery
clock, browser watcher, separate reviewer chat, or Local Dev release step is required.
Retain all evidence boundaries and permissions. A denied operation does not authorize
another route around the safeguard. Follow `engineering/efficiency-review.md` if
work repeats without reducing uncertainty or delivering accepted behavior.
