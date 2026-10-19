// This is a gameplay/save contract, not a measured performance tier. Native
// fixtures and legacy saves retain classic limits; new browser games use scalable.
import type { World } from './world-types.ts'

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
  if (policy === undefined && pool.scalable === undefined)
    world.capacityPolicy = createCapacityPolicy('classic')
  else if (!policy || policy.version !== 1 || !['classic', 'scalable'].includes(policy.mode))
    throw new RangeError('Unsupported checkpoint capacity policy')
  if (world.capacityPolicy.mode === 'classic') {
    if (pool.scalable !== undefined)
      throw new RangeError('Classic checkpoint has a scalable order pool')
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
  ])
  for (const person of people) {
    if (!person || !('commands' in person)) continue
    if (
      !('immediateCommand' in person) ||
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
  }
  if (
    !Number.isSafeInteger(world.nextId) ||
    world.nextId < 1024 ||
    world.nextId >= Number.MAX_SAFE_INTEGER
  )
    throw new RangeError('Invalid scalable checkpoint object-ID reservation')
  for (const objects of [
    world.units,
    world.buildings,
    world.vehicles,
    world.trees,
    world.shrines,
    world.effects,
    world.fights,
    world.projectiles,
  ])
    for (const object of objects)
      if (!Number.isSafeInteger(object.id) || object.id < 1 || object.id >= world.nextId)
        throw new RangeError('Invalid scalable checkpoint object ID')
}
