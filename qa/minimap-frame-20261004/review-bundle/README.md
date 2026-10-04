# Review bundle: minimap-frame-176

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
