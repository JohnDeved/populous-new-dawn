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
| `0044a2f0`, `004a24c0`, `004a1f50`, `00415f70`, `00516a00` | `scripts/import-messages.py`, `app/scene.ts`, `app/globals.css` | Color operands, indexed conversion, opaque rectangle vertices and native border artwork recovered; ordinary English bitmap text/layout now compared below; projection and other blend states pending |
| `0048eae0`, `00430bd0`, `00430e40`, `00430fe0` | `app/messages.ts`, `app/model.ts`, `scripts/import-messages.py` | Type-3 allocation/removal and discovery/settlement/vault tutorial branches CPU-compared; full notification UI/scheduler pending |
| `0040c670`, `0040cc60` | `scripts/import-original.py`, `app/morph.ts`, `app/scene.ts` | Bank redirect and integer door coordinates CPU-compared; full morph scheduling unfinished |
| `0045f9d0`, `004ee7b0`, `0040cc30` | `scripts/import-original.py`, `app/scene.ts` | Native animation rows and per-layer sprite selection; full state ownership remains open |
| `00586074`, `004e6a70` | `scripts/inspect-executable.py`, `app/model.ts` | Integer angle/sine tables and movement; route selection still browser A* |
| `0041af80`, `0041b0c0`, `00403280` | `app/model.ts` | Mana, breeding and upgrades partially ported |
| `00518fb0`, `004a39c0`, `0051e3d0`, `005199f0` | `app/model.ts`, `app/scene.ts` | Group slots, attack states/damage and reactions; full fight scheduling unfinished |
| `004e93f0`, `004e6d00`, `004ebc20`, `004e9be0` | `app/person-motion.ts`, `app/person-physics.ts`, `app/native-terrain.ts` | Complete physics driver CPU-compared with explicit world consumers; grounded celebrant adapter live, full airborne/state integration unfinished |
| `0050b740`, `00511f70`, `0050ee00` | `app/model.ts`, `app/scene.ts` | Partial Blast/Lightning/Land Bridge ports |
| `004c1d10`, `004c21e0`, `004bae30`, `004bbf30` | Existing approximate casting in `app/model.ts` | Shot pipeline traced, not yet ported |
| `00409200`, `004092a0` | Existing building HP in `app/model.ts` | Native structural damage traced, not yet ported |
| `0048a050`, `0048b500`, `0048b950` | `scripts/import-sound.py`, `app/audio.ts`, `app/model.ts` | Native PCM/cues and partial event dispatch; adaptive music and complete scheduler pending |
| `0048c6b0`, `0048c980`, `0048f130`, `0048f230`, `0048ef00`, `0048ed90` | `app/popscript.ts` | Control flow, arithmetic, attribute widths and EVERY masks compared against native x86 |
| `0048cc60`, `0048f350` | `app/model.ts`, `scripts/import-script.py` | First-mission initialization applied; full game-command host remains open |
| `0043c7a0`, `004fb270`, `004fbf40` | `app/vault.ts`, `app/model.ts` | All command-33 task phases and type-4 work CPU-compared; movement/adjacency leaves and full object scheduling unfinished |
| `00485b00`, `004fb270`, `004facf0`, `004c2cd0`, `004c2aa0` | `app/worship.ts`, `app/model.ts`, `app/scene.ts` | Worship, automatic reward initialization/visual lifetime and delayed gifts CPU-compared; competitive ownership and generic pickup incomplete |
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
it does not prove nine-patch rasterization, inherited blend state or native
camera projection. English bitmap font/layout evidence is recorded below. `scripts/import-messages.py` checks the actual
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

Compares 4,824 native worship turns (including decay, refill, growth and signed
remaining counts), three native automatic-reward initializations, 18 presentation
visits and 1,660 delivery turns. The initialization checks cover original reward
frames, terrain-relative height, the linked glow and six-visit hide/delete sequence;
the delivery checks cover the 82-turn delay, four-shot cap and independent gift
counter. Allocation, sunlight, deletion and Windows UI consumers are supplied.
The browser check renders all three mission-one rewards through the live scene and
game clock. These checks do not prove generic pickup, competitive ownership or
full-frame raster parity.


## Vault task comparison

```sh
.tools/decomp/oracle/bin/python scripts/check-native-vault.py /path/to/d3dpoptb.exe
```

Runs 512 native target/approach transitions, 640 later task transitions and 320
type-4 work/force/reset cases. Task movement, adjacency, trigger association,
animation, facing and sound leaves are intercepted; trigger fixtures omit
decorative/UI effects and final deletion. Real target resolution, task branches, timers, force-bit lookup
and trigger work execute. The rendered stone pyramid is
verified separately against the editor's named geometry. Task model IDs address
native bank 2 (see below). Browser pathfinding supplies movement; exact occupancy,
vehicle ownership and full scheduler behavior remain open.


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
.tools/decomp/oracle/bin/python scripts/extract-reference.py /path/to/PopulousTB-Setup.zip /path/to/game 'objects/*0-2.*' 'data/anibl0-0.dat'
python3 scripts/import-original.py /path/to/game
```

Run `inspect-executable.py` first to refresh `original-rules.json`, including the
object texture alpha table. The importer also needs the extracted palette, atlas and animation
files listed in `public/original/provenance.json`. The extractor accepts a raw
Inno executable too; patterns are relative to its application directory. It
verifies payload checksums, rejects escaping paths and differing existing files,
and prints source SHA256 hashes. The optional extractor is separate from the
stdlib importer and native comparison dependencies.


## Campaign message comparison

```sh
.tools/decomp/oracle/bin/python scripts/extract-reference.py /path/to/PopulousTB-Setup.zip /path/to/game 'language/lang00.dat'
python3 scripts/import-messages.py /path/to/game
python3 scripts/import-hud.py /path/to/game
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
queue handoff. Command comparisons execute native geometry, queue, speed/RNG, stopping
and facing logic; path requests, animation output, cargo, occupant
entry and inside work remain supplied world consumers. These are engine
reconstructions, not proof of live browser pathfinding or training arrival.

## Original building footprint geometry

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-shapes.py /path/to/d3dpoptb.exe
```

Requires `objects/shapes.dat` and `objects/objs0-2.dat` beside the executable.
`import-original.py` now imports the 64 shape descriptors, shared mask buffer
and all 158 object-to-orientation mappings into `app/original-shapes.json`.
The oracle verifies the native loader's pointer relocation and compares
**22,752** inner/outer entrance and queue positions across all 632
object/orientation pairs, including zero shapes, map boundaries and negative
queue positions. No geometry leaves are supplied. `app/building-shapes.ts`
is used by the training controller and live building door routing; live
pathfinding/occupancy and non-building shrine approaches remain unfinished.

## Building admission and occupant transitions

```sh
.tools/decomp/oracle/bin/python scripts/check-native-occupants.py /path/to/d3dpoptb.exe
```

`app/building-occupants.ts` reconstructs admission `00407150`, occupant-mode
changes `004d80e0`, removal `00407490`, containing-building lookup `00409ed0`,
repricing `0040bbe0`, conversion-weight scan `00408d20` and the cost arithmetic
consumed from `0041b0c0`. Order clearing `00436ca0` is shared with group commits
in `app/person-orders.ts`. The oracle compares **11,200** scenarios: 1,728 cost
calculations, 1,024 weight scans, 2,048 occupant-mode transitions, 3,072
admissions, 256 combined training-command/admission/interior-stop scenarios,
and 3,072 removal/lookup/repricing scenarios.
The combined calls execute actual admission, visibility, order cleanup, weight
and cost routines. Full-building shaman admission executes actual removal and outside geometry.
Vehicle/cell/tower consumers, construction-plan geometry, occupancy indicators
and existing order-effect boundaries remain supplied. Removal restores the person
at its current coordinates and sets its exit target/facing without teleporting.

The balance override loader is shared by the person-state, queue and occupancy
comparisons in `scripts/decomp.py`; queue and occupancy comparisons share the
original-shape fixture loader. Live warrior costs reuse the recovered
arithmetic; complete live occupancy/pathfinding integration remains pending.


## Training conversion and order inheritance

```sh
.tools/decomp/oracle/bin/python scripts/check-native-training-conversion.py /path/to/d3dpoptb.exe
```

`app/training-conversion.ts` reconstructs the complete `00405b80` dispatcher:
periodic queue yielding, repricing, batch allocation, ghost propagation, mana
handling, order inheritance, old-person removal and partial-allocation rollback.
It shares the verified occupant exit, shape geometry and command routines.
`00436c20` uses the existing allocator; `0043b120` is the non-wrapping follow-up
eligibility check in `app/person-orders.ts`. Command preparation now accepts the
original flags argument (32 for the conversion exit command).

The oracle compares **1,024** scenarios, including **112** completed batches,
**52** ghost batches, **42** partial-allocation rollbacks, **33** computer mana
credits, **29** queue-yield updates and **11** command-pool exhaustion paths.
The supplied allocator records and checks the native initialization stack and
flag and updates population counters; supplied deletion reverses these counts.
UI-panel activation `00509290`, allocation/registration, mana credit, command
target preparation and existing occupancy world effects remain boundaries.
The oracle does not execute the complete original object allocator or panel UI.
These reconstructions are not yet wired into live browser training conversion.


## Mana distribution and spell charging

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mana.py /path/to/d3dpoptb.exe
```

`app/mana.ts` reconstructs the full distributor `0041a590`, charging query
`0041ad70`, spell-mode gate `004c2ca0`, limit selector `004c2d50`, and the charge
stock operations used by `004c2b40`/`004c2ba0`/`004c2cd0`. Spell descriptors are
imported by `inspect-executable.py` after the original constant overrides.
The oracle compares **1,024** distributor updates and **1,024** queries with
actual native charging, refunds, negative mana, pending-mana release, computer
pool clamps and overflow. Only tutorial notification output `00499d90` and its
UI predicate `00499970` are supplied. Branch assertions cover **170** stock
changes, **312** progress decreases, **282** idle refunds, **168** computer pool
changes and **46** notification paths.

The live first mission now uses the distributor for training mana and Blast
charging and retains computer mana. Its existing follower mana-generation,
one-trainee occupancy and in-place conversion adapters remain partial. Tutorial
requests are retained pending native UI gating; frame-rate/mana estimation inputs,
initial tribe mana and complete AI spending still need original-world integration.


## Follower mana generation

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mana-generation.py /path/to/d3dpoptb.exe
```

`app/mana.ts` also reconstructs person contribution `0041af80`, preacher-order
predicate `004df0e0` and the mana scan/commit inside `004ecac0`. The oracle compares
**2,304** person/predicate cases and **1,024** actual complete tribe rebuilds,
including **383** generation pulses. It supplies only local-player UI activity
classification `004513e0`; native generation, contribution and preacher-order
calls execute without interception. The compared outputs of the full rebuild
are its mana fields, not all its unrelated counters and lists.

Live contribution and display use the same port. Current browser commands are
still adapted to native command presence, HP to object registration, and building
occupancy to the inside flag; native person records/order ownership remain the
integration target. Combat animation alone no longer increases mana output.

## Spell range, readiness and payment

```sh
.tools/decomp/oracle/bin/python scripts/check-native-spell-casting.py /path/to/d3dpoptb.exe
```

`app/spell-casting.ts` reconstructs range `004c2e30`, attack-group reserve
`004f2f50`, entry readiness `004d1450`/`004c2e00`, payment type `004c29a0`
and the stock/price/debit portions of `004f4de0`/`004c14c0`.
The oracle compares **2,048** full range/reserve/eight-entry updates without
supplied leaves, **1,024** payment scenarios and all four starting mana grants
from actual `0042b660` tribe initialization. Payment supplies allocation failure,
projectile initialization and unavailable UI notification slots; only payment
outputs of the initializer are compared. This is not a complete spell allocator
or initializer port.

Player targeting and its visible ring now share height-dependent range. Enemy
Blast entries require cost plus configured reserve and use the native readiness
range; allocation consumes stock or queues a mana debit. Starting mana is queued
as incoming mana, not put directly into the retained pool. Browser target scoring,
Euclidean distance, cooldown, attack-group/person integration, cell occupancy and
tribe override flags remain partial.

## Casting lockouts and computer usage recovery

```sh
.tools/decomp/oracle/bin/python scripts/check-native-cast-cooldowns.py /path/to/d3dpoptb.exe
```

`app/spell-casting.ts` reconstructs shaman eligibility `004c2d80`, the usage gate
`004f2100`, initializer counter/timer branches `004c14c0`, the timer prefix of
`004615f0` and the four-tribe cooldown pass in `00461510`. The oracle compares
**2,048** eligibility/limit/initializer/recovery scenarios, **512** full native
four-tribe timer passes, all four original tribe initializations and five allocator
delay assignments including allocation failure. It stops the AI processor at
`00461655`, before unrelated world/command work. Initializer projectile/UI leaves
are supplied; only casting-state outputs are compared. The general timer pass
uses zero active computer processors to isolate it from unrelated AI work.

The native computer initialization sets attribute 43 to 12 and all 22 usage
recovery intervals to one. Allocation copies that attribute into a byte delay;
this replaces the live six-second melee cooldown. Player initialization sets a
separate 12-turn lockout. Usage limits/recovery use AI flag `0x40000`, independent
of one-off spell stock. Native action state, outer tribe flags and full casting
selection/scheduling still require integration.

## Spell target validation and native distance

The spell-casting oracle also compares **2,048** wrapped position/cell distance,
proximity and AI range cases, **2,048** complete `004c24f0` player validations,
and **2,048** `004d1340` offense/defense entry filters. The player checker supplies
cursor blocking, alternate bridge-anchor retrieval and notification output;
its eligibility, range, distance and terrain descriptor reads execute natively.
The entry filter supplies only the native base/defense-area predicate.

`app/native-math.ts` shares the native squared cell metric with computer follower
selection. Live player range and the cursor use wrapped full-resolution distance;
AI casting uses its native coarse-cell range check and boundary allowance.
The complete player validator and entry population filter are reconstructed,
but their native world/UI/area-summary inputs are not fully integrated. The
original 80-cell scan, four target slots, emergency spell paths and 16-turn
selection cadence in `004d0860` remain the next AI integration work.

## Computer spell cell scoring and target queues

```sh
.tools/decomp/oracle/bin/python scripts/check-native-spell-targets.py /path/to/d3dpoptb.exe
```

`app/computer-spells.ts` reconstructs complete `004f4680` target scoring,
`004f4030` enemy-area summaries (including optional preacher assessment),
`004de7b0` disguise recognition, `004d1420` reset, the general target scan in
`004d0860` and complete `004d11b0` dispatch. The shared `spiralCell` ports
`0049c890` without its per-step loop.

The oracle compares **4,096** rings/boundaries/rotations, **1,024** complete
scorers, **1,024** complete area summaries and **1,024** composed native scans
and dispatches. Scoring has no supplied leaves. Area assessment supplies only
queued-preacher count and training requests. General scans run the full native
function with early emergency paths disabled, state 22 plus a non-dispatch turn suppressing casts and
no preaching-assignment flag. Override cases exercise readiness 255 and scan-limit
wrapping. Dispatch executes real area, mode, range and target
scoring; spell allocation is the supplied final consumer. These are bounded
comparisons, not a full `004d0860` emergency-response port.

The area producer establishes that defense thresholds count enemy specialists,
not friendly people. Live Blast uses native cell scoring after eligibility;
the full target scan/dispatch still awaits native territory flags, cell list
order and person state. Current browser unit fields provide only the opening
three follower classes to live scoring.

## Building territory

```sh
.tools/decomp/oracle/bin/python scripts/check-native-territory.py /path/to/d3dpoptb.exe
```

`app/territory.ts` ports complete `004f6cc0` marking/removal and `004f6c20`
periodic refresh. The executable importer records the four row-width tables
and 16 terrain-category descriptor flags. The oracle runs both native routines
without supplied leaves: **2,048** mutations/refreshes compare every region byte
and the shared search-marker buffer across 256 sequences. It covers all radii,
fallback values, coordinate seams, asymmetric row traversal, overlapping tribes,
building removal, player types, staggered turns and marker wrap.

`00403860` establishes the building-removal call. `00502090` separately updates
tower coverage in the lower region bits; its export is not a completed port.
These territory primitives still need the native terrain-category producer and
building lifecycle in the live world before supplying the spell dispatcher.

## Terrain update queue and categories

```sh
.tools/decomp/oracle/bin/python scripts/check-native-terrain.py /path/to/d3dpoptb.exe
```

`app/native-terrain.ts` reconstructs `0044ddf0` queueing and the simulation
passes of `0044df40`: diagonal choice, slope/shadow fields, water flags,
category lookup, enclosed-zero repair and queue cleanup. Surface and globe
texture consumers remain callbacks in their original phase order. The oracle
compares **260** checkpoints against the complete native functions, supplying
only those two texture consumers. It checks all 16-byte map records, queues,
dirty flags, counters and texture callback order, including radius-64 ocean and
first-mission rebuilds. The mission uses imported original heights before any
browser resampling. The live opening terrain now runs the same two-traversal
initialization; ongoing terrain deformation and texture consumers remain pending.

## Live computer spell scan and shoreline Blast

The spell-target oracle also runs **1,024** complete `004c6a20` shoreline Blast
calls, including real `004f4d40` affordability, `004f45c0` person scoring and
eligibility/usage checks. Its allocation consumer applies the native AI delay.
Cases cover all four aim directions, priority ties, both shore transitions,
population-dependent reserves, strict affordability and continued traversal
after an override permits multiple casts.

The live game now runs shoreline targeting before territory refresh and the
general 80-cell scan/16-turn dispatch. It stores native terrain/territory and
the four target slots per world, clears building claims on removal and refreshes
them at the recovered staggered phase. Existing cropped terrain producers feed
native vertices into the reconstructed terrain queue when their version changes.
Browser person records/order, attack-group reserve input, early emergency paths,
occupancy flags and complete global scheduling remain integration gaps.

## Complete general and emergency spell controller

```sh
.tools/decomp/oracle/bin/python scripts/check-native-emergency-spells.py /path/to/d3dpoptb.exe
```

`processComputerSpells` composes complete `004d0860`: self-Blast responses,
flag-driven enemy-shaman and tower Lightning, preacher-response priority, entry
readiness, scanning and dispatch. Tower targets use the existing native inside
point geometry. Early returns preserve old readiness and queued work; the request
bit can clear even when the attempted Blast fails. Stored Lightning bypasses
the mana gate in the shaman/tower paths, but not in preacher responses.

The oracle compares **1,040** complete native calls without replacing queries,
geometry, scoring, ranges or scan/dispatch. The final allocation consumer records
casts and applies AI delay 12. Live casting uses this controller through the
existing opening-class person adapter; native person states and additional
classes/effects still limit which responses can occur in the playable game.

## Tribe processor and outer-loop phases

```sh
.tools/decomp/oracle/bin/python scripts/check-native-tribe-turns.py /path/to/d3dpoptb.exe
```

`app/tribe-turns.ts` ports complete `00461510`, including the real `00419480`
active/defeat-timer gate. The oracle compares **2,048** calls with computer and
territory consumers supplied: cooldowns, callback order, all suppression flags,
signed timer boundaries and changes to later tribes during iteration. Another
**512** calls run the actual offline `004a5590` loop and `004ec6f0` gate/increment.
Clock/readiness and command/replay consumers are supplied; remaining object work
is skipped through the original epilogue after the native increment. These traces
verify tribe processing before increment, the outer skip bit, paused land and
multiple subturns, including unsigned turn wrap.

The live game uses the recovered tribe processor before incrementing its turn.
Human territory refresh precedes the computer tribe's cooldown/script/spell work.
Scripts and emergency/general casting share native suppression gates. Defeat-timer
production, the complete computer processor, remaining object phases and network
timing remain unfinished; this is not a complete global scheduler port.

## Defeat and victory decisions

```sh
.tools/decomp/oracle/bin/python scripts/check-native-outcomes.py /path/to/d3dpoptb.exe
```

`processOutcome` in `app/tribe-turns.ts` reconstructs complete `00418e30`:
the 16-turn phase/minimum turn, four-tribe defeat timers, campaign opponent
counts and forced results, multiplayer extinction/mutual-alliance winners,
celebration state transitions, forced-loss damage requests and ordered outcome
consumers. The oracle compares **2,071** native calls, including a sequential
defeat-timer progression, all state fields and consumer requests. Camera,
defeat effect/cleanup, input, reveal, campaign save, network result and person
state/damage consumers are supplied. `0041b8b0`'s last-defeated-tribe prefix is
applied by both sides; its remaining object effects are not claimed as ported.

The live first mission checks outcomes after the object-turn increment and
before object work, respecting load/special-mode gates. It retires immediate
empty-tribe victory/loss, records native flags/counters/completion requests and
feeds defeat timers back into the tribe processor. Browser followers still adapt
native registration/counts; native celebration, collapsing defeated buildings,
end-camera playback, persistent progression and post-result simulation remain
unfinished. The browser result screen currently stops further simulation.


## Defeated buildings and damage stages

`app/building-damage.ts` reconstructs `0041b8b0` defeat cleanup, `004ba2c0`
plan work/damage, and `004092a0` building damage processing, with their world
consumers supplied. The collapse accumulation block of `00403280` uses native
RNG and signed-short damage. The importer now extracts building life, damage
thresholds, repair delay and smoke duration from the identified executable.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-damage.py /path/to/d3dpoptb.exe
```

The oracle compares **3,584** native calls/prefixes: 1,024 complete defeat
cleanups, 1,024 plan work changes, 1,024 damage calls using the real plan-change
and repair-delay/attacker routines, and 512 building-processor prefixes through
collapse accumulation. It checks signed storage, RNG, stages, missing plans,
overlays, ghost/internal removal, occupant ejection, allocation failures,
computer responder selection and ordered world-consumer requests. The prefix
check stops explicitly at the damage controller; it does not claim the rest of
the building processor. Geometry, allocation, graphics and AI response consumers
are supplied, and their bodies/RNG consumption remain outside these comparisons.

Live defeat now seeds each surviving building's collapse flag and damage from
its model and browser object ID. Subsequent building turns use native damage
thresholds and plan stages, eject occupants on the first major stage change,
request the existing smoke/sound effects and remove exhausted buildings.
Browser IDs/order, the initial full-life plan, legacy combat HP conversion,
smoke rendering and occupant placement remain adapters. Exact plan creation,
ordinary combat/fire/repair producers, AI repair assignment, stage mesh filtering,
face debris and sky effects remain unported. The result screen still freezes
subsequent turns: this change initializes collapse on defeat but does not yet
provide the full visible post-victory destruction sequence.

Six raw exports (`00407860`, `0040b230`, `00498140`, `004ba2c0`, `004ba590`,
`004ba5b0`) document damage boundaries; the manifest now verifies **533** files.


## Original construction and damaged-building meshes

`app/model-faces.ts` ports the face visibility and alternate texture selection
from `00471c40`. Each bank-2 face's byte at **+0x3b** supplies four visibility
bits and four matching exposed-surface bits. Byte +7 is the texture size field,
not the stage mask. `import-original.py` retains each original face's vertex
count and mask alongside its existing expanded positions and UVs.

For stages 0–3, visible faces either keep their original atlas coordinates or use
tile **250**, texture-size mode 7 and the fixed coordinates initialized by
`0040cde0`: `(0,0), (2097150,0), (2097150,2097150), (0,2097150)` at the imported
32-pixel texture size. Completed stage 4 retains the complete model and existing
normal rendering path. `004030c0` switches buildings being built/repaired to
object kind 10, whose render dispatch uses the staged renderer; completed state
2 restores its normal object kind through `004049d0`.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-faces.py /path/to/d3dpoptb.exe
```

The oracle runs **2,096** complete `00471c40` calls and compares **5,479** emitted
triangles against the browser meshes: all twelve currently displayed building
models at four incomplete stages, and triangle/quad fixtures covering every
byte mask. It uses the original bank files with recorded hashes and the actual
`0040cde0` UV initializer. Normals and an in-bounds projection are supplied;
comparison preserves vertex/UV pairing but normalizes triangle order and winding.
This proves face selection and atlas coordinates for the tested assets, not the
original clipping, shading, depth sorting, rasterizer or whole render dispatch.

The live renderer now replaces the generic construction scaffold and the old
35% whole-building visibility threshold with these original face groups. It
uses recovered remaining-work stages for construction and the native collapse
stage for damage, caching separate geometry for every model/stage. Complete
models and shared source data remain intact. Browser construction progress still
adapts remaining work; timber/construction/repair timing is not native parity.
Flying debris, fire and full post-result simulation remain unfinished.

All **46** regressions pass. The existing **3,584** damage comparisons still pass
after sharing the native work-to-stage calculation with the live renderer.
Playwright checks the actual GPU geometry buffers and UVs at all five construction
stages, then damages a completed building and checks the stage change. No page
errors occurred. Captures hide the pause overlay only in the QA page so the mesh
can be inspected. The export manifest now verifies **538** files, including the
staged and complete renderers, UV initializer and investigated boundary routines.


## Simulation continues after a result

The offline `004a5590` loop and `004ec6f0` inner gate do not stop when land flags
`0x2000000` (victory) or `0x4000000` (loss) are set. The native pause bit still
blocks the inner increment. The previous browser `status !== 'playing'` checks
in `tick()` froze buildings, effects, defeat timers and fractional-turn carry
as soon as a result appeared. Those checks are removed; command, casting and
building-placement entry points retain their result guards.

`check-native-tribe-turns.py` now includes all four combinations of result bits
in its **512** actual offline outer-loop traces, across native pause/outer-skip
flags, 0–3 subturns and unsigned-turn boundaries. It runs the original inner gate
and increment, skipping the remaining object body through its original epilogue.
These traces verify continued scheduling, not full native object integration.
The script's **2,048** complete tribe-processor comparisons also pass.

All **47** regressions pass. A new live victory/loss regression checks pending
fractional turns, rejected gameplay commands, manual pause, continued defeat
timers to 97, one-time defeat statistics and full removal of the defeated
settlement through the recovered collapse adapter. Playwright confirms that
both real result screens remain usable while world turns advance and buildings
disappear; restart resets the result state. No page errors occurred. This retires
the result freeze described in the preceding entries, but does not establish
complete post-result person behavior or presentation parity.

Further end-sequence evidence is retained as raw exports:

- `0041b6d0` drives the camera transition/return state machine, input lock/unlock,
  and sky-counter decrement/sound requests. It does not pause world simulation.
- `00417d80` plans native toroidal camera translation and rotation using integer
  acceleration/braking profiles. Its camera motion implementation remains to port.
- `004e4f40`, called after outcome decisions, polls campaign reward availability;
  it is not a result-screen timer.

The browser's opaque result overlay, native end-camera movement, celebration
person states, sky/debris effects and persistent progression remain unfinished.
The manifest now verifies **541** raw exports.


## Native result-camera movement

`app/camera-motion.ts` reconstructs `00417d80` (planning), `00418270`
(movement), `0041b610` (result initiation) and `0041b6d0` (controller).
The ramps come from the executable's `0059bbd0` / `0059bbd8` tables through
`inspect-executable.py`. The port retains signed-short arithmetic, native
wrapped distance and angle helpers, four acceleration frames, eleven braking
rows, synchronized translation/rotation, replanning and draw-mode-2 snapping.
It preserves the planner's retained overshoot sums rather than smoothing them.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-camera-motion.py /path/to/d3dpoptb.exe
```

The oracle compares **256 journeys**, **291 plans** and **7,921 complete
movement calls**, including seam crossings, tiny distances, half-world routes,
rotation boundaries, interrupted routes, instant completion and inactive calls.
The original distance, angle and sine movement routines execute unchanged;
only the globe-update consumer is supplied. All motion fields, schedules,
positions, angles, render flags, water invalidation and callback ordering match.
A second batch compares **256 result initiations** and **12,288 composed
controller/movement frames**, with the actual planner and movement bodies.
It covers overlapping requests, game/replay gates, return phases, input
lock/unlock, interaction-clear requests and sky-counter sound timing. Input,
interaction and sound consumers are supplied at their native call boundaries.

The controller runs before movement in `draw_main`. Phase 0 finishes into
phase 3; it does **not** automatically introduce a dwell or return. Phases 1/2
handle an externally requested return. Sky-counter decrements do not depend on
a simulation turn; cue `0xa2` fires at 16-step boundaries, including zero.

The live scene now consumes outcome-camera requests, moves to the defeated
tribe's opening origin, preserves bearing and locks input during playback.
It cancels an active introduction and clears the interaction mode. The existing
result overlay waits until playback finishes, while simulation and settlement
collapse continue. Defeat-sky sounds use the existing non-positional audio path.
Playwright verified both victory and loss: intermediate movement, exact target,
input release, two sky sounds, delayed result UI, continued turns and clean
restart, with no page errors. All **48** regressions and typechecking pass.

