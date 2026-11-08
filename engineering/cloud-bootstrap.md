# Bound cloud workspace recovery

This is a continuation of #179 / PR #180, not a second bootstrap. The historical
head is `9e29c810bf82e364aaf72ff858a0da08919356bc`; the composition baseline is main
`08745845a526e739c4c0778e75fc2be8d5817abd`. Historical recovery inputs and their
hash-pinned download/extraction helpers remain separate from warm workspace setup.

**Current boundary:** the source-only implementation and nonexecuting runtime
plan received scoped independent review with 24 retained and 36 new offline fixtures.
Current-main integration still needs its own final acceptance. Native prerequisite
recovery is disabled at the CLI before manifest reads or construction of its runner;
the old report of 24 fixtures does not qualify bounded native execution.
Runtime execution remains disabled pending a reviewed write-enforcing adapter,
resource admission and real acceptance. This is not a completed permanent storage
or RAM solution, a configured startup service, or a disk-persistence promise.

## Warm source-only setup

Default behavior is a read-only plan. It does not invoke native recovery, Python
package installation, Node, pnpm, npm, downloads, Git fetches or full asset checkout.
Use a reviewed copy of this entry point together with the unchanged current
`shared_setup.py` and `shared_runtime.py` helpers.

```sh
python3 scripts/cloud-bootstrap.py --mode source --plan \
  --source "$existing_clean_local_source" --ref "$exact_40_character_commit" \
  --binding "$environment_owned_binding" --binding-sha256 "$approved_binding_sha256" \
  --worktree "$stable_worker_name" \
  --allocation-bytes "$declared_allocation" --reserve-bytes "$unchanged_reserve"
```

Use the same arguments with `--apply` to create the source-only workspace. No
package manager or native tool is required. A fresh private Git repository uses
`clone --local --shared --no-checkout` and sparse patterns before checkout.
This keeps Git metadata private, reuses the donor object database without copying
its object payload, and never changes the donor index, refs or worktree registry.
`public/original` and executor-local `.codex` content are not checked out.
Other tracked source is materialized; `node_modules` is never created.

Only a standalone donor with physical local `.git`, common and object directories,
no `commondir` redirection and no object alternates is supported. Linked-worktree
and alternate-backed donors are explicitly rejected before creation. The target
also needs standalone physical Git metadata, with exactly one private alternate
file naming the approved donor's physical object directory, and no additional
registered worktrees. Completion records both donor and target directory and
private metadata identities; reuse revalidates them without migration or repair.

Every present nonexcluded tracked source file is authenticated against its exact
Git blob and executable mode even when the index marks it skip-worktree. Missing
donor source is allowed only for a committed entry marked sparse by Git, and those
omissions are listed in the plan. The created or reused target must contain the
entire requested nonexcluded projection. Source-only verification deliberately
does not authenticate `public/original` or `.codex` payload; it still refuses their
materialization in the target. A clean `git status` alone is not source proof.

The resulting workspace points at the exact commit and cannot survive loss or
garbage collection of required donor Git objects. Do not delete or prune that
donor while any bound workspace uses it. This is ordinary Git object sharing,
not an independent backup. Push original commits and retain source-bound evidence
through the established handoff process.

A completed, unchanged workspace is reused under its same worker name. Changed
source, unexpected dependencies, materialized excluded paths, conflicting ownership
or incomplete prior creation fails closed. Nothing is reset, cleaned, overwritten,
deleted or silently replaced with a newly named workspace. Failed partial creation
and its unique receipt remain for owner review; a retry does not adopt them.

## One explicit owned storage binding

Warm setup never chooses or creates shared roots. A separately reviewed environment
owner must supply one binding for the existing storage and pass its exact SHA-256.
The binding is local configuration, not repository source or credentials. It has:

- `schema: 1`, a stable `storageId`, and the canonical repository URL.
- Exactly four `roots`: `shared`, `workspaces`, `store`, and `assets`.
- Each root records its normalized absolute `path`, filesystem `device`, and
  directory `inode`. All must exist, be physical, owned by the current user,
  have known non-RAM-backed filesystem evidence and be on one filesystem.
- `store.path` is exactly `shared.path/pnpm-store/v11`; `assets.path` is exactly
  `shared.path/assets`. The `workspaces` root is a separate nonnested root,
  outside Node package scope.
- Both `shared` and `workspaces` contain a private regular
  `.pnd-storage-owner.json` with exactly `schema: 1`, `storageId`, and the
  binding's `bindingSha256`.

Binding files and owner markers must be private regular files, not symlinks or
hardlinked metadata. Missing/replaced/relocated roots, conflicting markers, changed
bindings, or overlaps with the source and any registered worktree are rejected.
Unknown registered worktrees are not pruned. A reset, mount relocation or inode
change requires a separately reviewed recovery/rebinding, not an automatic second
store. This entry point deliberately provides no auto-bind or root-migration option.
It cannot discover unrelated clones or prevent another program selecting a different
store. Consistent use by all workers remains part of environment integration.

