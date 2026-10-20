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
clicks, requires all five original occupants (including the Shaman) while aboard plus
every independently expected ordinary acquisition, and checks the complete
independent on-foot set after unload. Public pause
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

A realistic compact fixture alone did not prove the unchanged 12KB log bound:
review found admitted wide HP/turn/time numbers could overflow it. The compact
checkpoint and provenance fields now use fixed-length, explicitly decoded tuples
while retaining every exact numeric/hash value and all previous equality checks.
Raw artifacts remain readable named-field JSON. Regression cases pass through the
actual producer, trusted decoder and serializer with all 39 source hashes, nine
profile cases, both M10 phases, wide finite numbers, long identity fields and PID.
Missing, reordered or wrong-length tuples fail admission; the cap is unchanged.

Hosted budget fit and real rendered execution remain unverified. Review must
precede activation; a timeout or missing rendered evidence blocks acceptance
rather than authorizing a larger cap.

The first hosted adapter attempt, [run 39312991346](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39312991346),
passed the nine existing recovery cases but stopped before rally/boarding. The
production ground observer passed an arrow-function **string** to Playwright
1.63; strings are evaluated but not invoked, so its by-value result was undefined.
The repair passes a real self-contained function containing the same source-owned
geometry and checkpoint helpers. Target remains a serialized argument, and both
observations still occur in one synchronous browser task before detached Node
command validation. A Node VM regression executes the installed Playwright
evaluator and serializers: it reproduces the original TypeError, then verifies
the repaired production boundary, typed-array/Map transport, unchanged live World,
strict ownership/aim/context guards and abort admission. This is not a rendered
pass, and the failed run provides no boarding, crew-selection or Save/Load proof.

## Exact ordinary-selection witness repair

The second hosted attempt, [run 39327787899](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39327787899),
reached genuine authored boarding. Warrior single/Ctrl/Shift and Total single
selected the five occupants. Total Ctrl selected the crew plus 116, 118, 120 and
122; the harness incorrectly demanded the crew alone. Authored M10 initialization
identifies 116/118 as Blue Preachers and 120/122 as Blue Braves. The failed raw
report did not capture their live pre-action positions, flags or ownership, so it
remains a failure, not a retrospective product or rendered pass.

The original `0x72` loop acquires **five primaries**, not five total recipients.
Crew propagation occurs inside each iteration. The independent oracle follows
that contract, using the retained nearest/priority selector `00451720` (SHA-256
`775d3e6063c243d7c8393293a66eff04d2c59567aecce2ed340603ad07a2d6b9`),
global fallback `004518c0` (SHA-256
`d0036de2fc3fe47ab0fb4b1fd269dd28f2141f0ddd473cdabcb0c9d537c19efc`)
and availability predicate `004e3430` (SHA-256
`e573cc86a20df47f99eabc8fb5942ac85f755766ce78557b24a703346ea9ecb2`).
It does not call `selectFollowers`, `selectHudPeople` or any production mutator.
Assignment priority, strict nearby bounds, truncated wrapped distance, stable
roster ties, class/Shaman fallback, availability and each immediate crew closure
are preserved. Total Shift also includes all other eligible classes; unloaded
Total Ctrl is not artificially restricted to the original party.

Before and after every actual control, a synchronous read-only browser function
captures the complete ordered roster, class/team/health, active controller facts,
craft ownership/slots, selection and camera. It serializes the existing read-only
controller readers rather than importing development modules in the production
page. Native XY fallback does not invoke terrain synchronization. Public input,
Escape, all three modifiers, pause, orders, RNG and existing party/craft guards
remain unchanged. The paused query and all non-selection controller/ownership
facts must remain stable. The bounded scenario requires all fourteen authored
Blue followers in their original order/classes and fails on loss, conversion,
new arrivals, unknown crew or a changed camera/query rather than silently
omitting a person. Full other-tribe records remain in the raw evidence.

The exact set computed from that pre-action roster is required in both the
scenario and trusted admission. A missing legitimate extra, foreign extra,
missing Shaman or subset-only result fails. Raw reports retain each primary
acquisition sequence. Portable tests cover the extra Preacher/Brave acquisition,
all six occupied/unloaded controls, native filter/priority/wrap/tie cases,
serialized real observer with authored M10 identities, no live mutation, and
strict roster/ownership tamper rejection. Supplied occupied fixtures support
these tests; they are not natural boarding or fresh-browser evidence.

To retain the existing 12,000-byte envelope, exact bounded query integers use a
canonical fixed-width encoding; control names/modifiers use fixed checked codes.
Repeated source/runtime and saved-checkpoint values use explicit references only
after exact equality checks against the raw values. No raw number/hash is
rounded or removed from retained reports. All 42 input hashes, all nine original
cases, all 18 control checks, both processes, checkpoint boundaries, cleanup,
manifest and screenshots remain required. The widest tested numeric, identity,
PID, manifest and native-camera representation is 11,918 bytes. This is synthetic
contract evidence, not rendered timing. The 180,000 ms browser cap and workflow
are unchanged. New exact-source rendered acceptance remains pending.

