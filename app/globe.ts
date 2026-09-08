import { multiplyShift16 } from './projection.ts'

// 0x42adc0 nearest-color lookup on the opening landscape palette, and
// the normal tribe marker indices at 0x59bc19.
export const globePalette = { outline: 172, tree: 228, wild: 182, tribes: [220, 244, 236, 227] }

interface Point {
  x: number
  y: number
}
export type GlobeView = Point & { width: number; height: number }
const short = (n: number) => (n << 16) >> 16
const even = (n: number) => {
  const floor = Math.floor(n)
  return n - floor === 0.5 ? floor + (floor & 1) : Math.round(n)
}

// 0x42dae0/0x42daa0. The globe is a circular projection of the wrapped map.
// Its native radius is 40 cells, with a screen radius of 40% of the height.
export function globePoint(view: GlobeView, x: number, y: number) {
  const dx = short(x - view.x) / 512,
    dy = short(y - view.y) / 512,
    gain = Math.fround(Math.trunc((view.height * 4) / 10) * 80),
    factor = gain / (dx * dx + dy * dy + 1600)
  return {
    x: (view.width >> 1) + even(Math.fround(factor * dx)),
    y: view.height - ((view.height >> 1) + even(Math.fround(Math.fround(factor) * dy))),
  }
}
export function globeVisible(view: Point, x: number, y: number) {
  const dx = short(x - view.x) >> 4,
    dy = short(y - view.y) >> 4
  return dx * dx + dy * dy < 1280 * 1280
}

// Active-drag branch of 0x42d240. Always measure from the press snapshot so
// integer rounding does not accumulate differently with mouse event frequency.
export function globeDrag(origin: Point, dx: number, dy: number, height: number) {
  const scale = Math.trunc(0x320000 / Math.trunc((height * 4) / 10))
  return {
    x: (origin.x + (Math.imul(-dx, scale) >> 8)) | 0,
    y: (origin.y + (Math.imul(dy, scale) >> 8)) | 0,
  }
}

// 0x42de90. Invert the near half of the projection; the outer disc has no map hit.
export function globePick(view: GlobeView, x: number, y: number): Point | null {
  const gain = Math.trunc((view.height * 4) / 10) * 80,
    dx = (x - (view.width >> 1)) / gain,
    dy = -(y - (view.height >> 1)) / gain,
    distance = Math.sqrt(dx * dx + dy * dy),
    discriminant = 1 - distance * 1600 * distance * 4
  if (discriminant < 0) return null
  if (!distance) return { x: view.x, y: view.y }
  const length = ((1 - Math.sqrt(discriminant)) / (distance * 2)) * 512,
    angle = Math.atan2(dx, dy)
  return {
    x: (view.x + Math.trunc(Math.sin(angle) * length)) | 0,
    y: (view.y + Math.trunc(Math.cos(angle) * length)) | 0,
  }
}

// 0x42e223: separate globe sunlight, edge brightening and specular highlight.
export function globeShade(view: GlobeView, point: Point) {
  const scale = 1 / Math.trunc((view.height * 4) / 10),
    x = (point.x - (view.width >> 1)) * scale,
    y = (point.y + (view.height >> 1) - view.height) * scale,
    squared = x * x + y * y,
    light =
      Math.sqrt(1.05 - squared) * Math.fround(0.8) - y * Math.fround(0.4) + x * Math.fround(0.4),
    rounded = Math.fround(light),
    specular = Math.fround(Math.fround((light * rounded) ** 2) * Math.fround(0.2)),
    diffuse = Math.max(Math.fround(-0.2), Math.fround(rounded * Math.fround(0.4))),
    edge = Math.max(0, Math.fround((squared - Math.fround(0.9)) * 2)),
    fixed = Math.max(
      0x140000,
      Math.min(0x3f0000, Math.trunc((diffuse + edge + specular + Math.fround(0.4)) * 4194304))
    ),
    shade = fixed >> 13
  return {
    diffuse: Math.min(255, shade),
    specular: shade > 352 ? Math.min(255, Math.trunc((shade - 352) ** 2 / 200)) : 0,
  }
}

