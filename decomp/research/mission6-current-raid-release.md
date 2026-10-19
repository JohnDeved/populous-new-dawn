# Current-command Mission6 failed-raid release

`tests/mission6-controlled-raid-release.test.mjs` starts a fresh shipping Mission6
world, then supplies one explicitly controlled `requestAttack` input toward the
real disconnected Blue island. It is not an authored ATTACK journey or an
original-runtime measurement. Ordinary initialization already enables attacks;
the actual dispatcher selects four Braves and the Shaman from the living roster.
No actor, HP, population, terrain, timer or RNG state is injected or frozen.

The request carries explicit `stagingMarker=-1`, `spellMarker=-1` and empty spell
slots. `requestAttack` always initializes both fields in current tasks. The test
captures admitted identities BEFORE phase9 publishes its shared movement order,
then requires those same registered owners, exact reference counts, natural
state33 release, unchanged health, zero final references and exact current public
Save/Load twins. Native settlement/release fixtures remain unchanged.

This replaces the former compatibility scenario that deleted both marker fields
from a naturally produced Matak task and saved that fabricated legacy shape.
Current Matak requests actually forward staging marker0, spell marker16 and
spells12/3/2. That deleted-field shape is not current producer output. The old
failed trace remains in the source-bound review evidence, not as an old-save
support requirement. The separate ordinary marker/Bridge journey retains that
current Matak behavior; isolated refused-spell/settlement fixtures retain their
specific native counters and spell-payload checks.

A separate existing limitation is not repaired here: the campaign adapter accepts
Chumara's authored options `[0,7,-1,-1]`, but forwards marker options only for the
Matak branch. Its explicit -1 current tasks do not prove original Chumara marker7
parity. This controlled release test neither relies on that omission as an
authored contract nor silently changes campaign production.

The145-turn post-cleanup tail must not resurrect the retired raid order: every
retained person queue excludes its ID, its references stay zero, and complete
checkpoint twins, Unit identity and HP remain equal. Strict native/registered
ownership and no current order are required at phase23 and immediately after task
inactivity. Later ordinary construction may transfer the SAME person to
`builder.person` through `adoptLiveOrders`/`processBuilderWork`; its genuine new
command6/building target is checked, not mistaken for a stranded raid. The actual
caller adopts the builder owner and clears native before processBuilderWork;
its conditional registry deletion is not entered. Registry identity therefore
remains strict for every tail owner, including the replay. The isolated callee's
deletion branch is not used to admit unobserved missing-owner cases.
