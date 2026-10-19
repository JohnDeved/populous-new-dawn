// This is a gameplay/save contract, not a measured performance tier. Native
// fixtures retain classic limits; all new browser games use scalable.
import type { World } from './world-types.ts'
import { validateScalableMotionRoutes } from './person-routes.ts'

export type CapacityMode = 'classic' | 'scalable'
export interface CapacityPolicy {
  version: 1
  mode: CapacityMode
}

export function createCapacityPolicy(mode: CapacityMode): CapacityPolicy {
  if (mode !== 'classic' && mode !== 'scalable') throw new RangeError('Unknown capacity mode')
  return { version: 1, mode }
}

export function populationCeiling(policy: CapacityPolicy) {
  return policy.mode === 'classic' ? 200 : Number.MAX_SAFE_INTEGER
}

// Fail closed on unknown policy versions or damaged scalable pool state. Never
// reinterpret a saved scalable world as classic, resize its pool, or rewrite IDs.
export function restoreCapacityPolicy(world: World) {
  const policy = world.capacityPolicy,
    pool = world.buildingOrders
  if (!policy || policy.version !== 1 || !['classic', 'scalable'].includes(policy.mode))
    throw new RangeError('Unsupported checkpoint capacity policy')
  if (world.capacityPolicy.mode === 'classic') {
    if (pool.scalable !== undefined)
      throw new RangeError('Classic checkpoint has a scalable order pool')
    if (world.motionRoutes.references !== undefined)
      throw new RangeError('Classic checkpoint has scalable motion routes')
    return
  }
  if (
    pool.scalable !== true ||
    !Array.isArray(pool.records) ||
    pool.records.length < 800 ||
    !Number.isInteger(pool.cursor) ||
    pool.cursor < 1 ||
    pool.cursor >= pool.records.length ||
    !Number.isSafeInteger(pool.active) ||
    pool.active < 0 ||
    pool.records[0]?.references !== 0
  )
    throw new RangeError('Invalid scalable checkpoint order pool')
  let active = 0
  for (const order of pool.records) {
    if (!order || !Number.isSafeInteger(order.references) || order.references < 0)
      throw new RangeError('Invalid scalable checkpoint order count')
    if (order.references) active++
  }
  if (active !== pool.active) throw new RangeError('Invalid scalable checkpoint active-order count')
  const people = new Set([
      ...world.objectCells.objects.values(),
      ...world.pathfinding.people.values(),
      ...world.units.flatMap(unit => [
        unit.native,
        unit.flight,
        unit.entry?.person,
        unit.builder?.person,
        unit.resident?.person,
        unit.fight?.motion,
      ]),
    ]),
    references = new Map<number, number>()
  validateScalableMotionRoutes(world.motionRoutes, people)
  // Registries and controllers alias the same live person. Count that object
  // once, but every occupied queue/immediate slot is an independently released
  // reference. Never accept an undercount that can free a still-owned record.
  for (const person of people) {
    if (!person || !('commands' in person)) continue
    if (
      !('immediateCommand' in person) ||
      !('commandCursor' in person) ||
      typeof person.commandCursor !== 'number' ||
      !Number.isInteger(person.commandCursor) ||
      person.commandCursor < 0 ||
      person.commandCursor >= 8 ||
      !Array.isArray(person.commands) ||
      person.commands.length !== 8 ||
      ![...person.commands, person.immediateCommand].every(
        id =>
          Number.isInteger(id) &&
          id >= 0 &&
          id < pool.records.length &&
          (!id || pool.records[id].references > 0)
      )
    )
      throw new RangeError('Invalid scalable checkpoint person-order handle')
    for (const id of [...person.commands, person.immediateCommand])
      if (id) references.set(id, (references.get(id) ?? 0) + 1)
  }
  for (let id = 1; id < pool.records.length; id++)
    if (pool.records[id].references !== (references.get(id) ?? 0))
      throw new RangeError('Invalid scalable checkpoint person-order ownership count')
  if (
    !Number.isSafeInteger(world.nextId) ||
    world.nextId < 1024 ||
    world.nextId >= Number.MAX_SAFE_INTEGER
  )
    throw new RangeError('Invalid scalable checkpoint object-ID reservation')
  // Linked shrine owners are unpublished until triggered, but already reserve IDs.
  // Set iteration includes descendants while deduplicating aliases and cycles.
  const shrines = new Set(world.shrines)
  for (const shrine of shrines) if (shrine.linkedShrine) shrines.add(shrine.linkedShrine)
  for (const objects of [
    world.units,
    world.buildings,
    world.vehicles,
    world.trees,
    [...shrines],
    world.effects,
    world.fights,
    world.projectiles,
  ])
    for (const object of objects)
      if (!Number.isSafeInteger(object.id) || object.id < 1 || object.id >= world.nextId)
        throw new RangeError('Invalid scalable checkpoint object ID')
}
