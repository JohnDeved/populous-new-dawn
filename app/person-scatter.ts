import rules from './original-rules.json' with { type: 'json' }
import { random } from './native-math.ts'
import { defaultPersonState, randomPersonSpeed, type StatefulPerson } from './person-state.ts'
import { setPersonAnchor } from './person-order-update.ts'

// Player scatter: default D record 005d61fc -> action 0xc0 -> tribe command 0x7e
// -> person state 43. See decomp/research/player-scatter.md.
export const SCATTER_STATE = 43

interface Point {
  x: number
  y: number
  h: number
}
type ScatteringPerson = StatefulPerson &
  Point & { anchorX: number; anchorY: number; anchorFlags: number }

// 0x43e8e0 case 0x7e (0x441c62): every selected tribe person outside vehicles
// and buildings, not fighting (25/29) and not protected by flags2 0x100000.
// It does not test model, selection count, terrain, orders or the current state.
export function nativeScatterEligible(
  p: Pick<StatefulPerson, 'selectionFlags' | 'vehicle' | 'flags2' | 'state'>
) {
  return (
    !!(p.selectionFlags & 128) &&
    !p.vehicle &&
    !(p.flags2 & 0x800000) &&
    p.state !== 25 &&
    p.state !== 29 &&
    !(p.flags2 & 0x100000)
  )
}

// 0x4e2fe0, person state 43. The first visit draws a heading and then a speed,
// releases the current motion route and selects the run animation (row 25).
// Twelve visits (or ground-obstacle recovery, flags2 0x800) end the state.
// Only a person without a current command status gets a new idle anchor;
// queued commands are never touched and resume through the next state.
export function stepPersonScatter(
  w: { randomState: number },
  p: ScatteringPerson,
  gameFlags: number,
  effects: {
    release: () => void
    setAnimation: (object: number) => void
    outside: (point: Point) => Point
  }
) {
  if (!p.substate) {
    p.substate = 1
    const heading = random(w)
    p.flags2 = (p.flags2 | 0x200000) >>> 0
    p.timer = 12
    effects.release()
    p.flags2 = (p.flags2 | 0x1080) >>> 0
    p.turnAngle = heading & 2047
    p.speed = randomPersonSpeed(w, p)
    effects.setAnimation(rules.personAnimationObjects[25 * 9 + p.model])
  }
  p.timer = ((p.timer - 1) << 16) >> 16
  if (p.timer > 0 && !(p.flags2 & 0x800)) return 0
  if (!p.commandStatus) setPersonAnchor(p, effects.outside({ x: p.x, y: p.y, h: p.h }))
  return defaultPersonState(p, gameFlags)
}
