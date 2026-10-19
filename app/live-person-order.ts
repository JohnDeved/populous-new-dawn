import { writePersonOrder, type PersonOrder } from './person-orders.ts'

// Browser object handles are safe-integer identities, not native ushort pool slots.
// Only object-reference payloads opt out of the native writer's word coercion.
export function writeLivePersonOrder(
  order: PersonOrder,
  model: number,
  first: number,
  point: number,
  flags: number
) {
  writePersonOrder(
    order,
    model,
    first,
    point,
    flags,
    [22, 27, 28, 30].includes(model) ? id => id : undefined
  )
}
