# Goal: full Populous: The Beginning parity

Status: unfinished. The first mission is playable; full game parity has not been achieved. Execution pause/resume is controlled by the thread goal service.

Recreate the user-supplied original for desktop browsers. Match its world and camera, original graphics and audio, controls, simulation, all gameplay classes, campaign, saves and multiplayer. Desktop keyboard/mouse and a monitor are the target; mobile support is not required. Continue publishing validated playable builds to the existing private Site.

## Revised working objective

Achieve full game and engine parity through an ongoing decompilation and browser reimplementation of the user-supplied Populous: The Beginning. Make the reverse-engineering work a maintained part of `/Users/johann/populous-browser`: reproducible tool setup, executable identities, address-based exports, reviewed reconstructions, findings and native comparison checks. Research available symbols and reusable projects, reuse applicable work with recorded provenance and license terms, and verify cross-version metadata against the supplied executable. Translate recovered behavior into the browser engine instead of replacing it with approximate game rules. Preserve the complete scope above; first-level parity is the immediate integration target, not the definition of completion. Publish validated builds and leave all unverified differences explicit until the entire game meets the completion checklist.

## Current implementation focus

Continue from the existing original-asset renderer, fixed-turn simulation and partially reconstructed campaign VM:

1. Trace the original campaign command handlers, beginning with spell-cast counts, one-off spell charges and stone-head trigger counts. Verify when their underlying counters change, not just how scripts read them.
2. Reconstruct the remaining command bindings and AI scheduling so the original first-mission script drives gameplay, including events, attacks and objectives. Retire approximate rules as their original behavior is established.
3. Compare each reconstructed behavior against the supplied executable and exercise its browser integration. Keep unsupported commands and remaining differences visible in the evidence log.
4. Extend the same process across the remaining engine systems and all missions; validate rendering, audio, controls, saves and multiplayer as part of full parity.

## Decompilation is part of the project

Standing user requirement, added 2026-09-07: keep decompilation tools and discoveries in this repository, reconstruct the original routines where possible, and port their behavior into the browser engine. Do not substitute invented rules where the executable provides an answer.

The repository owns [pinned tool setup, Ghidra scripts and pseudocode exports](decomp/README.md). Each port must connect an original entry address and executable identity to the browser implementation, tests, and remaining differences. Keep raw Ghidra output distinct from reviewed reconstructions: inferred types and names are not recovered original source. Evaluate existing projects before rebuilding their work; record upstream revisions and applicable licenses.

The replacement thread goal was created on 2026-09-07 with this revised scope and is active. This file tracks its implementation evidence and remaining requirements.

## Side objective: keep development easy

Standing user requirement, added 2026-09-07: the stack and code must help progress rather than constrain it. Keep this a modern, concise web project that is easy to run, edit, extend and experiment with while retaining original-game parity.

- Use TypeScript for the deterministic engine, React for interface state, Three.js for rendering, Web Audio for sound, and the existing Vite/vinext development and publishing flow. Evaluate dependencies or stack changes against a concrete parity, tooling or performance need; adopt a framework when it removes real work without constraining native behavior.
- Keep simulation independent of browser/rendering/UI APIs so it runs directly in Node for tests and native comparisons. Keep assets and imported original data distinct from hand-written behavior.
- Organize new engine work by coherent subsystem, with readable code, explicit state and named data definitions. Extract parts of the growing model/scene modules as their responsibilities are reconstructed; avoid compressed one-line implementations that make debugging or review harder.
- Reuse shared definitions and helpers so adding a spell, unit or command does not require updating unrelated copies. Record native widths, units, phases and evidence near reconstructed behavior.
- Preserve a fast edit/play/check loop, documented commands, reproducible imports and a small set of useful checks. Refactors must preserve established native and gameplay comparisons. Measure performance before adding workers, WASM or another engine layer.

This side objective supports the full-parity goal; ease of implementation is not a reason to replace original behavior with a framework's defaults. Review actual friction as the game grows rather than treating the current stack as permanently fixed.

## Completion checklist

All rows remain open until compared against the original engine, including edge cases. A playable approximation or a passing browser-only test is not full parity.

