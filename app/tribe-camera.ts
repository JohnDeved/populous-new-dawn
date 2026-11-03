import { createCameraMotion, createResultCamera, type CameraPosition } from './camera-motion.ts'
import type { CameraConfig } from './projection.ts'
import type { GlobeMorph } from './camera-view.ts'
import type { GlobeMotion } from './globe.ts'
import type { FlybyCamera } from './flyby.ts'
import { levelStartCamera } from './level-start.ts'
import { random } from './native-math.ts'
import nativeCamera from './original-camera.json' with { type: 'json' }

export interface TribeCamera extends CameraPosition {
  h: number
  initialized: boolean
}

export interface CameraViewTransition {
  config: CameraConfig
  remaining: number
  time: number
  previewStartTime: number
  previewFraction: number
  preview?: CameraConfig
  angle?: { target: number; increment: number }
}

const correction = () => ({ x: 0, y: 0, angle: 0 })

// These are simulation-readable camera owners, not Three.js/display snapshots.
// 00419790 owns initialization; 0047f510 and 0047f6d0 bracket a draw visit.
export function createTribeCameras() {
  return {
    version: 1,
    tribes: Array.from({ length: 4 }, (): TribeCamera => ({
      x: 0,
      y: 0,
      h: 0,
      angle: 0,
      initialized: false,
    })),
    phase: 'idle' as 'idle' | 'camera' | 'simulation',
    held: Array.from({ length: 4 }, correction),
    borrowed: Array.from({ length: 4 }, correction),
    shake: { active: false, pending: false, amplitude: 0, bytes: correction() },
    elapsed: 0,
    time: 0,
    navigationTime: 0,
    animationTime: 0,
    animationFrame: 0,
    // Inputs are consumed synchronously in timestamp order, before their handler
    // can change held buttons. No DOM event or callback survives a checkpoint.
    input: {
      time: 0,
      cursor: 0,
      buttons: 0,
      // Raw held input survives Scene replacement; buttons is its gated mapping.
      pointer: null as { x: number; y: number; buttons: number } | null,
    },
    keys: new Set<string>(),
    motion: createCameraMotion(),
    result: createResultCamera(),
    velocity: { turn: 0, forward: 0, side: 0 },
    bookmarks: Array<CameraPosition | null>(4).fill(null),
    resultRequest: 0,
    resultTurn: 0,
    flybyZoom: 0,
    wasFlying: false,
    levelStartSeeded: true,
    viewZoom: 0,
    viewPreset: 0,
    viewTransition: null as CameraViewTransition | null,
    overviewActive: false,
    overviewStage: null as 'enter' | 'exit' | null,
    overviewReturn: { preset: 0, bearing: 0 },
    globeMorph: {
      value: 0,
      source: 0,
      target: 0,
      increment: 0,
      frame: 0,
      duration: 6,
      active: false,
    } as GlobeMorph,
    globePointer: { x: 0, y: 0 },
    globeMotion: {
      position: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
      press: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      dragging: false,
    } as GlobeMotion,
  }
}
export type TribeCameras = ReturnType<typeof createTribeCameras>

// Transient adapter only. Saving an accessor object would materialize its values
// and split ownership after structuredClone; the persisted owner is the tribe.
export function flybyCamera(c: TribeCameras, tribe: number): FlybyCamera {
  return {
    get x() {
      return c.tribes[tribe].x
    },
    set x(n) {
      c.tribes[tribe].x = n & 65535
    },
    get y() {
      return c.tribes[tribe].y
    },
    set y(n) {
      c.tribes[tribe].y = n & 65535
    },
    get angle() {
      return c.tribes[tribe].angle
    },
    set angle(n) {
      c.tribes[tribe].angle = n & 2047
    },
    get zoom() {
      return c.flybyZoom
    },
    set zoom(n) {
      c.flybyZoom = n
    },
  }
}

