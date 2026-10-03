import { createIndexedSearch, nextIndexedSearch, startIndexedSearch } from './indexed-search.ts'
import { movePosition, nativeAngle, positionDistanceSquared, random, short } from './native-math.ts'
import { nativeStep3D, shotAngles } from './world-coordinates.ts'
import type { NativeTerrain } from './native-terrain.ts'

export type StartPoint = { x: number; y: number; h: number }
export type StartCarrier = {
  id: number
  index: number
  position: StartPoint
  destination: StartPoint
  visits: number
}
export type StartOrbit = StartPoint & { angle: number; id: number }
export type StartWave = {
  id: number
  center: StartPoint
  visits: number
  terrainRadius: number
  visualRadius: number
  orbits: StartOrbit[]
}
export type LevelStartSite = {
  tribe: number
  shaman: number
  center: StartPoint
  phase: 0 | 1 | 2 | 3 | 4
  entering: boolean
  timer: number
  counter: number
  suspended?: boolean
  awaitedWave?: number | null
  wave: StartWave | null
  carriers: StartCarrier[]
  stoneTurns: (number | null)[]
}

// 0x4ba600: nearest multiple of 64, ties round down; keep sites above sea level.
export function levelStartHeight(height: number) {
  const lower = height & ~63,
    upper = (height + 63) & ~63
  return Math.max(64, Math.min(1024, height - lower <= upper - height ? lower : upper))
}

// 0x433a10 -> 0x44fcb0/0x44eb40. The descriptor's extent is consumed as a
// count, not divided by two: preserve the original 10x10 (wrapped) sample.
export function levelStartTargetHeight(land: Pick<NativeTerrain, 'heights'>, center: StartPoint) {
  const x = ((center.x >>> 8) & 254) - 6,
    y = ((center.y >>> 8) & 254) - 6
  let total = 0
  for (let row = 0; row < 10; row++)
    for (let col = 0; col < 10; col++)
      total += land.heights[(((y + row * 2) & 255) >>> 1) * 128 + (((x + col * 2) & 255) >>> 1)]
  return levelStartHeight(Math.trunc(total / 100) + 10)
}

// 0x49c7a0 uses the native type-2 iterator, including repeated ring endpoints.
export function levelStartCells(center: StartPoint) {
  const pool = createIndexedSearch(),
    id = startIndexedSearch(pool, 2, 0, 0, 3),
    cells: number[] = []
  let offset
  while ((offset = nextIndexedSearch(pool, id))) {
    const x = (((center.x >>> 8) & 254) + offset.x * 2) & 255,
      y = (((center.y >>> 8) & 254) + offset.y * 2) & 255
    cells.push(x | (y << 8))
  }
  return cells
}

// 0x50c840. Terrain and cell-occupant consumers run before radius growth and
// orbit motion. Conversion is cell based, not a made-up distance-to-person test.
export function stepLevelStartWave(
  land: Pick<NativeTerrain, 'heights'>,
  wave: StartWave,
  effects: {
    orbit: (point: StartPoint, light: boolean) => number
    cell: (packed: number) => boolean
    terrain: (packed: number) => void
    sparkle: (point: StartPoint, angle: number) => void
    move: (id: number, point: StartPoint) => void
    remove: (id: number) => void
  }
) {
  if (wave.visits === 0) {
    wave.terrainRadius = wave.visualRadius = 160
    for (let i = 0; i < 32; i++) {
      const p = { ...wave.center, h: wave.center.h - 40 }
      wave.orbits.push({ ...p, angle: i * 64, id: effects.orbit(p, i % 5 === 0) })
    }
  }
  let sceneryPending = false
  for (const cell of levelStartCells(wave.center)) {
    const point = { x: (cell & 254) << 8, y: cell & 0xfe00 }
    if (positionDistanceSquared(wave.center, point) > wave.terrainRadius ** 2) continue
    const index = (cell >>> 9) * 128 + ((cell & 254) >>> 1),
      difference = wave.center.h - land.heights[index]
    if (difference) {
      land.heights[index] = short(land.heights[index] + Math.max(-128, Math.min(128, difference)))
      effects.terrain(cell)
    }
    sceneryPending = effects.cell(cell) || sceneryPending
  }
  if (wave.visits < 16) {
    wave.terrainRadius = Math.min(2560, wave.terrainRadius + 160)
    wave.visualRadius = Math.min(2048, wave.visualRadius + 160)
  }
  for (const orbit of wave.orbits) {
    effects.sparkle(orbit, orbit.angle)
    orbit.angle = (orbit.angle + 91) & 2047
    const position = { ...wave.center }
    movePosition(position, orbit.angle, wave.visualRadius)
    Object.assign(orbit, position)
    effects.move(orbit.id, position)
  }
  wave.visits = (wave.visits + 1) & 255
  if (wave.visits > 20) {
    for (const orbit of wave.orbits) effects.remove(orbit.id)
    wave.orbits = []
    return sceneryPending
  }
  return true
}

// 0x4baf00: model-1 circle carriers, 20 substeps at 70 native units. Even the
// final arrival visit emits its jitter trail and consumes the two gameplay draws.
export function stepLevelStartCarrier(
  carrier: StartCarrier,
  rng: { randomState: number },
  trail: (position: StartPoint) => void
) {
  for (let i = 0; i < 20; i++) {
    const p = carrier.position,
      d = carrier.destination
    trail({ ...p, x: short(p.x + 8 - (random(rng) & 15)), y: short(p.y + 8 - (random(rng) & 15)) })
    if (Math.abs(d.x - p.x) < 108 && Math.abs(d.y - p.y) < 108 && Math.abs(d.h - p.h) < 108)
      return false
    const [yaw, pitch] = shotAngles(p, d)
    carrier.position = nativeStep3D(p, yaw, pitch, 70)
  }
  carrier.visits++
  return true
}

export function levelStartStoneHeading(center: StartPoint, stone: StartPoint) {
  return nativeAngle(short(stone.x - center.x), -short(stone.y - center.y))
}
