# Maintained shared execution

This standalone adapter is not an accepted production replacement. It adds
`scripts/orchestration/shared_execution.py` around the unchanged `shared_setup`,
`shared_runtime`, and reviewed `shared_workspace.owned_binding` interfaces.
Bootstrap source apply and runtime-plan-only behavior are not modified. No install,
asset recovery, runtime materialization, startup adoption, browser or gameplay gate
is implied. Existing legacy prerequisite/bootstrap commands are not migrated by
this change. In particular, their historical unbounded decoded subprocess output
is not covered by this adapter's bounded capture.

## Narrow supported path

1. Authenticate an explicit schema-1 owned binding and an already prepared,
   separately verified source/runtime/provider. No stamping ownership on unknown
   roots or adapting today's unrelated absolute paths to the binding.
2. `plan --stage prepare-state|run` verifies inputs and reports precise capability
   or state-acceptance blockers. It never starts pnpm, installs, creates links,
   allocates private state or refreshes accepted pins. Existing helper source
   verification can invoke read-only Git commands with local no-write controls.
3. `prepare-state` copies only the one private pnpm state file into a fresh
   metadata-root projection. Package directories, other metadata, source, assets
   and Git donors remain read-only. It uses unchanged `OwnedEvidence` and
   `capture_command` for exactly pinned `node pnpm.mjs run`, with no script, install,
   `--dry-run`, disabled verification or synthetic timestamp. A strict full
   before/after dependency inventory explains exactly one timestamp row and a
   private atomic inode replacement. All other bytes, links and inode metadata
   must stay identical. A second namespace verifies the final state read-only.
4. A separate independent review explicitly accepts that sealed state receipt.
5. `run` projects only the accepted state file, never its writable preparation
   root. It invokes unchanged `shared_runtime.py run ... -- node pnpm.mjs run build`.
   The canonical host dependency identity remains the old one; the inner helper
   verifies the full projected new identity, including state bytes, before/after.
   Exact source, provider, asset, Git, tool and inode inventories are rechecked.

Only the pinned pnpm 11.25.0 isolated workspace profile is supported. Changed
workspace settings, hooks, config dependencies, state fields, namespace path or
pnpm version fail for explicit review. Dependency and asset materialization is a
separate future operation; there is no installation fallback.

### Exact state serialization and cleanup evidence

Planning accepts only two byte formats: the exact two-space JSON form with a
single timestamp replacement, or the sorted compact source form serialized by
pinned pnpm 11.25.0 into its exact field-ordered, two-space output. The latter
requires the known settings keys and a single name/version project. Both reject
duplicate keys, unknown top-level fields, noninteger timestamps, and unexpected
whitespace. Expected output is derived from the old values, changing only the
observed timestamp; semantic JSON equality alone never accepts a transition.
The timestamp must still advance inside the actual command interval and exceed
the input mtime floor. No canonical state is rewritten by this validator.

Payload results retain the initial observed survivors and the monotonic interval
and direct return code of the first cleanup observation, separately from the
final survivor list. An initial survivor still fails even if later cleanup
succeeds. Failed observation remains unknown and failed, not an empty list.
These fields aid diagnosis; they do not explain a historical cleanup warning or
waive the existing cleanup and sealing gates.

## Qualification is executable, not an acceptance shortcut

Projected commands expose the selected, exact pinned Python executable under the
bare `python3` name in that executable's directory. This supports build consumers
such as Vite's revision helper without requiring a host symlink or mounting a
whole tool directory. The alias is an additional read-only bind, recorded in the
persisted mount plan. The source must already be an exact pinned read-only tool
mount; unpinned sources, writable mounts and destination collisions fail. A
selected executable already named `python3` needs no additional bind.

