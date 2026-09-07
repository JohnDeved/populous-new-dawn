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
| `0044d7f0`, `004f0f90`, `0044db60`, `0044b100` | `app/tooltips.ts`, `app/scene.ts` | Forced object tooltip names and lifetime CPU-compared; first-mission cell adapter is approximate; hover and modes 3–10 unported |
| `0044a2f0`, `004a24c0`, `004a1f50`, `00415f70`, `00516a00` | `scripts/import-messages.py`, `app/scene.ts`, `app/globals.css` | Color operands, indexed conversion, opaque rectangle vertices and native border artwork recovered; font/layout/projection and other blend states unported |
| `0048eae0`, `00430bd0`, `00430e40`, `00430fe0` | `app/messages.ts`, `app/model.ts`, `scripts/import-messages.py` | Type-3 allocation/removal and discovery/settlement/vault tutorial branches CPU-compared; full notification UI/scheduler pending |
| `0040c670`, `0040cc60` | `scripts/import-original.py`, `app/morph.ts`, `app/scene.ts` | Bank redirect and integer door coordinates CPU-compared; full morph scheduling unfinished |
| `0045f9d0`, `004ee7b0`, `0040cc30` | `scripts/import-original.py`, `app/scene.ts` | Native animation rows/compositing; some reaction layers still approximated |
| `00586074`, `004e6a70` | `scripts/inspect-executable.py`, `app/model.ts` | Integer angle/sine tables and movement; route selection still browser A* |
| `0041af80`, `0041b0c0`, `00403280` | `app/model.ts` | Mana, breeding and upgrades partially ported |
| `00518fb0`, `004a39c0`, `0051e3d0`, `005199f0` | `app/model.ts`, `app/scene.ts` | Group slots, attack states/damage and reactions; full fight scheduling unfinished |
| `004e93f0`, `004e6d00`, `004ebc20` | `app/model.ts` | Ground recoil only; slope/air/collision integration unfinished |
| `0050b740`, `00511f70`, `0050ee00` | `app/model.ts`, `app/scene.ts` | Partial Blast/Lightning/Land Bridge ports |
| `004c1d10`, `004c21e0`, `004bae30`, `004bbf30` | Existing approximate casting in `app/model.ts` | Shot pipeline traced, not yet ported |
| `00409200`, `004092a0` | Existing building HP in `app/model.ts` | Native structural damage traced, not yet ported |
| `0048a050`, `0048b500`, `0048b950` | `scripts/import-sound.py`, `app/audio.ts`, `app/model.ts` | Native PCM/cues and partial event dispatch; adaptive music and complete scheduler pending |
| `0048c6b0`, `0048c980`, `0048f130`, `0048f230`, `0048ef00`, `0048ed90` | `app/popscript.ts` | Control flow, arithmetic, attribute widths and EVERY masks compared against native x86 |
| `0048cc60`, `0048f350` | `app/model.ts`, `scripts/import-script.py` | First-mission initialization applied; full game-command host remains open |
| `0043c7a0`, `004fb270`, `004fbf40` | `app/vault.ts`, `app/model.ts` | Post-approach vault tasks and type-4 work CPU-compared; navigation and full object scheduling unfinished |
| `00485b00`, `004fb270`, `004facf0`, `004c2cd0`, `004c2aa0` | `app/worship.ts`, `app/model.ts` | Integer worship/refill and delayed spell gifts CPU-compared; eligibility, phase and reward visuals incomplete |
| `00492790`, `00492860`, `00491c30`, `004f2900`, `004c2b40`, `004c14c0` | `app/model.ts`, `scripts/check-native-campaign.py` | Cast/stock/head queries and allocation counters CPU-compared; unsupported AI stock still explicit |

For each subsequent port, preserve the original branch ordering, integer widths/rounding, state transitions and scheduling when established. Record uncertainty rather than silently replacing it with a guessed rule. Add a runnable behavioral check and update the [detailed evidence log](../references/reverse-engineering.md) and [goal checklist](../GOAL.md). Existing browser tests establish internal consistency; they are not yet cross-engine replay evidence.

