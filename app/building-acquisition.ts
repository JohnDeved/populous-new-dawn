import { nativeAngle, short } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }
import models from './original-models.json' with { type: 'json' }
import type { WorshipAcquisitionGeometry } from './worship-acquisition.ts'

// Source-derived M1 controller/geometry; accepted finite reference at
// 5fedc5f6: decomp/research/building-acquisition-screen/composed-reference.md.
// This computes CPU feedback, not visibility or original GPU pixels.
export interface BuildingFaceState {
  threshold: number
  angles: number[]
  heading: number
  countdown: number
  flags: number
}
export interface BuildingAcquisitionController {
  active: boolean
  phase: number
  visits: number
  pending: boolean
  model: 103
  giftId: number
  family: 'building'
  geometry: WorshipAcquisitionGeometry
  x: number
  y: number
  scale: number
  yaw: number
  tilt: number
  target: number[]
  center: number[]
  spin: number
  radius: number
  delta: number
  allStarted: boolean
  faces: BuildingFaceState[]
}
export interface BuildingFaceProjection {
  face: number
  transformed: number[][]
  projected: number[][]
  flight: number
}
export interface BuildingAcquisitionDrawCommand {
  kind: 'building'
  family: 'building'
  giftId: number
  model: 7
  geometry: WorshipAcquisitionGeometry
  whole: boolean
  selected: number[]
  submissions: BuildingFaceProjection[]
}

// Undo the existing import's exact model scaling/reflected Z. Six-decimal
// positions recover all original integer coordinates, verified against FACS/PNTS.
const camp = models['103']
export const campCorners: number[][][] = []
for (let face = 0, vertex = 0; face < camp.faces.length; face += 2) {
  const corners = camp.faces[face] === 3 ? [0, 1, 2] : [0, 1, 2, 5]
  campCorners.push(
    corners.map(corner =>
      [0, 1, 2].map(
        axis =>
          Math.round(camp.p[(vertex + corner) * 3 + axis] * camp.scale * 3) * (axis === 2 ? -1 : 1)
      )
    )
  )
  vertex += corners.length === 3 ? 3 : 6
}
const { trunc, imul: mul } = Math
const dot = (a: number[], b: number[]) => (mul(a[0], b[0]) + mul(a[1], b[1]) + mul(a[2], b[2])) | 0
const cross = (a: number[], b: number[]) => [
  (mul(a[1], b[2]) - mul(a[2], b[1])) >> 14,
  (mul(a[2], b[0]) - mul(a[0], b[2])) >> 14,
  (mul(a[0], b[1]) - mul(a[1], b[0])) >> 14,
]
const identity = () => [
  [16384, 0, 0],
  [0, 16384, 0],
  [0, 0, 16384],
]
const transform = (matrix: number[][], point: number[]) => matrix.map(row => dot(row, point) >> 14)
const matrixProduct = (a: number[][], b: number[][]) =>
  a.map(row =>
    [0, 1, 2].map(
      i =>
        dot(
          row,
          b.map(r => r[i])
        ) >> 14
    )
  )

function normalized(row: number[]) {
  const length = Math.floor(Math.sqrt(dot(row, row) >>> 0))
  return row.map(value => trunc((value << 14) / length))
}
function rotations(angle: number) {
  const s = rules.sine[angle & 2047] >> 2,
    c = rules.sine[(angle + 512) & 2047] >> 2
  return {
    x: [
      [16384, 0, 0],
      [0, c, -s],
      [0, s, c],
    ],
    y: [
      [c, 0, s],
      [0, 16384, 0],
      [-s, 0, c],
    ],
    z: [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 16384],
    ],
  }
}
function globalMatrix(yaw: number, tilt: number) {
  // 0047fab0(axis2) on identity rotates rows0/2 then normalizes row2,
  // row1=cross(row2,row0), row0=cross(row1,row2). Do not omit this normalization.
  const r = rotations(-yaw).y
  let row0 = [r[0][0], r[1][0], r[2][0]]
  const row2 = normalized([r[0][2], r[1][2], r[2][2]])
  const row1 = normalized(cross(row2, row0))
  row0 = normalized(cross(row1, row2))
  return matrixProduct(rotations(tilt).x, [row0, row1, row2])
}
function floatRatio(value: number): [bigint, bigint] {
  const buffer = new DataView(new ArrayBuffer(4))
  buffer.setFloat32(0, value)
  const bits = buffer.getUint32(0),
    exponent = ((bits >>> 23) & 255) - 150
  let numerator = BigInt((bits & 0x7fffff) | 0x800000) * (bits >>> 31 ? BigInt(-1) : BigInt(1))
  let denominator = BigInt(1)
  if (!value) return [BigInt(0), BigInt(1)]
  if (exponent >= 0) numerator <<= BigInt(exponent)
  else denominator <<= BigInt(-exponent)
  return [numerator, denominator]
}
function flightDelta(target: number, projected: number, countdown: number) {
  // Exact rational evaluation of the bounded x87 expression from a float32
  // projected corner and float32(0.1), then 0055bc54 truncation toward zero.
  const [p, pd] = floatRatio(projected),
    [tenth, td] = floatRatio(Math.fround(0.1))
  return Number(((BigInt(target) * pd - p) * BigInt(11 - countdown) * tenth) / (pd * td))
}