Generated read-only/frozen qualifier cases actually invoke bare `python3` with
isolated imports and bytecode writes disabled, verify the selected interpreter
inode, and require the kernel `ST_RDONLY` mount flag before and after the check.
A writable open must also be denied, with its exact errno retained. `EACCES` or
`ETXTBSY` may precede `EROFS`; denial alone never proves a read-only mount. Inode or
mount-flag drift, writable access and unrelated errors fail. This changes the
qualified tool projection, so previous backend acceptances do not qualify these
new adapter bytes. It neither installs Python nor changes host paths/permissions.

`qualify` runs generated sentinels through the actual maintained mount, PID owner,
raw capture, clock, cleanup and final-seal backend. It uses a pinned Python/bwrap
closure. Reviewed application tool roots can be mounted read-only, but the
qualifier executes only generated Python sentinels, not Node/pnpm or an application.
It does not use real repository contents, packages or game assets as test payloads. Cases cover
read-only hardlink/symlink aliases and every visible private-PID proc-root alias, immutable namespace root, private
atomic metadata replacement, frozen-state write denial and absent host alias,
positive PID/start-ticks/NSpid/namespace binding, escaped sessions, a hard raw byte
cap, actual producer time versus longer postchecks, and persistent observation
failure with retained-pidfd cleanup. It leaves each expected failure as a failure. The observer case requires the exact
structured internal injection marker, whether the main loop or observer thread
encounters it first; arbitrary error strings or unrelated cleanup failures cannot
qualify. Independent stopped-process proof qualifies failure handling, not payload
success. Read-only sentinel cases require a bounded, exact init-and-gate PID view
(no unknown/extra/outside processes), positive readability of the same generated
sentinel inode through every visible /proc/<pid>/root, and unchanged visibility
across the write-denial checks. Disappearing/unreadable aliases fail closed.

Qualifier cleanup waits for asynchronous owned-process termination within the
existing five-second cleanup limit. Observer-fault recovery and finalization share
one deadline rather than receiving separate grace periods. Each phase retains
before/after process identities and observation errors. A fresh zero-survivor
observation must finish before the deadline; live or unknown survivors at the
deadline still fail. The observer is joined even if cleanup fails. This changes
only generated qualification cleanup, not normal payload failure classification.
It does not retroactively certify a historical missing cleanup observation.

The generated protected hardlink sentinels live outside the all-private sealed
qualification evidence root. Production layout never constructs those sentinels.
The full qualifier allocation includes both trees. No production sealer exemption
permits hardlinked state, raw logs or generated output.

The qualifier emits a sealed evidence receipt requiring independent review; it
cannot emit its own accepted capability receipt. This is intentionally distinct
from the historical one-shot build, whose acceptance does not qualify new code.
A future source change invalidates capability acceptance. The CLI is live code:
only invoke `qualify`, `prepare-state`, or `run` after the coordinator releases its
specific execution lane and scope.

## Invocation

Every external configuration file is a private regular JSON file with an explicit
SHA-256 supplied by the caller. Every action reads immutable input expectations;
none generates or refreshes an accepted baseline.

    python3 -I -B scripts/orchestration/shared_execution.py plan \
      --spec /owned/execution.json --spec-sha256 <sha256> --stage prepare-state

    python3 -I -B scripts/orchestration/shared_execution.py qualify \
      --spec /owned/qualification.json --spec-sha256 <sha256> \
      --expected-adapter-sha256 <sha256> --evidence /owned/fresh-qualification

    python3 -I -B scripts/orchestration/shared_execution.py prepare-state \
      --spec /owned/execution.json --spec-sha256 <sha256> \
      --expected-adapter-sha256 <sha256> --evidence /owned/fresh-state

The `run` form uses the same flags plus a specification containing an independently
accepted state reference. Run names one fresh evidence destination and a stable,
positively owned runtime lock. Existing destinations or locks fail closed; failed
attempts, raw files and locks are retained, never overwritten, automatically
adopted, timestamp-restored or deleted.

## Version-1 contracts

A pinned reference is exactly `{ "path": "/absolute/file.json", "sha256": "..." }`.
The specifications below describe schemas; they are not executable example input
pins or permission grants. Exact keys and supported values are validated by code.

