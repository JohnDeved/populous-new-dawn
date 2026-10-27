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

// One selected person's producer visit. Allocation precedes cleanup; a failed
// slot-zero attachment can free a real slot for a later person's retry.
export function replaceShamanGuardOrder(
  pool: OrderPool,
  person: OrderedPerson,
  shaman: number,
  shared: number,
  effects: OrderEffects,
  personId?: (stored: number) => number
) {
  if (!shared) {
    shared = allocatePersonOrder(pool)
    if (shared) writePersonOrder(pool.records[shared], 30, shaman, 0, 0, personId)
  }
  person.flags2 = (person.flags2 | 16) >>> 0
  clearPersonOrders(pool, person, effects)
  attachPersonOrder(pool, person, shared, 0, effects)
  return shared
}

// G's producer, with the shipped default retain-selection setting. The caller
// supplies the tribe roster and exact current Shaman identity, not a model filter.
export function guardShamanOrders<P extends OrderedPerson>(
  pool: OrderPool,
  people: P[],
  shaman: number | null,
  effects: OrderEffects,
  anchor: (person: P, order: PersonOrder | undefined) => void,
  personId?: (stored: number) => number
) {
  const changed: P[] = []
  if (shaman === null) return changed
  if (people.some(p => p.id !== shaman && p.selectionFlags & 128)) {
    let shared = 0
    for (const p of people) {
      if (p.id === shaman || !(p.selectionFlags & 128)) continue
      // Native exhaustion still attaches zero. Cleanup can free a real record
      // for the next person's allocation retry; do not turn this into refusal.
      shared = replaceShamanGuardOrder(pool, p, shaman, shared, effects, personId)
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
