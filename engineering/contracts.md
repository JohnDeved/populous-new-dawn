# Compact task contract

Optional: use one JSON contract when a substantial task benefits from mechanical
scope/fingerprint verification. The GitHub issue/PR still owns acceptance and status;
do not duplicate a task board here. Store per-run contracts and receipts under
ignored `work/orchestration/`. A compact brief is enough for narrow work.

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

Raw contracts and run receipts remain ignored working evidence. Before final review of
tracked work, use `engineering/worker-handoff.md` to export only the bounded receipts
needed for review into a non-overlapping review bundle with exact source/receipt hashes.
Do not copy credentials, environment files, personal profiles, or unrelated machine logs.

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

## Verification command logs

Production verification commands stream raw stdout and stderr into a fresh
attempt-owned directory below the task's ignored checks directory. The active
blocked result names its pending capture descriptor before spawning. The terminal
result's log names the actual unique diagnostic file; never assume a fixed check
filename. Historical files are retained, including when an injected executor uses
the legacy string adapter (the original filename is used only if absent).

The raw files are authoritative, with independently observed byte counts and
SHA-256 hashes. The diagnostic log preserves the historical interpretation:
stdout decoded with UTF-8 replacement, followed by independently decoded stderr,
including BOMs and each stream's final incomplete sequence. It is not an
interleaved transcript. Production outcomes contain bounded metadata, not complete
raw strings. The public injected-executor string adapter remains supported.

A capture descriptor is complete only with guard-v1 publication, terminal status,
publication.complete present, and publication.pending absent. Child close, stream
closure, held-file identity/hash checks, and writer close must all finish before
completion. Failed child exit/timeout still retain complete output; write, read,
identity, close, or publication failure leaves nonpassing guarded evidence and the
active contract blocked. Only the exact spawned child is terminated on capture
failure. This does not add process-group ownership or change owned-server cleanup.

This slice removes output-proportional retained parent buffers, not disk growth.
Synchronous writes of at most 64 KiB apply kernel pipe backpressure without an
unbounded JavaScript queue; slow storage can delay event-loop timers. The later
diagnostic pass also uses bounded reads and separate streaming decoders. This is
not asynchronous filesystem I/O, a hard RSS limit, or a wall-time guarantee.
Raw and diagnostic files still grow with complete output, and malformed UTF-8 can
expand the diagnostic representation. Continue resource admission and preserve
original artifacts; review derivatives never authorize original retirement.
A justified disk cap and storage retention remain open.

### Owned game-server logs

Owned dev-server output uses a separate capture format: one fresh raw payload
combines stdout and stderr bytes in observed event order, without UTF-8 decoding,
per-stream files, or an automatic diagnostic copy. Earlier attempts are retained.
The startup blocked result names the pending server capture before spawning.

For each owned browser segment, completed check receipts and parity measurements
remain durably blocked until that exact server's stdio closes and its capture
passes identity/hash checks, writer close, and guarded publication. Only then are
the original result timestamps, source identities, and fingerprints promoted
together by atomic contract persistence. Capture, cleanup, or promotion failure
cannot leave these results passed. Caller-supplied `POPULOUS_URL` is not owned
and is never signaled. Legacy injected servers may still return a numeric stop
result; that compatibility path does not supply production capture evidence.

Only the exact spawned direct child receives TERM, then KILL if still live.
Descendant-held pipes reach an explicit incomplete drain deadline rather than
claiming descendant cleanup. Synchronous bounded writes can delay those timers;
readiness fetches still have no hard per-request deadline. Raw disk growth is
unbounded. This removes the output-proportional retained server buffer, not these
lifecycle, disk, or wall-time limits.

The dedicated command-log suite uses real subprocesses and copied verification
code in synthetic repositories. It establishes transport/lifecycle mechanics, not
gameplay, browser, native equivalence, or application performance. Standard full
check/build and other routed checks remain separate gates. Rollback must distinguish
the command and owned-server integrations and their shared helper, reverting
dependent tests/registrations and notes consistently;
it must not delete prior raw evidence or alter command receipt v1/v2 defaults.
