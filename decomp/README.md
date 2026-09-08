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
