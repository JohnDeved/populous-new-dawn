import { movePosition } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }

// Original ten-byte command record: model/flags, reference count, object, payload.
export type PersonOrder = {
  model: number
  flags: number
  references: number
  object: number
  a: number
  b: number
}
export type OrderPool = { records: PersonOrder[]; cursor: number; active: number }
export type OrderGroup = { records: PersonOrder[]; count: number; cursor: number }
export type OrderedPerson = {
  id: number
  model: number
  state: number
  substate: number
  x: number
  y: number
  flags2: number
  flags3: number
  flags4: number
  assignment: number
  selectionFlags: number
  commands: number[]
  commandCursor: number
  immediateCommand: number
  orderLocation: number
  commandStatus: number
  workTarget: number
}
// These are required native world consumers, not optional no-op callbacks.
// stopWork resolves the live work target; releaseSpell owns tribe counters/RNG;
// prepare owns native terrain/target correction (0x438730).
export type OrderEffects = {
  prepare: (order: PersonOrder, model: number, a: number, b: number, flags?: number) => void
  stopWork: (person: OrderedPerson) => void
  releaseSpell: (person: OrderedPerson) => void
  deleteObject: (id: number) => void
  releaseFight: (person: OrderedPerson) => void
}

export const emptyPersonOrder = (): PersonOrder => ({
  model: 0,
  flags: 0,
  references: 0,
  object: 0,
  a: 0,
  b: 0,
})
// Raw command lookup: callers apply their own state/cancellation rules.
export function currentPersonOrder(
  pool: OrderPool,
  person: Pick<OrderedPerson, 'immediateCommand' | 'commands' | 'commandCursor'>
) {
  const id = person.immediateCommand || person.commands[person.commandCursor]
  return id ? pool.records[id] : undefined
}
function descriptor(model: number) {
  const d = rules.personCommands[model]
  if (!d) throw new RangeError(`Unsupported native person command ${model}`)
  return d
}

// 0x435780. Payload bytes unused by a command retain their previous contents.
export function writePersonOrder(
  order: PersonOrder,
  model: number,
  first: number,
  point: number,
  flags: number
) {
  model &= 255
  first &= 65535
  point &= 65535
  const type = descriptor(model).flags
  order.model = model
  order.flags = flags & 254
  if (type & 1) {
    order.a = ((point << 8) + 128) & 65535
    order.b = (point & 0xff00) + 128
  } else if (type & 0x242) order.a = first
  else if (type & 4) {
    order.a = first
    order.b = point
  } else if (type & 0x800) {
    order.a = point
    order.b = ((first << 8) | (first >>> 8)) & 65535
  } else if (type & 0x1000400) order.a = (order.a & 0xff00) | (first & 255)
  else {
    order.a = ((point & 254) + 1) << 8
    order.b = (((point >>> 8) & 254) + 1) << 8
  }
  if (model === 7) {
    order.flags &= ~12
    order.flags |= first === 0 ? 12 : first === 1 ? 4 : first === 2 ? 8 : 0
  }
}

// 0x435730 valid queue domain. Native overflow writes outside its eight slots;
// reject that unsupported memory-corruption path rather than overwrite world fields.
export function queuePersonOrder(group: OrderGroup, model: number, first: number, point: number) {
  if (group.cursor < 0 || group.cursor >= 8 || group.count < 0 || group.count >= 8) {
    throw new RangeError('Native group command queue is full or invalid')
  }
  writePersonOrder(group.records[group.cursor], model, first, point, 0)
  group.cursor++
  group.count++
}

// 0x436c20 and allocator in 0x4359b0. Clears identity but does not reserve a slot:
// until attached, its zero-reference record can be allocated again after wrap.
export function allocatePersonOrder(pool: OrderPool) {
  let index = pool.cursor
  for (let scanned = 0; scanned < 800; scanned++, index++) {
    if (index >= 800) index = 1
    const order = pool.records[index]
    if (order.references) continue
    order.model = 0
    order.flags = 0
    order.object = 0
    pool.cursor = index < 799 ? index + 1 : 1
    return index
  }
  return 0
}

// 0x43b120. Only inspect slots after the cursor; this predicate does not wrap.
export function hasFollowingPersonOrder(pool: OrderPool, person: OrderedPerson) {
  for (let slot = person.commandCursor + 1; slot < 8; slot++) {
    const id = person.commands[slot]
    if (id && !(pool.records[id].flags & 1)) return true
  }
  return false
}

