# Mission 5 Angel reward

## Provenance

The evidence below targets `d3dpoptb.exe` SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
exported from the repository Ghidra 12.1.3 project. The checked-in pseudocode is
review evidence, not recovered source. Community names such as “AoD”, “teleport”,
and “statue to AoD” are search hypotheses only.

Mission 5 head index 97 is at `(-97,117)` and has settings
`[5,1,0,1,1,0,128,0,129,0]`. Its one-based links resolve to class 7/model 91 at
the head position and class 7/model 88 at `(-51,15)`.

## Observed native facts

The existing worship handler at `0x004fb270` clones every nonzero linked template
on one-shot completion. With the head's ownership setting enabled, both clones
receive the winning tribe. The handler then removes the templates and completed
head through `0x004ef180`.

Class-7 type initialization (`0x00509c10`) dispatches model 91 to
[`0x00479840`](../generated/00479840.c). Unless an excluded land flag deletes the
object, this sets state `0x4c`, substate zero, and the state-transition flag.
Class-7 state initialization is empty and the class-7 model processor has no
model-91 combat branch. Model 88 is grounded, receives presentation state `0x49`,
and has short `+0x6c` cleared; it likewise has no class-7 combat branch. Neither
linked object implements the moving attacker.

[`0x00512240`](../generated/00512240.c) proves the ordinary effect-to-payload
route. A class-7/model-19 effect first creates a class-7/model-72 presentation and
plays sound cue `0xd9`. After that presentation disappears, it allocates one class
1/model 8 object with the effect's tribe and position, then removes the effect.

[`0x004dd700`](../generated/004dd700.c) proves the class-1/model-8 child creation
contract used by an existing Angel: allocation copies the source tribe and
position, copies common fields, sets substate 13, sets the state-transition flag,
clears attachment index `+0x89`, records its parameter at `+0x7c`, registers the
position, and immediately runs the controller. Calls with parameters 2 through 5
inside the controller create split children; they do not prove that initial head
activation creates four objects.

[`0x004db980`](../generated/004db980.c) owns the observable combat lifecycle:

- It ensures a same-tribe class-6/model-8 visual attachment at the payload's
  position, initializes it with presentation `0x45`, stores its unit index at
  `+0x89`, and plays cue `0xdb` on first initialization.
- Target selection prefers the nearest enemy class-1/model-8 object, then the
  nearest eligible live, non-protected, non-self/allied person. It records the
  destination at `+0x4f` and the resolved target index at `+0x72`.
- Chase updates destination and height from the target and uses the native
  movement/vector helpers. Within x/y distance `0x1f8` of an ordinary person, it
  stores attacker information on the victim, changes the victim to state `0x28`,
  initializes that state, and begins a 28-tick strike phase.
- At strike timer 8 it calls
  [`0x004e0a30`](../generated/004e0a30.c). That routine applies impact flags and a
  vector, attributes the attacking tribe, and ordinarily subtracts the victim's
  current `+0x6e` health from itself. A configured victim flag instead right-shifts
  that amount. The ordinary first strike is therefore lethal.
- `+0x6e` is health and `+0x97` is the finite lifetime counter used by ordinary
  zero-parameter Angels. When the `+0x63` guard is clear, the controller decrements
  `+0x97`. A nonzero `+0x7c` pins health to 16000 and bypasses the ordinary
  zero-parameter death entry.
- The ordinary death path shrinks the visual attachment for 16 ticks, plays cue
  `0xb2`, optionally emits a class-7/model-9 cleanup effect, and removes the combat
  payload through `0x004ef180`. Other controller phases use cue `0xdc` and emit
  short-lived class-7 presentation effects.

## Decision and inference boundary

The durable implementation decision is that model 91 is the static statue/reward
presentation, model 88 is the authored remote marker/presentation, and the moving
combat payload is class 1/model 8 owned by the worship winner. Model 88 must not be
implemented as the Angel or as its ownership source.

Binding the initial class-1/model-8 payload specifically to model 88's `(-51,15)`
position is a strong inference from the authored remote placement, both linked
models' inert combat initialization, and the native effect-to-payload position
copy. A direct activation caller connecting generic command-29/model-91 completion
to that initial allocation was not recovered. Static references to `0x004dd700`
are only `0x004dcf3f`, `0x004dcf4a`, `0x004dd0be`, and `0x004dd105`, all child-split
calls within `0x004db980`.

The initial `+0x7c` parameter and numeric `+0x97` lifetime are also unresolved.
The exports prove the lifetime field and cleanup behavior, not the Mission 5
duration. An implementation may use the recovered owner, destination, combat, and
cleanup contracts, but must not label its activation frame ordering or duration as
exact native parity until a narrow head-completion/command-29 trace records the
first class-1/model-8 allocation's caller, position, `+0x7c`, and `+0x97`.

