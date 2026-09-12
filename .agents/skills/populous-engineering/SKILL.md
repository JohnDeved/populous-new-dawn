---
name: populous-engineering
description: Evidence-driven engineering workflow for Populous New Dawn parity, native executable research, browser integration, and modern desktop performance work. Use for substantial gameplay, rendering, input, native-comparison, evidence, or profiling changes in this repository.
---

# Populous engineering workflow

Invoke explicitly as `$populous-engineering` before a substantial repository task.

1. The parent reads root `AGENTS.md`, `GOAL.md`, and the applicable sections linked
   from `engineering/README.md`. Delegated specialists start with their role packet
   and relevant source expansion. Record HEAD and working-tree changes before editing.
2. If the user has not fixed the objective, perform a bounded triage before choosing
   a subsystem. The parent may use `pnd-scout` to compare at most five candidates and
   return the top three plus one evidence-backed recommendation. Rank
   player-visible/playability impact and unblock value first; then live integration
   gap, evidence/check confidence, effort, risk, and prerequisites. The parent makes
   the final choice. Use the parity percentage to measure delivered progress; do not
   derive priority from checkpoint weight or document position alone.
3. Retrieve bounded current context:

   ```sh
   npm run orchestration:context -- --subsystem <id> --query "<question>"
   ```

   For performance work, read the packet's cited sections of
   `references/modern-performance.md`; expand only for relevant corrections or an
   explicitly broad historical audit.

4. For non-trivial work, write the judgment fields of a task spec as described in
   `engineering/contracts.md`, then run `orchestration:prepare` before editing to
   capture baseline/input fingerprints and reviewed aggregate check coverage.
5. Keep one implementation owner. Delegate only independent source/native research
   or a fresh final review using the focused project agents in `.codex/agents/`.
   Start new specialists with no inherited thread history and supply one validated
   role packet:

   ```sh
   npm run orchestration:context -- --subsystem <id> --query "<question>" --role <role> --contract <task-contract.json>
   ```

   Start with packet-cited paths/headings; refine the packet query for a disclosed
   candidate path when needed. Do not send whole project history,
   `GOAL.md`, native notes, or the performance log. Do not recursively delegate.

   At safe boundaries after three gameplay slices or observed repeated delivery
   friction, trial the read-only scout assignment in
   `engineering/efficiency-review.md`. Its compact receipt brief replaces the
   gameplay packet for this advisory review; it never replaces final code review.
6. Before verification, select checks without executing them:

   ```sh
   npm run orchestration:plan -- --base <actual-base-ref>
   ```

7. Inspect selected commands, prerequisites, side effects, and resource conflicts.
   For a task contract, execute its allowlisted requirements and record their
   fingerprints with:

   ```sh
   npm run orchestration:verify -- --contract <task-contract.json>
   ```

   Unclassified or recording checks remain manual. Never append `--record` unless
   recording is the explicitly authorized task. Receipts persist after each result;
   interrupted checks remain explicit. Use one final aggregate run for its reviewed
   constituent coverage, retaining separate native/browser/performance evidence.
   Give the fresh final reviewer the finished diff, acceptance, and receipts together;
   repeat review for substantive repairs or unresolved findings.
8. Audit scope and generated ownership:

   ```sh
   npm run orchestration:audit -- --contract <task-contract.json>
   ```

9. Report conclusions, exact sources/symbols, remaining limits, changed files, and
   every required check as passed/failed/blocked/not-run/not-applicable with the
   tested fingerprint. Stop at the contract's stopping condition.

`engineering/README.md` governs architecture, evidence boundaries, resource
serialization, performance records, and parity bookkeeping. The manifests there
are reviewed routing aids; `parity.json` remains the only gameplay and game-mechanics
parity percentage and project-progress ledger.
