import { nativeAngle } from './native-math.ts'
import { setPersonAnchor } from './person-order-update.ts'
import {
  defaultPersonState,
  resetPersonMotion,
  setPersonAnimationRow,
  type PersonStateEffects,
  type StatefulPerson,
} from './person-state.ts'

type Point = { x: number; y: number }
type CastingPerson = StatefulPerson & {
  heading: number
  velocity: { x: number; y: number; z: number }
  anchorX: number
  anchorY: number
  anchorFlags: number
}
const short = (n: number) => (n << 16) >> 16

// 0x4e96f0 / 0x4e96d0: stop horizontal motion, retaining only upward velocity.
function stopCastingVelocity(p: CastingPerson) {
  p.velocity.x = p.velocity.z = 0
  if (short(p.velocity.y) < 0) p.velocity.y = 0
}

// State 22 in 0x4d2740. 0x40a3f0(p, 0) resolves the CURRENT terrain
// cell's indexed object when flag 0x200 is set, not a neighboring vehicle.
// The upper animation setter owns phase retention; do not reset f2 here.
export function initializePersonCasting(
  p: CastingPerson,
  cellObject: boolean,
  animation: PersonStateEffects['setAnimation']
) {
  p.speed = 0
  stopCastingVelocity(p)
  if (!p.vehicle && !cellObject) animation(p, 109)
  else setPersonAnimationRow(p, p.cargo ? 4 : 0, animation)
  p.timer = 10
}

// 0x4c1b80, after attempted state admission, including protected people.
export function facePersonCasting(p: CastingPerson, target: Point) {
  const angle = nativeAngle(short(target.x - p.x), -short(target.y - p.y)) & 2047
  if (p.flags2 & 128) p.turnAngle = angle
  p.heading = angle
  p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
}

// State 22 in 0x4d32b0 (case 21), AFTER person preparation and physics.
// This ten-visit person controller does not own the six-visit spell projectile.
export function stepPersonCasting(
  p: CastingPerson,
  gameFlags: number,
  effects: {
    animation: PersonStateEffects['setAnimation']
    destination: (point: Point) => void
    outside: (point: Point) => Point
    release: () => void
    initialize: (state: number) => void
  }
) {
  p.timer = short(p.timer - 1)
  if (p.timer >= 1) return
  stopCastingVelocity(p)
  p.speed = 0
  setPersonAnimationRow(p, p.cargo ? 4 : 0, effects.animation)
  effects.destination({ x: p.x, y: p.y })
  if (p.animationMode) {
    setPersonAnchor(p, effects.outside({ x: p.x, y: p.y }))
    effects.release()
    p.turnAngle = p.heading
    p.flags2 = (p.flags2 | 0x1080) >>> 0
  }
  resetPersonMotion(p)
  if (!(p.flags2 & 0x100000)) effects.initialize(defaultPersonState(p, gameFlags))
}
