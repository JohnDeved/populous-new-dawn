# Fixed-preview HUD preference and SSR evidence

This opt-in sibling of `native-ui-evidence.yml` is not a Full check or Ready gate.
It uses exact application `5a90b78b5c4745d7f6accc4bfa7247782d43af8f`, tree
`62baccd2e89cd3c1480ed749a8a3ff33571b4521`, and only
`https://49ad051f-populous-new-dawn.webtorrent.workers.dev/`.
No candidate Home build, local server, new deployment, audio change or Tutorial
activation is included. Existing modes and default remain unchanged.

## Admission

First independently review and validate the complete infrastructure port and merge
it through normal required gates. Parent admission names exact merged infrastructure
SHA I and exact application SHA above. Dispatch on main with candidate_sha,
evidence_kind=hud-preference-ssr and infrastructure_sha=I. The pre-setup guard and
launch wrapper reject changed main, other applications, branch workflows and run
attempts other than 1. Do not dispatch before that review or infer approval from
this document. A changed run needs fresh explicit admission; a rerun is rejected.

The old local attempt failed during sandboxed Chromium launch and remains consumed.
This route uses the separately requested GitHub-hosted environment; it does not
retry the denied local operation. No sandbox/HTTPS/endpoint/installation fallback
exists. Hosted failures remain blockers.

The pinned deployment JSON is the exact public publication result, SHA256
96f196ba3ae31fdb8e93f9e735a634190b862be3da10392a400827cab6e75fe8.
Its source field identifies application build run42236689124 attempt1. Publishing
run42236818036 produced artifact13512091913, a 429-byte **publication-result ZIP**
SHA256297916a546f6a4ed18c40da05336402b9da36e950a2625ca513c8f1e088d6d94,
not an application source/build ZIP.

## Coverage and limits

One sandboxed official Chrome, five serial contexts and six exact-root navigations:
JS-disabled server DOM; default preference; manual1.5 pending restore, public change,
clamp/remount and reload; invalid storage; hud-size-only read/write failure. The
manual composition request must remain held for the real overlay/scale observation
within3s and be released by4s. Original bytes/hash must complete successfully.
All top-level responses use no-follow route.fetch(maxRedirects0,maxRetries0), reject
all redirects and require exact200 HTML before original response fulfillment.
This is intercepted document transport, not untouched browser networking.

The port retains public game/menu entry and actual keyed map-frame replacement,
geometry, nontransparent pixel and storage observations. No fixture world injection,
focus injection, native Escape/fullscreen, audio retry or development StrictMode
proof is claimed. All eight PNGs require independent pixel inspection.

The supervisor owns detached Chromium descendants via process-local subreaper,
numeric PID/PPID/start-time ancestry and PIDfd signaling. Unknown coverage, missing
APIs, survivors or changed identities fail; only owned descendants may be signaled.
The shared process-group-only supervisor is deliberately not used.

Chrome's singleton socket needs a short temporary root. Hosted run 42293876447
failed at launch because its output/runtime-tmp singleton pathname was 133 ASCII
bytes, exceeding Linux's 107-byte pathname budget (108 including the NUL).
Only TMPDIR now uses a freshly exclusive `/tmp/pnd-hud-<8 random characters>`
directory, with current uid, mode 0700, canonical parents and recorded device/inode.
The observed `/com.google.Chrome.<6 characters>/SingletonSocket` suffix yields
62 bytes at that root; the actual generated root is checked before launch.
HOME location, evidence output, Chrome version, arguments and mandatory sandbox are unchanged.

The sampled 512 MiB profile budget covers the combined live short root and private
runtime HOME, not a separate allowance per directory. HOME is exclusively created
with mode0700 and its canonical device/inode/uid/mode is checked during sampling
and after process absence. Chrome156 headless creates its unique profile under
HOME/.config/google-chrome-headless; default crash data can also live under HOME.
The supervisor retains HOME in the output and records its identity; it does not
delete or separately retire it. The two owned sampled roots must be disjoint. After
independent descendant-absence proof, the same supervisor atomically renames that
exact directory back to output/runtime-tmp, retaining raw files outside the upload
payload. Same-filesystem `/tmp`/output and Linux no-replace rename support are new
fail-closed prerequisites, not facts established by the prior failed run. The
retirement validates device/inode/uid/mode, unchanged canonical parents, an absent
destination and old-path absence; it never overwrites a racing destination or
recursively copies/deletes files. Process absence and temp retirement are separate
receipt facts, both required for success and lane release. Setup, marker-write,
launch and finalization failures retain the same ownership/cleanup requirement.
Unknown ownership, survivors, expired cleanup or failed retirement stay nonpassing
with the recorded short path for investigation. No generic retry is authorized.

