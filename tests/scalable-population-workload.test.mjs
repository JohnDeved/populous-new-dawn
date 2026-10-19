import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { createWorldState, addUnit, breedingWork, population, populationLimit } from '../app/world-state.ts'
import { addBuilding, command, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLiveConversionVictim } from '../app/live-movement.ts'
import { allocatePersonOrder, attachPersonOrder, currentPersonOrder } from '../app/person-orders.ts'

// Bounded semantic stress only. Authored missions, economy resources and AI are
// not the producer of these supplied populations. No timing/FPS tier is inferred.
function flat(world) {
  world.manaWorld.loadFlags |= 0x200
  world.terrain.fill(3)
  world.terrainVersion++
  world.units = []
  world.buildings = []
  world.trees = []
  world.shrines = []
  world.vehicles = []
  world.levelStart = []
  world.objectCells.objects.clear()
  world.objectCells.heads.fill(0)
  world.pathfinding.people.clear()
  world.selected = []
  return world
}

test('real hut turn crosses 200 only in scalable mode and still stops at housing', () => {
  for (const mode of ['classic', 'scalable']) {
    const world = flat(createWorldState(1, mode))
    for (let i = 0; i < 199; i++)
      addUnit(world, 'blue', 'brave', { x: -20 + i % 16, z: -20 + Math.floor(i / 16) }).guard = true
    for (let i = 0; i < 29; i++)
      addBuilding(world, 'blue', 'hut', { x: -100 + i % 10 * 20, z: 40 + Math.floor(i / 10) * 20 }, true, { level: 3 })
    const hut = world.buildings[0], ids = new Set(world.units.map(u => u.id))
    for (const building of world.buildings) { building.timer = 0; building.counter = 0 }
    hut.timer = breedingWork(world, hut) - 2
    hut.counter = 3
    assert.equal(population(world, 'blue'), 200)
    assert.equal(populationLimit(world, 'blue'), mode === 'classic' ? 200 : 209)
    tick(world, 1 / 12)
    const newborn = world.units.find(u => !ids.has(u.id))
    assert.equal(Boolean(newborn), mode === 'scalable')
    assert.equal(population(world, 'blue'), mode === 'classic' ? 200 : 201)
    if (newborn) {
      assert.ok(newborn.path.length)
      assert.ok(newborn.id >= 1024)
      assert.ok(world.effects.some(effect => effect.kind === 'birth'))
    }
    for (const building of world.buildings) if (building !== hut) building.hp = 0
    const count = population(world, 'blue')
    hut.timer = breedingWork(world, hut) - 2
    hut.counter = 3
    tick(world, 1 / 12)
    assert.equal(population(world, 'blue'), count)
    assert.equal(hut.timer, 0)
  }
})

test('live Preacher replacement observes the selected population policy above 200', () => {
  for (const mode of ['classic', 'scalable']) {
    const world = flat(createWorldState(1, mode))
    const preacher = addUnit(world, 'blue', 'preacher', { x: 0, z: 0 }),
      victim = addUnit(world, 'red', 'brave', { x: 1, z: 0 })
    for (let i = 0; i < 199; i++) addUnit(world, 'blue', 'brave', { x: 40, z: 40 })
    for (const unit of [preacher, victim]) {
      unit.native = createLivePerson(world, unit)
      registerLivePerson(world, unit.native)
    }
    Object.assign(preacher.native, { state: 10, speed: 0 })
    Object.assign(victim.native, { state: 23, workTarget: preacher.id, timer: -1 })
    world.manaWorld.loadFlags |= 0x4000000 // Successful conversion roll, not the cap override.
    const id = allocatePersonOrder(world.buildingOrders)
    Object.assign(world.buildingOrders.records[id], { model: 17 })
    attachPersonOrder(world.buildingOrders, preacher.native, id, 0,
      { prepare() {}, stopWork() {}, releaseSpell() {}, deleteObject() {}, releaseFight() {} })
    assert.equal(population(world, 'blue'), 201)
    const nextId = world.nextId
    stepLiveConversionVictim(world, victim)
    assert.equal(world.units.includes(victim), mode === 'classic')
    assert.equal(world.nextId, nextId + Number(mode === 'scalable'))
    assert.equal(population(world, 'blue'), mode === 'classic' ? 201 : 202)
  }
})

test('256 commanded active followers advance and survive real store checkpoint continuation', async () => {
  const store = createGameStore(), world = flat(store.getWorld()), followers = []
  for (let i = 0; i < 256; i++)
    followers.push(addUnit(world, 'blue', 'warrior', { x: -40 + i % 16 * 2, z: -40 + Math.floor(i / 16) * 2 }))
  world.selected = followers.map(u => u.id)
  const positions = followers.map(u => ({ x: u.x, z: u.z }))
  assert.equal(command(world, { x: 20, z: -20 }), true)
  assert.ok(followers.every(u => currentPersonOrder(world.buildingOrders, u.native)?.model === 3))
  assert.equal(world.buildingOrders.active, 1, 'one real shared move, not 256 synthetic order records')
  for (let turn = 0; turn < 32; turn++) tick(world, 1 / 12)
  assert.equal(world.turn, 32)
  assert.ok(followers.every((u, i) => Math.hypot(u.x - positions[i].x, u.z - positions[i].z) > 0.1),
    'all 256 full live followers must actually move')
  assert.equal(world.units.filter(u => u.hp > 0).length, 256)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.deepEqual(restored, world)
  for (let turn = 0; turn < 32; turn++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, world, `full world continuation turn ${turn + 33}`)
  }
  assert.equal(world.turn, 64)
  assert.equal(world.capacityPolicy.mode, 'scalable')
  assert.doesNotThrow(() => migrateCheckpoint(structuredClone(world)))
})
