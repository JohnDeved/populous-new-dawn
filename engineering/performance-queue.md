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

Before creating the worktree or copying private dependencies, check user-available
space on the **destination filesystem** (use its existing parent if the target does
not exist). Record the destination, timestamp, available bytes, source paths and
their full-copy size estimate, plus an explicit reserve for build output, caches,
temporary files and receipt logs. Include every copy still to be made; do not assume
reflinks, sparse files or hardlinks will save space. Stop preparation if available
bytes are less than the copy estimate plus reserve, or either value is unknown.
Check again immediately before a large dependency copy if preparation intervenes.
This is a point-in-time guard, not a reservation or guarantee against ENOSPC; other
writers, inode exhaustion and quotas can still cause failure.

If space is insufficient, coordinate with the parent. Reclaim only explicitly owned,
completed runs whose dependencies are not used by another checkout. Preserve source,
raw logs, receipts, queue locks and dependency-lock identity before removing generated
dependencies or build output. Unknown runs remain untouched; a missing process in
another execution scope does not prove completion. Recheck available space before
retrying, and never solve the shortage by sharing writable dependency trees.

For example, on Linux, GNU `du -s -B1 --count-links SOURCE...` reports allocated
bytes; repeat with `--apparent-size` and use at least the larger estimate for each
source. Count repeated copies separately and allow for destination allocation
overhead. Record the source commit and dependency-lock hashes; size is not input
identity. Declare the output/scratch reserve from the planned workload and retained
comparable output sizes, with headroom, rather than treating a fixed value as safe.
After assigning those byte estimates and an existing destination parent, this
read-only Node check prints the budget and exits nonzero on a shortage or bad input:

```sh
node --input-type=module - "$existingDestinationParent" "$fullCopyBytes" "$outputScratchReserveBytes" <<'NODE'
import { statfsSync } from 'node:fs'
const [destination, copy, reserve] = process.argv.slice(2)
if (!destination || !/^[0-9]+$/.test(copy ?? '') || !/^[0-9]+$/.test(reserve ?? '') || BigInt(reserve) === 0n)
  throw new Error('Declare destination, full-copy bytes and a positive output/scratch reserve')
const { bsize, bavail } = statfsSync(destination, { bigint: true })
if (bsize <= 0n || bavail < 0n) throw new Error('Unknown usable filesystem capacity')
const available = bsize * bavail
const required = BigInt(copy) + BigInt(reserve)
console.log(JSON.stringify({ destination, measuredAt: new Date().toISOString(),
  blockBytes: String(bsize), availableBlocks: String(bavail), availableBytes: String(available),
  fullCopyBytes: copy, reserveBytes: reserve, requiredBytes: String(required),
  status: available >= required ? 'sufficient-at-measurement' : 'insufficient' }))
if (available < required) process.exitCode = 1
NODE
```

Retain the output with the preparation evidence and require a zero exit before
proceeding. The command neither copies nor deletes anything and does not reserve space.

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
`runCommandReceipt`). The programmatic writer returns a Promise; await it before
reading the receipt or advancing to the next command. If the candidate lacks the
repaired helper, use a frozen copy as an explicit input and call `runCommandReceipt(candidateRoot, options)`;
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

### Same-invocation test-throughput comparisons

For the bounded test-workflow comparison, predeclare the order within one foreground
invocation and use the same committed source, complete test set, group order,
Node executable/version, environment and inspected read-only dependency bytes.
Only the declared concurrency/profile may differ. Retain source, runner, helper,
lockfile and installed-package fingerprints before and after, all raw results,
per-group coverage/exits and owned-process CPU/RSS telemetry. Give each attempt
private outputs and temporary directories. Coordinate it as the sole currently
scheduled heavy lane; never edit its loaded runners or dependencies.

This can establish comparative command throughput in that invocation even when
old jobs, machine quota or external host contention cannot be resolved. State
those unknowns explicitly. It does not establish host idleness, recover old jobs,
certify their cleanup, or measure hardware game performance. The existing rules
for preserving unknown jobs and their writable resources remain unchanged.
Read-only installed dependencies may be shared for this inspected comparison;
any command that can write them needs the existing private-resource preparation.

Reject drift, unequal selected cases, missing completion and failed/cancelled
attempts as successful speedup evidence. Preserve all failed/unknown attempts.
Report cold/warm conditions, order effects and observed memory tradeoffs; hashing
reads warms filesystem caches and is not a genuinely cold start. A small pilot
cannot establish whole-suite saving. Compare the complete identical final test
set before making that claim. Keep typecheck/cache effects separate from the
test phase, and retain the full correctness and build gates. A single complete
C1-to-C2 pair may report its observed same-workload delta, explicitly subject to
order, cache and host variability. It is not balanced or demonstrated repeatability.
An order-controlled A/B/B/A pilot is separate supporting evidence, not a reason to
extrapolate its percentage or erase the complete pair's sampling limits.

