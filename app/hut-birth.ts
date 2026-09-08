import { nativeStep } from './native-math.ts'
import {
  buildingInsidePoint,
  buildingOutsidePoint,
  type BuildingShapePose,
} from './building-shapes.ts'

const short = (n: number) => (n << 16) >> 16

interface BirthClock {
  counter: number
  timer: number
  birthPending?: boolean
}

// 0x404c80: admission is sampled every fourth building turn. A pending request
// consumed on another turn is discarded, including its accumulated work.
export function stepHutBirth(b: BirthClock, occupants: number, allowed: boolean, cost: number) {
  const sampled = (b.counter & 3) === 0
  if (sampled) {
    if (allowed) {
      b.timer = short(b.timer + (((occupants << 24) >> 24) + 1) * 2)
      if (b.timer >= cost) {
        b.timer = short(cost)
        b.birthPending = true
      }
    } else b.timer = 0
  }
  if (!b.birthPending) return false
  b.birthPending = false
  b.timer = 0
  return sampled && allowed
}

// The newborn and its flash use different shape sockets. Its home destination
// is one cell beyond the door, redirected around a neighboring building, then
// snapped to the native cell center (0x405050/0x405090).
export function hutBirthPoints(
  b: BuildingShapePose,
  buildingAt: (point: { x: number; y: number }) => BuildingShapePose | undefined
) {
  const inside = buildingInsidePoint(b),
    flash = buildingOutsidePoint(b)
  const next = nativeStep({ x: flash.x / 256, z: -flash.y / 256 }, (b.angle + 512) & 2047, 512)
  let destination = { x: Math.round(next.x * 256) & 65535, y: Math.round(-next.z * 256) & 65535 }
  const neighbor = buildingAt(destination)
  if (neighbor) destination = buildingOutsidePoint(neighbor)
  destination = { x: (destination.x & 0xfe00) + 256, y: (destination.y & 0xfe00) + 256 }
  return { inside, flash, destination }
}
