# Modal invalidation acquisition driver

This dedicated scenario and its opt-in hosted route acquire real browser evidence;
source review and synthetic controls alone do not establish a passing capture. The new `modal-invalidation-browser.yml` workflow requires a
same-repository open nondraft `ready_for_review` event and the exact head label
`modal-v1:<head SHA>`. It checks out the exact proposed merge, uses the existing
locked install and production Home builder, and retains read-only permissions.
No default workflow/scenario, sandbox flag, package or existing deadline changes.

The hosted route runs build and browser workers as the unprivileged runner user
in separate transient systemd control groups. Build runtime is 115 seconds plus
5 seconds for forced cleanup (120 total); browser runtime is 65 seconds plus
5 seconds for forced cleanup (70 total). KillMode=control-group contains detached
Chrome descendants. The limits also bound memory to 4 GiB and tasks to 256.
Before installing dependencies, and again after source/dependency hashing and
before each service, timestamped capacity receipts measure destination mounts,
user-available bytes/inodes, MemAvailable/Shmem/swap, process RSS/threads, parent
cgroup limits/usage/events and available OOM counters. The hosted-only policy
requires 4 GiB worker plus 1 GiB host memory headroom and a separate 4 GiB
private-browser-tmpfs reserve (9 GiB before other tmpfs writes),
and groups declared positive install/cache/output/log/rollback reserves per
filesystem. Insufficient or unknown required capacity blocks launch; these
measurements are not reservations. Owned npm/pnpm caches use the measured job path.

Workers verify their actual service PID/UID, kernel control group and configured
limits before building or launching Chrome. Host receipts verify empty/removed
owned control groups on completion, including after failures. An unavailable or
inconsistent supervisor fails closed; no weaker fallback is provided.

The acquisition driver's 60-second deadline includes context/page creation and
starts context closure independently of a stuck renderer operation. Its cleanup
waits are bounded and late-created contexts are closed. These JavaScript controls
are supplementary; the external service deadline is the hard process owner.

Source, installed dependencies and served build membership/bytes are bound before
and after execution. Browser binary hash/version, real WebGL renderer/viewport,
the in-page build revision and GitHub head/base/tested-merge identities are kept
in the evidence. The source-bound Home builder is reused without modification.

`runModalInvalidation({ browser, url, candidateRoot, output, head, signal })`
uses one fresh context and normal Mission 1 startup. Its dedicated public startup
uses the candidate campaign/scene-binding helpers and one visible Skip introduction
click, with a cumulative 2500 ms click-plus-unlock budget and same-world/scene
checks. Natural completion may remove the control; only an observed same-owner
unlock inside that budget can excuse a click timeout. Other dispatch errors fail
without retry. The unrelated native-ui evidence v2 key contract is not used. It waits for the authored
Shaman, uses ordinary stock and the shipped Blast controls, then presses F9 while
a real windup is alive. A missed windup fails rather than reseeding an entity or
advancing/rewinding a clock. No gameplay performance or native pixel parity is
claimed. The existing modal-invalidating runtime is unchanged.

Before navigation, one exact same-origin `/original/sky.png` request is held.
Original successful response bytes must match the clean candidate's Git blob and
are also recorded by SHA-256. The driver never substitutes a test image. Startup
must finish while this optional sky texture is pending. The test-host-only query
`modal-invalidation=1` exports access to the same scene-asset module instance.
The held material, native person, projectile, world, clock, scene and renderer
identities are checked throughout capture.

Each episode has independent real-RAF observations spanning at least 400 ms
before and after the trigger. The renderer wrapper forwards its original call
once, preserving receiver, arguments, result and thrown identity. It counts
actual calls independently of Three's resettable frame counter and reads a
bounded sky crop synchronously after the original submit. It does not invoke
a draw itself. Late texture requires real image decode, readiness, exactly one
revision and submit, a visible material, and changed nonempty pixels.

Restoration uses the retained `WEBGL_lose_context` extension and actual trusted
loss/restoration events while leaving Three's handlers intact. It requires one
recovery submit, restored nonempty pixels equal to the prior frozen crop, and
continued frame retention. If the renderer needs another recovery submit, retain
that failure and independently diagnose the invariant instead of loosening it.

