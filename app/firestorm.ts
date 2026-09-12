import { random } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

type Position = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'heights' | 'flags'>

export interface Firestorm {
  center: Position
  tribe: number
  remaining: number
  armed: boolean
}

export interface FirestormShot {
  origin: Position
  target: Position
}

const short = (n: number) => (n << 16) >> 16

export function createFirestorm(center: Position, tribe: number): Firestorm {
  return {
    center: { x: center.x & 65535, y: center.y & 65535, h: short(center.h) },
    tribe,
    remaining: 220,
    armed: false,
  }
}

// 0x511640: effect model 22, spawned by spell model 8.
export function stepFirestorm(
  land: Ground,
  firestorm: Firestorm,
  game: { randomState: number },
  emit: (shot: FirestormShot) => void
) {
  if (!--firestorm.remaining) return false
  if (!firestorm.armed) {
    firestorm.armed = true
    return true
  }
  if (firestorm.remaining & 3) return true

  const x = (firestorm.center.x + (random(game) % 0xc00) - 0x600) & 65535,
    y = (firestorm.center.y + (random(game) % 0xc00) - 0x600) & 65535
  emit({
    origin: { x, y, h: 0x4b0 },
    target: { x, y, h: short(terrainPointHeight(land, { x, y }) - 20) },
  })
  return true
}
