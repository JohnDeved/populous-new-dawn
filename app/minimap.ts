import rules from './original-rules.json' with { type: 'json' }
import type { NativeTerrain } from './native-terrain.ts'
import type { TerrainTextures } from './terrain-texture.ts'

interface Point {
  x: number
  y: number
}

export type MinimapObject = Point & {
  category: number
  model: number
  tribe: number
  hidden: boolean
  visible: boolean
}

// 0x4206e0: the minimap has its own height/brightness lookup, without ground detail.
export function minimapTerrain(
  land: Pick<NativeTerrain, 'heights' | 'cliffs' | 'flags'>,
  brightness: Uint8Array,
  textures: TerrainTextures,
  width: number,
  height: number,
  fog = false
) {
  const pixels = new Uint8Array(width * height),
    dx = Math.trunc(16777216 / width),
    dy = Math.trunc(16777216 / height)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const cell = (((y * dy) >> 17) & 127) * 128 + (((x * dx) >> 17) & 127),
        h = land.heights[cell],
        color = land.cliffs[cell]
          ? Math.min(1151, h + 140) * 256 + brightness[cell]
          : h * 256 + 30784
      pixels[(height - 1 - y) * width + x] =
        fog && !(land.flags[cell] & 8) ? 172 : textures.colors[color]
    }
  return pixels
}

// Dense browser rows also support displays beyond the original 256-byte stride.
export function minimapRGBA(indexed: Uint8Array, palette: Uint8Array) {
  const pixels = new Uint8ClampedArray(indexed.length * 4)
  for (let i = 0; i < indexed.length; i++) {
    const color = indexed[i] * 4,
      at = i * 4
    pixels[at] = palette[color]
    pixels[at + 1] = palette[color + 1]
    pixels[at + 2] = palette[color + 2]
    pixels[at + 3] = 255
  }
  return pixels
}

// 0x420100: rotate the full map's rows/columns around the snapped camera cell.
export function minimapScroll(width: number, height: number, center: Point) {
  return {
    x: (((((center.x >> 8) & 254) + 128) & 255) * width) >> 8,
    y: height - ((((((center.y >> 8) & 254) + 128) & 255) * height) >> 8),
  }
}

// 0x41fce0: screen pixels -> source texture pixels. Canvas uses its inverse to draw.
export function minimapTransform(width: number, height: number, heading: number) {
  const angle = 2047 - (heading & 2047),
    sin = ((rules.sine[angle] / 65536) * 5) / 6,
    cos = ((rules.sine[(angle + 512) & 2047] / 65536) * 5) / 6,
    x = width >> 1,
    y = height >> 1
  return [cos, -sin, sin, cos, x - cos * x - sin * y, y + sin * x - cos * y]
}

// Invert the displayed terrain. Native click-command scheduling remains separate.
export function minimapPick(
  width: number,
  height: number,
  center: Point,
  heading: number,
  point: Point
) {
  const [a, b, c, d, e, f] = minimapTransform(width, height, heading),
    scroll = minimapScroll(width, height, center),
    x = a * point.x + c * point.y + e + scroll.x,
    y = b * point.x + d * point.y + f + scroll.y
  return {
    x: Math.floor((x / width) * 65536) & 65535,
    y: Math.floor(((height - 1 - y) / height) * 65536) & 65535,
  }
}

// 0x4202d0: markers are placed in the scrolled texture, before its rotation.
export function minimapMarkers(
  objects: MinimapObject[],
  width: number,
  height: number,
  center: Point,
  flags: number,
  turn: number,
  scale = 0
) {
  const marks: (Point & { color: number; size?: number; sprite?: number })[] = []
  // Native buildings inherit the previous marker size; its initial stack value
  // is uninitialized. Use one pixel until a person/stone establishes the size.
  let small = true
  for (const object of objects) {
    const { category, model, tribe, visible } = object
    let color = 172
    if (category === 1) {
      if (tribe === -1) {
        color = 191
        small = true
      } else {
        if (object.hidden || (!visible && flags & 256)) continue
        color = [223, 246, 239, 229][tribe]
        small = false
      }
    } else if (category === 2) {
      if (!visible && flags & 512) continue
      color = [218, 242, 236, 226][tribe]
    } else if (category === 6 && model === 2) small = true
    else if (!(category === 10 && model === 8 && turn & 4)) continue
    const x = (((((object.x >> 8) & 254) - ((center.x >> 8) & 254) + 128) & 255) * width) >> 8,
      y =
        height - ((((((object.y >> 8) & 254) - ((center.y >> 8) & 254) + 134) & 255) * height) >> 8)
    if (category === 1 && model === 7) {
      const radius = (2 >> scale) + 1
      marks.push(
        { x: x - radius + 1, y: y - radius + 1, color, sprite: 1500 + radius },
        { x: x - radius + 1, y: y - radius + 1, color: 172, sprite: 1519 + radius }
      )
    } else if (category === 10) marks.push({ x, y, color: -1, sprite: 59 })
    else marks.push({ x, y, color, size: small ? 1 : 2 })
  }
  return marks
}
