# Mission 17 Armageddon native findings

Scope: Mission 17 acquisition and the model-18/effect-86 arena controller in the
SHA-256 `3a5065c7…dfbe4f` desktop executable. The registered Ghidra exports are
evidence, not recovered source.

## Acquisition and cast

Authored trigger 440 (class 6/model 6, owner 0) links one-based object 443.
Object 442 is class 6/model 2, owner 255 at world `(3,117)` with payload
`[11,18,3,1]`. The generic reward completes after 82 visits. Model 18 has mode
2, cost 999999, flags 31, range 8192 (32 browser-world units), one normal shot,
rate 60, and primary effect 86. Ground and water targets are valid. A cast
spends the shot even if class-11/model-18 allocation fails.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission17-armageddon.py EXE
```

The check verifies executable/level hashes, authored linkage, reward delay and
stock cap, target results, descriptor fields, successful cast allocation, and
the failed-allocation stock result. Allocation, state leaves, and audio are
intercepted.

## Arena owner

`00477060` starts only with at least two active tribes and no existing result.
It snaps the center to the native 2x2-cell center, enables game-state bit 2,
sets level flags `0x02500000`, acquires modal input, assigns active tribes
directions in ascending order, prunes the world, rebuilds bounded rosters, and
starts effect 86's controller `004772e0`.

The roster contains one Shaman plus Brave, Warrior, Preacher, Spy, and
Firewarrior counts. When the largest tribe has at least 121 people, every
positive class count is scaled by `floor(0x78000 / largest) / 4096`, with a
minimum of one. Rank zero is the Shaman; positive ranks are Warrior, Brave,
Preacher, Spy, then Firewarrior. Existing `004783a0` and `00478820` exports
establish the formation and boundary helpers.

Controller timing is:

- terrain countdown 128; the exact 24×24 height table interpolates during the
  final 64 visits;
- staging gate 24, then state-39 batches every fourth turn;
- settle delay 100;
- central battle-order delay 38, then ordinary combat orders;
- a recurring RNG interval of 32–63 turns for battle/Shaman activity.

Generic `00418e30` remains the result owner: player population zero sets defeat
`0x04000000`; player alive with every enemy eliminated sets victory
`0x02000000`. `00477780` clears special mode/flags, releases state 39, restores
input/view ownership, and deletes the center effect. Checkpoints therefore need
the controller phase/timers, direction and staging arrays, terrain, participants
and their live combat state, RNG/turn, special flags, stock, and result state.

## Port boundary

`app/armageddon.ts` owns the missing live effect controller while reusing
`special-battle.ts`, existing native terrain queues, ordinary melee, generic
outcomes, and structured-clone checkpoints. Exact Shaman automatic spell
selection, camera interpolation, and original HFX/audio presentation remain
open. The unresolved state-31 byte at person offset `+0x85` was not invented.

Registered supporting exports: `00477060`, `004772e0`, `00477780`, `00477890`,
`00477b90`, `00477d50`, `004780e0`, `004781d0`, `004782d0`, `00478500`,
`00478610`, `00478860`, `00478990`, `004af0a0`, and `004d9420`.
