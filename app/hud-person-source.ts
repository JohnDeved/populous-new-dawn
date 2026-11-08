import type { Unit, World } from './world-types.ts'
import { unitAnimationSource } from './unit-animation-source.ts'

// HUD reads share controller precedence without adopting a simulation owner.
// In particular, a boarded route supersedes a dormant native idle record, but
// not an active flight, fight, exceptional native state or building-entry owner.
export function hudPersonSource(w: World, u: Unit) {
  const active = unitAnimationSource(u),
    route = w.pathfinding.people.get(u.id),
    special = u.native && ![1, 10, 17, 19].includes(u.native.state) ? u.native : null,
    source =
      u.flight ??
      u.fight?.motion ??
      special ??
      u.entry?.person ??
      (route?.vehicle ? route : null) ??
      active ??
      u.native ??
      u.builder?.person ??
      route ??
      null
  return { active, source }
}
