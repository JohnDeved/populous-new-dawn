import { movePosition, positionDistanceSquared } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

type Position = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'heights' | 'flags'>
type Orbit = Position & { id: number; angle: number; spin: number }

export interface Flatten {
  center: Position
  targetHeight: number
  remaining: number
  terrainRadius: number
  visualRadius: number
  expansionBudget: number
  orbits: Orbit[]
}

const offsets = [
  [0, 0],
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [2, 1],
  [2, 0],
  [2, -1],
  [2, -2],
  [1, -2],
  [0, -2],
  [-1, -2],
  [-2, -2],
  [-2, -1],
  [-2, 0],
  [-2, 1],
  [-2, 2],
  [-1, 2],
  [0, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 2],
  [3, 1],
  [3, 0],
  [3, -1],
  [3, -2],
  [2, -3],
  [1, -3],
  [0, -3],
  [-1, -3],
  [-2, -3],
  [-3, -2],
  [-3, -1],
  [-3, 0],
  [-3, 1],
  [-3, 2],
  [-2, 3],
  [-1, 3],
] as const

export function createFlatten(land: Ground, center: Position): Flatten {
  center = { x: center.x & 65535, y: center.y & 65535, h: terrainPointHeight(land, center) }
  return {
    center,
    targetHeight: center.h,
    remaining: 15,
    terrainRadius: 0,
    visualRadius: 0,
    expansionBudget: 5120,
    orbits: [],
  }
}

// 0x5126a0 / 0x512700: effect model 31, spawned by spell model 15.
export function stepFlatten(
  land: Ground,
  flatten: Flatten,
  effects: {
    orbit: (position: Position, sunlight: boolean) => number | null
    sparkle: (position: Position, angle: number) => void
    move: (id: number, position: Position, spin: number) => void
    remove: (id: number) => void
    terrain: (cell: number) => void
  }
) {
  if (!flatten.terrainRadius) {
    flatten.terrainRadius = 380
    for (let i = 0; i < 32; i++) {
      const id = effects.orbit(flatten.center, i % 5 === 0)
      if (id !== null) flatten.orbits.push({ ...flatten.center, id, angle: i * 64, spin: 0 })
    }
  }
  const center = ((flatten.center.x >>> 8) & 254) | (flatten.center.y & 0xfe00),
    radiusSquared = flatten.terrainRadius * flatten.terrainRadius
  for (const [x, y] of offsets) {
    const cell = (((center & 255) + x * 2) & 255) | ((((center >>> 8) + y * 2) & 255) << 8),
      position = { x: (cell & 254) << 8, y: cell & 0xfe00 }
    if (positionDistanceSquared(flatten.center, position) > radiusSquared) continue
    const index = (cell >>> 9) * 128 + ((cell & 254) >>> 1),
      current = land.heights[index],
      difference = flatten.targetHeight - current
    if (difference)
      land.heights[index] = Math.max(
        0,
        Math.min(1024, current + Math.trunc(difference / flatten.remaining))
      )
  }
  effects.terrain(center)
  for (const orbit of flatten.orbits) {
    effects.sparkle(orbit, orbit.angle)
    const position = { ...flatten.center }
    movePosition(position, orbit.angle, flatten.visualRadius)
    Object.assign(orbit, position, {
      angle: (orbit.angle + 91) & 2047,
      spin: (orbit.spin + 216) & 2047,
    })
    effects.move(orbit.id, orbit, orbit.spin)
  }
  const delta = Math.trunc(flatten.expansionBudget / flatten.remaining)
  flatten.terrainRadius += delta
  flatten.visualRadius += delta
  flatten.expansionBudget -= delta
  if (--flatten.remaining) return true
  for (const orbit of flatten.orbits) effects.remove(orbit.id)
  return false
}
