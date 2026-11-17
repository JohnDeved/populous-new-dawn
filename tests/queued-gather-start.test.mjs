import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld } from './level-start-fixture.mjs'
import { command, tick, cancelInteraction } from '../app/model.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { createLivePerson } from '../app/live-people.ts'
import { startLiveOrders } from '../app/live-movement.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

// Actual authored model commands and fixed turns, not rendered input. No cargo,
// resource, route or terrain injection in this reachable continuation witness.
test('queued gathering drops earned cargo before the new tree order can complete', () => {
  const w = createStartedWorld(10)
  const u = w.units.find(u => u.id === 120)
  const first = w.trees.find(t => t.id === 108)
  const second = w.trees.find(t => t.id === 109)
  assert.equal(u.kind, 'brave')
  setSelection(w, [u.id])
  assert.ok(command(w, first))
  cancelInteraction(w)
  for (let turns = 0; turns < 1200 && !u.cargo && u.hp > 0; turns++) tick(w, 1 / 12)
  assert.equal(u.cargo, 1, 'the authored brave must actually harvest timber')
  assert.equal(u.native.cargo, 100)
  const previousTrees = new Set(w.trees.map(t => t.id))
  const serial = w.soundSerial
  const turn = w.turn
  setSelection(w, [u.id])
  assert.ok(command(w, second, { ctrlKey: true }))
  cancelInteraction(w)
  assert.equal(w.turn, turn, 'initialization is synchronous, not an idle-turn drop')
  assert.equal(currentPersonOrder(w.buildingOrders, u.native)?.model, 7)
  assert.equal(u.native.cargo, 0)
  assert.equal(u.cargo, 0, 'browser and native cargo projections must agree')
  const logs = w.trees.filter(t => !previousTrees.has(t.id) && t.model === 11)
  assert.equal(logs.length, 1)
  assert.equal(logs[0].logs, 1)
  assert.deepEqual(w.sounds.filter(s => s.serial > serial && s.cue === 11).map(s => s.cue), [11])
  tick(w, 1 / 12)
  assert.equal(currentPersonOrder(w.buildingOrders, u.native)?.model, 7, 'new order is not discarded because of old cargo')
  assert.equal(w.trees.filter(t => !previousTrees.has(t.id) && t.model === 11).length, 1)
  // In-memory current-format checkpoint continuation, not browser Save/Load.
  const restored = migrateCheckpoint(structuredClone(w))
  const snapshot = world => {
    const actor = world.units.find(person => person.id === u.id)
    return { turn: world.turn, cargo: actor.cargo, native: actor.native,
      path: actor.path, trees: world.trees, queue: world.buildingOrders,
      routes: world.motionRoutes, randomState: world.randomState }
  }
  for (let turns = 0; turns < 16; turns++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(snapshot(restored), snapshot(w))
  }
})

// Supplied startup states isolate callback boundaries; these are not earned cargo.
for (const [model, flags, protectedCargo, cargo, drops] of [
  [7, 132, false, 0, 0],
  [7, 132, false, 50, 1],
  [7, 132, false, 250, 3],
  [7, 132, true, 250, 0],
  [7, 133, false, 250, 0],
  [6, 0, false, 250, 0],
  [3, 0, false, 250, 0],
]) {
  test(`startup model ${model}, flags ${flags}, protected ${protectedCargo}, cargo ${cargo}`, () => {
    const w = createStartedWorld(10)
    const u = w.units.find(u => u.id === 120)
    const p = u.native = createLivePerson(w, u)
    p.cargo = cargo
    u.cargo = cargo / 100
    p.assignment = 0x119 | (protectedCargo ? 0x8000 : 0)
    const order = { model, flags, references: 1, object: 0, a: p.x, b: p.y }
    w.buildingOrders.records[1] = order
    w.buildingOrders.active = 1
    p.commands[0] = 1
    p.commandCursor = 0
    const beforeQueue = structuredClone(w.buildingOrders)
    const nextId = w.nextId
    const serial = w.soundSerial
    const position = { x: u.x, z: u.z }
    startLiveOrders(w, p, w)
    assert.equal(p.cargo, drops ? 0 : cargo)
    assert.equal(u.cargo, p.cargo / 100)
    assert.deepEqual(w.buildingOrders, beforeQueue)
    assert.equal(p.commands[0], 1)
    assert.equal(w.nextId, nextId + drops)
    const logs = w.trees.filter(t => t.id >= nextId)
    assert.equal(logs.length, drops)
    assert.ok(logs.every(t => t.model === 11 && t.logs === 1 && t.x === position.x && t.z === position.z))
    assert.deepEqual(w.sounds.filter(s => s.serial > serial && s.cue === 11).map(s => s.cue), Array(drops).fill(11))
    if (drops) {
      startLiveOrders(w, p, w)
      assert.equal(w.nextId, nextId + drops, 'repeated initialization must not duplicate loose logs')
    }
  })
}
