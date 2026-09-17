# Mission 12 Spy disguise and sabotage

## Result

The hash-verified executable separates the two player actions:

- command 16 chooses a Spy disguise;
- command 15 sabotages a completed enemy building;
- command 34 is unrelated: it distributes ordinary command 8 toward a selected training-building model.

`scripts/check-native-mission12-spy-sabotage.py` executes the bounded native mutations against executable SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Disguise lifecycle

Class-1/model-5 initialization at `004d23d0` stores `realTribe << 6` in person byte `+0xb2`. Command 16 dispatches to `004de760`, which stores `targetTribe << 6 | 63`. The prefix of `004d32b0` decrements the low six bits once per person update, so the target becomes the apparent tribe after 63 updates.

`004de720` returns the real tribe while the countdown is nonzero and the target afterward. Player rendering at `0041e5b0` flashes the target palette while `(offset_counter_2 & 2) == 0` and the real palette otherwise; a completed disguise holds the target palette. The unit remains model 5.

## Sabotage lifecycle

Completed enemy-building context with the Spy-only people mask `0x20` selects command 15. Its descriptor flags are `0x200001`, so the order stores target coordinates rather than a stable building id. `00439d30` resolves the building from the addressed cell and owns five phases:

1. approach;
2. ten-update wait and nearby detection;
3. bomb animation and nearby detection;
4. eight-update action ending in `00408cb0(building, attackerTribe)`;
5. 24-update aftermath and the target tribe's discovery-chance roll.

Nearby detection scans the surrounding 3x3 coarse cells for an outdoor person of the disguise target tribe. Detection and a successful aftermath roll call `004de7f0`, restoring `realTribe << 6`. The discovery percentage is the target tribe's AI attribute 40. Ignition sets building state 4 and attacker attribution; browser fire rendering and structural burn progression remain world-owned effects.

## Ordinary combat reveal

The new-encounter path `0051a2a0 -> 0051e150 -> 004d2740` initializes both people in state 29 through `00518480`. For class-1/model-5 Spy, that initializer calls `004de7f0` and restores `realTribe << 6`. Eligibility and encounter allocation happen first; reveal happens before group membership, encounter phase, fight handoff, or damage. Existing-group admission uses state 25 and `005184e0`, which performs the same reveal before its slot and group-id writes.

## Checkpoint ownership

An active restore must retain the full disguise byte, person command phase/timer/movement fields, command-15 order and pool ownership, and the target building's registered cell, damage state, attacker, and burn state. The browser checkpoint structured-clones these existing world owners; no parallel Spy save record is needed.

## Evidence boundary

The native check supplies unrelated allocation, terrain, movement, animation, and teardown leaves. It proves Spy initialization, the 63-update transition, command-34 correction, command-15 ignition, and deterministic reveal at a 100% discovery input. Byte-verified combat exports prove the ordinary encounter ordering without a new native probe. The shipped browser check supplies normal Mission 12 training and rendered controls, then uses bounded approach setups because cross-island transport is separate gameplay. Broader detection arrangements, combat reinforcement/death, transport to enemy islands, and the exact original UI gesture for choosing a tribe remain open.
