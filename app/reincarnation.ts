import { nativeAngle } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

// 0x5a9f10, used by normal site creation (0x433a10) and reset (0x41c140).
// Offsets are in 256-unit map coordinates; the terrain cells are 512 units wide.
const STONE_OFFSETS = [
  [0, 6],
  [4, 4],
  [6, 0],
  [4, -4],
  [0, -6],
  [-4, -4],
  [-6, 0],
  [-4, 4],
]

export function reincarnationStones(
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  center: { x: number; y: number }
) {
  return STONE_OFFSETS.map(([dx, dy]) => {
    const x = ((center.x & 0xfe00) + dx * 256 + 256) & 0xffff
    const y = ((center.y & 0xfe00) + dy * 256 + 256) & 0xffff
    // 0x4a7d80: face relative to the actual site center, using signed wrapped deltas.
    const deltaX = ((x - center.x) << 16) >> 16
    const deltaY = ((y - center.y) << 16) >> 16
    return { x, y, h: terrainPointHeight(land, { x, y }), heading: nativeAngle(deltaX, -deltaY) }
  })
}
