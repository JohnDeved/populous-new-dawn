import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, command, setSelection } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { messageStringId } from '../app/messages.ts'

test('Mission 3 warns once when a naturally trained Chumara Preacher starts converting a Blue Brave', () => {
  const world = createWorld(3)
  const until = (predicate, limit = 10000) => {
    for (let i = 0; i < limit && !predicate(); i++) tick(world, 1 / 12)
    assert.ok(predicate(), `Condition not reached at turn ${world.turn}`)
  }
  until(() => world.turn === 6000)
  const preacher = world.units.find(unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.hp > 0)
  const brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0)
  assert.ok(preacher && brave)
  assert.equal(world.ai.variables[20], 0)
  assert.equal(world.ai.variables[21], 0)
  const id = messageStringId(107)
  assert.ok(!world.messages.slots.some(message => message?.stringId === id))
  setSelection(world, [brave.id])
  assert.ok(command(world, { x: preacher.x, z: preacher.z }))
  until(() => brave.native?.state === 23, 3000)
  assert.equal(brave.team, 'blue')
  const conversionTurn = world.turn
  until(() => world.ai.variables[20] === 1, 32)
  assert.ok(world.turn - conversionTurn <= 32)
  assert.equal((world.turn - 1 + 2) & 31, 0)
  assert.ok(world.ai.variables[21] > 0)
  const notifications = world.messages.slots.filter(message => message?.stringId === id)
  assert.equal(notifications.length, 1)
  assert.ok(notifications[0].flags & 0x200)
  const restored = migrateCheckpoint(structuredClone(world))
  for (let i = 0; i < 128; i++) { tick(world, 1 / 12); tick(restored, 1 / 12) }
  assert.deepEqual(restored.ai.variables, world.ai.variables)
  assert.deepEqual(restored.messages, world.messages)
  assert.equal(typeof restored.randomState, 'number')
  assert.equal(typeof world.randomState, 'number')
  assert.equal(restored.randomState, world.randomState)
  assert.equal(world.messages.slots.filter(message => message?.stringId === id).length, 1)
})