// 0x43b010: coalesce the first run of route commands, allowing empty slots
// between them. The record is shared, so conversion is visible to other people.
export function normalizePersonRoute(pool: OrderPool, person: OrderedPerson) {
  if (person.immediateCommand) return
  const route = (id: number) => id !== 0 && [11, 25].includes(pool.records[id].model)
  const first = person.commands.findIndex(route)
  if (first < 0) return
  let last = first
  for (let slot = first; slot < 8; slot++) {
    const id = person.commands[slot]
    if (!id) continue
    if (!route(id)) break
    last = slot
  }
  if (first === last) return
  for (let slot = first; slot <= last; slot++) {
    const order = pool.records[person.commands[slot]]
    if (person.commands[slot] && order.model === 11) {
      order.model = 25
      const cell = order.a
      order.a = (cell & 254) << 8
      order.b = cell & 0xfe00
    }
  }
  person.flags2 = (person.flags2 | 16) >>> 0
}

// 0x4364d0. Preserve effect ordering: work, model-specific cleanup, reference
// release, attached-object deletion, person slot, then fight assignment release.
export function removePersonOrder(
  pool: OrderPool,
  person: OrderedPerson,
  slot: number,
  effects: OrderEffects
) {
  const id = slot < 0 ? person.immediateCommand : person.commands[slot]
  if (id) {
    if (person.state === 10 || person.state === 33) {
      const current = person.immediateCommand || person.commands[person.commandCursor]
      const command = current ? pool.records[current] : undefined
      if (
        command &&
        !(command.flags & 1) &&
        [19, 21].includes(command.model) &&
        person.substate === 1
      )
        effects.stopWork(person)
    }
    const order = pool.records[id]
    if (order.model === 7) person.assignment |= 0x8000
    else if (order.model === 30) effects.releaseSpell(person)
    order.references = (order.references - 1) & 65535
    if (!order.references) {
      pool.active = (pool.active - 1) & 65535
      if (order.object) effects.deleteObject(order.object)
    }
    if (slot < 0) person.immediateCommand = 0
    else person.commands[slot] = 0
  }
  person.commandStatus = 0
  if (person.assignment & 32) {
    person.assignment &= ~32
    effects.releaseFight(person)
  }
}

// 0x436d00, including immediate replacement after the new reference is acquired.
export function attachPersonOrder(
  pool: OrderPool,
  person: OrderedPerson,
  id: number,
  slot: number,
  effects: OrderEffects
) {
  const order = pool.records[id]
  if (!order.references) pool.active = (pool.active + 1) & 65535
  order.references = (order.references + 1) & 65535
  if (slot >= 0) {
    person.flags3 = (person.flags3 & ~0x2000000) >>> 0
    person.orderLocation = 0
    person.commands[slot] = id
    normalizePersonRoute(pool, person)
  } else {
    if (person.immediateCommand) removePersonOrder(pool, person, -1, effects)
    person.immediateCommand = id
    if (!(person.flags3 & 0x2000000))
      person.orderLocation = (((person.x >>> 8) & 254) | (person.y & 0xfe00)) + 1
  }
}

// 0x436ca0, also used when a building hides an occupant and clears its orders.
export function clearPersonOrders(pool: OrderPool, person: OrderedPerson, effects: OrderEffects) {
  person.commandCursor = 0
  for (let slot = 0; slot < 8; slot++)
    if (person.commands[slot]) removePersonOrder(pool, person, slot, effects)
  if (person.immediateCommand) removePersonOrder(pool, person, -1, effects)
  person.flags2 = (person.flags2 & ~0x8000000) >>> 0
  person.flags4 = (person.flags4 & ~512) >>> 0
}

