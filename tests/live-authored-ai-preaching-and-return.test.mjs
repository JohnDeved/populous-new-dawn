import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { allocatePersonOrder, currentPersonOrder } from '../app/person-orders.ts'
import { startLiveOrder } from '../app/live-movement.ts'
import { computerPreachingAt, requestComputerPreacher, returnComputerGuards } from '../app/computer-runtime.ts'

function advance(w, target) {
  assert.ok(Number.isInteger(target) && target >= w.turn && target - w.turn <= 2500)
  const initial = w.turn
  for (let n = initial; n < target; n++) {
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, n + 1, 'ordinary world tick did not advance exactly once')
  }
}

test('the authored Mission 3 AI studies and dispatches the natural type-11 preacher', () => {
  const w = createWorld(3, 'scalable')
  advance(w, 2428)
  const task = w.ai.tasks[0]
  const u = w.units.find(u => u.id === 4059)
  assert.deepEqual([task.flags, task.type, task.entity, task.target], [1, 11, 4059, 27146])
  assert.deepEqual([task.phase, u.team, u.kind, u.native.state], [5, 'yellow', 'preacher', 14])
  assert.equal(w.objectCells.objects.get(u.id), u.native)
  const before = currentPersonOrder(w.buildingOrders, u.native)
  const fields = o => [o.model, o.a, o.b]
  advance(w, 2433)
  assert.deepEqual([task.phase, u.native.state], [6, 14], 'selected preacher must visit phase 6')
  assert.equal(currentPersonOrder(w.buildingOrders, u.native), before)
  advance(w, 2437)
  assert.deepEqual([task.phase, u.native.state], [7, 10])
  const published = currentPersonOrder(w.buildingOrders, u.native)
  assert.notEqual(published, before)
  assert.deepEqual(fields(published), [17, 2688, 27264])
  advance(w, 2441)
  assert.equal(task.flags & 1, 0)
  assert.equal(currentPersonOrder(w.buildingOrders, u.native), published)
})

test('the active native preacher command recognizes its own occupied cell before a repeat request', () => {
  const w = createWorld(3, 'scalable')
  advance(w, 2441)
  const u = w.units.find(u => u.id === 4059)
  const p = u.native
  const o = currentPersonOrder(w.buildingOrders, p)
  assert.deepEqual([u.team, p.state, p.model, o.model, o.flags], ['yellow', 10, 4, 17, 0])
  assert.equal(w.objectCells.objects.get(u.id), p)
  const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  assert.equal(cell, 24292)
  assert.equal(computerPreachingAt(w, 2, cell), true)
  assert.equal(computerPreachingAt(w, 1, cell), false)
  assert.equal(computerPreachingAt(w, 2, cell + 2), false)
  const tasks = structuredClone(w.ai.tasks)
  assert.equal(requestComputerPreacher(w, 2, cell), false)
  assert.deepEqual(w.ai.tasks, tasks)
  // Isolate eligibility, holding actor, cell and command model fixed.
  o.flags |= 1
  assert.equal(computerPreachingAt(w, 2, cell), false)
})

test('the live AI return adapter replaces only unflagged eligible guard orders', () => {
  const w = createWorld(10, 'scalable')
  advance(w, 100)
  const units = [111, 112, 113].map(id => w.units.find(u => u.id === id))
  w.ai.constructionBase = 0xfa9b
  // Authored warriors with supplied commands and a supplied base marker; this is
  // not a claim that Mission 10 issues the native AI guard script naturally.
  const originals = units.map((u, n) => {
    assert.deepEqual([u.team, u.kind], ['blue', 'warrior'])
    const id = allocatePersonOrder(w.buildingOrders)
    assert.ok(id > 0)
    const order = w.buildingOrders.records[id]
    Object.assign(order, { model: 30, a: 0, b: 0x9999, flags: n === 1 ? 1 : 0 })
    startLiveOrder(w, u, id)
    if (n === 2) u.native.state = 14
    assert.equal(w.objectCells.objects.get(u.id), u.native)
    assert.equal(currentPersonOrder(w.buildingOrders, u.native), order)
    assert.equal(order.references, 1)
    return order
  })
  returnComputerGuards(w, 0)
  const [mover, flagged, selected] = units.map(u => currentPersonOrder(w.buildingOrders, u.native))
  assert.deepEqual([mover.model, mover.a, mover.b, mover.references], [3, 39424, 64000, 1])
  assert.equal(originals[0].references, 0)
  assert.equal(flagged, originals[1])
  assert.equal(selected, originals[2])
  assert.deepEqual(originals.slice(1).map(o => o.references), [1, 1])
  assert.deepEqual(units.map(u => u.native.state), [10, 10, 14])
})
