# Player Call To Arms (B): bounded input restoration

Base `85ecd24c1dd556d51a1f27d577aaf2b6ac755587`, 2026-11-17. Static source
research, not a fresh native execution or rendered-playthrough claim.

## Native source chain

Default record `005d61d8` is a plain B press, action `0xbf`, no modifiers or
predicate. `process_cmd` case `0xbf` (`004ad2bc`) queues tribe command `0x7c`.
`process_tribe_cmd` (`0043e8e0`) case `0x7c` calls `0040bce0` for the command's
tribe. That helper visits its buildings and calls `0040bd20`. The previously
recovered [tower counterattack](mission2-enemy-marker.md) behavior admits occupied
Warrior Guard Towers, scans for nearby hostile people and orders nearby eligible
tribe defenders with model19. The existing `buildingCounterattack` already owns
this simulation path for campaign opcode1198; no AI/controller changes are needed.

Native B additionally passes string pointer `00973020` to `0047aa20` with
`0x10, playerTribe, 0`, and clears `0089c6a1`. The language loader at
`00492f72–00492f93` fills table `00972ba8` sequentially from NUL-terminated UTF-16
strings. `(0x973020 - 0x972ba8) / 4 = 286`, whose text is **Call To Arms**.
Action0x59 consumes `0089c6a1` as a camera-alert location; B clears that pending
location. No equivalent browser tower-alert owner was established. Do not clear
the unrelated combat `attackAlert` or music-activity fields to imitate it.

`00479cf0` drops commands under landFlags0x800. Command0x7c falls outside its
special table and writes only if the tribe's temporary command byte is empty.
Like the existing scatter adapter, this bounded port applies an admitted command
at input time before the next turn, not through an exact shared one-slot queue.

## Implementation scope and explicit remaining differences

- Plain press-edge B now invokes the existing counterattack for the player tribe
  instead of selecting the Buildings palette and canceling placement mode.
- Modified/repeated presses, paused/finished/input-blocked worlds, menu/selector
  contexts and stale world/scene handlers do not issue the command.
- The existing tower eligibility, hostile scan, order allocation and ownership
  rules remain unchanged. This is not a counterattack algorithm rewrite.
- **Not implemented:** native transient Call To Arms feedback, pending tower-alert
  lifecycle/reset, and exact first-command-per-tribe-per-tick competition. No full
  original-B parity or closure of whole-game UI fidelity is claimed.
- Keyboard tests execute the extracted actual Page handler with supplied leaves.
  Simulation tests use an authored M2 tower with supplied player/defender/hostile
  conditions. Neither is proof of a naturally earned player tower or rendered B.

## Provenance

Fresh hash of original EXE:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Language hash: `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
GNU objdump2.44 was used only to statically disassemble the original bytes.
Retained Ghidra12.1.3 exports freshly matched `decomp/exports.json`:

- `0043e8e0.c`: `39b7c6e645760a599abecb4e44861da69ebc08c3d3370dff0c3835934e9fd309`
- `0040bce0.c`: `5a2613f390ed38ea61d28f8cdcf708157555a0b6b2c7561e41099ffe434a527b`
- `004aab80.c`: `a286e361005571ddcba7405348e2582aa061c3f427d1a8e8fed09a5d1e7890a8`
