import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { random, nativeAngle, nativeStep } from './native-math.ts'
import models from './original-models.json' with { type: 'json' }
import artwork from './original-fire.json' with { type: 'json' }
import { modelStage } from './model-faces.ts'
import { timberScale } from './timber.ts'

type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'categories'>
const short = (n: number) => (n << 16) >> 16

export interface SceneryFire {
  x: number
  y: number
  h: number
  scale: number
  maxScale: number
  growth: number
  remaining: number
  frame: number
  heading: number
  groundDirty: boolean
  soundPlaying: boolean
  hidden: boolean
  smokeOnExpiry: boolean
  suppressEmbers: boolean
  expiring: boolean
}

// 0x4a6b20, after allocation: original model 5 and ANIBL record 1.
export function createSceneryFire(
  land: Ground,
  position: { x: number; y: number },
  options: { size: number; snap: boolean; smoke: boolean },
  cosmetic: { randomState: number }
): SceneryFire {
  const x = options.snap ? (position.x & 0xfe00) + 256 : position.x & 65535
  const y = options.snap ? (position.y & 0xfe00) + 256 : position.y & 65535
  const maxScale = Math.trunc(Math.imul(models[5].scale, options.size) / 16)
  return {
    x,
    y,
    h: terrainPointHeight(land, position),
    scale: 1,
    maxScale,
    growth: short(Math.trunc(maxScale / 10)),
    remaining: 0,
    frame: random(cosmetic) & 7,
    heading: 0,
    groundDirty: false,
    soundPlaying: false,
    hidden: false,
    smokeOnExpiry: options.smoke,
    suppressEmbers: false,
    expiring: false,
  }
}

// 0x4eebc0 faces a point 0x4000 behind the native camera's map position.
export function fireHeading(fire: SceneryFire, camera: { x: number; y: number; angle: number }) {
  const eye = nativeStep({ x: camera.x / 256, z: -camera.y / 256 }, camera.angle + 1024, 0x4000)
  return nativeAngle(
    short(Math.round(eye.x * 256) - fire.x),
    -short(Math.round(-eye.z * 256) - fire.y)
  )
}

export interface BurningTree {
  remaining: number
  started: boolean
  wood: number
  scale: number
}

// Tree path of 0x4a7bd0/0x4a79f0. The caller owns the scenery record and replanting.
export function stepBurningTree(
  tree: BurningTree,
  maxWood: number,
  modelScale: number,
  ignite: () => void
) {
  if (!tree.started) {
    tree.started = true
    ignite()
    return true
  }
  tree.remaining = short(tree.remaining - 1)
  if (tree.remaining < 0) return false
  if (tree.wood > 7) {
    tree.wood = Math.max(0, Math.min(maxWood, tree.wood - 4))
    if (tree.wood < 100) return false
    tree.scale = timberScale(tree.wood, maxWood, modelScale)
  }
  return true
}

// 0x4a8c60: short-lived fires start at full size or use a shortened growth phase.
export function setFireLifetime(fire: SceneryFire, turns: number) {
  turns = short(turns)
  fire.remaining = turns
  if (turns < 1 || turns > 38) return
  if (turns < 28) {
    fire.scale = fire.maxScale
    fire.growth = short(-Math.trunc(fire.maxScale / turns))
  } else if (turns > 29) {
    fire.growth = short(Math.trunc(fire.maxScale / (turns - 28)))
  } else {
    fire.scale = fire.maxScale
    fire.growth = 0
  }
}

// 0x4a7170. The caller supplies current visibility/facing and object allocation.
export function stepSceneryFire(
  land: Ground,
  fire: SceneryFire,
  rng: { randomState: number },
  callbacks: {
    isLand: () => boolean
    sound: () => void
    ember: (p: { x: number; y: number; h: number }, speed: number, flags: number) => void
    smoke: () => void
  }
) {
  if (!fire.hidden && !fire.soundPlaying) callbacks.sound()
  if (fire.groundDirty) {
    fire.h = terrainPointHeight(land, fire)
    fire.groundDirty = false
    if (!callbacks.isLand()) fire.remaining = 10
  }
  fire.frame = (fire.frame + 1) % artwork.frames.length
  let alive = true
  let smoke = false
  if (fire.remaining !== 0) {
    fire.remaining = short(fire.remaining - 1)
    fire.expiring = true
    if (fire.remaining < 29) {
      smoke = fire.remaining === 4
      if (fire.growth >= 0) fire.growth = short(Math.trunc(fire.maxScale / -28))
      if (fire.remaining === 0) {
        fire.growth = 0
        alive = false
      }
    }
  }
  if (fire.growth !== 0) {
    fire.scale = (fire.scale + fire.growth) | 0
    if (fire.growth < 0) fire.scale = Math.max(1, fire.scale)
    else if (fire.scale >= fire.maxScale) {
      fire.scale = fire.maxScale
      fire.growth = 0
    }
  }
  if (!fire.suppressEmbers) {
    const x = (fire.x + (random(rng) & 63) - 32) & 65535
    const y = (fire.y + (random(rng) & 63) - 32) & 65535
    callbacks.ember(
      { x, y, h: short(fire.h + 110) },
      (random(rng) & 31) + 4,
      fire.remaining === 0 ? 0x20000 : 0
    )
  }
  if (smoke && fire.smokeOnExpiry) callbacks.smoke()
  return alive
}

const fireModelUV = modelStage(models[5], 4).uv

// Per-object ANIBL texture frame on the original fire mesh.
export function fireUV(frame: number) {
  const { 5: model } = models
  const uv = [...fireModelUV]
  const tile = artwork.frames[frame]
  let vertex = 0
  model.tiles.forEach((source, face) => {
    if (!model.modes[face]) return
    const count = model.faces[face * 2] === 3 ? 3 : 6
    if (source === artwork.tile) {
      for (let i = vertex; i < vertex + count; i++) {
        uv[i * 2] += ((tile % 8) - (source % 8)) / 8
        uv[i * 2 + 1] -= ((tile >> 3) - (source >> 3)) / 32
      }
    }
    vertex += count
  })
  return uv
}
