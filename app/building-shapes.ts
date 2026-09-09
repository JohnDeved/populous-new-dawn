import data from './original-shapes.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, nativeStep, random } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

export interface BuildingShapePose {
  object: number
  angle: number
  anchorX: number
  anchorY: number
}
export type RegisteredBuilding = BuildingShapePose & { id: number; tribe: number }
export type SceneryShapePose = Omit<BuildingShapePose, 'angle'>
export interface BuildingCells {
  flags: Uint32Array
  buildingIds: Uint16Array
  owners: Uint8Array
  shadows: Uint8Array
}
interface Point {
  x: number
  y: number
}
const short = (n: number) => (n << 16) >> 16
function shape(b: BuildingShapePose) {
  const quadrant = Math.trunc(short(b.angle) / 512)
  const index = data.objects[b.object]?.[quadrant],
    result = data.shapes[index]
  if (!result)
    throw new RangeError(`No native building shape for object ${b.object}, angle ${b.angle}`)
  return result
}

// 0x40b170: huts choose one of three families; other tribe-colored buildings
// use consecutive objects. Only the hut branch consumes the game RNG.
export function chooseBuildingObject(model: number, tribe: number, rng: { randomState: number }) {
  tribe = (tribe << 24) >> 24
  const base = rules.buildingObjects[model],
    flags = rules.buildingFlags[model]
  if (flags & 0x2000) return short(base + (random(rng) % 3) * 12 + tribe * 3)
  return short(base + (flags & 0x4000 ? tribe : 0))
}

// 0x40b320: choose a smoke socket from the current object's rotated shape.
// Socket bytes are x/unused/y in 32-unit coordinates; shape origins use 256 units.
export function buildingSmokePoint(b: BuildingShapePose, rng: { randomState: number }) {
  const s = shape(b)
  if (!s.smoke.length) return null
  const [x, , y] = s.smoke[random(rng) % s.smoke.length]
  return {
    x: short(b.anchorX + x * 32 - s.x * 256),
    y: short(b.anchorY + y * 32 - s.y * 256),
  }
}

// 0x408840 checks all six slots; smoke's zero-Z terminator does not apply here.
export function buildingFirePoints(b: BuildingShapePose) {
  const s = shape(b)
  return s.fire.flatMap(([x, size, y], slot) =>
    x || size || y
      ? [
          {
            x: short(b.anchorX + x * 32 - s.x * 256),
            y: short(b.anchorY + y * 32 - s.y * 256),
            size: size + 1,
            light: slot === 0,
          },
        ]
      : []
  )
}

// Shared native mask traversal for occupancy and the browser placement preview.
function shapeCells(s: ReturnType<typeof shape>, anchorX: number, anchorY: number, mask = 1) {
  const cx = (anchorX >>> 8) & 254,
    cy = (anchorY >>> 8) & 254,
    cells: { index: number; mask: number }[] = []
  for (let y = 0; y < s.height; y++)
    for (let x = 0; x < s.width; x++)
      if (data.cells[s.offset + y * s.width + x] & mask) {
        const px = (cx - s.x + x * 2) & 255,
          py = (cy - s.y + y * 2) & 255
        cells.push({
          index: (py >> 1) * 128 + (px >> 1),
          mask: data.cells[s.offset + y * s.width + x],
        })
      }
  return cells
}

export function buildingFootprintTiles(b: BuildingShapePose) {
  return shapeCells(shape(b), b.anchorX, b.anchorY)
}
export function buildingFootprintCells(b: BuildingShapePose) {
  return buildingFootprintTiles(b).map(c => c.index)
}

// 0x403d50: the map anchor and the displayed model origin are different points.
export function buildingPosition(b: BuildingShapePose) {
  const s = shape(b),
    q = Math.trunc(short(b.angle) / 512),
    [x, y] = data.origins[b.object]
  const offsets = [
    [x, y],
    [y, 512 - x],
    [512 - x, 512 - y],
    [512 - y, x],
  ]
  return {
    x:
      (b.anchorX + offsets[q][0] + ((q === 2 || q === 3 ? s.width * 2 - 6 : 0) - s.x + 2) * 256) &
      65535,
    y:
      (b.anchorY + offsets[q][1] + ((q === 1 || q === 2 ? s.height * 2 - 6 : 0) - s.y + 2) * 256) &
      65535,
  }
}

// 0x4b9e20: grade vertices are mask bit 2, not occupied tiles (bit 1).
export function buildingGradeVertices(b: BuildingShapePose) {
  return shapeCells(shape(b), b.anchorX, b.anchorY, 2)
}

export function buildingShapeCells(b: BuildingShapePose) {
  return shapeCells(shape(b), b.anchorX, b.anchorY, 255)
}

