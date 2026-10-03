import { clearPersonOrders } from '../app/person-orders.ts'
import { orderEffects } from '../app/live-movement.ts'
import assert from 'node:assert/strict'
import { createWorld, tick } from '../app/model.ts'

// Unrelated gameplay fixtures begin after the real opening, never by deleting
// its controllers, stamping completed flags, or restoring the removed instant
// conversion shortcut. Startup-specific tests continue to call createWorld.
export function finishLevelStart(world) {
  const pending = () => world.levelStart.some(site =>
    site.phase !== 4 || site.wave || site.carriers.length ||
    site.stoneTurns.some(turn => turn !== null && world.turn - turn < 20))
  for (let turns = 0; pending() && turns < 256; turns++) tick(world, 1 / 12)
  assert.equal(pending(), false, 'original opening must finish through ordinary turns')
  return world
}
export const createStartedWorld = (...args) => finishLevelStart(createWorld(...args))

// Isolated-mechanics fixtures that remove actors must also release the actual
// opening-era AI orders those actors now acquired while startup was running.
export function retainFixtureUnits(world, keep) {
  for (const unit of world.units) {
    if (keep(unit)) continue
    const person = unit.native ?? unit.entry?.person ?? unit.builder?.person
    if (person) clearPersonOrders(world.buildingOrders, person, orderEffects(world))
  }
  world.units = world.units.filter(keep)
}