Integration boundaries remain explicit: this uses the existing **24 Hz** browser
presentation clock, first-mission origin adapter and no replay-file mode. The
full native frame throttle, shared camera/flyby ordering, renderer invalidation
store, sky visuals, celebration person states, debris and campaign progression
are unfinished. The result overlay is still a browser substitute. This extends
the previous result-camera investigation; it does not establish full end-sequence
or camera parity. The manifest verifies **544** raw exports, adding movement,
generic camera-request and interaction-cleanup routines.


## Defeat-sky flash

The defeat branch of `00524a30` now feeds `app/sky.ts` and the live renderer.
The nonzero byte counter selects alpha **48, 72, 96, 72** by `counter & 3`.
Color comes from the first entry of each five-byte tribe ramp at `005a89c8`,
using the inline system palette at `00d05528`. With the supplied mission palette,
indices **219, 244, 237, 227** yield RGB **(43,59,155), (163,19,0),
(191,147,39), (35,139,79)**. `import-messages.py` retains executable/palette
hashes and imports these into `app/original-sky.json`.

`00517830` emits one untextured alpha quad. Bounds use viewport x/y/width and
integer `surface_mem_offset / screen_width`; the caller clears render flag bits
`0x18`. `00522570` queues sky before landscape. `0047c7e0` assigns progressively
nearer depths to later commands, and `004f9470` applies each command's depth to
its vertices. The flash therefore stays behind land. `005221e0` establishes
source-alpha / inverse-source-alpha blending. The browser uses a depth-tested
far-plane quad before other transparent objects, with direct palette RGB in the
framebuffer. It does not tint the HUD or foreground geometry.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-sky.py /path/to/d3dpoptb.exe
```

The oracle runs **1,024** native calls, covering all 256 byte counter values and
four tribes with varied signed viewport origins, widths and integer height
remainders. Mode 3 skips the unrelated base-sky/lens branch. There are **no
stubbed callees**: the real `00517830` and `0047d980` allocate the render command.
All four corner coordinates, packed ARGB, command flags, allocation count/size,
zero texture handle, retained vertex fields and caller flag clearing match.
This is command-generation evidence; no Direct3D device is emulated.

Playwright read back real WebGL pixels for every tribe and all four opacity
phases. Sky pixels match source-alpha blending within one byte; a foreground
land pixel stays unchanged, and counter zero restores the original sky. Both
victory/loss camera-and-sound scenarios still pass and restart cleanly, with no
page errors. The standalone oracle is the runnable regression for this branch;
the existing **48** gameplay regressions and typechecking also pass.

Remaining boundaries: live system-palette animation/remapping, other landscape
palettes, native base-sky/lens geometry and hardware fallback paths are unported.
The existing 24 Hz presentation adapter controls the counter. WebGL depth ordering
preserves this effect's layer relationship but is not the complete native polygon
queue or rasterizer. The general sky and result UI remain unfinished. The manifest
now retains **555** raw exports, including the traced draw, quad, queue, depth and
blend routines.


## Victory follower controller reconstruction

`app/celebration.ts` reconstructs the complete `004e0af0` state-41 controller
and its `004e2610` chain-action helper. The nine substates cover entry/cargo
release, individual movement and worship, firewarrior gestures/projectile requests,
circle leaders/followers, chain leaders/followers, vehicle waiting and the shaman's
idle-and-turn behavior. `inspect-executable.py` now imports the three neighbor
weight records at `005d4858` and four six-byte chain-action records at `005d4868`.
The port uses the existing native RNG, angle, spiral-cell and person-speed helpers.
It preserves signed byte/short counters, linked-list ordering, shared animation
phase writes, wrapped destinations and the exact RNG consumption sequence.

`initializePersonState` now accepts state **41** with an explicit celebration
consumer, retaining the original shared cleanup and post-initialization animation
selection. The native comparison exposed an existing scope assumption in training
queue cleanup: the matching-command-8 exception only applies to order state 10;
state 41 must release that reservation. The shared condition now expresses this.
The three dance callers zero-extend their animation-table entries to **bytes**;
Ghidra's `(char)` notation must not be interpreted as signed extension here.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-celebration.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-person-state.py /path/to/d3dpoptb.exe
```

The new oracle compares **2,048 complete controller calls**, **256 complete
chain-action calls**, **40,960 sequential controller calls** across 64 ten-person
64-turn timelines, and **128 composed state-41 initializations** executing the
real celebration controller. It checks every supplied person's tracked fields,
shared RNG and ordered animation, turning, destination, drop, sound, building-exit
and projectile requests. Native cell/object lists and the angle, distance and
movement math execute unchanged. Animation, motion registration/destination,
allocation, sound, building-exit and projectile consumers are supplied at their
call boundaries. Animation timing uses an explicit supplied record (signed hold
-3, delay 2, seven frames), not a claim that every original sprite is integrated.
The final 128 initializer compositions compare the controller's tracked fields;
full shared initializer fields are covered by the separate initializer oracle.

The expanded initializer oracle passes **2,048** state-10/14/41 cases, plus its
existing **6,624** animation selections, **1,280** startup/reconciliation cases,
**640** speed/recovery calls and **128** composed training handoffs. All **48**
gameplay regressions and typechecking pass.

**Live integration is unfinished.** The browser outcome adapter still does not
initialize these native person records. Connecting this controller requires the
shared person state, movement/turning, sprite-object/frame setters and world-effect
consumers; mapping it to a generic looping dance would discard the behavior just
recovered. Native vehicle/passenger handling, complete person physics and object
scheduling remain explicit dependencies. This pass adds reviewed reconstruction
and executable comparison evidence, not visible victory-animation parity. The
existing **555** raw exports already contain these entry points and their helpers.


### Native animation composition

`app/animation.ts` ports `004ee700`, `004d4040`, `004ee7b0` and `004ee770`.
Run `scripts/check-native-animation.py EXE` for setter, object-update and
allocation-list comparisons, and `scripts/check-native-celebration.py EXE
--animations` for celebrations composed with native frame setters and updates.
The latter now checks 81,920 animation updates and 128 real state-41
initializations. Movement/world effects, loaded morph-duration tables and live
person/render scheduling remain boundaries. See the animation section of
[the evidence log](../references/reverse-engineering.md) for exact coverage and
presentation-clock findings. The export manifest contains 565 raw functions.


### Live celebration and initial motion integration

Live braves, warriors and shamans now own persistent native celebration and
animation records through `app/live-people.ts`. `app/person-motion.ts` reconstructs
the grounded facing prefix of `004e6d00` and full `004e93f0` slope velocity.
`scripts/check-native-person-motion.py EXE` compares 4,096 cases of each;
`scripts/check-browser-celebration.mjs` checks live handoff, movement, rendered
frames, pause, circles/chains and restart. All 49 gameplay tests pass.
The manifest now contains 568 raw exports. Full physics, pathfinding, ordinary
orders, native allocation and presentation scheduling are still incomplete;
see the live-integration section of the evidence log for the exact boundaries.


### Obstacle and building-exit recovery

`app/person-motion.ts` ports complete `004e9720`, `004e9950` and `004e7a10`;
`app/building-shapes.ts` adds `0040a460`. The motion oracle now checks 20,480
calls across facing, slope velocity, obstacle probing, recovery and proximity.
The shape oracle checks 30,336 points with all geometry callees executing.
Live celebrants use these routines with the existing world collision adapters;
50 gameplay regressions and the browser detour/restart check pass. Native
collision classification, occupancy, path recomputation and full physics remain
open. The export manifest now verifies 574 raw functions; see the evidence log
for supplied consumer boundaries and the corrected square-proximity finding.


### Terrain collision and walkability

`app/person-collision.ts` ports `005178d0`, `00517f10` and `0044f980`;
`app/native-terrain.ts` adds `00422bd0` and `00422a60`. Run
`scripts/check-native-person-collision.py EXE` for 28,672 point/permission checks
and 24 complete dual-map updates. Building/surface callees execute natively;
boat lookup is supplied. Existing terrain checks retain all 260 checkpoints.
Live celebrants now use native terrain collision and updated walk maps; building
occupancy and ordinary order/lifecycle integration remain adapters. All 51 game
regressions and the browser detour/restart check pass. The manifest verifies 576
raw exports; exact coverage and the +0x92 metadata correction are in the evidence
log.


### Building footprint registration

`registerBuildingFootprint` and `nativeCellShade` in `app/building-shapes.ts`
reconstruct `00403a00` and `00450d50`. Run
`scripts/check-native-building-footprints.py EXE` for 632 complete map updates
across all imported object/orientation pairs and 4,096 complete cell-shade calls.
Registration's shade/texture consumers are supplied; shade comparisons execute
all native code. Live completed buildings now populate native occupancy cells,
including changes and removal; plans and full lifecycle/texture scheduling remain
open. All 52 game regressions and browser checks pass. The manifest verifies
578 exports, including the unported texture-region consumer `004bdd40`.


### Airborne eligibility and landing decisions

`app/person-physics.ts` reconstructs `004e78f0`, `004e7980`, `004e7880`,
`004e9050` and `004e9160`; native-terrain adds `0044f750`, `004ebd10`,
`004ebc20` and `0044ebe0`. Run `scripts/check-native-person-physics.py EXE`
for 45,056 native comparisons. Terrain/math execute unchanged; landing state,
animation, fight and class-3 consumers are supplied and ordered. All 52 game
regressions and browser checks pass. Shared ordinary velocity caps are live;
complete physics and landing-state/order dispatch are not yet integrated.
The manifest contains 581 exports, including unported path consumer `004eadc0`.
See the evidence log for exact fixture boundaries and remaining dependencies.


## Complete person physics driver

`app/person-physics.ts::stepPersonPhysics` reconstructs all branches of
`004e6d00`, composing the reviewed motion, collision, recovery, terrain and
settling routines. `bouncePerson` reconstructs `004e9be0`; `terrainPointHeight`
uses `0044e940`'s stored diagonal and signed low word. `00463750` supplies the
reviewed impulse height clamp. Gravity, both frictions, fall damage and the
building support field are imported from the configured executable tables.

Run `scripts/check-native-physics-driver.py EXE`: 4,096 complete bounce cases,
8,192 standalone driver turns, and 128 continuous 64-turn trajectories (16,384
full turns). Native height/math/collision/access/recovery/drift/settling execute;
cell insertion, allocation, damage/audio, state/fight, building route queries,
reveal and path-group consumers are supplied and compared with ordered full
motion snapshots. Branch hit assertions include failed recovery and turn hold.
The dependency oracle `scripts/check-native-person-physics.py EXE` now checks
49,152 calls, including 4,096 stored-diagonal height queries with signed extrema.

Live celebrants use the stored-diagonal height query. The complete driver is
not yet their live dispatcher: landing must reconnect shared states/orders and
native animation ownership, and cell/object/path consumer lifecycle is still
unfinished. The manifest contains 582 raw exports. Full parity remains open.


## Persistent object cell lists

`app/object-cells.ts` reconstructs complete `004ee470` insertion, `004ee4f0`
removal and `004ee580` motion/cell transfer. All preserve the native doubly
linked ordering, membership flag, unchanged detached link fields and optional
signed displacement words. `scripts/check-native-object-cells.py EXE` compares
8,192 sequential operations, all 16,384 cell heads and 128 object records after
every operation, without supplied callees. The complete physics driver oracle
now executes native `004ee580`, comparing every cell head and neighbor link
alongside the existing 16,384 turns and ordered remaining consumer calls.

Live celebration lookup now walks persistent native cell order. Existing
allocation/deletion, legacy spell movement and initial victory membership are
reconciled explicitly by `syncLivePersonCells`; ordinary units and other object
classes still await native allocation/lifecycle integration. `004ed8a0` and
`004ee300` are retained as reviewed raw evidence, not full ports. There are 586
exports; all 53 gameplay regressions and browser cell-list integrity checks pass.


## Landing recovery state handoffs

`initializePersonState` now also accepts state 36 (common initialization) and
39 (required special-battle initializer). `stepFightRecovery` reconstructs
`004df220`; `app/special-battle.ts` reconstructs `004dfac0`, `004783a0` and
`00478820`. The shared center pointer is `0096aa70`; this special state must
not be substituted for ordinary shaman control. Its non-shaman setup includes
tribe formation placement, a class-7/model-32 effect and facing the shared
center; shamans enter substate 3 without that teleport. Descriptor 44 and the
four tribe effect palette bytes are now imported from the original tables.

Run `scripts/check-native-person-recovery.py EXE`: 20,480 native comparisons,
4,096 each for position, boundary, fight recovery, special setup and composed
state-36/39 initialization. Native math/RNG, cell motion, flat fixture height
and effect animation setters execute. Person animation, vehicle exit,
allocation/class initialization and fight consumers are supplied. Motion release
executes with group zero. `scripts/check-native-person-state.py EXE` adds shared
initialization coverage for states 36/39 while preserving the existing order,
selection and celebration comparisons. `scripts/check-native-animation.py EXE`
now checks every imported descriptor (45) rather than a fixed range of 40.

These recovery states are reconstructed, not yet the live dispatcher. Remaining
state bodies, group/vehicle/object lifecycle and airborne integration are open.
The manifest contains 588 exports; the full parity goal remains unfinished.


## Person update preparation and health

`app/person-update.ts` reconstructs complete `004d42a0` preparation,
`004eefd0` interrupted-motion reset, `0051fed0` reaction counters,
`004eeff0` drowning eligibility and `004d43a0` health processing. The importer
reads each model's healing byte at `005a7060 + model*50 + 26`.

Run `scripts/check-native-person-update.py EXE`: 20,480 comparisons, 4,096
per routine. Terrain height/coastal masks, animation selection and motion reset
execute natively; state initialization, upper animation setting and destination
planning are supplied consumers. Drowning returns only AL, not all of EAX.

Live celebration now runs interruption reset, slow-turn expiry, pending goal
consumption and reaction counters before motion. Full preparation state resumption
and health remain unintegrated until the class-1 state/order dispatcher owns them.
The live destination consumer still uses direct destination assignment, pending
native path planning. Raw `004e0270` and `004d4690` preserve surrounding person
update evidence; they are not ports. The manifest contains 593 exports.


## State-10 order dispatch and resumption

`app/person-order-update.ts` reconstructs `00432590` order dispatch/completion,
`004e32a0` post-order state selection and `00402e70` anchor centering.
`advancePersonOrder` in `app/person-orders.ts` reconstructs complete `004366b0`,
including canceled slots, circular traversal, repeat-model matching, fallback
consumers and queue cleanup. The person model importer now preserves idle-state
byte +5 separately from the order-state byte +4. Shared initialization also
covers the native timed-wait state 1 and its extra RNG draw.

`scripts/check-native-order-update.py EXE` passes 16,384 comparisons: 4,096 each
for advancement, idle selection, dispatch and dispatch with native advancement
composed. Command bodies, removal/configuration, paths, formation and vehicle
consumers are supplied, with owned-field and ordered callback snapshots. Native
cell lookup, anchor centering, overlap, object validity and tribe survivor count
execute. The existing state oracle covers 4,096 initializers across states
1/10/14/36/39/41, alongside its prior animation/order/training handoff checks.

Live celebration now uses complete preparation. Its interruption can enter
state 10, center the anchor and return through the original victory decision,
using shared state initialization and RNG throughout. Nonempty ordinary queues,
vehicles, remaining states and full airborne/health dispatch are still open.
Raw metadata can misname overlapping fields: compiled command 25 clears the
matched effect's word +0x70, and command 29 tests target word +0x7a. Those offsets
are confirmed by instructions and CPU comparison, not inferred field names.
There are 599 raw exports and 55 gameplay regression tests.


## Idle approach and resting states

`app/person-idle.ts` reconstructs complete `004d6f90` approach initialization,
`004d7330` resting initialization, `004d73e0` resting controller and `004d5650`
slot coordinates. It also supplies the state-17 same-cell/anchor recheck block.
`restingCellCollision` reconstructs `00518200`; `stepPersonPose` reconstructs
`004d6b10` with the separate RNG at `0089bc72`. `setPersonAnimationRow` shares
complete `004d3ff0` across movement and idle code. Shared state initialization
accepts 17/19 through mandatory consumers. Slot cell +0x80 remains `formationCell`,
and slot flags +0x82 remain `anchorFlags`, avoiding duplicate state properties.

Run `scripts/check-native-idle.py EXE`: 24,576 comparisons, 4,096 each for pose,
slot position, resting-cell eligibility, resting initialization/controller and
approach initialization. Native math, both RNGs, animation-row selection, terrain
height, overlap and zero-group motion release execute. Slot search/ownership,
object insertion/allocation, path/order consumers and the upper setter are supplied.
Slot tables are explicit fixture inputs; original runtime table loading is open.
The raw indexed search allocator/iterator/release exports are evidence, not ports.

Shared initialization passes 5,120 cases across 1/10/14/17/19/36/39/41. The runtime
animation table now includes objects 161–163; the state-19 gesture duration uses
fixed frame source 712 at `005a6adc`, even for a different current object. Original
brave/warrior gesture sprites are extracted, bringing the atlas to 2,216 frames;
spy rendering remains outside the current supported live classes. There are 609
raw exports and 56 gameplay regressions, including a composed approach/resting
handoff and real-browser gesture rendering. Ordinary live idle scheduling remains
unintegrated until its native search/slot/world consumers are available.

## Indexed searches and resting-position ownership

`scripts/import-search.py DATA/mwsearch.dat` imports the original 8,320-byte
search table into `app/original-search.json`, checking its SHA-256
`0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0`.
Use `scripts/extract-reference.py` with `data/mwsearch.dat` to reproduce extraction
from the supplied installer. Loader `0049a5f0` reads directly into `008929cd`;
that address contains the data, not a pointer. There are 32 ring offset/count
pairs followed by 8,192 signed coordinate bytes.

`app/indexed-search.ts` reconstructs `0049a2f0`, `0049a3f0` and `0049a5d0`.
The shared pool retains all bytes of the original 16 records, including reserved
slot zero, stale fields, the aliased type-1/type-2 fields, explicit release and
the repeated first point at each type-2 ring boundary. Undefined search types
are rejected; stepping an exhausted handle is outside the supported lifecycle.

`app/resting-slots.ts` reproduces the fresh-world `0042c210` startup geometry
(44 positions, with shape zero aliasing six), `004d55a0` cell eligibility with
the original `004f62c0` current-command predicate, `004d5420` slot validity,
`004d5120` slot search and `004d56f0` group compaction. Vehicle eligibility uses
the imported model flag byte at `005a794d + model*23`. Terrain rejection composes
the four-corner `0044f600` height range and original coastal point predicate.
Occupancy follows native cell order, compares slot low nibbles independently
of shape and requests repositioning when group membership changes.

Run `scripts/check-native-resting-slots.py EXE`: 16,384 sequential indexed-search
operations compare every record byte, startup checks compare every offset, and
2,048 cases each compare cell eligibility, slot validity, search and compaction.
Native search, terrain, command and linked-list routines execute; only the
building outside-point consumer is supplied. Slot-validity fixtures use owned
slots within their shape; invalid shape/slot combinations read unrelated native
storage. Search pool exhaustion, stale bytes, marked objects and failed terrain
eligibility are included. A gameplay regression composes actual linked cells,
search, ownership, compaction and the resting controller's reposition request
through follower arrival and departure. There are 612 raw exports and 57 gameplay
regressions. Ordinary idle behavior still awaits live scheduling and remaining
path/world-consumer integration; these ports do not replace it yet.

## Shared routes and destination planning

`app/person-routes.ts` reconstructs `004ea460` release, `004e9dd0` direct
destination assignment, `004ea4c0` point lookup, `004ea550` reuse (low-word
result), `004ea300` vehicle-wait flag updates, `004e9e80` destination planning
and the `004e9d80` wrapper. Route construction (`004ea970`), advancement
(`004eadc0`), vehicle landing adjustment (`004ec3f0`), building outside/access,
coastal direction and vehicle readiness remain explicit consumers.

The native pool at `00955c29` addresses 400 109-byte records plus reserved record zero; construction
uses the distinct allocation boundary documented below. Reference count is a signed word, flags are byte +2, base/end cells
start at +4/+8, 24 intermediate records start at +12, and length is byte +108.
Active count and last-used index are signed words at `009557b0`/`009557ae`.
Release preserves flag-4 records at zero users and leaves motionIndex untouched
when motionGroup is already zero. Reuse scans backwards for only active-count
slots, counting empty slots against that budget. Exact endpoints, nearby starts,
vehicle exclusions, reserved routes and toroidal byte-coordinate distance are
preserved. Destination planning retains original skip/throttle gates, building
exit and coastal offsets, fresh reference counts, fallback ownership and ordered
route consumers. It does not supply an approximate pathfinding algorithm.

Run `scripts/check-native-person-routes.py EXE`: 14,336 comparisons (2,048 each
for release, direct assignment, lookup, reuse, vehicle flags, planning and its
wrapper). Original reuse, point lookup, route release/attachment and vehicle
flag logic execute within planning; the consumers listed above are supplied.
Checks compare every owned person field, route-pool SHA-256, global counters and
ordered callbacks. They cover reference-count limits, route flags, pool wrapping,
reuse matches/misses, terrain adjustments, vehicle paths and consumer failure.

Live celebration now uses the same shared route pool for release and direct
destination assignment, replacing the zero-group-only adapter. A regression
composes native route reuse with two live celebrants releasing their shared
record and restart clearing the pool. There are 617 raw exports and 58 gameplay
regressions. Planned destinations in the live preparation/order adapter still
need native construction/advancement before full route following can be enabled.
The newly exported `004f2480` is a byte read at person +0xaf; its lifecycle remains
to be identified before replacing the idle controller's corresponding consumer.

## Route construction and failed-search caching

`buildPersonRoute` reconstructs complete `004ea970` (low-word result), composing
the native allocation scan, failed endpoint cache, near/far airship fallbacks,
result copying and flag decisions. `ageFailedRoutes` and `clearFailedRoute`
reconstruct `004ec390`/`004ec680`. `attachPersonRoute` shares `004ea3b0` and the
reserved variant `004ea400`; destination planning now uses that shared helper.
The path-search primitive `00420840` and airship chooser `00466920` are exported
but still supplied consumers, as is route advancement. The unhalved byte-cell
distance in `00450590` uses the existing wrapped coordinate helper.

Instruction `004eaa58` compares the allocation pointer against `00960679` and
wraps on greater-than-or-equal: allocation probes slots **1–399**, up to 400
times. This differs from reuse, whose backwards scan can visit slot 400.
Only zero reference counts qualify; reservation flags do not prevent allocation.
The cursor at `009557ac` advances even when the subsequent search fails.

Failed-search records at `00955bd9` are eight 10-byte entries. Any nonzero signed
timer can match masked endpoint bytes. A miss replaces the first minimum timer
with 16, preserving unused bytes. Aging decrements every nonzero signed word,
including underflow; explicit invalidation clears all matching timers. The result
buffer at `009557d0` holds two 4-byte endpoints, 256 4-byte path records and the
byte count at `00955bd8`. Construction copies at most **23** points and derives
vehicle flags only from the copied points. It preserves stale destination-record
bytes, does not attach the person and does not increment active-route count.

Run `scripts/check-native-route-build.py EXE`: 8,192 comparisons, 2,048 each for
aging, invalidation, construction and construction inside native destination
planning. Only path search, airship choice/readiness and advancement are supplied.
Every route-pool and search-result byte, all cache bytes, cursor/counts, owned
person fields, endpoint XY changes and callback order are compared. Cases include
full allocation, slot-400-only availability, signed timers, cache hits, expiry,
callback changes to eligibility, both vehicle fallbacks and result truncation.
The route oracle now adds direct/reserved attachment, for 18,432 comparisons.

The 59th gameplay regression follows a cached failure through expiry, successful
construction, 23-point storage and reserved ownership release. Browser checks
retain shared-route release and restart coverage. There are 624 raw exports.
The live adapter still requires core path search and advancement before ordinary
followers can use full native route following; passing construction fixtures does
not establish that integration.

## Path-search control and result packing

`app/path-search.ts` reconstructs complete `00420840` search control,
`004665c0` boat lookup and `00421960` result collection. Search preparation,
candidate setup, obstacle solving, smoothing and measurement are explicit
consumers. The geometry layer below now supplies preparation and postprocessing;
exported pseudocode is not an implemented solver.

Search classifies the two four-byte endpoints, retains their unused fourth byte,
sets the original kind bytes and updates the shared result header. Boat lookup
uses the first eligible vehicle in native cell order and does not filter dead
flags. Search preserves equal-endpoint and water rejection, per-tribe limits,
candidate/mode loops across both walk masks, and the sticky secondary result.
The vehicle retry uses the candidate index after the loop and does not propagate
the collector's trim flag to the person, unlike ordinary success. Every normal
return restores the primary walk mask. The first native argument is unused.

The identical inlined path compaction blocks retain the last node in consecutive
equal-XY runs, including its flags. Collection inserts midpoint nodes at spans of
128 or greater, preserves each output record's fourth byte, wraps the byte count,
and conditionally trims one or two final land points following a vehicle leg.
Its descriptor comes from the current **queued** command, including cancelled
records and slot zero; it does not select an immediate command. The collection
API takes that resolved model. Inputs exceeding the native 256-point output
buffer are rejected rather than reproducing an out-of-bounds memory write.

Run `scripts/check-native-path-search.py EXE`: 8,192 comparisons, 2,048 each for
boat lookup, collection, search control and native collection inside search.
Checks compare all endpoint bytes, person flags, owned search globals, complete
path/result buffers and ordered consumers. Cases include identical endpoints,
water/vehicle modes, failed searches and retries, duplicate XY with distinct
flags, midpoint insertion, tail trimming and valid buffers through the 256-point
byte-count wrap. Preparation/solver/smoothing/measurement are supplied, and only
the standalone control mode supplies collection. These checks do not prove the
remaining obstacle-search algorithm.

A composed gameplay regression passes both normal and vehicle-retry results
through the native collector and route constructor, retaining their distinct
person flags. Full live pathfinding still needs world consumers and route
advancement connected to ordinary follower ownership.

## Wrapped path geometry and smoothing

`app/path-geometry.ts` reconstructs `00420dd0` candidate preparation, `00420f80`
candidate selection's defined coordinate writes, `00421f30` line setup,
`00422020` step probing, `00421cb0` segment clearance, `00421b70` repeated
smoothing and `00422df0` measurement with `00419480` tribe filtering.
`scripts/inspect-executable.py` imports the four original ten-byte direction
records at `0059bd90` into `original-rules.json`.

The 120-byte candidate buffer preserves the alias between four wrap offsets
and eight neighboring target rows. A fallback index of four therefore reads
neighbor zero; a two-candidate setup leaves unused offsets intact. Candidate
selection writes neighbor flag words from an uninitialized native stack local.
Their values are not recovered behavior: the port retains those uninterpreted
bytes and the oracle excludes only those undefined writes from comparison.
All defined coordinates and remaining candidate bytes are compared.

Line stepping retains signed arithmetic, half-error initialization and native
axis tie choices. Probing checks the selected quarter-cell walk mask before the
terrain-cell cache. The cached boat pointer is the same `currentBoat` field used
by search, not a second copy. Successful transitions invalidate the cell key
while preserving the cached result byte. Building access, boarding, disembarking
and boat-cell checks remain required consumers. Disembarking receives the
current even cell in world units; boat-cell checks receive the next quarter cell.

Smoothing tries four nodes ahead first and repeats until no shortcuts remain,
preserving node flags, retained prefixes and unused buffer tails. Measurement
counts quarter-cell steps, includes each segment's start and excludes its end,
and reads terrain **region byte +15**, not owner byte +11. Inactive tribes and
those with signed defeat timers of at least 97 are removed from its high-nibble
mask. A clean metric record is left untouched.

Run `scripts/check-native-path-geometry.py EXE`: **7,168 comparisons**, 1,024 each
for preparation, candidate selection, line setup, repeated probes, segment
clearance, smoothing and measurement. Native line setup/probing execute inside
clearance and smoothing; only the four building/boat consumers are supplied.
Checks include full defined buffers, shared globals, ordered consumer arguments,
cache hits/misses, both masks, world seams, identical endpoints, signed overflow
in line setup, boat transitions, blocked shortcuts and tribe filtering.

A gameplay regression composes route construction, search control, preparation,
selection, actual smoothing/measurement and collection around a supplied solver
path. It verifies a shortcut across the world seam and a retained detour when
its first step is blocked. All **61 gameplay regressions** pass. The manifest
contains **635 raw exports**, including the obstacle-following dependencies
`004222d0` and `004229a0`, reconstructed in the next section. Route advancement,
world consumers and ordinary live follower ownership remain open. These geometry
comparisons alone do not establish full live pathfinding parity.

## Complete path solver and obstacle following

`app/path-solver.ts` reconstructs complete `00421130` solving, `004222d0`
obstacle following and `004229a0` route merging. The original step limit of
**1,500** at `0059bd8c` is imported with the other executable rules. Solver state
preserves attempt/detour/step/limit counters and each tribe's 16-bit request count.

