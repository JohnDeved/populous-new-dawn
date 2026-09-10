import rules from './original-rules.json' with { type: 'json' }
import {
  buildingInsidePoint,
  buildingOutsidePoint,
  type BuildingShapePose,
} from './building-shapes.ts'
import { faceBuildingPoint, nearBuildingPoint } from './building-work.ts'
import { setPersonAnchor } from './person-order-update.ts'
import {
  recoverPersonMovement,
  setPersonAnimationRow,
  type PersonStateEffects,
} from './person-state.ts'
import { positionsOverlap } from './person-motion.ts'
import { movePosition, random } from './native-math.ts'
import type { TrainingPerson } from './training.ts'
import type { BuildingPlan } from './building-damage.ts'
import {
  allocatePersonOrder,
  currentPersonOrder,
  writePersonOrder,
  type OrderPool,
  type PersonOrder,
} from './person-orders.ts'

export type DismantlingPerson = TrainingPerson & {
  anchorX: number
  anchorY: number
  anchorFlags: number
}
export interface DismantlingBuilding extends BuildingShapePose {
  id: number
  class: number
  model: number
  tribe: number
  flags2: number
  inside: number
}
interface DismantlingEffects {
  building: (id: number) => DismantlingBuilding | undefined
  plan: (b: DismantlingBuilding) => BuildingPlan | undefined
  adjacentBuilding: () => number
  animation: PersonStateEffects['setAnimation']
  destination: (point: { x: number; y: number }, direct: boolean) => void
  dropCargo: () => void
  removeOccupant: (b: DismantlingBuilding) => void
  ensurePlan: (b: DismantlingBuilding) => void
  takeTimber: (plan: BuildingPlan, amount: number) => void
  removePlan: (b: DismantlingBuilding) => void
  removeBuilding: (b: DismantlingBuilding) => void
}
const Phase = { Start: 0, Approach: 1, Enter: 2, Work: 3, Leave: 4, FindWork: 5 } as const

// 0x40a0c0 for ordinary six-slot buildings. The original also scans the following
// object word; special structures sharing that word remain separate scope.
export function toggleDismantling(
  orders: OrderPool,
  people: ReadonlyMap<number, TrainingPerson>,
  b: DismantlingBuilding & { activity: number; occupants: number[] },
  enabled: boolean,
  e: { buildingAt: (cell: number) => number; assign: (id: number, order: number) => void }
) {
  b.activity = enabled ? b.activity | 0x8000 : b.activity & ~0x8000
  const inside = buildingInsidePoint(b),
    cell = ((inside.x >>> 8) & 254) | (inside.y & 0xfe00)
  for (const order of orders.records) {
    if (!order.references) continue
    if (!enabled) {
      if (order.model === 10 && order.a === b.id) order.flags |= 1
      continue
    }
    const flags = rules.personCommands[order.model].flags
    if (!(flags & 0x80000) || (flags & 4 ? e.buildingAt(order.b) : order.a) !== b.id) continue
    Object.assign(order, { model: 10, a: b.id, b: cell })
    for (const p of people.values())
      if (p.tribe === b.tribe && p.state === 10 && currentPersonOrder(orders, p) === order)
        p.flags2 = (p.flags2 | 16) >>> 0
  }
  if (!enabled || !b.inside) return
  const id = allocatePersonOrder(orders)
  if (!id) return
  writePersonOrder(orders.records[id], 10, b.id, cell, 0x20)
  for (const occupant of b.occupants.slice(0, 6)) {
    const p = people.get(occupant)
    if (p?.class && !(p.flags2 & 1)) e.assign(p.id, id)
  }
}

// Complete person command 10 (0x497a30). Native world allocation, order startup
// and completion remain separate owners. Movement uses the shared path/physics
// consumers; this controller never teleports or invents a demolition timer.
export function stepDismantling(
  rng: { randomState: number },
  p: DismantlingPerson,
  order: PersonOrder,
  e: DismantlingEffects
) {
  p.flags4 = (p.flags4 & 0xfffefff8) >>> 0
  if (p.substate === Phase.Start) {
    p.workTarget = 0
    const b = e.building(order.a),
      descriptor = rules.personCommands[order.model],
      allowed = p.flags4 & 0x800 ? descriptor.flags & 0x4000000 : descriptor.people & (1 << p.model)
    if (!allowed || b?.class !== 2 || b.tribe !== p.tribe) return 1
    p.workTarget = order.a
    setPersonAnchor(p, buildingOutsidePoint(b))
    p.substate = e.adjacentBuilding() === b.id && !p.cargo ? Phase.Enter : Phase.Approach
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
  const b = e.building(p.workTarget)
  if (!b?.class || b.flags2 & 1) return 1
  const next = (phase: number) => {
    p.substate = phase
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
  const restart = !!(p.flags2 & 0x40000000)
  const recover = () => recoverPersonMovement(rng, p, e.animation)
  if (p.substate === Phase.Work) {
    if (restart) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      p.speed = 0
      setPersonAnimationRow(p, 6, e.animation)
      p.timer = (random(rng) & 31) + 32
    }
    p.timer = ((p.timer - 1) << 16) >> 16
    if (p.timer > 0) return 0
    const plan = e.plan(b)
    if (plan && (plan.repairDelay & 65535) > 1) next(Phase.Enter)
    else {
      let removed = false
      if (p.cargo < rules.personWood[p.model]) {
        e.ensurePlan(b)
        const plan = e.plan(b)
        if (plan) {
          e.takeTimber(plan, rules.personWood[p.model])
          if (plan.remaining < 1) {
            removed = true
            e.removePlan(b)
            e.removeBuilding(b)
          }
        }
      }
      next(removed ? Phase.Leave : Phase.Approach)
    }
    return 0
  }
  if (p.substate < Phase.Approach || p.substate > Phase.FindWork) return 0
  p.flags4 |= 4
  if (restart) {
    p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    if (p.substate === Phase.FindWork) {
      for (let n = (b.inside << 24) >> 24; n > 0; n--) e.removeOccupant(b)
      const point = buildingInsidePoint(b),
        angle = random(rng) & 2047
      movePosition(point, angle, rules.buildingWorkRadius[b.model])
      e.destination(point, true)
      recover()
      if (p.flags2 & 128) p.turnAngle = angle
      p.heading = angle
      p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
    } else {
      recover()
      const point = p.substate === Phase.Enter ? buildingInsidePoint(b) : buildingOutsidePoint(b)
      e.destination(point, p.substate !== Phase.Approach)
      if (p.substate === Phase.Leave) faceBuildingPoint(p, point, 2047)
    }
  }
  if (p.counter & 1) return 0
  const goal = { x: p.goalX, y: p.goalY }
  if (p.substate === Phase.Leave) return positionsOverlap(p, 56, goal, 56) ? 1 : 0
  if (!nearBuildingPoint(p, goal, p.substate === Phase.Enter ? 568 : 112)) return 0
  if (p.substate === Phase.Approach) {
    e.dropCargo()
    next(Phase.Enter)
  } else next(p.substate === Phase.Enter ? Phase.FindWork : Phase.Work)
  return 0
}
