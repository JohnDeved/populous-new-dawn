# Shared test queue

Use `node scripts/performance-queue.mjs run job.json` for **prepared, authorized**
performance/browser jobs and competing native/build/full-check workloads. Submission
starts a background controller; it runs jobs FIFO without an agent waiting, a service
installation, or a dated time slot. Source work and small portable checks can continue.
One exclusive lane deliberately favors clean measurements over maximum concurrency.
When submitting through Local Dev, retain the intentional background controller
(`backgroundProcessPolicy: keep`); completing the submission task must not kill it.
Individual test runners still clean all their own processes before returning.

All linked worktrees share `<git-common-dir>/pnd-test-queue`. Do not use a separate
`--dir` for real jobs: that option exists for isolated queue tests. Other repositories,
user applications and commands launched outside the queue are not controlled.

## Submit once, continue working

`run` enqueues and waits internally, then returns one compact result and exit code to
the calling worker. No CEO permission, time-slot negotiation, status polling or
completion acknowledgment is needed for already authorized work. The worker handles
ordinary test failures and resubmits corrected inputs itself. `submit` returns
immediately when the worker has independent work; `wait JOB_ID` later resumes waiting.
A paused/crashed queue returns `deferred` (exit2) with the existing job ID: do not
enqueue a duplicate. Escalate only unresolved resource cleanup or acceptance decisions.

```json
{
  "owner": "worker task ID",
  "label": "issue24 matched hover diagnostic",
  "cwd": "/absolute/isolated/worktree",
  "command": ["node", "work/orchestration/issue24/run-measurement.mjs"],
  "inputs": ["work/orchestration/issue24/run-measurement.mjs"],
  "ports": [4318],
  "timeoutMs": 480000,
  "cleanup": "receipt"
}
```

Use direct argv, never interpolate shell command strings. Include **all ignored or
untracked helpers/configuration read by the runner** in `inputs`. Tracked changes
and HEAD are bound automatically; source drift blocks that job before launch.
Prefer a committed candidate. The job JSON, exact fingerprints, command log, queue
wait/execution times and final status are retained privately in the shared directory.
No retries are automatic. Fix a failed input or setup, then submit a new job.

Optional `env` is a string-valued object for job-specific environment settings.
The submitting worker's PATH is retained, not inherited from another job's controller.
Results return directly to the calling worker via `run`/`wait`; no completion
message bridge or CEO acknowledgment is required. `submit` provides the job ID for
independent work. A runner may send an already-authorized exceptional notification
through its existing bridge, covered by the same process cleanup contract. The queue
deliberately has no separate notification subprocess lifecycle.

## Runner contract

Replace old wall-clock slot guards with these supplied environment variables:

- `PND_QUEUE_JOB_ID`: unique execution ID.
- `PND_QUEUE_OUTPUT`: fresh, owned output directory.
- `PND_QUEUE_DEADLINE`: absolute ISO timeout; reserve cleanup time **inside** it.
- `PND_QUEUE_CLEANUP`: exact path for the final cleanup receipt.

Reuse the existing startup, measurement and process guardian. The runner must own
and clean every browser profile, detached process group, server and temporary wake
assertion it starts, including on SIGTERM. Never stop a pre-existing shared server.
Declare only ports the runner owns; an existing shared server needs explicit owner
coordination and must not be listed as a port to acquire/release.

After cleanup, atomically write this receipt (temporary file then rename):

```json
{
  "jobId": "value of PND_QUEUE_JOB_ID",
  "resourcesReleased": true,
  "releasedAt": "actual ISO time",
  "processes": [
    { "pid": 12345, "group": true },
    { "pid": 12346, "group": false }
  ]
}
```

List **all** owned detached group leaders and separately owned processes, even after
they exit. The controller independently checks their absence, the command group and
declared IPv4/IPv6 loopback ports. This receipt is an explicit trusted-runner cleanup
contract, not an OS sandbox or a discovery mechanism for omitted detached children.
Use the existing guardian's complete process/profile accounting before declaring
release. A ready job must already have its required input and acceptance assertions;
queue scheduling cannot turn an unprepared command into a valid test.

For simple foreground CPU commands with **no detached descendants**, `cleanup` may
be `process-group`, requiring only command-group and port cleanup. Do not use this
mode for Playwright/Chromium or a daemonizing command.

The runner retains its own display/renderer/readiness checks. Temporary `caffeinate`
belongs to the runner and its cleanup receipt. Failed readiness remains a failed or
blocked measurement; the queue neither retries it nor manufactures FPS evidence.

## Status, cancellation and recovery

```sh
node scripts/performance-queue.mjs status
node scripts/performance-queue.mjs cancel JOB_ID
node scripts/performance-queue.mjs pause "outside-queue native workload"
node scripts/performance-queue.mjs resume
```

`pause` prevents another start; it does not interrupt the active command. Cancellation
and timeout send SIGTERM to the owned command group, then SIGKILL after five seconds
if that same process identity still exists. The next job starts only after cleanup
checks pass. Missing/stale receipts and surviving processes pause the whole queue.
There is no blind lock expiry or global process-name kill.

A controller crash deliberately leaves its lock and active job. After the **existing
runner** completes cleanup, `recover` verifies the old controller is gone and the
active job is clean, marks it interrupted and resumes queued work. It refuses to
recover a live owner/job. If startup crashed before recording its PID, or a recovery
process itself crashed leaving `recovery.lock`, inspect the exact process ownership
and repair the receipt/lock under one operator; do not automatically delete it on age.
PID reuse can conservatively block recovery; it must never authorize killing another
process. A blocked queue is preferable to contaminated measurements.

Do not mix manual timed grants and automatic jobs. Finish/release existing grants,
pause while an outside-queue workload owns the machine, then have every worker use
this lane. The CEO reviews failed evidence and code; ordinary successful queue
handoffs require no CEO message exchange. Queue work earns no gameplay/parity credit.

Focused verification: `node --test tests/performance-queue.test.mjs`.
