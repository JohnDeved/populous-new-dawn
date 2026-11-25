import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, nativePosition, tick } from '../app/model.ts'
import { dragCommand } from '../app/drag-selection.ts'
import { selectArea, selectUnit } from '../app/selection-runtime.ts'

function authoredM2() {
  const world = createWorld(2)
  while (world.turn < 430) tick(world, 1 / 12)
  assert.equal(world.turn, 430)
  return world
}

const cuesDuring = (world, act) => {
  const serial = world.soundSerial
  act()
  const emitted = world.sounds.filter(event => event.serial > serial)
  assert.ok(emitted.every(event => event.turn === world.turn))
  return emitted.map(event => event.cue)
}

function drag(world, from, to, extend = false) {
  const start = nativePosition(world, from)
  const end = nativePosition(world, to)
  selectArea(world, start, dragCommand(start, end, 0), extend)
}

test('extended selection counts a living previously selected ordinary follower outside the drag', () => {
  const world = authoredM2()
  const from = { x: -108, z: -98 }
  const to = { x: -104, z: -100 }
  const roster = [278, 176, 275].map(id => world.units.find(unit => unit.id === id))
  assert.deepEqual(roster.map(unit => [unit.kind, unit.x, unit.z]), [
    ['brave', -107, -99], ['brave', -105, -101], ['brave', -105, -99],
  ])
  assert.ok(roster.every(unit => unit.team === 'blue' && unit.hp > 0))

  assert.deepEqual(cuesDuring(world, () => drag(world, from, to)), [0x43])
  assert.deepEqual(world.selected, [278, 275])
  assert.deepEqual(cuesDuring(world, () => selectUnit(world, 176, false)), [0x58])
  assert.deepEqual(world.selected, [176])
  const extended = cuesDuring(world, () => drag(world, from, to, true))
  assert.deepEqual(world.selected, [278, 176, 275])
  assert.deepEqual(extended, [0x44])
})

test('authored mixed drag emits the Shaman cue before the capped ordinary group voice', () => {
  const world = authoredM2()
  const shaman = world.units.find(unit => unit.id === 54)
  assert.deepEqual([shaman.team, shaman.kind], ['blue', 'shaman'])
  assert.ok(shaman.hp > 0)

  assert.deepEqual(cuesDuring(world, () => selectUnit(world, 278, false)), [0x58])
  assert.deepEqual(world.selected, [278])
  const single = cuesDuring(world, () => selectUnit(world, shaman.id, false))
  assert.deepEqual(world.selected, [shaman.id])
  assert.deepEqual(single, [0x18])

  const mixed = cuesDuring(world, () =>
    drag(world, { x: -111, z: -98 }, { x: -104, z: -102 })
  )
  assert.deepEqual(world.selected, [54, 278, 319, 281, 176, 275])
  assert.deepEqual(mixed, [0x18, 0x45])
})
