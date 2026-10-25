# Shared game assets and isolated package layouts

## Boundaries

The canonical source checkout and its existing npm receipts remain unchanged.
Do not replace tracked `public/original` with a symlink, hide changes using index
flags, or weaken `safeRepoPath`. The tracked files are regular Git blobs; direct
symlinks change Git identity and bypass neither evidence nor path validation.

`scripts/orchestration/shared_runtime.py` creates an explicitly **non-Git runtime
view** from an exact clean source commit. Ordinary source files are copied from
Git objects. `public/original` links to a content-addressed asset tree outside the
view; its regular files hardlink SHA-256-addressed blobs shared across asset versions.
A different commit can reuse unchanged asset blobs without sharing mutable output.
This is a local execution adapter, not a repository asset-format or CI migration.

New manifests are version 2 with `assetLayout: filename-hardlinks-v2`. The shared
tree is `trees-v2/<Git-asset-tree>/<original-relative-filename>`; the outer runtime
directory symlink is retained. Realpath stops at the original filename, preserving
JSON/module/CSS loader selection and relative imports or stylesheet URLs. No asset
bytes are copied for a second filename, tree or view. Each leaf must be a regular
file with the exact declared CAS device/inode, content and mode, beneath physical
tree directories. Assets are non-executable data (`100644`); executable assets are
rejected before preparation rather than chmodding shared inodes.

Version 1 manifests and their `trees/<Git-asset-tree>` symlink leaves remain
verification-only compatibility. They are never rewritten, relabeled or reused as
v2 acceptance. Extensionless CAS leaf symlinks made real Vite JSON imports parse as
JavaScript. Typed CAS aliases would retain extensions but still lose the relative
directory layout for module/CSS references, so they are not the chosen repair.
Global `preserveSymlinks` is deliberately unchanged: it would also change pnpm
dependency identity. Keep old pools, views, receipts and failed outputs untouched.

The source checkout may be an ordinary sparse checkout for editing. An absent
tracked file is accepted only when Git marks it sparse; any present file is checked
against its Git object. Assume-unchanged flags are refused. The adapter never changes
the source index, sparse configuration, tracked paths, existing installs or permissions.
The new runtime is not advertised as a clean Git checkout and cannot be committed.

## Prepare and verify

Use persistent disk, not `/tmp` when `/tmp` is tmpfs. Inspect actual destination
capacity first. The helper requires a positive reserve and budgets verified new
allocations, retaining the old full-copy estimate as a comparison. Additional package
installation, cache metadata and build output must also fit the coordinated budget.
Do not race another preparation or consume its reserved disk allowance.

The versioned `verified-cas-new-allocation-v1` budget reads trusted Git objects and
fully verifies reusable CAS size, Git object ID, SHA-256, regular-file type and
non-executable mode. Existence, a matching filename or old receipt is not reuse
proof. Bad existing blobs fail rather than receiving a discount or being repaired.
Each unique missing content blob is charged once; private source files remain
copies. Every asset hardlink, directory, runtime symlink and manifest is charged,
even when a matching tree already exists. Allocation uses at least 4 KiB (or the
larger filesystem fragment size), with an extra block per file inode/entry and a
64 KiB manifest-sizing margin. These are conservative estimates, not quota or
filesystem-capacity guarantees.

The initial read-only plan must fit before any pool/runtime creation. After the
exclusive publisher lock is acquired, the helper revalidates source state, parent
filesystem identities, actual CAS contents/inodes/modes, allocation geometry and
current available bytes before materializing source or CAS files. A changed source,
CAS inventory or insufficient capacity fails closed. A post-prepare reserve check
also fails rather than returning a pass if other allocation consumed the reserve;
partial output is retained. Caller-supplied reserves, output budgets and runtime
free-space/memory floors are not reduced by the reuse calculation.

Example with explicitly chosen, fresh destinations:

```sh
python3 scripts/orchestration/shared_runtime.py prepare \
  --source "$source" --revision "$exact_commit" \
  --pool "$disk_root/assets" --runtime "$disk_root/runtime-task" \
  --scope build --reserve-bytes "$declared_remaining_reserve"
```

`--scope build` omits tests, research/evidence, documentation and engineering-only
roots. This reduces per-view copies; it is **not** a canonical full-check environment.
`--scope full` copies all tracked ordinary source. Both scopes identify exactly which
paths were materialized and bind every asset to the source commit's Git blob.
Normal source-bound CI remains a separate required gate. In particular, existing
npm-only dependency verifiers and Git-dependent tests do not automatically become
valid in this adapter. No full-gate success is implied by a prepare/verify receipt.

```sh
python3 scripts/orchestration/shared_runtime.py verify \
  --source "$source" --revision "$exact_commit" \
  --pool "$disk_root/assets" --runtime "$disk_root/runtime-task"
```

