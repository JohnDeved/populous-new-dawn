# Pre-ready native-style UI evidence

This isolated manual workflow is an evidence producer, not a required Full check,
deployment, merge approval, or replacement for the existing main-only
`ready_for_review` workflows. Those workflows, source checks and caps are unchanged.
UI PRs remain draft until their exact-head screenshots have been inspected and
published under the [visual-before-Ready rule](README.md#visual-evidence-before-review).

## Activation and two-source identity

The infrastructure series must first receive independent source/workflow review,
ordinary focused and full verification, and an authorized main merge. Only then
is `.github/workflows/native-ui-evidence.yml` available for manual dispatch. Do not
mark an unverified UI PR Ready to activate this workflow. Dispatch itself is a
separate coordinated action, not part of installing the infrastructure series.

The workflow rejects any event other than its own `workflow_dispatch` on
`refs/heads/main` in `JohnDeved/populous-new-dawn`. It records the real event SHA,
workflow SHA/ref and separate full candidate SHA. It never sets `GITHUB_SHA` to the
candidate and never changes ordinary tutorial-runner synthetic-merge equality.
Both checkouts disable persisted credentials. The trusted sparse infrastructure
checkout is pinned to `github.workflow_sha`; the full candidate checkout and its
five existing supplements are pinned to the explicit same-repository candidate.
Canonical roots must be disjoint, not aliases or nested checkouts.

The trusted builder loads Vite/React/Tailwind only from the candidate's single
locked install, builds the candidate fixture's actual Home and CSS, stamps the
candidate revision, and links candidate public assets. No infrastructure app or
public assets are used. The other two supplements and adapter come from reviewed
infrastructure. Separate Git/blob/SHA-256 manifests bind all candidate tracked
files and trusted infrastructure files; installed dependencies and build outputs
are fingerprinted. Before/after verification rejects mutation.
The final build inventory is closed: the unchanged bundle plus only the recorded
exact candidate-public symlinks. Added files/directories, missing entries, wrong
link targets, type changes and byte changes fail. Uncaptured or unverified input
scopes are labelled as such, never reported as identical.

## Fixed coverage and budgets

Audio Options navigation and keyboard recovery recheck the live abort signal and
deadline before and after every awaited action/observation and before success.
Standalone audio callers use one finite aggregate navigation budget. Cleanup runs
independently after abort and retains falsy primary/secondary failures explicitly.
Menu entry must retain the complete ordered popup snapshot. The ownership summary
is one atomic read; complete serialized World equality is a separate read.

The seven required serial episodes are startup logo; selector recovery; frontend
and in-game Game/Sound preference-storage notices; frontend checkpoint notices;
real Options audio activation; loading recovery; and original-style pause checkpoints.
No baseline, missing, skipped, failed, timed-out or post-timeout success counts.
They exercise ordinary Home/menu/Mission 1 entry, with explicitly labelled browser
storage, resource, audio and WebGL failure boundaries, never fabricated native
save slots or injected game worlds. The original tutorial pass alone is not this
coverage. Screenshots are review evidence, not native pixel-parity proof.

One standard Ubuntu job, 20 minutes, Node heap 768 MiB, 120-second Home build and
720-second new adapter cap. Existing browser caps are untouched. The first two
episodes have 120 seconds each; the other five have 90 seconds each. One sandboxed
official Chrome, at most two contexts/pages, serial cleanup before the next
episode, and process-group termination on timeout. Any cleanup failure fails.
Pending context/page creation reserves capacity; late completions are closed
before another episode can start. Monotonic elapsed checks reject synchronous
late success even before a timeout callback executes. Primary assertions and
cleanup failures are retained separately. All seven records exist from the start,
so an early failure leaves explicit not-run results rather than missing coverage.
The parent persists this ledger before source capture and build. Dependency import,
Chrome provenance and launch failures retain the exact pre-launch stage and reason;
unexecuted episodes never claim successful cleanup. Candidate dependency exports
accept matching named/CommonJS-default values and reject missing, invalid or
ambiguous values without changing dependency roots.
There is no unsandboxed fallback, browser-path override, larger runner or secret.

Artifacts are capped at 256 MiB and 100 screenshots, with each command log capped
at 8 MiB. Caps are checked before/after each screenshot and episode plus once per
second by the supervisor; crossing a cap fails the run and preserves accumulated
evidence (the violating write is not silently removed). Raw JSON/log/PNG files
remain for seven days. Dependencies, profiles and build output are not uploaded.
Expected console resource errors must match concrete requests intentionally
failed by a supplement; runtime errors and unrelated resource failures still fail.
Chrome executable/configuration/version provenance is saved before launch, not
only on success; each screenshot records viewport/DPR and available actual WebGL
renderer observations. The Options audio episode enters through the shipped Menu,
Options and browser-help controls. Opening this modal legitimately pauses the game;
Continue restores its captured prior state without writing World/paused directly.
Pending accepts native or ARIA disabled semantics with matching busy state. Actual
focus is retained in evidence, including native disabled-button blur to body or the
modal root; the same top-layer Options modal must still own input. Retry must be
keyboard-reachable again through bounded real Tab navigation, never focus repair.
Repeated Enter/Space, held Space across rejected settlement and a physically hit-tested
pending pointer click must not leak into pause, overview, held gameplay keys or
campaign popup acknowledgement. The observed scene must own the current world.
The complete serialized paused World, clock, camera and retained popup owners must
stay unchanged, except the exact shipped failure notice on rejection. Serialization
is compared inside the page; mismatches retain both complete strings. Successful
retry is initially enabled but suspended under Options. Continue must then yield a
real running AudioContext, playing media and the scheduled background audio. Native
Space mutes again after reopening Options. Fullscreen must belong directly to the
actual menu while open and be absent, with the removed Sound footer, in gameplay.
Game and Sound storage faults are applied one key at a time and verify that the
other preference write still succeeds.

The portable `native-ui-evidence-tests` check exercises these rejection guards,
identity and resource limits without launching a browser. Checker and workflow
changes select it alongside conservative repository/workflow verification.
These fixture tests cannot replace exact-candidate rendered evidence, and the
candidate-owned checkpoint supplement remains candidate-owned. No budget,
source gate, skipped-episode or full-check policy is relaxed.

Before accepting any UI candidate, inspect the exact workflow/candidate manifests,
all seven terminal records and raw evidence; inspect pixels and caption images
with candidate SHA, viewport and browser/renderer. Obtain independent review,
then complete the unchanged full synthetic-merge gate for the actual combined
head/base. This head-only evidence never establishes full integration acceptance.