// Complete 0x4366b0: circular queue advancement, cancellation cleanup and
// same-model repeating commands. Removing an order can change commandStatus.
export function advancePersonOrder(
  pool: OrderPool,
  p: OrderedPerson,
  effects: {
    remove: (slot: number) => void
    resumeVehicle: () => boolean
    resumeBuilding: () => boolean
    prepareNext: () => void
    configure: () => void
    recover: () => void
  }
) {
  const repeat = !!(descriptor(p.commandStatus).flags & 0x8000)
  let found = -1
  for (let n = 0, slot = (p.commandCursor + 1) % 8; n < 8; n++, slot = (slot + 1) % 8) {
    const id = p.commands[slot]
    if (!id) continue
    const order = pool.records[id]
    if (order.flags & 1) effects.remove(slot)
    else if (!repeat || order.model === p.commandStatus) {
      found = slot
      break
    }
  }
  if (found < 0 && !repeat && (effects.resumeVehicle() || effects.resumeBuilding())) found = 0
  if (found >= 0) {
    p.commandCursor = found
    if (!repeat) effects.prepareNext()
    effects.configure()
    effects.recover()
    return true
  }
  if (repeat) {
    p.commandCursor = 0
    for (let slot = 0; slot < 8; slot++) if (p.commands[slot]) effects.remove(slot)
    if (p.immediateCommand) effects.remove(-1)
    p.flags2 = (p.flags2 & ~0x8000000) >>> 0
    p.flags4 = (p.flags4 & ~512) >>> 0
  }
  return false
}

// 0x4359b0. Pool exhaustion leaves old person orders intact, but always clears
// the group queue. Cancelled/ineligible commands still consume queue positions.
export function commitPersonOrders(
  pool: OrderPool,
  group: OrderGroup,
  people: OrderedPerson[],
  models: [number, number, number],
  effects: OrderEffects
) {
  const ids: number[] = []
  let success = true
  for (let i = 0; i < group.count; i++) {
    const id = allocatePersonOrder(pool)
    ids.push(id)
    if (!id) {
      success = false
      break
    }
  }
  if (success)
    for (const person of people) {
      if (!(person.selectionFlags & 128) || (models[0] !== -1 && !models.includes(person.model)))
        continue
      clearPersonOrders(pool, person, effects)
      let position = person.commandCursor
      for (let slot = 0; slot < group.count; slot++, position = (position + 1) % 8) {
        const command = group.records[slot]
        if (command.flags & 1) continue
        const d = descriptor(command.model)
        const eligible =
          person.flags4 & 0x800 ? d.flags & 0x4000000 : d.people & (1 << (person.model & 31))
        if (!eligible) continue
        effects.prepare(pool.records[ids[slot]], command.model, command.a, command.b)
        attachPersonOrder(pool, person, ids[slot], position, effects)
      }
    }
  group.count = 0
  group.cursor = 0
  for (const order of group.records) Object.assign(order, emptyPersonOrder())
  return success
}

// 0x438730 for movement command 3, including unchanged-record short circuit.
// Coast correction happens first; building lookup still uses the original cell.
export function prepareMovementOrder(
  order: PersonOrder,
  point: { x: number; y: number },
  flags: number,
  land: { categories: Uint8Array; flags: Uint16Array | Uint32Array; buildingIds: Uint16Array },
  outside: (id: number) => { x: number; y: number }
) {
  const x = point.x & 65535,
    y = point.y & 65535
  if (order.model === 3 && order.a === x && order.b === y) return
  order.model = 3
  order.flags |= flags & 255
  order.a = x
  order.b = y
  const cell = (y >> 9) * 128 + (x >> 9)
  const coastal = coastalDestination(land.categories, x, y)
  if (coastal) {
    order.a = coastal.x
    order.b = coastal.y
  }
  if (land.flags[cell] & 512) {
    const to = outside(land.buildingIds[cell] & 1023)
    order.a = to.x & 65535
    order.b = to.y & 65535
  }
}

function coastalDestination(categories: Uint8Array, x: number, y: number) {
  const category = categories[(y >> 9) * 128 + (x >> 9)] & 15
  if (!(rules.terrainCategoryFlags[category] & 60)) return null
  const to = { x: (x & 0xfe00) + 256, y: (y & 0xfe00) + 256 }
  movePosition(to, (rules.terrainCategoryDirections[category] & 7) << 8, 512)
  return to
}

// 0x438730 for automatic area command 21. The radius word survives coastal
// correction; only the packed center moves. An identical command keeps its flags.
export function prepareCombatOrder(
  order: PersonOrder,
  area: { a: number; b: number },
  flags: number,
  categories: Uint8Array
) {
  const a = area.a & 65535,
    b = area.b & 65535
  if (order.model === 21 && order.a === a && order.b === b) return
  order.model = 21
  order.flags |= flags & 255
  order.a = a
  order.b = b
  const coastal = coastalDestination(categories, (a & 254) << 8, a & 0xfe00)
  if (coastal) order.a = ((coastal.x >>> 8) & 254) | (coastal.y & 0xfe00)
}
