# Worker closeout and review-bundle handoff

This workflow keeps recoverable tooling problems from turning into false `BLOCKED`
outcomes. It applies to Local Dev worker chats and complements, rather than replaces,
the gameplay/evidence contracts in this directory.

## Repair order

When several workflow problems appear together, use this order:

1. **Make review evidence portable.** A reviewer who cannot open a worker-owned
   ignored directory cannot independently verify the work.
2. **Release the Local Dev project binding before the final reply.** A finished worker
   must not leave its source worktree or review bundle `PROJECT_IN_USE`.
3. **Scope denials to the denied operation.** Preserve the denial receipt, do not retry
   or route around it, and continue independent allowed work.
4. **Choose the worker state from remaining work, not from one failed operation.**
5. **Keep one feature owner through implementation, checker repair, evidence
   publication, and PR handoff when practical.** Fresh review remains independent.

These are coordination repairs. They do not weaken feature acceptance, native proof,
browser checks, generated ownership, or review requirements.

## Worker state semantics

A tool or policy denial is an operation result, not automatically a task result.

- `DONE`: the scoped objective and required validation are complete.
- `IN_PROGRESS`: meaningful authorized work remains, including independent work
  after an optional or required operation was denied.
- `NEEDS_REVIEW`: useful review-ready tracked work is committed/pushed/published,
  even if a non-critical validation or follow-up remains.
- `BLOCKED`: no meaningful scoped work remains because a required dependency or
  operation cannot be obtained with current authority, and there is no useful
  review-ready partial result to hand off.

Never retry an unchanged denied operation or bypass the safeguard through a different
tool. Record the denial fingerprint/reason and continue only genuinely independent,
already-authorized work.

The helper exports the same decision rule for fixture tests:

```js
import { deniedOperationDisposition } from './scripts/orchestration/worker-closeout.mjs'
```

## One feature owner

Keep the implementation owner responsible for the same feature through:

1. source implementation;
2. focused checker repair;
3. evidence/receipt publication;
4. branch/PR update and final handoff.

Hand ownership off only for a real scope/resource conflict or explicit reassignment.
A fresh reviewer should inspect the final diff and bundle but should not become the
default checker-repair or evidence-publication owner. This avoids serial re-discovery
and conflicting partial branches.

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

A reviewer can instead bind Local Dev directly to the bundle and run the bundled `node verify.mjs` with the same trusted expected arguments, without opening the worker worktree.

## Raw source-bound command receipts

For review-relevant gates, capture the actual command output rather than replacing it with a summary-only claim:

```sh
npm run orchestration:receipt -- \
  --output work/orchestration/task/npm-check.json -- npm run check
npm run orchestration:receipt -- \
  --output work/orchestration/task/build.json -- npm run build
```

The receipt records the exact source HEAD/branch, command array, exit code/signal, raw stdout/stderr, and SHA-256 for both streams. Include these raw receipt JSON files in the portable review bundle. Receipt outputs must remain ignored under `work/orchestration/`.

Use the same wrapper for a closeout proof after switching Local Dev away from the source project:

```sh
node /absolute/source/scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/task/closeout.json -- \
  node /absolute/source/scripts/orchestration/worker-closeout.mjs \
    --source-project /absolute/source \
    --bundle-project /absolute/review-bundle \
    --active-project /absolute/temporary-closeout-project \
    --bundle-preflight open \
    --expected-head "$HEAD" \
    --complete true
```

`worker-closeout.mjs` verifies the source repository still has the trusted expected HEAD. If a safety operation was denied, pass `--denied-operation optional|required`, plus `--meaningful-work-remaining true|false` and `--review-ready true|false`; the CLI emits the same `IN_PROGRESS`/`NEEDS_REVIEW`/`BLOCKED` decision used by policy instead of leaving that logic test-only.

## Local Dev closeout checklist

There is currently no Local Dev `project_close` command. Closing is therefore an
explicit binding switch, followed by verification. Perform this only after all source
work, commits, pushes, and PR updates are complete.

1. Generate and locally verify the review bundle.
2. Use Local Dev `project_open` on the **bundle directory**. This is the reviewer-open
   preflight and must succeed; `PROJECT_IN_USE` means the bundle is not independently
   reviewable yet.
3. Run `node verify.mjs` while the bundle is the active Local Dev project.
4. Use Local Dev `project_open` with a unique disposable closeout slug and
   `onMissing: "temporary"`. This releases both the source worktree and bundle.
5. Call Local Dev `project_current`. The active path must overlap neither the source
   project nor the bundle.
6. Run the deterministic check, supplying the path returned by `project_current`:

```sh
node /absolute/source/scripts/orchestration/worker-closeout.mjs \
  --source-project /absolute/source \
  --bundle-project /absolute/review-bundle \
  --active-project /absolute/temporary-closeout-project \
  --bundle-preflight open \
  --expected-head "$HEAD" \
  --complete true
```

The command must return `status: "passed"` before the final worker reply. A stale
source binding yields `PROJECT_STILL_BOUND`; a stale bundle binding yields
`REVIEW_BUNDLE_STILL_BOUND`.

If review is not needed because there is no tracked change, skip bundle creation but
still switch Local Dev to a unique temporary closeout project and verify with
`project_current` that the source checkout is no longer active. The source-only check is:

```sh
npm run orchestration:closeout -- \
  --source-project /absolute/source \
  --active-project /absolute/temporary-closeout-project \
  --expected-head "$HEAD" \
  --complete true
```

## Install and use

No service or daemon is installed. The commands use Node's standard library and the
repository's existing Git checkout.

```sh
npm run orchestration:receipt -- --output work/orchestration/task/npm-check.json -- npm run check
npm run orchestration:review-bundle -- create --task-id task --base origin/main --output /absolute/bundle \
  --receipt work/orchestration/task/npm-check.json
npm run orchestration:review-bundle -- verify --bundle /absolute/bundle \
  --expected-head "$HEAD" --expected-diff-sha256 "$DIFF_SHA" \
  --expected-source path/to/source.ts="$SOURCE_SHA" \
  --expected-deletion path/to/deleted-source.ts \
  --expected-receipt work/orchestration/task/npm-check.json="$RECEIPT_SHA"
npm run orchestration:closeout -- \
  --source-project /absolute/source \
  --bundle-project /absolute/bundle \
  --active-project /absolute/neutral-project \
  --bundle-preflight open \
  --expected-head "$HEAD" \
  --complete true
```

The closeout command is deliberately not automatic: Local Dev project switching must
remain visible to the worker so it cannot silently release another chat's project.

## Rollback

The tooling is repository-local. Roll back by reverting the commit that adds these
scripts/policy changes. Review bundles are external disposable directories and are not
part of the source checkout; remove an obsolete bundle only after its review/evidence
retention need has ended. No persistent process, app setting, credential, or service
needs removal.
