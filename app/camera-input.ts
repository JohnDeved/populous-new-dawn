import type { CameraPosition } from './camera-motion.ts'
import { movePosition } from './native-math.ts'

export interface CameraVelocity {
  turn: number
  forward: number
  side: number
}

const short = (value: number) => (value << 16) >> 16
const fraction = (value: number, scale: number) => Math.trunc(Math.imul(value, scale) / 256)

// 0x442880/0x442920/0x4429c0 share input scaling and momentum retention.
function applyAxis(
  camera: CameraPosition,
  velocity: CameraVelocity,
  axis: keyof CameraVelocity,
  distance: number,
  momentum: number,
  scale?: number
) {
  const amount = scale === undefined ? distance : fraction(distance, scale)
  if (axis === 'turn') camera.angle = (camera.angle + short(amount)) & 2047
  else movePosition(camera, camera.angle - (axis === 'side' ? 512 : 0), amount)
  velocity[axis] = short(fraction(amount, momentum))
}

// 0x4424b0. Bits: forward/back, left/right, turn left/right, fast pan.
// Native interaction cleanup and globe-cache notifications belong to the caller.
export function stepCameraInput(
  camera: CameraPosition,
  velocity: CameraVelocity,
  buttons: number,
  frameRate: number,
  momentum = 0,
  scale?: number
) {
  const rate = Math.max(20, frameRate)
  let speed = short(Math.trunc(7680 / rate))
  if (buttons & 64) speed = short(speed << 2)
  if (buttons & 48) velocity.turn = short(Math.trunc(640 / rate)) * (buttons & 32 ? 1 : -1)
  if (buttons & 3) velocity.forward = short(speed * (buttons & 1 ? 1 : -1))
  if (buttons & 12) velocity.side = short(speed * (buttons & 4 ? 1 : -1))
  // Panning uses the heading after this frame's rotation, including diagonals.
  for (const axis of ['turn', 'forward', 'side'] as const)
    if (velocity[axis]) applyAxis(camera, velocity, axis, velocity[axis], momentum, scale)
}

// 0x4adbb0 mouse modes 1 and 2: rotate ignores vertical drag; pan is 12 units/pixel.
export function dragCamera(
  camera: CameraPosition,
  velocity: CameraVelocity,
  rotate: boolean,
  dx: number,
  dy: number,
  momentum = 0,
  scale?: number
) {
  if (rotate) applyAxis(camera, velocity, 'turn', dx, momentum, scale)
  else {
    applyAxis(camera, velocity, 'forward', Math.imul(dy, 12), momentum, scale)
    applyAxis(camera, velocity, 'side', Math.imul(dx, 12), momentum, scale)
  }
}
