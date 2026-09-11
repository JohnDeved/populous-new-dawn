---
name: populous-engineering
description: Evidence-driven engineering workflow for Populous New Dawn parity, native executable research, browser integration, and modern desktop performance work. Use for substantial gameplay, rendering, input, native-comparison, evidence, or profiling changes in this repository.
---

# Populous engineering workflow

Invoke explicitly as `$populous-engineering` before a substantial repository task.

1. Read root `AGENTS.md`, `GOAL.md`, and the applicable sections linked from
   `engineering/README.md`. Record HEAD and all working-tree changes before editing.
2. If the user has not fixed the objective, perform a bounded triage before choosing
   a subsystem. The parent may use `pnd-scout` to compare at most five candidates and
   return the top three plus one evidence-backed recommendation. Rank
   player-visible/playability impact and unblock value first; then live integration
   gap, evidence/check confidence, effort, risk, and prerequisites. The parent makes
   the final choice. Do not derive priority from parity percentage or document
   position alone.
3. Retrieve bounded current context:

   ```sh
   npm run orchestration:context -- --subsystem <id> --query "<question>"
   ```

   For performance work, read the packet's cited sections of
   `references/modern-performance.md`; expand only for relevant corrections or an
   explicitly broad historical audit.

4. For non-trivial work, save a contract using `engineering/contracts.md`. Resolve
   exact parity IDs from the current ledger and record baseline/input fingerprints.
5. Keep one implementation owner. Delegate only independent source/native research
   or a fresh final review using the focused project agents in `.codex/agents/`.
   Assign a bounded deliverable, allowed writes, evidence expectations, and stop
   condition. Do not recursively delegate.
6. Before verification, select checks without executing them:

   ```sh
   npm run orchestration:plan -- --base <actual-base-ref>
   ```

7. Inspect selected commands, prerequisites, side effects, and resource conflicts.
   Execute only applicable checks. Never append `--record` unless recording is the
   explicitly authorized task.
8. Audit scope and generated ownership:

   ```sh
   npm run orchestration:audit -- --contract <task-contract.json>
   ```

9. Report conclusions, exact sources/symbols, remaining limits, changed files, and
   every required check as passed/failed/blocked/not-run/not-applicable with the
   tested fingerprint. Stop at the contract's stopping condition.

`engineering/README.md` governs architecture, evidence boundaries, resource
serialization, performance records, and parity bookkeeping. The manifests there
are reviewed routing aids; `parity.json` remains the only completion ledger.
