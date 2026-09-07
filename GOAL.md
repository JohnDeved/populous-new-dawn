# Goal: full Populous: The Beginning parity

Status: active. The first mission is playable; full game parity is unfinished.

Recreate the user-supplied original for desktop browsers. Match its world and camera, original graphics and audio, controls, simulation, all gameplay classes, campaign, saves and multiplayer. Desktop keyboard/mouse and a monitor are the target; mobile support is not required. Continue publishing validated playable builds to the existing private Site.

## Decompilation is part of the project

Standing user requirement, added 2026-09-07: keep decompilation tools and discoveries in this repository, reconstruct the original routines where possible, and port their behavior into the browser engine. Do not substitute invented rules where the executable provides an answer.

The repository owns [pinned tool setup, Ghidra scripts and pseudocode exports](decomp/README.md). Each port must connect an original entry address and executable identity to the browser implementation, tests, and remaining differences. Keep raw Ghidra output distinct from reviewed reconstructions: inferred types and names are not recovered original source. Evaluate existing projects before rebuilding their work; record upstream revisions and applicable licenses.

The active goal service does not offer an objective-text editing operation. This file records the additional scope without completing or replacing the ongoing goal.

## Completion checklist

All rows remain open until compared against the original engine, including edge cases. A playable approximation or a passing browser-only test is not full parity.

| Subsystem | Current evidence | Still required |
| --- | --- | --- |
| Decompilation workflow | Pinned Ghidra/JDK, metadata adapter, section-byte verification, address-based C exports | Continue identifying routines and reconstructing reviewed code alongside ports |
| World, terrain, camera | Original mission-one data, textures and models imported | Exact toroidal coordinates, deformation, projection, visibility and camera behavior |
| Graphics and interface | Original layered unit sprites, building meshes, HUD and several effects | All animation states, layers, palettes, blend passes, effects and controls |
| Turns and randomness | 12 Hz turns, integer movement tables, native RNG formula | Scheduling order/phases, seed initialization and complete RNG consumption |
| Movement and physics | Integer steps and partial ground recoil | Original pathfinding, formation, steering, collision, slopes, falling and drowning |
| Combat | HP-scaled exchanges, attack selection and up-to-four-person fight groups | Remaining substates, class scheduling, recovery interactions and all unit classes |
| Economy and buildings | Native mana, breeding/training bands and hut upgrade values | Construction, repair/fire/damage, activity timers and all building classes |
| Spells | Partial Blast, Lightning and Land Bridge ports | Shot travel, exact targeting/deformation, cancellation and every spell |
| Audio | Banks located and sound dispatcher decompiled | Native sample playback, cue mapping, spatial mix and adaptive music; runtime still synthesized |
| AI and campaign | Original first-level layout and progression, script interpreter entry located | Original AI interpreter, all missions, objectives, progression and difficulty |
| Persistence and multiplayer | Not implemented | Original save/load behavior and multiplayer simulation/protocol behavior |
| Validation | Eight regression tests and real-browser mission/visual QA | Original-engine traces, cross-engine replay comparisons, complete campaign and multiplayer scenarios |

Detailed port evidence and explicit approximations: [reverse-engineering log](references/reverse-engineering.md). Current upstream assessment: [symbols and reusable projects](decomp/upstreams.md).
