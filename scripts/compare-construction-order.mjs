import { createHash } from 'node:crypto'
import { stepConstructionOrder } from '../app/construction-order.ts'
import { assignBuilder } from '../app/building-workers.ts'
import { stepBuildingApproach } from '../app/building-work.ts'
import { emptyPersonOrder } from '../app/person-orders.ts'

export function constructionCase(c) {
  const p = structuredClone(c.person), targets = structuredClone(c.targets), events = [], rng = { randomState: c.seed }
  const pool = { records: Array.from({ length: 800 }, (_, i) => ({ ...emptyPersonOrder(), references: c.full && i ? 1 : 0 })), cursor: c.cursor, active: c.full ? 799 : c.orders.length }
  for (const [id, order] of c.orders) pool.records[id] = { ...order }
  const order = pool.records[1]
  const result = stepConstructionOrder(pool, p, order, {
    target: id => targets.find(t => t.id === id),
    register: plan => { events.push(['register', plan.id]); return assignBuilder(plan.slots, p.id) },
    outside: target => { events.push(['outside', target.id]); return target.outside },
    prepare: (o, model, a, b, flags) => { events.push(['prepare', pool.records.indexOf(o), model, a, b, flags]); Object.assign(o, { model, a, b, flags }) },
    stopWork: () => { throw Error('Unexpected work cleanup') },
    releaseSpell: () => { throw Error('Unexpected spell cleanup') },
    deleteObject: () => { throw Error('Unexpected object deletion') },
    releaseFight: () => { throw Error('Unexpected fight release') },
    task: (task, plan) => {
      events.push(['task', task, plan.id])
      if (task !== 1) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        p.animationMode = c.nextPhase; p.commandPhase = c.nextBusy
        return c.nextTask
      }
      const state = { task, busy: p.commandPhase, phase: p.animationMode, restart: !!(p.flags2 & 0x40000000) }
      stepBuildingApproach(rng, p, state, plan.site, {
        destination: point => { events.push(['destination', point]); p.goalX = point.x; p.goalY = point.y },
        outsideBuilding: point => point,
        allocateLog: () => { events.push(['allocateLog']); return false },
        animation: (_, id) => events.push(['animation', id]),
        sound: (cue, flags) => events.push(['sound', cue, flags]),
      })
      p.flags2 = ((p.flags2 & ~0x40000000) | (state.restart ? 0x40000000 : 0)) >>> 0
      p.animationMode = state.phase; p.commandPhase = state.busy
      return state.task !== task ? state.task : 0
    },
  })
  const bytes = Buffer.alloc(8000)
  pool.records.forEach((o, i) => { bytes[i * 10] = o.model; bytes[i * 10 + 1] = o.flags; ['references','object','a','b'].forEach((key, n) => bytes.writeUInt16LE(o[key], i * 10 + 2 + n * 2)) })
  return { result, person: p, targets: targets.map(t => ({ id: t.id, slots: t.slots, count: t.slots.filter(Boolean).length, signal: t.signal })), cursor: pool.cursor, active: pool.active, poolHash: createHash('sha256').update(bytes).digest('hex'), events, randomState: rng.randomState }
}
