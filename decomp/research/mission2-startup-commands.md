# Mission 2 startup commands and tower staffing

Preserved 2026-09-14 for the playable Mission 2 continuation. This note covers only
the startup commands and task consumers reached through the first recurring script
block; it is not evidence of complete Mission 2 or PopScript command coverage.

## Proven startup behavior

Mission 2 uses `cpscr074.dat`, SHA256
`03931ad1bc69860177c0a0d7d850db46b268683bf95b274926e18fe1f8a5d9db`.
Its enemy shaman, warriors, and model-4 tower belong to native tribe 3. PopScript
`EVERY` includes the signed tribe in its mask expression, so the browser must retain
tribe 3 for script and computer scheduling even though its UI renders every enemy as
the existing red team. The input-unlock command first runs at turn 69 for tribe 3;
the first code-ordered recurring spell-interval block runs at turn 121.

Command 1069 resolves two operands and truncates both to bytes. Mission 2 supplies
50 and 130. [`004f5280`](../generated/004f5280.c) sets AI flag `0x20` and stores the
packed word `0x8232` at tribe offset `+0x5a4`. It makes no world or presentation call;
the downstream meaning remains an unnamed coordinate latch.

Command 1097 resolves a 32-bit person model and two byte coordinates. Mission 2
supplies warrior model 3 at `(124,124)`. [`004925e0`](../generated/004925e0.c) is the
dispatch wrapper and [`004e67b0`](../generated/004e67b0.c) finds the model-4 tower,
returns when it already contains a warrior or shaman, and otherwise allocates the
first free ten-slot task as type 7 with that tower and requested model.

## Type-7 consumer

[`004c8910`](../generated/004c8910.c) processes phases 0/2/3/4/5/6/7. It validates
the tower, ejects occupants that are neither the desired model nor a shaman, acquires
the shared AI selection owner, and uses [`004f7dc0`](../generated/004f7dc0.c) to pick
one nearest eligible non-shaman of the requested model. The selected person enters
state 14, the tribe command delay becomes 20, and a later phase issues person command
model 8 targeting the tower. Normal movement and building admission own arrival; the
task does not write occupancy directly. Cancellation or completion restores remaining
state-14 people, releases selection ownership, and clears the task.

## Two-marker warrior patrol

At turn 53, the Mission 2 script allocates ordinary task type 24 from marker entry 2:
primary marker 5, secondary marker 6, and quotas `[0,3,0,0]`. The two markers map to
browser points `(52,114)` and `(50,108)`. [`004cedd0`](../generated/004cedd0.c)
acquires three model-3 warriors and queues two consecutive model-11 orders with
parameter `0x606`; normal order attachment converts the pair to cyclic model-25 route
points. There is no leading move order on this branch. Ordinary route mode also leaves
the computer assignment unchanged. [`004f3880`](../generated/004f3880.c) counts people
already following either endpoint before quotas are selected.

## Input release notification

At turn 69, opcode 1174 resolves message number 102 through the executable table to
string ID 641. [`0048ea80`](../generated/0048ea80.c) allocates notification type 1:
lifetime 0, speed 8, height 24, cap 1, draw kind 3, icon 171, and base flags `0x40`.
Allocation consumes one shared RNG draw and emits cue `0xe3`. The following opcode
1187 opens the notification and opcode 1113 clears the input-lock bit. The repository
does not contain `language/lang00.dat`, so the exact localized prose for string 641 is
not claimed.

## Schedule evidence and limits

`work/orchestration/mission2-recurring/native/inspect-schedule.mjs` executes the
recovered browser interpreter with current turn and internal model 1202 supplied,
intercepting all command effects. Its saved result confirms startup at turn 0,
unlock at turn 69, and the first recurring spell-interval block at turn 121 for
tribe 3. Direct native dispatcher execution later established that opcode `1173`
writes tribe-local spell intervals, not producer attributes.
This is control-flow evidence, not a live native-game probe.

The eight exports were produced by Ghidra 12.1.3 after section-byte verification against
executable SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`;
their exact hashes are in `decomp/exports.json`. Ghidra names and types may be inferred,
and its pseudocode is not recovered source. No repository-local executable or adjacent
game data was available for a full runtime comparison. A fingerprinted browser-world
probe and regression reach turn 121; they do not establish behavior beyond this slice.
