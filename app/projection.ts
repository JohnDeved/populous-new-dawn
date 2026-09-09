import native from './original-camera.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }

export type CameraConfig = (typeof native.views)[number]
export interface Projection {
  matrix: number[]
  curvature: number
  depth: number
  perspective: number
  scale: number
  width: number
  height: number
  centerX: number
  centerY: number
  fractionX: number
  fractionY: number
  pixelScaleX: number
  pixelScaleY: number
}
export interface ProjectedPoint {
  x: number
  y: number
  z: number
  screenX: number
  screenY: number
  flags: number
}

// 0x46c340: small values encode shade/light strength; an ARGB value is already colored.
export function vertexLighting(value: number, tint: number) {
  if (value & 0xff000000) return { diffuse: value >>> 0, specular: 0 }
  const shade = value < 32 ? value * 8 : 255
  const strength = Math.max(0, Math.min(256, value * 5 - 160))
  const channel = (shift: number) => (((tint >>> shift) & 255) * strength) >>> 8
  return {
    diffuse: (0xff000000 | (shade << 16) | (shade << 8) | shade) >>> 0,
    specular: (channel(16) << 16) | (channel(8) << 8) | channel(0),
  }
}

// Signed low 32 bits of a 64-bit product shifted right 16; no floating rounding.
export function multiplyShift16(a: number, b: number) {
  const ah = a >> 16,
    bh = b >> 16,
    al = a & 65535,
    bl = b & 65535
  return (((al * bl) >>> 16) + ah * bl + bh * al + (Math.imul(ah, bh) << 16)) | 0
}
const dot = (a: number[], b: number[]) =>
  (Math.imul(a[0], b[0]) + Math.imul(a[1], b[1]) + Math.imul(a[2], b[2])) | 0
const cross = (a: number[], b: number[]) => [
  (Math.imul(a[1], b[2]) - Math.imul(a[2], b[1])) >> 14,
  (Math.imul(a[2], b[0]) - Math.imul(a[0], b[2])) >> 14,
  (Math.imul(a[0], b[1]) - Math.imul(a[1], b[0])) >> 14,
]
function normalize(v: number[]) {
  const length = Math.floor(Math.sqrt(dot(v, v) >>> 0))
  if (!length) throw new RangeError('Degenerate native camera basis')
  return v.map(n => Math.trunc((n << 14) / length))
}

// 0x47fab0: rotate about a current basis row, then normalize/rebuild the basis.
export function rotateBasis(matrix: number[], angle: number, axis: 1 | 2 | 3) {
  const fixed = axis - 1
  const rows = [matrix.slice(0, 3), matrix.slice(3, 6), matrix.slice(6, 9)]
  const [x, y, z] = rows[fixed],
    s = rules.sine[angle & 2047] >> 2,
    c = rules.sine[(angle + 512) & 2047] >> 2
  const diagonal = (n: number) => {
    const squared = Math.imul(n, n) >> 14
    return (Math.imul(16384 - squared, c) >> 14) + squared
  }
  const xy = Math.imul(Math.imul(x, y) >> 14, 16384 - c) >> 14
  const xz = Math.imul(Math.imul(x, z) >> 14, 16384 - c) >> 14
  const yz = Math.imul(Math.imul(y, z) >> 14, 16384 - c) >> 14
  const sx = Math.imul(s, x) >> 14,
    sy = Math.imul(s, y) >> 14,
    sz = Math.imul(s, z) >> 14
  const rotation = [
    [diagonal(x), xy - sz, xz + sy],
    [xy + sz, diagonal(y), yz - sx],
    [xz - sy, yz + sx, diagonal(z)],
  ]
  for (let i = 0; i < 3; i++) if (i !== fixed) rows[i] = rotation.map(r => dot(r, rows[i]) >> 14)
  rows[2] = normalize(rows[2])
  rows[1] = normalize(cross(rows[2], rows[0]))
  rows[0] = normalize(cross(rows[1], rows[2]))
  return rows.flat()
}

// 0x47f480 builds yaw first, then pitch around the resulting horizontal basis.
export function cameraMatrix(yaw: number, pitch: number) {
  return rotateBasis(rotateBasis([16384, 0, 0, 0, 16384, 0, 0, 0, 16384], yaw, 2), -pitch, 1)
}

