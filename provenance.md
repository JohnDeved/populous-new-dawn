# Cadence provenance and current-source correspondence

Issue214 remains open. The visual report is not dismissed by a consistent clock.
No precise animation-family defect or justified replacement frequency was
established by this bounded audit. A calibrated original reference and the reported
browser's speed/example remain the useful next discriminator. No production
application change was made.

## Where 24Hz entered the live code

This is a bounded ancestor-history check through reported source
`596475b6839c948604897f8b68ff89c6290cf39d`, not a search of unrelated recovery or
evidence branches.

1. [`7f4d820642a0fd0e00dee39da9b6ee2687e48760`](https://github.com/JohnDeved/populous-new-dawn/commit/7f4d820642a0fd0e00dee39da9b6ee2687e48760), September7,
   introduced the separate flyby adapter: elapsed1/24 calls
   `stepFlyby(...,24)`. Its adjacent comment explicitly leaves original frame
   throttling unported. This is a flyby choice, not ordinary sprite cadence proof.
2. [`d0592ca5177374cfb7e3bd8c099cbbc6d57e8344`](https://github.com/JohnDeved/populous-new-dawn/commit/d0592ca5177374cfb7e3bd8c099cbbc6d57e8344), September8,
   added native animation updater/setter proof. Its research explicitly says the
   two animation steps per controller turn are a supplied test schedule, not
   evidence that native rendering always runs at twice simulation rate. Original
   rate-byte configuration and render-stamp catch-up were left open.
3. [`de786a66dd8a5ea87c7ceb5515abc4a13beef3fe`](https://github.com/JohnDeved/populous-new-dawn/commit/de786a66dd8a5ea87c7ceb5515abc4a13beef3fe), September8,
   first wired native follower records into visible frame selection. It adds
   `personAnimationTime += dt` and a1/24 loop calling `animateLivePeople` after
   rendering. The helper says “selected24Hz” and immediately qualifies native rate
   configuration and visibility catch-up as pending. The originating change does
   not provide an ordinary-game original wall-clock/config/reference measurement.
4. [`09f2fd96a6adc0d310e70a04b397943da1c14769`](https://github.com/JohnDeved/populous-new-dawn/commit/09f2fd96a6adc0d310e70a04b397943da1c14769), September9,
   extracts `game-clock.ts` and preserves that1/24 interval while interleaving
   simulation/animation and retaining elapsed time. This fixes render-rate
   dependence and order; its passing consistency tests do not independently
   establish the correct absolute rate.

The evidence therefore identifies a documented adapter choice. It does not prove
that12,20,24 or40Hz is the correct blanket replacement. A direct constant change
would also alter presentation fields read by gameplay controllers.

## Remaining native boundary

Original `004ee7b0` uses per-descriptor counters and direct frame-chain indexing.
Its mode1/2/4 visibility gates compare object stamp `+0x18` with the global
presentation counter unless flags3 bit0x40000 is clear. The live adapter passes
counter0 and explicitly leaves native visibility/configuration catch-up pending.
Per-visit arithmetic equivalence must remain separate from that caller ownership.

The command27 final-prayer-frame hold in `animateLiveObjects` is another explicit
adapter: the12-Hz controller otherwise can miss a last frame between24-Hz updates.
Changing cadence needs that interaction reviewed; it is not merely a cosmetic
multiplier isolated from gameplay.

Original main-loop exports distinguish the independent simulation deadline from
draw limiter requests and blocking/readiness/presentation work. The startup draw
cap defaults to40 and can be configured12..60; flyby/acquisition/recording limiter
bits request24/20/14. A requested cap is not achieved wall-clock sprite speed.
Separate native tracing owns those remaining OS/presentation/config boundaries.

## Source adoption to merged main71

The new clean audit checkout is pinned to
`71b3860e7025a9534d56248c194aa18610b5df4d`, tree
`397a0e31a5232fa479e8d0972a4a929343ecec67`.
[Exact correspondence hashes](adoption/identity.json) and the
[bounded relevant diff](adoption/relevant-source.patch) retain the comparison.
This is source adoption only. No browser run, profile migration or acceptance
claim is transferred from596 to71.

Unchanged bytes include animation setters/updater, `animateLiveObjects`, unit
source selection, `scene-effects.ts`, hut smoke runtime/frame selection, imported
unit/rule data and package lock. The Scene RAF dt formula and24-Hz object update
block remain the same. PR211 adds separate worship UI deadlines and turn-boundary
subdivision; the hook is installed even when no acquisition is active. The UI
continues its allowed visible-pause visits while object animation remains paused.
Those new ordering boundaries have their own reviewed acquisition acceptance and
do not constitute a new global sprite-rate proof.

## Game-speed and fallback families

- New games start at speed1; the public button toggles1/2. These behaviors are
  unchanged between596 and71. Checkpoints clone/restore the complete World,
  including speed; restart constructs a new speed1 World.
- `tick(elapsed * world.speed)` scales simulation. Native unit/world-effect
  animation visits and hut-root frame increments remain24 per active wall second.
- Fallback unit frames use `floor(gameAge *12)`. Generic fallback effects use
  `floor(effect.age *12)`, with age advanced by1/12 each simulation turn.
  Combat hit and generic death-smoke paths can use that owner. Fixed sprites and
  `blastShot` take their explicitly supplied frame. Those families were not
  established by the opening's native-backed correspondence count.
- Tornado smoke chooses `(world.turn + particleIndex) % sequenceLength`; scenery
  fire advances its artwork index in its turn consumer. These accelerate with
  simulation speed. Their frame clocks were not sampled by this baseline.
- The spell-range halo is separate: `updatePointerFrame` supplies
  `floor(RAFtimestamp *12/1000)` and its visibility checks do not test pause. It can
  therefore remain animated while paused. The observed baseline had no active
  halo. This owner fact is not established as an original-parity defect.

These mixed owners explain why a global rate edit or one passing paused sample
cannot stand for every sprite family. All remaining families and the original
absolute-rate comparison remain explicit acceptance gaps.
