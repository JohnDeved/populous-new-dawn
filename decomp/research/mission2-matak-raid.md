# Mission 2 Matak raid

The supplied `d3dpoptb.exe` (`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`)
and adjacent `levels/cpscr074.dat`
(`03931ad1bc69860177c0a0d7d850db46b268683bf95b274926e18fe1f8a5d9db`)
were exercised with `scripts/check-native-mission2-matak-raid.py`.

## Proven behavior

- Native internal `1213` returns `7`, the Warrior Training Hut model.
- Internal `1180` fixes Blue as the attacker and indexes the current script
  tribe as victim. In Mission 2 it reads Blue-on-Matak kill credit.
- Mission 2's first `ATTACK` requests two tribe-3 attackers against tribe 0,
  preferring model 7, with damage limit 10. The later request has the same
  target shape and requests four attackers.
- Target selection first asks for the requested Blue building model. If it is
  absent, native falls back to any Blue building and then a Blue person.
- The type-20 task stores target tribe 0. Phase 15 dispatch, phase 16 target
  filtering, and phase 17 reacquisition continue to use that stored tribe.

The probe executes the original internal reader, script interpreter, allocator,
and phase-17 task mutation. Eligibility, selected objects, coordinates,
acknowledgement, movement, and other bounded world leaves are supplied. It is
not a complete Windows mission playthrough, selector-RNG comparison, pathfinding,
combat, or browser-integration proof.

## Reproduce

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission2-matak-raid.py /path/to/d3dpoptb.exe
```

The executable must have the adjacent Mission 2 `levels/cpscr074.dat` data.
