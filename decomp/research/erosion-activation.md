# Shrine Erosion activation

## Reviewed native boundary

Mission 3 DAT head row101 links row103, class7/model23. The
[accepted bounded proof](https://github.com/JohnDeved/populous-new-dawn/tree/d6e59a309c1c0cd72895e4152829f1bbd5509432)
executes the original allocation, initialization, field decoding, link resolution,
template suspension, cloning, head dispatch and cached-next scheduler traversal.
Its [independent review](https://github.com/JohnDeved/populous-new-dawn/blob/d6e59a309c1c0cd72895e4152829f1bbd5509432/review.md)
accepted the declared supplied-state scope.

The authored template starts state24/remaining64. `004edf50` suspends it to state0,
and the loader marks flags4 bit0x40000000. `004ede10` preserves the new allocation's
state24 while copying the template's countdown and other flags. The head directly
calls `004ed700` at `004fbb82`; Erosion processes immediately and returns
remaining63. `004ec6f0` caches its successor before the head call, so the newly
prepended clone is visited again only on the next traversal, ending remaining62.

With raw authored terrain and supplied RNG0x12345678, those calls yield RNG
1317931103 and 2870622653, respectively, and change 46 then 65 heights relative to
the input. Corresponding port controller calls match every height, RNG and
terrain-notification cell. The old shrine adapter delayed its first call until
the next turn. This is a bounded activation-order finding, not the cause of the
broader animation issue214 or a complete mixed-class cadence claim.

## Live integration and notifications

`world-turn.ts` now processes each new shrine Erosion immediately after
`createErosion`, before allocating the next authored target. It does not increment
the effect's age or change allocation/count behavior. The existing effect snapshot
still gives each new controller exactly one scheduled visit on the next turn.
The controller arithmetic in `erosion.ts` is unchanged.

Each new controller's terrain callback preserves the native call-site order:
queue radius6 with texture flag1, then notify radius6 before the next allocation.
The queue finishes once after shrine processing, updating walk masks and the
rendered/compatibility surface without repeating object notifications. Native
scheduler instruction `004ec9f5` calls `0044df40` after its object traversals;
`0044ddf0` also retains its 1024-entry overflow flush. This does not introduce a
per-target flush or move the port's existing active-effect batch.

The separate terrain adapters have existing probes
`check-native-terrain.py` and `check-native-terrain-notifications.py`. The bounded
activation proof intercepted those consumers and does not establish complete
object-consumer scheduling. The passive recorder must bind before activation:
the first after-turn observation now has remaining63, and removal is 63 later
turns after activation. Its previous remaining64 observation cannot capture the
new first call.

## Regression and scope

`tests/erosion-shrine-activation.test.mjs` checks:

- Mission3 activation and next-visit countdown, complete terrain hashes and RNG
  against the accepted native receipt; unchanged age/count; saved continuation
  and retirement without replay.
- Actual Mission10 eight-target link order on activation and newest-first order
  on the next visit. This is a port integration test, not a Mission10 native replay.
- Radius6 inclusion/exclusion, texture flag1, notifications before the next
  allocation while the queue is pending, and one deferred surface refresh.
- Repeated and exhausted rewards, with one initial call per successful reward.

The fixtures complete real level startup before stripping unrelated actors and
supplying terrain, RNG and completion. They are not ordinary gameplay captures.
The preserved failure-first receipt shows remaining64 instead of63 and no initial
notification; its separate mistaken 10-target fixture expectation was corrected to
the actual 8-target head before the passing candidate run.

The proof's supplied normal-mode flags, seed, pool and completion, every intercepted
leaf, both native attempts and port receipt remain in the immutable evidence
commit. Sound requests were intercepted without maintaining the owned-sound bit;
no playback cadence is established. `effect()` still lacks full native class7
allocation ownership and always returns an object: this change does not claim
allocation-failure parity. No parity credit, profile migration or broader mission
completion is claimed by this repair.
