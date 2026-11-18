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
`004f5ed0` calls model-availability leaf `00408dd0`. The original M8 Hut
availability gap is now closed by the bounded original-executable probe below.
Whole producer/native queue/RNG equivalence is still not certified; that narrower
availability result does not turn this into full Mission8 acceptance.

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
full original-game execution, natural victory, whole Mission8 AI and hardware
performance are not run/claimed. This change does not modify parity status.


## Original Hut availability follow-up

The official base-game archive was recovered as data only and verified against
SHA256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
`d3dpoptb.exe` matches the repository-pinned SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No installer or Windows process was launched. The adjacent `levl2008.hdr` matches
`0d63ff5313d1e97b4a4d498ca68ef627a3318a749b0b0b947543c50a4d0a25c3`.

`scripts/check-native-mission8-availability.py` runs with Unicorn 2.1.4. It supplies
that verified 616-byte header at the file-reader return boundary `0089b741`, then
executes the actual post-load `004855dc..0048564d` instructions, including native
per-enemy header copies and `00492be0` script-record initialization. It executes
`00485e60` to copy those prepared enemy records into live knowledge. The enemy
copy is controlled by the actual header's two-tribe count; the supplied human
profile index 7 does not choose Dakini's knowledge.

For tribe1, `00408dd0` reads three building masks at `0096070e + 56`, `+4` and `+8`.
The resulting original masks are `fffe10b3`, `0`, `0`. It returns **1** for model1
both before and after execution of the **complete original turn-zero cpscr016**
through `0048c6b0`. The original script also leaves construction state enabled
and flag `0x400` set. No native leaves are intercepted, no instructions patched,
and no successful availability result is supplied.

A separate controlled truth table runs 1,024 native leaf calls: all32 x86 shift
positions, four tribe strides, and eight combinations of the three masks. Native
results are0 for absent,1 for primary,2 for secondary, and3 when the tertiary bit
is present. The tertiary result takes priority. These supplied-mask cases are
leaf diagnostics, not additional authored gameplay episodes.

Reproduce from the checkout with the pinned oracle Python:

```sh
python scripts/check-native-mission8-availability.py /path/to/game/d3dpoptb.exe
```

The JSON receipt includes executable/input/probe identities and the supplied
boundary. Native scope is deliberately bounded: the OS file-reader, actor loader,
whole housing producer, full queue/RNG trajectory, graphics and natural victory
are not executed or claimed. This follow-up changes no runtime behavior, imported
assets, generated exports, parity status or expected pixels. It resolves the
specific previously missing M8 Hut-availability prerequisite, not the remaining
full/build/rendered acceptance gates.
