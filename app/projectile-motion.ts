import { TURNS_PER_SECOND, type Effect, type World } from './model.ts'
import { interpolateUnitPosition } from './unit-motion.ts'

interface Position {
  x: number
  y: number
  z: number
}
const position = (f: Effect, p: Position = { x: 0, y: 0, z: 0 }) => {
  p.x = f.x
  p.y = Math.round(f.height! * 45) / 128
  p.z = f.z
  return p
}

// Use the same elapsed turn fraction as followers, so the fireball reaches
// impact on their visual clock without altering native simulation timing.
// Only the five attached Blast sprites need snapshots; free sparks keep their clocks.
export class ProjectileMotion {
  frames = new WeakMap<Effect, { from: Position; to: Position }>()

  beforeTurn(w: World) {
    for (const shot of w.projectiles)
      for (const f of shot.visuals) {
        const frame = this.frames.get(f)
        if (frame) position(f, frame.from)
        else {
          const from = position(f)
          this.frames.set(f, { from, to: { ...from } })
        }
      }
  }

  afterTurn(w: World) {
    for (const shot of w.projectiles)
      for (const f of shot.visuals) {
        const frame = this.frames.get(f)
        if (frame) position(f, frame.to)
      }
  }

  position(w: World, f: Effect, result: Position) {
    const frame = this.frames.get(f)
    if (!frame || result.x !== frame.to.x || result.y !== frame.to.y || result.z !== frame.to.z)
      return result
    return interpolateUnitPosition(
      frame.from,
      frame.to,
      Math.min(1, w.pendingTime * TURNS_PER_SECOND),
      result
    )
  }
}
