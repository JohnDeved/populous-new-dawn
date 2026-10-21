# Resource-safe validation

Resource recovery comes before another expensive attempt. This complements the
[execution model](performance-queue.md) and [shared runtime setup](shared-worktrees.md);
it does not change their isolation, package-manager or acceptance contracts.

## Admit one heavy owner, not four simultaneous builds

The coordinator assigns one heavy execution owner across full checks, builds,
installs, large copies, browser captures and performance runs sharing resources.
Other workers can research, review and edit small source-only worktrees. The current
four-worker-plus-coordinator budget is an operating choice, not a platform limit.
Do not duplicate assets or dependencies just to start a source/docs task.

Before preparation and again before launch, retain a timestamped budget:

- Exact source commit/tree, owner, command, inputs, tool versions and destinations.
- Actual filesystem type and user-available bytes for `$runtime`, `$evidence`,
  `$cache` and `$scratch`; include inode/quota constraints when observable.
- On Linux, `MemAvailable`, `Shmem`, swap state, owned-process RSS/threads and
  available OOM counters; record readable cgroup limits/usage if provided. Missing
  telemetry stays unknown. Host memory totals do not establish an effective limit.
- Full-copy estimates plus positive output/cache/log/rollback reserves. Account
  for other owners' planned writes. A measurement is not a capacity reservation.
- Workload-specific admission and stop criteria, their evidence and owner. Check
  again after hashing/copying; those operations themselves affect resources.

