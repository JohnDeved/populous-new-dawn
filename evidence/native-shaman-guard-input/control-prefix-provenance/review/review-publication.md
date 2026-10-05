# Control-prefix publication review

Reviewed supplement against evidence-branch base `3724f5aae9cd550bf51b6a9eca4e532408c1749b`.
The review snapshot contained 472 manifest artifacts, including 60 additions.
This report is appended afterward as artifact 473; no reviewed artifact changed.

Reviewed README SHA256: `e88aceb7db209670242819f8de27524332093a959f263a21f60a2f825c9ca03f`.
Reviewed manifest SHA256 before this report was appended: `7f3a4265ee6824403530540ccb379d9bb5ae20e8b79fdbbac1b2b6159141ed65`.

## Independent result

ACCEPT the bounded documentation/evidence supplement against 3724f5aae9cd550bf51b6a9eca4e532408c1749b. No blocking findings.

- All 472 manifest entries pass stored hashes and byte counts; all 412 prior artifacts and manifest entries remain unchanged.
- New raw copies match their sources. Both deterministic gzip files reproduce the complete original 724/693-row JSONLs, with matching original hashes and bytes.
- Derived control observations, action references, timings, screenshot metadata, training and initial Move match raw evidence. Candidate records 36/38/cancel/40/cancel/44, renderer identity 68 and false legacy boolean are supported.
- Both runs remain failed with exit 1. Baseline’s already-false empty-selection observation is correctly qualified. Following, both Save/Load cycles and merge acceptance remain unproved.
- All 28 baseline and 29 candidate archived input hashes match witnesses. Receipt source fingerprints and terminal port cleanup agree.
- All 83 README local links resolve. Four retained PNGs are 1440×1000 and match recorded hashes. No obvious credential patterns found; git diff --check passes.

Review was read-only and CPU4-pinned. No browser, build, installation, active preparation packet or runtime changes. This acceptance covers publication of the bounded evidence, not completion of the Guard gate.

## Author verification and check scope

CPU4 command `node scripts/orchestration/cli.mjs plan --base 3724f5aae9cd550bf51b6a9eca4e532408c1749b`
exited 0. It classified the 62 documentation/evidence paths in the review snapshot
as unmapped and conservatively selected `npm run check`. Explicit focused review
resolves those paths as evidence-only: no runtime, dependency or active QA input
changed. Under the engineering docs-only exception, full check/build were not
rerun. Author and independent verification both checked artifact and source hashes,
complete gzip correspondence, retained failures, observation semantics, local README
links and credential patterns. Existing final package gates retain their original
source-bound status. The initial unstaged `git diff --check` passed only for the
already-tracked README and manifest; it did not inspect the untracked raw copies.

## Staged whitespace correction

The full staged `git diff --cached --check` subsequently exited 2 for original
blank lines at EOF in exactly three byte-exact archived inputs:

- `control-prefix-provenance/revision-07/accepted-input.mjs:46`
- `control-prefix-provenance/revision-07/browser-probes.mjs:179`
- `control-prefix-provenance/revision-07/replacement-observer.mjs:30`

These source bytes are intentionally preserved rather than normalized. This
corrects the scope of the initial independent result's diff-check statement above.
The authored README, manifest, derived summary and this report pass scoped staged
`git diff --cached --check -- <authored paths>` (exit 0). The full staged result
remains failed with these disclosed raw-artifact whitespace warnings.


## Independent recheck

ACCEPT unchanged; no gameplay or evidence blocker.

Correction: my earlier diff-check statement covered tracked unstaged changes only. Full staged diff-check reports exactly three EOF blank-line warnings in immutable revision7 copies: accepted-input.mjs:46, browser-probes.mjs:179 and replacement-observer.mjs:30. Preserve their original bytes and disclose these warnings.

The authored README, manifest, summary and publication review pass the scoped staged check. All 473 current manifest entries pass hashes and byte counts.
