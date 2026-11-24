# Mission 13: ordinary Yellow settlement

Refs campaign release gate #8. Mission 13 started both enemy tribes with six
Braves and a Shaman but its ordinary construction producer was excluded by the
browser's mission admission list. A baseline simulation on main `d7e284c` retained
seven people, no construction tasks and no buildings for both tribes through
turn 3000. This change binds Yellow's first Tower and repeated housing only.
Green settlement, later scripted attacks, schools and Balloon production remain
outside this slice. It does not claim complete Mission 13 AI or victory parity.

## Original ownership

Header `levl2013.hdr` SHA256
`aebcd04cce2e61b5d1c275c725b6ca448c66d67b1a71f168231414609b2f75f9`
selects `cpscr030.dat` for Yellow, SHA256
`74226e5cc971c4d34898d6d464980726001694d2ed19734920a65971ed5ff10c`.
Its startup enables construction, four concurrent tasks and housing target18.
School targets are zero. The immutable Yellow Shaman origin is cell `0xb47a`;
the authored Tower coordinate latch is distinct (`0xac8a`).

`004e5580` reads `004f6020`: loaded origin until a base exists, then stored base,
including zero. Its Tower prefix respects flag0x400 and counted Towers/pending
Tower tasks. With that prefix satisfied, its zero school targets reach the
housing tail. `004f6520` counts capacity of completed buildings and class9 plans,
not unfinished building bodies. The minimum construction workforce comes from
`004f67b0`: idle available non-Shamans, not the training housing-order count.

The existing `004c6da0` consumer applies the Tower latch at phase0. Its phase3
establishes a base from the accepted ordinary Tower's exterior point, masks both
coordinates even and resets radius. Exact placement and existing bases do not
rewrite it. This change admits that existing phase3 only for Mission13 Yellow;
other missions retain their previous behavior. Subsequent construction uses the
stored base. No global construction-history/radius algorithm is newly enabled.

## Executable boundary evidence

`check-native-mission13-growth.py` executes the original header setup, script,
building availability, producer, capacity traversal and allocation against EXE
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Nine cases cover loaded/stored/zero origins, worker count0/1/2 and housing below,
at and below-with-an-unfinished-building capacity. The sole intercepted leaf is
available-worker count; linked Tower/Hut owners and stored origins are supplied
controlled fixtures. In particular, the probe supplies loaded cell0xb47a to AI
+0x5a2; it does not prove original actor loading. That cell is independently
derived from the imported Yellow Shaman position (115,67). The origin/worker
cases preserve authored target18; one
capacity case supplies target3. The probe is not original whole-game settlement
or build-timing evidence. The existing indexed `004c6da0` export supports phase3;
this new probe does not execute that consumer end to end.

## Browser-runtime scope

Only `level13 && tribe2` enters the added branch. It uses real idle native people,
existing terrain/site search, worker selection, timber acquisition, movement,
construction, home occupancy and births. No follower, building, stock or timing
is injected into the natural witness. The first bounded ordinary `tick` witness
completed one Tower and six Huts and grew Yellow from7 to18 by turn3000; the
unchanged Green tribe remained at7 with no buildings. This establishes playable
settlement impact, not native exact timing or rendered acceptance.

Controlled tests cover loaded/stored origin, capacity, idle-worker admission,
state/task/target gates and unchanged Green. A separate game-clock regression
requires actual construction in flight at session Save, complete-world Load and
periodic replay equality, completed Tower/six Huts and natural population growth.
Its receipt, rendered browser evidence, normal Full/build and independent review
must be reported separately; their existence is not implied by this document.
