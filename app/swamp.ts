import { random } from './native-math.ts'
import type { NativeTerrain } from './native-terrain.ts'
import rules from './original-rules.json' with { type: 'json' }

type Position = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'cliffs' | 'categories'>

export interface Swamp {
  center: Position
  tribe: number
  counter: number
  remaining: number
  kills: number
  variant: number
}

export interface SwampTarget {
  id: number
  class: number
  flags2: number
  flags4: number
  attached: number
  immune: boolean
}

const indexOf = (cell: number) => ((cell >>> 9) & 127) * 128 + ((cell & 254) >>> 1)

export function createSwamp(
  center: Position,
  tribe: number,
  counter: number,
  game: { randomState: number }
): Swamp {
  return {
    center: { x: center.x & 65535, y: center.y & 65535, h: center.h },
    tribe,
    counter: counter & 255,
    remaining: 32000,
    kills: 0,
    variant: random(game) & 3,
  }
}

// Input is oldest first. Native scans newest first, so ties discard the new trap.
export function excessSwamp(swamps: Swamp[]) {
  if (swamps.length <= 29) return null
  let oldest = swamps.at(-1)!
  for (let i = swamps.length - 1; i >= 0; i--)
    if (swamps[i].remaining < oldest.remaining) oldest = swamps[i]
  return oldest
}

// 0x511400: persistent effect model 18, spawned by spell model 11.
export function stepSwamp(
  land: Ground,
  swamp: Swamp,
  special: boolean,
  effects: {
    cell: (cell: number) => Iterable<SwampTarget>
    kill: (target: SwampTarget) => void
    remove: (target: SwampTarget) => void
    sound: () => void
  }
) {
  if (!--swamp.remaining) return false
  effects.sound()
  if (special || (swamp.counter & 3)) return true

  const center = ((swamp.center.x >>> 8) & 254) | (swamp.center.y & 0xfe00)
  let invalid = 0
  for (let y = -2; y <= 2; y += 2)
    for (let x = -2; x <= 2; x += 2) {
      const cell = (((center & 255) + x) & 255) | ((((center >>> 8) + y) & 255) << 8),
        index = indexOf(cell)
      if (land.cliffs[index] >= 128 || rules.terrainCategoryFlags[land.categories[index] & 15] & 2)
        invalid++
      for (const target of effects.cell(cell)) {
        if (
          target.class !== 1 ||
          target.flags2 & 2 ||
          target.attached ||
          target.flags4 & 0x400 ||
          target.immune ||
          target.flags2 & 0x100000
        )
          continue
        if (target.flags4 & 0x800) effects.remove(target)
        else {
          effects.kill(target)
          if (++swamp.kills >= 10) return false
        }
      }
    }
  return invalid <= 4
}
