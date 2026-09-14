# Command 28 and the supposed attacking-shaman cast

## Finding

There is no distinct command-28 shaman spell request to port. `00432590`
dispatches command 28 to `0051fce0`; `0043a4d0` serves commands 17, 31, and 32.
The command-28 wrapper resolves the target ID from order word `+6`, rejects an
invalid/dead target, calls ordinary attack body `0051a2a0`, and contains no spell
allocation, mana/stock mutation, cast RNG, or casting-state handoff.

The wrapper's shaman check is inside the attacker-model-4 preacher gate. It treats
model 7 as a valid preacher target, not as a caster. Any shaman self-Blast after
melee reaches states 25/29 through the separate `004d0860` computer spell
controller already used by the browser.

Mission 1's type-20 attack selects models 2 and 3. Its phase 17 gives command 28
to Red warriors and stores the Blue shaman as their target; it never gives this
command to Dakini. Do not implement an enemy-shaman command-28 counterattack.

## Evidence and limits

- `decomp/generated/00432590.c`: command-minus-three dispatch.
- `decomp/generated/0051fce0.c`: byte-verified complete command-28 wrapper.
- `decomp/generated/0051a2a0.c`: ordinary attack body.
- `decomp/generated/0043a4d0.c`: contrary starting point, not command 28.
- `scripts/check-native-computer-attack.py` and
  `scripts/check-native-command-28.py`: existing Mission 1 route/allocation proof.

`0051fce0` was exported with Ghidra 12.1.3 from executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Static dispatch resolves this decision; no runtime probe or intercepted leaf was
used. Generic command-28 ranged/vehicle behavior and full `0051a2a0` integration
remain open.
