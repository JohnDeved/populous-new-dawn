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

The standalone verifier locates the bundle beside its own `verify.mjs`, regardless
of the working directory. `--bundle` belongs to the repository wrapper above and
is not accepted by the standalone CLI. Run it directly from any permitted executor,
without opening the worker worktree, using the same trusted `--expected-*` identities:

```sh
node /absolute/review-bundle/verify.mjs \
  --expected-head "$HEAD" \
  --expected-diff-sha256 "$DIFF_SHA" \
  --expected-source path/to/source.ts="$SOURCE_SHA" \
  --expected-deletion path/to/deleted-source.ts \
  --expected-receipt work/orchestration/task/npm-check.json="$RECEIPT_SHA"
```

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

A completed role worktree may be reused after owner-confirmed closure and independent
verification that its historical evidence remains recoverable. Preserve existing
branches, reachable tested HEADs, raw receipts, artifacts, and held LOCAL packets.
Reconstruct historical tracked inputs from recorded Git objects only when their bytes
match receipt hashes; preserve dirty, untracked, helper, and installed-runtime inputs
through explicit backups or verified references. Record reconstruction separately
without rewriting original receipts or claiming old logical paths remain current.
Current commands still require exact physical source/input checks before and after
execution. The read-only `historical-input-resolver.mjs` verifies caller-pinned receipt
and HEAD identities with complete explicit input mappings; its proof does not release
ownership or authorize worktree reuse, evidence deletion, or publication.
It requires the supplied original source root to match the receipt's recorded `cwd`;
receipts captured with a separate command working directory need separate source-root
evidence before this resolver can support them. Git reconstruction ignores replacement
objects and disables lazy fetch so only available immutable objects supply verified
blob bytes.

For function-level research, optional [compact views and claim bindings](research-evidence.md)
keep conclusions and evidence boundaries visible while deferring raw assembly and
pseudocode. They supplement these receipts/bundles; they neither replace raw review
nor grant native/pixel/gameplay credit. Keep expected source/query/adapter identity
in the trusted handoff and require a separate proof claim for each needed callback.

## Standalone receipt raw-output limit

Both standalone receipt formats now capture stdout/stderr through owned pipes
instead of giving the child writable log descriptors. Each new receipt shares
one 64 MiB raw-byte allowance across stdout and stderr. Set
`POPULOUS_RECEIPT_MAX_RAW_BYTES` to a nonnegative safe-integer byte count (including
zero), or pass programmatic `maxRawBytes`; a supplied programmatic value wins.
Invalid configuration fails before evidence allocation or child launch. This is
separate from the verifier's `POPULOUS_VERIFY_MAX_RAW_BYTES` allowance.

`runCommandReceipt` now returns a Promise for execution. All callers must `await`
it; synchronous configuration, source, path and exclusive-creation failures still
throw before the Promise is returned. Mission 6 awaits each stage and binds the
shared `command-log.mjs` producer. Both CLIs await finalization and preserve their
nonzero failure exit behavior. No new workload timeout is imposed.

The raw allowance counts successful physical writes, not decoded characters.
Exact-boundary output passes only after pipe closure; excess output preserves the
captured prefix, records `rawBudget` and `rawCapture` with observed prefix byte
counts/hashes, and fails rather than claiming complete output. Version 2 retains
its pending publication guard on incomplete capture. Failed signals or inherited
pipes have a bounded failure drain; metadata distinguishes observed direct-child
exit from a still-live producer. Descendant cleanup is not claimed.

Historical v1 decoding/hash interpretation and default format stay unchanged.
Version 1 still embeds decoded output up to the allowance; this is not a
bounded-small-memory or default-v2 rollout. Raw limits do not cover arbitrary
child-created files, metadata/decoded derivatives, accumulated older attempts,
shared-runtime build logs or archive retention. No original evidence is removed.

## Version 2 command-receipt streams

The default command writer retains the version-1 receipt format and historical
decoding/hash interpretation; both formats now use the bounded producer above.
Select the bounded version-2 mode explicitly with `--stream-version 2` or the
programmatic option `streamVersion: 2`; use `1` or omit the option for legacy behavior.
Version-2 command receipts retain complete stdout/stderr as the original raw artifacts.
Version 2 records each stream's exact byte count and SHA-256 in `streams`; the
existing top-level stream hashes also refer to those raw bytes. Complete valid
UTF-8 is embedded only at or below 32 KiB per stream. Larger or non-UTF-8 output
has an explicit omitted state, never a misleading truncated `stdout`/`stderr`.
Artifact files and source/outcome evidence are not discarded.

