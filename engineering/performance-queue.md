# Shared test queue

## Choose the execution model first

The detached queue below requires one stable host, PID namespace, and network
namespace for its controller, jobs, and recovery commands. A shared filesystem or
Git common directory does **not** establish that scope. Some cloud tool calls use
fresh namespaces: a later `ps`, PID lookup, or missing tool session cannot prove an
earlier process stopped. Use the foreground path for functional checks there.

### Foreground functional checks in isolated cloud invocations

Use one parent-coordinated foreground run at a time, with a fresh detached worktree
at the exact candidate commit. Keep writable `node_modules`, build output, tool
caches, and `TMPDIR` private to that run; do not symlink/hardlink writable dependency
trees or reuse a checkout belonging to an unknown run. Read-only native data can be
shared when the inspected checks do not modify it. Inspect every command's writes;
prefer a private sibling temporary directory outside the source package so generated
scripts cannot accidentally inherit its `package.json` module type.
no shared fixed ports, profiles, capture paths, or record modes. The receipt helper
does not enforce isolation or manage arbitrary daemons.

Run the existing command receipt helper directly, without the detached queue:

```sh
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/unique-attempt/check.json \
  --input scripts/orchestration/command-receipt.mjs \
  --input package-lock.json --input node_modules/.package-lock.json \
  -- npm run check
```

Include every ignored/untracked helper, configuration and external input read by
the command using repeatable `--input` arguments (or the `inputs` array in
`runCommandReceipt`). If the candidate lacks the repaired helper, use a frozen
copy as an explicit input and call `runCommandReceipt(candidateRoot, options)`;
do not edit the candidate under verification. HEAD, tracked diff, and explicit
input hashes are captured before and after execution. A changed input produces
`invalidated`, even when the command exits zero. Accept `status: passed`, not just
an exit code. Advisory failures still need their actual failed status and limits.

Before launching, the helper saves `status: unknown`, `phase: prepared` and the
command/source identity. Raw stdout/stderr stream to adjacent `.artifacts` logs.
Only the same foreground invocation can replace that record with a terminal
receipt after the child returns. Reusing an output path is refused. A lost session,
cancelled wait, stale timestamp, or prelaunch record without terminal fields is
still **unknown**, never a pass or a cleanup receipt. Use the supported existing
tool session to await it when available; do not guess PIDs from another invocation.

If an old queue job has unknown cleanup, retain its checkout, lock and receipts.
The parent may authorize fresh isolated functional checks after checking that they
share no writable resources with that job. This does not recover the old queue or
establish machine idleness; timing/performance claims remain blocked. Browser work
also needs its reviewed same-invocation process guardian and private resources.

## Stable-scope detached queue

Use `node scripts/performance-queue.mjs run job.json` for **prepared, authorized**
performance/browser jobs and competing native/build/full-check workloads. Submission
starts a background controller; it runs jobs FIFO without an agent waiting, a service
installation, or a dated time slot. Source work and small portable checks can continue.
One exclusive lane deliberately favors clean measurements over maximum concurrency.
Retain the owned background controller until its jobs finish; ending a waiting
client must not kill an active job or erase its recovery receipt.
Browser checks use the queue's `supervise` mode unless they already have a reviewed
parent guardian. The supervisor owns startup, checker descendants and cleanup.

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

`run` prints a compact job-ID/recovery receipt to stderr **before** waiting; final
stdout remains one result object. An executor foreground timeout can end the waiting
client while the detached job continues. Resume with `wait JOB_ID`, not another test.
Identical unfinished submissions (effective spec and source fingerprint) reuse one
job, even across concurrent callers. If the same spec has different inputs while its
job is unfinished, submission refuses and names that job; wait or cancel it before
submitting corrected inputs. Terminal jobs are not deduplicated: use their saved ID
to recover a lost result, rather than invoking `run` again after completion.

```json
{
  "owner": "worker task ID",
  "label": "authored hut menu browser acceptance",
  "cwd": "/absolute/isolated/worktree",
  "command": ["node", "scripts/performance-queue.mjs", "supervise", "scripts/check-browser-building-menu.mjs"],
  "inputs": ["scripts/performance-queue.mjs", "scripts/check-browser-building-menu.mjs"],
  "ports": [4314],
  "timeoutMs": 480000,
  "cleanup": "receipt",
  "env": { "POPULOUS_URL": "http://127.0.0.1:4314" }
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

`supervise CHECKER [ARG...]` starts the development server on `POPULOUS_URL`, waits
on that exact URL, then starts the checker in a separate owned process group. It
installs cleanup before the checker loads, so dependency/import failures and checker
exceptions retain the same verified-release gate. The queue requires the URL's port
to be the job's one declared port. Only the supervisor receives `PND_QUEUE_CLEANUP`.
It records descendant process groups and their creation identities, then rechecks an
owned identity immediately before a group signal. Missing or changed identity proof
withholds the receipt and preserves the queue block.

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
recover a live owner/job. Controller and job records must first match the caller's
execution scope; old records without that evidence also fail closed. Neither a
foreign-namespace PID absence nor `Unknown process id` from an executor supplies
the missing proof. Keep those jobs unknown and use supported original-session
evidence or an authorized isolated functional run. If startup crashed before recording its PID, or a recovery
process itself crashed leaving `recovery.lock`, inspect the exact process ownership
and repair the receipt/lock under one operator; do not automatically delete it on age.
PID reuse can conservatively block recovery; it must never authorize killing another
process. A blocked queue is preferable to contaminated measurements.

Admission uses a short `submission.lock` containing its PID/identity; it never holds
the lock while executing a job. If a submitter crashes inside admission, verify that
exact owner is gone and inspect the recorded job/order before removing only that
lock. Do not expire it by age or remove a live owner's lock.

Do not mix manual timed grants and automatic jobs. Finish/release existing grants,
pause while an outside-queue workload owns the machine, then have every worker use
this lane. The CEO reviews failed evidence and code; ordinary successful queue
handoffs require no CEO message exchange. Queue work earns no gameplay/parity credit.

Focused verification: `node --test tests/performance-queue.test.mjs`.