// Height branch of 0x4b8220, including 0x44fd80's signed average. Round ties
// downward before clamping. Model 10 keeps its existing height; docks use one.
export function buildingPlanHeight(
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  b: BuildingShapePose,
  model: number,
  current: number,
  levelFlags: number
) {
  if (model === 10) return short(current)
  if (model === 13 || model === 14) return 1
  const vertices = buildingGradeVertices(b)
  if (!vertices.length) throw new RangeError('Building plan has no grade vertices')
  const h =
    levelFlags & 0x4000
      ? terrainPointHeight(land, buildingOutsidePoint(b))
      : Math.trunc(
          vertices.reduce((sum, c) => sum + short(land.heights[c.index]), 0) / vertices.length
        )
  return Math.max(64, Math.min(1024, (h + 31) & ~63))
}

function cellCorners(i: number) {
  const east = (i & ~127) | ((i + 1) & 127),
    south = (i + 128) & 16383
  return [i, south, (east + 128) & 16383, east]
}

// Complete 0x403f00: grade four corners per occupied tile. Duplicates count
// in the average and writes retain traversal order, including dock water edges.
export function levelBuildingGround(
  heights: Int16Array,
  b: BuildingShapePose,
  model: number,
  refresh: (cell: number, radius: number) => void
) {
  const s = shape(b),
    flags = rules.buildingFlags[model]
  const sampled = buildingFootprintCells(b)
    .flatMap(cellCorners)
    .map(i => heights[i])
  let height = Math.min(1024, ...sampled)
  if (flags & 0x20000)
    height = sampled.length ? Math.trunc(sampled.reduce((a, h) => a + h, 0) / sampled.length) : 0
  height = Math.max(1, height)
  const lowered = [
    [1, 2],
    [2, 3],
    [0, 3],
    [0, 1],
  ][Math.trunc(short(b.angle) / 512)]
  for (const c of shapeCells(s, b.anchorX, b.anchorY, flags & 0x40000 ? 5 : 1)) {
    const edge = (model === 13 || model === 14) && c.mask & 8
    cellCorners(c.index).forEach((i, corner) => {
      heights[i] = height - (edge && lowered.includes(corner) ? 1 : 0)
    })
  }
  refresh(((b.anchorX >>> 8) & 254) | (b.anchorY & 0xfe00), Math.max(s.width >> 1, s.height >> 1))
}

// 0x40afd0 / 0x4b9ef0: repair includes every nonempty shape cell, not just
// occupied ground. Positive-lived model-76 smoke there is shortened to 16 turns.
export function buildingRepairArea(b: BuildingShapePose) {
  const s = shape(b)
  return {
    cells: buildingShapeCells(b).map(c => c.index),
    center: ((b.anchorX >>> 8) & 254) | (b.anchorY & 0xfe00),
    radius: (Math.max(s.width, s.height) + 1) >> 1,
  }
}

// 0x403c10: scenery always uses the first shape, with shape 1 as the zero fallback.
// The apparent extra arguments in callers are unused; shade comes from cell occupants.
export function refreshSceneryShadow(
  land: Pick<BuildingCells, 'flags' | 'shadows'>,
  p: SceneryShapePose,
  shade: (index: number) => number,
  refresh: (cell: number, radius: number) => void
) {
  const s = data.shapes[data.objects[p.object][0] || 1]
  for (const { index: i } of shapeCells(s, p.anchorX, p.anchorY)) {
    land.flags[i] |= 16
    land.shadows[i] = (land.shadows[i] & 240) | (Math.min(15, shade(i)) & 255)
  }
  refresh(((p.anchorX >>> 8) & 254) | (p.anchorY & 0xfe00), Math.max(s.width, s.height) >> 1)
}

// 0x4b9190 marks the entrance separately, outside the occupied footprint.
export function buildingPlanCells(b: BuildingShapePose) {
  const s = shape(b)
  const x = s.outside[0] >> 3
  const y = s.outside[1] >> 3
  const cells = buildingFootprintCells(b)
  let entrance: number | null = null
  if (x >= 0 && x < s.width && y >= 0 && y < s.height) {
    const px = ((b.anchorX >>> 8) - s.x + x * 2) & 255
    const py = ((b.anchorY >>> 8) - s.y + y * 2) & 255
    entrance = (py >> 1) * 128 + (px >> 1)
  }
  return { cells, entrance }
}

// 0x403a00: update only shape-mask bit 1 cells. Modes 0/1 remove/register;
// mode 4 clears terrain-damage bit 0x20000 without a shade recomputation.
export function registerBuildingFootprint(
  land: BuildingCells,
  b: RegisteredBuilding,
  mode: number,
  shade: (index: number) => number,
  refresh: (cell: number, radius: number) => void
) {
  const s = shape(b),
    cx = (b.anchorX >>> 8) & 254,
    cy = (b.anchorY >>> 8) & 254
  const owner = mode === 1 ? (b.tribe + 1) & 255 : 0,
    id = mode === 1 ? b.id : 0
  for (const i of buildingFootprintCells(b)) {
    land.owners[i] = (land.owners[i] & 240) | owner
    land.buildingIds[i] ^= (land.buildingIds[i] ^ id) & 1023
    land.flags[i] |= 16
    if (mode === 0) land.flags[i] &= ~0x200
    else if (mode === 1) land.flags[i] |= 0x200
    else if (mode === 4) land.flags[i] &= ~0x20000
    if (mode === 0 || mode === 1)
      land.shadows[i] = (land.shadows[i] & 240) | (Math.min(15, shade(i)) & 255)
  }
  refresh(cx | (cy << 8), Math.max(s.width >> 1, s.height >> 1) + 1)
}

