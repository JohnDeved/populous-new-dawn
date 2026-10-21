# Shared game assets and isolated package layouts

## Boundaries

The canonical source checkout and its existing npm receipts remain unchanged.
Do not replace tracked `public/original` with a symlink, hide changes using index
flags, or weaken `safeRepoPath`. The tracked files are regular Git blobs; direct
symlinks change Git identity and bypass neither evidence nor path validation.

`scripts/orchestration/shared_runtime.py` creates an explicitly **non-Git runtime
view** from an exact clean source commit. Ordinary source files are copied from
Git objects. `public/original` links to a content-addressed asset tree outside the
view; the tree's links select SHA-256-addressed blobs shared across asset versions.
A different commit can reuse unchanged asset blobs without sharing mutable output.
This is a local execution adapter, not a repository asset-format or CI migration.

The source checkout may be an ordinary sparse checkout for editing. An absent
tracked file is accepted only when Git marks it sparse; any present file is checked
against its Git object. Assume-unchanged flags are refused. The adapter never changes
the source index, sparse configuration, tracked paths, existing installs or permissions.
The new runtime is not advertised as a clean Git checkout and cannot be committed.

## Prepare and verify

Use persistent disk, not `/tmp` when `/tmp` is tmpfs. Inspect actual destination
capacity first. The helper requires a positive reserve and conservatively budgets
all selected files as full copies, including existing CAS assets. Additional package
installation, cache metadata and build output must also fit the coordinated budget.
Do not race another preparation or consume its reserved disk allowance.

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
and links escaping the exact declared CAS object. Every permitted mutable cache or
output must be private and physical, including `node_modules/.vite`, `.vite-temp`
and `.cache`. `node_modules` itself must remain a real local directory. Standalone
`verify`/`revision` checks these mutable caches, not the installed package inventory;
`run` additionally binds package bytes and restricts dependency links to that directory.

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

The Vite config's opt-in runtime revision path independently invokes source, asset
and mutable-cache verification before embedding the revision; an environment string
alone cannot establish identity. Package inventory binding belongs to `run` above.
Invalid runtime identity aborts the build. Ordinary Git checkout behavior is unchanged.

## pnpm without a premature repository migration

Use a pinned, already available pnpm executable. Copy the exact `package.json` and
`package-lock.json` into an isolated metadata directory and use `pnpm import`; retain
the original npm lock unchanged. Bind the npm input hash, pnpm output hash, pnpm
executable/bundle/version, Node/platform and local workspace configuration. Compare
all resolved package name/version/integrity identities, including optional native
packages and aliases, before installing. Lock conversion is not installed-byte or
runtime equivalence, and does not authorize deleting npm's lock or changing CI.

Use a disk-backed shared store on the same filesystem and a private virtual store:

```yaml
packages: ['.']
nodeLinker: isolated
virtualStoreDir: node_modules/.pnpm
enableGlobalVirtualStore: false
packageImportMethod: hardlink
verifyStoreIntegrity: true
ignoreScripts: true
sideEffectsCache: false
```

Install only the imported frozen lock, with explicit disk-backed store/cache paths,
low network concurrency and lifecycle scripts disabled. Do not run install commands
through another view's `node_modules`. Package bytes are treated as immutable:
sharing is only for installed content, not generated configuration caches or output.
The wrapper hashes their bytes, executable modes and links before/after use; any
package modification invalidates the run. A package requiring a mutable installed
file needs a reviewed per-view copy of that file before use, never a shared write.

The dependency inventory supports pnpm directory links; it does not spoof npm's
`node_modules/.package-lock.json` or reuse an old npm-only verification pass. Required
native-package smoke checks, real imports, full checks, build and rendered browser
acceptance remain distinct gates. Migrate repository package-manager/CI contracts only
after those gates and independent review. No new workflow or dependency version change
is part of this adapter.

Official references: [pnpm import](https://pnpm.io/cli/import),
[pnpm's symlinked layout](https://pnpm.io/symlinked-node-modules-structure).

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
