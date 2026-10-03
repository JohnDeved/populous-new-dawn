# Worker and review handoff

The worker owns implementation, focused repair, evidence publication, and a linked
GitHub draft PR. The parent owns final review, integration, and authorized main merges.
Use one writer per isolated branch. Reviewers remain read-only; unavoidable check
artifacts use an agreed ignored path. No project-binding/release handshake is needed.

A compact handoff includes issue/PR, exact base/head, outcome, check statuses,
source/input fingerprints, evidence path, remaining limits, and any held resources.
Read the full diff, not a summary. Review substantive repairs on the updated head.
Use raw receipts directly when the reviewer can access them; create the optional
portable bundle below only when evidence otherwise would not travel with the PR.

Use one GitHub status label at a time. Report `status:blocked` only for a concrete
required dependency with no useful scoped work remaining; review-ready partial work
can remain `status:needs-review` with its limits explicit. A check can be blocked
without the entire task being blocked. A denied action retains its exact reason and
fingerprint; do not bypass the safeguard. Continue independently authorized work.
Do not discard prior failed/denied receipts just because a later method succeeds.

Stop only task-owned processes and release shared resources after checks. Keep useful
receipts until review/integration is complete. Do not claim runtime ownership release
from a changed directory or a caller-supplied Boolean.

## Portable review bundle

Contracts and raw run receipts may remain under ignored `work/orchestration/`.
Before asking for review of tracked work, export a bounded bundle outside the source
checkout:

```sh
npm run orchestration:review-bundle -- create \
  --task-id my-task \
  --base origin/main \
  --output /absolute/non-overlapping/review-bundle \
  --receipt work/orchestration/my-task/acceptance.json
```

The command requires a committed tracked checkout. It writes:

- `manifest.json` with exact branch/base/head OIDs, changed-source SHA-256 values,
  Git blob OIDs, patch hash, and original/copied receipt hashes;
- `changes.patch`, the exact committed `base..HEAD` diff;
- explicitly named bounded text receipts under `receipts/`;
- a standalone `verify.mjs` and reviewer README.

Receipt inputs must be repository-local regular text files. Sensitive path names,
binary receipts, oversized evidence, and common secret-like assignments are rejected.
For JSON receipts, secret scanning also walks decoded values recursively, including
JSON-string wrappers carried inside command-receipt stdout/stderr or equivalent nested
string payloads. Decoding is capped at 8 JSON-string layers and 256 KiB cumulative
decoded JSON text per receipt; exceeding either bound fails closed. Rejection messages
identify only the field location and never echo the secret value.
Copied receipts redact the source-root and home-directory strings. Do not add
credentials, environment files, personal profiles, browser/session data, or arbitrary
machine logs to a review bundle.

Verification is caller-bound: obtain the expected HEAD, diff SHA-256, every present changed-source SHA-256, every deleted tracked-source path, and every copied/redacted receipt SHA-256 from a trusted source/PR handoff, not from the bundle manifest itself. Then run:

```sh
npm run orchestration:review-bundle -- verify \
  --bundle /absolute/review-bundle \
  --expected-head "$HEAD" \
  --expected-diff-sha256 "$DIFF_SHA" \
  --expected-source path/to/source.ts="$SOURCE_SHA" \
  --expected-deletion path/to/deleted-source.ts \
  --expected-receipt work/orchestration/task/npm-check.json="$RECEIPT_SHA"
```

Repeat `--expected-source`, `--expected-deletion`, and `--expected-receipt` for the complete expected sets. Deleted sources are explicit `state: "deleted"` manifest entries with no ambiguous `sha256: null`. `--expected-receipt` uses the copied bundle receipt hash (`bundleSha256` from the trusted creation output), so altered receipt payloads cannot self-authenticate by changing the manifest. The verifier rejects absolute/traversal paths, symlink escapes, identity-count drift, and any manifest identity that disagrees with those caller-supplied values.

A reviewer can run the bundled `node verify.mjs` from any permitted executor with
the same trusted expected arguments, without editing or opening the worker worktree.

## Raw source-bound command receipts

For review-relevant gates, capture the actual command output rather than replacing it with a summary-only claim:

```sh
npm run orchestration:receipt -- \
  --output work/orchestration/task/npm-check.json -- npm run check
npm run orchestration:receipt -- \
  --output work/orchestration/task/build.json -- npm run build
```

The receipt records the exact source HEAD/branch, command array, exit code/signal, raw stdout/stderr, and SHA-256 for both streams. Include these raw receipt JSON files in the portable review bundle. Receipt outputs must remain ignored under `work/orchestration/`.


Receipts bind the actual source HEAD; dirty work additionally needs the tested diff
and input fingerprints. Commit the candidate before final verification when practical.
If relevant code, fixture, dependency, or runtime input changes, rerun affected checks.
A portable bundle verifies identities and transport integrity, not gameplay correctness.
Never include credentials, browser profiles, session data, or arbitrary machine logs.