function hasCameraShape(value: unknown, shape: unknown): boolean {
  if (typeof shape === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (typeof shape === 'boolean' || typeof shape === 'string') return typeof value === typeof shape
  if (shape === null) return true // Nullable alternatives are checked below.
  if (shape instanceof Set)
    return value instanceof Set && [...value].every(x => typeof x === 'string')
  if (Array.isArray(shape))
    return (
      Array.isArray(value) &&
      value.length === shape.length &&
      shape.every((item, i) => hasCameraShape(value[i], item))
    )
  if (!value || typeof value !== 'object' || !shape || typeof shape !== 'object') return false
  return Object.entries(shape).every(
    ([key, expected]) =>
      Object.hasOwn(value, key) && hasCameraShape((value as Record<string, unknown>)[key], expected)
  )
}
const integer = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max
const validPose = (p: CameraPosition) =>
  hasCameraShape(p, correction()) &&
  integer(p.x, 0, 65535) &&
  integer(p.y, 0, 65535) &&
  integer(p.angle, -1, 2047)
const validCorrection = (p: CameraPosition) =>
  hasCameraShape(p, correction()) && Object.values(p).every(n => integer(n, -128, 127))

export function requireCameraContinuation(c: TribeCameras | undefined) {
  const shape = createTribeCameras()
  if (!c || !hasCameraShape(c, shape))
    throw new RangeError(
      'Checkpoint camera continuation is incompatible with this development version'
    )
  const pointer = c.input.pointer,
    validPointer =
      pointer === null ||
      (hasCameraShape(pointer, { x: 0, y: 0, buttons: 0 }) && integer(pointer.buttons, 0, 31)),
    transition = c.viewTransition,
    validTransition =
      transition === null ||
      (hasCameraShape(transition, {
        config: nativeCamera.views[0],
        remaining: 0,
        time: 0,
        previewStartTime: 0,
        previewFraction: 0,
      }) &&
        integer(transition.remaining, 1, 32) &&
        transition.time >= 0 &&
        transition.time < 1 / 24 + 1e-9 &&
        transition.previewStartTime >= 0 &&
        transition.previewStartTime < 1 / 24 + 1e-9 &&
        transition.previewFraction >= 0 &&
        transition.previewFraction <= 1 &&
        (transition.preview === undefined ||
          hasCameraShape(transition.preview, nativeCamera.views[0])) &&
        (transition.angle === undefined ||
          (hasCameraShape(transition.angle, { target: 0, increment: 0 }) &&
            integer(transition.angle.target, 0, 2047) &&
            integer(transition.angle.increment, -2047, 2047))))
  if (
    c.version !== 1 ||
    c.phase !== 'idle' ||
    !c.tribes.every(
      p => p.initialized && validPose(p) && integer(p.angle, 0, 2047) && integer(p.h, -32768, 32767)
    ) ||
    !c.held.every(validCorrection) ||
    !c.borrowed.every(validCorrection) ||
    !validCorrection(c.shake.bytes) ||
    !integer(c.shake.amplitude, 0, 255) ||
    !c.bookmarks.every(p => p === null || validPose(p)) ||
    !integer(c.input.cursor, 0, Number.MAX_SAFE_INTEGER) ||
    !integer(c.input.buttons, 0, 255) ||
    !validPointer ||
    ![c.time, c.navigationTime, c.animationTime].every(n => n >= 0 && n < 1 / 24 + 1e-9) ||
    c.elapsed < 0 ||
    c.input.time < 0 ||
    c.input.time > c.elapsed + 1e-9 ||
    !integer(c.animationFrame, 0, Number.MAX_SAFE_INTEGER) ||
    !integer(c.motion.active, 0, 1) ||
    !integer(c.motion.phase, 0, 1) ||
    !integer(c.motion.frame, 0, c.motion.phase === 0 ? 3 : 255) ||
    !integer(c.motion.moveIndex, 0, 10) ||
    !integer(c.motion.turnIndex, 0, 10) ||
    !validPose(c.motion.source) ||
    !validPose(c.motion.target) ||
    !integer(c.result.active, 0, 1) ||
    !integer(c.result.phase, 0, 3) ||
    !integer(c.result.counter, 0, 255) ||
    !validPose(c.result.saved) ||
    !validPose(c.result.target) ||
    !integer(c.flybyZoom, -16384, 16384) ||
    !integer(c.viewPreset, 0, 4) ||
    !integer(c.overviewReturn.preset, 0, 4) ||
    !integer(c.resultRequest, 0, Number.MAX_SAFE_INTEGER) ||
    !integer(c.resultTurn, 0, Number.MAX_SAFE_INTEGER) ||
    !integer(c.globeMorph.duration, 1, Number.MAX_SAFE_INTEGER - 1) ||
    !integer(c.globeMorph.frame, 0, c.globeMorph.duration + 1) ||
    ![c.globeMorph.value, c.globeMorph.source, c.globeMorph.target].every(n =>
      integer(n, 0, 256)
    ) ||
    ![null, 'enter', 'exit'].includes(c.overviewStage) ||
    !validTransition
  )
    throw new RangeError(
      'Checkpoint camera continuation is incompatible with this development version'
    )
}

export function initializeTribeCamera(
  owner: TribeCamera,
  shaman: { x: number; y: number; h: number } | undefined,
  gameFlags: number
) {
  if (owner.initialized) return
  if (!(gameFlags & 32)) Object.assign(owner, { x: 0, y: 0, h: 0, angle: 256 })
  if (shaman) Object.assign(owner, shaman)
  Object.assign(owner, levelStartCamera(owner, gameFlags, owner.angle), { initialized: true })
}

function shift(p: CameraPosition, delta: CameraPosition, sign: number) {
  p.x = (p.x + sign * delta.x) & 65535
  p.y = (p.y + sign * delta.y) & 65535
  p.angle = (p.angle + sign * delta.angle) & 2047
}

export function displayedTribeCamera(cameras: TribeCameras, tribe: number) {
  const p = { ...cameras.tribes[tribe] }
  if (cameras.phase === 'idle') shift(p, cameras.held[tribe], 1)
  return p
}

export function requestCameraShake(cameras: TribeCameras, amount: number) {
  cameras.shake.pending = true
  if (amount > cameras.shake.amplitude) cameras.shake.amplitude = amount & 255
}

export function beginCameraVisit(cameras: TribeCameras) {
  if (cameras.phase !== 'idle') throw new Error('Nested camera visit')
  cameras.phase = 'camera'
}

export function applyCameraShake(
  cameras: TribeCameras,
  tribe: number,
  drawMode: number,
  randomState: number
) {
  const s = cameras.shake
  if (!s.active) return
  // 0047f510's globe branch clears active but retains amplitude and bytes.
  if (drawMode === 2) {
    s.active = false
    return
  }
  if (s.amplitude) {
    // The native helper uses a local RNG copy. It does not advance game RNG.
    const rng = { randomState },
      half = s.amplitude >> 1,
      byte = (n: number) => (n << 24) >> 24
    s.bytes.x = byte((random(rng) % s.amplitude) - half)
    s.bytes.y = byte((random(rng) % s.amplitude) - half)
    if (s.amplitude >> 4)
      s.bytes.angle = byte((random(rng) % (s.amplitude >> 4)) - (s.amplitude >> 5))
    shift(cameras.tribes[tribe], s.bytes, 1)
  }
  // Zero amplitude deliberately retains the previous byte offsets. Cleanup
  // still subtracts them when active; clearing them here changes native state.
  s.amplitude = 0
}

export function endCameraVisit(cameras: TribeCameras, tribe: number) {
  const s = cameras.shake
  for (const held of cameras.held) Object.assign(held, correction())
  if (s.active) {
    Object.assign(cameras.held[tribe], s.bytes)
    // Subtract from the RESULT, preserving absolute focus and other writes:
    // 100 + 3, focus 200, cleanup -3 commits 197 and displays 200.
    shift(cameras.tribes[tribe], s.bytes, -1)
    s.active = false
  }
  if (s.pending) {
    s.active = true
    s.pending = false
  }
  cameras.phase = 'idle'
}

// Modern off-grid adaptation: simulation keeps its existing deadlines and
// samples the last logical display correction without advancing camera work.
// All synchronous writers/readers share these same mutable tribe records.
export function withSimulationCamera<T>(cameras: TribeCameras, visit: () => T): T {
  if (cameras.phase !== 'idle') return visit()
  cameras.phase = 'simulation'
  for (let i = 0; i < cameras.tribes.length; i++) {
    Object.assign(cameras.borrowed[i], cameras.held[i])
    shift(cameras.tribes[i], cameras.borrowed[i], 1)
  }
  try {
    return visit()
  } finally {
    for (let i = 0; i < cameras.tribes.length; i++)
      shift(cameras.tribes[i], cameras.borrowed[i], -1)
    cameras.phase = 'idle'
  }
}