HOME allocation is recorded immediately after exclusive mkdir, before reading its
identity. A later identity-read failure cannot be treated as an unallocated HOME:
cleanup and lane release remain unconfirmed. The passing consumer requires HOME
allocation, private identity matching the owned temp uid, and final verification.
It also requires nonnegative combined-profile counts with an exact sum within the
fixed512MiB cap, and a complete nontruncated peak process sample with unique numeric
PIDs, start times and RSS whose sum equals the peak within the fixed1536MiB cap.

One monotonic 240-second supervisor acceptance deadline covers prelaunch input
verification,230-second work cutoff, cleanup, post-input verification, final consumer,
payload retention and final success check. Late failure reporting may occur after
the deadline but cannot yield a successful result. Sampled RSS1.5GiB/profile512MiB
limits are not hard aggregate memory/storage bounds. Browser network buffers are
not bounded by retained-body caps. Node heap256MiB, core0, CPU230s and per-file64MiB
limits remain. Initial admission requires4GiB available memory and2GiB disk.

Adapter pre/post bound-file SHA256 verification uses one reusable64KiB buffer,
with full-input digests and unchanged mode/link comparisons. This bounds hashing
scratch allocation; it does not establish the cause of the prior RSS stop or prove
a future browser pass. The peak receipt retains at most256 existing numeric process
sample rows (PID/PPID/start/RSS/state); diagnostic overflow fails closed. Shared RSS
pages can be counted more than once, so this is not unique physical memory or PSS.
Directory-membership failures retain at most32 added and32 removed names, each
limited to256 characters, plus original counts/truncation flags. A mismatch remains
fatal even when details are truncated. The prior unknown Chrome directory mutation
is not classified as benign or resolved by these diagnostics.

Upload payload is bounded to48MiB including receipts, source/runtime/dependency
manifests, logs, inventory and six HTML/eight PNG files. Per-image4MiB, per-HTML2MiB,
per-stream2MiB caps remain. Overflow/finalization errors produce only an explicitly
failed bounded artifact; raw partial evidence remains outside its upload directory.
An artifact is not accepted merely because its upload succeeds. Exact case/order,
identity, successful adapter/owner cleanup, stable inputs, zero surviving/unreadable
owned-process coverage and final hashes are mandatory.

## Runtime and verification

Hosted setup binds actual candidate dependencies, Node, `/usr/bin/python3` standard
library under isolated/no-site/no-bytecode mode, official Chrome resource files and
statically read ELF dependencies using system readelf and ldconfig -p. No executable
loader or ldd is invoked. Files, symlinks and relevant directory membership are
verified before/after. Unsupported ELF paths/unresolved dependencies fail closed.
Late dlopen driver selection remains a runtime limitation, not attested completeness.
No local Playwright1.62.1/Chromium/Python3.13 hashes are copied onto hosted tooling.

Portable check: node --test --test-concurrency=1 tests/hud-preference-ssr-evidence.test.mjs.
It imports only pure policy/admission and bounded-hash fixtures and runs one finite isolated Python
synthetic fixture child (25s/2MiB), creating/removing only owned temporary fixtures.
It does not import prepare/adapter/runtime-binding entry points or run browsers,
network, proc inspection, prctl or signals. The genuine orchestration planner,
quality gates, normal full checks/build and infrastructure review remain separate.
Do not refresh resource-policy hashes to classify these tests parallel automatically.

Initial source-only preparation is not portable-test acceptance, hosted runtime
qualification, successful HUD evidence, Ready permission or merge permission.

## Source repair controls

Candidate Chromium is resolved through its declared `@playwright/test` dependency,
using the existing export/containment helper. No root-level transitive `playwright`
package, global resolution, new dependency or broader hoisting is required.
Synthetic isolated-layout controls exercise this exact helper and reject escaped
or missing exports without importing installed browser packages.

Upload safety is distinct from result acceptance. The always-run bounds step emits
`upload_safe=true` only after verifying either the complete bounded payload or a
bounded nonpassing fallback. Setup/bounds failures still return nonzero and fail
the job; the upload can retain the separately verified failure artifact. It contains
available compact recorded run/source and supervisor cleanup facts. Missing or
malformed cleanup stays unknown, never inferred from the absence of a browser.

Portable controls call actual finalization, readback, fallback, upload-marker and
authoritative-return functions, including expiry during copy/inventory retention,
corruption/missing/order, overflow and source drift. These are synthetic file/clock
controls, not process or browser simulation. Named Python stdout/stderr is forwarded
into the outer raw test streams on success and failure. The sparse overflow fixtures
require an independently admitted per-file limit of at least64MiB; retained stream
caps remain2MiB each and must not be implemented by lowering the fixture file limit.
