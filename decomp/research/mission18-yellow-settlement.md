# Mission 18 Yellow construction

Scope: the Chumara's authored first Tower, Boat House priority, and housing.
This does not bind Green construction, Red expansion, vehicle production,
school replacement, later attacks, or whole-mission victory.

## Failure-first and original evidence

On main `dfccf7df6605b3c3f69fe9980f24697ae01cc13a`, an ordinary 3000-turn
CPU episode leaves Yellow at seven people, no buildings and no construction
tasks. Red retains its authored settlement; Green also stays at seven without
buildings. The browser producer explicitly excludes Mission 18.

Original `levl2018.hdr` selects Yellow `cpscr020.dat` (SHA-256
`cb7803b0b6cf1ac408a7ac873fc7d7c85be11d7303caa439bc8d528491ce7f6a`).
Its opening enables construction with housing target 18, zero school targets,
and Boat House target 1. The immutable imported Yellow Shaman position
(-45, -127) corresponds to cell `0x76da`. The probe supplies this cell to
native AI +0x5a2; this is not native whole-world actor-loading proof.

The first probe correctly requested Tower model 4, then failed its mistaken
housing expectation: the original producer requested Boat House model 13.
That failure is retained. The corrected nine-case probe leaves all authored
targets intact: loaded origin requests 4, established and zero stored origins
request 13, fewer than two workers reject, and the housing capacity tail is
reached with a supplied completed Tower **and Boat House**. Five completed
Huts permit another at target18, six reject, and unfinished capacity does not
satisfy target3. No target was zeroed to manufacture housing admission.

`check-native-mission18-yellow-growth.py` executes original header/startup,
`004e5580` producer, availability/capacity traversal and allocation against
hash-pinned original EXE `3a5065c7…dfbe4f`. Only `004f67b0` available-worker
count is intercepted. Building owners, linked lists, stored origin and capacity
boundary targets are controlled fixtures, not natural original construction.

## Proposed live binding and acceptance

The existing native-backed construction consumer already supports model13 and
coastal site validation. The narrow producer admits only Mission18 tribe2,
retains loaded/stored origin (including zero), worker and concurrent-task guards,
and uses the original Tower → Boat House → housing priority. Tower phase3
establishes the ordinary construction base. Existing M13 behavior is preserved.

Qualification must demonstrate **actual shoreline Boat House completion and
subsequent housing/births**, not merely allocation of a model13 task. The focused
suite includes ordinary game-clock progression and a session checkpoint taken
during actual construction, followed by full-world continuation equality.
The first 17 focused tests passed, including full-world session continuation.
The ordinary 3000-turn candidate has a completed Tower and Boat House, three
completed Huts plus three unfinished/pending Huts, and 13 Yellow people; the
unchanged baseline has seven and no buildings. Green remains seven without
buildings. These are CPU gameplay results, not rendered acceptance or timing
equivalence with a complete original game. Production browser/persistent Save/Load,
standard full check/build, broader integration and original GUI parity remain
unverified. Do not infer a playable settlement solely from the native probe.

## Existing Red sermon regression

The additional existing M18 suite exposed a fixture coupling: it recognized the
replacement sermon only when the shared order allocator returned index42.
New Yellow construction instead makes the same Red actor430 own index49.
A logging-only copy of the original test retained its full-world replay and
assertions and observed the actual record at turns1478,1824,3600: model17,
coordinates(25728,640), one reference, sole owner430, old record3 released,
HP55, and preaching substate3 at1824. The original fixed-index failure and
an earlier short diagnostic timeout remain retained.

The fixture binds the actual replacement record, not literal49. It
requires a positive non3 physical index, the exact sermon payload, the sole
command/owner and same record/reference every subsequent turn. Original
commit1478, displacement, checkpoint equality, old-order release,
survival and kill-credit no-cancel assertions remain. This is allocation
provenance, not relaxed behavioral timing or a changed expected outcome.

The first semantic-ID repair run additionally exposed first preaching at1784,
not the historical1824. Snapshot observations at1824 did not establish first
onset. That failure was retained for causal trajectory/animation analysis before
changing any timing expectation.

Paired ordinary1900-turn traces explain the second difference: baseline speed60
reaches the native close threshold at1817 and starts preaching1824; candidate
speed68 reaches it1777 and starts1784. Both retain the same seven-tick opening
animation and goal. `randomPersonSpeed` in `person-state.ts` draws shared gameplay
RNG at state transitions; newly active construction also draws that RNG.
The final fixture therefore verifies actual native close coordinates, zero
arrival speed, timer7 and exact seven-tick transition, alongside deterministic
candidate onset1784. This is an explained changed world trajectory, not unchanged
behavior or an animation defect. The prior1824 mismatch remains retained.
