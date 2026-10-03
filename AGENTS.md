# Populous New Dawn engineering

Recreate Populous: The Beginning for modern desktop browsers. Preserve playable
behavior, evidence quality, and existing user work. Read `GOAL.md` for direction and
`engineering/README.md` for the operational protocol; use `$populous-engineering`.

## Start and ownership

- Record HEAD and `git status --short` before editing. Never reset, clean, or
  overwrite pre-existing work. Verify the actual executor, tools, and paths.
- GitHub issues, labels, and linked draft PRs own priorities, ownership, blockers,
  and delivery status. Continue the assigned issue; do not duplicate that board in
  local timers, chat watchers, or status files. `parity.json` measures verified
  gameplay coverage, not task status; `PARITY.md` is generated, never hand-edited.
- Use one writer per isolated branch/worktree. The parent coordinates up to six
  workers, reviews finished PRs, and owns integration and authorized main merges.
  Workers push their feature branches and open draft PRs; never push main directly.
- Give specialists a bounded question, exact base/head, relevant sources, permitted
  writes, acceptance, and a stop condition. Use an internal fresh reviewer for
  substantive changes. No separate ChatGPT reviewer conversations or browser
  wake/watch routing. Repository work uses the available executor, without a
  mandatory Local Dev project binding or release ritual.
- Serialize shared Ghidra projects, full checks/builds, fixture recording, fixed
  ports/capture paths, and performance measurements. Independent source work can
  proceed concurrently. Use `engineering/performance-queue.md` when jobs compete:
  isolated foreground receipts for fresh cloud execution scopes, detached queue
  only within a stable shared process/network scope. Preserve unknown old runs.

## Evidence and acceptance

- Trace the shipped UI/campaign/system entry point through changed code and tests.
  Isolated helpers and injected entities do not complete a playable feature.
- Reuse `decomp/research/`, `decomp/exports.json`, reviewed exports, and native probes.
  Follow `engineering/native-research.md` for executable hashes, tool provenance,
  local input recovery, scoped exports, intercepted boundaries, and durable findings.
  Community names are hypotheses; pseudocode is not recovered source.
- Preserve source ownership in `engineering/generated-files.json`. Do not
  mass-regenerate evidence, casually append `--record`, or hand-edit imported assets.
  Leave `.openai/hosting.json` untouched. Deployment, parity recording, credentials,
  paid services, and new GitHub Actions need explicit authorization.
- Select checks with `orchestration:plan -- --base <actual-base>` and inspect their
  commands/side effects. Unknown changed paths require explicit review, never an
  empty check set. Context/contract/audit helpers are optional aids, not a second
  project-management system; see `engineering/contracts.md` when using them.
- Keep `npm run check` and `npm run build` as standard code-change gates. Add
  affected native, local rendered browser, performance, and TypeScript quality
  checks. Docs-only work may use focused structural checks with a stated rationale.
  Never weaken assertions, expected pixels, or parity scope to obtain a pass.
- Record command, exit code, exact tested source/input fingerprint, artifacts, and
  `passed`/`failed`/`blocked`/`not-run`/`not-applicable`. Required missing evidence
  blocks the corresponding claim. Native helper equivalence, browser consistency,
  and hardware performance are different claims.
- Keep raw source-bound receipts and export a portable review bundle when the
  reviewer cannot access them; follow `engineering/worker-handoff.md`. The reviewer
  inspects the full diff, acceptance, and relevant evidence, then returns concrete
  findings and ACCEPT/REJECT. Re-review substantive repairs.

Keep tasks outcome-focused. Diagnose repeated unchanged checks, helper-only progress,
or recurring cleanup using `engineering/efficiency-review.md`; do not cut acceptance.
A denied operation blocks that operation: preserve its reason, respect the safeguard,
and continue independently authorized work. Report a concrete blocker rather than
inventing evidence or stopping useful unrelated work.
