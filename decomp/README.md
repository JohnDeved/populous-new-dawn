# Static decompilation workspace

This is part of the full-parity goal, not a separate experiment. It records the original routines used to reconstruct browser behavior. `generated/*.c` is Ghidra pseudocode, **not recovered, compilable Bullfrog source**. Names/types can come from community annotations or inference; generated control flow still needs review against instructions and runtime observations.

## Setup and reproduce

On this project's macOS arm64 development machine, with Python 3, Git and Xcode Command Line Tools:

```sh
python3 scripts/decomp.py setup
python3 scripts/decomp.py init /path/to/d3dpoptb.exe --metadata
python3 scripts/decomp.py export
python3 scripts/decomp.py check /path/to/d3dpoptb.exe
```

Setup downloads SHA256-pinned Ghidra 12.1.3 and Temurin JDK 21, and builds Ghidra's native arm64 decompiler. `--cache /path/to/cache` reuses verified `ghidra.zip` and `jdk.tar.gz`. The repository includes the tool setup and analysis source; downloaded tool distributions, their licenses, external metadata checkout live in ignored `.tools/decomp/`. The Ghidra project lives in ignored `work/decomp/projects/`, because Ghidra rejects hidden directory components in project paths. The runtime does not bundle these tools. On other desktop systems, install the pinned Ghidra version and a compatible JDK and set `GHIDRA_HOME` and `JAVA_HOME`; automatic installation is currently macOS arm64 only.

`init` imports the supplied executable without launching it. It creates a project named `populous`; use `--project-dir` and `--project-name` for a separate analysis. Existing imports are not overwritten. Run only one Ghidra operation against a project at a time. `export --program NAME.exe` must match the case of the imported filename. The default is `d3dpoptb.exe`.

`--metadata` fetches the pinned [pop3-rev](https://github.com/hrttf111/pop3-rev) XML and adds its annotations while retaining original memory and identity properties. **Its reference executable has a different SHA256.** It is a source of hypotheses, not matching official debug symbols. Omit the flag for an independent analysis. No upstream scripts are executed.

Every export hashes the actual loaded bytes of all eleven file-backed PE sections against `sections.tsv`, rather than trusting Ghidra's editable executable-hash property. Python also checks the entire executable before import. Unknown builds fail closed. Ghidra sometimes exits successfully after a Java script failure; the wrapper requires a fresh completion receipt and all requested files before replacing any exports.

To examine another routine:

```sh
python3 scripts/decomp.py export 0048a050 0048b950
# Export to a scratch directory for comparison, without changing tracked evidence:
python3 scripts/decomp.py export 00586074 --output .tools/decomp/comparison
```

To inspect callers or references to a data address, run `ExportCallers.java OUTPUT ADDRESS...` in Ghidra or through `analyzeHeadless -postScript`. It delegates to the same byte-checked exporter.

`exports.json` records the source executable, tool/metadata versions and hashes of the checked-in pseudocode. After a reviewed export update, regenerate its `files` hashes; `check` detects stale records. Analysis options and later type improvements can change pseudocode without changing behavior. The checked-in exports are review evidence, not a claim that every fresh Ghidra analysis produces identical C formatting or inferred types.

## Port index

| Original entries | Browser implementation | Evidence and limit |
| --- | --- | --- |
| `0045f9d0`, `004ee7b0`, `0040cc30` | `scripts/import-original.py`, `app/scene.ts` | Native animation rows/compositing; some reaction layers still approximated |
| `00586074`, `004e6a70` | `scripts/inspect-executable.py`, `app/model.ts` | Integer angle/sine tables and movement; route selection still browser A* |
| `0041af80`, `0041b0c0`, `00403280` | `app/model.ts` | Mana, breeding and upgrades partially ported |
| `00518fb0`, `004a39c0`, `0051e3d0`, `005199f0` | `app/model.ts`, `app/scene.ts` | Group slots, attack states/damage and reactions; full fight scheduling unfinished |
| `004e93f0`, `004e6d00`, `004ebc20` | `app/model.ts` | Ground recoil only; slope/air/collision integration unfinished |
| `0050b740`, `00511f70`, `0050ee00` | `app/model.ts`, `app/scene.ts` | Partial Blast/Lightning/Land Bridge ports |
| `004c1d10`, `004c21e0`, `004bae30`, `004bbf30` | Existing approximate casting in `app/model.ts` | Shot pipeline traced, not yet ported |
| `00409200`, `004092a0` | Existing building HP in `app/model.ts` | Native structural damage traced, not yet ported |
| `0048a050`, `0048b500`, `0048b950` | `scripts/import-sound.py`, `app/audio.ts`, `app/model.ts` | Native PCM/cues and partial event dispatch; adaptive music and complete scheduler pending |
| `0048cc60` | Existing first-mission AI in `app/model.ts` | Script interpreter located; full interpreter not yet ported |

For each subsequent port, preserve the original branch ordering, integer widths/rounding, state transitions and scheduling when established. Record uncertainty rather than silently replacing it with a guessed rule. Add a runnable behavioral check and update the [detailed evidence log](../references/reverse-engineering.md) and [goal checklist](../GOAL.md). Existing browser tests establish internal consistency; they are not yet cross-engine replay evidence.

## Validation of this setup

Tested on macOS arm64: verified cached downloads, clean extraction and native decompiler build; fresh executable analysis and metadata import; 161 successful exports; actual section-byte checks; metadata and caller-export completion receipts; invalid-entry rejection without replacing existing evidence; hash verification and independent upstream math comparison. All eight gameplay regressions and TypeScript checking passed. Decompiler warnings and annotation conflicts remain review inputs, not proof of recovered source correctness. This tooling change does not change playable behavior.

## Native CPU comparison

The native math check emulates the supplied executable's `004e6ac0` movement
routine, the tile flag-writing prefix of `0044df40`, and `0044e940` height sampling
with Unicorn, then compares their outputs with the browser implementation. This
runs isolated x86 instructions and data tables; it does not start Windows or
emulate system calls. Inputs cover all quadrants, signed overflow, negative/odd
lengths, zero movement, and deterministic random cases. The executable hash is
verified before mapping its PE sections.

```sh
python3 -m venv .tools/decomp/oracle
.tools/decomp/oracle/bin/python -m pip install -r decomp/requirements.txt
.tools/decomp/oracle/bin/python scripts/check-native-math.py /path/to/d3dpoptb.exe
```

The current check compares 508 movement cases and 680 terrain cases, including
wrapped cell boundaries, signed extremes, and rounded-mean ties. It proves equality
for those isolated inputs, not original scheduling, the whole shot processor,
terrain update processing beyond the diagonal flag, or all game physics. No original executable bytes are stored in its source or output.
