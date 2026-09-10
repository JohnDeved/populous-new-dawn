# Goal: full Populous: The Beginning parity

Status: unfinished. The first mission is playable; full game parity has not been achieved. Execution pause/resume is controlled by the thread goal service.

Recreate the user-supplied original for desktop browsers. Match its world and camera, original graphics and audio, controls, simulation, all gameplay classes, campaign, saves and multiplayer. Desktop keyboard/mouse and a monitor are the target; mobile support is not required. Continue publishing validated playable builds to the existing private Site.

## Main priority: modern desktop compatibility

User direction, 2026-09-09: parity must coexist with a smooth, performant game that
looks good on modern hardware, web technology and displays. Preserve the original
gameplay rules, timing and visual identity while correcting legacy resolution,
aspect-ratio, buffer-size and frame-rate defects. Reproducing those defects is not
a completion requirement. This applies throughout the work, before deeper parity
tasks when a compatibility issue affects play.

- **HUD and displays:** keep text, controls, markers and hit targets readable and
  aligned across ordinary desktop, widescreen, ultrawide, 1440p/4K and high-DPI
  displays. Test resizing and display-scale changes; prevent clipping, stretching,
  overlap and unused or unreachable controls. Supersede the legacy independent
  HUD axis scaling from 06b07bd with uniform artwork proportions, bounded automatic
  sizing and a saved user size preference; wider screens must gain battlefield space.
- **Graphics:** fix aspect-ratio, projection, culling, picking, texture/buffer and
  precision problems exposed by wider or higher-resolution viewports. Native
  fixed-size allocations are evidence of the old implementation, not limits to
  impose on the browser renderer.
- **Timing:** preserve original game speed using elapsed time and the intended
  simulation clock. Rendering, input, animation, effects, camera and audio must
  behave correctly at low, ordinary and high refresh rates, under frame-time
  spikes, after tab suspension and when resuming. Nothing may speed up or slow
  down merely because the display refresh rate or machine performance changes.
- **Uncapped rendering:** user direction, 2026-09-09: do not impose a fixed 30/60
  fps rendering cap. Present at the browser/display's available refresh rate.
  Higher frame rates must produce smoother movement, camera motion and effects,
  using interpolation where the original simulation advances in discrete turns.
  Animation clocks, sprite-frame selection, effects and audio must depend on
  elapsed game time, never rendered-frame counts. Preserve authored animation
  cadence without tying game speed to display refresh. Verify low, high and
  irregular frame rates; high-refresh presentation must improve smoothness as
  well as leave simulation outcomes and intended durations unchanged.
- **Performance:** aim for smooth presentation at the display's refresh rate,
  with a practical 60 fps baseline on representative modern desktop hardware.
  Profile frame time, stutter, memory and allocation pressure in real gameplay,
  including populated scenes and heavy effects. Fix bottlenecks; do not hide
  timing errors by changing game rules. Headless/software-renderer results alone
  cannot establish hardware performance.
- **Verification:** keep desktop geometry/rendering regressions and elapsed-time
  checks at representative 30/60/120/144 Hz schedules, including irregular frame
  times. Record tested browser, hardware, resolution and limitations for actual
  performance measurements. Full completion requires these compatibility checks
  as well as the original-behavior checklist.

Document deliberate compatibility corrections with their native evidence, reason
and regression check. Keep them distinct from accidental parity differences and
from verified original behavior; they do not create extra parity points or erase
unfinished scope.

**Performance takes precedence over copying implementation details.** User direction,
2026-09-09: never sacrifice performance merely to reproduce the original code path.
Target observable gameplay, timing and visual parity, not the original renderer's
architecture, allocations or scheduling accidents. Prefer modern web/GPU techniques,
batching, instancing, caching, appropriate data layouts and better algorithms when
they deliver the intended result more efficiently. These are options to evaluate,
not a requirement to add complexity or dependencies.

Prove and document each such choice: record the native behavior being preserved,
the implementation alternative and reason, a runnable comparison/regression check,
and before/after performance measurements under the same representative workload.
Report measurement conditions and limits; distinguish microbenchmarks from complete
game frame times. Do not claim a performance improvement from intuition alone, and
do not weaken correctness checks to make an optimization pass. If fidelity and
performance conflict, find a better implementation or document a modern compatibility
correction rather than accepting a slower native-style port solely for parity.

## Revised working objective

Treat clean, readable, maintainable, concise and simple TypeScript as a main
priority throughout parity work. Allocate time to refactoring existing ports;
use Fallow, ox-standard and Ponytail in the regular development workflow.
Reconstruct original behavior in idiomatic game code, keeping raw decompiler
output and address-level bookkeeping in the decompilation evidence.

## Current execution order: finish tree ambience, then biggest noticeable improvements

Latest user direction, 2026-09-10: finish the current tree-ambience correction,
then prioritize changes with the largest noticeable impact on playing the game.
Assess the current playable build and choose concrete gaps in core gameplay,
spell effects, controls, HUD and world presentation. Prefer complete playable
improvements over further isolated native helpers. Decompile and integrate deeper
systems when they are needed for the selected visible result. Remaining audio
edge cases and the staged attack-controller work are candidates, not prerequisites
that delay higher-impact work. Preserve full-game scope, clean code, modern
performance and original mechanics; record evidence without inflating parity.

Previous user direction, 2026-09-09: finish and validate the current terrain
performance improvement, then resume important gameplay mechanics and visuals.
This supersedes the requirement to finish the entire modernization audit before
adding parity features. Keep clean, concise code, modern web/hardware support,
uncapped timing and measured performance as acceptance criteria for every change.
Retain unfinished audit findings; prioritize them when they affect the feature
being implemented rather than delaying all visible gameplay work.

## Modernization foundation and continuing requirements

Retained 2026-09-09 requirements: apply modern performance, rendering,
uncapped-frame-rate and maintainability standards throughout existing and new
work, following the revised execution order above.
The target is a superior modern presentation with the mechanics, timing, input
response and gameplay feel an experienced original-game player expects.

Audit and improve the existing render loop, simulation clocks, camera/input,
unit movement/animation, terrain/water/lighting, models/sprites/effects, HUD,
audio, gameplay systems and asset/resource lifecycle. Use measured profiles and
native/gameplay regressions to guide refactoring; prefer clear, concise modules
and modern efficient implementations over literal ports. Do not casually change
mechanics or add input latency to make motion appear smoother.

Track findings, measurements, fixes and remaining limits in
[the modernization audit](references/modern-performance.md). The initial elapsed-time cap fix and whole-frame baseline are now recorded;
continue with the largest remaining measured problems. Continue reviewing these areas alongside visible parity work, following the revised execution order above. Green checks for one rendering primitive or a fast conversion
microbenchmark cannot complete this audit or establish overall smoothness.

Achieve full game and engine parity through an ongoing decompilation and browser reimplementation of the user-supplied Populous: The Beginning. Make the reverse-engineering work a maintained part of `/Users/johann/populous-browser`: reproducible tool setup, executable identities, address-based exports, reviewed reconstructions, findings and native comparison checks. Research available symbols and reusable projects, reuse applicable work with recorded provenance and license terms, and verify cross-version metadata against the supplied executable. Translate recovered behavior into the browser engine instead of replacing it with approximate game rules. Preserve the complete scope above; first-level parity is the immediate integration target, not the definition of completion. Prioritize visible graphics, rendering, effects, UI, controls and critical gameplay before less-visible internals, as specified below. Publish validated builds and leave all unverified differences explicit until the entire game meets the completion checklist.

## Current priority: visible fidelity first

### Global parity tracking

Maintain [the parity dashboard](PARITY.md) and its versioned capability checklist
in `parity.json`. Report evidence-backed requirement progress, a prominent graphics
percentage, whole-checkpoint completion and partial/missing counts; this is a planning metric, not
an estimate of effort remaining or an objective fraction of the original engine.
Only compared, integrated behavior earns verified credit for its stated scope.
Break broad partial checkpoints into explicit, independently evidenced requirements,
retaining their unfinished scope. Do this for the active target **before** implementation
and record the revised baseline separately, so subsequent completions have measurable
gates instead of disappearing into an indefinitely partial checkpoint. The dashboard
shows newly verified and reopened requirement IDs, each subdivided requirement's
percentage-point contribution, and remaining checkpoints too coarse to show progress.
Use two decimal places for accounting visibility, not as a claim of measurement certainty.
Each broad checkpoint keeps one equal share;
verified requirements earn fractions of that share. More subdivisions cannot raise
its maximum weight. Scope revisions are measurement changes, not gameplay gains;
never report their percentage differences as newly completed work.
Record relevant evidence and remaining boundaries after substantive parity work;
reopen regressions. Tests and decompiled routines do not independently add points.
Keep stable checkpoint IDs and scope; increment the checklist revision and explain
any denominator changes. Run `npm run parity:record -- "What changed and was checked"`
to append an assessment snapshot and regenerate the report. `npm run check` validates
ledger/report consistency; native and browser evidence still needs its own checks.
Keep visible fidelity first while retaining campaign, saves and multiplayer in the
global denominator. Maintainability and decompilation support this objective but
do not count as completed gameplay.

The inventory is open and must adapt to discoveries. Report coverage **of known
scope**, not a fixed percentage of everything in the original. Add newly discovered
behaviors as `unassessed` (zero verified credit), expand groups or split broad
checkpoints as needed, and record the denominator/revision change. Keep discovery
open until a full original content/system inventory audit has evidence; reopen it
when new scope appears. Even 100% known-checkpoint coverage cannot establish full
game parity while discovery is open. Unknown work has no invented size or weight.

### Execution order

User direction, 2026-09-08: prioritize what players immediately see, hear and
control, then critical gameplay, before less-visible engine internals. This
supersedes earlier immediate targets about campaign bindings, route ownership or
physics dispatch. Full game and engine parity remains the completion objective;
this changes the order of work, not its scope. Clean, readable TypeScript is a
parallel main priority: make room for refactoring while delivering visible parity.

1. **Graphics and world rendering.** Compare the running desktop game against the
   original screenshots, reference folder and gameplay footage. Fix the largest
   visible discrepancies in terrain, coast/water, colors, lighting, world shape,
   camera projection, models, scale, orientation, grounding and occlusion.
2. **Animation, effects and audible feedback.** Match unit sprite directions and
   action frames, building activity/construction/destruction, spell travel and
   impacts, fire, smoke, particles, shadows and corresponding sound cues.
3. **UI and controls.** Recreate the original HUD, fonts, icons, panels, minimap,
   cursors, selection indicators, tooltips and command feedback. Match desktop
   selection/group orders, mouse/keyboard camera movement and rotation, zoom,
   spell targeting and building placement. Validate actual browser interactions.
4. **Critical gameplay.** Make the visible first-mission loop behave like the
   original: movement and collision, worship/discovery, construction, housing,
   training, mana/spell use, combat, enemy responses and objectives. Fix blockers
   to playing immediately. Extend playable classes and campaign content while
   preserving the visual/control baseline.
5. **Deeper engine parity.** After the obvious visual and gameplay gaps are
   addressed, complete less-visible scheduling, object/order ownership, exact
   internal state transitions, RNG consumption, lifecycle details, save formats
   and multiplayer behavior. These remain required for full completion.

