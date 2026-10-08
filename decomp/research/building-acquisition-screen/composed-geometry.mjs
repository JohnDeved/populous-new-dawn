// Source-derived CPU geometry/controller reference. No application or native writes.
// Addresses and the intended finite scope are in ../building-acquisition-screen.md.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

export const sha = value => createHash('sha256').update(value).digest('hex')
export const short = value => (value << 16) >> 16
const trunc = Math.trunc
const mul = Math.imul
const dot = (a, b) => (mul(a[0], b[0]) + mul(a[1], b[1]) + mul(a[2], b[2])) | 0
const cross = (a, b) => [
  (mul(a[1], b[2]) - mul(a[2], b[1])) >> 14,
  (mul(a[2], b[0]) - mul(a[0], b[2])) >> 14,
  (mul(a[0], b[1]) - mul(a[1], b[0])) >> 14,
]
const identity = () => [[16384, 0, 0], [0, 16384, 0], [0, 0, 16384]]
const transform = (matrix, point) => matrix.map(row => dot(row, point) >> 14)
const matrixProduct = (a, b) => a.map(row => [0, 1, 2].map(i => dot(row, b.map(r => r[i])) >> 14))

export function loadInputs(canonicalRoot, dataRoot) {
  const names = ['d3dpoptb.exe', 'objects/objs0-2.dat', 'objects/facs0-2.dat', 'objects/pnts0-2.dat']
  const audit = JSON.parse(readFileSync(new URL('./static-audit.json', import.meta.url)))
  const inputs = Object.fromEntries(names.map(name => {
    const data = readFileSync(resolve(name.includes('facs') || name.includes('pnts') ? dataRoot : canonicalRoot, name))
    if (sha(data) !== audit.inputs[name].sha256) throw Error(`Input mismatch: ${name}`)
    return [name, data]
  }))
  const exe = inputs['d3dpoptb.exe'], pe = exe.readUInt32LE(60)
  const start = pe + 24 + exe.readUInt16LE(pe + 20)
  const sections = Array.from({ length: exe.readUInt16LE(pe + 6) }, (_, i) => {
    const at = start + i * 40
    return { va: exe.readUInt32LE(at + 12), size: exe.readUInt32LE(at + 16), offset: exe.readUInt32LE(at + 20) }
  })
  const bytes = (address, size) => {
    const va = address - 0x400000
    const section = sections.find(s => s.va <= va && va + size <= s.va + s.size)
    if (!section) throw Error(`Unmapped DATA address ${address.toString(16)}`)
    return exe.subarray(section.offset + va - section.va, section.offset + va - section.va + size)
  }
  const sine = Array.from({ length: 2048 }, (_, i) => bytes(0x5ddde8 + i * 4, 4).readInt32LE())
  const atan = Array.from({ length: 257 }, (_, i) => bytes(0x5861b4 + i * 2, 2).readInt16LE())
  const sqrtSeeds = Array.from({ length: 32 }, (_, i) => bytes(0x586034 + i * 2, 2).readUInt16LE())
  const objects = inputs['objects/objs0-2.dat'], faces = inputs['objects/facs0-2.dat'], points = inputs['objects/pnts0-2.dat']
  const models = {}
  for (const model of [95, 103]) {
    const at = model * 54, count = objects.readInt16LE(at + 2)
    const firstFace = objects.readUInt32LE(at + 16), firstPoint = objects.readUInt32LE(at + 24)
    models[model] = Array.from({ length: count }, (_, i) => {
      const face = (firstFace + i - 1) * 60, corners = faces[face + 6]
      return Array.from({ length: corners }, (_, k) => {
        const point = (firstPoint + faces.readInt16LE(face + 40 + k * 2) - 1) * 6
        return [0, 2, 4].map(offset => points.readInt16LE(point + offset))
      })
    })
  }
  return { sine, atan, sqrtSeeds, models, identities: Object.fromEntries(names.map(name => [name, sha(inputs[name])])) }
}

