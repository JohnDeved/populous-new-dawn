import { teamForTribe, type Effect, type World } from './world-types.ts'
import { effect, moveVisual, registerTerrainLight } from './world-effects.ts'
import { browserPosition } from './world-coordinates.ts'
import { setAnimationObject } from './animation.ts'
import { queueTerrain, processTerrain, updateWalkMasks } from './native-terrain.ts'
import {
  nativePosition,
  notifyHeightChanges,
  refreshTerrainSurface,
  terrainTextures,
} from './world-terrain-runtime.ts'
import type { StartPoint, stepLevelStartWave } from './level-start.ts'
import rules from './original-rules.json' with { type: 'json' }
import models from './original-models.json' with { type: 'json' }

export function animatedSiteEffect(
  w: World,
  p: StartPoint,
  sequence: string,
  object: number,
  draw: number,
  turns: number
): Effect {
  const fx = effect(w, 'trail', browserPosition(p))
  fx.height = p.h / 45
  fx.sprite = { sequence, frame: 0 }
  fx.turnsRemaining = turns
  fx.duration = Infinity
  fx.animation = {
    object: 0,
    draw: 0,
    morph: 0,
    palette: 0,
    renderFlags: 0,
    f1: 0,
    f2: 0,
    stamp: 0,
    flags3: 0,
    morphTimer: 0,
    morphFrames: 0,
  }
  setAnimationObject(fx.animation, draw, object)
  return fx
}

// Both site-wave modes share particle, lighting and terrain presentation. Their
// person/cell consumers remain with the caller so startup never acquires mode2.
export function siteWaveEffects(
  w: World,
  tribe: number,
  changed: Set<number>,
  cell: (packed: number) => boolean
): Parameters<typeof stepLevelStartWave>[2] {
  return {
    orbit: (point, light) => {
      const fx = animatedSiteEffect(w, point, 'sparkle', 1288, 44, 32767)
      delete fx.turnsRemaining
      if (light) registerTerrainLight(w, fx, 1)
      return fx.id
    },
    cell,
    terrain: packed => changed.add(packed),
    sparkle: point => {
      const fx = animatedSiteEffect(w, point, 'hit', 1294, 46, 6)
      fx.team = teamForTribe(tribe)
    },
    move: (id, point, displacement) => {
      const fx = w.effects.find(f => f.id === id)
      if (fx) {
        moveVisual(fx, point)
        fx.animation!.flags3 |= 0x300
        fx.animation!.displacement = { ...displacement }
      }
    },
    remove: id => {
      const fx = w.effects.find(f => f.id === id)
      if (fx) fx.duration = fx.age
    },
  }
}

export function inSiteWaveCell(w: World, cell: number, point: { x: number; z: number }) {
  const p = nativePosition(w, point)
  return (((p.x >>> 8) & 254) | (p.y & 0xfe00)) === cell
}

export function burnSiteWaveScenery(w: World, cell: number) {
  let pending = false
  for (const tree of w.trees)
    if (
      tree.logs > 0 &&
      inSiteWaveCell(w, cell, tree) &&
      !(rules.sceneryFlags[tree.model] & 0x200)
    ) {
      pending = true
      if (rules.sceneryFlags[tree.model] & 0x20 && !tree.burn)
        tree.burn = {
          remaining: 76,
          started: false,
          wood: Math.round(tree.logs * 100),
          scale: models[(tree.model + 12) as unknown as keyof typeof models].scale,
        }
    }
  return pending
}

export function finishSiteWaveTerrain(w: World, changed: Set<number>) {
  if (!changed.size) return
  for (const cell of changed) queueTerrain(w.land, cell, 2, 1, terrainTextures)
  processTerrain(w.land, terrainTextures)
  for (const cell of changed) updateWalkMasks(w.land, cell, 2)
  refreshTerrainSurface(w)
  notifyHeightChanges(
    w,
    [...changed].map(cell => ({ cell, radius: 1 }))
  )
}
