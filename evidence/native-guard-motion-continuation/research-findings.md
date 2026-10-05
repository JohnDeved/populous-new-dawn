# Guard callback → motion and animation continuation

## Result and limits

The final bounded native witness completes all four planned cases: near Guard,
far Guard, target loss, and ordinary command3 movement. It executes 96 complete
person visits plus96 native animation-list visits (196 stages including four
input producers). No movement, route, guard, per-person tail or animation leaf
is supplied during those visits. This is original instruction execution in a
supplied flat world, not a captured ordinary game or arbitrary-world parity.

Near Guard does **not** physically settle at its proximity callback. In the
final fixture the callback clears pursuit on visit4, after physics already moved
the follower. The next visit moves another(+61,+17), retaining speed61,
route1 and source40. Route1 releases naturally on visit11; the Guard remains
state10/status30/source40 and continues moving through the finite visit24 window.
This does not prove that Guard can never settle under other inputs or later visits.

In the far case, pursuit remains set at visit4 and clears at visit20 when the
moving follower reaches the near square. Visit21 still moves(+63,+8), with
route1/speed61/source40. Far status alone is not a stop instruction either.

Target loss is different. After the explicit target-dead bit before visit5,
that visit first moves(+61,+17), then native order completion releases the Guard
and enters state17 with speed63. It reaches state19/source48/speed65 at visit10;
this is still not settled. Visit11 runs native resting-slot selection and returns
to source40/speed57. Visit13 reaches the actual resting-slot consumer, snaps to
(4864,4352), sets speed0 and source48, and remains there through visit24.
The command3 control completes into the same ordinary resting path and first
settles on visit12, staying fixed through visit24.

Both settled controls retain their prior velocity bytes: target loss(+57,0,+18),
move control(+65,0,+20), ordered x/height/y. Position deltas are zero on all visits
after their settling visit. Neither nonzero stored speed alone nor stale velocity
components can substitute for observing the actual position consumer.

## Exact caller/consumer order

Static references are existing indexed Ghidra exports in the frozen candidate;
the local `.asm` files are Capstone disassembly of the pinned original image,
not new Ghidra exports. Raw byte instructions and native execution agree:

1. Native allocated-person loop004ec898..004ec8cb loads the list and increments
   person+2e at004ec8b3, then calls class dispatcher004ed700 at004ec8b6.
2. Class1 dispatcher calls full person processor004d32b0 and stamps person+18
   with sprite counter on return. The witness executes that dispatcher.
3. Processor calls preparation004d42a0 at004d32bb, reaction0051fed0 at004d32c4,
   unsupported-ground004e9050 at004d32cd, and full physics004e6d00 at004d32d6.
4. Physics updates terrain/steering/velocity/position/cell membership and calls
   route advance004eadc0 at004e786e, **before** returning to the person switch.
5. State10 calls order processor00432590 at004d351a. Command30 calls Guard
   0043daa0 at00432a17. Near Guard clears bit0x02000000 at0043db7f and returns;
   its raw before/after snapshots change only pursuit/flags in the near witness.
   The actual speed, route, position and animation source are untouched there.
6. Processor performs its ordinary state transition and all health/combat/common
   tail routines, then dispatcher stamps the record. All these bodies execute
   unmodified for the supplied quiet world; none is replaced with an idle answer.
7. Witness then calls native animation list004ee770, which visits004ee7b0.
   The latter advances phase from its true processor stamp and shipped frame
   counts. It does not select a resting pose merely because pursuit was cleared.
8. The next actual allocated-person visit repeats preparation→physics→route→Guard.
   That is where the retained speed/destination/route reaches subsequent motion.

For completed orders, state19 calls004d73e0 at004d36f2. Its resting substate3
branch inserts the slot position, writes speed0 at004d7743 and calls004d3ff0
at004d7765, which reaches the real upper/source setters004d4040/004ee700.
That is the observed true stop/source48 path for the two controls, rather than
near-Guard's0043db7f bit clear.

Outer ordering is static-only: draw_main004a4960 calls main_loop_outer004a5590,
which calls scheduler004ec6f0; draw_main later calls animation004ee770 after its
render gate. The witness does not run Windows, renderer, timer, or the complete
world scheduler. Its actual native loop segment preserves counter/class/stamp
ordering, while global turn and sprite counters are supplied once per visit.

