import { random } from './native-math.ts'
import type { NativeTerrain } from './native-terrain.ts'

type Position = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'heights'>
type Record = { height: number; slope: number; next: number; flow: number }

export interface Erosion {
  center: Position
  remaining: number
}

const fixed = (a: number, b: number) => Number((BigInt(a | 0) * BigInt(b | 0)) >> BigInt(16)) | 0,
  indexOf = (cell: number) => (cell >>> 9) * 128 + ((cell & 254) >>> 1),
  neighbors = [
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const

// 0x4983a0: native radius-4 drainage and erosion pass.
function erode(land: Ground, center: number, rng: { randomState: number }) {
  const size = 8,
    startX = ((center & 255) - 8) & 255,
    startY = ((center >>> 8) - 8) & 255,
    records: Record[] = []
  let maximum = -99999
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let height =
        land.heights[indexOf(((startX + x * 2) & 255) | (((startY + y * 2) & 255) << 8))] << 16
      if (height <= maximum && height < 1) height = -0x320000
      maximum = Math.max(maximum, height)
      records.push({ height, slope: -1, next: -1, flow: 0 })
    }
  if (maximum <= 0) return false

  for (let y = 1; y < size - 1; y++)
    for (let x = 1; x < size - 1; x++) {
      const current = records[y * size + x]
      let best = -99999,
        next = -1
      for (let i = 0; i < neighbors.length; i++) {
        const [dy, dx] = neighbors[i],
          neighbor = (y + dy) * size + x + dx,
          delta =
            i < 4
              ? current.height - records[neighbor].height
              : fixed(current.height - records[neighbor].height, 0xb505)
        if (delta > best) {
          best = delta
          next = neighbor
        }
      }
      current.slope = best
      current.next = next
    }

  let maxFlow = 0
  for (let upper = maximum; upper >= 0; upper -= 0x20000)
    for (let y = 1; y < size - 1; y++)
      for (let x = 1; x < size - 1; x++) {
        const current = records[y * size + x]
        if (current.height <= upper && current.height > upper - 0x20000 && current.slope >= 0) {
          const next = records[current.next]
          next.flow += current.flow + 1
          maxFlow = Math.max(maxFlow, next.flow)
        }
        maxFlow = Math.max(maxFlow, current.flow)
      }

  const normalizer = maxFlow > 0 ? Math.trunc(0x100000000 / (maxFlow * 0x10000)) : 0
  for (let y = 1; y < size - 1; y++)
    for (let x = 1; x < size - 1; x++) {
      const current = records[y * size + x]
      if (current.height <= 0 || current.slope < 0) continue
      let drainage = 0
      if (current.flow > 1) {
        drainage = fixed(current.flow << 16, normalizer) + 0x8000
        drainage = fixed(drainage, current.slope)
        drainage = fixed(drainage, 50000)
        drainage = fixed(drainage, (random(rng) & 0x7fff) + 0xc000)
      }
      const sediment = fixed(fixed(current.slope, 4000), (random(rng) & 0x7fff) + 0xc000)
      current.height = (current.height - drainage - sediment) | 0
      records[current.next].height = (records[current.next].height + fixed(sediment, 0xc000)) | 0
    }

  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const record = records[y * size + x],
        cell = ((startX + x * 2) & 255) | (((startY + y * 2) & 255) << 8)
      land.heights[indexOf(cell)] = Math.max(0, record.height) >>> 16
    }
  return true
}

export function createErosion(center: Position): Erosion {
  return { center: { x: center.x & 65535, y: center.y & 65535, h: center.h }, remaining: 64 }
}

// 0x50ff30: effect model 23, spawned by spell model 10.
export function stepErosion(
  land: Ground,
  erosion: Erosion,
  game: { randomState: number },
  effects: { sound: () => void; terrain: (cell: number) => void }
) {
  if (!--erosion.remaining) return false
  effects.sound()
  let cell = ((erosion.center.x >>> 8) & 254) | (erosion.center.y & 0xfe00)
  cell =
    (((cell & 255) + (random(game) & 7) - 4) & 255) |
    ((((cell >>> 8) + (random(game) & 7) - 4) & 255) << 8)
  if (erode(land, cell, game)) effects.terrain(cell)
  return true
}