export function buildingGeometryVisit(controller: BuildingAcquisitionController, whole = false) {
  const global = globalMatrix(controller.yaw, controller.tilt)
  const selected: number[] = [],
    submissions: BuildingFaceProjection[] = []
  for (const [index, source] of campCorners.entries()) {
    const face = controller.faces[index]
    let points = source.map(([x, y, z]) => [x, y, z])
    if (!whole) {
      if (!(face.flags & 3) && face.threshold) {
        const angle = (nativeAngle(short(points[0][0]), -short(points[0][2])) - face.heading) & 2047
        const dx = Math.floor((rules.sine[angle] * face.threshold) / 65536)
        const dz = Math.floor((rules.sine[(angle + 512) & 2047] * face.threshold) / 65536)
        points = points.map(([x, y, z]) => [(x + dx) | 0, y, (z + dz) | 0])
      }
      if (face.angles.some(Boolean)) {
        const center = [0, 1, 2].map(i =>
          trunc(points.reduce((sum, p) => (sum + p[i]) | 0, 0) / points.length)
        )
        let matrix = identity()
        matrix = matrixProduct(rotations(face.angles[0]).y, matrix)
        matrix = matrixProduct(rotations(face.angles[1]).x, matrix)
        matrix = matrixProduct(rotations(face.angles[2]).z, matrix)
        points = points.map(p =>
          transform(
            matrix,
            p.map((v, i) => (v - center[i]) | 0)
          ).map((v, i) => (v + center[i]) | 0)
        )
      }
    }
    const matrix = !whole && face.flags & 1 ? globalMatrix(face.heading, controller.tilt) : global
    const transformed = points.map(p => transform(matrix, p))
    let { scale } = controller
    if (!whole && face.flags & 1)
      scale = face.countdown > 0 ? controller.scale - trunc(controller.scale / face.countdown) : 0
    const projected = transformed.map(([x, y]) => [
      Math.fround(mul(x, scale) / 256 + controller.x),
      Math.fround(-mul(y, scale) / 256 + controller.y),
    ])
    if (!whole && selected.length < 4 && face.flags & 2) {
      const depth = (transformed[0][2] + transformed[1][2] + transformed[2][2] + 3000) | 0
      if (face.threshold && face.threshold >= depth) {
        face.flags |= 4
        selected.push(index)
      }
      if (face.threshold < depth) face.threshold = short(depth)
    }
    if (!whole && face.flags & 1 && face.countdown > 0) {
      const delta = controller.target.map((value, i) =>
        flightDelta(value, projected[0][i], face.countdown)
      )
      for (const p of projected) for (let i = 0; i < 2; i++) p[i] = Math.fround(p[i] + delta[i])
    }
    // Admission is visit-owned and precedes clipping. Drawing consumes these saved vertices.
    submissions.push({
      face: index,
      transformed,
      projected,
      flight: !whole && face.flags & 1 && face.countdown > 0 ? (11 - face.countdown) / 10 : 0,
    })
  }
  return { whole, selected, submissions }
}