// 00586000: unsigned integer Newton recurrence, starting from the pinned table.
function nativeSqrt(value, seeds) {
  value >>>= 0
  if (!value) return 0
  let estimate = seeds[31 - Math.clz32(value)]
  for (;;) {
    const quotient = Math.floor(value / estimate)
    if (quotient >= estimate) return estimate
    estimate = (estimate + quotient) >>> 1
  }
}
function normalized(row, data) {
  const length = nativeSqrt(dot(row, row), data.sqrtSeeds)
  return row.map(value => trunc((value << 14) / length))
}
function rotations(angle, data) {
  const s = data.sine[angle & 2047] >> 2, c = data.sine[(angle + 512) & 2047] >> 2
  return {
    x: [[16384, 0, 0], [0, c, -s], [0, s, c]],
    y: [[c, 0, s], [0, 16384, 0], [-s, 0, c]],
    z: [[c, -s, 0], [s, c, 0], [0, 0, 16384]],
  }
}
function globalMatrix(yaw, tilt, data) {
  // 0047fab0(axis2) on identity rotates rows0/2 then normalizes row2,
  // row1=cross(row2,row0), row0=cross(row1,row2). Do not omit this normalization.
  const r = rotations(-yaw, data).y
  let row0 = [r[0][0], r[1][0], r[2][0]]
  const row2 = normalized([r[0][2], r[1][2], r[2][2]], data)
  const row1 = normalized(cross(row2, row0), data)
  row0 = normalized(cross(row1, row2), data)
  return matrixProduct(rotations(tilt, data).x, [row0, row1, row2])
}
function nativeAngle(x, y, data) {
  const ax = Math.abs(x), ay = Math.abs(y)
  if (!ax && !ay) return 0
  const a = data.atan[Math.floor(Math.min(ax, ay) * 256 / Math.max(ax, ay))]
  let angle = ax < ay ? a : 512 - a
  if (y >= 0) angle = 1024 - angle
  if (x < 0) angle = 2048 - angle
  return angle & 2047
}
function floatRatio(value) {
  const buffer = Buffer.alloc(4)
  buffer.writeFloatLE(value)
  const bits = buffer.readUInt32LE(), exponent = ((bits >>> 23) & 255) - 150
  let numerator = BigInt((bits & 0x7fffff) | 0x800000) * (bits >>> 31 ? -1n : 1n)
  let denominator = 1n
  if (!value) return [0n, 1n]
  if (exponent >= 0) numerator <<= BigInt(exponent)
  else denominator <<= BigInt(-exponent)
  return [numerator, denominator]
}
function flightDelta(target, projected, countdown) {
  // Exact rational evaluation of the bounded x87 expression from a float32
  // projected corner and float32(0.1), then 0055bc54 truncation toward zero.
  const [p, pd] = floatRatio(projected), [tenth, td] = floatRatio(Math.fround(0.1))
  return Number(((BigInt(target) * pd - p) * BigInt(11 - countdown) * tenth) / (pd * td))
}

