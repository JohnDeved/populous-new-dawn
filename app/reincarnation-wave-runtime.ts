import type { Effect, Unit, World } from './world-types.ts'
import { teamForTribe } from './world-types.ts'
import { campaignPosition } from './campaign-runtime.ts'
import { effect, sound } from './world-effects.ts'
import { browserPosition } from './world-coordinates.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { levelStartHeight, stepLevelStartWave, type StartPoint } from './level-start.ts'
import {
  createLivePerson,
  initializeLivePanic,
  syncLivePersonCells,
  type LivePerson,
} from './live-people.ts'
import { objectsInCell } from './object-cells.ts'
import { damagePerson } from './person-update.ts'
import { maxHp } from './world-rules.ts'
import { unitKindFromModel } from './unit-kinds.ts'
import {
  burnSiteWaveScenery,
  finishSiteWaveTerrain,
  inSiteWaveCell,
  siteWaveEffects,
} from './site-wave-effects.ts'

// The class7 preinitializer raises to ground before the site initializer rounds
// to the nearest64, ties down, and clamps64..1024. Rounding may lower the result.
export function reincarnationWaveHeight(saved: number, ground: number) {
  return levelStartHeight(Math.max(saved, ground))
}

export function reincarnationWaveAffects(
  p: { class: number; model: number; tribe: number; state: number },
  tribe: number
) {
  return (
    p.class === 1 &&
    p.tribe !== -1 &&
    p.tribe !== 255 &&
    p.tribe !== tribe &&
    p.model > 1 &&
    p.model < 7 &&
    p.state !== 26
  )
}

// The model12 producer calls this once at remaining6. Failure or a busy tribe
// consumes that opportunity; the ordinary body/spawn timer remains its owner.
export function createReincarnationWave(
  w: World,
  tribe: number,
  allocate: (point: StartPoint) => Effect | undefined = point =>
    effect(w, 'trail', browserPosition(point))
) {
  // Old saves lacked a separate saved-site height. Reuse retained startup state
  // when present; otherwise keep their existing authored-site/ground fallback.
  const site = (w.reincarnationSites[tribe] ??= {
      ...(w.levelStart.find(start => start.tribe === tribe)?.center ??
        nativePosition(w, campaignPosition(w, teamForTribe(tribe)))),
    }),
    fx = allocate({ ...site })
  if (!fx) return
  if (w.castingTribes[tribe].flags & 1) {
    // Native allocation succeeds before the busy initializer deletes its record.
    w.effects.splice(w.effects.indexOf(fx), 1)
    return
  }
  site.h = reincarnationWaveHeight(site.h, terrainPointHeight(w.land, site))
  w.castingTribes[tribe].flags |= 1
  fx.duration = Infinity
  fx.height = site.h / 45
  fx.reincarnationWave = {
    id: fx.id,
    tribe,
    mode: 2,
    center: { ...site },
    visits: 0,
    terrainRadius: 0,
    visualRadius: 0,
    orbits: [],
  }
  sound(w, 158, browserPosition(site))
  return fx
}

function affectPerson(w: World, u: Unit, p: LivePerson, tribe: number) {
  if (!reincarnationWaveAffects(p, tribe)) return
  p.life = Math.round(u.hp * 20)
  // Protected transitions still receive damage, including repeated search cells.
  initializeLivePanic(w, u, p, false, 'preserve')
  damagePerson(p, w.levelFlags2, tribe, Math.floor(maxHp(unitKindFromModel(p.model)) * 10))
  u.hp = p.life / 20
}

export function stepReincarnationWave(w: World, fx: Effect) {
  const wave = fx.reincarnationWave
  if (!wave) return
  const changed = new Set<number>(),
    units = new Map(w.units.map(u => [u.id, u])),
    registered = syncLivePersonCells(w)
  const alive = stepLevelStartWave(
    w.land,
    wave,
    siteWaveEffects(w, wave.tribe, changed, cell => {
      // Swamps use the existing effect store rather than the person-cell chain.
      // Removing one must not skip a linked person or let that old effect run later.
      for (const swamp of w.effects)
        if (swamp.swamp && swamp.age < swamp.duration && inSiteWaveCell(w, cell, swamp))
          swamp.duration = swamp.age
      for (const object of objectsInCell(w.objectCells, cell)) {
        const u = units.get(object.id)
        if (u) affectPerson(w, u, object as LivePerson, wave.tribe)
      }
      // Unmigrated browser people have no native cell record yet. Only an actual
      // hit hands them to the native panic owner; unrelated people are untouched.
      for (const u of [...w.units].reverse())
        if (!registered.has(u.id) && u.hp > 0 && u.inside === null && inSiteWaveCell(w, cell, u)) {
          const p = u.builder?.person ?? createLivePerson(w, u)
          affectPerson(w, u, p, wave.tribe)
          if (u.native === p) registered.set(u.id, p)
        }
      return burnSiteWaveScenery(w, cell)
    })
  )
  finishSiteWaveTerrain(w, changed)
  if (!alive) {
    w.castingTribes[wave.tribe].flags &= ~1
    fx.duration = fx.age
  }
}