// 0x462e60/0x462ea0: mark both parents of a required adaptive-mesh vertex.
const trailing = (n: number) => (n ? 31 - Math.clz32(n & -n) : 7)
const rank = (x: number, y: number) => {
  const low = trailing(x | y)
  return low * 2 + (low < trailing(x & y) ? -1 : 0)
}
export function globeMesh(view: GlobeView) {
  const marked = new Uint8Array(32768)
  function mark(x: number, y: number) {
    if (marked[y * 256 + x]) return
    marked[y * 256 + x] = 1
    const level = rank(x, y) + 1,
      step = 1 << (level >> 1)
    for (const sign of [-1, 1]) {
      let px = x,
        py = (y + sign * step) & 127
      if (level & 1) {
        px = (x - step) & 127
        if (rank(px, py) !== level) px = (x + step) & 127
      } else if (rank(px, py) !== level) {
        px = (x + sign * step) & 127
        py = y
      }
      mark(px, py)
    }
  }
  for (let y = 0; y < 128; y += 4) for (let x = 0; x < 128; x += 4) marked[y * 256 + x] = 1
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 40)
    mark(
      ((view.x + Math.trunc(Math.sin(angle) * 20480)) & 0xfe00) >> 9,
      ((view.y + Math.trunc(Math.cos(angle) * 20480)) & 0xfe00) >> 9
    )
  for (let y = -5; y < 5; y++)
    for (let x = -5; x < 5; x++)
      mark(((view.x >> 9) + x + 10) & 127, ((view.y >> 9) + y - 10) & 127)
  const triangles: { points: Point[]; tile: Point }[] = []
  function split(a: Point, b: Point, c: Point, tile: Point) {
    const x = (a.x + c.x) >> 1,
      y = (a.y + c.y) >> 1
    if (!((x | y) & 1) && marked[(y & 127) * 256 + (x & 127)]) {
      const middle = { x, y }
      split(b, middle, a, tile)
      split(c, middle, b, tile)
    } else triangles.push({ points: [a, b, c], tile })
  }
  for (let y = 0; y < 128; y += 4)
    for (let x = 0; x < 128; x += 4) {
      const a = { x, y },
        b = { x: x + 4, y },
        c = { x: x + 4, y: y + 4 },
        d = { x, y: y + 4 }
      for (const [p, q, r] of (x + y) & 4
        ? [
            [d, a, b],
            [b, c, d],
          ]
        : [
            [a, b, c],
            [c, d, a],
          ])
        if ([p, q, r].some(point => globeVisible(view, point.x << 9, point.y << 9)))
          split(p, q, r, a)
    }
  return triangles
}

// 0x42dbf0/0x42edb0: fixed seed and sixteen parallax layers, independent of game RNG.
export function globeStar(view: GlobeView, x: number, y: number) {
  x = short(x)
  y = short(y)
  if (x > 0 && y > 0) {
    if (x < 16384 && y < 16384) {
      x += 16384
      y += 16384
    }
  } else if (x > 0 && y <= 0) {
    if (x < 16384 && y > -16384) {
      x += 16384
      y -= 16384
    }
  } else if (x < 0 && y > 0) {
    if (x > -16384 && y < 16384) {
      x -= 16384
      y += 16384
    }
  } else if (x > -16384 && y > -16384) {
    x -= 16384
    y -= 16384
  }
  x *= 2
  y *= 2
  const distance = ((multiplyShift16(x, x) + multiplyShift16(y, y)) >> 1) + 16384,
    scale = multiplyShift16(distance, Math.max(view.width, view.height))
  return {
    x: (view.width >> 1) + multiplyShift16(x, scale),
    y: (view.height >> 1) + multiplyShift16(y, scale),
  }
}
export function globeStars(view: GlobeView, offsets: Int32Array) {
  let seed = 123456789
  const random = () => {
    const n = (Math.imul(seed, 0x24a1) + 0x24df) | 0
    return (seed = (n >>> 13) | (n << 19))
  }
  const colors = [
    0xffffffff, 0xff808080, 0xffc0c0c0, 0xffaa80ff, 0xff000080, 0xff8080c0, 0xffa0a0ff, 0xffb4b4b4,
  ]
  // The native stream includes its initialized first vertex and omits its last.
  const stars = [{ x: 0, y: 0, color: 0xffffffff }]
  for (let i = 0; i < 1000; i++) {
    const layer = (i + 1) & 15,
      x = ((random() & 0x7fff80) >> 7) + offsets[layer],
      y = ((random() & 0x7fff80) >> 7) + offsets[layer + 16],
      color = colors[(random() >> 7) & 7],
      p = globeStar(view, x, y)
    if (p.x >= 0 && p.y >= 0 && p.x < view.width && p.y < view.height) stars.push({ ...p, color })
  }
  stars.pop()
  return stars
}
export function moveGlobeStars(offsets: Int32Array, dx: number, dy: number) {
  for (let i = 0; i < 16; i++) {
    offsets[i] += multiplyShift16(dx, 0x2000 + i * 0x600)
    offsets[i + 16] += multiplyShift16(-dy, 0x2000 + i * 0x600)
  }
}
