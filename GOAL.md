# Goal: full Populous: The Beginning parity

Status: unfinished. The first mission is playable; full game parity has not been achieved. Execution pause/resume is controlled by the thread goal service.

Recreate the user-supplied original for desktop browsers. Match its world and camera, original graphics and audio, controls, simulation, all gameplay classes, campaign, saves and multiplayer. Desktop keyboard/mouse and a monitor are the target; mobile support is not required. Continue publishing validated playable builds to the existing private Site.

## Revised working objective

Achieve full game and engine parity through an ongoing decompilation and browser reimplementation of the user-supplied Populous: The Beginning. Make the reverse-engineering work a maintained part of `/Users/johann/populous-browser`: reproducible tool setup, executable identities, address-based exports, reviewed reconstructions, findings and native comparison checks. Research available symbols and reusable projects, reuse applicable work with recorded provenance and license terms, and verify cross-version metadata against the supplied executable. Translate recovered behavior into the browser engine instead of replacing it with approximate game rules. Preserve the complete scope above; first-level parity is the immediate integration target, not the definition of completion. Prioritize visible graphics, rendering, effects, UI, controls and critical gameplay before less-visible internals, as specified below. Publish validated builds and leave all unverified differences explicit until the entire game meets the completion checklist.

## Current priority: visible fidelity first

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

**Next action:** audit the visible unit cutouts and building surfaces against
original sprite/mesh captures, then scenery fire and building activity/destruction.
Placement previews now use original connected terrain tiles, stored terrain
vertices and the shared native building footprint. The original plan-preview
controller, per-cell validity, doorway arrows, rotation controls and remaining
ground targets are still open; the browser validator supplies preview validity.
Keep checking these during first-mission play.
Lightning now uses its displaced upper flash, three native eight-segment shapes,
recursive screen-space branches and original procedural strip texture; full
painter/blend ownership and its damage/fire side effects remain open. Blast's
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
and water calculations are integrated across the full rendered map, but coastal
blend passes and whole-frame fidelity remain open. Use before/after browser
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
| Economy and buildings | Native follower contribution/generation and full mana distribution/spell charging CPU-compared and first-mission allocation integrated; breeding/training bands and hut upgrade values; original rotated entrance/queue footprint geometry CPU-compared and door routing integrated; full shape-mask registration/removal and cell shade CPU-compared, completed-building occupancy integrated; native occupant admission/removal, containing-building lookup, visibility/order cleanup, training repricing and batch conversion/order inheritance/rollback CPU-compared; native defeat cleanup, damage accumulation and plan stages CPU-compared with a live collapse adapter; original face visibility and exposed-surface UVs CPU-compared and integrated for construction/damage | Full construction, repair/fire/combat damage, collapse debris, activity timers and all building classes |
| Spells | Blast/Lightning/Land Bridge projectiles, cell targets, spent charges and delayed impact; native 3D-step CPU comparisons; height/tower range, entry readiness/reserves, payment and starting mana CPU-compared; live targeting/range ring and enemy spending integrated; native casting lockouts, AI usage recovery and default delay CPU-compared and integrated; wrapped position/cell target ranges integrated, full player validation and entry mode/population filters CPU-compared; native area summaries, cell scoring and composed general scan/dispatch CPU-compared, live native cell scoring, shoreline Blast, general scan/dispatch and building-territory marking/removal/refresh integrated with browser person/terrain adapters; shoreline routine and complete general/emergency spell controller CPU-compared; live controller uses the opening-class person adapter | Complete scheduling, targeting/reflection, deformation, animation and every spell |
| Audio | 532 samples decoded; native cue/sample mapping, pitch RNG, distance curve and simulation sound events | Complete trigger/scheduling/voice priority behavior, camera-relative mixing, ambience and adaptive music |
| AI and campaign | Original first-level layout; CPU-compared VM, cast/stock/head query bindings, turn-zero setup, disabled Dakini reincarnation and original terrain-rule bytecode applied; 6,484 native worship/reward turns and 960 vault task/work comparisons; original discovery/settlement/vault notification branches, building counter rebuild/query sequences, marker forcing and type-3 allocation CPU-compared; first-mission spell-defense setup and recurring spell-entry shutoff after the second Blast CPU-compared and integrated; live follower counts and original warrior-dependent attack-commitment block CPU-compared and integrated; AI queue/training controller and follower eligibility/selection reconstructed and CPU-compared, including combined controller/selector calls; shared command encoding, ownership, routes and group commit CPU-compared; shared person initialization, AI reservation/release, facing and animation selection CPU-compared, including 128 combined training handoffs; order startup, building reconciliation and configured speed CPU-compared; training linked-list operations and all command-8 substates with original geometry CPU-compared, including a sequential specialist/trainee queue handoff; native admission/interior-stop composition and building conversion CPU-compared; pathfinding and remaining world-effect integration pending; complete campaign/multiplayer outcome decisions CPU-compared, live 16-turn result checks, forced flags and defeat-timer progression integrated; simulation continues after results so defeated settlements finish collapsing; all nine native celebration substates, chain actions and state-41 initialization CPU-compared, now driving live braves, warriors and shamans through explicit movement/world adapters | Remaining game-command bindings, AI stocks and scheduler; worship eligibility, object phases and remaining reward lifecycle; all missions, objectives, progression and difficulty |
| Persistence and multiplayer | Not implemented | Original save/load behavior and multiplayer simulation/protocol behavior |
| Validation | Sixty-seven regression tests, native CPU comparisons and real-browser mission/visual QA, including original models and all three opening callouts | Original-engine traces, cross-engine replay comparisons, complete campaign and multiplayer scenarios |

Detailed port evidence and explicit approximations: [reverse-engineering log](references/reverse-engineering.md). Current upstream assessment: [symbols and reusable projects](decomp/upstreams.md).
