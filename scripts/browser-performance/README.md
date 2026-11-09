# Informational controlled browser CPU comparison

## Protocol status

Cohort revision 2's five stable phases are qualified for input comparability by
[same-runtime-source control PR593](https://github.com/JohnDeved/populous-new-dawn/pull/593#issuecomment-6253189072):
12 fresh sessions, 30 phase captures and 720 exactly attributed callbacks had no
workload mismatch. Many timing cells were noisy; this is not a quiet or blocking
regression gate. The disposable control was closed without merging its README reflow.

Cohort revision 3's separately declared `native-view-drag` phase passed
[candidate smoke 39154077272](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39154077272)
and [same-runtime-source control PR596](https://github.com/JohnDeved/populous-new-dawn/pull/596#issuecomment-6253802227).
All six phase inputs matched, but five of six eligible drag timing cells were noisy.
All 36 retained first callbacks show a first-use concentration: step projection
medians were 34.85, 10.8, 8.75, 7.25, 6.95 and 6.7 ms. Step 1 was the maximum in
five sessions, step 2 in one. Same-angle work and geometry matched. This does not
identify JIT, GC or scheduler causes: there are no such traces.

Cohort revision 4 separately names `native-view-drag-warm`: exactly one fixed
six-move real invalidation warmup, then the unchanged six measured moves. This
predeclared warmup count is not tuned from subsequent runs. It measures warmed
interaction, not first-use latency or proven steady state. The former remains
explicit diagnostic evidence, not discarded samples. The revision-3 raw control
and classifications remain historical evidence, never reinterpreted.
Candidate functional smoke and one trusted same-runtime-source control for this
new revision are **not run yet**. Source tests are not browser qualification or a
promise that warmup removes noise. The five stable phases and their observer
remain unchanged. No threshold relaxation, timing-based retry or frame trimming.
The two workflows are already active. Their reviewed files/templates, permissions,
triggers and caps are unchanged here. The common capture/build code always comes
from the exact PR base, so a PR proposing V2 cannot run its own untrusted harness.
The reporter selects V2 explicitly from trusted source, never from artifact input.
An old V1 report is not silently reinterpreted as V2.

The original live capture, schema, workload classifier and thresholds remain unchanged;
V1 reporting now explains mismatches with bounded per-phase values instead of
repeating labels. `run-live.mjs` retains the V1 entry point. See [the original contract](README-live-v1.md), whose
historical staged-activation description is retained as history, not current status.
V1 hosted run 39144578788 executed 12 fresh sessions and 30 valid captures, but all
comparisons were workload-mismatched. Startup simulation, moving target and held
camera-input scheduling drift made those results unsuitable for speed claims.
V2 does not erase or reinterpret that evidence.

Candidate smoke [39149068238](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39149068238)
proved public Load/readback, paused pose and all three recovery phases on its exact
published source, but failed the old native-view-release work guard. All six first
release callbacks were real native pixel-cache hits with zero submitted triangles;
the preceding unmeasured drag had already performed the view-invalidated work.
Those failed raw captures remain historical evidence. The revision-2 stable-hover
repair subsequently passed [candidate smoke 39150561670](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39150561670)
and the PR593 paired control. Neither result qualifies the new held-drag phase.

## Pinned browser activation proposal (issue #654)

This activation stage depends on reviewed passive support already present on the
trusted exact base. The existing benchmark workflow explicitly selects
`run-pinned.mjs`; direct `run.mjs`/`run-live.mjs` invocations retain their legacy
defaults. The `run-pinned.mjs` and `run-live-pinned.mjs` entrypoints require a reviewed official
`google-chrome-stable` Debian package pin from `browser-runtime.json`. Version `155.0.8059.84-1`, package size and SHA-256
were read from [Google's package index](https://dl.google.com/linux/chrome/deb/dists/stable/main/binary-amd64/Packages)
on 2026-10-19. The download URL is derived only from that version at Google's
fixed repository. This is HTTPS repository provenance and a reviewed content pin,
not an independently verified upstream signature or a reproducible-build claim.

The installer requires the existing installed Chrome package, downloads into a
fresh invocation-owned temporary directory, and verifies size, SHA-256, package
name, version and architecture before installation. It streams the executable
member from that verified package to derive its expected SHA-256 without creating
a second browser tree. Ordinary `dpkg --install` replaces the existing package;
there is no apt dependency repair/update, floating `latest`, shared browser cache,
or system-browser fallback. Missing downloads, dependencies, package failures or
wrong/corrupt executables fail closed and retain an installation receipt/log in
the existing evidence artifact. Only the owned temporary download is removed.

In pinned mode the launcher remains `/opt/google/chrome/chrome`, supplied
explicitly to Playwright. Full Chrome, `chromiumSandbox: true`, `ignoreDefaultArgs: true`, existing
arguments and all session/build/job limits are unchanged. No AppArmor/sysctl
change, new helper configuration, headless-shell substitution or `--no-sandbox`
is permitted. [Chromium's sandbox documentation](https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md)
explains why an arbitrary downloaded browser-cache path is not equivalent on
Ubuntu 24.04. The package route preserves the installed Chrome path covered by
the existing platform policy. Hosted proof of this particular update is pending;
do not infer successful sandbox launch from a version probe or source tests.

The checked-in Playwright lock currently selects 1.63.0. Its [official browser
manifest](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/browsers.json)
selects Chrome for Testing 153.0.8010.12/revision 1243, but a cache-path launch would
need separate sandbox suitability evidence. [Playwright documents support for
stable branded Chrome](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge),
so this proposal pins the normal stable package instead. Actual installed
Playwright version must match the trusted lock; lock and manifest hashes are
recorded and rechecked, not duplicated into browser release constants.

Each pinned execution receipt binds the exact official package pin, package source,
actual executable version/hash, absolute launcher path and installed Playwright
identity. In pinned mode the executable is reverified before and after each arm and at final
admission; the launched browser's reported version must also match. Browser pin
identity joins the existing runtime hash. Kernel, runner image/version, CPU and
renderer/GPU provenance and all comparison guards remain intact. Within each V2
shard's six paired sessions, differing host/runtime identities still withhold that
cell's timings. Independent shards own disjoint comparison cells, so different
shard hosts do not invalidate each other's internally matched cells. V1 retains
its existing global runtime guard. No cross-machine pairing or historical
reclassification is introduced.

Upgrade the release by reviewing Google's exact package-index stanza, changing
the one version/size/SHA-256 manifest, running focused admission tests and obtaining
fresh hosted same-runner paired evidence. Never resolve `latest` at execution or
refresh a pin merely to turn a failed run green. Package withdrawal is a visible
blocker, not permission to substitute a release. Dependency-lock upgrades still
require their normal review and fresh runtime qualification.

Rollout is deliberately staged; no package installation or browser launch has
been performed for this source-only activation proposal:

1. Merge reviewed passive support. Both workflow copies stay byte-identical to
   the current main refresh base. Direct `run.mjs`/`run-live.mjs` invocations retain their
   original browser configuration, version/hash receipt fields and no installation
   receipt requirement. Their exported runners default to `pinned: false`.
2. Review the separate dependent activation change against that merged support
   base. In the same existing job, replace the existence probe with
   `node scripts/browser-performance/install-browser.mjs`, select
   `node scripts/browser-performance/run-pinned.mjs`, and retain the installation
   receipt/log in the existing raw-evidence artifact. Both commands already exist
   on the trusted exact base. Only the explicit pinned entrypoints select
   `pinned: true`; they accept no CLI/environment override or legacy fallback.
3. Inspect installation, package/executable/Playwright provenance and sandboxed
   capture receipts from the activation run. Its deliberately changed workflow
   still fails the trusted reporter's exact workflow-byte guard; that refusal is
   not a reporting pass and the guard must not be relaxed.
4. After reviewed activation merges, obtain a fresh complete matched run with
   unchanged trusted workflow bytes before claiming complete rollout or closing
   #654. A passed legacy run from stage 1 does not qualify the pinned runtime.

Old run 39303586009 remains refused. Pinning alone does not fix host drift or the
separate live-melee observation failure.

Portable coverage: `pnpm run test:focus tests/browser-runtime.test.mjs
tests/browser-performance.test.mjs tests/browser-snapshot-protocol.test.mjs`.
Installer tests use injected commands and one inert data-only Debian fixture;
they never install a package, launch a browser or change security policy.

## Fixed controlled workload

- Exact-base production `createWorld(2)`, 140 `advanceGame` calls at 1/24 seconds,
  and the genuine introduction-skip transition author one fixed turn-70 fixture.
  This is declared test setup, not a browser-recorded save or campaign proof.
- Both arms load exactly the same lossless checkpoint bytes through IndexedDB and
  the public Load path. Full pre-input migrated bytes must match. A setup-only
  pause property latch spans Home's forced unpause, then is removed and verified
  before measurement. No renderer, picker, clock, RAF, or tick is replaced.
- Public focus, +32/-32 integer-pixel right drags and a public right-click normalize
  camera/selection. Genuine cancellation's selected-bit change is declared in a
  separate admitted-world hash. Both arms must match that authored state.
- Ordinary pause preserves real production renderer/picker callbacks. Presentation
  clocks may advance. Simulation and water-advance speed are explicitly unsupported;
  render/callback/RAF are observations, not speed claims or GPU/presented FPS.
- Viewport 1440×1000 CSS pixels, DPR 1, two-second warmup, six declared inputs per
  phase. No held camera keys or wall-clock target timing. Each input selects exactly
  the next four contiguous completed F8 samples: first 1 and settled 3 separately.
  The six first samples are a tiny sample, not a significance estimate.

Two concurrent scenario shards, never concurrent arms on one runner:

1. `world`: `native-hover`, `ordinary-hover`, then `native-view-drag-warm`. Cohort revision 2 replaces the
   unqualified release cohort, without reinterpreting its retained failed captures.
   The fixed authored Shaman ID 54 is sampled at six unique one-pixel neighbors,
   using production `Math.trunc(client - canvas origin)` native pixel quantization.
   All exclude the warmed initial pixel; read-only cache admission must be cold for
   that pixel, and the exact first callback must show a real native pixel miss,
   submitted triangles and actual hovered ID 54. No later-frame search or cache
   clearing. Camera remains stable. This stable-hover phase does not measure view-invalidated
   native projection; its projection CPU remains observation-only because
   initial setup may warm its cache. Fixed pixels outside target bounds fail closed.
2. `recovery`: `hud`, `world-recovery`, `menu-recovery`. HUD is the prerequisite to
   world return. Menu recovery means subsequent world-pointer inputs after opening
   and closing the real settings menu, not the first post-close callback. Initial
   pointer/setup callbacks are explicitly unmeasured, with raw preparation receipts.

The warmed held-drag phase uses one unmeasured public right-button press. It
records six fixed warmup moves (angle 0→1→0→1→0→1→0), then repeats those same six
moves for the comparison, and finally releases the button unmeasured. Every move
requires the exact first callback plus three contiguous settled callbacks, with
actual native invalidation and query work. No held keys, time-dependent camera
travel, cache clearing, direct camera mutation or favorable-frame search.

Warmup and measurement have separate six-event read-only observers, but share one
continuous F8 recorder epoch, absolute sample serials and raw export. The boundary
must return the full original 72-scalar pose, authored logical state and actual
geometry content. Only the six expected index-version increments are allowed;
the measured first pre-input pose and geometry witness must match the final
warmup endpoint exactly. Fresh observer allocation is outside app CPU buckets but
can perturb scheduling; it is not an overhead-free or JIT/GC experiment.

All warmup raw callbacks, including unselected extras, must survive: any
serialized-size trimming or ring wrap makes only the new cohort incomplete. Its
24 selected warmup callbacks and all pre-input anchors have the same strict
serial/timestamp/geometry/work checks as the 24 measured callbacks. Per-step
first-use native key/projection/triangle and callback CPU remain in summaries and
the informational comment, separately labeled **first-use native-drag in this
prepared workload**. This is not a cold page/session or an un-warmed projection
cache. Those timings never enter warmed comparisons or threshold decisions.
Warmup input identities must match across arms; internal projection/cache work and
timing outcomes are not cross-arm input equality. Missing/invalid warmup cannot
suppress the five qualified phases. Functional smoke still fails an admitted
new-cohort capture failure rather than declaring it passed.

Each move's capture-phase listener records the old pose and actual geometry
witness before the public handler, and binds the exact next four completed
callbacks. Actual `tooltipInput.picked` must be authored ID54; ordinary
hovered-object state is intentionally empty while the button is held.

Native picking in the reviewed callback consumes the old terrain index prefix
under the new projection, before ordinary picking rebuilds the new-pose prefix.
Both full boundary fingerprints, the exact single index-version transition, all
fixed-size per-frame witnesses, effective RenderView centers/projection fields and
between-input continuity must match. The first native triangle inventory must
identify the old prefix. Only native key/projection/triangle timing is eligible in
this new first stratum. Its ordinary buckets remain observation-only because their
inside-query post-prefix attribution is not separately instrumented. The three
settled callbacks require zero queries; per-query timing there is unknown, not a
measured zero-cost query. Projection/cache outcomes are retained, not equated across
arms. A new cache policy that removes all declared invalidated work is unsupported
by this narrow cohort, not proof of no benefit.

The trusted runner reads both source trees as data and verifies bounded exact
hashes of the reviewed routing, admission and pre-query geometry producers. The
projection/cache/triangle kernel remains changeable under ordinary source review.
Changed source owners or missing boundaries mark only this new phase unsupported;
they do not erase the five stable phases. A failed or malformed added phase is
likewise an explicit missing measurement in comparative reports; candidate functional
smoke still fails when the admitted new scenario fails. Raw receipts retain expected/actual
source hashes. This is a deliberately narrow ownership contract, not a universal
proof of arbitrary intermediate mutation. The separate preallocated held-drag
observer retains 72 pose/projection scalars plus 113 geometry scalars per RAF;
full hashes are outside measured samples and the original stable observer is
byte-identical. No renderer/picker wrapper or production hook is installed.

Loaded checkpoint cells can intentionally take a fallback instead of a fresh-world
factory-ownership optimization (for example the owned-cell rank cache in PR591).
This protocol does not inject ownership to manufacture a win. An unchanged/noisy
loaded-snapshot result is not evidence of no effect in fresh gameplay or in a
separate factory-owned Painter workload. Those cohorts require separate evidence.

## Attribution and input matching

A capture-phase trusted pointer listener synchronously records the recorder serial
before the public event handler, not after a remote mouse command returns. A
read-only, preallocated, bounded RAF sidecar witnesses the exact next completed
recorder serial and its supplied RAF timestamp. That timestamp can precede the
input event's performance.now; no timestamp inequality discards the true first
responsive callback. Raw chronological index and timestamp must both match every
serial, with exact 4/4 contiguous coverage. Reset, replacement, full ring, missing
first/intermediate sample, changed route, or wrong actual camera/input fails closed.
No readiness predicate may skip the first callback to find later favorable work.

The full authored simulation/unit/terrain/geometry state is hashed outside selected
callbacks. Actual terrain submission geometry is separately bounded and checked;
World state alone is not proof of submitted index/drawRange/instance equivalence.
The bounded proof covers terrain, not every model mesh: pointer-total/object/model/inclusive-native-occlusion
CPU stays observation-only. Only matched terrain-specific buckets may show possible
signals; no whole-picker or whole-program equivalence is claimed.
Geometry fingerprints are taken outside selected callbacks at each input block's
boundaries, after genuine initial pointer/render setup. Fixed-size
identity/version/count/transform witnesses guard the selected callbacks. Versions
are intra-block guards, not cross-arm implementation-state equality. For the five stable phases, a first query
that changes admitted geometry is unsupported, not a reason to skip it. Only the
new declared held-drag transition permits the separately bound old/new index prefixes.
Transient unversioned mutation reverted between boundaries is not proved absent.
Hashing can warm CPU caches; identical preparation/sidecar overhead is part of this
protocol, not overhead-free measurement.

Exact per-frame query inventory, actual submitted native triangles, geometry hashes,
fixed target, view/input sequence, snapshot/protocol/runtime and complete inventories
must match. Internal projections, visited triangles and model/cache builds remain
reported outcomes, not substitutes for input geometry. A legitimate geometry
optimization may require a separately reviewed workload contract rather than
weakening these conservative guards.

## Pairing, budget and reporting

- Per shard: B/H, H/B, B/H, sequential fresh browser processes/profiles/contexts,
  one exact base/head build each with the same trusted harness and locked install.
  Changed dependency manifests remain incompatible. No cross-runner timing pairing.
- Unchanged caps: two 15-minute benchmark runners plus one 3-minute reporter,
  maximum 33 occupied runner-minutes; 90 seconds/session and 120 seconds/build.
  12 sessions, 30 phase captures, no retries. Only ready-for-review triggers run.
- Exact snapshot transport/expected/source receipts are retained under
  `session-fixture/*.json`, inside existing artifact upload globs. Raw F8 bytes,
  sidecars, preparation observations, selected indices and summaries remain in
  seven-day CI artifacts. No logs/captures/private user data are committed.
- Per first/settled stratum: all/nonzero/per-query frame-average CPU distributions,
  sample/query/work counts and paired session p50/p95. Never pool frames as
  independent trials, sum nested timers, or claim FPS from RAF cadence.
- Three pairs yield preliminary possible signals only. Classification retains
  the 0.1 ms / 5% / twice-baseline-range effect floor, same direction in all pairs,
  and 15% repeat-spread noise rule with 0.1 ms floor. Missing metrics are unknown.
  Missing/noisy/mismatched shards are explicit, never a game regression or approval.

## Trust boundary and comment admission

The benchmark has only `contents: read`, no secrets/write token, no persisted
checkout credentials, no cache and no deployment. Candidate code is untrusted,
including code that a build dependency might evaluate. The write-capable reporter
runs on a new runner, checking out only workflow_run's trusted default-branch SHA.
It does not install packages, check out the PR, extract an artifact, execute a
candidate script, import a report, or evaluate strings from reports.

The reporter re-fetches the run/workflow/PR and verifies fixed repository,
pull-request event, exact workflow path, run/attempt, unique GitHub PR association used only for routing,
immutable run head equal to the current PR head, artifact base equal to the
current GitHub PR base, and the original benchmark workflow bytes at both source
commits against its trusted checkout. Its only accepted artifact names are the two
fixed run/attempt/shard names. Artifact input is a single regular `report.json`,
max 512 KiB uncompressed, read in memory from a bounded ZIP. Path traversal,
symlinks, encryption, extra entries, unsupported formats and corrupt CRCs fail
closed. Strict exact-field schemas admit only bounded numbers, digests, fixed
phase/metric/status enums. Reports cannot supply executable text, markdown, URLs,
repository names, comment IDs, or a target PR independent of GitHub metadata.

GitHub run PR associations can change after execution; they are not immutable
event-base attestations. The source-bound artifact must match the current GitHub
base, otherwise the old run is skipped.

Reports are untrusted observations, not attestations that malicious PR code
performed honest work. The design prevents their data from becoming privileged
code or arbitrary communications; it cannot prove the PR did not falsify its own
runtime metrics. Suspicious instrumentation/source changes require review.

Every validated comparison is retained in the reporter's Actions step summary;
raw captures and report artifacts are unchanged. PR notifications are reserved for
existing eligible `possible-improvement` or `possible-regression` classifications
in session p50 or p95. No thresholds or workload admission rules change. Routine
within-noise, noisy, incomplete, mismatched, unknown and observation-only results
do not create comments. If an earlier actionable comment exists, one short update
supersedes that finding without claiming it was fixed; subsequent quiet runs do
not repeat it. A returning signal updates the same comment. Identical report
bodies are not rewritten. Legacy actionable table classifications are recognized
for this one-time supersession; legacy routine comments are left alone.

The reporter updates one marker-identified comment authored by the immutable
GitHub Actions bot identity. It refuses ambiguous duplicate bot comments and older
runs/attempts. Before writes, a bounded completed-run inventory also rejects
delayed runs superseded by a newer completed run or same-run attempt for the same PR/head, even when
that newer quiet run left no comment marker. A fresh PR/head/base check immediately precedes the sole POST/PATCH;
per-PR reporter concurrency serializes upserts without displacing other PRs. Closed or stale PRs are skipped. Artifact
links are constructed from validated GitHub run IDs, not report URLs. No reviews,
labels, statuses, ready transitions, merges or repository settings are written.

Activation introduces only ephemeral job permissions necessary for that comment:
`contents: read`, `actions: read`, `pull-requests: write`. No persistent credential,
OAuth grant, repository secret or protection change is created. Keep reporter
source trusted and re-review any expansion of that permission/action boundary.

References: [GitHub workflow_run security warning](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[secure use of Actions](https://docs.github.com/en/actions/reference/security/secure-use).

## Candidate-only hosted functional admission

The Tutorial-browser matrix includes one `snapshot-protocol` case, capped at six
minutes including the existing 120-second build cap. Candidate smoke now has at
most two independently bounded 90-second episodes, world then recovery, with a
180-second combined browser allowance. This explicitly expands the previous
shared 90-second resource budget; it is not a timing improvement or a renamed
bucket. The six-minute job-wide hard ceiling, including installation, build,
one-time fixture/provenance preparation, both episodes, final dependency/bundle
verification and cleanup, is unchanged. Preparation happens once before either
episode. Each episode includes context creation, capture and context cleanup;
timeout closes the owning browser and stops the smoke, without a retry or a
replacement capture. Non-timeout attribution failure remains failed even when
the other independent context is attempted. A cleanup failure stops continuation.

It runs the exact proposed merge once in two sequential fresh contexts and
retains all six phase captures, 144 measured callbacks and 24 separate warmup
callbacks. Monotonic raw stage/episode start, end, elapsed and allowance fields
record preparation, session work, cleanup and final verification; delayed timer
dispatch cannot turn an over-budget episode into a pass. These orchestration
intervals are not benchmark measurements. Its
fixture is authored from candidate source and explicitly labeled as such, not as
trusted common-base comparative evidence. This adds at most six occupied runner
minutes; the two comparative runners and reporter caps/permissions are unchanged.

The `candidate-snapshot-functional-smoke` artifact retains snapshot transport,
expected/source receipts, raw F8 captures, sidecars and per-block geometry/serial
attribution. It never writes `report.json`, pairs timings, calls a classifier, or
invokes the write-capable reporter. Partial failure remains incomplete. Passing
proves this candidate's functional setup/attribution route, not performance or
comparability. The exact-base benchmark still cannot execute its own unmerged
harness changes. Full plus this functional smoke precede support merge; a trusted
comparative control follows only afterward.

## Portable checks and hosted admission

Run `node --test tests/browser-snapshot-*.test.mjs tests/browser-performance.test.mjs
 tests/gameplay-frame-recording.test.mjs` plus focused lint/typecheck. These are
synthetic/portable proofs only. Preserve source-bound receipts. No local browser
security bypass, downloaded replacement browser, or user Chrome fallback is allowed.

After source review and trusted support land, audit the first hosted run: exact
base/head/harness commits, fixture/source hashes, runtime metadata, two independent
runner IDs, all 12 fresh sessions/30 raw captures, raw-to-summary recomputation,
serial/geometry/query/target guards, noise outcomes, elapsed runner cost and caps.
Then use an ordinary no-op PR with verified identical consumed app/assets/dependency
bytes, allowing only distinct revision/build labels. It is same-runtime-source,
not identical-commit A/A. Reporter lifecycle and one-comment identity remain
independent of whether any performance comparison is useful. No automatic merge
approval, stronger guarantee, matrix expansion or qualified thresholds follows.

### Reviewed ordinary-route bridge

Held-drag source admission is the atomic union of two exact reviewed profiles,
not a per-file or per-slice hash allowlist. The original generic terrain route
and the GameScene-owned numeric route each bind all 16 owners. The owned route
additionally binds its full factory/rebind/release helper, public terrain input,
owned query entry and actual constructor opt-in after the first rebuild. The
query-input boundary includes packed/native-cache and scratch/numeric eligibility
through the vertex-loop start; projection and scan arithmetic remains reviewable.

The generic profile requires the new helper file and owned entry to be absent.
Only an actual missing-file ENOENT establishes file absence; unreadable, empty or
malformed source never does. Source reads, including failures, are cached once
across both profile attempts. Mixed, partial or unknown routes fail closed for
this cohort while the original five phases remain independent. Both complete
profiles, absence rules and exact boundaries are included in the protocol hash.

This bridge changes admission only. Fixed inputs, first-callback attribution,
geometry guards, warmup, raw retention, metrics and classification thresholds do
not change. Ordinary numeric buffers are internal work, not different submitted
geometry; native picking still precedes the ordinary visibility/index rebuild.
The initial runtime PR's old-base unsupported result remains historical evidence,
not reinterpreted as a comparison. Comparative execution of the new route requires
this reviewed bridge on the trusted default base, followed by fresh browser proof.

### Bounded reader equivalence (geometry admission version 2)

The original exact consumer-method and composite geometry hashes are preserved.
Different raw method spellings are not, by themselves, different submitted inputs.
A full-profile semantic match is available only when every session supplies eight bounded
raw Three reader bodies, the complete admitted generic/owned source profile, the
actual namespace-import/scratch-constructor binding, strict non-normalized data
attributes, stable reader references within and between phases, and matching
installed dependency/package/lock/trusted-builder hashes. Each arm's raw reader
and emitted-runtime manifest must stay identical across all repetitions/shards.

A dependency-free, fixed-shape recognizer admits only the reviewed reader
semantics, including the actual imported Matrix4.fromArray callee. The trusted
reporter independently recognizes retained bodies and recomputes the original
composite hash before comparing metadata/position/index/instance inputs without
the method-spelling component. Changed operations, unknown source profiles,
missing evidence, or real geometry/state/pose/query differences remain withheld.
The Node-only build admission uses the pinned installed TypeScript parser; the
write-capable reporter still installs nothing and never evaluates artifact code.

The five stable cohorts also have a narrower inactive-helper-name proof. It keeps
every recognized token (including local/parameter names and normalization branch
spelling) except the free normalization-helper identifiers, which cannot execute
under the observed strictly false own-data `normalized` properties. This path
still requires all eight bodies, imported Matrix4/query-prefix admission, stable
live bindings, matching dependency/build provenance, per-arm and cross-shard raw
reader/source/bundle stability, and the original raw-reader-to-geometry component
hash links. Only the complete held-drag source profile may be unavailable; an
unknown or malformed profile is not accepted. All actual geometry and workload
inputs still match exactly. Held drag never uses this narrower fallback, and its
source contract is unchanged. No old raw hashes or retained results are rewritten.

Raw bodies are retained before recognition, including unsupported spellings.
Unsupported optional proof falls back before measured inputs to original exact
admission; failures during sampled callbacks never cause replacement or replay.
Original exact summaries remain alongside separately named semantic-proof summaries.
Candidate functional smoke requires reader-body/prototype proof, not just exact
capture, and labels complete-source-and-callee separately from incomplete source
admission. Qualification of this repair requires complete-source-and-callee in
both hosted smoke sessions; ordinary unsupported appended-source status remains
nonblocking for the five completed exact cohorts.
Build/dependency manifests are retained in existing uploaded evidence paths.
Boundary and fixed-size callback witnesses detect persistent reader replacement;
transient mutations reverted entirely between observations are not universally
observable. This is a narrow reviewed terrain contract, not arbitrary JavaScript
equivalence. The old hash-only PR600 capture remains rejected: its exact differing
bodies were not retained and no minifier cause has been proven retrospectively.
No cohort, input, sample count, noise threshold, runner count or timeout changes.

### Public menu recovery compatibility

The snapshot recovery shard recognizes three source-backed public-control shapes:
the old UI has one `Game settings` button in the native HUD's `top-actions` plus
one `Menu` help-button in `shaman-controls`; the native-menu-only UI has only that
`Menu` help-button. Both historical shapes use the exact title and no
`aria-description`. The tooltip-cleaned native-menu-only shape instead has exactly
`aria-description="Help and game menu"` and no title. Both old controls call
`openMenu`. The historical dual shape selects `Game settings`, preserving its
previous route; either native-menu-only shape selects `Menu`. A described Menu
combined with Game settings, or any control with both title and description, is
an undeclared mixed shape and fails before clicking.
Every present control must have its exact shipped location and attributes, be unique,
visible, accessibility-exposed, and enabled. Missing native Menu, duplicates,
undeclared shapes, hidden or disabled alternatives fail before any click, rather
than triggering fallback. The selected shape, exact controls, accessible name,
and original Scene/World/canvas identity are recorded as
unmeasured preparation. One ordinary click must open the accessible modal
`Game menu` native root (`data-panel="root"` with `Continue Game`), and one real
Escape must hide both that original dialog node and its public locator.

This is the already-paused authored snapshot: no new pause or state injection is
introduced. Original admission runs before and after the round trip; exact
Scene/World/canvas identity, speed, logical state, camera, selection, and viewport
must survive. Only modal input suspension may change while the root is open.
Failure is terminal for the arm; there is no alternative click or close retry.
The following fixed pointer workload, warmup, callbacks, metrics, source
admissions, thresholds, and reporter acceptance remain unchanged. This measures
subsequent pointer-input CPU, not first-post-close latency.

The previous incompatible comparison is not performance or gameplay evidence:
head `5e4ade6788d7a07056389d6736c17b31d352351b` used `Menu`; the trusted harness at
`49f198df96d0f36a4067432db051b88c2a5b9498` selected only `Game settings` even though
that baseline already also shipped the native `Menu` control.
Run `39674637128`, artifact `12381886466`, ZIP SHA-256
`acaebd0deff6a0d2227c8fa92dfd09776db3aad259fe388db3cc204c234dfe50` contains three
head locator timeouts and three completed base sessions.

Node control doubles in `tests/browser-snapshot-menu-recovery.test.mjs` are only
unit coverage, not rendered old/new acceptance. Rendered acceptance must bind the
actual build revisions and this common harness, including these historical source
identities when reproducing those two routes:

- Old `app/page.tsx` Git blob: `7a4174acfef0cafac42059e7af329738801b740b`.
- New `app/page.tsx` Git blob: `19560bc6293f42befc06af01fc4a7a4b46aa5bf0`.
- Both `app/original-pause-menu.tsx` blobs: `bf33edcc5fbd8ef37d65a23c2c834d4082cce9b4`.

The tooltip-cleaned Menu declaration comes from UI commit
`27654afd44f733dbc37ddc7760b00f48cd607064`, `app/page.tsx` Git blob
`754e78e06e153fbca6962204f12f789030c89cbd`.
The older identities above remain historical evidence, not acceptance for this
additional shape. The recorded route distinguishes it as `native-menu-description-only`.

Independent review and ordinary trusted-baseline adoption must precede any new
comparison. This repair does not change a workflow pin or make a valid performance
claim; full gates and actual rendered/comparative evidence remain separate.
