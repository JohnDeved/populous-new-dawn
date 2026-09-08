import { multiplyShift16 } from './projection.ts'
import rules from './original-rules.json' with { type: 'json' }
import type { Animation } from './animation.ts'

// 0x42adc0 nearest-color lookup on the opening landscape palette, and
// the normal tribe marker indices at 0x59bc19.
export const globePalette = {
  outline: 172,
  tree: 228,
  wild: 182,
  clear: 23,
  tribes: [220, 244, 236, 227],
}

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

// 0x42dd50 clamps outside cell corners to the rim before the quad winding test.
// Its rim branch uses positive screen Y, unlike the interior map projection.
export function globeCellPoint(view: GlobeView, x: number, y: number) {
  if (globeVisible(view, x, y)) return globePoint(view, x, y)
  const dx = short(x - view.x) >> 9,
    dy = short(y - view.y) >> 9,
    scale = Math.trunc((view.height * 4) / 10) / Math.sqrt(dx * dx + dy * dy)
  return {
    x: (view.width >> 1) + Math.trunc(dx * scale),
    y: (view.height >> 1) + Math.trunc(dy * scale),
  }
}

// 0x42d390/0x42d5b0 share this projected cell and two signed winding tests.
export function globeCellQuad(view: GlobeView, cell: number) {
  const x = (cell & 127) << 9,
    y = (cell >> 7) << 9,
    a = globeCellPoint(view, x, y),
    b = globeCellPoint(view, x + 512, y),
    c = globeCellPoint(view, x + 512, y + 512),
    d = globeCellPoint(view, x, y + 512)
  if (
    Math.imul(c.y - b.y, b.x - a.x) > Math.imul(c.x - b.x, b.y - a.y) ||
    Math.imul(d.y - c.y, c.x - a.x) > Math.imul(d.x - c.x, c.y - a.y)
  )
    return null
  return [a, b, c, d]
}

// Complete 0x41edb0 cell decision with 0x4f1280's building visibility path.
// Vehicle passengers are outside this building-only adapter.
export function globeFootprint(
  view: GlobeView,
  cell: number,
  flags: number,
  building: { id: number; tribe: number } | undefined,
  input: { player: number; turn: number; fog: boolean; concealed: number }
) {
  if (input.fog && !(flags & 8)) return null
  let tribe = -1,
    translucent = true,
    buildingId: number | null = null
  if (flags & 0x80) {
    tribe = input.player
    translucent = !(flags & 0x100 && input.turn & 1)
  } else if (building && flags & 0x600) {
    const { tribe: owner, id } = building
    if (flags & 0x200) {
      if (owner !== input.player && input.concealed & (1 << owner)) return null
      buildingId = id
    }
    tribe = owner
  }
  if (tribe < 0 || !globeVisible(view, (cell & 127) << 9, (cell >> 7) << 9)) return null
  return {
    color: translucent ? (rules.tribeEffectPalettes[tribe] << 4) | 3 : globePalette.clear,
    translucent,
    buildingId,
    quad: globeCellQuad(view, cell),
  }
}

// 0x41d730: huts expose their count only to their owner; towers show the
// last recognized live occupant among the native descriptor's slots.
export function globeBuildingIcon(
  model: number,
  count: number,
  owned: boolean,
  occupants: readonly number[]
) {
  if (model >= 1 && model <= 3)
    return [0, 0x86, 0x8a, 0x8f][model] + (owned ? (count << 24) >> 24 : 0)
  if (model === 4) {
    let icon = 0x78
    if (count)
      for (const person of occupants.slice(0, rules.buildingCapacity[4])) {
        icon =
          ({ 2: 0xa3, 3: 0x74, 4: 0x76, 5: 0x77, 6: 0x75, 7: 0x85 } as Record<number, number>)[
            person
          ] ?? icon
      }
    return icon
  }
  return (
    (
      {
        5: 0xa6,
        6: 0xa7,
        7: 0xa4,
        8: 0xa5,
        13: 0xa8,
        15: 0xa9,
        17: 0x43b,
        18: 0x79,
        19: 0x95,
      } as Record<number, number>
    )[model] ?? 0x434
  )
}

