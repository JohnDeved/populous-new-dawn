import { movePosition, nativeAngle, positionDistance, short } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import type { NativePoint } from './world-types.ts'

// 0x51f990's terrain test follows the range test. Stored object height (+0x41),
// not tower display support or projectile launch offsets, owns the sight line.
export function firewarriorTerrainClear(
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  source: NativePoint,
  target: NativePoint
) {
  const distance = positionDistance(source, target),
    samples = Math.max(1, Math.min(16, Math.trunc(distance / 0x180))),
    angle = nativeAngle(short(target.x - source.x), -short(target.y - source.y)),
    delta = { x: 0, y: 0 },
    heightStep = short(Math.trunc((short(target.h) - short(source.h)) / samples)),
    point = { ...source }
  movePosition(delta, angle, Math.trunc(distance / samples))
  for (let i = 0; i < samples; i++) {
    point.x = short(point.x + delta.x)
    point.y = short(point.y + delta.y)
    point.h = short(point.h + heightStep)
    if (point.h + 0x8c < terrainPointHeight(land, point)) return false
  }
  return true
}
