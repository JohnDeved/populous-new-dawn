# Compact task contract

Use one JSON file for a substantial task. Store per-run contracts and receipts under
ignored `work/orchestration/`; do not create a database for trivial edits.

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

Delegated assignments are smaller than the parent contract but must name the
bounded question/deliverable, allowed write paths (often none), required evidence,
and stop condition. Handoffs contain conclusions, exact source/symbol evidence,
unresolved questions, changed files, actual check results, and stop status—not
chain-of-thought or copied terminal logs.
