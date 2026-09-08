import { nativeAngle, nativeStep, positionDistance, random } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import rules from './original-rules.json' with { type: 'json' }

type Point = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'heights' | 'flags'>
export type Lightning = {
  start: Point
  target: Point
  seed: number
  turn: number
  segments: { from: Point; to: Point }[]
}
export type LightningLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  alpha: number
  width: number
}
const short = (n: number) => (n << 16) >> 16

// 0x511ae0 geometry. Its first-turn damage/fire allocations remain world adapters.
export function stepLightning(land: Ground, b: Lightning, game: { randomState: number }) {
  b.turn++
  b.segments = []
  if (b.turn > 3) return
  const angle = nativeAngle(short(b.target.x - b.start.x), -short(b.target.y - b.start.y))
  const stride = Math.trunc(positionDistance(b.start, b.target) / 8),
    ground = terrainPointHeight(land, b.start)
  const privateRandom = { randomState: b.seed },
    points: Point[] = []
  for (let i = 0; i < 9; i++) {
    const phase = random(i ? game : privateRandom) & 2047,
      radius = 200 - i * 25
    const p = nativeStep({ x: b.start.x / 256, z: -b.start.y / 256 }, angle, short(i * stride))
    points.push({
      x:
        (Math.round(p.x * 256) + (Math.imul(rules.sine[(phase + 512) & 2047], radius) >> 16)) &
        65535,
      y: (Math.round(-p.z * 256) + (Math.imul(rules.sine[phase], radius) >> 16)) & 65535,
      h: short(ground + 1024 - i * 128),
    })
  }
  points[0] = { ...b.start }
  for (let i = 0; i < 8; i++) {
    const a = points[i],
      next = points[i + 1],
      from = { ...a, h: Math.max(a.h, terrainPointHeight(land, a)) }
    b.segments.push({ from, to: { x: next.x, y: next.y, h: from.h + short(next.h - a.h) } })
  }
}

// 0x475350. Branches are screen-space, use the cosmetic RNG, and consume new
// draws each rendered frame. The parent line is emitted by 0x46b0f5 first.
export function lightningLines(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cosmetic: { randomState: number }
) {
  const lines: LightningLine[] = [{ x1, y1, x2, y2, alpha: 200, width: 3 }]
  let drawAlpha = 200 // 0x5da07c is shared across recursive calls, not restored.
  function branch(x: number, y: number, alpha: number, length: number) {
    if (length <= 4) return
    const side = random(cosmetic) & 1
    length >>= 1
    const count = Math.floor((length + (random(cosmetic) % length) + 11) / 12)
    drawAlpha = (alpha * 7) >> 3
    const childAlpha = drawAlpha
    for (let i = 0; i < count; i++) {
      const dx = (random(cosmetic) % 12) * (side ? 1 : -1),
        nx = short(x + dx),
        ny = short(y + 12)
      lines.push({ x1: x, y1: y, x2: x + dx, y2: y + 12, alpha: drawAlpha, width: 2 })
      x = nx
      y = ny
      if (!(random(cosmetic) & 3)) branch(x, y, childAlpha, length)
    }
  }
  branch(short(x1), short(y1), 128, 100)
  return lines
}

// 0x516500: integer-angle, ceil-rounded textured strip corners. Native UVs
// are (.2,.5), (.2,.5), (.8,.5), (.8,.5) across the 32x32 texture.
export function lightningQuad(l: LightningLine) {
  const angle = (nativeAngle(l.x2 - l.x1, l.y2 - l.y1) - 512) & 2047
  const dx = -(rules.sine[angle] << (l.width & 31)) / 131072,
    dy = (rules.sine[(angle + 512) & 2047] << (l.width & 31)) / 131072
  return [
    Math.ceil(l.x1 + dx),
    Math.ceil(l.y1 + dy),
    Math.ceil(l.x2 + dx),
    Math.ceil(l.y2 + dy),
    Math.ceil(l.x2 - dx),
    Math.ceil(l.y2 - dy),
    Math.ceil(l.x1 - dx),
    Math.ceil(l.y1 - dy),
  ]
}

// 0x4b7de0's procedural texture, decoded from its ARGB4444 surface format.
export function lightningTexture() {
  const pixels = new Uint8Array(32 * 32 * 4)
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const v = Math.min(x, 31 - x) * Math.min(y, 31 - y),
        gray = (v >> 4) * 17
      pixels.set([gray, gray, ((192 + (v >> 2)) >> 4) * 17, gray], (y * 32 + x) * 4)
    }
  return pixels
}
