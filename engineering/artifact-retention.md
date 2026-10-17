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
