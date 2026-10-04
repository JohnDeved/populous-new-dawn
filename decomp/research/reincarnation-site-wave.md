# Ordinary reincarnation site wave (#30)

This bounded repair is separate from command18 startup and from the already
accepted model12 body/spirit presentation. It does not complete issue #30.

## Composed original evidence before implementation

Base `f78e5c17757ce061b8b159da150536ee690e6b6f` still emitted generic browser
`birth` at the ordinary reincarnation rise boundary. That is a sixteen-visit
model60 sprite; the original producer creates a class7/model8 site wave.

The evidence probe executes original `005029d0`, real allocator `004ed8a0`, its
`004ed580` → `00509c10` → `0050bcd0` → `0050c780` chain, mode setter `0050c830`,
wave `0050c840`, real class/person initializer `004ed640` → `004d2740`, and actual
damage `004da080`. The original main loop `004ec6f0` additionally proves the first
cross-class processing visits. No damage/state initializer is mocked. Rendering,
terrain notifications, sound-device operations, final removal, formation/motion
world consumers, and unrelated main-loop processors are supplied. This is bounded
original PE execution in Unicorn, not an original-game replay.

Inputs: original EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, shipped
`levels/constant.dat` configured through its own descriptor table, and
`data/mwsearch.dat` SHA256
`0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0`.
The existing [startup evidence](level-start-sequence.md) independently compares the
shared 21-visit terrain/radius/orbit geometry at 32 wrapped positions.
Indexed allocator, wave, state initializer and damage exports were reused. The old
00502910/005029d0 scratch exports were unavailable; their producer/classifier bytes
were read directly from the pinned PE, alongside the executable probe and earlier
model12 lifecycle checks. No new Ghidra export was needed.

## Observed contract

- Model12 phase4 tests timer5 **before** decrement, source classifier+0x75==7, absent live
  Shaman, and surviving tribe population. It supplies saved tribe+0x911 XYZ to
  class7/model8 allocation and sets mode2 only on a nonzero result. The browser
  equivalent is remaining6; the first spawn request is five model12 visits later.
- The model12 initializer copies the source model to +0x74 and derives a separate
  Shaman classifier at +0x75 (7 for source model7;1 otherwise). The producer
  checks the classifier. A negative fixture must set both consistently; merely
  changing +0x74 leaves an intentionally Shaman-classified record.
- The real effect preinitializer first raises supplied height to current sampled
  ground when needed. `0050c780` then rounds to the nearest64 (ties down), clamps
  64..1024, and stores that value back in tribe+0x915. Saved/current-ground cases
  240/128→256, 128/641→640, −20/128→128, and 1024/1100→1024 execute this chain.
- Tribe busy flag1 admits one wave. A duplicate still consumes an allocation,
  is immediately removed, and receives the producer's mode2 bit on the returned
  inactive record. It does not sound or overwrite saved height. A failed
  allocation is not retried when the timer drops below5, even if capacity returns.
- Actual native list allocation prepends the wave. The main loop has cached the
  model12 next pointer, so the wave is first processed on the **next** turn.
  It then precedes the older model12 body. At the first spawn request, the wave
  has completed only five of its processing visits and must remain independent.
  The spawn leaf004da0f0 returns zero in this probe: this proves request timing,
  while actual successful Shaman spawning remains a live acceptance requirement.
- Mode1 converts neutral model1 Wildmen. Mode2 instead visits other-tribe,
  non-neutral class1 models2..6 whose state is not26. Friendly people, Wildmen,
  Shamans, and already-panicking people are unchanged. It does not apply Swarm's
  state23, flags2/0x800000, descriptor-immunity, ghost-removal, vehicle-ejection,
  or Spy-disguise rules.
- Unprotected eligible people enter real state26: previous state retained,
  timer64, speed110, panic heading and two gameplay RNG draws for the tested
  ordinary initial states. Damage is half the configured person's descriptor
  life: models2..6 use 500/900/550/300/350. Real `004da080` respects global damage
  suppression, Shield, Bloodlust and attacker credit. Shield still permits panic.
- Flags2/0x100000 prevents the state transition, **not damage**. Native search
  ring endpoints repeat. A protected Brave at the exact centered cell receives
  three 500-life hits in each of the first two wave visits; state26 naturally
  suppresses these repeats for ordinary people. Do not deduplicate cell visits.
- Shared terrain changes precede radius growth and orbit movement. An empty-cell
  lifetime uses32 model60 orbits,672 model61 sparkle allocations, sound158 once,
  no gameplay RNG, and33 final removals after21 visits; busy clears on final
  controller cleanup. Surviving scenery may extend the controller as documented
  in the startup evidence.

## Visited-cell Swamp cleanup

An additional18-case original probe covers modes0/1/2, owners0/1/255 and the first
radius boundary. Wave0050c840 removes class7/model18 in any included cell, without
an owner or mode check. Real004ef180 and004ee4f0 remove cell/global membership,
set class0 and removal flag1, and set counter3; only final lighting cleanup is
supplied. Removal follows that cell's terrain change and precedes orbit sparkles.
The removed record retains its next-cell handle, and the next linked enemy still
receives mode2 panic/damage. A neighboring model17 and out-of-radius Swamp survive.

The bounded browser repair includes this consumer for its new mode2 path. The
existing startup mode1 adapter's omission is explicitly retained; extracting shared
geometry/rendering does not silently change its conversion or cell consumers.

## Reproduction and limits

`python scripts/check-native-reincarnation-wave.py "$POPULOUS_EXE"` is read-only
with respect to tracked fixtures/assets. The development composed run passed in
0.52 seconds before runtime edits. The preceding outer-loop harness attempt
failed because a supplied terrain-notification leaf had two hooks and returned
twice; removing the duplicate hook fixed the harness without changing native code.
A later asserted producer gate exposed an inconsistent fixture that changed +0x74
but retained Shaman classifier+0x75; the corrected fixture follows the original
00502910 initializer and leaves both original routines unchanged.

The browser currently has an unbounded general effect allocation adapter. This
repair must preserve a one-shot allocation-result boundary and failure regression;
it must not invent a global pool limit or claim full native pool exhaustion parity.
Native helper composition, live normal-death acceptance, checkpoint continuation,
rendered pixels, and hardware performance are distinct claims.
