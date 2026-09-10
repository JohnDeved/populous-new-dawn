import { dragCellBounds, inDragSelection, unwrapDragCorners } from './drag-selection.ts'
import { dragBorderCrossings } from './drag-border.ts'
import { nativeAngle } from './native-math.ts'

interface Point {
  x: number
  y: number
  flags: number
}
const distance = (a: number, b: number) => Math.min((a - b) & 127, (b - a) & 127)
// 0x422fc0: four terrain triangles per cell, with boundary points shared by
// adjacent triangles. Keep allocation order for the original clipped-polygon fan.
export function selectionMesh(
  wrapped: { x: number; y: number }[],
  camera: number,
  quadrant: number
) {
  wrapped = wrapped.map(p => ({ x: p.x & 65535, y: p.y & 65535 }))
  const corners = unwrapDragCorners(wrapped),
    bounds = dragCellBounds(wrapped, camera)
  const width = distance(bounds.endX, bounds.x) + 1,
    height = distance(bounds.endY, bounds.y) + 1
  const points: Point[] = [],
    shared = new Map<string, number>(),
    triangles: number[][] = [],
    clipped = new Map<number, number[]>()
  const add = (p: { x: number; y: number }, flags = 0) => {
    const key = `${p.x & 65535},${p.y & 65535}`,
      grid = (p.x & 511) === (p.y & 511) && !(p.x & 255)
    if (grid && shared.has(key)) {
      const i = shared.get(key)!
      points[i].flags |= flags
      return i
    }
    const i = points.push({ x: p.x, y: p.y, flags }) - 1
    if (grid) shared.set(key, i)
    return i
  }
  const write = (face: number, slot: number, point: number) => {
    if (face < 0) return
    triangles[face] ??= [-1, -1, -1]
    triangles[face][slot] = point
  }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const base = (y * width + x) * 4,
        previous = base - width * 4
      const p = { x: (bounds.x + x) * 512, y: (bounds.y + y) * 512 }
      // Coordinates may be on the unwrapped low side of a selection seam.
      if (inDragSelection(p, corners)) {
        const i = add(p)
        for (const [face, slot] of [
          [previous - 3, 1],
          [previous - 2, 1],
          [previous, 1],
          [previous + 1, 0],
          [base - 2, 2],
          [base - 1, 2],
          [base, 0],
          [base + 3, 0],
        ])
          write(face, slot, i)
      }
      p.x += 256
      p.y += 256
      if (inDragSelection(p, corners)) {
        const i = add(p)
        for (const [face, slot] of [
          [base, 2],
          [base + 1, 2],
          [base + 2, 0],
          [base + 3, 1],
        ])
          write(face, slot, i)
      }
    }
  const boundary = (p: { x: number; y: number }, mode: number, flags: number) => {
    const i = add(p, flags),
      x = p.x & 510,
      y = p.y & 510
    const cellX = distance((p.x & 65535) >> 9, bounds.x),
      cellY = distance((p.y & 65535) >> 9, bounds.y)
    const base = (cellY * width + cellX) * 4,
      previous = base - width * 4
    let quarter: number
    if (x + y >= 512) quarter = x >= y ? 2 : 1
    else quarter = x < y ? 0 : 3
    let faces: number[]
    if (!(p.x & 511) && !(p.y & 511))
      faces = [
        base,
        base + 3,
        previous - 3,
        previous - 2,
        base - 2,
        base - 1,
        previous,
        previous + 1,
      ]
    else if ((p.x & 511) === 256 && (p.y & 511) === 256)
      faces = [base, base + 1, base + 2, base + 3]
    else if (mode === 1) faces = [base, base - 2]
    else if (mode === 2) faces = [previous + 1, base + 3]
    else if (mode === 3) faces = [base + quarter, base + (quarter ^ 1)]
    else if (mode === 4) faces = [base + quarter, base + 3 - quarter]
    else faces = [base + quarter]
    for (const face of faces) {
      if (face < 0) continue
      let polygon = clipped.get(face)
      if (!polygon) {
        polygon = (triangles[face] ?? []).filter(id => id >= 0)
        clipped.set(face, polygon)
      }
      if (
        !polygon.some(
          j => ((points[j].x - p.x) & 65535) === 0 && ((points[j].y - p.y) & 65535) === 0
        )
      )
        polygon.push(i)
    }
  }
  for (let i = 0; i < 4; i++) {
    const direction = (i + quadrant) & 3
    boundary(corners[i], 0, [0x1300, 0x2600, 0x4c00, 0x8900][direction])
  }
  for (let i = 0; i < 4; i++)
    for (const p of dragBorderCrossings(corners[i], corners[(i + 1) & 3]))
      boundary(p, p.mode, 0x100 << ((i + quadrant + 1) & 3))
  const result: Point[][] = []
  for (let i = 0; i < width * height * 4; i++) {
    const triangle = triangles[i]
    if (!clipped.has(i) && triangle?.every(j => j >= 0)) result.push(triangle.map(j => points[j]))
  }
  for (const ids of clipped.values()) {
    if (ids.length < 3) continue
    const polygon = unwrapDragCorners(ids.map(i => points[i]))
    const center = {
      x: Math.trunc(polygon.reduce((n, p) => n + p.x, 0) / polygon.length),
      y: Math.trunc(polygon.reduce((n, p) => n + p.y, 0) / polygon.length),
    }
    const ordered = ids.map((id, i) => ({
      id,
      angle: nativeAngle(polygon[i].x - center.x, -(polygon[i].y - center.y)),
    }))
    ordered.sort((a, b) => a.angle - b.angle)
    // Repair 0x424900's overwritten final triangle when a clipped polygon has seven vertices.
    for (let i = 1; i < ordered.length - 1; i++)
      result.push([ordered[0], ordered[i], ordered[i + 1]].map(p => points[p.id]))
  }
  return result
}
