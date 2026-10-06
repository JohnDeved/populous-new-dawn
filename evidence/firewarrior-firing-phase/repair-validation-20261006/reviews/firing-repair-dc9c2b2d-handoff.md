# Firewarrior firing repair checkpoint

Clean implementation freeze: dc9c2b2df91066f210fd013df1dd9f49ebd8c0f8.
Base application: b0208188b8de345a6ad5e86cb7c49769624dda86.
No runtime/native/browser/full/package run has been made at this checkpoint.
Sole node_modules stays in the proof worktree; no dependency operation occurred.
All Git commits remain local/unpushed and not reset-durable.

## Source/evidence sequence

- 4a5e19b2: byte-identical transfer of all61 c8732a30 proof files and pinned policy.
- cccd81f1: failure-first actual-private-body and firing-key regressions; owned comparator.
- 542853b0: read-only full existing-asset preservation/original-data verifier.
- 83e29171: ranged phase and bounded importer source repair.
- dc9c2b2d: importer-produced artwork and exact candidate source pin.

Original whole-record comparison remains failed with394 field/visit differences.
The policy was independently frozen before runtime repair. Running compare-owned.py
on those exact original records exited1 with238 owned differences; first is
person-entry-walk-frame3/object56 versus48 at visit0. No original record or expected
fixture was rewritten. Retained baseline projection is committed as compressed
JSON, with the policy and native/port SHA256s.

## Completed source/Python work

Input SHA256s agree with b020's provenance for VSTART, VFRA, VELE, HSPR and PAL.
No original machine code was executed. Commands were run in this worktree:

1. python3 decomp/research/firewarrior-firing-phase/compare-owned.py
   evidence/firewarrior-firing-phase/native-comparison-20261006/native.json.gz
   evidence/firewarrior-firing-phase/native-comparison-20261006/port.json.gz
   Exit1: expected failure-first result,238 differences.
2. PYTHONDONTWRITEBYTECODE=1 python3 scripts/check-firewarrior-firing-artwork.py
   /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game
   Before runtime/importer edits at cccd81f1 source: exit1, expected missing25-frame
   append assertion. Raw stderr retained under artwork-before.stderr.txt.
3. source ../prerequisites/env.sh; timeout30s taskset -c4 python
   scripts/import-original.py "$POPULOUS_GAME" --units-only
   Exit0 on83e29171 source. Exactly25frames/80pieces appended. Only owned units JSON,
   atlas PNG and provenance mutated. Atlas2048x8256.
4. PYTHONDONTWRITEBYTECODE=1 timeout30s taskset -c4 python
   scripts/check-firewarrior-firing-artwork.py "$POPULOUS_GAME"
   Exit0. Every5091 old frame and4042 old piece retained, all old full cells and all
   old nonzero bytes retained, exact original25 VFRA/layer records and80 piece pixels
   verified, only prior source22 shared, all unrelated metadata unchanged.
5. Same bounded importer command repeated: exit0,0 newframes/0 newpieces.
   sha256sum --check of all3 generated files passes before/after identity.
6. Read-only AST parsing of all firing Python files/importer/verifier and in-memory
   policy mutation checks pass. Every owned active field and bit must fail on change;
   allowed diagnostics/terminal fields remain excluded; terminal completion guard fails.
   These synthetic comparator checks are not actual native/port results.

Raw logs are in work/orchestration/firewarrior-firing-fix-20261006/.
Native original EXE and baseline fixtures are untouched. The candidate manifest
pins the four changed application/artwork files. Port.mjs changes only its exact
caller SHA. Probe.py itself, its original full comparison, guards and16 fixtures
are unchanged. New compare-owned.py emits a separate projection result.

## Required before acceptance

Fresh source/probe review is in progress. Node regression execution, TypeScript
format/lint/standard, standard check/build, native replay, and actual Mission10
candidate acquisition/firing/pixels remain not-run and require coordinated lanes.
The baseline browser scenario and source preflight still explicitly assert the old
48/14 runtime. Candidate browser preparation must use the same accepted ordinary
route with explicit56/13 assertions and reviewed exact candidate source guards;
do not run the unchanged baseline checker and relabel a failure as success.

No facing, global clock/FPS, unrelated animation fallback, source720/728, native
raster/blending, original OS timing or full-command equivalence claims are made.