The solver alternates left/right walkers around an obstruction, tracks their
separation and reunion, chooses the first successful side, compacts and smooths
its route, merges it and resumes line tracing. Each side retains its own cache,
boat identity, route buffer, origin/current point, rotation, heading and corridor
flag. Left/right status fields remain the existing geometry globals. The shared
probe now accepts these side caches without temporarily replacing the main boat
or cache. Main-cache mutations from smoothing remain distinct.

The port preserves native turn ordering, short-limit signedness, step-budget
checks, duplicate transition nodes, shoreline-neighbor acceptance, early return
to line tracing and secondary vehicle results. The corridor's final test probes
with the old heading but advances with the newly chosen heading; this apparent
oddity is present in the native instructions and retained. Merge tests capacity
before inspecting each source node, including duplicates, and copies the side's
boat identity even when capacity prevents completion.

Run `scripts/check-native-path-solver.py EXE`: **4,096 comparisons**, 1,024 each
for sequential walker steps, merging, complete solving and the complete search
chain (`00420840`) with native preparation, selection, solving, smoothing,
measurement and collection. Only building access (`00517f10`), boarding lookup
(`004663c0`), disembarking (`00464f90`) and boat-cell checks (`00465510`) are
supplied. Original endpoint boat lookup (`004665c0`) executes against cell lists.
Owned globals, both complete side-route buffers, main path/result buffers, person
flags, consumers, metric records and return values match. Fixtures cover both
walk masks, vehicle transitions/modes, node/step limits, failures and secondary
results, repeated steps and stale side state. Negative short limits are covered
by bounded step/merge fixtures; complete-search fixtures remain within the
native buffers. The browser rejects writes beyond its typed path storage.

The 62nd gameplay regression constructs routes using the actual solver. A wall
crossing the world seam produces native points `(251,23)`, `(2,23)`, `(6,20)`,
an 18-step metric and one 28-step solver attempt. Blocking the destination gives
four attempts, six detours and 572 solver steps, no route, and the original
16-turn failure-cache entry. Both fixtures also execute in the native oracle.
The previous 7,168 geometry comparisons still pass after cache sharing changes.

The full solver is reconstructed but not yet the ordinary live follower adapter.
The next section reconstructs advancement and boat/target eligibility. Concrete
boarding/disembarking, landing geometry, building access ownership and ordinary
person scheduling/physics remain integration work. These
results do not establish full game or live movement parity.

The three boat consumers are now preserved as raw exports for the next integration
step; exporting them does not implement their behavior. The manifest contains
**638 raw exports**. Typechecking, all 62 gameplay regressions, production build
and the existing live celebration browser check pass.

## Route advancement and vehicle routing

`app/route-advance.ts` reconstructs complete `004eadc0`: arrival tests, waypoint
advancement, boarding/disembarking branches, vehicle approach targets, passenger
synchronization, reroute propagation and shared-route release. It reuses the
existing ownership helpers. `app/person-routes.ts` adds complete `004ebab0`,
checking the next vehicle leg or flagged endpoint using original boat lookup.

Arrival retains the native 224/576-unit thresholds and the 640-unit vehicle
approach window. Wrapped axis distance uses **65535 - distance**, as compiled,
not a substituted 65536 modulus. Waypoint coordinates become even-cell centers;
the final ordinary destination returns to the person's exact goal. Passenger
loops read current slot contents and ownership, including repeated disembarking
passes and mutations caused by the boarding/clear-order consumers. Vehicle
navigation flags are the original dword at **+0x92**; its upper-byte status at
**+0x94** is part of that same field, not a duplicate state property.

`app/vehicle-routing.ts` reconstructs `00465510` other-vehicle occupancy,
`00464f90` disembarking eligibility, `004650d0` approach eligibility, `00465650`
readiness, `004663c0` boarding selection with `004f2490`'s reservation byte,
`00464ce0` alternative landing search, and `004ec3f0` target adjustment. Capacity
bytes at `005a7938 + model*23 + 8` are imported with the original rules.

Boarding considers only the first eligible boat in native cell order; if it is
full, busy, too fast or reserved for a computer player, the routine does not try a
second boat. Passenger count/capacity and speed limits retain signed comparisons.
The passenger array starts at **+0x7a**, and reservation is byte **+0xa2**. Other
class-4 objects block landing cells even when their dead flag is set. Boats need
marked eligible shore cells for disembarking; airborne vehicles use their own
flag test. Alternative landing preserves the original exact target on initial
success or total failure and uses cell centers for searched alternatives.

Landing target adjustment composes the original indexed search and shared
16-by-3-byte reservations at **00969d92**, counted by signed word **00969d8e**.
It searches and releases its handle, skips occupied/reserved cells and reserves
only when capacity remains. The outer scheduler's reservation-clear phase still
needs integration. Inconsistent reservation counts are rejected rather than
walking beyond the original array into unrelated memory.

Run `scripts/check-native-route-advance.py EXE`: **4,096 comparisons**, 2,048 each
for vehicle-leg availability and complete advancement. It compares the full
401-record pool, all person and passenger fields, vehicle navigation flags and
slots, counters and ordered consumer snapshots. Native route release and
availability execute inside advancement. Boarding, airborne lookup, landing
geometry, passenger removal and order clearing are supplied, including mutations
to route ownership, flags, targets and passenger slots.

Run `scripts/check-native-vehicle-routing.py EXE`: **8,192 comparisons**, 1,024
each for occupancy, disembarking, approach, readiness, boarding, target adjustment,
alternative landing and composed path probing. The probe uses the actual native
boat routines; only building access is supplied. Indexed searches use the
verified original `MWSEARCH.DAT`; complete search/reservation bytes are compared.

Two gameplay regressions bring the suite to **64**. One composes planning, reuse,
construction, complete search/solver/postprocessing and advancement: two followers
share the original seam-crossing detour, visit centered waypoints and release the
route independently at the exact goal. Positions are advanced to waypoints by the
fixture; this is not a full physics replay. The other verifies first-boat rejection,
computer reservations, landing occupancy and distinct shared landing reservations.

The manifest now contains **644 raw exports**. Ordinary live movement still uses
the browser route adapter. Native boarding/disembarking actions, landing-position
geometry, building-access ownership, reservation scheduling and ordinary native
person/physics integration remain open. Exported consumers are not completed
world actions, and these checks do not establish full engine parity.


## Ordinary live path queries

`app/live-pathfinding.ts` now composes the recovered destination planner,
route construction, complete path search/solver, smoothing, collection and initial
advancement for every ordinary browser route request. The 49×49 A* implementation
is removed. The live terrain, walk masks and complete-building footprints feed
those routines. `00518070` is reconstructed in `pathCellBlocked`; its real native
building-access and height-range callees execute in **8,192 additional comparisons**
in `scripts/check-native-person-collision.py`. Only its adjacent-building lookup
is supplied, and the comparison checks the order of height/adjacency consumers.

`0042b590` initializes 200-node limits and zero request limits. `0042b660` confirms
player type **1 is computer, 2 is human**; previously reversed path-limit property
names are corrected without changing the address-based oracle behavior. Imported
`005aa450` supplies the 384 land limit, and signed category direction bytes at
`005aa329 + category*14` supply `004655f0` coastal offsets. `004ec6f0` resets search
requests before object work and ages failed routes afterward; both live hooks are
now present. Two new raw exports bring the manifest to **646**.

Ground movement now uses the original coastal support mask, so a valid low-shore
waypoint is not rejected by the old height cutoff. Placement and the existing
Blast airborne/landing adapter retain their earlier checks. The **65 gameplay
regressions** cover the complete first mission, all four building-door orientations,
failed-route expiry/pause, query reference release and live low-shore arrival.
The browser check also issues a real right-click order before its celebration QA.

**Remaining boundary:** each query bootstraps a temporary person, then flattens
and releases the route for the existing `Unit.path` controller. Ordinary native
orders, persistent route references, per-step native advancement, full collision
and physics are not integrated by this change. Queued-command collection uses
model zero until ordinary queues are native. Current live worlds have no vehicles;
empty vehicle lookups represent that fact. Full-world rendering, vehicle actions,
complete building-access ownership and the remaining object scheduler are open.


## Persistent ordinary route ownership

`app/live-pathfinding.ts` now retains ordinary routing records in the world and
composes `004eadc0` after each live movement update, matching its placement at the
end of `004e6d00`. The original ground arrival square is 224 coordinate units;
advancement no longer waits for the old exact-waypoint follower. Native pool
references are shared by nearby followers and freed through `004ea460` when the
last owner leaves. Route previews temporarily borrow/release references.

Order replacement plans first, then commits the new ownership; an unreachable
replacement keeps the existing browser order. Candidate tree/building queries do
not replace a follower's active route. Shared cancellation now clears native
route ownership across task release, person combat, casting/Blast interruption,
construction/training transitions, death/removal and victory handoff.

The **66 gameplay regressions** include two live shared-route followers, preview
reuse, unreachable replacement, one-owner cancellation, early native arrival,
exact final task arrival, replacement/death/casting cleanup and victory transfer.
The **4,096 native route availability/advancement comparisons** pass unchanged.
Real-browser QA verifies a right-click order holds a route while moving and drops
its routing record on arrival, followed by the existing celebration checks.

**Boundary:** these are persistent routing records, not full ordinary native
state/animation ownership. Position/velocity and exact final task arrival still
come from the browser controller. Full physics, collision recovery, ordinary
order queues/states, vehicle actions and full-map rendering remain unfinished.
The existing native ports are reused; the raw export count remains **646**.

### Projected sky reconstruction

The current manifest contains **652** raw exports. `app/sky.ts` ports the lens
transform/update (`00523720`, `00523830`), sampled UV grid (`00517310`), viewport
grid (`00517290`) and cloud commands (`00517420`). `004b60d0` identifies the
original textures. `scripts/import-original.py` now also requires
`data/skylens.dat`; source hashes remain in the asset provenance manifest.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-clouds.py /path/to/d3dpoptb.exe
node scripts/check-browser-sky.mjs
```

The CPU check executes all callees through the real triangle allocator: 128
updates, 4,992 triangles, exact coordinates/UV/color/flags and full motion-grid
hashes. The browser check requires a running local preview and covers both
visible layers, opaque-world occlusion, controls and viewport changes. Device
rasterization, original HUD offsets and full palette/clock scheduling remain
explicit integration boundaries; see the reverse-engineering log.

### Native terrain textures

The manifest now contains **657** exports. `app/terrain-texture.ts` reconstructs
`004bf860` indexed surface generation, the amplitude table from `004bd700` and
the lighting block of `004bdd40`. New exports also record initialization
(`00401040`, `00401790`) and dispatch (`004be330`).

```sh
.tools/decomp/oracle/bin/python scripts/check-native-terrain-texture.py /path/to/d3dpoptb.exe
node scripts/check-browser-terrain.mjs
```

The importer requires `pal0-c.dat`, `bigf0-c.dat`, `cliff0-c.dat`, `disp0-c.dat`
and `fade0-c.dat`, retaining original bytes and source hashes. The CPU check runs
256 native textures, 256 lighting blocks and 12 opening-map atlas comparisons,
plus incremental invalidation. The browser check casts Land Bridge and verifies
texture refresh after native terrain synchronization. Native raster/cache/LOD,
dynamic lighting and live fog/stain ownership remain open integration work.


### English HUD glyphs

`004fe270`'s English glyph selection/advance is used by `app/hud-font.ts` and
bitmap follower counts. `scripts/check-native-hud.py /path/to/d3dpoptb.exe`
compares 606 calls; only the final glyph raster consumer is supplied.
`node scripts/check-browser-hud.mjs` checks live desktop layout and controls.
See the reverse-engineering log for original artwork provenance and remaining
font, menu-ordering and hover-controller differences.


### Person selection indicator

`app/projection.ts` reconstructs `00469415`–`004694f2`, the selection-arrow branch
inside `004673b0`. `scripts/check-native-selection-indicator.py EXE` compares
1,024 native gate/rectangle cases, retaining the original sprite scaler.
`node scripts/check-browser-selection.mjs` checks the original arrow in GPU
pixels and across animation poses. Source VFRA dimensions and HFX 53 are retained
by `scripts/import-original.py`. Full native painter ordering remains open.

### Spell cursor artwork and warnings

`app/spell-casting.ts` reconstructs the standard spell-mode branch of `00524cf0`.
`scripts/check-native-spell-cursor.py EXE` compares 2,048 native sprite decisions
and offsets, with target/readiness queries and raster submission supplied.
`scripts/import-hud.py` imports POINT icons/range frames and HFX 589; spell
records come from `scripts/inspect-executable.py`. Run
`node scripts/check-browser-spell-cursor.mjs` for actual pointer/cast integration.
Other cursor modes, native outer-turn ownership and ground overlays remain open.

### Casting-range halo

`app/spell-halo.ts` reconstructs `00475a70`'s 85-particle loop and depth bucket.
Run `scripts/check-native-spell-halo.py EXE` for 256 native loop comparisons,
including actual native movement, terrain interpolation and queue allocation.
Only range and projection inputs are supplied. `scripts/import-original.py`
imports HFX 1466–1477, shadow 70 and AL0-derived tint; the browser check is
`node scripts/check-browser-spell-halo.mjs`. Native timer and complete painter
ownership remain open.

### Detached building faces

`app/building-debris.ts` reconstructs `00407860`'s collapse caller mode,
`00502460` initialization and `00502660` unattached-fragment updates. Shared
directed motion from `004e7a80` lives in `app/effect-motion.ts` and also serves
spell trails. `00470160` supplies the face/cap texture and rotation evidence;
the browser reuses its existing model transforms. `00513830` supplies water
impact animation and cue initialization. See the reverse-engineering log for
remaining lighting, scheduling, allocation and attachment boundaries.

Run `python scripts/check-native-building-debris.py EXE` for 300 native collapse
calls (9,755 faces), 8,192 flight snapshots and 128 splash initializations.
Run `node scripts/check-browser-building-debris.mjs` against the dev server for
live collapse, visible textured geometry, rotation, impact cues and removal.

## Scenery fire and object texture alpha

`app/scenery-fire.ts` reconstructs fire initialization (`004a6b20`), lifetime
selection (`004a8c60`), burning turns (`004a7170`), camera-facing geometry
(`004eebc0`) and the burning-tree branch (`004a7bd0` / `004a79f0`). Lightning's
first bolt turn (`00511ae0`) now ignites eligible scenery in its native cell.
Model 5 uses ANIBL record 1 from `data/anibl0-0.dat`: tiles
92, 93, 94, 95, 100, 101, 102, 103, 108. Tree fire grows to twice the base model
scale and lasts 76 turns; empty-cell Lightning fire starts at full size and lasts
24. Fire emits original effect-3 embers and effect-76 smoke before expiry.

`004b6e60` selects texture decoding through the table at `005d2910`.
`0042fb30` decodes flagged tiles through AL colors and four-bit opacity;
`0042f980` decodes ordinary indexed tiles. Treating every tile as an ordinary
palette index made flames green. The importer now decodes the entire object
atlas with the native selector; browser fire uses alpha blending. PNG channels
retain palette color precision and normalize four-bit opacity to 8 bits.
Device-specific color packing, filtering fringes and painter order remain open.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-scenery-fire.py /path/to/d3dpoptb.exe
node scripts/check-browser-scenery-fire.mjs
```

The native check executes terrain, initialization, lifetime, animation, shrink,
RNG and both pixel converters. It compares all 262,144 atlas texels, 128 fire
initializations/lifetime settings, 10,240 fire snapshots, 2,400 tree snapshots and
512 facing angles. Sound, allocation, sunlight, cleanup and replanting callbacks
are intercepted; camera geometry executes separately. The browser check casts
Lightning on an original tree and verifies textured GPU output, grounding,
scale, UV animation, rotation, sound request, smoke and cleanup.

Boundaries: allocation success and capacity, full class-5/mixed-class scheduling,
per-object facing stagger, native texture/painter ownership, visibility, sunlight,
propagation, sinking scenery and class-17 delayed replanting. Building ignition
is covered separately below.
Browser sound completion prevents duplicate crackle voices; the native voice
scheduler remains unported. These checks establish the described routines and
integration, not whole-frame or full-engine parity.

## Building ignition and structural fire damage

`00408cb0` gates ignition by model flags, current state and the building lock.
`00408840` supplies six rotated shape sockets, including nonzero entries after a
zero socket; the smoke selector's terminator does not apply. Each allocated flame
uses size+1, suppresses embers and lasts 135 turns. `00408ab0` decrements a signed
127-turn timer, evacuates occupants at 119 and removes 100 structural work at 79
before returning to repair state. The browser reuses the native work-stage and
smoke helpers instead of subtracting invented immediate Lightning building HP.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-fire.py /path/to/d3dpoptb.exe
node scripts/check-browser-building-fire.mjs
```

The native check compares 632 ignition/socket cases and 512 burn-phase cases,
including protection, repeated ignition, lock flags, allocation failure and signed
timer boundaries. Terrain executes natively; allocation, linked occupants, sound,
plan ownership and lifecycle callbacks are intercepted. Structural work arithmetic
and fire/smoke lifecycles have separate native checks. The browser check casts
Lightning on a hut and verifies five sockets, original mesh scale/grounding,
visible flames, delayed damaged geometry, smoke, cleanup and actual Web Audio
voice cancellation. The gameplay regression continues through evacuation and repair.

Boundaries: nearby-person panic and evacuated-person state-26 movement/animation,
sunlight, full plan allocation/removal, native repair scheduling, allocation limits
and mixed-class scheduling remain open. HP and construction progress remain browser
adapters around native structural work. Owned audio can be stopped explicitly;
native voice priority, entity-removal cancellation and complete ownership remain
unported. This does not establish full fire, construction or audio parity.

## Building-plan orientation and entrance arrows

`004b9190` marks an entrance cell independently of footprint bit 1, using the
signed outside-door coordinates shifted by three. The renderer queues this
0x800 cell even when its ordinary preview mask is zero (`0046d070`), selecting
tile 242 and its direction-dependent UVs (`00474ba0`). The plan uses the building
descriptor's object, which can differ from the current completed-building mesh.
`004aab80` command 0x7b increments the selected icon's stored direction, wraps
after three and plays cue 0x26. The live Space binding now uses that behavior.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-plan.py /path/to/d3dpoptb.exe
node scripts/check-browser-ground-overlay.mjs
```

The native check executes 632 preview traversals, covering every imported object
and quadrant, and 64 complete rotation commands with their sound arguments.
Preview validity/territory/capacity queries are supplied as successful; this
establishes geometry, not native validation. Existing native overlay and shape
checks cover arrow UVs, all neighbor masks and doorway routing geometry.

The browser check verifies visible arrow pixels, all four Space rotations without
pausing, invalid rejection, snapped placement, the rendered model's heading and
cancellation. Gameplay checks build huts through all four orientations and verify
builder entrance routes. `004b8f50`/`004b9150` and the remaining modes of `004b9190`
are preserved as evidence for later controller/allocation work. Exact per-cell
validity, territory limits, construction terrain changes and plan lifecycle remain
browser adapters; Space outside placement still uses the existing pause binding.

## Coastline diffuse shading and additive terrain light

`app/projection.ts:vertexLighting` reconstructs complete `0046c340`: packed ARGB
passes through, small numeric values become grayscale diffuse color, and values
above 32 also produce a clamped, tint-scaled specular channel. `004673b0` uses
warm tint 0xfdb935 for terrain; its open-water branch suppresses specular. The
browser previously applied diffuse only to open water, leaving coastal terrain
too bright beside it. Both surfaces now receive diffuse after output color
conversion, with additive light on terrain.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-vertex-lighting.py /path/to/d3dpoptb.exe
node scripts/check-browser-water.mjs
```

The native check executes 1,408 complete conversions without intercepted
consumers, covering all ordinary shade strengths, saturation, colored inputs and
arbitrary tints. `004e3bc0` enables D3D render state 29 (specular) for the textured
batch. `004f9380` writes RHW=1, consistent with the browser's existing affine
native projection; queue capacity and the complete hardware batch remain unported.

Browser checks compare the old coast-only omission against the corrected shader,
verify additive light from supplied terrain-light inputs, and confirm water has
no warm highlights. Wave motion/wrap/pause, shared coast heights and overview still
pass. A real Land Bridge cast still rebuilds terrain textures and geometry. The
lighting-input fixture does not establish native sunlight allocation, propagation
or timing; those systems and complete raster/filter/LOD behavior remain open.

## Scenery terrain shade

`00403c10` refreshes cells covered by the object's first shape (shape 1 when
that index is zero), independently of its heading. It sets the terrain dirty
flag, calls `00450d50` to recompute occupant shade, preserves the high slope
nibble and requests texture refresh around the original coarse anchor. The extra
arguments visible in scenery initializer/removal callers are unused by this
executable's routine.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-scenery-shadow.py /path/to/d3dpoptb.exe
node scripts/check-browser-scenery-fire.mjs
```

The native check executes the complete setter and actual shade consumer across
632 original object/heading/coordinate cases, including wrapped edges and the
fallback shape. Every terrain byte and texture request is compared; only the
texture regeneration consumer is intercepted. Existing building traversal and
shade checks still pass 632 and 4,096 cases. Scenery object IDs and flags now come
from the verified executable descriptor table via `inspect-executable.py`.

`syncLandscapeObjects` shares shade calculation between building footprints and
live tree insertion/removal. Shape-mask traversal is shared in `building-shapes.ts`.
The browser's existing terrain atlas invalidation renders the new shade; the
comparison measures 26,778 changed ground pixels and verifies that an actual
Lightning-burned tree clears its shade when removed. Native burn removal at the
wood threshold remains unchanged. Full scenery class registration, all scenery
objects and original texture scheduling still require integration.

## Person depth scaling and airborne shadows

`0046f080` queues body sprites with depth bias -300, or signed person morph byte
multiplied by 16 when flags3 bit 0x400 is set. `0046f850` samples original terrain
height and queues HFX22 (21 by 4 pixels) with bias -192. The painter uses one-based
bucket numbers; the linked-list array is zero-based. `spriteBucket` shares this
conversion with scaled HFX. The shaman path negates the body bucket.

`004673b0` at `0046acf6..0046c185` draws shadow types 15/16/25 from HFX22/71/70,
scaling dimensions as configured and placing the rectangle at x-width/2,
y-height+2. The two-pixel offset is not scaled. The person updater tail at
`004d3ce7` enables the shadow render flag only when flags4 bit 0x400 is set.
The live Blast adapter also exposes airborne state through lift; standing rings
were removed. Full native interpolation and person render ownership remain open.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-unit-shadows.py /path/to/d3dpoptb.exe
node scripts/check-browser-unit-shadows.mjs
```

The native check covers 512 body/shadow queues with zero velocity and supplied
projection output, 1,024 shadow painter rectangles using native sprite scaling,
and 512 person-tail shadow gates. Ground sampling executes in the original;
final draw submission is intercepted. Queue rejection tests vary projected screen
Y independently of clip bits: disassembly shows the queue checks screen Y's float
sign, not the point's clip-flags field. These checks do not establish full velocity
interpolation, mixed painter ordering or all object-class shadow ownership.
`004741b0` is retained as traced terrain-render evidence, not a person-shadow port.

The browser check casts real Blast, verifies original shadow atlas data and visible
GPU pixels below the flying person, then confirms removal on landing. It also
checks varying body depth buckets. Selection-arrow and halo regressions pass with
the corrected one-based painter bucket used for their scaling.

## Original model sunlight and distance shading

`app/model-lighting.ts` reconstructs the primary 1,024-entry normal shade table
from `00401790`, using default parameters assigned by `00401040`. It reuses the
original sine/angle tables and fixed-point transforms. `0040cd00` quantizes a
face cross product to two five-bit angles. Original face records at +4 select
computed normals or the four heading records at +0x30; the importer retains these
records instead of deriving substitute geometric normals.

Complete model renderer `004708d0` transforms vertices, updates face normals and
looks up sunlight. Construction renderer `00471c40` shares those rules while
selecting stage faces. `004718c0` and `00471a80` attenuate numeric shade using the
first triangle vertex's camera Z, starting after -3328 with truncation toward
zero and a minimum of one. Quad triangles share the same first vertex. The model
shader uses that raw anchor and existing integer camera/model bases, then applies
native diffuse and warm additive color after output color conversion.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-model-lighting.py /path/to/d3dpoptb.exe
node scripts/check-browser-model-lighting.mjs
```

Checks execute 33 complete primary sunlight tables (33,792 entries), 4,096 normal
calculations, 450 complete ordinary model renderer calls and 1,024 complete
triangle queues. The model fixture supplies collinear projection to suppress
raster emission, then compares each drawable face's real updated normal/shade; transforms,
normal calculation and sunlight remain native. The separate queue fixture supplies
projected vertices and compares all three emitted colors, including colored bypass
and fade boundaries. This does not verify full original clipping/painter order.
The existing 2,096 construction face/cap-UV comparisons still pass.

Browser checks validate all 41 opening model shade/anchor attributes, live rotation
and size refresh, reused attribute buffers and six real GPU diffuse/additive/fade
colors. Native model geometry is owned per instance so lighting, fire texture
phases and vault morphs cannot overwrite another object's data. Projection shader
preparation now preserves existing material hooks and their program cache keys.
The live scene uses default sunlight; dynamic sunlight ownership/propagation,
secondary shade-table consumers, colored selection overrides, debris lighting and
all alternate model transformation modes remain unfinished.

The painter's texture mode 0 bypasses triangle submission and continues only into
selection/picking bookkeeping (`004673b0`, label `0046995d_caseD_0`). The importer
therefore omits these non-drawing faces from raster meshes: model 5 keeps its eight
visible fire faces and drops twelve picking faces. Other currently imported models
have no mode-0 faces. Native full-renderer comparisons filter the same explicit
mode; complete native picking ownership remains open.

## Hovered model color overrides

`modelHighlight` reconstructs the eligibility and color branches in `004708d0`
and `00471c40`. The ordinary renderer permits owned/neutral objects, class 4,
class-6 model 8, accessible enemy buildings (building flags bit 0x10), or the
all-tribe targeting flag. Owned class-6 model 8 is excluded. Construction omits
the two class exceptions. `0040bac0` confirms the building flag test. Selected
hover IDs and global enable flags are separate caller-owned inputs.

The color is 0xffc8c8c8 or 0xffffffff. `004a4450` at `004a470b..004a472d` refreshes
the phase from unsigned simulation turn / 2 & 1. The shader uses this packed
color's gray component instead of sunlight/depth shade, with no additive channel.
Native lighting attributes remain unchanged as the hover uniform changes.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-model-highlight.py /path/to/d3dpoptb.exe
node scripts/check-browser-model-highlight.mjs
node scripts/check-browser-model-lighting.mjs
```

The fixture runs 512 complete ordinary/construction renderer calls with original
model data, transforms, sunlight, building-access test and real polygon queues.
A single visible triangle and supplied projection isolate the color branch; all
three emitted colors agree. Another 256 calls execute the native phase-update
loop, including unsigned wrap boundaries. Native picking, culling and the entire
presentation loop are not supplied by this fixture.

The browser connects its existing building/shrine picker and object descriptors
to the verified rules. Hover refresh now shares pointer/view invalidation with
placement targeting, including input mode, buttons and simulation changes. This
fixes stale highlights/tooltips after camera movement without mouse movement.
Real browser checks cover neutral heads, enemy/owned buildings and construction,
press/release, spell mode, leaving the canvas and camera movement. Eight GPU
lighting samples verify both overrides bypass light/fade math. Full original
picking ownership and the modal/all-tribe controller in `0046e030` remain adapters;
`00451370` is retained as evidence for that controller's input-state gate.


## Original person sprite layers and regression coverage

`0045efd0`, `0045f4a0` and `0045f9d0` walk VELE layers for no-tribe,
tribe and person-variant draws. `app/sprite-layers.ts` selects those layers,
mirrors their signed offsets before scaling, and scales each rectangle separately.
The importer now keeps original HSPR pieces in `unit-layers.png`, with an explicit
atlas name in the metadata. It no longer bakes clothing/weapons into body frames
or drops the standing shadow (type 0, variant 1). Renaming the atlas prevents
old complete-frame textures being paired with the new piece layout in caches.
Loaded VFRA draw records have a six-byte stride; file records are eight bytes.

Draw flag 2 suppresses the standing layer; the person painter derives it from
render flags `0xa000`. Draw flag 4 contributes low sprite flag 8; mirroring XORs
low flag 1. Original descriptors provide the person/variant values. Live flight
also suppresses the standing layer while the existing HFX22 shadow stays grounded.
Death effects share the layer renderer. Picking uses visible layer bounds; the
selection arrow still uses the independent VFRA header height.

`005162e0` / `00516430` normally submit white sprite tint. The model distance
lighting must not be applied to ordinary people. `004f95a0` records low layer
flags; flag 4 alone does not select its ghost/palette blend branch. Ghost palette
flag 8, alternate high-resolution UI draw mode 2, exact mixed-object painter
ordering, original picking ownership and complete action scheduling remain open.
The scene currently renders ordinary opaque HSPR artwork for those blend cases.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-sprite-layers.py /path/to/d3dpoptb.exe
npm run test:sprites # development server required
```

