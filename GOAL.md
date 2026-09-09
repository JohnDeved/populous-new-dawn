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
