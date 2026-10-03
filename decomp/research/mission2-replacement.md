# Mission 2 explicit replacement-Warrior owner

## Finding

The replacement path is an explicit script training request, not an inferred
producer attribute. CPSCR074 words `551..<577` execute `EVERY 63 OFFSET 54`.
For Matak tribe 3 the first opportunity is turn 7, then 71, 135, and so on.
When own population is greater than 10 and own Warriors fewer than 2, the script
sets variable 6 to `2 - Warrior count` and calls opcode 1095 with that count and
person model 3. It does not change producer preference attributes 5..8.

The browser already executes this whole block through its ordinary Mission 2
script and binds 1095 to `requestTraining`. No runtime behavior was changed for
this finding. It resolves one source-ownership uncertainty; it does not restore
the invalid historical claim that opcode 1173 drives production or sustained
economy growth.

## Native execution

Run `python scripts/check-native-mission2-replacement.py /path/to/d3dpoptb.exe`.
The executable must hash to
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and adjacent `levels/cpscr074.dat` to
`03931ad1bc69860177c0a0d7d850db46b268683bf95b274926e18fe1f8a5d9db`.

The probe supplies native population counters, linked Brave/school records and
occupied task slots, then executes original instructions with no intercepted
leaves. The interpreter, internal reads, 1095 handler, `004e6640`, actual person
availability readers `004f67b0/004f6730`, completed-school lookup `004f36d0`,
free-slot selection and task writer all execute.

Nine cases cover an adjacent non-due turn, population exactly 10, Warrior count
exactly 2, one- and two-Warrior replacement requests, recurrence, allocation after
two occupied slots, no available person, unfinished school, and all slots occupied
(the recurrence case also exercises occupied-slot selection). Valid requests
allocate type 6, phase 0, completed model-7 school ID 42 and count 1 or 2. All 48
producer attributes remain zero in the controlled fixture, and native RNG is
unchanged. This establishes explicit request ownership independently of automatic
training preference gates.

This isolated native test does not simulate whole-game movement, school admission,
mana distribution, conversion or the resulting count of concurrent trainees.
Existing training evidence and the following live simulation cover different
parts of that path; neither is a complete original-game recording.

## Natural simulation

`tests/mission2-replacement.test.mjs` starts the shipped Mission 2. Player Braves
build three Huts, grow to 26 people, build a Warrior Training Hut and train
sixteen Warriors using normal commands. The test requires the AI's newly built
home Tower to be complete before attacking. It chooses the nearest defender using
toroidal distance and reissues direct attacks only to idle survivors after combat
or panic has released their earlier order. Their real combat reduces Matak to
fewer than two Warriors while its population remains above ten. After the player army withdraws, the script requests a type-6
task at the existing Matak school, actual Braves receive training-entry orders,
and ordinary mana/training conversion creates new Warriors. Producer preferences
5..8 remain zero throughout.

Training conversion allocates new person IDs and retires the old Brave objects.
The regression therefore detects newly allocated Warriors, rather than requiring
an old Brave ID to change class in place. Repeated script opportunities can issue
more requests before conversion completes; this test makes no unsupported claim
that the final army stops at exactly two Warriors.

No entities, counters, preferences, outcomes or training completions are injected.
The test runs the shipped simulation in Node. Rendered browser acceptance and full
Mission 2 or missions 1–3 parity remain separate. This evidence update is not a
new gameplay feature or a parity-ledger increment.

## Combined-construction regression

On combined source `118b377f9481a7da84b69c67fe59935f656c1217`, the former
eight-Warrior scenario timed out at turn 11472 during its first assault, before
replacement training. Its planar-distance sort chose home defender 6 roughly
111 wrapped world units from the school instead of outpost defender 21 roughly
49 units away. Surviving attackers had no attack order and the selected defender
remained alive. Wrapped targeting alone also failed to reach the home defenders
with that army. This was a failed scenario precondition, not evidence of a
training-owner defect.

The revised ordinary preparation and idle-survivor redirection reach the original
population/Warrior gates without changing runtime behavior or raising the existing
per-assault turn ceiling. Each selected target must actually die. The completed
AI home Tower assertion keeps this proof composed with the construction feature;
no construction, combat, training, or replacement producer is disabled.