The native check executes 6,648 complete renderer calls across every imported
frame, three owner modes, mirrored/unmirrored flags, descriptor variants, signed
depth buckets and camera scales. Only final sprite submissions are intercepted;
original layer selection and scaling execute. All 2,672 atlas pieces are compared
byte-for-byte with the source RGBA. A separate 336-pose fixture covers the seven
imported tribe/class combinations, eight directions and idle/walk/work/attack/
airborne/death poses. Tests pin its atlas hash and frame identities. Regenerate
with `--record` only after reviewing original-engine and asset comparisons.

The browser checks actual scaled layer rectangles against native submissions and
compares 82,780 coloured GPU pixels at 1:1 resolution (RGB rounding tolerance 1).
Native-resolution comparison avoids driver-dependent nearest-sampling decisions
at scaled texel boundaries; it does not certify bit-identical scaled rasterization.
A deliberate wrong-atlas UV mutation was rejected by this check. Existing live
selection and real Blast shadow/landing checks also pass. Broader animation-state
ownership and all original tribes/classes are not certified by these fixtures.


## Focus commands preserve the current camera

The live minimap, shaman portrait, tribe flag and F/settlement focus commands now
use `00417ca0` through `requestCameraFocus`, then the existing `00417d80` planner
and `00418270` mover. The negative target angle preserves heading. Focus does not
reset the camera's zoom: neither request branch writes the view configuration.
The immediate branch is retained for initial view setup; ordinary UI commands
request the original acceleration/cruise/braking journey. Duplicate requests,
retargeting and 16-bit wrap use the same motion state as result-camera sequences.

`0047c350` records a selected-person focus path with angle -1 and immediate=0;
`004aab80` case 0x59 and `0047b460` record other ordinary focus requests. The
mouse-control routine `004adbb0` cancels camera motion when drag modes take over.
Only these reviewed branches are evidence; complete modal/command routing is
not reconstructed by the browser's current control bindings. The exported
`00418950`, `00417510`, `00417b70`, `00417c40` are reference for remaining native
view-mode/zoom/turn transitions, not new port-completion claims.

`scripts/check-native-camera-motion.py EXE` now adds 1,024 complete focus requests
and 5,120 subsequent motion steps. The original request/planner/mover execute;
globe refresh and interaction-cleanup calls are intercepted. Camera fields, every
motion-planner field, render flags, water invalidation and consumer event order
match immediate, duplicate and retargeted/wrapped requests. Existing 256 journeys
(7,921 steps), 256 result initiations and 12,288 composed result-controller frames
also pass after simplifying the readable TS planner's thresholds and counters.

`node scripts/check-browser-camera-focus.mjs` exercises real portrait/tribe/F and
minimap controls. It checks intermediate motion, preserved heading/zoom, target
arrival, retargeting, spell-target cleanup, keyboard/mouse takeover, paused and
world-seam travel, and Enter during a journey. Shared scene motion fields were
renamed from result-only names. Camera keys remain usable with a HUD button
focused, while editable controls and dialogs retain their keyboard behavior.

Presentation still uses the existing 24 Hz adapter. Full native frame throttling,
keyboard/edge-scroll speed, command/modal ownership, minimap coordinates/coverage
and overview projection/transitions remain unfinished. Flyby regression selectors
were updated to inspect the current camera and follower selection; removed world
buttons and old selected CSS classes are no longer treated as the UI contract.

## Native desktop camera input

`app/camera-input.ts` reconstructs the movement and velocity outputs of complete
`004424b0` keyboard processing and `00442880` / `00442920` / `004429c0` mouse axes.
`004adbb0` modes 1/2 supply their order: pan forwards then sideways at 12 native
units per pixel, or rotate by horizontal pixels alone. Vertical rotation drag no
longer pans. Keyboard speed is 7,680 units / max(20, frame rate), rotation is
640 / max(20, frame rate), truncated to signed shorts; fast-pan bit 0x40 quadruples
pan speed. Opposing bits have native precedence, and rotation precedes both pan
axes. Optional fixed-point input scaling and momentum retention preserve signed
multiplication, truncation and 16-bit wrapping.

Momentum lives at `008926c7`/`c9`/`cb`. Its enable bit is at **00895da4 bit 0x400**,
not the identically named metadata global at 0089c66d. Retention is
clamp(short at 00895dad * 8 + 120, 0, 255). `00417c00` and `00419a60` stop constant
turn/follow modes; they do not cancel a focus journey. `004424b0` cancels the
focus mover on pan input; `004adbb0` does so on either drag mode. These distinctions
are retained in the scene adapter. Full follow-mode/interaction ownership is open.

```
.tools/decomp/oracle/bin/python scripts/check-native-camera-input.py /path/to/d3dpoptb.exe
node scripts/check-browser-camera-input.mjs # development server required
```

The CPU check runs 8,192 complete keyboard calls and 6,153 complete drag-axis calls
in 256 mixed 48-step sequences. It compares camera positions/headings and all
three momentum fields after every call, including all button bytes, opposing keys,
fast diagonals, wrapped seams, low/high frame rates, signed scaling, clamped
retention and decay-only frames. Only globe-texture notifications and interaction
cleanup are intercepted; their complete UI/cache effects are **not** certified.

The browser check uses real DOM key and pointer events, eight camera outputs
captured from the original keyboard routine, and deterministic presentation steps.
It covers Q/E, WASD/arrows, simultaneous/opposing keys, render-rate independence,
release without drift, paused/locked controls, a focused HUD button, focus
interruption, rotated panning and horizontal/vertical mouse dragging. The existing
focus, projection and opening-tour checks remain part of the regression workflow.

The scene uses the existing **24 Hz, momentum-off** presentation adapter. Native
momentum/scaling math is compared but the original settings UI, persisted defaults,
fast-pan binding, pointer sampling cadence, edge-scroll mapping and full command
ownership are not integrated. This is not full camera parity. Original movement
is shared with focus journeys through `movePosition`; the obsolete floating-point
scene pan path was removed. Camera capture is shared and keeps unsigned X/Y
without unnecessarily sampling terrain height. The octant-angle helper is now
three readable reflections instead of nested ternaries; original journey/planner
comparisons still pass.

### Texture filtering and encoded palette colors, 2026-09-08

Complete `0047cc60` initialization sets D3D texture min/mag states 17/18 to
nearest (1) or bilinear (2). Complete `0047d6f0` changes both on draw flag 0x20,
except global-filter mode `ui_struct+0x640 == 1`, which keeps the initial choice.
These paths select no mip filtering or anisotropy. The comparison intercepts
only COM material-handle/render-state calls: six initializations and 4,096 state
transitions execute in the supplied binary. Additional exports `005166c0`,
`00517100` and `005171d0` retain investigation evidence, not completed ports.

```
.tools/decomp/oracle/bin/python scripts/check-native-texture-filter.py /path/to/d3dpoptb.exe
node scripts/check-browser-texture-filter.mjs # development server required
```

Ordinary model and cloud textures previously inherited Three's mipmap/anisotropic
defaults. They now use bilinear sampling without mipmaps; terrain/water already
selected bilinear. All five material paths sample encoded palette bytes before
lighting. Standard Three model materials decode after sampling to enter its
linear material pipeline; output conversion then restores the sampled color
before the existing native lighting hook. Custom ground/cloud shaders use the
encoded sample directly. Unit/effect/selection point sampling is retained.

