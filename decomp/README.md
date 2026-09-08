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
| `004e93f0`, `004e6d00`, `004ebc20`, `004e9be0` | `app/person-motion.ts`, `app/person-physics.ts`, `app/native-terrain.ts` | Complete physics driver CPU-compared with explicit world consumers; grounded celebrant adapter live, full airborne/state integration unfinished |
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
