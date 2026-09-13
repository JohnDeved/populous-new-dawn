# Native research and reuse

Before detailed native work, the parent verifies the proposed live entry path and
prerequisites: object class plus model, mission availability, acquisition/unlock path,
and existing implementation. Research a missing prerequisite deliberately; do not
assume a model number alone identifies a playable person.

Search `decomp/research/`, the subsystem's mapped evidence, `decomp/exports.json`, and
existing probes first. Reuse valid findings; ask a specialist only the unresolved
question and identify the decision it will change. An audit may remain read-only.

For new research, add one task-specific ignored directory to the contract's allowed
paths and generate the native packet with `--research-output
work/orchestration/<task>/native` (on the same command line). The native specialist
may write only there. The parent grants exclusive use of the existing Ghidra project
before an export; other source work may continue. The write-enabled role is not an
OS-level directory sandbox; packet ownership and review still apply.

Reuse existing `.c` exports where sufficient. For missing routines, use
`python3 scripts/decomp.py export <addresses> --output <assigned-directory>`.
Preserve executable SHA256, tool version, command, and wrapper completion evidence.
Inspect probe side effects before running; reuse native_cpu and existing harnesses.
Record supplied and intercepted consumers explicitly. Scratch export/probe creation
for assigned research is authorized; parity/fixture recording and bulk replacement
remain separate actions.

Finish with `findings.md`: question and prior knowledge; exact routine/export paths;
new observation versus inference; probe command/result; intercepted leaves; open
boundaries; live prerequisite status; next implementation step; proposed durable paths.
Link to existing evidence instead of copying it. Save useful negative findings too.

Before closing or deferring research, the parent reviews these artifacts and commits
the useful parts: exports in `decomp/generated/` with hashes in `decomp/exports.json`,
a reusable probe under `scripts/` when warranted, and a concise topic note under
`decomp/research/`. Link the note from the relevant `engineering/project-map.json`
evidence list and `decomp/README.md`. This integration is part of native research,
not a separate gameplay completion or parity claim. Report uncertainties honestly;
never upgrade an intercepted probe into proof of the complete original game path.

On the next related task, cite that note and investigate only remaining gaps. The
parent can perform this entire flow directly when delegation adds no value.
