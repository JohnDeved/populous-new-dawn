import rules from './original-rules.json' with { type: 'json' }
import {
  buildingGradeVertices,
  buildingShapeCells,
  type BuildingShapePose,
} from './building-shapes.ts'
import { stepTerrainHeight, type NativeTerrain } from './native-terrain.ts'

export interface BuildingTerrain {
  flooded: number
  delay: number
  reason: number
}
type GroundBuilding = BuildingShapePose &
  BuildingTerrain & {
    model: number
    state: number
    flags2: number
    counter: number
    h: number
  }
const short = (n: number) => (n << 16) >> 16
const byte = (n: number) => (n << 24) >> 24

// 0x408080: average the original grade vertices, settle small differences,
// preserve newly flooded vertices for seven passes, or enter terrain collapse.
// Linked objects, occupants and the dock warning belong to the world owner.
export function stepBuildingTerrain(
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  b: GroundBuilding,
  effects: {
    indicator: () => void
    terrainChanged: (index: number) => void
    attachment: () => void
    occupants: () => void
    dock: () => void
    collapse: () => void
  }
) {
  const flags = rules.buildingFlags[b.model],
    special = !!(flags & 0x8000),
    dock = b.model === 13 || b.model === 14
  if (b.state === 3 || (b.counter & 3 && !special)) return
  if (flags & 0x1000) effects.indicator()
  const vertices = buildingGradeVertices(b),
    flooded = vertices.filter(c => land.heights[c.index] < 1).length
  if (!dock && vertices.length)
    b.h = short(
      Math.max(
        1,
        Math.trunc(vertices.reduce((sum, c) => sum + land.heights[c.index], 0) / vertices.length)
      )
    )
  let reason = 0,
    changed = false
  if (special) b.h = Math.max(1, b.h)
  else {
    if (b.flooded !== flooded) {
      b.delay = 8
      b.flooded = short(flooded)
    }
    if (byte(b.delay) > 1) b.delay--
    if (flooded > Math.trunc((vertices.length * 20) / 32)) reason = 2
  }
  for (const c of vertices) {
    if (reason) break
    const target = dock && c.mask & 128 ? 0 : b.h,
      current = land.heights[c.index],
      difference = Math.abs(current - target)
    if (!difference) continue
    changed = true
    if (difference > short(rules.buildingGroundTolerance[b.model])) reason = 1
    else if (byte(b.delay) < 2 || current !== 0)
      stepTerrainHeight(
        land.heights,
        c.index,
        target,
        rules.buildingGroundStep[b.model],
        effects.terrainChanged
      )
  }
  if (reason) {
    if (!(b.flags2 & 0x100000)) {
      b.state = 3
      effects.collapse()
    }
    b.flags2 = (b.flags2 | 0x40000000) >>> 0
    b.reason = reason
    return
  }
  if (!changed) {
    for (const c of vertices) land.flags[c.index] &= ~0x20000
    b.delay = 0
    b.flags2 = (b.flags2 & ~4) >>> 0
    effects.attachment()
  }
  if (dock && (!changed || !(b.counter & 31))) effects.dock()
  if (changed) effects.occupants()
}

// 0x406f40: state 3 starts at two, ejects at one, emits/removes at zero.
export function stepTerrainCollapse(
  b: BuildingTerrain,
  effects: { eject: () => void; destroy: (reason: number) => void }
) {
  b.delay = byte(b.delay - 1)
  if (b.delay === 1) effects.eject()
  if (b.delay < 1) effects.destroy(b.reason)
}

// 0x40b860: each water-edge cell needs a six-cell, three-wide clear lane.
export function dockLaneClear(heights: Int16Array, pose: BuildingShapePose) {
  const direction = Math.trunc(short(pose.angle) / 512),
    [dx, dy] = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ][direction]
  for (const c of buildingShapeCells(pose)) {
    if (!(c.mask & 128)) continue
    for (let step = 0; step < 6; step++)
      for (let side = -1; side <= 1; side++) {
        const x = ((c.index & 127) + dx * step + dy * side) & 127,
          y = ((c.index >> 7) + dy * step - dx * side) & 127
        if (heights[y * 128 + x] > 0) return false
      }
  }
  return true
}
