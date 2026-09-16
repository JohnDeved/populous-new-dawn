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

// Sample the next native configuration without advancing its owned state.
// The projection and shader both consume integers; quantize the displayed
// fields together rather than letting CPU and GPU round different values.
export function previewViewTransition(
  current: CameraConfig,
  target: CameraConfig,
  remaining: number,
  frames: number,
  fraction: number
) {
  if (!remaining || fraction <= 0) return current
  const next = { ...current }
  stepViewTransition(next, target, remaining, frames)
  if (fraction >= 1) return next
  const preview = { ...current }
  for (const key of [
    'curvature',
    'scale',
    'pitch',
    'perspective',
    'depth',
    'spriteScale',
    'shamanScale',
    'horizon',
    'offsetX',
    'offsetY',
  ] as const)
    preview[key] = Math.round(current[key] + (next[key] - current[key]) * fraction)
  // Bounds, sprite mode and other discrete fields keep their native boundary.
  return preview
}

export interface GlobeMorph {
  value: number
  source: number
  target: number
  increment: number
  frame: number
  duration: number
  active: boolean
}

// 0x41d410 / 0x41d450: entry starts flat; return is ignored during a morph.
export function beginGlobeMorph(morph: GlobeMorph, entering: boolean) {
  if (!entering && morph.active) return
  morph.source = entering ? 256 : morph.value
  morph.value = morph.source
  morph.target = entering ? 0 : 256
  morph.increment = Math.trunc(((morph.target - morph.source) * 256) / morph.duration)
  morph.frame = 0
  morph.active = true
}

// 0x41d680 and draw_globe use an inclusive initial frame, then snap the endpoint.
export function stepGlobeMorph(morph: GlobeMorph) {
  if (!morph.active) return
  morph.value = morph.source + Math.trunc(Math.imul(morph.frame++, morph.increment) / 256)
  if (morph.frame === morph.duration + 1) {
    morph.active = false
    morph.value = morph.target
  }
}
