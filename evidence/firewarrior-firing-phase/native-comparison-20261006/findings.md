# Finite Firewarrior firing comparison: native-02

The comparison **failed with actual native/port differences**, exit 1. It did not
fail a setup, write, instruction or resource guard. No runtime/artwork correction,
browser run, ordinary firing witness, frame clock proof or parity acceptance is
claimed.

Tested source: 4656907be4bc2d97bff4cbf161963be1fe89ada4.
Application/artwork base: b0208188b8de345a6ad5e86cb7c49769624dda86.
Receipt: ../native-02.json, source and explicit inputs identical before/after.
Run: 2026-10-06T07:37:01.892Z–07:37:04.014Z, CPU4, original session34727.
All 16 native cases completed (60 calls, 18,104 instructions); all 16 actual-port
cases completed (54 visits). The full predeclared batch order was retained.
comparison.json contains 394 field/visit differences, including repeated fields
and different completion boundaries; these are not 394 independent live defects.

## Decisive producer and phase differences

Both person/substate10 and building/substate11 observations agree:

| Observed boundary | Original controller | Actual current port caller |
| --- | --- | --- |
| First firing visit, prior40/18/f1=7/f2=3 | source56/draw13, f1=1/f2=0, assignment0x200, timer4 | source48/draw14, f1=0/f2=3, assignment0, timer6 |
| First firing visit, prior48/18/f1=2/f2=4 | same original reset/result | source48/draw14, f1=0/f2=4, assignment0, timer6 |
| Phase44 timer1 visit | phase40/timer0, assignment0x210; previous frame remains for this boundary | phase40/timer6, assignment0x200; no pending initialization bit |
| Next phase40 visit from recovery fixture | real row15 reselection, f1=1/f2=0, renderFlags0x182, timer5 | no reselection/reset/hold; f1=3/f2=4, renderFlags0, timer5 |
| Phase45 cooldown entry | timer31 after32 initialization and first decrement | timer32, no first decrement |

Original firing initializes five visits then decrements immediately; the port
selects a six-frame idle family and begins its decrement next visit. Native real
setters and launch executed. Descriptor13/14 are byte-identical, so descriptor
contents alone are not the cause.

In the supplied full-entry fixture with a continuously present tracked projectile,
native completion occurred on its 11th call versus the port's 13th call. This is
only a count of isolated controller visits: no animation/world-clock updates,
cooldown progression or natural projectile lifetime were supplied between visits.

The native wait-entry-present case starts with phase40/assignment0x210 and timer0;
it performs its pending row/reset/hold initialization and waits six visits. The
port ignores that initialization bit and completes on its first visit. This input
tests the native-owned phase boundary; it is not an ordinary observed port entry.

The native missing-shot wait completes after real wait initialization and cleanup.
Real cleanup selects ordinary48/18, clears the substate and sets the changed-state
flag. The extracted port caller returns completion to stepLiveOrderQueue and has
different field ownership at that point. Orientation is likewise split between
the native person and port Unit. Trace those outer consumers before calling every
raw completion/orientation difference a live defect or broadening a correction.

## Runtime identity, cleanup and limits

The direct port child completed with exit0 and was confirmed reaped by wait4:
PID95 in this original invocation, maximum RSS145,788KiB, stderr empty. Native
Python peak RSS50,020KiB. The original foreground session reached terminal exit1;
CPU4 was released. These are functional/headless resource observations, not
hardware-performance claims. No process scan or cross-namespace PID inference was
used as cleanup proof.

Canonical EXE SHA-256:
3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.
Supplied state, intercepted allocator/audio/sunlight/building-coordinate leaves,
instruction/write limits and unchanged real setters are declared in the committed
preflight.md. No broader geometry, animation-clock or ordinary gameplay claim.

Raw identities:
- native.json: 977f01bd263bc7c49de959e8738c5538d7e14c637146b324a32dbfbf1fd0ba1a
- supplied-fixtures.json: 9ad6cabf2ddd1dbc7305816b6b795a9c62ca606a83218c3857f90d2d3a39561d
- port.stdout.json: 2f9242c59c4936f378aca17ad966ca19198cdae7c7fbf3165d8f28335397c021
- comparison.json: 86ad04157e8783eb290360ac376cdbcd4e306240bd4fe47d4d78704eee2def28
- port-process.json: ca91385c690102f3ee4ef80255473c9928145a2fde33c8bc82dd0303b0945660

Native/fixture bytes match the earlier native-01 exactly; port output matches the
accepted startup-only smoke exactly. The earlier failed --jitless setup receipt
and startup-only PASS remain separate, unchanged records.

## Remaining acceptance

Fresh review of these actual outputs is required. The ordinary Mission10 acquired
Firewarrior command21 firing/pixel witness is still only source-planned. No runtime
or asset implementation should be accepted from this synthetic comparison alone.
The source720 resting correction stays closed and separate. Work is local,
unpushed and not reset-durable; no publication/auth/Library action occurred.
