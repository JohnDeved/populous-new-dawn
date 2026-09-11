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

// 0x5029d0: model-12 uses 4/128/3/32/300-turn phases before its spawn request.
// Drowning enters at the 32-turn rise; ordinary deaths begin at phase zero.
export const reincarnationTurns = (drowning: boolean) => (drowning ? 333 : 468)

export function stepReincarnation(remaining: number, canSpawn: boolean, effect65: boolean) {
  if (remaining <= 0) return { remaining: 0, phase: 6, height: 0, event: null }
  const phase =
      remaining > 464
        ? 0
        : remaining > 336
          ? 1
          : remaining > 333
            ? 2
            : remaining > 301
              ? 3
              : remaining > 1
                ? 4
                : 5,
    height = remaining <= 333 ? Math.min(1280, (334 - remaining) * 40) : 0,
    event: 'splash' | 'rise' | 'spawn' | null =
      effect65 && remaining >= 334 && remaining <= 336
        ? 'splash'
        : remaining === 6 && canSpawn
          ? 'rise'
          : remaining === 1 && canSpawn
            ? 'spawn'
            : null
  return {
    remaining: remaining === 1 ? (canSpawn ? 0 : 1) : remaining - 1,
    phase,
    height,
    event,
  }
}

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