Decompilation continues as a means to reproduce the visible/gameplay target being
worked on. Do lower-level work earlier when it directly blocks that target or
fixes a critical gameplay failure; otherwise defer standalone internal parity
work. Do not spend successive turns on hidden subsystems simply because more
native routines are available to port.

**Modernization follow-up:** the terrain submission/picking optimization is
validated and the execution order above now takes precedence: continue visible
parity while addressing performance issues in the affected systems. Preserve the
remaining audit items, including unit/flyby/globe/transition presentation, sky drift,
catch-up audio, heavy effects, resource lifetime and wide/high-DPI coverage.
The removed elapsed-time cap, indexed terrain, live DPR handling and shared sprite
atlases are the tested foundation; they do not complete the whole modernization
audit. See `references/modern-performance.md` for evidence and open limitations.

The minimap now uses original terrain colors, camera-relative world wrapping and
rotation, with native tribe colors and shaman-circle artwork. Twenty-four browser
captures cover six resolutions through ultrawide/4K; original native generators and
UV submissions agree, and dense rows avoid the original 256×256 buffer limit.
Full mixed-object marker ordering/visibility/discovery ownership and native click
command dispatch remain open. The border still needs the original nine-patch
layout: reviewed `0049d070`/`004a1f50` and table `005cab30` use fixed sprite corners
and tiled edges within a scaled 100×96 control, not the current stretched circular
surround. Follow the timing work with that visible HUD correction.

A first-mission recording at 25/45 seconds confirms the original also has distant
dark model silhouettes and tan low terrain; do not brighten or tint them without
stronger evidence. The footage uses an unverified 2022 executable/settings, so it is
a visual reference, not an exact replay oracle. Continue effects, controls and
critical gameplay alongside minimap/full-frame work.
Object textures now use the native alpha-capable ARGB4444 selection, palette
quantization and row/column edge preparation. The complete original selector
passes 128 capability/availability cases; all 262,144 source-bank texels pass
through original palette/AL conversion and edge initialization. 128 actual GPU
samples cover prepared transparent colors, quantized visible colors and bilinear
filtering. Alpha is unchanged. Hardware fallback selection is CPU-compared, but
the browser currently targets the alpha-capable 4444 path; full settings/cache
ownership and matched whole-frame fidelity remain open. Model, cap, fire and debris UVs now use the original default
half-texel inset. Sixty final native UV submissions, all cap/debris comparisons,
42 live models and 16 GPU tile-edge probes pass. Cache allocation/fallback, all
graphics settings and full-frame fidelity remain open.
Model material modes 3/4/32 now keep full diffuse brightness, including hover,
while retaining numeric warm specular. Construction caps use shaded mode 7.
Compared 655 original material submissions, 40 GPU color probes and actual
Lightning fire. This corrects material-mode selection; it does not resolve the
distant ordinary models whose numeric shades already match the original.
Continue remaining cell/object ownership where ties visibly disagree. The ground
painter now submits sprite-based objects before models within each cell and uses
retained native-person list order, including departure/return changes. Compared
480 complete native mixed-cell dispatches and eight equal-bucket browser overlaps.
Legacy people and other classes still use creation-order adapters; complete
descriptor dispatch and batching remain unverified. Deferred
alpha drawing now retains native command order across sprite layers and individual
transparent model triangles, including interleaving inside a mesh. Seventy native
queues/774 deferred alpha records and twelve controlled browser overlaps agree;
real fire, collapse smoke, halo, placement and overview effects pass. Complete
blend-mode/depth-state selection, source chains and native batching remain open. Twelve captured normal (0), close (3) and bird's-eye (2) views at four
bearings now replay 366 live static models through the complete native renderer:
7,430 submitted triangles agree on projection, shade, culling and bucket. The
shared painter now rejects completed-model rear faces and common left/right/bottom
outcodes before allocating command depths. Do not brighten distant models: their
native numeric shading agrees in these live poses. Vault morphs, source object
traversal, complete GPU frames and terrain attenuation settings remain unverified.
Shared polygon ordering now integrates constant triangle depth, native buckets,
reverse insertion ties, raised terrain flags and imported object/face biases.
All 70 native queues/1,036 triangles and twelve isolated browser overlap cases
agree, including shared materials. The live sprite and placement regressions pass.
Complete simulation cell/object chains, native batch/alpha ownership, clipping
and full-frame occlusion remain open; creation ordering and large-frame depth
scaling are explicit adapters. Do not treat the isolated primitive comparison as
proof that distant silhouettes or full native picking are resolved.

The supplied first-mission header and native loader forwarding/selection agree
that its fog flags are zero; 768 flag/override cases and the live initial world
are checked. Preserve that setting. Full concealment/reveal ownership for other
missions and modes remains open. Visible-cell membership now uses the following
vertex row, half-open columns and full-coordinate cell determination. Native
traversal comparisons cover 1,048,576 membership decisions; 1,216 GPU/CPU boundary
probes, live ground interaction and all 392 sprite poses pass. Full concealment,
painter/depth ordering and matched original frames remain open. The v134
jagged-perimeter capture used preset 1, outside ordinary zoom controls; completed
normal/close transitions did not reproduce those side gaps. Preserve native
terrain bounds and model lighting until a comparison proves a difference.
The sky backdrop/clouds now use the original camera horizon height through zoom;
the defeat flash uses its native clamped surface. Nine complete native sky
submissions, 756 cloud triangles, twelve browser view/size states and isolated
GPU checks cover the integration. Continue coast, scale and placement/control
comparisons alongside these remaining visible gaps. Continue building activity/destruction as those
comparisons identify discrepancies. Collapse smoke now uses native rotated
shape sockets, RNG consumption, HFX1345–1360, palette 7, fixed-point growth/shrink,
depth-scaled sizing and native lifetime. Verified against 632 native allocations,
512 lifecycle steps and 512 size calculations, plus real browser collapse.
Collapse debris now reuses original model faces, stage masks, cap/tribe textures,
native centroid placement, launch RNG, gravity and spin. Native comparisons cover
300 collapse calls (9,755 faces), 8,192 flight snapshots and 128 splash initializers;
live-browser checks cover textured faces, motion, rotation, impact cues and cleanup.
Full debris lighting/painter ownership, allocation limits, attachments and mixed-class
scheduling remain open. Lightning now ignites scenery with the original fire mesh,
nine-frame texture cycle, growth/shrink, embers, expiry smoke and burning-tree shrink.
The object atlas now applies the native per-tile alpha decoder: 262,144 texels,
128 fire initializers, 10,240 fire snapshots, 2,400 tree snapshots and 512 facing
angles agree with isolated native routines. Browser casting, rendering and cleanup
pass. Building ignition now resolves the native footprint and uses original rotated
fire sockets, 135-turn flames, occupant evacuation and delayed structural damage.
The ignition/socket and burn-phase controllers agree with 632 and 512 native
cases; browser casting, damaged geometry, smoke and owned voice cancellation pass.
Seventy gameplay regressions include evacuation, damage and subsequent repair.
Shared smoke/shape helpers and the renamed `damageState` keep these paths readable.
Full propagation, panic movement, sunlight, painter ownership, allocation
failure, native repair scheduling and delayed tree replanting remain open. Continue visible fire/building
activity and the first-mission controls before isolated hidden bookkeeping.
The sprite audit found intact unit
artwork; the nearby striped shapes were reincarnation stones. Their invented
radius-2.8 circle is now replaced with the original eight cell-snapped offsets,
site-relative headings and stored-diagonal terrain heights. Native normal site
creation and stone initialization agree on 2,048 cases. Full site creation timing,
rise/sink effects, tribe lifecycle and relocation remain open; the scene still
shows the two first-mission sites at their original shaman positions.
Placement previews now use original connected terrain tiles, stored terrain
vertices, descriptor-selected plan shapes and the separate entrance-arrow cell.
Space rotates the plan, retains a direction per building type and plays native
cue 0x26. Preview, placement and builder routing share the selected orientation
and snapped anchor. Native checks cover 632 plan geometries, 64 rotation commands
and the existing 2,624 overlay cases; browser input and all four construction
orientations pass. The full plan-preview controller, per-cell validity, allocation
and remaining ground targets are still open; the browser validator supplies
preview validity. Keep checking these during first-mission play.
Lightning now uses its displaced upper flash, three native eight-segment shapes,
recursive screen-space branches and original procedural strip texture; full
painter/blend ownership and its complete damage/fire side effects remain open. Blast's
impact now uses original HFX1099–1107, the native animation setter/updater,
stored-diagonal grounding, nine-turn object lifetime and both impact cues;
the invented shockwave ring is removed. Projectile trails now use both native
phases, staggered initial frames, the separate cosmetic RNG and recovered motion;
Blast sparks rise and Lightning/Land Bridge trails persist through their second
phase. The impact's separate effect-3 allocation, terrain lighting, burning
scenery remain open. The native three-pass Blast force controller and full impulse/airborne physics
now drive live followers, with original landing sparks and imported launch poses.
Compared: 256 wave passes, 512 damage calls, 8,192 physics snapshots, 4,096 bounces
and 7,068 sprite layer draws. Original 336 pose fixtures and 2,672 RGBA pieces
are preserved; 56 launch fixtures and 220 original pieces extend coverage.
Full mixed-class scheduling, shake rendering, allocation limits, ordinary state
ownership and matched original gameplay footage remain open. Casting
range now uses the native rotating 85-particle halo, terrain heights, original
frames and shadow sprites, including hover previews; its complete native timer
and painter ownership remain open. Spell pointers use native POINT artwork, unavailable markers
and the out-of-range walking animation; full ground overlays and cursor ownership
remain open. Selected followers now use the native above-head arrow and
animation-frame height instead of invented ground rings. The HUD
now uses compact native artwork, bitmap counts and model-hover descriptions;
exact native menu ordering, font/palette scheduling and control ownership remain
open. Keep these visible gaps ahead of standalone internal ports. Native terrain
and water calculations are integrated across the full rendered map. Coastline
terrain now receives the same native diffuse shading as water, with the original
additive warm-light channel on land. The 1,408 native vertex-color cases and real
browser coast/light comparisons pass; complete lighting ownership, raster/filter
behavior and whole-frame fidelity remain open. Use before/after browser
captures and actual input/gameplay checks; native comparisons do not establish
overall look-and-feel parity.

Preserve the existing verified ports and completed routing integration. Detailed
history and remaining implementation boundaries live in the completion checklist
below and the reverse-engineering log, rather than setting the next priority.

## Decompilation is part of the project

