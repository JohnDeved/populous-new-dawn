import type { OrderedPerson, OrderPool } from './person-orders.ts'

// 0x43dc20: human boarding discards later orders for the same craft model.
// This is direct queue ownership cleanup, not full active-order cancellation.
export function clearFollowingBoardingOrders(
  pool: OrderPool,
  person: Pick<OrderedPerson, 'commands' | 'commandCursor'>,
  playerType: number,
  boardedModel: number,
  vehicleModel: (id: number) => number | undefined,
  deleteObject: (id: number) => void
) {
  if (playerType === 1) return
  for (let offset = 1; offset < 8; offset++) {
    const slot = (person.commandCursor + offset) & 7,
      id = person.commands[slot],
      order = id ? pool.records[id] : undefined
    if (!order || order.flags & 1 || order.model !== 22) continue
    if (vehicleModel(order.a) !== boardedModel) continue
    person.commands[slot] = 0
    order.references = (order.references - 1) & 65535
    if (!order.references) {
      pool.active = (pool.active - 1) & 65535
      if (order.object) deleteObject(order.object)
    }
  }
}
