# Mission 16 Bloodlust native findings

## Scope and provenance

The bounded question covered Mission 16's two authored Bloodlust rewards and the
complete follower status loop. Research used executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
Mission 16 level/header hashes `d0e4aae3e9cb7794e0f1454b08cd129638eef6b3a0e3f4b800cb4a5a8006de2b` /
`748693a7571d36053bd45f5ba2a58f4c48e72cc9eaa35325b1257b0079873ef7`,
and scripts 25–27. The non-recording probe is
`scripts/check-native-mission16-bloodlust.py`.

## Mission acquisition

Objects 4 and 7 are model-20 spell gifts, each linked from one trigger (6 and
9). Their browser trigger positions are `(85,-77)` and `(-33,-13)`. Generic
worship grants the gift on its 82nd visit. Script 25 separately owns opening
message 3 and tutorial message 66; the reward callbacks do not create them.

## Selection, status, and Shield

Model 20 dispatches effect 87 to state `0x48`; neighboring `00515180` is
Teleport, not Bloodlust. `00515e30` scans the exact 3×3 terrain-cell square
around the target and chooses at most six same-tribe people accepted by
`00515650`: models 2–6 only, excluding ghosts, hypnotised people, and existing
Bloodlust. Distance is toroidal; equal distances retain reversed cell-chain
discovery order because insertion uses strict `<`.

`00515690` sets `flags3 0x80000` and timer byte 180. The timer decrements every
eighth person visit and expires after nominally 1,440 turns (120 seconds).
Shield independently uses `flags3 0x8000` and its own timer through
`005156b0`/`005156f0`; both statuses coexist as `0x88000`.

## Consumers

- Melee and Firewarrior projectile damage from a Bloodlust source are multiplied
  by three. Firewarrior paired-shot cooldown is divided by eight.
- Accepted person damage is shifted right three. Shield blocks mode-0 damage,
  but not mode-1 melee; Bloodlust reduction still applies when both are active.
- Shared native movement initializers double newly selected speed while the
  Bloodlust flag is active. The browser already routes those paths through
  `randomPersonSpeed`.
- Native rendering keeps a ten-frame HFX overlay and blinks it when the timer is
  below 16. The browser uses a lightweight red aura with the same expiry blink;
  original HFX artwork remains unported.

AI-owned followers use the same consumers. A distinct AI policy for casting
Bloodlust was not established.

## Probe and limits

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission16-bloodlust.py \
  work/orchestration/ceo-release/native-run/d3dpoptb.exe
```

The probe executes Mission topology, descriptor/dispatch, eligibility,
selection, application, Shield coexistence, damage, melee, and expiry checks.
The expiry driver intercepts unrelated AI, motion, presentation, and cleanup
callees; it proves the timer epilogue rather than a complete native world.
Reviewed exports are `00515650`, `00515690`, `005156b0`, `005156f0`, and
`00515e30`. Existing Firewarrior, damage, descriptor, rendering, and worship
exports are reused without duplication.
