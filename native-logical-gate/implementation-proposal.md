# Bounded logical animation repair proposal

Frozen source: a53fa05587c4c1d363e3596162b41fcb9f26e3e8. Research acceptance is
work/reviews/sprite-visit-gate-214/review.md, SHA256
40d06f6f76ae7a7e113676a4e05c360777025c74597cffd4c52ac058b63918db.
No runtime change was made while preparing this proposal.

## Policy and smallest implementation

Keep the existing 24 Hz presentation clock. Split the existing animation adapter
into logical and presentation visits, reusing the same frame updater. The logical
visit covers only ordinary person models 2–7 and Splash/model65. Wildmen/model1,
Angel/model8, Stone Heads, other effects, root/child/damage smoke, knowledge glows,
UI acquisition and fallback age-based sprites retain their current owners.

`app/animation.ts` gets a small predicate matching the native updater's actual
branch: bit0x40000 and descriptor mode1/2, or ordinary mode4 without transition
flag0x1000. Mode3 and the mode4 transition branch remain presentation-owned even
if the bit is present. Suppression by renderFlags2 and held morphs remains in the
existing updater. Do not route an entire flagged record without its mode check.

`app/game-clock.ts` always limits an elapsed slice to the next simulation turn,
including when no worship callback is installed. After `tick` and its original
observer/callback chain return, compare the pre/post unsigned World.turn. If a
real turn completed, run the logical animation visit before processing the next
turn or a coincident presentation boundary. This prevents high-speed/catch-up
coalescing and lets every subsequent controller see the prior visit's frame.
Land-pause turns that drain an accumulator without changing World.turn do not
advance logical animation. No per-frame observer replacement or new clock/queue
is needed. Presentation callbacks, smoke serials and worship deadlines retain
their existing order and frequency.

`app/live-people.ts` reuses the current `unitAnimationSource` selection and actual
animation helper for the two phases. The logical pass stamps the chosen active
record with this completed logical visit (World.turn), then passes that same
identity to the native updater. The presentation pass excludes the proven gated
branch. This is an explicit elapsed-time adapter: the saved stamp identifies the
last logical animation visit rather than claiming an original render-frame index.
It avoids trusting old zero stamps and does not reproduce original low-FPS losses
where several logical turns coalesce into one draw. No interpolation bit0x100
consumer is added or changed.

Constructor and checkpoint migration restore bit0x40000 only for class1 ordinary
models2–7. Shield/Bloodlust/selection and other flags stay intact. `f1`/`f2` are
never reset merely by repair, source handoff, save or reload. There is no new
persistent frame accumulator: each completed turn owns exactly one gated visit,
and a save already stores the resulting frames. Old stamps are overwritten only
on the next real logical visit; they cannot grant a replay during presentation.

## Logical owners and lifetimes

The post-turn enumeration remains the existing live adapter boundary, explicitly
accepted for the bounded repair. It does not claim to port the entire original
object dispatcher. Source selection happens after all existing logical work;
only a class1 record with nonzero state and model2–7 is eligible as a person.
An array member whose native state is0 is not treated as processed.

| Path | Current source/turn owner | Required behavior |
| --- | --- | --- |
| Idle, move, worship, panic/celebration | `world-turn.ts` → live-resting/live-movement/stepLivePerson | One gated visit after each completed turn; controllers see the preceding visit, including command27 |
| Fight/encounter | `processBattles` before the main person loop, then fight.motion/stepLiveMeleeMotion or physics | Current selected motion record once; do not count both battle and person helpers as two animation visits |
| Flight/recovery/electrocution/tornado | `world-turn.ts` early branches → stepLiveImpulse/stepLivePhysics/other named controller | Same post-turn selection; no early-continue lost stamp; landing or recovery handoff animates the new active source once |
| Builder | `processBuilderWork` adopts retained native into builder.person; counter is assigned World.turn | Reuse builderActivity selection; one visit even when work, movement and state reset all touch the record |
| Entry/housed/training/tower | `stepBuildingEntry` / entry.person; state21 signed timer freezes renderFlags2 | Preserve the native pose freeze; housing/source transitions must not restart the frame cycle |
| Level start/conversion | `stepLevelStarts` runs before the main person loop; startingPeople is skipped there | Include the active post-turn source once despite the skip; replacement record gets one allocation/turn visit, old detached record none |
| Reserved state14 / transport rest / spell holds | Main loop may return early while a live nonzero-state native object remains | Original dispatcher stamps a nonzero-state primary object even if its body does little; active source still gets one visit, with its render hold honored |
| Legacy movement/fight artwork | unitAnimationSource returns null or no corresponding native artwork | Keep existing game-age frame selection and existing presentation-owned fallback behavior; no extra logical fallback footsteps |