Verification derives identity from Git, not the mutable runtime manifest. It checks
all materialized bytes/modes, rejects changed source HEAD, dirty or masked source,
undeclared runtime inputs, asset extras/missing data, pool/root symlinks, target swaps
and leaves not identifying the exact declared CAS object. V1 keeps its original
declared-symlink checks; v2 rejects symlinks and equal-byte copies at tree leaves.
Every permitted mutable cache or
output must be private and physical, including `node_modules/.vite`, `.vite-temp`
and `.cache`. `node_modules` itself must remain a real local directory. Standalone
`verify`/`revision` checks these mutable caches, not the installed package inventory;
`run` additionally binds package bytes and restricts dependency links to that directory.

## Explicit installed-layout readiness

After separately provisioning the private pinned pnpm installation, use the trusted
source helper to check both source/assets and the installed layout:

```sh
python3 scripts/orchestration/shared_runtime.py ready \
  --source "$source" --revision "$exact_commit" \
  --pool "$disk_root/assets" --runtime "$disk_root/runtime-task" \
  --dependency-store "$declared_active_pnpm_store"
```

`ready` requires the explicit actual store path (including its version directory),
physical `node_modules/.pnpm`, pinned installation metadata, equal desired/installed
locks, contained resolvable dependency links and nonempty package files. It reuses
the read-only `shared_setup.py` installation audit and rechecks source/assets after
that audit. Missing or incomplete setup fails rather than being provisioned or
repaired. Run this in the serialized resource lane, not during an install.

The qualified `shared-runtime-readiness` result proves only source/assets and
installed pnpm layout. It does not prove package-to-lock integrity, usable imports,
native dependencies, check/build/browser success, disk savings or a RAM solution.
Sharing coverage remains measured, including zero for private copies. Subsequent
mutations invalidate this point-in-time evidence; no reservation or lock is implied.

`prepare`, `verify`, `revision`, and ordinary `run` retain their existing semantics.
A dependency-free diagnostic may legitimately pass `run` with dependency kind
`none` and zero inventory entries; that receipt is not installed-layout readiness.

## Execution and receipts

Run from the trusted source helper with an exact revision and a fresh receipt path:

```sh
python3 scripts/orchestration/shared_runtime.py run \
  --source "$source" --revision "$exact_commit" \
  --pool "$disk_root/assets" --runtime "$disk_root/runtime-task" \
  --receipt "$evidence/task-build.json" -- pnpm run build
```

Do not launch that build until the parent releases the serialized resource lane.
The wrapper verifies source/assets/dependencies before and after execution, retains
raw stdout/stderr with hashes, records the actual toolchain and resource controls,
and labels drift `invalidated` even when the command exits zero. Missing completion
is `unknown`, not success. One exclusive run lock owns each view's caches. Concurrent
views have separate `node_modules/.pnpm`, `.vite-temp`, `work`, `.wrangler`, `dist`,
profiles and captures. Unknown stale locks are retained, never stolen automatically.

The wrapper holds the exclusively created receipt and log files open, pins their
device/inode and single-link identity, and pins their physical parent directories.
Hashes and receipt updates use those owned descriptors, never reopened output paths.
Receipt/log replacement, added hardlinks or parent substitution refuse finalization;
retained original receipts remain `unknown`, not passed. This is evidence-integrity
checking, not a sandbox for hostile commands or concurrently running descendants.

New `run` attempts share one 64 MiB (67,108,864 byte) allowance across captured raw
stdout and stderr. `PND_RUNTIME_MAX_RAW_BYTES` selects a nonnegative safe-integer
byte limit; zero allows only empty output. A programmatic `max_raw_bytes` argument
takes precedence. Invalid limits fail before execution or new evidence creation.
The parent drains both pipes in chunks of at most 64 KiB and writes directly to
the already-owned log descriptors, counting actual successful writes. It never
buffers whole logs or passes writable log descriptors to the command.

Exceeding the shared limit preserves the retained stream prefixes and makes the
attempt nonpassing, even if the observed command exit is zero. Capture metadata
records observed/stored/dropped bytes per stream, EOF, completion, the limit and
failure reason. Observed counts cover only bytes actually read, not unknown output
after capture stops; retained hashes cover only the stored bytes. Historical logs
and receipts are never truncated or rewritten by the new allowance.

On overflow or capture failure, cleanup targets only the owned direct child: TERM,
then KILL after a one-second grace, with bounded drain/wait attempts. No general
workload timeout is introduced. A direct-child exit with inherited pipes still
open gets at most one second of further draining and is incomplete, not success;
descendants are never signaled. If the direct child's exit cannot be observed,
the receipt remains `unknown` and its runtime run lock is retained rather than
claiming that caches are free. Do not steal that lock or infer cleanup from silence.
Evidence path/link substitution still refuses terminal finalization. Existing
source, asset and dependency drift checks remain unchanged; `run` is not an
installer and dependency mutation still invalidates the attempt.

