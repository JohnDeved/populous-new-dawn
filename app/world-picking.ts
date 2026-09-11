import { spriteCoordinate, type CameraConfig } from './projection.ts'

export interface ScreenPoint {
  x: number
  y: number
}
export interface HitBounds {
  x: number
  y: number
  width: number
  height: number
}
export type PickCommand =
  | { kind: 'bounds'; id: number; bounds: HitBounds }
  | { kind: 'person'; id: number; bounds: HitBounds; eligible: boolean }
  | { kind: 'model'; id: number; points: ScreenPoint[] }
  | { kind: 'ground'; points?: ScreenPoint[] }

export function inHitBounds(p: ScreenPoint, r: HitBounds) {
  return p.x >= r.x && p.y >= r.y && p.x <= r.x + r.width && p.y <= r.y + r.height
}

// Original model triangles truncate coordinates before their inclusive edge tests.
// Native screen-space winding is clockwise. Bounds alone never claim a model hit.
export const roundPixel = (n: number) => {
  const floor = Math.floor(n)
  return n - floor === 0.5 ? floor + (floor & 1) : Math.round(n)
}

// 0x475550 queues the whole-model bounds after its faces.
export function modelHitBounds(points: { screenX: number; screenY: number; z: number }[]) {
  let left = 0xfffffff,
    top = left,
    right = -1,
    bottom = -1,
    depth = -1
  for (const p of points) {
    const x = roundPixel(p.screenX),
      y = roundPixel(p.screenY)
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
    depth = Math.max(depth, roundPixel(Math.fround(p.z)))
  }
  const distance = depth + 0x7000
  return {
    bounds: { x: left, y: top, width: right - left, height: bottom - top },
    bucket: distance < 64 ? 0 : Math.min(3584, Math.trunc(distance / 16)),
  }
}
export function inHitTriangle(p: ScreenPoint, points: ScreenPoint[], ground = false) {
  const pixel = ground ? roundPixel : Math.trunc
  const [a, b, c] = points
  const ax = pixel(a.x),
    ay = pixel(a.y),
    bx = pixel(b.x),
    by = pixel(b.y),
    cx = pixel(c.x),
    cy = pixel(c.y)
  return (
    (bx - ax) * (p.y - ay) - (by - ay) * (p.x - ax) >= 0 &&
    (cx - bx) * (p.y - by) - (cy - by) * (p.x - bx) >= 0 &&
    (ax - cx) * (p.y - cy) - (ay - cy) * (p.x - cx) >= 0
  )
}

// Header width/height, not the union of visible body and shadow pieces.
export function personHitBounds(
  point: ScreenPoint,
  frame: { nativeWidth: number; nativeHeight: number },
  bucket: number,
  flags: number,
  view: CameraConfig,
  scaled: boolean
) {
  const width = scaled
    ? spriteCoordinate(frame.nativeWidth, bucket, flags, view)
    : frame.nativeWidth
  const height = scaled
    ? spriteCoordinate(frame.nativeHeight, bucket, flags, view)
    : frame.nativeHeight
  return { x: point.x - Math.trunc(width / 2), y: point.y - height, width, height }
}

// 0x4673b0: consume the first matching model face, then let later painter hits win.
// Unbounded candidates deliberately remove the original three-model ring overflow.
export function pickQueuedObjects(commands: PickCommand[], point: ScreenPoint) {
  const candidates = new Set<number>()
  let result: { kind: 'person' | 'model'; id: number } | null = null
  for (const command of commands) {
    switch (command.kind) {
      case 'bounds':
        if (inHitBounds(point, command.bounds)) candidates.add(command.id)
        break
      case 'person':
        if (command.eligible && inHitBounds(point, command.bounds))
          result = { kind: 'person', id: command.id }
        break
      case 'model':
        if (candidates.has(command.id) && inHitTriangle(point, command.points)) {
          candidates.delete(command.id)
          result = { kind: 'model', id: command.id }
        }
        break
      case 'ground':
        if (!command.points || inHitTriangle(point, command.points, true)) result = null
    }
  }
  return result
}

// 0x475860: eight six-pixel corner strokes, expanding outwards each layer.
// Sprite animation owns the pulse; click feedback only selects the thick phase.
export function pointerBrackets(bounds: HitBounds, frame: number, acknowledged: boolean) {
  frame >>>= 0
  const thick = acknowledged && !(frame & 1)
  const opacity = ((thick ? 15 : 15 - Math.abs((frame % 12) - 2 * (frame % 6))) * 16) / 255
  const lines: number[][] = []
  for (let layer = 0; layer < (thick ? 4 : 2); layer++) {
    const x = bounds.x - layer,
      y = bounds.y - layer
    const right = bounds.x + bounds.width + layer,
      bottom = bounds.y + bounds.height + layer
    lines.push(
      [x, y, x + 6, y],
      [x, y, x, y + 6],
      [right - 6, y, right, y],
      [right, y, right, y + 6],
      [x, bottom, x + 6, bottom],
      [x, bottom - 6, x, bottom],
      [right - 6, bottom, right, bottom],
      [right, bottom - 6, right, bottom]
    )
  }
  return { opacity, lines }
}