The focused existing HUD/class/task/transport checks remain required. The planner
also routes native and browser gates; those were not executed in this restricted
worker. The parent owns the standard exact-head check/build and hosted rendered
acceptance. No UI artwork, layout, generated fixtures, original mechanics tables,
parity ledger, natural crew acquisition or full issue #60 completion is claimed.

### Escape-history witness correction (2026-10-19)

Hosted Profile run 39340173546 at `c9a31b9b` failed before the boarded
Total+Shift click, after Total+Ctrl correctly selected the five occupants plus
Blue IDs 116, 118, 120 and 122. At paused turn 385, the next ordinary Escape
changed those four native selection bytes from 128 to 1. The initial strip
snapshot had byte 0, so comparing every clear to that initial baseline rejected
legitimate previous-selection history. All 56 captured people otherwise match the
exact adjacent cancellation transition. The retained native `00435c10` and caller
`00444f60` copy selection bit 7 to bit 0 before clearing selection; the shipped
`cancelInteraction` body is unchanged from the accepted main base.

The witness now compares each Escape with the immediately preceding selected
observation. Its independent transition oracle normalizes selection from the
observed selected IDs, validates exact history/work-flag cleanup for retained Blue
owners, and preserves all other fields and tribes. Empty-selection Escape leaves
owner flags untouched. Canonical role aliases are captured by actual object
identity, so a route record changes only when it shares a retained owner, not
because two records have equal values. Ordinary selection still preserves bit 0
exactly; it is not globally masked. Producer and trusted raw-artifact replay use
the same reviewed transition contract while retaining independent class/Total
selection computation, all 18 controls, world/order/RNG equality, and the existing
artifact, profile, cleanup and deadline bounds.

This is a witness repair, not a gameplay change or a retroactive hosted pass.
The failed run's original nine Profile cases and first five M10 control inputs
passed, but its M10 phase, fresh-process Save/Load, unloaded controls and complete
180-second fit remain unproved. Raw failure artifacts are retained unchanged.

## Current capacity-main integration

The reviewed Escape-history repair is preserved on current main `322499f3`,
which ships scalable worlds and version-2 public saves. The existing M10 Load
subscription now labels its captured current envelope as version 2, and trusted
M10 admission requires version 2 for both the committed Save and public Load
observations. Obsolete version 1 and unknown versions remain rejected. This is
not a compatibility conversion. The compact receipt and artifact-manifest format
versions remain 1; those are independent evidence schemas.

The serialized ground evaluator, full selection oracle, and adjacent Escape
history fixtures now construct explicit scalable Mission 10 worlds. No gameplay,
public input, selection obligation, archive/receipt cap, browser deadline, or
workflow is relaxed. The earlier hosted failures remain failures on their original
heads. Fresh integrated focused checks and exact hosted full/browser acceptance
are required; complete M10 runtime within the unchanged 180-second cap is still
unproved.

## Atomic observation transport after the current-main deadline failure

Hosted browser run `39344305071`, attempt 1, on `ec6e4081` retained a failed
Profile result with `browserTimedOut: true` at the unchanged 180,000 ms bound.
All nine original recovery cases passed. Created M10 took 58.612 seconds; reused
M10 took 46.529 seconds before abort. The version-2 Save and Load full checkpoint
hashes matched. Independent raw replay validates six boarded, six loaded and five
unloaded controls, with exact ownership, aliases, history, orders, RNG and complete
selection sets. The final unloaded Shift click has no post-observation. It is not
passing evidence, even though the preceding seventeen observations are valid.

Each paused strip snapshot previously made two separate browser evaluations: the
world facts, then the complete selection/owner view. The source-owned callback now
captures both synchronously in one evaluation. All fields, public inputs, guard
checks, screenshots and independent validation remain; no receipt/archive or time
bound changes. This removes 39 browser round trips across the three complete
13-observation strips. That is a structural count, not measured time savings or
proof that the complete route now fits. The regression uses the installed
Playwright evaluator/serializers in a Node VM, verifies one synchronous call,
exact fields and actual owner aliases, rejects missing/inconsistent/unpaused views,
and verifies that capture does not mutate the live World. No local browser is run.

The next coherent union includes main `50541d92`, whose current route-capacity
store envelope is version 3. M10 Save/Load admission and synthetic tuples therefore
require version 3 and explicitly reject obsolete versions 1 and 2 and unknown 4.
The main-owned Load observer label is preserved. The failed `ec6e4081` hosted
observations above remain version-2 evidence on their original source; they are
not relabeled as a successful current-version run. Evidence schema versions,
all eighteen control obligations and all existing caps remain unchanged.
