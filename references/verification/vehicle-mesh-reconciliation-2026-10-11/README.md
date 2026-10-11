PR #345 merged as main `79833890f3b3b06f91d0179dcc61cd0e012882ba`,
with the same complete `b95b00e79a81a29bf099b1aee15d67b11011ff6b` tree
as the reviewed author and tested published heads. No checks were rerun.
`merged-full-tree-equivalence.json` is a separately pinned supplement, outside
core manifest verification.

Transport notice: strict Oxlint **failed** on candidate and base; its separate
inherited-diagnostic comparison **passed**. The actual unmodified-base scaling
regression **failed** while seven other cases passed. Candidate focused 8/8 and
exact published-head standard check 2037/2037 and build **passed**.

Original receipt `stdoutSha256`/`stderrSha256` fields identify the original decoded
streams. Exporter source-root/home redaction may change copied decoded strings;
`transport-stream-inventory.json` records original and copied file/stream hashes
and preserved statuses. Author/baseline paths outside the export root are retained.
This supplemental inventory is separately pinned in the trusted handoff, outside
core manifest verification. No browser, hardware, deployment or whole-issue claim.

# Review bundle: issue144-vehicle-mesh-index-final

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
