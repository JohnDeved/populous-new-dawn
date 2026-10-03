# Original world selector: bounded first-three-mission slice

Issue #17. Base `5599760904c90adc8c4cc397bb11c9ee8b65b936`.
This is unfinished implementation evidence, not full original frontend acceptance.

## Authored bodies and native consumers

The hash-verified original executable
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
loads `data/plsdata.dat` in `00411790`, decodes it with `0049cf40`, and reads
seven fields per non-comment row: body index, radius, parent index, orbit radius,
start angle, angular velocity, and mission number. The decoder complements each
byte after XOR with `1 << ((offset - 3) & 7)`.

The supplied layout SHA-256 is
`5fcb40325e64694860c88db1ea91cd33ddfd2bff88cd8b9b859ad78a6b66fbb9`.
`app/world-selector-data.ts` retains all 25 rows. `004125a0` recursively places
each child relative to its parent using cosine/sine of its orbit angle. Missions
1, 2 and 3 are bodies 24, 23 and 22: all children of body 20 (Mission 5), with
radii 150, 110 and 70 and opening angle 90 degrees. Mission 4 is the innermost
moon at radius 35. Body 20 orbits the sun at radius 1400, opening angle 270.
These relationships are original authored data; any flat browser projection is
a modern presentation adaptation, not proof of the original perspective camera.

`00410fd0` initializes the selector at 640x480, registers input callbacks
`004112c0`/`00411500`, loads the bodies, and selects the current mission assets.
The keyboard callback wraps left/right through mission numbers 1–25, accepting
only `0047ed20`-eligible levels. Return enters `0047e500`; Escape returns through
`0042cde0` when not already transitioning. Full OS/input/session startup was not run.

## Progress and compatibility boundary

`0047ed20` accepts profile flags masked by 5. `0047ed40` calls `00485e40` with
mission minus one; the latter returns 3 when the completion bit is set, otherwise 0.
`00412960`'s normal-entry branch finds the first uncompleted mission and marks it
available. Its victorious sequential branch for Missions 1–15 scans forward to the
next incomplete mission through 16. Later missions branch in groups; they are
explicitly outside this first-three implementation, and must not be replaced with
a guessed global linear campaign rule.

The browser adapter reads the existing completed-mission profile. Missions 1–3
are available when first, completed, or immediately preceded by a completed world.
A separate direct-access view preserves existing playable missions. Direct access
is a compatibility feature and is not native unlock fidelity. No changes to the
profile store, campaign runtime, victory producer, or saved format belong here.

## Asset evidence and remaining boundary

`00411790` loads `data/plsspace.spr`. `0041fb20` loads the 640x480 indexed
`data/plsbackg.dat`; decoded inspection shows a gold stone background, so it is
not a substitute for invented star-field artwork. `0047e3e0` loads `plspanel.spr`
and anchors its panel at the bottom centre. `00412780` loads `plstx%03d.dat`,
`plspl0-%c.dat`, `plsft0-%c.dat`, and `plscv0-%c.dat`. The palette bank comes
from header byte 96 via `004852f0`; Missions 1–3 use c/s/p (12/28/25).
Raw texture decoding is not proof of the original sphere UV mapping, lighting,
selected-body highlight, background compositing, or dynamic orbital presentation.
Those limits must remain explicit in any rendered acceptance.

## Reproduction and current verification

Run `python3 scripts/check-static-world-selector.py /path/to/d3dpoptb.exe` with
adjacent original data. This checks pinned executable identity, resource consumers,
and exact checked-in body data against the decoded original file, without running
the executable. `node --test tests/world-selector.test.mjs` checks the opening
positions and isolated first-three availability adapter. Neither test proves live
campaign completion, reload, keyboard/pointer flow or original visual parity.

Scoped Ghidra 12.1.3 exports were made in a separate ignored task project from
verified original section bytes. The useful entry points are named above; one
exploratory `004121d0` export landed inside `00411790` and is excluded from evidence.
No installer, Wine, original process, Actions, parity recording, shared art
regeneration, or original binary publication was used.

## Delivered first-three UI and verification boundary

The dedicated selector is reachable at startup and through Select Level during a
mission or at its result screen. Back returns to the existing paused world/menu;
merely opening the selector does not replace it. Actual mission launch uses the
existing `startMission` entry, and Continue on the victory screen remains intact.
The modern campaign view enforces the bounded opening availability adapter. The
explicit All missions tab preserves all 23 existing direct-access worlds.

The flat opening-orbit map, responsive HTML buttons, and CSS circular texture
preview are modern adaptations. The map shows native parent/radius/opening-angle
relationships, but does not reproduce the original perspective camera, orbital
motion, sphere UVs or shading. The original three texture maps are decoded by
`scripts/import-world-selector.py`, with exact header/palette/texture/output hashes
in `public/original/world-selector/provenance.json`. No background or star artwork
was guessed or substituted.

On clean `d52e7f9aa73833b1edce7d0a0cd6d1b32a04b028`, sandboxed local Headless Shell
154.0.8037.92 with SwiftShader passed the first focused acceptance: initial locked
world state, pointer Mission 1 launch, responsive no-overflow checks, return/Back
without advancing or replacing the paused world, and a fresh-session persisted
completion fixture showing replay/next-world state. This is not a natural campaign
victory proof. Typecheck, native static/layout checks, focused portable tests, and
production build passed. The initial aggregate and one authorized retry were
interrupted by automatic review cancellation and are not counted as passes.

Review identified legacy browser checks with independent direct-Mission button
selectors. Their setup now explicitly opens All missions through one shared public
UI helper. Campaign selection checks continue through Select Mission and Start;
checkpoint completion/replay assertions were updated to that real flow instead of
silently bypassing campaign availability. Final browser receipts accompany the PR.
