# Mission 22 recurring Red Tower staffing

This restores one authored recurring producer within the existing partial campaign
script adapter. It does not restore the complete Mission 22 script.

The imported Red `cpscr064.dat` script (SHA256
`741f7a2aa5bdb82f993b0e4cd9692b6b8bf6b4f5b188cb206a1fa9e15565e26c`)
has a top-level EVERY header at codes 227–229 and a DO 1097 statement at
230–234. The previous nested blocks close before this header. Field 57 is the
raw mask 255; there is no offset. Fields 58/59/5 resolve to person model 6 and
coordinates (16,14), locating the authored Red Tower 90.

Native EVERY handling at 0048c6b0/0048c980 masks the signed tribe plus the turn
and optional offset. The existing interpreter therefore invokes this statement
for Red tribe 1 at input turns 255, 511, and so on. World processing increments
the turn afterwards, so the first task is observed at turn 256. The projection
keeps the whole EVERY header and staffing statement and supplies explicit block
terminators. The existing opcode handler and type-7 task consumer are unchanged.

The initial staffing-only restoration omitted sibling marker request 1092; the
subsequent [marker restoration](mission22-marker-patrol.md) includes it in its
original following position. Conditional emergency request 1086 remains omitted.
These siblings cannot condition this earlier invocation, but can alter later
native task scheduling and population. Accordingly, this restores staffing
capability and its producer cadence, not full-block or native completion-time
parity. The unrelated requested-model-zero consumer path is unchanged.

The ordinary regression starts the authored mission without injected actors,
positions or clocks. Firewarrior 96 is selected by the task, enters Tower 90,
retains its registered resident owner, and releases the entry order reference.
A public checkpoint during task execution continues through turn 1200; only the
established two missing shrine reward defaults are normalized for comparison.
Absent, destroyed and wrong-tribe Tower fixtures are explicitly supplied controls.

Adding this real enemy garrison can change subsequent combat, random-number
consumption and campaign outcomes. Historical route failures are retained and
must be causally requalified before updating their expected outcomes.

In the retained ordinary Boat acquisition trace, Tower Firewarrior 96 emits the
impact pair targeting Shaman 89; the first hit at browser turn 1355 reduces life
2000 to 1500. The existing health updater adds 32 every eligible eighth turn
while below maximum, without clamping the final increment, reaching life 2012
(HP100.6) at1480. This producer change does not modify damage or healing.

The changed campaign also exposes a previously ignored failed-ground-recovery
branch after the later Tower attack's melee encounter. That prerequisite is
implemented and reviewed separately; this branch composes it rather than hiding
a movement correction in the script producer. The composed ordinary trace
selects Tower105, enters the real encounter, leaves the former stalled position
through the existing physics owner, then dies and releases the attack reference.
It does not destroy the selected Tower. Grounded and airborne person attacks and
worship have separately measured encounter/admission outcomes; exact input
sequences and full checkpoint/ownership assertions are retained in their tests.

The final death boundary is the existing unsupported-settling adapter: retained
person life remains2012 while its airborne flag clears over category8 with
supportsFollower false; the browser sets HP0 and performs cleanup. This is not
a claim that native falling damage reduced life or that native death timing is
matched. The separate prerequisite restores the source-defined motion handoff;
it does not rewrite that later death adapter.
