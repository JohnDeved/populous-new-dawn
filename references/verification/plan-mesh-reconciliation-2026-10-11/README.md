PR #346 merged as main `7cb339d01713b3ec3c7e1f46bbdd6d78a5fca86f`,
with the same full `6dca6191013a7c7263821151a75681ee18e199f8` tree as
reviewed author and tested published heads. No checks were rerun.
`merged-full-tree-equivalence.json` is a separately pinned supplement.

Strict scoped Oxlint **failed** on candidate and base; its separate inherited
diagnostic comparison **passed**. The actual unmodified-base scaling regression
**failed** while four other cases passed. Candidate focused 5/5 and exact
published-head standard check 2042/2042 and build **passed**. Root planning statuses
remain unchanged; check-selection explains the bounded algorithmic claim.

Receipt `stdoutSha256`/`stderrSha256` fields identify original decoded streams.
Exporter source-root/home redaction may change copied decoded strings; separately
pinned `transport-stream-inventory.json` records original and copied file/stream
hashes and preserved statuses. Author/base paths outside export root are retained.
Supplemental inventory/merge files are outside core manifest verification.
Both private helpers are embedded with original-source hashes. No browser,
hardware, deployment, whole-building-caller complexity or full-issue claim.

# Review bundle: issue144-plan-mesh-index-final

This directory is intentionally outside the source checkout so a reviewer can open it
from an independent permitted executor or worktree.

1. Obtain the expected HEAD, changed-source SHA-256 values, receipt source hashes, and
   diff SHA-256 from a trusted source/PR handoff — never from this bundle's manifest.
2. Open this directory in the reviewer's permitted executor.
3. Run `node verify.mjs --expected-head <HEAD> --expected-diff-sha256 <SHA>`
   plus one `--expected-source path=sha256` for every present changed source,
   one `--expected-deletion path` for every deleted tracked source, and one
   `--expected-receipt path=sha256` for every receipt.
4. Review `changes.patch`, `manifest.json`, and the copied bounded receipts.

The bundle contains no repository credentials or environment files. Explicit receipt
inputs are text-only, secret-like assignments are rejected, and local source/home paths
are redacted in copied receipts.
