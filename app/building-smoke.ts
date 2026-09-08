import { setAnimationObject, type AnimatedUnit } from './animation.ts'
import { random } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

type Ground = Pick<NativeTerrain, 'heights' | 'flags'>
export interface BuildingSmoke extends AnimatedUnit {
  x: number
  y: number
  h: number
  lifetime: number
  scaleX: number
  scaleY: number
  flags2: number
  flags4: number
}

// Effect 76, 0x5119d0: a looping HFX1345–1360 cloud, initially 1/16 size.
// Damage callers replace lifetime after allocation; initialization still consumes RNG.
export function createBuildingSmoke(
  land: Ground,
  point: { x: number; y: number },
  rng: { randomState: number }
): BuildingSmoke {
  const smoke: BuildingSmoke = {
    x: point.x,
    y: point.y,
    h: terrainPointHeight(land, point),
    lifetime: (random(rng) & 63) + 96,
    scaleX: 16,
    scaleY: 16,
    flags2: 0,
    flags4: 0,
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
  setAnimationObject(smoke, 48, 1345)
  smoke.renderFlags |= 0x200
  return smoke
}

// Complete 0x50be00: size ramps up, holds, then shrinks during the last 16 turns.
// A negative lifetime is permanent. Terrain invalidation re-grounds the cloud.
export function stepBuildingSmoke(land: Ground, smoke: BuildingSmoke) {
  if (smoke.renderFlags & 0x200) {
    if (smoke.lifetime < 16) {
      smoke.scaleX = ((smoke.lifetime * 16) << 16) >> 16
      smoke.scaleY = smoke.scaleX
    } else if (smoke.scaleX <= 255) {
      const grown = ((smoke.scaleX + 16) << 16) >> 16
      smoke.scaleX = Math.max(0, Math.min(256, grown))
      smoke.scaleY = smoke.scaleX
    }
  }
  smoke.flags4 &= ~0x400000
  if (smoke.flags2 & 4) {
    smoke.h = terrainPointHeight(land, smoke)
    smoke.flags4 &= ~0x400
    smoke.flags2 &= ~4
  }
  if (smoke.lifetime < 0) return true
  smoke.lifetime--
  return smoke.lifetime > 0
}