Aliases native/flight/fight.motion/entry.person/builder.person may refer to the
same record. Use the existing single selected source per unit, not a loop over
all aliases for advancement. Migration can visit all aliases idempotently to
restore the flag. The complete logical turn determines final source ownership;
do not advance detached pre-turn records after a swap.

## Splash and allocation order

`world-effects.ts:effect('splash')` already sets0x40400. Restrict the effect phase
split to Splash; do not reinterpret every effect with a similar bit. The existing
effect processing snapshot (`effectCount` in world-turn.ts) remains unchanged.

Splash can be allocated by debris during the effect pass, Firestorm impact,
person cleanup after that pass, or Shaman reincarnation near the turn tail. An
allocation that survives at the completed turn boundary receives one allocation-
eligible animation visit even if its first lifetime processor visit is next turn,
matching the native allocator's current stamp. A Splash existing before the pass
also gets only one visit. Removal before the boundary grants none. Its age,
turnsRemaining, object termination and sound consumers are untouched.

There is no shipped out-of-turn Splash allocation entry identified in this scope;
the public effect() helper may still be used by fixtures outside a real turn. Such
a fixture begins logical animation on the next completed turn, not a synthetic
extra presentation grant. Native-controller handoff records created by UI orders
represent already-existing people, and likewise wait for their next logical
visit; they are not claimed as fresh native physical person allocations.

## Command27 and flag resets

The current final-prayer-frame compensation exists because two animation visits
can wrap between controller polls. Remove it for the repaired ordinary logical
path: each controller observes the final frame before the following advance.
Preserve the existing native prayer initialization, substate transition and pose
pause; prove natural entry into substate3 and completion at multiple schedules.
Do not replace it with another hold or timer constant. If an unproved legacy
presentation-owned command27 path remains, retain its old behavior explicitly.

`initializePersonState`, person-order resets, health/physics updates, combat scans,
Shield/Bloodlust and follower-panel copies use masks/copies that preserve0x40000
when it is present. Verify this through focused source/lifecycle tests; don't OR
the flag on every frame to conceal a reset. createMeleePerson and building-entry
creation reuse createLivePerson; conversion creates a new ordinary record there.

## Evidence needed before/after implementation

Accepted native evidence executes the unconditional person creation prefix,
actual animation setter, actual post-body dispatcher stamp and updater; it does
not execute complete ordinary person allocation or all controller lifecycles.
The current proposal relies on that explicit boundary. A later clear of the bit
in a relevant real producer/controller would change the implementation scope.
Review the intervening native masks and current source resets; add only a narrow
composed producer/lifecycle case if the reviewer finds a concrete unresolved
write, rather than running the whole renderer. Smoke absence is not a proof that
every later native path can never set its bit; smoke remains unchanged regardless.

Failure-first portable tests must demonstrate: constructor and legacy migration;
no advance between logical turns; exact controller/frame ordering at speed1/2
and high-speed catch-up without a worship hook; one visit across each source alias
and handoff; nonzero-state early-return owners; state0 suppression; allocation
before/during/after the effect pass; expiry; paused and land-paused worlds;
save/reload without replay; uint32 turn wrap; mode3/mode4-transition separation;
unchanged clear-bit smoke and unrelated effects; and actual command27 completion.
Then run affected existing game-clock, live-worship, construction, flight/combat,
checkpoint and effect regressions. Full gates and ordinary current-main browser
cadence are separate, later coordinated acceptance; the old596 trace is not a
candidate test. Ordinary proof should capture source model/class/state, flags3,
stamp, World.turn, presentation serial and displayed frame/UV from pure reads.
