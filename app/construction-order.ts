import {
  acceptsPersonOrder,
  allocatePersonOrder,
  attachPersonOrder,
  freePersonOrderSlot,
  type OrderEffects,
  type OrderPool,
  type PersonOrder,
} from './person-orders.ts'
import { setPersonAnchor, type UpdatingPerson } from './person-order-update.ts'

export interface ConstructionTarget {
  id: number
  class: number
  tribe: number
  flags2: number
  plan: number
  signal: number
}

// 0x495520: command ownership surrounds the individual construction tasks.
// A building resolves to its separate plan; failed registration appends a move
// at the first free slot without replacing existing destinations or using the
// immediate slot. Task bodies retain their own movement/animation consumers.
export function stepConstructionOrder(
  pool: OrderPool,
  person: UpdatingPerson & { commandPhase: number },
  order: PersonOrder,
  effects: OrderEffects & {
    target: (id: number) => ConstructionTarget | undefined
    register: (plan: ConstructionTarget) => boolean
    outside: (target: ConstructionTarget) => { x: number; y: number }
    task: (task: number, plan: ConstructionTarget) => number
  }
) {
  if (!person.substate) {
    if (!acceptsPersonOrder(person, order.model)) return true
    person.commandPhase = 0
    person.workTarget = 0
    const target = effects.target(order.a)
    if (!target) throw new Error(`Missing construction target ${order.a}`)
    let plan: ConstructionTarget | undefined = target
    if (target.class === 2) {
      plan = target.plan ? effects.target(target.plan) : undefined
      if (target.plan) order.a = target.plan
    }
    if (plan && plan.tribe === person.tribe && effects.register(plan)) {
      person.workTarget = plan.id
      setPersonAnchor(person, effects.outside(plan))
    }
    if (!person.workTarget) {
      const id = allocatePersonOrder(pool)
      if (id) {
        const slot = freePersonOrderSlot(person)
        if (slot >= 0) {
          const point = effects.outside(target)
          effects.prepare(pool.records[id], 3, point.x, point.y, 0)
          attachPersonOrder(pool, person, id, slot, effects)
        }
      }
    }
    person.substate = 1
    person.flags2 = (person.flags2 | 0x40000000) >>> 0
  }
  const plan = person.workTarget ? effects.target(person.workTarget) : undefined
  if (!plan || !plan.class || plan.flags2 & 1) return true
  if (person.flags2 & 0x40000000) person.flags4 = (person.flags4 & 0xfffefff8) >>> 0
  const task = person.substate
  if (task < 1 || task > 9) throw new RangeError(`Invalid construction task ${task}`)
  const next = task === 5 || task === 6 ? 2 : effects.task(task, plan)
  if (next) {
    person.assignment &= ~8
    plan.signal |= 1
    person.substate = next
    person.flags2 = (person.flags2 | 0x40000000) >>> 0
  }
  return false
}
