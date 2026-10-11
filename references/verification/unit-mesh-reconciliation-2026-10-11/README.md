Evidence transport notice
=========================

Strict Oxlint FAILED for the candidate and exact base; the diagnostic comparison PASSED separately. Focused tests, formatter, ESLint, full check and build passed. Browser/hardware claims remain not-run.

Command-receipt stdoutSha256/stderrSha256 values bind ORIGINAL decoded streams. The reviewed bundler scans bounded UTF-8 and recursively decoded JSON, then replaces the current checkout root with <SOURCE_ROOT> and executor home with <HOME>. Redaction can change decoded streams. transport-stream-inventory.json records original and transported computed stream hashes separately; its externally trusted SHA256 is ab713ece6becd4e475f41386517e6adde272fdef1f0507d09b6f2765da2620c7.

The manifest verifies published/tested c4614400. merged-full-tree-equivalence.json separately records merged main 860e8ae2 with the identical complete tree 35d95366. No gates were rerun for this annotation. Supplemental notice/inventory/merge proof have handoff-pinned hashes; the bundle verifier authenticates its manifest-listed patch/source/receipts.

# Review bundle: issue144-final-c461

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
