# Mission 21: second fault lifecycle

The shipped Mission 21 initialization and tribe-1 campaign scheduler now retain
`cpscr040.dat` words 957–1050, following the existing first-fault projection.
This is the second authored timed hazard, not complete Mission 21 acceptance.
The third fault (words 1051 onward), warning scenery consumers, and full original
world execution remain outside this change.

## Original evidence

`check-native-mission21-second-fault.py` pins the executable through `native_cpu`
and pins the original script, level and header. It executes native VM 0048c6b0,
the original EVERY-31 wrapper, second-fault words, and native GET_HEIGHT command
1085. Baseline variable 15 and terrain heights are supplied. Other commands are
observed at dispatcher 0048cc60 and skipped with their correct argument arity;
this probe does not execute those commands or prove original full-world behavior.
It reports executable/input/probe hashes, Python/Unicorn versions and these limits.

Marker 45 is packed 0xbe3a, with original signed height 399. At tribe-1 samples,
unchanged height first forces warning markers 46–48 at turn 2271. If still
unchanged, turn 3711 forces marker 45 and posts the positioned eruption warning
(payload 16668). Turn 3743 closes that fault's state. Height 398 or 400 instead
sets variable 23 to 2 and requests cleanup, including after the initial warning.
The 11-case native probe confirms those boundaries without consuming RNG.

`check-native-mission21.py` additionally executes the existing native linked
activation path for trigger 43, whose authored consumer is class-7/model-15
record 44. Initialization admits this controller alongside first-fault trigger
68, reusing the existing Volcano consumer. It does not add invented scenery or
change Volcano terrain/damage logic.

## Playable route and verification boundaries

The regression starts Mission 21 through the game store. Ordinary Convert
creates six Braves; three worship the first Flatten totem and three build a Hut.
Focusing earned Land Bridge mana, moving the Shaman to (40,80), and casting at
(52,58) changes marker 45 before the second deadline. No supplied mana, spells,
entities, terrain edits or clock jumps make that route possible. A second test
leaves the fault unsealed and checks scheduling, warning payload, one Volcano,
its 160-turn lifetime and no replay. Both use session Save/Load and compare full
world continuation. These are CPU model/control-path tests, not browser inputs,
IndexedDB persistence, rendered evidence or original whole-world parity.

An initial test incorrectly cloned directly into `migrateCheckpoint`, omitting
the real Save-side secondary-list rebuild. Its full-world mismatch was retained
as a failed receipt, not fixed by excluding fields. The corrected test uses the
shipping store Save/Load boundary. The initial eruption test also expected a
160-turn Volcano to remain active after its natural expiry; the replacement
checks effect identity throughout the lifetime and absence after expiry.

Required Full, build and rendered natural-route qualification remain pending.
