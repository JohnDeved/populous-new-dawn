# AI-reserved person counter visit

State 14 is AI reservation, not the player's selection flag. The world-person
loop previously returned without advancing the retained person's byte counter.
A later owner that retained that person inherited the missed visits. The old
builder adapter could conceal the deficit by assigning `world.turn & 255`.

## Retained source boundary

- `decomp/generated/004ec6f0.c:89–97`: the primary allocated-object traversal
  increments `class_counter` before dispatch for a nonzero-state object.
- `decomp/generated/004d32b0.c:26–29`: person preparation, reaction and physics
  precede the state switch. Its state-14 handler is case `0xd` because the switch
  subtracts one from the state. That handler is not exempt from the outer counter.
- `app/world-turn.ts`: the existing AI-reservation early return is after the
  newborn/level-start, flight, dead-person and Armageddon gates. Incrementing the
  existing byte at that return does not move those boundaries or visit an earlier
  flight owner twice. No other state or object counter owner is changed.

The fix restores only the missing counter increment, modulo 256. It does not call
`stepLivePhysics` or `stepLivePerson`, add RNG consumption, reset to global time,
introduce a visitation stamp, or implement the remaining state-14 controller.
Preparation, reaction, physics and periodic state-14 facing remain incomplete.
These are retained decompiler exports, not newly executed native-game evidence.

## Focused regression and limits

`tests/ai-reservation-counter.test.mjs` supplies a reserved ordinary person through
real initialization, then exercises the public fixed-turn entry point. It checks
one increment per logical visit, fractional-time and catch-up behavior, byte wrap,
object-cell/path aliases, AI reservation/release followed by the existing movement
owner, public selection independence, prior flight ownership and pause/dead gates.
The held-person case verifies unchanged RNG. Its supplied state is a narrow
scheduler regression, not a campaign acceptance witness.

The original test run on main `eb69ebd3c9ccef7c7739d61bc7f8eaa2c162fc44`
failed the three missing-visit cases and passed the three guard/control cases.
The minimal increment makes all six pass. A serial focused run of this file plus
player selection, selection recounts, deselection and logical-animation tests
passes 29/29. Source-bound raw RED/GREEN and passing-neighbor receipts are retained outside
tracked source. Full checks, build, browser and native execution
were not run for this local candidate; they remain separate acceptance gates.

This gap was exposed while diagnosing PR455. A short paired M3 prefix showed the
canonical builder retaining a four-visit deficit after AI reservation, but that
deficit does not change the first arrival test's parity. This counter repair is
not established as a fix for the Temple orientation or missing defender outcome.
PR455's integration blockers and all existing gameplay acceptance remain unchanged.
