# Hypnotise permanence follows original-tribe defeat immediately

## Ordinary failure

A controlled ordinary Hypnotise cast converts the last Red Brave. The normal
outcome visit marks Red defeated at turn32. Before this correction, the next
person-status visit still retained temporary ownership and decremented the
remaining count from53 to52. The status survived until expiry, allowing death
cleanup in that interval to restore the victim's tribe and death credit to Red.

## Retained original contract and field binding

`004d92b0` first checks flags4 bit0x4000, then the original tribe byte at person+0xad.
If that tribe's `f_949` is nonzero, it clears person+0xac and the status flag and
returns. The counter&7 and countdown/replacement logic are strictly later. The
existing person identity, tribe, position and ownership are retained: this early
branch allocates nothing, removes nobody and consumes no RNG.

The field is independently bound through `00418e30`: tribe+0x949 is set to1 when
`num_persons` becomes0 before the defeat callback, and an active nonzero timer below96
is incremented by16. `00419480` uses the same `f_949 < 97` work gate. These match the
port's `defeatTimer` producer and tribe gate. This is not inferred solely from the
previous late-expiry use of the field.

## Bounded correction

Move the existing defeated-original-tribe status-clear branch before the port's
countdown gate. Preserve its existing retained-person/resident flag clearing,
normal expiry replacement, dead-unit handling and all target selection behavior.
No new permanence or removal action is added; only the condition's timing changes.
The obsolete status no longer causes later death cleanup to restore original-tribe
ownership after it has already become permanent.

## Tests and boundaries

Failure-first coverage captures seven countdown phases, an actual last-Brave cast
and outcome, subsequent death attribution, and checkpoint continuation. The housed
follower regression now requires clearing on one non-expiring/non-eight visit while
retaining the same unit, resident, person, commands, occupied slot and allocation ID.
Normal original-tribe-alive expiry still replaces identity at its existing boundary.

These CPU witnesses supply population/placement and spell stock. Fresh native
execution and normal-input rendered validation are unrun. The separate unavailable
Hypnotise target-selection consumer remains blocked; its existing predicate/order
are unchanged. Native clock and full Hypnotise parity are not claimed.