// 0x450d50: native building stage shade followed by cell-list scenery shade.
export function nativeCellShade(
  flags: number,
  b: { class: number; model: number; state: number; flags2: number; stage: number } | undefined,
  objects: Iterable<{ class: number; model: number }>
) {
  let shade = 0
  if (flags & 0x200 && b && !(b.flags2 & 1) && b.class) {
    shade = rules.buildingShade[b.model]
    if (b.state === 1 && !(rules.buildingFlags[b.model] & 256))
      shade = Math.trunc((shade * ((b.stage << 24) >> 24)) / 3)
  }
  for (const o of objects) {
    if (shade > 15) break
    if (o.class === 5) shade += rules.sceneryShade[o.model]
  }
  return Math.min(15, shade)
}

// 0x404420 / 0x4044b0: anchor words are coarse-cell aligned by 0x403610.
// Rotated records carry explicit signed quarter-cell entrance offsets.
export function buildingInsidePoint(b: BuildingShapePose): Point {
  const s = shape(b)
  return {
    x: (b.anchorX - s.x * 256 + s.inside[0] * 64) & 65535,
    y: (b.anchorY - s.y * 256 + s.inside[1] * 64) & 65535,
  }
}
export function buildingOutsidePoint(b: BuildingShapePose): Point {
  const s = shape(b)
  return {
    x: (b.anchorX - s.x * 256 + s.outside[0] * 64) & 65535,
    y: (b.anchorY - s.y * 256 + s.outside[1] * 64) & 65535,
  }
}

function wrappedDistanceSquared(a: Point, b: Point) {
  const x = short(a.x - b.x),
    y = short(a.y - b.y)
  return (x * x + y * y) | 0
}

function stepPoint(point: Point, angle: number, length: number) {
  const next = nativeStep({ x: point.x / 256, z: -point.y / 256 }, angle, length)
  return { x: Math.round(next.x * 256) & 65535, y: Math.round(-next.z * 256) & 65535 }
}

// 0x40a460: approach the closest point along the entrance axis in 64-unit
// steps, then bias 32 units toward the outside. Distances are not rounded roots.
export function buildingApproachPoint(b: BuildingShapePose, p: Point): Point {
  const inside = buildingInsidePoint(b),
    outside = buildingOutsidePoint(b)
  const a = wrappedDistanceSquared(p, outside),
    c = wrappedDistanceSquared(p, inside)
  let point = a < c ? outside : inside,
    previous = point,
    best = Math.min(a, c)
  const other = a < c ? inside : outside,
    angle = nativeAngle(short(other.x - point.x), -short(other.y - point.y))
  for (;;) {
    previous = point
    point = stepPoint(point, angle, 64)
    const d = wrappedDistanceSquared(p, point)
    if (d >= best) break
    best = d
  }
  return stepPoint(
    previous,
    nativeAngle(short(outside.x - inside.x), -short(outside.y - inside.y)),
    32
  )
}

// 0x409710: walk 128-unit steps around the original footprint mask. The two
// probes use different bits (1, then 4), and mirror wrapped offsets with abs.
// Keep the shared mask buffer: a native probe can cross a record's mask extent.
export function buildingQueuePoint(b: BuildingShapePose, index: number): Point {
  if (!Number.isInteger(index)) throw new RangeError('Native queue position must be an integer')
  const s = shape(b),
    outside = buildingOutsidePoint(b),
    inside = buildingInsidePoint(b)
  const quadrant =
    ((nativeAngle(short(inside.x - outside.x), -short(inside.y - outside.y)) + 256) >> 9) & 3
  if (!index) return outside
  const aligned = (n: number) => ((Math.trunc(short(n) / 64) - 1) | 1) << 6
  let point =
    quadrant & 1
      ? {
          x: ((outside.x & 0xfe00) + (quadrant === 1 ? 448 : 64)) & 65535,
          y: aligned(outside.y) & 65535,
        }
      : {
          x: aligned(outside.x) & 65535,
          y: ((outside.y & 0xfe00) + (quadrant === 0 ? 448 : 64)) & 65535,
        }
  let angle = ((quadrant - 1) & 3) << 9
  const originX = (b.anchorX - s.x * 256) & 65535,
    originY = (b.anchorY - s.y * 256) & 65535
  const cell = (p: Point) => {
    const x = Math.abs(short(originX - p.x)) >> 9,
      y = Math.abs(short(originY - p.y)) >> 9
    const value = data.cells[s.offset + x + s.width * y]
    if (value === undefined)
      throw new RangeError('Native queue probe exceeds the loaded shape buffer')
    return value
  }
  for (let i = 0; i < index; i++) {
    const turn = (angle + 512) & 2047
    if (!(cell(stepPoint(point, turn, 128)) & 1)) angle = turn
    if (!(cell(stepPoint(point, angle, 128)) & 4)) angle = (angle - 512) & 2047
    point = stepPoint(point, angle, 128)
  }
  return point
}