This bounds only newly capture-written stdout/stderr for one runtime command, not
arbitrary command-created files, metadata, accumulated attempts, dependency
storage, process-tree memory, or synchronous filesystem delays. It is not a disk
quota, whole-machine memory solution, or hard wall-time guarantee.

The Vite config's opt-in runtime revision path independently invokes source, asset
and mutable-cache verification before embedding the revision; an environment string
alone cannot establish identity. Package inventory binding belongs to `run` above.
Invalid runtime identity aborts the build. Ordinary Git checkout behavior is unchanged.

## Current pnpm shared storage setup

The repository has migrated to **pnpm 11.25.0**. Install the committed
`pnpm-lock.yaml` frozen; do not regenerate it with `pnpm import`. The retained
`package-lock.json` is an identity/provenance input, not the active install lock.
The committed `pnpm-workspace.yaml` already selects isolated/private virtual stores,
hardlink import, verified package content, disabled lifecycle scripts and side-effect
caches, and the reviewed public hoists. Do not override that layout in machine config.

Use the concrete [README setup](../README.md#run), always passing both store and cache
paths. `PND_SHARED_ROOT` is an explicitly chosen absolute root, outside the source
checkout, on the same persistent filesystem. Its `pnpm-store/v11` and `pnpm-cache`
children are reproducible package storage only: never point them at source, saves,
research, game-asset pools, held evidence or an unidentified old directory. Keep the
existing asset pool under a separate sibling such as `$PND_SHARED_ROOT/assets` and
use the unchanged `shared_runtime.py prepare/verify` workflow above when assets are
needed. Source-only editing allocates neither dependencies nor asset views.

The read-only `shared_setup.py` defaults to `source`. It verifies the four committed
dependency metadata files against the requested exact HEAD and reports dirty status
without refreshing the Git index or lazily fetching missing Git objects. Unrelated
edits are preserved, not certified as a clean source tree. No pnpm executable, asset
scan or dependency installation is required. `plan` additionally checks physical,
nonnested roots, actual/nearest existing filesystem devices, available bytes and
positive caller-declared allocation and remaining-reserve budgets. Known Linux
tmpfs/ramfs destinations are refused; an unknown mount type is reported, not treated
as proof of persistent storage.

Admission also reads Git's registered worktree inventory and rejects shared roots
equal to, inside, or containing any registered worktree, including sibling editing
views. Missing or symlinked registered roots fail closed without pruning or repair;
resolve their ownership separately. The inventory is checked again before returning.
This is a read-only snapshot, not a lock against later worktree changes, a canonical
shared-root registry, or discovery of unrelated clones. Continue choosing the same
external root explicitly: two different external stores are not automatically deduplicated.

Serialize the install after admission; the plan is a capacity snapshot, not a disk
reservation, quota or process memory cap. It cannot limit a later package manager's
allocation. Retain separate exact-source/toolchain/raw command receipts and resource
measurements. Re-run `plan` immediately before installation, use `--offline` with a
populated store, and do not automatically retry offline failure online. The initial
README command deliberately allows network to seed an empty store. No `prune`,
deletion, existing-install migration or lifecycle-script command is part of setup.
Pnpm itself can replace/remove corrupt reproducible package-cache files during
integrity checking; this is not a zero-write or zero-deletion installer guarantee.
Stop on unknown storage ownership or source/held-data overlap instead of adopting it.

`check` checks only the unchanged remaining reserve, not the already-spent install
allowance, plus a read-only installed-layout audit. It
requires physical local `node_modules/.pnpm`, genuine pinned pnpm JSON metadata
(despite its `.modules.yaml` filename), the declared active store, an equal installed
lock, and contained package links. Existing alias-based or old YAML profiles are
unsupported by this new guard, not modified or silently adopted. Source and
dependency metadata/bytes/links are checked for drift during the audit; mutable
Vite caches stay private under the existing runtime checks.

For every installed regular package file, the audit streams SHA-512, derives its
pinned pnpm content address including executable mode, and compares device/inode to
that actual store file. It reports logical package bytes, shared and nonshared
files/bytes, coverage, foreign hardlinks, and deduplicated shared inode bytes.
Equal-byte copies, an arbitrary hardlink count, or a metadata store path earn no
sharing credit. Some packages may legitimately be copied for build isolation; those
bytes remain explicitly nonshared. Zero/partial sharing is a measured result, never
an automatic savings pass. Metadata and `.bin` wrappers must remain private.

This is present inode-sharing evidence, not an allocation-savings, package-to-lock
integrity, crash-durability, dependency-compatibility or RAM-resolution claim. Overlay
filesystems can add copy-up costs. Native-package smoke checks, real imports, full
checks, build, rendered browser acceptance and actual resource measurement remain
separate gates. Never write to hardlinked package content; make a reviewed private
copy if mutation is required. No manager/version/CI change is introduced here.

Pinned upstream implementation: [pnpm 11.25 store version](https://github.com/pnpm/pnpm/blob/6d90c71efdffbc909b499490b64c66badc720327/pnpm11/core/constants/src/index.ts),
[content addressing](https://github.com/pnpm/pnpm/blob/6d90c71efdffbc909b499490b64c66badc720327/pnpm11/store/cafs/src/getFilePathInCafs.ts),
[SHA-512 store](https://github.com/pnpm/pnpm/blob/6d90c71efdffbc909b499490b64c66badc720327/pnpm11/store/cafs/src/index.ts),
[private build copies](https://github.com/pnpm/pnpm/blob/6d90c71efdffbc909b499490b64c66badc720327/pnpm11/store/create-cafs-store/src/index.ts),
[integrity repair](https://github.com/pnpm/pnpm/blob/6d90c71efdffbc909b499490b64c66badc720327/pnpm11/store/cafs/src/checkPkgFilesIntegrity.ts),
[installed metadata](https://github.com/pnpm/pnpm/blob/6d90c71efdffbc909b499490b64c66badc720327/pnpm11/installing/modules-yaml/src/index.ts).

## Ownership, invalidation and rollback

The source owner owns source commits; the asset pool publisher alone writes new CAS
entries under an exclusive publication lock. Existing blobs/trees are verified, never
silently overwritten or repaired. Changed bytes require a new source commit and new
asset tree; unchanged blobs are reused. Failed preparation retains partial output for
diagnosis rather than erasing potentially useful evidence. A later attempt refuses
incomplete or mismatched objects. No automatic store pruning is implemented.

Keep manifests and receipts until every consumer is released. Rollback is to the
untouched ordinary source checkout and its own dependency layout, not restoration by
copying a symlink over tracked files. Remove a generated view/store only after its
owner and consumers are confirmed complete and the usual cleanup authorization is
satisfied. Measure unique `(device,inode)` bytes across store and views; adding `du`
results can double-count pnpm hardlinks. Asset symlinks save disk and future tmpfs
allocation, but they do not by themselves prove a production build fits memory.

Focused portable acceptance:

```sh
PYTHONDONTWRITEBYTECODE=1 node --test tests/shared-runtime-storage.test.mjs
```

The suite uses the installed Vite, not a mocked extension lookup. Its tiny isolated
fixture bundles two JSON imports, a module's relative JSON import, nested CSS and
its relative PNG URL, same-byte JSON/raw text, and every currently committed binary
asset extension (`bin`, `png`, `wav`, `m4a`, `webm`). It checks evaluated values and
emitted types/bytes, and requires the retained v1 JSON layout to fail. These binary
fixtures test bundling, not media decoder validity. It also re-verifies both views.
For an explicitly bound external installation, set `PND_SHARED_RUNTIME_VITE_ENTRY`
to that installation's absolute `vite/dist/node/index.js` path and bind its actual
dependency bytes in the run evidence. Missing Vite fails the test, never skips it.
Use private disk-backed `TMPDIR` and the serialized lane even for this small check;
the normal default resolves Vite from this checkout's `node_modules`.

## Retained local dependency profiles

An ordinary Git source checkout may use a private dependency-only pnpm profile via
its `node_modules` alias. Each active mutable source owns its own physical layout,
virtual store, `.bin` wrappers and caches; only verified immutable package files
are hardlinked from the shared package store. Retired source views need not keep
an install. Preserve their exact package/lock identities and provisioning record
before removing an unused dependency alias.

The test runner recognizes isolated pnpm metadata in that profile. Its production
resource fingerprint binds the source package/lock/TypeScript configuration plus
the profile package/lock, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.modules.yaml`
and `.pnpm/lock.yaml`. The desired and installed pnpm locks must agree. Missing,
mixed npm/pnpm or symlinked metadata falls back to serial eligibility; never create
a fake `.package-lock.json`. Existing npm fingerprints and hosted CI envelopes are
unchanged. A layout change invalidates prior resource eligibility, not test scope.
This fingerprint is scheduling evidence, not complete installed-package integrity
or a substitute for source-bound check/build/browser receipts.

For the current project lock, the committed workspace and local compatibility profiles public-hoist
`playwright-core`, `js-yaml`, `sharp`, `oxfmt` and `oxlint`. These already-locked
transitive packages support existing browser metadata paths, test/probe imports and
quality CLIs. Preserve this `publicHoistPattern` in each private workspace profile,
use offline frozen-lock installation with scripts disabled, and verify the actual
public exports and native commands before switching a consumer. These older alias
profiles remain under their existing verification contract; the new read-only setup
guard deliberately requires a physical local install and does not migrate them.
