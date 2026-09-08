import type { CameraConfig } from './projection.ts'

// 0x479f00 command 15: close (3), normal (0), bird's-eye (2), world (4).
export function zoomPreset(preset: number, inward: boolean) {
  const order = [3, 0, 2, 4],
    index = order.indexOf(preset)
  return index === -1 ? preset : order[Math.max(0, Math.min(3, index + (inward ? -1 : 1)))]
}

// 0x4174b0: even frame count, clamped after conversion to a signed byte.
export function viewTransitionFrames(frameRate: number, scale?: number) {
  const byte = ((Math.trunc((Math.imul(frameRate, 3) | 0) / 4) & 254) << 24) >> 24
  const frames = Math.max(8, Math.min(32, byte))
  return scale === undefined ? frames : (Math.trunc((frames << 8) / scale) << 24) >> 24
}

// 0x417510. View fields approach the target using integer divisions each frame.
// Viewport/cache/transform notifications remain the renderer's responsibility.
export function stepViewTransition(
  current: CameraConfig,
  target: CameraConfig,
  remaining: number,
  frames: number
) {
  if (!remaining) return 0
  if (remaining === frames) {
    current.scaledSprites = Number(!!(current.scaledSprites || target.scaledSprites))
    current.diameter = 50
  }
  current.boundsMode = 0
  if (remaining > 1)
    for (const key of [
      'curvature',
      'scale',
      'pitch',
      'perspective',
      'depth',
      'spriteScale',
      'shamanScale',
      'horizon',
    ] as const)
      current[key] += Math.trunc((target[key] - current[key]) / (remaining - 1))
  if (remaining <= frames - 1)
    for (const key of ['offsetX', 'offsetY'] as const)
      current[key] += Math.trunc((target[key] - current[key]) / remaining)
  if (--remaining === 0) Object.assign(current, target, { bounds: [...target.bounds] })
  return remaining
}
