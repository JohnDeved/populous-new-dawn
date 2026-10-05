import {
  allocatePersonOrder,
  attachPersonOrder,
  clearPersonOrders,
  currentPersonOrder,
  writePersonOrder,
  type OrderedPerson,
  type OrderEffects,
  type OrderPool,
  type PersonOrder,
} from './person-orders.ts'

// G's producer, with the shipped default retain-selection setting. The caller
// supplies the tribe roster and exact current Shaman identity, not a model filter.
export function guardShamanOrders<P extends OrderedPerson>(
  pool: OrderPool,
  people: P[],
  shaman: number | null,
  effects: OrderEffects,
  anchor: (person: P, order: PersonOrder | undefined) => void
) {
  const changed: P[] = []
  if (shaman === null) return changed
  if (people.some(p => p.id !== shaman && p.selectionFlags & 128)) {
    let shared = 0
    for (const p of people) {
      if (p.id === shaman || !(p.selectionFlags & 128)) continue
      if (!shared) {
        shared = allocatePersonOrder(pool)
        if (shared) writePersonOrder(pool.records[shared], 30, shaman, 0, 0)
      }
      p.flags2 = (p.flags2 | 16) >>> 0
      clearPersonOrders(pool, p, effects)
      // Native exhaustion still attaches zero. Cleanup can free a real record
      // for the next person's allocation retry; do not turn this into refusal.
      attachPersonOrder(pool, p, shared, 0, effects)
      changed.push(p)
    }
  } else {
    for (const p of people) {
      if (p.state !== 10 || p.commandStatus !== 30) continue
      anchor(p, currentPersonOrder(pool, p))
      clearPersonOrders(pool, p, effects)
      changed.push(p)
    }
  }
  return changed
}