## Forced tooltip comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-tooltips.py /path/to/d3dpoptb.exe
```

The executable's adjacent `data/pal0-c.dat` is also required. The check executes
1,900 native name cases, 144 forced selections and 384 lifetime updates. CRT text
formatting is intercepted; native string selection, cell traversal and signed
counters execute. The browser receives selected objects directly in that oracle:
its first-mission cell adapter is covered separately by the engine regression
and `qa/flyby-check.mjs`, not proven equivalent to the native occupancy table.

An additional 256 indexed color conversions and 256 opaque window quad emissions
run the original color and rectangle routines. Only final polygon submission and
border drawing are intercepted. This verifies RGB order and rectangle expansion;
it does not prove CSS font metrics, nine-patch rasterization, inherited blend
state or native camera projection. `scripts/import-messages.py` checks the actual
background/text instruction operands and imports the eight border sprites.

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


## Campaign interpreter comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-script.py /path/to/d3dpoptb.exe /path/to/levels/cpscr010.dat
```

The oracle checks both executable and script hashes, maps the original interpreter,
and compares command order, external-read order, 64 variables, 48 byte attributes,
and the final instruction position. It covers 1,152 mission-script cases and 84
arithmetic/control-flow cases. Game commands are intercepted; external reads are
provided by the test host. This proves control-flow agreement for these inputs,
not the behavior of those game commands, recurring AI scheduling, or campaign parity.


The script oracle additionally runs 416 actual `DO GET_HEIGHT_AT_POS` commands
through native dispatch (`0048cc60` → `00492920`), with no interception of the
terrain query. It checks all 256 imported markers, odd coordinate bits and signed
height limits. Another 42 cases execute the original terrain-rule bytecode with
real native queries; only the final `004f2160` removal request is intercepted.
The browser comparison checks marker variables and head removal on the same turns.
The original header hash is verified before these comparisons.

## Campaign counter comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-campaign.py /path/to/d3dpoptb.exe
```

Runs 1,280 spell-cast/stock queries and 1,024 head queries through the actual
original interpreter and command handlers, without intercepting game commands.
World-memory fixtures cover four cast-counter tribes, byte values, literal and
variable tribe arguments, aliased inputs/destinations, spell internal constants,
wrapped head coordinates and traversal past a non-head object. Another 220 calls
execute the original spell initializer with no shaman, no mana debit, no UI
notification and no opponent observers; its original allocation counter is
compared directly. These checks do not prove the full initializer, stock awards,
worship scheduling, the AI scheduler or unimplemented commands.


## Worship and reward comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-worship.py /path/to/d3dpoptb.exe
```

Compares 4,344 native worship turns (including decay, refill, growth and signed
remaining counts) and 1,660 native automatic spell-reward turns (82-turn delivery,
four-shot cap and independent upper-nibble gift counter). Only the final deletion
leaf is intercepted. Worship uses actual native command eligibility; reward
fixtures skip visual initialization and Windows UI callbacks. These checks do not
prove browser eligibility, object scheduling, vault tasks, competitive ownership,
floating reward visuals or pickup behavior. Fifteen gameplay regressions cover
integration, including rewards surviving head removal and worship at full stock.


## Vault task comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-vault.py /path/to/d3dpoptb.exe
```

Runs 640 native post-approach task transitions and 320 type-4 work/force/reset
cases. Task movement, animation, facing and sound leaves are intercepted; trigger
fixtures omit decorative/UI effects and final deletion. Real task branches,
timers, force-bit lookup and trigger work execute. The rendered stone pyramid is
verified separately against the editor's named geometry. Task model IDs address
native bank 2 (see below). Approach routing, occupancy, cleanup and full scheduler
behavior remain open.


## Object bank and morph comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-models.py /path/to/d3dpoptb.exe
```

Compares all 256 bank-selector byte inputs and 7,595 native coordinate cases
against the actual importer and `app/morph.ts`. Only the selector's resource-load
leaf is intercepted; morph arithmetic executes without interception. Includes
both imported vault morphs at all frames, signed extremes and random inputs.
The original loader redirects bank 0 to 2. This does not verify the full native
object/morph scheduler, initial idle animation, routing or hut variant RNG.

To reproduce selected extraction without launching the installer:

```sh
.tools/decomp/oracle/bin/python -m pip install -r decomp/extraction-requirements.txt
.tools/decomp/oracle/bin/python scripts/extract-reference.py /path/to/PopulousTB-Setup.zip /path/to/game 'objects/*0-2.*'
python3 scripts/import-original.py /path/to/game
```

The importer also needs the previously extracted palette, atlas and animation
files listed in `public/original/provenance.json`. The extractor accepts a raw
Inno executable too; patterns are relative to its application directory. It
verifies payload checksums, rejects escaping paths and differing existing files,
and prints source SHA256 hashes. The optional extractor is separate from the
stdlib importer and native comparison dependencies.


## Campaign message comparison

