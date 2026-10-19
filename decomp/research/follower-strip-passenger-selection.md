# Persistent follower-strip passenger selection

Bounded issue #60 correction on base
`55770f1a03478883e8d0b00a1fd518e222782c3b`.

## Demonstrated gap

The mounted persistent Total/class controls call `page.tsx::followerControl` →
`GameScene.chooseFollowers` → `scene-input-runtime.ts::chooseFollowers` →
`selection-runtime.ts::selectFollowers`. The lower task and transport rows already
propagate selection through an occupied craft; the persistent strip did not.

The new supporting regression on the unmodified base selected only the Brave
(ID 122), not the boarded Warrior (ID 123). A second regression showed that
`hudPeople` read a dormant native idle record instead of the actual boarded route
owner and its seat coordinates. Both used the existing live boarding adapter with
supplied people; neither is evidence of natural campaign boarding/acquisition.

## Reused original evidence

The retained, indexed `decomp/generated/0043e8e0.c` command dispatcher has SHA-256
`39b7c6e645760a599abecb4e44861da69ebc08c3d3370dff0c3835934e9fd309`.
Its cases `0x48` (Total Shift), `0x53` (class Shift), `0x72` (Ctrl/five), and
`0x7d` (single, including the separate Shaman branch) explicitly:

1. acquire a matching person using their existing filters;
2. mark that person selected;
3. resolve its attached vehicle, require a valid occupied craft, and traverse its
   capacity-bounded passenger slots;
4. call `004458d0` for each other valid passenger without reapplying the primary
   class, tribe, distance or reservation filter.

The traversal is inside each Ctrl iteration, before the next nearest-person
search. Thus selecting one Brave aboard a mixed crew immediately selects its
companions; a later iteration skips already-selected matching passengers. The
person-command traversal is not the same as the transport-row acquisition helper
`004e31f0`, which has its own passenger-block check.

The retained `decomp/generated/004458d0.c` SHA-256 is
`15bd59b5d0ece1a91912ee1c0826155780235c68dd34745127e8d7c6861c7dac`.
It owns the existing selected-bit/work-flag changes. Both export hashes match
`decomp/exports.json`; the indexed original executable identity is SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
These are retained Ghidra pseudocode exports, not recovered original source.
No new executable or native-probe run was performed for this slice.

The existing `tests/fixtures/hud-selection.json` remains unchanged and covers the
on-foot commands. Its original generator does not install occupied vehicles, so
passing that matrix alone could not detect this omission.

## Bounded implementation

`selectHudPeople` accepts a marking callback, as the lower task helper already
does. Its default stays byte-compatible with the retained on-foot fixtures.
The persistent runtime calls the callback for every acquired person and immediately
marks the live occupied crew. Only Blue people are acquisition candidates; foreign
people are touched only if they are in the selected craft. Selecting such a crew
does not claim or change craft ownership. Existing selected recipients remain
selected and command orders, RNG and movement state are untouched.

`hud-person-source.ts` extracts the existing task reader's controller precedence.
The persistent reader uses it only to resolve an occupied owner/seat; non-occupied
persistent fallback behavior is preserved. The lower task reader keeps the same
source precedence and classification. No simulation owner is created or adopted
by a HUD read, and dormant native records are not rewritten by route-owned
passenger selection.

## Checks and limits

`tests/hud-passenger-selection.test.mjs` covers both Boat/Balloon models, mixed
classes, single/Ctrl/Shift/Total and unmounted model-7 helper cases, immediate propagation during repeated
nearest search, empty/enemy recipients, the distinct crew reservation rule,
read-only focus/seat positioning, voluntary departure and checkpoint restoration.
It also executes the mounted Total/class Page pointer/keyboard controls and Scene
method from their actual JSX with supplied DOM/camera/panel leaves, including Ctrl dispatch-once and
focus feedback. Model-7 helper cases do not establish a mounted Shaman control:
the Page portrait instead calls `select(world, 'shaman')` → `setSelection` and
focuses the Shaman directly. That separate path is unchanged and a dedicated
mounted-portrait regression preserves it. Its distinct original selection/focus
semantics remain a separate #60 gap. The earlier combined Shaman Page-path claim
was incorrect; no mounted `followerControl(7)` exists.
These are portable integration fixtures, not rendered-browser evidence.

The existing `scripts/local-render/mission10-boat-checkpoint.mjs` now checks the
mounted Total/class controls after its real authored boarding, after public Load,
and after ordinary unload. It clears selection with Escape before single/Ctrl/Shift
clicks, requires all five original occupants (including the Shaman) while aboard,
and checks restored independent on-foot selection after unload. Public pause
isolates order/RNG/crew preservation from normal simulation advancement. This
scenario is NOT RUN for this PR until its supported hosted route executes both
phases; a generic Mission 2 browser pass does not establish these assertions.

`scripts/tutorial-browser/mission10-profile.mjs` adds that route after, not instead
of, the existing nine `profile-recovery` cases. Both task-owned persistent Chrome
processes share the existing 180000 ms browser deadline. It uses the reviewed
owned-profile lease, a new private task-only directory, identical source/runtime
bindings, public Save, complete committed-checkpoint readback, confirmed browser
termination, fresh-process public Load, and same-shore unload. Unknown cleanup or
provenance retains the profile lock and fails admission. No existing personal
profile or checkpoint is adopted or seeded. The original nine cases still make
only their original fresh-page-reload claims.

The hosted input adapter computes the original minimap inverse and native Boat
coordinates with the imported source helpers in Node. It verifies current DOM
ownership before real mouse input and preserves the original strict 0.35 rally
aim tolerance. Ground-command preflight receives a detached, typed-array/Map-safe
observation through the existing checkpoint codec, never the live World. The old
local route remains available through its default helpers. No production game
code, source-serving workaround, world/HP/RNG write, workflow, job, browser cap or
receipt-size limit is introduced by this adapter.

The compact profile receipt now requires both M10 phases, their source/runtime
and profile continuity, public route actions, all 18 Total/class selection
checks, checkpoint boundaries, cleanup and four hashed screenshots. Full raw
reports remain separate. Negative tests reject missing phases, wrong binding,
unfinished cleanup, omitted Shaman propagation, missing Escape, altered modifiers
and invalid unloaded membership. Compact tuples preserve the existing 12KB log
bound; they do not replace the readable raw observations.

The original adapter review found that the existing workflow uploads only
top-level JSON/log/PNG (plus snapshot JSON), not the two nested M10 phase
directories. The retention repair keeps that workflow unchanged: a finally-stage
helper exclusively copies every regular phase JSON/log/PNG to deterministic
top-level names and writes `mission10-artifacts.json`. Its manifest binds original
and retained path, SHA-256 and byte size; compact receipt and raw summary paths
name the retained copies. All 12 expected successful-route artifacts are required.
Failed/incomplete routes retain available diagnostics with truthful incomplete
status. Unknown entries, symlinks, collisions, missing success artifacts and
changed bytes fail closed; the private browser profile is never enumerated.
Tests reconcile emitted paths with the actual parsed workflow upload globs.

Hosted budget fit and real rendered execution remain unverified. Review must
precede activation; a timeout or missing rendered evidence blocks acceptance
rather than authorizing a larger cap.

The focused existing HUD/class/task/transport checks remain required. The planner
also routes native and browser gates; those were not executed in this restricted
worker. The parent owns the standard exact-head check/build and hosted rendered
acceptance. No UI artwork, layout, generated fixtures, original mechanics tables,
parity ledger, natural crew acquisition or full issue #60 completion is claimed.
