import type { SkyMotion } from './sky.ts'

const wrap = (value: number, period: number) => ((value % period) + period) % period
const delta = (value: number, period: number) => {
  if (value > period / 2) return value - period
  if (value < -period / 2) return value + period
  return value
}

// Continuous version of 0x523830's wind and half-heading camera parallax.
// Native wind is 17/8 and 9/8 coordinate units per millisecond.
// Integrate one camera segment analytically, keeping fractions until rasterization.
// Native camera-step snapshots delimit bends even when a render spans many steps.
export function advanceSkyMotion(
  motion: SkyMotion,
  camera: { x: number; y: number; angle: number },
  seconds: number
) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid sky elapsed time')
  const x = wrap(camera.x, 65536),
    y = wrap(camera.y, 65536),
    angle = wrap(camera.angle, 2048),
    turn = delta(angle - motion.previousAngle, 2048),
    halfSweep = (turn * Math.PI) / 4096,
    average = ((motion.angle - motion.previousAngle) * Math.PI) / 1024 - halfSweep,
    weight = halfSweep ? Math.sin(halfSweep) / halfSweep : 1,
    cosine = Math.cos(average) * weight,
    sine = Math.sin(average) * weight,
    dx = seconds * 2125 - delta(x - motion.previousX, 65536),
    dy = seconds * 1125 - delta(y - motion.previousY, 65536)
  motion.x = wrap(motion.x + dx * cosine + dy * sine, 65536)
  motion.y = wrap(motion.y + dy * cosine - dx * sine, 65536)
  motion.angle = wrap(motion.angle + turn / 2, 2048)
  motion.previousAngle = angle
  motion.previousX = x
  motion.previousY = y
}