```sh
.tools/decomp/oracle/bin/python scripts/extract-reference.py /path/to/PopulousTB-Setup.zip /path/to/game 'language/lang00.dat'
python3 scripts/import-messages.py /path/to/game
.tools/decomp/oracle/bin/python scripts/check-native-messages.py /path/to/d3dpoptb.exe /path/to/cpscr010.dat
```

The importer also uses the palette and HFX bank already listed in native asset
provenance. The check runs 160 original type-3 allocations, 320 original discovery
script cases and one removal. Only sound playback is intercepted. It compares
slot contents, serial wrap, text IDs, shared RNG and script variables. It does
not establish the rest of the original notification types, screen animation,
popup interaction or full campaign scheduling. The executable and mission script
are both hash-checked.


The campaign oracle also executes 40 native building-list rebuilds and 3,200
`PARTIAL_BUILDING_COUNT` query sequences through the actual interpreter. The
fixture disables mana processing, not the counter rebuild. All 256 imported
marker commands and 16 explicit hit/adjacent fixtures execute `TRIGGER_THING`
through real dispatch and cell lookup. No leaf is intercepted in these checks.
Browser progress/completion and active-object translation still approximate
native building states and rebuild scheduling.

The message oracle additionally compares 384 native settlement/vault tutorial
cases with supplied building counters. The worship oracle now checks 4,824 work
turns (480 with explicit force signals) and the unchanged 1,660 reward turns.
Force evaluation follows work sampling and is cleared by reset, rather than
cleared unconditionally each turn. See the detailed evidence log for fixture
scope, opcode names and unported phases.


## Opening flyby

`app/flyby.ts` reconstructs the event queue, script value encoding, position/angle/
zoom motion, presentation-frame scheduling and interruption from `00448ec0`–
`0044a1e0` and `00490590`–`00490ab0`. Mission-one words 936–1079 now execute
alongside the previously bound notification branches. Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-flyby.py /path/to/d3dpoptb.exe
node qa/flyby-check.mjs
```

The CPU comparison fixes x87 precision at 53 bits (`0x027f`); startup/device-mode
precision is not established. It compares 1,000 profile calculations, 6,270 zoom
frames, 1,600 queue insertions and 4,077 complete opening frames, including native
VM decoding and interruption. UI/input/audio/debug leaves are intercepted;
keyframe handlers, arithmetic, event ordering and timeline control execute.
Interest-point tracking, native tooltips, early near-target input release,
projection and frame throttling remain incomplete. See the evidence log.


## Camera and sprite projection

```sh
.tools/decomp/oracle/bin/python scripts/extract-reference.py /path/to/PopulousTB-Setup.zip /path/to/game 'data/vconfig0.*'
python3 scripts/import-camera.py /path/to/game
.tools/decomp/oracle/bin/python scripts/check-native-projection.py /path/to/game/d3dpoptb.exe
node qa/projection-check.mjs
node qa/native-visuals.mjs
```

The importer requires the verified executable beside `data/`. The CPU check
verifies both its identity and the original 50-record camera table. It compares
camera resolution/zoom selection, all 2,048 yaw headings at three pitches,
integer projection with both clip modes, real model point transforms, both mesh
bound algorithms, sprite size/offset scaling and 18,432 sprite directions.
The x87 control word is explicitly 0x027f; native startup precision is not proven.
The ground renderer now uses these camera/model transforms, mesh bounds and
screen-pixel sprite dimensions through `app/render-view.ts`. The WebGL2 check
compares 24,576 projected points and 26,838 original model vertices; 29 actual
triangle picks cover headings and periodic terrain copies. Resolution-specific
mesh-bound overrides also have 114 native CPU comparisons. Overview, original
terrain mesh generation, lighting, water and depth-sort buckets remain unfinished.
See the detailed evidence log for intercepted leaves and remaining integration.


## Computer spell setup and mission-one shutoff

```sh
.tools/decomp/oracle/bin/python scripts/check-native-computer.py /path/to/game/d3dpoptb.exe
node qa/native-visuals.mjs
```

The original `levels/cpscr010.dat` must be beside the executable's directory
structure. Its hash and the executable identity are checked. The oracle runs
256 complete native command calls for `STATE_SPELL_DEFENCE`, `SET_SPELL_ENTRY`
and `SET_DEFENCE_RADIUS`, then 192 original first-mission spell-limit blocks,
without intercepting command handlers or leaves. The loaded Blast-cost cell is
supplied by the fixture from the already-imported balance constants.

`00492c30`, `004902e0` and `0048cc60` are bound in `app/model.ts`. Eight spell
entries are confirmed by consumer loops in `004d11b0` and `004d1450`. The original
bytecode disables both initial Blast entries after the count exceeds one, on its
`EVERY 1` phase. The browser caster now honors those entries, with an integrated
simulation and Chrome check. These checks do not port the consumers' mana and
target eligibility, spell-defense positioning, general AI states or scheduling.
Additional exported consumers remain raw, unreviewed where no port is recorded.

## AI queue/training and follower comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-training.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-followers.py /path/to/d3dpoptb.exe
```

