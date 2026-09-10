import { height, unitAnimationSource, TURNS_PER_SECOND, type Unit, type World } from './model.ts'

interface Position {
  x: number
  y: number
  z: number
}
interface Motion {
  from: Position
  to: Position
  inside: Unit['inside']
  kind: Unit['kind']
  team: Unit['team']
}
const wrap = (n: number) => ((((n + 128) % 256) + 256) % 256) - 128

// 0x46f080 draws previous position + displacement * turn fraction. Keep the
// fractions instead of estimating them from last second's rendered-frame count.
export function interpolateUnitPosition(
  from: Position,
  to: Position,
  fraction: number,
  result: Position = { x: 0, y: 0, z: 0 }
) {
  result.x = wrap(from.x + wrap(to.x - from.x) * fraction)
  result.y = from.y + (to.y - from.y) * fraction
  result.z = wrap(from.z - wrap(from.z - to.z) * fraction)
  return result
}

export function unitPosition(w: World, u: Unit, result: Position = { x: 0, y: 0, z: 0 }) {
  result.x = u.x
  result.y = u.flight
    ? u.flight.h / 128
    : Math.round(height(w.terrain, u.x, u.z) * 45) / 128 +
      ((0.04 + Math.sin(u.lift * Math.PI) * 2) * 45) / 128
  const source = unitAnimationSource(u),
    offset = source?.supportHeight ?? u.supportHeight ?? 0
  if (offset)
    result.y =
      ((source?.h ?? Math.round(height(w.terrain, u.x, u.z) * 45)) + ((offset << 16) >> 16)) / 128
  result.z = u.z
  return result
}

// Rendering owns these snapshots, never the simulation/RNG or native sprite state.
// Capture every turn, including all turns processed by a long browser frame.
export class UnitMotion {
  frames = new WeakMap<Unit, Motion>()

  beforeTurn(w: World) {
    for (const u of w.units) {
      const frame = this.frames.get(u)
      if (frame) {
        unitPosition(w, u, frame.from)
        Object.assign(frame, { inside: u.inside, kind: u.kind, team: u.team })
      } else {
        const from = unitPosition(w, u)
        this.frames.set(u, { from, to: { ...from }, inside: u.inside, kind: u.kind, team: u.team })
      }
    }
  }

  afterTurn(w: World) {
    for (const u of w.units) {
      const frame = this.frames.get(u)
      if (!frame) continue // New people appear at their spawn point.
      unitPosition(w, u, frame.to)
      // Entering/exiting a building and changing class are discrete transitions.
      if (frame.inside !== u.inside || frame.kind !== u.kind || frame.team !== u.team)
        Object.assign(frame.from, frame.to)
      Object.assign(frame, { inside: u.inside, kind: u.kind, team: u.team })
    }
  }

  position(w: World, u: Unit, result?: Position) {
    const current = unitPosition(w, u, result),
      frame = this.frames.get(u)
    // Explicit placement, terrain edits or commands outside the turn bypass old history.
    if (
      !frame ||
      frame.inside !== u.inside ||
      frame.kind !== u.kind ||
      frame.team !== u.team ||
      current.x !== frame.to.x ||
      current.y !== frame.to.y ||
      current.z !== frame.to.z
    )
      return current
    if (frame.from.x === current.x && frame.from.y === current.y && frame.from.z === current.z)
      return current
    return interpolateUnitPosition(
      frame.from,
      current,
      Math.min(1, w.pendingTime * TURNS_PER_SECOND),
      current
    )
  }
}
