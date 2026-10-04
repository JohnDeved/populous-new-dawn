# PR199 raw proof packet

Preserves the completed, reviewed Balloon driver raw command-position repair.
Tested head: `6b6eb684f4f010420a758cfe4fd481b6dfca9545`.
Merged as `139ec7dec8fc77462a9bbf8a5fc09ad7b9bb9d31`, identical tree
`aace5dbe66f68f8b7fdde1bd3936e7949970bd40`.

This is evidence-only preservation after merge. No tests, build, browser, native
probe or installed dependency access were performed while assembling this packet.

## Contents

- Final full check (997 tests), build, outer browser command and their exact raw
  stdout/stderr, plus inner harness receipt, scenario report and owned server log.
- Exact executable-bound native proof (126 raw leaves and 1,152 compositions),
  eight focused source tests, and independent reviewer reruns with raw streams.
- Original failure-first unsupported-consumer throw, retained as a failed run.
  Its dirty test input/diff hashes are preserved; the original dirty file/diff
  was not separately retained here. This is not a standalone baseline replay.
- Final and preceding review decisions, final checker preflight, source
  correspondence, and bounded quality evidence. The legacy format and Oxlint
  failures retain their failed statuses and unchanged-base comparison.
- Exact base-to-tested-head patch, changed-source hashes/Git blob identities,
  and Git-object comparison of native/runtime/test inputs through the merge.

## Verify integrity

From this directory, run `sha256sum -c SHA256SUMS`. Every file except SHA256SUMS
itself is covered. The publication comment provides its independent SHA-256
anchor. `manifest.json` maps each original receipt/stream to its byte-identical
copy and records the verified receipt/raw-stream hashes and source identities.
`source-correspondence.json` records the immutable Git inputs and merge tree.
The source files remain available at the tested and merged commits.

All original receipts are unedited. Absolute paths inside them describe the
original run; use the manifest's relative paths for these preserved copies.
Validation-plan and terminal-release files describe historical stages, not
current scheduling or dependency ownership. No game/tool binaries, credentials,
profiles, caches, dependency files or unrelated artifacts are included.

## Claim limits

Read [the final review](receipts/review-final-6b6eb68.md) for acceptance and limits.
Rendered evidence uses one staged driver Spy beside the authored Mission22
Balloon, actual mesh/UI clicks and deterministic supporting setup. Both
[screenshots](../README.md) show action states on the repaired build; the later
framing is shifted. This is not natural campaign/acquisition or full vehicle
lifecycle, cell/object resolution, non-driver scheduling, native pixel parity
or hardware-performance evidence. Checkpoint continuation is source-covered.
Cleanup follows the accepted harness-owned contract; no independent process/port
census was captured. Preservation adds no new gameplay claim.
