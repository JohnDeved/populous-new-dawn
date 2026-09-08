import rules from './original-rules.json' with { type: 'json' }
import lens from './original-skylens.json' with { type: 'json' }
import { multiplyShift16 } from './projection.ts'

export type SkyViewport = {
  x: number
  y: number
  width: number
  screenWidth: number
  surfaceOffset: number
}

// Defeat branch of 0x524a30, then 0x517830. The system palette is supplied
// by the caller; its animation/remapping is independent of this draw command.
export function defeatSky(
  counter: number,
  tribe: number,
  colors: readonly (readonly number[])[],
  view: SkyViewport
) {
  counter &= 255
  if (!counter) return null
  const [r, g, b] = colors[tribe],
    alpha = [0x30, 0x48, 0x60, 0x48][counter & 3]
  return {
    rect: [
      view.x,
      view.y,
      view.x + view.width,
      view.y + Math.trunc(view.surfaceOffset / view.screenWidth),
    ],
    color: ((alpha << 24) | (r << 16) | (g << 8) | b) >>> 0,
    flags: 2,
  }
}

// The D3D sky uses a screen-space lens grid, not the world projection.
export const createSkyMotion = () => ({
  angle: 0,
  previousAngle: 0,
  x: 0,
  y: 0,
  previousX: 0,
  previousY: 0,
})
export type SkyMotion = ReturnType<typeof createSkyMotion>

// Complete 0x523720. Each of 26 rows owns 81 pairs in a 96-pair stride;
// the remaining columns retain their previous contents.
export function fillSkyArray(grid: Int32Array, angle: number, x: number, y: number) {
  const s = rules.sine[angle],
    c = rules.sine[(angle + 512) & 2047]
  for (let row = 0; row < 26; row++)
    for (let col = 0; col < 81; col++) {
      const i = (row * 81 + col) * 2,
        a = lens[i] << 9,
        b = lens[i + 1] << 9,
        j = (row * 96 + col) * 2
      grid[j] = multiplyShift16(a, c) + multiplyShift16(b, s) + x
      grid[j + 1] = multiplyShift16(b, c) - multiplyShift16(a, s) + y
    }
}

// Complete 0x523830: camera translation wraps and sky rotation follows half
// the heading change. ticks is the original independent millisecond clock ×64.
export function updateSkyArray(
  p: SkyMotion,
  camera: { x: number; y: number; angle: number },
  ticks: number,
  grid: Int32Array
) {
  const angle = (camera.angle << 16) >> 16,
    x = (camera.x << 16) >> 16,
    y = (camera.y << 16) >> 16
  let turn = angle - p.previousAngle
  if (turn > 1024) turn -= 2048
  if (turn < -1024) turn += 2048
  const wrap = (n: number) => {
    if (n > 32768) n -= 65536
    if (n < -32768) n += 65536
    return n
  }
  const dx = wrap(((Math.imul(ticks, 17) >>> 9) - x + p.previousX) | 0),
    dy = wrap(((Math.imul(ticks, 9) >>> 9) - y + p.previousY) | 0)
  const at = (p.angle - angle) & 2047,
    c = rules.sine[(at + 512) & 2047],
    s = rules.sine[at]
  p.x = (p.x + multiplyShift16(dx, c) + multiplyShift16(dy, s)) | 0
  p.y = (p.y + multiplyShift16(dy, c) - multiplyShift16(dx, s)) | 0
  p.angle = (p.angle + (turn >> 1)) & 2047
  p.previousAngle = angle
  p.previousX = x
  p.previousY = y
  fillSkyArray(grid, p.angle, (p.x & 65535) << 9, (p.y & 65535) << 9)
}

// Complete 0x517310. The first interpolation always shifts by three,
// independently of the second interpolation's requested grid shift.
export function sampleSkyGrid(grid: Int32Array, shift: number, size: number) {
  const mask = (1 << shift) - 1,
    blend = (a: number, b: number, n: number, bits: number) =>
      (a + (Math.imul(b - a, n) >> bits)) | 0
  return rules.skyPoints.map(([x, y]) => {
    const sy = Math.imul(y, size) >>> 8,
      col = x >> shift,
      row = sy >> shift,
      a = (row * 96 + col) * 2,
      b = a + 192
    return [0, 1].map(k =>
      blend(
        blend(grid[a + k], grid[a + 2 + k], x & mask, 3),
        blend(grid[b + k], grid[b + 2 + k], x & mask, 3),
        sy & mask,
        shift
      )
    )
  })
}

// 0x517290 screen grid and 0x517420 vertex/triangle generation. Device blend
// capabilities are explicit; the live WebGL renderer supports alpha blending.
export function skyCloudLayer(
  grid: Int32Array,
  width: number,
  height: number,
  surfaceHeight: number,
  size: number,
  transparent = true,
  alphaBlend = true,
  opaqueFade = true,
  includeLeftMargin = false
) {
  const f = Math.fround,
    k = rules.skyConstants,
    uv = sampleSkyGrid(grid, 3, size),
    sx = f((width >>> 0) * k[1]),
    sy = f((height >>> 0) * k[2])
  const stretch = f((surfaceHeight / height) * k[4]),
    inverse = f(k[3] / surfaceHeight),
    alpha = transparent && alphaBlend,
    shade = !transparent && opaqueFade
  let flags = alpha || shade ? 0x180 : 0x190
  if (transparent) flags |= 2
  if (alpha) flags |= 0x40
  const vertices = rules.skyPoints.map(([x, y], i) => {
    const px = f(Math.trunc(x * sx)),
      py = f(Math.trunc(y * sy) * stretch)
    const a = alpha ? Math.max(0, Math.trunc(f(k[6] - py * inverse * k[5]))) : 255
    const gray = shade ? Math.max(0, Math.trunc(f(k[6] - py * inverse * k[7]))) : 255
    return {
      x: px,
      y: py,
      u: f(uv[i][0] * k[0]),
      v: f(uv[i][1] * k[0]),
      color: ((a << 24) | (gray << 16) | (gray << 8) | gray) >>> 0,
    }
  })
  return {
    vertices,
    triangles: rules.skyTriangles.slice(includeLeftMargin ? 0 : 6).map(t => [...t].reverse()),
    flags,
  }
}
