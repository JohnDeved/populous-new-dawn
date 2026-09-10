import { positionDistance } from './native-math.ts'
import { emptyPersonOrder, type PersonOrder } from './person-orders.ts'
import {
  randomPersonSpeed,
  recoverPersonMovement,
  setPersonAnimationRow,
  type PersonStateEffects,
} from './person-state.ts'
import { retryCombatTarget, type CombatApproachPerson } from './combat-approach.ts'

interface Point {
  x: number
  y: number
}
export type SearchingCombatPerson = CombatApproachPerson & {
  turnY: number
  marchCooldown: number // Native byte +0x1e, separate from the animation stamp.
}
export interface CombatMarch {
  count: number
  person: number
  a: number
  b: number
  distance: number
}
interface CombatSearchWorld {
  randomState: number
  playerTribe: number
  alert: number
  marches: CombatMarch[]
}
interface CombatSearchEffects {
  animation: PersonStateEffects['setAnimation']
  releaseMotion: () => void
  approachPoint: (order: PersonOrder) => Point & { kind: number }
  destination: (point: Point) => void
  withinArea: (order: PersonOrder) => boolean
  select: (order: PersonOrder, vehicleOnly: boolean) => { id: number; type: number } | undefined
  prepareTarget: (order: PersonOrder, id: number) => boolean
  range: () => number
}

// 0x51a2a0 shares eight march summaries across people, keyed by both payload
// words. Existing records still update when full; only new records need space.
function recordMarch(w: CombatSearchWorld, p: SearchingCombatPerson, order: PersonOrder) {
  const distance = positionDistance({ x: p.turnAngle, y: p.turnY }, p)
  const match = w.marches.find(m => m.a === order.a && m.b === order.b)
  if (match) {
    if (!p.marchCooldown) match.count = (match.count + 1) & 255
    match.distance = Math.min(match.distance, distance)
    p.marchCooldown = 16
  } else if (distance > 2560 && w.marches.length < 8) {
    w.marches.push({ count: 1, person: p.id, a: order.a, b: order.b, distance })
    p.marchCooldown = 16
  }
}

function chooseTarget(
  p: SearchingCombatPerson,
  order: PersonOrder,
  e: Pick<CombatSearchEffects, 'select' | 'prepareTarget'>,
  vehicleOnly = false
) {
  const target = e.select(order, vehicleOnly)
  if (!target) return undefined
  const { id, type } = target
  p.workTarget = id
  p.substate = type >= 1 && type <= 4 ? type : 0
  if (p.model === 6 && (type === 2 || type === 3)) p.substate += 8
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  return e.prepareTarget(order, id)
}

// Used by automatic entry fallback, periodic local scans and busy-target retry.
// No result leaves ownership intact; each caller supplies its own restart rule.
export function retargetCombatOrder(
  p: SearchingCombatPerson,
  radius: number,
  e: Pick<CombatSearchEffects, 'select' | 'prepareTarget'>
) {
  const order = emptyPersonOrder()
  order.model = 21
  order.a = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  order.b = (radius & 254) * 257
  return chooseTarget(p, order, e)
}

// Command 19/21's front half, through target dispatch (0x51a8db). The caller
// retains both results until after the selected attack phase: completion and
// restart are independent, and automatic rescanning can replace restart.
export function prepareCombatOrderVisit(
  w: CombatSearchWorld,
  p: SearchingCombatPerson,
  order: PersonOrder,
  e: CombatSearchEffects
) {
  if (order.model !== 19 && order.model !== 21)
    throw new RangeError(`Unsupported attack command ${order.model}`)
  if (p.tribe === w.playerTribe && !w.alert) w.alert = 1
  const automatic = order.model === 21
  let complete = false,
    restart = false
  p.flags2 = (p.flags2 | 0x2000000) >>> 0
  if (p.flags2 & 0x40000000) {
    p.flags4 = (p.flags4 & ~0x10007) >>> 0
    p.assignment &= ~512
  }
  if (p.substate === 0) {
    let scan = !(p.counter & 3)
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      scan = true
      const point = e.approachPoint(order)
      p.flags4 = ((p.flags4 & ~0x80000) | (point.kind === 2 ? 0x80000 : 0)) >>> 0
      if (p.model !== 6 || !automatic) {
        e.destination(point)
        const inArea = e.withinArea(order)
        if (p.model === 6) {
          if (!inArea) p.speed = randomPersonSpeed(w, p)
          if (!p.vehicle)
            setPersonAnimationRow(p, (p.cargo ? 4 : 0) + (p.speed ? 1 : 0), e.animation)
        } else if (!inArea) recoverPersonMovement(w, p, e.animation)
      }
    }
    p.assignment |= 8
    if (scan) {
      if (p.model !== 6) recordMarch(w, p, order)
      if (e.withinArea(order)) {
        const selected = chooseTarget(p, order, e, p.model === 6 && automatic && !!p.vehicle)
        if (selected !== undefined) restart = selected
        else if (automatic) {
          const fallback = retargetCombatOrder(p, e.range(), e)
          restart = fallback ?? false
          complete = fallback === undefined || fallback
        } else complete = true
      }
    }
  } else if (p.substate === 7) retryCombatTarget(w, p, e)
  if (p.substate !== 0 && p.substate !== 7 && automatic && !(p.counter & 3))
    restart = retargetCombatOrder(p, 0, e) ?? false
  return { complete, restart }
}
