import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, browserPosition, createWorld, nativePosition, tick } from '../app/model.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'
import { stepLiveTornado } from '../app/tornado-runtime.ts'
import { buildingStage, syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Controlled real-caller cases. Ordinary earned-stock/UI evidence is separate.
function setup() {
  const world = createWorld()
  world.units = []
  world.buildings = []
  world.trees = []
  world.effects = []
  const building = addBuilding(world, 'red', 'hut', { x: 0, z: 8 })
  syncLandscapeObjects(world)
  return { world, building }
}

function hit(world, building, seed = 0) {
  const position = nativePosition(world, building)
  // Empty particles and a stationary controller isolate the actual class-2
  // admission draw. No production damage callback is replaced.
  const effect = {
    id: 99999,
    kind: 'tornado',
    x: building.x,
    z: building.z,
    age: 0,
    duration: Infinity,
    tornado: {
      ...position,
      tribe: 0,
      destinationX: position.x,
      destinationY: position.y,
      spawnX: position.x,
      spawnY: position.y,
      remaining: 200,
      phase: 0,
      heading: 0,
      headingTimer: 2,
      step: 0,
      steering: 100,
      particles: [],
      soundPlaying: true,
    },
  }
  world.randomState = seed
  assert.equal(stepLiveTornado(world, effect), true)
}

test('live Tornado releases one loose log at the damaged building before debris allocation', () => {
  const { world, building } = setup()
  const untouched = { id: world.nextId++, x: 40, z: 40, model: 11, logs: 2 }
  world.trees.push(untouched)
  const beforeId = world.nextId
  const position = browserPosition(nativePosition(world, building))
  const beforeHp = building.hp

  hit(world, building)

  assert.deepEqual(world.trees, [
    untouched,
    { id: beforeId, ...position, logs: 1, model: 11 },
  ])
  assert.equal(untouched.logs, 2)
  assert.ok(world.nextId >= beforeId + 1, 'Debris may allocate later effect IDs')
  assert.equal(building.damageState.plan.remaining, 200)
  assert.equal(buildingStage(building), 2)
  assert.equal(building.damageState.state, 1)
  assert.equal(building.progress, 2 / 3)
  assert.equal(building.hp, beforeHp * (2 / 3))
  assert.equal(building.damageState.attacker, 0)
  assert.equal(building.damageState.plan.attacker, 0)
  assert.equal(building.damageState.plan.repairDelay, rules.buildingRepairDelay)
  assert.equal(world.sounds.filter(sound => sound.cue === 18).length, 1)
})

test('live Tornado reuses plan work and retires exhausted buildings through normal turn cleanup', () => {
  const { world, building } = setup()
  const plan = ensureBuildingDamage(building).plan
  const occupied = Array.from(world.land.buildingIds.keys()).filter(
    index => (world.land.buildingIds[index] & 1023) === building.id
  )
  assert.ok(occupied.length > 0, 'Live target must own terrain before retirement')
  for (const remaining of [200, 100, 0]) {
    const beforeId = world.nextId
    const beforeTrees = world.trees.length
    hit(world, building)
    assert.equal(building.damageState.plan, plan)
    assert.equal(plan.remaining, remaining)
    assert.equal(world.trees.length, beforeTrees + 1)
    assert.deepEqual(world.trees.at(-1), {
      id: beforeId,
      ...browserPosition(nativePosition(world, building)),
      logs: 1,
      model: 11,
    })
  }
  assert.equal(building.hp, 0)
  const after = structuredClone({ trees: world.trees, state: building.damageState })
  hit(world, building)
  assert.deepEqual({ trees: world.trees, state: building.damageState }, after)

  world.effects = []
  tick(world, 1 / 12)
  assert.equal(world.buildings.includes(building), false)
  assert.ok(occupied.every(index => (world.land.buildingIds[index] & 1023) !== building.id))
  assert.equal(Array.from(world.land.buildingIds).some(id => (id & 1023) === building.id), false)
})

test('live Tornado leaves protected, rejected, unactivated and retired buildings alone', () => {
  for (const control of ['protected', 'rejected', 'preparation', 'retired']) {
    const { world, building } = setup()
    if (control === 'protected') building.level = 18
    if (control === 'preparation') building.preparation = { work: 0 }
    if (control === 'retired') building.hp = 0
    const before = structuredClone(building)
    const beforeId = world.nextId
    hit(world, building, control === 'rejected' ? 3 : 0)
    assert.deepEqual(building, before, control)
    assert.deepEqual(world.trees, [], control)
    assert.equal(world.nextId, beforeId, control)
    assert.equal(world.randomState, control === 'rejected' ? 0x96100004 : 0, control)
  }
})
