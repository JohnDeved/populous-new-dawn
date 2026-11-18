# Mission 8 ordinary Dakini housing opening

Base: `e5b258422caecd6d050fe508b05259b8cbbd1757`. Imported cpscr016 SHA-256
`441938566197d62880c924e1b1108dfbef5b95e1ee096c21ef88e9240ee63b98`.
The original startup enables construction, sets concurrent construction target
attribute9=2 and housing target attribute10=10. School targets2/3/4 and vehicle
school targets35/36 are zero. Flag0x400 disables the ordinary Tower prefix.
The authored Red opening has six Braves, four Warriors and a Shaman, no buildings.
The previous live producer excluded Mission8, so this population never built homes.

## Retained native contract and scope

Reviewed exports `004e5580`, `004f5ed0`, `004627f0`, `004f67b0` and `004f5d20`
establish housing after the Tower/school branches, construction-state admission,
at least two idle/nonbusy/non-Shaman people, construction-count limit and
model1 request allocation. `004f6020` selects the retained loaded Shaman cell
until a Tower establishes a base. The original M8 Red position maps to0x18f6;
a moved, dead or missing live Shaman does not relocate it. A saved zero base
remains authoritative. Allocation consumes no RNG.

`004f6520` counts housing capacity from completed class2 owners plus class9
plans, excluding under-construction class2/state1. Reduced HP on a completed
Hut does not remove its capacity. Consequently after plan consumption an
unfinished Hut can allow another housing request. Pending task-only owners are
not incorrectly counted as completed housing. The existing concurrent task cap
continues to apply.

The new binding is only the Mission8 tribe1 housing tail. The 0x400 check is an
explicit bounded-adapter guard for this opening, **not** a native housing rule:
when Towers are enabled the native producer may eventually reach housing after
its earlier branches. Those branches, later scripted housing/specialist targets,
Firewarrior production, patrols and attacks are not newly enabled here.
`004f5ed0` calls model-availability leaf00408dd0. Its body/current original
executable is not available in this executor, so original M8 availability and
full producer/native queue/RNG equivalence are not newly certified. Existing
imported opening and current-port Hut construction are verified, not a fresh
original-executable run. This remains a Draft with that native acceptance gap.

## Functional evidence

`node --test tests/mission8-housing.test.mjs tests/mission4-construction.test.mjs
 tests/mission7-settlement.test.mjs tests/mission8-natural.test.mjs` passes51 tests.
M8's20 new tests cover startup, loaded/base origins, disabled/limit/full/worker/
cadence gates, bounded Tower-enabled exclusion, owned completed/plan/incomplete/
HP-damaged housing and exact target equality, and a natural900-turn episode.

The ordinary episode uses unmodified createWorld(8), advanceGame at1/12 second,
no injected actors, resources, orders, turns or player commands. A model1 request
exists at observed turn63, its actual plan at64. Two ordinary builders receive
order6; timber work advances construction and a Red Hut completes before900.
Three Red Hut owners exist at900 because unfinished class2 owners do not count
toward native housing capacity. The checkpoint is taken at64 and the complete
World is compared after restoration, every64 turns and at900. Clock animation
fields are resumed too. A Hut never fabricates a Tower base.

An initial natural test expected two Hut owners from an earlier diagnostic that
incorrectly counted unfinished capacity. After aligning counting with004f6520,
only that count assertion failed (three observed). The assertion was corrected
and supplemented with explicit capacity boundaries; checkpoint equality and
completion were not weakened.

Changed-file ESLint and oxfmt pass. Orchestration selection is retained with the
candidate receipts. Full check/build, rendered/browser persistent Save/Load,
original executable execution, natural victory, whole Mission8 AI and hardware
performance are not run/claimed. This change does not modify parity status.
