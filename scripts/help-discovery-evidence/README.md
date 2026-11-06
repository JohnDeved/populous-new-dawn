# Help discovery: hosted scope observation

This is a metadata prerequisite for inactive Help PR #943, not a test runner.
Neither the workflow nor the observer can import discovery code or launch a
discovery test. A successful observation still reports `tests: not-run` and
`memoryQualification: unqualified`.

The local executor lacks controlling memory telemetry. A GitHub-hosted VM is a
separate supported executor, but its runner label, environment strings, matching
namespace IDs and root-looking cgroup mount are not enough to prove complete
scope. This stage preserves raw observations and actual run/job provenance for
independent review. It never modifies a mount, cgroup, permission or namespace.
No known denial is bypassed; failed reads are retained and not retried.

## Source and activation

- Infrastructure belongs in a separate same-repository Draft PR. Do not edit
  #943's app/assets or #885's shared workflow. Do not mark #943 Ready or merge it.
- The one-shot label is `h943-env:<exact infrastructure head SHA>` (49 characters).
  It must be applied by authenticated repository owner ID 24187269, after source
  review and the parent has admitted the shared lane. Never use a workflow token
  to synthesize the label event. Only `pull_request: labeled` can start the job.
- Parent admission must check current main, both Draft heads, exact infrastructure
  proposed merge, complete five active-run lists and prior matching runs. New Draft
  publication starts the existing Cloudflare build/follow-ons; wait for them and
  coordinate #885/#944 before applying the label. Do not replay an uncertain send.
- The workflow itself rejects a later run attempt, another matching run on the same
  infrastructure head, incomplete run lists, any other active run, source movement,
  a fork, a container/service job, or a different actor. Concurrency does not replace
  the repository-wide lane. A changed source needs fresh review, not an automatic retry.
- Any earlier workflow run on the same infrastructure head consumes that head,
  including an unrelated-label event whose job was skipped. Avoid all other label
  events before the metadata label. A later attempt needs a deliberately reviewed
  source correction, not a label replay or weaker ledger filter. A new head alone
  does not remedy denied access or missing resource qualification.
- The event's infrastructure head/base/merge and the fixed Help target are separate
  identities. The target remains a1f506f8, tree 8c76717f, actual parent 8c0955c6.
  The API-reported Help base SHA is validated and retained separately; it may lag
  live main without changing that immutable target. Its base ref must still be
  main in this repository. Infrastructure event/API/main/merge-parent equality
  remains strict and does not use the reported Help base as authority. The
  259-file manifest is an identity record only; none of those source files are
  downloaded or imported here. It includes tracked original JSON, but requires no
  additional original-game binary/image or held input.

## Bounded work

There is no checkout, Git pack, package install, browser, native executable, project
build, Node setup or target-source copy. The trusted inline bootstrap reads only
four fixed infrastructure text files with gh at the exact workflow merge. Three
helper identities are pinned in the reviewed workflow; the workflow file's identity
is retained for comparison to the reviewed event source. Each gh transport is
file limited to 128 KiB and each decoded source to 64 KiB. Four files therefore require at
most 512 KiB stdout transport, 512 KiB stderr and 256 KiB decoded storage, plus bounded metadata. These are written-file caps, not an exact network-byte measurement. Bootstrap requires 128 MiB reserve
plus 2 MiB allocation and 128 free inodes before materialization.

Each acquisition has a 12-second GNU timeout with 2-second kill grace, a 15-second
outer wait, inherited 8/10-second CPU limits and 128 KiB file-size limits. No failed
read is retried. A partial failure retains `bootstrap.json`. Token-bearing gh
configuration is never copied; the private empty config is removed only if empty.

The fixed public-API collector makes 13 read-only requests, each capped by a 12-second
timeout plus2-second grace, under a 165-second outer envelope. Static jq projections
retain only source/run/job identities. Lists exceeding 100 rows or inconsistent
counts fail closed. A 1 MiB shell file-size bound also applies. Collector admission reserves 32 MiB of outputs plus 128 MiB of free space and 128 inodes before its writes. These trusted gh
reads are not a general command/process containment facility.

The observer has a 10-second timeout plus2-second grace. It reads fixed bounded
kernel metadata and walks only the observed own service-to-root cgroup ancestors,
up to 16 components. It records controls, directory identities, namespace links and
mapping stability. It does not read process environments, credentials or unrelated
process data. Missing/truncated/ambiguous/changed/denied observations remain explicit.
The initial expected service/systemd layout is deliberately narrow and unverified;
another layout yields a blocked receipt while retaining raw evidence for review.

Receipts and projected public metadata are capped and uploaded for 7 days. Total
job timeout is 7 minutes, including a 2-minute artifact step. Artifact limits and
timeouts are safety bounds, not expected duration or a promise of completion.
Official GitHub runner provenance and the actual run/job logs must be reviewed
alongside these observations. An exit0 means metadata was observed, not that an
effective cap or free-memory budget has been qualified.

## Checks and remaining gates

`tests/help-discovery-hosted-observer.test.mjs` invokes 29 supplied Python controls
only. They use hand-built API records, fake host results and temporary small files;
they never read host /proc or call gh. The controls cover identity, replay, all-five
run guards, namespace mapping, read caps, symlinks and terminal failure/drift receipts.
Their source alone is not a test pass. Execute only after separate bounded admission.

These new paths are not added to existing source/generated ownership maps. Review
all resulting unknown planner paths explicitly rather than treating them as an empty
check set. On a genuine source checkout, run the normal planner from its actual base,
inspect its output, and retain repository-check/production-build requirements. Add
the one complete portable test file, Python/shell syntax checks and changed-file lint
where applicable. Standard/full CI remains separate from this metadata route.

After the hosted observation, review actual VM/run provenance and complete cgroup
layout before implementing a memory provider. A later test job must measure its
own fresh scope and headroom; these numbers cannot admit another job. Preserve the
1.5 GiB effective reserve, 45-second two-file deadline, 20/25-second per-process CPU
limits and 512 MiB old-space setting, which is not a hard RSS or aggregate-memory cap.
All 20 discovery tests and the other four remaining Help files are still unrun.