### Optional bounded foreground advisories

For a foreground advisory whose children do not detach, the existing queue tool
also offers a same-invocation supervisor. It does not submit a queue job or acquire
its shared lane. Coordinate expensive work with the parent as above. Choose an
explicit timeout for the particular attempt; no timeout or quality default changes.
For example, a deliberately two-minute health investigation can use:

```sh
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/unique-attempt/health.json \
  --input scripts/performance-queue.mjs \
  --input package-lock.json --input node_modules/.package-lock.json \
  -- node scripts/performance-queue.mjs foreground 120000 -- npm run quality:health
```

`foreground TIMEOUT_MS -- COMMAND [ARG...]` requires a positive integer timeout,
passes direct argv, and inherits raw stdout/stderr into the receipt's logs. It
checks the owned process-group identities before signalling, sends TERM and then
KILL if necessary, and checks release even when the command leader exits early.
The deadline excludes the bounded cleanup grace period. Timeout exits 124,
interruption exits 130, and findings preserve the child's nonzero exit; even a
TERM handler exiting zero cannot turn a timeout into a pass. The terminal summary
in stderr distinguishes `timed-out`, `interrupted`, and `cleanup-blocked`; the
outer command receipt remains a failed non-pass with raw evidence.

This mode is only for foreground commands whose descendants stay in the owned
process group, not browsers, detached daemons, or arbitrary process discovery.
Unknown identities or failed cleanup cannot certify release. Losing/killing the
outer receipt session still leaves its prepared receipt **unknown**; a missing
session never proves cleanup. Keep its resources and logs as described above.
Required check/build gates and long-running explicitly requested jobs are unchanged.

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
New submissions retain the caller's effective specification as `requestedSpec`.
`spec.command` contains transport argv described by the versioned `executionEnvelope`:
a frozen launcher and original argv/declared ports, not a replacement description of the user's
command. Retry matching uses `requestedSpec` and, for guarded jobs, the frozen
effective `NODE_OPTIONS`; source fingerprints still bind the
original inputs. The frozen launcher bytes are hashed in `executionEnvelope`.
Before any payload starts, it verifies the launching parent's PID/start identity,
the lock owner's supported protocol, exact submitting-controller source SHA256,
and declared-port environment. A different queue-source revision fails closed even
if it advertises the same protocol; it must release normally before a matching
controller can serve a new guarded payload. An unchanged legacy controller can dequeue this envelope but cannot
run its payload: rejection exits nonzero, records the original command/reason in
`launch.json`, and supplies an empty prelaunch cleanup receipt because no payload
was started. This is a failed job, never a successful check.
After launch, the payload alone remains responsible for its normal cleanup receipt.
No requested environment reaches the launcher: its transport env only clears
`NODE_OPTIONS` before Node initializes. After validation it reads the requested env
from private job data, verifies the frozen environment digest, and applies it only
to the payload. Values are not copied into process argv. The effective requested
or submitter-inherited `NODE_OPTIONS` is frozen separately for payload restoration;
arbitrary inherited environment is not copied. Controller-supplied `PND_QUEUE_*`
fields still override caller values. This is not a security sandbox for an already
customized controller process environment.
The launcher resolves the command with the payload's PATH and performs a true exec
handoff: the payload retains the controller's original child PID/process group, so
even SIGKILL escalation remains directly reapable. It neither starts a second queue
nor changes ownership, FIFO, or port admission. `launch.json` status `handoff` is a
synchronous pre-exec record, not proof of successful execution or cleanup.
Guarded detached jobs require a supported POSIX runtime exposing experimental
`process.execve` (added in Node22.15/23.11; verified here on24.19). A missing feature
fails before launch; there is no spawn fallback or whole-project engine change.
Commands must be kernel-executable binaries or supported shebang scripts. This is
not execvp's implicit shell fallback for executable text lacking a shebang.
Missing/non-executable paths are rejected before handoff. Node24 can abort on a
later kernel error, such as a missing interpreter or a path race: no synthetic
cleanup receipt is written, so the job remains nonpassing/cleanup-blocked. See the
[pinned execve contract](https://nodejs.org/download/release/v24.19.0/docs/api/process.html#processexecvefile-args-env).
Existing unwrapped jobs remain readable/executable by current controllers; no live
controller, lock, or already-admitted historical command is rewritten or upgraded.
Use a current submitter for new work. Legacy submitters compare the old transport
specification and cannot deduplicate guarded jobs; resubmitting through one can
create a separate, unguarded job. Current submitters match both guarded requests
and historical canonical specs. For an existing submission, including from an old
caller, use `wait JOB_ID`: its ID and status remain specific to that job. A separate
duplicate's success never turns a rejected guarded job into a success. These
guards do not retroactively protect unwrapped jobs admitted by legacy submitters.
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
- `PND_QUEUE_PORTS`: exact comma-separated declared ports, including an empty string
  when no ports were declared. It must not be inherited from another job.

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
