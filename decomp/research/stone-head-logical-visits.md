# Model45 Stone Head logical animation visits

This corrects the existing model45/46/47 decorative body's clock owner for
[issue214](https://github.com/JohnDeved/populous-new-dawn/issues/214). It does not
change the global24Hz clock, other head/scenery families, Vault/HFX or fallback
person artwork. The earlier [geometry and per-visit evidence](stone-head-animation.md)
retains its original source and limits.

The [accepted producer/dispatcher proof and independent replay](https://github.com/JohnDeved/populous-new-dawn/tree/e76091766dd2db9d21b6d28ba2075f77a99284df/stone-head-logical-gate)
execute class5/model9 creation, the post-load reward-family linker, model45
selection, actual state10 processing, dispatcher stamps and both animation lists.
Original004a5fdc sets flags3 bit0x40000. Draw4's ordinary morph branch consumes
that logical-visit gate; disabled hold remains distinct, and a morph-transition
branch is ungated. Terrain/registration/shadow/neighbor/audio environment leaves
are supplied. The original EXE is SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
There is no original OS wall-clock or whole-renderer claim.

The former native morph checker supplied a zeroed scenery record, then executed
linkage/setters and one updater call per explicit visit. It correctly proved
per-visit frames and geometry, but did not execute the creation gate. Those
results do not establish the live24Hz owner. The composed proof makes this missing
boundary explicit; it preserves prior results rather than relabelling them.

The body constructor and lazy checkpoint adoption now supply only the missing
gate. Existing saved phase, stamp and flags remain intact; missing legacy state
retains the established deterministic phase0/disabled-hold1 policy. Unsupported
nulls and Vault remain separate. There is no new save field or allocator behavior.

The world clock performs one logical body visit after the completed turn's
observers and queued callbacks, beside the existing logical-person phase. It
selects surviving bodies after the turn, including a newly initialized body, and
does not visit removed bodies. It never gates on the reward trigger's active
flag: the original decorative body survives exhaustion. The adapter stamp records
the last completed World.turn, rather than claiming an original draw serial.

Enabled/disabled/refill synchronization occurs before branch ownership selection.
Ordinary gated mode4 advances on logical visits, including high-speed catch-up;
held ordinary mode4 receives its stamp without advancing the raw counter.
Ungated morph transitions receive only presentation visits. Pause and native
land pause prevent advancement, and a new Scene clock cannot replay a saved turn.
Direct tick remains simulation-only.

stepStoneHeadAnimation remains a single explicit eligible-visit helper for
native frame/geometry comparisons. Its optional counter is supplied by the live
logical phase. It is not an elapsed-time scheduler. The legacy browser geometry
fixture now advances one controlled1x logical turn per sampled phase, preserving
all18 original geometry/frame assertions. Its old speed0 plus1/24 advancement was
an obsolete owner assumption. Its existing staged gameplay, camera, final-use
and direct-step limitations remain; it is not an ordinary campaign observation.

Portable tests cover the gate, extra-presentation hold, speed0/catch-up, observer
order, transition separation, lazy/allocation/removal boundaries, legacy phase,
disable/refill, pause, exhausted triggers and turn wrap. Original native timelines
remain source-bound; candidate adapter comparisons consume those retained rows
without claiming a new original execution. Final browser/gate acceptance belongs
to the exact reviewed candidate receipts, not this source note.
