# Live follower and Shaman healing (#94)

## Reused native evidence

`scripts/check-native-person-update.py` already compares recovered `updatePersonHealth` (`0x4d43a0`) against the canonical executable across 4,096 health cases. The issue94 repair does not rerun that broad checker.

Recovered caller order in `decomp/generated/004d32b0.c` calls `0x4d43a0` only when `personStateFlags[state] & 1` is clear. The helper itself excludes `flags2 & 0x80000`. Native healing then gates on person-model flag 8 and `turn & 7 == 0`.

The extracted rule table gives native-unit increments:
- Brave model 2: 4
- Warrior model 3: 6
- Preacher model 4: 4
- Spy model 5: 4
- Firewarrior model 6: 6
- Shaman model 7: 32

Browser HP uses native life / 20; existing `createLivePerson`, damage and physics adapters already synchronize `life = round(hp * 20)` and `hp = life / 20`.

## Live ownership gap

Before #94, `updatePersonHealth` had no live-game caller. Ordinary browser state branches can complete a full simulation turn without entering `stepLivePhysics`, so integrating healing only in physics would miss idle/resting/browser-owned followers. Conversely, calling the complete `updatePersonHealth` from `world-turn` would duplicate drowning/disruption/death/state-controller work.

The bounded repair therefore:
1. extracts only the already-proven regeneration tail as `regeneratePersonHealth`;
2. adds one `stepLivePersonHealth` adapter that starts from authoritative browser HP, preserves native `flags3`, applies state/airborne gates, and writes the result back to any live native record;
3. calls it once after the per-unit state-body loop and before fire trail, contact creation, vehicles and death cleanup.

This placement sees every surviving live unit once, does not heal dead units, and cannot double-heal through another live `updatePersonHealth` caller because none exists.

## Failure-first and focused acceptance

With only the new `stepLivePersonHealth(w)` world-turn call removed, `tests/healing.test.mjs` fails its ordinary follower/Shaman tick and schedule assertions: the injured Brave remains at 49 instead of reaching 49.2 on the eighth turn. Restoring the hook makes the focused suite pass.

The focused tests cover:
- exact recovered increments for models 2..7;
- off-cadence turns and repeated-tick no-double-heal behavior;
- state-bit, airborne, dead and full-life exclusions;
- Shield/Bloodlust and low-health flag preservation;
- unchanged simulation RNG;
- 30/60/120/144 Hz plus irregular render schedules and 0.5x/1x/2x simulation speed;
- pause behavior;
- checkpoint continuity at the next healing turn;
- an actual unit injured by the existing missing-building release path, then healed by ordinary simulation without assigning HP or calling the healing helper.

## Browser acceptance scope

The browser harness uses the shipped Mission 1 world and the existing missing-building release branch to apply its ordinary 10-HP injury through `tick`, without assigning Shaman HP or calling the healing helper. The scene RAF is cancelled before that deterministic tick, then transient native presentation ownership from the release fixture is dropped. Ordinary simulation advances to the next native healing cadence, the shipped HUD health meter is observed, and checkpoint load/replay must reproduce the same recovery.
