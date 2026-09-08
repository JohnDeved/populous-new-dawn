import data from './original-shapes.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, nativeStep, random } from './native-math.ts'

export type BuildingShapePose = { object: number; angle: number; anchorX: number; anchorY: number }
export type RegisteredBuilding = BuildingShapePose & { id: number; tribe: number }
export type BuildingCells = {
  flags: Uint32Array
  buildingIds: Uint16Array
  owners: Uint8Array
  shadows: Uint8Array
}
type Point = { x: number; y: number }
const short = (n: number) => (n << 16) >> 16
function shape(b: BuildingShapePose) {
  const quadrant = Math.trunc(short(b.angle) / 512)
  const index = data.objects[b.object]?.[quadrant],
    result = data.shapes[index]
  if (!result)
    throw new RangeError(`No native building shape for object ${b.object}, angle ${b.angle}`)
  return result
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

// Shared native mask traversal for occupancy and the browser placement preview.
export function buildingFootprintCells(b: BuildingShapePose) {
  const s = shape(b),
    cx = (b.anchorX >>> 8) & 254,
    cy = (b.anchorY >>> 8) & 254,
    cells: number[] = []
  for (let y = 0; y < s.height; y++)
    for (let x = 0; x < s.width; x++)
      if (data.cells[s.offset + y * s.width + x] & 1) {
        const px = (cx - s.x + x * 2) & 255,
          py = (cy - s.y + y * 2) & 255
        cells.push((py >> 1) * 128 + (px >> 1))
      }
  return cells
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
    land.buildingIds[i] = ((land.buildingIds[i] ^ id) & 1023) ^ land.buildingIds[i]
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

// 0x40a460: approach the closest point along the entrance axis in 64-unit
// steps, then bias 32 units toward the outside. Distances are not rounded roots.
export function buildingApproachPoint(b: BuildingShapePose, p: Point): Point {
  const inside = buildingInsidePoint(b),
    outside = buildingOutsidePoint(b)
  const squared = (a: Point, b: Point) => {
    const x = short(a.x - b.x),
      y = short(a.y - b.y)
    return (x * x + y * y) | 0
  }
  const a = squared(p, outside),
    c = squared(p, inside)
  let point = a < c ? outside : inside,
    previous = point,
    best = Math.min(a, c)
  const other = a < c ? inside : outside,
    angle = nativeAngle(short(other.x - point.x), -short(other.y - point.y))
  const step = (p: Point, angle: number, length: number) => {
    const q = nativeStep({ x: p.x / 256, z: -p.y / 256 }, angle, length)
    return { x: Math.round(q.x * 256) & 65535, y: Math.round(-q.z * 256) & 65535 }
  }
  for (;;) {
    previous = point
    point = step(point, angle, 64)
    const d = squared(p, point)
    if (d >= best) break
    best = d
  }
  return step(previous, nativeAngle(short(outside.x - inside.x), -short(outside.y - inside.y)), 32)
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
  const step = (angle: number) => {
    const p = nativeStep({ x: point.x / 256, z: -point.y / 256 }, angle, 128)
    return { x: Math.round(p.x * 256) & 65535, y: Math.round(-p.z * 256) & 65535 }
  }
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
    if (!(cell(step(turn)) & 1)) angle = turn
    if (!(cell(step(angle)) & 4)) angle = (angle - 512) & 2047
    point = step(angle)
  }
  return point
}