| Subsystem | Current evidence | Still required |
| --- | --- | --- |
| Decompilation workflow | Pinned Ghidra/JDK, metadata adapter, section-byte verification, address-based C exports | Continue identifying routines and reconstructing reviewed code alongside ports |
| Developer workflow and maintainability | TypeScript engine runs in Node; React/Three.js/audio separated; mutable simulation store and React revision subscription; Vite dev loop; shared spell definitions, standalone worship/VM modules and `npm run check` | Continue separating reconstructed subsystems, improving readability and removing demonstrated editing/performance friction without parity regressions |
| World, terrain, camera | Original mission-one data, textures and models; native tile split/height routines CPU-compared and used during import; opening flyby queue, motion profiles and 4,077 timeline frames CPU-compared; native camera/model transforms, projection, view tables and mesh bounds CPU-compared and integrated into ground rendering; projected-triangle picking and periodic terrain copies GPU/browser checked | Exact toroidal coordinates, deformation, projection, visibility and camera behavior |
| Graphics and interface | Original layered unit sprites, native bank-2 meshes, HUD and several effects; native eight-way camera-heading sprite selection; bank redirect and vault morph coordinates CPU-compared; opening tooltip names/lifetime, indexed colors and window rectangles CPU-compared | All animation states, layers, palettes, blend passes, effects and controls; original fonts/layout, hover and remaining forced tooltips; full morph scheduler and hut variant RNG |
| Turns and randomness | 12 Hz turns, integer movement tables, native RNG formula | Scheduling order/phases, seed initialization and complete RNG consumption |
| Movement and physics | Integer steps and partial ground recoil | Original pathfinding, formation, steering, collision, slopes, falling and drowning |
| Combat | HP-scaled exchanges, attack selection and up-to-four-person fight groups | Remaining substates, class scheduling, recovery interactions and all unit classes |
| Economy and buildings | Native mana, breeding/training bands and hut upgrade values; original rotated entrance/queue footprint geometry CPU-compared and door routing integrated; native occupant admission, visibility/order cleanup and training-cost arithmetic CPU-compared | Construction, repair/fire/damage, activity timers and all building classes |
| Spells | Blast/Lightning/Land Bridge projectiles, cell targets, spent charges and delayed impact; native 3D-step CPU comparisons | Complete scheduling, targeting/reflection, deformation, animation and every spell |
| Audio | 532 samples decoded; native cue/sample mapping, pitch RNG, distance curve and simulation sound events | Complete trigger/scheduling/voice priority behavior, camera-relative mixing, ambience and adaptive music |
| AI and campaign | Original first-level layout; CPU-compared VM, cast/stock/head query bindings, turn-zero setup, disabled Dakini reincarnation and original terrain-rule bytecode applied; 6,484 native worship/reward turns and 960 vault task/work comparisons; original discovery/settlement/vault notification branches, building counter rebuild/query sequences, marker forcing and type-3 allocation CPU-compared; first-mission spell-defense setup and recurring spell-entry shutoff after the second Blast CPU-compared and integrated; live follower counts and original warrior-dependent attack-commitment block CPU-compared and integrated; AI queue/training controller and follower eligibility/selection reconstructed and CPU-compared, including combined controller/selector calls; shared command encoding, ownership, routes and group commit CPU-compared; shared person initialization, AI reservation/release, facing and animation selection CPU-compared, including 128 combined training handoffs; order startup, building reconciliation and configured speed CPU-compared; training linked-list operations and all command-8 substates with original geometry CPU-compared, including a sequential specialist/trainee queue handoff; native admission/interior-stop composition CPU-compared; pathfinding and remaining world-effect integration pending | Remaining game-command bindings, AI stocks and scheduler; worship eligibility, object phases and remaining reward lifecycle; all missions, objectives, progression and difficulty |
| Persistence and multiplayer | Not implemented | Original save/load behavior and multiplayer simulation/protocol behavior |
| Validation | Thirty-one regression tests, native CPU comparisons and real-browser mission/visual QA, including original models and all three opening callouts | Original-engine traces, cross-engine replay comparisons, complete campaign and multiplayer scenarios |

Detailed port evidence and explicit approximations: [reverse-engineering log](references/reverse-engineering.md). Current upstream assessment: [symbols and reusable projects](decomp/upstreams.md).