Implementation started, 2026-09-08: pinned Fallow 3.23.0 and ox-standard
(`oxc-standard` 1.4.0), configured explicit app/test/tool entry points and generated
exclusions, formatted maintained app TypeScript, and simplified the connected
ground-overlay selector into named lookup tables with explicit texture-bank
precedence. Its 2,624 native comparisons, 67 gameplay regressions, type checking
and real-browser placement check pass. Existing ESLint coverage remains enabled.
Oxlint and Fallow expose legacy debt rather than implying the repository is clean;
`stepTurn`, `stepCelebration` and `stepTrainingPerson` are initial refactoring targets.
See the [quality commands](README.md#typescript-quality-workflow).

Standing user requirement, added 2026-09-07: keep decompilation tools and discoveries in this repository, reconstruct the original routines where possible, and port their behavior into the browser engine. Do not substitute invented rules where the executable provides an answer.

The repository owns [pinned tool setup, Ghidra scripts and pseudocode exports](decomp/README.md). Each port must connect an original entry address and executable identity to the browser implementation, tests, and remaining differences. Keep raw Ghidra output distinct from reviewed reconstructions: inferred types and names are not recovered original source. Evaluate existing projects before rebuilding their work; record upstream revisions and applicable licenses.

The replacement thread goal was created on 2026-09-07 with this revised scope and is active. This file tracks its implementation evidence and remaining requirements.

## Main priority: clean, readable and maintainable TypeScript

User direction, 2026-09-08: clean, easy-to-read, maintainable, concise and simple
game TypeScript is a **main priority alongside visible fidelity and parity**.
Spend time refactoring existing code, including code already ported. Do not write
TypeScript that looks like decompiler output translated line for line.

- Express recovered behavior with meaningful domain names, explicit state and
  straightforward control flow. Preserve necessary integer widths and ordering,
  but explain them locally instead of reproducing temporary variables, pointer
  arithmetic or dense expressions throughout the maintained engine.
- Concise means little unnecessary code, not minified code. Use ordinary
  formatting, one clear operation per statement and small coherent functions.
  Refactor large mixed-responsibility modules as work touches them; simplify
  duplicated logic and remove proven dead code without adding speculative layers.
- Use [Fallow](https://github.com/fallow-rs/fallow) to identify complexity,
  duplication, dependency problems and unused-code candidates. Verify findings
  against native comparison harnesses before deleting code they invoke indirectly.
- Use [ox-standard](https://github.com/JohnDeved/ox-standard) for consistent
  TypeScript/React linting and formatting. Keep correctness, accessibility and
  existing verification coverage during tooling migration.
- Apply [Ponytail](https://github.com/dietrichgebert/ponytail): reuse existing
  helpers and platform features, prefer simple solutions, and avoid unnecessary
  abstractions. Readability and required fidelity take precedence over shortest
  character counts or mechanically matching decompiled structure.
- Keep raw Ghidra exports and address-level evidence in `decomp/`; the browser
  implementation is reviewed, idiomatic TypeScript. Validate refactors with
  relevant native comparisons, gameplay checks and browser checks.

For each substantive port, review the touched code for clear names, coherent
responsibilities and duplicated logic before calling the slice done. Use tool
findings to guide focused refactoring, and keep remaining debt explicit. Passing
native comparisons establishes behavior; readability still needs human review.

Applied during the scenery-fire port: named boolean state replaces opaque native
flag words in maintained TypeScript; shared smoke/trail initializers copy only
position fields; browser checks reuse their setup and GPU visibility measurement.
Fallow health/duplication and ox-standard checks guide this work. Existing broad
lint/complexity debt remains open; passing a focused check does not clear it.

Standing user requirement, added 2026-09-07: the stack and code must help progress rather than constrain it. Keep this a modern, concise web project that is easy to run, edit, extend and experiment with while retaining original-game parity.

- Use TypeScript for the deterministic engine, React for interface state, Three.js for rendering, Web Audio for sound, and the existing Vite/vinext development and publishing flow. Evaluate dependencies or stack changes against a concrete parity, tooling or performance need; adopt a framework when it removes real work without constraining native behavior.
- Keep simulation independent of browser/rendering/UI APIs so it runs directly in Node for tests and native comparisons. Keep assets and imported original data distinct from hand-written behavior.
- Organize new engine work by coherent subsystem, with readable code, explicit state and named data definitions. Extract parts of the growing model/scene modules as their responsibilities are reconstructed; avoid compressed one-line implementations that make debugging or review harder.
- Reuse shared definitions and helpers so adding a spell, unit or command does not require updating unrelated copies. Record native widths, units, phases and evidence near reconstructed behavior.
- Preserve a fast edit/play/check loop, documented commands, reproducible imports and a small set of useful checks. Refactors must preserve established native and gameplay comparisons. Measure performance before adding workers, WASM or another engine layer.

This main priority supports the full-parity goal; ease of implementation is not a reason to replace original behavior with a framework's defaults. Review actual friction as the game grows rather than treating the current stack as permanently fixed.

## Completion checklist

All rows remain open until compared against the original engine, including edge cases. A playable approximation or a passing browser-only test is not full parity.

| Subsystem | Current evidence | Still required |
| --- | --- | --- |
| Decompilation workflow | Pinned Ghidra/JDK, metadata adapter, section-byte verification, address-based C exports | Continue identifying routines and reconstructing reviewed code alongside ports |
| Developer workflow and maintainability | TypeScript engine runs in Node; React/Three.js/audio separated; mutable simulation store and React revision subscription; Vite dev loop; shared spell definitions, standalone worship/VM modules and `npm run check` | Continue separating reconstructed subsystems, improving readability and removing demonstrated editing/performance friction without parity regressions |
| World, terrain, camera | Original mission-one data, textures and models; native tile split/height routines CPU-compared and used during import; native terrain queue, categories, slope/water flags and zero-height repair CPU-compared, opening rebuild integrated; opening flyby queue, motion profiles and 4,077 timeline frames CPU-compared; native result-camera initiation, wrapped glide planning/movement and controller CPU-compared and integrated; native camera/model transforms, projection, view tables and mesh bounds CPU-compared and integrated into ground rendering; projected-triangle picking and periodic terrain copies GPU/browser checked; native terrain pixels and water texture/wave points CPU-compared, full 128×128 map rendered with shared shore vertices | Exact toroidal coordinates, deformation, projection, visibility and camera behavior |
| Graphics and interface | Original layered unit sprites, native bank-2 meshes, HUD and several effects; native eight-way camera-heading sprite selection; full object/person animation setters and all four update modes CPU-compared, including composed celebration/frame timelines; bank redirect and vault morph coordinates CPU-compared; native defeat-sky quad and palette colors CPU-compared, opacity/depth integration checked with browser GPU pixels; opening tooltip names/lifetime, indexed colors and window rectangles CPU-compared; compact original HUD frames/icons, bitmap counts and shared model hover/click targeting integrated, with 606 native English glyph selections/advances compared; native selection-arrow gating/position/scale CPU-compared and integrated with original animation-frame bounds | Shared animation records now drive live celebrations; still required: native presentation scheduling and remaining animation states, layers, palettes, blend passes, effects and controls; original fonts/layout, hover and remaining forced tooltips; full morph scheduler and allocation/initialization RNG scheduling |
| Turns and randomness | 12 Hz turns, integer movement tables, native RNG formula; complete tribe scheduler CPU-compared, offline outer-loop phase traces verified, tribe work integrated before object-turn increment | Remaining object/AI scheduling, defeat effects and result presentation, multiplayer timing, seed initialization and complete RNG consumption |
| Movement and physics | Integer steps and partial ground recoil; native ground-facing block, horizontal slope velocity, obstacle probes, timed recovery and approach-square test CPU-compared and used by live celebrants; native building approach-axis geometry CPU-compared; collision classifier, building-access rules, coastal masks and both quarter-cell walk maps CPU-compared; native terrain collision and completed-building footprint cells integrated for celebrants; triangle drift/range, ordinary/impulse caps, airborne eligibility and landing-state decisions CPU-compared; complete physics driver compared over 16,384 turns and bounce over 4,096 cases; live celebrants now query stored terrain diagonals; insertion/removal/movement cell lists CPU-compared over 8,192 sequential operations and composed in full physics comparisons; native cell neighbor order integrated for celebrants; original planner/search/solver serves live orders, with persistent shared route ownership and native post-movement waypoint advancement | Completed-building shape masks now populate native occupancy cells; still required: full building/plan registration lifecycle, access-state ownership and remaining motion dispatch, complete vehicle/full-world routing, formation, steering, collision, slopes, falling and drowning |
| Combat | HP-scaled exchanges, attack selection and up-to-four-person fight groups; native state-36 recovery controller and initializer CPU-compared; state-39 setup/formation/boundary and composed initializer CPU-compared | Remaining substates, class scheduling, recovery interactions and all unit classes |
| Economy and buildings | Native follower contribution/generation and full mana distribution/spell charging CPU-compared and first-mission allocation integrated; breeding/training bands and hut upgrade values; original rotated entrance/queue footprint geometry CPU-compared and door routing integrated; full shape-mask registration/removal and cell shade CPU-compared, completed-building occupancy integrated; native occupant admission/removal, containing-building lookup, visibility/order cleanup, training repricing and batch conversion/order inheritance/rollback CPU-compared; native defeat cleanup, damage accumulation and plan stages CPU-compared with a live collapse adapter; original face visibility and exposed-surface UVs CPU-compared and integrated for construction/damage | Full construction, repair/fire/combat damage, debris lighting/ownership and remaining modes, activity timers and all building classes |
| Spells | Blast/Lightning/Land Bridge projectiles, cell targets, spent charges and delayed impact; native 3D-step CPU comparisons; height/tower range, entry readiness/reserves, payment and starting mana CPU-compared; live targeting/range ring and enemy spending integrated; native casting lockouts, AI usage recovery and default delay CPU-compared and integrated; wrapped position/cell target ranges integrated, full player validation and entry mode/population filters CPU-compared; native area summaries, cell scoring and composed general scan/dispatch CPU-compared, live native cell scoring, shoreline Blast, general scan/dispatch and building-territory marking/removal/refresh integrated with browser person/terrain adapters; shoreline routine and complete general/emergency spell controller CPU-compared; live controller uses the opening-class person adapter | Complete scheduling, targeting/reflection, deformation, animation and every spell |
| Audio | 532 samples decoded; native cue/sample mapping, pitch RNG, distance curve and simulation sound events | Complete trigger/scheduling/voice priority behavior, camera-relative mixing, ambience and adaptive music |
| AI and campaign | Original first-level layout; CPU-compared VM, cast/stock/head query bindings, turn-zero setup, disabled Dakini reincarnation and original terrain-rule bytecode applied; 6,484 native worship/reward turns and 960 vault task/work comparisons; original discovery/settlement/vault notification branches, building counter rebuild/query sequences, marker forcing and type-3 allocation CPU-compared; first-mission spell-defense setup and recurring spell-entry shutoff after the second Blast CPU-compared and integrated; live follower counts and original warrior-dependent attack-commitment block CPU-compared and integrated; AI queue/training controller and follower eligibility/selection reconstructed and CPU-compared, including combined controller/selector calls; shared command encoding, ownership, routes and group commit CPU-compared; shared person initialization, AI reservation/release, facing and animation selection CPU-compared, including 128 combined training handoffs; order startup, building reconciliation and configured speed CPU-compared; training linked-list operations and all command-8 substates with original geometry CPU-compared, including a sequential specialist/trainee queue handoff; native admission/interior-stop composition and building conversion CPU-compared; pathfinding and remaining world-effect integration pending; complete campaign/multiplayer outcome decisions CPU-compared, live 16-turn result checks, forced flags and defeat-timer progression integrated; simulation continues after results so defeated settlements finish collapsing; all nine native celebration substates, chain actions and state-41 initialization CPU-compared, now driving live braves, warriors and shamans through explicit movement/world adapters | Remaining game-command bindings, AI stocks and scheduler; worship eligibility, object phases and remaining reward lifecycle; all missions, objectives, progression and difficulty |
| Persistence and multiplayer | Not implemented | Original save/load behavior and multiplayer simulation/protocol behavior |
| Validation | Seventy-one regression tests, native CPU comparisons and real-browser mission/visual QA, including original models and all three opening callouts | Original-engine traces, cross-engine replay comparisons, complete campaign and multiplayer scenarios |

Detailed port evidence and explicit approximations: [reverse-engineering log](references/reverse-engineering.md). Current upstream assessment: [symbols and reusable projects](decomp/upstreams.md).

### Latest visible integration: scenery shade

Native `00403c10` now refreshes terrain shade for live tree insertion/removal,
sharing shape traversal and occupant shade with building footprints. Its complete
setter and real shade consumer match 632 cases; building footprint/shade regressions
match another 632/4,096. Browser ground pixels and an actual Lightning burn verify
shade appearance/removal. Full scenery ownership, sunlight, model lighting and
complete unit shadow ownership remain open; continue those visible comparisons. The lighting
checkpoint stays partial in PARITY.md, with the new evidence recorded.

### Latest visible integration: airborne shadows and unit scale

Removed the invented standing-unit rings. Airborne people now use original HFX22
art, native ground sampling, depth-scaled dimensions and the fixed two-pixel
anchor offset. Body sprites and selection arrows use their actual native depth
bucket, including the shaman scale path and custom person bias. The native queue,
painter and airborne gate match 2,048 cases; an actual browser Blast verifies
visible ground shadow pixels and removal on landing. Existing selection, halo
and projection checks pass. Full render-position interpolation, mixed painter
ordering and object-class shadow ownership remain open; lighting and directional
sprite checkpoints stay partial. Continue visible model lighting, activity and
rendering comparisons before isolated hidden engine work.

### Latest visible integration: model lighting

Original 3D models now use native sunlight face shades, quantized normals,
heading-dependent face records, depth attenuation and diffuse/additive color.
Previously their original textures were unlit. Native checks cover 33 complete
1,024-entry sunlight tables, 4,096 normals, 450 complete model normal/shade passes
and 1,024 complete triangle submissions. Browser checks cover 41 live meshes,
heading/size refresh without GPU buffer replacement, and six GPU color samples.
Model geometry ownership is consistent across ordinary objects, fires and morphs;
projection preparation preserves each material's lighting shader hook. Full
sunlight lifecycle/propagation, colored selection overrides, debris lighting and
all model modes remain open; the lighting checkpoint remains partial. Continue
visible lighting, building activity and controls before isolated hidden systems.

### Latest visible integration: hovered model feedback

Hovered buildings and worship objects now use the original gray/white color
override, ownership rules and two-turn phase. Both ordinary and construction
renderers agree on 512 native cases; the original phase loop agrees on 256 turn
values. Browser checks cover actual mouse hover, button press/release, spell
mode, enemy/owned construction gates and camera movement under a stationary
pointer. Eight isolated GPU colors include both hover phases bypassing sunlight
and distance fade. HUD/worship controls still pass. Full native picking, modal
and all-tribe targeting ownership, other colored effects and dynamic lights remain
open. Keep visible feedback and lighting comparisons ahead of isolated internals.

### Latest visible integration: camera focus and desktop movement

Normal portrait/tribe/F/minimap focus commands use the original wrapped camera
journeys, preserving rotation and zoom. Desktop keyboard and mouse controls now
use native integer movement, pan/turn speeds, axis order and wrapped coordinates.
Right drag rotates without vertical drift; middle drag pans. Native focus and
mixed keyboard/drag comparisons plus actual browser input, pause/lock, timing and
takeover checks pass. Shared camera capture/movement replace duplicated conversion
and floating-point pan paths. Full settings, frame/input sampling, edge scrolling,
minimap mapping, overview transitions and visibility remain open. Continue with
visible world/rendering and control comparisons; this does not complete the camera
checkpoint or change the full-game goal.

### Latest visible integration: texture sampling

Models and clouds now use native bilinear filtering without mipmaps/anisotropy;
models, ground, water and clouds interpolate encoded palette colors. Complete
native renderer initialization/state checks and 80 browser GPU palette probes
cover the change, with existing lighting, water, terrain and sprite regressions.
The raster checkpoint remains partial: complete sampler ownership/settings,
legacy formats, clipping, ordering and matched original frames are still open.
Continue visible rendering and controls before isolated hidden engine systems.

### Latest visible integration: original camera view presets

Ordinary zoom uses original close/normal/bird's-eye presets and integer timed
transitions, replacing arbitrary continuous scaling. = / −, wheel and menu
controls share the view commands. Native comparisons cover 60 timer cases,
ten command routes and 3,480 transition frames across all ten resolutions;
browser checks cover actual inputs, presets, retargeting, pause/lock and resize.
The native world-view renderer/transition, complete input mapping and scheduling
are still open. Keep the camera checkpoint partial and continue visible controls
and rendering work before isolated hidden systems.

### Latest visible integration: desktop navigation and edge scrolling

Original arrows/Ctrl/Shift, Delete/Page Down and keypad navigation now feed the
native movement routine. Outer screen edges scroll, including the sidebar;
duplicate direction requests enable native fast pan. CPU comparisons cover
1,920 command cases, 2,560 input accumulations and 882 pointer-handler cases.
Actual browser checks cover modifiers, keys, corners, pause and modal/drag/window
gates alongside existing movement, focus, view and sprite regressions. Settings,
complete input-state ownership, scheduling and world-view controls remain open;
the camera checkpoint and full parity goal stay unfinished.

### Latest visible integration: native world overview

World view now uses the original wrapped disc projection, adaptive terrain mesh,
separate globe lighting, 8×8 native terrain tiles and deterministic star field.
Original building/discovery icons and native person/scenery marker shapes replace
ordinary 3D objects in this view. Arrows and right/middle drag move the map;
wrapped picking and ground-view return preserve the camera bearing. OrbitControls
and the cloudy latitude/longitude sphere are removed. Shared terrain math and a
separate globe renderer keep the integration readable.

Native comparisons cover 18,532 complete triangles with projected vertices and
lighting, projection/picking, stars/parallax, active dragging and opening marker
colors; portable native fixtures now run in `npm test`. GPU/browser checks cover
entry/return, terrain/icons/stars, actual inputs and resize. Sprites, camera views,
navigation, HUD, ground terrain and building-fire regressions still pass.
Full native marker rasterization/ownership, colored building footprints, overview
spell effects, cache UV/fog, transition and release inertia remain open. Continue
these visible overview/control gaps, then ground-world building activity and
first-mission feedback. The camera/raster checkpoints and full game goal remain
unfinished; discovery stays open and no broad checkpoint credit is added.


### Latest visible integration: overview footprints and building icons

World view now draws native projected building cells in the original translucent
tribe colors. The same visible-cell decision enables building icons; owner-only
hut counts and occupied/empty tower symbols follow live occupants. Native checks
cover 3,072 inside/rim cell projections, 4,096 complete footprint/visibility/quad
calls and 384 complete icon controllers. Browser checks cover 36 actual quads,
6,181 alpha-48 pixels, relocation/destruction, tower occupants and anchor fog.
Ground sprite, HUD and overview navigation regressions still pass.

Native concealment-byte ownership, plan/placement producers, vehicle occupants,
full marker queues/rasterization, spell effects, transition and release inertia
remain open. Tall desktop viewports deliberately avoid the original icon-scale
signed overflow; native icon sizing is compared at heights 480/600/768. Camera
and raster checkpoints remain partial. Continue visible overview effects/controls
and ground-world activity comparisons; full parity and discovery remain open.


### Latest visible integration: overview drag and release glide

Overview dragging now samples once per presentation tick. A valid grab captures
the map origin, movement retains native wrapped coordinates and velocity clamps,
and release keeps the original constant glide. Holding still while dragging
clears velocity; keyboard navigation takes over. Star parallax consumes each
clamped movement step exactly once, including multiple ticks before one render.
The original routines agree on 1,664 complete lifecycle snapshots; eight native
sequences now run as portable regressions in `npm test`. Browser checks cover
right/middle input, seam crossing, flicks, stationary stops, rejected space grabs,
keyboard takeover, modal/input/blur gates and view reentry. Existing camera,
view, navigation and sprite checks remain green.

Full native input-mode/modifier ownership, original outer-frame pacing and globe
entry/return transitions remain open. The desktop adapter retains 24 Hz sampling
and browser-specific cancellation on lost input. Camera stays partial; this does
not finish overview or engine parity. Continue visible overview spell effects
and transitions, then compare ground-world building activity and first-mission
feedback against original captures. Discovery and the full-game goal stay open.

### Latest visible integration: overview spell range and trails

World view now displays the original 32-strip pulsing spell range and original
projectile-tail sprites. Range phase follows the native sky counter while the
simulation is paused; the ground sprite halo keeps its own phase. Native HFX
trails retain their original pixel size, bottom-center anchor and AL palette
tint. Casting-tribe ownership now reaches the overview fog gate. The native
queue omits several large ground impact flashes, so those remain hidden here.

Comparisons cover 256 complete circle/strip calls, 256 native phase updates and
512 complete effect-cell queue/painter calls. Actual browser checks cover range
pixels, selection/hover/input gates, paused pulse, a real Blast cast, tinted
tails, owner/fog/hidden gates, expiry and ground-halo return. Ten more identified
exports bring the maintained manifest to 841. Complete mixed-class ordering,
concealment, tower fans, remaining overview effect classes and matched original
frames remain open. Camera/raster stay partial; discovery and full parity are
unfinished. Continue visible overview transitions and ground-world activity,
using original captures to choose the next discrepancy.

### Latest visible integration: original overview transition

Overview now uses the original two-stage ground zoom/rotation and globe projection
morph, with the reverse sequence on return. Enter restores the saved ground view;
zoom-in returns to bird's-eye. Original flat projection scales, rim behavior,
lighting blend, inclusive morph timing and disabled morph picking are integrated.
Forced focus, flyby and result camera requests cancel the ordinary transition.

Native checks cover 1,344 blended projection/picking cases, 93,240 final mesh
triangles and 100 complete morph lifetimes. Portable checks retain 24 native
mesh captures and ten lifetimes; ground-view comparisons now cover 360 transitions
and 6,960 frames including original preset 4. Actual browser checks cover stages,
rotation, pause/input/picking, Enter versus zoom return and focus interruption.
Camera/raster remain partial. Native outer dispatcher side effects, scaled frame
scheduling, transition audio, globe recentering and matched full frames remain
open; the current presentation adapter runs at 24 Hz. Continue original-capture
comparisons of ground-world activity and first-mission feedback alongside the
remaining overview markers/controls. Discovery and full parity remain unfinished.


### Latest visible integration: native hut families

Villages now use the original three hut families rather than one hardcoded family.
All 36 family/level/tribe models are imported. The selected object persists across
rendering, footprints, entrances, debris and upgrades. Complete native selection
and RNG agree in 1,920 cases; browser checks render every variant. Expanded native
checks cover 2,216 construction-stage calls, 990 lighting passes and 1,050 collapse
calls (30,665 fragments), including picking-only faces previously lost on import.
Those faces remain invisible unless replaced by a construction cap.

Full original initialization/allocation order and upgrade replacement scheduling
remain open, so opening hut identities are not claimed to match an original run.
The broader model/lifecycle checkpoint remains partial. Continue with visible
settlement activity and effects, retaining world, controls and sprite regressions.


### Latest visible integration: original hut births

Completed huts now initialize their breeding work to native cost minus 54 and
sample admission on their own four-turn phase. Pending requests, signed counters,
spawn/flash sockets and neighboring-building exit redirection follow 00404c80.
New followers visibly leave the hut; their entrance flash uses original HFX1441,
full opacity and sixteen simulation turns. Player births play original cue 40.
Native comparisons cover 2,304 controller calls and completion clocks, 128 flash
initializations and 2,688 animation records; 288 captured cases run in portable
tests. Browser checks verify newborn motion, flash GPU pixels, PCM playback and
cleanup. Global housing remains partial: native person allocation/state ownership,
wild-person notification, class-9 plans, counter staggering and upgrades remain.
Continue visible settlement behavior and critical gameplay while preserving
original artwork, camera/control and sprite regressions. Full parity is unfinished.


### Latest visible integration: timber before hut upgrades

Huts now begin fetching timber at 75% maturity and wait for sufficient wood in
the entrance cell before changing models. Residents visibly carry and drop the
original log sprites; the replacement retains its family and starts at 100 work.
Shared hauling code serves ordinary construction and upgrade preparation. Native
comparisons cover 2,079 complete decision calls and 256 cell timber counts; portable
and browser tests complete the full visible gather, stage and reconstruction loop.
Housing and timber checkpoints remain partial: native resource searches, transfer
and harvest timing, order ownership, replacement allocation and scheduling remain.
Continue visible settlement and critical gameplay work without treating these
consumer adapters as full native engine parity.

### Latest visible integration: harvesting and shrinking trees

Timber workers now use the original work pose and keep their approach heading.
Tree harvesting uses the configured twenty-turn countdown; loose logs take three
turns and request the original pickup cues. Harvested trees shrink using native
wood-to-scale arithmetic, shared with burning trees. Native comparisons cover
1,860 reached-source command calls including transfer, animation requests and
scenery depletion; portable and browser checks cover live work/carry transitions,
PCM playback, GPU size changes and the full hut upgrade sequence.

Resource search, route arrival, original automatic-construction order ownership,
frame-gated audio and delayed replanting remain open. Timber stays partial.
Continue comparing visible first-mission world/activity and original captures;
retain the desktop camera, artwork and sprite regression baseline. Full game
parity remains unfinished, with discovery open.

### Latest visible integration: tree regrowth and replanting

Depleted trees now leave a native delayed replant request. The original indexed
search chooses a dry, unoccupied, walkable cell; blocked/allocation-failed attempts
retry after 256 turns. New trees appear at 100 wood and visibly grow to their model
capacity. Existing trees use their own 16-turn growth phase and descriptor rate.
Harvesting and burning share depletion; fire expiry alone does not invent a request.
Native checks cover 576 growth calls, 18 depletion allocations and 128 complete
replant/search calls. Portable tests wait the full 4,000-turn delay; browser checks
show sapling/full size and restored shade through the live simulation.

Full allocator limits, shared scenery/command ownership, original insertion and
counter scheduling remain open. The arbitrary building-distance tree filter is
now removed: native cell submissions and browser checks confirm the first-mission
tree beside a hut must remain visible. Regression checks cover rebuilding scenery
and four camera bearings. Continue comparison of construction-stage appearance,
close-view world lighting, original painter occlusion and HUD sizing. Do not treat
native component checks as matched full frames or full game parity.


### Latest visible integration: original spell-panel feedback

Spell buttons now use original permanent/reward frames, hover artwork, selected
frames and distinct empty-stock markers. Charging draws the native layered fills
and palette colors at recovered logical positions. The supported spell subset
follows native mana-cost order. A small presentation helper replaces scattered
icon arithmetic and CSS approximations; fixed HUD spacing avoids recomputing a
native initialization cache on every React update.

Native comparisons cover 763 complete button calls, 1–4-shot layouts and charging
boundaries, plus original slot sorting. Browser checks cover 24 art states and
real charge toggles; the broader HUD check waits for the restored camera transitions.
Full slot availability/disabled/locked dispatch, charge sparks, UI resolution
scaling, all status panels, messages and minimap behavior remain open. Continue
visible first-mission comparison, especially world lighting, construction activity
and native HUD/control ownership. Full game parity remains unfinished.

### Latest visible integration: native shaman health

The shaman meter uses the original 10×22 frame, palette and integer fill, with
empty state during absence and full health on live reincarnation. Compared 2,091
native controller calls, original palette initialization and health/charge frame
submissions; 24 browser states at two desktop sizes and a pixel comparison pass.
The HUD importer now preserves real atlas dimensions, with a PNG/bounds regression
check. Full HUD ownership, animated portrait, population/mana display, native
resolution scaling and full world-frame matching remain open. Continue visible
world-lighting and native HUD/activity comparisons; full parity stays unfinished.

### Latest visible integration: original model face culling

Completed models now follow original screen-space face culling; construction and
damage stages retain the original two-sided drawing. Forty native calls without
callee stubs and forty actual browser material probes agree, with visible changes
at four village camera bearings. The shared factory fixes the policy once for
all its original model consumers. Native distance fading remains in place;
full world lighting, painter order and exact clipping/raster output are still
unverified. Continue visible world/activity/HUD comparisons rather than treating
component-level renderer checks as full original-frame parity.


### Latest visible integration: animated shaman portrait

The HUD now uses the original portrait borders, position, background feedback
and current directional shaman animation. It shares the world sprite layers,
omits the standing shadow and preserves action poses outside the frame. Native
comparisons cover 322 controller states, 408 directional poses and three border
compositions; 200 actual browser poses match original pixel hashes. Hover,
selection, animation, camera input and death/absence/reincarnation pass, together
with existing unit-sprite, health and spell-button regressions. There are 91
portable regressions and 883 identified decompilation exports.

Native resolution rounding, control ownership, full presentation scheduling and
shaman state producers remain open. HUD and the full-game goal remain partial.
Continue comparing visible world lighting/terrain and first-mission activity
against original captures, alongside remaining population/mana/control artwork.
Keep discovery open and do not award broad checkpoint credit for component work.


### Latest visible integration: Blast and fire illuminate terrain

Original local light requests now reach the terrain renderer. The fifty-source
pool, wrapped 7×7 falloff, private flicker, overlap saturation, moving owners and
cleanup match 288 native calls across 235 lifecycle snapshots. Blast and scenery
fire use their original strengths; building fire enables only its designated
first socket. Actual browser casts change 35,655/29,909 ground pixels, with lights
removed when the owning effects expire. All 93 portable regressions pass.

Full light-producer coverage, original allocation/free order, graphics settings,
sun rotation and complete original-frame rendering remain open. Keep comparing
terrain/lighting, distant models and visible first-mission activity. Literal native
tooltip formatting tokens in the latest fire capture are another visible gap to
address. The broad lighting checkpoint stays partial; discovery and full game
parity remain unfinished.

### Latest visible integration: original tooltip fonts and mouse icons

Tooltips now draw original F00T bitmap glyphs, including mouse-button symbols,
with native desktop font selection, word wrapping and centered line spacing.
The executable comparison covers 222 complete controllers and 9,669 glyph
placements; all 448 imported glyphs match source artwork. Native raster hashes
provide browser regression coverage. The portable suite has 94 checks.

Scrolling callouts, localization, complete native hover ownership and exact
object anchoring remain open. Continue visible first-mission world/activity,
lighting and native population/mana/control comparisons. Full parity and the
open-ended discovery inventory remain unfinished; this component improvement
does not complete the broad messages/UI checkpoint.

### Latest visible integration: native mana-production meter

The long HUD bar now shows original production-versus-demand stripes and warning
feedback. Its native frame, colors, integer thresholds and line endpoints match
1,948 controller calls; 30 browser states and 15 raster hashes agree. A real Blast
cast and charging toggles exercise the production feedback. The previously zero
mana timing input now uses the existing simulation clock under its clearer name,
`turnsPerSecond`. All 96 portable regressions pass; full mana distribution still
matches 1,024 native comparisons.

Continue with population/class controls and housing capacity: current total counts
include the shaman, whereas the original totals five follower classes; zero-count
labels, digit padding, borders and capacity feedback also need their native
controllers. Exact HUD resolution rounding, all panels/control ownership and the
complete clock/menu remain open. Full parity and discovery remain unfinished.

### Latest visible integration: original follower counts and housing display

The population row now uses original gold digits, native two/three-digit count
formatting, zero suppression, class icon positions and hover/selected borders.
The displayed total excludes the shaman; the narrow housing meter retains its
reserved population allowance and original full-capacity blink mask. Native
comparisons cover 360 count controllers and 7,198 housing/blink controllers;
38 actual browser button images match native pixel hashes. Desktop layouts,
live class selection and follower removal/count updates pass. The export
manifest contains 904 identified routines; 98 portable checks pass.

Complete alternate-count/control ownership, unavailable-control blending, the
remaining follower classes and native resolution rounding remain open. Continue
visible world rendering, construction/activity and critical first-mission gameplay
comparisons. Broad HUD parity stays partial; known-scope coverage remains 17.7%
(17/96 verified checkpoints), with discovery open and full parity unfinished.

### Latest critical integration: timber-driven construction

Construction now advances as each brave delivers timber after the original
eight-turn pause. Removed the arbitrary twelve-seconds-per-worker timer and its
incorrect post-delivery hammering pose. Original work capacity determines each
mesh stage; repair uses the shared native transfer and stage update. Compared
576 complete delivery-phase calls; actual browser placement, three original
carried-log waits and visibly different scaffold/completed meshes pass. A complete
hut upgrade and existing building-fire checks pass. There are 100 portable
regressions and 909 identified exports.

Full plan allocation/decision dispatch, terrain preparation, worker positioning
and idle work cycles, shared-wait random facing and repair-delay ownership remain
open. Continue the original construction lifecycle and visible first-mission
activity, with full world-frame comparison still pending. Broad construction and
HUD checkpoints remain partial; discovery is open and full parity is unfinished.

### Latest critical integration: original construction crews

Building descriptors now set construction crew limits: six for a small hut,
sixteen for a warrior training building. Registration preserves order, rejects
surplus workers, keeps duplicate orders in their existing slots and reuses the
first slot freed by death or reassignment. Compared 1,280 complete native
admissions and 512 pruning calls without intercepted callees. Actual browser
placement assigns all six starting braves; duplicate/full-crew right-clicks,
replacement and completed construction pass. There are 102 portable checks and
913 identified exports.

Browser work orders still supply eligibility. Full plan allocation and task
dispatch, native worker positions/idle work, terrain preparation and repair-delay
ownership remain open. Continue those visible construction behaviors and original
first-mission frame comparisons. Known-scope coverage remains 17.7% (17/96), with
discovery open and the broad construction checkpoint partial.

### Latest critical integration: construction dispatch and repair holdoff

Constructed plans now dispatch roughly half their registered crew to fetch timber
on original sixteen-turn decision phases. Deliveries return workers to the waiting
pool. Repair delay counts down per turn, waits at one without a crew, and resumes
on a staffed decision phase. Resumption shortens nearby smoke to sixteen turns
using every nonempty shape cell, then refreshes terrain. Compared 5,120 complete
native plan calls and 1,264 complete smoke-cleanup calls. Browser construction,
upgrades and the full Lightning → holdoff → one-of-two hauling → repaired hut
sequence pass, including visible smoke retirement. There are 105 portable checks
and 919 identified exports.

Next connect native worker positions, idle work/animation/readiness and departure
to this dispatcher. Its completion gate is compared, but live completion still
releases browser workers directly. Unbuilt-plan terrain preparation/allocation,
full person command ownership, panic movement and mixed-class scheduling remain
open. Continue original first-mission frame comparisons alongside this visible
activity work. Known-scope coverage remains 17.7% (17/96); discovery is open and
full parity is unfinished.

### Latest visible integration: original builder work activity

Task-2 builders now approach the door, enter, walk around the site and pause in
the original work animation. Native shape points and descriptor radii determine
targets; movement speed/RNG, busy readiness, facing and work clocks follow the
recovered controller. The work pose uses the shared original animation source and
presentation clock, with cue 20's five original PCM samples preloaded. Compared
2,688 complete native activity calls. Browser work poses, directional frames,
audible work, construction and the complete repair sequence pass, alongside all
336 GPU sprite poses. There are 107 portable checks and 919 identified exports.

Continue with native departure and completion ownership, then initial command
approach/unbuilt-plan preparation. Activity targets are native; the ordinary
browser movement adapter still supplies path traversal/collision and update order.
Unbuilt-plan resting ownership, frame-gated audio scheduling, panic movement and
mixed-class scheduling remain open. Keep comparing full original first-mission
frames. Broad construction stays partial, known-scope coverage is 17.7% (17/96),
discovery is open and the full game goal remains unfinished.

### Latest visible integration: original builder departure

The original task-9 controller and plan completion gate now own live departure.
Final delivery retains the crew; workers follow the native center/door or clear-site
sequence, pause, turn, settle and become ready before their assignment is removed.
Completion no longer teleports workers. Original walk/idle/carry sprite ownership
continues through departure, and surplus timber is preserved. Native comparisons
cover 5,120 departure calls; one/two/six-worker scenarios cover all four hut
orientations, continuous displacement, readiness, pause, cancellation and route
cleanup. Browser departure poses and all 336 sprite baselines pass. There are 108
portable checks and 922 identified exports.

Next: initial command-10 approach and unbuilt-plan terrain preparation/allocation,
then complete movement/collision, command ownership and mixed-class scheduling.
Free departure turning is native; the browser traversal adapter still supplies
movement. Class-9 removal maps to slot/assignment cleanup until full object
ownership is connected. Panic movement and frame-gated audio remain open. Keep
comparing full original first-mission frames. Broad construction remains partial;
known-scope coverage stays 17.7% (17/96), discovery is open and full parity remains
unfinished.

### Latest visible integration: original builder approach and timber deposit

Player construction orders now enter native task 1, retaining their carry pose and
wood until the original arrival check. Approach sets the resting anchor, chooses
the native door/inside target and hands off to work on its even-turn arrival gate.
Carried timber is deposited as loose logs with the original cue before subsequent
hauling; dropping does not directly advance construction. Shared timber-drop code
also serves resting people. Compared 3,072 complete native approach calls; live
empty-handed/carrying orders pass in all four hut orientations through completion
and departure. Browser carrying/deposit sprites and rendered construction pass.
There are 109 portable checks and 927 identified exports.

Next is the full unbuilt-plan controller (`004b8470`) and initialization
(`004b8220`): terrain grade, footprint obstacles, preparation-task priorities,
worker clearance, delayed building allocation and unattended-plan removal. The
browser still creates a linked building immediately, so unlinked approach behavior
is native-compared but awaits that lifecycle. Command registration/dirty-byte
ownership, object-pool limits, complete motion/collision/turn scheduling, panic and
frame-gated audio remain open. Keep comparing full original first-mission frames.
Known-scope coverage remains 17.7% (17/96); discovery is open and full parity remains
unfinished.

### Latest visible integration: original foundations and model origins

Building ground now follows the original rotated tile/corner masks and descriptor
height rules. Removed the oversized square pads. Models use their original offset
from a separately retained map anchor; mission rotation/level is applied before
grounding, and upgrades retain their anchor. New plans select the original
quantized foundation height. Compared 1,216 native ground/origin calls and 1,088
plan-height initializers; portable coverage checks all supported building kinds,
rotations, terrain synchronization and untouched neighboring ground. Actual browser
Space rotation, placement and visible scaffold geometry pass in all four directions.
There are 111 portable checks and 932 identified exports.

Next remains the unbuilt-plan lifecycle: task-8 worker leveling, footprint clearing,
initial timber, worker clearance and delayed allocation. Preparation is still
immediate in the live adapter; this change recovers its geometry/height and fixes
visible model placement, not its timing. Keep original-frame comparisons and
critical first-mission gameplay ahead of isolated backend work. Known-scope
coverage stays 17.7% (17/96), discovery is open and full parity remains unfinished.

### Latest visible integration: worker-driven site preparation

Player plans now retain uneven terrain and display original connected ground
artwork. The native unbuilt-plan dispatcher assigns initial timber and leveling,
waits for footprint clearance and a ready departing worker, then allocates the
scaffold. Task-8 workers approach original vertices, stamp in the original sprite
animation, change heights by descriptor steps and play cue 2. Unstaffed plans
expire on the original phase. Compared 2,816 native plan decisions and 3,072
complete leveling calls; live hut/training-building tests cover all rotations,
allocation, completion, departure, cancellation and timber obstacles. Browser
checks verify visible plan artwork, directional leveling frames and delayed models.
All 116 portable regressions and 336 frozen GPU sprite poses pass.

Next: replace the remaining scenery/person-clearing adapters with native tasks
3/4 and connect full per-cell validity/terrain notifications. Object-pool limits,
plan-signal ownership, full movement/collision scheduling and camera-relative
resting interest remain open. Continue visible first-mission comparisons; broad
construction remains partial, known-scope coverage stays 17.7% (17/96), and discovery
and full game parity remain unfinished.

### Latest visible integration: native site-clearing workers

Scenery/person preparation now runs original tasks 3/4. Builders approach and
inspect footprint obstacles, harvest with original action frames and cue 1, carry
and drop timber, ignite removed bushes and retreat. Bystanders wait for the native
search/displacement phase, then walk out before scaffold allocation. Shared waits
also simplify the leveling controller. Compared 4,224 native scenery calls, 2,688
person calls and expanded destruction/fire cases; 121 portable checks cover the
live paths, rotations, cancellation and construction completion.

Next: connect per-cell validity and terrain-change notifications, and continue
visible first-mission comparisons. Native command/object allocation limits, full
command eligibility ownership, nonresource objects, plan signals, movement/collision
scheduling and camera-relative resting interest remain open. Broad construction
stays partial; known-scope coverage remains 17.7% (17/96), with discovery open.

### Latest visible integration: native placement validity and terrain notifications

Placement now checks original rotated footprint tiles and their masks rather than
an oversized square. Native per-cell rules handle occupied neighbors, plan overlap,
protected scenery, local height limits, dry ground and shore-building masks.
Incomplete scaffolds reserve their cells. Reincarnation stones correctly reject
placement; the old construction fixtures overlapped one and now use a verified
clear site. The same validator rechecks plans after terrain edits. Height-change
notifications visit native object chains and the four building cells touching each
vertex; invalid plans release their workers and remove their ground artwork.
Compared 3,040 complete native validity calls and 512 height-notification cases.

Next: continue full first-mission visual comparisons and recover constructed
buildings' response to terrain deformation. Full placement reach/capacity and fog
ownership, object/command pools, global route invalidation and native camera redraw
ownership remain open. Known-scope coverage stays 17.7% (17/96), with discovery open;
these additions improve the partial construction checkpoint without claiming full
construction or terrain-deformation parity.

### Latest visible integration: buildings on deforming ground

Allocated buildings now respond to height-change notifications. Small differences
settle on original four-turn phases without creating a repair state. Uneven
foundations collapse into original stage-selected model faces; sufficiently
flooded buildings retain their mesh, tip toward water, drift and sink over the
native 80-turn lifetime. Evacuation precedes removal by one turn. Model projection
and lighting accept the recovered pitch/roll, and shared height/debris helpers
keep the TypeScript paths concise. Compared 1,520 terrain controllers, 12,800
sinking snapshots and expanded both native debris-emission modes. Portable live
scenarios cover all four orientations and both destruction paths; the browser
check verifies real model pixels, tilt, drift and cleanup.

Next: compare full first-mission frames again, then recover the remaining visible
collapse explosion and panic/evacuation movement where that comparison exposes
gaps. Keep UI/controls and critical first-mission play ahead of isolated hidden
bookkeeping. Native pools/counters/mixed-class scheduling, dock warning and linked
attachment ownership, attacker statistics and Vault-specific sinking remain open.
Known-scope coverage remains 17.7% (17/96), discovery is open, and full game parity
is unfinished.

### Latest visible integration: burning followers

The modern terrain coverage/culling improvement is finished and measured. Visible
parity work has resumed: burning huts now eject followers into original state-26
panic, with native speed, animation, duration, random heading and owned cries.
Original personal fire trails emit on their separate counter and use the existing
particle phases and fractional renderer interpolation. Ordinary terrain collapse
does not ignite evacuees. Portable native captures and live browser/audio checks
cover these paths; performance evidence is in `references/modern-performance.md`.

Next: recover nearby-person ignition and remaining native evacuation placement,
then continue critical first-mission mechanics and visible effects. Keep clean TS,
shared controllers, uncapped presentation and measured desktop performance as
ongoing constraints. Do not resume an exhaustive hidden-system audit ahead of
visible gameplay. Full propagation, ordinary command ownership and full game
parity remain unfinished; discovery stays open.


### Latest visible integration: nearby fire reactions and shared sprite atlases

Original building flame sockets now ignite eligible followers in their own map
cells. Same-tribe/model filtering, protected-state handling, repeated visits and
RNG agree with 512 complete native initializer traversals. Ground and airborne
panic share one controller; settling returns ordinary units to their normal
animation/command adapter. Full object-cell allocation/order remains unfinished.

The live scene exposed repeated 38 MB effects-atlas uploads when particles were
created. Per-sprite shader UVs now share one atlas upload, preserving native frames
and painter behavior. The measured six-follower scene eliminated 17 uploads and
reduced CPU p95 from 71.3 to 12.7 ms; conditions and limits are recorded in
`references/modern-performance.md`. Continue measuring modern performance as
features expose real costs, without detouring into unrelated hidden systems.

Next: integrate the existing reviewed `removeBuildingOccupant` and occupancy-mode
helpers into live evacuation. They release people at their existing XY with exit
anchors/facing; the current browser door teleport is wrong. Then resume critical
first-mission mechanics and visible comparisons. Broader propagation, native
occupancy slots/order ownership, full class scheduling and full game parity remain
open. Discovery stays open; this progress does not complete the fire checkpoint.


### Latest visible integration: followers leave buildings in place

The measured shared-atlas optimization is complete. Native exit restoration,
rotated exit anchors/facing and cleared motion deltas now replace door teleports
across live damage, burning, terrain collapse, upgrade and training release.
Celebration retains its own drop-log/exit ordering. Shared occupancy types use
readable position/displacement/anchor names; ordinary sprite ownership is kept.
11,200 occupancy comparisons, 1,024 conversion cases and 538 portable native
captures cover the shared reconstruction. The real six-follower evacuation ran
at roughly 120 FPS on the M5 GPU with 6.2 ms CPU p95 and zero large atlas reuploads;
conditions and limits are recorded in `references/modern-performance.md`.

Next: integrate the original staged building entry and occupant admission into
first-mission housing/training, where the browser still hides followers as soon
as they reach the door. Use existing reviewed command/queue/occupancy controllers
and check visible entry, capacity and conversion behavior before broader hidden
bookkeeping. Keep native mechanics, clean concise TS, uncapped smooth rendering
and measured modern performance together. Full slot/order/allocation ownership,
remaining classes, campaign and full engine parity are unfinished. Discovery
stays open; this bounded correction does not complete a broad economy checkpoint.

### Latest visible integration: native staged housing entry

Followers now approach the original outside door, visibly walk toward the native
interior and become occupants only at the original admission threshold. This
uses shared command-8, occupancy, route and movement controllers; entry's scoped
animation is released on admission or cancellation. All hut sizes/orientations,
capacity, interruption and 5–240 Hz timing have portable checks; real browser
right-click input and visible sprite pixels are covered. The M5 approach measured
roughly 120 FPS with 6.0 ms CPU p95. Details and limits are in the reverse-engineering
and modern-performance references.

Next: integrate original training admission/queues and conversion through the
reviewed controllers. Training capacity is five in the native table; the current
live one-at-a-time adapter remains to replace. Tower socket/clipping routine
00404540 is now retained in the repo for its later live integration. Keep visible
mechanics and original artwork ahead of hidden bookkeeping, with clean shared TS,
uncapped smooth presentation and measured modern hardware performance throughout.
Full slot/order/allocation ownership, class scheduling, campaign and engine parity
remain unfinished; discovery stays open.

### Latest visible integration: original warrior training

Warrior huts now hold five trainees, queue overflow at original shape sockets,
preserve visible mode-3 residents and replace a funded batch with new warriors.
The original controller owns queue priority, admission delay and slot reuse.
Shared native movement-order preparation corrects coastal/building exit targets;
warriors visibly walk out with original sprites. The old one-person conversion
and invented birth flash are removed. Checks cover real input, queue pixels,
batch identities, full first-mission play and 5–240 Hz deterministic state.
The M5 queue approach measured roughly 120 FPS with 6.6 ms CPU p95.

Next: original training/occupant UI feedback and tower socket/clipping admission,
then continue critical first-mission controls, visible effects and campaign
comparisons. Review original frames to choose the next visible mismatch. Keep
shared readable TypeScript, native gameplay timing, uncapped presentation and
measured modern GPU performance together. All other training schools/classes,
full allocator/command-tail ownership, special occupants, class scheduling,
campaign and complete engine parity remain open. Discovery stays open.

### Current continuation: dismantling and tower admission

The current terrain and shared-atlas performance improvements are finished and
validated. Important visible gameplay work has resumed with the same modern
performance, uncapped timing and clean-code acceptance criteria. The original
five-person training panel now supports single-person selection, Shift group
toggling, keyboard activation and camera focus. Selected trainees can receive
normal movement orders and walk out without teleporting or removing the others.
Native input/selection comparisons, actual browser interactions, source-art pixel
checks and modern desktop geometry are recorded.

Next: connect the panel's original **dismantling** command and timber-recovery
behavior, then tower socket/clipping admission. The command trace corrected the
earlier evacuation label: 0x40 starts dismantling through person command 10;
ordinary occupant clicks emit selection command 0x2a with flags 6, not removal.
Keep the original mechanics rather than inventing instant destruction/ejection.
Person-panel opening, hover/pressed tint, secondary selection voices, original
command/selection-state ownership and panel allocation/lifetime remain open.
Continue critical first-mission controls, effects and campaign comparisons after
these integrations. Full parity and the broader modernization audit remain
unfinished; discovery stays open.


### Latest visible integration: staged warrior-hut dismantling

The original panel button now assigns residents and queued braves to native
command 10. Workers leave in place, walk to the original work sockets, dismantle
the hut through its original model stages and recover timber. Cancellation,
shared-order cleanup, source-art control states and original work sprites pass
native and live browser checks. Selection eligibility now uses the correct native
flag word with an expanded regression oracle. The eight-worker scenario measured
roughly 120 FPS; deterministic outcomes match at 5–240 Hz. Details and limits are
in the reverse-engineering and modern-performance references.

Next: tower socket/clipping admission, then incomplete-building contextual controls
(including restarting cancelled dismantling), followed by critical first-mission
controls, effects and campaign comparisons. Keep visible mechanics, clean shared
TypeScript and measured modern performance together. Full native allocation,
command/state/class scheduling, special structures, all other panels, campaign
and full engine parity remain unfinished. Discovery stays open.


### Latest visible integration: guard-tower admission and raised occupants

Ordinary guard towers now admit the three live follower classes through the
original entry rules, use imported tribe/orientation-specific sockets and display
height, play the original occupant pose once, and restore movement without an
XY teleport. Shared physics and imported-sprite regressions accompany the native
comparisons; 5–240 Hz schedules produce identical outcomes. The close-view
hardware sample, CPU costs and camera/roof occlusion limits are recorded in the
modern-performance and reverse-engineering references. No frame-rate cap or extra
render loop was introduced.

Next: incomplete-building contextual controls, including restarting cancelled
dismantling; then tower selection controls and critical first-mission mechanics,
effects and campaign comparisons. Keep native mechanics, visible fidelity,
maintainable shared code and measured modern performance together. Specialist
tower attacks/spells, AI reassignment, complete native command/allocation/state
ownership, other classes, campaign and full engine parity remain unfinished.
Discovery stays open; finishing this bounded admission feature does not finish
the tower subsystem or the modernization audit.


### Latest visible integration: construction-plan controls

Incomplete ordinary buildings now show original worker/timber rows and their
linked dismantling control. Workers support single/group/keyboard selection;
active builders can switch to dismantling, cancel and restart without losing
position or cargo. Native draw/input captures and source-art browser pixels are
recorded. The browser corrects the original unlinked-panel height defect and
reuses cached canvases with uniform modern HUD scaling. Panel DOM handling was
extracted from the large scene module; native frame/control painting is shared.

Next: guard-tower contextual occupant selection and critical first-mission
mechanics/effects/campaign comparisons. Continue native evidence, complete live
scenarios, clean shared code and measured modern performance together. Full panel
allocation/lifetime, person panels and secondary voices, global construction/order
ownership, specialist classes, campaign and full engine parity remain unfinished.
Discovery stays open; the remaining modernization findings still apply.


### Latest visible integration: guard-tower occupant controls

The native single-occupant tower panel now supports mouse/Shift/keyboard selection,
camera focus, empty-tower hover and dismantling controls. Selected occupants can
receive ordinary movement orders and walk out without an XY teleport. Reassigning
a tower occupant now connects the original resting-slot rebuild consumer; braves
complete dismantling while warriors/shamans leave without performing that work.
Native drawing/input comparisons, source-art pixels, browser scenarios and modern
geometry/performance checks are recorded. The existing cached panel renderer and
HUD atlas are shared; full panel lifetime/command ownership remain open.

Next: original first-mission combat dispatch, beginning with the existing melee
battle/targeting adapter, then campaign attack orders and visible spell effects.
Compare the original decisions, damage, animation and timing before replacing
approximations. Preserve clean shared TypeScript, uncapped presentation, native
mechanics and measured modern performance. Specialist tower combat, person panels,
secondary voices, allocation/scheduler ownership, campaign, saves, multiplayer and
full engine parity remain unfinished. Discovery stays open.

### Latest combat integration: attacks against busy group opponents

The ready-fighter decision now permits original opportunistic group attacks,
including the native slot-distance boundary and special/strike choice. Busy
opponents retain their ongoing action and facing. Verified against 30,240 native
code-block cases, live damage/state tests, 5–240 Hz replay and original browser
sprite rendering; the headed combat profile is recorded separately. This is a
bounded decision requirement, not completion of melee combat.

Next: complete ordinary melee action/recoil scheduling and motion, terrain-aware
fight relocation and native command ownership, then campaign attack dispatch
and visible spell effects. Keep modern performance and clean code as acceptance
criteria. Preserve the remaining full-game scope, including all specialist
classes, campaign content, saves and multiplayer. Discovery remains open.

### Latest combat integration: timed recovery and native knockback

Ordinary attack/recoil phases use authored animation durations and native visit
order; sounds and pose transitions follow the original expiry. Knockback now
uses shared native terrain/collision/airborne physics and stays active until
settling, with the original delayed return and fight recentering. Combat damage
survives the physics handoff, and new impulse records join cell lists before
moving. Native timing/initialization/physics comparisons, live slope and command
scenarios, 5–240 Hz/irregular replay, sprite regressions and a headed frame-cost
sample are recorded. Full native grouping, approach speed/RNG, terrain relocation,
damage modifiers, effects and command/AI ownership remain open.

Next: replace approximate melee approach and terrain-mask fight relocation, then
continue original campaign attack dispatch and visible spell behavior. Preserve
the entire unfinished game/engine scope, modern desktop performance and clean,
shared TypeScript. Discovery stays open.

### Latest combat integration: original fight-site placement

Fight groups now leave building footprints and search original terrain masks and
other-fight occupancy in the authored indexed order. Failed searches retain the
fight instead of cancelling it. Native comparisons cover 2,048 complete calls;
live/browser tests preserve combat and recoil sprites. Sampling height only for
accepted sites produces identical results with fewer terrain reads and measured
lower search CPU cost. Rendering stays uncapped and placement remains turn-based.

Next: original melee approach speed, collision and RNG, then prefight/group
allocation and campaign attack dispatch with visible effects. Native allocator
counter phase, initial member/angle choice and full command ownership are still
open; the live adapter supplies world-turn phase to the verified placement
primitive. Preserve all unfinished game/engine scope, readable shared TypeScript,
modern desktop performance and source-backed behavior. Discovery stays open.

### Latest combat integration: native approach and ready-slot movement

Fighters now draw original approach speed, use native destinations/collision/slope
physics, stop at the original tolerance and wait the original turn before chasing
a relocated slot. Retained motion records preserve recoil recovery, native height,
cell ownership and original walking/carrying poses while rendering stays smoothly
interpolated. Native blocks and composed live trajectories, portable cadence
replay and browser checks pass. Redundant physics context/cell rebuilding is
removed with measured identical-state CPU savings.

Next: original command interruption and prefight/group dispatch, including whether
and when a movement order allows a fighter to disengage; then first-mission AI
attack scheduling and visible effects. The current legacy contact scan can
immediately reacquire an opponent, which needs original behavior comparison.
Class allocator/counter phase, initial group angle/member ordering, full damage
modifiers/effects, other unit classes, all campaign content, saves and multiplayer
remain unfinished. Keep readable shared TypeScript, modern performance and the
entire game/engine objective; discovery stays open.

### Latest combat integration: original engagement gates and cell ranges

The current performance improvement is finished; continue important mechanics and
visuals with the same clean-code, uncapped timing and hardware-profile gates.
Ordinary followers now use native eligibility, command-dependent ranges and
wrapped whole terrain cells instead of blue/red distance heuristics. Moving
followers check their own cell, idle followers check a larger square, both tribes
pursue detected enemies, and explicit attacks remain immediate. Comparisons cover
8,192 native eligibility/range cases and 4,096 person-only scans. Live/browser
movement, original sprites, 5–240 Hz/irregular replay and crowd profiling pass.

Next: complete automatic area orders and prefight target selection/sharing, then
first-mission campaign attacks and visible spell behavior. This step does not
establish complete retreat/interruption parity: native mixed-object scans, command
restoration, allocator/counter phase and initial group membership/angle remain
open. Keep the lifecycle requirement partial and its percentage unchanged until
its completion gate is met. Use the findings in the latest reverse-engineering
entry; do not return to the superseded team-distance shortcut. Preserve the full
unfinished campaign, all classes, saves and multiplayer scope.


### Latest combat integration: original area targets and attacker reservations

The current performance improvement is complete. Ordinary automatic attacks now
use native mixed-object detection, stable distance/class priorities and attacker
reservations instead of selecting the first enemy in the browser array. Squads
spread over unreserved opponents; nearby buildings retain their attack between
scan visits. Original walking/combat sprites and fixed-turn timing remain intact.
The selector uses a measured faster stable standard-library sort, with complete
native comparisons, portable captures, live tests and modern GPU profiles recorded.
Target query code is separate from movement/sprite ownership; no package or render
clock was added. The bounded target-selection requirement is verified; complete
melee lifecycle is still partial.

Next: original automatic command-21 allocation, same-cell response sharing and
previous-order restoration, then prefight/group dispatch and first-mission campaign
attacks with visible spell effects. Use the newly retained native command exports;
do not substitute another heuristic target scan. Browser group admission/replacement,
mixed-class allocation/cell ties, counter phase, specialist classes/plan variants,
full damage/effects, all campaign content, saves and multiplayer remain unfinished.
Keep clean readable TypeScript, native mechanics, uncapped presentation and measured
modern performance together. Discovery remains open and the full goal stays active.


### Current command migration: shared automatic responses

Original response allocation/sharing now has a complete native-tested controller.
Live queries use original global scan suppression, specialist dispatch selection
and coastal command-21 preparation, including the shifted search edge. Native
counters and sprite ownership are preserved. Queue completion consumer names were
corrected after tracing their saved-vehicle and saved-building behavior.

Next connect the recovered initializer's shared order records to the ordinary live
person controller and retain normal command queues through fight entry/completion.
Use `startPersonOrders`, `stepPersonOrders` and `advancePersonOrder` with actual
command-19/21 bodies and world consumers. The current `releaseTasks` fight handoff
still loses legacy work; a path/task snapshot would not implement original queue
semantics. Saved building/vehicle restoration exports are retained for this work.
This primitive recovery and the live gating/coast fixes do not complete automatic
orders or grant a new parity requirement. Continue campaign attacks and visible
spell behavior once the command handoff is integrated. Keep all unfinished game
scope, clean TS, uncapped timing, measured modern performance and open discovery.


### Current visible integration: moving-target pursuit

The terrain/performance work is complete; visible mechanics continue. Ordinary
chasers now refresh their route while the target moves, using the original
`00439850` inclusive per-axis destination threshold. Small movements retain the
existing route. This shares the current native route planner and does not acquire
sprite ownership or add a render clock. Native decision comparisons, live 5–240 Hz
replays, original walking/combat sprites and a moving-target GPU workload are
recorded in the reverse-engineering and modern-performance references.

This is a bounded pursuit correction, not complete command-19/21 execution.
Continue the real ordinary command handoff and prefight dispatch, then campaign
attacks and visible spell behavior. Entry/speed, pursuit timeout/failure, housed
and vehicle targets, group admission and normal queue restoration remain open.
Preserve clean TS, modern hardware performance and the full unfinished game scope;
the lifecycle requirement remains partial and discovery stays open.

### Current visible integration: original outdoor encounters

Ordinary outdoor combat now plays the native approach, opening strike, stagger,
physical recoil and reapproach before creating the defender-centered fight.
The controller uses shared routing, animation, RNG and person physics with named
phases; its recovered logic is independently compared to the executable. Original
idle gestures and stagger layers are imported without changing existing poses.
A measured first-hit texture upload stall was removed by preparing the shared
atlas during scene loading; no simulation timing or original pixels were traded.

Continue original command ownership/restoration and group admission/splitting,
then first-mission campaign attacks and visible spell behavior. Building encounter
phases, allocator/counter phase, specialist classes, whole melee lifecycle and all
remaining game scope stay open. Keep clean TS, native mechanics and uncapped,
measured modern rendering together. The prior terrain performance pass is complete;
do not let another speculative performance rewrite displace visible gameplay.

### Current visible integration: reinforcement and fight splitting

Ordinary reinforcements now use the same native admission decision as target
selection: three members per tribe, first weaker friendly replacement, then
last-of-each-tribe splitting when both sides have reinforcements. Persistent native
slots are retained separately from the center-first processing order; center
changes happen on the group visit. This replaces the old four-person/reverse-array
shortcut. Native comparison, live deterministic replay, original rendered poses
and an admission/split-bearing hardware workload are recorded.

Continue original group cleanup and real command-19/21 ownership/restoration,
then first-mission attacks and visible spell behavior. The combat screenshot also
shows existing overhead health bars floating well above the sprites: inspect the
original positioning/gating and correct that visible defect next. Allocation
limits/counter phase, specialist classes, complete release/death recovery and all
remaining game scope remain unfinished. No extra lifecycle percentage credit is
claimed before its full gate is met. Preserve clean code, native behavior and
measured modern rendering; the previous performance pass remains complete.

### Current priority: gameplay and visible parity after the performance pass

The modern rendering/performance pass is complete. Continue important gameplay
mechanics and visuals; do not start another broad speculative performance rewrite.
Keep fixed-turn mechanics, uncapped presentation, readable TypeScript and measured
modern hardware performance as constraints on each new feature.

Original held-key unit health gauges now replace the floating horizontal boxes.
Their visibility, scaled-pose anchors, palette, fill and background alpha are
checked against native execution and browser pixels. A shared immutable atlas
reduces six original primitives to one quad per visible gauge, removes obsolete
box batching/shader code, and improves CPU time in the 200-person hardware sample.
The native sprite regression suite still passes. Full query-mode indicators,
building health, all input ownership and broader hardware coverage remain open.

Next implement native fight cleanup and actual command-19/21 ownership/restoration,
then first-mission campaign attacks and visible spell behavior. Keep allocation,
specialist classes and the full unfinished game scope explicit. No additional
whole-control or melee-lifecycle percentage credit is claimed for a bounded fix.

### Current integration: original fight cleanup and recovery

Native ownership/state/life gates, squared separation distance, persistent-slot
cleanup, center choice and winner counters now drive ordinary live fights.
Survivors use the existing person-state initializer after their group disappears;
player interruption during knockback also clears airborne fight ownership.
Native comparisons, deterministic 5–240 Hz replay and browser death/idle/walk
checks cover this bounded change. Rendering and simulation clocks stay separate.

Next implement actual ordinary command-19/21 queue ownership and restoration,
then first-mission campaign attacks and visible spell behavior. Do not substitute
saved browser-task snapshots for the original queue. Global class scheduling,
allocator limits, building encounters and specialist classes remain unfinished.
The melee lifecycle stays partial; these verified parts do not complete its gate.

### In progress: compose the original attack controller and shared queues

Verified staged parts now include pursuit/setup/area eligibility, fight waiting
positions, fight/person/housed/busy-target approaches, retry, command-19/21
search/start and automatic retargeting, exact approach-point queries, plan attacks,
and completed-building attacks. See `references/reverse-engineering.md` and the
native comparison scripts for bounded evidence; these are not a live lifecycle.

The latest building-target phase 3 implementation matches 16,305 native calls,
including 64 multi-visit sequences across all seven action phases. Geometry,
movement recovery, animation, shake, damage, RNG, invisibility and disguise execute
natively. Destination/occupant/encounter/audio consumers are supplied. 361 portable
captures retain the checks. Plan/building entry share existing code, with the full
10,624-call plan regression passing. No new live combat or lifecycle credit.

When combat is selected under the noticeable-impact priority above, compose ordinary `0051a2a0` phases with actual world consumers and the existing
startup/update/advance helpers and shared `w.buildingOrders` pool. Finish defender
query/removal and building encounters, actual plan destruction and command
completion. Preserve queued movement/work through native ownership; never add a
second pool or saved browser task/path replay. Ranged phases 10/11 remain open.
Keep this live integration ahead of further unrelated combat helper reconstruction,
then return to first-mission campaign attacks and visible spells.

The broad performance pass is complete. New mechanics stay fixed-turn, rendering
uncapped, and TS clean and readable. Profile the composed controller when live.
The entire game scope and all unfinished lifecycle requirements remain active.

### Audio work delivered; finish current tree ambience correction

Latest user direction, 2026-09-10: finish the current building-attack work, then
continue music and ambient sounds. Inspect the supplied original audio and native
playback/ambience selection, reuse existing browser audio ownership, and implement
an audible first-mission experience. Preserve clean code, fixed-time scheduling,
modern browser audio activation, user volume control and efficient playback.
Validate playback, pause/resume, muting and resource cleanup in a real browser.
Do not claim complete audio parity from asset extraction alone.


Music/ambient first implementation is now live in source: five original drone
recordings, ten percussion banks (29 PCM clips plus ten silent descriptors), native
percussion selection and ordinary ambient layer/accent decisions. 8,192 original
selection/ambience comparisons and a real-browser audio check cover this bounded
work. Playback uses streaming and the audio clock, with pause/resume, master/music
volume, muted/restarted cleanup and uncapped-FPS timing checks.

Remaining audio parity includes native tree/object and activity ownership,
special-landscape substitutions, frontend music selection and voice scheduling.
Terrain counts now use accepted renderer triangles and the original depth cutoff;
256 native lists/8,070 triangles and live submitted-list replays verify this bounded
integration. Exact whole-scene membership, special renderer flags and native timing
remain open. Tree eligibility now uses rendered cells and the original listener
offset/wrapped radius; complete native object ownership remains open. Ordinary
attack-target ownership remains an adapter. Music activity now resets each simulation turn and is raised by encounter
and valid fight-member visits, including approach/ready phases before a strike.
4,096 complete native encounter calls and 405 fight traces include this signal;
real-browser encounter→battle music→quiet propagation is checked. The full native
attack command queue remains necessary to finish activity ownership.
Active ordinary ambient gains now follow the current weights
without restarting samples; 4,096 native volume comparisons and real-browser
land/water/globe transitions cover the update. Exact object counts, special
landscape mixing and native voice arbitration remain unfinished.
Do not block audible gameplay on unrelated decompilation. The
next task is selected for the biggest noticeable improvement under the execution
order above; the full-game scope remains active.