Inspect mounts rather than assuming `/tmp` is disk. [Linux tmpfs](https://www.kernel.org/doc/html/latest/filesystems/tmpfs.html)
uses memory and optional swap, with pages included in `Shmem`; that counter also
includes other shared memory. Disk space and memory are separate budgets, but tmpfs
couples them. Moving verified bytes off tmpfs can relieve memory; deleting the same
number of disk bytes need not. Measure before/after instead of equating `du` with
RAM recovered. Count shared hardlinks by unique device/inode, not once per view.

The recovery incident below used a **3.75 GiB `MemAvailable` admission policy**
(4,026,531,840 bytes). This was a conservative operational rule, not a discovered
platform cap, universal threshold or guarantee that a build would fit. Do not
lower a declared gate merely to obtain a launch. Review changed evidence first.

## Control the pool that actually runs

Verify the installed version/native binary before applying version-specific knobs.
[Rolldown v1.0.1's native binding](https://github.com/rolldown/rolldown/blob/v1.0.1/crates/rolldown_binding/src/lib.rs#L75-L102)
reads `ROLLDOWN_WORKER_THREADS` for its Tokio worker pool; its default is
`num_cpus::get_physical() * 3 / 2`. `ROLLDOWN_MAX_BLOCKING_THREADS` controls a separate
blocking pool, defaulting to 4. Use positive integers. `RAYON_NUM_THREADS` does not
configure this Tokio pool; an explicit
[Tokio builder setting](https://docs.rs/tokio/latest/tokio/runtime/struct.Builder.html#method.worker_threads)
also overrides `TOKIO_WORKER_THREADS`. Do not infer the actual pool size from CPU
affinity, a generic concurrency flag or total CPU count.

Build 03 used `ROLLDOWN_WORKER_THREADS=2`, `ROLLDOWN_MAX_BLOCKING_THREADS=2`,
`RAYON_NUM_THREADS=1` and `NODE_OPTIONS=--max-old-space-size=768`, as recorded in
`build-03-guard.json`. This is **not a recommended universal build profile**. Node's
[old-space setting](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-mib)
limits part of the V8 heap, not all native allocations or aggregate process RSS.
Observe owned descendants and actual thread/RSS peaks; the named-thread count is
not an exact count of async workers. Keep controls invocation-local and retain all
production stages. A smaller thread count alone is not build acceptance.

## Preserve before reclaiming

1. Identify exact owned targets and all consumers, including nested dependency
   links, hardlinks and active/unknown runs. Quiesce affected writers. Missing PIDs
   in another execution scope do not prove a run ended; preserve unknown runs.
2. Preserve source refs/commits, dirty and untracked work, raw receipts/logs,
   research inputs and reusable outputs under [artifact retention](artifact-retention.md).
   Hash and verify the retained copies before removal; a summary is not a backup.
3. For relocation, budget temporary coexistence and rollback. Stage exact bytes,
   modes and link topology on the intended filesystem, verify against the original
   manifest, then switch only the declared consumers. An npm byte relocation is
   not pnpm migration or permission to modify tracked assets.
4. Obtain applicable cleanup authorization for exact paths. Use non-force worktree
   removal for eligible completed trees; never force past retained/dirty work or
   dereference shared targets. Verify survivor packages and every remaining consumer
   after the change. Record rollback requirements and any lost instant-rename option.
5. Remeasure disk, tmpfs, `Shmem` and available memory separately. Retain partial
   build outputs as failed-attempt evidence, never as a successful production `dist`.
   Recheck admission before the heavy owner resumes.

## Bind evidence and report the real outcome

Use a fresh receipt directory per attempt and the existing
[source-bound receipt workflow](worker-handoff.md). Bind exact commit/tree and
tracked state, every external/ignored helper or input, package/lock identities and
actual installed bytes, Node/native toolchain, command/environment controls, and
private outputs. Preserve pre/post verification, raw stdout/stderr and hashes,
guard decisions, resource samples, exit/signal and terminal completion. A path
change requires a verified transition record; it must not rewrite earlier receipts.

- **Blocked admission:** the guard refused before creating the build child. Report
  measured shortage, declared policy, dependency/owner and next action. Its guard
  exit code is not a build exit; mark the build `not-run`, not another failed build.
- **Failed:** the command launched and returned nonzero or a signal. Retain it even
  if a later retry passes. Exit 137 alone does not identify the killer; global OOM
  counter increases support pressure attribution, not exact victim/limit proof.
- **Unknown / invalidated:** no reliable terminal completion / source or inputs
  drifted. Neither is a pass, including when an invalidated child exited zero.
- **Passed:** terminal success plus stable verified inputs and required outputs.
  A preparation, focused test or check pass does not imply build/browser acceptance.

Retry only after a material, recorded remedy and renewed admission. Keep required
`npm run check`, `npm run build` and affected browser/native/performance gates;
storage adapters or alternative package layouts do not silently replace them.

## Measured incident, not a capacity promise

On 2026-10-21, [PR #717](https://github.com/JohnDeved/populous-new-dawn/pull/717)
was checked at commit `cf40c92fe776108b5c542287154d57f8fd02e26c`, tree
`700ff0daa78e95bb86313d4515696f53a24b87df`. Retained evidence distinguishes:

- `terminal-summary.json`: canonical check passed (4,704 passes, 7 skips, no
  failures). Builds 01–03 exited 137. Between builds 02 and 03, peak named native
  threads fell **18 to 5**, but build 03 still failed; OOM counters rose during both.
- `memory-relocation-terminal-summary.json`: exact npm relocation/release increased
  tmpfs free space and decreased `Shmem` by **694,779,904 bytes, about 663 MiB** each.
  `MemAvailable` rose 703,344,640 bytes at that measurement. These are distinct
  observations, not an interchangeable memory-cap calculation.
- `TWO-WORKTREE-REMOVAL-AUDIT.json`: separate tmpfs cleanup recovered
  **176,721,920 bytes (168.54 MiB)** of filesystem capacity; measured `Shmem` fell
  176,472,064 bytes. It is not part of the relocation figure.
- `FOUR-WORKTREE-REMOVAL-AUDIT.json`, `ANGEL-DEPENDENCY-REMOVAL-AUDIT.json` and
  `EIGHT-WORKTREE-REMOVAL-AUDIT.json`: disk-recovery deltas totalled
  **3,237,437,440 bytes (3.015 GiB)**. This is neither RAM reclaimed nor the later
  remaining free disk, because subsequent allocations consumed some capacity.
- `build-04-admission-terminal-summary.json`: at 18:43 UTC, available memory was
  3,933,483,008 bytes, 93,048,832 below the declared policy. No child or build receipt
  was created. At the 18:44 UTC checkpoint, production build and browser acceptance
  remained pending. Later status belongs on the PR, not in this historical example.

These receipt names identify retained review evidence, not files to regenerate or
commit as raw logs. Supply the matching source-bound evidence bundle for review.
Resource relief, dependency sharing and worker reduction are useful remedies;
none substitutes for the still-required successful final gates.
