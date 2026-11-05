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
requires 4 GiB worker plus 1 GiB host memory headroom, adds planned tmpfs writes,
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
startup contract. Its raw failure receipts are retained. This scoped startup
repair still requires independent review and a new exact-candidate hosted result.
No screenshot, passing invalidation result or performance measurement is claimed.

## Closure diagnostics

The second run (42115098785) reached real Mission 1 setup but the target closed
before scene binding, with no established cause. Both failed runs remain retained.
The next diagnostic revision adds bounded page/context/browser lifecycle and
explicit-close timestamps, Playwright browser-process launch/exit logs and owned
worker cgroup counters before cleanup. It enables only `pw:browser`, never the
protocol namespace. Child exit/signal comes from those raw launcher logs when
available, not an inference from a generic target-closed error.

Lifecycle events are capped at 128 and details at 512 characters. At most eight
owned-cgroup snapshots read up to 4096 bytes per fixed telemetry file; missing
metrics remain unknown. Snapshots verify current membership and never inspect
sibling commands, environments, unrelated processes or a global journal. They
include memory/pid events and peaks plus this worker's inherited resource limits.
The 64 MiB per-file limit, cgroup/time caps, per-stream log caps and total artifact
cap are unchanged. Diagnostic callbacks cannot prevent independent context close.
These observations do not relax any gameplay, pixel or cleanup acceptance gate.