// 0x471490: object pitch/roll multiply on the left; heading rotates the basis.
export function modelMatrix(heading: number, pitch = 0, roll = 0) {
  const sp = rules.sine[pitch & 2047] >> 2,
    cp = rules.sine[(pitch + 512) & 2047] >> 2
  const sr = rules.sine[roll & 2047] >> 2,
    cr = rules.sine[(roll + 512) & 2047] >> 2
  const a = [
      [cr, -sr, 0],
      [sr, cr, 0],
      [0, 0, 16384],
    ],
    b = [
      [16384, 0, 0],
      [0, cp, -sp],
      [0, sp, cp],
    ]
  const matrix = a.flatMap(row => [0, 1, 2].map(i => dot(row, [b[0][i], b[1][i], b[2][i]]) >> 14))
  return heading || pitch || roll ? rotateBasis(matrix, -heading, 2) : matrix
}

// Native unsigned map coordinates preserve opposite signs at the half-world tie.
export function relativeCoordinate(coordinate: number, center: number) {
  const delta = (coordinate & 65535) - (center & 65535),
    magnitude = Math.abs(delta)
  if (!(magnitude & 32768)) return delta >> 1
  return (delta > 0 ? magnitude - 65536 : 65536 - magnitude) >> 1
}

// Raw PNTS coordinates, native object scale, and native camera-relative origin.
// The imported editor-sized meshes must be converted back to raw coordinates first.
export function modelPoint(
  raw: number[],
  scale: number,
  matrix: number[],
  origin: { x: number; y: number; z: number }
) {
  const p = raw.map(n => Math.imul(n, scale) >> 8)
  return {
    x: (dot(matrix.slice(0, 3), p) >> 14) + origin.x,
    y: (dot(matrix.slice(3, 6), p) >> 14) + origin.y,
    z: (dot(matrix.slice(6, 9), p) >> 14) + origin.z,
  }
}

// 0x46e450: half-open coarse-cell spans centered in the 222-row landscape buffer.
export function circularMeshBounds(diameter: number) {
  if (!Number.isInteger(diameter) || diameter < 0 || diameter > 222)
    throw new RangeError('Native mesh diameter exceeds its buffer')
  const rows = Array.from({ length: 222 }, () => [0, 0]),
    radius = diameter >> 1
  for (let y = 0; y < radius; y++) {
    let x = Math.floor(Math.sqrt(radius * radius - y * y))
    if (x < 3) x = 0
    rows[110 - y] = [110 - x, 110 + x]
    rows[110 + y] = [110 - x, 110 + x]
  }
  if (diameter < 220) {
    rows[109 - radius] = [...rows[110 - radius]]
    rows[110 - radius] = [...rows[111 - radius]]
  }
  return rows
}

// 0x46e510: rotate the configured quadrilateral and rasterize inclusive edges.
export function polygonMeshBounds(bounds: number[], heading: number) {
  if (bounds.length !== 8) throw new RangeError('Native mesh bounds need four points')
  const sine = rules.sine[-heading & 2047],
    cosine = rules.sine[(-heading + 512) & 2047]
  const points = Array.from({ length: 4 }, (_, i) => {
    const x = bounds[i * 2],
      y = bounds[i * 2 + 1]
    return (
      heading
        ? [
            (Math.imul(cosine, x) - Math.imul(sine, y)) >> 16,
            (Math.imul(sine, x) + Math.imul(cosine, y)) >> 16,
          ]
        : [x, y]
    ).map(n => Math.max(1, Math.min(220, ((n + 110) << 16) >> 16)))
  })
  const rows = Array.from({ length: 222 }, () => [0, 0])
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = points[i === 3 ? 0 : i],
      [bx, by] = points[i === 3 ? 3 : i + 1]
    if (ay === by) {
      rows[ay] = [Math.min(ax, bx), Math.max(ax, bx)]
      continue
    }
    const distance = Math.abs(by - ay),
      step = Math.trunc(((bx - ax) * 256) / distance),
      direction = by > ay ? 1 : -1
    for (let j = 0; j <= distance; j++) {
      const row = rows[ay + j * direction],
        x = ax + Math.trunc((j * step) / 256)
      if (row[0] === 0) {
        row[0] = x
        row[1] = x
      } else if (x < row[0]) row[0] = x
      else if (x > row[1]) row[1] = x
    }
  }
  return rows
}

// 0x467130 / 0x46d070: each cell belongs to the next vertex row;
// its span includes the start column and excludes the end column.
export function meshCellVisible(
  bounds: number[][],
  point: { x: number; y: number },
  center: { x: number; y: number },
  unwrapped = false
) {
  // Determine the cell before reducing coordinates to half-map precision.
  // An odd camera coordinate must not move objects on a cell boundary.
  const offset = (coordinate: number, origin: number) => {
    const cell = (coordinate >> 9) - (origin >> 9)
    return unwrapped ? cell : ((cell + 64) & 127) - 64
  }
  const x = offset(point.x, center.x) + 110,
    span = bounds[offset(point.y, center.y) + 111]
  return !!span && span[0] > 0 && x >= span[0] && x < span[1]
}

