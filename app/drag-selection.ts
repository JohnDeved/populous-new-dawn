import rules from './original-rules.json' with { type: 'json' }
import { movePosition, nativeAngle, positionDistance } from './native-math.ts'

interface Point {
  x: number
  y: number
}
const delta = (a: number, b: number) => ((a - b) << 16) >> 16
const sine = (angle: number) => rules.sine[angle & 2047]
const product = (length: number, value: number) => Math.floor((length * value) / 65536)
const heading = (a: Point, b: Point) => nativeAngle(delta(b.x, a.x), -delta(b.y, a.y))

// 0x4adbb0: an order press becomes a drag past one coordinate unit on either axis.
const pressDistance = (a: number, b: number) => {
  const d = Math.abs(((a << 16) >> 16) - ((b << 16) >> 16))
  return d > 32767 ? 65535 - d : d
}
export function dragMoved(start: Point, end: Point) {
  return pressDistance(start.x, end.x) > 256 || pressDistance(start.y, end.y) > 256
}

// 0x443d30: clamp each camera-aligned side to 40 map-coordinate units.
export function dragEndpoint(start: Point, end: Point, camera: number): Point {
  const angle = heading(start, end) - camera - 512,
    length = positionDistance(start, end)
  const x = product(length, sine(angle + 512)),
    y = product(length, sine(angle))
  if (Math.abs(x) <= 10240 && Math.abs(y) <= 10240) return { ...end }
  const point = { ...start }
  movePosition(point, (camera + 512) & 2047, Math.max(-10240, Math.min(10240, x)))
  movePosition(point, (camera + 1024) & 2047, Math.max(-10240, Math.min(10240, y)))
  return point
}

// The recorded command packs two half-angles and an eight-unit distance.
export function dragCommand(start: Point, end: Point, camera: number) {
  return (
    ((camera >> 1) & 1023) |
    ((heading(start, end) >> 1) << 10) |
    ((positionDistance(start, end) >> 3) << 20)
  )
}

// 0x4440a0: four wrapped, clockwise corners. Rendering uses full precision;
// selection rebuilds the same shape from the quantized recorded command.
export function dragCorners(start: Point, camera: number, angle: number, length: number) {
  const diagonal = { ...start }
  movePosition(diagonal, angle, length)
  const relative = angle - camera - 512,
    basis = 512 - camera
  const x = product(length, sine(relative + 512)),
    y = product(length, sine(relative))
  const corners = [
    { x: start.x & 65535, y: start.y & 65535 },
    {
      x: (start.x + product(x, sine(basis))) & 65535,
      y: (start.y - product(x, sine(basis + 512))) & 65535,
    },
    diagonal,
    {
      x: (start.x - product(y, sine(basis + 512))) & 65535,
      y: (start.y - product(y, sine(basis))) & 65535,
    },
  ]
  const [a, b, c] = unwrapDragCorners(corners)
  if ((b.x - c.x) * (b.y - a.y) + (c.y - b.y) * (b.x - a.x) > 0)
    [corners[1], corners[3]] = [corners[3], corners[1]]
  return corners
}

export function dragCommandCorners(start: Point, command: number) {
  return dragCorners(
    start,
    (command & 1023) * 2,
    ((command >>> 10) & 1023) * 2,
    (command >>> 20) * 8
  )
}

// 0x444270: the native cell scan includes an eight-unit margin on its low sides.
export function dragCellBounds(corners: Point[], camera: number) {
  const quadrant = ((heading(corners[0], corners[2]) - camera) & 2047) >> 9
  const x = (-quadrant - (camera >> 9)) & 3,
    y = (-1 - quadrant - (camera >> 9)) & 3
  return {
    x: ((corners[x].x - 8) & 65535) >> 9,
    y: ((corners[y].y - 8) & 65535) >> 9,
    endX: corners[(x + 2) & 3].x >> 9,
    endY: corners[(y + 2) & 3].y >> 9,
  }
}

export function inDragCells(point: Point, bounds: ReturnType<typeof dragCellBounds>) {
  const width = Math.abs(bounds.endX - bounds.x),
    height = Math.abs(bounds.endY - bounds.y)
  return (
    ((((point.x & 65535) >> 9) - bounds.x) & 127) <= Math.min(width, 128 - width) &&
    ((((point.y & 65535) >> 9) - bounds.y) & 127) <= Math.min(height, 128 - height)
  )
}

// 0x444430 for bounded drag rectangles: unwrap the low side of a crossed seam.
export function unwrapDragCorners(corners: Point[]) {
  const wrapX = Math.max(...corners.map(p => p.x)) - Math.min(...corners.map(p => p.x)) > 32768
  const wrapY = Math.max(...corners.map(p => p.y)) - Math.min(...corners.map(p => p.y)) > 32768
  return corners.map(p => ({
    x: p.x + (wrapX && p.x < 32768 ? 65536 : 0),
    y: p.y + (wrapY && p.y < 32768 ? 65536 : 0),
  }))
}

const cross = (a: Point, b: Point, x: number, y: number) =>
  (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)
const triangle = (a: Point, b: Point, c: Point, x: number, y: number) =>
  cross(a, b, x, y) <= 0 && cross(b, c, x, y) <= 0 && cross(c, a, x, y) <= 0

// 0x4445d0: two inclusive triangles, including wrapped copies of the point.
export function inDragSelection(point: Point, corners: Point[]) {
  const [a, b, c, d] = corners
  if (a.x === b.x && a.x === c.x && a.y === b.y && a.y === c.y)
    return (point.x & 65535) === a.x && (point.y & 65535) === a.y
  const wrapX = corners.some(p => p.x >= 65536),
    wrapY = corners.some(p => p.y >= 65536)
  for (let x = point.x & 65535; x <= (point.x & 65535) + (wrapX ? 65536 : 0); x += 65536)
    for (let y = point.y & 65535; y <= (point.y & 65535) + (wrapY ? 65536 : 0); y += 65536)
      if (triangle(a, b, c, x, y) || triangle(a, c, d, x, y)) return true
  return false
}
