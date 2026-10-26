# Resource accounting and payload verification helpers

These additive libraries preserve reusable fixes from storage-construction diagnostics. They do not enable runtime apply, create a migration entry point, run installation/build commands, or relax existing review gates.

## Platform

These helpers require Python 3.9+ on a Linux/POSIX filesystem with directory file descriptors, `O_DIRECTORY`, `O_NOFOLLOW` and `st_blocks`. Focused validation was performed on Linux with Python 3.12. Portable here means no machine-specific paths or private environment binding; Windows support is not claimed. The Node test wrapper also requires Python on PATH.

## Allocation accounting

`scripts/orchestration/shared_allocation.py` supplies `IncrementalBudget` for a fresh, empty, caller-owned root. `admit(projected_bytes)` checks the next mutation against the unchanged caller cap and terminal receipt reserve. `account([absolute_target, absolute_parent])` observes actual allocation after mutation. `account(None)` performs full reconciliation.

Borrowed regular inodes require an exact identity/allocation baseline and explicit output-path mapping. Undeclared aliases cannot inherit an exemption. Full reconciliation opens the root through no-follow parents and walks held directory descriptors once; it rejects replacements, unexpected paths, disappeared paths and unreported allocation growth. Allocation deduplicates by device/inode, including directories and symlinks.

`PARENT_GROWTH_RESERVE_BYTES` is a conservative 64 KiB pre-mutation allowance, not extra capacity. A caller reserves rounded payload bytes plus parent growth for a new file, and a new inode block plus parent growth for directories or symlinks. The caller must account actual filesystem blocks and reject larger unexpected growth. This is not a universal filesystem allocation guarantee.

The caller still supplies live memory/disk/inode admission, process ownership and deadlines, source preservation, final content/inventory proof and filesystem compatibility. This helper neither supplies these checks nor grants execution permission.

## Streamed payload authentication

`shared_payloads.verify_file(path, descriptor, checkpoint, anchor=None, target=False)` reads no more than 64 KiB per iteration. Descriptors contain `bytes`, `sha256`, `mode` and optional Git blob `blobSha`. A source anchor contains an exact nine-field inode key and SHA-256. The verifier checks identity before/after reading, byte length, SHA-256, optional Git OID, and target mode when requested. It rejects symlinks through any parent or final path and never writes the payload.

`verify_inline` authenticates one bounded inline descriptor at a time, rather than materializing a complete source bundle. It can additionally require `shared_shim.rebase_shim` to reproduce an exact transformation with independently pinned source/result hashes and old-prefix occurrence offsets. The caller must authenticate the shim source identity before passing its bytes. These helpers do not discover or trust hashes from failed output.

## Focused checks and remaining gates

`tests/shared-resource-helpers.test.mjs` is a top-level Node test wrapper for the generated Python fixtures. It is discoverable by the existing repository test runner. The Python suite blocks child-process launch before importing the helpers and uses only generated temporary files.

Focused tests cover directory replacement/rename, symlink insertion, inode deduplication, exact alias exemption, reserve boundaries, pre-write refusal, streamed SHA/OID/mode/identity checks, bounded reads and exact shim occurrence proof. Passing these tests is not proof that an entire migration fits a time or RSS budget. Full repository CI, source review, actual runtime qualification, browser verification and deployment remain separate. No application behavior or existing runtime-apply disabled gate is changed.