The caller must provide a fresh output directory. A raw JSON result is written
on success and failure, including cleanup and any partial observations. The
single screenshot is written only after both episodes. Context teardown,
listener/wrapper restoration, owned RAF cancellation and request-handler draining
are checked. Context destruction removes the init-script input observer.

## Current verification and limits

The Node controls are synthetic tests of the actual acquisition code and evidence
validator. They are not browser captures. Run the three top-level
`tests/modal-invalidation-*.test.mjs` files through the repository's focused runner
when integrated; direct Node execution is useful only for this isolated proposal.
The first hosted run (42112339794) built and launched the sandboxed browser, but
failed before mission entry because an unrelated helper required a missing v2
startup contract. Its raw failure receipts are retained. That scoped startup
repair was independently reviewed and exercised in the later runs below.
No screenshot, passing invalidation result or performance measurement is claimed.

## Closure diagnostics

The second run (42115098785) reached real Mission 1 setup but the target closed
before scene binding, with no established cause. Both failed runs remain retained.
The third run used the independently reviewed diagnostic revision with bounded page/context/browser lifecycle and
explicit-close timestamps, Playwright browser-process launch/exit logs and owned
worker cgroup counters before cleanup. It enables only `pw:browser`, never the
protocol namespace. Child exit/signal comes from those raw launcher logs when
available, not an inference from a generic target-closed error.

Lifecycle events are capped at 128 and details at 512 characters. At most eight
owned-cgroup snapshots read up to 4096 bytes per fixed telemetry file; missing
metrics remain unknown. Snapshots verify current membership and never inspect
sibling commands, environments, unrelated processes or a global journal. They
include memory/pid events and peaks plus this worker's inherited resource limits.
That diagnostic revision kept the 64 MiB per-file limit unchanged; the separately
reviewed runtime-storage policy below now distinguishes logical runtime files
from artifact output. Cgroup/time, per-stream log and total artifact caps remain. Diagnostic callbacks cannot prevent independent context close.
These observations do not relax any gameplay, pixel or cleanup acceptance gate.

## Finite Chrome runtime storage

Run 42119105744 proved Chrome exited with SIGXFSZ before cleanup. It did not
identify the offending file/syscall or establish minimum Chrome storage demand.
RLIMIT_FSIZE limits a file's logical length, including memory-backed files; it is
not an artifact quota or aggregate disk bound. The telemetry short-reader repair
retains only bytes actually read, with real file-boundary controls.

Only the browser service now uses a finite 4 GiB soft/hard file-size ceiling,
chosen to match its existing 4 GiB memory ceiling. This is declared policy, not
measured demand, proof of sufficiency or a license to increase it after failure.
The build retains its 64 MiB limit. Ordinary browser runtime allocations are
confined to four private tmpfs mounts: owned HOME/XDG storage, /tmp, /var/tmp and
/dev/shm. Each has a 1 GiB allocated-block limit and 10,000 inodes. The equal
partition totals the existing 4 GiB worker envelope; 40,000 runtime inodes fit
inside the existing 50,000 execution-inode allowance, leaving room for evidence.
Sparse logical lengths and allocated blocks are distinct. MemoryMax remains
4 GiB and MemorySwapMax is explicitly zero, including for memfd/shared memory
that does not use the visible /dev/shm mount.

ProtectSystem=strict together with ProtectHome=read-only makes ordinary
filesystems read-only except the owned
persistent evidence directory and those private runtime mounts. There are no
global mounts, profile changes or browser flag overrides. Sandbox behavior,
executable temporary-file semantics, existing deadlines and capture acceptance
remain unchanged. No noexec, NoNewPrivileges, PrivateUsers, PrivateDevices or
unrelated syscall filter is added. Runtime caches are disposable on service exit;
raw evidence stays outside these mounts.

Before Chrome launches, the worker records the systemd version and proves an
actual distinct mount namespace, exact tmpfs mountpoints/sizes/inodes/ownership,
both inherited file limits, memory.max and memory.swap.max. It rejects unexpected
ordinary writable mounts, unknown telemetry, non-read-only source/build paths,
and insufficient host memory or evidence disk headroom. /dev's API mount cannot
permit ordinary file creation by the service user. The existing outer capacity
guards also add all 4 GiB of private tmpfs to admission before preparation and
each stage, then remeasure after hashing. These are conservative reservations,
not evidence that full use of all limits can coexist. Unsupported isolation
blocks launch with retained partial proof; there is no weaker fallback. Raw mount
and limit text is kept even on rejected admission. Bounded reads continue through
short procfs reads to EOF, or explicitly reject the byte limit plus one.