## Exact supplied fixture and inputs

Every case resets the mapped image and dedicated fixture memory to a common
pristine snapshot after native constants, frame counts, MWSEARCH, and resting-slot
startup initialization. Firewarrior id1/model6/physics17 is at(4096,4096), state19,
source48/draw18/f1=1/f2=3, selected. Initial speed/velocity are zero; goal,
destination and turning point equal the initial position. Shaman id73/model7 is
at(4696,4096), or(5896,4096) for far Guard. Both have life/maxLife1000.
They are inserted through native004ee470 into real native cell lists. Identity
is fixed at02000000/02000100 and lookup slots1/73, never replaced during a case.

The Shaman is a stationary target/collision record but is not itself scheduled.
The allocated-person list contains only the follower. Terrain is flat height0,
category0 (native category flag1), tile flags0, all-walkable mask, with no buildings
or combat targets. The inherited levelFlags2=0x50000 suppresses formation/footprint
world effects. This is a declared synthetic world and pose, not actual campaign
acquisition, captured allocation history, full formation behavior or live timing.

Guard is produced by real00443b40(tribe0,retainSelection1). It allocates/configures
shared command30 and deferred bit16; native preparation adopts it on visit1.
First Guard callback always runs its first-entry recover/plan branch, even for
an initially close target. Thus 'near clear at visit4' names the actual subsequent
counter-gated callback, not an assumed startup state. No phase or speed is manually
forced after G, and no destination planner is intercepted.

The movement control uses native00444f60 with packet action0x57, model3 and the
packed click cell0x1012; the native writer makes goal(4736,4224). Its two input-only
supplied leaves are acknowledgement00436330 and selection refresh0047a550. An
audio leaf0048a050 is registered but never reached. No supplied leaf fires in
any of the96 person or96 animation visits.

EXE SHA256 is3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.
The exact input/tool/source hashes are in result-03.json and receipt.json.
Original startup0042c210 materializes the resting-slot geometry; pinned
MWSEARCH.DAT is loaded at008929cd using the existing native resting checker flow.
Sprite frame counts are projected from shipped VSTART/VFRA by the accepted
lifecycle harness prefix. The retained original lifecycle probe is read, never
modified; no original game assets or tool installations are copied into this packet.

## Earlier incomplete attempts are preserved

attempt-01.json used the initial retained lifecycle pose and did not reset the
entire image between cases. It is diagnostic only. result-02.json resets the
image and corrects the initial goal/turn pose but still lacks the startup resting
slot table; its control packet also mistakenly supplies full coordinates where
the real input expects packed cells. Neither is the authoritative four-case proof.

The exact earlier target-loss failure is retained:004d73e0 calls resting lookup
004d5120, whose004d52d6 reads word[DAT00895ef1+4] with the pointer still zero,
attempting address00000004. No arbitrary return or fake slot was supplied.
Final result03 loads original MWSEARCH and executes its established native startup
producer0042c210 (see scripts/check-native-resting-slots.py), then replays the
finite set. This repairs fixture initialization and closes that local gap while
preserving the old incomplete receipts. It does not expand to arbitrary worlds.

## Port comparison and next step

[source-comparison.md](source-comparison.md) separately maps the frozen PR220
candidate. Its relevant composition already performs physics→route→Guard and
keeps the near callback free of a stop/setter. No TypeScript/native trajectory
comparison or rendered browser test was run for this packet. No production
change or PR220 acceptance expansion follows from it.

Freeze these artifacts for independent review/replay first. If further motion
parity work is selected afterward, compare a native and port trajectory with
identical initialization/quiet-world inputs and actual position deltas, including
the resting-slot continuation. Ordinary campaign physical settling still needs
its own representative live/native evidence. Do not add an inferred Guard stop
or default frame policy from proximity, stored speed or velocity alone.

No checks/build/browser/package/Ghidra project jobs ran. Source and index were
read-only; only this ignored work directory was written. CPU4 was used for every
native-light invocation, each wrapped in timeout60s. No child was spawned.
