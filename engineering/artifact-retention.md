# Source and generated artifact retention

Development commits contain source, reusable probes, documentation, imported assets,
and the fixtures or original research proof required to reproduce correctness.
Generated validation runs belong in ignored `work/` or outside the checkout:
command logs and receipts, browser captures, timing samples, exported review bundles,
and their manifests or archives. Keep these available to reviewers without adding
copies to the source tree. A failed run is still useful evidence, not source code.

Never classify a file solely by extension or by an `evidence` directory name.
Original-game comparison facts are retained as small, versioned
[intentional fixtures](../tests/fixtures/native-reference-fixtures.md), not by
keeping broad run logs merely because tests once parsed them. Preserve independent
expected values, case identities, original source hashes and claim limits when
extracting them. Do not regenerate expected native behavior from the implementation.
Imported public assets, native assembly, reusable probes and required fixture inputs
remain tracked. A baseline source snapshot is not a disposable screenshot.

## Historical cleanup

The cleanup based on main `bc9cabf404240ad99b2aab8c26e9b0137cdd7702` untracks
1,078 generated files (164,427,287 bytes of current-tree content). It preserves
local copies with `git rm --cached`; it does not rewrite history or reduce the
size of existing Git history. Historical documents link to the immutable
[pre-cleanup tree](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702).
Commands in those dated records may require their archived run directory; they
are historical instructions, not claims that the artifacts exist in a fresh checkout.

The explicit ignored scopes cover audited dated runs only. They do not ignore all
JSON, PNG, log files, or the entire evidence tree. Place future run output in
`work/` rather than creating another tracked dated output directory. Before any
further cleanup, check executable consumers, fixture provenance, source ownership,
and documentation links, and validate against a tree without the untracked copies.

## Archive-first native UI collection

Use `scripts/orchestration/collect_native_ui_archive.py` for future downloaded
native UI pilot collections. Retain one canonical raw API archive and its actual
API response/digest, then generate the complete member byte/mode/hash index by
bounded streaming. The default writes only `archive-manifest.json` and
`collection.json` into a fresh metadata directory. It does not create `unpacked/`,
copy screenshots, or separately materialize large source/dependency JSON members.
The generated index establishes archive integrity, not independently expected
correctness. The collector compares complete candidate and infrastructure source
manifests against separately supplied, reviewed identities and retains failed or
interrupted runtime outcomes without promoting them to acceptance.

The request JSON binds run ID/attempt, exact candidate/workflow commits, candidate
tree, canonical archive path, output path, and four external `{path, sha256}`
inputs: raw run API, raw artifact-list API, expected candidate source and expected
infrastructure source. Expected source manifests have `commit`, `tree`, and a
complete `files` map with `blob`, `mode`, `bytes`, and `sha256` in each row. Pass the
reviewed request hash explicitly:

```sh
python3 -I -B scripts/orchestration/collect_native_ui_archive.py \
  --request /absolute/collection-request.json --request-sha256 <reviewed-sha256>
```

Acquisition remains a separate authorized, bounded official GitHub operation;
this offline command has no credentials, network, or download fallback. It checks
the raw API archive size/digest before decoding. An existing/partial output is
never overwritten. A collection with missing or mismatching identity records is
retained as `collected-with-identity-errors` and exits nonzero. A genuine failed
runtime may still be collected successfully, but collection is never a runtime,
visual, Full, Ready, merge, native-parity or performance pass.

For an explicitly requested view, use the indexed archive through
`scripts/orchestration/evidence_archive.py materialize`: pass the manifest hash,
one or more exact `--member` names and a fresh physical `--cache` outside the
canonical evidence root. Selection is limited to six files AND 32 MiB total;
there is no extract-all default. Retain its complete returned ownership receipt
outside the disposable cache. Release only that cache with `release-cache`, its
exact receipt SHA/token and a fresh external `--journal`. Archive, pathset, bytes,
modes and identities are reverified before removal. Unexpected entries, mutations
or I/O failures remain for diagnosis; never recursively clean a failed cache.
A cache lease ends after the named review/use completes, not an age-based timer.
The caller must record owner, selected names, allowed cache parent, output budget,
release outcome and any remaining reader hold. Repeated use recreates selected
views rather than accumulating full extracted trees.

The current qualified pilot reader is intentionally narrower than the producer's
256 MiB maximum: at most 96 MiB raw ZIP, 200 members, 128 MiB decoded total,
8 MiB/member, bounded path/header metadata and supported regular-file ZIP formats.
An artifact outside that profile fails closed and needs separately reviewed
support, not automatic extraction or larger hidden limits. Build/runtime archives
and depth-one raw-range storage recipes are separate contracts. A virtual raw
range reader is not interchangeable with the physical pinned descriptor contract
without adapter qualification.

Original archives, raw API/source-bound receipts, prior failures and user-facing
publication proofs remain held. Adoption changes future collection defaults; it
does not authorize retiring any existing extracted evidence, including files
covered by older physical-path seals. A later archive-backed transition must
retain the old seal as historical, prove exact restoration for every selected
member, resolve physical-path consumers and obtain explicit holder release.
New views restore bytes/modes, not old inode/ctime identity. The earlier ad-hoc
pilot collector sealed some still-open collection logs before final collection;
keep both its historical seal and later final seal, rather than rewriting them.

Large identity inventories belong in the same archive-first path, not duplicated
raw beside their archive. The measured pilot had approximately 5.75 MB of raw
dependency JSON, 1.55 MB of candidate-source JSON and 1.21 MB of episode JSON.
Those are named file allocations, not cross-packet duplicate or reclaim proof.
Future snapshots should reference a single immutable canonical representation
and bounded exact-content reads; do not retroactively compress or replace an
identity-bound current input. No new general inventory store or garbage collector
is introduced here. Disk duplication prevention does not establish a RAM fix.
