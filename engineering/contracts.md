# Compact task contract

Use one JSON file for a substantial task. Store per-run contracts and receipts under
ignored `work/orchestration/`; do not create a database for trivial edits.

Create the contract only after selecting the implementation milestone. Read-only
priority triage needs no task spec, contract, or receipt. A gameplay contract covers
the vertical outcome through the shipped UI, campaign, or normal system path; a
test-injected entity or isolated helper is not a stopping condition.

Before editing, write a task spec containing the `intent`, `scope`, `ownership`,
`verification`, and `completion` sections below. Add `research` and `modernization`
when relevant; their arrays otherwise default to empty. Omit `version`, `identity`,
and old results. An optional top-level `inputPaths` array names additional policy
or evidence files to hash alongside GOAL, parity, and the reviewed check/map files.

```sh
npm run orchestration:prepare -- --spec work/orchestration/task-spec.json --task-id task --contract work/orchestration/task-contract.json
```

The helper captures the actual HEAD and all current changes as the baseline. Use
`--base <actual-ref>` when a different base is intended. It validates the result,
refuses to overwrite a contract, and never executes checks. The example below is
the resulting full format; handwritten contracts remain supported.

```json
{
  "version": 1,
  "identity": {
    "taskId": "selection-example",
    "baseCommit": "ACTUAL_FULL_COMMIT",
    "baseline": [],
    "inputFingerprints": {
      "parity.json": "SHA256"
    }
  },
  "intent": {
    "objective": "Bounded objective",
    "nonGoals": ["No parity bookkeeping"],
    "acceptance": ["Observable acceptance criterion"],
    "risk": "medium"
  },
  "scope": {
    "subsystemIds": ["selection"],
    "parityIds": ["interface.commands.world-drag"],
    "boundaries": ["Vehicle selection remains open"]
  },
  "ownership": {
    "implementationOwner": "parent",
    "allowedPaths": ["app/drag-selection.ts", "tests/drag-selection.test.mjs"],
    "prohibitedPaths": ["PARITY.md", "parity.json", ".openai/hosting.json"],
    "generatedPaths": []
  },
  "research": {
    "nativeQuestions": ["What do the intercepted consumers leave unproved?"],
    "evidence": ["decomp/README.md#native-follower-selection"],
    "assumptions": []
  },
  "modernization": {
    "risks": ["Picking must remain correct at high DPI"],
    "measurementNeeds": [],
    "corrections": []
  },
  "verification": {
    "requiredCheckIds": ["selection-portable", "selection-browser-drag"],
    "rationale": ["Pure rules plus live pointer/GPU integration"],
    "artifacts": ["work/orchestration/selection-example"],
    "results": []
  },
  "completion": {
    "requiredReview": "fresh reviewer",
    "permittedBookkeeping": [],
    "stoppingConditions": ["Acceptance checked and remaining gaps reported"]
  }
}
```

`identity.baseline` captures pre-existing working-tree entries from the plan as
`{"path":"...","status":"M","endpoint":"path","source":"unstaged","hash":"...","changeHash":"..."}`.
The source-specific patch hash distinguishes staged and unstaged content even when
they share a final file hash. Audit separates an unchanged baseline entry from task
changes and fails if a baseline entry disappears. `inputFingerprints` protects
relevant policy, fixtures, and evidence from unnoticed drift.

For a `pnd-performance` assignment, add a nonblank `measurementNeeds` item and a
`modernization.workloadEvidence` reference that also appears in `research.evidence`.
It must cite an exact, distinct `references/modern-performance.md` workload or
measurement heading; `Measurement rules` is supplied separately and cannot stand in
for the workload.

Optional verification results use:

```json
{
  "checkId": "selection-portable",
  "status": "passed",
  "command": [
    "node",
    "--test",
    "tests/drag-selection.test.mjs",
    "tests/drag-occupants.test.mjs",
    "tests/person-selection.test.mjs",
    "tests/world-picking.test.mjs",
    "tests/selection-raster.test.mjs"
  ],
  "testedFingerprint": "SHA256",
  "inputPaths": [
    "app/drag-selection.ts",
    "app/person-selection.ts",
    "app/world-picking.ts",
    "tests/fixtures/drag-selection.json",
    "tests/fixtures/drag-occupants.json",
    "tests/fixtures/selection-raster.json"
  ],
  "exitCode": 0,
  "artifacts": [],
  "reason": ""
}
```

Allowed statuses are `passed`, `failed`, `blocked`, `not-run`, and
`not-applicable`. A passed result requires the registered exit code and a fingerprint. Audit
requires the exact registered command (allowing concrete values for environment
placeholders), requires fingerprint coverage for every declared check input, and
requires exactly one result—including an explicit blocked or not-run result—for
every required check. Every status carries a fingerprint; failed executions carry
their exit code. Passed results must match the registered exit code and artifacts.
Audit recomputes each fingerprint, so later source or fixture changes invalidate it.

Optional `verification.coverage` entries such as
`{"checkId":"orchestration-tests","coveredBy":"repository-check"}` describe
the two reviewed checks included in the repository aggregate. Preparation removes
those duplicate required IDs only while npm scripts and registered commands match.
Verification validates the coverage again and includes covered inputs in the
aggregate fingerprint. A successful result lists `coveredCheckIds`; it records the
actual aggregate command and never invents separate executions. Script drift rejects
an old coverage agreement; prepare a new contract or explicitly restore separate
required checks and remove their coverage. A failed aggregate gives no constituent
pass claim. Native, browser, build, and performance evidence is never subsumed.

Results are atomically saved before execution and after each completion, including
blocked checks. An interrupted run preserves completed results, marks the active
check blocked, and leaves later checks not-run. Restarting does not reuse old passes.

Generate delegated assignments from the parent contract with `context --role`; do
not maintain a second contract. The emitted envelope contains task/base/input
identity, one question and role deliverable, a 350–500 word response budget, no
write authority, forbidden actions/paths, acceptance and stop conditions, current
direction with source hashes, exact parity/check scope, evidence, corrections,
unknowns, and expandable omissions. Reviewer envelopes additionally contain the
actual final change records and fingerprint, a tracked full-diff command, and every
untracked path. An overflow is explicitly `incomplete`.

Role packets use 350–500 word Cavecrew-style response contracts: scouts return ranked
path/line findings, native and performance specialists return named evidence/limit
blocks, and reviewers return finding lines plus receipt status and ACCEPT/REJECT.
Handoffs retain exact source/symbol evidence, unresolved questions, changed files,
actual check results, and stop status—not chain-of-thought, repeated context, or copied
terminal logs.
