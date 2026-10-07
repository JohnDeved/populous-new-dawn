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

## Foot-Spy approach and arrival — October 2026

The former browser approach planned the outside point during input and waited for
the browser path cache to become empty. A normal training-order ownership repair
exposed this adapter boundary: a trained Spy reached its final waypoint but
continued circling instead of starting sabotage. The existing training-to-Spy
disguise, ignition, reveal and checkpoint assertions remain unchanged.

A bounded static read recovered the missing target producer `0040a6b0`, through
its return at `0040a969` and four-entry table at `0040a96c`. GNU objdump 2.44 read
the canonical image as data; executable hash before/after was
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original instructions, Ghidra, or held native group-entry probe ran.

The producer calls retained `004b9ef0` to traverse every nonzero shape-mask cell
in row-major order, selecting the first bit `0x20`. All 40 marked cells in the
canonical data have mask `0x24` or `0x26`, without occupancy bit 1; an
occupancy-only footprint traversal would miss every one. A shape without such a
cell falls back to the cell containing its outside point. The producer centers
that cell, calculates the wrapped signed vector toward the inside point, and
quantizes the existing native angle into four quadrants. Cell-relative offsets
are `(256,480)`, `(480,256)`, `(256,32)`, `(32,256)` for quadrants 0–3.

Data-only parsing with the retained `building_shapes` function reproduces all
fields in `app/original-shapes.json` from these exact Component0 members:

- `objects/shapes.dat`, 4,604 bytes, SHA-256 `ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849`;
- `objects/objs0-2.dat`, 8,532 bytes, SHA-256 `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`;
- `data/smoke.txt`, 7,813 bytes, SHA-256 `48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1`.

The smoke member verifies unrelated socket fields during full importer equality;
the Spy producer does not consume them. This establishes raw/imported identity,
not executable-native target or path comparisons.

The aligned caller block `00439dbb–00439e68` establishes the local handoff:

1. Phase 0's entry bit gates one recovery/speed draw and one planned destination
   from `0040a6b0`.
2. A planner failure bit is cleared before an outside-point fallback through the
   same destination owner. This is inside the entry-bit gate, not a per-turn retry.
3. Arrival compares separately sign-extended goal and position fields: each axis
   must differ by at most 11. That subtraction does not wrap across the signed
   seam and does not consult the browser path cache.
4. Arrival only sets phase 1 and its entry bit. On the next controller visit,
   `004d4ee0` stops motion, the timer becomes 10, and the same visit decrements it
   to 9. Later ignition/reveal/aftermath behavior retains its existing owner.

The live repair adds `buildingSabotagePoint`, uses the existing planned-destination
and movement helpers in command 15, and removes only that command's eager
outside-point plan. It does not change generic route arrival, the detector
fixture, training timing rules, or another command. The proved scope is an
on-foot Spy; vehicle landing adjustment and full original history remain outside
this boundary.

`tests/spy-sabotage-approach.test.mjs` exercises actual command/controller callers,
four source-derived rotated targets, coordinate wrapping, the no-marker fallback,
a real failed-route-cache fallback, signed arrival, one-time RNG, and approach /
armed-wait checkpoints. Its static coordinates are source-derived assertions,
not native CPU captures. The unchanged Spy test in `tests/training-entry.test.mjs`
is the end-to-end model witness. Rendered ordinary acceptance and standard gates
remain separate; this source note alone does not establish them.
