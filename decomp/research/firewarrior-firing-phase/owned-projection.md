# Prospective owned acceptance boundary

Frozen before runtime repair at clean c8732a30; its evidence-only commit preserves
the reviewed634501cd application/artwork unchanged. The adjacent JSON is the
exact field/bit/visit policy, justified from the already reviewed native producer
and actual private port body. It does not alter the baseline cases or results.

The owned active after-state is: animationMode, object, draw, f1, f2, timer, the
full assignment word, renderFlags, morph, palette, mapped trackedProjectile and
normalized cooldown; plus only flags2 bit0x40000000. The source/table setters own
object/draw/frame reset and morph/palette/render flags. Ranged phase44/40/45 owns
phase/timer, assignment0x10/0x200 and the changed-target entry bit; the real upper
setter clears assignment0x80. Compare the whole assignment word so unrelated-bit
preservation is not silently waived. The unchanged launch owns tracked projectile
and cooldown within the active body.

Pair existing cases by name and visits by invocation index. **Compare completion
booleans on every invocation, including terminal invocations.** A boolean, visit
presence or count divergence fails. Compare owned fields only after invocations
where both bodies return incomplete. Once either returns complete, retain the
full after-state diagnostically but do not demand equality of residual fields
whose next consumer is outside the private body. Keep unchanged per-case caps;
cap exhaustion while incomplete is only a partial observation.

This is a prospective boundary, not a post-hoc successful-field subset. Entry
cases expose row15 selection, prior-frame reset and first decrement. The active
phase44 timer1 case exposes pending40 initialization, and its next active call
exposes row reselection/reset/hold. Wait-entry-present tests native pending entry;
wait-entry-gone and cooldown-expiry/cleared test the completion boolean without
asserting residual cleanup state. Cooldown-entry tests32→31 immediately. These
remain the original eight cases for each target class, without altered fixtures.

Facing stays diagnostic: native ranged entry writes person angle/heading, while
the shipped port also has preceding pursuit facing and subsequent Unit projection.
Do not change those outer owners to satisfy this isolated probe. Completion stays
diagnostic after the returned boolean: original00518390/004d4da0 and the port's
outer queue/state consumer have different observed boundaries. Do not copy final
state/substate, source/pose, timer, phase, flags or projectile residue merely to
erase those raw differences.

The original394-field failed comparison and11-native/13-port isolated-call
observation remain immutable. Keep producing the full raw comparison separately;
an owned-projection pass cannot relabel it whole-record/whole-command equivalence.
The11/13 difference was5+6 versus7+6 active/body calls to completion, not evidence
of elapsed gameplay or of outer command release timing.

Implementation may now target the selector/reset/hold/timer/assignment lifecycle
and source56–63 append, leaving facing and outer completion mutations outside.
Any new boundary or exclusion requires an explicit source-backed review before
changing the acceptance policy. No new execution was performed for this freeze.
