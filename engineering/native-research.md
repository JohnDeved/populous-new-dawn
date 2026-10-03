# Native research and reuse

Before detailed native work, the parent verifies the proposed live entry path and
prerequisites: object class plus model, mission availability, acquisition/unlock path,
and existing implementation. Research a missing prerequisite deliberately; do not
assume a model number alone identifies a playable person.

## Current cloud setup example (verified 2026-10-03)

On the current shared Linux executor, use the existing environment rather than
re-downloading tools or treating an unset variable as a missing game:

```sh
source /workspace/shared/populous-prerequisites/env.sh
python -c 'import unicorn; print(unicorn.__version__)'
sha256sum "$POPULOUS_EXE"
"$JAVA_HOME/bin/java" -version
```

This example resolves the game to
`/workspace/shared/populous-prerequisites/game/d3dpoptb.exe`, Python to that root's
`venv/bin/python`, Ghidra 12.1.3, Temurin JDK 21.0.12.1, and Unicorn 2.1.4. Verify
these paths/versions in the actual executor; they are not portable installation
requirements. `decomp/tools.json` pins original EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The archive at `/workspace/shared/populous-prerequisites/PopulousTB-Setup.zip` has
SHA-256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.

Retain platform/tool download provenance. `decomp/tools.json`'s bootstrap JDK entry
is macOS-specific; on Linux supply the verified `GHIDRA_HOME` and `JAVA_HOME` rather
than claiming that archive is portable. Confirm required adjacent data and actual
probe imports. Ghidra exports must record tool version, executable hash, command,
project/input identity, and completion evidence. Serialize access to each project.

## Resolve supplied inputs before declaring a blocker

Missing from the checkout or an unset `POPULOUS_EXE` means **unconfigured or not
extracted**, not unavailable. The parent owns recovery from supplied readable inputs;
do not defer gameplay or ask for another copy before checking the archive.

Earlier checkout input locations (retained for recovery/provenance; verify existence
before using them, and prefer the current executor handoff):

- Archive: `work/orchestration/ceo-release/inputs/PopulousTB-Setup.zip`.
  SHA256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
- Recovered game root: `work/orchestration/ceo-release/mission2/` (contains the
  verified `d3dpoptb.exe`, Mission 1/2 scripts, Mission 2 level/header, constants,
  and `language/lang00.dat`; it is not a complete extraction).
- Extractor Python: `work/orchestration/ceo-release/venv/bin/python` with the
  pinned `decomp/extraction-requirements.txt` archive dependency.
- Native Python: `.tools/decomp/oracle/bin/python`. Verify required imports for
  the actual probe; archive extraction and native emulation are separate runtimes.

Check the required files in that game root first. Recover missing exact members with
the existing `scripts/extract-reference.py`, preserving their relative paths beside
the executable. For example, from the repository root:

```sh
work/orchestration/ceo-release/venv/bin/python scripts/extract-reference.py \
  work/orchestration/ceo-release/inputs/PopulousTB-Setup.zip \
  work/orchestration/ceo-release/mission2 'language/lang00.dat'
export POPULOUS_EXE="$PWD/work/orchestration/ceo-release/mission2/d3dpoptb.exe"
```

Inspect archive member names when the exact path is unknown; use the actual mission
header to choose its script. Verify the executable against `decomp/tools.json` and
retain input hashes and extraction results in the existing task handoff. Do not run
the installer, overwrite different existing files, or invoke broad tracked-output
importers merely to recover an input. Scoped input extraction is authorized research,
not fixture/parity recording or permission to regenerate tracked assets.

For a complete base-game root, select the installer's base component explicitly;
the expansion contains different files with some of the same destinations:

```sh
work/orchestration/ceo-release/venv/bin/python scripts/extract-reference.py \
  --component Component0 work/orchestration/ceo-release/inputs/PopulousTB-Setup.zip \
  work/orchestration/ceo-release/native-run '*'
```

Before dispatch, put the resolved executable/game root, Python, required adjacent
files and any remaining recovery in the existing packet's `research.assumptions`
or compact assignment. A specialist lacking write ownership reports the exact
recovery command to the parent; it does not label readable archived data unavailable.
After recovery, run the actual affected reader/probe. Extraction alone does not
establish live integration: verify that separately through the gameplay consumer.

Only report an external input blocker with the attempted path/command and observed
failure: unreadable archive, absent member after inventory, or hash mismatch. Missing
decoder/importer support, an unbound native behavior, and unfinished live integration
are engineering work with a named owner and next check, not unavailable assets.
Use a newer verified handoff if these local paths change; never bypass denied access.

## Research and durable handoff

Search `decomp/research/`, the subsystem's mapped evidence, `decomp/exports.json`, and
existing probes first. Reuse valid findings; ask a specialist only the unresolved
question and identify the decision it will change. An audit may remain read-only.

For new research, assign one task-specific ignored directory such as
`work/orchestration/<task>/native` in the compact brief. If using a contract/role
packet, include that directory in allowed paths and pass `--research-output` on
the packet command. The native specialist may write only in its assigned directory. The parent grants exclusive use of the existing Ghidra project
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
