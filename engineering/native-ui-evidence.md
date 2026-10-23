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
six existing supplements are pinned to the explicit same-repository candidate.
Canonical roots must be disjoint, not aliases or nested checkouts.

The trusted builder loads Vite/React/Tailwind only from the candidate's single
locked install, builds the candidate fixture's actual Home and CSS, stamps the
candidate revision, and links candidate public assets. No infrastructure app or
public assets are used. The other three supplements and adapter come from reviewed
infrastructure. Separate Git/blob/SHA-256 manifests bind all candidate tracked
files and trusted infrastructure files; installed dependencies and build outputs
are fingerprinted. Before/after verification rejects mutation.
The final build inventory is closed: the unchanged bundle plus only the recorded
exact candidate-public symlinks. Added files/directories, missing entries, wrong
link targets, type changes and byte changes fail. Uncaptured or unverified input
scopes are labelled as such, never reported as identical.

## Fixed coverage and budgets

The nine required serial episodes are startup logo; selector recovery; frontend
and in-game Game/Sound preference-storage notices; frontend checkpoint notices;
Options audio native/DPR1; Options audio fallback/DPR2; loading recovery; and
original-style pause checkpoints in separate native/fallback episodes.
No baseline, missing, skipped, failed, timed-out or post-timeout success counts.
They exercise ordinary Home/menu/Mission 1 entry, with explicitly labelled browser
storage, resource, audio and WebGL failure boundaries, never fabricated native
save slots or injected game worlds. The original tutorial pass alone is not this
coverage. Screenshots are review evidence, not native pixel-parity proof.

One standard Ubuntu job, 20 minutes, Node heap 768 MiB, 120-second Home build and
720-second new adapter cap. Existing browser caps are untouched. The first two
episodes have 120 seconds each; the other seven have 90 seconds each. One sandboxed
official Chrome, at most two contexts/pages, serial cleanup before the next
episode, and process-group termination on timeout. Any cleanup failure fails.
Pending context/page creation reserves capacity; late completions are closed
before another episode can start. Monotonic elapsed checks reject synchronous
late success even before a timeout callback executes. Primary assertions and
cleanup failures are retained separately. All nine records exist from the start,
so an early failure leaves explicit not-run results rather than missing coverage.
The parent persists this ledger before source capture and build. Dependency import,
Chrome provenance and launch failures retain the exact pre-launch stage and reason;
unexecuted episodes never claim successful cleanup. Candidate dependency exports
accept matching named/CommonJS-default values and reject missing, invalid or
ambiguous values without changing dependency roots.
There is no unsandboxed fallback, browser-path override, larger runner or secret.

The two audio modes already used independent fresh contexts and ordinary mission
entry. They now receive separate 90-second deadlines, increasing the aggregate
audio allowance from 90 to at most 180 seconds while the entire browser worker
remains capped at 720 seconds. No deadline is reset within a flow. Both exact
mode/version receipts, all five rendered states, public popup identity, pending
input guards, rejection/retry, real playback, menu reentry, compact Space mute,
final gameplay ownership and successful cleanup remain mandatory. A failed native
flow leaves fallback explicitly not-run; a combined legacy result cannot pass.
The standalone combined export is retained but is not the hosted entry point.

This isolates a measured setup-budget coupling, not a proven slow operation or UI
bug: replay `39946329756` exhausted the shared 90 seconds during fallback Menu
reentry after the complete native flow and successful fallback real playback.
Its Menu click had 799 ms left. Both popup witnesses and their actual ownership
assertions had passed (810.5 ms and 1994.1 ms); this replay alone does not prove
the separate 4-second popup setup allowance was necessary. The failed audio
record remains unaccepted, even though final browser-owner cleanup passed.

Artifacts are capped at 256 MiB and 100 screenshots, with each command log capped
at 8 MiB. Caps are checked before/after each screenshot and episode plus once per
second by the supervisor; crossing a cap fails the run and preserves accumulated
evidence (the violating write is not silently removed). Raw JSON/log/PNG files
remain for seven days. Dependencies, profiles and build output are not uploaded.
Expected console resource errors must match concrete requests intentionally
failed by a supplement; runtime errors and unrelated resource failures still fail.
Chrome executable/configuration/version provenance is saved before launch, not
only on success; each screenshot records viewport/DPR and available actual WebGL
renderer observations. Each Options audio episode observes the recovered real AudioContext
running state. Pending sound accepts either native or ARIA disabled semantics only
with matching busy state, while retaining the actual Options modal input owner (including native disabled-button blur). Repeated
Enter/Space, held Space across rejected settlement and a physically hit-tested
pending pointer click must not leak into pause, overview, held gameplay keys or
campaign popup acknowledgement. The observed scene must own the current world.
Recovery still requires the real AudioContext to run; native Space mutes again.
Game and Sound storage faults are applied one key at a time and verify that the
other preference write still succeeds.

The portable `native-ui-evidence-tests` check exercises these rejection guards,
identity and resource limits without launching a browser. Checker and workflow
changes select it alongside conservative repository/workflow verification.
These fixture tests cannot replace exact-candidate rendered evidence, and the
candidate-owned checkpoint supplement remains candidate-owned. No source gate, skipped-episode or full-check policy is relaxed. The audio
aggregate allowance change is explicit above; it is not a performance claim.

Before accepting any UI candidate, inspect the exact workflow/candidate manifests,
all nine terminal records and raw evidence; inspect pixels and caption images
with candidate SHA, viewport and browser/renderer. Obtain independent review,
then complete the unchanged full synthetic-merge gate for the actual combined
head/base. This head-only evidence never establishes full integration acceptance.

## Local collection without duplicate extraction

After an authorized terminal artifact download, use the
[archive-first collector](artifact-retention.md#archive-first-native-ui-collection)
with the retained raw API digest/size and independent complete candidate and
infrastructure source manifests. Its default is metadata-only: one canonical ZIP,
a complete member index and a small collection receipt, not a second full
`unpacked/` tree. Failed episodes remain visible in the raw archive and summary;
collection exit zero is not episode acceptance. Explicit bounded selected caches
serve screenshot inspection and publication, with external ownership/release
journals. Merely indexing screenshots does not mean anyone viewed them.
The narrow reader profile fails closed for larger/unsupported archives and does
not change this workflow's producer limits or acceptance requirements. Existing
sealed collections stay held until a separate reader/holder transition is proved.
