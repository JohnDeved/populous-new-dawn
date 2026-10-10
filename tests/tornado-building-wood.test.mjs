import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, browserPosition, createWorld, nativePosition, tick } from '../app/model.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'
import { damageTornadoBuilding } from '../app/building-runtime.ts'
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

test('supplied Tornado allocation failure keeps work while stage, attribution and debris advance', () => {
  const { world, building } = setup()
  const state = ensureBuildingDamage(building)
  const plan = state.plan
  const before = { hp: building.hp, progress: building.progress, logs: building.logs }
  const beforeId = world.nextId
  const point = nativePosition(world, building)
  let attempts = 0
  // This is supplied component failure, not an actual production allocator path.
  damageTornadoBuilding(world, building, 2, position => {
    attempts++
    assert.deepEqual(position, point)
    assert.equal(state.stage, 3, 'Stage decrements before wood allocation')
    assert.equal(state.state, 1, 'Completed building enters repair state before allocation')
    assert.equal(state.plan, plan)
    assert.equal(plan.remaining, 300)
    assert.equal(world.nextId, beforeId)
    return false
  })
  assert.equal(attempts, 1)
  assert.deepEqual(world.trees, [])
  assert.equal(plan.remaining, 300)
  assert.equal(buildingStage(building), 3)
  assert.deepEqual({ hp: building.hp, progress: building.progress, logs: building.logs }, before)
  assert.equal(state.attacker, 2)
  assert.equal(plan.attacker, 2)
  assert.equal(plan.repairDelay, rules.buildingRepairDelay)
  assert.equal(world.sounds.filter(sound => sound.cue === 18).length, 1)
  assert.ok(world.effects.some(effect => effect.kind === 'debris'))
  assert.ok(world.nextId > beforeId, 'Legitimate debris effects retain their own allocations')
})

test('Tornado byte decrement wraps on supplied failure and neutral attacker preserves attribution', () => {
  const { world, building } = setup()
  const state = ensureBuildingDamage(building)
  state.stage = 0
  state.attacker = 2
  state.plan.attacker = 3
  damageTornadoBuilding(world, building, 255, () => {
    assert.equal(state.stage, 255)
    return false
  })
  assert.equal(buildingStage(building), 255)
  assert.equal(state.plan.remaining, 300)
  assert.equal(state.attacker, 2)
  assert.equal(state.plan.attacker, 3)
  assert.equal(state.plan.repairDelay, rules.buildingRepairDelay)
})

test('Tornado compares final stage with the saved stage before emitting debris', () => {
  const { world, building } = setup()
  const state = ensureBuildingDamage(building)
  // Reach this split through two supplied failures; native pool failure itself
  // remains unimplemented by the production unbounded scenery adapter.
  damageTornadoBuilding(world, building, 0, () => false)
  damageTornadoBuilding(world, building, 0, () => false)
  assert.equal(state.stage, 2)
  assert.equal(state.plan.remaining, 300)
  const before = { id: world.nextId, random: world.randomState, effects: world.effects.length,
    sounds: world.sounds.length }
  damageTornadoBuilding(world, building, 0)
  assert.equal(state.stage, 2)
  assert.equal(state.plan.remaining, 200)
  assert.deepEqual(world.trees, [{ id: before.id, ...browserPosition(nativePosition(world, building)),
    logs: 1, model: 11 }])
  assert.equal(world.nextId, before.id + 1)
  assert.equal(world.randomState, before.random)
  assert.equal(world.effects.length, before.effects)
  assert.equal(world.sounds.length, before.sounds)
})

test('Tornado exhausted work retires without allocation or post-retirement plan bookkeeping', () => {
  for (const remaining of [0, -1, 100]) {
    const { world, building } = setup()
    const state = ensureBuildingDamage(building)
    Object.assign(state.plan, { remaining, repairDelay: 17, attacker: 2 })
    let attempts = 0
    damageTornadoBuilding(world, building, 3, () => {
      attempts++
      return true
    })
    assert.equal(attempts, remaining > 0 ? 1 : 0)
    assert.equal(state.plan.remaining, remaining > 0 ? 0 : remaining)
    assert.equal(state.plan.repairDelay, 17)
    assert.equal(state.plan.attacker, 2)
    assert.equal(state.attacker, 3)
    assert.equal(building.hp, 0)
    assert.equal(building.progress, 0)
    assert.equal(world.sounds.filter(sound => sound.cue === 18).length, 1)
  }
})
