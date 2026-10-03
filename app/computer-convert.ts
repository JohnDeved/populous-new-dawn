import { spiralCell } from './native-math.ts'
import { restingCellCollision } from './person-collision.ts'
import type { ComputerQueue } from './computer.ts'

// 0x4e5900/0x4627f0: state2 gates allocation, never an already-active task.
export function requestConvertTask(ai: ComputerQueue, states: number, wildCount: number) {
  if (!wildCount || !(states & 4) || ai.tasks.some(t => t.flags & 1 && t.type === 2)) return false
  const task = ai.tasks.find(t => !(t.flags & 1))
  if (!task) return false
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 2,
    phase: 0,
    requested: 0,
    extra: 0,
    selected: 0,
    mode: 0,
    members: [],
  })
  return true
}

// 0x4f87f0: maximum macroregion density, then strictly nearest region.
// List positions supply the centroid; they do not replace the native byte counts.
export function findConvertTarget(
  origin: number,
  counts: ArrayLike<number>,
  wild: readonly { x: number; y: number }[],
  minimum: number,
  maximum: number
) {
  let winner = -1,
    bestCount = 0,
    bestDistance = 100000
  for (let region = 0; region < 64; region++) {
    const count = counts[region] & 255
    if (!count || count < bestCount) continue
    const x = (region & 7) * 32 + 16,
      y = (region >> 3) * 32 + 16,
      dx = Math.abs((origin & 255) - x),
      dy = Math.abs((origin >>> 8) - y),
      distance = Math.floor(Math.hypot(Math.min(dx, 256 - dx), Math.min(dy, 256 - dy)))
    if (minimum > distance || distance > maximum) continue
    if (count > bestCount || distance < bestDistance) {
      winner = region
      bestCount = count
      bestDistance = distance
    }
  }
  if (winner < 0) return null
  let x = 0,
    y = 0,
    count = 0
  for (const p of wild)
    if ((p.x >>> 13) + ((p.y >>> 10) & 56) === winner) {
      x += (p.x >>> 8) & 254
      y += (p.y >>> 8) & 254
      count++
    }
  return count ? Math.trunc(x / count) | (Math.trunc(y / count) << 8) : null
}

// 0x4f5d30: actual resting-cell collision, then the first24 native spiral cells.
export function standableConvertTarget(
  target: number,
  land: { flags: ArrayLike<number>; categories: ArrayLike<number>; walkMasks: ArrayLike<number>[] }
) {
  const valid = (cell: number) => {
    const p = { x: ((cell & 254) + 1) << 8, y: (((cell >>> 8) & 254) + 1) << 8 },
      index = (p.y >>> 9) * 128 + (p.x >>> 9)
    return !restingCellCollision(
      { flags: land.flags[index], category: land.categories[index] },
      land.walkMasks[0],
      p
    )
  }
  if (valid(target)) return target
  for (let i = 0; i < 24; i++) {
    const candidate = spiralCell(target, i, 0)
    if (valid(candidate)) return candidate
  }
  return null
}
