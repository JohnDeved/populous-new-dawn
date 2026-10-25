import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { random } from '../app/native-math.ts'
import {
  copyBoatRewardTemplate, grantLinkedBoatReward,
  linkedBoatTemplateShared, processBoatRewardInitialization,
} from '../app/vehicle-reward.ts'

function fixture() {
  const world = createWorld(5), head = world.shrines.find(s => s.kind === 'boat'),
    source = world.vehicles.find(v => v.id === head.rewardVehicle)
  return { world, head, source }
}
function forceGrant(world, head, remaining = 1) {
  // Supplied finite-use boundary, separate from the earned ordinary route.
  Object.assign(head, { remaining, forced: true, reset: false, enabled: true })
  tick(world, 1 / 12)
}

test('complete supplied grant tick owns exactly one fresh initialization visit', () => {
  const { world, head, source } = fixture(), oldId = source.id
  forceGrant(world, head)
  const reward = world.vehicles.find(v => v.id !== oldId)
  assert.ok(reward)
  assert.deepEqual([reward.counter, reward.speed, reward.life, world.vehicleAllocationSeed], [1, 0, 4999, 2])
  assert.deepEqual(reward.rewardInitialization, { state: 1, counter: 1, direction: 0, emptyTemplate: true })
  assert.equal(world.vehicles.includes(source), false)
  assert.equal(world.shrines.includes(head), false)
  assert.deepEqual([head.uses, head.remaining, head.active], [1, 0, false])
  assert.notDeepEqual([reward.x, reward.y], [source.x, source.y])
  const restored = migrateCheckpoint(structuredClone(world))
  for (let i = 0; i < 8; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, world)
    assert.equal(reward.counter, 2 + i)
    assert.equal(reward.life, 4998 - i)
  }
  assert.equal(world.vehicles.length, 1, 'a completed head cannot replay its reward')
})
for (const remaining of [0, -1]) test(`initial remaining${remaining} does not imply final-use deletion`, () => {
  const { world, head, source } = fixture()
  forceGrant(world, head, remaining)
  assert.equal(world.vehicles.includes(source), true)
  assert.equal(source.active, false)
  assert.equal(world.shrines.includes(head), true)
  assert.equal(world.vehicles.filter(v => v.active).length, 1)
})
for (const nested of [false, true]) test(`inactive ${nested ? 'linked' : 'top-level'} head preserves a shared template`, () => {
  const { world, head, source } = fixture(), other = structuredClone(head)
  Object.assign(other, { id: 9000, active: false })
  if (nested) world.shrines.find(s => s !== head).linkedShrine = other
  else world.shrines.push(other)
  assert.equal(linkedBoatTemplateShared(world, head, source.id), true)
  forceGrant(world, head)
  assert.equal(world.vehicles.includes(source), true)
  assert.equal(source.active, false)
  assert.equal(world.shrines.includes(head), false)
  assert.equal(world.vehicles.filter(v => v.active).length, 1)
})
test('supplied null allocation preserves finite-use source retirement without inventing an ID', () => {
  const { world, head, source } = fixture(), before = [world.nextId, world.vehicleAllocationSeed]
  let attempts = 0
  const reward = grantLinkedBoatReward(world, head, true, () => { attempts++; return undefined })
  assert.equal(reward, undefined)
  assert.equal(attempts, 1)
  assert.deepEqual([world.nextId, world.vehicleAllocationSeed], before)
  assert.equal(world.vehicles.includes(source), false)
})
test('template copy preserves allocated identity/position/phase and does not alias seats', () => {
  const { source } = fixture()
  Object.assign(source, { passengers: [123, 0, 456], passengerCount: 2, speed: 7 })
  const fresh = { ...source, id: 999, x: 10, y: 20, h: 30, counter: 255, active: true }
  copyBoatRewardTemplate(fresh, source)
  assert.deepEqual([fresh.id, fresh.x, fresh.y, fresh.h, fresh.counter, fresh.active], [999, 10, 20, 30, 255, true])
  assert.deepEqual(fresh.passengers, source.passengers)
  assert.notEqual(fresh.passengers, source.passengers)
  fresh.passengers[0] = 88
  assert.equal(source.passengers[0], 123)
  assert.equal(fresh.speed, 7)
})
test('occupied template reports its unsupported immediate contract without partial ejection', () => {
  const { world, source } = fixture(), vehicle = { ...source, active: true, counter: 16, passengers: [123], passengerCount: 1 }
  const before = structuredClone(vehicle), rng = world.randomState
  const result = processBoatRewardInitialization(world, vehicle)
  assert.equal(result.emptyTemplate, false)
  assert.deepEqual(vehicle, before)
  assert.equal(world.randomState, rng)
})
test('periodic rest first clears nonzero speed without centering on that same visit', () => {
  const { world, source } = fixture(), vehicle = { ...source, active: true, counter: 32, speed: -1 }
  const before = [vehicle.x, vehicle.y, vehicle.heading, vehicle.h]
  const result = processBoatRewardInitialization(world, vehicle)
  assert.deepEqual([vehicle.x, vehicle.y, vehicle.heading, vehicle.h], before)
  assert.equal(vehicle.speed, 0)
  assert.equal(vehicle.life, 4999)
  assert.equal(result.state, 1)
})
for (const [angle, expected] of [[1785, 1792], [1768, 1779], [0, 2037]])
  test(`periodic rest centers12 and applies bounded heading from${angle}`, () => {
    const { world, source } = fixture(), vehicle = { ...source, active: true, counter: 32, speed: 0, heading: angle * Math.PI / 1024 }
    const before = [vehicle.x, vehicle.y], height = vehicle.h
    processBoatRewardInitialization(world, vehicle)
    assert.notDeepEqual([vehicle.x, vehicle.y], before)
    assert.equal(vehicle.navigationFlags & 0x8000, 0x8000)
    assert.equal(vehicle.h, height)
    assert.equal(Math.round(vehicle.heading * 1024 / Math.PI), expected)
  })
