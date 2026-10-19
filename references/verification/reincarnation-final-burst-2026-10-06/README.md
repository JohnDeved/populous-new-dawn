# Reincarnation final burst: static evidence packet

Inspected main: `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`, clean before
research. The isolated research branch contains no application change. Read the
[finding and bounded next proof](../../../decomp/research/reincarnation-final-burst.md).

`native-static.txt` contains the exact relevant instruction bytes and Capstone
disassembly from the canonical EXE, with end-exclusive range hashes.
`manifest.json` records tool versions, executable/range/artifact hashes and the
inspected live/probe/export source hashes. The existing indexed exports retain
their own Ghidra provenance in `decomp/exports.json`; no new Ghidra export ran.

Reproduce with the already provisioned Capstone Python environment:

```sh
python extract-static.py /path/to/d3dpoptb.exe
```

Run from any working directory; output stays beside the extractor. The script
reads original PE sections directly and disassembles only three bounded code
ranges. It does not import the native CPU harness, instantiate Unicorn, launch
the original game, call application code, or run npm/browser checks. Its output
is static evidence, not a successful native composition run.

Executed command, source-only phase (2026-10-06 UTC):

```sh
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python references/verification/reincarnation-final-burst-2026-10-06/extract-static.py /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe
```

Result: exit0, `PASS: static-only identity/decode, 3 ranges, 21 source fingerprints`.
`git diff --check` and JSON/local-link structural checks are required before the
research handoff; their result is recorded in `structural-check.txt`.

No aggregate/build, native execution, browser, performance, gameplay or parity
gate was run for this documentation-only assessment. No execution resources
were acquired. The packet adds a supported remaining gap and a proof plan;
it neither weakens accepted PR203/212 evidence nor certifies current-main play.