export function initializeBuildingAcquisition(
  giftId: number,
  geometry: WorshipAcquisitionGeometry,
  random: () => number
): BuildingAcquisitionController {
  const saved = structuredClone(geometry)
  saved.origin = { x: short(saved.origin.x), y: short(saved.origin.y) }
  saved.target = { x: short(saved.target.x), y: short(saved.target.y) }
  return {
    active: true,
    phase: 0,
    visits: 0,
    pending: true,
    model: 103,
    giftId,
    family: 'building',
    geometry: saved,
    x: saved.origin.x,
    y: saved.origin.y,
    scale: 8,
    yaw: 0,
    tilt: 1536,
    target: [saved.target.x, saved.target.y],
    center: [
      short(saved.viewport.x + trunc(saved.viewport.width / 2)),
      short(saved.viewport.y + trunc(saved.viewport.height / 2)),
    ],
    spin: 0,
    radius: 0,
    delta: 0,
    allStarted: false,
    faces: campCorners.map(() => ({
      threshold: 0,
      angles: [random() & 2047, random() & 2047, random() & 2047],
      heading: 0,
      countdown: (random() >>> 0) % 34,
      flags: 0,
    })),
  }
}
export function visitBuildingAcquisition(c: BuildingAcquisitionController | null, paused: boolean) {
  if (!c?.active) return null
  let first = false,
    whole = false,
    animateFaces = false,
    pulse = null,
    arrivalAttempt = false
  if (c.pending) {
    c.pending = false
    c.visits = 0
    first = true
    if (++c.phase >= 5) {
      c.active = false
      return { retired: true }
    }
  }
  if (!paused) {
    const parameters = [0, 18, 22, 30, 100],
      t = c.visits
    if (c.phase === 1) {
      const remaining = 19 - t
      if (first) {
        c.spin = 56
        c.radius = 0
        c.delta = trunc(1400 / 18)
      } else {
        c.radius = short(c.radius + trunc((700 - c.radius) / remaining))
        c.scale += trunc((40 - c.scale) / remaining)
        c.x = short(c.x + trunc((c.center[0] - c.x) / remaining))
        c.y = short(c.y + trunc((c.center[1] - c.y) / remaining))
        c.tilt = short(c.tilt + trunc((1956 - c.tilt) / remaining))
      }
      animateFaces = true
    } else if (c.phase === 2) {
      const remaining = 23 - t
      c.spin = short(c.spin + trunc((56 - c.spin) / remaining))
      for (const face of c.faces) {
        face.threshold = short(face.threshold - trunc(face.threshold / remaining))
        face.angles = face.angles.map(a => (a + trunc((2048 - a) / remaining)) & 2047)
        face.heading = short(face.heading - trunc(face.heading / remaining))
        face.countdown = 0
      }
    } else if (c.phase === 3) {
      if (first) c.spin = 182
      c.spin = short(c.spin - 8)
      whole = true
    } else if (c.phase === 4) {
      if (t < 12) whole = true
      else {
        if (t === 12)
          for (const face of c.faces) {
            face.flags |= 2
            face.threshold = -16384
          }
        let allStarted = true
        c.faces.forEach((face, index) => {
          if (!(face.flags & 1) && face.flags & 4) {
            face.flags = (face.flags | 1) & ~2
            face.heading = short(c.yaw)
            face.countdown = 10
          }
          if (face.flags & 1) {
            const [a, b, z] = face.angles
            face.angles = [
              (a + (index & 15) * 8 + 8) & 2047,
              (b + ((index - 7) & 15) * 8 + 8) & 2047,
              (z + ((index + 5) & 15) * 8 + 8) & 2047,
            ]
            if (face.countdown) face.countdown--
          } else allStarted = false
        })
        if (allStarted && !c.allStarted) {
          c.allStarted = true
          if (c.visits <= 90) c.visits = 90
        }
        if (t - 12 === 4) pulse = 100
        if (t - 12 === 30) arrivalAttempt = true // Companion handle remains0 in scoped ordinary cases.
      }
      if (c.spin > -273) c.spin = short(c.spin - 6)
    }
    if (c.visits >= parameters[c.phase]) {
      c.pending = true
      if (c.phase === 4) pulse = 4
    }
    c.visits++
    c.yaw = (c.yaw + c.spin) & 2047
    if (animateFaces)
      c.faces.forEach((face, index) => {
        face.threshold = c.radius
        const [a, b, z] = face.angles
        face.angles = [
          (a + (index & 15) * 2 + 2) & 2047,
          (b + ((index - 7) & 15) * 2 + 2) & 2047,
          (z + ((index + 5) & 15) + 1) & 2047,
        ]
        face.heading = (face.heading + face.countdown) & 2047
      })
  }
  return { pulse, arrivalAttempt, ...buildingGeometryVisit(c, whole) }
}