All reviewed artifact producers now check the aggregate allowance before writing.
The 64 MiB upload ceiling reserves four 8 MiB raw streams, 1 MiB for the final
receipt, and 1 MiB for the standalone preparation receipt, leaving 30 MiB for
other evidence. Existing receipts are replaced without temporary-file coexistence.
Screenshots return a buffer which is checked before writing. File identity/link
checks protect owned outputs. The final receipt accounts for actual uploaded
preparation bytes too. This is a serial application-producer bound, not a claim
that the evidence directory has an OS quota. An unexpected producer or exhausted
allowance fails rather than silently truncating evidence or weakening acceptance.
If a process capture exceeds its unchanged 8 MiB stream allowance, only a labeled
raw prefix is retained, with captured/retained/discarded sizes and hashes; the
stage fails. Targeted unit stop and independent cgroup/parent-namespace checks
precede log retention and cannot be skipped by log or receipt write failures.

References: [systemd execution isolation](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html),
[Linux tmpfs](https://www.kernel.org/doc/html/latest/filesystems/tmpfs.html),
[cgroup v2 memory/swap](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html),
[RLIMIT_FSIZE](https://man7.org/linux/man-pages/man2/getrlimit.2.html),
and [memfd](https://man7.org/linux/man-pages/man2/memfd_create.2.html).


## Effective mount containment

Run 42126523977 rejected the live storage policy before launching Chrome. Its
complete proof showed the expected private tmpfs sizes and finite limits, but
systemd 255 leaves /home, /root and /run/user writable under ProtectSystem=strict.
This correction adds browser-only ProtectHome=read-only and ReadOnlyPaths for
the observed nonrequired API submounts, including hugepages and binfmt_misc.
Missing host-specific API paths are optional; any present unanticipated writable
mount still blocks. Normal /proc, required cgroup telemetry and browser sandbox
flags remain unchanged. Explicit evidence and runtime child mounts remain writable.

Systemd's remount helper changes accessible/topmost mounts, not necessarily
covered rows. The retained graph included covered autofs ID400 under binfmt_misc
ID401, and covered /run/user/1001 ID414 under the later ID423 parent and ID424
child. Raw order or larger mount IDs do not establish reachability.

The worker retains every raw ID/parent/path and obtains the kernel-resolved mount
ID for each unique target using the verified Linux/x64 O_PATH ABI, O_NOFOLLOW and O_CLOEXEC plus its
own bounded /proc/self/fdinfo record. It never opens target contents or falls back
to a read-capable descriptor; all descriptors close in finally. Symlinks, failed
lookups, unknown IDs, malformed graphs and inconsistent selections block launch.
Each selected mount must contain the probed path and resolve to itself at its own
target. All covered rows remain recorded with the resolving ID. The unchanged
writable-mount policy and source/build read-only checks apply only to this
kernel-proven effective set, with no new writable allowance.

Full bounded mountinfo and namespace identity must match before and after the
probes. This is a point-in-time stability check, not an atomic freeze or proof
against later host mount propagation. Unknown or changed state fails closed.
The synthetic controls include both retained covered-mount examples, reversed
raw order, hidden descendants, lookup/read/close failures and actual own-FD proof.
No new browser result is established by these source controls.

Version-matched sources: [systemd 255 home and path controls](https://www.freedesktop.org/software/systemd/man/255/systemd.exec.html#ProtectHome=),
[v255.4 namespace ordering](https://github.com/systemd/systemd-stable/blob/v255.4/src/core/namespace.c#L1992-L2007),
[v255.4 topmost remount behavior](https://github.com/systemd/systemd-stable/blob/v255.4/src/shared/mount-util.c#L143-L357),
[Linux O_PATH](https://man7.org/linux/man-pages/man2/open.2.html),
and [proc fdinfo mount identity](https://man7.org/linux/man-pages/man5/proc_pid_fdinfo.5.html).
