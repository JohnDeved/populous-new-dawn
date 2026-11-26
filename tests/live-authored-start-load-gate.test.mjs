import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

test('fresh authored M3 queues two opening orders and session Load retains their saved progress', async () => {
  const store = createGameStore()
  store.startMission(3)
  const fresh = store.getWorld()
  const openingOrders = w =>
    w.units.filter(u => u.kind === 'shaman').map(u => {
      const order = currentPersonOrder(w.buildingOrders, u.native)
      return [u.id, order?.model, order?.flags, order?.references, order?.a, order?.b]
    })
  const openingPhases = w => w.levelStart.map(site => [site.shaman, site.phase])
  const tickTo = (w, deadline) => {
    while (w.turn < deadline) tick(w, 1 / 12)
  }
  const expectedOrders = [
    [46, 18, 32, 1, 11008, 42752],
    [47, 18, 32, 1, 56064, 24832],
  ]
  assert.equal(fresh.turn, 0)
  assert.deepEqual(openingOrders(fresh), expectedOrders)
  assert.deepEqual(openingPhases(fresh), [
    [46, 0],
    [47, 0],
  ])

  tickTo(fresh, 30)
  const savedPhases = [
    [46, 2],
    [47, 2],
  ]
  assert.deepEqual(openingPhases(fresh), savedPhases)
  assert.deepEqual(openingOrders(fresh), expectedOrders)
  const savedSites = structuredClone(fresh.levelStart)
  await store.saveCheckpoint()

  tickTo(fresh, 120)
  assert.notDeepEqual(openingPhases(fresh), savedPhases)
  assert.ok(store.loadCheckpoint())
  const loaded = store.getWorld()
  assert.notEqual(loaded, fresh, 'Load replaces the active world')
  assert.equal(loaded.turn, 30)
  assert.deepEqual(openingPhases(loaded), savedPhases, 'fresh opening setup must not run on Load')
  assert.deepEqual(loaded.levelStart, savedSites)
  assert.deepEqual(openingOrders(loaded), expectedOrders)
})