## Angel impact Shield correction (2026-10-12)

The timer-eight ordinary-person branch in `004db980` calls `004e0a30`, not
mode-zero `004da080`. The former directly subtracts current signed life at
`+0x6e`. Its damage block retains level-flag `0x04000000` immunity, Bloodlust
(`+0x16 & 8`, flags3 `0x80000`) reduction, and nonneutral victim/attacker
attribution. It does not test Shield (`+0x15 & 0x80`, flags3 `0x8000`). The
retained controller's person-selection and timer-eight branches likewise contain
no Shield exclusion. Movement/helper and full selection equivalence are not
established by this observation.

The browser Angel consumer incorrectly used ordinary damage mode zero. Passing
mode one to the existing `damagePerson` preserves the shared health, Bloodlust,
immunity and attribution logic while bypassing only Shield. The existing Mission5
fixture's explicit "Shield blocks" expectation described that browser error; its
replacement requires death on the first timer-eight strike and retains target
eligibility, exact recovery timing and one kill credit.

`tests/angel-impact.test.mjs` supplies a flat field, people, stock and status
durations, then uses public casting, projectile arrival, ordinary Angel selection,
and real turn processing through impact and cleanup. The unchanged baseline
produced a hit at turn29/timer8 in both ordinary and Shield cases, but Shield
incorrectly kept50HP. Five of eight failure-first cases fail on that baseline.
The matrix retains Bloodlust-only, combined status and global-immunity controls;
neutral attribution cases explicitly supply a terminal state after selection,
without claiming natural neutral target acquisition. The actual checkpoint API
preserves exact continuation through impact and recovery; the CPU environment
exercises its in-memory checkpoint rather than persistent browser storage.

This correction does not implement `004e0a30`'s throw vector, person-state
initialization, Angel counters or parameter-dependent cleanup flags. No fresh
native execution, rendered acceptance, exact Angel movement, or full consumer
equivalence is claimed. The earlier activation/lifetime boundaries still apply.

## Initial target selection excludes conversion listeners (2026-10-12)

`004db980`'s initial per-tribe person-chain scan admits class1 people only when
their state is not `0x17` (decimal23), before the health, protection, alliance,
disguise and nearest-distance checks. This is the conversion-listener state,
not an exclusion of Preachers as a class. Its later case5 retained-target lookup
does not repeat this state predicate. Therefore `nearestEnemy` now excludes the
actual selected person owner's state23; the already-held target path is unchanged.
No other eligibility gate or candidate ordering is changed.

The new `angel-listener-selection.test.mjs` supplies terrain, people and spell
stock. Ordinary preaching establishes state23 with the real Preacher owner, then
public Angel casting/arrival reaches initial selection. The baseline incorrectly
selects the listener. Three of four failure-first cases fail; the retained-target
control already passes. Coverage requires a farther eligible enemy to win, no
acquisition when all enemies listen, eligibility after a public command releases
the sermon, retention when a previously acquired target subsequently starts
listening, and exact checkpoint continuation through release and selection.
The retention test explicitly adds a supplied Preacher after Angel acquisition;
it does not claim an untouched campaign journey. Checkpoint persistence and
native/rendered limitations remain those stated above. Other unrecovered or
unimplemented Angel selection/controller behavior receives no completion credit.

## Initial target selection respects Spy disguise (2026-10-12)

The same `004db980` initial person scan tests model5's byte `+0xb2`: when
the low six countdown bits are zero it compares the upper apparent-tribe bits
against the Angel owner; otherwise it uses the actual tribe. The existing pure
`computer-selection.ts::spyDisguisedFrom` matches that branch. `nearestEnemy`
now uses this predicate on its selected person owner. Existing target retention,
disguise production/countdown, and other selection behavior are unchanged.
For a legacy owner with no disguise field, preserve prior eligibility rather
than coercing undefined to an apparent Blue tribe; this is compatibility policy,
not a native missing-byte claim.

`angel-spy-selection.test.mjs` supplies field, actors, funding, an AI spell entry,
readiness and remembered target cell. The public disguise command establishes
actual disguise bytes, then the shipped AI spell dispatcher creates the Red
Angel through ordinary casting/projectile arrival. The baseline attacks the
apparently allied Spy; four of ten new tests fail. Controls retain pending
countdown, another apparent tribe, non-Spy targets, a farther eligible target,
reacquisition after ordinary combat reveals the Spy, a held target whose disguise
subsequently completes, and exact checkpoint continuation. The missing-field and
missing-owner cases explicitly supply terminal legacy ownership to test the compatibility
policy, without claiming an ordinary tribe-change producer. No fresh native or
rendered execution, full AI policy acquisition, or broader Angel parity is claimed.