`app/computer.ts` reconstructs `004623e0`, the task branch of `004615f0`,
`004e6640` allocation and `004c8490` training control with selection-lock leaves.
The 3,548 native comparisons preserve dispatcher, allocation and controller
execution; person selection, occupancy mutation and person commands are
controlled leaves. Browser training integration awaits those native consumers.
The follower check runs 2,016 real rebuild/query comparisons and 4,608 original
mission attack-commitment branches, now bound to browser follower counts.
See the [reviewed evidence and remaining limits](../references/reverse-engineering.md#ai-task-scheduling-training-controller-and-follower-counts).

## Native follower selection

```sh
.tools/decomp/oracle/bin/python scripts/check-native-selection.py /path/to/d3dpoptb.exe
```

`app/computer-selection.ts` reconstructs `004f8490` with availability, command,
transport, building and base-defense eligibility. The importer records the
original person-state flags and building flags/capacities used by these leaves.
The oracle runs 1,870 availability/selection comparisons without intercepting
native calls, then 256 combined training-controller/selector cases with only
person initialization/restoration intercepted. All 20 building models, signed
occupancy, command precedence, toroidal ties, priority bands and count clamps
are covered. These are independently executable engine ports; browser world
integration still requires original person state and command lifecycle consumers.
New command exports are research evidence, not completed implementations.

## Shared person commands

```sh
.tools/decomp/oracle/bin/python scripts/check-native-orders.py /path/to/d3dpoptb.exe
```

`app/person-orders.ts` now reconstructs command encoding, the shared command
pool, queued/immediate attachment and removal, route conversion and group commit.
The importer includes the 35 reviewed command descriptor masks/flags.
The oracle compares 1,120 encodings, 576 route/attach/remove calls and 256 group
commits, including pool exhaustion and aliasing of unreserved free records.
Command preparation, work interruption, spell cleanup, attached-object deletion
and fight release are explicit world-effect boundaries. These comparisons do
not prove terrain/target correction, person-state initialization or movement.
The Node ownership regression follows two followers through shared assignment,
replacement and final-reference deletion. Full eight-slot queue overflow is
explicitly rejected; the native out-of-bounds memory write is not represented.

## Person initialization and training handoff

```sh
.tools/decomp/oracle/bin/python scripts/check-native-person-state.py /path/to/d3dpoptb.exe
```

`app/person-state.ts` reconstructs shared initialization and state bodies 10/14,
AI reservation, selected-person release, facing and animation-object selection.
The oracle compares 1,536 initializers, 6,624 animation selections across all
46 states/nine models, 1,280 startup/building-reconciliation cases, 640 direct
speed/recovery calls, and 128 combined training phase-4/5/6 handoffs. Combined
cases execute the native selector, state initializer, group commands, release
and order startup; target preparation and other world consumers remain supplied
leaves. These are not complete movement or training-arrival comparisons.
The original math helpers now live in `app/native-math.ts`, shared unchanged
with the existing simulation. Unknown initializer bodies fail explicitly.
The original `levels/constant.dat` must accompany the executable. Its decoded
settings must match `app/original-constants.json`; the oracle writes these through
the native constant descriptor table before comparisons. Native default speeds
are different from the shipped balance overrides.

## Training queue and command substates

```sh
.tools/decomp/oracle/bin/python scripts/check-native-training-queue.py /path/to/d3dpoptb.exe
```

`app/training.ts` reconstructs `00409580`, `00409b10`, `00409bd0`, `00409c50`
and the complete command-8 dispatcher `00434610`. `stopPersonMovement` in
`app/person-state.ts` reconstructs `004d4ee0`. The oracle requires the supplied
`levels/constant.dat`, compares **1,540** queue calls without intercepted leaves,
and **2,689** command scenarios across all 14 substates, including a six-tick
queue handoff. Command comparisons execute native queue, speed/RNG, stopping
and facing logic; geometry, path requests, animation output, cargo, occupant
entry and inside work remain supplied world consumers. These are engine
reconstructions, not proof of live browser pathfinding or training arrival.
