import { selectorWorlds } from './world-selector-data.ts'

export interface ScenePoint {
  x: number
  y: number
  z: number
}
export interface CameraTrack {
  current: ScenePoint
  lastSelected: number
  speed: number
  acceleration: number
  mode: number
}
const point = (x = 0, y = 0, z = 0): ScenePoint => ({ x, y, z })
const add = (a: ScenePoint, b: ScenePoint) => point(a.x + b.x, a.y + b.y, a.z + b.z)
const subtract = (a: ScenePoint, b: ScenePoint) => point(a.x - b.x, a.y - b.y, a.z - b.z)
const scale = (a: ScenePoint, factor: number) => point(a.x * factor, a.y * factor, a.z * factor)
export const dot = (a: ScenePoint, b: ScenePoint) => a.x * b.x + a.y * b.y + a.z * b.z
const normalize = (a: ScenePoint) => scale(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1))
export function interpolatePoint(a: ScenePoint, b: ScenePoint, fraction: number) {
  return add(a, scale(subtract(b, a), fraction))
}
const trigStep = 0.001090830781875
const sinTable = Float32Array.from({ length: 5760 }, (_, i) => Math.sin(i * trigStep))
const cosTable = Float32Array.from({ length: 5760 }, (_, i) => Math.cos(i * trigStep))
export function sceneTrig(angle: number) {
  const index = Math.trunc((((angle % 360) + 360) % 360) * 16)
  return { sin: sinTable[index], cos: cosTable[index] }
}
export function bodyPositions(angles: readonly number[]): ScenePoint[] {
  const positions: ScenePoint[] = []
  for (const body of selectorWorlds) {
    const parent = body.parent < 0 ? point() : positions[body.parent]
    const { sin, cos } = sceneTrig(angles[body.index])
    positions.push(add(parent, point(body.orbitRadius * cos, 0, body.orbitRadius * sin)))
  }
  return positions
}
export function desiredCamera(positions: readonly ScenePoint[], selected: number, rootAngle = 0) {
  const root = positions[0]
  const { sin, cos } = sceneTrig(rootAngle)
  const target = selected === 0 ? add(root, point(800 * cos, 200, 800 * sin)) : positions[selected]
  const distance = (selected === 0 ? 500 : 150) * 40
  const normal = normalize(subtract(root, target))
  return {
    target,
    eye: add(
      subtract(target, scale(normal, distance * Math.fround(1 / 30))),
      point(0, distance / 90, 0)
    ),
  }
}
export function advanceCamera(
  track: CameraTrack,
  desired: ScenePoint,
  selected: number,
  dt: number,
  rate: number
) {
  if (track.lastSelected !== selected) {
    track.mode = 1
    track.lastSelected = selected
  }
  if (track.mode !== 1) {
    track.current = { ...desired }
    return
  }
  const difference = subtract(desired, track.current)
  const distance = Math.hypot(difference.x, difference.y, difference.z)
  if (distance === 0 || (track.speed === 0 ? 100000000 : distance / track.speed) < dt) {
    track.current = { ...desired }
    track.mode = 2
    track.acceleration = 0
    track.speed *= 0.8
    return
  }
  track.acceleration += rate * dt
  track.speed += track.acceleration * dt
  track.current = add(track.current, scale(difference, (track.speed * dt * 0.9) / distance))
}
export function cameraBasis(eye: ScenePoint, target: ScenePoint) {
  const forward = normalize(subtract(target, eye))
  const right = normalize(point(forward.z, 0, -forward.x))
  const up = normalize(
    point(
      forward.y * right.z - forward.z * right.y,
      forward.z * right.x - forward.x * right.z,
      forward.x * right.y - forward.y * right.x
    )
  )
  return { eye, forward, right, up }
}
export type SceneCamera = ReturnType<typeof cameraBasis>
export function projectPoint(position: ScenePoint, camera: SceneCamera) {
  const offset = subtract(position, camera.eye)
  const depth = dot(camera.forward, offset)
  return {
    x: 320 + (400 * dot(camera.right, offset)) / depth,
    y: 240 - (400 * dot(camera.up, offset)) / depth,
    depth,
  }
}
export function bodyDepth(radius: number, depth: number, camera: SceneCamera) {
  const { sin, cos } = sceneTrig(90)
  const delta = radius * (-sin * camera.forward.y + cos * camera.forward.z)
  return { base: (depth - delta) / 16384, delta: delta / 16384, front: depth - delta }
}
export const sceneStep = 1 / 120
export class SelectorMotion {
  angles = selectorWorlds.map(body => body.startAngle)
  positions = bodyPositions(this.angles)
  eye: CameraTrack = {
    current: point(0, 2500, 200),
    lastSelected: 0,
    speed: 0,
    acceleration: 0,
    mode: 0,
  }
  target: CameraTrack = { current: point(), lastSelected: 0, speed: 0, acceleration: 0, mode: 0 }
  previous = { positions: this.positions, eye: this.eye.current, target: this.target.current }
  remainder = 0
  elapsed = 0
  rootAngle = 0
  advance(
    seconds: number,
    selected: number,
    onStep?: (positions: ScenePoint[], camera: SceneCamera) => void
  ) {
    this.remainder += Math.max(0, Math.min(1, seconds))
    while (this.remainder + 1e-10 >= sceneStep) {
      this.previous = {
        positions: this.positions,
        eye: this.eye.current,
        target: this.target.current,
      }
      this.positions = bodyPositions(this.angles)
      this.angles = this.angles.map(
        (angle, index) => (angle + selectorWorlds[index].angularVelocity * sceneStep * 10) % 360
      )
      if (selected === 0) this.rootAngle = (this.rootAngle + sceneStep * 5) % 360
      const desired = desiredCamera(this.positions, selected, this.rootAngle)
      advanceCamera(this.eye, desired.eye, selected, sceneStep, 30)
      advanceCamera(this.target, desired.target, selected, sceneStep, 60)
      onStep?.(this.positions, cameraBasis(this.eye.current, this.target.current))
      this.elapsed += sceneStep
      this.remainder = Math.max(0, this.remainder - sceneStep)
    }
    const alpha = this.remainder / sceneStep
    return {
      positions: this.positions.map((value, i) =>
        interpolatePoint(this.previous.positions[i], value, alpha)
      ),
      camera: cameraBasis(
        interpolatePoint(this.previous.eye, this.eye.current, alpha),
        interpolatePoint(this.previous.target, this.target.current, alpha)
      ),
      elapsed: Math.max(0, this.elapsed - sceneStep + this.remainder),
    }
  }
}
