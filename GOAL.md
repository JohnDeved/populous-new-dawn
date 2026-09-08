# Goal: full Populous: The Beginning parity

Status: unfinished. The first mission is playable; full game parity has not been achieved. Execution pause/resume is controlled by the thread goal service.

Recreate the user-supplied original for desktop browsers. Match its world and camera, original graphics and audio, controls, simulation, all gameplay classes, campaign, saves and multiplayer. Desktop keyboard/mouse and a monitor are the target; mobile support is not required. Continue publishing validated playable builds to the existing private Site.

## Revised working objective

Treat clean, readable, maintainable, concise and simple TypeScript as a main
priority throughout parity work. Allocate time to refactoring existing ports;
use Fallow, ox-standard and Ponytail in the regular development workflow.
Reconstruct original behavior in idiomatic game code, keeping raw decompiler
output and address-level bookkeeping in the decompilation evidence.

Achieve full game and engine parity through an ongoing decompilation and browser reimplementation of the user-supplied Populous: The Beginning. Make the reverse-engineering work a maintained part of `/Users/johann/populous-browser`: reproducible tool setup, executable identities, address-based exports, reviewed reconstructions, findings and native comparison checks. Research available symbols and reusable projects, reuse applicable work with recorded provenance and license terms, and verify cross-version metadata against the supplied executable. Translate recovered behavior into the browser engine instead of replacing it with approximate game rules. Preserve the complete scope above; first-level parity is the immediate integration target, not the definition of completion. Prioritize visible graphics, rendering, effects, UI, controls and critical gameplay before less-visible internals, as specified below. Publish validated builds and leave all unverified differences explicit until the entire game meets the completion checklist.

## Current priority: visible fidelity first

### Global parity tracking

Maintain [the parity dashboard](PARITY.md) and its versioned capability checklist
in `parity.json`. Report the global verified-checkpoint percentage, subsystem
breakdown and partial/missing counts as progress; this is a planning metric, not
an estimate of effort remaining or an objective fraction of the original engine.
Only compared, integrated behavior earns verified credit for its stated scope.
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

**Next action:** compare the running first mission against the original reference
captures again, prioritizing terrain/coast colors, lighting, scale and the remaining
visible placement/control gaps. Continue building activity/destruction as those
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
scenery and native multi-turn knockback remain open. Casting
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
| Graphics and interface | Original layered unit sprites, native bank-2 meshes, HUD and several effects; native eight-way camera-heading sprite selection; full object/person animation setters and all four update modes CPU-compared, including composed celebration/frame timelines; bank redirect and vault morph coordinates CPU-compared; native defeat-sky quad and palette colors CPU-compared, opacity/depth integration checked with browser GPU pixels; opening tooltip names/lifetime, indexed colors and window rectangles CPU-compared; compact original HUD frames/icons, bitmap counts and shared model hover/click targeting integrated, with 606 native English glyph selections/advances compared; native selection-arrow gating/position/scale CPU-compared and integrated with original animation-frame bounds | Shared animation records now drive live celebrations; still required: native presentation scheduling and remaining animation states, layers, palettes, blend passes, effects and controls; original fonts/layout, hover and remaining forced tooltips; full morph scheduler and hut variant RNG |
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
