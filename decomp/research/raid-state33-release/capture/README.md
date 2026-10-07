# Passive Mission2 capture preflight

This implements the accepted source-only proposal at34df9e9e. Independent plan
review: `raid-state33-release-plan-review-20261007/review.md`, SHA256
`df49ade3892cce56f4241df394108c12af0a1ab5d8d11f1f00f3dd996f2deb99`.
The proposal's "no skipped assertions" means none are removed or weakened:
all preceding assertions run unchanged, and assertions after capture are **not-run**.
A capture-complete result is not a maintained-test pass.

`prepare.py` reads and hashes the unchanged maintained Mission2 test, selects its
first case unchanged, and only replaces test registration, relative imports, and
the tick alias. It writes the small generated source to
`work/orchestration/state33-release-capture-source/`.
`source-preflight.mjs` strips TypeScript as text, follows imports without importing
any app, and hashes the exact closure, observer/supervisor, source case and tools.
No package, network, game function, simulation or native code runs in either step.

`observer.mjs` delegates each normal1/12 tick once, requires turn==tickCalls,
then at3227 checks all retained raw-line4446 facts exactly. The previous observer's
multi-case world ordinal3 is explicitly omitted because this is a one-case capture.
A mismatch fails without seeking another state. It writes one V8 serialization
preserving undefined/missing properties, typed arrays, Maps and shared identity,
plus a readable provenance/known-field report. It does not encode native bytes,
fill missing values, derive building poses or call game queries during observation.
The read-only snapshot includes all registry records/heads so cell chains and
optional vehicle/work referents can be bound without a second capture; only units10/11
and buildings1022/their occupied cells are retained as complete game records.
Motion-route/pathfinding stores are retained for the actual future order adapter.
Animation-world hardcoded supplies (e.g. sessionSubstate:null) remain source inputs,
not values silently inserted into the raw capture.

`guardian.py` verifies clean committed HEAD, exact runtime app/test identity,
all227 closure/preflight hashes, exact tool files, a fresh output directory and
one available CPU explicitly supplied by the parent. Its default/read-only mode
is `--source-preflight`. It launches nothing unless called with the separate
`--launch-passive-capture` mode after review and a specific resource grant.

The child uses Node24's permissions with read access only to this worktree and
write access only to the new output directory; child processes, workers and addons
are not allowed. Static closure external modules are limited to assert/crypto/fs/path/v8;
no package or network code is imported. No original executable is read or executed.
One owned process group inherits exactly the granted CPU. RSS of the Node group
plus Python supervisor and total output size are sampled every50ms; breach fails
and terminates the group. A768MiB V8 heap limit and8MiB per-file RLIMIT_FSIZE backstop
the1GiB aggregate RSS/8MiB output caps. Snapshot itself is capped at7MiB before any
write, reserving report/receipt space. The supervisor enforces TERM120s/KILL10s,
retains PID/group/start-tick identity, exact command, peak sampled RSS, raw stdout/
stderr, file hashes and final empty-group cleanup. Any cap breach is failure;
this is sampled enforcement, not a claim of an instantaneous kernel aggregate cap.

Source preparation (already run, no simulation):

```
python3 decomp/research/raid-state33-release/capture/prepare.py
node --check decomp/research/raid-state33-release/capture/observer.mjs
node --check work/orchestration/state33-release-capture-source/scenario.mjs
node decomp/research/raid-state33-release/capture/source-preflight.mjs
```

The reviewed source HEAD and granted single CPU are explicit later arguments:

```
<NATIVE_PYTHON> -I decomp/research/raid-state33-release/capture/guardian.py \
  --source-preflight <MANIFEST_SHA256> <REVIEWED_SOURCE_HEAD> <GRANTED_CPU>
```

A launch uses the same frozen arguments with `--launch-passive-capture` only after
independent acceptance and the parent's resource grant. It writes exclusively to
`work/orchestration/state33-release-capture-20261007-01/` and refuses reuse.
The native/port pair remains separately unimplemented, unreviewed and ungranted.