// 0x4673b0's eight-way VSTART offset, before tribe-specific animation selection.
export function spriteDirection(cameraHeading: number, objectHeading: number) {
  return ((((cameraHeading << 16) >> 16) - ((objectHeading << 16) >> 16) - 0x380) & 0x700) >> 8
}

// 0x476090 rescales both signed layer offsets and dimensions. Its input is the
// renderer's depth-sort bucket, not Euclidean distance from the camera.
export function spriteCoordinate(
  value: number,
  bucket: number,
  flags: number,
  view: Pick<CameraConfig, 'scale' | 'spriteScale' | 'shamanScale'>
) {
  if (!view.spriteScale) throw new RangeError('Native sprite scale divisor is zero')
  if (bucket < 0 && !(flags & 0x380)) return Math.trunc(Math.imul(view.shamanScale, value) / 256)
  let n = Math.trunc(
    Math.imul(Math.imul(view.scale, value), bucket < 0 ? 256 : 16) / view.spriteScale
  )
  const distance = Math.abs(bucket)
  if (distance >= 1792)
    n = (n + Math.trunc(Math.imul(Math.trunc(Math.imul(n, 14) / 16), distance - 1792) / -1792)) | 0
  if (bucket < 0) {
    const product = Math.imul(view.shamanScale, n)
    n = (product + ((product >> 31) & 255)) >> 16
  } else n >>= 4
  return Math.max(-256, Math.min(256, n))
}

// Native body, shadow and HFX queues share this depth-bucket calculation.
// The painter counts buckets from 1, although the linked-list array starts at 0.
export function spriteBucket(depth: number, bias: number) {
  const distance = (depth + 0x7000 + bias) | 0
  return (distance < 64 ? 0 : Math.min(3584, distance >> 4)) + 1
}

// 0x46f850 queues ground shadows with bias -192. The painter adds two screen
// pixels below the anchor; that offset is not scaled with the artwork.
export function spriteShadow(
  frame: { w: number; h: number },
  depth: number,
  flags: number,
  view: Pick<CameraConfig, 'scale' | 'spriteScale' | 'shamanScale'>
) {
  const bucket = spriteBucket(depth, -192)
  const width = flags & 0x380 ? spriteCoordinate(frame.w, bucket, flags, view) : frame.w
  const height = flags & 0x380 ? spriteCoordinate(frame.h, bucket, flags, view) : frame.h
  return { x: -Math.trunc(width / 2), y: 2 - height, width, height }
}

export function scaledEffectSize(
  frame: { w: number; h: number },
  effect: { scaleX: number; scaleY: number },
  depth: number,
  flags: number,
  view: Pick<CameraConfig, 'scale' | 'spriteScale' | 'shamanScale'>
) {
  const bucket = spriteBucket(depth, -128)
  const width = Math.imul(frame.w, effect.scaleX) >> 8
  const height = Math.imul(frame.h, effect.scaleY) >> 8
  if (!(flags & 0x380)) return { width, height }
  return {
    width: spriteCoordinate(width, bucket, flags, view),
    height: spriteCoordinate(height, bucket, flags, view),
  }
}

// Selection-arrow branch at 0x469415..0x4694f2 in the native person renderer.
// HFX 53 is 9×7. frameHeight is the rendered VFRA header height, not the
// composite image bounds; a headdress or weapon can extend outside that box.
export function selectionArrow(
  p: {
    owner: number
    player: number
    type: number
    selectionFlags: number
    x: number
    y: number
    frameHeight: number
    scaled: boolean
    bucket: number
    flags: number
  },
  view: Pick<CameraConfig, 'scale' | 'spriteScale' | 'shamanScale'>
) {
  if (p.owner !== p.player || p.type !== 1 || !(p.selectionFlags & 128)) return null
  const width = p.scaled ? spriteCoordinate(9, p.bucket, p.flags, view) : 9
  const height = p.scaled ? spriteCoordinate(7, p.bucket, p.flags, view) : 7
  return { x: (p.x - Math.trunc(width / 2)) | 0, y: (p.y - p.frameHeight) | 0, width, height }
}

