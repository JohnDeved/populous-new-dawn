import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import models from '../app/original-models.json' with { type: 'json' }
import { originalVehicleMesh } from '../app/vehicle-appearance.ts'
import { modelStage } from '../app/model-faces.ts'
import { modelLighting } from '../app/model-lighting.ts'
import { createWorld } from '../app/world-initialization.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, leaveLiveVehicle, stepLiveVehicles } from '../app/live-vehicles.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { addBuilding, tick } from '../app/model.ts'

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

test('original class4 mesh selection distinguishes geometry from tooltip IDs', () => {
  assert.deepEqual([1, 2, 3, 4].map(originalVehicleMesh), [143, 143, 144, 144])
  for (const invalid of [0, 5, 838, 839, NaN, 1.5]) assert.throws(() => originalVehicleMesh(invalid), RangeError)
  assert.equal(models[143].scale, 160)
  assert.equal(models[144].scale, 160)
  assert.equal(models[143].faces.length / 2, 53)
  assert.equal(models[144].faces.length / 2, 62)
  assert.equal(modelStage(models[143], 4).p.length / 9, 81)
  assert.equal(modelStage(models[144], 4).p.length / 9, 108)
})

test('vehicle-only import preserves all68 existing model records', () => {
  const old = Object.fromEntries(Object.entries(models).filter(([id]) => Number(id) !== 143 && Number(id) !== 144))
  assert.equal(Object.keys(old).length, 68)
  assert.equal(hash(old), 'b5bfc6e2d0b837c5c46c880c04c441db76a6fc9a7219dc1eadb015cc3495553d')
  for (const id of [143, 144]) {
    const model = models[id]
    assert.equal(model.p.length / 3, model.uv.length / 2)
    assert.ok(model.p.every(Number.isFinite) && model.uv.every(Number.isFinite))
    assert.ok(model.tiles.every(tile => tile >= 0 && tile < 256))
    assert.ok(model.modes.every(mode => [3, 6, 22].includes(mode)))
    assert.ok(model.normals.every(row => row.length === 4 && row.every(n => n >= 0 && n < 1024)))
    for (let heading = 0; heading < 2048; heading += 256) {
      const mesh = modelStage(model, 4), lighting = modelLighting(model, mesh.p, 4, heading)
      assert.equal(lighting.shades.length, mesh.p.length / 3)
      assert.equal(lighting.anchors.length, mesh.p.length)
      assert.ok(lighting.shades.every(Number.isFinite))
    }
  }
})

test('authored campaign vehicles retain mesh identity across checkpoint reconstruction', () => {
  for (const mission of [5, 10, 22]) {
    const world = createWorld(mission)
    assert.ok(world.vehicles.length > 0)
    const before = world.vehicles.map(v => ({ id: v.id, team: v.team, model: v.model, mesh: originalVehicleMesh(v.model), x: v.x, y: v.y, h: v.h, heading: v.heading }))
    const restored = migrateCheckpoint(structuredClone(world))
    assert.deepEqual(restored.vehicles.map(v => ({ id: v.id, team: v.team, model: v.model, mesh: originalVehicleMesh(v.model), x: v.x, y: v.y, h: v.h, heading: v.heading })), before)
  }
})

test('normal boarding, exit and destruction retain original mesh rather than changing gameplay state', () => {
  const world = createWorld(5), boat = world.vehicles[0]
  boat.active = true
  const unit = world.units.find(u => u.team === 'blue' && u.inside === null)
  Object.assign(unit, browserPosition(boat))
  unit.native = createLivePerson(world, unit)
  world.pathfinding.people.set(unit.id, unit.native)
  const initialMesh = originalVehicleMesh(boat.model)
  assert.ok(boardLiveVehicle(world, unit.native, boat))
  assert.equal(unit.native.vehicle, boat.id)
  assert.equal(boat.passengers[0], unit.id)
  assert.equal(originalVehicleMesh(boat.model), initialMesh)
  const checkpoint = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(checkpoint.vehicles[0].passengers, boat.passengers)
  assert.equal(checkpoint.pathfinding.people.get(unit.id).vehicle, boat.id)
  leaveLiveVehicle(world, boat, unit.native, { x: boat.x, y: boat.y })
  assert.equal(unit.native.vehicle, 0)
  assert.equal(boat.passengerCount, 0)
  assert.equal(originalVehicleMesh(boat.model), initialMesh)
  boat.life = 1
  stepLiveVehicles(world)
  assert.equal(boat.active, false)
  assert.ok(boat.destructionState)
  assert.equal(originalVehicleMesh(boat.model), initialMesh)
})

test('the normal Balloon Hut producer creates the original144 appearance', () => {
  const world = createWorld(13)
  // A completed hut/timer is the controlled fixture; production itself uses the
  // existing handler and creates the actual vehicle and original passenger.
  const hut = addBuilding(world, 'blue', 'balloonHut', { x: 0, z: 0 }, true)
  const brave = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  brave.inside = hut.id
  brave.work = hut.id
  hut.timer = 999
  tick(world, 1 / 12)
  const balloon = world.vehicles.find(v => v.model === 3)
  assert.ok(balloon)
  assert.equal(originalVehicleMesh(balloon.model), 144)
  assert.equal(balloon.passengers[0], brave.id)
  assert.equal(brave.native.vehicle, balloon.id)
  assert.equal(originalVehicleMesh(migrateCheckpoint(structuredClone(world)).vehicles[0].model), 144)
})

test('the shipped vehicle factory consumes original models, with no custom hull/envelope', () => {
  const entities = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
  const factory = entities.slice(entities.indexOf('function makeVehicle('), entities.indexOf('\nexport ', entities.indexOf('function makeVehicle(')))
  assert.ok(factory.includes('originalVehicleMesh(v.model)'))
  assert.ok(factory.includes('nativeModel(resource)'))
  assert.ok(factory.includes('point: { id: v.id }, vehicle: v.id'))
  assert.ok(!/SphereGeometry|PlaneGeometry|\bbox\(/.test(factory))
  assert.ok(entities.includes('scene.locate(g, browserPosition(v), v.h / 45)'))
  assert.ok(entities.includes('scene.orientModel(g, v.heading)'))
})
