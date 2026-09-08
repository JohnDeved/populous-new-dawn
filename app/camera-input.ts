import type { CameraPosition } from './camera-motion.ts'
import { movePosition } from './native-math.ts'

export interface CameraVelocity {
  turn: number
  forward: number
  side: number
}

const short = (value: number) => (value << 16) >> 16
const fraction = (value: number, scale: number) => Math.trunc(Math.imul(value, scale) / 256)

// 0x4ae200 maps held navigation commands to the movement byte.
export function cameraCommand(
  command: number,
  input: {
    control?: boolean
    fast?: boolean
    swap?: boolean
    reverse?: boolean
    overview?: boolean
    blocked?: boolean
  } = {}
) {
  if (input.blocked) return 0
  if (!!input.control !== !!input.swap && command >= 3 && command <= 6)
    command += command < 5 ? 2 : -2
  // Fixed-direction aliases bypass the Ctrl/setting swap.
  if (command >= 199 && command <= 202) command -= 196
  if (command < 1 || command > 6) return 0
  if (command >= 5) {
    if (input.overview) return command === 5 ? 4 : 8
    if (input.reverse) return command === 5 ? 32 : 16
    return command === 5 ? 16 : 32
  }
  return (1 << (command - 1)) | (input.fast ? 64 : 0)
}

// 0x479dd0: requesting the same direction twice also enables fast panning.
export const mergeCameraInput = (current: number, incoming: number) =>
  (current | incoming | (current & incoming ? 64 : 0)) & 255

// 0x4adbb0 tests the outer screen pixels, including the sidebar and corners.
export function cameraEdgeButtons(x: number, y: number, width: number, height: number) {
  let buttons = 0
  if (x < 1) buttons |= 4
  else if (x >= width - 1) buttons |= 8
  if (y < 1) buttons |= 1
  else if (y >= height - 1) buttons |= 2
  return buttons
}

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