The producer keeps its fresh output handles and directory identities through
capture and complete terminal serialization. Before replacing prepared/unknown
JSON it creates `publication.pending` in the physical artifact directory. It
tags the document `publication: guard-v1` and retains this guard through post-rename
validation and descriptor cleanup. Only after both succeed does it rename the
guard to `publication.complete`. A terminal JSON may retain the child's `passed` outcome
when finalization fails, but tagged evidence requires a physical completion marker and no pending guard
before ingestion. A missing pending guard alone cannot imply success.
No corrective JSON write is needed, so corrective I/O failure cannot restore credit.

This is not a cross-file atomic transaction or crash-durability guarantee. Path
identity checks followed by the completion-marker rename are not atomic against
later concurrent ancestor or destination replacement. Existing completion paths
are rejected, but Node's rename has no atomic no-replace option. Reader verification is a snapshot, not tamper-proof finality;
these receipts are development evidence, not a sandbox or attestation system.

Live checkpoint/Blast readers support both v1 and v2. V2 raw paths must be the
matching receipt's physical `.artifacts` directory, and semantic reads verify bytes,
hashes and complete text within an explicit 4 MiB-per-stream parse limit. An
oversized or invalid semantic payload is unknown, not a truncated successful parse.
Generic v2 measurement ingestion now crosses the same raw-validation boundary,
including the 4 MiB-per-stream and valid-UTF-8 requirements, before it can earn
credit. Those reads count against discovery's cumulative byte/time budget. Invalid
or projected v2 evidence remains an invalidated candidate, so a newer invalid
attempt cannot expose an older pass. Streaming metadata retains the receipt version.
Older opt-in v2 receipts without a guard are accepted only as freshly raw-verified
snapshots; guard absence does not prove historical finalization. Pinned historical
v1 readers and the default v1 writer remain unchanged; do not rewrite them into v2
or relax a pinned producer version to make a historical proof pass.

The review-bundle exporter supports one explicitly selected version-2 receipt:

```sh
npm run orchestration:review-bundle -- create \
  --task-id my-task --base origin/main --output /absolute/review-bundle \
  --v2-receipt work/orchestration/my-task/check.json="$ORIGINAL_RECEIPT_SHA"
```

The programmatic equivalent is `v2Receipt: { path, sha256 }`. The caller supplies
the original physical receipt's SHA-256 from a trusted handoff. Ordinary `--receipt`
inputs still reject v2, as do nested or JSON-encoded v2 values anywhere, including
inside the selected receipt or its logs. Only the exact verified root is eligible.
Version 2 remains opt-in for both capture and export; the default v1 workflow is unchanged.

The exporter bounds and verifies the source JSON while holding its file descriptor,
then uses the existing raw reader to verify both complete physical siblings, exact
artifact mappings, byte counts, SHA-256 values, inline consistency and UTF-8. The
existing 2 MiB-per-input and 8 MiB-total source/copy budgets include the main receipt
and both expanded logs, even when stdout/stderr were omitted from inline metadata.
The raw reader's larger semantic cap does not expand export permission. Secret-like,
path-bearing, binary, oversized, missing, changed, or aliased raw evidence fails
closed before bundle publication. No log is silently truncated or replaced.

The selected JSON retains ordinary source/home-path redaction. It is a portable
metadata review view, NOT the original physical-v2 receipt, and cannot be fed to
`readReceiptStreams` or gameplay/measurement evidence ingestion. Its original and
copied hashes remain separate. Each raw sibling is exported at its exact original
source-relative `<receipt>.artifacts/stdout.log` or `stderr.log` path only when the
existing sanitizer produces byte-identical bytes. Raw hashes and descriptors are
never rewritten to make a derivative look original. A byte-decoding change such as
BOM stripping also refuses raw export, even with zero counted path redactions.

The trusted handoff must enumerate the copied JSON and BOTH raw siblings using the
existing `--expected-receipt path=sha256` bindings. Obtain those copied hashes from
the trusted creation output, not from the manifest being verified. Both verifiers
require the exact three-entry set (plus any separately selected v1 receipts) and
reject missing, duplicate, redirected, or altered entries. An explicitly repeated
name for the same expanded physical input is included only once. Original evidence
is never modified by export or refusal. This narrow route deliberately does not
export unsafe logs or provide a general sanitized-derivative evidence format.