Execution spec:

- `version: 1`, `kind: "shared-execution-spec"`.
- `binding`: existing owned-binding pinned reference.
- `source`: exact `path`, 40-character `revision`, 40-character `tree`.
- `runtime`: exact `path`, `manifestSha256` for its private runtime manifest.
- `provider`: exact `path`, unchanged strict `dependencies` identity.
- `gitObjects`: the exact recursive local object-directory closure, including
  source objects and every donor. No HTTP alternates, redirected common directory,
  symlinked object file or undeclared donor. Donors are independently pinned and
  read-only mounted; the adapter never calls Git write-tree.
- `tools`: physical `python`, `node`, `pnpm` entry and `bwrap` paths; `readonly`
  closure roots/files; `pnpmVersion: "pnpm@11.25.0"`. Current Python must match.
  No broad host-root, home, credentials or special system-tree mount is accepted.
- `inputs`: pinned `shared-execution-inputs` inventory described below.
- `backend`: pinned independent capability acceptance, or null for blocked plans.
- `state`: pinned independent state acceptance, or null for preparation/plans.
- `limits`: all `Limits` dataclass fields. Initial build ceilings are 3 GiB sampled
  owner RSS, 1536 MiB V8, 300 s actual producer, 600 s whole envelope, 32 MiB combined
  raw output, 128 MiB evidence and 1 GiB incremental allocation. Floors retain
  2 GiB free storage, 3840 MiB MemAvailable and 32768 inodes. These are sampled
  owner stops/capacity snapshots, not cgroups, quotas or persistence guarantees.

Input inventory:

- `version: 1`, `kind: "shared-execution-inputs"`.
- `source`: exact unchanged helper source-verification result.
- `dependencies`: exact unchanged helper canonical dependency identity.
- `roots`: exact path-to-SHA-256 map of `tree_inventory` encoding for the complete
  derived source/runtime/provider/store/assets/Git/tool/helper roots. Every row
  includes path, type, full device/inode/mode/size/mtime/ctime/nlink/uid/gid and
  regular-file hash or exact symlink text. Only documented dependency caches are
  excluded from dependency-root inventories; the strict helper is unchanged.
- `aliasLedger`: null if no new aliases were approved, otherwise a pinned external
  acceptance containing `status: "accepted"`, exact `inputRoots`, `before`/`after`
  path-to-file identities and `aliases` new-path-to-original-path map. The adapter
  validates aggregate per-inode nlink deltas, exact same-inode aliases, and all
  other bytes/mode/mtime/owner invariants. Unexplained Git mtime or ctime changes
  are not a permitted alias transition. Later authorized links require new explicit
  reconciliation, never a silently recomputed pre-build baseline.

Qualification spec:

- `version: 1`, `kind: "shared-execution-qualification-spec"`.
- `tools`: same structural keys, but `node` and `pnpm` equal the pinned Python path
  and `pnpmVersion: "not-executed-sentinel-only"`; neither Node nor pnpm is run.
- `toolRoots`: exact current `tree_inventory` hash map for `tools.readonly`, which
  must include the adapter/helper directory, pinned Python/bwrap and their minimal
  needed libraries/executables. This is explicitly supplied, not auto-adopted.
- `limits`: a separately reviewed small profile, at most 120 s envelope, 10 s
  producer, 512 MiB sampled owner, 32 MiB allocation, 16 MiB evidence and 4 MiB raw.

Independent backend acceptance:

- `version: 1`, `kind: "shared-execution-backend-acceptance"`, `status: "accepted"`,
  `adapterSha256`, `platform: "linux"`, exact complete `capabilities` list.
- `qualification`: `{ "terminal": <pinned-ref>, "finalBudget": <pinned-ref> }`.
  Both candidate bytes and current complete qualified tool/helper hashes must
  match. Reviewer acceptance is separate from the qualifier and execution authority.

Independent state acceptance:

- `version: 1`, `kind: "shared-execution-state-acceptance"`, `status: "accepted"`.
- `preparation`: the terminal/final-budget pinned pair from successful preparation.
  Its actual private state path/hash/full inode key, canonical inputs, projected
  identity and same namespace runtime must match. Historical reconciliation or
  failed attempts cannot satisfy this maintained schema automatically.

All terminal receipts have `version: 1`, an explicit kind, `error`, artifact file
hashes/full keys and `status: "pending-final-budget-seal"` on provisional success.
Only the matching `shared-execution-final-budget` with `status: "passed"`, actual
terminal hash, terminal-inclusive allocation and reserved final-seal space makes
that terminal authoritative. Any `seal-failed.json`, missing/extra file, hardlink,
changed key/hash, unknown cleanup, elapsed deadline or postcheck failure blocks
acceptance. This avoids circular self-hashing while charging the seal reservation.

## Bounded results for future caller migration

`run_payload` retains raw stdout/stderr and returns their paths, counts and result
metadata. It never returns an output-proportional decoded string. Callers that
explicitly need a version/ID-sized result may use `read_small_text(path, max_bytes)`:
16 KiB default, 64 KiB absolute maximum, private regular file, bounded read,
full-key stability check, strict UTF-8 and rejection on overflow. It is not a
fallback for large logs and does not migrate the old bootstrap prerequisite path.

## Verification status and limits

The generated Python tests prohibit every subprocess entry point before importing
the adapter. They cover pure planning failure, mount/identity/state/alias policy,
private filesystem fixtures, bounded results, producer-clock predicates, positive
PID binding and final seals. They do not certify Linux mounts or package behavior.
The conventional `tests/shared-execution.test.mjs` wrapper runs the generated Python
cases with isolated imports, bytecode writes disabled, a 60-second subprocess
timeout and a 1 MiB spawn buffer limit. It is discoverable by the repository
`.test.mjs` inventory. These are narrow regression checks, not a substitute for repository
checks or a real build. Generated-sentinel qualification has been independently
reviewed for this adapter source, including a read-only closure containing
Node/pnpm tools. That qualifier did not execute Node, pnpm, private-state
preparation or an application build. A receipt is specific to its exact executable
paths, bytes and complete closure; no machine-wide or future acceptance is implied.

Exact warm-runtime state preparation/build under this maintained adapter, standard
repository check/build for its integration, bootstrap caller adoption, historical
native recovery, browser RAM, sustained gameplay and persistence remain separate
uncompleted gates. Bootstrap runtime apply remains fail-closed and runtime planning
is unchanged. No environment-specific specifications, capability acceptances or
private execution receipts are distributed with this source.

No imports reference historical scratch runners, fixed old PIDs/inodes/commits,
local absolute runtime paths, failed locks, exception receipts or timestamp repair.
The historical five-pair sentinel reconciliation and ten-file donor Git timestamp
incident stay retained evidence, not reusable exemptions. Physical sharing claims
must use verified same-inode identities and union allocations, not logical sums.


## Review repair: exact backend binding and terminal health

Backend acceptance now binds the selected Python and bubblewrap executable paths
and the exact complete read-only mount-root inventory to the generated qualifier.
Reviewed application tool roots may be included in the qualifier closure without
executing Node or pnpm. No roots may be added, removed or substituted afterward;
changes require new qualification. This is deliberately stricter than permitting
post-qualification application additions.

Both execution and qualification join the observer and then check final health.
An expected injected qualifier fault cannot hide a later unrelated failure.
The failed payload remains failed/unknown and independent cleanup is still required.

Seals include every directory and allowed symlink identity, not only file bytes.
Only root size/mtime/ctime changes caused by exclusive creation of terminal.json
and final-budget.json are normalized in the earlier artifact map. The final leaf
is exclusively precreated, the full resulting root key is captured, and final
bytes are written through the held descriptor. The full root key, terminal inode
identity, every non-receipt entry and final allocation reservation are checked
afterward and on verification. No nested-directory metadata is normalized.
