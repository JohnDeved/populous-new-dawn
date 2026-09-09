import rules from './original-rules.json' with { type: 'json' }
import {
  buildingInsidePoint,
  buildingShapeCells,
  type BuildingShapePose,
} from './building-shapes.ts'
import { movePosition, nativeAngle } from './native-math.ts'
import type { NativeTerrain } from './native-terrain.ts'

export interface SinkingBuilding extends BuildingShapePose {
  x: number
  y: number
  h: number
  remaining: number
  counter: number
  phase: number
  tilt: number
  roll: number
  direction: number
  target: number
  speed: number
  fallSpeed: number
  spin: number
  spinDirection: number
  sector: number
  shoreScore: number
}
const short = (n: number) => (n << 16) >> 16
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, short(n)))
function angleDelta(a: number, b: number) {
  const d = a - b
  return Math.abs(d) > 1024 ? d + (d < 0 ? 2048 : -2048) : d
}

// 0x503550 / 0x503e60: seek the wet side, tip, drift and sink for 80 turns.
// Original shape probes deliberately count overlapping neighbors repeatedly.
export function stepSinkingBuilding(land: Pick<NativeTerrain, 'categories'>, b: SinkingBuilding) {
  b.remaining = ((b.remaining - 1) << 24) >> 24
  if (b.remaining < 1) return false
  const center = buildingInsidePoint(b)
  center.x = (center.x & 0xfe00) + 256
  center.y = (center.y & 0xfe00) + 256
  const bins = Array.from({ length: 8 }, () => 0)
  let wet = 0,
    count = 0
  for (const c of buildingShapeCells(b)) {
    if (!(c.mask & 5)) continue
    count++
    const neighbors =
      c.mask & 4
        ? [
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
            [0, -1],
            [-1, -1],
            [-1, 0],
            [0, 0],
          ]
        : [[0, 0]]
    neighbors.forEach(([dx, dy], n) => {
      const x = ((c.index & 127) + dx) & 127,
        y = ((c.index >> 7) + dy) & 127
      if (!(rules.terrainCategoryFlags[land.categories[y * 128 + x] & 15] & 2)) return
      if (!n) wet++
      const angle = nativeAngle(short(x * 512 + 256 - center.x), -short(y * 512 + 256 - center.y))
      bins[((angle + 128) & 1792) >> 8]++
    })
  }
  const scores = bins.map((n, i) => n + bins[(i + 7) & 7] + bins[(i + 1) & 7])
  let score = 0,
    sector = scores[0]
  scores.forEach((n, i) => {
    if (n > score) {
      score = n
      sector = i
    }
  })
  if (wet < count) {
    if (b.shoreScore === score) sector = b.sector
    b.sector = short(sector)
    b.shoreScore = short(score)
  } else sector = b.sector
  if ((b.tilt > 512 ? 2048 - b.tilt : b.tilt) > 56 || (b.roll > 512 ? 2048 - b.roll : b.roll) > 56)
    b.phase = 2
  if (!b.phase) {
    b.target = short(sector << 8)
    b.direction = b.target
    b.speed = 0
    b.phase = 1
    b.fallSpeed = 1
    b.spin = 0
    const delta = angleDelta(b.target, b.angle)
    b.spinDirection = !delta || Math.abs(delta) > 1023 ? (b.counter & 1 ? 1 : -1) : Math.sign(delta)
  } else {
    if (b.phase === 2) {
      b.speed = clamp(b.speed + 2, 26)
      const anchor = { x: b.anchorX, y: b.anchorY }
      movePosition(anchor, b.direction, b.speed)
      b.anchorX = anchor.x
      b.anchorY = anchor.y
      movePosition(b, b.direction, b.speed)
    }
    b.target = short(sector << 8)
    if (!(b.counter & 7)) b.fallSpeed = clamp(b.fallSpeed + 2, 20)
    b.h = short(b.h - b.fallSpeed)
    const delta = angleDelta(b.target, b.direction)
    b.direction = Math.abs(delta) > 5 ? (b.direction + Math.sign(delta) * 5) & 2047 : b.target
    const sign = Math.sign(angleDelta(b.direction, b.angle))
    const accelerating = sign < 1 ? b.spinDirection < 0 : b.spinDirection > 0
    b.spin = short(b.spin + (accelerating ? 2 : -6))
    if (b.spin < 1) b.spinDirection = short(-b.spinDirection)
    b.spin = clamp(b.spin, 56)
    b.angle = (b.angle + b.spin * b.spinDirection) & 2047
  }
  const [pitch, roll] = [
    [2, 0],
    [1, -1],
    [0, -2],
    [-1, -1],
    [-2, 0],
    [-1, 1],
    [0, 2],
    [1, 1],
  ][b.direction >> 8]
  const tip = (n: number) => {
    n &= 2047
    return n < 1025 ? Math.min(625, n) : Math.max(1422, n)
  }
  b.tilt = tip(b.tilt + pitch * 8)
  b.roll = tip(b.roll + roll * 8)
  return true
}