The opt-in mode bounds receipt log materialization, not compiler/browser memory or output
retention on disk. It neither establishes effective host capacity nor identifies
unseen host-memory owners. Normal source checks, application build and applicable
runtime acceptance remain separate gates.


### Sanitized v2 review-only derivatives

If complete v2 stdout/stderr contain source-root or home-directory paths, use the
separate explicit review-only export mode instead of weakening raw export:

```sh
pnpm run orchestration:review-bundle -- create \
  --task-id review-only --base origin/main --output /absolute/review-bundle \
  --v2-review-receipt work/orchestration/task/check.json="$ORIGINAL_RECEIPT_SHA"
```

This mode is mutually exclusive with `--v2-receipt`. It verifies the caller-pinned
original JSON and complete physical raw streams before scanning or sanitizing them.
Secret, invalid-UTF-8/NUL, byte-limit, alias, path, and publication-guard refusals
remain in force. Original receipt and log files are never modified. Do not also
name those same inputs with `--receipt`; unrelated bounded receipts may be included.
The command-receipt default remains v1; this does not qualify global v2 rollout.

`manifest.reviewDerivatives` lists a separate `reviews/<sourcePath>` descriptor
and its independent `bundleSha256`. The descriptor has kind `pnd-command-review`,
version 2, `streamFormat: sanitized-review-v1`, and `reviewOnly: true`. It records
original receipt/stream byte counts and SHA-256 only as provenance. Original raw
bytes are not included. Sanitized metadata, argv, and recorded outcomes are nested
review context, never top-level command/pass evidence. Both complete sanitized
text streams have their own paths, byte counts, and SHA-256. Source/home path
redaction also handles decoded JSON wrappers; JSON text may be normalized, while
stream UTF-8 BOMs are preserved. A source label requiring redaction is refused.

Obtain the descriptor hash from the trusted creation handoff, not from the bundle
being checked. Supply `--expected-review sourcePath=descriptorSha256` to either
verifier, alongside all existing HEAD/diff/source/deletion/receipt expectations.
The independent descriptor hash binds its original provenance and both derivative
hashes; raw `--expected-receipt` cannot substitute for this separate trust namespace.
Both verifiers reject missing/extra/aliased review files and mismatched associations,
with bounded physical reads. They check transport integrity, not execution success
or the existence of original bytes at review time. These derivatives cannot be
passed to raw receipt readers or used for parity/measurement credit. A reviewer
requiring execution evidence still needs the independently accessible originals.

### Mission 6 first-stage bounded-receipt pilot

The earned-victory runner opts only `fresh-release` into stream version 2.
`boundedReceiptStages` tracks that inline-format choice; every stage, including
version 1, now has its own raw-output allowance. The
remaining 18 stages and the command writer's default remain version 1. Shared
input hashes include the concrete v1 writer and v2 stream implementation, so a
mixed-version run retains the same source and producer-checkpoint checks. Stage
order, outputs, final summary assertions, and exclusive run-directory ownership
are unchanged. A finalization error can leave an incomplete `running` manifest;
neither that manifest nor an unpublished terminal JSON is a passed acceptance.

For a real run, retain the first-stage receipt and its complete raw artifact
directory. Pin the SHA-256 of the actual `fresh-release.json` bytes, then export
that one receipt using `--v2-review-receipt` above when logs contain source/home
paths. Independently hand off the returned descriptor hash and existing source
identities to both verifiers using `--expected-review`. This derivative is review
context only: it does not replace raw evidence or provide measurement/parity
credit. The existing 2 MiB per-input and 8 MiB total bundle limits are unchanged.

`tests/mission6-bounded-receipt.test.mjs` copies the real runner, plan and receipt
implementations into private Git fixtures, replacing game stages with explicitly
synthetic subprocesses. It checks mixed-version producer/consumer hashes, bounded
inline output, complete raw bytes, review export and both verifiers, non-ingestion,
child failure, source/checkpoint drift, failed finalization and no-overwrite.
These fixtures run no game simulation and do not establish the 29,504-turn win,
rendered browser behavior, native equivalence, or host-memory performance.

Rollback is local to the runner: set its per-stage `streamVersion` option to `1`.
Keep existing raw artifacts, source bindings and failed attempts intact; use a
new run ID for any retry. Do not change global defaults, remove source inputs,
raise byte limits, or relabel synthetic fixture output as gameplay evidence.