export function geometryVisit(controller, data, whole = false) {
  const global = globalMatrix(controller.yaw, controller.tilt, data)
  const selected = [], submissions = []
  for (const [index, source] of data.models[controller.model].entries()) {
    const face = controller.faces[index]
    let points = source.map(p => [...p])
    if (!whole) {
      if (!(face.flags & 3) && face.threshold) {
        const angle = (nativeAngle(short(points[0][0]), -short(points[0][2]), data) - face.heading) & 2047
        const dx = Math.floor(data.sine[angle] * face.threshold / 65536)
        const dz = Math.floor(data.sine[(angle + 512) & 2047] * face.threshold / 65536)
        points = points.map(([x, y, z]) => [(x + dx) | 0, y, (z + dz) | 0])
      }
      if (face.angles.some(Boolean)) {
        const center = [0, 1, 2].map(i => trunc(points.reduce((sum, p) => (sum + p[i]) | 0, 0) / points.length))
        let matrix = identity()
        matrix = matrixProduct(rotations(face.angles[0], data).y, matrix)
        matrix = matrixProduct(rotations(face.angles[1], data).x, matrix)
        matrix = matrixProduct(rotations(face.angles[2], data).z, matrix)
        points = points.map(p => transform(matrix, p.map((v, i) => (v - center[i]) | 0)).map((v, i) => (v + center[i]) | 0))
      }
    }
    const matrix = !whole && face.flags & 1 ? globalMatrix(face.heading, controller.tilt, data) : global
    const transformed = points.map(p => transform(matrix, p))
    const scale = !whole && face.flags & 1
      ? face.countdown > 0 ? controller.scale - trunc(controller.scale / face.countdown) : 0
      : controller.scale
    const projected = transformed.map(([x, y]) => [
      Math.fround(mul(x, scale) / 256 + controller.x),
      Math.fround(-mul(y, scale) / 256 + controller.y),
    ])
    if (!whole && selected.length < 4 && face.flags & 2) {
      const depth = (transformed[0][2] + transformed[1][2] + transformed[2][2] + 3000) | 0
      if (face.threshold && face.threshold >= depth) { face.flags |= 4; selected.push(index) }
      if (face.threshold < depth) face.threshold = short(depth)
    }
    if (!whole && face.flags & 1 && face.countdown > 0) {
      const delta = controller.target.map((value, i) => flightDelta(value, projected[0][i], face.countdown))
      for (const p of projected) for (let i = 0; i < 2; i++) p[i] = Math.fround(p[i] + delta[i])
    }
    // CPU vertices only. No clipping, light/material resolution or GPU submission.
    submissions.push({ face: index, transformed, projected })
  }
  return { whole, selected, submissions }
}

export function initializeBuilding(model, giftId, origin, target, random, data) {
  return {
    active: true, phase: 0, visits: 0, pending: true, model, giftId,
    x: origin[0], y: origin[1], scale: 8, yaw: 0, tilt: 1536,
    target: [...target], center: [370, 240], spin: 0, radius: 0, delta: 0,
    allStarted: false,
    faces: data.models[model].map(() => ({ threshold: 0,
      angles: [random() & 2047, random() & 2047, random() & 2047],
      heading: 0, countdown: (random() >>> 0) % 34, flags: 0 })),
  }
}

export function buildingVisit(c, data, paused) {
  if (!c?.active) return null
  let first = false, whole = false, animateFaces = false, pulse = null, arrivalAttempt = false
  if (c.pending) {
    c.pending = false; c.visits = 0; first = true
    if (++c.phase >= 5) { c.active = false; return { retired: true } }
  }
  if (!paused) {
    const parameters = [0, 18, 22, 30, 100], t = c.visits
    if (c.phase === 1) {
      const remaining = 19 - t
      if (first) { c.spin = 56; c.radius = 0; c.delta = trunc(1400 / 18) }
      else {
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
      c.spin = short(c.spin - 8); whole = true
    } else if (c.phase === 4) {
      if (t < 12) whole = true
      else {
        if (t === 12) for (const face of c.faces) { face.flags |= 2; face.threshold = -16384 }
        let allStarted = true
        c.faces.forEach((face, index) => {
          if (!(face.flags & 1) && face.flags & 4) {
            face.flags = (face.flags | 1) & ~2; face.heading = short(c.yaw); face.countdown = 10
          }
          if (face.flags & 1) {
            const [a, b, z] = face.angles
            face.angles = [(a + (index & 15) * 8 + 8) & 2047,
              (b + ((index - 7) & 15) * 8 + 8) & 2047,
              (z + ((index + 5) & 15) * 8 + 8) & 2047]
            if (face.countdown) face.countdown--
          } else allStarted = false
        })
        if (allStarted && !c.allStarted) { c.allStarted = true; if (c.visits <= 90) c.visits = 90 }
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
    if (animateFaces) c.faces.forEach((face, index) => {
      face.threshold = c.radius
      const [a, b, z] = face.angles
      face.angles = [(a + (index & 15) * 2 + 2) & 2047,
        (b + ((index - 7) & 15) * 2 + 2) & 2047,
        (z + ((index + 5) & 15) + 1) & 2047]
      face.heading = (face.heading + face.countdown) & 2047
    })
  }
  return { pulse, arrivalAttempt, ...geometryVisit(c, data, whole) }
}
