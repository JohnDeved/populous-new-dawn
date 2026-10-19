import { cellDelta } from './native-math.ts'
import type { OrderedPerson, OrderPool, PersonOrder } from './person-orders.ts'

// 0x435197–0x4351cc -> 0x450590: only the current craft cell is even-masked.
// Unlike 0x49c720, these wrapped byte deltas are not halved before squaring.
// Legacy unmarked records retain unknown origins rather than inventing a click.
export function boardingTargetLeftOrigin(
  order: Pick<PersonOrder, 'model' | 'b' | 'boardingOriginKnown'>,
  vehicle: { x: number; y: number }
) {
  if (order.model !== 22 || order.boardingOriginKnown !== true) return false
  const x = cellDelta(order.b, (vehicle.x >>> 8) & 254),
    y = cellDelta(order.b >>> 8, (vehicle.y >>> 8) & 254)
  return x * x + y * y >= 100
}

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
