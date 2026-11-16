# Passive isolated dependency evidence (first protocol slice)

This module is not selected by any workflow or benchmark. The existing common-install rejection remains unchanged. It does not install, build, launch a browser or qualify a merge gate.

A separately reviewed caller must supply exact source revision, complete expected graph input hashes (including every declared patch), and the consumed dependency entry paths. The collector verifies supplied inputs against bytes, inventories bounded private install roots, resolves consumed paths into that inventory, rejects cross-side links/shared writable inodes, and permits a fresh before/after equality check. The revision is a supplied label, not a Git authentication check. Completeness of patch declarations and consumed entries is a caller proof obligation: this helper does not parse dependency graphs or discover every runtime import.

Limits: metadata observations are not an OS sandbox, hostile-concurrency guarantee, provenance of package downloads, or proof that an installation was frozen. External symlinks and shared inode layouts are intentionally unsupported rather than normalized. A separate authorized installer and trusted per-side resolver must establish those contracts. Graph declarations are limited to 64 inputs, 8 MiB each and 16 MiB combined, with every size checked before any graph payload is read. Relative graph/consumer/inventory paths are limited to 512 characters and source-root strings to 4096. Inventory is bounded to 100,000 entries, 1 GiB total regular-file bytes and 16 MiB per file; unsupported layouts fail closed. Directory entries are read incrementally with explicit closure, then only the bounded admitted manifest is sorted. Supplied-I/O negatives exercise file growth, shortening, read errors and descriptor closure plus directory-read failure closure; these do not simulate hostile concurrent filesystem replacement. No actual project install is inventoried by the fixture tests.

Remaining protocol work: exact Git/source admission, complete reviewed patch manifests, verified per-side frozen installs and immutable consumption manifests, trusted build driver with per-side tool resolution, fixed browser/runtime identity, serialized resource admission, unchanged gameplay/death/budget oracles, cleanup, separate real vinext served-HTML verification, and explicit reviewed gate-policy integration. A standalone evidence pair must not be reported as passing the existing performance check.

## Passive exact-source admission slice

`reviewedSourceInputs` binds a trusted local project checkout's actual HEAD and clean tracked snapshot to an expected revision. Each reviewed input must be one regular committed blob, fit the graph bounds, and match contained working bytes. It rechecks HEAD and tracked cleanliness afterward. Git subprocesses are bounded by a ten-second timeout and output limits; fetch protocols/lazy fetching and filesystem-monitor invocation are disabled for those commands only. No checkout, fetch, install, configuration write or workflow selection occurs.

This is for an already trusted repository, not a sandbox for attacker-controlled Git configuration, helpers or concurrent filesystem replacement. It does not discover omitted patch declarations, prove upstream authenticity or qualification of an installed dependency graph. Its explicit input list must be independently reviewed. The old common-install check remains unchanged.

Source admission now uses a 30-second monotonic cumulative budget, checked around
Git calls and each working-file read, with each Git timeout capped by both the
remaining budget and 10 seconds. This rejects over-budget completion; it cannot
preempt a blocked synchronous filesystem syscall, so it is not a hard wall-time
sandbox. Supplied-I/O negatives exercise final HEAD/status changes, actual file
growth during reading and descriptor closure, plus cumulative deadline expiry.
Sequential verification remains non-atomic and assumes a trusted local checkout.