// Keep the scale numerator wide: the original signed shift overflows on tall
// desktop viewports. Native dimensions through 768px agree without this overflow.
export function globeIconRect(view: GlobeView, point: Point, width: number, height: number) {
  const radius = Math.trunc((view.height * 4) / 10) ** 2,
    distance =
      ((view.width >> 1) - point.x + (width >> 1)) ** 2 +
      ((view.height >> 1) - point.y + (height >> 1)) ** 2
  if (distance > radius >> 1) {
    const scale =
      Math.trunc(((radius - Math.min(radius, distance)) * 32768) / (radius >> 1)) + 32768
    width = Math.max(1, Math.min(width, Math.imul(width, scale) >> 16))
    height = Math.max(1, Math.min(height, Math.imul(height, scale) >> 16))
  }
  return { x: point.x - (width >> 1), y: point.y - (height >> 1), width, height }
}

// 0x41f370 / 0x49bb20: a 32-segment wrapped range circle. A segment survives
// when either endpoint is visible; the other endpoint keeps its normal projection.
export function globeCircle(view: GlobeView, origin: Point, radius: number, phase: number | null) {
  const alpha = phase === null ? 255 : ((rules.sine[phase & 2047] << 6) >> 16) + 128
  const points = Array.from({ length: 32 }, (_, i) => ({
    x: short(origin.x + (Math.imul(rules.sine[(i * 64 + 512) & 2047], radius) >> 16)),
    y: short(origin.y + (Math.imul(rules.sine[i * 64], radius) >> 16)),
  }))
  return points.flatMap((a, i) => {
    const b = points[(i + 1) & 31]
    if (!globeVisible(view, a.x, a.y) && !globeVisible(view, b.x, b.y)) return []
    const from = globePoint(view, a.x, a.y),
      to = globePoint(view, b.x, b.y)
    return [{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, alpha, width: 1 }]
  })
}

// HFX branch of 0x41e5b0. The globe uses unscaled, bottom-centered art.
export function globeEffectFrame(animation: Pick<Animation, 'object' | 'draw' | 'f1' | 'palette'>) {
  const id =
      short(animation.object) +
      (rules.animationDescriptors[animation.draw].hold > 1 ? (animation.f1 & 65535) >> 2 : 0),
    palette = (animation.palette << 24) >> 24
  if (id === 0x650 || palette >= 16) return null
  if (palette < -15) return { id, palette: null }
  return { id, palette: palette === 15 ? 0 : palette }
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

export interface GlobeMotion {
  position: Point
  origin: Point
  press: Point
  velocity: Point
  dragging: boolean
}

// 0x42d1f0 only grabs the visible disc; a miss leaves existing motion intact.
export function beginGlobeDrag(motion: GlobeMotion, view: GlobeView, pointer: Point) {
  if (!globePick(view, pointer.x, pointer.y)) return false
  motion.position = { x: view.x, y: view.y }
  motion.origin = { ...motion.position }
  motion.press = { ...pointer }
  motion.velocity = { x: 0, y: 0 }
  motion.dragging = true
  return true
}

// Complete 0x42d240: sample once per presentation frame. Holding still clears
// velocity; release keeps the last clamped velocity without friction.
export function stepGlobeMotion(motion: GlobeMotion, pointer: Point, height: number) {
  if (motion.dragging) {
    const next = globeDrag(
      motion.origin,
      pointer.x - motion.press.x,
      pointer.y - motion.press.y,
      height
    )
    motion.velocity.x = Math.max(-2048, Math.min(2048, (next.x - motion.position.x) | 0))
    motion.velocity.y = Math.max(-2048, Math.min(2048, (next.y - motion.position.y) | 0))
    motion.position = next
  } else {
    motion.position.x = (motion.position.x + motion.velocity.x) | 0
    motion.position.y = (motion.position.y + motion.velocity.y) | 0
  }
  return motion.velocity
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
