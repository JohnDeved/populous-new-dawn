import assert from 'node:assert/strict'
import test from 'node:test'
import { ObjectPanels } from '../app/object-panels.ts'
import { command, createWorld, select, tick } from '../app/model.ts'
import { personOrderIcons } from '../app/person-panel.ts'

test('an authored move-order icon requests the camera destination and adds one destination marker', () => {
  const world = createWorld(6)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  while (world.turn < 430) tick(world, 1 / 12)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [95])
  assert.ok(command(world, { x: 73, z: -58 }))
  const [icon] = personOrderIcons(world.buildingOrders, shaman.native, world.objectCells.objects)
  assert.equal(icon.model, 3)
  const order = structuredClone(world.buildingOrders.records[icon.id])
  const effects = world.effects.length
  const events = []
  const panels = new ObjectPanels({
    world,
    overviewActive: false,
    focus: (point, options) => events.push(['focus', point, options]),
    onSound: sound => events.push(['sound', sound]),
  })
  panels.open = id => events.push(['open', id])

  panels.focusOrder(shaman.id, icon.id)
  assert.equal(world.effects.length, effects + 1)
  const marker = world.effects.at(-1)
  assert.equal(marker.kind, 'orderMarker')
  assert.equal(marker.x, 73)
  assert.equal(marker.z, -58)
  assert.deepEqual(world.buildingOrders.records[icon.id], order)
  const focusEvents = events.filter(([type]) => type !== 'sound')
  assert.deepEqual(focusEvents, [
    ['focus', { x: 73, z: -58 }, { animate: true }],
  ])
})