Encoded-color filtering follows the legacy API interpretation, not a captured
native GPU oracle. Microsoft's [gamma documentation](https://learn.microsoft.com/en-us/windows/win32/direct3d9/gamma)
describes the later explicit sRGB read/write facilities; its
[linear filtering documentation](https://learn.microsoft.com/en-us/windows/win32/direct3d9/linear-texture-filtering)
describes weighted bilinear samples. The native state check proves state selection,
not original hardware rasterization. The browser check verifies live sampler
settings and 80 RGB outputs using 2×2 original-palette calibration textures in
the actual model, terrain, water and two cloud materials. Canvas2D readback of
translucent PNGs is unsuitable as an exact oracle because premultiplication can
alter their RGB; direct palette calibration avoids that conversion.

Full graphics settings and batch-to-sampler ownership, UV/padding conventions,
texture cache/LOD, legacy pixel formats/dithering, clipping, painter ordering and
matched original frames remain open. The raster checkpoint stays partial.

### Ordinary camera view switches, 2026-09-08

`00479f00` command 15 chooses close (preset 3), normal (0), bird's-eye (2),
then world (4), with no change past either endpoint. The supplied original's
`004aab80` commands 0x2a/0x2b route inward/outward requests here. The archived
[Bullfrog beta 3.1 keycard](https://ts.popre.net/archive/Downloads/Docs/poptbfinalkeycard3.1.pdf)
lists = / − for zoom and Return for world view; that document is supporting
input evidence, not proof of this binary's entire binding table.

`004174b0` computes an even three-quarter-frame-rate timer, clamps its signed-byte
value to 8..32, then optionally applies fixed-point timing scale. `00417510`
approaches the target configuration with truncating integer divisions. Most
fields use remaining−1; screen offsets begin a frame later and use remaining.
The last frame copies the target preset. Scaled sprites are enabled throughout
a transition if either endpoint requires them; circular bounds and diameter 50
apply until the final preset's bounds are restored. `app/camera-view.ts` handles
these rendered fields with readable names and a single transition step.

```
.tools/decomp/oracle/bin/python scripts/check-native-camera-view.py /path/to/d3dpoptb.exe
node scripts/check-browser-camera-view.mjs # development server required
```

The CPU check executes complete timer/command/transition routines: 60 timing
cases, ten zoom commands and 180 view journeys / 3,480 frames across all ten
resolution tables. It compares 13 rendering fields after every frame. Renderer
notifications, surface offsets, bound-cache generation and the overview dispatcher
are intercepted; those effects and unused configuration bytes are not certified.
The renderer uses existing CPU/GPU-compared transforms and bounds. The transient
polygon coordinates are not copied while circular bounds are active.

Browser = / − keys and menu controls now request presets instead of arbitrary
continuous zoom. Wheel direction is a browser convenience mapped to the same
commands, not a recovered original wheel-event policy. The existing 24 Hz
presentation clock gives 18-frame ordinary transitions. Browser checks cover
actual input, full endpoint configurations, retargeting without snapping,
pause/lock, resize, menu controls and returning from overview. Focus checks now
assert preservation of the selected preset, rather than the removed continuous
manual-zoom value. Flyby interpolation remains separate.

The other continuous zoom routine, `004b43f0`, is called by replay handling
`004b3920` under opened-files flag 0x10. Its export is retained as investigation
evidence; it was not substituted for ordinary view commands. Full native world
view rendering/transition and heading restoration, event sampling, settings,
timing ownership and all key bindings remain open. Camera parity stays partial.

### Desktop navigation and screen-edge scrolling, 2026-09-08

`004891d0` builds keyboard bindings from 12-byte records beginning at `005d5de8`.
The first twelve records call `004ae200`: up/down arrows and keypad 8/2 request
forward/back; Delete/Page Down request sideways motion; left/right arrows request
rotation. Keypad 4/6 and 7/9 use fixed-direction aliases 199..202. The archived
keycard linked above independently describes arrows, Ctrl and screen-edge scrolling.

Complete `004ae200` swaps commands 3/4 with 5/6 for Ctrl and again for setting
bit `level_flags & 0x200000`; two swaps cancel. Fixed aliases bypass that swap.
Shift adds fast-pan bit 0x40 to pan commands, not rotation. Setting bit 0x80000
reverses rotation, and world-view rotation commands become sideways requests.
The settings getters `004999a0` / `00499a10` execute in the native comparison.
Second-key-state bytes gate modifiers; their complete lifecycle is not ported.

`00479dd0` merges type-2 requests by OR, also adding 0x40 when a bit is requested
twice. Thus a direction key combined with the matching screen edge pans fast.
`004adbb0` emits edge requests at x/y < 1 or >= screen width/height − 1, including
the sidebar and corners. It gates these on land flag 0x80000, level flag
0x80000000, drag mode and the UI-lock bit returned by `00451370(2)`.

```
.tools/decomp/oracle/bin/python scripts/check-native-navigation.py /path/to/d3dpoptb.exe
node scripts/check-browser-navigation.mjs # development server required
```

The comparison executes 1,920 complete navigation commands, 2,560 complete
type-2 accumulations and 882 complete pointer handlers, with actual keyboard
table assertions. The mouse-coordinate provider and unrelated UI/drag consumers
are intercepted in the pointer check; emitted navigation requests and their
gates are the compared scope. Existing complete keyboard/drag movement checks
still cover 8,192 / 6,153 calls after these requests reach the shared movement code.

Browser input now uses original arrows, Ctrl, Shift, Delete/Page Down and keypad
navigation. WASD/QE remain convenience aliases. Keypad 2 no longer also selects
Land Bridge. Modifiers affect already-held arrows. Pointer tracking covers the
whole client area, clears on leave/blur/cancellation and suppresses scrolling
during rotation/pan drags, modal dialogs, input locks and overview. DOM checks
cover actual keys/pointers, edge corners and the non-scrolling sidebar/canvas
seam, duplicate fast pan, release, pause and modal/drag/window gates.

The original world-view navigation/rendering, settings UI, complete key-state
ownership and native frame/event sampling remain open. The desktop adapter
still runs at 24 Hz with momentum off; full camera parity is not claimed.

### Native world overview: projection, terrain and stars

The original world view is a wrapped planar map projected into a disc, not a
latitude/longitude sphere. `0041cee0` sets a screen radius of `height*4/10` and a
native map radius of 20,480 (40 cells). `0042d180`, `0042daa0` and `0042dae0` supply
setup, strict signed-short circular visibility and integer screen coordinates.
The projection gain is `80*screenRadius`; native map deltas divided by 512 use
`gain/(dx²+dy²+1600)`. X uses the unstored division result, while Y reloads its
float32 store; both products are stored as float32 and converted with nearest-even
`fistp`. The isolated oracle uses the existing 53-bit x87 comparison convention.
`0042de90` supplies the inverse near-half projection. The browser returns the
camera center at the inverse's zero-distance singularity; native int32 overflow
there disappears after conversion to wrapped map coordinates.

`00462e60` initializes trailing-zero ranks; `00462ea0` marks both adaptive parents.
`0042d940` marks the coarse four-cell grid, an 80-step perimeter and the original
10×10 detail patch offset (+10,-10). `0042ea10` alternates diagonals in both axes,
culls coarse triangles and invokes recursive `0042df80`. Its software submission
contains projected vertices, fixed UVs and globe-only lighting: curved sunlight,
edge brightening and a fourth-power highlight. The TypeScript uses named map
points and shared math, with raw addresses/types confined to these records.

`004bee20` generates 8×8 indexed tiles, sampling the detail bank every fourth
pixel and adding `detail>>2` to interpolated brightness. Ground tiles instead
use the difference between adjacent detail values. Both paths now share
`terrainTile`; atlas reconstruction remains incremental. The displacement table
simplifies exactly to `clamp(level*3-64,320,1024)`. Native cliff remapping and the
original palette remain intact. The browser repacks globe tiles into a 1024²
atlas; native cache rectangles, UV/filter padding and fade tiles are still open.

`0042edb0` generates 1,000 candidates from seed 123456789 with its own LCG and
sixteen parallax layers. `0042dbf0` projects the short-coordinate star field;
`0042d060` updates offsets. Actual captured D3D POINTLIST submissions confirm
that the native stream includes its initialized first vertex and omits the final
generated visible star. Native palette colors, order and count are preserved.
WebGL point centers receive a half-pixel offset to occupy the requested pixel.

`0042adc0` resolves the original marker outline/tree/wild colors against the
opening palette; tribe colors come from `0059bc19`. `0041e5b0` and `0041f680`
identify person/scenery glyphs. `0041d730` selects the original HFX building,
occupant and discovery icons and reduces their size near the rim; these assets
are imported with the HUD decoder. Canvas supplies the current marker rasterizer.
Full native selection flags, queue order, eligibility, dynamic palettes,
colored building footprints (`0041edb0`), garrison/reincarnation icon ownership,
overview spell effects and all classes remain open.

Validation:

```sh
python scripts/check-native-globe.py /path/to/d3dpoptb.exe
python scripts/check-native-terrain-texture.py /path/to/d3dpoptb.exe
node --test tests/globe.test.mjs
node scripts/check-browser-globe.mjs
```

The native check covers 4,096 projection/visibility pairs, 2,048 inverse picks,
18,532 complete adaptive triangles and their vertex shades, 4,176 star positions,
16 actual D3D star submissions, the complete initial marker palette resolver,
512 active-drag updates and 512 parallax updates. Add `--record` only to
intentionally regenerate portable mesh fixtures from native submissions after
all comparisons pass. `npm test` compares these fixtures without requiring the
executable. The texture check covers 256 ground and 256 globe tiles (278,528
indexed pixels), plus cell lighting, fog/stains and existing atlas regressions.

Browser checks exercise world entry/return, actual GPU terrain/marker/star pixels,
wrapped inverse picking, arrows, cumulative right drag, parallax, resize and
preserved ground bearing. Existing sprite, camera-view/navigation, HUD, ground
terrain and real building-fire checks pass. Ordinary rendering/effects live in
one hidden ground group during overview and restore on return. FX detach from
their actual parent when expired. OrbitControls and the cloudy sphere are removed.
The 24 Hz keyboard adapter, active-drag-only pointer adapter, immediate world
entry/exit, complete globe transition/rotation restoration, native outer-loop
ownership and original frame raster comparisons remain incomplete. Camera and
raster checkpoints remain partial; this is not full overview or engine parity.


## Overview building footprints and icon ownership

`0041edb0` evaluates seen cells, placement/plan flags and building ownership.
Flag `0x80` takes precedence; `0x100` alternates its fill with palette index 23
on odd presentation-counter ticks. Building flag `0x200` consults `004f1280`,
including its enemy concealment mask, and marks object flag bit 1 for icon drawing.
Flag `0x400` colors the cell without marking that icon flag. The visible cell,
not necessarily the building center, determines eligibility. The complete icon
controller also checks the building anchor's seen bit when fog is enabled.

`0042d390`/`0042d5b0` project A/B/C/D cell corners through `0042dd50`, reject
native signed winding failures and submit an untextured quad. Outside corners
use the native rim clamp, including its positive-Y branch. Icon eligibility is
set before winding rejection. Translucent fills resolve the original AL table's
maximum-alpha color and submit alpha `(nibble << 4)`, so tribe fills use 48/255.
`import-hud.py` now retains those 16 color indices and the AL source hash.

`0041d730` selects hut HFX by model plus owner-only signed occupant count, tower
HFX by the last recognized live native slot, and the remaining building models
by their original table. It measures edge scaling from the unscaled icon's
top-left corner. The browser shares selection and rectangle math; native sizing
matches at heights 480/600/768. A deliberate desktop extension keeps the scale
numerator wide: at height 1000 the native signed shift can overflow and collapse
an otherwise 20x19 tower icon to 2x2. Browser sizing avoids that discontinuity.

Run:

```sh
python scripts/check-native-globe-footprints.py /path/to/d3dpoptb.exe
node scripts/check-browser-globe-footprints.mjs
```

The oracle executes 3,072 cell projections and 4,096 complete footprint calls,
including the building predicate, projection, winding and both quad emitters.
Only the final D3D queue leaf is captured; vertices, RGBA, flags and icon marking
are compared. It then runs 384 complete marker controllers with empty unrelated
tribe/map lists and one allocated building, intercepting only the two final HFX
sprite-submission leaves. Original HFX dimensions and tower capacity are retained.
The viewport has no sidebar, matching the browser's renderer coordinate space.

Browser checks compare actual canvas calls and 6,181 alpha-48 pixels from 36
opening footprint quads, shared icon eligibility, live relocation/destruction,
brave/warrior/shaman/empty tower symbols and unseen-anchor suppression. The
existing overview test also verifies 8,863 marker GPU pixels, terrain/stars and
actual desktop controls. Screenshot: `/private/tmp/populous-globe-footprints-v104.png`.

The live cell concealment byte has no owner yet; it is explicitly supplied as
zero. Native plan/placement producers, nonbuilding occupants, all-tribe object
flags, complete marker ordering/rasterization and overview effects remain open.
The plan blink currently receives the browser world turn, not the original
independent presentation counter. This is a bounded visible integration, not
complete marker or camera parity. Four new export hashes bring the manifest to
827 entries without changing earlier snapshots.


## Overview drag sampling and persistent release motion

`0042d1f0` grabs only when the original inverse globe projection succeeds. It
records the pointer and map origin, activates dragging and zeros both velocities.
A failed grab leaves all motion fields intact. `0042d380` only clears the active
flag; it does not stop movement. The complete `0042d240` samples the latest
pointer once per draw: active motion derives its position from total displacement
since the press, computes the delta from the preceding native integer position,
and clamps each velocity to the configured maximum (2048 in the original callers).
A stationary sampled frame therefore zeros velocity. The released branch adds
the retained velocity with int32 wrapping on every call, without friction.
Both branches update all sixteen star layers from the clamped velocity, not
necessarily the full map displacement.

The caller `0041ce30` routes press/release flags and alternate controls. The
browser still adapts right/middle buttons and its own modal/input gates; full
native modifier/configuration ownership is not claimed. `0041ef30` routes
keyboard map movement through `0042d060`, resetting the drag velocities. The
existing keyboard integration now does the same. `0042d160` only sets overlay
style fields; `0042d870` updates a separate cell-selection region. Neither is
friction. Those exploratory exports are retained without claiming their complete
browser integration. The manifest now contains 831 byte-identified exports.

`GlobeMotion` holds the continuous native position independently of wrapped
browser coordinates. This prevents a world-seam crossing from inventing a large
next-frame velocity. `GlobeRenderer.moveStars` records consumed motion and accepts
the native clamped delta, so implicit camera refreshes do not count it twice.
Multiple presentation steps before a render retain their individual integer
parallax rounding. Existing terrain/icon rendering remains unchanged.

```sh
python scripts/check-native-globe.py /path/to/d3dpoptb.exe
node --test tests/globe.test.mjs
node scripts/check-browser-globe-motion.mjs
```

The native check now adds 128 thirteen-step pointer sequences: 1,664 complete
snapshots of map position, press/origin, active flag, velocity and 32 star offsets.
The actual press, update and release routines execute without hooks. Cases cover
wrapped centers, multiple resolutions, clamping, stationary samples, release
glide and rejected off-disc grabs. `--record` retains eight compared sequences
as portable native hashes alongside the existing mesh captures.

Actual browser checks cover sampled right/middle drags, seam crossing, clamped
flicks, persistent glide, per-tick star movement, holding still, black-space
rejection, keyboard takeover, input/modal/blur gates and clean ground/world
reentry. Existing world view, navigation, camera input/preset and sprite/shadow/
selection regressions pass. The regular suite has 76 tests. Rendering still uses
the existing 24 Hz presentation adapter; full original outer-loop/input timing,
all press modes, transition lifecycle and matched original frames remain open.
Browser cancellation on blur/pointer cancellation is an explicit platform adapter.

## Overview spell range and projectile trails

`0041d730` calls `0041f370` for the active shaman spell range before building
footprints and markers. Its 32-point circle uses `0049bb20` integer polar offsets,
signed wrapped coordinates, and keeps a segment if either endpoint is visible.
`00516500` submits the same ceil-rounded quad strips already used by Lightning;
the shared TypeScript helper is now named `lineQuad`. Alpha is
`((sin[phase & 2047] << 6) >> 16) + 128`. Complete `0041ebf0` advances the phase
by the unsigned sky tick counter shifted right four on every overview draw.
The browser shares that counter with the sky, so the ring pulses while simulation
is paused. Ground-view sprite-halo phase does not advance in overview.

`0041deb0` queues class-7 models 3, 4 and 10 for the HFX branch of `0041e5b0`.
Object flag 16 and flags4 bit 0x20000 suppress drawing. Nonowned objects require
a seen cell when fog is active; owned effects are exempt. The visited cell's
origin controls outer globe visibility. Native Blast head/projectile class 6,
Blast impact model 38 and Lightning flash model 42 are absent from this queue;
showing every ground effect in overview would therefore be incorrect.

The HFX painter adds `f1 >> 2` only when the descriptor's **hold** byte exceeds
one; it skips frame 0x650. Unlike building icons, these sprites retain their
original pixel dimensions and bottom-center anchor even near the rim.
Palette bytes below -15 draw untinted; 15 aliases zero and values >=16 suppress
drawing. `00516270` obtains the vertex tint from `AL[palette*4096 + 0x2f82]`,
then the opening palette. This differs from the building-footprint alpha lookup.
The HUD importer now retains all thirteen in-file sprite tint indices; the
renderer caches tinted crops of the existing effect atlas. Actual original
animation descriptors use only 240, 0, 7 and 15. Other out-of-file AL pointers
are deliberately not interpreted without their native runtime ownership.

`0050c410` initializes model-10 art; `004bb440` assigns HFX1124–1127 to the four
attached Blast tails. The head is HFX1123 and remains omitted from overview.
`shotVisual` now retains the casting tribe for all original spell trails, giving
the overview fog gate its owner. Existing ground rendering and effect lifetimes
continue through the same simulation objects.

```sh
python scripts/check-native-globe-effects.py /path/to/d3dpoptb.exe
node scripts/check-browser-globe-effects.mjs
```

The oracle executes 256 complete native circle controllers through final D3D
strips, 256 viewport/phase updates (only backend leaves supplied), and 512 complete
effect-cell queues through the HFX painter. Original HFX dimensions and palette
bytes are loaded from the supplied game. Cases cover wrapped/rim positions,
resolutions, animation hold/frame, hidden flags, class/model selection, ownership,
fog, sentinel and palette branches. The isolated queue receives an already
visited cell; it does not pretend to execute the outer globe scan.

Browser checks cover 32 actual range strips, 1,523 contributed GPU pixels, paused
pulse, selected/hover priority, Escape/input gates and ground-halo return. A real
Blast cast contributes 316 trail pixels and exercises attached AL-tinted tails,
owner propagation, fog/hidden gates and cleanup. Captures are
`/private/tmp/populous-globe-range-v106.png` and
`/private/tmp/populous-globe-trails-v106.png`.

Complete mixed-class allocation/painter ordering, concealment-byte ownership,
all globe effect/circle/auxiliary-marker classes and tower coverage fans remain
open. Neutral fire-ember ownership still uses the browser adapter. The exported
`0041e3d0`, `0041e460`, `0041e4e0`, `0041efb0` and `0041f160` describe additional
queues/fans but are not claimed as integrated. Ten new hashes bring the manifest
to 841 exports without changing earlier snapshots. These bounded additions do
not complete overview or whole-frame raster parity.

## Ground/world transition and projection morph

`00418890` requests overview entry or return. `00418950` first changes the ground
view to original preset 4 and turns the camera toward zero using the saved
bearing; the ground transition reaches its last frame before `0041d410` starts
the globe morph. Return uses `0041d450`, finishes the globe morph, then restores
the saved ground preset/bearing through the same ground-view transition. Native
zoom-in explicitly replaces the saved preset with bird's-eye; the overview toggle
returns to the saved preset. The browser now follows this two-stage order instead
of instantly switching renderers. Explicit focus, introductory flyby and result
camera requests cancel the ordinary view sequence.

`GlobeMorph` in `app/camera-view.ts` ports `0041d410`, `0041d450` and `0041d680`.
Entry starts at 256 (flat), targets zero and uses truncating fixed-point increments.
Return starts from the current value and ignores requests during an active morph.
The original six-frame duration includes its initial frame: entry values are
256,214,171,129,86,43,0; return values are 0,42,85,127,170,213,256. The completion
call snaps the endpoint and requests the next draw mode. Native `0041ce00` sets
the initial duration to six. Recentring through `0041d2e0` can change duration and
translate the center; that separate globe-focus path remains unintegrated.

`0042dae0` interpolates projected X/Y toward the original flat callbacks before
inverting screen Y. `0041d1e0` uses 21 pixels per native cell on entry; `0041d260`
uses 18 on return. `0042dd50` shares the interpolation but its outside-cell rim
branch does not invert Y. The shared `blendGlobePoint` preserves that distinction.
`0042de90` rejects inverse picks whenever the blend is nonzero. Both the render
view and marker/effect drawing now consume the same blend and callback scale.
`0042df80` blends the native fixed shade toward 0x200000. Its invalid floating
conversion becomes an integer lower-clamp case, keeping transitional off-disc
vertices finite. Terrain topology and star projection remain native and unchanged.

```sh
python scripts/check-native-globe-transition.py /path/to/d3dpoptb.exe
python scripts/check-native-globe-transition.py /path/to/d3dpoptb.exe --record
python scripts/check-native-camera-view.py /path/to/d3dpoptb.exe
node --test tests/globe.test.mjs
node scripts/check-browser-globe-transition.mjs
```

The new oracle compares 1,344 complete blended interior/rim projection and picking
cases, 93,240 native mesh triangles with final projected coordinates and lighting,
and 100 complete morph starts/lifetimes including ignored return requests. Only
sidebar width, final triangle submissions and final draw-mode notification are
supplied. Both original flat callbacks and native interpolation execute. The
portable globe fixture retains 24 compared morph meshes and ten native lifetimes;
existing captures remain intact. Ground-view comparisons now include preset 4
in both directions: 360 transitions, 6,960 frames and thirteen rendered fields
across all ten original resolutions.

The actual browser test inspects both stages, integer rotation, intermediate
mesh vertices, pause and input gates, rejected morph picks, Enter toggle versus
zoom return, original endpoint values, restored bearing and focus interruption.
Existing world-view, motion, camera-preset, spell-range/trail and footprint checks
wait for this real transition instead of assuming an immediate renderer switch.
Captures: `/private/tmp/populous-globe-morph-v107.png` and
`/private/tmp/populous-globe-return-v107.png`.

The browser still supplies its 24 Hz presentation scheduler and existing UI/input
adapter. Full native dispatch side effects, resolution/scaled timing ownership,
transition audio, map-focus recentering and original matched full frames remain
open. Native projection/morph comparisons do not claim that complete outer UI
controller has been CPU-compared. The newly exported instant-mode/menu handlers
are retained as research, not claimed ports. Nine new hashes bring the verified
manifest to 850 exports. Camera and whole-frame raster checkpoints remain partial.


## Original hut families and retained collapse faces — 2026-09-08

`0040b170` selects a building's signed object short at unit+99. Descriptor flag
0x2000 selects one of three hut families with one game RNG draw at 0x89d178:
base object + (random % 3) * 12 + signed tribe * 3. Flag 0x4000 adds signed tribe
to non-hut bases without RNG. All 20 descriptor models, six owner byte values
and 16 seeds each match 1,920 complete native calls, without stubbed callees.
`004050c0` supplies current object + 1 to a replacement on upgrade; `00403610`
initializes the replacement then applies that supplied identity. The browser
retains the family through its existing upgrade producer. Full replacement
allocation, decoration RNG and global initialization order are not yet ported;
this does not establish the exact opening family sequence of an original run.

The importer now includes objects 107–142: three families, three levels, four
tribes (55 total mission models). One stored building identity is shared by
rendering, footprint/entrance lookup and collapse. The scene rebuilds on identity
or damage-stage changes. Legacy browser state without an identity preserves its
previous family. New assets use the existing verified bank-2 source hashes.

Expanding collapse checks exposed a root-cause importer error: mode-zero picking
faces were discarded, but `00407860` still allocates them and consumes RNG.
Models now retain all faces and their texture modes. The shared display predicate
omits mode zero except when `00471c40` substitutes a visible construction cap.
`00470160` retains the same distinction for fragments. Invisible debris continues
its physics/impact/RNG lifetime without a drawable mesh. Lighting follows the
same filtered face sequence. Native comparisons now cover 1,050 collapse calls,
30,665 faces, 8,192 flight snapshots, 128 splash initializations, 2,216 construction
calls (17,948 queued triangles before mode-zero raster filtering), and 990 model
lighting passes. Existing native shader, normal and sunlight comparisons pass.

```sh
python scripts/check-native-building-objects.py /path/to/d3dpoptb.exe
python scripts/check-native-building-faces.py /path/to/d3dpoptb.exe
python scripts/check-native-building-debris.py /path/to/d3dpoptb.exe
python scripts/check-native-model-lighting.py /path/to/d3dpoptb.exe
node scripts/check-browser-building-objects.mjs
node scripts/check-browser-building-debris.mjs
```

The browser variant check renders every one of the 36 models, checks finite
geometry, live identity replacement and 29,415–57,743 changed GPU pixels.
Portable gameplay checks retain family selection, non-mutating shape/display
queries, upgrade identity and capped versus uncapped picking-face behavior.
Complete hut activity/upgrade scheduling, all other models and original matched
full-frame rendering remain open; graphics.variants stays partial.

The fire UV animation adapter uses the filtered drawable face sequence too;
its Lightning/tree-fire browser check confirms animated original UVs, actual GPU
pixels, grounding, shrinking trees, sound, smoke and cleanup. The expanded live
hut-collapse check observes four invisible fragments and verifies their groups
have no drawable children while ordinary faces remain textured and moving.


## Hut birth controller and entrance feedback — 2026-09-08

`00404c80` samples admission and breeding cost only when unit counter+0x2e is
four-aligned. Signed occupant byte+0xa6 contributes twice (occupants+1) to signed
work short+0xa4. Crossing cost sets building flag 0x4000; consuming that flag
resets work even on a non-sampling turn, where the request is discarded.
`004049d0` initializes completed huts to breeding cost minus 54. The outer
`00403280` work gate is the byte at 0x89d17c bit 0x20 (browser manaWorld.gameFlags),
verified from instructions rather than the ambiguous metadata name level_flags.

A successful birth allocates brave model 2 at the shape's inside socket. Player
tribe births request cue 0x28. Effect 60 is separately allocated at the outside
socket: `00509c10` initializes draw44/HFX1288 and state47, then the birth caller
sets sixteen turns and draw41/HFX1441. `0050a750` state47 decrements and removes
it; `004ee7b0` supplies animation. There is no browser fade. Existing generic
birth-art producers reuse the corrected animation presentation; their own native
training/gift/reincarnation allocation paths are not established by this check.
Cue 40's existing original sound sample352 is now preloaded. The browser probe
verifies a real AudioBufferSourceNode starts with its decoded PCM duration.

The newborn destination starts 512 native units beyond the outside socket at
building angle+512. `00405050` detects an occupied destination cell and substitutes
that building's outside socket. `00405090` snaps both coordinates to cell center.
The browser reuses existing shape and route helpers; newborns stay visible and
walk out instead of immediately becoming hut occupants. This remains a live route
adapter, not a port of the original person's allocation/home/state dispatcher.

```sh
python scripts/check-native-hut-birth.py /path/to/d3dpoptb.exe
python scripts/check-native-hut-birth.py /path/to/d3dpoptb.exe --record
node --test tests/hut-birth.test.mjs
node scripts/check-browser-hut-birth.mjs
```

The oracle executes 2,304 full controller calls, including 188 successful births,
and 2,304 complete building-completion clock initializations. It supplies storage,
population admission/cost, audio and unrelated completion registration callbacks.
Original socket geometry, signed arithmetic, movement, neighbor lookup, cell snap,
flags and animation setters execute. A separate 128-case flash pass executes the
initializer, birth override, 2,688 animation records and sixteen-turn deletion;
class-list registration/removal is supplied. The portable fixture retains the
first 288 controller cases; live tests check the work gate and per-building phase.
Browser capture `/private/tmp/populous-hut-birth-v109.png` shows the original
entrance flash and newborn; GPU differences and movement/expiry are asserted.

Class-9 construction-plan fallback, allocation exhaustion, wild-person state
notification, full person initialization, native object-counter staggering and
global scheduling remain open. Population/cost providers retain the current
opening-class adapter. Three exports bring the manifest to 853. `0050c260` was
examined but is not the birth effect's updater: both switch dispatchers subtract
one from their selectors. Retain it as research, not a claimed port.


## Hut maturity and timber staging — 2026-09-08

`004050c0` uses each building's byte counter, not the world turn: every sixteen
turns, signed occupant count adds eight units per occupant to signed maturity.
Work clamps at the descriptor threshold (2,400 for the opening huts). Zero occupants
clear the unavailable-wood flag. An upgrade request requires `0040b4f0` to report
no missing timber. Every 128 building turns, maturity at least threshold*12/16
may instead request a resident's fetch/deliver/return order chain. Native empty
resource searches can set flags3 bit0x1000; the browser exposes that stored state
but its worker selection and nearest reachable source remain existing adapters.

`0040b4f0` uses the next model's buildingLife as required wood. `004a77d0` totals
signed scenery amounts in the entrance cell, using descriptor DWORD +20 mask 0x4.
This includes qualifying standing trees as well as logs. It is different from
renderer flag byte+21; `sceneryResourceFlags` now records that complete native
word from the verified EXE. Neighboring cells do not contribute. Browser signed
coordinates are compared with a 16-bit cell mask, so entrance piles across the
coordinate seam cannot be mistakenly fetched and dropped forever.

Residents now stage original model11/HFX23 logs at the entrance before an upgrade.
Dropping requests cue11, as in `004d58c0`. The existing scene already renders these
imported log sprites. Once the 300 required wood is present, the live replacement
keeps object+1 and starts with 100 construction work: `004050c0` creates/links the
plan through `00498140`, zeros its work, then calls `004ba2c0(plan,100)`. The current
building retains its browser identity; successful native allocation, linked-plan
ownership and order transfer are not claimed ports. Subsequent construction and
harvesting still use the shared existing work producer. That producer was extracted
once and reused by upgrade hauling, retaining explicit limits instead of duplicating
it. Full-native resource search/harvest/transfer timing and occupancy remain open.

```sh
python scripts/check-native-hut-upgrade.py /path/to/d3dpoptb.exe
python scripts/check-native-hut-upgrade.py /path/to/d3dpoptb.exe --record
node --test tests/hut-upgrade.test.mjs
node scripts/check-browser-hut-upgrade.mjs
```

The decision oracle executes 2,079 complete `004050c0` calls with supplied wood
availability, order eligibility/search and refused replacement allocations. It
compares signed work/occupants, all relevant 16/128-turn boundaries, query order,
unavailable flags and emitted fetch/upgrade requests. It does not establish the
successful replacement branch. A separate 256-case oracle executes complete
`004a77d0` cell lists with all twenty scenery models, signed amounts and adjacent
cell exclusion. Portable fixtures retain 432 decisions and sixteen wood cases.
The live simulation test carries three distinct logs to the entrance before
upgrading, preserves the initial complete building, then finishes reconstruction.
Browser checks see original log GPU pixels, carrying followers, the drop cue,
changed native family model and successful completion. Inspected captures:
`/private/tmp/populous-hut-timber-v110.png` and
`/private/tmp/populous-hut-upgrading-v110.png`.

One new export (`0040b4f0`) brings the manifest to 854; re-exported plan helpers
match their existing hashes. Global housing and timber checkpoints remain partial.

## Timber harvesting, pickup and tree size — 2026-09-08

`00432590` dispatches on **command minus three**: its case 4 is command 7,
`004340a0`, the fetch order used by hut upgrade preparation. At substate 3 it
requests `004d50d0` (person animation row 6, work), cue 1 with argument 0x10,
and a countdown from person descriptor byte +29. Loose model-11 logs use three
turns; the configured brave uses twenty. The initial call decrements immediately.
Positive remaining time requests cue 10 for logs. On signed-short time <= 0,
`004a7860` transfers wood and the controller checks subsequent orders.

The live hauling adapter now uses this recovered harvesting phase, replacing its
fixed two-second delay and row-8 combat-style motion. It keeps the approach heading
while harvesting instead of turning back toward the destination building. New
orders clear harvesting state. Tree/log pickup cues use the already-imported
original PCM. Native repeated/frame-gated sound ownership remains unported.

`004a7860` limits transferred units by the source amount, request and recipient's
remaining capacity (person descriptor short +20). Its scenery consumer `004a79f0`
clamps wood to the model capacity, removes scenery below 100 units, and otherwise
sets scale to `(modelScale - trunc(modelScale/6))*wood/capacity + trunc(modelScale/6)`.
Rendering now applies this size to harvested trees as well as burning trees; both
share one calculation. Original delayed replant allocations, source ownership,
non-person transfer consumers and precise tree lifecycle remain open.

```sh
python scripts/check-native-timber.py /path/to/d3dpoptb.exe
python scripts/check-native-timber.py /path/to/d3dpoptb.exe --record
node --test tests/timber.test.mjs
node scripts/check-browser-hut-upgrade.mjs
```

The oracle executes 1,860 complete `004340a0` calls starting at its reached-source
harvesting phase, with a valid subsequent order. `004d50d0`, `004a7860` and
`004a79f0` execute their original bytes. Output animation, sounds, removal and
replant allocation are observed consumers; search, route arrival, other command
phases and successful replant allocation are not established by this check.
Cases include six tree models, logs, four person models, empty/partial/full cargo,
entry and signed countdown boundaries, timber amounts, scale and depletion.
110 captured brave cases run portably. Live tests check twenty-turn tree harvest,
three-turn pickup, work/carry transitions and order cancellation. The browser
checks real work frames, Web Audio playback, native-sized tree GPU changes and
the complete existing upgrade/construction scenario.

Six newly retained exports bring the manifest to 860. `00495d70`, `00496750`,
`00497a30`, `00446790` and `004391a0` are supporting research, not claimed complete
ports. In particular the automatic construction worker in `00496750` has a
separate state/order lifecycle and calls `004391a0`, whose 32-turn random facing
and motion-group side effects remain outside the shared live harvesting adapter.
The timber checkpoint stays partial; direct command scheduling and all consumers
must be integrated before claiming complete economy parity.

## Tree growth and delayed replanting — 2026-09-09

`004a6f40` samples growth on each scenery object's byte counter (`counter & 15`),
using its signed growth short and model capacity. A full tree restores its default
growth from descriptor +6. The live tree records now keep this phase/rate instead
of sharing a world-turn check and TREE1 constant. New trees start their own phase.

Depletion below 100 wood in `004a79f0` creates hidden class-5/model-17 scenery.
Its allocation record carries the original class/model and descriptor +8 delay:
4,000 turns for all six configured trees, shortened to half plus one eighth
(2,500) when the receiving tribe's playerType is 1. Harvesting and burning both
reach this producer. The separate `004a7bd0` expiry-removal branch does **not**
create a replant request; the live adapter preserves that distinction.

`004a8370` decrements a signed 32-bit delay. At <= 0 it calls `004a8440`; site or
allocation failure schedules another attempt in 256 turns. Successful allocation
sets the tree's original growth rate and 100 wood through `004a79f0`, then removes
the hidden request. Existing scenery initialization centers the allocated corner
on its 512-unit cell. Rendering reuses the original tree model and wood-to-scale
calculation, so the sapling visibly grows and recovers its native ground shade.

The complete site search reuses `0049a2f0/0049a3f0/0049a5d0` via indexed-search.ts:
type 2, angle zero, rings 0..16, including repeated ring starts. It requires dry
category flag 1; rejects cell mask 0x10606; rejects scenery except model 17; and
rejects class-10/model-16 objects unless landFlags bit 8 is set. All four walk bits
must pass the existing `00518200` reconstruction. Coordinates wrap before probing.
The live occupied-cell adapter includes trees/logs, worship objects, the currently
rendered reincarnation stones and fires; buildings use the native footprint flags.

```sh
python scripts/check-native-tree-growth.py /path/to/d3dpoptb.exe
python scripts/check-native-tree-growth.py /path/to/d3dpoptb.exe --record
node --test tests/tree-growth.test.mjs
node scripts/check-browser-tree-growth.mjs
```

Comparisons cover 576 complete growth-controller calls with terrain/state side
effects supplied, 18 actual depletion allocation records, and 128 complete delayed
updates with original site search, indexed records and collision bytes executing.
The latter include 55 successful sapling creations, nine allocator failures after
finding a site, exhausted pools/sites, wrapped coordinates, flag/occupancy/walk
exclusions and signed delay boundaries. The original wood/scale consumers execute;
allocation and removal are observed consumers. These captures also run portably.
The live test waits all 4,000 turns before creation and follows 100 -> 400 wood;
a separate case covers burning depletion versus expiry. The browser runs the full
delay at accelerated simulation speed and checks model size, GPU pixels and shade.

Allocation limits, global object insertion/order, initial counter staggering and
complete mixed-class scenery ownership remain open. Browser retained dead tree
records and request arrays are adapters, not the original allocator. The existing
renderer's building-proximity vegetation suppression was subsequently removed;
full original geometry/placement visibility remains a separate fidelity gap.
This does not complete the timber or scenery lifecycle checkpoints.

Six new exports bring the manifest to 866; re-exported `004a6210` and `004a80b0`
match their previous hashes. `004a8860/004a8950` (rising/sinking scenery), `004a8b00`
and `004a9030` are retained supporting research, not new completed ports.


## Trees beside buildings — 2026-09-09

`0046ec80` traverses a cell's object list twice. In the second pass, ordinary
3D objects skip hidden flag `0x10` and already-drawn flag `1`, then submit their
model. For class 5/models 1–6, the queue probe `0048b2c0` updates a counter but
does not decide whether the model is submitted. There is no building-distance
rejection. Polygon-pool exhaustion and existing lifecycle flags remain distinct.

Removed the browser's `distance < 3.7` scenery filter. It hid original mission
tree ID 3, 3.16 browser units from hut ID 1, outside its native occupied footprint.
The shared decoration builder now also preserves valid replanted trees near huts.

`check-native-scenery-visibility.py` executes 1,440 complete cell-dispatch calls
with six tree models, tree/building list orders and coordinates, hide/drawn flags,
probe results, morph/overlay requests and exhausted polygon storage. Polygon
consumers are observed at their call boundaries; this is not a raster comparison.
The browser regression fails on the previous filter and passes after its removal,
including four camera bearings and complete decoration rebuilds.

```sh
python scripts/check-native-scenery-visibility.py /path/to/d3dpoptb.exe
node scripts/check-browser-scenery-visibility.mjs
```

Original mixed-class painter ordering, full visibility/lifecycle ownership and
matched original frames remain open. No new renderer abstraction was needed.


## Spell-panel artwork and charging — 2026-09-09

`0049daf0` is the spell-button renderer, reached through the native UI controls.
`004a1dd0` selects normal, selected or highlighted nine-patch tables. Permanent
frames start at HFX821/830/839; reward frames at HFX510/519/528. The reward branch
requires normal game flags, no permanent spell bit, a populated nonzero slot and
no locked-state marker. The live first-mission adapter supplies enabled populated
slots; full control ownership/availability remains unported.

The spell descriptor's three shorts at offsets 16/18/20 select ready, inactive
and hover icons. Previously only the first two banks were imported. Normal stock
uses HFX54, gifts HFX65; empty markers are 55/68 for permanent and 66/67 for reward
(normal/hover). Hover hides the charging track. `004c2fe0` collects nonzero-mode
spell descriptors and stably sorts by mana cost; the browser's supported subset
now follows that order, while the complete native slot table remains open.

The logical 31×43 layout places markers at y=2 and centers the main icon between
the marker row and charge frame. Native 1–4-shot spacing is retained as a small
fixed lookup. The charge frame is [2,34,28,39], with fill [3,35,27,38]. It uses
HFX1014–1021 with overlapping four-pixel corners; the importer composes the short
26×5 frame rather than shrinking corners through CSS border-image. The fill
routine emits rollover layers with palette indices ending at 239, followed by
player-zero color 222. Integer division/modulo boundaries agree with the supplied
executable. Both palette-color constructors (`004525d0`, `00415f70`) are thiscall
and pop their index argument; the native harness observes them accordingly.

```sh
python scripts/check-native-spell-button.py /path/to/d3dpoptb.exe
python scripts/check-native-spell-button.py /path/to/d3dpoptb.exe --record
node --test tests/spell-button.test.mjs
node scripts/check-browser-spell-button.mjs
node scripts/check-browser-hud.mjs
```

763 complete `0049daf0` calls compare borders, every sprite's identity/position and
layered fill rectangles across seven spell models, all ordinary stock limits,
permanent/gift, charging, hover and selection states, plus progress boundaries.
The harness executes the original spell queries and border selector. Logical
coordinate conversion, reference button rectangle, palette constructors and final
raster consumers are supplied; pending mana is zero to isolate the separate
random charge-spark path. Native slot order and all captured draws also run in
portable tests. Browser checks compare 24 live art states against those captures
and exercise actual context-menu charging controls. Existing HUD interaction tests
now wait for the restored two-stage overview transition instead of asserting an
immediate view change.

The asset importer now carries 499 HUD sprites/glyphs, eight nine-patch borders,
the charging frame and original palette colors. Thirteen new exports bring the
manifest to 879; re-exported `00522570` and `00415f70` remain byte-identical. Other newly
exported UI dispatch routines are supporting research, not completed ports.
Disabled/locked/empty control ownership, all spell slots, other game modes/tribes,
charge-spark RNG/lifetime, resolution parameterization and full raster/painter
matching remain open. This advances the HUD checkpoint without completing it.

## Shaman health meter — 2026-09-09

`004a0050` draws the shaman's HUD health meter. The native packed control record
at `005caf3d` stores both position pairs `(64,126)` and dimensions `(10,22)`;
its renderer callback is at `005caf4d`. The runtime adapter supplies those logical
coordinates. The function reads the current player's tribe `+0x89d` shaman pointer,
maximum life at person `+0x6c` and current life at `+0x6e` (signed shorts).
It draws the `005ca9e0` frame, clears a two-pixel inset, then fills upward by
`truncate(18 * current / maximum)` pixels. Missing shaman or zero maximum leaves
an empty meter; health above maximum fills it. Hidden controls submit nothing.

Executed `0042adc0` palette initialization on the shipped palette: foreground
`0089c6f4` is palette 130 (`#ffffff`), background `0089c6f5` is palette 172
(`#0b0f0b`). The browser uses those imported colors, the original frame, integer
fill heights and accessible health readings. The live adapter converts its
health units back to the original twentieths before integer division.

`check-native-hud-health.py` executes 2,091 complete `004a0050` calls, including
all 0–2001 current-life values against maximum 2000, additional maxima/boundaries,
all four tribe pointer slots, null shaman and hidden control. The native health
and frame controllers execute unchanged. Logical-coordinate consumers are
supplied; palette constructors and final sprite/quad/fill queue submissions are
captured. `0047dfd0` is thiscall with `ret 0x28`; palette constructor `00415f70`
is thiscall with `ret 4`. Rasterized source sprites at the native frame submission
positions match both imported health and charge PNGs. This checks original
source-pixel composition, not the entire D3D renderer.

Browser checks compare 24 native-derived health states at two desktop sizes,
exact bounds and colors, accessibility, and live death/removal/reincarnation.
The half-health screenshot agrees on all 880 rendered pixels with the native
frame and fill at 2× scale. The new frame importer also avoids overwriting the
HUD atlas dimensions: the v114 charge loop had left metadata at 4×4 although
the PNG is 1024×189. PNG-header and all-sprite-bounds checks now prevent that
metadata regression; existing artwork and atlas coordinates stay identical.

```sh
node scripts/check-browser-hud-health.mjs
/private/tmp/populous-reference/tools/bin/python scripts/check-native-hud-health.py /private/tmp/populous-reference/native/d3dpoptb.exe --browser
node --test tests/hud.test.mjs
```

One new raw export brings the manifest to 880 routines. HUD ownership, native
resolution parameterization, animated shaman portrait, population/mana controls,
remaining panels/messages/minimap and complete original frame matching remain
open. Reincarnation timing and presentation now have their own bounded native and
browser checks; this HUD check only establishes the display handoff.

## Ordinary model face culling — 2026-09-09

The original `004708d0` ordinary model renderer calls `0046d970` for each
triangle and queues it only for positive screen-space signed area. This applies
to both ordinary and tribe-colored texture branches. In contrast, construction
renderer `00471c40` retains both windings and reverses rear-facing triangles before
queueing them. The browser had used `DoubleSide` for every original model.
`nativeModel()` now uses WebGL clockwise-facing culling for complete models
(`THREE.BackSide`, because native screen Y is inverted into NDC) and retains
`DoubleSide` for stages 0–3. The shared factory covers buildings, scenery, stone
heads, vaults, reincarnation stones and the original fire model.

`check-native-model-facing.py` executes 40 complete original ordinary/construction
renderer calls with **no callee stubs**. A synthetic one-triangle object supplies
front/rear and depth-sloping variants, all five renderer stages and both ordinary
and tribe-texture descriptor branches. Original transforms, camera projection,
normal lookup, screen-space culling and polygon allocation execute. The capture
records projected vertices and the actual queued triangle count; it is not a full
scene or original D3D raster comparison. Only nondegenerate in-bounds cases are
claimed here; native clipping-edge/float-precision equivalence remains open.

The browser comparison creates all stages through the live building renderer,
then exercises their actual materials with the same controlled raw coordinates
and native camera settings. All 40 submission decisions agree: construction
shows both sides; completed rear triangles produce zero GPU pixels, while the
front triangles contribute 14,280 or 13,482 pixels. A scene comparison at four
bearings differs from the previous unconditional two-sided renderer on 6,480,
7,536, 4,373 and 3,783 pixels. These differences show visible integration, not
pixel agreement with full original reference frames.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-model-facing.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-model-facing.mjs
```

The investigation began with dark distant models. `004718c0`/`00471a80` explicitly
apply the existing depth fade; that fade was not removed. Broader sunlight/state,
mesh visibility, clipping and painter-order comparisons remain required. A new
`0046d970` export brings the manifest to 881 routines. Full renderer parity is
unfinished; this does not claim original death/debris culling or all special
object transformation paths.

Regression checks also pass for 990 model normal/shade passes, 2,216 construction
face/cap calls, browser lighting, model hover/owner gates, real building and tree
ignition, scenery rebuilding and all 336 unit sprite poses. The hover test now
uses the existing fixed pan key `D`: its former `ArrowRight` action rotates
around the centered stone head under the restored native bindings and therefore
does not reliably move the pointer off that head. Runtime bindings were unchanged.


## Animated shaman portrait — 2026-09-09

`0049fe70` places the portrait at logical (33,114), size 30×35. It draws HFX
713–721 (normal), 731–739 (hover/press), or 722–730 (selected), fills the
25×30 interior at (35,116), and anchors the person at (47,144). The background
uses palette 172, hover/press 130, or 243 when native state is 25/29,
health is at least maximum minus 225, and presentation-counter bit 2 is set.
Absence clears the interior and emits no person. State meanings and full control
selection/enabling ownership are not inferred from these drawing conditions.

`00450e60` selects the shaman's live animation row/frame, adjusts direction with
camera heading, applies tribe row offsets and VSTART mirroring, and calls the
original no-tribe layer renderer in portrait mode with shadow suppression.
The browser shares its resolved world frame and `spriteLayers` implementation;
it does not create a separate animation map or portrait texture set. A small
canvas preserves poses that extend beyond the control's border. The existing
static portrait is replaced by live animation, including camera turns, casting
and absence/reincarnation. The button retains keyboard access and focus behavior.

The native comparison executes the complete controller in 322 background/state
cases and the complete directional/layer path in 408 blue/red poses: every
imported shaman action, eight directions, first/last cycle steps. Original HSPR,
VFRA, VELE and VSTART data supply loaded tables. Coordinate adapters receive
logical 640×480; only palette and final sprite/quad consumers are supplied.
All three imported border PNGs agree with original frame submissions. Captured
rectangles, colors and independent original-pixel hashes are retained in
`tests/fixtures/hud-portrait.json`; normal checks reject fixture drift.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-hud-portrait.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-hud-portrait.mjs
```

The actual scene/canvas matches all 200 blue-shaman capture hashes, including
mirrors, transparent regions, absent shadows and out-of-frame limbs. Browser
checks also cover two desktop layouts, hover, selection, live animation, camera
input and actual death/removal/reincarnation. The existing 336 GPU sprite poses,
24 health states and 24 spell-button states pass. Portable regressions total 91;
883 exports pass identity/hash checks. The new maintained TS module passes
ox-standard; ESLint has zero errors and two existing image warnings. Fallow
reports maintainability 85.4 (good), with pre-existing repository debt still open.

The HUD keeps the existing uniform logical-resolution adapter. Original portrait
mode applies separate 30/32 fixed-point X/Y scaling above 640 pixels; that exact
per-resolution rounding remains open. The 24 Hz presentation counter is a browser
adapter, not a port of the full native outer-frame clock. Complete native shaman
state ownership, control selection/disabled dispatch, other tribes as the player,
other panels and whole original-frame matching remain unfinished.


## Local terrain lighting — 2026-09-09

`004010b0` allocates the first free one of fifty light slots and immediately
refreshes terrain. `00401350` clears prior contributions, follows the owning
object, rejects lights beyond the original wrapped camera distance and applies
one private-RNG flicker value per light. `004015f0` visits the native 7×7 patch,
uses wrapped three-dimensional squared distance and height falloff, and clamps
combined light to 31. `00401230` subtracts stored contributions before refresh;
`00401140`/`004ee190` remove the owner while retaining other lights and the lower
ten building-occupancy bits. The module keeps these operations in readable TS
and shares native terrain-height and RNG helpers.

Blast effect 38 requests strength 4/flicker 4 in `00509c10`; native scenery-fire
initialization `004a6b20` requests strength 3/flicker 4 when its light argument
is set. These requests now reach the browser. Building fire uses the existing
native socket `light` field: only the first designated socket enables a light.
Source deletion releases its light; flames live beyond the building's separate
burn counter, so cleanup follows the actual flame lifetime. Scene camera input
supplies the native light-view position. Changes invalidate the existing terrain
vertex-light buffer, including allocations within the same simulation turn.
No new shader, arbitrary tint or light-strength approximation was added.

The native check runs 288 complete x86 calls without callee stubs, retaining 235
lifecycle snapshots. Cases cover full-pool refusal, saturation/overlap, first-hole
reuse, motion and view across map seams, height changes, graphics-enable/pause
gates, non-consumption of gameplay RNG, and exact occupancy restoration after
all removals. Fifty slot records and whole-terrain hashes are checked at every
snapshot. Native graphics flags here live at `00895da4`, distinct from the
simulation flags at `0089c66d`; the browser explicitly enables local lighting
without changing simulation flags. The independent sun-rotation flag is disabled
in this comparison and its scheduler remains unported.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-terrain-light.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-terrain-light.mjs
```

Actual browser casts produce 35,655 changed ground pixels for Blast (32 lit
cells) and 29,909 for building fire; over 99% become brighter. The comparison
removes only packed terrain light temporarily, retaining effects and geometry.
Both light lifetimes clean up without residual illumination. The portable
suite has 93 passing regressions, including paused/immediate Blast lighting and
first-socket building ownership. Existing native Blast, scenery/fire and building
ignition/burn comparisons pass. New TS passes ox-standard; ESLint retains two
existing image warnings, and Fallow reports maintainability 85.3 (good) with
pre-existing repository debt. Five new exports bring the manifest to 888.

Full native object-allocation/deferred-free order, all other light-producing
classes, original graphics-menu settings, sun rotation, complete renderer/painter
matching and original full-frame comparisons remain open. The current browser
simulation clock and end-of-turn ownership adapter remain partial. This advances
the existing lighting checkpoint without claiming the complete lighting system.

## Native tooltip bitmap text — 2026-09-09

The English branch of `0044a2f0` selects font pointer 3 above 600 pixels of screen
height, otherwise pointer 4. `0042ac70` and the packed loader records at `005a3d70`
bind these to **F00T3/F00T4**, not similarly named FONT3/FONT4. F00T stores the
left/right mouse-button artwork at character positions 123–125: `{}` and `|}`
are adjacent original glyphs, not escape sequences. Rendering the raw strings
with Arial exposed their literal character codes. The shared HUD importer now
includes these two original banks with source hashes; existing HUD fonts remain
separately identified.

`app/tooltip-layout.ts` reconstructs the controller's thirteen candidate widths,
minimum width, strict-first penalty selection, punctuation/space wrapping,
127-character line capacity, stored glyph advances and centered line positions.
`00527960`, `00516b80`, `00516c80` and `00527aa0` provide the English bitmap path.
The hardware glyph path submits white modulation of already-colored artwork;
applying the controller's palette-80 operand as a CSS text tint would be wrong.
Canvas draws the imported glyphs directly and only redraws when text or screen
size changes. Accessible labels expand the mouse symbols into readable actions.

```sh
python scripts/extract-reference.py /Users/johann/Downloads/PopulousTB-Setup.zip /private/tmp/populous-reference/native 'data/f00t3-0.dat' 'data/f00t4-0.dat'
python3 scripts/import-hud.py /private/tmp/populous-reference/native
/private/tmp/populous-reference/tools/bin/python scripts/check-native-tooltip-layout.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-tooltip-layout.mjs
```

The comparison executes 222 complete native tooltip-controller calls, including
all imported English strings, punctuation and long-line cases, at five desktop
sizes. Only the already-compared window renderer, loaded sprite-bank lookup and
final glyph queue are supplied; native font selection, width search, wrapping,
metrics and glyph submission all execute. All 448 imported glyphs match source
pixels, and 9,669 submitted glyph placements match TypeScript. Portable evidence
includes native layout records and raster hashes. Browser checks compare the
actual tooltip canvas against those hashes and exercise real building-mesh hover.
The existing HUD check now reads the accessible tooltip label.

This covers the ordinary English tooltip text path. Scrolling callouts, other
languages, complete native hover delay/ownership, native object-anchor projection
and border/raster blend equivalence remain open. Current projection and viewport
clamping are still browser adapters. Ten new identified exports bring the
manifest to 898; full UI/game parity remains unfinished.

All 94 portable checks, existing HUD/portrait/unit-sprite browser regressions,
ESLint (two existing image warnings), new-module ox-standard and production build
pass. Fallow reports maintainability 85.4 (good), with zero dead exports and the
existing three dependency cycles/unused dependencies still tracked separately.

## Mana-production display and clock input — 2026-09-09

`0049e8b0` draws the HUD's production meter at logical `(4,190)`, size `92×13`.
It reads tribe fields `+0x95d` (produced mana) and `+0x961` (estimated demand),
not the current Blast charge. With positive demand, the upper range is demand
plus its truncated `200/256` fraction; produced mana is capped to this range.
Without positive demand, the original uses `256/256`. The inner 88 pixels have
44 one-pixel stripes at two-pixel intervals. Their color band changes at
`trunc(88*200/256)=68`; native dim/bright pairs are `175/130` and `225/231`.
Game flag `0x20` hides stripes, while mana flag 1 without the UI override uses
the native red warning color. Original palette initialization supplies background
172 and warning 139 for the opening palette. The `00516810` vertical-line wrapper
includes its last Y pixel: stripes are 10 pixels high over a 9-pixel background.
The original `005ca9e0` frame is imported at its actual 92×13 size.

The browser now consumes these existing simulation fields. Tracing their producer
also identified an integration error: the field previously named `rateSample`
was permanently zero. In `004a5590`, the same native byte `0089d161` divides 1,000
to establish the turn interval; `0041a590` uses it to estimate demand. It is now
named `turnsPerSecond` and initialized from the browser's existing 12-turn clock.
Full native speed-menu, replay and outer-loop clock ownership remain separate;
this fixes the current scheduler-to-mana input without changing its tick rate.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-hud-mana.py /private/tmp/populous-reference/native/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-mana.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-hud-mana.mjs
```

The comparison executes 1,948 complete native meter calls over four tribes,
zero/positive demand, every stripe threshold, capped production and both mode
gates/override. Only coordinate adapters and final raster queues are supplied;
palette conversion, line expansion and frame drawing execute. The frame PNG,
submitted rectangles, colors and recorded pixel hashes agree. Browser checks
cover 30 states at two desktop sizes and 15 original raster hashes, plus a real
Blast cast and charge-off/on feedback. The full mana distributor still matches
1,024 native cases. All 96 portable regressions pass, including a live positive
demand calculation and warning recovery after charging resumes.

The existing HUD uses uniform logical scaling; native per-resolution rounding,
UI override ownership, dynamic palettes and full original-frame matching remain
open. Population/class controls are the next visible gap: `004a0800` totals five
follower classes (excluding the shaman), and `004a0510` suppresses zero class
counts and formats nonzero counts with two/three digits. These two exports are
research evidence only; their complete controls and housing meter are unported.
The identified export count is 902. Broad HUD and full-game parity stay partial.

## Follower counts and housing display — 2026-09-09

`004a0800` totals the five ordinary follower classes, excluding the shaman.
`004a0510` draws individual classes, suppressing zero labels and unavailable
icons/counts. Both use original F00T4 below 100 and F00T6 at 100+, formatting
with `%02d`/`%03d`; alternate tribe counts use F00T5/7. Counts are centered using
stored glyph widths at logical Y=26. Class icons center at
`(7-trunc(width/2), 18-trunc((height+8)/2))`; hover/held selects the adjacent icon.
Selection alone changes the border, not the icon. `004a1dd0` chooses 15×36
normal/hover/selected frames beginning at sprites 1005/1014/996.

The housing meter has a 7×22 frame with a 3×18 interior. Below capacity it draws
at least one green pixel, otherwise truncating `18*population/capacity`. At or
above capacity it is full red except when `(spriteAnimationCounter & 0x124) ==
0x124`, which turns it green. Native palette initialization supplies white 130,
red 139 and green 228. `0041b380` includes a reserved shaman allowance in housing
usage; `0041b330` sums weighted completed huts plus the tribe allowance, capped
at 200. The existing browser population/capacity helpers match the supported
first-mission path and are reused. These two exports bring the manifest to 904.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-hud-population.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-hud-population.mjs
```

The comparison executes 360 complete count controllers across five classes and
the total, four tribes, ten counts, normal/alternate tables and normal/hover/
selected states. All imported F00T4–7 glyph pixels match the source banks.
Another 7,198 complete housing controllers cover capacities, fill thresholds and
all 512 low animation-counter states for full meters. Only logical-coordinate
adapters, loaded-bank lookup, CRT integer formatting and final raster queues
are supplied; native count/table/font selection, glyph metrics, frame submission,
capacity/population calculation and palette conversion execute. Browser tests
compare 38 actual button images to native raster hashes and exercise two desktop
layouts, real class selection, original blink feedback and follower removal.

The browser uses its existing ordinary count/selection ownership and 24 Hz
presentation counter. Native alternate-table producers, complete control policy,
unavailable-control blending, per-resolution rounding and full outer-clock
ownership remain open. Unsupported follower classes stay unavailable. This
component work does not complete the broad HUD checkpoint or full game parity.

## Timber delivery advances construction — 2026-09-09

`00495520` dispatches construction command stages. Its stage 7 calls the shared
`00496750` hauling controller; phase 5 initializes an eight-turn wait, executes
`004391a0`, then transfers all carried timber through `004a7860`. The class-9
recipient uses its building model's work capacity and `004ba2c0` for stage and
completion changes. There is no separate worker-count-scaled construction timer
on this transfer path. The original wait decrements a signed short and completes
only at zero; its entry selects the carried/rest pose through `004d4ee0`.

The live browser now uses that delay and existing capacity-limited transfer.
A hut advances through native stages 1, 2 and 4 as its three logs arrive. The
former twelve-seconds-per-worker accumulation and synthetic final hammering pose
are removed. Repairs reuse the native plan update; cancellation clears pending
delivery, and a completed plan cannot consume another worker's surplus cargo.
Original completed-hut upgrade stockpiling remains separate from plan delivery.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-timber-delivery.py /private/tmp/populous-reference/native/d3dpoptb.exe
node scripts/check-browser-construction.mjs
node scripts/check-browser-hut-upgrade.mjs
node scripts/check-browser-building-fire.mjs
```

The native check runs 576 complete phase-5 calls over six building models,
partial/full work, zero/partial/excess cargo, entry and signed timer boundaries.
Original plan coordinates, resource-search registration, wait, carried/rest
animation selection, transfer limits and plan-stage changes execute. Only final
animation requests and building movement/release/initialization consumers are
supplied. The person's counter is fixed away from the shared wait's random-facing
phase; that ownership is not claimed. Recorded native captures run portably.
Live tests cover each delivery's carry pose, exact timer, pause/cancellation and
visible scaffold changes. Existing complete upgrades, harvesting, fire/damage
and grounding checks remain passing.

Five additional exports (`004935c0`, `00495520`, `004958f0`, `00496220`,
`00497690`) retain resource-search registration and the surrounding construction
decision, worker activity and clearance paths for continued reconstruction.
The manifest contains 909 routines. Full plan allocation, dispatcher ownership,
terrain preparation, workers' native positions/idle activity, repair-delay
ownership and complete allocation scheduling remain open. This is an integrated
transfer-path correction, not complete construction or engine parity.

## Construction crew admission and registration — 2026-09-09

`004b9cc0` admits a person into a class-9 plan using the building descriptor's
unsigned-short capacity at offset `0x14`. It preserves existing registration;
otherwise it fills the first empty slot and increments the assigned count.
`004ba1b0` removes deleted, classless, dead, wrong-state, wrong-plan or wrong-tribe
registrations without compacting the slot array. The browser imports all twenty
descriptor capacities and applies the same slot operations to placement, later
orders and active construction. Small/medium/large huts allow 6/8/10 workers;
towers allow 12, temples 20 and warrior training buildings 16. Upgrades start a
fresh slot array sized for the replacement model. The former fixed limit was 3.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-workers.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-workers.test.mjs
node scripts/check-browser-construction.mjs
```

The native comparison executes 1,280 complete admissions across all twenty
descriptor capacities and 512 complete pruning calls, without intercepted
callees. It compares acceptance, every slot and the assigned count for valid
nonzero person IDs. Portable captures retain the same cases; live tests cover
hut/training-building limits, duplicates, full crews, death and reassignment.
Full-crew rejection happens before path allocation; a regression confirms it
cannot leave an unowned route behind.
The browser check uses real placement and right-click commands, admits all six
starting braves, rejects a seventh, reuses a dead worker's slot and completes
construction. Existing delivery poses and visible mesh stages remain checked.

New exports `004b8150`, `004b9cc0`, `004ba1b0` and `004ba260` bring the manifest to
913 routines. Browser work orders currently provide eligibility; complete native
person/plan command ownership and class-9 scheduling remain unported. In particular,
`004ba260` groups workers by task/readiness, and `004b8bb0` dispatches fetching on
sixteen-turn phases, handles repair delay and waits for worker departure before
removing the plan. `004b8470` additionally owns unbuilt-plan terrain preparation
and building allocation. Those controllers, native idle activity/positions and
departure are the next construction work; admission alone does not reproduce them.

## Constructed-plan dispatch and repair resumption — 2026-09-09

`004b8bb0` now supplies the browser's constructed-plan work decisions. Every
sixteen turns it promotes ready workers, in registration order, toward a fetching
target of `max(1, assigned / 2)`. Existing fetchers count toward that target.
Minimum crew comes from descriptor offset `0x12`. Delivery returns its worker to
task 2 through the recovered `00495520` transition instead of immediately fetching
again. Browser construction no longer separately estimates logs already promised
by workers; the original work capacity and assigned tasks govern dispatch.

The unsigned repair timer decrements while above one on every plan turn. With
enough workers, decision phases also decrement its signed value; reaching zero
calls `0040afd0`. An unstaffed damaged plan consequently holds at one. Native
burning-building decisions evacuate workers and suppress new tasks. The compared
completion path waits for task-9 phase 6, while task-1 workers do not block removal.

`0040afd0` traverses every nonzero shape cell through `004b9ef0`, shortens positive
model-76 smoke lifetimes to sixteen, and queues a texture refresh with the native
rounded shape radius. The shared shape traversal now accepts a mask so repair
and ordinary occupied-footprint operations retain their different cell policies.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-construction-crew.py /private/tmp/populous-reference/native/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-repair-smoke.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-workers.test.mjs
node scripts/check-browser-construction.mjs
node scripts/check-browser-hut-upgrade.mjs
node scripts/check-browser-building-fire.mjs
```

Compared 5,120 complete plan calls across all twenty descriptors, crew sizes,
task/readiness combinations, phases, signed delay boundaries, fire and completion.
Native pruning/classification execute. Final motion/state lifecycle leaves,
smoke resumption and object removal are recorded consumers; fire fixtures exercise
unlocked workers outside occupied cells. Another 1,264 complete cleanup calls cover
all object headings, both building and plan inputs, wrapped coordinates, smoke
lifetimes and other effect models. Only the final terrain queue is intercepted.
Portable captures retain 640 plan decisions and 181 smoke cases. Live tests cover
two workers/one hauler, full construction/upgrades, an unstaffed hold at one and
repair after staffing. The browser checks actual Lightning and right-click repair,
the full holdoff, dispatch, restored geometry and 531 smoke pixels. A fresh mature
smoke fixture exercises retirement at resumption because the initial fire smoke
normally expires before the complete delay.

The six new exports retain approach, inner movement, waiting, wandering arrival,
plan-center lookup and repair traversal (`00438ca0`, `00438db0`, `00439240`,
`00439480`, `004ba130`, `004b9ef0`), bringing the manifest to 919. Native `004958f0`
idle work and `00497690` departure are next: browser paths/hauling currently supply
task readiness, and live completion still releases workers directly. The full
completion gate is compared but not yet connected to native departure. Unbuilt-plan
allocation/terrain preparation, panic movement, original person-command ownership
and mixed-class counter scheduling remain open. Full construction stays partial.

## Original builder work activity — 2026-09-09

`004958f0` task 2 now drives live idle building activity. The worker approaches
the door (phases 54/1), enters (3), chooses a point around the original shape's
inside socket (23), and pauses at work (4). Descriptor offset `0x22` supplies the
radius; an unallocated plan halves it. The controller retains its signed arrival
comparisons, even-turn arrival checks, busy byte and native random movement speed.
Work pauses use 16–31 turns and original row 6/cue 20; the unbuilt branch uses
8–15 turns and the separate resting-facing consumer. Work's eight-bit facing
mask is retained rather than normalized to the other phases' eleven-bit mask.

The TypeScript uses named phases and existing geometry, random, movement and
animation helpers. A shared live animation-source selector feeds both the renderer
and presentation clock, preserving ordinary/fighting/airborne sprites when work
does not own the pose. New orders and completion discard the activity source.
Cue 20's five already-extracted sounds are now preloaded; the live PCM check caught
the missing preload before publication. Native person animation submission is
shared with celebration rather than duplicated.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-work.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-work.test.mjs
node scripts/check-browser-construction.mjs
node scripts/check-browser-building-fire.mjs
npm run test:sprites
```

The comparison executes 2,688 complete controllers across six supported building
models, every activity phase and unsupported-phase returns, three person models,
original physics speeds, wrap/signed boundaries, restart/readiness flags and
linked/unlinked plan states. Geometry, direct destination release, arrival checks,
wait decrement, movement speed/RNG and pose selection execute natively. Routed
path submission, final animation/sound consumers and resting-facing are supplied
leaves. The portable fixture retains 538 captures. Live checks cover actual
placement, native work activity, animation advancement, pause, cancellation and
completion. Browser repair checks compare directional work frames and observe
nonempty original PCM. All 336 existing GPU sprite poses, unit shadows and
selection checks pass. There are 107 portable checks; the export count stays 919.

The live plan is already linked to a browser building, so unbuilt-plan resting
is an explicit unsupported boundary. Exact targets and controller outputs are
integrated, while ordinary path traversal/collision and turn ordering still serve
movement. Full person-command ownership, native departure (`00497690`), unbuilt
allocation/terrain preparation, panic movement, frame-gated audio/voice ownership
and mixed-class scheduling remain open. Continue departure/completion integration
and visible original-frame comparison; this does not complete broad construction.

## Original builder departure and live completion gate — 2026-09-09

Task 9 (`00497690`) now drives departure. Restart chooses the center/door path
when the current native cell has building flag `0x200`; otherwise it chooses a
free heading until the cell is clear. The center path pauses 1–8 turns, approaches
the outside socket, turns by a random offset in [-398,397], walks for five turns,
faces the site, settles for six turns and becomes ready. Ready workers recheck
building occupancy every 32 turns. The free-heading branch retains the descriptor
`0x200` door-cone choice used by models 13/14. Signed timer behavior, even/four-turn
arrival gates, RNG order, stop/walk/carry poses and motion-release calls are kept.
Named phases and the existing work approach helper avoid duplicating geometry,
turning, speed or animation code.

The live `004b8bb0` completion gate now owns assignment release. Final timber
submission makes the building usable but retains the crew; the plan releases them
only when the native readiness condition passes. Workers are no longer teleported
to the door. Surplus timber survives departure. Original turning drives free
movement; the existing browser traversal adapter still supplies displacement and
collision. Initial approach, full command/route ownership and mixed-class update
ordering remain open. Native plan-object removal still maps to browser slot and
assignment cleanup rather than a fully integrated class-9 lifecycle.

A regression exposed automatic housing sending evacuated braves back into a
burning hut. Both automatic home selection and entry now reject burning huts;
the existing unstaffed-repair test guards the resulting ownership and holdoff.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-work.py /private/tmp/populous-reference/native/d3dpoptb.exe --departure
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-work.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-work.test.mjs tests/building-workers.test.mjs tests/timber.test.mjs
node scripts/check-browser-construction.mjs
npm run test:sprites
```

Compared 5,120 complete departure calls, eight building models, all phases and
unsupported returns, both restart branches, occupancy masks, boundary coordinates,
all physics speed models and signed wait boundaries. Native geometry, direct
movement targets, arrival, speed/RNG, animation-row selection and empty-route
release execute; routed path submission and final animation are supplied leaves.
The portable fixture retains 1,024 captures. The 2,688 work comparisons still pass.

Live checks cover one/two/six workers in four hut orientations, every persistent
center/door departure phase, displacement bounded by speed, the exact readiness
and scheduling gate, pause, cancellation, route cleanup and surplus timber.
Browser placement/delivery/departure checks inspect original walk/idle frames and
flips, rendered building stages and six-person replacement crews. All 336 existing
GPU sprite poses pass. Three new exports (`00439270`, `00439550`, `00439580`) bring
the manifest to 922. Full construction stays partial: unbuilt allocation and terrain
preparation, initial command approach, full movement/collision ownership, panic and
frame-gated audio scheduling are still unported.

## Original builder approach and carried-timber deposit — 2026-09-09

Task 1 in `00495520` now owns the live initial construction approach after command
validation/registration. It derives the resting anchor from the plan's outside
socket, shifted 512 units by its draw heading plus 512; `00432520` redirects that
anchor out of an occupied building, and `00402e70` centers both coordinates in
512-unit cells. Plan draw heading and rotated shape orientation are separate.
The linked-building branch chooses the inside socket only when descriptor bit
`0x100` allows it and the person occupies that exact building. Otherwise it uses
the door. Unlinked plans choose a random point within half the work radius.

The original 1,648-unit signed square controls the formation assignment bit.
Phase 15 recovers native walking/carry animation and speed/RNG, checks the 112-unit
arrival square on even person turns, and hands off to work. On arrival `004d58c0`
deposits carried wood as one log per 100 units and requests cue 11 for each
successful allocation. Allocation failure retains the remainder but still ends
approach. This operation is shared with the resting-person controller through
`dropCarriedTimber`; its previous inline copy was removed. One builder-activity
selector now supplies dispatch, movement ownership and native sprite selection.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-work.py /private/tmp/populous-reference/native/d3dpoptb.exe --approach
/private/tmp/populous-reference/tools/bin/python scripts/check-native-idle.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-work.test.mjs
node scripts/check-browser-construction.mjs
```

Compared 3,072 complete `00495520` calls starting with a valid registered task-1
person. Cases cover eight building models, rotations, linked/unlinked targets,
blocked anchors, short/wrapped arrival and formation boundaries, movement recovery,
carried partial/negative/multiple logs, allocation failures and plan dirty signals.
Native geometry, anchor helpers, movement reset/speed, facing, arrival and the full
timber-drop loop execute. Routed destination submission, allocation and final
animation/audio calls are supplied leaves. The portable fixture retains 615 calls.
The 2,688 work and 5,120 departure comparisons still pass; the shared drop refactor
also passes 4,096 complete resting-person calls and the existing idle-family checks.

Live scenarios cover empty-handed and carrying commands in all four hut
orientations, anchor alignment, pause, cancellation, exact deposit position,
unchanged construction work on deposit, later hauling, completion and departure.
Browser checks inspect the original carrying frame and flip, the dropped log
(77 GPU pixels), all three delivered construction stages, departure poses and
six-person registration/replacement. Five exports (`00401ae0`, `00409dd0`,
`004324c0`, `004982e0`, `004b8220`) bring the manifest to 927.

The live world still represents a placed plan with a browser building, so initial
approach currently uses its linked branch. Full unbuilt allocation, terrain
preparation and priority dispatch in `004b8470` remain next. That controller checks
shape validity and grade, counts workers/obstacles inside its footprint, dispatches
timber/leveling/clearing tasks, waits for site clearance and a ready departure, then
allocates the building; unattended plans age on the 128-turn phase. `004b8220`
initializes the plan and quantizes its foundation height. Port those consumers and
the class-9 lifecycle before claiming unbuilt-plan parity. Original command-list
validation/registration, plan dirty-byte ownership, full route/motion/collision
scheduling and object-pool allocation limits remain open. The live log allocator
uses the existing unbounded browser scenery collection; failure behavior is proved
by native captures rather than a browser pool-limit claim. Broad construction is
still partial.

## Building foundations and actual model origins — 2026-09-09

`00403f00` now supplies allocated-building ground writes in `building-shapes.ts`.
It samples all four corners of each occupied tile, retaining duplicate samples
for descriptor-selected averaging, or selecting the minimum bounded initially at
1024. It clamps the result to at least one, writes the descriptor-selected mask
in original order, preserves the rotated dock water-edge decrements and submits
the original terrain queue center/radius. The browser uses the existing native
terrain processing and walk-mask consumers, then resamples its compatibility grid.
The previous arbitrary square pad is removed.

`00403d50` supplies the model's actual position relative to its saved map anchor.
The importer retains the original object-reference offsets at +48/+52 minus
+32/+36; the native comparisons verify these against bank-2 object records.
Buildings retain their anchor separately from their displayed/targeted position.
Mission models/angles are supplied before grounding; hut upgrades retain the
anchor and update the replacement origin. Shape sockets, occupancy, entrances and
placement separation continue to use the anchor. Terrain/model synchronization
passes the complete first-mission discovery/build/train/combat test.

The height branch of `004b8220`, including native `004b9e20` grade-vertex traversal,
`0044fd80` signed averaging, outside-height mode, 64-unit rounding with lower ties,
clamps and special-model branches, is compared and used for new plan foundations.
The live adapter still applies that preparation immediately. Full task-8 leveling,
scenery/person clearance, initial timber, allocation timing and unattended-plan
removal remain unimplemented. The newly exported `004043f0` and `0044fde0` preserve
research for those workers; they are not claimed as integrated ports.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-ground.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-ground.test.mjs
node scripts/check-browser-building-ground.mjs
```

Compared 1,216 original ground/origin calls and 1,088 plan-height initializers:
all four rotations, original building descriptors/families/tribes, signed and
rounding boundaries, nonuniform terrain and wrapped map edges. Only final terrain
queue submission, cell insertion and model-10 cliff setup are intercepted; ground
sampling, shape selection and averaging execute natively. Ninety-six captured
cases run without the original executable. Existing native footprint/shade checks
still pass (632/4,096 cases). Four actual Space rotations and mouse placements
verify anchors, rendered origins, native grade vertices, retained surrounding
heights and 1,260–1,615 visible scaffold pixels. Construction, repair and sprite
checks remain separate; complete native allocation and painter ordering are open.

All 111 portable checks, actual construction/departure and Lightning/repair pass.
The 336 frozen GPU unit poses retain their original hashes. The shadow fixture's
old lane is now behind the correctly positioned hut: GPU isolation measured zero
visible shadow pixels with that roof and 36 with the buildings hidden. The fixture
now removes the red village while retaining its native terrain; the same real
Blast, artwork, flight/ground separation and landing assertions pass with 36 pixels.
This is fixture isolation, not a change to depth testing or a claim of full native
painter parity. Selection controls also pass. Fallow reports 85.0 maintainability,
2.9 average cyclomatic complexity and no dead exports; existing model.ts lint and
complexity debt remains. The touched shape module passes ox-standard and both
changed app modules pass existing ESLint.

## Unbuilt plans and worker leveling — 2026-09-09

`building-workers.ts` reconstructs `004b8470` after registration pruning. Native
16-turn decisions retain worker slot order and prioritize initial timber, terrain
grade, scenery, friendly people, enemies and vehicles. Allocation requires a clear
footprint and a task-9 worker in phase 6; unstaffed plans time out after fifty
128-turn increments. Extracted descriptor fields preserve timeout thresholds,
preparation work, leveling crew quotas and height steps. `004b9d50` is now retained
in the 933-export manifest alongside the existing grade traversal `004b9e20`.

`building-preparation.ts` reconstructs task 8 (`00497030`): random grade-vertex
selection, adjacent occupied-tile facing, direct movement, original waits,
row-7 stamping, frame-count timers, carrying/shaman rise, descriptor-sized height
changes and the original terrain/sound submissions. It shares movement, animation,
RNG and terrain helpers; `faceTribe` also reuses the existing `004eec80` port for
unlinked work rests instead of duplicating it.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-unbuilt-plan.py /private/tmp/populous-reference/native/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-level.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-preparation.test.mjs
node scripts/check-browser-building-ground.mjs
node scripts/check-browser-construction.mjs
```

The plan oracle compares 2,816 original decisions, including allocation failures,
validation, quotas, obstacles, worker counts and timeout-byte wrap. Shape traversals,
object lists, pruning, task classification and native priority dispatch execute;
validity results and final allocation/removal leaves are supplied. The leveling
oracle compares 3,072 complete calls across six building models, all rotations,
wrapped positions, signed timer/height boundaries, native animation setters,
movement recovery and grade writes. Only terrain queue/notification leaves and
sound are intercepted. Original VSTART/VFRA chains supply native frame counts.
Portable fixtures retain every fifth case and execute the shared animation setter.

Live placement now preserves terrain and the base plan shape. Hut-family selection
waits for allocation, and the retained map anchor remains distinct from the model
origin. Preparation work is separate from visible construction progress. Plan
occupancy reuses the existing footprint registry without setting building bit 512;
placed overlays reuse the preview geometry/atlas helper. Workers level the original
vertices and wait for clearance before the first scaffold. Ground resampling is
shared with allocated foundations. Cue 2 is preloaded with the existing native PCM.

Scenery harvesting and friendly displacement currently reuse browser order adapters;
full tasks 3/4, nonresource obstacles and the native command/spiral search remain
open. Live validity remains a dry-land check, terrain notifications do not yet
own every nearby object's response, and class-9/object-pool allocation is represented
by the existing browser building record. Ordinary route/collision/update order,
tribe camera-interest records and frame-gated audio remain partial. These boundaries
prevent broad construction parity credit. Direct insertion helpers retain immediate
preparation for explicit already-allocated fixtures; player placement uses workers.

Validation for this integration: 116 portable checks and the complete playable
first-mission regression pass. Four browser rotations show 8,830–9,825 plan pixels,
175–278 pixels from original directional leveling sprites, and 1,577–2,093 scaffold
pixels after allocation. The 336 frozen GPU sprite poses remain unchanged; complete
one/six-worker construction, carried timber and departure pass. Focused ox-standard
checks for the new controllers and existing ESLint for all touched app modules
pass. Fallow reports 84.8 maintainability, 2.9 average cyclomatic complexity and no
dead exports; the existing three import cycles and broader lint/complexity debt
remain. No checkpoint credit is added for these component-level checks.

## Native construction-site clearing — 2026-09-09

`building-clearing.ts` reconstructs complete scenery task 3 (`00495d70`) and
person task 4 (`00496220`). Shared arrival/facing and wait helpers replace duplicate
leveling code. The exported `004392a0` and `004393d0` helpers bring the identified
manifest to 935 exports. Existing command inspection `004df1c0` remains unchanged.

Scenery workers scan the original rotated footprint in cell order, approach and
inspect targets, use row-6 harvesting and cue 1, retain timber until deposit, and
use the original removal/retreat phases. The unexpected guard in the native scan
reads person +0x90 (command slot 2, bit 10), not the target scenery's flags. Bush
removal calls the existing state-5 burning lifecycle: native initialization sets
76 turns; resource depletion can remove the bush sooner while its fire continues.
Loose logs take the separate pickup branch. Person clearing retains eligibility,
waits, search direction and wrapped cells, allocation failures and displacement
requests. People receive walking orders only after the native clearing phase.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-clearing.py /private/tmp/populous-reference/native/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-clearing.py /private/tmp/populous-reference/native/d3dpoptb.exe --people
/private/tmp/populous-reference/tools/bin/python scripts/check-native-scenery-fire.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-clearing.test.mjs
node scripts/check-browser-building-clearing.mjs
```

The oracle compares 4,224 scenery and 2,688 person calls. Native footprint traversal,
shared waits, RNG, eligibility and indexed searches execute; animation assignment,
route ownership, sound, timber transfer and command allocation/attachment are
supplied callbacks. It compares callbacks, post-callback mutations, search pool
release and land flags as well as the complete relevant worker record. There are
604 scenery and 384 person snapshots runnable without the executable. The extended
fire oracle compares native destruction initialization and 3,600 burning snapshots
across trees, bushes and loose logs; existing fire/atlas comparisons still pass.
The shared wait refactor also retains all 3,072 native leveling comparisons.

Live tests cover all four hut rotations, harvest/carry/drop phases, multiple
bystanders, continuous movement instead of teleporting, allocation/completion and
departure, search release, pause/cancel and bush fire. Browser clearance checks use
actual placement, original directional harvesting frames and nonempty Web Audio
PCM, then wait for bystander commands and completed construction. Construction and
sprite regressions remain separate checks. Full native movement/collision, object
and command-pool limits, command eligibility ownership, nonresource object classes,
plan dirty signals and per-cell terrain validation remain explicit live boundaries.
No broad construction checkpoint is promoted to verified.

Final validation: all 121 portable checks pass. Actual browser clearance renders
55 harvesting pixels with original frame/flip and PCM cue 1. Four foundation
rotations, construction stages/departure, Lightning/fire/repair and all 336 frozen
GPU sprite poses pass with no browser errors. Fallow reports 84.8 maintainability,
2.8 average complexity and no dead exports; its existing dependency/cycle findings
remain. Focused ox-standard checks for the three construction controllers and
ESLint for all six touched app modules pass. No global checkpoint credit is added.

## Placement validity and height-change notifications — 2026-09-09

`building-validity.ts` reconstructs complete `0044ee50`, sharing existing native
height-range (`0044f600`) and water-neighborhood (`0044ebe0`) code. Neighbor overlap
`0044f220` and foreign guard-tower-plan permission `004baaf0` preserve native order
and gates. The cell's mask controls ordinary dry surroundings versus shore-building
requirements. Protected scenery, unexplored ground, occupied cells, slope limits,
plan exceptions and exact accumulated tribe feedback bits are compared. Both
slope limits are extracted from the supplied constants/executable (currently 160).
`buildingFootprintTiles` exposes the original tile masks without duplicating shape
traversal; preview geometry continues to use the separate entrance-aware helper.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-validity.py /private/tmp/populous-reference/native/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-terrain-notifications.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-validity.test.mjs tests/terrain-notifications.test.mjs
node scripts/check-browser-ground-overlay.mjs
```

The validity oracle runs 3,040 native calls with no intercepted callees, including
19 building models, native slope boundaries, both computer-search modes, category
and mask combinations, linked protected-object chains, plan IDs, guard-tower
exceptions, native failure precedence and wrapped edges. There are 435 portable
snapshots. Native object links use +0x20; a protected second object explicitly
checks that the native chain is followed.

`terrain-notifications.ts` reconstructs the height-change object-notification
portion of `0044f2f0`: visit linked cell objects, then the four touching building
cells in original order. Mark actual building cells with 0x20000 and notify their
registered object even when repeated. The 512-case oracle compares actual native
flag writes, including their order and duplicate visits, with 103 portable cases.
Independent landscape redraw, walk-mask rebuilding and route consumers are
intercepted; tribe views are inactive. This is not a claim for the routine's
attack branch, active native camera redraw, or global route invalidation.

Live placement and unbuilt-plan revalidation share the validator. The cell view
supplies live scenery, worship heads, the Vault of Knowledge footprint and original
reincarnation stones; complete scaffolds now retain occupancy during construction.
Leveling and compatibility-grid deformation submit height notifications; notified
plans use original validity and release their crew on failure. Existing native
people and fire/smoke records receive their terrain-dirty signals. Constructed
building terrain response, full object indexing, original fog and preview
territory/capacity queries remain open. The current preview still uses settlement
proximity for placement reach. The imported `004206d0`, `004951b0` and `004baaf0`
bring the identified export manifest to 938; unported exports earn no parity credit.

The former test site at browser (4,32) overlaps a reincarnation stone and is now
correctly rejected. Construction fixtures move to (-2,32), valid for both supported
building types in all four rotations. Existing fire tests now observe fire while
it exists rather than assuming it outlives all site preparation. Departure checks
retain their strict native movement bound, using the ordinary brave speed while a
fetching worker awaits the plan's next completion decision. Neither change relaxes
the rendering baseline or permits teleporting. Full first-mission gameplay remains
part of the portable regressions.

Final validation: all 125 portable checks pass. Real browser placement contributes
6,765 preview pixels and 308 entrance-arrow pixels, rejects protected stones and
occupied sites, and removes invalid plans/artwork after a terrain edit. Foundations,
leveling, site clearing, construction/departure and Lightning/fire/repair pass;
all 336 frozen GPU sprite poses retain their hashes. Browser failures in the old
fixture were stale canvas selection, camera-focus cancellation and pre-native
model-origin/scaffold assumptions; the check now follows current verified behavior.
Fallow reports 84.9 maintainability, 2.8 average complexity and no dead exports.
Existing dependency/cycle debt remains. Focused ox-standard and changed-app ESLint
checks pass. Construction and world deformation remain partial in the parity ledger.

### Buildings on deforming ground — 2026-09-09

`app/building-terrain.ts` reconstructs `00408080`: original rotated grade
vertices, signed average height, four-turn gate, descriptor ground step/tolerance,
newly flooded-vertex delay, strict 20/32 flooding threshold, local slope failure,
and the final clean pass that releases terrain-dirty flags. Descriptor offsets
68/70 are now extracted reproducibly. Worker leveling and building settling share
`stepTerrainHeight` (`0044fde0`), keeping notification order and signed writes.
`0040b860`'s six-cell dock lane predicate is also reconstructed. The native oracle
executes the original shape traversal, averaging, height stepping and dock test;
it supplies queue/notification consumers, class initialization, indicator removal
and warning allocation. All 1,520 cases agree; portable captures cover rotations,
wrapped anchors, height extremes, flooded cells, phase gates and protected states.
Linked occupant/attachment objects are not populated in this native oracle.

`00406f40` ejects occupants when the state-3 initializer's two-turn delay reaches
one, then destroys at zero. Uneven-ground destruction calls `00407860` with stage
-1 and no reduced launch override: current construction-stage face masks/caps and
the initializer's stronger speed, upward launch, bounce and spin now remain intact.
The existing debris oracle now covers both damage and terrain-collapse modes:
1,260 calls, 44,284 faces, 8,192 flight snapshots and 128 splash initializers.

Flooding retains the building mesh/stage as class-10/model-19 (`00500a30`), with
an 80-turn lifetime. `app/building-sinking.ts` reconstructs `00503550`, `00503e60`
and its angle interpolation: original water-category probes (including overlapping
neighbor counts), retained wet-side direction, tipping, acceleration, wrapped
drift, fall speed, spin reversal and clamped pitch/roll. All 12,800 native snapshots
agree, including four orientations, wrapped positions, wet/dry/mixed ground and
advanced tilts. Only cell relocation and object removal are intercepted; native
shape, terrain-category and angle routines execute. Portable trajectories preserve
the complete 80-turn sequence. Render projection and model lighting now receive
pitch/roll alongside heading, using the existing fixed-point model matrix.

Live terrain notifications now reach allocated buildings. Small changes settle
without entering repair. Terrain collapse retains its model through evacuation,
then releases workers/occupancy and emits detached faces or a sinking mesh. The
browser check covers a real first-mission hut, GPU face/mesh pixels, original
model and stage, tilt, drift, height and 80-turn cleanup. Four-orientation portable
scenarios check healthy settling and both destruction paths. Recovered controller
fields stay separate from the live repair state; shared debris emission removes
the duplicate damage/terrain rendering path.

Boundaries: the class-7/model-1 collapse explosion (`0050b6f0` configures it),
attacker statistics, native allocation failures/stack ownership, pool counts,
class counters and mixed-class dispatch remain open. The browser evacuation
adapter still supplies door placement; complete original panic movement is not
claimed. Dock warnings and linked indicator/attachment objects are reconstructed
consumers but have no live first-mission owner. Vault-specific state 5 (`00407060`)
is exported for later work; it is separate from ordinary building sinking.
`00408d00` and `00500e20` are research exports, not additional parity credit.
The identified export manifest contains 948 files. Construction, deformation,
and full debris parity remain partial; discovery remains open.

Final validation: all 129 portable checks pass. The occupied-hut regression found
and fixed premature drowning inside standing buildings: the shared follower
support predicate now retains living building occupants until evacuation, while
terrain-only route points still use the coastal predicate. Real browser terrain
collapse renders 49 detached faces (7,054 pixels); sinking retains its original
mesh/stage (3,977 pixels), and removing pitch/roll changes 4,213 pixels, proving
that the recovered tilt reaches GPU projection. Timed drift and cleanup pass.
All four ground-plan/leveling/scaffold rotations, the full Lightning/fire/repair
sequence with PCM work cues, and all 336 frozen GPU sprite poses pass. Fallow
reports 84.8 maintainability, 2.8 average complexity, no dead exports, and the
existing three cycles/three unused dependencies. Focused ox-standard checks and
changed-app ESLint pass. The whole-app ox-standard run still reports existing
style debt in older modules; that broader migration is not claimed complete.

## 2026-09-09 — shared Blast/collapse wave and native follower flight

`app/blast-wave.ts` reconstructs `0050b630`/`0050b740` and the alliance
helper `00416d70`; `004da080` now supplies shared person damage in
`app/person-update.ts`. Source identity is the manifest's D3D executable
SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The type-2 indexed search intentionally retains repeated cell visits and the
native friendly flag's lifetime across object classes. Range-scaled impulses,
vertical force, allied final-pass/five-visit cap, shields, signed life storage,
building damage accumulation and remaining/radius progression retain native rules.

Blast and reason-1 terrain collapse allocate the same hidden three-turn force
controller and cue 0xa1. The visual Blast flash remains a separate object.
Live flight reuses `stepPersonPhysics` (`004e6d00`) for velocity caps, slope force,
gravity, bounce, spin, landing damage and settling. The renderer uses native height;
landing, debris and fire share effect-3 spark allocation. Ordinary browser orders
resume after settling. Airborne bodies survive negative life until landing.

The first real-browser attempt exposed a missing imported pose: animation row 2
is distinct from row 12's airborne pose. The importer now reads launch identities
from native tables and appends their frames/pieces. All prior 336 fixture poses
and 2,672 piece hashes remain identical; 56 launch fixtures and 220 original pieces
extend coverage. No old golden expectations were silently rebaselined.

Checks: `scripts/check-native-blast-wave.py EXE --record` compares 256 complete
native wave passes and 512 direct damage calls (64 of each retained for Node).
`scripts/check-native-physics-driver.py EXE` compares 8,192 full driver snapshots
and 4,096 bounce calls. `scripts/check-native-sprite-layers.py EXE --record` compares
7,068 native layer submissions, 2,892 original RGBA pieces and 392 durable poses.
`tests/blast-wave.test.mjs` checks live three-pass allied launch, native motion,
landing and subsequent command acceptance. Existing immediate-Blast assertions
now wait for the documented native wave passes.

Limits: live ordinary allocations still supply approximate mixed-class/cell order;
scenery shake rendering, native first-hit building feedback, panic/vehicle consumers,
complete person state dispatch, reveal/path-group ownership and native allocation
limits remain open. These checks do not establish whole-game or whole-frame parity.
The global known-scope checkpoint score remains 17/96 (17.7%); discovery stays open.

Validated desktop integration: actual mouse Blast, three wave passes, pause,
original launch pose (145 changed GPU pixels), native height and shadow, both
impact cues, original landing spark and cell cleanup. Expanded sprite GPU checks
pass 392 poses/290 frames/93,898 colored pixels with the served atlas hash;
healthy building settling, 49-face collapse and sinking/tilt regressions still pass.
`npm run check` passes 133 tests, TypeScript and parity consistency; the production
build succeeds and 950 exports verify. Focused ox-standard has no errors (existing
warnings remain), changed-app ESLint passes; Fallow reports 84.7 maintainability,
2.8 average complexity and the existing three import cycles/unused dependencies.
Full-app legacy lint and engine ownership debt remain open.

Final flight audit also connected wild followers' state-8 landing initializer in
`004d2740` through the shared state initializer. The existing native oracle now
covers 5,632 initializers including 512 additional state-8 cases; live wild followers
land and survive without an unsupported-state exception. Complete wild movement
and lifecycle remain outside this initializer's verified scope.


## Terrain texel-center sampling — v134

The original close-land triangle dispatcher `004673b0` supplies inset UV
endpoints when smooth filtering is active: half a texel at either edge. The
browser previously sampled each atlas tile's outer edges. Land now has a separate
UV attribute with the original 32-pixel tile endpoints; world coordinates still
supply the scrolling sea. Terrain diagonals, heights and palette pixels are retained.

`scripts/check-native-terrain-uv.py EXE` executes the original dispatcher up to
Direct3D triangle submission and checks 64 cases: 16/32-pixel textures, eight UV
orientations, smooth filtering and the raw-coordinate option. The portable fixture
is tied to the executable SHA and compared on every native run. The GPU terrain
check validates all cell endpoints and detects 336,038 changed pixels against
edge sampling. The existing 80-sample material calibration now writes the separate
land UV attribute and still verifies the same expected palette colors.

This verifies triangle endpoints, not hardware rasterization or the complete
texture cache. Cache fallback, other graphics settings, globe/model UV ownership,
clipping and matched whole frames remain open. No broad parity checkpoint is closed.

Validation: 134 portable tests, TypeScript and parity consistency pass. Browser
terrain deformation, healthy building settling, collapse and sinking/tilt pass.
Changed-file ESLint and focused ox-standard pass; Fallow reports 84.8
maintainability and 2.8 average complexity, with existing repository debt retained.
The production build succeeds. Known-scope coverage remains 17/96 (17.7%), with
discovery open and the full goal unfinished.


## Camera-sized sky and defeat flash — v135

`00517630` copies the current camera horizon into the sky surface height, emits
the full-UV backdrop quad over that height, then submits both type-2 cloud layers.
The browser had stretched the backdrop and cloud geometry across the full window.
Both now use the live camera horizon, including every zoom-transition frame.
Zero-height skies have no visible area. Backdrop texture filtering now follows
the existing encoded-palette bilinear path. `00429f90` separately clamps the
ordinary ground-view defeat-flash surface to the viewport; the flash shader now
uses the resulting rectangle instead of discarding its height.

The extended `scripts/check-native-clouds.py EXE [--record]` executes nine complete
outer dispatches and retains original backdrop bounds/UVs and 756 cloud triangles,
including zero horizon. It also executes the nine flash-surface updates. Existing
128 lens updates/4,992 triangles and 1,024 native defeat-flash allocations pass.
`tests/fixtures/sky-horizon.json` is executable-bound and rechecked on native runs.
The portable check compares captured cloud coordinates/fades with the existing port.

Browser checks cover 12 view/size states, all zoom frames, backdrop and both cloud
layers, zero horizon, real keyboard rotation, pause-independent cloud motion and
overview return. The normal-view height comparison changes about 398,000 pixels.
The isolated flash shader draws 527,000 pixels inside its native rectangle and
zero outside. The filter calibration now covers 96 palette-color samples including
the backdrop. Camera QA selects the battlefield canvas explicitly so a tooltip's
canvas cannot make its locator ambiguous.

Scope: original type-2 sky in the current ground-view adapter. Other sky modes,
full draw-mode/viewport ownership, device blending and matched whole original frames
remain open. Ordinary-view horizon screenshots supersede the earlier unused-preset-1
capture; no speculative terrain bound or distant-model lighting changes were made.
The full game goal remains unfinished, with discovery open and no new verified
checkpoint credit.

Final checks: 135 portable tests, TypeScript, parity consistency, changed-file
ESLint and scene ox-standard pass (existing warnings remain). Expanded nine chained
assignments and used a spread for DOM children while removing the scene's remaining
ox-standard errors; no new abstraction or dependency was added. Fallow still exposes
legacy complexity/import debt. Browser camera and all 96 texture-filter samples
pass, and the production build succeeds.


## Native visible-cell boundaries — v136

Recovered `00467130`'s ground-row traversal and its `0046d070` cell loop. A cell
uses the following vertex row's bounds, and the column span is half-open. The
browser instead used the current row and included the end column. It also reduced
positions to half-map precision before determining the cell: odd camera coordinates
could shift an exact boundary into its neighbor. Visibility now determines the
512-unit cell first, with separate wrapped object and unwrapped terrain-copy paths.
`RenderView.visible`, picking and the shared GPU visibility shader use these rules.
An obsolete fractional-center uniform and unused model-world calculation were removed.

`scripts/check-native-visible-cells.py EXE [--record]` executes native frame setup,
row traversal and complete cell enumeration. Vertex projection and object consumers
are intercepted, terrain polygon generation is bypassed through the native graphics
flag/class branch, and execution stops before frame postprocessing. It compares
64 traversals, 135,021 visited cells and all 1,048,576 cell-membership decisions
across four resolution groups, four presets, eight headings and wrapped centers.
The executable-bound portable fixture additionally checks four subcell positions
and unwrapped equivalents. The new raw export brings the manifest to 951.

The real shared shader and CPU view agree with 1,216 native-captured boundary
probes. GPU probes deliberately fix screen projection so an offscreen point cannot
hide a wrong visibility decision. Live scenery survives four rotations/rebuilds;
ground interaction covers picking, four placement rotations, invalid rejection,
placement and terrain invalidation. All 392 sprite poses/290 frames/93,898 colored
pixels still match the existing atlas fixtures. The scenery regression now recreates
close proximity explicitly: subsequent native building-anchor corrections had moved
its original tree/hut pair outside the obsolete filter's radius.

Scope: visible-cell membership, not full original occlusion. Cell concealment/reveal,
object-specific flags and pool ownership, painter/depth ordering, native picking
and matched whole frames remain open. Distant model darkening remains native;
this change does not claim that the far silhouettes have been resolved. Next compare
the native concealment/reveal gates in the playable first-mission views.

Final validation: 136 portable tests, TypeScript/parity consistency, changed-file
ESLint and focused ox-standard pass (existing warnings remain). Fallow reports
85.0 maintainability and 2.8 average complexity, with existing three import cycles
and unused dependencies. The production build succeeds. Known-scope coverage stays
17/96 (17.7%), discovery stays open, and full game parity is unfinished.


## First-mission fog audit — after v136

The supplied `levl2001.hdr` byte 98 is zero. `00410d00` forwards this byte to
`0042b590` / `0042b230`; its low bit supplies runtime level flag 2. Complete
`00443910` clears flag 4, then sets it only when flag 2 is present and load flag
`0x200` is absent. The live first mission's zero fog flags match this path.
Concealment must not be enabled merely to hide the distant silhouettes.

Run `scripts/check-native-first-mission-fog.py EXE EXTRACTED_LEVELS` with the native
Python environment. It executes forwarding span `00410da2..00410dc1` and selection
span `0042b286..0042b2a7`, including complete `00443910`. The original header hash
and forwarded banks/flags `[12,0,0]` match the imported level; all 768 flag/override
cases preserve unrelated bits and the native indicator. The current `createWorld`
fog flags are checked against the original first mission. This does not emulate
file loading, campaign setup, all loader side effects or reveal ownership.

Seven retained exports document the header/load paths; there are now 958 verified
exports. No runtime implementation changed and v136 remains the playable build.
Other missions, saved/editor/multiplayer overrides, cell reveal, concealment bytes
and complete occlusion remain open. Next compare native painter/depth ordering.


## Native polygon ordering captured — after v136

`check-native-painter-order.py EXE [--record]` captures 70 mixed ground/model
queues and 1,036 triangles into `tests/fixtures/painter-order.json`. Complete
`0046e930` (ground) and `004718c0` (model) enqueue routines execute, followed by
`004673b0`, `0047d8a0`, `0047c7e0` and the final triangle emitter `004f9380`.
Texture-cache records are supplied, the batch receiver is redirected to allocated
storage, and the three cache-maintenance calls from `0047c7e0` are skipped.
The capture includes queue buckets/order, each final triangle's constant depth,
rhw=1 and output indices. Re-running without `--record` verifies the stored
executable-bound capture. This does not emulate original hardware rasterization,
full model/terrain traversal, texture batching, alpha passes or an entire frame.

Buckets run from 0xe00 down to zero; their linked lists prepend new polygons.
Equal-bucket polygons therefore draw in reverse insertion order. `0047c7e0`
assigns successively nearer depths to the resulting commands; `004f9380` copies
one command depth into all three vertices. Geometric depth is not interpolated
across their screen coverage. Ground flag 0x40 adds 0x100 before bucket division;
model bias is applied after division. `004708d0` derives model bias from both
object and face records; the current importer does not retain these fields.
Original quad model faces are submitted as two individually bucketed triangles.

`node scripts/check-browser-painter-order.mjs` compares six captured pairs with
the actual shared native-position shader. It holds screen coverage fixed,
retains live geometric depth for the current pass, and replays captured native
constant depths for the reference pass. The native pass selects the expected
winner at all 38,646 fully covered pixels; the current pass differs at 30,231.
Multisample edges are excluded. `--require-parity` deliberately fails while that
live-renderer discrepancy remains. It is a diagnostic, not an integration pass.

There are 959 verified exports. No runtime change is included in this capture;
v136 remains live. Integrate mixed command ordering, biases and tie ownership
before claiming this gap fixed. Full-scene native submission, clipping, alpha
passes, picking and matched first-mission frames remain unverified.


## Polygon ordering integrated — v137 candidate

The shared renderer now gives terrain/model triangles and sprite layers constant
command depths. Original polygon buckets, reverse insertion ties, raised-ground
flags and signed object/face biases are retained; the importer verifies all 55
model bias arrays against original records. The portable fixture covers all 70
native queues/1,036 triangles. Twelve controlled browser comparisons (separate
and shared materials) now agree at all 77,292 interior pixels. Each object owns
its draw uniforms while retaining shared textures and cached shader programs.

The 392-pose sprite, placement/picking and globe-footprint regressions pass.
Old shadow and relocation fixtures now use physical flight separation and the
simulation's map anchor respectively. The inspected live terrain frame preserves
native lighting and fog; distant dark models remain unresolved. The isolated
ordering check is not a matched original-frame comparison. Full non-person cell
chains, batch/alpha ownership, native clipping and picking remain incomplete;
source creation ordering and large-frame depth scaling are explicit adapters.

Parity revision 2 counts independently verified requirements within fixed broad
checkpoint shares. Its baseline adjustment credits previously reviewed work and
is recorded as a measurement revision. Primitive ordering earns a separate real
increment; full raster fidelity remains partial and discovery stays open.


## Live-model submission replay — after v137

`node scripts/capture-browser-models.mjs` captures real first-mission meshes,
camera configuration and twelve screenshots in `/private/tmp`: normal, close and
bird's-eye presets at four bearings. It checks the live painter's triangle
eligibility and records reconstructed positions, shades and buckets.
`python scripts/check-native-live-models.py EXE /private/tmp/populous-live-models.json`
loads hash-verified original object/face/point banks and invokes complete 004708d0
without intercepted callees. 366 model calls and 7,430 queued triangles agree.
The supplied model poses are browser state; original simulation pose ownership is
not inferred from this check. Vault morphs and noncompleted models are excluded;
tribe texture selection, global cell traversal and final GPU pixels are separate.

This exposed command-allocation differences hidden by the GPU's later clipping.
0046d970 first rejects common left/right/bottom screen outcodes, then computes
winding; it deliberately has no shared top-edge rejection. The painter now applies
this completed-model gate before assigning depths. Construction keeps its separate
two-sided behavior. Portable native winding fixtures and edge regressions protect
the helper; the live capture checks actual submission slots.

Distant model shades agree with the original, including shade 1. The original
0046e930 terrain path also supports quadratic attenuation controlled by 0089ce45
and byte 0089ce41; their initial mapped values are zero and direct writes found
so far are debug controls. Runtime initialization/indirect ownership has not been
established, so no terrain attenuation or lighting adjustment was made. The source
screenshots are not matched first-mission camera captures. Continue mixed queue,
alpha and original whole-frame comparison; this evidence does not resolve all
visible differences and does not earn a new checkpoint fraction.


## Deferred transparency ordering — after v138

0047c7e0 puts alpha-mode records in a FIFO through record +8; 0047ce50 consumes
that chain after opaque batching. The native painter check now repeats each of
70 captured queues with mixed opaque/alpha mode flags and verifies all 774 alpha
records in command order. The fixture retains this alphaOrder alongside original
bucket order/depth values. Cache-maintenance calls remain intercepted as described
above; mode inputs are supplied. This does not prove every original render-state
selection or device blend factor.

The browser previously sorted translucent objects with Three's fallback camera,
which does not describe the original projection. Eight controlled overlapping
sprites reproduce incorrect blends under camera/insertion changes. Transparent
meshes also require individual triangle ordering when they straddle a sprite.
The renderer now exposes those triangles through temporary geometry draw groups
and sorts them with the same constant-depth stream used for opaque occlusion.
After rendering, original material/group references are restored in reverse order,
including shared geometry. Screen overlays retain their explicit ordering and
world overview retains its separate renderer.

`check-browser-sprite-order.mjs` checks eight sprite overlaps and four interleaved
mesh/sprite cases. The latter produce RGB 64/128/32; replaying the old whole-object
path disagrees. Shared geometry/material restoration is asserted. Real Lightning
fire, original collapse smoke, all 392 sprite poses, spell halos, placement/rotation
and overview effects pass. The fire screenshot was inspected. The smoke regression
now targets the engine canvas explicitly; its prior selector also matched the
noninteractive overlay canvas.

Parity revision 3 separates deferred alpha ordering from remaining blend/depth
modes and source-queue ownership. The new scope's pre-verification baseline is
recorded independently of its verified gain. Full original source chains, native
batch limits, other blend/state modes and matched full frames remain unfinished.


## Cell render passes and retained person order — after v139

The complete 0046ec80 cell renderer walks the same head/next chain twice, first
for sprites/effects and then for ordinary models/construction. 0046d070 calls
this dispatcher before enqueueing the cell's terrain. The native descriptor
byte at 005a6af8 + descriptor * 11 selects the dispatcher class; it is not the
imported animation descriptor's mode field.

`check-native-cell-render-order.py EXE` executes all 120 insertion permutations
of five records (descriptors 14, 15, 2, 10 and 48). Each permutation captures
initial order, same-cell motion, departure and return, totaling 480 complete
cell dispatches. Original 004ee470 insertion and 004ee580 movement execute
unchanged. Four polygon consumers are observed instead of rasterized:
0046f080, 0046f9e0, 004708d0 and 00471c40. Their called object IDs must follow
stable sprite/model passes over the retained chain. The executable-bound fixture
is checked by the portable test against the actual browser cell-list helpers.
Other descriptor types and hidden/drawn flag gates are outside this capture.

The shared painter now orders supported sprites before models before land, then
applies bucket sorting and reverse-insertion ties. People already owned by native
movement use their retained cell-chain ranks instead of object-ID order. Legacy
people and other object classes still use their existing ID/creation adapter;
they have not been inserted into the person-only simulation pool. Explicit
captured polygon sequences retain their original enqueue order in diagnostics.

The browser overlap check adds eight equal-bucket cases using live person-cell
synchronization and controlled colored quads. Scene creation order is reversed;
same-cell moves preserve order, departure removes the follower and return puts
it at the head. A later-ID model in the same bucket must still render behind the
sprite pass. Actual GPU colors distinguish all these outcomes. These controlled
quads prove ordering, not original sprite artwork or whole-frame agreement.

This improves the partial graphics.raster.queue requirement without declaring
complete source ownership or changing its score. Legacy/non-person chains,
allocation order, all dispatch gates, native capacity/flush behavior and matched
original frames remain open.

Validation: 140 portable tests, type checking and parity metadata pass. Original
cell-list replay still matches 8,192 sequential operations. All twelve controlled
native/live depth comparisons, 392 sprite poses, selection, airborne shadows,
placement/rotation and real collapse-smoke checks pass without browser errors.
The smoke frame was inspected. Focused ESLint and oxlint checks pass (remaining
style warnings); Fallow reports 85.1 maintainability and mean cyclomatic 2.8.


## Model material brightness selection — after v140

The original 004673b0 model-polygon dispatcher converts numeric face shades into
modulated diffuse plus warm specular. For modes 3, 4 and 32 it then overrides only
the diffuse value with opaque white. Packed colors, including hover gray, receive
no specular and still get the mode-specific white diffuse override. Modes 6/7
retain their ordinary diffuse. Construction 00471c40 replaces cap faces with
mode 7. The browser previously used one shaded material path for every face,
incorrectly darkening fire and special monument surfaces.

`check-native-model-materials.py EXE` captures 655 native triangle submissions:
five modes, all numeric shades 0–127 and three packed colors. Original 004673b0
executes through the final triangle consumer; texture-cache placement is supplied
and execution stops at GPU submission. Three vertex color pairs must agree. The
executable-bound fixture retains exact diffuse/specular words. This does not
establish original texture-cache population, device blend factors or all modes.

Model geometry now retains a per-vertex texture mode, including cap replacement.
The shared model shader applies the original diffuse override after selecting
numeric or hover lighting. `check-browser-model-lighting.mjs` verifies all 42 live
models' mode attributes and compares 40 GPU samples directly with the captured
native color words. Ordinary dark faces retain their original attenuation;
full-bright modes keep numeric warm light but ignore packed hover modulation.

A real Lightning strike checks the actual original fire model and compares it
with its former shaded material: 413 pixels become brighter and none dimmer.
Animation, original UVs, size/grounding, sound request, smoke and expiry still
pass. The fire frame was inspected. Sprite artwork, airborne shadows and live
selection also pass. Portable cap/hidden-face checks protect material assignment.

This repairs behavior inside existing model-lighting/highlight coverage, so it
adds no new parity credit. Other material modes, complete blend/depth settings,
model UV/cache mapping and matched original frames remain open. The distant
ordinary models still agree with the original numeric shades; this fix does not
claim to resolve their whole-frame appearance.

Validation: 141 portable tests, type checking, parity metadata and production
build pass. All 40 completed/construction face probes and 20 translucent/cell-tie
overlaps pass, alongside placement/rotation, sprite layers, shadows and selection.
Focused ESLint and oxlint pass with existing style warnings; Fallow reports 85.1
maintainability, mean cyclomatic complexity 2.8 and p90 5.


## Model texture coordinates and atlas edges — after v141

004673b0 transforms model-local fixed-point UVs using the texture-cache rectangle
and texel size. With texture_min_mag_value (005d54c8) enabled, the endpoints move
from tile edges to texel centers: 0.5/32 through 31.5/32 for object tiles. The
supplied executable's mapped default is 1, and the checker asserts it. Disabling
the mode retains raw endpoints. The mapping is affine, including fractional and
out-of-tile source values; it is not a clamp. The browser formerly used tile
edges even with its bilinear sampler, blending unrelated neighboring atlas tiles.

`check-native-model-materials.py EXE` now also captures 60 final triangle UV sets,
covering both filter settings, two cache placements, modes 3/4/6/7/32 and three
coordinate sets. Those include construction's 2097150 fixed-point endpoint,
fractions and outside coordinates. Texture-cache placement is supplied; original
004673b0 runs to the final triangle consumer. `model-uv.json` binds the capture to
the executable. Portable checks normalize each cache rectangle into four actual
atlas tiles and verify source/cap endpoints within 1e-7 normalized UV units.

The shared modelTextureUV helper applies this mapping to stage meshes, caps and
tribe-selected debris. Fire animation starts from the corrected stage UVs and
retains its original integer tile shifts. Original imported asset coordinates
remain unchanged. Native construction (2,216 calls/17,948 triangles) and debris
(1,260 calls/44,284 faces) checks now compare their retained native coordinates
through this independently captured final mapping. Position/state comparisons
remain unchanged; UV tolerance accounts for seven-decimal imported coordinates.

`check-browser-model-uv.mjs` verifies all 7,035 UV vertices in 42 live models and
compares actual opening-scene pixels with the previous mapping (57,018 changed
pixels). Sixteen controlled tile-corner probes use the actual model material
and sampler: every corrected sample has the intended tile color, while every old
edge sample contains a neighboring color. Before/after frames were inspected.
Real Lightning fire retains animation, ground/scale, sound, smoke and cleanup.

This corrects texture presentation inside existing model coverage and improves
the partial texture-cache requirement; no new parity credit is claimed. Full
cache population/fallback, alpha-edge color preparation, setting ownership and
matched whole original frames remain unverified.

Validation: 142 portable tests, type checking, parity metadata and production
build pass. Live collapse retains 32 original fragments (four picking-only),
1,227 GPU pixels, motion/spin, camera control, impacts and removal. Fragment
UVs are asserted at the actual GPU attribute. Placement/rotation, 392 sprite
poses, airborne shadows and selection pass without browser errors. The debris
check's obsolete canvas selector now targets the engine canvas explicitly.
Focused ESLint/oxlint pass with style warnings; Fallow reports maintainability
85.1, mean cyclomatic complexity 2.8 and p90 5.


## Transparent object-texture edge colors — after v142

Complete 004b6e60 traverses 256 object tiles after surface creation/conversion.
It scans adjacent pixel pairs left-to-right within each row, then top-to-bottom
within each column. When exactly one saved pixel is zero, it copies the other's
RGB into that pixel with alpha cleared. The saved current value is taken before
its write, so this is not unrestricted propagation. The second pass can use the
horizontal colors. Tile boundaries and row padding are never crossed.

`check-native-texture-edges.py EXE` runs four complete initializations. COM
surfaces, cache creation, allocation and initial pixel data are supplied; original
traversal, both edge loops and sprite-wrapper initialization execute. ARGB4444
and ARGB1555 patterns use 32- and 37-word row strides, including isolated colors,
zero-alpha colors, opaque black and random pixels. All 1,048,576 texels agree
with the import helper after decoding the supplied format. Alpha bytes, padding,
256 allocations and both wrapper lists are retained. Pillow 11.3.0 is pinned in
`decomp/requirements.txt` for the actual PNG comparison.

The imported atlas applies the recovered procedure to its existing RGBA8 pixels.
13,276 transparent pixels gain RGB; every alpha byte and visible texel is unchanged.
The source hashes and PNG are checked against the import pipeline. The browser
probe verifies the served hash, 64 actual PNG/GPU center and bilinear samples,
and RGB retention under zero alpha. An opaque test material initially forced
output alpha to 255; the probe now disables blending while retaining texture
alpha. No alternate runtime loader is needed: the current PNG upload preserves
hidden RGB correctly.

The opening-scene comparison reads the uploaded texture directly, then resets
only prepared non-AL zero-alpha colors to reproduce the previous atlas. Canvas2D
is not an oracle because it discards hidden RGB. AL tiles already retain palette
zero RGB (13,15,6), which the baseline preserves. 7,569 scene pixels lose dark
fringes with no dimmer pixels or opacity changes. Before/after frames were
inspected; actual fire and all 16 model UV edge probes pass.

This is still a format adapter, not complete original texture preparation. Native
004b6e60 operates on 16-bit words; the browser currently retains 8-bit palette
channels. Original format selection/quantization has not been established.
Quantization changes zero-word decisions (palette zero becomes zero in 4444),
so especially AL-tile edge results cannot yet be claimed exact. Trace the native
format selector next; full cache population/fallback, material states and matched
original frames also remain open. The partial cache requirement gains evidence,
not verification credit.

## Object texture format and palette quantization — after v143

This resolves the RGBA8 limitation described above for the native alpha-capable
object path. Hardware initialization 00520cd0 classifies enumerated formats by
channel bit counts. The complete selector 005218d0 chooses blended-object mode
2 before test mode 4, then color-key mode 1; alpha modes prefer ARGB4444 and
fall back to ARGB1555. Without either alpha format it uses the opaque format and
color-key capability. Its separate cutout selection prefers 1555, with a
device-capability override. Disassembly confirms 004b6e60 reads the blended
object format at UI+0x1da8, rather than the misleading inferred `d3+0x6c` type.

`check-native-texture-edges.py EXE` now executes all 128 combinations of
capabilities, format availability and cutout override through the full selector.
It then selects 4444 and runs the entire 256-tile initializer with the actual
hash-checked bl320/palette/AL files. Surface lock/unlock, palette GetEntries,
surface/cache creation and allocation are supplied; 0042f640, mask decoding
00521d90, both original pixel converters and both edge loops execute unchanged.
All 262,144 final texels agree with the imported PNG after normalized 4444
decoding. The existing four synthetic 4444/1555 and padded-row cases still pass.

The importer truncates each channel to four bits before edge preparation and
expands it to normalized RGBA8 for browser storage. This changes 221,169 visible
texels and prepares 17,245 transparent edge texels. Every alpha byte is retained.
In particular, the original AL palette-zero RGB (13,15,6) becomes a zero word,
allowing the native edge procedure to fill it. This removes the previous
zero-word decision discrepancy without adding a runtime shader or loader.

The browser regression checks 128 actual PNG/GPU center and bilinear samples,
including visible quantized colors and transparent prepared colors. Compared
with the same quantized atlas before edge preparation, 7,545 opening-scene
pixels become brighter, none dimmer, with unchanged output opacity. This is an
edge-preparation comparison, not a claim that quantization itself always brightens
pixels. Real Lightning fire, model UVs, textured debris and sprite regressions
remain the integration checks. The browser targets the alpha-capable 4444 path;
hardware fallbacks, complete device enumeration, graphics-setting ownership,
cache population/fallback and matched original whole frames remain open.

## Desktop HUD axis scaling and minimap investigation — after v144

0044a1f0 maps a normalized X coordinate by screen width; 0044a210 maps Y by
screen height with its half-height integer adjustment before division by 65536.
0044b770 uses these independent dimensions for the selected map control.
The browser's shared HUD transform now uses width/640 and height/480 rather than
one height-derived scale capped at two. Its world viewport reserves the resulting
sidebar width. This fixes the 150px sidebar at 1280×720 to the original 200px.

`check-native-hud.py EXE` retains 606 original glyph comparisons and adds 64
coordinate conversions at eight desktop sizes. Logical control positions and
their normalized fixed-point inputs are supplied. `hud-scale.json` records the
executable-bound outputs; `check-browser-hud-scale.mjs` checks raw sidebar/health
bounds within one native integer pixel and the actual renderer's resize.
Existing health, mana, population and portrait checks use independent axes;
exact pixel hashes use integral 2× scaling, with widescreen geometry and gameplay
checked separately. Complete menu initialization/layout, rounding and resampling
remain open. This extends the partial HUD checkpoint without completing it.

The [visual audit](../references/visual-audit.md) records first-mission video
frames and the remaining minimap discrepancy. Newly reviewed exports 004206e0,
00420100, 004202d0 and 0041fce0 cover indexed terrain, camera-relative map wrapping,
eligible markers and heading-dependent texture sampling. 004b64e0 chooses a
power-of-two surface from actual control dimensions; 00517760 forwards its blit.
Those minimap routines are research evidence, not yet CPU-compared browser ports.
Preserve their scope for the next integration rather than crediting the exports.

## Moving-person render interpolation

`0046f080`/`0046f850` interpolate from current position minus signed displacement;
body height adds support height, shadows query ground at the interpolated point.
`004ed700` stamps the completed person controller, while `0049c9f0` supplies the
old measured turn/frame ratio. The new native checker compares 1,024 body/shadow
queue pairs and four post-controller stamps; projection, shadow height and the
stamp test's person-controller consumer are supplied. Fractional browser coordinates
intentionally retain precision (within one native unit of integer truncation);
814 integral cases are exact. Existing cell/displacement checks still cover 8,192
sequential operations. The manifest now hashes 972 exports.

```
.tools/decomp/oracle/bin/python scripts/check-native-unit-interpolation.py /path/to/d3dpoptb.exe
node scripts/check-browser-unit-motion.mjs
```

`app/unit-motion.ts` supplies continuous turn-endpoint presentation without changing
the simulation, RNG or native sprite records. Original flag/writer ownership and
the complete outer scheduler remain partial; elapsed time replaces the legacy FPS
estimate. [Findings and boundaries](../references/reverse-engineering.md#person-render-position-interpolation--2026-09-09)
and [desktop measurements](../references/modern-performance.md) describe the live
integration and its explicit presentation delay.


## Guard-tower sockets and occupant pose

The manifest now hashes 991 exports, including the smoke-offset loader/lookup
`00404640` and `004047b0`. The importer includes original shape sockets and
`data/smoke.txt` corrections. `check-native-building-sockets.py EXE` compares
3,792 complete socket calls; the animation and person-state checks now include
2,048 occupant-pose calls and 512 state-21 initializers respectively. The text
parser and state consumer boundaries are documented in
[the tower findings](../references/reverse-engineering.md#guard-tower-admission-sockets-and-held-occupants-2026-09-10).
Run `node scripts/check-browser-tower-entry.mjs --headed` for actual entry/exit,
raised sprite pixels, pose, roof occlusion and the bounded hardware sample.
Ordinary tower admission is integrated; specialist/AI behavior remains unported.


## Construction-plan panel comparisons

`check-native-construction-panel.py EXE [--browser]` checks 630 complete kind-1
`00504bc0` draw calls and optionally 32 live canvases against original HFX pixels.
`check-native-training-selection.py EXE` adds 128 class-9 worker/control input
cases and plan group-selection dispatch. The existing manifest remains at 991
exports. An unlinked two-row plan's original measurement clips one row; the
browser keeps draw positions and corrects the canvas height. See
[findings and boundaries](../references/reverse-engineering.md#construction-plan-panels-and-live-worker-reassignment-2026-09-10).


## Guard-tower panel and state handoff

`check-native-tower-panel.py EXE [--browser]` compares 168 complete kind-7 panel
calls and 42 source-art browser canvases. `check-native-training-selection.py`
includes 72 native tower input-to-command selection paths. `check-native-resting-slots.py`
checks the existing `004d56f0` consumer now connected to occupied-tower reassignment.
The manifest remains at 991 exports. See
[tower control findings](../references/reverse-engineering.md#ordinary-guard-tower-occupant-controls-2026-09-10)
for supplied consumers and unfinished gameplay/ownership boundaries.

## Fight-site validity and relocation

The manifest now hashes 993 exports, adding `0051e4b0` and the caller `0051de60`.
Run `check-native-melee-placement.py EXE` for 2,048 complete native placement and
validity calls. Collision, building geometry, height, indexed search and cell
movement all execute natively; no consumer is replaced. The test supplies
allocation state/counter phase. The live adapter and chosen-point-only height
optimization are covered by `tests/melee.test.mjs`, `check-browser-melee.mjs
--headed` and `bench-melee-placement.mjs`. Original group allocation, initial
angle/member ordering and global scheduler phase remain open. See
[fight-site findings](../references/reverse-engineering.md#native-fight-site-placement-2026-09-10).

## Melee approach and composed person motion

The manifest now hashes 994 exports, adding the state-25 body `005184e0`.
`check-native-melee-approach.py EXE` checks 4,096 approach/ready control blocks
with native speed/animation/route/terrain consumers, then 96 × 16 composed
control/preparation/physics turns against the actual live adapter. The composed
check supplies reveal/path-list consumers and group allocation/index inputs.
`check-native-melee-timing.py` now seeds the established state-25 arrival/facing
flags before checking knockback. Full global scheduling, initializer cleanup,
command interruption and prefight allocation remain unported. See
[approach findings](../references/reverse-engineering.md#melee-approach-and-ready-slot-transitions-2026-09-10).


## 2026-09-10 — pursuit destination refresh

`00439850` now supplies the ordinary live chase destination threshold. Run
`/private/tmp/populous-reference/tools/bin/python scripts/check-native-pursuit.py /private/tmp/populous-reference/native/d3dpoptb.exe`. Its 4,096
comparisons execute the original entered/valid-target branch while observing the
destination consumer; they do not establish full command lifecycle parity.
See `references/reverse-engineering.md` for boundaries and the live checks.
The manifest now hashes 1,025 exports, retaining associated arrival/fight helpers
for continuing real command integration.

## 2026-09-10 — outdoor encounters

The manifest hashes 1,026 exports, adding `00518480`. Run
`check-native-melee-encounter.py EXE` for 4,096 original outdoor `00518630` calls;
terminal delete/fight creation and sound are observed consumers, while animation,
running speed, routes and slope impulse execute natively. `--record` refreshes
portable captures only after native agreement. `check-native-person-state.py EXE`
now includes generic state-25/29 entry with specialized world bodies supplied.
`inspect-executable.py` retains the distinct +6 running-speed table. See the
outdoor-encounter findings for evidence and unported building/command boundaries.

## 2026-09-10 — fight admission and split groups

The manifest hashes 1,027 exports, adding the release helper `004a3920`.
`check-native-melee-groups.py EXE [--record]` executes 4,096 original admission
and splitting calls, with entry/allocation supplied and real slot selection,
release writes and RNG. Portable captures cover this controller boundary; they
do not prove command restoration or complete group cleanup. See the reinforcement
findings in `references/reverse-engineering.md` for integration and remaining work.

## 2026-09-10 — Lightning strike and electrocution

The manifest now hashes 1,046 exports, adding `004da0d0` attribution.
`check-native-lightning-strike.py EXE [--record]` executes `00511f70`, the state-44
branch of `004d32b0` and `00511ae0` wave configuration. Allocation, common person
physics/status and state-entry consumers are supplied. Shared entry is checked
separately by 512 added `004d2740` comparisons. The imported table now covers
state-44 sprite objects; original RGBA and every old frame/piece slot are retained.
See the Lightning findings in `references/reverse-engineering.md` for live browser
checks and explicit allocation/scheduling/remote-shaman/death boundaries.

### Follower footprint history and close-terrain shading

Run `scripts/check-native-footprints.py EXE [--record]` with the native Python
environment for 18,904 complete `004bf630` emissions / 75,616 `004bf740` storage
calls. No consumers are stubbed. Portable hashes cover the full history and cell
lists, including wrap, cell saturation and ring reuse. The retained renderer uses
original palette darkening checked by `scripts/check-native-terrain-texture.py`;
`tests/footprints.test.mjs` and `scripts/check-browser-footprints.mjs` cover density,
frame-rate independence, actual movement, GPU pixels and incremental uploads.
Full animation/visibility/settings and alternate 16-pixel cache ownership remain
open. Newly exported `0047acb0`/`0047ae00` are unreviewed selection research.

## 2026-09-10 — worship inspection reconstruction

`check-native-worship-panel.py <exe> [--record] [--browser]` compares stone-head
and vault panel draws, original head-panel input, the fifty-slot initializer
`00429ad0` and rotated roster positions from `0043c600`. `--browser` consumes
canvases captured by `node scripts/check-browser-worship-panel.mjs`; the shared
source-art comparator is `scripts/panel_pixels.py`. Reviewed reconstruction and
remaining live ownership work are recorded in the reverse-engineering log.
The manifest now verifies 1,116 address exports. These additions do not complete
the original worship command/admission controller or connect the new panels to play.

## 2026-09-11 — worship place search and command body

Run `check-native-worship-place.py <exe>` and
`check-native-person-worship.py <exe>` for original place-query ordering and the
four command-27 phases. `--record` refreshes their portable captures. The manifest
now verifies 1,119 exports, adding `0043c340`, `004a8e70` and `004ea6b0`.
The last export's nontrivial building/coast/vehicle branches remain unreviewed;
the place oracle currently executes its ordinary dry-terrain path. Live command,
route and roster integration is still unfinished.


Live spell-head worship (2026-09-11): `check-native-person-routes.py --record`
now covers complete `004ea6b0` building/coast/vehicle endpoint correction (2,048
cases); `check-native-worship-place.py --record` also executes 1,280 ordinary
`004a8b00` head timer visits. The existing command-27/place reconstructions are
connected through `app/live-worship.ts`. See the latest reverse-engineering entry
for live tests, deliberate prayer-frame handoff and remaining admission, retry,
vehicle, vault, trigger, contextual-panel and scheduling boundaries.


## 2026-09-11 — timed-head admission, selection and model height

`check-native-worship-admission.py EXE [--record]` compares 1,536 original
`004fb270` timed-head visits (real cell traversal/eligibility; presentation consumers
supplied), 256 command-113 selection cases in `0043e8e0` (roster supplied; actual
flag writes/eligibility retained) and 55 complete `00509000` model-height calls.
The height check reads `objects/objs0-2.dat` beside the supplied PE; no executable
or proprietary object data are embedded in the check. Portable captured inputs
and outputs retain the executable hash. The live ordinary stone-head panel now
uses these rules; exact `0043c600` standing-slot lookup is distinct from reward
admission. Vault anchors, general triggers and full input ownership remain open.


## 2026-09-11 — building-aware area selection

`check-native-drag-occupants.py EXE [--record]` executes 1,024 full `004449d0`
commands and verifies 4,096 person records. The actual `004e3430`, `004de610`,
`004de680` and `0040a3f0` calls run against supplied native cell chains, building
records and shared command slots. Only UI refresh and voice playback are hooked;
selection flags/voice choice match and all other person bytes stay unchanged.
The portable captures retain the executable hash. No new binary export was needed.
Vehicle/passenger admission and full native traversal/speaker order remain open.


HUD follower controls: `app/hud-selection.ts` ports ordinary category-0
`00451720/004518c0/00451ac0` searches and `004de810` focus cycling; class/total
callbacks `004a0f00/004a1010/004a1090/004a1120` feed producer `00450f30` and existing
tribe commands. `004513e0` is retained as category evidence; its unused category-0
result does not justify a separate TS classifier. Run
`python scripts/check-native-hud-selection.py EXE [--record]` for complete native
selection/focus and actual callback comparisons. Vehicles, category ownership and
priority-field lifecycle writers remain open.

## 2026-09-11 — mixed painter hit ownership

`check-native-world-picking.py EXE [--record]` executes the original mixed painter,
person scaling/tower gates and `00475550` model-bounds producer. Raster consumers
are intercepted, hit ownership is not. Captures feed `tests/world-picking.test.mjs`.
The existing live-model capture/comparison also checks invisible hit faces and
bounds against full native model rendering. `004762b0` is retained as unported
building-deformation evidence. See the reverse-engineering log for covered cases,
modern overflow corrections and unfinished traversal/input ownership.

## 2026-09-11 — command target handoff

Run `python scripts/check-native-command-target.py EXE [--record]` for 144 native
contextual classifications, command transports and order encodings. Direct enemy
people and friendly buildings retain their IDs; friendly people use cell context,
while enemy buildings create area orders. The live check covers target choice,
not complete contextual/area/queue ownership. `00437750` contextual priority and
`0043d7d0` building footprint eligibility are exported but remain unported.

## 2026-09-11 — automatic contextual priority and building cells

`app/command-context.ts` reconstructs the non-ghost automatic priority branch of
`00437750` with shared original descriptor masks. Run
`python scripts/check-native-command-context.py EXE [--record]` for 8,400 complete
native choices, then `python scripts/check-native-command-cells.py EXE [--record]`
for 3,888 composed footprint-registration/context cases and live cell comparisons.
Only registration texture refresh is intercepted in the latter. Manual/ghost-only
choice, complete classification/eligibility and area/queue execution remain open;
see the reverse-engineering log for the exact boundary. No new export was needed.

## 2026-09-11 — move input eligibility

`python scripts/check-native-move-eligibility.py EXE [--record]` compares 5,120
complete `004380f0` command-3 validations followed by `004aa8b0` input production.
Collision runs natively; transport, allocation, audio and UI are recorded consumers.
Disabled contexts produce no command/marker/cue. Existing `restingCellCollision`
is reused by the live input gate. Transport ownership, ghost-only/manual priority,
all other command validators and full buffering/execution remain open.

Research correction: the alternate `00437750` branch checks ghost-only selection
(flags4 bit 0x800), not building occupants (flags2 bit 0x800000). No ghost integration
is claimed by the existing ordinary-priority comparisons.

## 2026-09-11 — construction command wrapper

`check-native-construction-order.py EXE [--record]` compares 4,096 visits to
`00495520`, including original worker registration, circular slot lookup,
allocation/attachment/reference ownership and task-1 approach consumers.
Tasks 2–9 and final world submissions remain supplied leaves; see the
reverse-engineering log for the exact boundary. Portable captures feed
`tests/construction-order.test.mjs`. The newly registered `00436be0` export
supports the shared slot-search reconstruction. Live plan identity/lifetime and
hauling integration remain unfinished; this does not certify construction queues.

## 2026-09-11 — construction timber hauling

`check-native-building-fetch.py EXE [--record]` compares 9,216 task-7 visits and
its actual movement/wait/geometry/RNG/reservation/transfer consumers. Resource
cache results, route submission, final output and scenery/plan work mutations
are supplied leaves; see the reverse-engineering log for exact boundaries.
Captures feed `tests/building-fetch.test.mjs`. The new source exports include
`004394e0`, `00439740`, `00493910`, `00493f10` and `004a8e20`.
Shared resource cache scheduling and live plan/person ownership remain open.

## 2026-09-11 — shared construction resource searches

`check-native-timber-search.py EXE [--record]` compares **5,376** original
query/leaf calls and **4,987** sequential cache operations. The original indexed
searches use the SHA-verified `MWSEARCH.DAT`. Allocation, linked lists, candidate
ordering/reweighting, availability, turn budgets, invalidation and expiry execute
natively. Building entrance/work values and candidate path-cost results are
supplied consumers. Portable captures feed `tests/timber-search.test.mjs`.

Fifteen newly registered exports span `00493540`, `00493560`, `004935a0`,
`00493770`, `00493a40`, `00493af0`, `00493d50`, `00493fa0`, `00494360`,
`00494490`, `00494720`, `00494a20`, `00494d10`, `00495390` and `004a8e10`.
`00494d10` is exported but its path-search composition is not yet reconstructed;
its supplied results in the lifecycle check do not certify the path consumer.

The port uses ordered arrays for private candidates and a Set for segment
uniqueness, preserving native visible ordering/counters without private pointer
IDs. Exhausted indexed searches postpone expansion instead of consuming native
uninitialized stack data. This explicit correction has a separate regression.
Live task-7/cache integration and persistent construction plan/person ownership
remain unfinished; no construction queue parity credit is awarded here.

## 2026-09-12 — shaman reincarnation lifecycle

`check-native-reincarnation.py EXE` now executes two shaman and three ordinary
`00502910` initializations, then `005029d0` for both complete 468-visit lifecycles
plus two failed-allocation/retry visits. It checks linked fields and matches the
browser's 4/128/3/32/300-turn phases, 40-unit rise, shaman events/retry and
ordinary deletion. Original frames are 680/352/360 for shamans and 304/312/320
with draw classes 14/15/16 for braves, warriors and preachers.
Allocation, audio, registration and deletion remain supplied leaves. The same
checker keeps the earlier 2,048 static-stone position/height/heading comparisons.

The live world creates model-12 presentations at the death position and reuses
the imported layered unit atlas. The browser check observes shaman respawn plus
ordinary corpse pixels, frames, rise, hidden wait and deletion. Static-site timing,
relocation, particles/audio, general class-10 scheduling and unplayable follower
models remain open.