test('common readiness result7 remains explicit initialization metadata', () => {
  const { world, source } = fixture(), vehicle = { ...source, active: true, counter: 1 }
  const index = (vehicle.y >>> 9) * 128 + (vehicle.x >>> 9)
  world.land.flags[index] |= 4
  const result = processBoatRewardInitialization(world, vehicle)
  assert.equal(result.state, 7)
  assert.equal(vehicle.life, 4999)
  assert.equal(vehicle.navigationFlags & 0x10000, 0)
})
for (const direction of [0, 2049]) test(`empty state8 initialization preserves exact RNG ordering for direction${direction}`, () => {
  const { world, source } = fixture(), vehicle = { ...source, active: true, counter: 16 }
  const index = (vehicle.y >>> 9) * 128 + (vehicle.x >>> 9)
  world.land.categories[index] = 0
  world.land.flags[index] = 0
  const rng = { randomState: world.randomState }, expectedLife = (random(rng) & 127) + 160
  const expectedDirection = direction ? direction & 2047 : random(rng) & 1 ? 1 : 2047
  const result = processBoatRewardInitialization(world, vehicle, direction)
  assert.deepEqual([result.state, result.direction, vehicle.life, world.randomState], [8, expectedDirection, expectedLife, rng.randomState])
  assert.equal(vehicle.speed, 0)
  assert.equal(vehicle.navigationFlags & 0x10000, 0x10000)
})
test('empty life expiry initializes existing destruction continuation without RNG', () => {
  const { world, source } = fixture(), vehicle = { ...source, active: true, counter: 1, life: 1 }, rng = world.randomState
  const result = processBoatRewardInitialization(world, vehicle)
  assert.deepEqual([result.state, vehicle.life, vehicle.active, vehicle.destructionState, vehicle.speed], [5, 0, false, 5, 0])
  assert.equal(world.randomState, rng)
})
test('legacy unknown allocation history remains unknown through grant and checkpoint migration', () => {
  const { world, head } = fixture()
  delete world.vehicleAllocationSeed
  for (const vehicle of world.vehicles) delete vehicle.counter
  const old = migrateCheckpoint(structuredClone(world)), oldHead = old.shrines.find(s => s.id === head.id)
  forceGrant(old, oldHead)
  const reward = old.vehicles[0]
  assert.equal(old.vehicleAllocationSeed, undefined)
  assert.equal(reward.counter, undefined)
  assert.equal(reward.rewardInitialization.counter, undefined)
  const restored = migrateCheckpoint(structuredClone(old))
  tick(old, 1 / 12); tick(restored, 1 / 12)
  assert.deepEqual(restored, old)
  assert.equal(restored.vehicles[0].counter, undefined)
})

test('missing linked source still consumes and removes the final-use head through the caller', () => {
  const { world, head } = fixture()
  world.vehicles = []
  forceGrant(world, head)
  assert.deepEqual([head.uses, head.remaining, head.active], [1, 0, false])
  assert.equal(world.shrines.includes(head), false)
  assert.deepEqual(world.vehicles, [])
})