// 0x4171f0 uses a signed product, not Euclidean nearest-resolution distance.
export function cameraConfigIndex(width: number, height: number) {
  let best = 0,
    bestScore = 0xfffffff
  for (let i = 0; i < 10; i++) {
    const v = native.views[i * 5]
    if (width === v.width && height === v.height) return i
    const score = Math.imul(Math.abs(v.width) - width, Math.abs(v.height) - height)
    if (score < bestScore) {
      best = i
      bestScore = score
    }
  }
  return best
}

// 0x416e50 replaces the file's normal-view bounds after resolution selection.
export function cameraMeshBounds(width: number, height: number) {
  if (width === 800 && height === 600) return [-14, -16, 14, -16, 25, 44, -25, 44]
  if (width === 1024 && height === 768) return [-16, -18, 16, -18, 30, 49, -30, 49]
  if (width === 1280 && height === 1024) return [-18, -20, 18, -20, 32, 54, -32, 54]
  return [-10, -16, 10, -16, 16, 39, -16, 39]
}

// Original resolution/view table, with the native resolution-specific bounds.
export function cameraPreset(index: number, preset = 0): CameraConfig {
  const view = native.views[index * 5 + preset]
  if (!view || !Number.isInteger(index) || !Number.isInteger(preset) || preset < 0 || preset > 4)
    throw new RangeError('Invalid native camera preset')
  return {
    ...view,
    bounds: view.boundsMode === 1 ? cameraMeshBounds(view.width, view.height) : [...view.bounds],
  }
}

// 0x41c700's flyby zoom interpolation; ordinary view switches have their own timer.
export function cameraConfig(index: number, zoom = 0, range = 16384): CameraConfig {
  if (!Number.isInteger(index) || index < 0 || index >= 10)
    throw new RangeError('Invalid native camera configuration')
  if (!Number.isInteger(zoom) || Math.abs(zoom) > range || range <= 0)
    throw new RangeError('Invalid native camera zoom')
  const base = native.views[index * 5]
  if (!zoom) return cameraPreset(index)
  const target = native.views[index * 5 + (zoom > 0 ? 2 : 3)],
    amount = Math.abs(zoom)
  const result = {
    ...base,
    bounds: [...base.bounds],
    boundsMode: 0,
    diameter: amount === range ? target.diameter : 50,
    scaledSprites: Number(!!(base.scaledSprites || target.scaledSprites)),
  }
  for (const key of ['curvature', 'scale', 'pitch', 'offsetY', 'horizon'] as const) {
    const value = (base[key] + Math.trunc(Math.imul(target[key] - base[key], amount) / range)) | 0
    result[key] =
      key === 'pitch' || key === 'offsetY' || key === 'horizon' ? (value << 16) >> 16 : value
  }
  return result
}

// 0x46dbe0 (with clip flags) / 0x46de00 (without). Inputs are native camera-relative
// X/Z half map coordinates and original height units; screen outputs are float32.
export function projectPoint(
  p: { x: number; y: number; z: number; flags?: number },
  v: Projection,
  clip = true
): ProjectedPoint {
  const m = v.matrix
  const x = (Math.imul(p.x, m[0]) + Math.imul(p.z, m[2])) >> 14
  let y = dot([m[3], m[4], m[5]], [p.x, p.y, p.z]) >> 14
  const z = dot([m[6], m[7], m[8]], [p.x, p.y, p.z]) >> 14
  const radiusSquared = (Math.imul(x << 1, x << 1) + Math.imul(z << 1, z << 1)) | 0
  y = (y - (multiplyShift16(radiusSquared, v.curvature) >> 16)) | 0
  const depth = (z + v.depth) | 0
  let sx: number, sy: number
  if (depth <= 0) {
    sx = -(v.centerX << (v.fractionX + 100)) | 0
    sy = -(v.centerY << (v.fractionY + 100)) | 0
  } else {
    const perspective = Math.trunc((1 << (v.perspective + 16)) / depth)
    sx = multiplyShift16(Math.imul(v.scale, x) >> (16 - v.fractionX), perspective)
    sy = multiplyShift16(Math.imul(v.scale, y) >> (16 - v.fractionY), perspective)
  }
  const screenX = Math.fround(v.pixelScaleX * sx + v.centerX),
    screenY = Math.fround(v.centerY - v.pixelScaleY * sy)
  let flags = p.flags ?? 0
  if (clip) {
    if (screenX < 0) flags |= 2
    else if (screenX >= v.width) flags |= 4
    else if (screenY < 0) flags |= 8
    else if (screenY >= v.height) flags |= 16
  }
  return { x, y, z, screenX, screenY, flags }
}