Source admission composes the current read-only shared setup guard, with explicit
allocation and reserve. Its estimate covers source files conservatively, not an
enforced quota on Git metadata, cache/output growth, concurrent allocation or RAM.
Warm commands allow only local Git transport and disable lazy fetching; failure
never turns into online recovery. These are process-local settings, not changes to
authentication, security settings or saved Git configuration.

Source creation uses pathname-based mkdir and Git operations under cooperative,
exclusive directory ownership. Pre/post identity checks are not containment against
concurrent root replacement. `OwnedEvidence` protects receipt descriptors, not Git's
checkout writes. Do not use this source-apply path where another process may rename
or redirect its roots; stronger containment requires a separately reviewed adapter.

## Runtime plan, not runtime execution

Select `--mode runtime --plan` with the same binding. The planner verifies the named
store exists and is nonempty and uses the existing runtime helper to verify the
exact asset tree's CAS bytes and hardlink identities. It does not certify the
store contains a complete dependency closure.

The output composes the existing source preparation, asset preparation, pinned
pnpm 11.25.0 frozen/offline installation and installed-layout readiness interfaces.
It specifies the same named `pnpm-store/v11`, private pnpm metadata/virtual stores
and all wrappers, and per-worker cache/home/tmp/XDG paths. The committed
`pnpm-workspace.yaml` remains authoritative for hardlink import, isolated layout,
integrity checking, disabled lifecycle scripts and side-effect cache.

`--mode runtime --apply` refuses before any action. The printed commands are
descriptive components, **not a qualified shell script or permission to run them**.
A maintained implementation still needs:

1. Reviewed write-enforcing execution adapter; do not treat post-run drift checks
   or a writable hardlink as protection. The local qualification runner is not
   automatically a reusable bootstrap interface.
2. Pinned pnpm executable and complete offline closure verification; no automatic
   online fallback, cold seeding, second store, or adoption of foreign dependencies.
3. Separate total runtime/package/output budgets and the serialized resource lane.
4. Actual private metadata/cache and shared inode checks, native/import smoke,
   exact-source build, and normal affected gates, followed by independent review.
5. A controlled new-worker/restart drill and integration into the real environment
   startup workflow. None of these are established by fixture success.

## Explicit native prerequisite recovery

The historical pinned recovery implementation and inputs are retained for review,
not executable through this CLI. Both `--mode prerequisites` and the
`--prerequisites-only` alias fail closed before manifest reads, runner construction,
recovery directories, logs, subprocesses, downloads or extraction, with or without
`--apply`, `--offline` or recovery-root options. This is an implementation/resource
qualification boundary, not a request for additional ordinary user approval.

Re-enabling this lane requires reviewed and tested bounded subprocess output,
process-tree cleanup, archive/extraction allocation admission and qualification of
the actual native tool closure, followed by a serialized bounded recovery. Python-only
or warm source-only fixtures do not establish those properties. Do not invoke the
retained internal recovery helpers as a workaround. The old full-worktree + per-worker
`npm ci` path remains retired, not a fallback.

Unchanged recovery components retain exact game/archive/EXE and tool hashes,
staged extraction, containment checks, resumable verified downloads, hash-locked
Python closure, reusable verified tools and read-only external caches. Existing
venvs are trusted executable inputs, not retroactively hash-certified packages.
Root locking, unknown-work preservation and source-bound receipts remain as in
the historical recovery path. Native/game/installer execution and authentication
are not added by warm setup. See `engineering/cloud-bootstrap.json`,
`cloud-python.lock` and `cloud-python-build.lock` for preserved pinned inputs.

The historical final independent review stopped after dependency-integrity and
archive-link findings; repairs were reported but final acceptance remains pending.
This modernization does not relabel that history as accepted. Re-review all retained
recovery code before claiming the complete cold recovery path is qualified.

## Focused tests and persistence limits

The new tiny offline suite is:

```sh
PND_BOOTSTRAP_FIXTURE_ROOT="$approved_private_fixture_directory" \
  PYTHONDONTWRITEBYTECODE=1 python3 -B tests/shared-workspace-bootstrap.test.py -v
```

It exercises read-only planning, two source-only workers, sparse asset omission,
private Git metadata, stable ownership/reuse, dirty/interrupted state preservation,
missing/conflicting/replaced bindings and roots, exact locks/revisions, explicit
offline failure and nonexecuting runtime plans. It invokes only local Git, no
package manager or vendor/game recovery. The separate historical suite remains
`tests/cloud-bootstrap.test.py`; its former npm fixture now checks that obsolete
entry point is unavailable. Historical fixtures must be rerun and independently
reviewed for the combined final candidate, not counted as new acceptance.

No cloud filesystem is guaranteed to survive. A surviving binding permits verified
reuse; a lost binding/store/source requires explicit reconstruction and rebinding.
Neither source recreation, inode counts nor hardlink storage demonstrates gameplay
RAM improvement or bounded process-tree memory. Keep those acceptance claims separate.

