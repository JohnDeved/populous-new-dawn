import { selectorWorlds } from './world-selector-data.ts'
import { createGlobeMesh } from './world-globe-mesh.ts'
import {
  projectPoint,
  sceneTrig,
  type SceneCamera,
  type ScenePoint,
} from './world-selector-motion.ts'

export interface SceneVertex {
  x: number
  y: number
  depth: number
  rhw: number
  u: number
  v: number
  red: number
  green: number
  blue: number
  alpha: number
  specular: number
}
export function sceneVertex(x: number, y: number, depth: number, gray = 255): SceneVertex {
  return {
    x,
    y,
    depth,
    rhw: 2,
    u: 0,
    v: 0,
    red: gray,
    green: gray,
    blue: gray,
    alpha: 255,
    specular: 0,
  }
}
const meshCache = new Map<number, ReturnType<typeof createGlobeMesh>>()
export function sceneGlobeMesh(radius: number) {
  const size = Math.max(1, Math.min(255, Math.trunc(radius)))
  let mesh = meshCache.get(size)
  if (!mesh) {
    mesh = createGlobeMesh(size)
    meshCache.set(size, mesh)
  }
  return mesh
}
export const sceneOrbits: { parent: number; radius: number; members: number[] }[] = []
for (const body of selectorWorlds) {
  if (body.parent < 0) continue
  const group = sceneOrbits.find(
    orbit => orbit.parent === body.parent && orbit.radius === body.orbitRadius
  )
  if (group) group.members.push(body.index)
  else sceneOrbits.push({ parent: body.parent, radius: body.orbitRadius, members: [body.index] })
}
export function orbitState(members: readonly number[], progressionAnchor: number) {
  for (const member of members) {
    if (member === progressionAnchor) return 2
    if (member > progressionAnchor) return 1
  }
  return 0
}
// Nearest/even is an explicit portable choice for the unobserved x87 control word.
export function roundEven(value: number) {
  const lower = Math.floor(value)
  return value - lower === 0.5 ? lower + (lower % 2 === 0 ? 0 : 1) : Math.round(value)
}
const orbitCircle = (() => {
  let lookup = 0
  return Array.from({ length: 100 }, () => {
    const value = sceneTrig(Math.trunc(lookup) / 16)
    lookup = Math.fround(lookup + Math.fround(3.6 * 16))
    return value
  })
})()
export function orbitRibbon(
  parent: ScenePoint,
  radius: number,
  state: number,
  camera: SceneCamera
) {
  const projected = orbitCircle.map(({ sin, cos }) =>
    projectPoint({ x: parent.x + radius * cos, y: parent.y, z: parent.z + radius * sin }, camera)
  )
  const vertices: SceneVertex[] = []
  const triangles: number[] = []
  const base = [0.0078125, 0.2578125, 0.5078125][state]
  for (let i = 0; i <= 100; i++) {
    const p = projected[i % 100],
      before = projected[(i + 99) % 100],
      after = projected[(i + 1) % 100]
    // Native stale invalid projections have no useful browser equivalent. Omitted
    // segments retain valid neighbours' normals using finite common projections.
    const nx = after.y - before.y,
      ny = -(after.x - before.x)
    const length = Math.max(Math.abs(nx), Math.abs(ny)) + 0.5 * Math.min(Math.abs(nx), Math.abs(ny))
    const scale = 400 / p.depth
    const ox = Number.isFinite(nx / length) ? (nx * scale) / length : 0
    const oy = Number.isFinite(ny / length) ? (ny * scale) / length : 0
    const gray = 255 - Math.floor((Math.max(0, Math.min(1999, roundEven(p.depth))) * 256) / 2000)
    for (const side of [-1, 1]) {
      const vertex = sceneVertex(p.x + side * ox, p.y + side * oy, p.depth / 16384, gray)
      vertex.u = Math.fround(0.3)
      vertex.v = base + (scale > 1 ? (side < 0 ? 0.0625 : 0.171875) : 0.1171875)
      vertices.push(vertex)
    }
    if (i < 100 && p.depth > 10 && projected[(i + 1) % 100].depth > 10) {
      triangles.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 2, 2 * i + 3, 2 * i + 1)
    }
  }
  return { vertices, triangles }
}
export function createPointStars(seed = 0x504e44) {
  let state = seed >>> 0
  function next() {
    state = (Math.imul(state, 9377) + 9439) >>> 0
    state = ((state >>> 13) | (state << 19)) >>> 0
    return (state % 10000) - 5000
  }
  return Array.from({ length: 1000 }, () => ({ x: next(), y: next(), z: next() }))
}
export function projectStar(star: ScenePoint, camera: SceneCamera) {
  const p = projectPoint(star, camera)
  if (p.depth <= 10 || p.x < 0 || p.x > 639 || p.y < 0 || p.y > 479) return undefined
  const gray = 2 * (63 - Math.max(0, Math.min(63, (roundEven(p.depth) >> 6) - 83)))
  return sceneVertex(p.x, p.y, 0.5, gray)
}
export class SunWobble {
  phasesU = new Float32Array(2048)
  phasesV = new Float32Array(2048)
  speedsU = new Float32Array(2048)
  speedsV = new Float32Array(2048)
  private randomState: number
  constructor(seed = 0x534f4c) {
    this.randomState = seed
    for (let i = 0; i < 2048; i++) {
      this.speedsU[i] = Math.fround(
        (this.random() % 127) * Math.fround(0.00033333332976326346) + Math.fround(0.05)
      )
      this.speedsV[i] = Math.fround(
        (this.random() % 127) * Math.fround(0.00033333332976326346) + Math.fround(0.05)
      )
    }
  }
  private random() {
    this.randomState = (Math.imul(this.randomState, 214013) + 2531011) >>> 0
    return (this.randomState >>> 16) & 32767
  }
  advance(count: number, seconds: number) {
    for (let i = 0; i < count; i++) {
      if (this.speedsU[i] === 0)
        this.speedsU[i] = Math.fround((this.random() % 127) * Math.fround(0.0007812500116415322))
      if (this.speedsV[i] === 0)
        this.speedsV[i] = Math.fround((this.random() % 127) * Math.fround(0.0007812500116415322))
      this.phasesU[i] = Math.fround(this.phasesU[i] + this.speedsU[i] * seconds * 30)
      this.phasesV[i] = Math.fround(this.phasesV[i] + this.speedsV[i] * seconds * 30)
    }
  }
}
export function sunAnnulus(
  cx: number,
  cy: number,
  depth: number,
  radiusA: number,
  radiusB: number,
  alphaA: number,
  alphaB: number,
  segments: number
) {
  const vertices: SceneVertex[] = [],
    triangles: number[] = []
  const angle = (2 * Math.PI) / segments,
    cosine = Math.fround(Math.cos(angle)),
    sine = Math.fround(Math.sin(angle))
  let x = 1,
    y = 0
  for (let i = 0; i <= segments; i++) {
    const nextX = Math.fround(x * cosine - y * sine)
    y = Math.fround(x * sine + y * cosine)
    x = nextX
    for (const [radius, alpha] of [
      [radiusA, alphaA],
      [radiusB, alphaB],
    ]) {
      const v = sceneVertex(cx + radius * x, cy + radius * y, depth, 0)
      v.red = 128
      v.alpha = alpha
      v.rhw = 1 / (depth + 0.05)
      vertices.push(v)
    }
    if (i < segments) triangles.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2)
  }
  return { vertices, triangles }
}
