import rules from './original-rules.json' with { type: 'json' }
import { currentPersonOrder, type OrderPool, type PersonOrder } from './person-orders.ts'
import { positionsOverlap } from './person-motion.ts'
import type { StatefulPerson } from './person-state.ts'

type Point = { x: number; y: number }
export type UpdatingPerson = StatefulPerson & {
  counter: number
  goalX: number
  goalY: number
  anchorX: number
  anchorY: number
  anchorFlags: number
}
type OrderObject = Point & {
  class: number
  model: number
  flags2: number
  tribe: number
  timer: number
  signal: number
}
export type OrderUpdateWorld = {
  orders: OrderPool
  landFlags: number
  levelFlags2: number
  playerTribe: number
  objects: ReadonlyMap<number, OrderObject>
  survivingTribes: () => number
}
export type OrderUpdateEffects = {
  // Complete command bodies use these canonical models. Shared bodies:
  // 3/25 movement, 17/31/32, 19/21. Missing bodies must not return success.
  commands: Partial<Record<number, (order: PersonOrder) => number>>
  commandPosition: (order: PersonOrder) => Point
  vehicleDestination: (to: Point, mode: number) => boolean
  vehicleReady: (id: number) => boolean
  leaveVehicle: () => boolean
  changeTribe: (tribe: number) => void
  effectiveTribe: () => number
  cellObjects: (point: Point) => Iterable<OrderObject>
  outside: (point: Point) => Point
  destination: (point: Point) => void
  arrival: (mode: number) => void
  stop: () => void
  formation: () => void
  remove: (slot: number) => void
  advance: () => boolean
  initialize: () => void
}
const short = (n: number) => (n << 16) >> 16

// Complete 0x402e70. Both anchor coordinates become centers of 512-unit cells.
export function setPersonAnchor(
  p: Pick<UpdatingPerson, 'anchorX' | 'anchorY' | 'anchorFlags'>,
  point: Point
) {
  p.anchorX = (point.x & 0xfe00) + 256
  p.anchorY = (point.y & 0xfe00) + 256
  p.anchorFlags = 0
}

// Complete 0x4e32a0: the idle state differs from the model's order state.
export function personStateAfterOrders(
  w: Pick<OrderUpdateWorld, 'landFlags' | 'playerTribe' | 'survivingTribes'>,
  p: { model: number; tribe: number }
) {
  if (
    !(w.landFlags & 8) &&
    w.landFlags & 0x6000000 &&
    (w.landFlags & 0x4000000 ? w.survivingTribes() <= 1 : p.tribe === w.playerTribe)
  )
    return 41
  return rules.personModels[p.model].idleState
}

// Complete 0x432590. Command bodies, pathfinding, transport and queue ownership
// remain required consumers; completion and all inline command behavior live here.
export function stepPersonOrders(w: OrderUpdateWorld, p: UpdatingPerson, e: OrderUpdateEffects) {
  const order = currentPersonOrder(w.orders, p)
  let complete = false,
    finished = !order,
    resumeWork = false,
    anchored = false
  const run = (model: number) => {
    const fn = e.commands[model]
    if (!fn) throw new Error(`Unported native command body ${model}`)
    return !!(fn(order!) & 255)
  }
  if (order) {
    if (order.flags & 1) complete = true
    else if (p.flags4 & 0x10000000) {
      finished = true
      resumeWork = true
    } else {
      if (!(p.counter & 7)) {
        if (p.flags3 & 128) {
          if (p.vehicle) {
            const current = currentPersonOrder(w.orders, p)
            if (current) {
              if (e.vehicleDestination(e.commandPosition(current), 0))
                p.flags3 = (p.flags3 & ~128) >>> 0
            } else p.flags3 = (p.flags3 & ~128) >>> 0
          } else p.flags3 = (p.flags3 & ~128) >>> 0
        }
        if (!(rules.personCommands[p.commandStatus].flags & 0x40000))
          p.flags4 = (p.flags4 & ~8) >>> 0
        else if (!(p.flags4 & 8)) {
          const vehicle = p.vehicle ? w.objects.get(p.vehicle) : undefined
          if (
            !p.vehicle ||
            !vehicle ||
            !vehicle.class ||
            vehicle.flags2 & 1 ||
            (e.vehicleReady(p.vehicle) && e.leaveVehicle())
          )
            p.flags4 = (p.flags4 | 8) >>> 0
        }
      }
      switch (order.model) {
        case 3:
        case 4:
        case 6:
        case 7:
        case 8:
        case 10:
        case 11:
        case 13:
        case 15:
        case 17:
        case 18:
        case 19:
        case 22:
        case 27:
        case 28:
        case 30:
        case 33:
          complete = run(order.model)
          break
        case 21:
          complete = run(19)
          break
        case 31:
        case 32:
          complete = run(17)
          break
        case 5:
        case 14:
        case 20:
        case 24:
        case 26:
          complete = true
          break
        case 9:
          if (
            !(p.counter & 1) &&
            Math.abs(short(p.goalX) - short(p.x)) < 112 &&
            Math.abs(short(p.goalY) - short(p.y)) < 112
          ) {
            complete = true
            e.arrival(0)
          }
          break
        case 16: {
          e.changeTribe(order.a & 255)
          const vehicle = p.vehicle ? w.objects.get(p.vehicle) : undefined
          if (vehicle) vehicle.tribe = e.effectiveTribe()
          complete = true
          break
        }
        case 23:
          complete = true
          e.vehicleDestination({ x: order.a, y: order.b }, 1)
          break
        case 25:
          complete = run(3)
          if (complete)
            for (const object of e.cellObjects(e.commandPosition(order))) {
              if (object.class === 10 && object.model === 16) {
                object.timer = 0
                break
              }
            }
          break
        case 29: {
          const target = w.objects.get(order.a)
          if (!target) throw new Error(`Missing native command-29 target ${order.a}`)
          if (!p.substate) {
            p.substate = 1
            const to = { x: target.x, y: target.y }
            setPersonAnchor(p, e.outside({ ...to }))
            e.destination(to)
          }
          if (!(p.counter & 1) && positionsOverlap(p, 56, { x: p.goalX, y: p.goalY }, 56)) e.stop()
          complete = target.signal !== 0
          break // Native target word at +0x7a.
        }
      }
      if (!(w.levelFlags2 & 0x40000) && p.assignment & 8) e.formation()
    }
  }
  const anchor = () => {
    if (order && rules.personCommands[order.model].flags & 0x100) return
    const to =
      order && rules.personCommands[order.model].flags & 32
        ? e.commandPosition(order)
        : { x: p.x, y: p.y }
    setPersonAnchor(p, e.outside(to))
  }
  if (complete) {
    p.flags3 = (p.flags3 & ~1) >>> 0
    anchored = true
    anchor()
    if (p.immediateCommand) e.remove(-1)
    else if (!(rules.personCommands[p.commandStatus].flags & 0x8000)) e.remove(p.commandCursor)
    if (!e.advance()) finished = true
  }
  if (!finished) return 0
  if (!anchored) anchor()
  if (
    p.flags3 & 0x10000000 ||
    (order && order.flags & 64 && !(order.flags & 128) && order.model !== 22)
  )
    e.leaveVehicle()
  p.flags3 = (p.flags3 & ~0x10000000) >>> 0
  if (!resumeWork) return personStateAfterOrders(w, p)
  if (!(p.flags2 & 0x100000)) {
    p.previousState = p.state
    p.state = 33
    e.initialize()
  }
  return 0
}
